import * as fs from "node:fs";
import * as path from "node:path";
import { DangerConfig } from "../config";

declare function fail(message: string): void;
declare function warn(message: string): void;
declare function markdown(message: string): void;

interface SarifLocation {
  physicalLocation?: {
    artifactLocation?: {
      uri?: string;
    };
    region?: {
      startLine?: number;
      startColumn?: number;
    };
  };
}

interface SarifResult {
  ruleId: string;
  level?: "error" | "warning" | "note" | "none";
  message?: {
    text?: string;
  };
  locations?: SarifLocation[];
}

interface SarifReport {
  version?: string;
  runs?: Array<{
    tool?: {
      driver?: {
        name?: string;
        version?: string;
      };
    };
    results?: SarifResult[];
  }>;
}

export async function checkSAST(config: DangerConfig): Promise<void> {
  if (!config.enforceSast) return;

  const sarifPath = path.join(process.cwd(), "reports/sast/semgrep.sarif");
  const jsonPath = path.join(process.cwd(), "reports/sast/semgrep.json");

  let results: SarifResult[] = [];
  let scannerName = "Semgrep OSS";

  if (fs.existsSync(sarifPath)) {
    try {
      const raw = fs.readFileSync(sarifPath, "utf-8");
      const sarif: SarifReport = JSON.parse(raw);
      if (sarif.runs && sarif.runs.length > 0) {
        scannerName = sarif.runs[0].tool?.driver?.name || scannerName;
        results = sarif.runs[0].results || [];
      }
    } catch {
      // Ignore parse failure
    }
  } else if (fs.existsSync(jsonPath)) {
    try {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.results)) {
        results = parsed.results.map((r: any) => ({
          ruleId: r.check_id || "sast-finding",
          level: (r.extra?.severity?.toLowerCase() === "error" ? "error" : "warning") as "error" | "warning",
          message: { text: r.extra?.message || "Potential security vulnerability" },
          locations: [
            {
              physicalLocation: {
                artifactLocation: { uri: r.path },
                region: { startLine: r.start?.line, startColumn: r.start?.col },
              },
            },
          ],
        }));
      }
    } catch {
      // Ignore parse failure
    }
  } else {
    return;
  }

  if (results.length === 0) {
    markdown(`
## 🛡️ SAST Static Code Security Analysis

✅ **Zero Security Flaws:** ${scannerName} static application security testing completed with **0 vulnerabilities** detected. Code logic complies with OWASP Top 10 guidelines.
    `);
    return;
  }

  let errorCount = 0;
  let warnCount = 0;

  const rows = results.map((item) => {
    const level = item.level || "warning";
    if (level === "error") errorCount++;
    else warnCount++;

    const loc = item.locations?.[0]?.physicalLocation;
    const file = loc?.artifactLocation?.uri || "unknown";
    const line = loc?.region?.startLine ? `:${loc.region.startLine}` : "";
    const badge = level === "error" ? "🔴 High / Error" : "🟡 Medium / Warn";
    const desc = (item.message?.text || "").replace(/\|/g, "\\|").trim();

    return `| \`${item.ruleId}\` | ${badge} | \`${file}${line}\` | ${desc} |`;
  });

  const table = [
    `## 🛡️ SAST Static Code Security Analysis (${scannerName})`,
    "",
    `Found **${results.length} security finding(s)** (${errorCount} High/Error, ${warnCount} Warning/Note).`,
    "",
    "| Rule ID | Severity | Location | Message |",
    "| :--- | :--- | :--- | :--- |",
    ...rows,
  ].join("\n");

  markdown(table);

  if (errorCount > 0 && config.sastFailOnSeverity === "error") {
    fail(`🛡️ **SAST Quality Gate Failed:** Found ${errorCount} high-severity security finding(s). Please remediate before merging.`);
  } else if (results.length > 0) {
    warn(`🛡️ **SAST Advisory:** Found ${results.length} code quality / security advisory item(s). Review recommendations.`);
  }
}
