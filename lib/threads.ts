import type { DrawCandidate } from "./draw";

export type ThreadsApiError = {
  code: string;
  message: string;
  httpStatus: number;
};

export class ThreadsError extends Error {
  code: string;
  httpStatus: number;
  constructor(err: ThreadsApiError) {
    super(err.message);
    this.name = "ThreadsError";
    this.code = err.code;
    this.httpStatus = err.httpStatus;
  }
}

const API_BASE = "https://graph.threads.net/v1.0";

export type FetchCommentsResult = {
  postId: string;
  postPermalink?: string;
  comments: DrawCandidate[];
};

/**
 * Extract the Threads post id from a variety of input shapes:
 *   - https://www.threads.net/@user/post/CABC...   (post code)
 *   - https://www.threads.com/t/CABC...
 *   - https://threads.net/t/CABC...
 *   - raw "CABC..." or numeric id
 */
export function extractPostId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Raw id — numeric or post code (post codes start with C, lowercase letters+digits)
  if (/^[A-Za-z0-9_-]{4,}$/.test(trimmed) && !/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  // URL form
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    if (!/(^|\.)threads\.(net|com)$/i.test(host)) return null;

    // Path patterns: /@user/post/<code>, /t/<code>, /<code>
    const parts = u.pathname.split("/").filter(Boolean);
    const tIdx = parts.indexOf("t");
    if (tIdx >= 0 && parts[tIdx + 1]) return parts[tIdx + 1];
    const postIdx = parts.indexOf("post");
    if (postIdx >= 0 && parts[postIdx + 1]) return parts[postIdx + 1];
    if (parts.length === 1 && parts[0]) return parts[0];
    return null;
  } catch {
    return null;
  }
}

type ThreadsReplyRaw = {
  id: string;
  text?: string;
  username?: string;
  permalink?: string;
  timestamp?: string;
  media_type?: string;
  hide_status?: string;
  owner?: { id?: string; username?: string; profile_picture_url?: string };
};

type ThreadsPostRaw = {
  id: string;
  text?: string;
  permalink?: string;
  username?: string;
  replies?: { data?: ThreadsReplyRaw[] };
};

async function apiGet<T>(
  path: string,
  token: string,
  params: Record<string, string | number | undefined> = {},
  signal?: AbortSignal,
): Promise<T> {
  const qs = new URLSearchParams();
  qs.set("access_token", token);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const url = `${API_BASE}${path}?${qs.toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/json" },
    signal,
  });

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      if (body?.error?.message) detail = body.error.message;
    } catch {
      /* ignore */
    }
    throw new ThreadsError({
      code: "API_HTTP_ERROR",
      message: detail,
      httpStatus: res.status,
    });
  }
  return (await res.json()) as T;
}

function toCandidate(raw: ThreadsReplyRaw): DrawCandidate {
  return {
    id: raw.id,
    username: raw.owner?.username || raw.username || "anonymous",
    displayName: raw.owner?.username || raw.username,
    avatarUrl: raw.owner?.profile_picture_url,
    text: raw.text ?? "",
    timestamp: raw.timestamp ?? new Date().toISOString(),
  };
}

/**
 * Fetch comments (replies) for a Threads post.
 * Strategy:
 *   1. Resolve the canonical post id via /v1.0/{inputId}?fields=id,permalink
 *      (turns post codes into numeric ids when needed).
 *   2. Fetch /v1.0/{id}/conversation to get the conversation root.
 *   3. Fetch /v1.0/{conversation_id}?fields=replies{id,text,username,permalink,timestamp,owner{...}}
 *      with pagination.
 */
export async function fetchThreadsComments(
  postUrlOrId: string,
  token: string,
  opts: { limit?: number; signal?: AbortSignal } = {},
): Promise<FetchCommentsResult> {
  const limit = Math.min(opts.limit ?? 1000, 5000);
  const id = extractPostId(postUrlOrId);
  if (!id) {
    throw new ThreadsError({
      code: "INVALID_URL",
      message: "無法從輸入解析出 Threads 貼文 ID",
      httpStatus: 400,
    });
  }

  // Step 1 — resolve canonical id + permalink
  const postMeta = await apiGet<ThreadsPostRaw>(
    `/${id}`,
    token,
    { fields: "id,permalink" },
    opts.signal,
  );

  // Step 2 — conversation root
  const conv = await apiGet<{ id: string }>(
    `/${postMeta.id}/conversation`,
    token,
    {},
    opts.signal,
  );

  // Step 3 — paginate replies
  const all: DrawCandidate[] = [];
  let after: string | undefined;
  while (all.length < limit) {
    const page = await apiGet<{ data?: ThreadsReplyRaw[]; paging?: { next?: string; cursors?: { after?: string } } }>(
      `/${conv.id}`,
      token,
      {
        fields:
          "replies{id,text,username,permalink,timestamp,hide_status,owner{id,username,profile_picture_url}}",
        reply_limit: 100,
        ...(after ? { after } : {}),
      },
      opts.signal,
    );
    const batch = page.data ?? [];
    for (const r of batch) {
      // Skip hidden / deleted / placeholder replies
      if (!r || !r.id) continue;
      if (r.hide_status && r.hide_status !== "VISIBLE") continue;
      all.push(toCandidate(r));
      if (all.length >= limit) break;
    }
    const next = page.paging?.next;
    const cursorAfter = page.paging?.cursors?.after;
    if (!next || !cursorAfter) break;
    after = cursorAfter;
  }

  return {
    postId: postMeta.id,
    postPermalink: postMeta.permalink,
    comments: all,
  };
}

/**
 * Validate a token by attempting a lightweight call.
 * Threads API has no dedicated /me endpoint for app-only tokens; we issue
 * a HEAD-ish GET against /v1.0/me?fields=id&access_token=... which is the
 * canonical way to confirm a Threads user access token.
 */
export async function validateToken(
  token: string,
  signal?: AbortSignal,
): Promise<{ id: string; username?: string }> {
  const data = await apiGet<{ id: string; username?: string }>(
    "/me",
    token,
    { fields: "id,username" },
    signal,
  );
  return data;
}