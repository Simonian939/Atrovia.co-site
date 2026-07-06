// Atrovia.co — Node web server for Render (and any Node host).
//
// The site is static HTML, but payments need server code (Stripe Checkout +
// webhook). Render static sites can't run that, so this Express server serves
// the pages AND mounts the two API routes. The handlers in ./api/*.js are kept
// Vercel-compatible, so the same repo still deploys to Vercel unchanged.

const express = require("express");
const path = require("path");

const checkoutHandler = require("./api/checkout");
const webhookHandler = require("./api/webhook");

const app = express();
const ROOT = __dirname;

// Security headers — parity with vercel.json.
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "SAMEORIGIN");
  next();
});

// ── API routes (declared before static so source files are never served) ──
// Checkout: JSON body. Webhook: RAW body (Stripe signature needs the exact bytes).
app.post("/api/checkout", express.json(), (req, res) => checkoutHandler(req, res));
app.post("/api/webhook", express.raw({ type: "*/*" }), (req, res) => webhookHandler(req, res));
// Anything else under /api/ is not a real endpoint — 404 as JSON, never serve .js source.
app.all("/api/*", (req, res) => res.status(404).json({ error: "Not found" }));

// ── Clean URLs — parity with vercel.json rewrites ──
const PAGES = {
  "/": "index.html",
  "/beta": "beta.html",
  "/signup": "beta.html",
  "/success": "success.html",
  "/about": "about.html",
};
for (const [route, file] of Object.entries(PAGES)) {
  app.get(route, (_req, res) => res.sendFile(path.join(ROOT, file)));
}

// ── Static assets — block source/config/script files and dotfiles (.env etc.) ──
const BLOCKED_EXT = new Set([".vbs", ".bat", ".url", ".json", ".js", ".yaml", ".yml", ".lock", ".env"]);
app.use((req, res, next) => {
  if (req.method !== "GET" && req.method !== "HEAD") return next();
  const ext = path.extname(req.path).toLowerCase();
  if (BLOCKED_EXT.has(ext) || req.path.includes("..")) return res.status(404).send("Not found");
  next();
});
app.use(express.static(ROOT, { dotfiles: "deny", index: false, extensions: ["html"] }));

// ── Fallback ──
app.use((_req, res) => res.status(404).send("Not found"));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`[atrovia] site + API listening on :${port}`));
