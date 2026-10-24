// Copyright 2026 Tobias Thierer
// SPDX-License-Identifier: Apache-2.0

// Zips dist/ into release/dontbelate-<version>.zip for uploading to the
// Chrome Web Store. Run via `npm run package`, which rebuilds dist/ first.
//
// The manifest's "key" is left out of the zip, because the Chrome Web Store
// doesn't accept it. The store signs the extension with the matching private
// key, so the extension ID stays the same.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join, relative, sep } from "node:path";
import { deflateRawSync } from "node:zlib";

const manifest = JSON.parse(await readFile("dist/manifest.json", "utf8"));
delete manifest.key;

const files = [];
for (const path of await listFiles("dist")) {
  const name = relative("dist", path).split(sep).join("/");
  const data = name === "manifest.json" ? Buffer.from(JSON.stringify(manifest, null, 2) + "\n") : await readFile(path);
  files.push({ name, data });
}

await mkdir("release", { recursive: true });
const output = `release/dontbelate-${manifest.version}.zip`;
await writeFile(output, zip(files));
console.log(`${output}: ${files.length} files`);

async function listFiles(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    result.push(...(entry.isDirectory() ? await listFiles(path) : [path]));
  }
  return result.sort();
}

// Minimal ZIP writer (deflate, no ZIP64), to avoid a dependency.
// Format: https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT

function zip(files) {
  const local = [];
  const central = [];
  let offset = 0;
  for (const { name, data } of files) {
    const nameBytes = Buffer.from(name, "utf8");
    const compressed = deflateRawSync(data);
    const header = Buffer.alloc(30);
    header.writeUInt32LE(0x04034b50, 0); // local file header signature
    header.writeUInt16LE(20, 4); // version needed to extract
    header.writeUInt16LE(0x0800, 6); // flags: UTF-8 names
    header.writeUInt16LE(8, 8); // method: deflate
    header.writeUInt16LE(0, 10); // modification time
    header.writeUInt16LE(0x21, 12); // modification date: 1980-01-01
    header.writeUInt32LE(crc32(data), 14);
    header.writeUInt32LE(compressed.length, 18);
    header.writeUInt32LE(data.length, 22);
    header.writeUInt16LE(nameBytes.length, 26);
    header.writeUInt16LE(0, 28); // extra field length

    const entry = Buffer.alloc(46);
    entry.writeUInt32LE(0x02014b50, 0); // central directory header signature
    entry.writeUInt16LE(20, 4); // version made by
    header.copy(entry, 6, 4, 30); // fields shared with the local header
    entry.writeUInt16LE(0, 32); // file comment length
    entry.writeUInt16LE(0, 34); // disk number
    entry.writeUInt16LE(0, 36); // internal attributes
    entry.writeUInt32LE(0, 38); // external attributes
    entry.writeUInt32LE(offset, 42); // local header offset

    local.push(header, nameBytes, compressed);
    central.push(entry, nameBytes);
    offset += header.length + nameBytes.length + compressed.length;
  }
  const centralSize = central.reduce((sum, b) => sum + b.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); // end of central directory signature
  end.writeUInt16LE(files.length, 8);
  end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(centralSize, 12);
  end.writeUInt32LE(offset, 16);
  return Buffer.concat([...local, ...central, end]);
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
