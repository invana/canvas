import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, type IEdgeData, type INodeData } from '@invana/plugins-graph-data';
import { type ArrowSpec } from '@invana/plugins-shapes';
import { createContainer } from '../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Edges/Connectors' };
export default meta;
type Story = StoryObj;

const MARKER_TYPES = [
  'triangle', 'triangle-outline', 'diamond', 'diamond-outline',
  'circle', 'circle-outline', 'circle-plus', 'square', 'square-outline',
  'block', 'classic', 'ellipse', 'cross', 'async', 'none',
];

const LOOP_PLACEMENTS = [
  'top', 'right', 'bottom', 'left',
  'top-right', 'bottom-right', 'bottom-left', 'top-left',
];

async function initGraph(
  container: HTMLElement,
  nodes: INodeData[],
  edges: IEdgeData[],
  fitPadding = 100,
) {
  const canvas = new Canvas({
    container,
    backgroundColor: '#0f172a',
    plugins: [
      {
        plugin: 'background',
        key: 'bg',
        options: {
          type: 'pattern',
          patternType: 'dots',
          color: '#1e293b',
          backgroundColor: '#0f172a',
          size: 1.2,
          spacing: 28,
        },
      },
      {
        plugin: 'graph-data',
        key: 'graph',
        options: {
          fitOnRender: true,
          fitPadding,
          data: { nodes, edges },
          styles: { node: { fill: '#1e293b', stroke: '#475569', strokeWidth: 1.5 } },
        },
      },
    ],
  });
  await canvas.init();
  return canvas.plugins.get<GraphDataPlugin>('graph')!;
}

function guiPosition(gui: GUI) {
  gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;';
}

// ── Straight ──────────────────────────────────────────────────────────────────

export const Straight: Story = {
  name: 'Straight',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'a', x: -230, y: 0, shape: 'circle', size: 44 },
      { id: 'b', x:  230, y: 0, shape: 'circle', size: 44 },
    ];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'a', target: 'b',
      pathType: 'straight',
      startMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      endMarker:   { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#4fc3f7', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges);

    const p = {
      stroke: '#4fc3f7',
      strokeWidth: 2.5,
      startType: 'triangle',
      startSize: 12,
      endType: 'triangle',
      endSize: 12,
      sourceOffset: 0,
      targetOffset: 0,
    };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => graph.updateEdge('e', {
      startMarker: { type: p.startType, size: p.startSize } as ArrowSpec,
      endMarker:   { type: p.endType,   size: p.endSize   } as ArrowSpec,
    });
    const applyOffsets = () => graph.updateEdge('e', {
      sourceOffset: p.sourceOffset,
      targetOffset: p.targetOffset,
    });

    const gui = new GUI({ title: 'Straight', container });
    guiPosition(gui);

    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);

    const sm = gui.addFolder('Start marker');
    sm.add(p, 'startType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    sm.add(p, 'startSize', 6, 32, 1).name('Size').onChange(applyMarkers);

    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);

    const off = gui.addFolder('Offsets');
    off.add(p, 'sourceOffset', 0, 40, 1).name('Source offset').onChange(applyOffsets);
    off.add(p, 'targetOffset', 0, 40, 1).name('Target offset').onChange(applyOffsets);
  },
};

// ── Bezier ───────────────────────────────────────────────────────────────────

export const Bezier: Story = {
  name: 'Bezier',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'a', x: -220, y: -100, shape: 'ellipse', size: 44 },
      { id: 'b', x:  220, y:  100, shape: 'ellipse', size: 44 },
    ];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'a', target: 'b',
      pathType: 'bezier',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#81c784', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#81c784', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Bezier', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Orthogonal ───────────────────────────────────────────────────────────────

export const Orthogonal: Story = {
  name: 'Orthogonal',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'a', x: -220, y: -110, shape: 'rect', size: 44 },
      { id: 'b', x:  220, y:  110, shape: 'rect', size: 44 },
    ];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'a', target: 'b',
      pathType: 'orthogonal',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#ffb74d', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#ffb74d', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Orthogonal', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Quadratic ────────────────────────────────────────────────────────────────

export const Quadratic: Story = {
  name: 'Quadratic',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'a', x: -220, y: -90, shape: 'diamond', size: 44 },
      { id: 'b', x:  220, y:  90, shape: 'diamond', size: 44 },
    ];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'a', target: 'b',
      pathType: 'quadratic',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#f06292', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#f06292', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Quadratic', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Rounded ──────────────────────────────────────────────────────────────────

export const Rounded: Story = {
  name: 'Rounded',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'a', x: -220, y: -110, shape: 'hexagon', size: 44 },
      { id: 'b', x:  220, y:  110, shape: 'hexagon', size: 44 },
    ];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'a', target: 'b',
      pathType: 'rounded',
      router: 'orth',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#ce93d8', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges);

    const p = {
      stroke: '#ce93d8',
      strokeWidth: 2.5,
      router: 'orth',
      endType: 'triangle',
      endSize: 12,
    };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyRouter  = () => graph.updateEdge('e', { router: p.router as IEdgeData['router'] });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Rounded', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    gui.add(p, 'router', ['normal', 'orth', 'oneSide', 'er']).name('Router').onChange(applyRouter);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Smooth ───────────────────────────────────────────────────────────────────

export const Smooth: Story = {
  name: 'Smooth',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'a', x: -240, y:   0, shape: 'star', size: 44 },
      { id: 'b', x:  240, y:   0, shape: 'star', size: 44 },
    ];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'a', target: 'b',
      pathType: 'smooth',
      vertices: [{ x: -80, y: -100 }, { x: 80, y: 100 }],
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#4dd0e1', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#4dd0e1', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Smooth (Catmull-Rom)', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Loop Curve ───────────────────────────────────────────────────────────────

export const LoopCurve: Story = {
  name: 'Loop Curve',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [{ id: 'n', x: 0, y: 0, shape: 'rect', size: 64 }];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'n', target: 'n',
      pathType: 'loop-curve',
      placement: 'top',
      loopSize: 70,
      loopSpreadAngle: 0.6,
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#fb923c', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges, 140);

    const p = {
      stroke: '#fb923c',
      strokeWidth: 2.5,
      placement: 'top',
      loopSize: 70,
      loopSpreadAngle: 0.6,
      endType: 'triangle',
      endSize: 12,
    };

    const applyStroke = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyLoop   = () => graph.updateEdge('e', {
      placement: p.placement as IEdgeData['placement'],
      loopSize: p.loopSize,
      loopSpreadAngle: p.loopSpreadAngle,
    });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Loop Curve', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);

    const lf = gui.addFolder('Loop');
    lf.add(p, 'placement', LOOP_PLACEMENTS).name('Placement').onChange(applyLoop);
    lf.add(p, 'loopSize', 20, 160, 5).name('Loop size').onChange(applyLoop);
    lf.add(p, 'loopSpreadAngle', 0.1, 1.5, 0.05).name('Spread angle (rad)').onChange(applyLoop);

    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Loop Polyline ─────────────────────────────────────────────────────────────

export const LoopPolyline: Story = {
  name: 'Loop Polyline',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [{ id: 'n', x: 0, y: 0, shape: 'rect', size: 64 }];
    const edges: IEdgeData[] = [{
      id: 'e', source: 'n', target: 'n',
      pathType: 'loop-polyline',
      placement: 'top',
      loopSize: 30,
      loopSpreadAngle: 0.4,
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#a3e635', strokeWidth: 2.5 },
    }];

    const graph = await initGraph(container, nodes, edges, 120);

    const p = {
      stroke: '#a3e635',
      strokeWidth: 2.5,
      placement: 'top',
      loopSize: 30,
      loopSpreadAngle: 0.4,
      endType: 'triangle',
      endSize: 12,
    };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyLoop    = () => graph.updateEdge('e', {
      placement: p.placement as IEdgeData['placement'],
      loopSize: p.loopSize,
      loopSpreadAngle: p.loopSpreadAngle,
    });
    const applyMarkers = () => graph.updateEdge('e', { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec });

    const gui = new GUI({ title: 'Loop Polyline', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);

    const lf = gui.addFolder('Loop');
    lf.add(p, 'placement', LOOP_PLACEMENTS).name('Placement').onChange(applyLoop);
    lf.add(p, 'loopSize', 10, 80, 5).name('Loop size').onChange(applyLoop);
    lf.add(p, 'loopSpreadAngle', 0.1, 1.5, 0.05).name('Spread angle (rad)').onChange(applyLoop);

    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};
