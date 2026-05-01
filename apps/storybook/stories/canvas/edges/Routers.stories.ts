import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, type IEdgeData, type INodeData } from '@invana/plugins-graph-data';
import { type ArrowSpec } from '@invana/plugins-shapes';
import { createContainer } from '../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Edges/Routers' };
export default meta;
type Story = StoryObj;

const MARKER_TYPES = [
  'triangle', 'triangle-outline', 'diamond', 'diamond-outline',
  'circle', 'circle-outline', 'circle-plus', 'square', 'square-outline',
  'block', 'classic', 'ellipse', 'cross', 'async', 'none',
];

// Three node pairs at different diagonal angles — forces the router to make decisions.
// y-offsets of ±110 and 0 produce left-dipping, right-dipping, and horizontal connections.
function routerNodes(): INodeData[] {
  return [
    { id: 'a0', x: -240, y: -150, shape: 'circle', size: 44 },
    { id: 'b0', x:  240, y:  -40, shape: 'circle', size: 44 },
    { id: 'a1', x: -240, y:   30, shape: 'circle', size: 44 },
    { id: 'b1', x:  240, y:  140, shape: 'circle', size: 44 },
    { id: 'a2', x: -240, y:  190, shape: 'circle', size: 44 },
    { id: 'b2', x:  240, y:  300, shape: 'circle', size: 44 },
  ];
}

async function initGraph(
  container: HTMLElement,
  nodes: INodeData[],
  edges: IEdgeData[],
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
          patternType: 'grid',
          color: '#1e293b',
          backgroundColor: '#0f172a',
          size: 1,
          spacing: 40,
        },
      },
      {
        plugin: 'graph-data',
        key: 'graph',
        options: {
          fitOnRender: true,
          fitPadding: 80,
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

// ── Normal router ─────────────────────────────────────────────────────────────

export const NormalRouter: Story = {
  name: 'Normal',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes = routerNodes();
    const EDGE_IDS = ['e0', 'e1', 'e2'];
    const edges: IEdgeData[] = EDGE_IDS.map((id, i) => ({
      id,
      source: `a${i}`,
      target: `b${i}`,
      pathType: 'bezier',
      router: 'normal',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#c084fc', strokeWidth: 2.5 },
    }));

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#c084fc', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => EDGE_IDS.forEach(id =>
      graph.updateEdge(id, { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec }),
    );

    const gui = new GUI({ title: 'Normal router', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── Orth router ───────────────────────────────────────────────────────────────

export const OrthRouter: Story = {
  name: 'Orth',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes = routerNodes();
    const EDGE_IDS = ['e0', 'e1', 'e2'];
    const edges: IEdgeData[] = EDGE_IDS.map((id, i) => ({
      id,
      source: `a${i}`,
      target: `b${i}`,
      pathType: 'orthogonal',
      router: 'orth',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#34d399', strokeWidth: 2.5 },
    }));

    const graph = await initGraph(container, nodes, edges);

    const p = {
      stroke: '#34d399',
      strokeWidth: 2.5,
      pathType: 'orthogonal',
      endType: 'triangle',
      endSize: 12,
    };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyPathType = () => EDGE_IDS.forEach(id =>
      graph.updateEdge(id, { pathType: p.pathType as IEdgeData['pathType'] }),
    );
    const applyMarkers = () => EDGE_IDS.forEach(id =>
      graph.updateEdge(id, { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec }),
    );

    const gui = new GUI({ title: 'Orth router', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    gui.add(p, 'pathType', ['orthogonal', 'rounded']).name('Connector').onChange(applyPathType);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── OneSide router ────────────────────────────────────────────────────────────

export const OneSideRouter: Story = {
  name: 'OneSide',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes = routerNodes();
    const EDGE_IDS = ['e0', 'e1', 'e2'];
    const edges: IEdgeData[] = EDGE_IDS.map((id, i) => ({
      id,
      source: `a${i}`,
      target: `b${i}`,
      pathType: 'rounded',
      router: 'oneSide',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#fb7185', strokeWidth: 2.5 },
    }));

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#fb7185', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => EDGE_IDS.forEach(id =>
      graph.updateEdge(id, { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec }),
    );

    const gui = new GUI({ title: 'OneSide router', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};

// ── ER router ─────────────────────────────────────────────────────────────────

export const ErRouter: Story = {
  name: 'Er',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const nodes = routerNodes();
    const EDGE_IDS = ['e0', 'e1', 'e2'];
    const edges: IEdgeData[] = EDGE_IDS.map((id, i) => ({
      id,
      source: `a${i}`,
      target: `b${i}`,
      pathType: 'rounded',
      router: 'er',
      endMarker: { type: 'triangle', size: 12 } as ArrowSpec,
      style: { stroke: '#fbbf24', strokeWidth: 2.5 },
    }));

    const graph = await initGraph(container, nodes, edges);

    const p = { stroke: '#fbbf24', strokeWidth: 2.5, endType: 'triangle', endSize: 12 };

    const applyStroke  = () => graph.setStyles({ edge: { stroke: p.stroke, strokeWidth: p.strokeWidth } });
    const applyMarkers = () => EDGE_IDS.forEach(id =>
      graph.updateEdge(id, { endMarker: { type: p.endType, size: p.endSize } as ArrowSpec }),
    );

    const gui = new GUI({ title: 'Er router', container });
    guiPosition(gui);
    gui.addColor(p, 'stroke').name('Stroke colour').onChange(applyStroke);
    gui.add(p, 'strokeWidth', 0.5, 10, 0.5).name('Stroke width').onChange(applyStroke);
    const em = gui.addFolder('End marker');
    em.add(p, 'endType', MARKER_TYPES).name('Type').onChange(applyMarkers);
    em.add(p, 'endSize', 6, 32, 1).name('Size').onChange(applyMarkers);
  },
};
