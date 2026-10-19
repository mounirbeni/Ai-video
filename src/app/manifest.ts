import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Nexora — Stories Beyond Reality",
    short_name: "Nexora",
    description: "Watch exclusive original movies and series",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "auto",
    lang: "en",
    background_color: "#03040c",
    theme_color: "#03040c",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
