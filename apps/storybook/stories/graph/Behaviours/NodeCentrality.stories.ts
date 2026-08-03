import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  NodeCentralityBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Behaviours/NodeCentrality' };
export default meta;
type Story = StoryObj;

export const NodeCentralityStory: Story = {
  name: 'NodeCentrality',
  render: () => createContainer({ id: 'graph-node-centrality' }),

  play: async ({ canvasElement }) => {
    // Hub-and-spoke graph hardcoded so the degree pattern is readable from
    // the story source. h1 has degree 9 (8 leaves + 1 inter-hub edge), h2
    // has degree 7, h3 has degree 5; leaves are degree 1.
    const nodes: GraphNode[] = [
      { id: 'h1' , type: 'node' },
      { id: 'h2' , type: 'node' },
      { id: 'h3' , type: 'node' },
      { id: 'l1', type: 'node' }, { id: 'l2', type: 'node' }, { id: 'l3', type: 'node' }, { id: 'l4', type: 'node' },
      { id: 'l5', type: 'node' }, { id: 'l6', type: 'node' }, { id: 'l7', type: 'node' }, { id: 'l8', type: 'node' },
      { id: 'l9', type: 'node' }, { id: 'l10', type: 'node' }, { id: 'l11', type: 'node' }, { id: 'l12', type: 'node' }, { id: 'l13', type: 'node' },
      { id: 'l14', type: 'node' }, { id: 'l15', type: 'node' }, { id: 'l16', type: 'node' }, { id: 'l17', type: 'node' },
    ];
    const edges = [
      // h1 spokes (out from h1 → degree 8 out, 0 in)
      { id: 'e1', type: 'edge',  source: 'h1', target: 'l1' },
      { id: 'e2', type: 'edge',  source: 'h1', target: 'l2' },
      { id: 'e3', type: 'edge',  source: 'h1', target: 'l3' },
      { id: 'e4', type: 'edge',  source: 'h1', target: 'l4' },
      { id: 'e5', type: 'edge',  source: 'h1', target: 'l5' },
      { id: 'e6', type: 'edge',  source: 'h1', target: 'l6' },
      { id: 'e7', type: 'edge',  source: 'h1', target: 'l7' },
      { id: 'e8', type: 'edge',  source: 'h1', target: 'l8' },
      // h2 spokes (in to h2 → degree 5 in)
      { id: 'e9', type: 'edge',  source: 'l9',  target: 'h2' },
      { id: 'e10', type: 'edge', source: 'l10', target: 'h2' },
      { id: 'e11', type: 'edge', source: 'l11', target: 'h2' },
      { id: 'e12', type: 'edge', source: 'l12', target: 'h2' },
      { id: 'e13', type: 'edge', source: 'l13', target: 'h2' },
      // h3 spokes (mixed — l14/l15 in, l16/l17 out → degree 4)
      { id: 'e14', type: 'edge', source: 'l14', target: 'h3' },
      { id: 'e15', type: 'edge', source: 'l15', target: 'h3' },
      { id: 'e16', type: 'edge', source: 'h3',  target: 'l16' },
      { id: 'e17', type: 'edge', source: 'h3',  target: 'l17' },
      // Inter-hub bridges
      { id: 'e18', type: 'edge', source: 'h1', target: 'h2' },
      { id: 'e19', type: 'edge', source: 'h2', target: 'h3' },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-centrality')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Layer template carries the shared circle + paint. Per-node entries
    // intentionally omit `shape` / `size`: NodeCentralityBehaviour writes
    // `style.size`, which `resolveNodeStyle` then folds into the layer-level
    // circle's `radius` before any consumer reads it. The `labelText` resolver
    // stays in the constructor; the literal paint moves into config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        node: {
          style: {
            labelText: (n) => n.id,
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));

    const nodeCentrality = new NodeCentralityBehaviour({ id: 'node-centrality', targetLayerId: 'graph' });
    canvas.behaviours.register(nodeCentrality);

    // D3 force layout — `collide.radius` callback reads the resolved
    // `style.shape.radius` per node, which `resolveNodeStyle` rewrites from
    // `style.size`. So when the behaviour bumps a hub's size, D3 collide
    // automatically gives that hub more room.
    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 8 },
              bgFill: 0x3b82f6,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 1.5,
              labelColor: 0x1f2937,
              labelFontSize: 11,
              labelPlacement: 'bottom',
              labelOffsetY: 4,
            },
          },
          edge: {
            style: { strokeColor: 0xcbd5e1, strokeWidth: 1, arrowTargetShape: 'none' },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        'node-centrality': {
          enabled: true,
          direction: 'both',
          minSize: 6,
          maxSize: 36,
          scale: 'sqrt',
        },
      },
      layouts: {
        force: {
          charge: { strength: -240 },
          link: { distance: 70 },
          collide: {
            radius: (node: GraphNode) => {
              // `resolveNodeStyle` folds `style.size` into the circle's
              // `radius`, so reading it here picks up the behaviour's writes.
              const style = graph.resolveNodeStyle(node);
              const shape = style.shape as { kind: string; radius?: number } | undefined;
              if (shape?.kind === 'circle' && typeof shape.radius === 'number') {
                return shape.radius + 4;
              }
              return 14;
            },
          },
          center: { x: 0, y: 0 },
        },
      },
      activeLayout: 'force',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const settings = {
      enabled: true,
      direction: 'both' as 'in' | 'out' | 'both',
      minSize: 6,
      maxSize: 36,
      scale: 'sqrt' as 'linear' | 'sqrt' | 'log',
      reRunLayout: () => void canvas.runLayout('force'),
    };
    const apply = (): void => {
      if (settings.enabled) nodeCentrality.enable();
      else nodeCentrality.disable();
      canvas.update({
        behaviours: {
          'node-centrality': {
            direction: settings.direction,
            minSize: settings.minSize,
            maxSize: settings.maxSize,
            scale: settings.scale,
          },
        },
      });
      // Sizes changed → re-run the layout so collision radii catch up.
      void canvas.runLayout('force');
    };

    const gui = new GUI({ title: 'Node Centrality' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'enabled').onChange(apply);
    gui.add(settings, 'direction', ['in', 'out', 'both']).onChange(apply);
    gui.add(settings, 'minSize', 2, 30, 1).onChange(apply);
    gui.add(settings, 'maxSize', 8, 80, 1).onChange(apply);
    gui.add(settings, 'scale', ['linear', 'sqrt', 'log']).onChange(apply);
    gui.add(settings, 'reRunLayout').name('re-run layout');
  },
};
