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
 * (`layered`) registered as the `activeLayout`; behaviours match the d3-force
 * story — `HoverActivateBehaviour` 1-hop focal emphasis, `ClickSelectBehaviour`
 * (shift multi), `DragNodeBehaviour`, a per-type filter, and a `MiniMapLayer`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
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
import { SystemThemeBehaviour } from '../../system-theme';

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

    // Project (nodes passing the label filter) + (edges whose endpoints both
    // survive) into GraphNode/GraphEdge, mapping the dataset's property-graph
    // shape: `label → type`, `properties → data`. Styling comes entirely from
    // the layer-level resolvers below. The first projection seeds `initData`;
    // the GUI filter re-projects + swaps the data live via `setData`.
    const project = () => {
      const keep = invanaCodeKg.nodes.filter((n) => includesLabel(n.label));
      const idSet = new Set(keep.map((n) => n.id));
      const edges = invanaCodeKg.edges.filter(
        (e) => idSet.has(e.source) && idSet.has(e.target),
      );
      return {
        nodes: keep.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          type: e.label,
          data: e.properties,
        })),
      };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#usecase-invana-code-kg-elk',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolvers read the live `settings`, so flipping a GUI control + a style
    // wipe (`rerenderAll`) re-resolves the card without rebuilding. Resolvers
    // read `n.type` / `n.data` (mapped from the dataset's `label` /
    // `properties` in `project()`).
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

    // GraphLayer constructor keeps only the non-serialisable bits: `initData`
    // (content) + the `shape` resolver. Pure literal style fields live in
    // `canvasOptions.layers.graph` and shallow-merge at init.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: project(),
        node: {
          style: {
            // The card IS the node visual — it carries its own fill/stroke and
            // surfaces the data, so there's no separate GraphLayer label here.
            shape: cardShape,
          },
        },
      },
    });

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.layers.add(new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph' } }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', targetLayerId: 'bg' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const hover = new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' });
    canvas.behaviours.register(hover);

    canvas.behaviours.register(
      new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }),
    );

    // ── Layout ───────────────────────────────────────────────────────────
    // Layered DAG — tiers the import graph along `direction`. The `nodeSize`
    // resolver feeds ELK the real 300×165 card dimensions (so it leaves room
    // per card instead of treating nodes as points) and stays in the
    // constructor; the literal spacings live in config. The `activeLayout`
    // auto-runs on mount.
    // `ElkLayout`'s constructor takes only `ElkLayoutOptions` (the `nodeSize`
    // resolver lives here); its `id` / `targetLayerId` come from the base
    // `Layout` and are assigned after construction so the registry keys it as
    // `'elk'` and `activeLayout: 'elk'` resolves against the `graph` layer.
    const layout = Object.assign(
      new ElkLayout({ nodeSize: () => ({ width: CARD.w, height: CARD.h }) }),
      { id: 'elk', targetLayerId: 'graph' },
    );
    canvas.layouts.add(layout);
    onStoryTeardown(() => layout.stop());
    layout.events.on('end', ({ reason }) => {
      if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
    });

    // ── Serialisable config ──────────────────────────────────────────────
    const canvasOptions = {
      layers: {
        bg: {
          type: 'pattern',
          patternType: 'dots',
          backgroundColor: '#0b1220',
          color: '#1e293b',
          size: 1.2,
          spacing: 26,
          alpha: 0.7,
        },
        graph: {
          node: {
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
        minimap: {
          position: 'bottom-right',
          width: 220,
          height: 160,
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
        select: { enabled: true, multiple: true, trigger: ['shift'] },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#cbd5e1' },
          dark: { backgroundColor: '#0b1220', color: '#1e293b' },
        },
      },
      layouts: {
        elk: {
          algorithm: 'layered',
          direction: settings.direction,
          nodeSpacing: settings.nodeSpacing,
          layerSpacing: settings.layerSpacing,
          edgeNodeSpacing: settings.edgeNodeSpacing,
        },
      },
      activeLayout: 'elk',
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── Live updates ─────────────────────────────────────────────────────
    // Re-run ELK with the current layout params (used by the per-type filter
    // and the ELK-layout GUI controls).
    const runLayout = (): void => {
      canvas.update({ layouts: { elk: canvasOptions.layouts.elk } });
    };

    // Re-project against the current filter, swap the data live, then re-run.
    const onFilter = (): void => {
      graph.setData(project());
      runLayout();
    };

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
      .add(canvasOptions.layers.graph.edge.style, 'strokeAlpha', 0, 1, 0.01)
      .name('edge alpha')
      .onChange((v: number) => {
        settings.edgeAlpha = v;
        canvas.update({ layers: { graph: { edge: { style: { strokeAlpha: v } } } } });
      });
    styleFolder
      .add(settings, 'hoverEmphasis')
      .name('hover focal emphasis')
      .onChange((on: boolean) => (on ? hover.enable() : hover.disable()));

    const filterFolder = gui.addFolder('Entity types');
    filterFolder.add(settings, 'includeFile').name('file').onChange(onFilter);
    filterFolder.add(settings, 'includeFunction').name('function').onChange(onFilter);
    filterFolder.add(settings, 'includeClass').name('class').onChange(onFilter);
    filterFolder.add(settings, 'includeConfig').name('config').onChange(onFilter);
    filterFolder.add(settings, 'includeDocument').name('document').onChange(onFilter);

    const elkFolder = gui.addFolder('ELK layout');
    elkFolder
      .add(settings, 'direction', ['UP', 'DOWN', 'LEFT', 'RIGHT'])
      .name('direction')
      .onChange((v: ElkDirection) => {
        canvasOptions.layouts.elk.direction = v;
        runLayout();
      });
    elkFolder
      .add(settings, 'nodeSpacing', 4, 120, 1)
      .onFinishChange((v: number) => {
        canvasOptions.layouts.elk.nodeSpacing = v;
        runLayout();
      });
    elkFolder
      .add(settings, 'layerSpacing', 20, 320, 5)
      .onFinishChange((v: number) => {
        canvasOptions.layouts.elk.layerSpacing = v;
        runLayout();
      });
    elkFolder
      .add(settings, 'edgeNodeSpacing', 0, 80, 1)
      .name('edge-node gap')
      .onFinishChange((v: number) => {
        canvasOptions.layouts.elk.edgeNodeSpacing = v;
        runLayout();
      });

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
