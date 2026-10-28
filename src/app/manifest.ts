import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ovoza — xatoni ustoz ovozi bilan tushuntiradi",
    short_name: "ovoza",
    description: "Attestatsiya va milliy sertifikat testlari, har bir xatoga ovozli tushuntirish.",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F2EA",
    theme_color: "#0E4A40",
    lang: "uz",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
