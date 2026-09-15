// Re-compute the CSP hashes for every inline <script> and write them into vercel.json.
//
//   node csp-hashes.mjs          apply
//   node csp-hashes.mjs --check  verify only, non-zero exit if stale (for CI)
//
// WHY. The redesigned site carries its JavaScript inside the HTML. The old one loaded
// assets/js/*.js, so `script-src 'self'` was enough and nobody noticed when the pages
// changed shape. The result was a site that rendered nothing — no scroll effects, no
// interaction, every inline block refused by the browser with:
//
//   Executing inline script violates the following Content Security Policy directive
//   'script-src 'self' https://api.atrovia.co'
//
// HASHES, NOT 'unsafe-inline'. Dropping 'unsafe-inline' into script-src would have fixed it
// in one line and thrown the policy away: any injected <script> would then run too. This is
// the site that takes an email, an EIN and routes to payment — the one page where that
// matters most. A hash allows exactly the scripts that shipped and nothing else.
//
// THE COST, STATED PLAINLY: edit any inline script by one character and its hash changes, so
// the browser silently refuses it. That is why this is a script and not a one-time edit —
// run it after any change to the pages, and run it with --check in CI so a stale hash fails
// the build instead of the homepage.

import { readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { globSync } from "node:fs";

const PAGES = globSync
  ? globSync("*.html")
  : ["index.html", "about.html", "signup.html"];

// Every <script> WITHOUT a src. The content is hashed exactly as it sits between the tags —
// no trimming: the browser hashes the raw text, and a stripped newline is a different hash.
const INLINE = /<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;

// HTML COMMENTS COME OUT FIRST, and the reason is a bug this script caused itself. A comment
// in signup.html used the word "<script>" in prose — explaining that an inline event handler
// is blocked the same way a script tag without a hash is. The scanner read that as a real
// opening tag, which threw the open/close pairing out by one, swallowed the real script that
// enables the signup button into a mis-parsed block, and never hashed it.
//
// The page then looked perfect and the button stayed disabled forever: the browser silently
// refused the one script that turns it on. Nobody could buy anything.
//
// Offsets do not matter here — only the script bodies — so blanking comments entirely is
// safe, and it is the difference between a scanner that is right and one that is usually right.
const decomment = (html) => html.replace(/<!--[\s\S]*?-->/g, "");

const hashes = new Set();
for (const page of PAGES.sort()) {
  const html = decomment(readFileSync(page, "utf8"));
  let n = 0;
  for (const m of html.matchAll(INLINE)) {
    const body = m[1];
    if (!body.trim()) continue;            // <script></script> needs no hash
    hashes.add(`'sha256-${createHash("sha256").update(body, "utf8").digest("base64")}'`);
    n++;
  }
  if (n) console.log(`  ${String(n).padStart(2)} inline  ${page}`);
}

const cfg = JSON.parse(readFileSync("vercel.json", "utf8"));
const header = cfg.headers?.[0]?.headers?.find((h) => h.key === "Content-Security-Policy");
if (!header) {
  console.error("vercel.json has no Content-Security-Policy header — nothing to update.");
  process.exit(1);
}

const wanted = ["'self'", "https://api.atrovia.co", ...[...hashes].sort()].join(" ");
const updated = header.value.replace(/script-src [^;]+/, `script-src ${wanted}`);

if (updated === header.value) {
  console.log(`\n${hashes.size} hashes — already current.`);
  process.exit(0);
}

if (process.argv.includes("--check")) {
  console.error(`\nCSP is stale: ${hashes.size} inline scripts do not match script-src. Run: node csp-hashes.mjs`);
  process.exit(1);
}

header.value = updated;
writeFileSync("vercel.json", JSON.stringify(cfg, null, 2) + "\n");
console.log(`\n${hashes.size} hashes written into script-src.`);
