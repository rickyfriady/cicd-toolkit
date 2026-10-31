# Design: Dual-Registry Package Publishing Architecture

## Context

See `proposal.md` for motivation. The project currently runs on `pnpm@12.15.0` with TypeScript output compiled to `dist/`. While GitHub Releases and git tags exist, consumers cannot install `@rickyfriady/cicd-toolkit` via package managers without registry publication.

## Goals / Non-Goals

**Goals:**
- Provide a standardized `.github/workflows/package-publish.yml` reusable and callable workflow.
- Support seamless publishing to GitHub Packages (`npm.pkg.github.com/@rickyfriady/cicd-toolkit`) using default `GITHUB_TOKEN`.
- Support optional publishing to public NPM (`registry.npmjs.org`) with SLSA build provenance (`--provenance`) when secrets are configured.
- Introduce `scripts/publish-check.ts` to gate release artifacts prior to publishing.

**Non-Goals:**
- Private self-hosted Verdaccio/Nexus repository management.
- Replacing existing git tag and GitHub Release asset publishing.

## Decisions

### Decision 1: Scoped Package Name `@rickyfriady/cicd-toolkit`
- **Choice**: Scope package under `@rickyfriady`.
- **Rationale**: GitHub Packages strictly requires npm packages to match the repository owner scope (`@owner/repo-name`). This also avoids naming collision on public npmjs.org.
- **Alternative considered**: Unscoped `cicd-toolkit` — rejected because GitHub Packages rejects publishing unscoped packages.

### Decision 2: Dual-Registry Conditional Step Architecture
- **Choice**:
  ```mermaid
  flowchart TD
      A[Release Workflow / Dispatch] --> B[pnpm run build & publish-check]
      B --> C[Publish to GitHub Packages via GITHUB_TOKEN]
      B --> D{NPM_TOKEN present?}
      D -->|Yes| E[Publish to NPM with --provenance]
      D -->|No| F[Skip public NPM with informational log]
  ```
- **Rationale**: Keeps repository 100% self-sufficient without requiring third-party credentials while enabling public distribution immediately upon setting `NPM_TOKEN`.

### Decision 3: Pre-publish Validation Script (`scripts/publish-check.ts`)
- **Choice**: Run automated verification of `dist/`, `package.json` fields, `LICENSE`, and type declarations before calling `pnpm publish`.
- **Rationale**: Prevents accidental publication of empty dist directories or corrupted packages.

## Risks / Trade-offs

- **[Risk] Scoped registry authentication required for consumers of GitHub Packages**
  → *Mitigation*: Provide clear documentation and copy-paste `.npmrc` snippets (`@rickyfriady:registry=https://npm.pkg.github.com`).
- **[Risk] Accidental publication on uncommitted changes**
  → *Mitigation*: Pre-publish check verifies git tree status and enforces `--no-git-checks` only when running in CI isolated runner.

## Migration Plan

1. Update `package.json` with scoped name `@rickyfriady/cicd-toolkit`, `publishConfig`, and `files` array.
2. Add `scripts/publish-check.ts` and `"prepublishOnly": "node dist/scripts/publish-check.js"`.
3. Create `.github/workflows/package-publish.yml`.
4. Link `package-publish.yml` into `.github/workflows/release.yml` post-release step.
5. Provide comprehensive consumer documentation in `docs/package-registry-publishing.md`.
