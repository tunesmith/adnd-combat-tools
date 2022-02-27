const debug = process.env.NODE_ENV !== "production";

module.exports = {
  assetPrefix: !debug ? "/adnd-combat-tools/" : "",
  basePath: !debug ? "/adnd-combat-tools" : "",
};
