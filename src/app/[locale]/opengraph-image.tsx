import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";

// Default share card for pages without their own photo (home, shop,
// categories…). Look pages override this with the look's own photo.
export const alt = "Aci — shop the look";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(path.join(process.cwd(), "public", "aci-logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 96,
          background: "#fdf9e3",
          color: "#5a3d2b",
        }}
      >
        <img src={logoSrc} width={120} height={120} style={{ borderRadius: 999 }} alt="" />
        <div style={{ marginTop: 40, fontSize: 88, fontWeight: 700, letterSpacing: -2 }}>Shop the look.</div>
        <div style={{ marginTop: 16, fontSize: 40, color: "#8a6a54", maxWidth: 900 }}>
          Tap an item in the photo to see where it&apos;s from.
        </div>
        <div style={{ position: "absolute", right: 96, bottom: 80, width: 64, height: 64, borderRadius: 999, background: "#e5781e" }} />
      </div>
    ),
    size
  );
}
