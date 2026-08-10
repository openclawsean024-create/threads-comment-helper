export type DrawCandidate = {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  text: string;
  timestamp: string; // ISO
};

export type DrawOptions = {
  winnerCount: number;
  excludeKeywords: string[]; // case-insensitive substrings
};

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function filterCandidates(
  candidates: DrawCandidate[],
  options: DrawOptions,
): DrawCandidate[] {
  const blocked = options.excludeKeywords
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);
  return candidates.filter((c) => {
    if (blocked.length === 0) return true;
    const haystack = `${c.username} ${c.displayName ?? ""} ${c.text}`.toLowerCase();
    return !blocked.some((kw) => haystack.includes(kw));
  });
}

export function drawWinners(
  candidates: DrawCandidate[],
  options: DrawOptions,
): DrawCandidate[] {
  const pool = filterCandidates(candidates, options);
  const n = Math.min(options.winnerCount, pool.length);
  if (n <= 0) return [];
  return shuffleInPlace([...pool]).slice(0, n);
}