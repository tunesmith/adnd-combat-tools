const debug = process.env.NODE_ENV !== "production";

module.exports = {
  i18n: {
    locales: ["en"],
    defaultLocale: "en",
  },
  assetPrefix: !debug ? "/adnd-combat-tools/" : "",
  basePath: !debug ? "/adnd-combat-tools" : "",
};
