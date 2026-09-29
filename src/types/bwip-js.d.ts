// bwip-js only publishes its types under the "node"/"browser" export
// conditions, which TypeScript's bundler resolution doesn't pick. We only use toSVG.
declare module "bwip-js" {
  export function toSVG(options: Record<string, unknown>): string;
  const bwipjs: { toSVG: typeof toSVG };
  export default bwipjs;
}
