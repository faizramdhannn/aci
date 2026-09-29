import bwipjs from "bwip-js";

/** Server-side SVG barcodes for printed labels (no client JS, prints crisply). */

export function code128Svg(text: string): string {
  return bwipjs.toSVG({ bcid: "code128", text, height: 12, includetext: false, paddingwidth: 0, paddingheight: 0 });
}

export function qrSvg(text: string): string {
  return bwipjs.toSVG({ bcid: "qrcode", text, eclevel: "M", paddingwidth: 0, paddingheight: 0 });
}
