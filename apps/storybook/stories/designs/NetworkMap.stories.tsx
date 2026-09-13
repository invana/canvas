import {
  GraphCanvas,
  GraphLayer,
  BackgroundLayer,
  ThemeBehaviour,
  DragPanBehaviour,
  WheelZoomBehaviour,
  HoverActivateBehaviour,
  LabelCollisionBehaviour,
  D3ForceLayout,
  type GraphLayerProps
} from '@invana/canvas-react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphData, GraphNode } from '@invana/graph';
import type { Meta, StoryObj } from '@storybook/react-vite';

/**
 * **Family I — network.** The reference rendering of plate P4 in the diagram
 * plate book: the family where *the shape of the whole* matters more than any
 * single node.
 *
 * Four grammar rules are visible here, and each maps to one config decision:
 *
 * - **Radius encodes degree** — `node.style.shape` is a *resolver*, so the
 *   circle's radius is computed per node from its precomputed degree. Size is
 *   the only channel carrying magnitude.
 * - **Colour encodes cluster, never magnitude** (rule R2) — `bgFill` resolves
 *   off `node.type`, so hue answers "which tier" and nothing else.
 * - **Weight encodes flow** — intra-cluster edges sit at *structure* weight
 *   (1.5px, low alpha); the three cross-tier bridges sit at *emphasis* weight
 *   (4px) with `pathType: 'bundle'`, so the eye reads three regions rather
 *   than forty lines.
 * - **Labels are LOD, not decoration** (rule R5) — `labelMinZoom` hides every
 *   label until the camera is close enough for them to mean something, and the
 *   `hovered` state overrides that with `labelForceShow` plus a ring. At this
 *   density a permanent label layer is noise.
 *
 * `HoverActivateBehaviour` with `degree: 1` lights the hovered node *and* its
 * direct neighbours, which is what turns a hairball into a readable local
 * neighbourhood without a click.
 *
 * Namespace note: `designs/` is a deliberate third exception to the storybook
 * namespacing rule (alongside `usecases/`) — these stories belong to the
 * cross-package *visual system*, not to any one package.
 */
const meta: Meta = { title: 'designs/NetworkMap' };
export default meta;
type Story = StoryObj;

// ── Palette ─────────────────────────────────────────────────────────────────
// Contrast-first. Every value is checked against the near-white card body it
// sits on: body text and titles clear 7:1, secondary text 4.5:1, and the card
// outline is a slate-500 rather than the slate-300 hairline a "quiet" border
// tempts you into — at canvas zoom a 1px hairline below ~3:1 simply vanishes.
const PAPER = 0xffffff;   // card body
const INK = 0x0f172a;     // titles                        — 17.9:1 on PAPER
const BODY = 0x334155;    // row text                      —  9.7:1
const LINE = 0x64748b;    // card outline + connectors     —  4.8:1
const VIOLET = 0x5b3fd1;  // agents, live flow, selection
const TEAL = 0x0b7a6e;    // data, tools, success
const AMBER = 0x9a6207;   // branch, keys, retry

// ── Topology ────────────────────────────────────────────────────────────────
// A service mesh in three tiers. `type` is the cluster; every node carries its
// degree in `data` so the shape resolver can read it without touching the store.
type Tier = 'ingest' | 'compute' | 'storage';

const LINKS: ReadonlyArray<readonly [string, string]> = [
  // ingest
  ['gateway', 'auth'], ['gateway', 'router'], ['gateway', 'ratelimit'],
  ['router', 'auth'], ['router', 'ingest-q'], ['auth', 'ratelimit'],
  ['ingest-q', 'ratelimit'],
  // compute
  ['sched', 'worker-a'], ['sched', 'worker-b'], ['sched', 'enrich'],
  ['worker-a', 'enrich'], ['worker-b', 'enrich'], ['enrich', 'dedupe'],
  ['worker-a', 'dedupe'], ['sched', 'dedupe'],
  // storage
  ['pg-primary', 'pg-replica'], ['pg-primary', 'blob'], ['warehouse', 'blob'],
  ['pg-replica', 'warehouse'], ['blob', 'archive'], ['warehouse', 'archive'],
  // bridges — the only cross-tier links, and the reason for the bundle weight
  ['ingest-q', 'sched'], ['dedupe', 'pg-primary'], ['router', 'warehouse'],
];

const TIERS: Readonly<Record<string, Tier>> = {
  gateway: 'ingest', auth: 'ingest', router: 'ingest', ratelimit: 'ingest', 'ingest-q': 'ingest',
  sched: 'compute', 'worker-a': 'compute', 'worker-b': 'compute', enrich: 'compute', dedupe: 'compute',
  'pg-primary': 'storage', 'pg-replica': 'storage', blob: 'storage', warehouse: 'storage', archive: 'storage',
};

const DEGREE: Record<string, number> = {};
for (const [a, b] of LINKS) {
  DEGREE[a] = (DEGREE[a] ?? 0) + 1;
  DEGREE[b] = (DEGREE[b] ?? 0) + 1;
}

const DATA: GraphData = {
  nodes: (Object.keys(TIERS) as string[]).map((id) => ({
    id,
    type: TIERS[id] ?? 'ingest',
    data: { degree: DEGREE[id] ?? 0 }
  })),
  edges: LINKS.map(([source, target]) => ({
    id: `${source}->${target}`,
    source,
    target,
    // A bridge is any edge whose endpoints sit in different tiers. That single
    // predicate drives the whole weight/route difference below.
    type: TIERS[source] === TIERS[target] ? 'intra' : 'bridge'
  }))
};

const TIER_FILL: Record<Tier, number> = { ingest: TEAL, compute: VIOLET, storage: AMBER };

// ── Style ───────────────────────────────────────────────────────────────────
const NODE: GraphLayerProps['node'] = {
  style: {
    // Radius = degree. The one channel carrying magnitude.
    shape: (n: GraphNode) => {
      const degree = (n.data as { degree?: number } | undefined)?.degree ?? 1;
      return { kind: 'circle' as const, radius: 6 + Math.min(degree, 8) * 1.3 };
    },
    bgFill: (n: GraphNode) => TIER_FILL[(n.type as Tier) ?? 'ingest'] ?? LINE,
    // A full-strength ring is what separates two touching nodes of the same
    // tier; at 0.35 alpha they merged into one blob.
    bgStrokeColor: PAPER,
    bgStrokeWidth: 2,
    labelText: (n: GraphNode) => n.id,
    labelColor: BODY,
    labelFontSize: 11,
    labelPlacement: 'bottom',
    labelOffsetY: 7,
    // The halo (rule: 3px paper-coloured plate under any label crossing an
    // edge) is cheaper than collision avoidance and reads better.
    labelBackgroundFill: PAPER,
    labelBackgroundAlpha: 0.82,
    labelBackgroundPadding: 3,
    labelBackgroundCornerRadius: 3,
    // R5 — labels are shed at distance, but the fitted view must still be
    // readable, so the threshold sits below the fit zoom rather than above it.
    // `LabelCollisionBehaviour` drops the ones that would overlap.
    labelMinZoom: 0.55,
    labelCollisionGroup: 'node'
  },
  // The canonical state catalogue (`hovered` / `highlighted` / `dimmed`) is
  // auto-merged into every GraphLayer; these entries override its visuals.
  state: {
    hovered: {
      labelForceShow: true,
      labelColor: INK,
      labelFontSize: 11,
      bgStrokeWidth: 3,
      decorations: [{ kind: 'ring', id: 'halo', color: VIOLET, alpha: 0.9, width: 2.5, gap: 6 }]
    },
    highlighted: { labelForceShow: true, bgStrokeWidth: 2.5 },
    dimmed: { bgAlpha: 0.18, labelAlpha: 0 }
  }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    // Structure weight for the mesh, emphasis weight + bundling for bridges.
    strokeColor: (e) => (e.type === 'bridge' ? LINE : TIER_FILL[TIERS[e.source] ?? 'ingest']),
    strokeWidth: (e) => (e.type === 'bridge' ? 4 : 1.5),
    strokeAlpha: (e) => (e.type === 'bridge' ? 0.75 : 0.5),
    strokeCap: 'round',
    shape: (e) => ({ pathType: e.type === 'bridge' ? ('bundle' as const) : ('straight' as const) }),
    arrowTargetShape: 'none'
  },
  state: {
    highlighted: { strokeAlpha: 0.95, strokeWidth: 2.5 },
    dimmed: { strokeAlpha: 0.08 }
  }
};

const CONFIG: CanvasConfig = {
  // One fitter, and it re-frames as the force sim settles — the layout's own
  // fit runs once against a half-solved graph and leaves nodes off-screen.
  fitOnLoad: true,
  activeLayout: 'force',
  layouts: {
    force: {
      charge: { strength: -420 },
      link: { distance: 70 },
      collide: { radius: 26 },
      animate: false
    }
  }
};

export const NetworkMap: Story = {
  render: () => (
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" mode="document" />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        <D3ForceLayout id="force" targetLayerId="graph" fitPadding={72} />
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        {/* degree 1 — the hovered node *and* its neighbours stay lit, everything
            else dims. This is what makes a dense mesh locally readable. */}
        <HoverActivateBehaviour id="hover" degree={1} />
        {/* Labels are on by default now, so something has to arbitrate overlap. */}
        <LabelCollisionBehaviour id="labels" targetLayerId="graph" />
      </GraphCanvas>
    </div>
  )
};
