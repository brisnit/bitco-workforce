import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // BITCO Workforce is a client-side prototype backed by browser storage,
  // so Cache Components / Partial Prerendering are intentionally disabled.
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
