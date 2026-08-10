#!/usr/bin/env node
/**
 * get-threads-token.mjs
 *
 * 一鍵拿 Threads Long-lived User Access Token,給 Comment Flow (Threads 留言抽籤) 用。
 *
 * 流程:
 *   1. 讀 THREADS_APP_ID + THREADS_APP_SECRET(環境變數或互動式輸入)
 *   2. 印出 OAuth 授權 URL,Sean 在瀏覽器打開、登入 Threads、按「允許」
 *   3. Threads 會 redirect 回 https://wwwthreads.com/oauth/redirect?code=XXXXX
 *      (需要 Threads App 設定裡有這個 Redirect URI)
 *   4. Sean 把整個 redirect URL(或只 code= 後面那段)貼回來
 *   5. 腳本用 App Secret 換 Short-lived → Long-lived token
 *   6. 印出 long-lived token,Sean 貼進 web app 的「儲存並驗證」欄位
 *
 * Usage:
 *   THREADS_APP_ID=1234567890 THREADS_APP_SECRET=abc... \
 *     node scripts/get-threads-token.mjs
 *
 * 或互動輸入(不建議 — secret 會進 shell history):
 *   node scripts/get-threads-token.mjs
 *
 * 必備的 Threads App 設定:
 *   - Products → Threads → 啟用
 *   - Threads → API setup → Redirect URI: https://wwwthreads.com/oauth/redirect
 *   - 權限 scope: threads_basic, threads_read_replies
 */

import { createInterface } from "node:readline/promises";
import { stdin, stdout, stderr, exit } from "node:process";

const REDIRECT_URI = "https://wwwthreads.com/oauth/redirect";
const SCOPES = ["threads_basic", "threads_read_replies"];
const AUTH_BASE = "https://wwwthreads.com/oauth/authorize";
const TOKEN_BASE = "https://graph.threads.net/oauth/access_token";

function log(msg) {
  stdout.write(msg + "\n");
}
function warn(msg) {
  stderr.write("⚠ " + msg + "\n");
}
function err(msg) {
  stderr.write("✗ " + msg + "\n");
}

async function readEnvOrPrompt(name, rl) {
  const fromEnv = process.env[name];
  if (fromEnv && fromEnv.length > 0) return fromEnv.trim();
  return rl.question(`請輸入 ${name}: `);
}

async function main() {
  const rl = createInterface({ input: stdin, output: stderr }); // prompt 走 stderr 不污染 stdout log
  try {
    log("=== Threads Token Helper · Comment Flow ===\n");
    log("📋 前置:你的 Threads App 必須啟用 + Redirect URI 設為:");
    log("    " + REDIRECT_URI);
    log("  需要的 scope: " + SCOPES.join(", "));
    log("");

    const appId = await readEnvOrPrompt("THREADS_APP_ID", rl);
    if (!/^\d{10,20}$/.test(appId)) {
      err(`THREADS_APP_ID 看起來不像 Meta App ID(應是純數字): ${appId.slice(0, 6)}...`);
      exit(1);
    }
    const appSecret = await readEnvOrPrompt("THREADS_APP_SECRET", rl);
    if (appSecret.length < 16) {
      err(`THREADS_APP_SECRET 太短(${appSecret.length} 字元),放錯了嗎?`);
      exit(1);
    }

    // 1. 印授權 URL
    const authUrl = new URL(AUTH_BASE);
    authUrl.searchParams.set("client_id", appId);
    authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
    authUrl.searchParams.set("scope", SCOPES.join(","));
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("state", "comment-flow-helper");

    log("\n🔗 在瀏覽器打開這個 URL、登入 Threads、按「允許」:");
    log("");
    log(authUrl.toString());
    log("");

    // 2. 收回 callback URL 或 code
    const rawInput = (await rl.question("📥 貼上 redirect 後的整個 URL(或只 ?code= 後那串): ")).trim();
    if (!rawInput) {
      err("沒收到輸入");
      exit(1);
    }

    let code;
    if (rawInput.startsWith("http")) {
      try {
        const u = new URL(rawInput);
        code = u.searchParams.get("code");
        const errParam = u.searchParams.get("error");
        if (errParam) {
          err(`Threads 回傳 error: ${errParam} ${u.searchParams.get("error_description") || ""}`);
          exit(1);
        }
      } catch {
        err("URL parse 失敗");
        exit(1);
      }
    } else {
      code = rawInput;
    }

    if (!code) {
      err("找不到 ?code= 參數。貼錯了嗎?");
      exit(1);
    }

    // 3. 換 short-lived token
    log("\n⏳ 換 Short-lived token…");
    const shortRes = await fetch(TOKEN_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: appId,
        client_secret: appSecret,
        grant_type: "authorization_code",
        redirect_uri: REDIRECT_URI,
        code,
      }),
    });
    const shortJson = await shortRes.json().catch(() => ({}));
    if (!shortRes.ok || !shortJson.access_token) {
      err(`Short-lived token 失敗: HTTP ${shortRes.status}`);
      err(JSON.stringify(shortJson, null, 2));
      exit(1);
    }
    const shortToken = shortJson.access_token;
    log(`✓ Short-lived token 拿到 (${shortToken.length} chars, ${shortToken.slice(0, 6)}…)`);

    // 4. 換 long-lived token (60 天有效)
    log("\n⏳ 換 Long-lived token(60 天有效)…");
    const longRes = await fetch(
      `${TOKEN_BASE}?grant_type=th_exchange_token&client_secret=${encodeURIComponent(appSecret)}&access_token=${encodeURIComponent(shortToken)}`,
    );
    const longJson = await longRes.json().catch(() => ({}));
    if (!longRes.ok || !longJson.access_token) {
      err(`Long-lived token 失敗: HTTP ${longRes.status}`);
      err(JSON.stringify(longJson, null, 2));
      exit(1);
    }
    const longToken = longJson.access_token;
    const expiresIn = longJson.expires_in; // 秒數

    // 5. 驗證 token 能呼叫 /me
    log("\n⏳ 驗證 token…");
    const meRes = await fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(longToken)}`,
    );
    const me = await meRes.json().catch(() => ({}));
    if (!meRes.ok || !me.id) {
      err(`Token 驗證失敗: HTTP ${meRes.status}`);
      err(JSON.stringify(me, null, 2));
      exit(1);
    }

    log("");
    log("✅ Long-lived Threads User Access Token 拿到!");
    log(`   帳號: @${me.username} (id=${me.id})`);
    if (expiresIn) {
      const days = Math.round(expiresIn / 86400);
      log(`   有效期: ${days} 天 (expires_in=${expiresIn}s)`);
    }
    log("");
    log("━".repeat(64));
    log("Long-lived token (貼到 Comment Flow 的「儲存並驗證」):");
    log("━".repeat(64));
    log(longToken);
    log("━".repeat(64));
    log("");
    log("⚠  這串 token 等同密碼 — 不要 commit 到 git、不要貼到公開地方。");
    log("   存進 localStorage 後,這個 CLI 輸出就沒用了。");
  } catch (e) {
    err(`未預期錯誤: ${e?.message || e}`);
    exit(1);
  } finally {
    rl.close();
  }
}

main();