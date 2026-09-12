/**
 * Regenerate the app icons from public/assets/tesla-t.svg.
 *
 *   node scripts/make-icons.mjs
 *
 * The PWA/home-screen icons are the red T on a white plate with a generous
 * margin, because a launcher crops and rounds the icon and a T that fills the
 * frame loses its arms. The favicon is the SVG itself — no plate, so the tab
 * shows the red T on whatever the browser's tab colour is.
 */

import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const ROOT = process.cwd();
const SRC = path.join(ROOT, 'public', 'assets', 'tesla-t.svg');
const OUT = path.join(ROOT, 'public', 'assets');

const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

/** Render the T on transparent, cropped tight to the glyph. */
async function glyph() {
  return sharp(fs.readFileSync(SRC), { density: 900 })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

/**
 * One square icon: white plate, T centred at `fill` of the frame.
 * `fill` stays well under 1 so the glyph never touches the edge.
 */
async function plate(size, fill, file) {
  const inner = Math.round(size * fill);
  const t = await sharp(await glyph())
    .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();

  await sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
    .composite([{ input: t, gravity: 'centre' }])
    .png()
    .toFile(path.join(OUT, file));

  console.log(`wrote ${file}  ${size}x${size}  glyph ${inner}px`);
}

const g = await glyph();
const meta = await sharp(g).metadata();
console.log(`glyph trimmed to ${meta.width}x${meta.height}\n`);

await plate(192, 0.56, 'tesla-logo-192.png');
await plate(512, 0.56, 'tesla-logo-512.png');
// Maskable icons get cropped to a circle by the launcher, so they need a
// smaller glyph inside a bigger safe area than the "any" icons.
await plate(512, 0.42, 'tesla-logo-maskable-512.png');
await plate(180, 0.56, 'apple-touch-icon.png');
