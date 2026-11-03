import * as fs from "node:fs";
import * as path from "node:path";
import { DangerConfig } from "../config";

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

export async function checkSecurity(config?: DangerConfig): Promise<void> {
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

    const ignoredList = config?.ignoredAdvisories || [];

    const isIgnored = (advisory: AuditAdvisory): boolean => {
      return (
        ignoredList.includes(String(advisory.id)) ||
        ignoredList.includes(advisory.module_name) ||
        ignoredList.some((item) => advisory.url && advisory.url.includes(item)) ||
        ignoredList.some((item) => advisory.title && advisory.title.includes(item))
      );
    };

    const activeAdvisories = advisories.filter((a) => !isIgnored(a));
    const documentedAdvisories = advisories.filter((a) => isIgnored(a));

    const SEVERITY_ORDER: AuditAdvisory["severity"][] = ["critical", "high", "moderate", "low", "info"];
    const SEVERITY_BADGE: { [key in AuditAdvisory["severity"]]: string } = {
      critical: "🟣 **CRITICAL**",
      high: "🔴 **HIGH**",
      moderate: "🟠 MODERATE",
      low: "🟡 LOW",
      info: "⚪ INFO",
    };

    const activeCriticalCount = activeAdvisories.filter((a) => a.severity === "critical").length;
    const activeHighCount = activeAdvisories.filter((a) => a.severity === "high").length;
    const activeModerateCount = activeAdvisories.filter((a) => a.severity === "moderate").length;
    const activeLowCount = activeAdvisories.filter((a) => a.severity === "low").length;

    const totalCritical = advisories.filter((a) => a.severity === "critical").length;
    const totalHigh = advisories.filter((a) => a.severity === "high").length;
    const totalModerate = advisories.filter((a) => a.severity === "moderate").length;
    const totalLow = advisories.filter((a) => a.severity === "low").length;

    if (activeCriticalCount + activeHighCount > 0) {
      fail(
        `🛡️ **Audit:** Found **${activeCriticalCount}** critical and **${activeHighCount}** high severity vulnerabilities. These must be resolved (update, patch, or documented override in \`.dangerrc.json\`) before merging.`
      );
    } else if (activeModerateCount + activeLowCount > 0) {
      warn(
        `🛡️ **Audit:** Found **${activeModerateCount}** moderate and **${activeLowCount}** low severity vulnerabilities. Plan updates for the affected packages.`
      );
    } else if (documentedAdvisories.length > 0) {
      markdown(`✅ **Audit Quality Gate Passed:** ${documentedAdvisories.length} advisory/advisories were verified as documented overrides.`);
    }

    const sorted = [...advisories].sort(
      (a, b) => SEVERITY_ORDER.indexOf(a.severity) - SEVERITY_ORDER.indexOf(b.severity)
    );

    let report = "## 🛡️ Dependency Vulnerability Report\n\n";
    report += `**Totals:** ${totalCritical} critical / ${totalHigh} high / ${totalModerate} moderate / ${totalLow} low`;
    if (documentedAdvisories.length > 0) {
      report += ` *(including ${documentedAdvisories.length} documented override(s))*`;
    }
    report += "\n\n";
    report += "| Package | Severity | Vulnerable | Fix | Advisory | Status |\n";
    report += "| :--- | :--- | :--- | :--- | :--- | :--- |\n";

    sorted.forEach((advisory) => {
      const fix = advisory.patched_versions || advisory.recommendation || "—";
      const link = advisory.url ? `[${advisory.title}](${advisory.url})` : advisory.title;
      const status = isIgnored(advisory) ? "🛡️ Documented Override" : (advisory.severity === "critical" || advisory.severity === "high" ? "🚨 Action Required" : "⚠️ Monitor");
      report += `| \`${advisory.module_name}\` | ${SEVERITY_BADGE[advisory.severity]} | \`${advisory.vulnerable_versions}\` | \`${fix}\` | ${link} | ${status} |\n`;
    });

    markdown(report);
  } catch (err) {
    warn(`Failed to parse security audit report: ${(err as Error).message}`);
  }
}
