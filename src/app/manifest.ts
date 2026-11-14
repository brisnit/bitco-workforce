import type { MetadataRoute } from "next";

/** PWA manifest — lets workers "Add to Home Screen". Not a native app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BITCO Workforce",
    short_name: "BITCO Shop",
    description: "Shop operations. Connected. — prototype",
    start_url: "/worker",
    display: "standalone",
    background_color: "#032641",
    theme_color: "#032641",
    orientation: "portrait",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
