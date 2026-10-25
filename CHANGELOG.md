# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.0.0] - 2026-10-25

### Added
- **Reusable Workflow (`quality-gate.yml`)**:
  - Multi-runtime support (`pnpm` and `bun`) with automatic environment detection.
  - Standardized runtime defaults: Node.js (Alpine LTS `lts/*`), pnpm (`12.15.0`), and Bun (LTS `latest`).
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
  - Upgraded Knip Reporting: comprehensive multi-section Markdown tables covering 13 issue categories (Unused Dependencies, Dev Dependencies, Exports, Types, Files) with location badges (`file:line:col`).
  - Upgraded Dependency Audit Reporting: structured table reporting with colored badges (`🟣 CRITICAL`, `🔴 HIGH`, `🟠 MODERATE`, `🟡 LOW`) and upstream advisory URLs.
  - Test Coverage: Istanbul coverage verification with a default 80% threshold.
- **Enterprise Automation Workflows**:
  - `docker-build-secure.yml`: Reusable hardened multi-arch container pipeline with Trivy CVE scanning, Syft SBOM generation (CycloneDX/SPDX), and Cosign keyless signing.
  - `examples/distroless-node/`: Enterprise reference Distroless multi-stage Dockerfile for Node.js Alpine LTS + pnpm 12.15.0.
  - `examples/distroless-bun/`: Reference hardened Dockerfile for Bun Alpine LTS.
  - `release.yml`: Automated semantic release and GitHub tag/release generator from Conventional Commits.
  - `preview-deploy.yml`: Reusable PR preview deployment workflow for ephemeral frontend environments.
  - Matrix testing capability in `quality-gate.yml` across multiple Node.js versions.
- **Composite Action (`composite/setup-runtime`)**:
  - Unified runtime setup for `pnpm` (via `pnpm/action-setup`) and `bun` (via `oven-sh/setup-bun`).
  - Native support for pnpm `12.15.0` multi-document lockfiles and frozen lockfile checks.
- **Documentation Suite (`docs/`)**:
  - `docs/workflows.md`: In-depth guide for all 4 reusable workflows.
  - `docs/container-security.md`: Hardening guide covering Distroless, Trivy SARIF, Syft SBOM, and Cosign keyless signing.
  - `docs/danger-review-engine.md`: Comprehensive Danger rule catalog and `.dangerrc.json` reference.
  - `docs/runtimes-and-package-managers.md`: Setup guide for Node Alpine LTS, pnpm 12.15.0, and Bun LTS.
- **Configuration Contract**:
  - Added `.dangerrc.json` for per-repository rule adjustments.
- **Community Standards**:
  - Added `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`, `.github/PULL_REQUEST_TEMPLATE.md`, and issue templates.
