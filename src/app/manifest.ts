import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ovoza — xatoni ustoz ovozi bilan tushuntiradi",
    short_name: "ovoza",
    description: "Attestatsiya va milliy sertifikat testlari, har bir xatoga ovozli tushuntirish.",
    start_url: "/",
    display: "standalone",
    background_color: "#F5F2F8",
    theme_color: "#3B1FA8",
    lang: "uz",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
