# Changelog

## [1.2.0] - 2026-10-31

### ✨ Features & Enhancements
- **publish**: implement automated dual-registry package publishing engine ([df258de](https://github.com/rickyfriady/cicd-toolkit/commit/df258de3457feb2e84a81d32d17cc3af62d52d2c)) - @Ricki Friadi

### 📝 Documentation
- add comprehensive project summary and update documentation index ([65e0b4a](https://github.com/rickyfriady/cicd-toolkit/commit/65e0b4a22595149319529d5f0323882f3f219b70)) - @Ricki Friadi

## [1.1.1] - 2026-10-31

### 🐛 Bug Fixes
- **release**: add MIT license file and make release packaging resilient ([d27ca1e](https://github.com/rickyfriady/cicd-toolkit/commit/d27ca1ee75a570c2cc88d6abd7baff8489a02bd9)) - @Ricki Friadi

## [1.1.0] - 2026-10-31

### ✨ Features & Enhancements
- **ci**: implement automated semantic release, pr preview deployments, and deep sast scanning ([71999f8](https://github.com/rickyfriady/cicd-toolkit/commit/71999f80bcc6f853951769952f61c7426552ece4)) - @Ricki Friadi
- implement automated bundle size diff and audit vulnerability override remediation ([71ec8db](https://github.com/rickyfriady/cicd-toolkit/commit/71ec8db97a2a9753772b40d857d370dfc706bee4)) - @Ricki Friadi

### 🐛 Bug Fixes
- **danger**: configure istanbul coverage reportMode to warn and cleanup unused declaration ([37eec42](https://github.com/rickyfriady/cicd-toolkit/commit/37eec42823a8d679661a055ef8e63937615c8a84)) - @Ricki Friadi
- **knip**: ignore workflow-only formatter dependency in knip config ([8ac5750](https://github.com/rickyfriady/cicd-toolkit/commit/8ac575004bd49f8088d55b54cc85c3af2c840219)) - @Ricki Friadi
- **danger**: refine lockfile diff check for package scripts and remove unused exports ([85b0c63](https://github.com/rickyfriady/cicd-toolkit/commit/85b0c63fd45a1cec56267e9890757a18d4f926f6)) - @Ricki Friadi

### 📝 Documentation
- expand comprehensive documentation suite for workflows, container security, danger engine, and runtimes ([ad1df19](https://github.com/rickyfriady/cicd-toolkit/commit/ad1df197394a6e86fa081e1ef95328a8840f1572)) - @Ricki Friadi

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
