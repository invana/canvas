import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface LayersArgs {
  backgroundColor: string;
  showEdges: boolean;
  showNodes: boolean;
}

const generateGraphData = (): CanvasData => ({
  nodes: [
    { id: 'n1', x: -100, y: 0, shape: 'circle', size: 40, label: 'Node 1', fill: '#4a90d9', stroke: '#333', strokeWidth: 2 },
    { id: 'n2', x: 100, y: 0, shape: 'circle', size: 40, label: 'Node 2', fill: '#50c878', stroke: '#333', strokeWidth: 2 },
    { id: 'n3', x: 0, y: -80, shape: 'hexagon', size: 35, label: 'Node 3', fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier', arrowTarget: 'triangle', stroke: '#666', strokeWidth: 2 },
    { id: 'e2', source: 'n1', target: 'n3', pathType: 'bezier', arrowTarget: 'triangle', stroke: '#666', strokeWidth: 2 },
    { id: 'e3', source: 'n2', target: 'n3', pathType: 'bezier', arrowTarget: 'triangle', stroke: '#666', strokeWidth: 2 },
  ],
});

const createLayerDemo = (args: LayersArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  // Controls
  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '12px';
  controls.style.flexWrap = 'wrap';
  controls.style.alignItems = 'center';
  controls.innerHTML = `
    <strong>Layer Visibility:</strong>
    <label><input type="checkbox" id="edge-layer" ${args.showEdges ? 'checked' : ''}> Edges</label>
    <label><input type="checkbox" id="node-layer" ${args.showNodes ? 'checked' : ''}> Nodes</label>
    <span style="margin-left: 20px; font-size: 12px; color: #666;">Canvas layers: edges (below) + nodes (above)</span>
  `;
  wrapper.appendChild(controls);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '500px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      backgroundColor: args.backgroundColor,
      data: generateGraphData(),
    });

    await canvas.init();
    canvas.render();

    // Access layer containers via Canvas API
    const edgeLayer = canvas.edgeLayer;
    const nodeLayer = canvas.nodeLayer;

    // Wire up layer visibility controls
    const edgeCheck = document.getElementById('edge-layer') as HTMLInputElement;
    const nodeCheck = document.getElementById('node-layer') as HTMLInputElement;

    edgeCheck?.addEventListener('change', () => {
      if (edgeLayer) edgeLayer.visible = edgeCheck.checked;
    });

    nodeCheck?.addEventListener('change', () => {
      if (nodeLayer) nodeLayer.visible = nodeCheck.checked;
    });

    // Apply initial visibility from args
    if (edgeLayer) edgeLayer.visible = args.showEdges;
    if (nodeLayer) nodeLayer.visible = args.showNodes;
  });

  return wrapper;
};

const createOpacityDemo = (): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Layer Opacity</strong> - Adjust transparency of edge and node layers';
  wrapper.appendChild(info);

  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '20px';
  controls.innerHTML = `
    <label style="display: flex; align-items: center; gap: 8px;">
      Edge Opacity: <input type="range" id="edge-opacity" min="0" max="100" value="100" style="width: 100px;">
      <span id="edge-val">100%</span>
    </label>
    <label style="display: flex; align-items: center; gap: 8px;">
      Node Opacity: <input type="range" id="node-opacity" min="0" max="100" value="100" style="width: 100px;">
      <span id="node-val">100%</span>
    </label>
  `;
  wrapper.appendChild(controls);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '450px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 450,
      backgroundColor: '#f5f5f5',
      data: {
        nodes: [
          { id: 'n1', x: -120, y: 0, shape: 'circle', size: 50, label: 'A', fill: '#4a90d9', stroke: '#2d5a87', strokeWidth: 3 },
          { id: 'n2', x: 120, y: 0, shape: 'circle', size: 50, label: 'B', fill: '#50c878', stroke: '#3d9d5c', strokeWidth: 3 },
          { id: 'n3', x: 0, y: 100, shape: 'circle', size: 50, label: 'C', fill: '#ff6b6b', stroke: '#cc5555', strokeWidth: 3 },
          { id: 'n4', x: 0, y: -100, shape: 'hexagon', size: 45, label: 'Hub', fill: '#9b59b6', stroke: '#7d478f', strokeWidth: 3 },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n4', pathType: 'bezier', arrowTarget: 'triangle', stroke: '#888', strokeWidth: 3 },
          { id: 'e2', source: 'n2', target: 'n4', pathType: 'bezier', arrowTarget: 'triangle', stroke: '#888', strokeWidth: 3 },
          { id: 'e3', source: 'n3', target: 'n4', pathType: 'bezier', arrowTarget: 'triangle', stroke: '#888', strokeWidth: 3 },
          { id: 'e4', source: 'n1', target: 'n2', pathType: 'line', arrowTarget: 'triangle', stroke: '#666', strokeWidth: 2 },
          { id: 'e5', source: 'n2', target: 'n3', pathType: 'line', arrowTarget: 'triangle', stroke: '#666', strokeWidth: 2 },
          { id: 'e6', source: 'n3', target: 'n1', pathType: 'line', arrowTarget: 'triangle', stroke: '#666', strokeWidth: 2 },
        ],
      },
    });

    await canvas.init();
    canvas.render();

    const edgeLayer = canvas.edgeLayer;
    const nodeLayer = canvas.nodeLayer;

    const edgeOpacity = document.getElementById('edge-opacity') as HTMLInputElement;
    const nodeOpacity = document.getElementById('node-opacity') as HTMLInputElement;
    const edgeVal = document.getElementById('edge-val');
    const nodeVal = document.getElementById('node-val');

    edgeOpacity?.addEventListener('input', () => {
      const val = parseInt(edgeOpacity.value) / 100;
      if (edgeLayer) edgeLayer.alpha = val;
      if (edgeVal) edgeVal.textContent = `${edgeOpacity.value}%`;
    });

    nodeOpacity?.addEventListener('input', () => {
      const val = parseInt(nodeOpacity.value) / 100;
      if (nodeLayer) nodeLayer.alpha = val;
      if (nodeVal) nodeVal.textContent = `${nodeOpacity.value}%`;
    });
  });

  return wrapper;
};

const meta: Meta<LayersArgs> = {
  title: 'Core/Layers',
  render: (args) => createLayerDemo(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    showEdges: { control: 'boolean' },
    showNodes: { control: 'boolean' },
  },
  args: {
    backgroundColor: '#f5f5f5',
    showEdges: true,
    showNodes: true,
  },
};

export default meta;

type Story = StoryObj<LayersArgs>;

export const LayerVisibility: Story = {};

export const LayerOpacity: Story = {
  render: () => createOpacityDemo(),
};
