import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Pin Turbopack root so Next doesn't infer a parent dir from a stray
  // sibling package-lock.json. Without this, builds load from the wrong root.
  turbopack: { root },
};

export default nextConfig;
