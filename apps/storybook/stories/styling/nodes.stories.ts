import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, type GraphData, type GraphStyles } from '@invana/canvas-core';
import { createContainer } from '../../src/div-utils';

const meta: Meta = {
  title: 'Styling/Nodes',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------
// Shared helper

async function renderStory(
  container: HTMLElement,
  data: GraphData,
  styles: GraphStyles,
  bgColor = '#1a1a1a',
): Promise<void> {
  const canvas = new Canvas({
    container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    behavior: 'default',
    plugins: [{ plugin: 'background', key: 'bg', options: { type: 'solid', color: bgColor } }],
  });
  await canvas.init();

  const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 70 });
  await canvas.registerPlugin(graphPlugin);
  graphPlugin.setStyles(styles);
  graphPlugin.setData(data);
}

// ---------------------------------------------------------------------------

/**
 * Each node carries its own `style` override while sharing global defaults.
 */
export const IndividualStyling: Story = {
  render: () => createContainer({ id: 'nodes-individual', height: '600px' }),
  play: async () => {
    const container = document.getElementById('nodes-individual');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'n1', x: -250, y: 0, shape: 'circle',  size: 50,              label: 'Blue',    style: { fill: '#1890ff', stroke: '#0050b3', strokeWidth: 3 } },
          { id: 'n2', x:  -80, y: 0, shape: 'rect',    width: 90, height: 56, label: 'Green',   style: { fill: '#52c41a', stroke: '#389e0d', strokeWidth: 2, strokeStyle: 'dashed' } },
          { id: 'n3', x:   80, y: 0, shape: 'diamond', size: 56,              label: 'Red',     style: { fill: '#ff4d4f', stroke: '#cf1322', strokeWidth: 4, strokeStyle: 'dotted' } },
          { id: 'n4', x:  250, y: 0, shape: 'hexagon', size: 50,              label: 'Yellow',  style: { fill: '#faad14', stroke: '#d48806', strokeWidth: 2 } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' },
          { id: 'e3', source: 'n3', target: 'n4', pathType: 'bezier' },
        ],
      },
      { node: { stroke: '#555', strokeWidth: 2, labelFill: '#fff' }, edge: { stroke: '#555', strokeWidth: 2 } },
      '#111827',
    );
  },
};

// ---------------------------------------------------------------------------

/**
 * Global styles applied to all nodes via `setStyles()`.
 */
export const GlobalStyling: Story = {
  render: () => createContainer({ id: 'nodes-global', height: '600px' }),
  play: async () => {
    const container = document.getElementById('nodes-global');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'n1', x: -260, y: -120, shape: 'circle',   size: 44,              label: 'Node A' },
          { id: 'n2', x:  -40, y: -120, shape: 'rect',     width: 100, height: 54, label: 'Node B' },
          { id: 'n3', x:  190, y: -120, shape: 'diamond',  size: 52,              label: 'Node C' },
          { id: 'n4', x: -150, y:  120, shape: 'hexagon',  size: 46,              label: 'Node D' },
          { id: 'n5', x:   80, y:  120, shape: 'star',     size: 46,              label: 'Node E' },
          { id: 'n6', x:  310, y:  120, shape: 'triangle', size: 50,              label: 'Node F' },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' },
          { id: 'e3', source: 'n1', target: 'n4', pathType: 'bezier' },
          { id: 'e4', source: 'n4', target: 'n5', pathType: 'bezier' },
          { id: 'e5', source: 'n3', target: 'n6', pathType: 'bezier' },
        ],
      },
      {
        node: {
          fill: '#7c3aed', stroke: '#ffffff', strokeWidth: 2, labelFill: '#ffffff',
          states: {
            selected: { stroke: '#ffd166', strokeWidth: 4 },
            active:   { halo: true, haloStroke: '#7c3aed', haloStrokeWidth: 4 },
          },
        },
        edge: { stroke: '#94a3b8', strokeWidth: 2 },
      },
    );
  },
};

// ---------------------------------------------------------------------------

/**
 * Style functions receive the node data object and return a value dynamically.
 */
export const FunctionStyling: Story = {
  render: () => createContainer({ id: 'nodes-function', height: '600px' }),
  play: async () => {
    const container = document.getElementById('nodes-function');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'user1',   x: -220, y: -110, label: 'Admin User',     shape: 'circle',  payload: { type: 'user',     importance: 0.9, active: true  } },
          { id: 'user2',   x:    0, y: -110, label: 'Regular User',   shape: 'circle',  payload: { type: 'user',     importance: 0.5, active: false } },
          { id: 'group1',  x: -220, y:  110, label: 'Admin Group',    shape: 'rect',    width: 110, height: 56, payload: { type: 'group',    importance: 0.8, active: true  } },
          { id: 'group2',  x:    0, y:  110, label: 'User Group',     shape: 'rect',    width: 110, height: 56, payload: { type: 'group',    importance: 0.4, active: false } },
          { id: 'system1', x:  220, y:    0, label: 'System Process', shape: 'diamond', size: 56,                payload: { type: 'system',   importance: 0.6, active: true  } },
        ],
        edges: [
          { id: 'e1', source: 'user1',  target: 'group1',  pathType: 'bezier' },
          { id: 'e2', source: 'user2',  target: 'group2',  pathType: 'bezier' },
          { id: 'e3', source: 'group1', target: 'system1', pathType: 'bezier' },
          { id: 'e4', source: 'group2', target: 'system1', pathType: 'bezier' },
        ],
      },
      {
        node: {
          fill: (d: any) => {
            const t = d.payload?.type;
            if (t === 'user')   return '#1890ff';
            if (t === 'group')  return '#52c41a';
            if (t === 'system') return '#faad14';
            return '#d9d9d9';
          },
          stroke:      (d: any) => d.payload?.active ? '#ffffff' : '#595959',
          strokeWidth: 2,
          halo:        (d: any) => Number(d.payload?.importance ?? 0) > 0.7,
          haloStroke: '#faad14',
          haloStrokeWidth: 3,
          labelFill: '#ffffff',
        },
        edge: { stroke: '#8c8c8c', strokeWidth: 2 },
      },
    );
  },
};

// ---------------------------------------------------------------------------

/**
 * Status-based conditional styling using `payload` data.
 */
export const ConditionalStyling: Story = {
  render: () => createContainer({ id: 'nodes-conditional', height: '600px' }),
  play: async () => {
    const container = document.getElementById('nodes-conditional');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'n1', x: -300, y: 0, label: 'Success', shape: 'circle', size: 44, payload: { status: 'success' } },
          { id: 'n2', x: -100, y: 0, label: 'Warning', shape: 'circle', size: 44, payload: { status: 'warning' } },
          { id: 'n3', x:  100, y: 0, label: 'Error',   shape: 'circle', size: 44, payload: { status: 'error'   } },
          { id: 'n4', x:  300, y: 0, label: 'Info',    shape: 'circle', size: 44, payload: { status: 'info'    } },
          { id: 'n5', x:    0, y: 170, label: 'Pending', shape: 'rect', width: 110, height: 56, payload: { status: 'pending' } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n5', pathType: 'bezier' },
          { id: 'e2', source: 'n2', target: 'n5', pathType: 'bezier' },
          { id: 'e3', source: 'n3', target: 'n5', pathType: 'bezier' },
          { id: 'e4', source: 'n4', target: 'n5', pathType: 'bezier' },
        ],
      },
      {
        node: {
          fill: (d: any) => {
            switch (d.payload?.status) {
              case 'success': return '#52c41a';
              case 'warning': return '#faad14';
              case 'error':   return '#ff4d4f';
              case 'info':    return '#1890ff';
              default:        return '#8c8c8c';
            }
          },
          stroke:            '#ffffff',
          strokeWidth:       (d: any) => d.payload?.status === 'error' ? 3 : 2,
          halo:              (d: any) => d.payload?.status === 'error',
          haloStroke:        '#ff4d4f',
          haloStrokeWidth:   5,
          labelFill:         '#ffffff',
          labelFontWeight:   (d: any) => d.payload?.status === 'error' ? 'bold' : 'normal',
        },
        edge: { stroke: '#7f8c8d', strokeWidth: 2 },
      },
    );
  },
};
