/**
 * **Invana Code Knowledge Graph** — a *real* code-intelligence graph of the
 * Invana platform monorepo (602 source entities, 1,329 typed relations),
 * produced by the `understand-anything` static analyser and shipped as
 * `invanaCodeKg` in `@invana/graph-datasets`. Files, functions, classes,
 * configs and docs are laid out as a layered dependency DAG; `imports`,
 * `contains`, `calls`, `inherits`, … relations are the edges.
 *
 * Every node is rendered as a **composite "card"** (the `kind: 'composite'`
 * shape from `Canvas/Concepts/Shapes/Composite`) so the card itself surfaces
 * the node's data — label, complexity, name, summary, file path, line range.
 * The card's accent bar + border colour come from the active palette (entity
 * **type** or the 8 architectural **clusters**). Layout is `ElkLayout`
 * (`layered`); behaviours match the d3-force story — `HoverActivateBehaviour`
 * 1-hop focal emphasis, `ClickSelectBehaviour` (shift multi),
 * `DragNodeBehaviour`, a per-type filter, and a `MiniMapLayer`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  MiniMapLayer,
  type GraphNode,
  type NodeShapeOptions,
} from '@invana/graph';
import { ElkLayout, type ElkDirection } from '@invana/graph-layout-elkjs';
import {
  invanaCodeKg,
  type InvanaCodeNodeLabel,
  type InvanaCodeNodeProperties,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Usecases/code-kg' };
export default meta;
type Story = StoryObj;

export const ElkjsCards: Story = {
  name: 'elkjs (composite cards)',
  render: () => createContainer({ id: 'usecase-invana-code-kg-elk' }),

  play: async ({ canvasElement }) => {
    // ── Palettes ─────────────────────────────────────────────────────────
    // Accent / border colour by node label / entity kind (default) …
    const LABEL_FILL: Record<InvanaCodeNodeLabel, number> = {
      file:     0x3b82f6, // blue
      function: 0x10b981, // emerald
      class:    0x8b5cf6, // violet
      config:   0xf59e0b, // amber
      document: 0xec4899, // pink
    };
    // … or by the analyser's 8 architectural clusters (the source `layers`).
    const CLUSTER_FILL: Record<string, number> = {
      'layer:graph-connectors': 0x2563eb, // blue
      'layer:modeller':         0x8b5cf6, // violet
      'layer:engine-domain':    0x10b981, // emerald
      'layer:engine-platform':  0x14b8a6, // teal
      'layer:studio-ui':        0xf59e0b, // amber
      'layer:studio-data':      0xec4899, // pink
      'layer:studio-types':     0xef4444, // red
      'layer:config':           0x64748b, // slate
    };
    const UNCLUSTERED_FILL = 0x94a3b8; // slate-400 — node in no cluster

    // ── Card geometry (the "node definition" — all field positions here) ──
    // Same layout as the Composite shape story: an outer rounded frame, a
    // left accent bar, a header divider, and six text blocks.
    const CARD = { w: 300, h: 165, pad: 18, radius: 14 };
    const inner = CARD.w - CARD.pad * 2; // 264

    const settings = {
      colorMode: 'type' as 'type' | 'cluster',
      hoverEmphasis: true,
      edgeAlpha: 0.22,
      // Per-type filter — thin the 602-node graph to the layers you care about.
      includeFile: true,
      includeFunction: true,
      includeClass: true,
      includeConfig: true,
      includeDocument: true,
      // ELK layered-DAG tuning. Cards are 300×165, fed to ELK via `nodeSize`
      // below, so these spacings are the *gaps* between cards / layers.
      direction: 'RIGHT' as ElkDirection,
      nodeSpacing: 28,
      layerSpacing: 90,
      // Reserve a lane between nodes and edges so the manhattan router has
      // clear channels to thread through — fewer edges forced over cards.
      edgeNodeSpacing: 24,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#usecase-invana-code-kg-elk',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: {
          type: 'pattern',
          patternType: 'dots',
          mode: 'auto',
          backgroundColor: { light: '#f8fafc', dark: '#0b1220' },
          color: { light: '#cbd5e1', dark: '#1e293b' },
          size: 1.2,
          spacing: 26,
          alpha: 0.7,
        },
      }),
    );

    // Resolvers read the live `settings`, so flipping a GUI control + a style
    // wipe (`rerenderAll`) re-resolves the card without rebuilding. `label` /
    // `properties` from the dataset are mapped onto GraphNode's `type` /
    // `data` in `apply()`, so resolvers read `n.type` / `n.data`.
    const props = (n: GraphNode): InvanaCodeNodeProperties => n.data as InvanaCodeNodeProperties;
    const accentOf = (n: GraphNode): number =>
      settings.colorMode === 'type'
        ? LABEL_FILL[n.type as InvanaCodeNodeLabel]
        : CLUSTER_FILL[props(n).cluster ?? ''] ?? UNCLUSTERED_FILL;

    // Build a composite "card" spec from a node's properties. The card body
    // carries its own `fill` + `stroke` (so we leave `bgFill` unset — a set
    // `bgFill`/`bgStrokeColor` would override these); the state overlays add
    // an amber/white ring via `bgStrokeColor` on hover / select.
    const cardShape = (n: GraphNode): NodeShapeOptions => {
      const p = props(n);
      const accent = accentOf(n);
      return {
        kind: 'composite',
        width: CARD.w,
        height: CARD.h,
        cornerRadius: CARD.radius,
        fill: 0x1f2937,
        stroke: { color: accent, width: 2 },
        parts: [
          // left accent bar + header divider
          { part: 'rect', x: 0, y: CARD.radius, width: 4, height: CARD.h - 2 * CARD.radius, fill: accent },
          { part: 'line', x: CARD.pad, y: 46, x2: CARD.w - CARD.pad, y2: 46, stroke: { color: 0x374151, width: 1 } },
          // top tags: entity kind (left) + complexity (right)
          { part: 'label', x: CARD.pad, y: 16, text: (n.type as string) ?? '', fontSize: 10, fontWeight: 600, fontVariant: 'small-caps', fill: 0x94a3b8 },
          { part: 'label', x: CARD.w - CARD.pad, y: 16, text: p.complexity, anchor: 'right', fontSize: 10, fontWeight: 600, fill: accent },
          // heading (name) + description (summary)
          { part: 'label', x: CARD.pad, y: 56, text: p.name, fontSize: 16, fontWeight: 700, fill: 0xf1f5f9, maxWidth: inner, maxLines: 1, overflow: 'ellipsis' },
          { part: 'label', x: CARD.pad, y: 86, text: p.summary, fontSize: 12, fill: 0x94a3b8, lineHeight: 16, align: 'left', maxWidth: inner, maxLines: 2, overflow: 'ellipsis' },
          // footer: file path (left) + line range (right)
          { part: 'label', x: CARD.pad, y: CARD.h - 28, text: p.filePath, fontSize: 11, fontWeight: 500, fill: 0x64748b, maxWidth: inner - 64, maxLines: 1, overflow: 'ellipsis' },
          { part: 'label', x: CARD.w - CARD.pad, y: CARD.h - 28, text: p.lineRange ? `L${p.lineRange[0]}–${p.lineRange[1]}` : '', anchor: 'right', fontSize: 11, fontWeight: 500, fill: 0x64748b },
        ],
      } as unknown as NodeShapeOptions;
    };

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            // The card IS the node visual — it carries its own fill/stroke and
            // surfaces the data, so there's no separate GraphLayer label here.
            shape: cardShape,
          },
          state: {
            // bgStrokeColor overrides the card's own border for a hover /
            // select ring; dimmed fades the frame fill of off-focus cards.
            highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
            selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
            dimmed: { bgAlpha: 0.25 },
          },
        },
        edge: {
          style: {
            // Obstacle-aware right-angle routing. The renderer auto-collects
            // every card as an obstacle, and the `manhattan` router A*-routes
            // each edge around them through the lanes ELK reserved
            // (`edgeNodeSpacing` below). Avoidance is recomputed every time an
            // edge routes — including the re-route after the layout moves
            // nodes — so it holds by default, no per-edge waypoint step.
            shape: { pathType: 'manhattan' },
            strokeColor: 0x94a3b8,
            strokeWidth: 0.8,
            strokeAlpha: settings.edgeAlpha,
            arrowTargetShape: 'triangle',
            arrowTargetSize: 5,
            arrowTargetColor: 0x94a3b8,
          },
          state: {
            highlighted: {
              strokeColor: 0xfbbf24,
              strokeWidth: 1.6,
              strokeAlpha: 0.95,
              arrowTargetColor: 0xfbbf24,
            },
            dimmed: { strokeAlpha: 0.03 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.layers.add(
      new MiniMapLayer({
        id: 'minimap',
        options: {
          graphLayerId: 'graph',
          position: 'bottom-right',
          width: 220,
          height: 160,
        },
      }),
    );

    // ── Data projection ──────────────────────────────────────────────────
    const includesLabel = (l: InvanaCodeNodeLabel): boolean => {
      switch (l) {
        case 'file':     return settings.includeFile;
        case 'function': return settings.includeFunction;
        case 'class':    return settings.includeClass;
        case 'config':   return settings.includeConfig;
        case 'document': return settings.includeDocument;
      }
    };

    // Push (nodes passing the label filter) + (edges whose endpoints both
    // survive) into the layer, mapping the dataset's property-graph shape
    // onto GraphNode/GraphEdge: `label → type`, `properties → data`.
    // Styling comes entirely from the layer-level resolvers above.
    const apply = (): void => {
      const keep = invanaCodeKg.nodes.filter((n) => includesLabel(n.label));
      const idSet = new Set(keep.map((n) => n.id));
      const edges = invanaCodeKg.edges.filter(
        (e) => idSet.has(e.source) && idSet.has(e.target),
      );
      graph.setData({
        nodes: keep.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.label,
          data: e.properties,
        })),
      });
    };
    apply();

    // ── Behaviours ───────────────────────────────────────────────────────
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    const hover = new HoverActivateBehaviour({
      id: 'hover',
      layerId: 'graph',
      enabled: true,
      state: 'highlighted',
      // inactiveState: 'dimmed',
      degree: 1,
      direction: 'both',
    });
    canvas.behaviours.register(hover);

    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select',
        layerId: 'graph',
        enabled: true,
        multiple: true,
        trigger: ['shift'],
      }),
    );

    // ── Layout ───────────────────────────────────────────────────────────
    let layout: ElkLayout | null = null;
    const runLayout = async (): Promise<void> => {
      layout?.stop();
      layout = new ElkLayout({
        // Layered DAG — tiers the import graph along `direction`. Feed ELK the
        // real card dimensions so it leaves room for each 300×165 card instead
        // of treating nodes as points.
        algorithm: 'layered',
        direction: settings.direction,
        nodeSpacing: settings.nodeSpacing,
        layerSpacing: settings.layerSpacing,
        edgeNodeSpacing: settings.edgeNodeSpacing,
        nodeSize: () => ({ width: CARD.w, height: CARD.h }),
        // Reserve lanes between nodes so the manhattan router has clear
        // channels to thread edges through (set on `settings.edgeNodeSpacing`).
      });
      layout.events.on('end', ({ reason }) => {
        if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
      });
      await layout.apply(graph);
    };
    void runLayout();
    onStoryTeardown(() => layout?.stop());

    // Wipe per-instance styles so the layer-template resolvers (card accent,
    // edge alpha) re-resolve against the current `settings`. The manhattan
    // router recomputes obstacle avoidance on the re-route, so edges stay
    // node-avoiding without any per-edge waypoint data to preserve.
    const rerenderAll = (): void => {
      graph.store.batch(() => {
        for (const n of graph.store.nodes()) graph.store.updateNode(n.id, { style: undefined });
        for (const e of graph.store.edges()) graph.store.updateEdge(e.id, { style: undefined });
      });
    };

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Invana Code Knowledge Graph' });
    onStoryTeardown(() => gui.destroy());

    const styleFolder = gui.addFolder('Style');
    styleFolder
      .add(settings, 'colorMode', ['type', 'cluster'])
      .name('accent by')
      .onChange(rerenderAll);
    styleFolder
      .add(settings, 'edgeAlpha', 0, 1, 0.01)
      .name('edge alpha')
      .onChange(rerenderAll);
    styleFolder
      .add(settings, 'hoverEmphasis')
      .name('hover focal emphasis')
      .onChange((on: boolean) => (on ? hover.enable() : hover.disable()));

    const filterFolder = gui.addFolder('Entity types');
    const onFilter = (): void => { apply(); void runLayout(); };
    filterFolder.add(settings, 'includeFile').name('file').onChange(onFilter);
    filterFolder.add(settings, 'includeFunction').name('function').onChange(onFilter);
    filterFolder.add(settings, 'includeClass').name('class').onChange(onFilter);
    filterFolder.add(settings, 'includeConfig').name('config').onChange(onFilter);
    filterFolder.add(settings, 'includeDocument').name('document').onChange(onFilter);

    const elkFolder = gui.addFolder('ELK layout');
    elkFolder
      .add(settings, 'direction', ['UP', 'DOWN', 'LEFT', 'RIGHT'])
      .name('direction')
      .onChange(() => void runLayout());
    elkFolder.add(settings, 'nodeSpacing', 4, 120, 1).onFinishChange(() => void runLayout());
    elkFolder.add(settings, 'layerSpacing', 20, 320, 5).onFinishChange(() => void runLayout());
    elkFolder.add(settings, 'edgeNodeSpacing', 0, 80, 1).name('edge-node gap').onFinishChange(() => void runLayout());

    const info = {
      project: invanaCodeKg.project.name,
      nodes: invanaCodeKg.nodes.length,
      edges: invanaCodeKg.edges.length,
    };
    const infoFolder = gui.addFolder('Dataset');
    infoFolder.add(info, 'project').disable();
    infoFolder.add(info, 'nodes').disable();
    infoFolder.add(info, 'edges').disable();

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
