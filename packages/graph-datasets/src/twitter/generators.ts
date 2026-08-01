/**
 * **Twitter activity — the generator halves.**
 *
 * The dataset used to be one 150-line function that built every node type and
 * every edge type inline. Here it's a **declarative spec per type**: each node
 * type lists its properties, and each property is produced by its own
 * `<name>_func` generator. Adding a field to a node type is one line; changing
 * how a field is drawn never means reading the surrounding loop.
 *
 * Two rules hold the pieces together:
 *
 * 1. **Property generators run in declaration order**, and each one receives the
 *    record built so far (`self`). That's what lets `avatar_func` return
 *    `self.handle`, or `author_func` look up the user `authorId_func` just
 *    picked.
 * 2. **Generators never close over shared mutable state** — everything they need
 *    (the seeded RNG, the id pools filled so far, a node lookup) arrives on the
 *    {@link GeneratorContext}. That's what makes a type's spec readable on its
 *    own, and the whole run reproducible from `seed`.
 *
 * Node types are generated in `NODE_GENERATORS` order, so a type may reference
 * any type declared before it. Edges run last, once every pool is complete.
 */

import type { GraphEdge, GraphNode } from '@invana/graph';

// ─── Content pools ───────────────────────────────────────────────────────────

const HANDLES = [
  'ada', 'grace', 'linus', 'margaret', 'dijkstra', 'turing', 'hopper', 'knuth',
  'lovelace', 'berners_lee', 'ritchie', 'thompson', 'carmack', 'norvig', 'hinton',
  'lecun', 'karpathy', 'swyx', 'dhh', 'gvanrossum',
];
const NAMES = [
  'Ada Lovelace', 'Grace Hopper', 'Linus Torvalds', 'Margaret Hamilton', 'Edsger Dijkstra',
  'Alan Turing', 'Admiral Hopper', 'Donald Knuth', 'Augusta Ada', 'Tim Berners-Lee',
  'Dennis Ritchie', 'Ken Thompson', 'John Carmack', 'Peter Norvig', 'Geoffrey Hinton',
  'Yann LeCun', 'Andrej Karpathy', 'Shawn Wang', 'David H. H.', 'Guido van Rossum',
];
const BIOS = [
  'building things on the internet', 'opinions are my own', 'ship it 🚀',
  'computer scientist · coffee', 'making software less terrible', 'ex-everything',
];
const TAGS = [
  'webgpu', 'typescript', 'graphs', 'dataviz', 'opensource', 'rustlang',
  'ai', 'compilers', 'pixijs', 'react', 'devtools', 'algorithms',
];
const TWEETS = [
  'Just shipped a WebGPU renderer that does 1M nodes at 60fps. Wild times.',
  'Hot take: the best graph layout is the one your users can actually read.',
  'TypeScript discriminated unions are the unsung hero of clean code.',
  'Spent all day on a bug. It was a missing await. It is always a missing await.',
  'New blog post: building a node card designer from scratch. Link below 👇',
  'Force-directed layouts feel like magic until you have 10k edges.',
  'Refactored 2k lines into 400. Deleted code is the best code.',
  'Theming via roles → one switch recolours the whole canvas. So satisfying.',
  'Why is timezone handling still this hard in 2024?',
  'Open-sourced our template engine today. PRs welcome!',
  'The composite shape primitive turned out way more reusable than expected.',
  'Reminder: premature optimization is the root of all 2am debugging.',
];
const COMMENTS = [
  'this is incredible work 🔥', 'how does it handle very large graphs?',
  'finally someone said it', 'bookmarking for later', 'love the API design',
  'does it support custom shapes?', 'the demo is buttery smooth', 'star ⭐ added',
  'what about accessibility?', 'underrated thread', 'commenting to find later', 'pure gold',
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DAY = 86_400_000;
/** Fixed instant, so every generated timestamp label is stable across runs. */
const WINDOW_END = Date.UTC(2024, 2, 8);
const WINDOW_START = WINDOW_END - 7 * DAY;

/** `Mar 3, 14:05` — the label form the cards and tooltips show. */
function shortTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${hh}:${mm}`;
}

/** Deterministic PRNG (mulberry32) — same seed, same graph. */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ─── Generator contract ──────────────────────────────────────────────────────

/** A node's attribute bag. Values stay primitive so the data serialises. */
export type NodeProperties = Record<string, string | number | boolean>;

/** A generated node: the engine's record with a guaranteed `data` bag. */
export type GeneratedNode = GraphNode & { type: string; data: NodeProperties };

/**
 * Everything a generator is allowed to read. Passed to every `*_func`, so no
 * generator closes over the run's mutable state — which is what keeps a spec
 * readable in isolation and the whole run reproducible from `seed`.
 */
export interface GeneratorContext {
  /** Seeded PRNG in `[0, 1)`. */
  rnd(): number;
  /** Seeded integer in `[0, n)`. */
  int(n: number): number;
  /** Seeded pick from a non-empty array. */
  pick<T>(arr: readonly T[]): T;
  /** Node ids by node type, for every type generated **before** this one. */
  ids: Readonly<Record<string, readonly string[]>>;
  /** Look up an already-generated node — e.g. to copy its author's handle. */
  node(id: string): GeneratedNode;
  /** The resolved option bag for this run (counts + seed). */
  options: Required<TwitterDatasetOptions>;
}

/**
 * Produces one property value. Runs in declaration order and receives the
 * record built so far, so a later property can derive from an earlier one
 * (`avatar_func` → `self.handle`).
 *
 * @param ctx   the run context
 * @param index 0-based index within this node type
 * @param self  the properties resolved so far for this node
 */
export type PropertyGeneratorFunc = (
  ctx: GeneratorContext,
  index: number,
  self: NodeProperties,
) => string | number | boolean;

/**
 * One node type. `properties` keys carry the **`_func` suffix** — the key minus
 * that suffix is the property name written to `data`.
 */
export interface NodeTypeGenerator {
  /** The `type` stamped on every node this generator makes. */
  type: string;
  /** How many to make, read off the run's options. */
  count_func: (ctx: GeneratorContext) => number;
  /** Node id. Keep these prefixed per type so ids stay readable (`u3`, `t12`). */
  id_func: (ctx: GeneratorContext, index: number) => string;
  /** `<name>_func` → the generator for `data.<name>`, run in declaration order. */
  properties: Record<string, PropertyGeneratorFunc>;
}

/**
 * One edge type. Iterates the nodes of `from` and makes `count_func` edges for
 * each, so every edge kind reads as "for each X, link …" — including the ones
 * that used to be created as a side effect of building a node.
 */
export interface EdgeTypeGenerator {
  /** The `type` stamped on every edge this generator makes. */
  type: string;
  /** Node type to iterate. One pass over every node of this type. */
  from: string;
  /** Edges to make per node of {@link from}. Return `0` to skip that node. */
  count_func: (ctx: GeneratorContext, node: GeneratedNode) => number;
  /** Source node id for the k-th edge off `node`. */
  source_func: (ctx: GeneratorContext, node: GeneratedNode, k: number) => string;
  /** Target node id for the k-th edge off `node`. `''` drops the edge. */
  target_func: (ctx: GeneratorContext, node: GeneratedNode, k: number) => string;
}

/** Knobs for {@link runGenerators}. Counts are per node type. */
export interface TwitterDatasetOptions {
  users?: number;
  tweets?: number;
  comments?: number;
  hashtags?: number;
  retweets?: number;
  /** PRNG seed — same seed → same graph. Default `42`. */
  seed?: number;
}

// ─── Node types ──────────────────────────────────────────────────────────────

/** An account: the graph's only root entity — everything else hangs off one. */
export const userNodeGenerator: NodeTypeGenerator = {
  type: 'User',
  count_func: (ctx) => ctx.options.users,
  id_func: (_ctx, i) => `u${i}`,
  properties: {
    name_func: (_ctx, i) => NAMES[i % NAMES.length]!,
    // Handles cycle the pool; past the end they gain the index so they stay unique.
    handle_func: (_ctx, i) => `@${HANDLES[i % HANDLES.length]}${i >= HANDLES.length ? i : ''}`,
    avatar_func: (_ctx, _i, self) => String(self.handle),
    followers_func: (ctx) => 120 + ctx.int(90_000),
    verified_func: (ctx) => ctx.rnd() < 0.25,
    bio_func: (ctx) => ctx.pick(BIOS),
  },
};

/** A hashtag: a label and a use count, no author. */
export const hashtagNodeGenerator: NodeTypeGenerator = {
  type: 'Hashtag',
  count_func: (ctx) => ctx.options.hashtags,
  id_func: (_ctx, i) => `h${i}`,
  properties: {
    tag_func: (_ctx, i) => TAGS[i % TAGS.length]!,
    label_func: (_ctx, _i, self) => `#${String(self.tag)}`,
    uses_func: (ctx) => 1 + ctx.int(60),
  },
};

/**
 * A tweet. `authorId_func` picks the account first so every later property —
 * and the `POSTED` / `MENTIONS` edges — can resolve against it.
 */
export const tweetNodeGenerator: NodeTypeGenerator = {
  type: 'Tweet',
  count_func: (ctx) => ctx.options.tweets,
  id_func: (_ctx, i) => `t${i}`,
  properties: {
    authorId_func: (ctx) => ctx.pick(ctx.ids.User!),
    author_func: (ctx, _i, self) => String(ctx.node(String(self.authorId)).data.name),
    handle_func: (ctx, _i, self) => String(ctx.node(String(self.authorId)).data.handle),
    avatar_func: (ctx, _i, self) => String(ctx.node(String(self.authorId)).data.avatar),
    text_func: (ctx) => ctx.pick(TWEETS),
    // Tweets are spread evenly across the window, then jittered, so the feed is
    // time-ordered by index without every tweet landing on a round number.
    ts_func: (ctx, i) =>
      WINDOW_START + Math.floor((i / ctx.options.tweets) * 7 * DAY) + ctx.int(Math.floor(DAY * 0.3)),
    time_func: (_ctx, _i, self) => shortTime(Number(self.ts)),
    likes_func: (ctx) => ctx.int(800),
    retweets_func: (ctx) => ctx.int(160),
    replies_func: (ctx) => ctx.int(80),
    stats_func: (_ctx, _i, self) => `♥ ${self.likes} · ↻ ${self.retweets} · 💬 ${self.replies}`,
  },
};

/** A reply to a tweet. Carries both endpoints so its two edge types can read them. */
export const commentNodeGenerator: NodeTypeGenerator = {
  type: 'Comment',
  count_func: (ctx) => ctx.options.comments,
  id_func: (_ctx, i) => `c${i}`,
  properties: {
    authorId_func: (ctx) => ctx.pick(ctx.ids.User!),
    tweetId_func: (ctx) => ctx.pick(ctx.ids.Tweet!),
    author_func: (ctx, _i, self) => String(ctx.node(String(self.authorId)).data.name),
    handle_func: (ctx, _i, self) => String(ctx.node(String(self.authorId)).data.handle),
    text_func: (ctx) => ctx.pick(COMMENTS),
    ts_func: (ctx) => WINDOW_START + ctx.int(7 * DAY),
    time_func: (_ctx, _i, self) => shortTime(Number(self.ts)),
  },
};

/** A retweet — a reference node: who boosted which tweet, and when. */
export const retweetNodeGenerator: NodeTypeGenerator = {
  type: 'Retweet',
  count_func: (ctx) => ctx.options.retweets,
  id_func: (_ctx, i) => `r${i}`,
  properties: {
    byId_func: (ctx) => ctx.pick(ctx.ids.User!),
    tweetId_func: (ctx) => ctx.pick(ctx.ids.Tweet!),
    by_func: (ctx, _i, self) => String(ctx.node(String(self.byId)).data.handle),
    label_func: (_ctx, _i, self) => `RT ${String(self.by)}`,
    ts_func: (ctx) => WINDOW_START + ctx.int(7 * DAY),
    time_func: (_ctx, _i, self) => shortTime(Number(self.ts)),
  },
};

/** Generated in order — a type may reference any type declared above it. */
export const NODE_GENERATORS: readonly NodeTypeGenerator[] = [
  userNodeGenerator,
  hashtagNodeGenerator,
  tweetNodeGenerator,
  commentNodeGenerator,
  retweetNodeGenerator,
];

// ─── Edge types ──────────────────────────────────────────────────────────────

/** account → account. 1–3 per user; self-follows are dropped. */
export const followsEdgeGenerator: EdgeTypeGenerator = {
  type: 'FOLLOWS',
  from: 'User',
  count_func: (ctx) => 1 + ctx.int(3),
  source_func: (_ctx, node) => node.id,
  target_func: (ctx, node) => {
    const other = ctx.pick(ctx.ids.User!);
    return other === node.id ? '' : other;
  },
};

/** account → tweet. Exactly one: the tweet's author. */
export const postedEdgeGenerator: EdgeTypeGenerator = {
  type: 'POSTED',
  from: 'Tweet',
  count_func: () => 1,
  source_func: (_ctx, node) => String(node.data.authorId),
  target_func: (_ctx, node) => node.id,
};

/** tweet → hashtag. 1–2 tags per tweet. */
export const taggedEdgeGenerator: EdgeTypeGenerator = {
  type: 'TAGGED',
  from: 'Tweet',
  count_func: (ctx) => 1 + ctx.int(2),
  source_func: (_ctx, node) => node.id,
  target_func: (ctx) => ctx.pick(ctx.ids.Hashtag!),
};

/** tweet → account. 40% of tweets mention someone. */
export const mentionsEdgeGenerator: EdgeTypeGenerator = {
  type: 'MENTIONS',
  from: 'Tweet',
  count_func: (ctx) => (ctx.rnd() < 0.4 ? 1 : 0),
  source_func: (_ctx, node) => node.id,
  target_func: (ctx) => ctx.pick(ctx.ids.User!),
};

/** account → comment. Exactly one: the reply's author. */
export const wroteEdgeGenerator: EdgeTypeGenerator = {
  type: 'WROTE',
  from: 'Comment',
  count_func: () => 1,
  source_func: (_ctx, node) => String(node.data.authorId),
  target_func: (_ctx, node) => node.id,
};

/** comment → tweet. The reply's subject. */
export const replyToEdgeGenerator: EdgeTypeGenerator = {
  type: 'REPLY_TO',
  from: 'Comment',
  count_func: () => 1,
  source_func: (_ctx, node) => node.id,
  target_func: (_ctx, node) => String(node.data.tweetId),
};

/** account → retweet. Who boosted it. */
export const retweetedEdgeGenerator: EdgeTypeGenerator = {
  type: 'RETWEETED',
  from: 'Retweet',
  count_func: () => 1,
  source_func: (_ctx, node) => String(node.data.byId),
  target_func: (_ctx, node) => node.id,
};

/** retweet → tweet. What was boosted. */
export const ofEdgeGenerator: EdgeTypeGenerator = {
  type: 'OF',
  from: 'Retweet',
  count_func: () => 1,
  source_func: (_ctx, node) => node.id,
  target_func: (_ctx, node) => String(node.data.tweetId),
};

/** Run after every node pool is complete, in this order. */
export const EDGE_GENERATORS: readonly EdgeTypeGenerator[] = [
  followsEdgeGenerator,
  postedEdgeGenerator,
  taggedEdgeGenerator,
  mentionsEdgeGenerator,
  wroteEdgeGenerator,
  replyToEdgeGenerator,
  retweetedEdgeGenerator,
  ofEdgeGenerator,
];

// ─── Runner ──────────────────────────────────────────────────────────────────

/**
 * Drive the specs: every node type in order, then every edge type. The only
 * stateful thing in the module — the generators themselves are pure functions of
 * their {@link GeneratorContext}.
 *
 * Kept here rather than in a shared module because twitter is the only converted
 * dataset so far; when a second one follows, this and the RNG helpers are what
 * move up.
 */
export function runGenerators(
  nodeGenerators: readonly NodeTypeGenerator[],
  edgeGenerators: readonly EdgeTypeGenerator[],
  opts: TwitterDatasetOptions = {},
): { nodes: GeneratedNode[]; edges: GraphEdge[] } {
  const options: Required<TwitterDatasetOptions> = {
    users: opts.users ?? 18,
    tweets: opts.tweets ?? 34,
    comments: opts.comments ?? 26,
    hashtags: opts.hashtags ?? 12,
    retweets: opts.retweets ?? 10,
    seed: opts.seed ?? 42,
  };

  const rnd = mulberry32(options.seed);
  const nodes: GeneratedNode[] = [];
  const byId = new Map<string, GeneratedNode>();
  const ids: Record<string, string[]> = {};

  const ctx: GeneratorContext = {
    rnd,
    int: (n) => Math.floor(rnd() * n),
    pick: (arr) => arr[Math.floor(rnd() * arr.length)]!,
    ids,
    node: (id) => byId.get(id)!,
    options,
  };

  for (const gen of nodeGenerators) {
    const pool: string[] = (ids[gen.type] ??= []);
    const count = gen.count_func(ctx);
    for (let i = 0; i < count; i++) {
      const id = gen.id_func(ctx, i);
      // Declaration order matters: each property sees the ones before it.
      const data: NodeProperties = {};
      for (const [key, propFunc] of Object.entries(gen.properties)) {
        data[key.replace(/_func$/, '')] = propFunc(ctx, i, data);
      }
      const node: GeneratedNode = { id, type: gen.type, data };
      nodes.push(node);
      byId.set(id, node);
      pool.push(id);
    }
  }

  const edges: GraphEdge[] = [];
  let eid = 0;
  for (const gen of edgeGenerators) {
    for (const node of nodes) {
      if (node.type !== gen.from) continue;
      const count = gen.count_func(ctx, node);
      for (let k = 0; k < count; k++) {
        const source = gen.source_func(ctx, node, k);
        const target = gen.target_func(ctx, node, k);
        // A generator returns '' to drop an edge it can't make (a self-follow).
        if (!source || !target) continue;
        edges.push({ id: `e${eid++}`, type: gen.type, source, target });
      }
    }
  }

  // Drop orphan nodes (no incident edge) so the graph is fully connected for
  // layout — e.g. a hashtag that happened never to be tagged. Sampling means a
  // pool member can miss out entirely, and a lone dot drifting at the rim of a
  // force layout reads as a rendering fault rather than as data.
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  return { nodes: nodes.filter((n) => connected.has(n.id)), edges };
}
