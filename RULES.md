# Rules for future sessions (opencode)

## Context discipline

- After each finished task: update `START.md` (current state, commands, gotchas), add a new entry to `VERSION.md`, then compress the closed range with a short summary (decisions, paths, commands only).
- Never compress the active task. Do not paste full file contents into summaries; reference `path:line`.
- A fresh session resumes from `START.md`. `VERSION.md` is the implementation changelog; `AGENTS.md` contains the Expo/React Native platform rules.
- The backend is not in this repo. Server work belongs in `C:\Users\PC\Desktop\Codes\LawTest` and is versioned there.

## Versioning (`VERSION.md`)

- Every completed implementation gets a new version entry in `VERSION.md`. Add the newest entry at the top; never renumber, rewrite or delete old entries.
- Version IDs are `vYYYY.MM.DD.N`, where `N` is the next unused sequence for that date in the file. They are documentation versions, independent of the `package.json` app version.
- Each entry records date, status (`PUSHED <sha>`, `LOCAL`, `UNCOMMITTED`, `MIXED`), implementation scope/files, verification, and the product version after the change (or "no product-version change").
- `VERSION.md` has `## Product maturity` for the current product version and `## Retrospective product-version judgment` for how earlier batches were assessed. Update those judgments when a batch materially changes product completeness.
- Product version bump policy: a big new implementation increases the product version by 0.1 (for example 0.9.0 → 1.0.0); fixes and small additions increase it by 0.01 (1.0.0 → 1.0.1, one patch step). The AI agent doing the work judges the size by user-visible scope and product completeness, not line count, and prefers the smaller bump when unsure. Record the resulting product version in the entry and in `## Product maturity`; the date-based implementation ID never changes because of this.
- Update the `START.md` push-status line in the same task so the two files do not disagree.

## Working rules

- Build mode = do the work; plan mode = discuss only.
- Verify UI/logic changes with `cmd /c "npx tsc --noEmit"`. For behavior or layout changes also run a web export and/or `cmd /c "npx expo export --platform android"`; report the exact commands and results.
- `npx expo lint` is not configured (Expo/ESLint 9 does not lint `src` without a flat config). Do not add lint tooling/config unless the user asks.
- Use `npx expo install` for Expo/RN dependencies so versions match SDK 58. Do not hand-edit generated `ios/` or `android/` directories.
- Never commit or push without explicit user approval. Never stage `node_modules/`, `.expo/`, `dist/`, `dist-test/`, `.env*`, logs or generated native folders.
- Never write source files through PowerShell `Set-Content`/`Get-Content`: Cyrillic/UTF-8 gets corrupted. Use the editing tools and keep UTF-8 without BOM.
- Responsive layout: use `src/lib/responsive.ts` (`useResponsive`) instead of fixed phone widths. Tablet breakpoints are shortest side ≥600, large ≥834 or width ≥1180; gutters 20/28/40. Test phone and tablet layouts for UI changes.
- Preserve the graphite/silver visual system and semantic green/rose/danger colors. Use existing `Screen`, `ui`, `TabBar`, sheets and theme tokens rather than adding a parallel style system.
- Secrets do not belong in this repo. `EXPO_PUBLIC_API_URL` is a non-secret override only; never put API keys or tokens in `app.json` or source.
- Backend boundary: this app consumes LawTest endpoints (`/api/mobile/login`, `/api/questions?full=1`, profile, attempts, mistakes, saved exams, study todos, announcements, payment requests). Those routes, `mobileAuth.ts` and CORS live in LawTest and may still be local-only; do not assume production supports a new endpoint until it is deployed.
- Ask the user when a product decision or destructive change is ambiguous; do not guess.
