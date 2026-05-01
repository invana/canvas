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
// Fan layout — 1 source → 5 targets, each edge in a different state style.

const FAN_NODES: INodeData[] = [
  { id: 'src', x:    0, y:  -40, shape: 'circle', size: 36 },
  { id: 't0',  x: -290, y: -230, shape: 'circle', size: 32 },
  { id: 't1',  x:  210, y: -260, shape: 'circle', size: 32 },
  { id: 't2',  x:  300, y:    0, shape: 'circle', size: 32 },
  { id: 't3',  x:  150, y:  240, shape: 'circle', size: 32 },
  { id: 't4',  x: -270, y:  150, shape: 'circle', size: 32 },
];

const FAN_STATES = [
  { target: 't0', label: 'line-default',   style: { stroke: '#9ca3af', strokeWidth: 1.5 } },
  { target: 't1', label: 'line-active',    style: { stroke: '#059669', strokeWidth: 3   } },
  { target: 't2', label: 'line-highlight', style: { stroke: '#d97706', strokeWidth: 3   } },
  { target: 't3', label: 'line-selected',  style: { stroke: '#7c3aed', strokeWidth: 4   } },
  { target: 't4', label: 'line-inactive',  style: { stroke: '#9ca3af', strokeWidth: 1.5, strokeAlpha: 0.4 } },
];

function fanEdges(pathType: IEdgeData['pathType']): IEdgeData[] {
  return FAN_STATES.map((s, i) => ({
    id: `e-${i}`,
    source: 'src',
    target: s.target,
    pathType,
    label: s.label,
    endMarker: { type: 'triangle', size: 9 } as ArrowSpec,
    style: s.style,
  }));
}

export const Bezier: Story = {
  name: 'Bezier',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;
    await initGraph(container, FAN_NODES, fanEdges('bezier'), 80);
  },
};

// ── Cubic ────────────────────────────────────────────────────────────────────
// Alias of Bezier — shares the same connector class. Fan layout + GUI exposes
// the geometry options (`curvePosition`, `curveOffset`) applied uniformly to
// all five fan edges.

export const Cubic: Story = {
  name: 'Cubic',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;
    const graph = await initGraph(container, FAN_NODES, fanEdges('cubic'), 80);

    // Defaults match BezierConnector's class defaults.
    const p = { t1: 0.25, t2: 0.25, o1: 20, o2: 20 };

    const applyCurve = () => {
      for (let i = 0; i < FAN_STATES.length; i++) {
        graph.updateEdge(`e-${i}`, {
          curvePosition: [p.t1, p.t2],
          curveOffset:   [p.o1, p.o2],
        });
      }
    };

    const gui = new GUI({ title: 'Cubic', container });
    guiPosition(gui);

    const cp = gui.addFolder('curvePosition');
    cp.add(p, 't1', 0, 1, 0.05).name('t1 (cp1 from src)').onChange(applyCurve);
    cp.add(p, 't2', 0, 1, 0.05).name('t2 (cp2 from tgt)').onChange(applyCurve);

    const co = gui.addFolder('curveOffset');
    co.add(p, 'o1', -100, 100, 1).name('o1 (cp1 offset)').onChange(applyCurve);
    co.add(p, 'o2', -100, 100, 1).name('o2 (cp2 offset)').onChange(applyCurve);
  },
};

// ── Cubic Horizontal ─────────────────────────────────────────────────────────
// Axis-locked along x. Source on the left, 5 targets fanning to the right —
// each curve exits/enters horizontally regardless of vertical offset.
// GUI exposes `curvePosition` / `curveOffset` tuples.

export const CubicHorizontal: Story = {
  name: 'Cubic Horizontal',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'src', x: -300, y:    0, shape: 'circle', size: 36 },
      { id: 't0',  x:  300, y: -240, shape: 'circle', size: 32 },
      { id: 't1',  x:  300, y: -120, shape: 'circle', size: 32 },
      { id: 't2',  x:  300, y:    0, shape: 'circle', size: 32 },
      { id: 't3',  x:  300, y:  120, shape: 'circle', size: 32 },
      { id: 't4',  x:  300, y:  240, shape: 'circle', size: 32 },
    ];
    const graph = await initGraph(container, nodes, fanEdges('cubic-horizontal'), 80);

    // Defaults match CubicHorizontalConnector's class defaults.
    const p = { t1: 0.5, t2: 0.5, o1: 0, o2: 0 };

    const applyCurve = () => {
      for (let i = 0; i < FAN_STATES.length; i++) {
        graph.updateEdge(`e-${i}`, {
          curvePosition: [p.t1, p.t2],
          curveOffset:   [p.o1, p.o2],
        });
      }
    };

    const gui = new GUI({ title: 'Cubic Horizontal', container });
    guiPosition(gui);

    const cp = gui.addFolder('curvePosition');
    cp.add(p, 't1', 0, 1, 0.05).name('t1 (cp1 along x)').onChange(applyCurve);
    cp.add(p, 't2', 0, 1, 0.05).name('t2 (cp2 along x)').onChange(applyCurve);

    const co = gui.addFolder('curveOffset');
    co.add(p, 'o1', -200, 200, 1).name('o1 (cp1 y offset)').onChange(applyCurve);
    co.add(p, 'o2', -200, 200, 1).name('o2 (cp2 y offset)').onChange(applyCurve);
  },
};

// ── Cubic Vertical ───────────────────────────────────────────────────────────
// Axis-locked along y. Source on top, 5 targets fanning below — each curve
// exits/enters vertically regardless of horizontal offset.
// GUI exposes `curvePosition` / `curveOffset` tuples.

export const CubicVertical: Story = {
  name: 'Cubic Vertical',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes: INodeData[] = [
      { id: 'src', x:    0, y: -240, shape: 'circle', size: 36 },
      { id: 't0',  x: -280, y:  220, shape: 'circle', size: 32 },
      { id: 't1',  x: -140, y:  220, shape: 'circle', size: 32 },
      { id: 't2',  x:    0, y:  220, shape: 'circle', size: 32 },
      { id: 't3',  x:  140, y:  220, shape: 'circle', size: 32 },
      { id: 't4',  x:  280, y:  220, shape: 'circle', size: 32 },
    ];
    const graph = await initGraph(container, nodes, fanEdges('cubic-vertical'), 80);

    // Defaults match CubicVerticalConnector's class defaults.
    const p = { t1: 0.5, t2: 0.5, o1: 0, o2: 0 };

    const applyCurve = () => {
      for (let i = 0; i < FAN_STATES.length; i++) {
        graph.updateEdge(`e-${i}`, {
          curvePosition: [p.t1, p.t2],
          curveOffset:   [p.o1, p.o2],
        });
      }
    };

    const gui = new GUI({ title: 'Cubic Vertical', container });
    guiPosition(gui);

    const cp = gui.addFolder('curvePosition');
    cp.add(p, 't1', 0, 1, 0.05).name('t1 (cp1 along y)').onChange(applyCurve);
    cp.add(p, 't2', 0, 1, 0.05).name('t2 (cp2 along y)').onChange(applyCurve);

    const co = gui.addFolder('curveOffset');
    co.add(p, 'o1', -200, 200, 1).name('o1 (cp1 x offset)').onChange(applyCurve);
    co.add(p, 'o2', -200, 200, 1).name('o2 (cp2 x offset)').onChange(applyCurve);
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
// Fan layout — 1 source → 5 targets, each edge in a different state style.
// GUI exposes scalar `curvePosition` / `curveOffset` (single CP).

export const Quadratic: Story = {
  name: 'Quadratic',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;
    const graph = await initGraph(container, FAN_NODES, fanEdges('quadratic'), 80);

    // Defaults match QuadraticConnector's class defaults.
    const p = { t: 0.5, offset: 30 };

    const applyCurve = () => {
      for (let i = 0; i < FAN_STATES.length; i++) {
        graph.updateEdge(`e-${i}`, {
          curvePosition: p.t,
          curveOffset:   p.offset,
        });
      }
    };

    const gui = new GUI({ title: 'Quadratic', container });
    guiPosition(gui);

    gui.add(p, 't', 0, 1, 0.05).name('curvePosition').onChange(applyCurve);
    gui.add(p, 'offset', -150, 150, 1).name('curveOffset').onChange(applyCurve);
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
