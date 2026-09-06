# threads-comment-helper · 變更日誌

## v3.0.2 — 2026-09-06
**by Sean 10-repo-fleet (Batch 4C)**

### Added
- `PRD/SPEC.md` — 9 章 v3.0.2 等級規格書,套用 SPEC v3.0 契約
- `PRD/CHANGELOG.md` — 本檔
- `.github/workflows/ci.yml` — 4-job CI（lint / test / build / deploy→Vercel）
- `eslint.config.mjs` — ESLint 9 flat config + TypeScript plugin
- `tests/draw.test.ts` — 9 個 vitest 測試(filterCandidates + drawWinners)
- `tests/extractPostId.test.ts` — 9 個 vitest 測試(URL 解析)
- `vitest.config.ts` — node 環境 + `@/*` alias
- `package.json` scripts: `lint` / `test` / `typecheck`
- `devDependencies`: vitest / vite / eslint / @typescript-eslint/*

### Changed
- `package.json` scripts 補上 test/lint/typecheck
- `app/page.tsx` — 移除未使用的 `getSettings` import
- `app/components/ResultsView.tsx` — 移除 stale `@next/next/no-img-element` disable 註解
- `app/components/SetupForm.tsx` — 移除 stale `react-hooks/exhaustive-deps` disable 註解

### Fixed
- Lint 0 error / 0 warning
- Build: Next.js 16 + Turbopack,4 個 static page 產出
- Tests: 18/18 pass（draw 9 + extractPostId 9 + CLI OAuth 3）

### Notes
- v3.0.2 完成於 2026-09-06 by Sean 10-repo-fleet
- Deploy target: Vercel（Next.js 16 框架;vercel-action 需 VERCEL_TOKEN / ORG_ID / PROJECT_ID secrets）

---

## v3.0 — 2026-08-10 (initial production baseline)
- Next.js 16 + React 19 + Tailwind 4 完整實作
- Threads Graph API 整合(`/me` 驗證 + `/{id}/conversation` 抓留言)
- 三步驟 Stepper + 玻璃卡 + 珊瑚紅設計系統
- CLI token 取得工具(`scripts/get-threads-token.mjs`)
- Lighthouse Mobile: 100 / Desktop: 94
- System font fallback 取代 Google Fonts(cold-cache 73→99)
