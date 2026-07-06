const { stripe } = require("./_lib/stripe");
const { sendWelcomeEmail, sendInternalNotification } = require("./_lib/email");
const { triggerProvisioning } = require("./_lib/provision");
const { PLANS } = require("./_lib/stripe");

// Stripe signature verification needs the exact raw request bytes.
// (config is exported at the bottom, AFTER module.exports is assigned — setting
//  it before the assignment below would silently discard it.)

async function getRawBody(req) {
  // Express (express.raw) hands us a Buffer already; Vercel (bodyParser:false)
  // gives an unread stream. Support both so one handler runs on either host.
  if (Buffer.isBuffer(req.body)) return req.body;
  if (typeof req.body === "string") return Buffer.from(req.body);
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).send("Method not allowed");
  }

  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error("[webhook] STRIPE_WEBHOOK_SECRET not set");
    return res.status(500).send("Webhook secret not configured");
  }

  let event;
  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed:", err.message);
    return res.status(400).send(`Webhook error: ${err.message}`);
  }

  // Only act on confirmed payments
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    // Retrieve the full subscription to get its metadata
    let subMeta = {};
    if (session.subscription) {
      try {
        const sub = await stripe.subscriptions.retrieve(session.subscription);
        subMeta = sub.metadata || {};
      } catch (e) {
        console.warn("[webhook] could not retrieve subscription:", e.message);
      }
    }

    const meta = { ...session.metadata, ...subMeta };
    const tier = meta.tier || "both";
    const plan = PLANS[tier] || PLANS.both;

    const customer = {
      tier,
      first_name: meta.first_name || "",
      last_name:  meta.last_name  || "",
      email:      meta.email      || session.customer_email || "",
      company:    meta.company    || "",
      industry:   meta.industry   || "",
      vertical:   meta.vertical   || "",
      team_size:  meta.team_size  || "",
    };

    const stripeInfo = {
      customerId:     session.customer     || null,
      subscriptionId: session.subscription || null,
    };

    console.log(`[webhook] paid signup — ${customer.email} / ${plan.label}`);

    // Run all post-payment actions in parallel; log errors but don't crash
    const [welcomeResult, internalResult] = await Promise.allSettled([
      sendWelcomeEmail(customer, plan.label),
      sendInternalNotification(customer, plan.label, stripeInfo),
      triggerProvisioning(customer, stripeInfo),
    ]);

    if (welcomeResult.status === "rejected")  console.error("[webhook] welcome email failed:", welcomeResult.reason);
    if (internalResult.status === "rejected") console.error("[webhook] internal email failed:", internalResult.reason);
  }

  return res.status(200).json({ received: true });
}

module.exports = handler;
// Vercel only: preserve the raw body for signature verification (Express ignores this).
module.exports.config = { api: { bodyParser: false } };
