// Read the marketing copy against §8 of the Agreement.
//
//   node check-claims.mjs            report
//   node check-claims.mjs --check    same, non-zero exit on a hit (for CI)
//
// policy-map.html asks for this as a to-do: "Read every page of the marketing site against §8
// of the Agreement. Don't publish a promise the EULA then denies." Its own example is the
// clearest statement of the rule:
//
//     "Atrovia sets your prices for you" is a claim §8 contradicts;
//     helps you set, recommends, shows you are accurate and also better copy.
//
// A SCRIPT RATHER THAN A ONE-TIME READ, because the read goes stale the next time somebody
// writes a headline. I did the manual pass and the site is clean today — the value of this
// file is the pass nobody remembers to do in three months.
//
// WHAT §8 ACTUALLY DENIES, which is what these patterns are built from:
//   8      — output is a recommendation, never an instruction, decision or guarantee
//   8.1    — no representation of accuracy, or of producing any particular business result
//   8.2    — not accounting, tax, legal, investment, insurance or employment advice
//   8.3    — nothing is sent, published, spent or committed without a person approving it
//
// WHAT IT DOES NOT DENY, and why this does not flag it: aspirational headline mood. "Customers
// coming in. Sales going up." is a section title, not a claim about what the software does
// unattended. The line this draws is CAPABILITY — what the product is said to do on its own.
// Flagging every optimistic sentence would make the script noise, and a noisy check gets
// commented out.

import { readFileSync, globSync } from "node:fs";

// The three hand-written marketing pages. The ten generated legal pages are the documents
// themselves — reading them against §8 would flag the Agreement for quoting itself.
const PAGES = ["index.html", "about.html", "signup.html"];

const RULES = [
  // 8 · decides rather than recommends
  [/\b(sets?|sets up|writes?|runs?|manages?|handles?|decides?|chooses?|picks?)\s+(your|their)\s+(price|prices|pricing|marketing|ads?|campaigns?|books|payroll|budget|strategy)\b/i,
   "§8 — says the product decides. Use helps you set / recommends / shows you."],

  [/\bdoes (it|everything|the work)\s*(all\s*)?for you\b/i,
   "§8 — claims it works without you. Output is a recommendation."],

  [/\b(on autopilot|hands[- ]?free|set it and forget it|zero effort|no work required)\b/i,
   "§8.3 — implies it acts without approval."],

  // 8.1 · guarantees and result promises about what the software will achieve
  [/\b(guarantee|guaranteed|guarantees)\b/i,
   "§8.1 — we make no representation that any Output produces a particular result."],

  [/\bwill (double|triple|increase|grow|boost|raise)\s+your\b/i,
   "§8.1 — promises a business result the Agreement disclaims."],

  [/\b(never wrong|always (right|accurate|correct)|100% accurate)\b/i,
   "§8.1 — the agents make mistakes; this is stated as a known characteristic."],

  // 8.2 · professional advice
  [/\byour\s+(accountant|bookkeeper|CPA|auditor|lawyer|attorney|tax adviser|tax advisor|financial adviser|financial advisor|HR department)\b/i,
   "§8.2 — Atrovia is none of these and creates no professional relationship."],

  [/\b(accounting|tax|legal|investment|employment) advice\b/i,
   "§8.2 — nothing the Platform produces is advice of this kind."],

  // 8.3 · acting without a person
  [/\bautomatically\s+(sends?|posts?|publishes?|spends?|launches?|pays?|invoices?|texts?|emails?)\b/i,
   "§8.3 — nothing goes out until a person with authority approves it."],

  [/\b(sends?|posts?|publishes?|spends?|launches?)\s+(them|it|messages?|campaigns?|ads?)\s+for you\b/i,
   "§8.3 — same: approval is the step that makes the disclaimers true."],
];

const strip = (html) =>
  html
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, " ")
    // Comments come out before tags. A comment explaining one of these rules would otherwise
    // trip it — the same way this site's CSP scanner once broke on its own explanation.
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&[a-z]+;|&#\d+;/gi, " ")
    .replace(/\s+/g, " ");

let hits = 0;
const present = new Set(globSync("*.html"));

for (const page of PAGES) {
  if (!present.has(page)) { console.log(`  missing  ${page}`); continue; }
  const text = strip(readFileSync(page, "utf8"));
  let n = 0;
  for (const [re, why] of RULES) {
    for (const m of text.matchAll(new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g"))) {
      const a = Math.max(0, m.index - 80), b = Math.min(text.length, m.index + m[0].length + 80);
      console.log(`\n  ${page}\n    ${why}\n    …${text.slice(a, b).trim()}…`);
      n++; hits++;
    }
  }
  if (!n) console.log(`  ok  ${page}`);
}

console.log(`\n${hits} claim${hits === 1 ? "" : "s"} to look at across ${PAGES.length} pages.`);
if (hits) {
  console.log("Each one is a judgement call, not an automatic failure — read it against §8 and");
  console.log("either reword it or, if it is genuinely fine, narrow the rule that caught it.");
  if (process.argv.includes("--check")) process.exit(1);
}
