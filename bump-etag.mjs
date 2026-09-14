// Stamp every page so its ETag changes, and cached browsers get the new headers.
//
//   node bump-etag.mjs
//
// WHY THIS IS NECESSARY, and it is not obvious. Vercel answers a revalidation with
// `304 Not Modified` and the 304 carries no Content-Security-Policy header. Per RFC 9111 a
// 304 updates only the headers it sends; everything else keeps the value the browser already
// stored. So a browser that cached a page while the OLD policy was live keeps that old policy
// for as long as the ETag matches — and the ETag is computed from the CONTENT.
//
// Fixing the CSP meant editing vercel.json, which changes headers and leaves every .html byte
// identical. Same content, same ETag, 304 on every visit, old policy forever. The site was
// fixed for new visitors and permanently broken for everyone who had already seen it —
// which is exactly the people who were shown the demo.
//
// So: change a byte. A comment in <head> is enough, and it is deliberately outside <script>
// so the inline-script hashes are untouched — run csp-hashes.mjs after this and it will say
// the hashes are already current.
//
// RUN THIS whenever a change to vercel.json alters headers without altering the pages.
// A content change ships its own new ETag and needs nothing.

import { readFileSync, writeFileSync, globSync } from "node:fs";

const STAMP = new Date().toISOString().slice(0, 16).replace("T", " ");
const MARK = /<!-- headers (?:bumped|stamp) [^>]*-->\n?/g;

let done = 0, skipped = 0;

for (const page of globSync("*.html").sort()) {
  const src = readFileSync(page, "utf8");
  const clean = src.replace(MARK, "");

  // Straight after <head>, so it is the first thing in the document that is not the tag
  // itself — and nowhere near a <script>.
  const out = clean.replace(/<head>/i, `<head>\n<!-- headers stamp ${STAMP} -->`);
  if (out === clean) { console.log(`  no <head>  ${page}`); skipped++; continue; }

  writeFileSync(page, out);
  console.log(`  stamped  ${page}`);
  done++;
}

console.log(`\n${done} stamped, ${skipped} skipped — stamp "${STAMP}".`);
console.log("Now run: node csp-hashes.mjs --check");
