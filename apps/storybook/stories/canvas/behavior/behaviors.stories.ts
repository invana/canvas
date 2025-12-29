import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasNodeData, CanvasOptions } from '@invana/canvas-core';
import { createContainer, createCanvasSection } from '../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Options',
};

export default meta;
type Story = StoryObj;

/**
 * Helper function to create sample nodes
 */
function createSampleNodes(): CanvasNodeData[] {
  return [
    { id: 'node1', x: 100, y: 80, label: 'Node 1', shape: 'rect', width: 80, height: 50 },
    { id: 'node2', x: 250, y: 80, label: 'Node 2', shape: 'circle', width: 60, height: 60 },
    { id: 'node3', x: 175, y: 180, label: 'Node 3', shape: 'rect', width: 80, height: 50 },
  ];
}

/**
 * Comparison of different behavior presets showing 4 canvas instances with different interaction capabilities:
 * 
 * - **No Behavior (false)**: Completely static - no interactions, pan, or zoom. Read-only visualization.
 * - **Minimal**: Only hover effects enabled. Good for tooltips and highlighting. Pan/zoom work via viewport.
 * - **Default**: Common interactions - drag nodes, hover effects, click selection. Pan/zoom work via viewport.
 * - **Full**: All features - drag, hover, select, focus, multi-select. Pan/zoom work via viewport.
 */
export const BehaviorPresets: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = createContainer({ height: "900px", id: 'behavior-comparison-container' });
    container.style.display = "grid";
    container.style.gridTemplateColumns = "1fr 1fr";
    container.style.gridTemplateRows = "1fr 1fr";
    container.style.gap = "20px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    // Create 4 canvas containers with headers
    createCanvasSection(container, 'canvas-no-behavior', '1. No Behavior (false)', 'Static visualization - no interactions, pan, or zoom');
    createCanvasSection(container, 'canvas-minimal', '2. Minimal Behavior', 'Hover effects only - try hovering over nodes');
    createCanvasSection(container, 'canvas-default', '3. Default Behavior', 'Drag nodes, hover, click to select - most common setup');
    createCanvasSection(container, 'canvas-full', '4. Full Behavior', 'All interactions: drag, hover, select, focus, multi-select(using shift + click)');

    return container;
  },
  play: async () => {
    const container1 = document.getElementById('canvas-no-behavior');
    const container2 = document.getElementById('canvas-minimal');
    const container3 = document.getElementById('canvas-default');
    const container4 = document.getElementById('canvas-full');
    
    if (!container1 || !container2 || !container3 || !container4) return;

    // 1. No Behavior (false) - Green theme
    const canvas1 = new Canvas({
      container: container1,
      behavior: false,
      data: { nodes: createSampleNodes(), edges: [] },
      styles: {
        node: {
          fill: 0x95de64,
          stroke: '#52c41a',
          strokeWidth: 2,
        },
      },
    });
    await canvas1.init();

    // 2. Minimal Behavior - Blue theme
    const canvas2 = new Canvas({
      container: container2,
      behavior: 'minimal',
      data: { nodes: createSampleNodes(), edges: [] },
      styles: {
        node: {
          fill: 0x69c0ff,
          stroke: '#1890ff',
          strokeWidth: 2,
        },
      },
    });
    await canvas2.init();

    // 3. Default Behavior - Yellow theme
    const canvas3 = new Canvas({
      container: container3,
      behavior: 'default',
      data: { nodes: createSampleNodes(), edges: [] },
      styles: {
        node: {
          fill: 0xffd666,
          stroke: '#faad14',
          strokeWidth: 2,
        },
      },
    });
    await canvas3.init();

    // 4. Full Behavior - Orange theme
    const canvas4 = new Canvas({
      container: container4,
      behavior: 'full',
      data: { nodes: createSampleNodes(), edges: [] },
      styles: {
        node: {
          fill: 0xff9c6e,
          stroke: '#ff7a45',
          strokeWidth: 2,
        },
      },
    });
    await canvas4.init();
  },
};

