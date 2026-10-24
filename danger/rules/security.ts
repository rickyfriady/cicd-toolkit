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
        warn(
          "🛡️ **Audit:** vulnerability counts reported but advisory details are missing. Check `pnpm audit` output."
        );
      } else if (auditReport.advisories || counts) {
        markdown("🛡️ **Audit:** No known vulnerabilities in installed dependencies.");
      } else {
        markdown("🛡️ **Audit:** No audit data available for this pipeline run.");
      }
      return;
    }

    const SEVERITY_ORDER: AuditAdvisory["severity"][] = ["critical", "high", "moderate", "low", "info"];
    const SEVERITY_BADGE: { [key in AuditAdvisory["severity"]]: string } = {
      critical: "🟣 **CRITICAL**",
      high: "🔴 **HIGH**",
      moderate: "🟠 MODERATE",
      low: "🟡 LOW",
      info: "⚪ INFO",
    };

    const countBySeverity = (severity: AuditAdvisory["severity"]): number =>
      advisories.filter((a) => a.severity === severity).length;

    const criticalCount = counts?.critical ?? countBySeverity("critical");
    const highCount = counts?.high ?? countBySeverity("high");
    const moderateCount = counts?.moderate ?? countBySeverity("moderate");
    const lowCount = counts?.low ?? countBySeverity("low");

    if (criticalCount + highCount > 0) {
      fail(
        `🛡️ **Audit:** Found **${criticalCount}** critical and **${highCount}** high severity vulnerabilities. These must be resolved (update, patch, or documented override) before merging.`
      );
    } else if (moderateCount + lowCount > 0) {
      warn(
        `🛡️ **Audit:** Found **${moderateCount}** moderate and **${lowCount}** low severity vulnerabilities. Plan updates for the affected packages.`
      );
    }

    const sorted = [...advisories].sort(
      (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    );

    let report = "## 🛡️ Dependency Vulnerability Report\n\n";
    report += `**Totals:** ${criticalCount} critical / ${highCount} high / ${moderateCount} moderate / ${lowCount} low\n\n`;
    report += "| Package | Severity | Vulnerable | Fix | Advisory |\n";
    report += "| :--- | :--- | :--- | :--- | :--- |\n";
    sorted.forEach((advisory) => {
      const fix = advisory.patched_versions || advisory.recommendation || "—";
      const link = advisory.url ? `[${advisory.title}](${advisory.url})` : advisory.title;
      report += `| \`${advisory.module_name}\` | ${SEVERITY_BADGE[advisory.severity]} | \`${advisory.vulnerable_versions}\` | \`${fix}\` | ${link} |\n`;
    });

    markdown(report);
  } catch (err) {
    warn(`Failed to parse security audit report: ${(err as Error).message}`);
  }
}
