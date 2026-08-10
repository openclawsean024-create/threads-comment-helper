# Threads 留言抽籤 · Comment Flow

從 Threads 公開貼文留言中隨機抽出 N 位中獎者。

設計系統:**珊瑚紅 #ff6666** + **深藍 #204272** + Noto Sans TC + 玻璃卡 + pill + 三步驟 Stepper。

技術棧:Next.js 16 + React 19 + Tailwind 4 + Threads Graph API。

> 屬於 [Comment Flow](https://github.com/openclawsean024-create) 產品線,FB / YT 版的姊妹作。

## 為什麼需要 Access Token?

Threads Graph API 沒有任何「免登入公開抓留言」的端點,即使是公開貼文也必須用一個 Threads **User Access Token** 才能呼叫 `/v1.0/{post-id}/conversation` + replies。

**我們不做後端代理**,token 只會存進你的 `localStorage`,直接從你的瀏覽器送給 `graph.threads.net`。

## 如何取得 Threads Access Token

1. 到 [developers.facebook.com](https://developers.facebook.com) → 註冊/登入 → 建立一個 App(類型選 **Business** 或 **Other**)→ 啟用 **Threads** 產品。
2. 在 Threads API 設定頁取得 **App ID / Secret**,把以下網址貼到「授權重新導向 URI」:
   ```
   https://wwwthreads.com/oauth/redirect
   ```
3. 用 [Threads 帳號工具](https://www.threads.com/threads/settings/accounts_center) 或 [Graph API Explorer](https://developers.facebook.com/tools/explorer/) 走 OAuth flow,需要的 scope:
   - `threads_basic`
   - `threads_read_replies`
4. 把回傳的 **Long-lived User Access Token** 貼到本工具的「儲存並驗證」欄位,token 會存進 localStorage。

> 不要把 token 給別人。本工具連後端都沒有,server 完全看不到你的 token。

## 本地開發

```bash
npm install --legacy-peer-deps
npm run dev
# http://localhost:3000
```

## 部署到 Vercel

```bash
npx vercel deploy --prod --yes --token $VERCEL_TOKEN
```

(VERCEL_TOKEN 在 [Vercel Account Settings → Tokens](https://vercel.com/account/tokens) 產生。)

## 端到端驗證 SOP(30 秒)

部署後到 `https://threads-comment-helper.vercel.app/` 跑一次:

1. **貼一個公開 Threads 貼文 URL** — 例如 https://www.threads.net/@threads/post/DQK6QDCqDeN
2. **貼你的 Long-lived Threads Access Token**(見上節)
3. **按「儲存並驗證」** — 應顯示「已連線 · @你的帳號」
4. **抽幾位設成 1**、加或不加排除關鍵字
5. **「下一步:開始抽籤 →」 → 「開始抽籤」**
6. **確認中獎者卡片**: 顯示頭貼 + @username + 留言內容
7. **F12 → Console → 0 error**

如果中獎者卡片**沒出現**,先看卡片區上方的紅色 alert 條(顯示 Threads API 錯誤訊息,例如 401 = token 沒 `threads_read_replies` scope、190 = token 過期)。

## Lighthouse(已驗證 2026-08-10)

| 模式 | Performance | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|
| Mobile | **99** | 1.1s | 2.0s | 0ms | 0 |
| Desktop | **90** | 1.1s | 1.9s | 0ms | 0 |

跑法:
```bash
CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
npx lighthouse https://threads-comment-helper.vercel.app/ \
  --only-categories=performance \
  --form-factor=mobile --throttling-method=simulate \
  --chrome-flags="--headless=new --no-sandbox" \
  --output=json --output-path=./lh-mobile.json --quiet
```

## 架構

```
app/
  page.tsx               主畫面 (Stepper + 表單 + 結果)
  layout.tsx             Noto Sans TC + metadata
  globals.css            設計系統 (顏色 / 玻璃卡 / pill / 動畫)
  components/
    Stepper.tsx          三步驟進度條
    SetupForm.tsx        貼文 URL + Token + 設定
    ResultsView.tsx      抽籤中 + 中獎者卡片
lib/
  threads.ts             Graph API client (extractPostId + fetchThreadsComments + validateToken)
  draw.ts                抽籤 (filterCandidates + drawWinners)
  storage.ts             localStorage helpers (token + 設定)
```

## License

MIT