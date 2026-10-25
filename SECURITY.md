# Security Policy

## Supported Versions

We actively support and release security fixes for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.x     | :white_check_mark: |
| < 1.0   | :x:                |

---

## Reporting a Vulnerability

Security is paramount for this toolkit, especially since it inspects code, tokens, and pull request artifacts.

If you discover a security vulnerability or credential exposure risk:

1. **Do NOT open a public issue.**
2. Send an email to **`security@rickyfriady.dev`** or use [GitHub Private Vulnerability Reporting](https://github.com/rickyfriady/cicd-toolkit/security/advisories/new).
3. Include details about:
   - Affected workflow or Danger rule.
   - Proof of Concept (PoC) or reproduction steps.
   - Potential impact.

We will acknowledge receipt within **48 hours** and provide a patch/advisory timeline.

---

## Security Practices in this Toolkit

- **Read-Only by Default:** Secret tokens are scoped strictly to necessary permissions (`pull-requests: write`, `contents: read`).
- **No Secret Echoing:** Workflows and scripts avoid echoing environment variables containing tokens.
- **Dependency Auditing:** Dependencies are scanned on every run for CVEs.
- **Supply-Chain Integrity:**
  - Automated generation of CycloneDX & SPDX Software Bill of Materials (SBOM) via Anchore Syft.
  - Cryptographic container image signing using Cosign (Keyless Sigstore OIDC).
  - Pre-push vulnerability gating via Aqua Security Trivy (SARIF integration).
  - Production Distroless runtimes eliminating shells, package managers, and root access.

For more information, see the [Container Security & Hardening Guide](docs/container-security.md).
