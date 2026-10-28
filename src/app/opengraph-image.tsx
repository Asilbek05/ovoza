import { ImageResponse } from "next/og";

export const alt = "ovoza — xatoni ustoz ovozi bilan tushuntiradi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", background: "#072F29", color: "#fff", padding: 72 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="110" height="110" viewBox="0 0 1024 1024"><rect width="1024" height="1024" rx="232" fill="#D4F04F"/><path d="M344 220h336c92.8 0 168 75.2 168 168v176c0 92.8-75.2 168-168 168H460L268 846c-12 8.6-28.8 0-28.8-14.8V700c-39-30-63.2-77-63.2-136V388c0-92.8 75.2-168 168-168z" fill="#0E4A40"/><rect x="286" y="405" width="52" height="130" rx="26" fill="#D4F04F"/><rect x="386" y="345" width="52" height="250" rx="26" fill="#D4F04F"/><rect x="486" y="287" width="52" height="366" rx="26" fill="#D4F04F"/><rect x="586" y="352" width="52" height="236" rx="26" fill="#D4F04F"/><rect x="686" y="411" width="52" height="118" rx="26" fill="#D4F04F"/></svg>
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
