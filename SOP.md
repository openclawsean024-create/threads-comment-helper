# Comment Flow 社群留言抽獎 — 開發與驗證 SOP

所有指令都在 repo 根目錄執行。指令是否「可用」以 `package.json` scripts 為準（2026-11-16 查證）。

## 1. 環境準備

```bash
node -v                              # 本機已驗證 v26；CI 用 Node 20
npm ci --legacy-peer-deps            # 依 package-lock.json 安裝
```

`npm ci` 會提示 `fsevents` 有 install script 未核准，不影響下列指令。

## 2. 驗證指令

| 類型 | 指令 | 狀態 | 2026-11-16 實測（`main` @ `75b2f8a`） |
|---|---|---|---|
| Lint | `npm run lint` | 已配置（`eslint . --max-warnings 999`，警告不擋） | exit 0 |
| Type 產生 | `npx next typegen` | Next CLI 內建，非 package script | exit 0 |
| Typecheck | `npm run typecheck` | 已配置（`tsc --noEmit`） | 乾淨 checkout 直接跑 **exit 2**（找不到 `LayoutProps`）；先跑 `npx next typegen` 或 `npm run build` 後 exit 0 |
| Unit | `npm test` | 已配置（`vitest run && node scripts/get-threads-token.test.mjs`） | exit 0：vitest 18 個通過；CLI 測試 3 項通過 |
| CLI e2e | `node scripts/get-threads-token.e2e.mjs` | 腳本存在，**未納入** `npm test` | exit 0 |
| Build | `npm run build` | 已配置（`next build`） | exit 0；靜態路由 `/`、`/_not-found` |
| Dev server | `npm run dev` | 已配置 | 本次未啟動 |
| Production server | `npm run start` | 已配置（需先 build） | 本次未啟動 |
| E2E（瀏覽器） | `npm run e2e` | **尚未配置**（M1 AC-001／005／008 交付） | — |
| Coverage | — | **尚未配置** | — |
| Format | — | **尚未配置** | — |
| Whitespace | `git diff --check` | git 內建 | 文件 PR 前執行 |

建議的完整驗證順序（目前可用的部分）：

```bash
npm ci --legacy-peer-deps
npm run lint
npx next typegen
npm run typecheck
npm test
node scripts/get-threads-token.e2e.mjs
npm run build
git diff --check
```

M1 完成後應改為：`npm run lint && npm run typecheck && npm test && npm run build && npm run e2e`（typecheck 須在乾淨 checkout 也能直接通過，見 GOAL AC-010）。

## 3. CI 現況（`.github/workflows/ci.yml`）

- jobs：lint → test → build → deploy（只在 `main` push 時部署 Vercel）。
- lint 設 `continue-on-error: true`；test 步驟是 `npm test -- --run 2>&1 || echo "no test script"`，**測試失敗也會被吞掉**；CI 沒有 typecheck。
- 因此「CI 綠燈」不等於測試通過，驗收以本機或 CI log 中各指令的實際 exit code 為準。修正 CI 屬 M1 範圍內的程式變更，需另開 PR，不在文件 PR 內處理。

## 4. 手動煙霧測試（只用假資料）

自動化測試不得使用真實 token。若需人工驗證 Threads 實際抓取：

1. `npm run dev`，開 `http://localhost:3000`。
2. 由 Sean 本人在瀏覽器貼上自己的測試 token（不得寫入任何檔案、截圖或對話紀錄）。
3. 使用測試用公開貼文；結果畫面截圖前開啟姓名遮罩（M1 交付後）。
4. 檢查 DevTools Console 0 error。

## 5. 文件變更 SOP

- 只改文件時：`git diff --check`，並確認 `git diff --stat` 只有文件檔。
- 不得因文件變更而修改 `package.json`、CI 或測試。

## 6. 故意不做

- 真實金流、Meta App Review 送審、FB／IG 官方 API 讀取（M2 起，需 Sean 人審）。
- 爬蟲或第三方擷取服務。
- 以真實個資或真實 token 跑自動化測試。
