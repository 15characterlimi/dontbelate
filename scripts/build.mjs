// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Bundles the TypeScript sources and copies static files into dist/,
// which is the directory to load as an unpacked extension.
// Usage: node scripts/build.mjs [--watch]

import { cp, rm } from "node:fs/promises";
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");

await rm("dist", { recursive: true, force: true });
await cp("static", "dist", { recursive: true });

const options = {
  entryPoints: ["src/background.ts"],
  outdir: "dist",
  bundle: true,
  format: "esm",
  target: "chrome120",
  sourcemap: true,
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
