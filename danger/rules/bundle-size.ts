import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { DangerConfig } from "../config";

declare function warn(message: string): void;
declare function markdown(message: string): void;

interface AssetInfo {
  relativePath: string;
  sizeBytes: number;
  gzipBytes: number;
}

function scanAssets(dir: string, baseDir: string): AssetInfo[] {
  let results: AssetInfo[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanAssets(fullPath, baseDir));
    } else if (/\.(js|css|mjs)$/.test(entry.name)) {
      try {
        const content = fs.readFileSync(fullPath);
        const gzipped = zlib.gzipSync(content);
        results.push({
          relativePath: path.relative(baseDir, fullPath),
          sizeBytes: content.length,
          gzipBytes: gzipped.length,
        });
      } catch {
        // Fallback without gzip
        const stats = fs.statSync(fullPath);
        results.push({
          relativePath: path.relative(baseDir, fullPath),
          sizeBytes: stats.size,
          gzipBytes: Math.round(stats.size * 0.35),
        });
      }
    }
  }
  return results;
}

function formatKB(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export async function checkBundleSize(config: DangerConfig): Promise<void> {
  const distDir = path.join(process.cwd(), "dist");
  if (!fs.existsSync(distDir)) {
    return;
  }

  const assets = scanAssets(distDir, distDir);
  if (assets.length === 0) {
    return;
  }

  assets.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const totalBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
  const totalGzipBytes = assets.reduce((sum, a) => sum + a.gzipBytes, 0);
  const totalKB = totalBytes / 1024;

  let report = "### 📦 Production Bundle Size Breakdown\n\n";
  report += `**Total Bundle:** ${formatKB(totalBytes)} (~${formatKB(totalGzipBytes)} gzip) across ${assets.length} production asset(s).\n\n`;
  report += "| Asset File | Minified Size | Gzip Size | Status |\n";
  report += "| :--- | :--- | :--- | :--- |\n";

  const oversizedAssets: AssetInfo[] = [];

  for (const asset of assets) {
    const assetKB = asset.sizeBytes / 1024;
    const isOver = assetKB > config.maxAssetSizeKB;
    if (isOver) {
      oversizedAssets.push(asset);
    }
    const status = isOver ? "🔴 Exceeds Budget" : "🟢 Optimal";
    report += `| \`${asset.relativePath}\` | ${formatKB(asset.sizeBytes)} | ~${formatKB(asset.gzipBytes)} | ${status} |\n`;
  }

  markdown(report);

  if (oversizedAssets.length > 0) {
    warn(
      `⚠️ **Oversized Asset Alert:** ${oversizedAssets.length} file(s) exceed the single asset budget of **${config.maxAssetSizeKB} KB**:\n` +
      oversizedAssets.map((a) => `- \`${a.relativePath}\` (${formatKB(a.sizeBytes)})`).join("\n") +
      `\n*Consider dynamic imports or code-splitting to improve initial page load performance.*`
    );
  }

  if (totalKB > config.maxTotalBundleKB) {
    warn(
      `⚠️ **Total Bundle Budget Exceeded:** Total production bundle size is **${formatKB(totalBytes)}**, exceeding the **${config.maxTotalBundleKB} KB** budget.`
    );
  }
}
