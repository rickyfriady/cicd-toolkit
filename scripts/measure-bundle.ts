import * as fs from "node:fs";
import * as path from "node:path";
import * as zlib from "node:zlib";

interface AssetInfo {
  name: string;
  relativePath: string;
  sizeBytes: number;
  gzipBytes: number;
}

interface BundleSnapshot {
  timestamp: string;
  totalSizeBytes: number;
  totalGzipBytes: number;
  assets: AssetInfo[];
}

function scan(dir: string, baseDir: string): AssetInfo[] {
  let results: AssetInfo[] = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(scan(fullPath, baseDir));
    } else if (/\.(js|css|mjs|wasm)$/.test(entry.name) && !entry.name.endsWith(".map")) {
      try {
        const content = fs.readFileSync(fullPath);
        const gzipped = zlib.gzipSync(content);
        results.push({
          name: entry.name,
          relativePath: path.relative(baseDir, fullPath),
          sizeBytes: content.length,
          gzipBytes: gzipped.length,
        });
      } catch {
        const stats = fs.statSync(fullPath);
        results.push({
          name: entry.name,
          relativePath: path.relative(baseDir, fullPath),
          sizeBytes: stats.size,
          gzipBytes: Math.round(stats.size * 0.35),
        });
      }
    }
  }
  return results;
}

export function measureBundle(distDir = "dist", outputDir = "reports/bundle"): BundleSnapshot {
  const absoluteDist = path.join(process.cwd(), distDir);
  const absoluteOutput = path.join(process.cwd(), outputDir);

  const assets = scan(absoluteDist, absoluteDist);
  assets.sort((a, b) => b.sizeBytes - a.sizeBytes);

  const totalSizeBytes = assets.reduce((sum, a) => sum + a.sizeBytes, 0);
  const totalGzipBytes = assets.reduce((sum, a) => sum + a.gzipBytes, 0);

  const snapshot: BundleSnapshot = {
    timestamp: new Date().toISOString(),
    totalSizeBytes,
    totalGzipBytes,
    assets,
  };

  fs.mkdirSync(absoluteOutput, { recursive: true });
  fs.writeFileSync(path.join(absoluteOutput, "current-bundle.json"), JSON.stringify(snapshot, null, 2));

  return snapshot;
}

if (process.argv[1]?.endsWith("measure-bundle.ts") || process.argv[1]?.endsWith("measure-bundle.js")) {
  const distArg = process.argv[2] || "dist";
  const snapshot = measureBundle(distArg);
  console.log(`[bundle-measure] Scanned ${snapshot.assets.length} assets (${(snapshot.totalSizeBytes / 1024).toFixed(2)} KB raw, ~${(snapshot.totalGzipBytes / 1024).toFixed(2)} KB gzip).`);
}
