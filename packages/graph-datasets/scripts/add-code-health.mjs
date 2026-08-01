// Stamp synthetic code-health metrics (`coverage` / `errors`) onto every
// code-entity node of the Invana code knowledge graph.
//
// The graph itself is real — `understand-anything` produced it from the Invana
// monorepo — but that analyser emits no test-coverage or error counts. The
// health-dashboard demos (`usecases/domains/code-kg/HealthBadges`) need them,
// so they are DERIVED here, offline, from signals the analyser *did* emit:
// the node's complexity bucket, plus a hash of its id for spread. The result is
// deterministic (same input → same numbers, no RNG) and marked as synthetic in
// the module's TSDoc, so nobody mistakes it for measured data.
//
// Only `file` / `function` / `class` nodes get the fields — coverage on a
// config or a markdown document is meaningless, so those stay without them.
//
// Run via `node scripts/add-code-health.mjs` from packages/graph-datasets.
// Idempotent: re-running rewrites the same values.

import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const FILE = resolve(HERE, '../src/usecase-demos/invana-code-kg/knowledge-graph.json');

/** Node types that carry executable code, and therefore a coverage figure. */
const TESTABLE = new Set(['file', 'function', 'class']);

/** Coverage a node of each complexity bucket centres on, before spread. */
const BASE_COVERAGE = { simple: 88, moderate: 74, complex: 56 };

/** FNV-1a — a stable, dependency-free string hash so the spread is reproducible. */
function hash(str) {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h;
}

const graph = JSON.parse(readFileSync(FILE, 'utf8'));

let stamped = 0;
for (const node of graph.nodes) {
  const props = node.data;
  if (!TESTABLE.has(node.type)) {
    delete props.coverage;
    delete props.errors;
    continue;
  }

  const h = hash(node.id);
  const base = BASE_COVERAGE[props.complexity] ?? 70;
  // ±12 points of spread so a bucket reads as a band, not a single value.
  const coverage = Math.max(12, Math.min(100, base + ((h % 25) - 12)));

  // Open errors cluster where coverage is thin — the correlation is what makes
  // the badge pair tell a story rather than look like two random numbers.
  let errors = 0;
  if (coverage < 55) errors = ((h >>> 8) % 3) + 1;
  else if (coverage < 70) errors = (h >>> 8) % 4 === 0 ? 1 : 0;

  props.coverage = coverage;
  props.errors = errors;
  stamped += 1;
}

writeFileSync(FILE, `${JSON.stringify(graph, null, 2)}\n`);

const withErrors = graph.nodes.filter((n) => (n.data.errors ?? 0) > 0).length;
console.log(`stamped ${stamped}/${graph.nodes.length} nodes · ${withErrors} carry open errors`);
