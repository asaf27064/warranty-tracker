import sharp from "sharp";
import { readFileSync } from "node:fs";

// Rasterize public/icon.svg into the favicon and PWA icon sizes.
// One-off; sharp is not a project dependency. To regenerate:
//   npm i -D sharp && node scripts/gen-icons.mjs   (from the frontend directory)
const svg = readFileSync(new URL("../public/icon.svg", import.meta.url));

const outputs = {
  "public/logo.png": 256,
  "public/icon-192.png": 192,
  "public/icon-512.png": 512,
};

for (const [file, size] of Object.entries(outputs)) {
  await sharp(svg).resize(size, size).png().toFile(file);
  console.log(`wrote ${file} (${size}x${size})`);
}
