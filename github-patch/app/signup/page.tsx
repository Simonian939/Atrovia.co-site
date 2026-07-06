export const metadata = {
  title: "Get started — Choose Atrium, Kova, or both | Atrovia",
  description: "Pick your plan and create your Atrovia account.",
};

const PLANS = [
  {
    id: "atrium",
    name: "Atrium",
    tag: "Marketing & Growth",
    price: 99,
    color: "#B49BFF",
    desc: "Your AI marketing team — brand, plan, ads, social, and weekly progress.",
  },
  {
    id: "kova",
    name: "Kova",
    tag: "CRM & Sales",
    price: 99,
    color: "#6DF5E2",
    desc: "CRM, follow-up, quotes, and repeat business on autopilot.",
  },
];

export default function SignupPage() {
  return (
    <main style={{ background: "#06060E", color: "#F1F3FF", minHeight: "100vh", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "100px 24px 80px" }}>
        <p style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", color: "#969FC2", marginBottom: 16 }}>
          Get started
        </p>
        <h1 style={{ fontSize: "clamp(32px,5vw,48px)", fontWeight: 900, lineHeight: 1.05, margin: "0 0 16px" }}>
          Choose your plan.<br />
          <span style={{ color: "#6DF5E2" }}>Start with one, or both.</span>
        </h1>
        <p style={{ fontSize: 18, color: "#D7DCF0", maxWidth: 560, marginBottom: 40 }}>
          Atrium runs your marketing and growth. Kova organizes customers and drives repeat business.
          Pick what you need now — add the other anytime.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20, marginBottom: 32 }}>
          {PLANS.map((p) => (
            <div
              key={p.id}
              style={{
                background: "linear-gradient(180deg,rgba(33,39,72,0.6),rgba(16,20,42,0.4))",
                border: `1px solid ${p.color}55`,
                borderRadius: 20,
                padding: 28,
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 900, color: p.color }}>{p.name}</div>
              <div style={{ fontSize: 13, color: "#969FC2", marginBottom: 12 }}>{p.tag}</div>
              <div style={{ fontSize: 38, fontWeight: 900, marginBottom: 8 }}>
                ${p.price}<span style={{ fontSize: 15, color: "#969FC2" }}>/mo</span>
              </div>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#6DF5E2", marginBottom: 14 }}>Billed quarterly</div>
              <p style={{ fontSize: 14, color: "#D7DCF0", lineHeight: 1.5, marginBottom: 20 }}>{p.desc}</p>
              <a
                href="/beta"
                style={{
                  display: "inline-block",
                  background: "#34E0C8",
                  color: "#6D28D9",
                  fontWeight: 800,
                  padding: "14px 24px",
                  borderRadius: 12,
                  textDecoration: "none",
                }}
              >
                Start {p.name} free →
              </a>
            </div>
          ))}
        </div>

        <div
          style={{
            background: "linear-gradient(180deg,rgba(124,58,237,0.12),rgba(52,224,200,0.06))",
            border: "1px solid #272D52",
            borderRadius: 18,
            padding: "24px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 16,
          }}
        >
          <div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>Best value: Both Atrium + Kova</div>
            <div style={{ color: "#D7DCF0", fontSize: 14, marginTop: 6 }}>$198/mo · full platform under one login</div>
          </div>
          <a
            href="/beta"
            style={{
              background: "#34E0C8",
              color: "#6D28D9",
              fontWeight: 800,
              padding: "14px 28px",
              borderRadius: 12,
              textDecoration: "none",
            }}
          >
            Get both →
          </a>
        </div>

        <p style={{ textAlign: "center", color: "#969FC2", fontSize: 13, marginTop: 32 }}>
          7-day free trial · <a href="/beta" style={{ color: "#6DF5E2" }}>Join beta</a> · <a href="/" style={{ color: "#6DF5E2" }}>Home</a>
        </p>
      </div>
    </main>
  );
}