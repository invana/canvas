import {
  CanvasThemeSync,
  ColorByBehaviour,
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
 * - **Colour encodes cluster, never magnitude** (rule R2) — `ColorByBehaviour`
 *   in `'categorical'` mode paints `bgFill` from `node.type`, so hue answers
 *   "which tier" and nothing else, out of one categorical ramp designed to read
 *   on both a light and a dark backdrop.
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
 * **Themed by role, not by palette.** This story declares no colour at all.
 * Node borders and labels, edge strokes and arrowheads are written by
 * `GraphLayer.applyTheme` from the live palette on every `theme:change`
 * (`stroke` · `foreground` · `muted`); the cluster fills come from
 * `ColorByBehaviour`, which owns the categorical ramp. Nothing here has to know
 * which palette is live, and nothing remounts when it changes.
 *
 * Two marks the original plate had are gone with the pinned palette, and both
 * come back through the engine rather than the story: the paper-coloured label
 * halo and the cut-out ring around each node need label-background and ring
 * colours in the role map — `rfc:feat-2026-09-11-a-colour-is-either-themed-or-manual-never-both`
 * F12. Until then `LabelCollisionBehaviour` alone arbitrates overlap.
 *
 * Namespace note: `designs/` is a deliberate third exception to the storybook
 * namespacing rule (alongside `usecases/`) — these stories belong to the
 * cross-package *visual system*, not to any one package.
 */
const meta: Meta = { title: 'designs/NetworkMap' };
export default meta;
type Story = StoryObj;

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

// ── Style ───────────────────────────────────────────────────────────────────
// No colour anywhere: `bgFill` belongs to `ColorByBehaviour`, and the border +
// label colour to the theme. What is left is geometry and level-of-detail.
const NODE: GraphLayerProps['node'] = {
  style: {
    // Radius = degree. The one channel carrying magnitude, and the one thing
    // here a template can't express — a structure's shape is fixed, so this
    // stays a resolver over the node's own data.
    shape: (n: GraphNode) => {
      const degree = (n.data as { degree?: number } | undefined)?.degree ?? 1;
      return { kind: 'circle' as const, radius: 6 + Math.min(degree, 8) * 1.3 };
    },
    // A full-strength ring is what separates two touching nodes of the same
    // tier; at 0.35 alpha they merged into one blob. The colour is the theme's
    // `stroke` role, written by `applyTheme`.
    bgStrokeWidth: 2,
    labelText: (n: GraphNode) => n.id,
    labelFontSize: 11,
    labelPlacement: 'bottom',
    labelOffsetY: 7,
    // R5 — labels are shed at distance, but the fitted view must still be
    // readable, so the threshold sits below the fit zoom rather than above it.
    // `LabelCollisionBehaviour` drops the ones that would overlap.
    labelMinZoom: 0.55,
    labelCollisionGroup: 'node'
  },
  // The canonical state catalogue (`hovered` / `highlighted` / `dimmed`) is
  // auto-merged into every GraphLayer and already draws the hover ring; these
  // entries only add what it can't know — that a label must show through its
  // LOD threshold while its node is the focus.
  state: {
    hovered: { labelForceShow: true, bgStrokeWidth: 3 },
    highlighted: { labelForceShow: true, bgStrokeWidth: 2.5 },
    dimmed: { bgAlpha: 0.18, labelAlpha: 0 }
  }
};

const EDGE: GraphLayerProps['edge'] = {
  style: {
    // Structure weight for the mesh, emphasis weight + bundling for bridges.
    // Both keep the themed `muted` stroke — the distinction is weight, alpha
    // and route, which is what rule R2 asks for.
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
    // The host <div> sizes the engine's render surface — structural, and exempt
    // from the no-inline-CSS rule (root rule 13).
    <div style={{ width: '100%', height: '100dvh' }}>
      <GraphCanvas autoResize config={CONFIG}>
        <BackgroundLayer id="bg" type="pattern" patternType="dots" />
        <ThemeBehaviour id="theme" />
        {/* Drives the behaviour's mode + family from the host `@invana/themes`
            theme, which is what makes the whole scene follow the toolbar. */}
        <CanvasThemeSync />
        <GraphLayer id="graph" data={DATA} node={NODE} edge={EDGE} />
        {/* Cluster colour. Nodes only — an edge takes its tier from neither
            endpoint when it bridges two, so the mesh keeps the themed stroke and
            the bridges are told apart by weight and route instead. */}
        <ColorByBehaviour id="color" targetLayerId="graph" nodeValueKey="type" colorEdges={false} enabled />
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
