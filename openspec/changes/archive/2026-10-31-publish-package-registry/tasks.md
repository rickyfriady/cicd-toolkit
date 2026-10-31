# Tasks: Automated Dual-Registry Package Publishing Engine

## 1. Package Metadata & Pre-Publish Verification

- [x] 1.1 Update `package.json` with scoped name `@rickyfriady/cicd-toolkit`, `publishConfig`, and explicit distribution `files` white-listing, then verify valid JSON.
- [x] 1.2 Implement `scripts/publish-check.ts` to validate compiled artifacts, license presence, and clean git state prior to publish.
- [x] 1.3 Add `publish:check` and `prepublishOnly` scripts to `package.json` and verify `pnpm run publish:check` passes.

## 2. Reusable Package Publishing Workflow

- [x] 2.1 Author `.github/workflows/package-publish.yml` with dual-registry support (GitHub Packages via `GITHUB_TOKEN` and public NPM with `--provenance`).
- [x] 2.2 Wire `package-publish.yml` as a downstream step in `.github/workflows/release.yml` upon successful tag creation and release notes generation.
- [x] 2.3 Verify workflow syntax and permissions with dry-run tests.

## 3. Documentation & Verification

- [x] 3.1 Create `docs/package-registry-publishing.md` detailing consumer setup for GitHub Packages (`.npmrc`) and NPM registry installation commands.
- [x] 3.2 Update `README.md` documentation index and registry badges.
- [x] 3.3 Run `pnpm run typecheck`, `pnpm run test:coverage`, and `pnpm run knip` to verify zero quality gate regressions.
