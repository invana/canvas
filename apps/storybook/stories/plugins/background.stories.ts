import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import GUI from 'lil-gui';
import { createContainer } from '../../src/div-utils';

const GRAPH_DATA = {
  nodes: [
    { id: 'n1', x: -200, y: -100, shape: 'circle'  as const, size: 44,           label: 'Node A' },
    { id: 'n2', x:  200, y: -100, shape: 'rect'    as const, width: 90, height: 54, label: 'Node B' },
    { id: 'n3', x: -200, y:  100, shape: 'diamond' as const, size: 50,           label: 'Node C' },
    { id: 'n4', x:  200, y:  100, shape: 'hexagon' as const, size: 46,           label: 'Node D' },
    { id: 'n5', x:    0, y:    0, shape: 'ellipse' as const, width: 90, height: 54, label: 'Center' },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n5', pathType: 'bezier' as const },
    { id: 'e2', source: 'n2', target: 'n5', pathType: 'bezier' as const },
    { id: 'e3', source: 'n3', target: 'n5', pathType: 'bezier' as const },
    { id: 'e4', source: 'n4', target: 'n5', pathType: 'bezier' as const },
  ],
};

const GRAPH_STYLES = {
  node: { fill: '#4cc9f0', stroke: '#ffffff', strokeWidth: 2, labelFill: '#ffffff' },
  edge: { stroke: '#94a3b8', strokeWidth: 2 },
};

const meta: Meta = {
  title: 'Plugins/Background',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------

export const Patterns: Story = {
  render: () => createContainer({ id: 'bg-patterns' }),
  play: async () => {
    const container = document.getElementById('bg-patterns');
    if (!container) return;

    const settings = {
      patternType: 'dots' as 'dots' | 'grid' | 'cross' | 'lines',
      backgroundColor: '#0f172a',
      color: '#334155',
    };

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: settings.patternType,
            color: settings.color,
            backgroundColor: settings.backgroundColor,
            size: 1.5,
            spacing: 28,
            alpha: 0.75,
          },
        },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    graphPlugin.setStyles(GRAPH_STYLES as any);

    const gui = new GUI({ container, title: 'Background' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    const update = () => {
      canvas.setOptions({
        plugins: [{
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: settings.patternType,
            color: settings.color,
            backgroundColor: settings.backgroundColor,
            size: 1.5,
            spacing: 28,
            alpha: 0.75,
          },
        }],
      });
    };

    gui.add(settings, 'patternType', ['dots', 'grid', 'cross', 'lines']).name('Pattern').onChange(update);
    gui.addColor(settings, 'backgroundColor').name('BG Color').onChange(update);
    gui.addColor(settings, 'color').name('Pattern Color').onChange(update);
  },
};

// ---------------------------------------------------------------------------

export const SolidColor: Story = {
  render: () => createContainer({ id: 'bg-solid' }),
  play: async () => {
    const container = document.getElementById('bg-solid');
    if (!container) return;

    const settings = { color: '#1a1a2e' };

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: { type: 'solid', color: settings.color },
        },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    graphPlugin.setStyles(GRAPH_STYLES as any);

    const gui = new GUI({ container, title: 'Solid Color' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    gui.addColor(settings, 'color').name('Color').onChange((val: string) => {
      canvas.setOptions({ plugins: [{ plugin: 'background', key: 'bg', options: { type: 'solid', color: val } }] });
    });
  },
};

// ---------------------------------------------------------------------------

export const FollowMode: Story = {
  render: () => createContainer({ id: 'bg-follow' }),
  play: async () => {
    const container = document.getElementById('bg-follow');
    if (!container) return;

    const settings = { follow: true };

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'grid',
            color: '#d0d0d0',
            backgroundColor: '#ffffff',
            spacing: 25,
            lineWidth: 1,
            follow: settings.follow,
          },
        },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    graphPlugin.setStyles({
      node: { fill: '#4cc9f0', stroke: '#333', strokeWidth: 2, labelFill: '#333' },
      edge: { stroke: '#666', strokeWidth: 2 },
    } as any);

    const gui = new GUI({ container, title: 'Follow Mode' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    gui.add(settings, 'follow').name('Follow Viewport').onChange((val: boolean) => {
      canvas.setOptions({
        plugins: [{
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'grid',
            color: '#d0d0d0',
            backgroundColor: '#ffffff',
            spacing: 25,
            lineWidth: 1,
            follow: val,
          },
        }],
      });
    });
  },
};
