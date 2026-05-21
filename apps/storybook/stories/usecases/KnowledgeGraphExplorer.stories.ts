/**
 * **Knowledge Graph Explorer** — Palantir / Neo4j Bloom / Diffbot-style
 * entity ontology view. Five companies and their CEOs start on screen;
 * double-clicking any node fetches that node's 1-hop neighbourhood from
 * the underlying dataset and folds it in, so the user can grow the
 * picture interactively from a hand-curated seed.
 *
 * Exercises: kind-based shape + fill, typed edge labels, hover focal
 * emphasis with 1-hop highlight + dim, swappable `D3ForceLayout` ↔
 * `ElkLayout` radial via GUI, `shape:doubleclick` event hooked to
 * neighbour-expansion, entity-type filter checkboxes that
 * re-`setData` against the current selection.
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
  type EdgeData,
  type NodeData,
  type NodeShapeOptions,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import {
  ontology,
  type OntologyEdgeData,
  type OntologyEntityKind,
  type OntologyNodeData,
} from '@invana/graph-datasets/usecase-demos';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'Usecases/Knowledge Graph Explorer' };
export default meta;
type Story = StoryObj;

export const KnowledgeGraphExplorer: Story = {
  render: () => createContainer({ id: 'usecase-ontology' }),

  play: async ({ canvasElement }) => {
    const KIND_FILL: Record<OntologyEntityKind, number> = {
      company:  0x6366f1, // indigo
      person:   0x10b981, // emerald
      product:  0x8b5cf6, // violet
      location: 0xf59e0b, // amber
      industry: 0x64748b, // slate
    };
    const KIND_SHAPE: Record<OntologyEntityKind, NodeShapeOptions> = {
      company:  { kind: 'rect', width: 130, height: 42, cornerRadius: 8 },
      person:   { kind: 'circle', radius: 26 },
      product:  { kind: 'rect', width: 120, height: 36, cornerRadius: 18 },
      location: { kind: 'regular-polygon', sides: 6, radius: 28, rotation: 0 },
      industry: { kind: 'rect', width: 110, height: 36, cornerRadius: 4 },
    };

    const settings = {
      layout: 'force' as 'force' | 'radial',
      showEdgeLabels: true,
      includeCompany: true,
      includePerson: true,
      includeProduct: true,
      includeLocation: true,
      includeIndustry: true,
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#usecase-ontology')!;
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

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          state: {
            highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
            selected:    { bgStrokeColor: 0xffffff, bgStrokeWidth: 4 },
          },
        },
        edge: {
          state: {
            highlighted: { strokeColor: 0xfbbf24, strokeWidth: 2.2, strokeAlpha: 1, arrowTargetColor: 0xfbbf24 },
          },
        },
      },
    });
    canvas.layers.add(graph);

    // ── Behaviours ──────────────────────────────────────────────────────
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );
    canvas.behaviours.register(
      new HoverActivateBehaviour({
        id: 'hover', layerId: 'graph', enabled: true,
        state: 'highlighted', inactiveState: 'dimmed',
        degree: 1, direction: 'both',
      }),
    );
    // Track click timestamps per id so a second click on the same node
    // within 350ms expands its neighbourhood. Avoids reaching into the
    // private renderer for `shape:doubleclick`.
    let lastClick: { id: string; t: number } | null = null;
    canvas.behaviours.register(
      new ClickSelectBehaviour({
        id: 'select', layerId: 'graph', enabled: true,
        multiple: true, trigger: ['shift'],
        onSelect: (el) => {
          const now = Date.now();
          if (lastClick && lastClick.id === el.id && now - lastClick.t < 350) {
            expandNeighbours(el.id);
            lastClick = null;
          } else {
            lastClick = { id: el.id, t: now };
          }
        },
      }),
    );

    // ── Projection helpers (kept inside play for the code tab) ──────────
    const buildNode = (n: typeof ontology.nodes[number]): NodeData<OntologyNodeData> => ({
      id: n.id,
      data: n.data,
      style: {
        shape: KIND_SHAPE[n.data.kind],
        bgFill: KIND_FILL[n.data.kind],
        bgStrokeColor: 0xffffff,
        bgStrokeWidth: 1.5,
        labelText: n.data.name,
        labelColor: 0xffffff,
        labelFontSize: n.data.kind === 'person' ? 10 : 11,
        labelFontWeight: 600,
        labelPlacement: 'center',
      },
    });

    const buildEdge = (e: typeof ontology.edges[number]): EdgeData<OntologyEdgeData> => ({
      id: e.id,
      source: e.source,
      target: e.target,
      data: e.data,
      style: {
        shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.45 } },
        strokeColor: 0x94a3b8,
        strokeWidth: 1.3,
        strokeAlpha: 0.7,
        arrowTargetShape: 'triangle',
        arrowTargetSize: 7,
        arrowTargetColor: 0x94a3b8,
        ...(settings.showEdgeLabels
          ? {
              labelText: e.data.kind.replace(/_/g, ' '),
              labelColor: 0x64748b,
              labelFontSize: 9,
              labelBackgroundFill: 0xffffff,
              labelBackgroundAlpha: 0.85,
              labelBackgroundPadding: 2,
              labelBackgroundCornerRadius: 3,
            }
          : {}),
      },
    });

    const includesKind = (k: OntologyEntityKind): boolean => {
      switch (k) {
        case 'company':  return settings.includeCompany;
        case 'person':   return settings.includePerson;
        case 'product':  return settings.includeProduct;
        case 'location': return settings.includeLocation;
        case 'industry': return settings.includeIndustry;
      }
    };

    /** Set of node ids currently exposed to the graph (ignores filter). */
    const exposedIds = new Set<string>(ontology.coreIds);

    /** Push the current (exposedIds ∩ filter) into the graph. */
    const apply = (): void => {
      const inGraph = ontology.nodes.filter(
        (n) => exposedIds.has(n.id) && includesKind(n.data.kind),
      );
      const idSet = new Set(inGraph.map((n) => n.id));
      const ins = ontology.edges.filter(
        (e) => idSet.has(e.source) && idSet.has(e.target),
      );
      graph.setData({
        nodes: inGraph.map(buildNode),
        edges: ins.map(buildEdge),
      });
    };
    apply();

    // ── Layout ──────────────────────────────────────────────────────────
    let layout: D3ForceLayout | ElkLayout | null = null;

    const runLayout = async (): Promise<void> => {
      layout?.stop();
      if (settings.layout === 'force') {
        layout = new D3ForceLayout({
          link: { distance: 110 },
          charge: { strength: -260 },
          collide: { radius: 32 },
          center: { x: 0, y: 0 },
        });
      } else {
        layout = new ElkLayout({
          algorithm: 'radial',
          nodeSpacing: 40,
        });
      }
      layout.events.on('end', ({ reason }) => {
        if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
      });
      await layout.apply(graph);
    };
    void runLayout();

    // Pull every 1-hop neighbour of `seedId` out of the FULL dataset and
    // expose any that aren't already in the graph; rerun the layout so
    // newcomers find their place instead of piling at the origin.
    function expandNeighbours(seedId: string): void {
      const before = exposedIds.size;
      for (const e of ontology.edges) {
        if (e.source === seedId) exposedIds.add(e.target);
        if (e.target === seedId) exposedIds.add(e.source);
      }
      if (exposedIds.size !== before) {
        apply();
        void runLayout();
      }
    }

    // ── GUI ─────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Knowledge Graph Explorer' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => layout?.stop());

    gui
      .add(settings, 'layout', ['force', 'radial'])
      .name('layout')
      .onChange(() => void runLayout());

    gui
      .add(settings, 'showEdgeLabels')
      .name('show edge labels')
      .onChange(apply);

    const filterFolder = gui.addFolder('Entity types');
    filterFolder.add(settings, 'includeCompany').name('Company').onChange(() => { apply(); void runLayout(); });
    filterFolder.add(settings, 'includePerson').name('Person').onChange(() => { apply(); void runLayout(); });
    filterFolder.add(settings, 'includeProduct').name('Product').onChange(() => { apply(); void runLayout(); });
    filterFolder.add(settings, 'includeLocation').name('Location').onChange(() => { apply(); void runLayout(); });
    filterFolder.add(settings, 'includeIndustry').name('Industry').onChange(() => { apply(); void runLayout(); });

    gui
      .add(
        {
          collapse: () => {
            exposedIds.clear();
            for (const id of ontology.coreIds) exposedIds.add(id);
            apply();
            void runLayout();
          },
        },
        'collapse',
      )
      .name('Reset to core');
    gui
      .add(
        {
          expandAll: () => {
            for (const n of ontology.nodes) exposedIds.add(n.id);
            apply();
            void runLayout();
          },
        },
        'expandAll',
      )
      .name('Expand all');

    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
