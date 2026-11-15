# Comment Flow 社群留言抽獎 — 產品規格（PRD）

> 版本：v4.0（文件重建）｜更新：2026-11-16｜狀態：規格已重建、尚未開發
> 主 repo：`openclawsean024-create/threads-comment-helper`（`main` @ `75b2f8a`）
> 商業依據：Notion 資料庫「可產品化商品」→「Comment Flow 社群留言抽獎」（優先順序 P2、開發順位第 5）
> 取代前版：v3.0.2（2026-09-06，僅涵蓋 Threads 單一平台；其中與程式不符之處見 §12）

本文件以 2026-11-16 實際閱讀主 repo 與 7 個待併入 repo 的程式碼為準。README 或舊 SPEC 與程式不一致時，以程式為準並在 §12 註明。

---

## 1. 問題

辦抽獎活動的小編、自媒體與品牌，活動貼文常同時發在 Facebook、Instagram、Threads、YouTube。目前的做法多是：

- 每個平台各找一套工具，或手動把留言複製到試算表再用亂數公式抽。
- 抽獎過程無法重現，被質疑「暗箱」時拿不出證據。
- 名單一大就卡；結果公告時直接貼出完整帳號名，暴露參加者個資。

本產品要在**單一網站**把「取得留言名單 → 篩選資格 → 公平抽出 → 公告與存證」做完，四個平台用同一套流程。

## 2. 目標客群

| Persona | 情境 | 核心需求 |
|---|---|---|
| 品牌／代理商小編（主要） | 一檔活動同步發 FB／IG／Threads，抽多個獎項 | 多平台同一流程、多獎項、排除員工與重複留言、可交代的抽獎紀錄 |
| 自媒體／創作者 | YouTube 或 Threads 留言抽獎、直播後開獎 | 快速、公布畫面有節目效果、免登入 |
| 品牌行銷主管（決策者） | 需要對外證明抽獎公平 | 公證紀錄、可驗證、品牌浮水印 |

## 3. 獲利模式：免費增值（Freemium）

| 方案 | 內容 | 狀態 |
|---|---|---|
| 免費 | 單一貼文、名單上限（暫定 500 筆，**待 Sean 確認**）、基本篩選、可重現種子、本機抽獎紀錄、CSV 匯出 | M1 |
| 付費（名稱、價格**待確認**） | 大量名單（暫定上限 20,000 筆，**待確認**）、公證紀錄（可驗證存證檔，M3 加雲端存證）、品牌浮水印結果圖 | M1 只做 mock 方案門檻；M2 做浮水印與付費流程 sandbox；M3 接真實金流 |

金流供應商、定價、是否改為單次購買而非訂閱，皆**待 Sean 決定**（§13）。

## 4. 競品與差異

競品名稱與價格均未在本次重建中查證，一律標「待確認」，不得引用為事實。

| 類型 | 代表（待確認） | 價格 | 我們的差異 |
|---|---|---|---|
| 國外多平台留言抽獎網站 | Comment Picker、AppSorteos、Easypromos、Woobox 等（**待確認**是否支援 Threads、是否有繁中） | 待確認 | 繁中介面、Threads 支援、名單只在瀏覽器處理 |
| 單一平台免費抽獎小工具／瀏覽器外掛 | 待確認 | 多為免費 | 四平台同一流程、可重現種子 + 公證紀錄 |
| 手動試算表 + 亂數公式 | — | 免費 | 去重、黑名單、多獎項、公布畫面、存證一次完成 |

差異化重點（以目前程式能力為依據）：

1. **可重現**：mulberry32 種子 + Fisher–Yates（已在 `facebook-comment-picker`、`comment-flow-yt` 實作）。
2. **可驗證**：公證紀錄含參加者名單雜湊值、種子與演算法版本，可重算比對（M1 新做）。
3. **個資最小化**：名單只在瀏覽器處理，不經我方伺服器（主 repo 現行架構）。

## 5. 功能需求（FR）

狀態定義：**已實作**＝程式存在且可用；**部分**＝有程式但缺關鍵部分、有已知缺陷或不在主 repo；**未實作**＝任何 repo 都沒有。「所在 repo」縮寫：TCH＝threads-comment-helper（主）、FCP＝facebook-comment-picker、CFW＝comment-flow-web、CFY＝comment-flow-yt、SCV2＝social-comment-v2。

| FR | 需求 | 優先 | 狀態 | 所在 repo／備註 | 里程碑 |
|---|---|---|---|---|---|
| FR-001 | Threads 貼文 URL／代碼／數字 ID 解析 | P0 | 已實作 | TCH `lib/threads.ts` `extractPostId`；9 個測試 | — |
| FR-002 | Threads BYOK token：儲存（localStorage）、`/me` 驗證、清除、deep-link `?threads_token=` 匯入後清 URL | P0 | 已實作 | TCH `SetupForm.tsx`、`lib/storage.ts` | — |
| FR-003 | Threads 留言抓取：conversation 分頁、略過隱藏留言、上限 2,000 | P0 | 部分 | TCH `fetchThreadsComments`；**沒有任何 fetch 測試**；錯誤訊息直接顯示 API 原文 | M1 補測試 |
| FR-004 | Threads token 取得 CLI | P2 | 部分 | TCH `scripts/get-threads-token.mjs`；OAuth 網域寫成 `wwwthreads.com`（疑似打錯，見 §9）；`get-threads-token.test.mjs` 未 import 被測腳本 | M1 修正 |
| FR-005 | 手動貼上名單解析（`名字 \| 留言`、`名字, 留言`、只有名字） | P0 | 部分 | FCP/CFW/CFY `parseComments`；主 repo 無 | M1 搬入 |
| FR-006 | CSV 匯入（RFC 4180，含引號、逗號、跳脫） | P0 | 部分 | CFY `parseCSV` 符合 RFC 4180；FCP 為簡單 `split(',')`；主 repo 無 | M1 搬 CFY 版 |
| FR-007 | 排除關鍵字（不分大小寫，比對名字＋留言） | P0 | 已實作 | TCH `lib/draw.ts`；FCP `applyFilters` | M1 統一 |
| FR-008 | 必含關鍵字、黑名單姓名、黑名單關鍵字 | P0 | 部分 | FCP `applyFilters`（必含＝任一符合）；SCV2 必含＝全部符合，語意不同（§13）；主 repo 無 | M1 搬入 |
| FR-009 | 去重 4 模式：同名／同留言／同名＋同留言／不去重 | P0 | 部分 | FCP；主 repo 無 | M1 搬入 |
| FR-010 | 多獎項設定（`獎項 \| 數量`），中獎者對應獎項 | P1 | 部分 | FCP/CFY `parsePrizes`、`expandPrizeSlots` | M1 搬入 |
| FR-011 | 可重現種子抽獎（mulberry32 + Fisher–Yates）；未填種子時自動產生並顯示 | P0 | 部分 | FCP/CFY 有種子；未填時用 `Math.random` 且不記錄；TCH 只用 `Math.random`；SCV2 用有偏差的 `sort(() => Math.random() - 0.5)` | M1 |
| FR-012 | 中獎者卡片（頭像、帳號、留言） | P0 | 已實作 | TCH `ResultsView.tsx` | M1 加獎項欄 |
| FR-013 | 複製結果、匯出 CSV（UTF-8 BOM）、匯出 JSON | P0 | 部分 | FCP（複製＋CSV＋JSON）、CFY（複製＋CSV）；主 repo 無 | M1 搬入 |
| FR-014 | 公布模式：逐位輪播揭曉 | P1 | 部分 | FCP `PresentationOverlay` | M1 搬入 |
| FR-015 | 本機抽獎紀錄（最多 20 筆）與清除 | P1 | 部分 | FCP `drawSessions`（`fb_comments_v1`）；無清除全部按鈕 | M1 搬入 |
| FR-016 | YouTube Data API v3 抓留言（使用者自帶 API key、上限 1,000、錯誤原因中文提示） | P1 | 部分 | CFY `fetchAllComments`、`translateYouTubeError`；無 fetch 測試 | M1 搬入（mock 測試） |
| FR-017 | Facebook 粉專 OAuth、選粉專／貼文、抓留言 | P1 | 部分 | FCP `api/facebook/*` + `PageSelectorModal`；`pages_show_list`／`pages_read_engagement` 需 Meta App Review，現況授權失敗（FCP `SPEC_DRIFT.md` 附錄 C） | M2（審核通過後） |
| FR-018 | Instagram 留言抓取 | P1 | 未實作 | 任何 repo 都沒有 | M2（審核通過後） |
| FR-019 | 單一網站平台切換：FB／IG／Threads／YT，各平台至少支援「貼上名單／CSV」 | P0 | 未實作 | — | M1 |
| FR-020 | 統一參與者資料模型 `Participant`（平台、名稱、留言、時間、頭像、來源 ID） | P0 | 未實作 | TCH `DrawCandidate` 與 FCP `{name, comment, age}` 不相容 | M1 |
| FR-021 | 公證紀錄 v0：`DrawRecord`（演算法版本、種子、時間、條件、名單 SHA-256、中獎者）＋驗證功能 | P0 | 部分 | FCP JSON 匯出含種子，但無雜湊、無驗證 | M1 |
| FR-022 | 大量名單（付費）：20,000 筆內順暢運作 | P1 | 未實作 | 現有上限：TCH 2,000、CFY 1,000 | M1（mock 門檻） |
| FR-023 | 方案門檻（免費／付費），以 mock entitlement 控制 | P1 | 未實作 | — | M1 mock；M3 真實 |
| FR-024 | 品牌浮水印：中獎結果圖輸出加品牌 logo／文字 | P1 | 未實作 | — | M2 |
| FR-025 | 中獎公告姓名遮罩（例：王*明、@ab***） | P1 | 未實作 | — | M1 |
| FR-026 | 付費與金流 | P2 | 未實作 | — | M2 sandbox／M3 正式 |
| FR-027 | 介面中英切換 | P2 | 部分 | FCP `src/lib/i18n.js` 字典存在但 `App.jsx` 未使用 | M3 |
| FR-028 | 伺服器端 API 速率限制 | P2 | 部分 | FCP `api/_lib/rate-limit.js`（記憶體型，冷啟動即重置） | M2（有 API route 時） |

## 6. 非功能需求

| 面向 | 需求 | 現況 |
|---|---|---|
| 效能 | 20,000 筆名單的解析＋篩選＋抽獎在一般筆電瀏覽器 < 2 秒；Lighthouse Mobile Performance ≥ 90 | TCH README 記載 2026-08-10 Mobile 100／Desktop 94，本次未重測 |
| 公平性 | 只能用無偏差的 Fisher–Yates；隨機來源可記錄、可重算；禁用 `sort(() => Math.random() - 0.5)` | SCV2 違反；FCP `api/draw.js` 與前端 PRNG 實作不同（同種子結果不同） |
| 隱私 | 名單只在瀏覽器處理；不加第三方 analytics；不存伺服器 | TCH 符合 |
| 安全 | token／API key 不放 URL query 傳給我方伺服器；OAuth 回跳網址不得依 Referer 決定；加 CSP 等安全標頭 | TCH 尚無安全標頭；FCP 有 `vercel.json` 標頭可參考 |
| 無障礙 | 鍵盤可操作全流程；表單有 label；揭曉動畫可關閉 | 未驗證 |
| 瀏覽器 | 近兩版 Chrome／Edge／Safari／Firefox，手機寬度可用 | TCH 有 RWD |
| 可維護 | TypeScript strict；`lib/` 純函式無 React 依賴並有單元測試 | TCH 符合 |

## 7. 資料與個資處理

留言者的帳號名稱、顯示名稱、頭像網址、留言內容，以及可連回個人的平台 ID，**都屬個人資料**（適用《個人資料保護法》；若服務歐盟使用者另需評估 GDPR，**待確認**）。

| 資料 | 來源 | 存放 | 保存期間 | 規則 |
|---|---|---|---|---|
| 參與者名單 | 平台 API（使用者自帶憑證）或使用者貼上／上傳 | 瀏覽器記憶體 | 關閉分頁即消失 | 不送我方伺服器 |
| 抽獎紀錄（含中獎者名稱） | 抽獎結果 | localStorage | 最多 20 筆，可一鍵清除 | 匯出前提示「檔案含個資」 |
| 公證紀錄 | 抽獎結果 | 使用者下載的 JSON | 由使用者保管 | 只存名單雜湊值，不存完整名單；中獎者名稱可選遮罩 |
| 平台 token／API key | 使用者自行提供 | localStorage | 使用者清除為止 | 不送我方伺服器、不寫入 log、不放 URL（deep-link 匯入後立即清除，現行實作） |

- 開發、測試、文件、截圖一律使用明顯假資料（例：`測試用戶A`、`@demo_user_01`）。
- 公告畫面預設提供姓名遮罩選項（FR-025）。
- 不蒐集參與者 email、電話；若未來做「得獎者聯絡表單」須另立個資告知與同意流程（M3 之後另案）。

## 8. 法規與風險

| 風險 | 說明 | 對策 |
|---|---|---|
| Meta（FB／IG／Threads）平台政策 | 讀取粉專／IG 留言需 `pages_read_engagement` 等權限並通過 App Review；FCP 實測 dev mode 也出現 Invalid Scopes。Threads 讀取他人貼文回覆的權限範圍與審核要求**待確認** | M1 不依賴 FB／IG 官方 API（貼上名單）；Threads 維持使用者自帶 token；M2 才送審 |
| 爬取違反條款 | FCP `api/fetch-comments.js` 透過 r.jina.ai 擷取 FB 公開頁面、或用 RapidAPI 第三方爬蟲，可能違反 Meta 服務條款 | 不搬；列為禁止做法 |
| YouTube API 條款與配額 | 使用者自帶 API key，每日配額有上限（CFY 程式內提示 10,000 units，**待確認**是否仍為現行值） | 顯示配額錯誤提示；不代管 key |
| 抽獎公平性與爭議 | 有偏差的洗牌、不可重現的結果、前後端演算法不一致 | 單一演算法實作＋種子＋公證紀錄＋統計檢定測試 |
| 抽獎活動法規 | 台灣有獎活動可能涉及稅務（中獎扣繳）、公平交易法廣告規範，屬活動主辦方責任，**待確認**是否需在產品內提示 | 產品內放「主辦方須自行遵守法規」提示（M3 法務文件） |
| 平台自身抽獎規則 | Meta 對粉專舉辦推廣活動有規範（例如不得要求分享到個人動態時報，**待確認**現行條文） | M3 在使用說明中提示 |
| 免費替代品多 | Notion 已列主要風險 | 以「四平台同流程＋公證紀錄＋繁中＋個資遮罩」區隔；付費只鎖大量名單、存證、浮水印 |
| 憑證外洩 | token 放 URL query 會進 server log 與瀏覽紀錄 | 不搬 FCP `fetch-comments.js`、`callback.js`、SCV2 OAuth callback 的做法 |

## 9. 已知技術債與安全問題（以程式為準）

1. TCH `scripts/get-threads-token.mjs`：授權與 redirect 網址寫成 `https://wwwthreads.com/...`（少一個點），授權碼可能被送到非 Meta 網域。M1 須改為 Meta 官方文件所列網域（開工時對照官方文件確認），redirect URI 改為使用者自己的網址。
2. TCH `scripts/get-threads-token.test.mjs` 沒有 import 被測腳本，只是在測試檔內重寫同一段邏輯；真正跑腳本的是 `get-threads-token.e2e.mjs`（可通過，但未納入 `npm test`）。
3. TCH `npm run typecheck` 在乾淨 checkout 失敗（`LayoutProps` 由 Next 產生型別，需先 `next build` 或 `next typegen`）。
4. TCH CI：`npm test -- --run 2>&1 || echo "no test script"` 會吞掉失敗；lint 設 `continue-on-error`；CI 未跑 typecheck。CI 綠燈不代表測試通過。
5. FCP／CFW／CFY：`index.html` 已在 2026-09-06 被換成跳轉到 `dashboard.html`（與產品無關的通用 KPI 樣板），Vite 不再打包 React 應用；FCP 本次 `npm run build` 產物只有 `index.html` 與 `dashboard.html`。
6. FCP `api/draw.js` 的 mulberry32 少了 `0x6d2b79f5` 遞增，與 `src/lib/lottery.js` 不同：同一個種子在前端與後端抽出不同結果；且未套用黑名單關鍵字。
7. FCP `api/facebook/callback.js`：依 `Referer` 決定回跳網域並把 token 放在 query string（`?fb_token=`），可能把 token 送到任意網域。
8. SCV2：`/lottery` 洗牌有偏差；OAuth callback 把 token 放進 `/lottery?step=2&token=`；首頁使用寫死在前端的登入密碼（`src/app/page.tsx`）。
9. CFY `scripts/verify-smoke.py`：寫死本機路徑 `/Volumes/...`，且依賴的程式標記已不存在，目前無法執行。

## 10. 里程碑

### M1 — 單一網站抽獎核心整合（本次 GOAL.md）

把四個 repo 的抽獎能力收斂到主 repo：四平台入口（FB／IG 以貼上名單或 CSV 處理）、Threads 與 YouTube 以使用者自帶憑證抓取（測試全用 mock）、完整篩選／去重／多獎項／種子、結果輸出、公布模式、本機抽獎紀錄、公證紀錄 v0、大量名單 mock 門檻、姓名遮罩、Threads CLI 安全修正、可重跑的驗證指令。詳見 `GOAL.md`。

### M2 — 官方 API 與付費功能雛形

- 送 Meta App Review；通過後實作 FB 粉專（FR-017，參考 FCP `api/facebook/*`、`PageSelectorModal`）與 IG（FR-018），伺服器端 token 交換用 HttpOnly cookie，不放 URL。
- 品牌浮水印結果圖（FR-024）。
- 方案與付款流程以金流商 sandbox 實作（FR-026），供應商待 Sean 決定。
- API route 加速率限制（FR-028）與安全標頭。

### M3 — 上市

- 正式金流、定價頁、服務條款與隱私權政策（含個資告知）。
- 公證紀錄雲端存證（付費），保存期間與刪除流程另定。
- 正式網域與部署、錯誤監控（不蒐集名單內容）、中英介面（FR-027）。
- repo 改名或新網域（產品名與 repo 名不一致，待 Sean 決定）。

## 11. 成功指標

目標值都是建議值，**待 Sean 確認**；不是市場數據。

| 階段 | 指標 | 量測方式 | 建議目標 |
|---|---|---|---|
| M1 | 四平台貼上名單 → 抽獎 → 匯出全流程 E2E 通過 | `npm run e2e` | 4/4 |
| M1 | 抽獎核心單元測試數與通過率 | `npm test` | 移植測試 100% 通過、無刪減斷言 |
| M1 | 20,000 筆名單處理時間 | 單元測試計時 | < 2 秒 |
| M3 | 每月完成抽獎次數 | 隱私友善的匿名計數（不含名單） | 待確認 |
| M3 | 免費轉付費比例 | 金流紀錄 | 待確認 |
| M3 | 抽獎爭議時能提出公證紀錄的比例 | 使用者回報 | 待確認 |

## 12. 舊文件與程式不一致處

| 文件 | 文件寫 | 程式實際 |
|---|---|---|
| 舊 SPEC v3.0.2 §2.2 | deep-link 參數 `?token=` | `?threads_token=`（`SetupForm.tsx`） |
| 舊 SPEC §2.2 | token 過期顯示「token 過期或無效,請重新驗證」 | 直接顯示 API 回傳的錯誤原文 |
| 舊 SPEC §5.3 | rate limit 顯示 retry-after；離線可用 localStorage 候選池重抽 | 都沒有實作；候選名單只在記憶體 |
| 舊 SPEC §1.4／§8 | 不做跨平台、不做付費牆 | 與 Notion 商品方向衝突，本版改寫 |
| 舊 SPEC §6 | CLI OAuth e2e 測試通過 | `npm test` 只跑未 import 腳本的 `get-threads-token.test.mjs`；真正 e2e 檔未納入 |
| TCH README 架構段 | `layout.tsx` 使用 Noto Sans TC | 使用系統字型堆疊（README 後段有說明） |
| TCH README | OAuth 網址 `wwwthreads.com` | 與程式一致，但疑似錯誤網域（§9-1） |
| FCP README | 單一 `index.html` 直接開啟使用 | Vite + React + Vercel serverless；且目前入口跳轉到無關樣板（§9-5） |
| SCV2／social-auto-reply README | create-next-app 預設內容 | 實際為留言自動回覆系統 |

## 13. 待確認事項

1. 免費方案名單上限（暫定 500）與付費上限（暫定 20,000）。
2. 必含關鍵字語意：「任一符合」（FCP）或「全部符合」（SCV2），或兩者都提供切換。
3. 金流供應商與定價模式（訂閱或單次）。
4. 是否送 Meta App Review、由誰準備審核影片與隱私權政策網址。
5. repo 是否改名為 `comment-flow`；舊網址 `threads-comment-helper.vercel.app`、`fb-giveaway-v2.vercel.app` 的處理方式。
6. 待併入的 FCP／CFW／CFY 在 M1 搬遷完成後是否封存（本次不動任何 repo）。
7. 留言自動回覆三個 repo 是否另立產品。
8. 競品清單與價格需另行查證。

## 14. 合併清單

### 14.1 各 repo 實際已實作功能（2026-11-16 讀程式）

| Repo | HEAD | 技術棧 | 實際功能 | 測試 |
|---|---|---|---|---|
| threads-comment-helper（主） | `75b2f8a` | Next.js 16.3、React 19、TS、Tailwind 4 | Threads 單平台：URL 解析、BYOK token、抓回覆、排除關鍵字、Math.random 抽 N 位、三步驟 UI、token CLI | vitest 18 個通過；CLI 測試 3 項通過；e2e 腳本另跑通過 |
| facebook-comment-picker | `643f6d7` | Vite 5、React 18、JS、Vercel serverless | 抽獎核心 lib（解析、獎項、4 去重、必含／排除／黑名單、種子洗牌）、三分頁 UI、CSV 匯入、公布模式、紀錄、複製／CSV／JSON 匯出、FB SDK 登入、選粉專 Modal、9 個 API（FB OAuth／粉專／貼文／留言、抽獎、CSV、爬取、速率限制）。**目前建置入口已不含 React 應用** | vitest 40 個通過 |
| comment-flow-web | `40d1ec4` | 同 FCP，無 API | FCP 前端的複本（GitHub Pages 版），差異僅 FB SDK 載入等待邏輯 | 30 個（與 FCP 相同測試檔） |
| comment-flow-yt | `7085cfa` | Vite 5、React 18、JS | YouTube Data API v3 抓留言（BYOK key）、RFC 4180 CSV、YT 網址解析、種子抽獎、多獎項、篩選、複製／CSV 匯出、localStorage 狀態 | 無 `test` script；`verify-smoke.py` 無法執行 |
| social-comment-v2 | `2784fe6` | Next.js 16.2、TS | 留言自動回覆（關鍵字規則、審核列、歷史、OpenAI 產生回覆）＋一頁 FB 抽獎（有偏差洗牌） | 無 |
| social-comment-auto-reply | `faf1f07` | Next.js 16.2、TS | 自動回覆規則設計器（比對、FAQ、敏感詞、情緒、A/B、匯出入、bookmarklet） | node:test 51 個（STATUS 記載，本次未重跑） |
| social-auto-reply | `37ae180` | Next.js、TS | create-next-app + 假資料儀表板；側欄連到不存在的 `/lottery` | 無 |
| social-cli-factory | `85195d7` | 只有文件 | LINE／FB／Threads 發文 CLI 規格書，無程式 | 無 |

### 14.2 要搬進主 repo 的功能（M1）

主 repo 已有的（Threads 解析／token／抓取、排除關鍵字、中獎卡片、Stepper）不重複列。

| 來源 | 模組 | 搬法 | 對應 FR |
|---|---|---|---|
| FCP `src/lib/lottery.js` | `parseList`、`parsePrizes`、`expandPrizeSlots`、`parseComments`、`hashString`、`mulberry32`、`shuffle`、`applyFilters` | 改寫為 TS 放 `lib/`；`lottery.test.js`（26）與 `shuffle.test.js`（4）移植為 vitest，斷言不刪 | FR-005、007–011 |
| FCP `src/App.jsx` | 條件設定分頁、結果分頁（複製／CSV／JSON 匯出）、`PresentationOverlay` 公布模式、`drawSessions` 紀錄 | 依主 repo 設計系統重寫為 TSX 元件，不直接複製 JSX | FR-010、013–015 |
| FCP `api/facebook/parse-post.js` | `extractPostId`（FB 網址解析） | 搬到 `lib/platforms/facebook.ts`，供來源網址正規化與公證紀錄使用 | FR-019、021 |
| FCP `vercel.json` | 安全標頭（CSP、HSTS、X-Frame-Options 等） | 改寫到 `next.config.ts` headers，CSP 改放行 Threads／YouTube 網域 | 非功能需求 |
| CFY `src/lib/lottery.js` | `parseCSV`、`csvEscape`、`splitOnFirst`、`parseYouTubeUrl`、`stripHtml`、`translateYouTubeError`、`timestampFile` | 改寫為 TS；`verify-smoke.py` 的斷言改寫為 vitest | FR-006、013、016 |
| CFY `src/App.jsx` | `fetchVideoInfo`、`fetchCommentsPage`、`fetchAllComments`（YouTube Data API v3） | 搬到 `lib/platforms/youtube.ts`，測試用 mock fetch | FR-016 |

### 14.3 不搬及原因

| 來源 | 項目 | 原因 | 處置 |
|---|---|---|---|
| FCP | `api/fetch-comments.js` | 經 r.jina.ai／RapidAPI 爬取 FB，條款風險；token 與 API key 走 query string | 不搬 |
| FCP | `api/draw.js`、`api/import/csv.js` | 與前端邏輯重複；`draw.js` PRNG 與前端不一致；CSV 解析不符 RFC 4180 | 不搬 |
| FCP | `api/facebook/{auth,callback,accounts,page-posts,page-comments}.js`、`PageSelectorModal.jsx`、`api/_lib/rate-limit.js` | 需 Meta App Review；`callback.js` 有 token 外洩風險 | M2 參考重寫，M1 不搬 |
| FCP | `Toast.jsx`、`Skeleton.jsx`、`i18n.js`、`icons.jsx`、`constants.js` | 主 repo 已有設計系統；`i18n.js` 未被使用；`constants.js` 範例資料含品牌名，需改假資料 | 重寫，不搬 |
| FCP／CFW／CFY | `dashboard.html`、跳轉用 `index.html`、`scripts/postbuild.mjs` | 與產品無關的通用樣板 | 不搬 |
| CFW | 全部 | 與 FCP 前端重複；唯一差異（FB SDK 等待）屬 M2 | 不搬；M1 完成後列封存候選 |
| CFY | `verify-smoke.py` | 寫死本機路徑、目前無法執行 | 斷言改寫為 vitest，腳本不搬 |
| SCV2 | `/lottery` 頁與 `api/facebook/*` | 洗牌有偏差、token 放 URL、功能已被 FCP 涵蓋；必含關鍵字「全部符合」語意列為待確認 | 不搬 |
| SCV2 | 自動回覆頁面、`api/generate-reply` | 屬「留言自動回覆」，與抽獎無關 | 不搬，列為另案或封存候選 |
| social-comment-auto-reply | 全部 | 屬「留言自動回覆」；若另立自動回覆產品，此 repo 是三者中最完整的基礎（有測試、有 STATUS） | 不搬，列為另案 |
| social-auto-reply | 全部 | create-next-app + 假資料儀表板，無實際功能；`/lottery` 為死連結 | 不搬，封存候選 |
| social-cli-factory | 全部 | 只有發文 CLI 規格書，無程式，與抽獎無關 | 不搬，列為另案或封存候選 |

### 14.4 主 repo 選擇評估

結論：**維持 threads-comment-helper 為主 repo，但抽獎邏輯以 facebook-comment-picker 為主要來源**。

- FCP 的抽獎功能最完整（40 個測試），但技術棧較舊（React 18、Vite 5、JS），且目前建置入口已不含 React 應用，部署現況比主 repo 差。
- 主 repo 是 TypeScript strict + Next.js 16，`lib/` 純函式可測，lint／build 可過，之後做 M2 的伺服器端 OAuth 可直接用 Next route handler。
- 代價：FCP 的 UI 需要用 TSX 重寫，不能直接搬。若 Sean 偏好最快上線而非長期維護，替代方案是以 FCP 為主、修回 `index.html` 入口並把 Threads 功能搬過去；本文件不採用此方案。
- repo 名稱 `threads-comment-helper` 與多平台產品不符，建議 M3 前改名（§13-5），本次不改。
