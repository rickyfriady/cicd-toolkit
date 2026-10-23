import * as fs from "node:fs";
import * as path from "node:path";

declare const danger: any;
declare function fail(message: string): void;
declare function warn(message: string): void;
declare function markdown(message: string): void;

interface AuditAdvisory {
  id: number;
  module_name: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  title: string;
  url: string;
  vulnerable_versions: string;
  patched_versions?: string;
  recommendation?: string;
}

interface AuditReport {
  advisories?: { [id: string]: AuditAdvisory };
  metadata?: {
    vulnerabilities?: { [severity: string]: number };
  };
}

export async function checkSecurity(): Promise<void> {
  const SENSITIVE_PATTERNS = [/\.pem$/, /\.key$/, /\.p12$/, /\.pfx$/, /\.crt$/, /^\.env(\..+)?$/];
  const CRITICAL_FILES = [".npmrc", ".pnpmrc", "Dockerfile", ".github/workflows"];

  const changedFiles = [...danger.git.created_files, ...danger.git.modified_files];

  // 1. Detect committed secret / sensitive files
  const sensitiveDetected = changedFiles.filter((file) => {
    const base = path.basename(file);
    if (/^id_rsa/.test(base)) return true;
    return SENSITIVE_PATTERNS.some((pattern) => pattern.test(base));
  });

  if (sensitiveDetected.length > 0) {
    fail(
      `🔐 **CRITICAL SECURITY ALERT: Sensitive files detected!**\n\n` +
      `The following files should NEVER be committed to version control:\n` +
      sensitiveDetected.map((f) => `- \`${f}\``).join("\n") +
      `\n\n*Please remove them immediately and rotate any exposed keys or secrets.*`
    );
  }

  // 2. Alert on critical infra changes
  const infraTouched = changedFiles.filter((file) =>
    CRITICAL_FILES.some((infra) => file.startsWith(infra) || file === infra)
  );

  if (infraTouched.length > 0) {
    warn(
      `⚙️ **Critical Infrastructure Modified:** The following core configuration files were changed. Reviewers please verify carefully:\n` +
      infraTouched.map((f) => `- \`${f}\``).join("\n")
    );
  }

  // 3. Analyze Dependency Security Audit (reports/dependencies/audit.json)
  const auditPath = path.join(process.cwd(), "reports/dependencies/audit.json");
  if (!fs.existsSync(auditPath)) {
    return;
  }

  try {
    const content = fs.readFileSync(auditPath, "utf-8").trim();
    if (!content) return;
    const auditReport = JSON.parse(content) as AuditReport;
    const advisories = Object.values(auditReport.advisories || {});
    const counts = auditReport.metadata?.vulnerabilities;

    if (advisories.length === 0) {
      if (counts && Object.values(counts).some((n) => n > 0)) {
        warn("🛡️ **Audit:** Vulnerability count reported but details missing. Check CI audit log.");
      } else {
        markdown("🛡️ **Audit:** No known security vulnerabilities found in dependencies.");
      }
      return;
    }

    const criticalCount = counts?.critical ?? advisories.filter((a) => a.severity === "critical").length;
    const highCount = counts?.high ?? advisories.filter((a) => a.severity === "high").length;
    const moderateCount = counts?.moderate ?? advisories.filter((a) => a.severity === "moderate").length;
    const lowCount = counts?.low ?? advisories.filter((a) => a.severity === "low").length;

    if (criticalCount + highCount > 0) {
      fail(
        `🛡️ **Security Vulnerability Blocker:** Found **${criticalCount} critical** and **${highCount} high** severity vulnerabilities. ` +
        `These must be patched, upgraded, or overridden before merging.`
      );
    } else if (moderateCount + lowCount > 0) {
      warn(
        `🛡️ **Security Advisories:** Found **${moderateCount} moderate** and **${lowCount} low** severity vulnerabilities.`
      );
    }

    let report = "## 🛡️ Dependency Vulnerability Summary\n\n";
    report += `| Package | Severity | Vulnerable Version | Recommendation |\n`;
    report += `| :--- | :--- | :--- | :--- |\n`;

    advisories.slice(0, 15).forEach((advisory) => {
      const fix = advisory.patched_versions || advisory.recommendation || "—";
      report += `| \`${advisory.module_name}\` | **${advisory.severity.toUpperCase()}** | \`${advisory.vulnerable_versions}\` | ${fix} |\n`;
    });

    markdown(report);
  } catch (err) {
    warn(`Failed to parse security audit report: ${(err as Error).message}`);
  }
}
