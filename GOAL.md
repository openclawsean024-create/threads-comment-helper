# Goal — Comment Flow 社群留言抽獎 M1

## Objective

把散在 `facebook-comment-picker`、`comment-flow-yt`（以及與其重複的 `comment-flow-web`）的抽獎功能搬進本 repo，做成一個支援 FB／IG／Threads／YT 的單一抽獎網站：四個平台都能用「貼上名單／CSV」抽獎，Threads 與 YouTube 可用使用者自帶的憑證抓留言；抽獎可重現、可驗證，並以 mock 方式備妥付費功能的門檻。全程只用假資料，不接真實金流、不依賴需平台審核的權限。

規格依據：`PRD/SPEC.md` v4.0 §5（FR）、§10 M1、§14 合併清單。

## Acceptance criteria

每條 AC 的「驗證」都必須留下指令與 exit code（寫入 `STATUS.md`）。標「新增」的指令目前尚未配置，屬 M1 交付內容。

- AC-001：單一網站四平台入口。首頁可選 Facebook／Instagram／Threads／YouTube；四個平台都能「貼上名單或匯入 CSV → 設定條件 → 抽獎 → 看結果」；FB／IG 頁面標示「官方 API 尚未開通，M1 僅支援貼上名單」。新增 `detectPlatform(url)`，可辨識 FB／IG／Threads／YT 網址並對未知網址回傳 `unknown`。
  - 驗證：`npm test`（`tests/platform.test.ts`，四平台各至少 2 種網址＋未知網址）；`npm run e2e`（新增，Playwright：四平台各跑一次貼上假名單到看到中獎卡片，console 0 error）。
- AC-002：抽獎核心搬遷。FCP `src/lib/lottery.js` 的 `parseList`、`parsePrizes`、`expandPrizeSlots`、`parseComments`、`hashString`、`mulberry32`、`shuffle`、`applyFilters`（4 種去重、必含、排除、黑名單姓名、黑名單關鍵字）改寫為 TypeScript 放在 `lib/`；FCP `lottery.test.js`（26 個）與 `shuffle.test.js`（4 個）全數移植，斷言語意不變、不得刪減。主 repo 原有 `tests/draw.test.ts` 9 個測試保留並通過（`lib/draw.ts` 可改為呼叫新核心）。
  - 驗證：`npm test` 通過，且 `grep -cE "^\s*it\(" tests/lottery.test.ts tests/shuffle.test.ts` 合計 ≥ 30；PR 描述附 FCP 原測試名稱與新測試的對照表。
- AC-003：統一參與者模型與平台抓取。新增 `Participant` 型別（`platform`、`name`、`comment`、可選 `id`／`timestamp`／`avatarUrl`）；Threads 抓取、YouTube 抓取（自 CFY 搬入 `lib/platforms/youtube.ts`）、貼上名單、CSV（CFY RFC 4180 `parseCSV`）都輸出 `Participant[]`。Threads 與 YouTube 抓取以 mock fetch 測試：分頁、上限截斷、Threads 隱藏留言略過、YouTube 錯誤原因轉中文提示、HTTP 401／403 錯誤訊息。
  - 驗證：`npm test`（`tests/threads.fetch.test.ts`、`tests/youtube.test.ts`、`tests/csv.test.ts`）；測試中任何未 mock 的對外請求須使測試失敗（以 `vi.stubGlobal('fetch', …)` 並斷言呼叫網址）。
- AC-004：公平且可重現。抽獎只能使用 Fisher–Yates；未填種子時以 `crypto.getRandomValues` 產生種子並顯示在結果頁；同一份名單＋同條件＋同種子必得相同結果；全專案不再有 `Math.random` 直接參與抽獎。
  - 驗證：`npm test`（`tests/fairness.test.ts`：決定性測試；10 位候選人以 10,000 個不同種子各抽 1 位，每人中獎次數落在 800–1,200 之間）；`grep -rnE "Math\.random" app lib` 無結果（或只出現在註解中並於 PR 說明）。
- AC-005：多獎項與結果輸出。可設定 `獎項 | 數量`，中獎卡片顯示獎項；可複製結果、匯出 CSV（UTF-8 BOM、RFC 4180 跳脫）、匯出 JSON；公布模式可逐位揭曉並可略過動畫；本機抽獎紀錄最多 20 筆並可一鍵全部清除。
  - 驗證：`npm test`（`tests/export.test.ts`：含逗號、引號、換行的假留言輸出正確）；`npm run e2e`（下載 CSV 檔名與第一列標題正確；清除紀錄後 localStorage 中抽獎紀錄 key 不存在）。
- AC-006：公證紀錄 v0。每次抽獎產生 `DrawRecord`：`algorithmVersion`、`seed`、`drawnAt`（ISO 8601）、`platform`、`sourceUrl`、`participantCount`、`eligibleCount`、`filters`、`prizes`、`participantsHash`（正規化名單的 SHA-256）、`winners`。提供「驗證紀錄」：匯入 JSON＋原名單後重算雜湊與結果，一致顯示「通過」，名單或種子任一處被改動顯示「不通過」。紀錄不含完整名單。
  - 驗證：`npm test`（`tests/audit.test.ts`：正常案例通過；改一筆名單、改種子、改中獎者各一個不通過案例）。
- AC-007：大量名單與 mock 方案門檻。以 `lib/entitlements.ts` 的 mock 方案控制：免費方案名單上限 500 筆（數值待 Sean 確認，集中設定一處）、付費 mock 方案上限 20,000 筆；超過上限時顯示升級提示且不執行抽獎。不接任何金流，不存在真實付款程式碼。
  - 驗證：`npm test`（`tests/entitlements.test.ts`：501 筆在免費方案被擋、20,000 筆在付費 mock 方案可抽；`tests/perf.test.ts`：20,000 筆假名單解析＋篩選＋抽獎 < 2,000 ms）；`grep -rniE "stripe|ecpay|newebpay|tappay|綠界|藍新" app lib` 無結果。
- AC-008：個資最小化。名單只在瀏覽器處理，不新增任何會接收或儲存名單的伺服器端路由；不加第三方 analytics；中獎公告可切換姓名遮罩（`王小明`→`王*明`、`@demo_user`→`@de***`）；匯出含名單的檔案前提示「檔案含個人資料」。
  - 驗證：`npm test`（`tests/mask.test.ts`：中文 2／3／4 字、英數帳號、單字元）；`npm run e2e`（遮罩開啟時結果頁不出現完整假名）；`git diff main --stat -- app/api` 無新增會讀取名單的 route（若有 route 須在 PR 說明用途）。
- AC-009：Threads CLI 安全修正。`scripts/get-threads-token.mjs` 不再使用 `wwwthreads.com`；授權網址改為 Meta Threads 官方文件所列網域，redirect URI 改由環境變數提供；把網址組裝抽成可 import 的函式，`get-threads-token.test.mjs` 改為 import 該函式測試；`get-threads-token.e2e.mjs` 納入 `npm test`。
  - 驗證：`grep -rn "wwwthreads" scripts README.md app lib` 無結果；`npm test`（含 CLI 單元測試與 e2e 腳本）exit 0。
- AC-010：可重跑的品質關卡與文件。`npm run lint`、`npm run typecheck`（乾淨 checkout 也要能過，例如先執行 `next typegen`）、`npm test`、`npm run build`、`npm run e2e` 全部 exit 0；README 改寫為 Comment Flow 多平台說明（標示 FB／IG 官方 API 未開通、BYOK、個資處理）；`STATUS.md` 記錄每個搬入模組的來源 repo 與 commit SHA。
  - 驗證：依 `SOP.md` 逐條執行並把 exit code 填入 `STATUS.md`；`git diff --check` exit 0。

## Out of scope

- 真實金流、訂閱、發票；任何付款供應商 SDK（M1 只有 mock 方案門檻）。
- Facebook 粉專／Instagram 官方 API 讀取留言、Meta App Review 送審、任何需平台審核的正式權限（M2）。
- 以爬蟲或第三方擷取服務（r.jina.ai、RapidAPI 等）取得留言。
- 品牌浮水印結果圖（M2）、公證紀錄雲端存證（M3）、中英介面（M3）。
- 真實個資：測試、E2E、截圖、文件一律用假資料；不以真實帳號的 token 或 API key 跑自動化測試。
- 留言自動回覆功能（social-comment-v2、social-comment-auto-reply、social-auto-reply、social-cli-factory）。
- repo 改名、封存或刪除來源 repo、修改 repo 設定、production 部署設定變更。

## Exit gate

M1 完成前需由 Sean 覆審 scope 與 `PRD/SPEC.md` §13 待確認事項（至少：免費名單上限、必含關鍵字語意），並在本 repo 依 `SOP.md` 跑完 lint、typecheck、test、build、e2e 且全部 exit 0、證據寫入 `STATUS.md`。未通過不得開始 M2（Meta App Review、金流 sandbox）或對外宣傳多平台上線。
