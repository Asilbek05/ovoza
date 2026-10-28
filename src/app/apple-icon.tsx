import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#0E4A40" }}>
        <svg width="180" height="180" viewBox="0 0 1024 1024"><rect width="1024" height="1024" fill="#0E4A40"/><path d="M344 220h336c92.8 0 168 75.2 168 168v176c0 92.8-75.2 168-168 168H460L268 846c-12 8.6-28.8 0-28.8-14.8V700c-39-30-63.2-77-63.2-136V388c0-92.8 75.2-168 168-168z" fill="#D4F04F"/><rect x="286" y="405" width="52" height="130" rx="26" fill="#0E4A40"/><rect x="386" y="345" width="52" height="250" rx="26" fill="#0E4A40"/><rect x="486" y="287" width="52" height="366" rx="26" fill="#0E4A40"/><rect x="586" y="352" width="52" height="236" rx="26" fill="#0E4A40"/><rect x="686" y="411" width="52" height="118" rx="26" fill="#0E4A40"/></svg>
      </div>
    ),
    size,
  );
}
