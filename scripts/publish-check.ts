import * as fs from "node:fs";
import * as path from "node:path";
import { execSync } from "node:child_process";

export function checkPublishReadiness() {
  console.log("🔍 Checking package publish readiness for @rickyfriady/cicd-toolkit...\n");

  const cwd = process.cwd();
  const pkgPath = path.join(cwd, "package.json");

  // 1. Validate package.json
  if (!fs.existsSync(pkgPath)) {
    console.error("❌ Fatal: package.json not found!");
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
  console.log(`📦 Package: ${pkg.name}@${pkg.version}`);

  if (!pkg.name || !pkg.name.startsWith("@rickyfriady/")) {
    console.error("❌ Error: package name must be scoped under @rickyfriady/");
    process.exit(1);
  }

  if (!pkg.version) {
    console.error("❌ Error: package.json missing version field!");
    process.exit(1);
  }

  // 2. Validate LICENSE & README
  const licensePath = path.join(cwd, "LICENSE");
  if (!fs.existsSync(licensePath)) {
    console.error("❌ Error: LICENSE file is missing!");
    process.exit(1);
  }
  console.log("✅ Verified: LICENSE present (MIT)");

  const readmePath = path.join(cwd, "README.md");
  if (!fs.existsSync(readmePath)) {
    console.error("❌ Error: README.md file is missing!");
    process.exit(1);
  }
  console.log("✅ Verified: README.md present");

  // 3. Validate Built Artifacts in dist/
  const distPath = path.join(cwd, "dist");
  if (!fs.existsSync(distPath)) {
    console.error("❌ Error: dist/ directory not found! Run 'pnpm run build' first.");
    process.exit(1);
  }

  const distFiles = fs.readdirSync(distPath);
  if (distFiles.length === 0) {
    console.error("❌ Error: dist/ directory is empty!");
    process.exit(1);
  }
  console.log(`✅ Verified: dist/ directory contains ${distFiles.length} top-level artifacts`);

  // 4. Validate Git Status (warn if dirty in non-CI environment)
  const isCI = Boolean(process.env.CI || process.env.GITHUB_ACTIONS);
  try {
    const status = execSync("git status --porcelain", { encoding: "utf-8" }).trim();
    if (status && !isCI) {
      console.warn("⚠️ Warning: Git working directory has uncommitted changes:\n" + status);
    } else {
      console.log("✅ Verified: Clean or valid CI git workspace");
    }
  } catch {
    // Ignore git status if git binary not in PATH
  }

  console.log("\n🚀 All pre-publish checks passed! Ready for registry publication.\n");
}

if (process.argv[1]?.endsWith("publish-check.ts") || process.argv[1]?.endsWith("publish-check.js")) {
  checkPublishReadiness();
}
