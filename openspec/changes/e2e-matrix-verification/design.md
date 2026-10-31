# Design: Comprehensive E2E Cross-Framework Consumer Verification

## Context

The CI/CD toolkit provides composite actions (`composite/setup-runtime`) and reusable workflows (`quality-gate.yml`, `docker-build-secure.yml`, `package-publish.yml`). The repository contains reference consumers under `examples/`:
- `examples/vue3-vite`: Frontend Single Page App archetype
- `examples/distroless-node`: Production microservice running Node.js in distroless container
- `examples/distroless-bun`: Production microservice running Bun in distroless container

To guarantee that breaking changes are caught early before releasing or publishing new toolkit versions, we require an end-to-end matrix verification workflow.

## Goals / Non-Goals

**Goals:**
- Provide a robust matrix CI job testing combinations of package managers (`pnpm`, `bun`), runtimes (Node 20, Node 22, Bun), and application types.
- Ensure all example apps possess clean, runnable configurations and scripts.
- Output a clear matrix summary table in `$GITHUB_STEP_SUMMARY`.
- Support multiple trigger modes: nightly schedule, PR path filtering, and manual dispatch.

**Non-Goals:**
- Publishing artifacts or docker images to public registries during E2E testing (push must be disabled in E2E runs).
- Testing legacy Node.js runtimes (Node < 20 is end-of-life).

## Decisions

### 1. Matrix Workflow Architecture (`.github/workflows/e2e-matrix.yml`)
- **Choice**: Separate jobs for `e2e-frontend` and `e2e-containers`, unified under an `e2e-summary` aggregator job.
- **Rationale**: Isolates Node/frontend quality verification from Docker Buildx container compilation, enabling parallel execution on GitHub Actions runners without bloated single-job run times.
- **Alternatives Considered**: Single monolithic sequential job (rejected: slow, difficult to diagnose failure source).

### 2. Multi-Runtime & Package Manager Strategy
- **Choice**: Utilize the toolkit's own `./composite/setup-runtime` action within the E2E jobs.
- **Rationale**: Dogfoods our own composite action, verifying that `package-manager: "pnpm"` and `package-manager: "bun"` initialize cleanly across diverse environments.
- **Alternatives Considered**: Standard `actions/setup-node` (rejected: fails to dogfood our composite action).

### 3. Step Summary Matrix Telemetry
- **Choice**: Dedicated `e2e-summary` job with `if: always()` generating a GitHub Step Summary Markdown table.
- **Rationale**: Provides developers and reviewers with instant visual clarity on which exact matrix permutation failed or succeeded.

## Risks / Trade-offs

- **[Risk] Docker build times in CI runner** → Use Docker layer caching (`type=gha`) to keep E2E container builds fast (< 2 minutes).
- **[Risk] Flaky external dependencies during package installs** → Pin lockfiles and cache dependencies via composite action.
- **[Risk] Cosign signing without OIDC in PRs from forks** → Run cosign in dry-run/mock mode when signing keys or OIDC tokens are absent.

## Migration Plan

1. Verify fixture configurations in `examples/`.
2. Add `.github/workflows/e2e-matrix.yml`.
3. Test locally with dry-run scripts and workflow schema validation.
4. Open PR and verify GitHub Actions executes matrix cleanly.
