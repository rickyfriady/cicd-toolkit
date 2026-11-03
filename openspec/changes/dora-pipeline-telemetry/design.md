# Design: 360° DORA Metrics & CI Pipeline Telemetry

## Context

Software delivery performance in high-growth technology companies is benchmarked against Google Cloud's DevOps Research and Assessment (DORA) framework. Our CI/CD toolkit automates quality gates, container packaging, and releases. However, it currently lacks an automated mechanism to quantify and track delivery velocity (Deployment Frequency, Lead Time) and stability (Change Failure Rate, MTTR).

## Goals / Non-Goals

**Goals:**
- Provide a robust TypeScript measurement utility (`scripts/measure-pipeline.ts`) that extracts release velocity, commit delta, and failure recovery data from git and GitHub Actions metadata.
- Export standardized telemetry to `reports/telemetry/dora-metrics.json`.
- Provide a reusable GitHub Actions workflow (`.github/workflows/pipeline-metrics.yml`) that visualizes metrics in `$GITHUB_STEP_SUMMARY` using Markdown tables and Mermaid diagrams.
- Surface PR-level change lead time and blast radius within the Danger review engine (`danger/rules/telemetry.ts`).
- Provide documentation for tracking engineering productivity metrics.

**Non-Goals:**
- Setting up external SaaS metric aggregators (e.g. Datadog, Grafana Cloud) or paid APM agents.
- Modifying core semantic release or quality gate logic.

## Decisions

### 1. Zero External Dependencies for Calculation
- **Choice**: Utilize standard Node.js `node:child_process` (`git log`, `git tag`) and built-in filesystem APIs to derive DORA metrics.
- **Rationale**: Keeps the toolkit lightweight, zero-cost, and portable across CI runners without requiring proprietary cloud plugins or database servers.
- **Alternatives Considered**: Direct Octokit API polling only (rejected: requires network access and fails in offline or local developer environments).

### 2. Standardized DORA Performance Classification
- **Choice**: Map metric calculations against industry-standard DORA tiers:
  - **Deployment Frequency**: Elite (Daily+), High (Weekly), Medium (Monthly), Low (>1 month).
  - **Lead Time for Changes**: Elite (<1 day), High (1-7 days), Medium (1-4 weeks), Low (>1 month).
  - **Change Failure Rate**: Elite (0-15%), High (16-30%), Medium (31-45%), Low (>45%).
  - **Time to Restore**: Elite (<1 hour), High (<1 day), Medium (<1 week), Low (>1 week).

### 3. Native GitHub Step Summary & Danger In-PR Card
- **Choice**: Dual delivery via `$GITHUB_STEP_SUMMARY` (Mermaid pie/bar chart + scorecard table) and Danger JS in-PR review table.
- **Rationale**: Immediate visibility to developers in their workflow without needing to open external dashboards.

## Risks / Trade-offs

- **[Risk] Shallow git clones (`fetch-depth: 1`) on CI runners missing historical tags** → Ensure workflow runs `actions/checkout` with `fetch-depth: 0` before invoking `measure-pipeline.ts`, with graceful fallback if history is truncated.
- **[Risk] Repositories with very few releases** → Provide sensible baseline defaults and informative notices when release count is low (< 3 tags).

## Migration Plan

1. Implement `scripts/measure-pipeline.ts` and test locally.
2. Wire `danger/rules/telemetry.ts` into `dangerfile.ts`.
3. Add `.github/workflows/pipeline-metrics.yml`.
4. Document in `docs/dora-pipeline-telemetry.md` and update `README.md`.
