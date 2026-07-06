const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
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
  if (!priceId) throw new Error(`Missing env var ${plan.priceEnv} — set it in Vercel environment variables.`);
  return priceId;
}

module.exports = { stripe, PLANS, priceIdForTier };
