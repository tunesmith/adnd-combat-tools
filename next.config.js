const debug = process.env.NODE_ENV !== 'production';
const desktop = process.env.DESKTOP_BUILD === '1';
/** @type {import('next').NextConfig} */
const nextConfig = {
  assetPrefix: !debug && !desktop ? '/adnd-combat-tools/' : '',
  basePath: !debug && !desktop ? '/adnd-combat-tools' : '',
  distDir: desktop ? '.next-desktop' : '.next',
  env: { NEXT_PUBLIC_DESKTOP: desktop ? '1' : '0' },
  webpack(config, { webpack }) {
    if (desktop)
      config.plugins.push(
        new webpack.NormalModuleReplacementPlugin(
          /webFonts\.css$/,
          require('path').resolve(__dirname, 'src/styles/desktopFonts.css')
        )
      );
    return config;
  },
  publicRuntimeConfig: {
    NODE_ENV: process.env.NODE_ENV,
  },
  eslint: {
    // Ensure `next lint` scans our `src/` tree (and root configs)
    dirs: ['src', '.'],
  },
};

module.exports = nextConfig;
