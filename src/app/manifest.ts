import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Minassati — Movies & Series",
    short_name: "Minassati",
    description: "Watch exclusive original movies and series",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "auto",
    lang: "en",
    background_color: "#0a0a0a",
    theme_color: "#0a0a0a",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
