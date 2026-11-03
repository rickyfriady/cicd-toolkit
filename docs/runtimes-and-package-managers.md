# Runtimes & Package Managers Guide

`rickyfriady/cicd-toolkit` is designed to be cross-platform, multi-runtime, and multi-package-manager. This guide covers supported versions, caching strategies, and environment customization.

---

## Supported Matrix

| Technology | Supported Versions | Default in CI | Action Used |
| :--- | :--- | :--- | :--- |
| **Node.js** | `20.x`, `22.x`, `lts/*` | `lts/*` (Active LTS) | `actions/setup-node@v4` |
| **pnpm** | `9.x`, `10.x`, `11.x`, `12.x` | `12.15.0` | `pnpm/action-setup@v4` |
| **Bun** | `1.x`, `latest` | `latest` (LTS stable) | `oven-sh/setup-bun@v2` |

---

## 1. Automatic Package Manager Detection

The composite action [`composite/setup-runtime`](../composite/setup-runtime/action.yml) detects the project package manager automatically:

```bash
# If bun.lock or bun.lockb exists -> resolves to 'bun'
# Otherwise -> resolves to 'pnpm'
```

You can explicitly force the runtime by passing `package-manager: "pnpm"` or `package-manager: "bun"` in your workflow `with:` block.

---

## 2. PNPM 12.15.0 Best Practices

### Declaring in `package.json`
To ensure exact version parity between developer laptops, Docker builds, and CI runners, declare the `packageManager` field in `package.json`:

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "packageManager": "pnpm@12.15.0"
}
```

When `packageManager` is present:
- `composite/setup-runtime` reads the version directly and instructs `pnpm/action-setup` to install that exact release without conflicting version inputs.
- In Dockerfile, Corepack activates it deterministically:
  ```dockerfile
  RUN corepack enable && corepack prepare pnpm@12.15.0 --activate
  ```

### Frozen Lockfile Rule
CI always executes `pnpm install --frozen-lockfile`. Never modify `package.json` dependencies without running `pnpm install` and committing the resulting `pnpm-lock.yaml`.

---

## 3. Bun Runtime Best Practices

When using Bun:
- Package manager resolution automatically uses `bun.lock` or `bun.lockb`.
- Dependencies are installed using `bun install --frozen-lockfile`.
- Caching is managed natively by `oven-sh/setup-bun@v2`.
- Quality gates execute with `bun run <script>` or fallback to `bun x <tool>`.

---

## 4. Multi-Version Matrix Verification

To verify that your libraries or shared packages work across both Node 20 LTS and Node 22 LTS, enable the matrix option in `quality-gate.yml`:

```yaml
jobs:
  quality-gate:
    uses: rickyfriady/cicd-toolkit/.github/workflows/quality-gate.yml@v1
    with:
      enable-matrix: true  # Spawns parallel jobs for ["20.x", "22.x"]
    secrets: inherit
```
