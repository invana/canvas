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
 * show) registered as the `activeLayout`, field-level resolvers driving fill
 * by entity **type** or by the 8 architectural **clusters** the analyser
 * found, node radius by complexity, `labelMinZoom` +
 * `LabelResolutionLODBehaviour` to keep 602 labels legible and crisp,
 * `HoverActivateBehaviour` 1-hop focal emphasis, `ClickSelectBehaviour`
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
  LabelResolutionLODBehaviour,
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
import { SystemThemeBehaviour } from '../../system-theme';

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
      '#usecase-invana-code-kg',
    )!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolvers read the live `settings`, so flipping a GUI control + a style
    // wipe (`rerenderAll`) re-resolves fill/label without rebuilding.
    // Resolvers read `n.type` / `n.data` (mapped from the dataset's `label` /
    // `properties` in `project()`).
    const props = (n: GraphNode): InvanaCodeNodeProperties => n.data as InvanaCodeNodeProperties;

    // GraphLayer constructor keeps only the non-serialisable bits: `initData`
    // (content) + the resolver functions. Pure literal style fields live in
    // `canvasOptions.layers.graph` and shallow-merge at init.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: project(),
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
            // 602 labels would smother the cloud at the fitted overview, so
            // they only switch on once you zoom past 0.6× — a small zoom-in
            // from the fitted view. `LabelResolutionLODBehaviour` (below)
            // re-rasters them crisp once you zoom in far enough to read them.
            labelText: (n: GraphNode) => (settings.showLabels ? props(n).name : ''),
          },
        },
      },
    });

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.layers.add(new MiniMapLayer({ id: 'minimap', options: { graphLayerId: 'graph' } }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', layerId: 'bg' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));
    // Labels appear at 0.6× (via `labelMinZoom` in the node style); this
    // re-rasters them at 4× resolution once you zoom past 1.6× so the text you
    // zoomed in to read stays crisp instead of upsampling-blurry. It does NOT
    // hide/show labels — only their texture resolution per tier.
    canvas.behaviours.register(
      new LabelResolutionLODBehaviour({ id: 'label-lod', layerId: 'graph' }),
    );

    const hover = new HoverActivateBehaviour({
      id: 'hover',
      layerId: 'graph',
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
        multiple: true,
        trigger: ['shift'],
      }),
    );

    // canvas.behaviours.register(
    //   new LabelCollisionBehaviour({ id: 'label-collision', layerId: 'graph' }),
    // );

    // ── Layout ───────────────────────────────────────────────────────────
    // ~600 nodes / ~1.3k edges — `animate: false` (in config) skips
    // intermediate renders and flushes once on settle so the user sees the
    // laid-out graph, not the scatter. The `activeLayout` auto-runs on mount.
    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);
    onStoryTeardown(() => forceLayout.stop());
    forceLayout.events.on('end', ({ reason }) => {
      if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 60);
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
            style: {
              bgAlpha: 0.95,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 1,
              labelColor: 0x64748b, // slate-500 — reads on both light + dark bg
              labelFontSize: 9,
              labelPlacement: 'bottom',
              labelOffsetY: 2,
              labelMinZoom: 0.6,
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
        minimap: {
          position: 'bottom-right',
          width: 220,
          height: 160,
        },
        'label-lod': {
          levels: [
            { minZoom: 0, multiplier: 1 },
            { minZoom: 1.6, multiplier: 4 },
          ],
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: { enabled: true },
        select: { enabled: true },
        'label-lod': { enabled: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#cbd5e1' },
          dark: { backgroundColor: '#0b1220', color: '#1e293b' },
        },
      },
      layouts: {
        force: {
          animate: false,
          link: { distance: settings.linkDistance },
          charge: { strength: settings.chargeStrength },
          collide: { radius: settings.collideRadius },
          center: { x: 0, y: 0 },
        },
      },
      activeLayout: 'force',
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // ── Live updates ─────────────────────────────────────────────────────
    // Re-heat the force sim with the current layout params (used by the
    // per-type filter and the D3-force GUI sliders).
    const runLayout = (): void => {
      canvas.update({ layouts: { force: canvasOptions.layouts.force } });
    };

    // Re-project against the current filter, swap the data live, then re-run.
    const onFilter = (): void => {
      graph.setData(project());
      runLayout();
    };

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

    const forceFolder = gui.addFolder('D3-force');
    forceFolder
      .add(settings, 'chargeStrength', -300, 0, 1)
      .onFinishChange((v: number) => {
        canvasOptions.layouts.force.charge.strength = v;
        runLayout();
      });
    forceFolder
      .add(settings, 'linkDistance', 5, 120, 1)
      .onFinishChange((v: number) => {
        canvasOptions.layouts.force.link.distance = v;
        runLayout();
      });
    forceFolder
      .add(settings, 'collideRadius', 0, 24, 0.5)
      .onFinishChange((v: number) => {
        canvasOptions.layouts.force.collide.radius = v;
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
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 60) }, 'fit')
      .name('Fit to content');
  },
};
