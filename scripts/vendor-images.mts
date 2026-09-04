/**
 * Downloads every photograph the app uses into `public/img/` as WebP.
 *
 *   npm run vendor:images
 *
 * Propster is demonstrated live, sometimes on conference wifi, so the app must
 * not depend on a third-party CDN to render. This script is the reproducible
 * record of where each asset came from and how it was derived: re-running it
 * regenerates `public/img/` byte-for-byte.
 *
 * Sizes are chosen per role rather than uniformly. A full-bleed hero needs
 * 1920px; a 330px-wide evidence fragment does not, and shipping one would cost
 * a megabyte for nothing.
 *
 * Source: Unsplash. The Unsplash licence permits free use, including
 * commercially, without permission or attribution; `public/img/CREDITS.md`
 * records the source of each file anyway.
 */
import { mkdir, writeFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";

type Role = "fullbleed" | "panel" | "listing";

/** Widths emitted per role: [large, small]. */
const WIDTHS: Record<Role, [number, number]> = {
  // Hero, the sticky property, the closing image.
  fullbleed: [1920, 960],
  // Editorial panels and the pinned investigation subject.
  panel: [1280, 720],
  // Property cards and the detail page.
  listing: [1280, 640],
};

interface Asset {
  /** Unsplash photo id. */
  id: string;
  /** Local basename, also the stable key used from the code. */
  name: string;
  role: Role;
  /** Why this asset exists. Mirrors the art-direction manifest. */
  note: string;
}

const ASSETS: Asset[] = [
  // --- Landing page ---------------------------------------------------------
  { id: "1600566753190-17f0baa2a6c3", name: "hero", role: "fullbleed", note: "Landing hero" },
  { id: "1618221195710-dd6b41faaea6", name: "interior", role: "fullbleed", note: "The property" },
  { id: "1600210492486-724fe5c67fb0", name: "doubt", role: "fullbleed", note: "The doubt" },
  { id: "1613490493576-7fde63acd811", name: "finale", role: "fullbleed", note: "Final CTA" },
  { id: "1600607687939-ce8a6c25118c", name: "use-verify", role: "panel", note: "Use case 02" },

  // Property #04 appears on the landing page and is also a seeded listing.
  { id: "1512917774080-9991f1c4c750", name: "property-04", role: "panel", note: "Property #04" },
  { id: "1502672260266-1c1ef2d93688", name: "lekki-bq", role: "panel", note: "Use case 01 / listing" },

  // --- Seeded listings ------------------------------------------------------
  { id: "1493809842364-78817add7ffb", name: "chevron", role: "listing", note: "Chevron flat" },
  { id: "1522708323590-d24dbb6b0267", name: "waterfront", role: "listing", note: "Waterfront / studio" },
  { id: "1560448204-e02f11c3d0e2", name: "agungi", role: "listing", note: "Agungi apartment" },
  { id: "1484154218962-a197022b5858", name: "osapa", role: "listing", note: "Osapa apartment" },
  { id: "1493663284031-b7e3aefcae8e", name: "sangotedo", role: "listing", note: "Sangotedo flat" },
  { id: "1502005229762-cf1b2da7c5d6", name: "ajah", role: "listing", note: "Ajah apartment" },
  { id: "1568605114967-8130f3a36994", name: "ikoyi", role: "listing", note: "Ikoyi duplex" },
  { id: "1545324418-cc1a3fa10c00", name: "vi-serviced", role: "listing", note: "Victoria Island" },
  { id: "1505873242700-f289a29e1e0f", name: "yaba", role: "listing", note: "Yaba flat" },
  { id: "1580587771525-78b9dba3b914", name: "ikeja", role: "listing", note: "Ikeja bungalow" },
];

const OUT_DIR = join(process.cwd(), "public", "img");

/** Ask Unsplash's image pipeline for WebP directly, so no local encoder is needed. */
function sourceUrl(id: string, width: number): string {
  const params = new URLSearchParams({
    fm: "webp",
    q: "70",
    w: String(width),
    fit: "crop",
    auto: "compress",
  });
  return "https://images.unsplash.com/photo-" + id + "?" + params.toString();
}

async function download(url: string, destination: string): Promise<number> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("HTTP " + response.status + " for " + url);
  }
  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.length < 1024) {
    throw new Error("Suspiciously small response (" + bytes.length + " bytes) for " + url);
  }
  await writeFile(destination, bytes);
  return bytes.length;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let total = 0;
  const credits: string[] = [];

  for (const asset of ASSETS) {
    const [large, small] = WIDTHS[asset.role];

    const largeBytes = await download(
      sourceUrl(asset.id, large),
      join(OUT_DIR, asset.name + ".webp"),
    );
    const smallBytes = await download(
      sourceUrl(asset.id, small),
      join(OUT_DIR, asset.name + "-sm.webp"),
    );

    total += largeBytes + smallBytes;
    console.log(
      asset.name.padEnd(14) +
        " " +
        String(Math.round(largeBytes / 1024)).padStart(4) +
        "KB + " +
        String(Math.round(smallBytes / 1024)).padStart(4) +
        "KB   " +
        asset.note,
    );

    credits.push(
      "| `" + asset.name + "` | " + asset.note + " | " +
        "https://unsplash.com/photos/" + asset.id + " |",
    );
  }

  await writeFile(
    join(OUT_DIR, "CREDITS.md"),
    [
      "# Image credits",
      "",
      "Photography vendored into this repository by `npm run vendor:images`.",
      "All images are from [Unsplash](https://unsplash.com), whose licence permits",
      "free use without attribution. They are credited here regardless.",
      "",
      "Each asset is emitted at two widths: `<name>.webp` and `<name>-sm.webp`.",
      "",
      "| File | Role | Source |",
      "| --- | --- | --- |",
      ...credits,
      "",
    ].join("\n"),
    "utf8",
  );

  console.log("");
  console.log(
    ASSETS.length * 2 + " files, " + (total / 1024 / 1024).toFixed(2) + "MB total in public/img/",
  );
}

await main();

// Report what actually landed on disk, as a check against the numbers above.
const files = await readdir(OUT_DIR);
const sizes = await Promise.all(
  files.map(async (f) => (await stat(join(OUT_DIR, f))).size),
);
console.log(
  "On disk: " +
    files.length +
    " files, " +
    (sizes.reduce((a, b) => a + b, 0) / 1024 / 1024).toFixed(2) +
    "MB",
);
