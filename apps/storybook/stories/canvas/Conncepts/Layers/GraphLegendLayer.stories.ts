import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ColorByBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  GraphLegendLayer,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Layers/GraphLegendLayer' };
export default meta;
type Story = StoryObj;

// One story per file: the export is `<Subject>Story` (the bare `GraphLegendLayer`
// would collide with the imported class) and `name` matches the title's last
// segment, so the sidebar shows a single `GraphLegendLayer` leaf rather than a
// component node wrapping one child.
export const GraphLegendLayerStory: Story = {
  name: 'GraphLegendLayer',
  render: () => createContainer({ id: 'cvs-graph-legend-layer' }),

  play: async ({ canvasElement }) => {
    // Four node types and four edge types — the legend keys on `type`, so the
    // per-item data only carries the type, the label, and (for KNOWS) the dash
    // that the legend's edge swatch mirrors. Colours are NOT set here: the
    // `ColorByBehaviour` below assigns one per type, and the legend reads
    // whatever ends up on screen.
    const nodes: GraphNode[] = [
      { id: 'p1', type: 'Person', style: { labelText: 'Ada' } },
      { id: 'p2', type: 'Person', style: { labelText: 'Grace' } },
      { id: 'p3', type: 'Person', style: { labelText: 'Alan' } },
      { id: 'p4', type: 'Person', style: { labelText: 'Katherine' } },
      { id: 'p5', type: 'Person', style: { labelText: 'Linus' } },
      { id: 'c1', type: 'Company', style: { labelText: 'Analytical Ltd' } },
      { id: 'c2', type: 'Company', style: { labelText: 'Bletchley Co' } },
      { id: 'c3', type: 'Company', style: { labelText: 'Langley Labs' } },
      { id: 'j1', type: 'Project', style: { labelText: 'Difference Engine' } },
      { id: 'j2', type: 'Project', style: { labelText: 'COBOL' } },
      { id: 'j3', type: 'Project', style: { labelText: 'Bombe' } },
      { id: 'j4', type: 'Project', style: { labelText: 'Orbit Maths' } },
      { id: 'g1', type: 'City', style: { labelText: 'London' } },
      { id: 'g2', type: 'City', style: { labelText: 'Hampton' } },
    ];

    const edges: GraphEdge[] = [
      { id: 'e1', source: 'p1', target: 'c1', type: 'WORKS_AT' },
      { id: 'e2', source: 'p2', target: 'c3', type: 'WORKS_AT' },
      { id: 'e3', source: 'p3', target: 'c2', type: 'WORKS_AT' },
      { id: 'e4', source: 'p4', target: 'c3', type: 'WORKS_AT' },
      { id: 'e5', source: 'p5', target: 'c1', type: 'WORKS_AT' },
      { id: 'e6', source: 'p1', target: 'j1', type: 'CONTRIBUTES_TO' },
      { id: 'e7', source: 'p2', target: 'j2', type: 'CONTRIBUTES_TO' },
      { id: 'e8', source: 'p3', target: 'j3', type: 'CONTRIBUTES_TO' },
      { id: 'e9', source: 'p4', target: 'j4', type: 'CONTRIBUTES_TO' },
      { id: 'e10', source: 'c1', target: 'g1', type: 'LOCATED_IN' },
      { id: 'e11', source: 'c2', target: 'g2', type: 'LOCATED_IN' },
      { id: 'e12', source: 'c3', target: 'g1', type: 'LOCATED_IN' },
      // Dashed per-item → the legend's KNOWS swatch draws a dashed line.
      { id: 'e13', source: 'p1', target: 'p3', type: 'KNOWS', style: { strokeDashArray: [6, 4] } },
      { id: 'e14', source: 'p2', target: 'p4', type: 'KNOWS', style: { strokeDashArray: [6, 4] } },
    ];

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-graph-legend-layer')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    // `graphLayerId` is cross-layer wiring → constructor; every visual option
    // lives in the serialisable config below.
    const legend = new GraphLegendLayer({ id: 'legend', options: { graphLayerId: 'graph' } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.layers.add(legend);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    // Colour-by-type. The legend resolves each type's swatch from a representative
    // element's *effective* style, so these palette colours show up in the legend
    // with no extra wiring — this is the pairing the legend is designed for.
    canvas.behaviours.register(new ColorByBehaviour({ id: 'color', targetLayerId: 'graph' }));
    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        bg: { type: 'pattern', patternType: 'dots', backgroundColor: '#0f172a', color: '#334155' },
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 11 },
              bgStrokeColor: 0x0f172a,
              bgStrokeWidth: 1.5,
              labelColor: 0xe2e8f0,
              labelFontSize: 10,
              labelPlacement: 'bottom',
              labelOffsetY: 4
            }
          },
          edge: { style: { strokeWidth: 1.5, arrowTargetShape: 'triangle', arrowTargetSize: 7 } }
        },
        // Every option from GraphLegendLayerOptions exposed here.
        legend: {
          title: 'Legend',
          showNodes: true,
          showEdges: true,
          nodesTitle: 'Nodes',
          edgesTitle: 'Edges',
          showCounts: true,
          countMode: 'both',
          sort: 'count-desc',
          maxRows: 12,
          hideEmpty: false,
          // Rows are clickable: click a type to hide it (struck through + muted),
          // click again to bring it back.
          toggleOnClick: true,
          hiddenTypeOpacity: 0.45,
          position: 'top-left',
          margin: 10,
          fontSize: 11,
          opacity: 0.95,
          swatchSize: 10,
          borderRadius: 6,
          mode: 'dark'
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        color: { enabled: true }
      },
      layouts: {
        force: { charge: { strength: -240 }, link: { distance: 70 }, collide: { radius: 22 } }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // The active 'force' layout auto-runs on mount; frame the scene once it settles.
    onStoryTeardown(forceLayout.events.on('end', () => canvas.fitView(80)));

    // GUI binds straight to the config and pushes each change live via update().
    const lg = canvasOptions.layers.legend;
    const push = (patch: Record<string, unknown>): void =>
      canvas.update({ layers: { legend: patch } });

    const gui = new GUI({ title: 'Legend' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(lg, 'position', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange((v: string) => push({ position: v }));
    gui.add(lg, 'title').onChange((v: string) => push({ title: v }));
    gui.add(lg, 'showNodes').onChange((v: boolean) => push({ showNodes: v }));
    gui.add(lg, 'showEdges').onChange((v: boolean) => push({ showEdges: v }));
    gui.add(lg, 'showCounts').onChange((v: boolean) => push({ showCounts: v }));
    gui
      .add(lg, 'countMode', ['both', 'visible', 'total'])
      .onChange((v: string) => push({ countMode: v }));
    gui
      .add(lg, 'sort', ['count-desc', 'name-asc', 'insertion'])
      .onChange((v: string) => push({ sort: v }));
    gui.add(lg, 'maxRows', 0, 12, 1).onChange((v: number) => push({ maxRows: v }));
    gui.add(lg, 'hideEmpty').onChange((v: boolean) => push({ hideEmpty: v }));
    gui.add(lg, 'toggleOnClick').onChange((v: boolean) => push({ toggleOnClick: v }));
    gui
      .add(lg, 'hiddenTypeOpacity', 0.1, 1, 0.05)
      .onChange((v: number) => push({ hiddenTypeOpacity: v }));
    const chrome = gui.addFolder('Chrome');
    chrome.add(lg, 'fontSize', 8, 20, 1).onChange((v: number) => push({ fontSize: v }));
    chrome.add(lg, 'swatchSize', 4, 24, 1).onChange((v: number) => push({ swatchSize: v }));
    chrome.add(lg, 'opacity', 0.2, 1, 0.05).onChange((v: number) => push({ opacity: v }));
    chrome.add(lg, 'borderRadius', 0, 20, 1).onChange((v: number) => push({ borderRadius: v }));
    chrome.add(lg, 'margin', 0, 60, 2).onChange((v: number) => push({ margin: v }));
    chrome.add(lg, 'mode', ['auto', 'light', 'dark']).onChange((v: string) => push({ mode: v }));

    // The same toggle a row click performs, driven programmatically — a host
    // toolbar or a saved filter shares the legend's state through this API.
    // Watch the counts split into `visible / total` as a type goes away.
    const filters = { Person: false, Company: false, Project: false, City: false };
    const filterFolder = gui.addFolder('Hide node type');
    const controllers = Object.fromEntries(
      (['Person', 'Company', 'Project', 'City'] as const).map((type) => [
        type,
        filterFolder
          .add(filters, type)
          .onChange((hide: boolean) => legend.setTypeHidden('node', type, hide)),
      ]),
    );

    // …and the reverse direction: a row click emits `type:visibility`, so the
    // checkboxes stay in sync with whatever the legend itself did.
    onStoryTeardown(
      legend.events.on('type:visibility', ({ kind, type, hidden }) => {
        if (kind !== 'node') return;
        filters[type as keyof typeof filters] = hidden;
        controllers[type]?.updateDisplay();
      }),
    );
  }
};
