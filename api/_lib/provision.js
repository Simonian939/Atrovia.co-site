/**
 * Fire-and-forget provisioning hook.
 * When PROVISION_WEBHOOK_URL is set, POSTs the paid customer record to your
 * product backend so it can activate Atrovia / Atrium / Kova access.
 * Leave the env var blank during beta — signups are still emailed.
 */
async function triggerProvisioning(data, stripeInfo) {
  const url = process.env.PROVISION_WEBHOOK_URL;
  if (!url) {
    console.log("[provision] PROVISION_WEBHOOK_URL not set — skipping activation hook");
    return;
  }
  const secret = process.env.PROVISION_WEBHOOK_SECRET || "";
  const body = JSON.stringify({ ...data, ...stripeInfo, activatedAt: new Date().toISOString() });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(secret ? { "x-provision-secret": secret } : {}),
      },
      body,
    });
    if (!res.ok) {
      console.error(`[provision] webhook responded ${res.status} — activation may need manual review`);
    } else {
      console.log("[provision] activation hook succeeded");
    }
  } catch (err) {
    console.error("[provision] webhook fetch failed:", err.message);
  }
}

module.exports = { triggerProvisioning };
