# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-20

### Added
- **Reusable Workflow (`quality-gate.yml`)**:
  - Multi-runtime support (`pnpm` and `bun`) with automatic environment detection.
  - Built-in dependency caching and concurrency cancel-in-progress.
  - Parallel/sequential quality gates: Typecheck, ESLint XML report, Vitest coverage, Knip dead-code report, Dependency vulnerability audit, and Build artifact.
- **Danger Review Engine (`dangerfile.ts`)**:
  - Pull Request Hygiene: title pattern validation, description length, oversized PR lines/files warning, and assignees check.
  - Security Guard: detection and blocking of sensitive files (`.pem`, `.key`, `.env`), critical infrastructure file alerts, and vulnerability advisories.
  - High-Entropy Secret Scanner: detection of leaked AWS keys, OpenAI keys, Slack webhooks, and private certificates.
  - Open Source License Compliance: validation of dependency licenses to block viral copyleft licenses (GPL/AGPL).
  - Production Bundle Size & Budget Guard: asset breakdown table and budget alerts for minified and gzipped bundle sizes.
  - Custom Branded Banner Header & Footer: customizable visual identity (`Ricky Friadi CI/CD Review Engine`).
  - Code Health: blocking of `console.log`, static inline styles, focused/skipped tests, lockfile sync check, and Knip unused dependencies / unresolved imports.
  - Test Coverage: Istanbul coverage verification with a default 80% threshold.
- **Enterprise Automation Workflows**:
  - `docker-build-secure.yml`: Reusable hardened multi-arch container pipeline with Trivy CVE scanning, Syft SBOM generation (CycloneDX/SPDX), and Cosign keyless signing.
  - `examples/distroless-node/`: Enterprise reference Distroless multi-stage Dockerfile for Node.js/pnpm.
  - `release.yml`: Automated semantic release and GitHub tag/release generator from Conventional Commits.
  - `preview-deploy.yml`: Reusable PR preview deployment workflow for ephemeral frontend environments.
  - Matrix testing capability in `quality-gate.yml` across multiple Node.js versions.
- **Composite Action (`composite/setup-runtime`)**:
  - Unified runtime setup for `pnpm` (via `pnpm/action-setup`) and `bun` (via `oven-sh/setup-bun`).
- **Configuration Contract**:
  - Added `.dangerrc.json` for per-repository rule adjustments.
- **Documentation & Standards**:
  - Added `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and issue templates.
