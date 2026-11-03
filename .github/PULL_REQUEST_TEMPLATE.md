## 📌 Context & Purpose

<!-- Describe the problem solved or the feature introduced. Link to ticket/issue if applicable. -->
Fixes / Relates to: `[TICKET-ID]`

---

## 🛠️ Summary of Changes

- 
- 

---

## 🧪 Testing Done

- [ ] Unit tests added / updated and passing
- [ ] TypeScript typecheck passing (`pnpm run typecheck`)
- [ ] Linter passing (`pnpm run lint`)
- [ ] Dead code verified (`pnpm run knip`)
- [ ] Local Danger test verified (`pnpm run danger:local`)

---

## 📋 Quality & Reviewer Checklist

- [ ] PR title adheres to convention (`[TICKET-123] ...` or `feat: ...`)
- [ ] PR description provides sufficient context (> 50 chars)
- [ ] PR size is optimized (under 400 lines changed)
- [ ] No `console.log` or debug statements left behind
- [ ] No static inline `style="..."` attributes
- [ ] No focused (`.only`) or skipped (`.skip`) test suites
- [ ] Lockfile (`pnpm-lock.yaml` / `bun.lockb`) committed if dependencies changed
- [ ] No sensitive credentials, certificates, or `.env` files committed
