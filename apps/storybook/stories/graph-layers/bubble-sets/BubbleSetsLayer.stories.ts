/**
 * `BubbleSetsLayer` — smooth, organic contours around named groups of nodes.
 *
 * Each set is `{ id, members[], edges?[], style?, label? }`. The layer reads
 * node positions from the source `GraphLayer`, enclosing the listed members
 * (and selected edges) while routing the contour around every other node.
 * Per-frame live-drag recompute is opt-in via `recompute: 'manual'` + a
 * call from a drag behaviour; defaults debounce recompute to 120 ms on the
 * source layer's `data:changed` event.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DevInfoLayer,
  DragPanBehaviour,
  LayersPanelLayer,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { BubbleSetsLayer, type BubbleSet } from '@invana/graph-layer-bubble-sets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/bubble-sets/BubbleSetsLayer' };
export default meta;
type Story = StoryObj;

export const BubbleSetsLayer_Story: Story = {
  name: 'BubbleSetsLayer',
  render: () => createContainer({ id: 'graph-bubble-sets' }),

  play: async ({ canvasElement }) => {
    // Three colour families — fill/stroke per set drawn from these.
    const PURPLE = { fill: 0xb39ddb, stroke: 0x7e57c2 };
    const TEAL = { fill: 0x80deea, stroke: 0x00838f };
    const PINK = { fill: 0xf8bbd0, stroke: 0xc2185b };

    // Eight hand-placed nodes, hardcoded positions — the layout is not the
    // subject of this story, so no force simulation runs. Per the storybook
    // data convention, nodes are a literal array of plain objects.
    const nodes: NodeData[] = [
      { id: 'n0', position: { x:  140, y: -120 }, style: { bgFill: 0x7e57c2, labelText: 'node-0' } },
      { id: 'n1', position: { x:  160, y:   80 }, style: { bgFill: 0x7e57c2, labelText: 'node-1' } },
      { id: 'n2', position: { x:   20, y:  -40 }, style: { bgFill: 0x7e57c2, labelText: 'node-2' } },
      { id: 'n3', position: { x: -120, y:  -20 }, style: { bgFill: 0x7e57c2, labelText: 'node-3' } },
      { id: 'n4', position: { x: -240, y:  -60 }, style: { bgFill: 0xffb74d, labelText: 'node-4' } },
      { id: 'n5', position: { x: -160, y:  140 }, style: { bgFill: 0xffb74d, labelText: 'node-5' } },
      { id: 'n6', position: { x:  -60, y: -180 }, style: { bgFill: 0xffb74d, labelText: 'node-6' } },
      { id: 'n7', position: { x:  -40, y:  220 }, style: { bgFill: 0xec407a, labelText: 'node-7' } },
    ];

    const edges: EdgeData[] = [
      { id: 'e0-2', source: 'n0', target: 'n2' },
      { id: 'e1-2', source: 'n1', target: 'n2' },
      { id: 'e2-3', source: 'n2', target: 'n3' },
      { id: 'e3-4', source: 'n3', target: 'n4' },
      { id: 'e3-5', source: 'n3', target: 'n5' },
      { id: 'e3-6', source: 'n3', target: 'n6' },
      { id: 'e1-7', source: 'n1', target: 'n7' },
    ];

    const initialSets: BubbleSet[] = [
      {
        id: 'cluster-a',
        members: ['n0', 'n1', 'n2', 'n3'],
        edges: ['e0-2', 'e1-2', 'e2-3'],
        style: { fill: PURPLE.fill, fillOpacity: 0.35, stroke: PURPLE.stroke, strokeWidth: 1.5 },
        label: { text: 'cluster-a' },
      },
      {
        id: 'cluster-b',
        members: ['n4', 'n5', 'n6'],
        style: { fill: TEAL.fill, fillOpacity: 0.35, stroke: TEAL.stroke, strokeWidth: 1.5 },
        label: { text: 'cluster-b' },
      },
      {
        id: 'cluster-c',
        members: ['n1', 'n7'],
        edges: ['e1-7'],
        style: { fill: PINK.fill, fillOpacity: 0.35, stroke: PINK.stroke, strokeWidth: 1.5 },
        label: { text: 'cluster-c' },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-bubble-sets')!;
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
          backgroundColor: { light: '#f8fafc', dark: '#0f172a' },
          color: { light: '#94a3b8', dark: '#475569' },
          size: 1.5,
          spacing: 24,
          alpha: 0.85,
        },
      }),
    );
    canvas.layers.add(new DevInfoLayer({ id: 'dev-info', corner: 'bottom-left', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 18 },
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 2,
            labelColor: 0x334155,
            labelFontSize: 11,
            labelPlacement: 'bottom',
            labelOffsetY: 6,
          },
        },
        edge: { style: { strokeColor: 0xb0bec5, strokeWidth: 1 } },
      },
    });
    canvas.layers.add(graph);

    // BubbleSets overlay — added AFTER graph but at a lower zIndex so the
    // nodes and edges paint on top. The layer subscribes to `data:changed`
    // and recomputes automatically; live drags also call `recompute()`
    // below so the contours track in real time.
    const bubbles = new BubbleSetsLayer({
      id: 'bubble-sets',
      zIndex: -1,
      options: {
        graphLayerId: 'graph',
        sets: initialSets,
      },
    });
    canvas.layers.add(bubbles);

    canvas.layers.add(
      new LayersPanelLayer({
        corner: 'top-left',
        enabled: true,
        fontSize: 11,
        opacity: 0.92,
        backgroundColor: 'rgba(10,10,10,0.82)',
        textColor: '#c8d3e0',
        accentColor: '#4fc3f7',
      }),
    );

    graph.setData({ nodes, edges });

    // Live recompute during drag — overrides the default debounce, since the
    // dataset is tiny enough that O(n · grid²) is cheap.
    const dragBehaviour = new DragNodeBehaviour({
      id: 'drag-node',
      layerId: 'graph',
      enabled: true,
    });
    canvas.behaviours.register(dragBehaviour);
    graph.events.on('positions:updated', () => bubbles.recompute());

    canvas.camera.fitContent(graph.getBounds(), 120);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const settings = {
      visible: true,
      smoothness: 'chaikin' as 'chaikin' | 'bspline' | 'none',
      chaikinIterations: 4,
      pixelGroup: 4,
      nodeR0: 15,
      nodeR1: 50,
      edgeR0: 10,
      edgeR1: 20,
      morphBuffer: 10,
      'cluster-a': true,
      'cluster-b': true,
      'cluster-c': true,
    };

    const gui = new GUI({ title: 'BubbleSetsLayer' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'visible').name('Show layer').onChange((v: boolean) => {
      bubbles.visible = v;
    });

    const rebuild = (): void => {
      const o = bubbles.options as unknown as Record<string, unknown>;
      o.smoothness = settings.smoothness;
      o.chaikinIterations = settings.chaikinIterations;
      o.pixelGroup = settings.pixelGroup;
      o.nodeR0 = settings.nodeR0;
      o.nodeR1 = settings.nodeR1;
      o.edgeR0 = settings.edgeR0;
      o.edgeR1 = settings.edgeR1;
      o.morphBuffer = settings.morphBuffer;
      bubbles.recompute();
    };

    const algo = gui.addFolder('Algorithm');
    algo.add(settings, 'smoothness', ['chaikin', 'bspline', 'none']).onChange(rebuild);
    algo.add(settings, 'chaikinIterations', 1, 6, 1).onChange(rebuild);
    algo.add(settings, 'pixelGroup', [1, 2, 4, 8]).onChange(rebuild);
    algo.add(settings, 'nodeR0', 0, 60, 1).onChange(rebuild);
    algo.add(settings, 'nodeR1', 10, 150, 1).onChange(rebuild);
    algo.add(settings, 'edgeR0', 0, 40, 1).onChange(rebuild);
    algo.add(settings, 'edgeR1', 10, 80, 1).onChange(rebuild);
    algo.add(settings, 'morphBuffer', 0, 40, 1).onChange(rebuild);

    const visibility = gui.addFolder('Sets');
    const toggleSet = (id: 'cluster-a' | 'cluster-b' | 'cluster-c') => (v: boolean) => {
      const base = initialSets.find((s) => s.id === id)!;
      if (v) bubbles.addSet(base);
      else bubbles.removeSet(id);
    };
    visibility.add(settings, 'cluster-a').onChange(toggleSet('cluster-a'));
    visibility.add(settings, 'cluster-b').onChange(toggleSet('cluster-b'));
    visibility.add(settings, 'cluster-c').onChange(toggleSet('cluster-c'));

    gui.add({ recompute: () => bubbles.recompute() }, 'recompute').name('Recompute now');
    gui.add(
      { fit: () => canvas.camera.fitContent(graph.getBounds(), 120) },
      'fit',
    ).name('Fit to content');
  },
};
