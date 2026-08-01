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

import type { CanvasConfig } from '@invana/canvas';
import type { NodeStructureRegistry, NodeStylingRegistry, NodeTypeRegistry } from '@invana/graph';

import {
  EDGE_GENERATORS,
  NODE_GENERATORS,
  runGenerators,
  type TwitterDatasetOptions,
} from './generators';

/**
 * Build the mocked Twitter activity graph (~100 nodes by default) by running the
 * per-type generators in `./generators` — one spec per node type and per edge
 * type, each property produced by its own `*_func`.
 */
export function generateTwitterActivity(opts: TwitterDatasetOptions = {}) {
  return runGenerators(NODE_GENERATORS, EDGE_GENERATORS, opts);
}

/** The default instance — 18 users, 34 tweets, 26 comments, 12 hashtags, 10 retweets. */
export const twitterActivity = generateTwitterActivity();

/** {@link twitterActivity} as the engine-ready value `<GraphCanvasApp data>` takes. */
export const data = twitterActivity;

/**
 * Recommended look for the **Twitter activity** graph.
 *
 * Five node types (`User` · `Tweet` · `Comment` · `Hashtag` · `Retweet`) and eight
 * edge types, so this is one of the few datasets where colour-by-type earns its
 * keep — it's left **on**, and the palette does the categorising with no per-node
 * wiring. Edges get arrowheads because direction is meaningful here (who posted
 * what, who replied to whom).
 */
export const settings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      node: {
        style: {
          shape: { kind: 'circle', radius: 7 },
          bgStrokeWidth: 1.5,
          labelFontSize: 10,
        },
      },
      edge: {
        style: {
          strokeWidth: 1,
          strokeAlpha: 0.6,
          arrowTargetShape: 'triangle',
          arrowTargetSize: 6,
        },
      },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -260 },
      link: { distance: 70 },
      collide: {},
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: true, colorEdges: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
  },
};

// ─── Card variant ────────────────────────────────────────────────────────────

/**
 * The three types that carry real content, as composite cards. Structures are
 * pure skeletons — rows of slots, no colour — so they theme through
 * {@link cardStylings} and bind to the data through {@link cardNodeTypes}.
 *
 * Slot values resolve through a **single dotted path each** (`data.likes`), so a
 * count renders as a bare number: there's no formatting or concatenation step
 * between the store and the card.
 */
const cardStructures: NodeStructureRegistry = {
  /** A tweet: type tag · author row · body · the three engagement counts. */
  tweetCard: {
    name: 'tweetCard',
    kind: 'card',
    width: 260,
    height: 156,
    rows: [
      { slots: [{ slot: 'type', kind: 'tag' }] },
      { divider: true },
      {
        slots: [
          { slot: 'avatar', kind: 'image', shape: 'circle', size: 34 },
          { stack: [{ slot: 'author', kind: 'text' }, { slot: 'handle', kind: 'text' }] },
        ],
      },
      { slots: [{ slot: 'text', kind: 'text' }] },
      {
        slots: [
          { slot: 'likes', kind: 'text' },
          { slot: 'retweets', kind: 'text' },
          { slot: 'replies', kind: 'text' },
        ],
      },
    ],
  },
  /** An account: type tag · avatar beside name / handle · follower count. */
  userCard: {
    name: 'userCard',
    kind: 'card',
    width: 220,
    height: 124,
    rows: [
      { slots: [{ slot: 'type', kind: 'tag' }] },
      { divider: true },
      {
        slots: [
          { slot: 'avatar', kind: 'image', shape: 'circle', size: 40 },
          { stack: [{ slot: 'title', kind: 'text' }, { slot: 'subtitle', kind: 'text' }] },
        ],
      },
      { slots: [{ slot: 'followers', kind: 'text' }] },
    ],
  },
  /** A reply: no avatar, just who said what and when — deliberately slimmer. */
  commentCard: {
    name: 'commentCard',
    kind: 'card',
    width: 220,
    height: 112,
    rows: [
      { slots: [{ slot: 'type', kind: 'tag' }] },
      { divider: true },
      // Author over timestamp, not beside it: side-by-side splits the row evenly
      // and the date ends up ellipsised to `Mar…`.
      { slots: [{ stack: [{ slot: 'author', kind: 'text' }, { slot: 'time', kind: 'text' }] }] },
      { slots: [{ slot: 'text', kind: 'text' }] },
    ],
  },
};

/**
 * Colour + type scale for the three cards, entirely in theme roles — so the
 * cards follow a light/dark switch with no per-node work. The body text is the
 * only `foreground` slot; everything secondary is `muted`, which is what keeps a
 * wall of cards readable at low zoom.
 */
const cardStylings: NodeStylingRegistry = {
  tweetCard: {
    name: 'tweetCard',
    bgRole: 'cardBg',
    accentRole: 'accent',
    slots: {
      type: { colorRole: 'accent', fontSize: 10, fontWeight: 700, uppercase: true },
      author: { colorRole: 'heading', fontSize: 14, fontWeight: 700 },
      handle: { colorRole: 'muted', fontSize: 11 },
      text: { colorRole: 'foreground', fontSize: 12 },
      likes: { colorRole: 'muted', fontSize: 11, fontWeight: 600 },
      retweets: { colorRole: 'muted', fontSize: 11, fontWeight: 600 },
      replies: { colorRole: 'muted', fontSize: 11, fontWeight: 600 },
      divider: { colorRole: 'divider' },
    },
  },
  userCard: {
    name: 'userCard',
    bgRole: 'cardBg',
    accentRole: 'accent',
    slots: {
      type: { colorRole: 'muted', fontSize: 10, fontWeight: 600, uppercase: true },
      title: { colorRole: 'heading', fontSize: 15, fontWeight: 700 },
      subtitle: { colorRole: 'muted', fontSize: 12 },
      followers: { colorRole: 'accent', fontSize: 11, fontWeight: 600 },
      divider: { colorRole: 'divider' },
    },
  },
  commentCard: {
    name: 'commentCard',
    bgRole: 'cardBg',
    accentRole: 'muted',
    slots: {
      type: { colorRole: 'muted', fontSize: 10, fontWeight: 600, uppercase: true },
      author: { colorRole: 'heading', fontSize: 12, fontWeight: 700 },
      time: { colorRole: 'muted', fontSize: 11 },
      text: { colorRole: 'foreground', fontSize: 12 },
      divider: { colorRole: 'divider' },
    },
  },
};

/**
 * Type → structure + styling + slot bindings. `Hashtag` and `Retweet` are left
 * off deliberately: they carry a label and a count, not a record, so they keep
 * the plain marks from {@link settings} and give the graph something small to
 * read between the cards.
 */
const cardNodeTypes: NodeTypeRegistry = {
  Tweet: {
    structure: 'tweetCard',
    styling: 'tweetCard',
    bindings: {
      type: 'type',
      avatar: 'data.avatar',
      author: 'data.author',
      handle: 'data.handle',
      text: 'data.text',
      likes: 'data.likes',
      retweets: 'data.retweets',
      replies: 'data.replies',
    },
  },
  User: {
    structure: 'userCard',
    styling: 'userCard',
    bindings: {
      type: 'type',
      avatar: 'data.avatar',
      title: 'data.name',
      subtitle: 'data.handle',
      followers: 'data.followers',
    },
  },
  Comment: {
    structure: 'commentCard',
    styling: 'commentCard',
    bindings: { type: 'type', author: 'data.author', time: 'data.time', text: 'data.text' },
  },
};

/**
 * The same graph as {@link settings}, drawn as **composite cards** — a tweet
 * card, a user id-card and a slimmer comment card, with hashtags and retweets
 * left as compact marks.
 *
 * Everything here is still pure JSON: structures are slot skeletons, stylings
 * are theme roles, and each slot binds to a dotted data path. That's the whole
 * template stack, so this doubles as the fixture for the node-template editors.
 *
 * Three things differ from the plain look, and all three follow from card size:
 *
 * 1. **The force layout is opened right up** — a 260×156 card needs an order of
 *    magnitude more room than a 7px dot, so charge, link distance and the
 *    collision radius all grow. Without that the cards stack into a pile.
 * 2. **Colour-by-type is off.** The styling templates own colour now; leaving
 *    the behaviour on would repaint every card body with its type colour.
 * 3. **Edges thin out** — at card scale the links are connective tissue, not the
 *    subject, so they lose their arrowheads' visual weight.
 */
export const cardSettings: CanvasConfig = {
  activeLayout: 'graph-force',
  fitOnLoad: true,
  layers: {
    graph: {
      nodeStructureTemplates: cardStructures,
      nodeStylingTemplates: cardStylings,
      nodeTypes: cardNodeTypes,
      // The fallback for the two un-carded types (Hashtag · Retweet).
      node: { style: { shape: { kind: 'circle', radius: 9 }, bgStrokeWidth: 1.5, labelFontSize: 11 } },
      edge: { style: { strokeWidth: 1, strokeAlpha: 0.45, arrowTargetShape: 'triangle', arrowTargetSize: 5 } },
    },
  },
  layouts: {
    'graph-force': {
      charge: { strength: -1600 },
      link: { distance: 260 },
      collide: { radius: 150 },
      animate: false,
    },
  },
  behaviours: {
    color: { enabled: false },
    hover: { enabled: true, state: 'highlighted', degree: 1 },
  },
};
