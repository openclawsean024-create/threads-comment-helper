"use client";

import type { DrawCandidate } from "@/lib/draw";

type ResultsViewProps = {
  postUrl: string;
  totalCount: number;
  excludedCount: number;
  winners: DrawCandidate[];
  isDrawing: boolean;
  errorMessage?: string;
  onDraw: () => void;
  onReset: () => void;
};

export function ResultsView({
  postUrl,
  totalCount,
  excludedCount,
  winners,
  isDrawing,
  errorMessage,
  onDraw,
  onReset,
}: ResultsViewProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="pill pill-coral">符合資格 {totalCount}</span>
        {excludedCount > 0 && (
          <span className="pill pill-navy">已排除 {excludedCount}</span>
        )}
        <span className="ml-auto text-xs text-[var(--muted)] break-all max-w-full">
          {postUrl}
        </span>
      </div>

      {errorMessage && (
        <div
          role="alert"
          className="rounded-xl border border-[rgba(255,102,102,0.4)] bg-[rgba(255,102,102,0.10)] px-4 py-3 text-sm text-[var(--coral-deep)]"
        >
          {errorMessage}
        </div>
      )}

      {isDrawing && (
        <div className="winner-card p-8 text-center">
          <div className="mx-auto mb-4 h-14 w-14 rounded-full border-4 border-[var(--coral)]/30 border-t-[var(--coral)] animate-spin" aria-hidden />
          <p className="text-base font-semibold text-[var(--navy)]">抽籤中…</p>
          <p className="mt-1 text-sm text-[var(--muted)]">洗牌 + 篩選中獎者</p>
        </div>
      )}

      {!isDrawing && winners.length > 0 && (
        <ul className="grid gap-4 sm:grid-cols-2">
          {winners.map((w, idx) => (
            <li key={w.id} className="winner-card p-5">
              <div className="relative flex items-start gap-4">
                <div className="relative shrink-0">
                  {w.avatarUrl ? (
                    <img
                      src={w.avatarUrl}
                      alt={`@${w.username} 頭像`}
                      width={56}
                      height={56}
                      className="h-14 w-14 rounded-full border-2 border-white shadow-md object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--coral)] to-[var(--navy)] text-white font-bold">
                      {(w.displayName ?? w.username).slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-[var(--coral)] text-xs font-bold text-white shadow-md ring-2 ring-white">
                    {idx + 1}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-base font-bold text-[var(--navy)]">
                      @{w.username}
                    </span>
                    {w.displayName && w.displayName !== w.username && (
                      <span className="truncate text-sm text-[var(--muted)]">
                        {w.displayName}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-[var(--ink)]">
                    {w.text || "(無留言文字)"}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-3 justify-end pt-2">
        <button type="button" className="btn btn-ghost" onClick={onReset}>
          ← 回到設定
        </button>
        <button
          type="button"
          className="btn btn-coral"
          onClick={onDraw}
          disabled={isDrawing}
        >
          {isDrawing ? <span className="spinner" aria-hidden /> : null}
          {winners.length > 0 ? "再抽一次" : "開始抽籤"}
        </button>
      </div>
    </div>
  );
}