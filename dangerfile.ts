import * as fs from "node:fs";
import * as path from "node:path";
import { istanbulCoverage } from "danger-plugin-istanbul-coverage";
import { scan } from "danger-plugin-lint-report";
import { loadConfig } from "./danger/config";
import { checkPRHygiene } from "./danger/rules/pr-hygiene";
import { checkSecurity } from "./danger/rules/security";
import { checkCodeHealth } from "./danger/rules/code-health";
import { checkBundleSize } from "./danger/rules/bundle-size";
import { checkLicenseAndSecrets } from "./danger/rules/license-compliance";
import { checkSAST } from "./danger/rules/sast";

declare function schedule(promiseOrAsyncFunction: any): void;
declare function markdown(message: string): void;

const config = loadConfig();

// Option A: Custom Branded Header Banner
markdown(`
<div align="center">

### 🛡️ Ricky Friadi CI/CD Review Engine
**Decacorn-Grade Code Governance & Automated Quality Gate**

---
</div>
`);

// 1. ESLint Checkstyle XML Scan (if report generated)
const lintReportPath = path.join(process.cwd(), "reports/lint/lint-results.xml");
if (fs.existsSync(lintReportPath)) {
  schedule(
    scan({
      fileMask: "**/reports/lint/lint-results.xml",
      reportSeverity: true,
      removeDuplicates: true,
      requireLineModification: true,
    })
  );
}

// 2. Istanbul / Vitest Unit Test Coverage (Threshold 80% if report generated)
const coverageReportPath = path.join(process.cwd(), "reports/unit/coverage/lcov.info");
if (fs.existsSync(coverageReportPath)) {
  schedule(
    istanbulCoverage({
      customSuccessMessage:
        `✅ **Coverage Target Met:** Unit test coverage meets or exceeds the required **${config.coverageThreshold}%** threshold. Great job!`,
      customFailureMessage:
        `❌ **Coverage Deficit:** Test coverage is below the required **${config.coverageThreshold}%** threshold. Please write tests for uncovered paths before merging.`,
      entrySortMethod: "least-coverage",
      reportFileSet: "createdOrModified",
      reportMode: "warn",
      coveragePath: {
        path: "reports/unit/coverage/lcov.info",
        type: "lcov",
      },
      threshold: {
        statements: config.coverageThreshold,
        branches: config.coverageThreshold,
        functions: config.coverageThreshold,
        lines: config.coverageThreshold,
      },
    })
  );
}

// 3. Custom Enterprise Quality Gates
schedule(async () => {
  await checkPRHygiene(config);
  await checkSecurity(config);
  await checkCodeHealth(config);
  await checkLicenseAndSecrets(config);
  await checkBundleSize(config);
  await checkSAST(config);

  // Custom Branded Footer Signature
  markdown(`
---
<div align="right">
<sub>Reviewed with ❤️ by <b><a href="https://github.com/rickyfriady/cicd-toolkit">Ricky Friadi CI/CD Toolkit</a></b> • Standardized Quality Gates</sub>
</div>
  `);
});
