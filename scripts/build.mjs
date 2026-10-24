// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Bundles the TypeScript sources and copies static files into dist/,
// which is the directory to load as an unpacked extension.
// Usage: node scripts/build.mjs [--watch | --release]
//   --release: omit source maps (for packaging)

import { cp, rm } from "node:fs/promises";
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const release = process.argv.includes("--release");

await rm("dist", { recursive: true, force: true });
await cp("static", "dist", { recursive: true });

const options = {
  entryPoints: ["src/background.ts", "src/options.ts"],
  outdir: "dist",
  bundle: true,
  format: "esm",
  target: "chrome120",
  sourcemap: !release,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
