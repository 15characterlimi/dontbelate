// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Renders assets/icon.svg into the PNG sizes that Chrome needs.
// Not part of the regular build; run after changing the SVG:
//   npm install --no-save @resvg/resvg-js && node scripts/render-icons.mjs

import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const svg = await readFile("assets/icon.svg", "utf8");
for (const size of [16, 32, 48, 128]) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  await writeFile(`static/icons/icon${size}.png`, png);
  console.log(`static/icons/icon${size}.png`);
}
