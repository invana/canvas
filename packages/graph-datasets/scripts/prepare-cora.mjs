// Pre-strip the Cora citation network CSVs to compact JSON for runtime
// import. The raw nodes CSV ships an 11 MB binary feature matrix
// (1433 dims × 2,708 papers) that the viewer never reads — keeping it
// out of the bundle drops the package's emitted weight by ~99%.
//
// Run via `node scripts/prepare-cora.mjs` from packages/graph-datasets.
// Re-run after touching the CSVs; the script is idempotent.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DATA = resolve(HERE, '../src/usecase-demos/cora');

/**
 * Single-pass CSV row parser that handles quoted fields with embedded
 * commas. Not RFC-4180-strict (no escaped quotes inside quoted fields)
 * — Cora's CSV doesn't need that.
 */
function parseCsvLine(line) {
  const out = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      const end = line.indexOf('"', i + 1);
      out.push(line.slice(i + 1, end));
      i = end + 2; // skip the closing quote and the trailing comma
    } else {
      const next = line.indexOf(',', i);
      if (next === -1) {
        out.push(line.slice(i));
        break;
      }
      out.push(line.slice(i, next));
      i = next + 1;
    }
  }
  return out;
}

function readCsv(path) {
  const text = readFileSync(path, 'utf8');
  const lines = text.split('\n').filter((l) => l.length > 0);
  const header = parseCsvLine(lines[0]);
  const rows = lines.slice(1).map(parseCsvLine);
  return { header, rows };
}

// ── Nodes ───────────────────────────────────────────────────────────────
const { header: nodeHeader, rows: nodeRows } = readCsv(resolve(DATA, 'nodes.csv'));
// header: ["", "nodeId", "labels", "subject", "features"]
const ID_COL      = nodeHeader.indexOf('nodeId');
const SUBJECT_COL = nodeHeader.indexOf('subject');

// Emitted in the engine-ready `CanvasData` shape: the subject is both the
// node's `type` (so a colour-by-type behaviour partitions the network with no
// consumer wiring) and its `data.subject` (so a card / legend can read it).
const nodes = nodeRows.map((r) => ({
  id: r[ID_COL],
  type: r[SUBJECT_COL],
  data: { subject: r[SUBJECT_COL] },
}));

// ── Edges ───────────────────────────────────────────────────────────────
const { header: edgeHeader, rows: edgeRows } = readCsv(resolve(DATA, 'edges.csv'));
// header: ["", "sourceNodeId", "targetNodeId", "relationshipType"]
const SRC_COL = edgeHeader.indexOf('sourceNodeId');
const TGT_COL = edgeHeader.indexOf('targetNodeId');

const edges = edgeRows.map((r, i) => ({
  id: `e${i}`,
  source: r[SRC_COL],
  target: r[TGT_COL],
}));

// Drop any edges whose endpoints aren't in the node set (CSV integrity
// safety net — Cora is clean but we don't want to find out the hard way
// at render time).
const idSet = new Set(nodes.map((n) => n.id));
const cleanEdges = edges.filter((e) => idSet.has(e.source) && idSet.has(e.target));

const out = { nodes, edges: cleanEdges };
writeFileSync(resolve(DATA, 'cora.json'), JSON.stringify(out));

const subjects = new Set(nodes.map((n) => n.type));
console.log(
  `Wrote cora.json — ${nodes.length} nodes, ${cleanEdges.length} edges, ` +
    `${subjects.size} subjects: ${[...subjects].join(', ')}`,
);
