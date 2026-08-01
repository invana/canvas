/**
 * **Invana — end-to-end architecture** — the "build systems that learn" diagram
 * rebuilt as a live graph on `<GraphCanvasApp>`, styled to match the source
 * diagram one-to-one: tinted stage frames with a folder tab at the top-left,
 * plain boxes with a centred 1–3 line caption, and thin grey arrows carrying the
 * numbered flow. The whole page reads in **both light and dark** — see the
 * theming note below.
 *
 * It maps the diagram onto three engine primitives:
 *
 *   - **Stages → auto-fitting group frames.** Each numbered stage (1 · Data
 *     Sources … 8 · Learning) plus Memory / Audit / Reversibility is a *group
 *     node* (`style.group`): a tinted `tabbed-rect` drawn behind its `parentId`
 *     members (`autoFit: true` → the frame wraps its children; `headerHeight`
 *     is the folder tab above them). The stage title is an ordinary
 *     `inside-center` label — a `tabbed-rect` routes every `inside-*` placement
 *     into its tab, since the body belongs to the boxes it frames, and the tab
 *     auto-sizes to the title. So a stage carries **no** label offsets and no
 *     background pill: the tab is real geometry, not a floated chip.
 *   - **Items → plain rect nodes.** Every box is a `rect` shape with a centred
 *     `labelText`; multi-line captions are plain `\n`s in that string, so no
 *     composite card is needed.
 *   - **The learning loop → labelled edges.** The numbered flow (1→9) is thin
 *     smooth arrows; the feedback / side links (ranked strategies, recall
 *     episodes, decision log, compensating inverse) are dashed.
 *
 * **Styling is by node *type*, not per node.** Every node declares
 * `type: 'stage' | 'box'`, and the whole look lives once on the layer template
 * (`layers.graph.node.style`), whose fields are **resolvers** — `GraphLayer`
 * runs each one against the `GraphNode` at render, so `shape`, `group` and the
 * label fields branch on `node.type`. A node therefore carries only what is
 * genuinely its own: id, `parentId`, position, caption, and (for a box) its
 * `width` / `height` — box geometry is diagram *content*, so it rides on the
 * data payload the shape resolver reads, not on a per-node style block. All of
 * that is the `invanaArchitecture` dataset (`@invana/graph-datasets`); the story
 * maps it and owns only the look.
 *
 * A per-instance override is still just a per-node `style` field (it resolves
 * above the template); this diagram simply doesn't need one.
 *
 * **Positions are authored by default** (`activeLayout: ''`) — the arrangement
 * *is* the diagram, so every box carries the coordinate it has in the source.
 * A `rect` node's `position` is its **top-left** corner (only `composite` is
 * centre-shifted), and an auto-fitting frame lands at
 * `childrenBBox.min − padding − headerHeight`, which is what each group's
 * `position` repeats so a *collapsed* stage stays put. On a `tabbed-rect` that
 * top-left is the top of the **tab**, and `shape.height` describes the body
 * alone.
 *
 * **…and the header's Layout picker runs a real layout over the same graph.**
 * This diagram is the most demanding group case in the repo — eleven frames,
 * members inside them, and edges that cross frame boundaries — so it doubles as
 * the place to see what each layout does with groups:
 *
 *   - **Authored** — the snapshot above, restored verbatim. The story keeps every
 *     node's original coordinate at `onReady` and writes it back on switch, so
 *     returning here always rebuilds the diagram rather than leaving the graph
 *     wherever the last solver dropped it.
 *   - **Force** — `D3ForceLayout` with `cluster`, which pulls each frame's members
 *     toward their shared centroid. It is *attraction, not containment*: members
 *     stay loose and the frames stretch to follow them. Run as a static settle
 *     (`animate: false`) so the diagram doesn't wander for seconds.
 *   - **ELK** — `ElkLayout` in `layered` mode, the only engine here with **native
 *     containment**: each stage becomes a real compound container, members are
 *     packed inside it, and `elk.hierarchyHandling: INCLUDE_CHILDREN` routes the
 *     cross-stage edges around the boxes instead of through them. Frame insets
 *     come from each group's own `padding` / `headerHeight`, so the tab keeps its
 *     28px band.
 *
 * Collapse a stage (the − toggle) before switching: a collapsed group is laid out
 * as the single node the renderer draws, and its hidden members keep their frozen
 * positions instead of reserving empty space inside the box.
 *
 * **Light / dark comes from the theme, in two halves.** `GraphCanvasApp` already
 * mounts the sole theme publisher (`ThemeBehaviour`) plus `CanvasThemeSync`, so
 * the header's sun/moon toggle publishes the `default` palette's light **or**
 * dark variant onto the engine. `BackgroundLayer` (page backdrop ← `surface`)
 * and `GraphLayer` (label text ← `foreground`, node borders ← `stroke`, arrows +
 * edge labels ← `muted` / `foreground`) recolour themselves off it — that's the
 * background + text half, and it costs this story nothing.
 *
 * The palette has no role for the diagram's *own* colours, so the story owns the
 * other half and re-applies it on every `'theme:change'` (see `onReady`):
 *
 *   - **Box fill + edge-label pill** — patched on the layer template
 *     (`bgFill` / `labelBackgroundFill`): white on light, near-black on dark, so
 *     a box always reads as a card sitting *on* its stage tint.
 *   - **Stage tints** — one `STAGE_TINT` map keyed by group id, read by the two
 *     layer-level state overlays `stage` (pastel) and `stageDark` (the same hue
 *     at card depth), each carrying its own frame border + title colour. A stage
 *     node just names which one is active in `states`, and the handler flips it.
 *     Authored `states` are independent of the runtime hover/selection states, so
 *     the flip can't disturb them.
 *
 * One more engine detail, easy to trip over: `bgFill` always wins over a shape's
 * own `fill`, so the box fill is set as `bgFill` on the layer template —
 * otherwise `GraphCanvasApp`'s default slate `bgFill: 0x94a3b8` paints every box.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type {
  GraphCanvas,
  GraphData,
  GraphEdge,
  GraphLayer,
  GraphNode,
  NodeShapeOptions,
  ThemeBehaviour,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { invanaArchitecture } from '@invana/graph-datasets/usecase-demos';
import { CollapseExpandBehaviour, MiniMapLayer } from '@invana/canvas-react';
import { CanvasMessageBar, GraphCanvasApp, GraphControlsToolbar, GraphStatusBar, ToolbarItems } from '@invana/canvas-ui';
import { ThemeProvider } from '@invana/themes';
import { Atom, LayoutDashboard, Moon, Network, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/domains/invana-architecture/EndToEnd' };
export default meta;
type Story = StoryObj;

export const EndToEndStory: Story = {
  name: 'EndToEnd',
  render: () => {
    // Which layout the header picker is on. `'authored'` isn't a registered
    // layout — it's the absence of one (`activeLayout: ''`) plus a rewrite of the
    // positions the data shipped with, held in `authoredRef` below.
    const [layoutMode, setLayoutMode] = useState<'authored' | 'force' | 'elk'>('authored');
    // The live engine, captured at `onReady` so the picker (which renders in the
    // header, outside the canvas subtree) can drive it without a context read.
    const canvasRef = useRef<GraphCanvas | null>(null);
    // The diagram's own coordinates, snapshotted before any solver has touched
    // them. Without this, "Authored" could only mean "stop laying out", which
    // would leave the graph wherever ELK or the force sim happened to end.
    const authoredRef = useRef<{ ids: string[]; xy: Float32Array } | null>(null);

    const applyLayout = useCallback((next: 'authored' | 'force' | 'elk') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      setLayoutMode(next);

      if (next !== 'authored') {
        canvas.update({ activeLayout: next });
        return;
      }
      // Back to the diagram. Clear the active layout first so nothing re-runs on
      // the writes below, and stop the force sim explicitly — it's iterative, so
      // un-wiring it doesn't halt a settle that's already in flight.
      canvas.update({ activeLayout: '' });
      canvas.layout<D3ForceLayout>('force')?.stop();
      const authored = authoredRef.current;
      const graph = canvas.layers.get('graph') as GraphLayer | undefined;
      if (authored && graph) graph.store.setPositionsBulk(authored.ids, authored.xy);
      canvas.fitView(60);
    }, []);

    // The dataset is engine-ready, and three of its fields are diagram
    // *content* rather than styling, so they ride on the node itself:
    //
    //   - `position`. For a `box` that's its top-left; for a `stage` it's the
    //     frame's top-left (children bbox − 14 pad − 28 tab), which is also
    //     where a *collapsed* stage stays.
    //   - `parentId`, which puts a box inside its frame.
    //   - `style.labelText`, the caption.
    //
    // `states: ['stage']` names the active tint overlay; the `theme:change`
    // handler swaps it for `stageDark`. Box footprints (`data.width` /
    // `data.height`) ride on the data payload the shape resolver reads.
    const data: GraphData = useMemo(
      () => ({
        // Nodes arrive engine-ready: position, parentId, caption and the
        // `stage` tint state are all on the dataset.
        nodes: invanaArchitecture.nodes as GraphNode[],

        // Solid = the numbered loop; `dashed` = the feedback / side links —
        // the only thing the story translates, since `strokeDashArray` is a
        // *look*, not data. Everything else about an edge — colour, weight,
        // arrowhead, smooth path, label font + pill — is on the layer template.
        edges: invanaArchitecture.edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          style: {
            ...(e.data.caption !== undefined ? { labelText: e.data.caption } : {}),
            ...(e.data.dashed ? { strokeDashArray: [5, 4] } : {}),
          },
        })) satisfies GraphEdge[],
      }),
      [],
    );

    const config = useMemo(() => {
      // The one place a stage's colour is authored: hue per group id, in both
      // modes. The two state overlays below read it, so adding a stage is an id
      // + a tint pair — no per-node style block anywhere.
      const STAGE_TINT: Record<string, { light: number; dark: number }> = {
        simulation: { light: 0xf5f3ff, dark: 0x231f35 },
        memory: { light: 0xfefce8, dark: 0x322d18 },
        decision: { light: 0xf0fdfa, dark: 0x13302c },
        learning: { light: 0xfff7ed, dark: 0x33261a },
        observe: { light: 0xfefce8, dark: 0x322d18 },
        audit: { light: 0xf4f4f5, dark: 0x27272a },
        context: { light: 0xecfdf5, dark: 0x143024 },
        'data-sources': { light: 0xeef2ff, dark: 0x1e2440 },
        reversibility: { light: 0xf4f4f5, dark: 0x27272a },
        ingestion: { light: 0xecfeff, dark: 0x122e33 },
        action: { light: 0xfef2f2, dark: 0x351f1f },
      };

      return {
        // Positions are authored — no layout runs. `fitOnLoad` (on by default)
        // frames the diagram once the first paint lands.
        activeLayout: '',
        layers: {
          // No `background` entry — the app's `BackgroundLayer` recolours itself
          // from the published palette's `surface` role, which is the page
          // backdrop in both modes. Pinning a colour here would freeze it.
          graph: {
            // The whole node look, by type. `GraphLayer` resolves every template
            // field against the `GraphNode` before rendering, so a field that
            // differs between a stage frame and a box is a `(node) => …` branch
            // rather than 43 per-node style blocks.
            //
            // The colours here are the *light* values, and only the pre-theme
            // seed: `bgStrokeColor` / `labelColor` are re-published by
            // `GraphLayer` from the palette's `stroke` / `foreground` roles, and
            // `bgFill` is patched per mode by the `theme:change` handler in
            // `onReady` (the palette has no "box fill" role to read). `bgFill`
            // (not the shape's own `fill`) is what the renderer paints, and it
            // must be set here or the app's default slate node fill wins.
            node: {
              style: {
                // A stage is a folder silhouette whose body auto-fits its
                // children; `width`/`height` are the auto-fit *floor*. No
                // `tabWidth`: leaving it unset is what lets the tab size itself
                // to the title (`ShapeCtor.fitToContent`), and it's why a
                // collapsed stage — which is nothing *but* its tab — shows its
                // whole name. A box is a plain rect sized from its own `data`.
                shape: (node: GraphNode): NodeShapeOptions => {
                  if (node.type === 'stage') {
                    return { kind: 'tabbed-rect', width: 130, height: 36, tabHeight: 28, cornerRadius: 6 };
                  }
                  const box = node.data as { width: number; height: number };
                  return { kind: 'rect', width: box.width, height: box.height, cornerRadius: 3 };
                },
                // Only a stage is a group: the frame sits behind its `parentId`
                // members, wraps them, and carries the collapse toggle.
                group: (node: GraphNode) =>
                  node.type === 'stage'
                    ? {
                        autoFit: true,
                        padding: 14,
                        headerHeight: 28,
                        tabSkew: 12,
                        behindChildren: true,
                        togglePlacement: 'top-right',
                      }
                    : undefined,
                bgFill: 0xffffff,
                bgStrokeColor: 0x9ca3af,
                bgStrokeWidth: 1,
                // A stage title goes in the tab (`inside-*` is routed there) and
                // reads as a heading; a box caption is centred in the box.
                labelPlacement: (node: GraphNode) => (node.type === 'stage' ? 'inside-center' : 'center'),
                labelFontWeight: (node: GraphNode) => (node.type === 'stage' ? 600 : 400),
                labelAlign: 'center',
                labelColor: 0x111827,
                labelFontSize: 11,
                labelLineHeight: 14,
              },
              // The stage tint rides on a **state overlay**, not on `style`:
              // publishing a palette rewrites every group node's `style.bgFill` /
              // `style.bgStrokeColor` from the theme's `cardBg` / `divider`
              // roles, so a tint written to `style` is painted over the moment a
              // theme lands. State overlays resolve *above* `style`, so these
              // survive a theme flip — `onReady` just swaps which name is active.
              state: {
                stage: {
                  bgFill: (node: GraphNode) => STAGE_TINT[node.id]?.light ?? 0xf4f4f5,
                  bgStrokeColor: 0xa1a1aa,
                  labelColor: 0x27272a,
                },
                stageDark: {
                  bgFill: (node: GraphNode) => STAGE_TINT[node.id]?.dark ?? 0x27272a,
                  bgStrokeColor: 0x52525b,
                  labelColor: 0xe4e4e7,
                },
              },
            },
            edge: {
              style: {
                strokeColor: 0x9ca3af,
                strokeWidth: 1,
                arrowTargetShape: 'triangle',
                arrowTargetSize: 7,
                shape: { pathType: 'smooth', sourceAnchor: 'boundary', targetAnchor: 'boundary' },
                labelColor: 0x3f3f46,
                labelFontSize: 10,
                labelAutoRotate: false,
                // Same story as the node `bgFill` — the light seed, re-patched
                // per mode in `onReady` so a flow label never sits in a white
                // pill on a dark page.
                labelBackgroundFill: 0xffffff,
                labelBackgroundPadding: 2,
              },
            },
          },
        },
        behaviours: {
          // Colour-by-label off — the diagram's own palette is the point.
          color: { enabled: false },
          // Hovering a stage frame floats what it contains — its boxes and the
          // arrows between them — above the neighbouring stages. That's the
          // behaviour's own `raiseActive` doing the right thing for a group:
          // the frame is a backdrop, so it lifts its contents, not itself.
          hover: { enabled: true, state: 'highlighted', degree: 1 },
          // `collapse` and `click-select` both claim the `pointer+click` gesture
          // and the engine refuses the second claimant, so selection stands down
          // for the +/− toggles.
          'click-select': { enabled: false },
          // No `theme` entry: the app's own `ThemeBehaviour` + `CanvasThemeSync`
          // already publish the `default` palette for whichever mode the header
          // toggle is in. Using the `light`/`dark` *shorthand* here would publish
          // an empty palette instead, and nothing on the page would recolour.
        },
      };
    }, []);

    const onReady = useCallback((canvas: GraphCanvas | null) => {
      if (!canvas) return;
      const graph = canvas.layers.get('graph') as GraphLayer | undefined;
      const renderer = graph?.getRenderer();
      if (!graph || !renderer) return;

      // ── Keep the flow labels readable ───────────────────────────────────
      // An edge label is part of its connector, and connectors paint *below*
      // every shape — so a label that lands over a stage frame is covered by it
      // ("recall past episodes" disappearing into the Decision frame). Lifting a
      // labelled connector floats it above every non-lifted node, which is how
      // the source diagram reads.
      //
      // Declared once, as this story's own **source** in `interaction.raised`:
      // lifts are per-source and the renderer projects their union, so the hover
      // behaviour's lift composes with this one instead of cancelling it. (It
      // used to need re-asserting after every `pointerout`, because the hover
      // behaviour lowered whatever it had raised without knowing this story had
      // raised some of the same edges.)
      const labelledEdges = new Set<string>();
      for (const edge of graph.store.edges()) {
        if (graph.resolveEdgeStyle(edge).labelText === undefined) continue;
        labelledEdges.add(edge.id);
      }
      canvas.store.actions.raise.set('labelled-edges', labelledEdges);

      // ── The half of light/dark the palette can't express ─────────────────
      // `BackgroundLayer` and `GraphLayer` recolour themselves off the published
      // palette (page backdrop, label text, node borders, arrows), so all that's
      // left is the diagram's own colours: the box fill, the edge-label pill,
      // and which of the two stage-tint overlays is active.
      const applyThemeKind = (kind: 'light' | 'dark'): void => {
        const dark = kind === 'dark';
        canvas.update({
          layers: {
            graph: {
              // Shallow-merged over the layer template, so the type resolvers
              // and the theme's own `labelColor` / `bgStrokeColor` survive.
              node: { style: { bgFill: dark ? 0x18181b : 0xffffff } },
              edge: { style: { labelBackgroundFill: dark ? 0x18181b : 0xffffff } },
            },
          },
        });
        const want = dark ? 'stageDark' : 'stage';
        for (const node of graph.store.nodes()) {
          if (node.type !== 'stage') continue;
          graph.store.updateNode(node.id, { states: [want] });
        }
      };
      // Authored `states` are separate from the runtime hover/selection states,
      // so re-writing them can't clear a live hover. The layer subscribed at
      // mount, so this handler always runs *after* its palette recolour.
      canvas.events.on('theme:change', (theme) => applyThemeKind(theme.kind));
      // The app's `CanvasThemeSync` pins the mode before `onReady` fires, so the
      // first publish has already happened — seed from the current resolved kind
      // rather than waiting for the next flip.
      const themeBehaviour = canvas.behaviours.get('theme') as ThemeBehaviour | undefined;
      applyThemeKind(themeBehaviour?.getResolvedKind() ?? 'light');

      // ── The layout picker's three modes ──────────────────────────────────
      canvasRef.current = canvas;

      // Snapshot the authored coordinates before anything can move them. Note
      // this reads the *store*, not the data literal, so it also captures where
      // each auto-fit frame settled once its children mounted.
      const authoredIds: string[] = [];
      const authoredXY: number[] = [];
      for (const node of graph.store.nodes()) {
        const p = graph.store.getPosition(node.id);
        authoredIds.push(node.id);
        authoredXY.push(p?.x ?? 0, p?.y ?? 0);
      }
      authoredRef.current = { ids: authoredIds, xy: new Float32Array(authoredXY) };

      // Registered after `init`, which is the same thing canvas-react's layout
      // wrappers do from their mount effect — `canvas.update({ activeLayout })`
      // re-wires and runs whichever id is named.
      //
      // Force clusters group members toward a shared centroid; that's attraction,
      // not containment, so the frames stretch to follow rather than boxing their
      // contents. Static (`animate: false`) because a diagram this size takes a
      // visible few seconds to stop wandering otherwise.
      const force = new D3ForceLayout({
        id: 'force',
        targetLayerId: 'graph',
        animate: false,
        cluster: { strength: 0.4 },
        charge: { strength: -1200 },
        link: { distance: 120 },
        collide: {},
        center: { x: 0, y: 0 },
      });
      // ELK is the one engine here with native containment: each stage becomes a
      // real compound node. `includeGroups` defaults on, and the frame insets come
      // from each group's own `padding` / `headerHeight` — so the tab keeps its
      // band instead of having members packed into it. Edge routing is left unset
      // deliberately: turning it on writes orthogonal waypoints into every edge's
      // stored style, which would outlive a switch back to the authored diagram
      // and replace its smooth arrows.
      const elk = new ElkLayout({
        id: 'elk',
        targetLayerId: 'graph',
        algorithm: 'layered',
        direction: 'RIGHT',
        nodeSpacing: 32,
        layerSpacing: 90,
      });
      for (const layout of [force, elk]) {
        canvas.layouts.add(layout);
        layout.events.on('end', () => canvas.fitView(60));
      }

      canvas.showMessage('Hover a stage to raise it · click − to collapse it · switch Layout in the header');
    }, []);

    return (
      // A real consumer mounts the app under its own <ThemeProvider> — the app
      // reads light/dark from it (and throws without one).
      <ThemeProvider>
        <GraphCanvasApp
          data={data}
          config={config}
          onReady={onReady}
          header={{
            title: 'Invana — end-to-end architecture',
            center: <GraphControlsToolbar />,
            right: (ctx) => (
              <ToolbarItems
                orientation="horizontal"
                items={[
                  {
                    type: 'select',
                    key: 'layout',
                    label: 'Layout',
                    value: layoutMode,
                    display: 'segmented',
                    options: { authored: 'Authored', force: 'Force', elk: 'ELK' },
                    icons: { authored: LayoutDashboard, force: Atom, elk: Network },
                    onChange: (v) => applyLayout(v as 'authored' | 'force' | 'elk'),
                  },
                  {
                    type: 'toggle',
                    key: 'theme',
                    icon: Sun,
                    activeIcon: Moon,
                    label: 'Switch to dark theme',
                    activeLabel: 'Switch to light theme',
                    active: ctx.themeKind === 'dark',
                    onToggle: ctx.toggleTheme,
                  },
                ]}
              />
            ),
          }}
          footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        >
          <CollapseExpandBehaviour id="collapse" targetLayerId="graph" />
          <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
        </GraphCanvasApp>
      </ThemeProvider>
    );
  },
};
