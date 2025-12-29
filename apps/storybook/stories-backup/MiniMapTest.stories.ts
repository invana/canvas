import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@invana/canvas-core';

const meta: Meta = {
  title: 'Plugins/MiniMapTest',
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj;

/**
 * Simple test to verify minimap is working
 */
export const SimpleMiniMapTest: Story = {
  render: () => {
    const container = document.createElement('div');
    container.id = 'minimap-test-container';
    container.style.width = '800px';
    container.style.height = '600px';
    container.style.position = 'relative';
    return container;
  },
  play: async () => {
    console.log('=== MINIMAP TEST STORY STARTING ===');
    
    const container = document.getElementById('minimap-test-container');
    if (!container) {
      console.error('Container not found!');
      return;
    }

    console.log('Container found, creating canvas...');

    const canvas = new Canvas({
      container,
      width: container.clientWidth,
      height: container.clientHeight,
      backgroundColor: '#2a2a2a',
      behavior: 'full',
      plugins: [
        {
          plugin: 'minimap',
          options: {
            width: 160,
            height: 120,
            position: 'bottom-right',
            backgroundColor: '#1a1a1a',
            viewportFill: 0x6096ff,
            viewportStroke: 0x0050b3,
          },
        },
      ],
    });

    console.log('Canvas created, initializing...');
    await canvas.init();
    console.log('Canvas initialized');

    // Add just 5 nodes in a simple pattern
    const nodes = [
      { id: 'node-1', x: 0, y: 0 },
      { id: 'node-2', x: 200, y: 0 },
      { id: 'node-3', x: 200, y: 200 },
      { id: 'node-4', x: 0, y: 200 },
      { id: 'node-5', x: 100, y: 100 },
    ];

    console.log('Adding nodes...');
    nodes.forEach(({ id, x, y }) => {
      canvas.addNode({
        id,
        x,
        y,
        shape: 'circle',
        size: 40,
        label: id,
        style: {
          fill: '#4CAF50',
          labelFill: '#fff',
        },
      });
    });

    console.log('Adding edges...');
    canvas.addEdge({ id: 'e1', source: 'node-1', target: 'node-2' });
    canvas.addEdge({ id: 'e2', source: 'node-2', target: 'node-3' });
    canvas.addEdge({ id: 'e3', source: 'node-3', target: 'node-4' });
    canvas.addEdge({ id: 'e4', source: 'node-4', target: 'node-1' });
    canvas.addEdge({ id: 'e5', source: 'node-5', target: 'node-1' });

    console.log('Rendering canvas...');
    canvas.render();
    console.log('Canvas rendered');

    // Check if minimap plugin exists
    const minimap = canvas.getPlugin<any>('minimap');
    console.log('Minimap plugin:', minimap);
    
    if (minimap) {
      console.log('Calling minimap.refresh()...');
      minimap.refresh();
    } else {
      console.error('Minimap plugin not found!');
    }

    console.log('=== MINIMAP TEST STORY COMPLETE ===');
  },
};
