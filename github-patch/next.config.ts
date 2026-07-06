import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/app", destination: "/atrovia-site.html" },
      { source: "/customer", destination: "/atrovia-site.html" },
    ];
  },
};

export default nextConfig;