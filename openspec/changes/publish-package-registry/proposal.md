# Proposal: Automated Dual-Registry Package Publishing Engine

## Why

The `cicd-toolkit` repository currently produces GitHub releases, git tags, and tarball assets, but does not publish to standard package registries. Consumer repositories (frontend and backend microservices) need to declare `@rickyfriady/cicd-toolkit` in their `package.json` dependencies and install it via `pnpm add -D @rickyfriady/cicd-toolkit`. Establishing an automated dual-registry publishing pipeline ensures reproducible distribution across both internal GitHub Packages and the public NPM ecosystem with SLSA build provenance.

## What Changes

- Introduce `.github/workflows/package-publish.yml` reusable workflow for registry publishing.
- Configure automatic scoped publishing to GitHub Packages (`npm.pkg.github.com/@rickyfriady/cicd-toolkit`) authenticated via `GITHUB_TOKEN`.
- Configure conditional publishing to public npm registry (`registry.npmjs.org`) with SLSA build provenance (`--provenance`) when secrets or OIDC trusted publisher are present.
- Update `package.json` with `@rickyfriady/cicd-toolkit` package name, `publishConfig`, `repository`, and `files` white-listing.
- Add `scripts/publish-check.ts` pre-publish validation script to ensure clean build, license, types, and lockfile alignment.
- Document consumer installation guides in `docs/package-registry-publishing.md`.

## Capabilities

### New Capabilities
- `package-publishing`: Automated distribution and provenance attestation of `@rickyfriady/cicd-toolkit` to GitHub Packages and NPM registries.

### Modified Capabilities
<!-- None: This is the initial capability introduction -->

## Impact

- **Affected Systems**: GitHub Actions workflow suite, `package.json` naming and metadata, documentation.
- **Dependencies**: Zero runtime dependencies added. Uses standard pnpm and npm registry protocols.
- **Compatibility**: Fully backwards-compatible. Reusable workflows and existing GitHub Release artifacts remain unaffected.
