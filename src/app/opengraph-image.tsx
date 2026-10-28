import { ImageResponse } from "next/og";

export const alt = "ovoza — xatoni ustoz ovozi bilan tushuntiradi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#072F29", color: "#fff", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 64 64">
            <rect width="64" height="64" rx="18" fill="#D4F04F" />
            <g transform="translate(1.25 0)" fill="none" stroke="#0E4A40" strokeLinecap="round" strokeWidth="4.5">
              <circle cx="22" cy="32" r="8.5" fill="#0E4A40" stroke="none" />
              <path d="M35 21.1A17 17 0 0 1 35 42.9" />
              <path d="M41.9 15.3A26 26 0 0 1 41.9 48.7" opacity="0.5" />
            </g>
          </svg>
          <div style={{ fontSize: 76, fontWeight: 800, letterSpacing: -4 }}>ovoza</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 86, fontWeight: 700, lineHeight: 1.02, letterSpacing: -3, maxWidth: 980 }}>Xatoni ustoz ovozi bilan tushuntiradi</div>
          <div style={{ fontSize: 34, color: "#D4F04F" }}>Attestatsiya · Milliy sertifikat</div>
        </div>
      </div>
    ),
    size,
  );
}
