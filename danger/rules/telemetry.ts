import * as fs from "node:fs";
import * as path from "node:path";
import { DangerConfig } from "../config";

declare const danger: any;
declare function markdown(message: string): void;

export async function checkPipelineTelemetry(_config: DangerConfig): Promise<void> {
  const pr = danger.github.pr;
  const commits = danger.git.commits || [];

  // Calculate commit age / lead time
  let leadTimeHours = 0;
  if (commits.length > 0) {
    const firstCommitDate = new Date(commits[0].author?.date || pr.created_at);
    const lastCommitDate = new Date(commits[commits.length - 1].author?.date || new Date().toISOString());
    leadTimeHours = Math.max(0.1, (lastCommitDate.getTime() - firstCommitDate.getTime()) / (1000 * 60 * 60));
  }

  const roundedLeadTime = Math.round(leadTimeHours * 10) / 10;
  const leadTimeAssessment =
    roundedLeadTime <= 24 ? "🟢 Rapid Delivery (< 24h)" : "🟡 Multi-day Iteration (> 24h)";

  const commitCount = commits.length;
  const commitAssessment =
    commitCount <= 10 ? "🟢 Well-Scoped Pull Request" : "🟡 Consider squashing or splitting";

  const changedFiles =
    danger.git.modified_files.length +
    danger.git.created_files.length +
    danger.git.deleted_files.length;

  const blastRadiusAssessment =
    changedFiles <= 15 ? "🟢 Contained Blast Radius" : "🟡 Broad Impact";

  // Check if repository-wide DORA report is available
  const reportPath = path.join(process.cwd(), "reports", "telemetry", "dora-metrics.json");
  let doraSection = "";

  if (fs.existsSync(reportPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
      doraSection = `
### 📊 Repository DORA Velocity Baseline
- **Overall Performance:** **${data.overallTier}**
- **Deployment Frequency:** \`${data.metrics.deploymentFrequency.value}\` (${data.metrics.deploymentFrequency.tier})
- **Lead Time for Changes:** \`${data.metrics.leadTimeForChanges.value}\` (${data.metrics.leadTimeForChanges.tier})
- **Change Failure Rate:** \`${data.metrics.changeFailureRate.value}\` (${data.metrics.changeFailureRate.tier})
- **Time to Restore:** \`${data.metrics.timeToRestoreService.value}\` (${data.metrics.timeToRestoreService.tier})
`;
    } catch {
      // Ignore parse failure gracefully
    }
  }

  markdown(`
## 📈 Engineering Velocity & Pipeline Telemetry

| Velocity Dimension | PR Measurement | Governance Assessment |
| :--- | :---: | :--- |
| **Commit Lead Time** | \`${roundedLeadTime}h\` | ${leadTimeAssessment} |
| **Commit Volume** | \`${commitCount} commit(s)\` | ${commitAssessment} |
| **Change Blast Radius** | \`${changedFiles} file(s)\` | ${blastRadiusAssessment} |
${doraSection}
`);
}
