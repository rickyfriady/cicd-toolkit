# Proposal: 360° DORA Metrics & CI Pipeline Telemetry

## Why

Fintech and high-velocity engineering organizations require objective, automated visibility into software delivery performance and operational stability. Without continuous pipeline telemetry, teams lack data on deployment frequency, lead time for changes, change failure rate, and mean time to recovery (MTTR), making it difficult to detect pipeline regressions, bottlenecks, and release risks.

Implementing an automated 360° DORA metrics and CI pipeline telemetry engine allows every pull request and release workflow to capture, calculate, and publish verifiable delivery velocity and stability metrics.

## What Changes

- Implement `scripts/measure-pipeline.ts` to calculate the 4 core DORA metrics (Deployment Frequency, Lead Time for Changes, Change Failure Rate, Time to Restore Service) using git release tags, commit timestamps, and CI execution metadata.
- Generate structured telemetry artifacts at `reports/telemetry/dora-metrics.json`.
- Author reusable workflow `.github/workflows/pipeline-metrics.yml` that publishes formatted DORA telemetry tables and Mermaid visual diagrams into `$GITHUB_STEP_SUMMARY`.
- Add PR code review telemetry reporting within Danger JS (`danger/rules/telemetry.ts`) to surface commit lead time and change blast radius directly in pull request reviews.
- Create comprehensive documentation in `docs/dora-pipeline-telemetry.md` and update `README.md`.

## Capabilities

### New Capabilities
- `pipeline-telemetry`: Continuous collection, computation, and reporting of 360° DORA metrics, pipeline durations, and pull request change lead-time telemetry.

### Modified Capabilities
<!-- None: existing capabilities remain unchanged -->

## Impact

- **Affected Code**: `scripts/measure-pipeline.ts`, `.github/workflows/pipeline-metrics.yml`, `danger/rules/telemetry.ts`, `docs/dora-pipeline-telemetry.md`, `package.json`, `README.md`.
- **Breaking Changes**: None. Telemetry is purely additive and non-blocking for existing workflows.
