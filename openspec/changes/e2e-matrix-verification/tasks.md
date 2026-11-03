# Tasks: Comprehensive E2E Cross-Framework Consumer Verification

## 1. Reference App Fixtures & Verification

- [x] 1.1 Complete `examples/vue3-vite` fixture with runnable `package.json`, `vite.config.ts`, and source files, verifying local `build` command executes cleanly.
- [x] 1.2 Audit and test Dockerfiles for `examples/distroless-node` and `examples/distroless-bun` to ensure valid multi-stage syntax for Docker Buildx.

## 2. Reusable E2E Matrix Workflow

- [x] 2.1 Author `.github/workflows/e2e-matrix.yml` with multi-dimension test matrix (`examples/vue3-vite`, `examples/distroless-node`, `examples/distroless-bun` across `pnpm` and `bun` with Node 20.x and 22.x).
- [x] 2.2 Implement `e2e-summary` aggregator job with `if: always()` generating an automated status matrix table in `$GITHUB_STEP_SUMMARY`.
- [x] 2.3 Configure workflow triggers for nightly schedule (`0 2 * * *`), PR path filtering (`.github/workflows/**`, `composite/**`), and manual `workflow_dispatch`.

## 3. Documentation & Quality Gates

- [x] 3.1 Author `docs/e2e-verification.md` documenting consumer matrix architecture, runner matrix topology, and troubleshooting procedures.
- [x] 3.2 Update `README.md` Documentation Index with reference to E2E verification.
- [x] 3.3 Run `pnpm run typecheck`, `pnpm run test:coverage`, and `pnpm run knip` to verify zero regressions.

## Workflow follow-up

- Open PR on GitHub targeting `feature/ci-cd/v1.0.0`.
- Verify GitHub Actions matrix executes and passes.
- Archive change using `openspec archive "e2e-matrix-verification"`.
