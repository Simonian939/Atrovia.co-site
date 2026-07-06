const { Resend } = require("resend");

const FROM = process.env.EMAIL_FROM || "Atrovia <onboarding@resend.dev>";
const INTERNAL_TO = process.env.INTERNAL_NOTIFY_EMAIL || "Info@atrovia.co";

function getResend() {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY not set — emails will be skipped");
    return null;
  }
  return new Resend(process.env.RESEND_API_KEY);
}

function esc(str) {
  return String(str || "").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function wrap(inner) {
  return `
  <div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#F8FAFC;padding:32px 0;">
    <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid #E2E8F0;border-radius:14px;overflow:hidden;">
      <div style="background:linear-gradient(135deg,#0F2942,#1E3A5F);padding:28px 28px 22px;">
        <div style="font-size:22px;font-weight:800;color:#F1F5F9;letter-spacing:-0.3px;">Atrovia</div>
      </div>
      <div style="padding:28px;color:#0F172A;font-size:15px;line-height:1.6;">${inner}</div>
      <div style="padding:18px 28px;border-top:1px solid #E2E8F0;color:#94A3B8;font-size:12px;">
        Atrovia &middot; <a href="https://atrovia.co" style="color:#3B9EFF;text-decoration:none;">atrovia.co</a>
      </div>
    </div>
  </div>`;
}

async function send({ to, subject, html, replyTo }) {
  const resend = getResend();
  if (!resend) return { ok: false, error: "RESEND_API_KEY not set" };
  const payload = { from: FROM, to, subject, html };
  if (replyTo) payload.replyTo = replyTo;
  const { error } = await resend.emails.send(payload);
  if (error) {
    console.error(`[email] send failed — ${subject} → ${to}:`, error);
    return { ok: false, error: String(error.message || error) };
  }
  return { ok: true };
}

async function sendWelcomeEmail(data, planLabel) {
  const firstName = esc(data.first_name) || "there";
  const html = wrap(`
    <div style="font-size:20px;font-weight:700;margin-bottom:10px;">Welcome to Atrovia, ${firstName} 👋</div>
    <p style="margin:0 0 16px;">Your payment went through and your account is being activated right now.
    You're on <strong>${esc(planLabel)}</strong>, locked in at beta pricing forever.</p>
    <p style="margin:0 0 10px;">Here's what happens next:</p>
    <ul style="margin:0 0 20px;padding-left:20px;color:#334155;">
      <li style="margin-bottom:6px;">Your Atrovia workspace for <strong>${esc(data.company)}</strong> is being set up.</li>
      <li style="margin-bottom:6px;">We'll email you a login link as soon as it's live (usually within minutes).</li>
      <li style="margin-bottom:6px;">Our team will personally configure your setup in week one.</li>
    </ul>
    <a href="https://atrovia.co" style="display:inline-block;background:#3B9EFF;color:#fff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:9px;">Go to Atrovia →</a>
    <p style="margin:22px 0 0;color:#64748B;font-size:13px;">Questions? Reply to this email anytime.</p>
  `);
  return send({ to: data.email, subject: "Welcome to Atrovia — you're in 🎉", html, replyTo: INTERNAL_TO });
}

async function sendInternalNotification(data, planLabel, stripeInfo) {
  function row(k, v) {
    return `<tr><td style="padding:5px 12px 5px 0;color:#64748B;">${k}</td><td style="padding:5px 0;color:#0F172A;font-weight:600;">${esc(v) || "—"}</td></tr>`;
  }
  const html = wrap(`
    <div style="font-size:18px;font-weight:700;margin-bottom:6px;">💳 New paid signup</div>
    <p style="margin:0 0 16px;color:#64748B;">${esc(planLabel)}</p>
    <table style="font-size:14px;border-collapse:collapse;">
      ${row("Name", `${data.first_name} ${data.last_name}`.trim())}
      ${row("Email", data.email)}
      ${row("Company", data.company)}
      ${row("Industry", data.industry)}
      ${row("Team size", data.team_size)}
      ${row("Plan", planLabel)}
      ${row("Stripe customer", stripeInfo.customerId || "—")}
      ${row("Stripe subscription", stripeInfo.subscriptionId || "—")}
    </table>
  `);
  return send({ to: INTERNAL_TO, subject: `New Atrovia signup: ${data.company} — ${planLabel}`, html });
}

module.exports = { sendWelcomeEmail, sendInternalNotification };
