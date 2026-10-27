import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "tushun. — xatoni ustoz ovozi bilan tushuntiradi",
    short_name: "tushun.",
    description: "Attestatsiya va milliy sertifikat testlari, har bir xatoga ovozli tushuntirish.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F8FF",
    theme_color: "#2557E8",
    lang: "uz",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
