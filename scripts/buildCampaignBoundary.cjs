const esbuild = require('esbuild');
esbuild.buildSync({
  entryPoints: ['src/helpers/campaignDocument.ts'],
  bundle: true,
  platform: 'neutral',
  format: 'iife',
  globalName: 'CampaignBoundary',
  target: 'es2020',
  outfile: process.argv[2] || 'src-tauri/snapshot-validator.js',
  alias: { zlib: require('path').resolve('scripts/boundaryZlibStub.js') },
  footer: {
    js: 'globalThis.validateCampaignJson = text => { try { return JSON.stringify({document: CampaignBoundary.parseCampaign(text)}); } catch (error) { return JSON.stringify({error: String(error)}); } };',
  },
});
