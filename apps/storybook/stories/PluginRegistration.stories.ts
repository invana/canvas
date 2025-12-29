import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasNodeData, type CanvasOptions } from '@invana/canvas-core';
import { getFullHeightContainer } from '../src/div-utils';

const meta: Meta = {
  title: 'Core/Plugin System/Registration',
  parameters: {
    docs: {
      description: {
        component: 'Demonstrates string-based plugin registration with serializable configuration.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const generateSampleData = (): { nodes: CanvasNodeData[] } => {
  const nodes: CanvasNodeData[] = [
    {
      id: 'node-1',
      x: -100,
      y: 0,
      label: 'Node 1',
      shape: 'circle',
      size: 30,
      style: {
        fill: '#4a90d9',
        labelPosition: 'bottom',
        labelOffsetY: 10,
      },
    },
    {
      id: 'node-2',
      x: 100,
      y: 0,
      label: 'Node 2',
      shape: 'rect',
      width: 80,
      height: 50,
      style: {
        fill: '#50c878',
        labelPosition: 'center',
        labelStyle: { fill: '#ffffff' },
      },
    },
    {
      id: 'node-3',
      x: 0,
      y: 120,
      label: 'Node 3',
      shape: 'diamond',
      size: 35,
      style: {
        fill: '#ff6b6b',
        labelPosition: 'bottom',
        labelOffsetY: 10,
      },
    },
  ];
  return { nodes };
};

/**
 * No plugins - pure rendering only
 * The canvas is completely static with no interaction capabilities
 */
export const NoPlugins: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-no-plugins';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-no-plugins');
    if (!container) return;

    // ✅ SERIALIZABLE - behavior: false means no plugins
    const options: CanvasOptions = {
      container,
      behavior: false,  // Explicitly disable all behaviors
      data: generateSampleData(),
    };

    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * Minimal preset - only viewport controls
 * Good for read-only dashboards and static visualizations
 */
export const MinimalPreset: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-minimal';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-minimal');
    if (!container) return;

    // ✅ SERIALIZABLE - Uses 'minimal' preset
    const options: CanvasOptions = {
      container,
      behavior: 'minimal',  // drag-canvas + zoom-control
      data: generateSampleData(),
    };

    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * Default preset - common interactions
 * Good for most graph visualizations
 */
export const DefaultPreset: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-default';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-default');
    if (!container) return;

    // ✅ SERIALIZABLE - Uses 'default' preset
    const options: CanvasOptions = {
      container,
      behavior: 'default',  // drag-element + drag-canvas + click-select + zoom-control
      data: generateSampleData(),
    };

    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * Full preset - all interaction features
 * Good for graph editors and interactive applications
 */
export const FullPreset: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-full';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-full');
    if (!container) return;

    // ✅ SERIALIZABLE - Uses 'full' preset
    const options: CanvasOptions = {
      container,
      behavior: 'full',  // All interaction plugins
      data: generateSampleData(),
    };

    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * Pattern 4: Behavior + Custom Override
 * Start with a preset and add/configure additional plugins
 */
export const BehaviorWithCustomPlugins: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-custom';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-custom');
    if (!container) return;

    // ✅ FULLY SERIALIZABLE - Pattern 4
    const options: CanvasOptions = {
      container,
      behavior: 'default',  // Start with default interactions
      plugins: [
        // Add background plugin with string ID
        {
          plugin: 'background',
          options: {
            type: 'pattern',
            patternType: 'dots',
            color: '#cccccc',
            backgroundColor: '#ffffff',
            size: 2,
            spacing: 20,
          },
        },
      ],
      data: generateSampleData(),
    };

    const canvas = new Canvas(options);
    await canvas.init();
  },
};

/**
 * Custom plugins only - no preset
 * Maximum control over which plugins are loaded
 */
export const CustomPluginsOnly: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-custom-only';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-custom-only');
    if (!container) return;

    // ✅ SERIALIZABLE - Just string IDs (when plugins exist)
    const options: CanvasOptions = {
      container,
      // Note: These plugins don't exist yet, so this will log errors
      // but demonstrates the serializable API
      plugins: [
        // 'drag-element',  // Will be available soon
        // 'zoom-control',  // Will be available soon
        'background',  // This exists!
      ],
      data: generateSampleData(),
    };

    const canvas = new Canvas(options);
    await canvas.init();
  },
};
