# Lexlab Mobile — implementation versions

Repo: `C:\Users\PC\Desktop\Codes\LexlabMobile` · package version: `1.0.0` (`package.json`)

Append-only implementation changelog for the Expo client. Version IDs are date-based implementation versions, independent of the app version. Newest entries are at the top.

Status labels: `PUSHED <sha>`, `LOCAL`, `UNCOMMITTED`, `MIXED`. Every completed implementation gets a new entry here and a current-state update in `START.md`. The client consumes the LawTest API in `C:\Users\PC\Desktop\Codes\LawTest`; server changes are tracked in LawTest, not in this repo.

## Product maturity

- **Product version: 0.9.0 — release candidate** (assessed 2026-10-23). Core mobile flows are feature-complete, but this is not 1.0 until the LawTest mobile backend is deployed, the production payment flow is verified, and real-device/store release QA passes. The Expo app version `1.0.0` is configuration metadata, not a product-release claim.

## Retrospective product-version judgment

The date-based IDs below remain the implementation record. This table is a retrospective judgment of how complete the mobile app was after each batch; it is not a claim that these were tagged releases. The current product version is **0.9.0**.

| Implementation | Effective product version | Judgment |
| --- | --- | --- |
| v2026.10.22.1 | 0.1.0 | Visual foundation: graphite/silver theme and shared components. |
| v2026.10.22.2 | 0.2.0 | Subjects navigation shell and card grid. |
| v2026.10.22.3 | 0.2.1 | Study-mode tabs; superseded by the full-height card layout. |
| v2026.10.22.4 | 0.3.0 | Functional alpha: Expo app, bearer auth and live question bank. |
| v2026.10.23.1 | 0.4.0 | Complete practice hub and quiz runner. |
| v2026.10.23.2 | 0.5.0 | Notifications, UI cleanup and bank recovery. |
| v2026.10.23.3 | 0.6.0 | Upgrade and payment-request flow. |
| v2026.10.23.4 | 0.7.0 | Tablet and large-tablet layout coverage. |
| v2026.10.23.5 | 0.8.0 | Full-range question-count control. |
| v2026.10.23.6 | 0.8.1 | Shared question-grid navigation. |
| v2026.10.23.7 | 0.8.2 | Drill category UX correction. |
| v2026.10.23.8 | 0.8.3 | Picker minimization across study setup. |
| v2026.10.23.9 | 0.9.0 | Versioning and release-candidate documentation. |

## Versions (newest first)

### v2026.10.23.11 — Product version bump policy — PUSHED `d5ac2eb`

**Date:** 2026-10-23 · **Product version after:** 0.9.0 (unchanged)

- Documented the bump policy in `RULES.md`: a big implementation increases the product version by 0.1; fixes and small additions increase it by 0.01 (one patch step). The AI agent judges scope and prefers the smaller bump when unsure.
- Current product maturity remains **0.9.0** until the next product-changing batch.
- Documentation only; no typecheck/export changes. Pushed in `d5ac2eb`.

### v2026.10.23.10 — Retrospective product-version judgment — PUSHED `d5ac2eb`

**Date:** 2026-10-23 · **Product version after:** 0.9.0 (unchanged)

- Added the retrospective product-version table above, mapping every earlier implementation batch to an effective product version from 0.1.0 through the current release candidate 0.9.0.
- The date-based implementation IDs remain the source of truth; the product versions are judgments of maturity, not historical release tags.
- No code, typecheck or export changes; documentation only. Pushed in `d5ac2eb`.

### v2026.10.23.9 — Versioning documentation — PUSHED `d5ac2eb`

**Date:** 2026-10-23

- Added `VERSION.md` covering the full mobile implementation history.
- Added `RULES.md` with the versioning rule, client/backend boundary, verification commands, UTF-8 guidance and commit policy.
- Verification: documentation only; no typecheck/export needed. Pushed in `d5ac2eb`.

### v2026.10.23.8 — Category pickers start minimized — PUSHED `ffe9c7a`

**Date:** 2026-10-23

- `custom.tsx`: Custom's category accordion no longer auto-opens the first group (`open[group.main] ?? false`).
- `SubjectPickerSheet.tsx` (Plan add, Exam Setup main/sub pickers): clears search/expanded state when the sheet closes, defaults all groups closed, and toggles against the computed open state.
- Verification: `npx tsc --noEmit` clean; web export green; Playwright at 1024x768 with a mocked two-category bank confirmed initial collapsed, open, stay closed, and reset-on-reopen in Custom, Plan, Exam Setup and the subcategory-exam picker.

### v2026.10.23.7 — Drill categories start minimized — PUSHED `ffe9c7a`

**Date:** 2026-10-23

- Removed the `setExpanded(visible[0].name)` effect in `drill.tsx` that auto-opened the first category and reopened it immediately after a collapse.
- All main categories load collapsed; each toggles independently; search still expands matching groups.
- Verification: `npx tsc --noEmit` clean; web export green; Playwright at 1024x768 confirmed initial collapsed state, open, stay closed, and independent toggles.

### v2026.10.23.6 — Shared question-grid navigator — PUSHED `ffe9c7a`

**Date:** 2026-10-23

- New `src/components/QuestionGridModal.tsx`: FlatList grid (5 columns phone / 6 tablet), computed cell widths, current-question auto-scroll, answered/current/remaining legend and height cap.
- Browse: the `N / total` counter is now a pressable grid button; selecting a number jumps to that question.
- Quiz: the inline nav grid was replaced by the same component, with answered-index tracking.
- Fixed the collapsed «narrow pill» cells caused by `PressableScale` shrinking inside a centered parent; cells now use explicit widths and full-width content.
- Verification: `npx tsc --noEmit` clean; web/Android exports green; Playwright at 1024x768 and 390x844 confirmed 80x40 / 57x36 cells, Browse jump, Quiz jump, and 300-question auto-scroll.

### v2026.10.23.5 — Question-count slider and jump — PUSHED `ffe9c7a`

**Date:** 2026-10-23

- `QuizSetupSheet` (Drill and Plan) removed the 5/10/20/30/50 preset buttons.
- Added the custom 0-to-all `CountSlider` (PanResponder, accessible adjustable, live `N / total`); 0 disables the start button; default count is 10.
- Raised the quiz count cap from 300 to the full question-bank size.
- Browse originally gained a numeric jump field; it was superseded by the grid picker above.
- Verification: `npx tsc --noEmit` clean; web/Android exports green; Playwright with a mocked 48-question subcategory confirmed slider 0/11/48, disabled start at 0, start of 48 → `1 / 48`, and Browse jump to 40.

### v2026.10.23.4 — Tablet and large-tablet responsive layout — PUSHED `ffe9c7a`

**Date:** 2026-10-23

- New `src/lib/responsive.ts` (`useResponsive`): tablet when shortest side ≥600, large tablet at ≥834 or width ≥1180; gutters 20/28/40; content max 940/1180; 3/4 subject columns.
- `app.json` orientation changed to `default` for tablet rotation.
- `Screen` centers scroll/non-scroll content; `TabBar` caps at 640/720 with larger icons/labels.
- Home subject strip becomes a 3/4-column grid and recent history is two columns; Subjects is a centered three-card row; Practice is 2x2; Profile stats sit in one row and achievements switch to 6/4 across.
- `QuizSetupSheet`/`SubjectPickerSheet` get centered max widths; login card caps at 620; Browse and Quiz center reading columns/controls; Quiz nav grows to six columns and modals widen.
- Verification: `npx tsc --noEmit` clean; Android/web exports green; Playwright at 1024x768 and 1366x1024 confirmed grids, centered sheets/reader/runner, no page errors. `expo lint` auto-setup was reverted.

### v2026.10.23.3 — Upgrade and payment page — PUSHED `df5a214`

**Date:** 2026-10-23 (pre-split)

- Added `/upgrade` (profile CTA): 39,900₮ lifetime price, free/paid comparison, Golomt bank details, terms checkbox, and payment-request GET/POST with polling.
- Practice subpages return to `/practice` via `backTo`; `/api/payment-requests` accepts mobile bearer via `requestUserId(req)`.
- Verification: mobile `npx tsc --noEmit` clean; Android export green (1,681 modules); LawTest build 51/51. Backend changes remain local-only in LawTest.

### v2026.10.23.2 — UI cleanup, notifications and bank recovery — PUSHED `df5a214`

**Date:** 2026-10-23 (pre-split)

- Removed page-title blocks and simplified `PageHeader` to a back button.
- New `NotificationBell`: signed-in only, 60s poll, unread dot, read-all; `/api/announcements` and `/api/announcements/read` accept mobile bearer.
- `bank.tsx` adds `lastError`, tries local then production (token then guest), never downgrades a larger full cache with guest data.
- Verification: `npx tsc --noEmit` clean; Android export green (1,680 modules); LawTest build 51/51.

### v2026.10.23.1 — Practice hub and full quiz runner — PUSHED `df5a214`

**Date:** 2026-10-23 (pre-split)

- Practice became a four-card hub routing to exam setup, saved, mistakes and custom exams.
- Added `exam-setup.tsx` (main/sub/case/theory/count/mode/duration/sub-stats/200-question blueprint), `saved.tsx`, `mistakes.tsx`, `custom.tsx`.
- Added `quizLaunch.ts`, `savedExams.ts`, `mainExam.ts` and `qtype.ts`.
- Quiz runner: launch/saved/legacy params, shuffle, timer, pause, navigation grid, prev/next, save & exit, feedback, arbitrary counts; result page: pass/fail, category breakdown, review filters, add-to-mistakes.
- Verification: `npx tsc --noEmit` clean; Android export green (1,679 modules); LawTest build 51/51.

### v2026.10.22.4 — Initial Expo app and bearer auth — PUSHED `df5a214`

**Date:** 2026-10-22 (pre-split)

- Created `lexlab-mobile` on Expo SDK 58.0.17 / RN 0.88 / React 19.3 / expo-router 58 with the branded dark UI: loading, floating glass tabs, Home, Subjects, Practice, Quiz, Result and Profile.
- LawTest mobile backend: `mobileAuth.ts` (jose HS256 30d), `POST /api/mobile/login`, bearer support on questions/profile/attempts/mistakes, profile `id`, and CORS.
- Mobile auth via SecureStore/AsyncStorage, `apiFetch`, login screen, bank cache (`lexlab.bank.v2`), full 4,588 questions authenticated / 1,848 guest, server progress sync, profile name/plan/logout, hand-drawn SVG icons.
- Local API auto-targets the Metro host on port 3000; production uses `https://lawtest-rho.vercel.app`.
- Verification: `npx tsc --noEmit` clean; Android export green (1,678 modules); LawTest build 51/51. Backend changes remain local-only in LawTest.

### v2026.10.22.3 — Subjects mode tabs — PUSHED `df5a214` (superseded)

**Date:** 2026-10-22 (pre-split)

- Added Subjects tabs: Унших (reader), Дасгал (accordion + setup sheet) and Төлөвлөгөө (date-based to-do plan).
- Added `plan.ts`, `SubjectPickerSheet.tsx`, `QuizSetupSheet.tsx`, `PlanBoard.tsx` and `browse.tsx`; `/api/study/todos` accepts mobile bearer.
- Verification: `npx tsc --noEmit` clean; Android export green (1,668 modules); LawTest build 51/51; Playwright confirmed tabs, reader reveal/next, drill setup, plan add/start.
- Superseded by the revised full-height card grid below.

### v2026.10.22.2 — Revised Subjects card grid — PUSHED `df5a214`

**Date:** 2026-10-22 (pre-split)

- Replaced the Subjects tabs with a full-height three-card grid; cards open `/browse`, `/drill` and `/plan`.
- Added `PageHeader`, `drill.tsx`, `plan.tsx`; Browse became the web card-view reader with scoped subject picker and bookmark.
- Verification: `npx tsc --noEmit` clean; Android export green (1,671 modules); Playwright at 390x844 confirmed cards, routes, scoped Browse and zero page errors.

### v2026.10.22.1 — Graphite/silver visual system — PUSHED `df5a214`

**Date:** 2026-10-22 (pre-split)

- Replaced purple/pink accents with graphite/silver: quiet dot-grid `Aurora`, `colors.lilac` accents, steel CTAs, glass tabs/chips/options and monochrome icons.
- Neutralized Home, Subjects, Drill, Plan, Practice, Profile, Quiz, Result, Login, Loading and LogoMark; semantic green/rose/danger retained.
- Verification: `npx tsc --noEmit` clean; Android export green (1,671 modules); Playwright at 390x844 confirmed the dot grid, glass tab and zero page errors.

## Current app version

`1.0.0` in `package.json` remains the Expo app version; implementation versions above are documentation IDs, not app-store releases.
