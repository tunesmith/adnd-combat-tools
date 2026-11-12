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
  // Previous is serialized exclusively from the accepted native Session document.
  // Validate the new untrusted document fully; do not replay validation of old history.
  footer: {
    js: 'globalThis.validateCampaignJson = (text,previous,purpose) => { try { return JSON.stringify({document: (()=>{const doc=CampaignBoundary.parseCampaign(text);if(previous)CampaignBoundary.validateHistoryTransition(JSON.parse(previous),doc,purpose);return doc;})()}); } catch (error) { return JSON.stringify({error: String(error)}); } };',
  },
});
