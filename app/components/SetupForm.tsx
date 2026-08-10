"use client";

import { useEffect, useState } from "react";
import {
  clearToken,
  getSettings,
  getToken,
  setSettings as persistSettings,
  setToken as persistToken,
  type DrawSettings,
} from "@/lib/storage";
import { validateToken } from "@/lib/threads";

type SetupFormProps = {
  postUrl: string;
  setPostUrl: (v: string) => void;
  settings: DrawSettings;
  setSettings: (s: DrawSettings) => void;
  onNext: () => void;
};

export function SetupForm({
  postUrl,
  setPostUrl,
  settings,
  setSettings,
  onNext,
}: SetupFormProps) {
  const [tokenDraft, setTokenDraft] = useState("");
  const [savedToken, setSavedToken] = useState<string | null>(null);
  const [tokenStatus, setTokenStatus] = useState<"idle" | "checking" | "ok" | "bad">("idle");
  const [tokenMessage, setTokenMessage] = useState<string>("");
  const [keywordDraft, setKeywordDraft] = useState("");

  useEffect(() => {
    setSavedToken(getToken());
    const persisted = getSettings();
    setSettings(persisted);
    // Auto-import token from ?threads_token=... deep link (CLI integration).
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const incoming = params.get("threads_token");
      if (incoming && incoming.length >= 16) {
        persistToken(incoming);
        setSavedToken(incoming);
        setTokenStatus("checking");
        setTokenMessage("從 CLI deep-link 匯入,驗證中…");
        validateToken(incoming)
          .then((me) => {
            setTokenStatus("ok");
            setTokenMessage(`已連線 · @${me.username ?? me.id}`);
          })
          .catch((err) => {
            setTokenStatus("bad");
            setTokenMessage(err instanceof Error ? err.message : "驗證失敗");
          });
        // Strip token from URL so it doesn't land in browser history or share links.
        const cleaned = new URL(window.location.href);
        cleaned.searchParams.delete("threads_token");
        window.history.replaceState({}, "", cleaned.toString());
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function commitSettings(next: DrawSettings) {
    setSettings(next);
    persistSettings(next);
  }

  async function handleSaveToken() {
    const value = tokenDraft.trim();
    if (!value) return;
    persistToken(value);
    setSavedToken(value);
    setTokenDraft("");
    setTokenStatus("checking");
    setTokenMessage("驗證中…");
    try {
      const me = await validateToken(value);
      setTokenStatus("ok");
      setTokenMessage(`已連線 · @${me.username ?? me.id}`);
    } catch (err) {
      setTokenStatus("bad");
      setTokenMessage(err instanceof Error ? err.message : "驗證失敗");
    }
  }

  function handleClearToken() {
    clearToken();
    setSavedToken(null);
    setTokenStatus("idle");
    setTokenMessage("");
    setTokenDraft("");
  }

  function handleAddKeyword() {
    const kw = keywordDraft.trim();
    if (!kw) return;
    if (settings.excludeKeywords.includes(kw)) {
      setKeywordDraft("");
      return;
    }
    commitSettings({ ...settings, excludeKeywords: [...settings.excludeKeywords, kw] });
    setKeywordDraft("");
  }

  function handleRemoveKeyword(kw: string) {
    commitSettings({
      ...settings,
      excludeKeywords: settings.excludeKeywords.filter((k) => k !== kw),
    });
  }

  const canProceed = postUrl.trim().length > 0 && Boolean(savedToken) && settings.winnerCount > 0;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[var(--navy)]" htmlFor="post-url">
          ① Threads 公開貼文 URL 或 ID
        </label>
        <input
          id="post-url"
          className="input"
          type="text"
          inputMode="url"
          placeholder="https://www.threads.net/@username/post/xxxxx"
          value={postUrl}
          onChange={(e) => setPostUrl(e.target.value)}
          autoComplete="off"
          spellCheck={false}
        />
        <p className="text-xs text-[var(--muted)]">
          支援 <span className="kbd">/post/&lt;code&gt;</span>、<span className="kbd">/t/&lt;code&gt;</span>、裸 ID。
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-semibold text-[var(--navy)]">
          ② Threads Access Token <span className="pill pill-coral ml-1">僅存在你的瀏覽器</span>
        </label>
        {savedToken ? (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] bg-white/80 px-3 py-2">
            <span className="text-sm text-[var(--navy)]">
              ✓ 已儲存 <span className="text-[var(--muted)]">({savedToken.slice(0, 6)}…{savedToken.slice(-4)})</span>
            </span>
            <span
              className={`pill ${
                tokenStatus === "ok"
                  ? "pill-coral"
                  : tokenStatus === "bad"
                    ? "pill-navy"
                    : "pill-navy"
              }`}
            >
              {tokenStatus === "checking"
                ? "驗證中…"
                : tokenStatus === "ok"
                  ? tokenMessage
                  : tokenStatus === "bad"
                    ? `錯誤:${tokenMessage}`
                    : "尚未驗證"}
            </span>
            <button type="button" className="btn btn-ghost ml-auto" onClick={() => setSavedToken(null)}>
              重新貼上
            </button>
            <button type="button" className="btn btn-danger" onClick={handleClearToken}>
              清除
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              className="input"
              type="password"
              placeholder="貼上 Threads User Access Token"
              value={tokenDraft}
              onChange={(e) => setTokenDraft(e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              className="btn btn-navy"
              onClick={handleSaveToken}
              disabled={!tokenDraft.trim() || tokenStatus === "checking"}
            >
              {tokenStatus === "checking" ? <span className="spinner" aria-hidden /> : null}
              儲存並驗證
            </button>
          </div>
        )}
        <p className="text-xs text-[var(--muted)]">
          在 <a className="text-[var(--coral-deep)] underline-offset-2 hover:underline" href="https://developers.facebook.com/docs/threads" target="_blank" rel="noopener noreferrer">Meta for Developers</a> 取得。需要 <span className="kbd">threads_basic</span> + <span className="kbd">threads_read_replies</span>。
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--navy)]" htmlFor="winners">
            ③ 抽出幾位中獎者
          </label>
          <input
            id="winners"
            className="input"
            type="number"
            min={1}
            max={50}
            value={settings.winnerCount}
            onChange={(e) => {
              const n = Math.max(1, Math.min(50, Number(e.target.value) || 1));
              commitSettings({ ...settings, winnerCount: n });
            }}
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-[var(--navy)]" htmlFor="exclude">
            排除關鍵字
          </label>
          <div className="flex gap-2">
            <input
              id="exclude"
              className="input"
              type="text"
              placeholder="例如:bot、官方"
              value={keywordDraft}
              onChange={(e) => setKeywordDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddKeyword();
                }
              }}
            />
            <button type="button" className="btn btn-ghost" onClick={handleAddKeyword}>
              加入
            </button>
          </div>
          {settings.excludeKeywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {settings.excludeKeywords.map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleRemoveKeyword(kw)}
                  className="pill pill-navy hover:opacity-80"
                  title="點擊移除"
                >
                  {kw} <span aria-hidden>×</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <button
          type="button"
          className="btn btn-coral"
          onClick={onNext}
          disabled={!canProceed}
        >
          下一步:開始抽籤 →
        </button>
      </div>
    </div>
  );
}