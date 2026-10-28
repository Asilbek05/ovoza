import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0E4A40" }}>
        <svg width="180" height="180" viewBox="0 0 64 64">
          <g transform="translate(1.25 0)" fill="none" stroke="#D4F04F" strokeLinecap="round" strokeWidth="4.5">
            <circle cx="22" cy="32" r="8.5" fill="#D4F04F" stroke="none" />
            <path d="M35 21.1A17 17 0 0 1 35 42.9" />
            <path d="M41.9 15.3A26 26 0 0 1 41.9 48.7" opacity="0.5" />
          </g>
        </svg>
      </div>
    ),
    size,
  );
}
