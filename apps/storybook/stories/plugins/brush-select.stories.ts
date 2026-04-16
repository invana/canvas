import type { Meta, StoryObj } from '@storybook/html';
import GUI from 'lil-gui';
import { Canvas, GraphDataPlugin, BrushSelectPlugin } from '@invana/canvas-core';
import { D3ForceLayoutPlugin } from '@invana/layouts-d3-force';
import { generateRandomTree } from '@invana/example-datasets';
import { createContainer } from '../../src/div-utils';

const rawTree = generateRandomTree(16);
const GRAPH_DATA = {
  nodes: rawTree.nodes.map((n: any) => ({
    id: String(n.index),
    shape: 'circle' as const,
    size: 10,
    label: `N${n.index}`,
  })),
  edges: rawTree.edges.map((e: any, i: number) => ({
    id: `e${i}`,
    source: String(e.source),
    target: String(e.target),
    pathType: 'straight' as const,
  })),
};

const meta: Meta = {
  title: 'Plugins/Brush Select',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

export const BrushSelect: Story = {
  name: 'Brush Select',
  render: () => {
    const div = createContainer({ id: 'cvs-brush-select' });
    div.style.position = 'relative';
    return div;
  },
  play: async () => {
    const container = document.getElementById('cvs-brush-select');
    if (!container) return;

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
            type: 'pattern' as const,
            patternType: 'dots' as const,
            backgroundColor: '#0f172a',
            color: '#334155',
            size: 1.5,
            spacing: 28,
            alpha: 0.7,
          },
        },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: false, fitPadding: 70 });
    await canvas.registerPlugin(graphPlugin);
    graphPlugin.setData(GRAPH_DATA as any);
    graphPlugin.setStyles({
      node: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
      edge: { stroke: '#58a6ff', strokeWidth: 2 },
    });
    const layout = new D3ForceLayoutPlugin({ charge: -200, collisionRadius: 25, animate: true, iterations: 300 });
    await canvas.registerPlugin(layout);
    await layout.start();

    const brushPlugin = new BrushSelectPlugin({
      trigger: ['shift'],
      // mode removed
      enableElements: ['node', 'edge'],
      immediately: false,
      clearOnBackground: true,
    });
    await canvas.registerPlugin(brushPlugin);

    // GUI controls
    const gui = new GUI({ title: 'Brush Select' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    gui.domElement.style.zIndex = '1000';
    gui.domElement.style.border = '2px solid #1677ff';
    gui.domElement.style.background = 'rgba(20,24,32,0.95)';
    container.appendChild(gui.domElement);
    console.log('[BrushSelectStory] lil-gui created and appended');

    const settings = {
      trigger: 'shift',
      // mode removed
      immediately: false,
      clearOnBackground: true,
      enableNodes: true,
      enableEdges: true,
    };

    const sync = () => {
      const triggerKeys = settings.trigger === 'none' ? [] : [settings.trigger];
      const enableElements: Array<'node' | 'edge'> = [];
      if (settings.enableNodes) enableElements.push('node');
      if (settings.enableEdges) enableElements.push('edge');
      brushPlugin.setOptions({ trigger: triggerKeys, immediately: settings.immediately, clearOnBackground: settings.clearOnBackground, enableElements });
      console.log('[BrushSelectStory] Options synced', { triggerKeys, immediately: settings.immediately, clearOnBackground: settings.clearOnBackground, enableElements });
    };

    gui.add(settings, 'trigger', ['shift', 'control', 'alt', 'none']).name('Trigger Key').onChange(sync);
    gui.add(settings, 'immediately').name('Immediately').onChange(sync);
    gui.add(settings, 'clearOnBackground').name('clearOnBackground').onChange(sync);
    gui.add(settings, 'enableNodes').name('Select Nodes').onChange(sync);
    gui.add(settings, 'enableEdges').name('Select Edges').onChange(sync);
    // Initial sync to apply GUI state to plugin
    sync();

    canvas.on('selection:changed', ({ nodes, edges }) => {
      console.log('selection:changed', {
        nodes: nodes.map((n: any) => n.data.id),
        edges: edges.map((e: any) => e.data.id),
      });
    });
  },
};
