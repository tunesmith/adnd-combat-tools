const debug = process.env.NODE_ENV !== "production";
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: !debug ? "/adnd-combat-tools/" : "",
  basePath: !debug ? "/adnd-combat-tools" : "",
  publicRuntimeConfig: {
    NODE_ENV: process.env.NODE_ENV,
  },
  eslint: {
    // Ensure `next lint` scans our `src/` tree (and root configs)
    dirs: ["src", "."],
  },
};

module.exports = nextConfig;
