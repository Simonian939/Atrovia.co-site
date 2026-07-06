const { stripe, PLANS, priceIdForTier } = require("./_lib/stripe");

const TIERS = ["atrium", "kova", "both"];
const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://atrovia.co";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { tier, first_name, last_name, email, company, industry, vertical, team_size } = req.body;

    // Validate required fields
    if (!TIERS.includes(tier)) {
      return res.status(400).json({ error: "Invalid plan selected." });
    }
    if (!email || !first_name || !company) {
      return res.status(400).json({ error: "Name, email, and company are required." });
    }

    const priceId = priceIdForTier(tier);
    const plan = PLANS[tier];

    // Store signup data in Stripe metadata so the webhook can read it after payment
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: email,
      subscription_data: {
        metadata: {
          tier,
          first_name: first_name || "",
          last_name:  last_name  || "",
          email,
          company:    company    || "",
          industry:   industry   || "",
          vertical:   vertical   || "",
          team_size:  team_size  || "",
        },
      },
      metadata: { tier, email, company },
      success_url: `${SITE}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${SITE}/beta`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error("[checkout] error:", err.message);
    return res.status(500).json({ error: err.message || "Could not create checkout session." });
  }
};
