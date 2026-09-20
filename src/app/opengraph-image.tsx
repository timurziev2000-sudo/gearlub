import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "GearLab — база знаний о геймерской периферии";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0B0B10",
          backgroundImage:
            "radial-gradient(circle at 50% 120%, rgba(198,255,0,0.18), transparent 60%)",
          color: "#EDEDF2",
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: 110,
            fontWeight: 700,
            letterSpacing: "-0.04em",
          }}
        >
          <span>GEAR</span>
          <span style={{ color: "#C6FF00" }}>LAB</span>
        </div>
        <div
          style={{
            display: "flex",
            marginTop: 24,
            fontSize: 34,
            color: "#9A9AB0",
          }}
        >
          база знаний и подбор геймерской периферии
        </div>
        <div style={{ display: "flex", marginTop: 48, gap: 16 }}>
          {["База данных", "Сравнение", "Калькуляторы"].map((t) => (
            <div
              key={t}
              style={{
                display: "flex",
                padding: "12px 28px",
                border: "1px solid #26263A",
                borderRadius: 999,
                fontSize: 26,
                color: "#00E5FF",
                background: "#12121A",
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
