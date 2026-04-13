import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  transpilePackages: ["lifi-earn-toolkit"],
  turbopack: {
    root: currentDirectory,
  },
};

export default nextConfig;
