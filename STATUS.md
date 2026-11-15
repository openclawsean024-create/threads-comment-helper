# Status — Comment Flow 社群留言抽獎

- 產品名稱：Comment Flow 社群留言抽獎
- Repo：`openclawsean024-create/threads-comment-helper`（預設分支 `main`）
- 狀態：🟡 **文件重建完成、尚未開發**（2026-11-16）
- 規格：`PRD/SPEC.md` v4.0；目標：`GOAL.md`（M1）
- 技術棧：Next.js 16.3 + React 19 + TypeScript strict + Tailwind 4 + Vitest 5

## 與 Notion 商品資料庫的對應

| Notion 欄位（資料庫「可產品化商品」） | 值 | 本 repo 對應 |
|---|---|---|
| 產品名稱 | Comment Flow 社群留言抽獎 | SPEC 標題；repo 名稱尚未改（SPEC §13-5） |
| 優先順序 | P2 | — |
| 開發順位 | 第 5 個 | — |
| 主 repo | threads-comment-helper | 本 repo；選擇評估見 SPEC §14.4（維持） |
| 要併入的 repo | facebook-comment-picker、comment-flow-web、comment-flow-yt、social-comment-auto-reply、social-comment-v2、social-auto-reply、social-cli-factory | SPEC §14：前三者搬抽獎功能（CFW 與 FCP 重複）；後四者屬自動回覆，不搬 |
| 獲利潛力／模式 | 中／免費增值 | SPEC §3 |
| 目標客群 | 辦抽獎活動的小編、自媒體、品牌 | SPEC §2 |
| 現況完成度 | 60 | 本次以程式盤點：主 repo 只有 Threads 單平台；抽獎完整功能在 FCP，但 FCP 目前建置入口不含應用（SPEC §9-5） |
| 上市前要補 | 合併成單一網站支援 FB／IG／Threads／YT；付費功能（大量名單、公證紀錄、品牌浮水印） | 單一網站 → M1 AC-001；大量名單 → M1 AC-007（mock 門檻）；公證紀錄 → M1 AC-006（v0）、M3 雲端存證；品牌浮水印 → M2 |
| 主要風險 | 各平台 API 權限與審核；免費替代品多 | SPEC §8 |

## 本次增量（文件重建，分支 `chore/prd-rebuild`）

- 閱讀主 repo 與 7 個待併入 repo 的程式（頁面、元件、lib、API、測試、package.json scripts），產出合併清單（SPEC §14）。
- 改寫 `PRD/SPEC.md`（v3.0.2 → v4.0）、`AGENTS.md`（保留 Next.js 自動產生區塊）；新增 `GOAL.md`、`SOP.md`、`STATUS.md`。
- 未修改任何程式、設定或測試；`PRD/CHANGELOG.md` 未動。

## FR 對照（詳見 SPEC §5）

| 狀態 | FR |
|---|---|
| 已實作（主 repo） | FR-001 Threads 網址解析、FR-002 Threads token、FR-007 排除關鍵字、FR-012 中獎卡片 |
| 部分（主 repo 有缺陷或功能在其他 repo） | FR-003 Threads 抓取（無測試）、FR-004 token CLI（網域疑誤）、FR-005 貼上名單、FR-006 CSV、FR-008 必含／黑名單、FR-009 去重、FR-010 多獎項、FR-011 種子、FR-013 匯出、FR-014 公布模式、FR-015 紀錄、FR-016 YouTube、FR-017 FB OAuth（需審核）、FR-021 公證紀錄、FR-027 i18n、FR-028 速率限制 |
| 未實作 | FR-018 Instagram、FR-019 四平台單一網站、FR-020 統一參與者模型、FR-022 大量名單、FR-023 方案門檻、FR-024 品牌浮水印、FR-025 姓名遮罩、FR-026 金流 |

## Deterministic checks（2026-11-16，`main` @ `75b2f8a`，本機 Node v26.13.1）

| Command | Exit | Evidence |
|---|---:|---|
| `npm ci --legacy-peer-deps` | 0 | 安裝完成 |
| `npm run lint` | 0 | 無錯誤 |
| `npm run typecheck`（乾淨 checkout） | 2 | `app/layout.tsx` 找不到 `LayoutProps` |
| `npx next typegen` → `npm run typecheck` | 0 / 0 | 產生型別後通過 |
| `npm test` | 0 | vitest 2 檔 18 個通過；CLI 測試 3 項通過 |
| `node scripts/get-threads-token.e2e.mjs` | 0 | 5 項檢查通過 |
| `npm run build` | 0 | Next.js 16.3.0 靜態輸出 `/`、`/_not-found` |
| `npm run e2e` | — | 尚未配置 |

參考（待併入 repo，只讀）：`facebook-comment-picker` @ `643f6d7` 的 `npm test` exit 0（40 個通過）；`npm run build` exit 0，但產物只有跳轉用 `index.html` 與樣板 `dashboard.html`，不含 React 應用。

## 風險與發現

- **疑似錯誤 OAuth 網域**：`scripts/get-threads-token.mjs` 與 README 使用 `wwwthreads.com`（GOAL AC-009）。
- **CI 吞錯**：test 步驟失敗會被 `|| echo` 吞掉；lint 不擋；無 typecheck。
- **README 與程式不一致**：見 SPEC §12。
- **待併入 repo 的安全問題**（不搬，僅記錄）：FCP `api/facebook/callback.js` 依 Referer 回跳並把 token 放 query；FCP `api/fetch-comments.js` 爬取 FB；SCV2 token 放 URL、洗牌有偏差、`src/app/page.tsx` 前端寫死登入密碼。
- **憑證掃描**：本次以常見 token 格式掃描 8 個 repo 的完整 git 歷史，未發現真實 token；主 repo `docs/lighthouse/*.json` 的命中為圖片 base64 誤判；FCP 歷史曾提交 `.env`，內容為佔位值。FCP `SPEC_DRIFT.md` 記載 Meta App ID（公開識別碼，非機密）。

## 下一步

1. Sean 覆審 `GOAL.md` 與 SPEC §13 待確認事項（免費名單上限、必含關鍵字語意、金流、App Review、repo 改名）。
2. 核可後依 GOAL AC-001～AC-010 開發 M1，每個搬入模組在此記錄來源 repo 與 commit SHA。
3. M1 Exit gate 通過前不開始 M2。
