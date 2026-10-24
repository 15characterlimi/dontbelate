// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Bundles the TypeScript sources and copies static files into dist/,
// which is the directory to load as an unpacked extension.
// Usage: node scripts/build.mjs [--watch | --release]
//   --release: omit source maps (for packaging)
//
// Reads optional settings from config.local.json; see config.local.example.json.

import { cp, readFile, rm } from "node:fs/promises";
import * as esbuild from "esbuild";

const watch = process.argv.includes("--watch");
const release = process.argv.includes("--release");

const workspace = await readWorkspaceConfig();

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
  define: { __WORKSPACE_CLIENT__: JSON.stringify(workspace ?? null) },
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}

async function readWorkspaceConfig() {
  let config;
  try {
    config = JSON.parse(await readFile("config.local.json", "utf8"));
  } catch (e) {
    if (e.code === "ENOENT") return undefined;
    throw new Error(`Reading config.local.json failed: ${e.message}`);
  }
  const workspace = config.workspace;
  if (workspace === undefined) return undefined;
  if (typeof workspace.domain !== "string" || typeof workspace.clientId !== "string") {
    throw new Error('config.local.json: "workspace" needs string "domain" and "clientId" properties');
  }
  console.log(`Using the Workspace OAuth client for ${workspace.domain}`);
  return { domain: workspace.domain, clientId: workspace.clientId };
}
