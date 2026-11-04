const debug = process.env.NODE_ENV !== 'production';
const desktop = process.env.DESKTOP_BUILD === '1';
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: !debug && !desktop ? '/adnd-combat-tools/' : '',
  basePath: !debug && !desktop ? '/adnd-combat-tools' : '',
  distDir: desktop ? '.next-desktop' : '.next',
  env: { NEXT_PUBLIC_DESKTOP: desktop ? '1' : '0' },
  publicRuntimeConfig: {
    NODE_ENV: process.env.NODE_ENV,
  },
  eslint: {
    // Ensure `next lint` scans our `src/` tree (and root configs)
    dirs: ['src', '.'],
  },
};

module.exports = nextConfig;
