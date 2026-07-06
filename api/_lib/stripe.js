const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn("[stripe] STRIPE_SECRET_KEY not set — checkout will fail until it is configured.");
}

// Use a placeholder if the key is missing so requiring this module never throws
// at startup (which would take down the whole Express site, not just checkout).
// Real API calls with the placeholder fail cleanly and are caught by the routes.
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_placeholder_not_configured", {
  apiVersion: "2025-01-27.acacia",
  appInfo: { name: "atrovia.co" },
});

const PLANS = {
  atrium: { label: "Atrium — AI Marketing Team", priceEnv: "STRIPE_PRICE_ATRIUM", amountLabel: "$99/mo" },
  kova:   { label: "Kova — CRM + ERP",           priceEnv: "STRIPE_PRICE_KOVA",   amountLabel: "$99/mo" },
  both:   { label: "Atrovia Full Platform",       priceEnv: "STRIPE_PRICE_BOTH",   amountLabel: "$198/mo" },
};

function priceIdForTier(tier) {
  const plan = PLANS[tier];
  if (!plan) throw new Error(`Unknown tier: ${tier}`);
  const priceId = process.env[plan.priceEnv];
  if (!priceId) throw new Error(`Missing env var ${plan.priceEnv} — set it in your host's environment variables (Render/Vercel dashboard).`);
  return priceId;
}

module.exports = { stripe, PLANS, priceIdForTier };
