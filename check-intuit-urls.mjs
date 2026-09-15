// The four URL fields Intuit asks for, checked against what is actually served.
//
//   node check-intuit-urls.mjs            report
//   node check-intuit-urls.mjs --check    non-zero exit if any field would fail review
//
// From the bundle's 04-internal/INTUIT_APP_URLS.md, "Verify before you hit Next". That list
// is four checkboxes somebody ticks by hand, which means it gets ticked from memory the
// second time. This is the same list, run against the live site.
//
// THE RULE THAT MATTERS: all four fields must sit on ONE customer-facing domain. A reviewer
// comparing the Host domain against a launch URL on someone else's domain is a reviewer with
// a reason to reject. Subdomains of atrovia.co count; vercel.app does not.
//
// The bundle's "Still missing" section says the app is "still on a vercel.app address
// carrying another company's name". That was true when it was written and is not any more —
// app.atrovia.co serves the app and the word vercel appears nowhere in it. This script is
// what keeps that from quietly regressing.

const HOST = "atrovia.co";

const FIELDS = [
  { field: "Host domain",            url: "https://atrovia.co",                        expect: "loads" },
  { field: "Launch URL",             url: "https://app.atrovia.co",                    expect: "loads" },
  { field: "Launch URL (alias)",     url: "https://atrovia.co/app",                    expect: "loads" },
  { field: "Connect/Reconnect URL",  url: "https://atrovia.co/connect-quickbooks",     expect: "loads" },
  { field: "Disconnect URL",         url: "https://atrovia.co/quickbooks-disconnected", expect: "loads" },
  // Intuit's App Details asks for these two separately, and both are public documents.
  { field: "EULA URL",               url: "https://atrovia.co/eula",                   expect: "loads" },
  { field: "Privacy Policy URL",     url: "https://atrovia.co/privacy",                expect: "loads" },
];

/** Same registrable domain, or a subdomain of it. www.atrovia.co and app.atrovia.co both pass. */
const onHost = (u) => {
  const h = new URL(u).hostname.toLowerCase();
  return h === HOST || h.endsWith("." + HOST);
};

let bad = 0;

for (const { field, url } of FIELDS) {
  let res;
  try {
    res = await fetch(url, { redirect: "follow", headers: { "cache-control": "no-cache" } });
  } catch (e) {
    console.log(`  FAIL  ${field.padEnd(24)} ${url}\n        ${e.message}`);
    bad++; continue;
  }

  const final = res.url || url;
  const problems = [];

  if (!res.ok) problems.push(`HTTP ${res.status}`);
  // A redirect off the domain is the failure the map warns about, and it is invisible from
  // the address you typed into the form.
  if (!onHost(final)) problems.push(`lands on ${new URL(final).hostname}, not ${HOST}`);
  if (!final.startsWith("https://")) problems.push("not HTTPS");

  // The three public documents must be readable signed out. A legal page behind a login is
  // a legal page the reviewer reports as missing.
  if (/eula|privacy|connect-quickbooks|quickbooks-disconnected/.test(url) && /\/login/.test(final)) {
    problems.push("redirects to a login — must be readable signed out");
  }

  if (problems.length) {
    console.log(`  FAIL  ${field.padEnd(24)} ${url}\n        ${problems.join(" · ")}`);
    bad++;
  } else {
    const note = final !== url ? ` → ${final}` : "";
    console.log(`  ok    ${field.padEnd(24)} ${url}${note}`);
  }
}

// The one thing a status code cannot tell you: whether the app page still carries somebody
// else's brand. Cheap to check, and it is the exact thing the bundle flagged.
try {
  const body = await (await fetch("https://app.atrovia.co", { redirect: "follow" })).text();
  if (/vercel\.app/i.test(body)) {
    console.log("  FAIL  Launch URL              page still mentions vercel.app");
    bad++;
  } else {
    console.log("  ok    Launch URL              no vercel.app anywhere in the page");
  }
} catch { /* the fetch above already reported it */ }

console.log(`\n${bad === 0 ? "All fields would pass review." : `${bad} field${bad === 1 ? "" : "s"} would fail review.`}`);
if (bad && process.argv.includes("--check")) process.exit(1);
