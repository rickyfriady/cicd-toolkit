# Contributing to CI/CD Toolkit

Thank you for your interest in contributing to **CI/CD Toolkit & Danger Review Engine**! We welcome contributions that help improve developer productivity, CI reliability, and code review automation.

---

## Code of Conduct

All contributors and maintainers are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please report unacceptable behavior to the project maintainers.

---

## Branching Strategy & Workflow

We follow a strict, production-grade branching model:

```
master (protected)
  └── feature/ci-cd/v1.0.0 (feature integration branch)
        └── dev-feature/ricky/* (developer working branch)
```

1. **Base Branch:** All feature work branches off `master` or the targeted `feature/*` milestone branch.
2. **Feature Branch Naming:**
   - Development branches: `dev-feature/<username>/<short-description>` (e.g. `dev-feature/ricky/setup-cicd-danger`)
   - Bugfix branches: `dev-fix/<username>/<short-description>`
3. **Pull Requests:** Open a PR from your `dev-feature/*` branch targeting the active `feature/*` integration branch.

---

## Pull Request Guidelines & Quality Gates

All Pull Requests are evaluated by **Danger JS** and automated CI quality gates. To ensure a smooth review process:

1. **Title Format:**
   - Must match ticket format: `[PROJ-123] <description>` or Conventional Commits `feat: ...`, `fix: ...`.
2. **PR Description:**
   - Must provide at least **50 characters** describing the context, changes, and testing performed.
   - Use our [.github/PULL_REQUEST_TEMPLATE.md](.github/PULL_REQUEST_TEMPLATE.md).
3. **PR Diff Size:**
   - Keep changes concise (recommended: **< 400 lines** and **< 50 files**). Split oversized PRs into smaller, reviewable units.
4. **Code Quality Rules (Auto-Checked):**
   - 🚫 No `console.log`, `debugger`, or `alert` left in production code.
   - 🚫 No static inline `style="..."` attributes (use Tailwind CSS utility classes).
   - 🚫 No focused (`.only`, `fit`) or skipped (`.skip`, `xit`) test suites.
   - 🔒 Always commit the lockfile (`pnpm-lock.yaml` or `bun.lockb`) when `package.json` changes.
   - 🛡️ Zero Critical or High dependency security vulnerabilities.
   - 📊 Unit test coverage must meet or exceed **80%**.

---

## Development & Local Testing

### Prerequisites
- Node.js 22+
- `pnpm` (version 9+) or `bun`

### Commands

```bash
# Install dependencies
pnpm install

# Run TypeScript compilation check
pnpm run typecheck

# Run linter
pnpm run lint

# Run dead-code detection (Knip)
pnpm run knip

# Run local Danger review
pnpm run danger:local
```

---

## Commit Guidelines

We recommend [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` A new feature or rule
- `fix:` A bug fix in existing actions or rules
- `docs:` Documentation improvements
- `refactor:` Code change that neither fixes a bug nor adds a feature
- `test:` Adding or updating tests
- `chore:` Changes to build process or auxiliary tools

---

## Questions or Help?

Feel free to open an issue or reach out via [GitHub Discussions / Issues](https://github.com/rickyfriady/cicd-toolkit/issues).
