/**
 * Mocked **Twitter activity** graph — a small social timeline with multiple node
 * and edge kinds, for multi-type rendering / card-template demos.
 *
 * Authored in the engine-ready shape (`{ id, type, data }`) — it drops straight
 * into `setData` / `<GraphCanvasApp data={…}>` with no mapping.
 *
 * Node types: `User`, `Tweet`, `Comment`, `Hashtag`, `Retweet`.
 * Edge types: `POSTED`, `TAGGED`, `MENTIONS`, `WROTE`, `REPLY_TO`,
 *             `RETWEETED`, `OF`, `FOLLOWS`.
 *
 * Tweets / comments / retweets carry a `ts` (epoch ms) + a short `time` label,
 * laid out across a fixed 7-day window so the data reads as a time series.
 * Author name / handle / avatar are **denormalised** onto each post so a card
 * template can bind them directly. Fully deterministic (seeded PRNG).
 *
 * @example
 * import { twitterActivity, twitterActivitySettings } from '@invana/graph-datasets';
 * <GraphCanvasApp data={twitterActivity} config={twitterActivitySettings} />
 *
 * // …or generate a bigger one:
 * const data = generateTwitterActivity({ users: 24, tweets: 50 });
 */

import type { CanvasData } from '../types';

export type TwitterNodeLabel = 'User' | 'Tweet' | 'Comment' | 'Hashtag' | 'Retweet';

export interface TwitterNode {
  id: string;
  type: TwitterNodeLabel;
  data: Record<string, string | number | boolean>;
}
export interface TwitterEdge {
  id: string;
  type: string;
  source: string;
  target: string;
}
export interface TwitterGraphData {
  nodes: TwitterNode[];
  edges: TwitterEdge[];
}

export interface TwitterDatasetOptions {
  users?: number;
  tweets?: number;
  comments?: number;
  hashtags?: number;
  retweets?: number;
  /** PRNG seed — same seed → same graph. Default `42`. */
  seed?: number;
}

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

/** Deterministic PRNG (mulberry32). */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DAY = 86_400_000;
const WINDOW_END = Date.UTC(2024, 2, 8); // fixed instant → stable labels
const WINDOW_START = WINDOW_END - 7 * DAY;

function shortTime(ts: number): string {
  const d = new Date(ts);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${hh}:${mm}`;
}

/** Build the mocked Twitter activity graph (~100 nodes by default). */
export function generateTwitterActivity(opts: TwitterDatasetOptions = {}): TwitterGraphData {
  const { users = 18, tweets = 34, comments = 26, hashtags = 12, retweets = 10, seed = 42 } = opts;
  const rnd = mulberry32(seed);
  const int = (n: number) => Math.floor(rnd() * n);
  const pick = <T>(arr: readonly T[]): T => arr[int(arr.length)]!;

  const nodes: TwitterNode[] = [];
  const edges: TwitterEdge[] = [];
  let eid = 0;
  const link = (source: string, target: string, type: string): void => {
    edges.push({ id: `e${eid++}`, type, source, target });
  };

  // Users
  const userIds: string[] = [];
  for (let i = 0; i < users; i++) {
    const handle = `@${HANDLES[i % HANDLES.length]}${i >= HANDLES.length ? i : ''}`;
    const id = `u${i}`;
    nodes.push({
      id,
      type: 'User',
      data: {
        name: NAMES[i % NAMES.length]!,
        handle,
        avatar: handle,
        followers: 120 + int(90_000),
        verified: rnd() < 0.25,
        bio: pick(BIOS),
      },
    });
    userIds.push(id);
  }
  // Follows (1–3 per user)
  for (const u of userIds) {
    const n = 1 + int(3);
    for (let k = 0; k < n; k++) {
      const other = pick(userIds);
      if (other !== u) link(u, other, 'FOLLOWS');
    }
  }

  const propsOf = (id: string) =>
    nodes.find((n) => n.id === id)!.data as { name: string; handle: string; avatar: string };

  // Hashtags
  const tagIds: string[] = [];
  for (let i = 0; i < hashtags; i++) {
    const tag = TAGS[i % TAGS.length]!;
    const id = `h${i}`;
    nodes.push({ id, type: 'Hashtag', data: { tag, label: `#${tag}`, uses: 1 + int(60) } });
    tagIds.push(id);
  }

  // Tweets (time-ordered across the window)
  const tweetIds: string[] = [];
  for (let i = 0; i < tweets; i++) {
    const authorId = pick(userIds);
    const a = propsOf(authorId);
    const ts = WINDOW_START + Math.floor((i / tweets) * 7 * DAY) + int(Math.floor(DAY * 0.3));
    const likes = int(800);
    const rts = int(160);
    const replies = int(80);
    const id = `t${i}`;
    nodes.push({
      id,
      type: 'Tweet',
      data: {
        text: pick(TWEETS),
        author: a.name,
        handle: a.handle,
        avatar: a.avatar,
        time: shortTime(ts),
        ts,
        likes,
        retweets: rts,
        replies,
        stats: `♥ ${likes} · ↻ ${rts} · 💬 ${replies}`,
      },
    });
    tweetIds.push(id);
    link(authorId, id, 'POSTED');
    const nTags = 1 + int(2);
    for (let k = 0; k < nTags; k++) link(id, pick(tagIds), 'TAGGED');
    if (rnd() < 0.4) link(id, pick(userIds), 'MENTIONS');
  }

  // Comments (replies to tweets)
  for (let i = 0; i < comments; i++) {
    const authorId = pick(userIds);
    const a = propsOf(authorId);
    const tweet = pick(tweetIds);
    const ts = WINDOW_START + int(7 * DAY);
    const id = `c${i}`;
    nodes.push({
      id,
      type: 'Comment',
      data: { text: pick(COMMENTS), author: a.name, handle: a.handle, time: shortTime(ts), ts },
    });
    link(authorId, id, 'WROTE');
    link(id, tweet, 'REPLY_TO');
  }

  // Retweets
  for (let i = 0; i < retweets; i++) {
    const byId = pick(userIds);
    const a = propsOf(byId);
    const tweet = pick(tweetIds);
    const ts = WINDOW_START + int(7 * DAY);
    const id = `r${i}`;
    nodes.push({
      id,
      type: 'Retweet',
      data: { by: a.handle, label: `RT ${a.handle}`, time: shortTime(ts), ts },
    });
    link(byId, id, 'RETWEETED');
    link(id, tweet, 'OF');
  }

  // Drop any orphan nodes (no incident edge) so the graph is fully connected
  // for layout — e.g. a hashtag that happened never to be tagged.
  const connected = new Set<string>();
  for (const e of edges) {
    connected.add(e.source);
    connected.add(e.target);
  }
  return { nodes: nodes.filter((n) => connected.has(n.id)), edges };
}

/** Default ~100-node Twitter activity graph (seed 42). */
export const twitterActivity: TwitterGraphData = generateTwitterActivity();

/** {@link twitterActivity} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data: CanvasData = twitterActivity as unknown as CanvasData;
