<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md — Comment Flow 社群留言抽獎

## 1. 權威規格與範圍

- 規格：[`PRD/SPEC.md`](./PRD/SPEC.md) v4.0；目前目標：[`GOAL.md`](./GOAL.md)（只有 M1）。
- 產品範圍是「留言抽獎」。留言自動回覆、發文排程不在本 repo 範圍。
- 實作需對應 SPEC §5 的 FR 編號與 GOAL 的 AC 編號；不在 GOAL 內的功能先提出，不直接做。
- 待併入 repo（`facebook-comment-picker`、`comment-flow-web`、`comment-flow-yt` 等）只讀不寫；搬遷依 SPEC §14 合併清單，並在 `STATUS.md` 記錄來源 repo 與 commit SHA。

## 2. 專案結構（2026-11-16 現況）

```
app/                    Next.js App Router
  page.tsx              主畫面：三步驟（設定 → 抽籤 → 中獎者），目前只支援 Threads
  layout.tsx            系統字型堆疊 + metadata
  globals.css           設計系統（珊瑚紅 #ff6666、深藍 #204272、玻璃卡、pill）
  components/
    Stepper.tsx         三步驟進度條
    SetupForm.tsx       貼文網址、Threads token、抽出人數、排除關鍵字
    ResultsView.tsx     抽籤中狀態與中獎者卡片
lib/                    純函式，無 React 依賴
  threads.ts            Threads Graph API：extractPostId、fetchThreadsComments、validateToken
  draw.ts               filterCandidates、drawWinners（目前用 Math.random）
  storage.ts            localStorage：token 與抽獎設定
tests/                  vitest：draw.test.ts、extractPostId.test.ts
scripts/                get-threads-token.mjs（Threads token CLI）與其測試
docs/lighthouse/        2026-08-10 Lighthouse 報告
PRD/                    SPEC.md、CHANGELOG.md
dashboard.html          與產品無關的樣板檔，Next.js 不會提供此檔；勿當成產品頁
```

M1 預計新增：`lib/lottery.ts`、`lib/platforms/{facebook,instagram,threads,youtube}.ts`、`lib/audit.ts`、`lib/entitlements.ts`、`lib/mask.ts`、E2E 目錄（見 GOAL）。

## 3. 技術棧

| 項目 | 版本／說明 |
|---|---|
| Framework | Next.js 16.3.0（App Router，Turbopack build） |
| UI | React 19.2.8、Tailwind CSS 4 |
| 語言 | TypeScript 5（strict） |
| 測試 | Vitest 5（`tests/**/*.test.ts`，node 環境）；CLI 測試為 Node 腳本 |
| Lint | ESLint 10 flat config + `@typescript-eslint` |
| 外部 API | Threads Graph API `graph.threads.net/v1.0`（使用者自帶 token，從瀏覽器直接呼叫） |
| 部署 | GitHub Actions → Vercel（`main` push 觸發；需 repo secrets，agent 不得變更） |
| Node | 本機已驗證 v26；CI 使用 Node 20 |

## 4. 開發規則

1. **只用假資料**：測試、E2E、範例、截圖、文件中的留言者一律用明顯假名（例：`測試用戶A`、`@demo_user_01`、`留言內容範例`）。不得貼入真實留言、真實帳號或真實貼文的留言名單。
2. **不得提交憑證**：token、API key、App Secret、cookie、密碼不得寫進程式、測試、文件、commit 訊息或 PR。`.env*` 已被 `.gitignore` 排除，只能提交 `.env.example` 且值為佔位字串。測試用 token 必須是明顯假字串（例：`FAKE_TOKEN_FOR_TEST`）。
3. **測試不可為了通過而刪改斷言**：測試失敗時修程式；若確認是測試本身錯誤，要在 PR 說明原因並保留原斷言意圖。搬遷的測試（FCP 30 個）斷言語意不得放寬。不得用 `.skip`、`|| true`、`continue-on-error` 讓失敗看起來像通過。
4. **不打真實平台 API**：自動化測試一律 mock `fetch`；未 mock 的對外請求應讓測試失敗。
5. **不新增爬蟲**：不得用 r.jina.ai、RapidAPI 或模擬瀏覽器擷取平台頁面取得留言。
6. **憑證不進 URL**：token／API key 不放在傳給我方伺服器的 query string；OAuth 回跳網址不得依 `Referer` 決定。
7. **抽獎公平性**：只用 `lib/` 內同一套 Fisher–Yates + 種子實作；禁止 `sort(() => Math.random() - 0.5)`；伺服器與前端不得各寫一套演算法。
8. **個資最小化**：名單只在瀏覽器處理；不新增接收或儲存名單的 API route；不加第三方 analytics。
9. **Git**：從 `main` 開分支，不直接 push `main`，不 force push，不合併 PR；commit 格式 `<type>(scope): <FR／AC 編號或說明>`。
10. 需要 Sean 人審：任何金流、Meta App Review 送審、正式部署設定、repo 改名或封存、新增伺服器端資料儲存。

## 5. 驗證命令

詳見 [`SOP.md`](./SOP.md)。摘要：`npm run lint`、`npm run typecheck`（乾淨 checkout 需先 build 或 `npx next typegen`）、`npm test`、`npm run build`；`npm run e2e` 尚未配置（M1 交付）。
