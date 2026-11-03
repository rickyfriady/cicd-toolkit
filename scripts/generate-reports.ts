import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const KNIP_REPORT_PATH = "reports/knip/knip-result.json";
const OUTDATED_REPORT_PATH = "reports/dependencies/outdated.json";
const AUDIT_REPORT_PATH = "reports/dependencies/audit.json";

interface RunOptions {
  emptyOutput?: string;
}

const OPENING = new Set(["{", "["]);
const CLOSING = new Set(["}", "]"]);

function findDocumentEnd(output: string, start: number): number {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < output.length; i++) {
    const char = output[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === "\\") escaped = true;
      else if (char === '"') inString = false;
    } else if (char === '"') {
      inString = true;
    } else if (OPENING.has(char)) {
      depth++;
    } else if (CLOSING.has(char)) {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

export function extractJson(output: string): string | null {
  const start = output.search(/[{[]/);
  if (start === -1) return null;
  const end = findDocumentEnd(output, start);
  if (end === -1) return null;
  const candidate = output.slice(start, end);
  try {
    JSON.parse(candidate);
    return candidate;
  } catch {
    return null;
  }
}

function runJson(command: string, args: string[], { emptyOutput }: RunOptions = {}): string {
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
    shell: process.platform === "win32",
  });

  const invocation = [command, ...args].join(" ");
  if (result.error) throw new Error(`Failed to run \`${invocation}\`: ${result.error.message}`);
  const stdout = result.stdout?.trim() ?? "";

  if (!stdout) {
    if (emptyOutput !== undefined) return emptyOutput;
    throw new Error(`\`${invocation}\` exited with code ${result.status} without output`);
  }

  const json = extractJson(stdout);
  if (!json) {
    if (emptyOutput !== undefined) return emptyOutput;
    throw new Error(`\`${invocation}\` produced invalid JSON:\n${stdout}`);
  }
  return json;
}

function writeReport(path: string, content: string): void {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function detectPackageManager(): "bun" | "pnpm" {
  return process.env.PACKAGE_MANAGER === "bun" ? "bun" : "pnpm";
}

function generateKnipReport(full: boolean): void {
  const pm = detectPackageManager();
  const args = ["knip", "--reporter", "json"];
  if (full) args.push("--include-entry-exports");
  writeReport(KNIP_REPORT_PATH, runJson(pm === "bun" ? "bunx" : "pnpm", args, { emptyOutput: '{"issues":[]}' }));
}

function generateOutdatedReport(): void {
  const pm = detectPackageManager();
  if (pm === "bun") {
    writeReport(OUTDATED_REPORT_PATH, "{}");
    return;
  }
  writeReport(OUTDATED_REPORT_PATH, runJson("pnpm", ["outdated", "--json"], { emptyOutput: "{}" }));
}

function generateAuditReport(): void {
  const pm = detectPackageManager();
  const args = pm === "bun" ? ["pm", "audit", "--json"] : ["audit", "--json"];
  writeReport(AUDIT_REPORT_PATH, runJson(pm, args, { emptyOutput: "{}" }));
}

const TASKS = [
  ["--report", () => generateKnipReport(false)],
  ["--report:full", () => generateKnipReport(true)],
  ["--outdated", generateOutdatedReport],
  ["--audit", generateAuditReport],
] as const;

function main(): void {
  const flags = new Set(process.argv.slice(2));
  const selected = TASKS.filter(([flag]) => flags.has(flag));
  if (selected.length === 0) process.exit(1);

  for (const [flag, run] of selected) {
    try {
      run();
    } catch (error) {
      console.warn(`[WARN] ${flag}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
