export function deflate() {
  throw new Error('Encoding is not part of the campaign boundary.');
}
export const deflateSync = deflate;
export const unzip = deflate;
