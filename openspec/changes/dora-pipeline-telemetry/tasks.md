# Tasks: 360° DORA Metrics & CI Pipeline Telemetry

## 1. Core Measurement Utility

- [x] 1.1 Implement `scripts/measure-pipeline.ts` to calculate 4 core DORA metrics (Deployment Frequency, Lead Time for Changes, Change Failure Rate, Time to Restore) and DORA performance tiers.
- [x] 1.2 Add `telemetry:measure` script to `package.json` and verify execution generates valid `reports/telemetry/dora-metrics.json`.

## 2. Danger Review Bot Telemetry

- [x] 2.1 Author `danger/rules/telemetry.ts` calculating PR commit lead-time, author count, and change dispersion, then wire into `dangerfile.ts`.

## 3. GitHub Actions Telemetry Workflow

- [x] 3.1 Author `.github/workflows/pipeline-metrics.yml` publishing DORA scorecard table and Mermaid diagrams into `$GITHUB_STEP_SUMMARY`.

## 4. Documentation & Quality Gates

- [x] 4.1 Author `docs/dora-pipeline-telemetry.md` detailing DORA metrics calculation methodologies, performance tiers, and CI/CD integration.
- [x] 4.2 Update `README.md` Documentation Index with reference to DORA metrics.
- [x] 4.3 Run `pnpm run typecheck`, `pnpm run test:coverage`, and `pnpm run knip` to verify zero quality gate regressions.

## Workflow follow-up

- Open PR targeting `feature/ci-cd/v1.0.0`.
- Verify GitHub Actions CI and Danger review bot with telemetry card.
- Archive change using `openspec archive "dora-pipeline-telemetry"`.
