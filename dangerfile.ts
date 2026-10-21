import { schedule } from "danger";
import { istanbulCoverage } from "danger-plugin-istanbul-coverage";
import { scan } from "danger-plugin-lint-report";
import { loadConfig } from "./danger/config";
import { checkPRHygiene } from "./danger/rules/pr-hygiene";
import { checkSecurity } from "./danger/rules/security";
import { checkCodeHealth } from "./danger/rules/code-health";

const config = loadConfig();

// 1. ESLint Checkstyle XML Scan
schedule(
  scan({
    fileMask: "**/reports/lint/lint-results.xml",
    reportSeverity: true,
    removeDuplicates: true,
    requireLineModification: true,
  })
);

// 2. Istanbul / Vitest Unit Test Coverage (Threshold 80%)
schedule(
  istanbulCoverage({
    customSuccessMessage:
      `✅ **Coverage Target Met:** Unit test coverage meets or exceeds the required **${config.coverageThreshold}%** threshold. Great job!`,
    customFailureMessage:
      `❌ **Coverage Deficit:** Test coverage is below the required **${config.coverageThreshold}%** threshold. Please write tests for uncovered paths before merging.`,
    entrySortMethod: "least-coverage",
    reportFileSet: "createdOrModified",
    reportMode: "fail",
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

// 3. Custom Enterprise Quality Gates
schedule(async () => {
  await checkPRHygiene(config);
  await checkSecurity();
  await checkCodeHealth(config);
});
