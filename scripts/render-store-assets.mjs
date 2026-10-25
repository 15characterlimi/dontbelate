// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Renders the Chrome Web Store promo tile, assets/store/promo-tile.svg, into
// a PNG without alpha channel, as the store requires. Not part of the
// regular build; run after changing the SVG:
//   npm install --no-save @resvg/resvg-js
//   node scripts/render-store-assets.mjs path/to/Roboto.ttf
// Roboto is available from https://fonts.google.com/specimen/Roboto.

import { readFile, writeFile } from "node:fs/promises";
import { deflateSync } from "node:zlib";
import { Resvg } from "@resvg/resvg-js";

const fontFile = process.argv[2];
if (!fontFile) {
  console.error("Usage: node scripts/render-store-assets.mjs path/to/Roboto.ttf");
  process.exit(1);
}

const svg = await readFile("assets/store/promo-tile.svg", "utf8");
const image = new Resvg(svg, {
  font: { fontFiles: [fontFile], loadSystemFonts: false, defaultFontFamily: "Roboto" },
}).render();
await writeFile("assets/store/promo-tile.png", rgbPng(image.width, image.height, image.pixels));
console.log("assets/store/promo-tile.png");

/** Encodes RGBA `pixels` of an opaque image as a 24-bit RGB PNG. */
function rgbPng(width, height, pixels) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3); // each row starts with filter type 0
    for (let x = 0; x < width; x++) {
      pixels.copy(raw, row + 1 + x * 3, (y * width + x) * 4, (y * width + x) * 4 + 3);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.writeUInt8(8, 8); // bit depth
  header.writeUInt8(2, 9); // color type: RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function crc32(data) {
  crc32.table ??= Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  let crc = 0xffffffff;
  for (const byte of data) crc = crc32.table[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}
