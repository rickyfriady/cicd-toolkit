# package-publishing Specification

## Purpose
Enables automated, verifiable package publishing of `@rickyfriady/cicd-toolkit` to GitHub Packages and the NPM public registry with cryptographic SLSA provenance attestation.

## Requirements

### Requirement: Scoped Package Configuration
The toolkit package definition SHALL be scoped under `@rickyfriady` and specify registry metadata, exported binaries, and distribution asset white-listing.

#### Scenario: Verify package metadata
- **WHEN** consumer or pipeline inspects `package.json`
- **THEN** name is `@rickyfriady/cicd-toolkit`, `publishConfig` targets GitHub Packages or NPM, and `files` includes `dist/`, `danger/`, `scripts/`, `LICENSE`, and `README.md`

### Requirement: GitHub Packages Automated Publishing
The publishing pipeline SHALL publish new release versions of `@rickyfriady/cicd-toolkit` to GitHub Packages registry authenticated using the workflow `GITHUB_TOKEN`.

#### Scenario: Successful GitHub Packages publication
- **WHEN** a release workflow triggers on version bump or release creation
- **THEN** package is published to `npm.pkg.github.com` and accessible to authorized consumers

### Requirement: Public NPM Publishing with SLSA Provenance
The publishing pipeline SHALL support publishing to public NPM (`registry.npmjs.org`) with SLSA provenance attestation when valid credentials or OIDC tokens are present.

#### Scenario: OIDC Provenance attestation
- **WHEN** package is published to public NPM registry
- **THEN** publish command includes `--provenance` flag and attaches tamper-proof build provenance linked to the GitHub Actions run

### Requirement: Pre-Publish Integrity Verification
The system SHALL execute pre-publish validation checks before invoking registry publication commands.

#### Scenario: Broken build or uncommitted changes
- **WHEN** typecheck fails, dist files are missing, or uncommitted files exist prior to publishing
- **THEN** the publish job terminates with a non-zero exit code and halts deployment to registries
