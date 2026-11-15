// E2E: run the CLI end-to-end with fetch patched to return realistic canned responses.
// Verifies the CLI:
//   - reads env vars
//   - prints the auth URL correctly
//   - parses user-supplied redirect URL
//   - calls short-token endpoint
//   - calls long-token endpoint
//   - calls /me to validate
//   - prints the long-lived token

import { spawn } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";

const scriptPath = new URL("./get-threads-token.mjs", import.meta.url).pathname;
assert.ok(existsSync(scriptPath), "CLI script missing");

// Build a fetch-mock module that pre-loads before the CLI runs.
const mockModule = `
const SHORT = JSON.stringify({ access_token: "SHORT_abc123_xyz", user_id: 42 });
const LONG = JSON.stringify({ access_token: "LONG_def456_uvw_super_long_token", token_type: "bearer", expires_in: 5184000 });
const ME = JSON.stringify({ id: "42", username: "sean_oauth_test" });
const origFetch = globalThis.fetch;
globalThis.fetch = async function patched(input, init) {
  const url = typeof input === "string" ? input : input.url;
  if (url && url.startsWith("https://graph.threads.net/oauth/access_token")) {
    return new Response(SHORT, { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (url && url.startsWith("https://graph.threads.net/v1.0/me")) {
    return new Response(ME, { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return origFetch(input, init);
};
// Replace short→long: actual script appends query string with short token; mock returns LONG.
const origFetch2 = globalThis.fetch;
globalThis.fetch = async function patched2(input, init) {
  const url = typeof input === "string" ? input : input.url;
  if (url && url.includes("th_exchange_token")) {
    return new Response(LONG, { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (url && url.startsWith("https://graph.threads.net/oauth/access_token")) {
    return new Response(SHORT, { status: 200, headers: { "Content-Type": "application/json" } });
  }
  if (url && url.startsWith("https://graph.threads.net/v1.0/me")) {
    return new Response(ME, { status: 200, headers: { "Content-Type": "application/json" } });
  }
  return origFetch2(input, init);
};
`;

// Inject mock by writing a temporary CLI wrapper.
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
const tmp = mkdtempSync(join(tmpdir(), "threads-cli-e2e-"));
const wrapper = join(tmp, "wrapper.mjs");
writeFileSync(wrapper, mockModule + `
await import(${JSON.stringify("file://" + scriptPath)});
`);

// Feed stdin with a fake redirect URL.
const REDIRECT = "https://example.com/oauth/redirect";
const fakeStdin = `${REDIRECT}?code=FAKE_AUTH_CODE&state=comment-flow-helper\n`;

const child = spawn(process.execPath, [wrapper], {
  env: {
    ...process.env,
    THREADS_APP_ID: "123456789012345",
    THREADS_APP_SECRET: "fakesecretlongenough",
    THREADS_REDIRECT_URI: REDIRECT,
  },
  stdio: ["pipe", "pipe", "pipe"],
});

let stdout = "";
let stderr = "";
child.stdout.on("data", (d) => (stdout += d.toString()));
child.stderr.on("data", (d) => (stderr += d.toString()));

child.stdin.write(fakeStdin);
child.stdin.end();

const exitCode = await new Promise((resolve) => child.on("close", resolve));

console.log("--- CLI stdout ---");
console.log(stdout);
console.log("--- CLI stderr (first 30 lines) ---");
console.log(stderr.split("\n").slice(0, 30).join("\n"));
console.log("--- exit code:", exitCode, "---");

// Assertions
assert.equal(exitCode, 0, `CLI should exit 0, got ${exitCode}`);
assert.ok(stdout.includes("https://threads.com/oauth/authorize?"), "should print the official auth URL");
assert.ok(!stdout.includes("wwwthreads"), "must not print the typo domain");
assert.ok(stdout.includes("redirect_uri=" + encodeURIComponent(REDIRECT)), "should use THREADS_REDIRECT_URI");
assert.ok(stdout.includes("client_id=123456789012345"), "should include app id");
assert.ok(stdout.includes("scope=threads_basic%2Cthreads_read_replies") || stdout.includes("scope=threads_basic,threads_read_replies"), "should include scopes");
assert.ok(stdout.includes("LONG_def456_uvw_super_long_token"), "should print long token");
assert.ok(stdout.includes("@sean_oauth_test"), "should print verified username");
assert.ok(stdout.includes("threads-comment-helper.vercel.app"), "should print deep link");
assert.ok(stdout.includes("threads_token=LONG_def456_uvw_super_long_token"), "deep link should embed long token");
assert.ok(stderr.includes("THREADS_APP_ID") === false || stderr.includes("請輸入") === false, "should read from env, not prompt");

// Without THREADS_REDIRECT_URI the CLI must fail fast instead of falling back to any default domain.
const env2 = { ...process.env, THREADS_APP_ID: "123456789012345", THREADS_APP_SECRET: "fakesecretlongenough" };
delete env2.THREADS_REDIRECT_URI;
const child2 = spawn(process.execPath, [scriptPath], { env: env2, stdio: ["pipe", "pipe", "pipe"] });
let stderr2 = "";
child2.stderr.on("data", (d) => (stderr2 += d.toString()));
child2.stdin.end();
const exit2 = await new Promise((resolve) => child2.on("close", resolve));
assert.equal(exit2, 1, `CLI should exit 1 without THREADS_REDIRECT_URI, got ${exit2}`);
assert.ok(stderr2.includes("THREADS_REDIRECT_URI"), "should explain the missing THREADS_REDIRECT_URI");

console.log("\\n✓ CLI exit 0");
console.log("✓ Auth URL printed");
console.log("✓ Long-lived token printed");
console.log("✓ Username verified");
console.log("✓ Deep-link URL printed with embedded token");
console.log("✓ All env vars read from environment (no prompt)");
console.log("✓ Missing THREADS_REDIRECT_URI exits 1");
