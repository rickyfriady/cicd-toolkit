import { DangerConfig } from "../config";
import * as fs from "node:fs";
import * as path from "node:path";

declare const danger: any;
declare function fail(message: string): void;
declare function warn(message: string): void;
declare function markdown(message: string): void;

interface KnipIssue {
  name: string;
  line?: number;
  col?: number;
}

interface KnipFileReport {
  file: string;
  dependencies?: KnipIssue[];
  devDependencies?: KnipIssue[];
  unlisted?: KnipIssue[];
  unresolved?: KnipIssue[];
  exports?: KnipIssue[];
  types?: KnipIssue[];
  files?: KnipIssue[];
}

interface KnipResult {
  issues: KnipFileReport[];
}

async function getAddedLines(file: string): Promise<string[]> {
  try {
    const diff = await danger.git.diffForFile(file);
    if (!diff || !diff.added) return [];
    return diff.added
      .split("\n")
      .map((line: string) => line.replace(/^\+/, "").trim())
      .filter((line: string) => line.length > 0 && !line.startsWith("//") && !line.startsWith("*"));
  } catch {
    return [];
  }
}

export async function checkCodeHealth(config: DangerConfig): Promise<void> {
  const changedFiles = [...danger.git.modified_files, ...danger.git.created_files];

  // 1. Lockfile Sync Check
  const packageChanged = changedFiles.includes("package.json");
  const lockfileChanged = changedFiles.some((f) =>
    ["pnpm-lock.yaml", "bun.lockb", "package-lock.json", "yarn.lock"].includes(f)
  );

  if (packageChanged && !lockfileChanged) {
    fail("🔒 **Lockfile Out of Sync:** `package.json` was modified but no lockfile was committed. Please update lockfile!");
  }

  // 2. Focused & Skipped Tests Check
  const FOCUSED_PATTERN = /\b(?:it|describe|test)\.only\s*\(|\bf(?:it|describe)\s*\(/;
  const SKIPPED_PATTERN = /\b(?:it|describe|test)\.skip\s*\(|\bx(?:it|describe)\s*\(/;

  const testFiles = changedFiles.filter((f) => /\.(spec|test)\.(ts|js|vue|jsx|tsx)$/.test(f));
  const focusedHits: string[] = [];
  const skippedHits: string[] = [];

  for (const file of testFiles) {
    const lines = await getAddedLines(file);
    for (const line of lines) {
      if (FOCUSED_PATTERN.test(line)) focusedHits.push(file);
      if (SKIPPED_PATTERN.test(line)) skippedHits.push(file);
    }
  }

  if (focusedHits.length > 0) {
    fail(
      `🎯 **Focused tests detected!** \`.only\` disables other test suites and must NOT be merged:\n` +
      Array.from(new Set(focusedHits)).map((f) => `- \`${f}\``).join("\n")
    );
  }

  if (skippedHits.length > 0) {
    warn(
      `⏭️ **Skipped tests added:** Please ensure skipped tests are intentional:\n` +
      Array.from(new Set(skippedHits)).map((f) => `- \`${f}\``).join("\n")
    );
  }

  // 3. Console Statements & Static Inline Styles
  const CONSOLE_PATTERN = /\bconsole\.(log|debug|info|warn|error)\s*\(/;
  const STATIC_STYLE_PATTERN = /(?:^|\s)style=["'][^"']+["']/;

  const sourceFiles = changedFiles.filter(
    (f) =>
      (f.startsWith("src/") || f.startsWith("app/")) &&
      /\.(ts|js|vue|jsx|tsx)$/.test(f) &&
      !f.includes(".test.") &&
      !f.includes(".spec.")
  );

  const consoleHits: string[] = [];
  const styleHits: string[] = [];

  for (const file of sourceFiles) {
    const lines = await getAddedLines(file);
    for (const line of lines) {
      if (config.blockConsole && CONSOLE_PATTERN.test(line)) {
        consoleHits.push(`- \`${file}\`: \`${line.slice(0, 100)}\``);
      }
      if (config.blockInlineStyles && STATIC_STYLE_PATTERN.test(line)) {
        styleHits.push(`- \`${file}\`: \`${line.slice(0, 100)}\``);
      }
    }
  }

  if (consoleHits.length > 0) {
    fail(
      `🪵 **Raw console statement(s) detected:** Production bundles should not contain console calls:\n` +
      consoleHits.slice(0, 10).join("\n")
    );
  }

  if (styleHits.length > 0) {
    fail(
      `🎨 **Static inline style(s) detected:** Use Tailwind CSS utility classes or design tokens instead:\n` +
      styleHits.slice(0, 10).join("\n")
    );
  }

  // 4. Knip Code Health Analysis (reports/knip/knip-result.json)
  const knipPath = path.join(process.cwd(), "reports/knip/knip-result.json");
  if (fs.existsSync(knipPath)) {
    try {
      const knipRaw = fs.readFileSync(knipPath, "utf-8").trim();
      if (knipRaw) {
        const knipResult = JSON.parse(knipRaw) as KnipResult;
        const issues = knipResult.issues || [];
        const unusedDeps: string[] = [];
        const unresolvedImports: string[] = [];

        issues.forEach((report) => {
          report.dependencies?.forEach((d) => unusedDeps.push(`\`${d.name}\` (${report.file})`));
          report.unresolved?.forEach((u) => unresolvedImports.push(`\`${u.name}\` (${report.file})`));
        });

        if (unresolvedImports.length > 0) {
          fail(`🛑 **Unresolved Imports:** Found ${unresolvedImports.length} broken imports:\n` + unresolvedImports.join("\n"));
        }

        if (unusedDeps.length > 0) {
          fail(`🗑️ **Unused Dependencies:** Found ${unusedDeps.length} unused packages:\n` + unusedDeps.join("\n"));
        } else {
          markdown("✅ **Knip:** No dead dependencies or broken imports detected.");
        }
      }
    } catch (e) {
      warn(`Failed to parse Knip report: ${(e as Error).message}`);
    }
  }
}
