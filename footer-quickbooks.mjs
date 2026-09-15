// Put the two QuickBooks pages in every footer.
//
//   node footer-quickbooks.mjs           add them
//   node footer-quickbooks.mjs --check   verify only, non-zero exit if a page is missing them
//
// WHY THEY WERE NOT THERE. policy-map.html lists eight footer links and these are not among
// them — Austin drew that line in the meeting on the 14th: "these two are specific to
// QuickBooks. The rest of it is just general." So the pages were built, the rewrites were
// merged, and nothing ever linked to them.
//
// WHY THEY SHOULD BE. Intuit's reviewer arrives at atrovia.co and has to reach the connect
// and disconnect pages; "we typed the URL into your form" is a worse answer than a link they
// can find. And a customer who disconnected QuickBooks and wants to know what happened to
// the data we already read has nowhere to look.
//
// SO THEY ARE SEPARATED, NOT MIXED IN. Eight general policies, then a divider, then the two
// QuickBooks ones. Dropping them into the same row would say they are policies of the same
// kind, which is the thing Austin was right about.
//
// A SCRIPT AND NOT AN EDIT, because ten of these thirteen pages come out of the bundle's
// generator — its README says plainly not to hand-edit them. Re-run after any rebuild. It is
// idempotent and reports what it did.

import { readFileSync, writeFileSync, globSync } from "node:fs";

const check = process.argv.includes("--check");

// The two shapes of footer on this site. The generated legal pages use " · " between plain
// anchors; the three hand-built pages use a flex <nav> where the gap does the separating.
const GENERATED = {
  match: /(<a href="\/subprocessors">Sub-processors<\/a>)/,
  add: '$1 <span class="qbo-sep">·</span> <a href="/connect-quickbooks">Connect QuickBooks</a> · <a href="/quickbooks-disconnected">QuickBooks disconnected</a>',
};
const HANDBUILT = {
  match: /(<a href="subprocessors\.html">Sub-processors<\/a>)/,
  add: '$1<span class="qbo-sep" aria-hidden="true">·</span><a href="connect-quickbooks.html">Connect QuickBooks</a><a href="quickbooks-disconnected.html">QuickBooks disconnected</a>',
};

// The divider only needs to exist on the flex footer; the generated one already has " · "
// between every link, so a styled span there would be louder than the links around it.
const STYLE = `.qbo-sep{color:#3A4060;user-select:none}`;

// `missing` is only a real problem — a page that SHOULD carry the links and does not.
// `noFooter` is not: connect-quickbooks.html has its own footer shape and never had a legal
// nav. Counting that as a failure made --check exit 1 on a correct site, which is how a
// guard gets ignored.
let added = 0, already = 0, missing = 0, noFooter = 0;

for (const page of globSync("*.html").sort()) {
  const src = readFileSync(page, "utf8");

  if (src.includes("/connect-quickbooks") || src.includes("connect-quickbooks.html")) {
    // The connect page linking to itself is fine and expected; do not count it as work.
    if (!/connect-quickbooks/.test(page)) { console.log(`  already  ${page}`); already++; continue; }
  }

  const rule = src.includes('href="/subprocessors"') ? GENERATED
             : src.includes('href="subprocessors.html"') ? HANDBUILT
             : null;

  if (!rule) { console.log(`  no legal footer  ${page}`); noFooter++; continue; }
  if (!rule.match.test(src)) { console.log(`  FOOTER CHANGED SHAPE  ${page}`); missing++; continue; }

  if (check) { console.log(`  MISSING  ${page}`); missing++; continue; }

  let out = src.replace(rule.match, rule.add);
  // The divider style rides along in the page's own <style>, because these files are
  // self-contained by design — the bundle ships them with no external CSS at all.
  if (rule === HANDBUILT && !out.includes(".qbo-sep{")) {
    out = out.replace(/(\.legal-links a\{[^}]*\})/, `$1${STYLE}`);
  }
  writeFileSync(page, out);
  console.log(`  added    ${page}`);
  added++;
}

console.log(`\n${added} updated, ${already} already linked, ${missing} still missing, ${noFooter} without a legal footer`);
if (check && missing) {
  console.error("Some footers do not link the QuickBooks pages. Run: node footer-quickbooks.mjs");
  process.exit(1);
}
