// src/epic-saga/generator.ts
var NAME_HEADS = [
  "Aer",
  "Bal",
  "Cae",
  "Dor",
  "Eld",
  "Fen",
  "Gar",
  "Hal",
  "Ith",
  "Jor",
  "Kel",
  "Lyr",
  "Mor",
  "Nyx",
  "Orr",
  "Pae",
  "Quel",
  "Rho",
  "Syl",
  "Tor",
  "Ul",
  "Vor",
  "Wyn",
  "Xan",
  "Yr",
  "Zel"
];
var NAME_TAILS = [
  "an",
  "wyn",
  "ric",
  "as",
  "ion",
  "eth",
  "ard",
  "ys",
  "or",
  "ae",
  "ven",
  "ax",
  "iel",
  "un",
  "ora",
  "is",
  "ath",
  "en",
  "yra",
  "ok"
];
var HOUSE_STEMS = [
  "Ashvale",
  "Brackmoor",
  "Cindral",
  "Dunhollow",
  "Emberwick",
  "Frostmere",
  "Grimwald",
  "Hollowmere",
  "Ironvale",
  "Karsten",
  "Lorwyn",
  "Marrowdeep",
  "Northgale",
  "Oakenshield"
];
var PLACE_STEMS = [
  "Aldenreach",
  "Blackfen",
  "Coldharbour",
  "Dawnspire",
  "Elderwatch",
  "Fallowmoor",
  "Greyhaven",
  "Highmarch",
  "Ironhold",
  "Jarrowgate",
  "Kingsbarrow",
  "Longmire",
  "Mistfell",
  "Nightreach",
  "Oldspire",
  "Pinewatch",
  "Quarryhold",
  "Ravensmoot",
  "Stonebrook",
  "Thornkeep",
  "Undermarch",
  "Vaelport",
  "Westwatch",
  "Yarrowden",
  "Zephyrhall",
  "Amberfall"
];
var SUBPLACE_KINDS = [
  "Great Hall",
  "Watchtower",
  "Undercroft",
  "Rookery",
  "Barracks",
  "Sept",
  "Docks",
  "Market",
  "Throne Room",
  "Crypt",
  "Stables",
  "Gatehouse"
];
var TITLE_WORDS = [
  "Ashes",
  "Oath",
  "Winter",
  "Crown",
  "Debt",
  "Storm",
  "Wolf",
  "Ember",
  "Vow",
  "Siege",
  "Exile",
  "Dawn",
  "Reckoning",
  "Bloom",
  "Fracture",
  "Harvest",
  "Omen",
  "Tide",
  "Vigil",
  "Rift",
  "Pyre",
  "Herald",
  "Cinder",
  "Requiem",
  "Thaw"
];
var SYNOPSIS_OPENERS = [
  "An old alliance frays as",
  "A long-buried claim resurfaces when",
  "The council fractures after",
  "A hostage exchange collapses when",
  "News from the north arrives just as",
  "A wedding turns when"
];
var SYNOPSIS_CLOSERS = [
  "two houses meet at the border.",
  "the youngest heir refuses the terms.",
  "a rider brings word of a broken siege.",
  "the harvest fails a second year running.",
  "an envoy is found dead in the undercroft.",
  "the river road is cut for the winter."
];
function mulberry32(seed) {
  let s = seed;
  return () => {
    s |= 0;
    s = s + 1831565813 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function pick(rng, xs) {
  return xs[Math.floor(rng() * xs.length)];
}
function int(rng, lo, hi) {
  return lo + Math.floor(rng() * (hi - lo + 1));
}
function skewedIndex(rng, n, exp = 2.2) {
  return Math.min(n - 1, Math.floor(Math.pow(rng(), exp) * n));
}
var DEFAULTS = {
  seasons: 8,
  episodes: 73,
  scenes: 4165,
  characters: 577,
  houses: 14,
  locations: 26,
  subLocations: 96,
  seed: 1337
};
function generateEpicSaga(options = {}) {
  const o = { ...DEFAULTS, ...options };
  const rng = mulberry32(o.seed);
  const nodes = [];
  const edges = [];
  let edgeSeq = 0;
  const link = (type, source, target, data2 = {}) => {
    edges.push({ id: `e${edgeSeq++}`, type, source, target, data: data2 });
  };
  const houseIds = [];
  for (let i = 0; i < o.houses; i++) {
    const id = `house-${i}`;
    houseIds.push(id);
    nodes.push({
      id,
      type: "house",
      data: {
        name: `House ${HOUSE_STEMS[i % HOUSE_STEMS.length]}`,
        words: `${pick(rng, TITLE_WORDS)} and ${pick(rng, TITLE_WORDS)}`
      }
    });
  }
  const locationIds = [];
  for (let i = 0; i < o.locations; i++) {
    const id = `location-${i}`;
    locationIds.push(id);
    nodes.push({
      id,
      type: "location",
      data: { name: PLACE_STEMS[i % PLACE_STEMS.length], region: pick(rng, ["North", "South", "East", "West", "Isles"]) }
    });
  }
  const sceneVenues = [...locationIds];
  const venueParent = /* @__PURE__ */ new Map();
  for (let i = 0; i < o.subLocations; i++) {
    const id = `subLocation-${i}`;
    const parent = locationIds[i % locationIds.length];
    const parentName = nodes.find((n) => n.id === parent).data.name;
    sceneVenues.push(id);
    venueParent.set(id, parent);
    nodes.push({
      id,
      type: "subLocation",
      data: { name: `${parentName} \u2014 ${pick(rng, SUBPLACE_KINDS)}` }
    });
    link("within", id, parent);
  }
  const seasonIds = [];
  for (let i = 0; i < o.seasons; i++) {
    const id = `season-${i}`;
    seasonIds.push(id);
    nodes.push({ id, type: "season", data: { name: `Season ${i + 1}`, number: i + 1 } });
  }
  const episodeIds = [];
  let airDay = Date.UTC(2201, 2, 14);
  for (let i = 0; i < o.episodes; i++) {
    const id = `episode-${i}`;
    const seasonIdx = Math.floor(i / o.episodes * o.seasons);
    episodeIds.push(id);
    nodes.push({
      id,
      type: "episode",
      data: {
        name: `The ${pick(rng, TITLE_WORDS)} of ${pick(rng, PLACE_STEMS)}`,
        number: i + 1,
        airDate: new Date(airDay).toISOString().slice(0, 10),
        description: `${pick(rng, SYNOPSIS_OPENERS)} ${pick(rng, SYNOPSIS_CLOSERS)}`
      }
    });
    link("part_of", id, seasonIds[seasonIdx]);
    airDay += 7 * 864e5;
  }
  const sceneIds = [];
  const sceneSeconds = [];
  for (let i = 0; i < o.scenes; i++) {
    const id = `scene-${i}`;
    const episodeIdx = Math.floor(i / o.scenes * o.episodes);
    const start = i % 60 * 55;
    const duration = int(rng, 20, 240);
    sceneIds.push(id);
    sceneSeconds.push(duration);
    const venue = pick(rng, sceneVenues);
    nodes.push({
      id,
      type: "scene",
      data: {
        name: `Scene ${i + 1}`,
        start,
        end: start + duration,
        durationSeconds: duration,
        characterCount: 0
        // filled once the cast is assigned
      }
    });
    link("part_of", id, episodeIds[episodeIdx]);
    link("located_at", id, venue);
    const parent = venueParent.get(venue);
    if (parent) link("located_at", id, parent);
  }
  const characterIds = [];
  const usedNames = /* @__PURE__ */ new Set();
  for (let i = 0; i < o.characters; i++) {
    const id = `character-${i}`;
    characterIds.push(id);
    let name = "";
    do {
      name = `${pick(rng, NAME_HEADS)}${pick(rng, NAME_TAILS)}`;
      if (usedNames.has(name)) name = `${name} ${int(rng, 2, 99)}`;
    } while (usedNames.has(name));
    usedNames.add(name);
    nodes.push({
      id,
      type: "character",
      data: { name, screenTimeSeconds: 0, sceneCount: 0, episodeCount: 0 }
    });
    if (rng() < 0.265) link("member_of", id, pick(rng, houseIds));
  }
  const nodeById = new Map(nodes.map((n) => [n.id, n]));
  const coAppear = /* @__PURE__ */ new Map();
  const STORYLINES = 24;
  const storylineOf = (i) => i % STORYLINES;
  const byStoryline = Array.from({ length: STORYLINES }, () => []);
  characterIds.forEach((id, i) => byStoryline[storylineOf(i)].push(id));
  for (let s = 0; s < sceneIds.length; s++) {
    const sceneId = sceneIds[s];
    const seconds = sceneSeconds[s];
    const castSize = int(rng, 1, 5);
    const home = byStoryline[Math.floor(rng() * STORYLINES)];
    const cast = [];
    for (let c = 0; c < castSize; c++) {
      const pool = rng() < 0.88 ? home : characterIds;
      const id = pool[skewedIndex(rng, pool.length)];
      if (!cast.includes(id)) cast.push(id);
    }
    const sceneNode = nodeById.get(sceneId);
    sceneNode.data.characterCount = cast.length;
    for (const id of cast) {
      link("appears_in", id, sceneId);
      const ch = nodeById.get(id);
      ch.data.sceneCount = ch.data.sceneCount + 1;
      ch.data.screenTimeSeconds = ch.data.screenTimeSeconds + seconds;
    }
    for (let a = 0; a < cast.length; a++) {
      for (let b = a + 1; b < cast.length; b++) {
        const key = cast[a] < cast[b] ? `${cast[a]}|${cast[b]}` : `${cast[b]}|${cast[a]}`;
        const acc = coAppear.get(key) ?? { scenes: 0, seconds: 0 };
        acc.scenes += 1;
        acc.seconds += seconds;
        coAppear.set(key, acc);
      }
    }
  }
  for (const [key, acc] of coAppear) {
    const [a, b] = key.split("|");
    link("co_appears_with", a, b, { sharedScenes: acc.scenes, sharedSeconds: acc.seconds });
  }
  const scenesPerEpisode = o.scenes / o.episodes;
  for (const id of characterIds) {
    const ch = nodeById.get(id);
    ch.data.episodeCount = Math.max(1, Math.round(ch.data.sceneCount / scenesPerEpisode));
  }
  return { meta: deriveMeta(nodes, edges), nodes, edges };
}
function deriveMeta(nodes, edges) {
  const typeOf = new Map(nodes.map((n) => [n.id, n.type]));
  const nodeTypes = /* @__PURE__ */ new Map();
  for (const n of nodes) {
    const entry = nodeTypes.get(n.type) ?? { count: 0, properties: {} };
    entry.count++;
    for (const [k, v] of Object.entries(n.data)) entry.properties[k] ??= typeof v;
    nodeTypes.set(n.type, entry);
  }
  const edgeTypes = /* @__PURE__ */ new Map();
  for (const e of edges) {
    const entry = edgeTypes.get(e.type) ?? { count: 0, endpoints: /* @__PURE__ */ new Set(), properties: {} };
    entry.count++;
    entry.endpoints.add(`${typeOf.get(e.source)}\u2192${typeOf.get(e.target)}`);
    for (const [k, v] of Object.entries(e.data)) entry.properties[k] ??= typeof v;
    edgeTypes.set(e.type, entry);
  }
  return {
    name: "Epic Saga",
    description: "A fully synthetic serialised-drama property graph \u2014 seasons, episodes, scenes, characters, houses and locations, with a co-appearance network derived from shared scenes.",
    source: "Generated by @invana/graph-datasets \u2014 no external data.",
    sourceRepo: "",
    nodeCount: nodes.length,
    edgeCount: edges.length,
    schema: {
      nodeTypes: [...nodeTypes].map(([type, v]) => ({ type, count: v.count, properties: v.properties })),
      edgeTypes: [...edgeTypes].map(([type, v]) => ({
        type,
        count: v.count,
        endpoints: [...v.endpoints].map((p) => {
          const [source, target] = p.split("\u2192");
          return { source, target };
        }),
        properties: v.properties
      }))
    }
  };
}

// src/epic-saga/data.ts
var epicSaga = generateEpicSaga();
var data = epicSaga;
var settings = {
  activeLayout: "graph-force",
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: "circle", radius: 3.5 },
          bgStrokeWidth: 0,
          showLabel: false
        }
      },
      edge: {
        style: {
          strokeColor: 9741240,
          strokeWidth: 0.4,
          strokeAlpha: 0.18,
          arrowTargetShape: "none"
        }
      }
    }
  },
  layouts: {
    "graph-force": {
      charge: { strength: -90 },
      link: {},
      collide: {},
      animate: false
    }
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: {
      enabled: true,
      state: "highlighted",
      inactiveState: "dimmed",
      degree: 1,
      direction: "both"
    }
  }
};

export { data, epicSaga, settings as epicSagaSettings, generateEpicSaga };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map