# Proposal: Comprehensive E2E Cross-Framework Consumer Verification

## Why

As an enterprise CI/CD toolkit powering production microservices and frontends, changes to reusable GitHub Actions (`quality-gate.yml`, `docker-build-secure.yml`, `composite/setup-runtime`) risk introducing breaking downstream regressions for consuming applications. Without continuous automated cross-framework and multi-runtime integration tests, downstream consumers (Vue 3/Vite SPA, Node.js distroless services, Bun runtimes) risk encountering silent failures in production CI runs.

Introducing an end-to-end matrix verification engine ensures that all reusable workflows and composite actions are automatically exercised across representative downstream consumer archetypes, package managers (`pnpm`, `bun`), and Node.js LTS runtimes.

## What Changes

- Add `.github/workflows/e2e-matrix.yml` running an automated matrix test across consumer archetypes (`examples/vue3-vite`, `examples/distroless-node`, `examples/distroless-bun`).
- Test multiple package managers (`pnpm`, `bun`) and Node LTS versions (`20.x`, `22.x`).
- Support scheduled execution (nightly cron), automated PR triggers on core workflow/composite changes, and on-demand `workflow_dispatch`.
- Add simulated downstream integration assertions (quality-gate invocation, container build with Buildx, SBOM generation, and cosign signing in test mode).
- Collate matrix execution results into GitHub Actions Step Summary (`$GITHUB_STEP_SUMMARY`) and Danger review comments.
- Update `README.md` and documentation with E2E verification guidelines.

## Capabilities

### New Capabilities
- `e2e-verification`: Automated cross-framework and multi-runtime matrix testing engine to validate reusable workflows and composite actions against consumer reference applications.

### Modified Capabilities
<!-- None: package-publishing requirements remain unchanged -->

## Impact

- **Affected Code**: `.github/workflows/e2e-matrix.yml`, `examples/`, `docs/e2e-verification.md`, `README.md`.
- **CI/CD Triggers**: New workflow runs on `schedule` (cron), `workflow_dispatch`, and PRs modifying `.github/workflows/**` or `composite/**`.
- **Breaking Changes**: None. Zero impact on existing release or publishing pipelines.
