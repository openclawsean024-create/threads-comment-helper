import { describe, it, expect } from "vitest";
import {
  drawWinners,
  filterCandidates,
  type DrawCandidate,
} from "../lib/draw";

const sample = (n: number, prefix = "u"): DrawCandidate[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `c${i}`,
    username: `${prefix}${i}`,
    displayName: `${prefix}${i}`,
    text: `Comment ${i}`,
    timestamp: new Date(2026, 8, 6, 12, i).toISOString(),
  }));

describe("filterCandidates", () => {
  it("returns all when no excludeKeywords", () => {
    const c = sample(5);
    expect(filterCandidates(c, { winnerCount: 1, excludeKeywords: [] })).toHaveLength(5);
  });

  it("filters by username keyword case-insensitive", () => {
    const c = sample(5);
    const out = filterCandidates(c, {
      winnerCount: 1,
      excludeKeywords: ["U2"],
    });
    expect(out.map((x) => x.username)).toEqual(["u0", "u1", "u3", "u4"]);
  });

  it("filters by text content", () => {
    const c = sample(3);
    const out = filterCandidates(c, {
      winnerCount: 1,
      excludeKeywords: ["Comment 1"],
    });
    expect(out).toHaveLength(2);
    expect(out.map((x) => x.text)).toEqual(["Comment 0", "Comment 2"]);
  });

  it("trims + lowercases keyword + ignores empty", () => {
    const c = sample(3);
    const out = filterCandidates(c, {
      winnerCount: 1,
      excludeKeywords: ["  ", "", "U1"],
    });
    expect(out).toHaveLength(2);
  });
});

describe("drawWinners", () => {
  it("returns empty when pool is empty", () => {
    expect(drawWinners([], { winnerCount: 3, excludeKeywords: [] })).toEqual([]);
  });

  it("returns at most pool.length winners", () => {
    const c = sample(2);
    const out = drawWinners(c, { winnerCount: 5, excludeKeywords: [] });
    expect(out).toHaveLength(2);
  });

  it("returns exactly winnerCount when pool is large enough", () => {
    const c = sample(10);
    const out = drawWinners(c, { winnerCount: 3, excludeKeywords: [] });
    expect(out).toHaveLength(3);
  });

  it("returns unique winners", () => {
    const c = sample(20);
    const out = drawWinners(c, { winnerCount: 5, excludeKeywords: [] });
    const ids = out.map((x) => x.id);
    expect(new Set(ids).size).toBe(5);
  });

  it("respects excludeKeywords when drawing", () => {
    const c = sample(10);
    const out = drawWinners(c, {
      winnerCount: 5,
      excludeKeywords: ["u0", "u1", "u2", "u3", "u4", "u5"],
    });
    expect(out).toHaveLength(4);
    out.forEach((w) => {
      expect(["u6", "u7", "u8", "u9"]).toContain(w.username);
    });
  });
});
