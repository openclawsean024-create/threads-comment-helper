// LocalStorage helpers for Threads token + recent settings.
// Token is NEVER sent to our backend — only to api.threads.com directly.
const TOKEN_KEY = "threads_token";
const SETTINGS_KEY = "threads_helper_settings_v1";

export type DrawSettings = {
  winnerCount: number;
  excludeKeywords: string[];
};

const DEFAULT_SETTINGS: DrawSettings = {
  winnerCount: 1,
  excludeKeywords: [],
};

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TOKEN_KEY, token.trim());
  } catch (err) {
    console.error("[storage] failed to persist token", err);
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error("[storage] failed to clear token", err);
  }
}

export function getSettings(): DrawSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      winnerCount:
        typeof parsed.winnerCount === "number" && parsed.winnerCount > 0
          ? Math.min(parsed.winnerCount, 100)
          : DEFAULT_SETTINGS.winnerCount,
      excludeKeywords: Array.isArray(parsed.excludeKeywords)
        ? parsed.excludeKeywords.filter((s: unknown) => typeof s === "string")
        : DEFAULT_SETTINGS.excludeKeywords,
    };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setSettings(settings: DrawSettings): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error("[storage] failed to persist settings", err);
  }
}