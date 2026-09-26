import type Konva from "konva";
import type { ShoppableImage } from "@/types";

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const CREAM = "#FDF9E3";
const BROWN = "#5A3D2B";
const ORANGE = "#AD520D";

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Couldn't load ${src}`));
    img.src = src;
  });
}

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/**
 * Renders a look as a 1080×1920 Instagram Story image: the photo with its
 * markers, arrows, and text, the site wordmark, and the look's link — then
 * opens the phone's share sheet (so it can go straight to Instagram) or, on
 * desktop, downloads a JPEG.
 *
 * The photo is fetched through Next's same-origin image optimizer rather
 * than drawn from the editor canvas: the original may live on another origin
 * (Vercel Blob), and drawing a cross-origin image would taint the canvas and
 * make it impossible to export. Only the editor's vector overlays are taken
 * from the Konva stage, with the photo and editor-only helpers hidden.
 */
export async function exportStoryImage({
  stage,
  hideForExport,
  image,
  canvasWidth,
  siteName,
}: {
  stage: Konva.Stage;
  hideForExport: (Konva.Node | null)[];
  image: ShoppableImage;
  canvasWidth: number;
  siteName: string;
}): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable");

  ctx.fillStyle = CREAM;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const areaWidth = STORY_WIDTH - 96;
  const areaHeight = STORY_HEIGHT - 420;
  const fit = Math.min(areaWidth / image.imageWidth, areaHeight / image.imageHeight);
  const photoWidth = Math.round(image.imageWidth * fit);
  const photoHeight = Math.round(image.imageHeight * fit);
  const photoX = Math.round((STORY_WIDTH - photoWidth) / 2);
  const photoY = 150 + Math.round((areaHeight - photoHeight) / 2);

  const optimizerWidth = photoWidth > 1080 ? 2048 : 1080;
  const photo = await loadImage(`/_next/image?url=${encodeURIComponent(image.imageUrl)}&w=${optimizerWidth}&q=90`);

  const hidden = hideForExport.filter((n): n is Konva.Node => Boolean(n));
  hidden.forEach((n) => n.hide());
  let overlay: HTMLCanvasElement;
  try {
    overlay = stage.toCanvas({ pixelRatio: photoWidth / canvasWidth });
  } finally {
    hidden.forEach((n) => n.show());
    stage.batchDraw();
  }

  ctx.save();
  roundedRect(ctx, photoX, photoY, photoWidth, photoHeight, 36);
  ctx.clip();
  ctx.drawImage(photo, photoX, photoY, photoWidth, photoHeight);
  ctx.drawImage(overlay, photoX, photoY, photoWidth, photoHeight);
  ctx.restore();

  await Promise.all([document.fonts.load('88px "Lazydog"'), document.fonts.ready]).catch(() => {});
  const bodyFont = getComputedStyle(document.body).fontFamily || "sans-serif";

  ctx.textAlign = "center";
  ctx.fillStyle = BROWN;
  ctx.font = `88px "Lazydog", Georgia, serif`;
  ctx.fillText(siteName.toLowerCase(), STORY_WIDTH / 2, STORY_HEIGHT - 150);

  ctx.fillStyle = ORANGE;
  ctx.font = `600 32px ${bodyFont}`;
  ctx.fillText(`${window.location.host}/p/${image.slug}`, STORY_WIDTH / 2, STORY_HEIGHT - 90);

  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
  if (!blob) throw new Error("Couldn't encode the Story image");
  const file = new File([blob], `${image.slug}-story.jpg`, { type: "image/jpeg" });

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: image.title });
      return;
    } catch (error) {
      // User closed the share sheet — not a failure; fall through to download.
      if ((error as Error).name === "AbortError") return;
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = file.name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
