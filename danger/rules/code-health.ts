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
  pos?: number;
}

interface KnipFileReport {
  file: string;
  dependencies?: KnipIssue[];
  devDependencies?: KnipIssue[];
  optionalPeerDependencies?: KnipIssue[];
  unlisted?: KnipIssue[];
  unresolved?: KnipIssue[];
  exports?: KnipIssue[];
  types?: KnipIssue[];
  enumMembers?: KnipIssue[];
  namespaceMembers?: KnipIssue[];
  classMembers?: KnipIssue[];
  duplicates?: KnipIssue[][];
  files?: KnipIssue[];
  binaries?: KnipIssue[];
  catalog?: KnipIssue[];
}

interface KnipResult {
  issues: KnipFileReport[];
}

interface KnipSectionConfig {
  key: keyof Omit<KnipFileReport, "file">;
  title: string;
  severity: "fail" | "warn";
  failMessage?: string;
}

const KNIP_SECTIONS: KnipSectionConfig[] = [
  {
    key: "dependencies",
    title: "Unused Dependencies",
    severity: "fail",
    failMessage: "unused package(s) in `dependencies` — remove them to reduce bundle size",
  },
  {
    key: "devDependencies",
    title: "Unused Dev Dependencies",
    severity: "fail",
    failMessage: "unused package(s) in `devDependencies` — remove them to keep installs lean",
  },
  {
    key: "unlisted",
    title: "Unlisted Dependencies",
    severity: "fail",
    failMessage: "unlisted package(s) — imported in code but missing from `package.json`",
  },
  {
    key: "unresolved",
    title: "Unresolved Imports",
    severity: "fail",
    failMessage: "unresolved import(s) — these specifiers cannot be resolved and will break at runtime",
  },
  { key: "optionalPeerDependencies", title: "Unused Optional Peer Dependencies", severity: "warn" },
  { key: "binaries", title: "Unused Binaries", severity: "warn" },
  { key: "exports", title: "Unused Exports", severity: "warn" },
  { key: "types", title: "Unused Exported Types", severity: "warn" },
  { key: "enumMembers", title: "Unused Enum Members", severity: "warn" },
  { key: "namespaceMembers", title: "Unused Namespace Members", severity: "warn" },
  { key: "classMembers", title: "Unused Class Members", severity: "warn" },
  { key: "duplicates", title: "Duplicate Exports", severity: "warn" },
  { key: "files", title: "Unused Files", severity: "warn" },
];

interface KnipFinding {
  name: string;
  location: string;
}

const formatLocation = (file: string, issue: KnipIssue): string =>
  issue.line != null ? `${file}:${issue.line}:${issue.col ?? 0}` : file;

const collectKnipFindings = (issues: KnipFileReport[], key: KnipSectionConfig["key"]): KnipFinding[] => {
  const findings: KnipFinding[] = [];

  issues.forEach((fileReport) => {
    const entries = fileReport[key];
    if (!Array.isArray(entries) || entries.length === 0) return;

    if (key === "duplicates") {
      (entries as KnipIssue[][]).forEach((group) => {
        if (!Array.isArray(group) || group.length === 0) return;
        const names = group.map((issue) => issue.name).join("` / `");
        const located = group.find((issue) => issue.line != null) ?? group[0];
        findings.push({ name: names, location: formatLocation(fileReport.file, located) });
      });
      return;
    }

    if (key === "files") {
      (entries as KnipIssue[]).forEach((issue) => {
        findings.push({ name: issue.name || fileReport.file, location: fileReport.file });
      });
      return;
    }

    (entries as KnipIssue[]).forEach((issue) => {
      findings.push({ name: issue.name, location: formatLocation(fileReport.file, issue) });
    });
  });

  return findings;
};

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
    let depsModified = true;
    try {
      const diff = await danger.git.diffForFile("package.json");
      if (diff && diff.diff) {
        const depPattern = /"(\w*dependencies|overrides|resolutions|packageManager)"/i;
        depsModified = depPattern.test(diff.diff);
      }
    } catch {
      depsModified = true;
    }

    if (depsModified) {
      fail("🔒 **Lockfile Out of Sync:** Dependencies in `package.json` were modified but no lockfile was committed. Please update lockfile!");
    }
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

  // 4. Knip Enterprise Code Health Report
  const knipPath = path.join(process.cwd(), "reports/knip/knip-result.json");
  if (fs.existsSync(knipPath)) {
    try {
      const knipRaw = fs.readFileSync(knipPath, "utf-8").trim();
      if (knipRaw) {
        const knipResult = JSON.parse(knipRaw) as KnipResult;
        const issues = knipResult.issues || [];

        const sections = KNIP_SECTIONS.map((secConfig) => ({
          config: secConfig,
          findings: collectKnipFindings(issues, secConfig.key),
        })).filter((section) => section.findings.length > 0);

        if (sections.length === 0) {
          markdown("✅ **Knip:** No unused code, dependencies, or unresolved imports detected.");
        } else {
          const total = sections.reduce((sum, section) => sum + section.findings.length, 0);

          let report = "## 🗑️ Knip Code Health Report\n\n";
          report += "### Summary\n\n";
          report += "| Issue Type | Severity | Count |\n";
          report += "| :--- | :--- | ---: |\n";
          sections.forEach(({ config: sec, findings }) => {
            const badge = sec.severity === "fail" ? "🚨 fail" : "⚠️ warn";
            report += `| ${sec.title} | ${badge} | ${findings.length} |\n`;
          });
          report += `| **Total** | | **${total}** |\n\n`;

          sections.forEach(({ config: sec, findings }) => {
            if (sec.severity === "fail" && sec.failMessage) {
              fail(`🗑️ **Knip:** Found **${findings.length}** ${sec.failMessage}.`);
            } else if (sec.severity === "warn") {
              warn(`🗑️ **Knip:** Found **${findings.length}** ${sec.title.toLowerCase()}.`);
            }

            report += `### ${sec.title}\n\n`;
            report += "| Name | Location |\n";
            report += "| :--- | :--- |\n";
            findings.forEach((finding) => {
              report += `| \`${finding.name}\` | \`${finding.location}\` |\n`;
            });
            report += "\n";
          });

          markdown(report);
        }
      }
    } catch (e) {
      warn(`Failed to parse Knip report: ${(e as Error).message}`);
    }
  }
}
