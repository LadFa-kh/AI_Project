import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['192.168.1.38'],
  // Required for the Docker build (frontend.Dockerfile): produces a pruned
  // .next/standalone folder with just the files needed to run `node
  // server.js`, instead of needing the full node_modules tree copied into
  // the final image.
  output: "standalone",
  // ...any other top-level config
}

export default nextConfig;
