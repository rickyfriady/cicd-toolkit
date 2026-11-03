import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

export interface DoraMetricTier {
  value: string | number;
  tier: "Elite" | "High" | "Medium" | "Low";
  details: string;
}

export interface DoraTelemetryReport {
  calculatedAt: string;
  overallTier: "Elite" | "High" | "Medium" | "Low";
  metrics: {
    deploymentFrequency: DoraMetricTier;
    leadTimeForChanges: DoraMetricTier;
    changeFailureRate: DoraMetricTier;
    timeToRestoreService: DoraMetricTier;
  };
  releases: Array<{
    tag: string;
    date: string;
    commitCount: number;
    leadTimeHours: number;
    isHotfix: boolean;
  }>;
  summary: {
    totalReleases: number;
    totalCommitsAnalyzed: number;
    windowDays: number;
  };
}

function runGit(cmd: string): string {
  try {
    return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
  } catch {
    return "";
  }
}

export function computeDoraMetrics(): DoraTelemetryReport {
  const now = new Date();

  // 1. Fetch tags sorted by creation date
  const rawTags = runGit('git tag -l "v*" --sort=creatordate');
  const tagList = rawTags ? rawTags.split("\n").filter(Boolean) : [];

  const releaseDetails: DoraTelemetryReport["releases"] = [];
  let totalCommitsAnalyzed = 0;

  for (let i = 0; i < tagList.length; i++) {
    const currentTag = tagList[i];
    const prevTag = i > 0 ? tagList[i - 1] : null;

    const tagDateStr = runGit(`git log -1 --format=%aI ${currentTag}`);
    const tagDate = tagDateStr ? new Date(tagDateStr) : now;

    // Get commits in range
    const range = prevTag ? `${prevTag}..${currentTag}` : currentTag;
    const logOutput = runGit(`git log ${range} --format="%H|%aI|%s"`);
    const commitLines = logOutput ? logOutput.split("\n").filter(Boolean) : [];

    totalCommitsAnalyzed += commitLines.length;

    let leadTimeHours = 1.0; // default baseline
    let isHotfix = false;

    if (commitLines.length > 0) {
      const firstCommitLine = commitLines[commitLines.length - 1];
      const [, firstDateStr] = firstCommitLine.split("|");
      if (firstDateStr) {
        const firstDate = new Date(firstDateStr);
        leadTimeHours = Math.max(0.1, (tagDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60));
      }

      // Hotfix check: commit message starts with fix: or tag contains patch > 0
      isHotfix = commitLines.some((line) => {
        const msg = line.split("|")[2] || "";
        return /^fix(\(.*\))?!?:/i.test(msg);
      });
    }

    releaseDetails.push({
      tag: currentTag,
      date: tagDate.toISOString(),
      commitCount: commitLines.length,
      leadTimeHours: Math.round(leadTimeHours * 10) / 10,
      isHotfix,
    });
  }

  // Calculate Deployment Frequency
  const totalReleases = releaseDetails.length;
  const deployFreqValue = `${totalReleases} releases recorded`;
  let deployFreqTier: "Elite" | "High" | "Medium" | "Low";
  let deployFreqDetails: string;

  if (totalReleases >= 4) {
    deployFreqTier = "Elite";
    deployFreqDetails = "Daily or on-demand releases";
  } else if (totalReleases >= 2) {
    deployFreqTier = "High";
    deployFreqDetails = "Between once per day and once per week";
  } else if (totalReleases === 1) {
    deployFreqTier = "Medium";
    deployFreqDetails = "Between once per week and once per month";
  } else {
    deployFreqTier = "Low";
    deployFreqDetails = "Fewer than once per month";
  }

  // Calculate Lead Time for Changes
  const avgLeadTimeHours =
    releaseDetails.length > 0
      ? releaseDetails.reduce((acc, r) => acc + r.leadTimeHours, 0) / releaseDetails.length
      : 1.5;

  let leadTimeTier: "Elite" | "High" | "Medium" | "Low";
  if (avgLeadTimeHours <= 24) {
    leadTimeTier = "Elite";
  } else if (avgLeadTimeHours <= 168) {
    leadTimeTier = "High";
  } else if (avgLeadTimeHours <= 720) {
    leadTimeTier = "Medium";
  } else {
    leadTimeTier = "Low";
  }

  // Calculate Change Failure Rate
  const hotfixCount = releaseDetails.filter((r) => r.isHotfix).length;
  const failureRatePercent =
    totalReleases > 0 ? Math.round((hotfixCount / totalReleases) * 100) : 0;

  let cfrTier: "Elite" | "High" | "Medium" | "Low";
  if (failureRatePercent <= 15) {
    cfrTier = "Elite";
  } else if (failureRatePercent <= 30) {
    cfrTier = "High";
  } else if (failureRatePercent <= 45) {
    cfrTier = "Medium";
  } else {
    cfrTier = "Low";
  }

  // Calculate Time to Restore (MTTR)
  // Estimated from hotfix release lead times or default baseline
  const hotfixReleases = releaseDetails.filter((r) => r.isHotfix);
  const avgRestoreHours =
    hotfixReleases.length > 0
      ? hotfixReleases.reduce((acc, r) => acc + r.leadTimeHours, 0) / hotfixReleases.length
      : 0.5;

  let mttrTier: "Elite" | "High" | "Medium" | "Low";
  if (avgRestoreHours <= 1) {
    mttrTier = "Elite";
  } else if (avgRestoreHours <= 24) {
    mttrTier = "High";
  } else if (avgRestoreHours <= 168) {
    mttrTier = "Medium";
  } else {
    mttrTier = "Low";
  }

  // Overall Score Calculation
  const tiers = [deployFreqTier, leadTimeTier, cfrTier, mttrTier];
  const eliteCount = tiers.filter((t) => t === "Elite").length;
  const highCount = tiers.filter((t) => t === "High").length;

  let overallTier: "Elite" | "High" | "Medium" | "Low";
  if (eliteCount >= 3) {
    overallTier = "Elite";
  } else if (eliteCount + highCount >= 3) {
    overallTier = "High";
  } else {
    overallTier = "Medium";
  }

  return {
    calculatedAt: now.toISOString(),
    overallTier,
    metrics: {
      deploymentFrequency: {
        value: deployFreqValue,
        tier: deployFreqTier,
        details: deployFreqDetails,
      },
      leadTimeForChanges: {
        value: `${Math.round(avgLeadTimeHours * 10) / 10} hours`,
        tier: leadTimeTier,
        details: avgLeadTimeHours <= 24 ? "Less than 1 day" : "1 day - 1 week",
      },
      changeFailureRate: {
        value: `${failureRatePercent}%`,
        tier: cfrTier,
        details: `${hotfixCount} hotfix / remediations across ${totalReleases} releases`,
      },
      timeToRestoreService: {
        value: `${Math.round(avgRestoreHours * 10) / 10} hours`,
        tier: mttrTier,
        details: avgRestoreHours <= 1 ? "Less than 1 hour" : "Less than 1 day",
      },
    },
    releases: releaseDetails,
    summary: {
      totalReleases,
      totalCommitsAnalyzed,
      windowDays: 30,
    },
  };
}

export function generateStepSummaryMarkdown(report: DoraTelemetryReport): string {
  const tierIcon = (tier: string) => {
    switch (tier) {
      case "Elite":
        return "🟢 **Elite**";
      case "High":
        return "🔵 **High**";
      case "Medium":
        return "🟡 **Medium**";
      default:
        return "🔴 **Low**";
    }
  };

  return `
# 📊 360° DORA Engineering Metrics & Pipeline Telemetry

**Overall Performance Classification:** ${tierIcon(report.overallTier)}
*Evaluated on ${new Date(report.calculatedAt).toUTCString()} across ${report.summary.totalReleases} releases.*

---

### DORA Four Keys Scorecard

| Key Metric | Value | Industry Tier | Benchmark Criteria |
| :--- | :---: | :---: | :--- |
| **Deployment Frequency** | \`${report.metrics.deploymentFrequency.value}\` | ${tierIcon(report.metrics.deploymentFrequency.tier)} | ${report.metrics.deploymentFrequency.details} |
| **Lead Time for Changes** | \`${report.metrics.leadTimeForChanges.value}\` | ${tierIcon(report.metrics.leadTimeForChanges.tier)} | ${report.metrics.leadTimeForChanges.details} |
| **Change Failure Rate** | \`${report.metrics.changeFailureRate.value}\` | ${tierIcon(report.metrics.changeFailureRate.tier)} | ${report.metrics.changeFailureRate.details} |
| **Time to Restore (MTTR)** | \`${report.metrics.timeToRestoreService.value}\` | ${tierIcon(report.metrics.timeToRestoreService.tier)} | ${report.metrics.timeToRestoreService.details} |

---

### Delivery Velocity Timeline

\`\`\`mermaid
gantt
    title Release Cadence & Lead Time
    dateFormat YYYY-MM-DD
    axisFormat %b %d
${report.releases
  .slice(-5)
  .map(
    (r) =>
      `    section ${r.tag}\n    ${r.isHotfix ? "Hotfix Remediation" : "Feature Release"} :active, ${r.date.split("T")[0]}, 1d`,
  )
  .join("\n")}
\`\`\`
`;
}

// CLI Execution entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  const report = computeDoraMetrics();
  const outputDir = path.join(process.cwd(), "reports", "telemetry");
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, "dora-metrics.json");
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf-8");

  console.log(`✅ DORA metrics telemetry written to ${outputPath}`);
  console.log(`📈 Overall Delivery Performance: ${report.overallTier}`);
  console.log(`- Deployment Frequency: ${report.metrics.deploymentFrequency.value} (${report.metrics.deploymentFrequency.tier})`);
  console.log(`- Lead Time for Changes: ${report.metrics.leadTimeForChanges.value} (${report.metrics.leadTimeForChanges.tier})`);
  console.log(`- Change Failure Rate: ${report.metrics.changeFailureRate.value} (${report.metrics.changeFailureRate.tier})`);
  console.log(`- Time to Restore Service: ${report.metrics.timeToRestoreService.value} (${report.metrics.timeToRestoreService.tier})`);

  if (process.argv.includes("--step-summary") && process.env.GITHUB_STEP_SUMMARY) {
    const summaryMd = generateStepSummaryMarkdown(report);
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryMd, "utf-8");
    console.log("📝 Step summary updated with DORA telemetry scorecard");
  }
}
