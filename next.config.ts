import type { NextConfig } from "next";

// GitHub Pages static export: GITHUB_PAGES=1 npm run build:static
const isGhPages = process.env.GITHUB_PAGES === "1";
const repoName = process.env.GH_PAGES_BASE || "kshetramap";

const nextConfig: NextConfig = {
  // Allow Cloudflare / localtunnel hosts when using `next dev` behind a tunnel
  allowedDevOrigins: ["*.trycloudflare.com", "*.loca.lt"],

  // Static hosting (GitHub Pages) — no Node API routes in this mode
  ...(isGhPages
    ? {
        output: "export" as const,
        basePath: `/${repoName}`,
        assetPrefix: `/${repoName}/`,
        images: { unoptimized: true },
        trailingSlash: true,
        env: {
          NEXT_PUBLIC_BASE_PATH: `/${repoName}`,
        },
      }
    : {}),
};

export default nextConfig;
