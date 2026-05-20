import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "OkoaTime — Saving Time, Delivering Convenience";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#001F5B",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px",
          fontFamily: "sans-serif",
        }}
      >
        {/* Logo row */}
        <div style={{ display: "flex", alignItems: "center", gap: "28px", marginBottom: "36px" }}>
          <div
            style={{
              width: "88px",
              height: "88px",
              background: "#E07B00",
              borderRadius: "22px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "48px",
            }}
          >
            ⏱️
          </div>
          <div style={{ display: "flex", fontSize: "80px", fontWeight: 900, color: "white", letterSpacing: "-2px" }}>
            Okoa<span style={{ color: "#E07B00" }}>Time</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "34px",
            color: "rgba(255,255,255,0.75)",
            textAlign: "center",
            maxWidth: "820px",
            lineHeight: 1.4,
            marginBottom: "52px",
          }}
        >
          Saving Time, Delivering Convenience.
        </div>

        {/* Feature pills */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", justifyContent: "center" }}>
          {["🛵  Bike Delivery", "⛵  Boat Delivery", "📱  M-Pesa Payments", "🗺️  Live GPS Tracking"].map((item) => (
            <div
              key={item}
              style={{
                background: "rgba(255,255,255,0.10)",
                border: "1.5px solid rgba(255,255,255,0.20)",
                borderRadius: "14px",
                padding: "14px 28px",
                color: "white",
                fontSize: "22px",
              }}
            >
              {item}
            </div>
          ))}
        </div>

        {/* Location */}
        <div style={{ marginTop: "52px", fontSize: "22px", color: "rgba(255,255,255,0.40)" }}>
          🇰🇪  Lamu · Shela · Manda Island — Kenya
        </div>
      </div>
    ),
    { ...size }
  );
}
