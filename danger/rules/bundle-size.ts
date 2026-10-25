import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";
import { DangerConfig } from "../config";

declare function warn(message: string): void;
declare function fail(message: string): void;
declare function markdown(message: string): void;

export interface AssetInfo {
  name: string;
  relativePath: string;
  sizeBytes: number;
  gzipBytes: number;
}

export interface BundleSnapshot {
  timestamp: string;
  totalSizeBytes: number;
  totalGzipBytes: number;
  assets: AssetInfo[];
}

export function scanAssets(dir: string, baseDir: string): AssetInfo[] {
  let results: AssetInfo[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scanAssets(fullPath, baseDir));
    } else if (/\.(js|css|mjs|wasm)$/.test(entry.name) && !entry.name.endsWith(".map")) {
      try {
        const content = fs.readFileSync(fullPath);
        const gzipped = zlib.gzipSync(content);
        const rel = path.relative(baseDir, fullPath);
        results.push({
          name: entry.name,
          relativePath: rel,
          sizeBytes: content.length,
          gzipBytes: gzipped.length,
        });
      } catch {
        const stats = fs.statSync(fullPath);
        const rel = path.relative(baseDir, fullPath);
        results.push({
          name: entry.name,
          relativePath: rel,
          sizeBytes: stats.size,
          gzipBytes: Math.round(stats.size * 0.35),
        });
      }
    }
  }
  return results;
}

export function formatBytes(bytes: number): string {
  if (Math.abs(bytes) < 1024) {
    return `${bytes} B`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

export function formatDelta(current: number, base: number): string {
  const diff = current - base;
  if (diff === 0) return "— (0%)";
  const sign = diff > 0 ? "+" : "";
  const pct = base > 0 ? ` (${sign}${((diff / base) * 100).toFixed(1)}%)` : "";
  const icon = diff > 0 ? "🔺 " : "🔽 ";
  return `${icon}${sign}${formatBytes(diff)}${pct}`;
}

export async function checkBundleSize(config: DangerConfig): Promise<void> {
  const distDir = path.join(process.cwd(), "dist");
  const reportsBundleDir = path.join(process.cwd(), "reports/bundle");

  if (!fs.existsSync(distDir)) {
    // If dist doesn't exist, check if pre-generated report exists
    const currentReportPath = path.join(reportsBundleDir, "current-bundle.json");
    if (!fs.existsSync(currentReportPath)) {
      return;
    }
  }

  // 1. Scan current assets
  const currentAssets = fs.existsSync(distDir) ? scanAssets(distDir, distDir) : [];
  if (currentAssets.length === 0) {
    return;
  }

  currentAssets.sort((a, b) => b.sizeBytes - a.sizeBytes);
  const currentTotalBytes = currentAssets.reduce((sum, a) => sum + a.sizeBytes, 0);
  const currentTotalGzip = currentAssets.reduce((sum, a) => sum + a.gzipBytes, 0);

  // Save current bundle snapshot for subsequent runs or CI artifact storage
  fs.mkdirSync(reportsBundleDir, { recursive: true });
  const snapshot: BundleSnapshot = {
    timestamp: new Date().toISOString(),
    totalSizeBytes: currentTotalBytes,
    totalGzipBytes: currentTotalGzip,
    assets: currentAssets,
  };
  fs.writeFileSync(path.join(reportsBundleDir, "current-bundle.json"), JSON.stringify(snapshot, null, 2));

  // 2. Read base branch snapshot if available
  let baseSnapshot: BundleSnapshot | null = null;
  const baseReportPath = path.join(reportsBundleDir, "base-bundle.json");
  if (fs.existsSync(baseReportPath)) {
    try {
      const raw = fs.readFileSync(baseReportPath, "utf-8");
      baseSnapshot = JSON.parse(raw) as BundleSnapshot;
    } catch {
      baseSnapshot = null;
    }
  }

  // 3. Build Comparative Markdown Report
  let report = "## 📦 Automated Bundle Size Diff & Performance Budgets\n\n";

  if (baseSnapshot && baseSnapshot.totalSizeBytes > 0) {
    const totalDelta = currentTotalBytes - baseSnapshot.totalSizeBytes;
    const totalGzipDelta = currentTotalGzip - baseSnapshot.totalGzipBytes;
    const totalDeltaText = formatDelta(currentTotalBytes, baseSnapshot.totalSizeBytes);

    report += `**Total Bundle:** ${formatBytes(currentTotalBytes)} (~${formatBytes(currentTotalGzip)} gzip) | `;
    report += `**Diff vs Base:** ${totalDeltaText}\n\n`;

    report += "| Asset File | Current Size | Base Size | Diff (Δ) | Gzip (Est.) | Status |\n";
    report += "| :--- | ---: | ---: | ---: | ---: | :--- |\n";

    const baseMap = new Map<string, AssetInfo>();
    baseSnapshot.assets.forEach((a) => {
      // Normalize hashed filenames (e.g. index-abc123.js -> index.js)
      const normalized = a.relativePath.replace(/-[a-zA-Z0-9_-]{8,}\./, ".");
      baseMap.set(normalized, a);
    });

    const oversizedAssets: AssetInfo[] = [];

    for (const asset of currentAssets) {
      const normalized = asset.relativePath.replace(/-[a-zA-Z0-9_-]{8,}\./, ".");
      const baseAsset = baseMap.get(normalized);
      const isOverBudget = asset.sizeBytes / 1024 > config.maxAssetSizeKB;
      if (isOverBudget) oversizedAssets.push(asset);

      let statusBadge = "🟢 Optimal";
      let baseSizeText = "—";
      let deltaText = "✨ New";

      if (baseAsset) {
        baseSizeText = formatBytes(baseAsset.sizeBytes);
        deltaText = formatDelta(asset.sizeBytes, baseAsset.sizeBytes);
        const diff = asset.sizeBytes - baseAsset.sizeBytes;
        if (diff > 0) {
          statusBadge = isOverBudget ? "🔴 Exceeds Budget" : "⚠️ Increased";
        } else if (diff < 0) {
          statusBadge = "🟢 Decreased";
        } else {
          statusBadge = "⚪ Unchanged";
        }
      } else if (isOverBudget) {
        statusBadge = "🔴 Exceeds Budget";
      }

      report += `| \`${asset.relativePath}\` | ${formatBytes(asset.sizeBytes)} | ${baseSizeText} | ${deltaText} | ~${formatBytes(asset.gzipBytes)} | ${statusBadge} |\n`;
    }

    report += "\n";
    markdown(report);

    // Alerts
    if (oversizedAssets.length > 0) {
      warn(
        `⚠️ **Oversized Asset Alert:** ${oversizedAssets.length} file(s) exceed single asset budget of **${config.maxAssetSizeKB} KB**:\n` +
        oversizedAssets.map((a) => `- \`${a.relativePath}\` (${formatBytes(a.sizeBytes)})`).join("\n")
      );
    }

    const totalDiffKB = (currentTotalBytes - baseSnapshot.totalSizeBytes) / 1024;
    if (totalDiffKB > config.maxBundleDiffIncreaseKB) {
      warn(
        `⚠️ **Bundle Size Inflation:** Total bundle grew by **+${totalDiffKB.toFixed(2)} KB**, exceeding the allowed increase budget of **${config.maxBundleDiffIncreaseKB} KB**.`
      );
    }
  } else {
    // Baseline Snapshot Mode
    report += `**Total Bundle:** ${formatBytes(currentTotalBytes)} (~${formatBytes(currentTotalGzip)} gzip) across ${currentAssets.length} production asset(s).\n`;
    report += `*ℹ️ Baseline snapshot recorded. Future PRs will display side-by-side delta comparisons against this base.* \n\n`;

    report += "| Asset File | Minified Size | Gzip Size (Est.) | Status |\n";
    report += "| :--- | ---: | ---: | :--- |\n";

    const oversizedAssets: AssetInfo[] = [];
    for (const asset of currentAssets) {
      const isOverBudget = asset.sizeBytes / 1024 > config.maxAssetSizeKB;
      if (isOverBudget) oversizedAssets.push(asset);
      const statusBadge = isOverBudget ? "🔴 Exceeds Budget" : "🟢 Optimal";
      report += `| \`${asset.relativePath}\` | ${formatBytes(asset.sizeBytes)} | ~${formatBytes(asset.gzipBytes)} | ${statusBadge} |\n`;
    }

    report += "\n";
    markdown(report);

    if (oversizedAssets.length > 0) {
      warn(
        `⚠️ **Oversized Asset Alert:** ${oversizedAssets.length} file(s) exceed budget of **${config.maxAssetSizeKB} KB**:\n` +
        oversizedAssets.map((a) => `- \`${a.relativePath}\` (${formatBytes(a.sizeBytes)})`).join("\n")
      );
    }
  }

  if (currentTotalBytes / 1024 > config.maxTotalBundleKB) {
    warn(
      `⚠️ **Total Bundle Budget Exceeded:** Total production bundle size is **${formatBytes(currentTotalBytes)}**, exceeding the **${config.maxTotalBundleKB} KB** budget.`
    );
  }
}
