"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Stepper } from "./components/Stepper";
import { SetupForm } from "./components/SetupForm";
import { ResultsView } from "./components/ResultsView";
import {
  type DrawSettings,
  setSettings as persistSettings,
} from "@/lib/storage";
import {
  fetchThreadsComments,
  ThreadsError,
} from "@/lib/threads";
import {
  drawWinners,
  filterCandidates,
  type DrawCandidate,
} from "@/lib/draw";

const STEPS = [
  { key: "setup", label: "設定貼文與 Token" },
  { key: "draw", label: "抽籤" },
  { key: "winners", label: "中獎者" },
];

export default function Home() {
  const [step, setStep] = useState(0);
  const [postUrl, setPostUrl] = useState("");
  const [settings, setSettingsState] = useState<DrawSettings>(() => ({
    winnerCount: 1,
    excludeKeywords: [],
  }));
  const [candidates, setCandidates] = useState<DrawCandidate[]>([]);
  const [winners, setWinners] = useState<DrawCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const [hasFetched, setHasFetched] = useState(false);
  const inflight = useRef<AbortController | null>(null);

  const setSettings = useCallback((next: DrawSettings) => {
    setSettingsState(next);
    persistSettings(next);
  }, []);

  const filteredPool = useMemo(
    () => filterCandidates(candidates, settings),
    [candidates, settings],
  );

  async function loadComments() {
    inflight.current?.abort();
    const ac = new AbortController();
    inflight.current = ac;
    setIsLoading(true);
    setErrorMessage(undefined);
    try {
      const token = typeof window !== "undefined" ? window.localStorage.getItem("threads_token") : null;
      if (!token) throw new Error("尚未儲存 Threads Access Token");
      const result = await fetchThreadsComments(postUrl, token, {
        limit: 2000,
        signal: ac.signal,
      });
      setCandidates(result.comments);
      setHasFetched(true);
    } catch (err) {
      if ((err as { name?: string })?.name === "AbortError") return;
      const msg =
        err instanceof ThreadsError
          ? `${err.message}`
          : err instanceof Error
            ? err.message
            : "未知錯誤";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleStartDraw() {
    setStep(1);
    if (!hasFetched || candidates.length === 0) {
      await loadComments();
    } else {
      setErrorMessage(undefined);
    }
  }

  function performDraw() {
    if (candidates.length === 0) {
      setErrorMessage("這個貼文目前抽不到留言,請換一則試試");
      return;
    }
    if (filteredPool.length === 0) {
      setErrorMessage("排除關鍵字把所有留言都過濾掉了,請放寬條件");
      return;
    }
    const w = drawWinners(candidates, settings);
    setWinners(w);
    setStep(2);
  }

  async function handleDrawClick() {
    if (!hasFetched) {
      await loadComments();
    }
    performDraw();
  }

  function handleReset() {
    inflight.current?.abort();
    setStep(0);
    setWinners([]);
    setErrorMessage(undefined);
    // keep candidates so re-draw is instant
  }

  function handleJump(target: number) {
    if (target === 0) {
      setStep(0);
      setErrorMessage(undefined);
      return;
    }
    if (target === 1 && candidates.length > 0) {
      setStep(1);
      setErrorMessage(undefined);
      return;
    }
    if (target === 2 && winners.length > 0) {
      setStep(2);
      setErrorMessage(undefined);
    }
  }

  const excludedCount = candidates.length - filteredPool.length;

  return (
    <div className="bg-app">
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-6 px-5 py-10 sm:py-14">
        <header className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--coral)] to-[var(--coral-deep)] text-white shadow-md">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden>
              <path
                d="M5 7h14M5 12h14M5 17h9"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-[var(--navy)] sm:text-2xl">
              Threads 留言抽籤
            </h1>
            <p className="text-xs text-[var(--muted)] sm:text-sm">
              Comment Flow · token 永遠留在你的瀏覽器
            </p>
          </div>
        </header>

        <div className="glass-strong rounded-3xl p-5 sm:p-8">
          <div className="mb-6">
            <Stepper steps={STEPS} current={step} onJump={handleJump} />
          </div>

          {step === 0 && (
            <SetupForm
              postUrl={postUrl}
              setPostUrl={setPostUrl}
              settings={settings}
              setSettings={setSettings}
              onNext={handleStartDraw}
            />
          )}

          {(step === 1 || step === 2) && (
            <ResultsView
              postUrl={postUrl}
              totalCount={filteredPool.length}
              excludedCount={excludedCount}
              winners={step === 2 ? winners : []}
              isDrawing={isLoading}
              errorMessage={errorMessage}
              onDraw={handleDrawClick}
              onReset={handleReset}
            />
          )}
        </div>

        <footer className="text-center text-xs text-[var(--muted)]">
          <p>
            開源 · 由 <a className="text-[var(--coral-deep)] hover:underline" href="https://hermes-agent.nousresearch.com" target="_blank" rel="noopener noreferrer">Hermes Agent</a> + Next.js 打造
          </p>
        </footer>
      </div>
    </div>
  );
}