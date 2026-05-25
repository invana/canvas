/**
 * **Invana Code Knowledge Graph** — a *real* code-intelligence graph of the
 * Invana platform monorepo (602 source entities, 1,329 typed relations),
 * produced by the `understand-anything` static analyser and shipped as
 * `invanaCodeKg` in `@invana/graph-datasets`. Files, functions, classes,
 * configs and docs are drawn as a force-directed cloud; `imports`,
 * `contains`, `calls`, `inherits`, … relations are the edges. The same
 * picture a Sourcegraph / CodeSee / Gephi "repo map" shows, but over an
 * actual codebase rather than a synthetic one.
 *
 * Exercises: `D3ForceLayout` at real scale (`animate: false`, settle-then-
 * show), field-level resolvers driving fill by entity **type** or by the
 * 8 architectural **clusters** the analyser found, node radius by
 * complexity, `LabelCollisionBehaviour` + `labelMinZoom` to keep 602
 * labels legible, `HoverActivateBehaviour` 1-hop focal emphasis,
 * `ClickSelectBehaviour` (shift multi), `DragNodeBehaviour`, a per-type
 * filter, and a `MiniMapLayer`.
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
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import {
  invanaCodeKg,
  type InvanaCodeComplexity,
  type InvanaCodeNodeLabel,
  type InvanaCodeNodeProperties,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Usecases/code-kg' };
export default meta;
type Story = StoryObj;

export const F3Force: Story = {
  name: 'd3-force',
  render: () => createContainer({ id: 'usecase-invana-code-kg' }),

  play: async ({ canvasElement }) => {
    // ── Palettes ─────────────────────────────────────────────────────────
    // Fill by node label / entity kind (default) …
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

    // Node radius by complexity bucket — complex modules read larger.
    const COMPLEXITY_RADIUS: Record<InvanaCodeComplexity, number> = {
      simple: 4,
      moderate: 5.5,
      complex: 8,
    };

    const settings = {
      colorMode: 'type' as 'type' | 'cluster',
      showLabels: true,
      hoverEmphasis: true,
      edgeAlpha: 0.22,
      // Per-type filter — thin the 602-node cloud to the layers you care about.
      includeFile: true,
      includeFunction: true,
      includeClass: true,
      includeConfig: true,
      includeDocument: true,
      // D3-force tuning. ~600 nodes / ~1.3k edges: moderate repulsion,
      // short links, light collision keeps clusters distinct but compact.
      chargeStrength: -90,
      linkDistance: 36,
      collideRadius: 9,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#usecase-invana-code-kg',
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

    // Resolvers read the live `settings`, so flipping a GUI control + a
    // style wipe (`rerenderAll`) re-resolves fill/label without rebuilding.
    // `label` / `properties` from the dataset are mapped onto GraphNode's
    // `type` / `data` in `apply()`, so resolvers read `n.type` / `n.data`.
    const props = (n: GraphNode): InvanaCodeNodeProperties => n.data as InvanaCodeNodeProperties;

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: (n: GraphNode): NodeShapeOptions => ({
              kind: 'circle',
              radius: COMPLEXITY_RADIUS[props(n).complexity],
            }),
            bgFill: (n: GraphNode) =>
              settings.colorMode === 'type'
                ? LABEL_FILL[n.type as InvanaCodeNodeLabel]
                : CLUSTER_FILL[props(n).cluster ?? ''] ?? UNCLUSTERED_FILL,
            bgAlpha: 0.95,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 1,
            // 602 labels would smother the cloud at overview zoom, so they
            // only switch on past 1.6× — and `LabelCollisionBehaviour`
            // hides any that still overlap once shown.
            labelText: (n: GraphNode) => (settings.showLabels ? props(n).name : ''),
            labelColor: 0x64748b, // slate-500 — reads on both light + dark bg
            labelFontSize: 9,
            labelPlacement: 'bottom',
            labelOffsetY: 2,
            labelMinZoom: 1.6,
          },
          state: {
            // Sharper amber ring on hover/highlight; force the label visible
            // so a hovered node is always readable regardless of zoom.
            highlighted: {
              bgStrokeColor: 0xfbbf24,
              bgStrokeWidth: 2.5,
              labelForceShow: true,
            },
            selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
            dimmed: { bgAlpha: 0.12 },
          },
        },
        edge: {
          style: {
            shape: { pathType: 'straight' },
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

    // canvas.behaviours.register(
    //   new LabelCollisionBehaviour({ id: 'label-collision', layerId: 'graph', enabled: true }),
    // );

    // ── Layout ───────────────────────────────────────────────────────────
    let layout: D3ForceLayout | null = null;
    const runLayout = async (): Promise<void> => {
      layout?.stop();
      layout = new D3ForceLayout({
        // ~600 nodes / ~1.3k edges — skip intermediate renders and flush
        // once on settle so the user sees the laid-out graph, not the
        // scatter. Same call shape as the Cora story.
        animate: false,
        link: { distance: settings.linkDistance },
        charge: { strength: settings.chargeStrength },
        collide: { radius: settings.collideRadius },
        center: { x: 0, y: 0 },
      });
      layout.events.on('end', ({ reason }) => {
        if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 60);
      });
      await layout.apply(graph);
    };
    void runLayout();
    onStoryTeardown(() => layout?.stop());

    // Wipe per-instance styles so the layer-template resolvers (fill, label)
    // re-resolve against the current `settings`.
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
      .name('colour by')
      .onChange(rerenderAll);
    styleFolder
      .add(settings, 'showLabels')
      .name('show labels')
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

    const forceFolder = gui.addFolder('D3-force');
    forceFolder.add(settings, 'chargeStrength', -300, 0, 1).onFinishChange(() => void runLayout());
    forceFolder.add(settings, 'linkDistance', 5, 120, 1).onFinishChange(() => void runLayout());
    forceFolder.add(settings, 'collideRadius', 0, 24, 0.5).onFinishChange(() => void runLayout());

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
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 60) }, 'fit')
      .name('Fit to content');
  },
};
