import { describe, it, expect } from "vitest";
import { extractPostId } from "../lib/threads";

describe("extractPostId", () => {
  it("returns null for empty input", () => {
    expect(extractPostId("")).toBeNull();
    expect(extractPostId("   ")).toBeNull();
  });

  it("returns null for non-threads URL", () => {
    expect(extractPostId("https://example.com/foo")).toBeNull();
    expect(extractPostId("https://twitter.com/x")).toBeNull();
  });

  it("parses /@user/post/<code> URL", () => {
    expect(extractPostId("https://www.threads.net/@meta/post/ABC123")).toBe(
      "ABC123"
    );
  });

  it("parses /t/<code> URL", () => {
    expect(extractPostId("https://www.threads.com/t/CXYZ789")).toBe("CXYZ789");
  });

  it("parses bare post code", () => {
    expect(extractPostId("CABCDE123")).toBe("CABCDE123");
  });

  it("parses bare numeric id", () => {
    expect(extractPostId("1234567890")).toBe("1234567890");
  });

  it("rejects URL-like raw string that is not threads", () => {
    // "https" prefix triggers URL branch — should not match
    expect(extractPostId("https://nope.example/post/xyz")).toBeNull();
  });

  it("trims whitespace", () => {
    expect(extractPostId("  CABCDE  ")).toBe("CABCDE");
  });

  it("handles threads.com short link", () => {
    expect(extractPostId("https://threads.net/t/DFOO")).toBe("DFOO");
  });
});
