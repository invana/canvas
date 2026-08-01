// One-shot converter: rewrite a JSON-backed dataset from the old property-graph
// records (`{ id, label, properties }`) into the engine-ready `CanvasData` shape
// (`{ id, type, data }`) this package now authors in.
//
// The rename is `label → type`, `properties → data`, and nothing else — no
// records are added, dropped, or reordered, so the diff is purely structural.
// Doing it here, offline, is what lets `data.ts` stay a thin typed view over the
// JSON with no `.map()` on import.
//
// Run via `node scripts/to-canvas-data.mjs <path-to-json> [...]` from
// packages/graph-datasets. Idempotent: a file already in the new shape is left
// untouched.

import { readFileSync, writeFileSync } from 'node:fs';

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error('usage: node scripts/to-canvas-data.mjs <json> [...]');
  process.exit(1);
}

/** `{id,label,properties,…}` → `{id,type,data,…}`, preserving key order elsewhere. */
function convert(record) {
  const out = {};
  for (const [k, v] of Object.entries(record)) {
    if (k === 'label') out.type = v;
    else if (k === 'properties') out.data = v;
    else out[k] = v;
  }
  return out;
}

for (const file of files) {
  const json = JSON.parse(readFileSync(file, 'utf8'));
  let touched = 0;

  for (const key of ['nodes', 'edges']) {
    if (!Array.isArray(json[key])) continue;
    json[key] = json[key].map((record) => {
      if (!('label' in record) && !('properties' in record)) return record;
      touched += 1;
      return convert(record);
    });
  }

  writeFileSync(file, `${JSON.stringify(json, null, 2)}\n`);
  console.log(`${file}: converted ${touched} records`);
}
