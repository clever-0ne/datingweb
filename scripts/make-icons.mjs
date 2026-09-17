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

/**
 * The tab icon for browsers that cannot read an SVG favicon.
 *
 * A lot of mobile browsers never look at `rel="icon" type="image/svg+xml"` and
 * fall back to /favicon.ico. With no .ico at the site root those browsers show
 * a blank placeholder where the mark should be — which on a dark tab strip is a
 * dark square. So write a real one, multi-size: 16 and 32 for the tab strip, 48
 * for a bookmark or a taskbar pin.
 *
 * The glyph sits closer to the edge than in a launcher icon — a tab icon has no
 * safe area to respect and shrinks well below the size the plate margin assumes.
 */
async function favicon(sizes) {
  const images = [];
  for (const size of sizes) {
    const inner = Math.round(size * 0.74);
    const t = await sharp(g)
      .resize(inner, inner, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();
    images.push({
      size,
      buf: await sharp({ create: { width: size, height: size, channels: 4, background: WHITE } })
        .composite([{ input: t, gravity: 'centre' }])
        .png()
        .toBuffer(),
    });
  }

  // ICONDIR, then one 16-byte ICONDIRENTRY per image, then the PNG payloads.
  // Every modern browser accepts a PNG inside an .ico; nothing here needs the
  // old uncompressed BMP form.
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(images.length, 4);

  let offset = 6 + images.length * 16;
  const entries = images.map(({ size, buf }) => {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0); // 0 means 256
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt8(0, 2); // palette size — 0 for truecolour
    e.writeUInt8(0, 3); // reserved
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += buf.length;
    return e;
  });

  const ico = Buffer.concat([header, ...entries, ...images.map((i) => i.buf)]);
  fs.writeFileSync(path.join(ROOT, 'public', 'favicon.ico'), ico);
  console.log(`wrote favicon.ico  ${sizes.join('/')}  ${ico.length}b`);
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
await favicon([16, 32, 48]);
