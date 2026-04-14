import type { Meta, StoryObj } from '@storybook/html';
import {
  Canvas,
  GraphDataPlugin,
  type GraphData,
  type GraphStyles,
} from '@invana/canvas-core';
import { createContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Styling/Nodes Function-Based Styling',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

async function renderStory(
  container: HTMLElement,
  data: GraphData,
  styles: GraphStyles,
  backgroundColor: string,
): Promise<void> {
  const canvas = new Canvas({
    container,
    width: container.clientWidth || 800,
    height: container.clientHeight || 600,
    behavior: 'default',
    plugins: [
      {
        plugin: 'background',
        key: 'bg',
        options: {
          type: 'solid',
          color: backgroundColor,
        },
      },
    ],
  });

  await canvas.init();

  const graphPlugin = new GraphDataPlugin({
    fitOnRender: true,
    fitPadding: 70,
  });
  await canvas.registerPlugin(graphPlugin);
  graphPlugin.setStyles(styles);
  graphPlugin.setData(data);
}

export const BasicFunctionStyling: Story = {
  render: () => createContainer({ id: 'fn-style-basic', height: '600px' }),
  play: async () => {
    const container = document.getElementById('fn-style-basic');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'user1', x: -220, y: -110, label: 'Admin User', shape: 'circle', payload: { type: 'user', importance: 0.9, active: true } },
          { id: 'user2', x: 0, y: -110, label: 'Regular User', shape: 'circle', payload: { type: 'user', importance: 0.5, active: false } },
          { id: 'group1', x: -220, y: 110, label: 'Admin Group', shape: 'rect', width: 110, height: 56, payload: { type: 'group', importance: 0.8, active: true } },
          { id: 'group2', x: 0, y: 110, label: 'User Group', shape: 'rect', width: 110, height: 56, payload: { type: 'group', importance: 0.4, active: false } },
          { id: 'system1', x: 220, y: 0, label: 'System Process', shape: 'diamond', size: 56, payload: { type: 'system', importance: 0.6, active: true } },
        ],
        edges: [
          { id: 'e1', source: 'user1', target: 'group1', pathType: 'bezier' },
          { id: 'e2', source: 'user2', target: 'group2', pathType: 'bezier' },
          { id: 'e3', source: 'group1', target: 'system1', pathType: 'bezier' },
          { id: 'e4', source: 'group2', target: 'system1', pathType: 'bezier' },
        ],
      },
      {
        node: {
          fill: (d: any) => {
            const type = d.payload?.type;
            if (type === 'user') return '#1890ff';
            if (type === 'group') return '#52c41a';
            if (type === 'system') return '#faad14';
            return '#d9d9d9';
          },
          stroke: (d: any) => d.payload?.active ? '#ffffff' : '#595959',
          strokeWidth: 2,
          halo: (d: any) => Number(d.payload?.importance ?? 0) > 0.7,
          haloStroke: '#faad14',
          haloStrokeWidth: 3,
          labelFill: '#ffffff',
        },
        edge: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
        },
      },
      '#1a1a1a',
    );
  },
};

export const ConditionalFunctionStyling: Story = {
  render: () => createContainer({ id: 'fn-style-conditional', height: '600px' }),
  play: async () => {
    const container = document.getElementById('fn-style-conditional');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'n1', x: -300, y: 0, label: 'Success', shape: 'circle', size: 44, payload: { status: 'success' } },
          { id: 'n2', x: -100, y: 0, label: 'Warning', shape: 'circle', size: 44, payload: { status: 'warning' } },
          { id: 'n3', x: 100, y: 0, label: 'Error', shape: 'circle', size: 44, payload: { status: 'error' } },
          { id: 'n4', x: 300, y: 0, label: 'Info', shape: 'circle', size: 44, payload: { status: 'info' } },
          { id: 'n5', x: 0, y: 170, label: 'Pending', shape: 'rect', width: 110, height: 56, payload: { status: 'pending' } },
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
              case 'error': return '#ff4d4f';
              case 'info': return '#1890ff';
              default: return '#8c8c8c';
            }
          },
          stroke: '#ffffff',
          strokeWidth: (d: any) => d.payload?.status === 'error' ? 3 : 2,
          halo: (d: any) => d.payload?.status === 'error',
          haloStroke: '#ff4d4f',
          haloStrokeWidth: 5,
          labelFill: '#ffffff',
          labelFontWeight: (d: any) => d.payload?.status === 'error' ? 'bold' : 'normal',
        },
        edge: {
          stroke: '#7f8c8d',
          strokeWidth: 2,
        },
      },
      '#1a1a1a',
    );
  },
};

export const MixedFunctionStyling: Story = {
  render: () => createContainer({ id: 'fn-style-mixed', height: '600px' }),
  play: async () => {
    const container = document.getElementById('fn-style-mixed');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'n1', x: -200, y: -40, label: 'Level 3', shape: 'circle', payload: { category: 'primary', level: 3 } },
          { id: 'n2', x: 0, y: -40, label: 'Level 2', shape: 'circle', payload: { category: 'secondary', level: 2 } },
          {
            id: 'n3',
            x: 200,
            y: -40,
            label: 'Special',
            shape: 'circle',
            payload: { category: 'primary', level: 4 },
            style: { fill: '#52c41a', halo: true, haloStroke: '#52c41a', haloStrokeWidth: 4 },
          },
          {
            id: 'n4',
            x: 0,
            y: 170,
            label: 'Custom',
            shape: 'rect',
            width: 120,
            height: 62,
            payload: { category: 'primary', level: 1 },
            style: { fill: '#faad14' },
          },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n3', pathType: 'bezier' },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' },
          { id: 'e3', source: 'n3', target: 'n4', pathType: 'bezier' },
        ],
      },
      {
        node: {
          fill: (d: any) => d.payload?.category === 'primary' ? '#1890ff' : '#8c8c8c',
          stroke: '#ffffff',
          strokeWidth: 2,
          labelFill: '#ffffff',
        },
        edge: {
          stroke: '#9aa0a6',
          strokeWidth: 2,
        },
      },
      '#1a1a1a',
    );
  },
};

export const GradientFunctionStyling: Story = {
  render: () => createContainer({ id: 'fn-style-gradient', height: '600px' }),
  play: async () => {
    const container = document.getElementById('fn-style-gradient');
    if (!container) return;

    const getGradientColor = (value: number, min: number, max: number): string => {
      const normalized = (value - min) / (max - min);
      const r = Math.round(255 * normalized);
      const g = Math.round(100 * (1 - normalized));
      const b = Math.round(255 * (1 - normalized));
      return `rgb(${r}, ${g}, ${b})`;
    };

    const nodes: GraphData['nodes'] = [];
    const edges: GraphData['edges'] = [];
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 4; j++) {
        const id = `n${i}-${j}`;
        const metric = (i * 4 + j) * 5;
        nodes.push({ id, x: -300 + i * 150, y: -180 + j * 120, shape: 'circle', label: `${metric}`, payload: { metric } });

        if (j < 3) {
          edges.push({ id: `ev-${id}`, source: id, target: `n${i}-${j + 1}`, pathType: 'bezier' });
        }
        if (i < 4) {
          edges.push({ id: `eh-${id}`, source: id, target: `n${i + 1}-${j}`, pathType: 'bezier' });
        }
      }
    }

    await renderStory(
      container,
      { nodes, edges },
      {
        node: {
          fill: (d: any) => getGradientColor(Number(d.payload?.metric ?? 0), 0, 100),
          stroke: '#ffffff',
          strokeWidth: 1,
          halo: (d: any) => Number(d.payload?.metric ?? 0) > 75,
          haloStroke: '#ff4d4f',
          haloStrokeWidth: 3,
          labelFill: '#ffffff',
        },
        edge: {
          stroke: '#6b7280',
          strokeWidth: 1,
        },
      },
      '#1a1a1a',
    );
  },
};

export const NetworkMonitoringDashboard: Story = {
  render: () => createContainer({ id: 'fn-style-network', height: '600px' }),
  play: async () => {
    const container = document.getElementById('fn-style-network');
    if (!container) return;

    await renderStory(
      container,
      {
        nodes: [
          { id: 'server1', x: -220, y: -120, label: 'Server 1', shape: 'rect', width: 120, height: 56, payload: { health: 95, load: 45, connections: 150, isActive: true } },
          { id: 'server2', x: 220, y: -120, label: 'Server 2', shape: 'rect', width: 120, height: 56, payload: { health: 30, load: 85, connections: 200, isActive: true } },
          { id: 'lb1', x: 0, y: 40, label: 'Load Balancer', shape: 'diamond', size: 66, payload: { health: 100, load: 60, connections: 350, isActive: true } },
          { id: 'db1', x: -170, y: 220, label: 'Database 1', shape: 'circle', size: 52, payload: { health: 85, load: 70, connections: 80, isActive: false } },
          { id: 'db2', x: 170, y: 220, label: 'Database 2', shape: 'circle', size: 52, payload: { health: 40, load: 90, connections: 120, isActive: true } },
        ],
        edges: [
          { id: 'e1', source: 'server1', target: 'lb1', pathType: 'bezier', payload: { bandwidth: 45, latency: 20 } },
          { id: 'e2', source: 'server2', target: 'lb1', pathType: 'bezier', payload: { bandwidth: 85, latency: 15 } },
          { id: 'e3', source: 'lb1', target: 'db1', pathType: 'bezier', payload: { bandwidth: 30, latency: 50 } },
          { id: 'e4', source: 'lb1', target: 'db2', pathType: 'bezier', payload: { bandwidth: 95, latency: 80 } },
        ],
      },
      {
        node: {
          fill: (d: any) => {
            const health = Number(d.payload?.health ?? 100);
            const load = Number(d.payload?.load ?? 0);
            if (health < 50) return '#ff4d4f';
            if (load > 80) return '#faad14';
            if (load > 50) return '#fadb14';
            return '#52c41a';
          },
          stroke: (d: any) => d.payload?.isActive ? '#ffffff' : '#595959',
          strokeWidth: (d: any) => d.payload?.isActive ? 3 : 1,
          halo: (d: any) => Number(d.payload?.health ?? 100) < 30,
          haloStroke: '#ff4d4f',
          haloStrokeWidth: 5,
          labelFill: '#ffffff',
          labelFontSize: 11,
          labelFontWeight: (d: any) => d.payload?.isActive ? 'bold' : 'normal',
        },
        edge: {
          stroke: (d: any) => {
            const bandwidth = Number(d.payload?.bandwidth ?? 0);
            if (bandwidth > 80) return '#ff4d4f';
            if (bandwidth > 50) return '#faad14';
            return '#1890ff';
          },
          strokeWidth: (d: any) => Math.max(1, Number(d.payload?.bandwidth ?? 10) / 25),
          alpha: (d: any) => Math.max(0.3, 1 - (Number(d.payload?.latency ?? 0) / 200)),
        },
      },
      '#0a0a0a',
    );
  },
};