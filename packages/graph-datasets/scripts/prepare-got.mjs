// Build the Game of Thrones property-graph dataset from Jeffrey Lancaster's
// open GoT data (https://github.com/jeffreylancaster/game-of-thrones).
//
// The upstream `episodes.json` is ~1.8 MB of scene transcripts we never ship;
// this script fetches it (plus `characters-groups.json`) **at author time**,
// derives a compact multi-entity graph, and writes only the result to
// `src/game-of-thrones/game-of-thrones.json`. The raw source is never stored
// in the repo — re-run this script to refresh.
//
// Run via `node scripts/prepare-got.mjs` from packages/graph-datasets.
// The script is idempotent (no timestamps in the output → stable diffs).

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, '../src/game-of-thrones');
const OUT_FILE = resolve(OUT_DIR, 'game-of-thrones.json');

const BASE = 'https://jeffreylancaster.com/game-of-thrones/data';
const EPISODES_URL = `${BASE}/episodes.json`;
const GROUPS_URL = `${BASE}/characters-groups.json`;
const SOURCE_SITE = 'https://jeffreylancaster.com/game-of-thrones/';
const SOURCE_REPO = 'https://github.com/jeffreylancaster/game-of-thrones';

/** `h:mm:ss` / `m:ss` timecode → whole seconds. */
function toSeconds(timecode) {
  const parts = timecode.split(':').map((p) => Number.parseInt(p, 10));
  while (parts.length < 3) parts.unshift(0);
  const [h, m, s] = parts;
  return h * 3600 + m * 60 + s;
}

/** Lowercase, hyphenate, trim — stable id-safe slug. */
function slug(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → ${res.status} ${res.statusText}`);
  return res.json();
}

const [{ episodes }, { groups }] = await Promise.all([
  fetchJson(EPISODES_URL),
  fetchJson(GROUPS_URL),
]);

// character name → owning house (last group wins, matching the source viz).
const charHouse = new Map();
for (const g of groups) for (const c of g.characters) charHouse.set(c, g.name);

const nodes = [];
const edges = [];
const node = (id, label, properties) => nodes.push({ id, label, properties });
const edge = (id, label, source, target, properties) =>
  edges.push({ id, label, source, target, properties });

// ── Houses ──────────────────────────────────────────────────────────────
for (const g of groups) {
  node(`house:${slug(g.name)}`, 'house', {
    name: g.name,
    memberCount: g.characters.length,
  });
}

// ── First pass: aggregate character / location / co-appearance stats ─────
const sceneCount = new Map();
const screenTime = new Map();
const episodesOf = new Map(); // char → Set("s.e")
const locationScenes = new Map();
const locations = new Set();
const subLocations = new Set();
const subWithin = new Set(); // `${loc}|${sub}`
const coScenes = new Map(); // `${a}|${b}` (a<b) → shared scene count
const coSeconds = new Map();

const bump = (map, key, by = 1) => map.set(key, (map.get(key) ?? 0) + by);

for (const ep of episodes) {
  for (const sc of ep.scenes) {
    const duration = Math.abs(toSeconds(sc.sceneEnd) - toSeconds(sc.sceneStart));
    const names = [...new Set(sc.characters.map((c) => c.name))].sort();
    if (sc.location) {
      locations.add(sc.location);
      bump(locationScenes, sc.location);
    }
    if (sc.subLocation) subLocations.add(sc.subLocation);
    if (sc.location && sc.subLocation) subWithin.add(`${sc.location}|${sc.subLocation}`);
    for (const n of names) {
      bump(sceneCount, n);
      bump(screenTime, n, duration);
      if (!episodesOf.has(n)) episodesOf.set(n, new Set());
      episodesOf.get(n).add(`${ep.seasonNum}.${ep.episodeNum}`);
    }
    for (let i = 0; i < names.length; i++) {
      for (let j = i + 1; j < names.length; j++) {
        const key = `${names[i]}|${names[j]}`;
        bump(coScenes, key);
        bump(coSeconds, key, duration);
      }
    }
  }
}

// ── Characters (+ member_of house) ───────────────────────────────────────
for (const name of [...sceneCount.keys()].sort()) {
  const house = charHouse.get(name) ?? null;
  node(`character:${slug(name)}`, 'character', {
    name,
    house,
    screenTimeSeconds: screenTime.get(name),
    sceneCount: sceneCount.get(name),
    episodeCount: episodesOf.get(name).size,
  });
  if (house) {
    edge(
      `mem:${slug(name)}__${slug(house)}`,
      'member_of',
      `character:${slug(name)}`,
      `house:${slug(house)}`,
      {},
    );
  }
}

// ── Locations / sub-locations ────────────────────────────────────────────
for (const loc of [...locations].sort()) {
  node(`location:${slug(loc)}`, 'location', {
    name: loc,
    sceneCount: locationScenes.get(loc),
  });
}
for (const sub of [...subLocations].sort()) {
  node(`subloc:${slug(sub)}`, 'subLocation', { name: sub });
}
for (const pair of [...subWithin].sort()) {
  const [loc, sub] = pair.split('|');
  edge(
    `within:${slug(sub)}__${slug(loc)}`,
    'within',
    `subloc:${slug(sub)}`,
    `location:${slug(loc)}`,
    {},
  );
}

// ── Seasons ──────────────────────────────────────────────────────────────
const seasons = [...new Set(episodes.map((e) => e.seasonNum))].sort((a, b) => a - b);
for (const s of seasons) {
  node(`season:${s}`, 'season', {
    seasonNum: s,
    episodeCount: episodes.filter((e) => e.seasonNum === s).length,
  });
}

// ── Episodes + scenes (part_of, located_at, appears_in) ──────────────────
for (const ep of episodes) {
  const epId = `episode:s${ep.seasonNum}e${ep.episodeNum}`;
  node(epId, 'episode', {
    seasonNum: ep.seasonNum,
    episodeNum: ep.episodeNum,
    title: ep.episodeTitle,
    airDate: ep.episodeAirDate ?? null,
    link: ep.episodeLink ?? null,
    description: ep.episodeDescription ?? null,
    sceneCount: ep.scenes.length,
  });
  edge(`part:${epId}__season-${ep.seasonNum}`, 'part_of', epId, `season:${ep.seasonNum}`, {});

  ep.scenes.forEach((sc, i) => {
    const scId = `scene:s${ep.seasonNum}e${ep.episodeNum}-${i}`;
    const duration = Math.abs(toSeconds(sc.sceneEnd) - toSeconds(sc.sceneStart));
    const names = [...new Set(sc.characters.map((c) => c.name))].sort();
    node(scId, 'scene', {
      seasonNum: ep.seasonNum,
      episodeNum: ep.episodeNum,
      sceneIndex: i,
      start: sc.sceneStart,
      end: sc.sceneEnd,
      durationSeconds: duration,
      location: sc.location ?? null,
      subLocation: sc.subLocation ?? null,
      characterCount: names.length,
    });
    edge(`part:${scId}__${epId}`, 'part_of', scId, epId, {});
    if (sc.location) {
      edge(`loc:${scId}__${slug(sc.location)}`, 'located_at', scId, `location:${slug(sc.location)}`, {});
    }
    if (sc.subLocation) {
      edge(`loc:${scId}__sub-${slug(sc.subLocation)}`, 'located_at', scId, `subloc:${slug(sc.subLocation)}`, {});
    }
    for (const n of names) {
      edge(`app:${slug(n)}__${scId}`, 'appears_in', `character:${slug(n)}`, scId, {});
    }
  });
}

// ── Character co-appearance (weighted, undirected) ───────────────────────
for (const [key, shared] of coScenes) {
  const [a, b] = key.split('|');
  edge(
    `co:${slug(a)}__${slug(b)}`,
    'co_appears_with',
    `character:${slug(a)}`,
    `character:${slug(b)}`,
    { sharedScenes: shared, sharedSeconds: coSeconds.get(key) },
  );
}

// ── Derive the graph schema (meta-graph / ontology) ──────────────────────
// Introspect the emitted nodes/edges so the schema can never drift from the
// data: per vertex/relation kind we record its count, the primitive type of
// each property (unioned across records → e.g. `string | null`), and — for
// edges — the observed `{ source, target }` endpoint label-pairs.

/** Relation labels whose direction is not meaningful (symmetric networks). */
const UNDIRECTED = new Set(['co_appears_with']);

/** Compact primitive type name for a JSON value. */
const typeOf = (value) =>
  value === null ? 'null' : Array.isArray(value) ? 'array' : typeof value;

/** Sorted type union with `null` kept last for readability (`string | null`). */
const unionType = (set) => {
  const rest = [...set].filter((t) => t !== 'null').sort();
  return [...rest, ...(set.has('null') ? ['null'] : [])].join(' | ');
};

/** Accumulate `{ key → Set<typeString> }` for one record's property bag. */
const collectProps = (props, into) => {
  for (const [k, v] of Object.entries(props)) {
    if (!into.has(k)) into.set(k, new Set());
    into.get(k).add(typeOf(v));
  }
};

/** Materialise a `{ key → Set }` map into a `{ key: "type union" }` object. */
const propTypes = (map) =>
  Object.fromEntries([...map].map(([k, set]) => [k, unionType(set)]));

const labelOf = new Map(nodes.map((n) => [n.id, n.label])); // id → vertex label

const nodeAgg = new Map(); // label → { count, props }
for (const n of nodes) {
  if (!nodeAgg.has(n.label)) nodeAgg.set(n.label, { count: 0, props: new Map() });
  const a = nodeAgg.get(n.label);
  a.count += 1;
  collectProps(n.properties, a.props);
}

const edgeAgg = new Map(); // label → { count, endpoints, props }
for (const e of edges) {
  if (!edgeAgg.has(e.label)) edgeAgg.set(e.label, { count: 0, endpoints: new Set(), props: new Map() });
  const a = edgeAgg.get(e.label);
  a.count += 1;
  a.endpoints.add(`${labelOf.get(e.source)}>${labelOf.get(e.target)}`);
  collectProps(e.properties, a.props);
}

const schema = {
  nodeTypes: [...nodeAgg].map(([label, a]) => ({
    label,
    count: a.count,
    properties: propTypes(a.props),
  })),
  edgeTypes: [...edgeAgg].map(([label, a]) => ({
    label,
    count: a.count,
    directed: !UNDIRECTED.has(label),
    endpoints: [...a.endpoints].sort().map((pair) => {
      const [source, target] = pair.split('>');
      return { source, target };
    }),
    properties: propTypes(a.props),
  })),
};

// ── Emit ─────────────────────────────────────────────────────────────────
const out = {
  meta: {
    name: 'Game of Thrones',
    description:
      'Multi-entity property graph of HBO’s Game of Thrones — characters, houses, ' +
      'locations, sub-locations, seasons, episodes and scenes, linked by member_of / ' +
      'part_of / located_at / within / appears_in relations, plus a weighted ' +
      'character co-appearance network derived from shared scenes.',
    source: SOURCE_SITE,
    sourceRepo: SOURCE_REPO,
    nodeCount: nodes.length,
    edgeCount: edges.length,
    schema,
  },
  nodes,
  edges,
};

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(out));

const byLabel = (arr) =>
  Object.entries(
    arr.reduce((acc, x) => ((acc[x.label] = (acc[x.label] ?? 0) + 1), acc), {}),
  )
    .map(([k, v]) => `${k}:${v}`)
    .join(', ');
console.log(`Wrote game-of-thrones.json — ${nodes.length} nodes, ${edges.length} edges`);
console.log(`  node labels → ${byLabel(nodes)}`);
console.log(`  edge labels → ${byLabel(edges)}`);
