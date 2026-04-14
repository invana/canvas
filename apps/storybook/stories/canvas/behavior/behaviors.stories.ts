import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin, PluginRegistry, type CanvasNode } from '@invana/canvas-core';
import GUI from 'lil-gui';
import { createContainer, createDescriptionPanel } from '../../../src/div-utils';

if (!PluginRegistry.has('graph-data')) {
  PluginRegistry.register('graph-data', GraphDataPlugin);
}

const meta: Meta = {
  title: 'Canvas/Options',
};

export default meta;
type Story = StoryObj;

/**
 * Helper function to create sample nodes
 */
function createSampleNodes(): CanvasNode[] {
  return [
    { id: 'node1', x: -100, y: -80, label: 'Node 1', shape: 'rect', width: 80, height: 50 },
    { id: 'node2', x: 100, y: -80, label: 'Node 2', shape: 'circle', width: 60, height: 60 },
    { id: 'node3', x: 0, y: 50, label: 'Node 3', shape: 'diamond', width: 70, height: 70 },
    { id: 'node4', x: -150, y: 150, label: 'Node 4', shape: 'hexagon', size: 45 },
    { id: 'node5', x: 150, y: 150, label: 'Node 5', shape: 'triangle', size: 50 },
  ];
}

/**
 * Behavior configuration descriptions
 */
const behaviorDescriptions = {
  'false': 'No interactions - completely static visualization. Pan/zoom via viewport only.',
  'minimal': 'Hover effects only - good for tooltips and highlighting. Pan/zoom via viewport.',
  'default': 'Common interactions - drag nodes, hover effects, click to select. Pan/zoom via viewport.',
  'full': 'All features - drag, hover, select, focus, multi-select (Shift+click). Pan/zoom via viewport.',
};

/**
 * Interactive behavior switcher with a live control panel.
 * 
 * This story demonstrates all behavior options in a single canvas:
 * - **No Behavior (false)**: Completely static - no interactions
 * - **Minimal**: Only hover effects enabled
 * - **Default**: Common interactions - drag nodes, hover, click to select
 * - **Full**: All features - drag, hover, select, focus, multi-select (Shift+click)
 * 
 * Use the GUI panel to switch between different behavior modes and see the changes in real-time.
 */
export const InteractiveBehaviorSwitcher: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = createContainer({ height: "800px", id: 'behavior-switcher-container' });
    container.style.backgroundColor = "#f5f5f5";
    
    return container;
  },
  play: async () => {
    const container = document.getElementById('behavior-switcher-container');
    if (!container) return;

    // Create info panel
    let infoPanel = createDescriptionPanel({
      text: `<strong style="display: block; margin-bottom: 8px; color: #1890ff;">Current Behavior: Default</strong>
             <div id="behavior-description" style="color: #666; line-height: 1.5;">${behaviorDescriptions.default}</div>`,
      position: 'top-left',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      textColor: '#333',
      padding: '15px',
      fontSize: '14px',
      maxWidth: '350px',
    });
    infoPanel.id = 'info-panel';
    container.appendChild(infoPanel);

    // Color themes for each behavior type
    const colorThemes = {
      'false': { fill: 0x95de64, stroke: '#52c41a', name: 'No Behavior' },
      'minimal': { fill: 0x69c0ff, stroke: '#1890ff', name: 'Minimal' },
      'default': { fill: 0xffd666, stroke: '#faad14', name: 'Default' },
      'full': { fill: 0xff9c6e, stroke: '#ff7a45', name: 'Full' },
    };

    // Create canvas with default behavior
    const canvas = new Canvas({
      container: container,
      behavior: 'default',
      plugins: [
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            data: { nodes: createSampleNodes(), edges: [] },
            styles: {
              node: {
                fill: colorThemes.default.fill,
                stroke: colorThemes.default.stroke,
                strokeWidth: 2,
              },
            },
            fitOnRender: true,
            fitPadding: 80,
          },
        },
      ],
    });
    await canvas.init();

    // Create GUI controls
    const gui = new GUI({ title: 'Behavior Controls' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';
    gui.domElement.style.zIndex = '1000';
    container.appendChild(gui.domElement);

    const settings = { 
      behavior: 'default',
    };

    gui.add(settings, 'behavior', ['false', 'minimal', 'default', 'full'])
      .name('Behavior Mode')
      .onChange((value: string) => {
        console.log('Switching to behavior:', value);
        
        const behaviorValue = value === 'false' ? false : value as 'minimal' | 'default' | 'full';
        const theme = colorThemes[value as keyof typeof colorThemes];
        
        // Update behavior and styles using setOptions - smooth transition without recreating canvas
        canvas.setOptions({ 
          behavior: behaviorValue,
          plugins: [
            {
              plugin: 'graph-data',
              key: 'graph',
              options: {
                styles: {
                  node: {
                    fill: theme.fill,
                    stroke: theme.stroke,
                    strokeWidth: 2,
                  },
                },
              },
            },
          ],
        });
        
        // Update info panel
        const infoTitle = container.querySelector('#info-panel strong');
        const infoDesc = container.querySelector('#behavior-description');
        if (infoTitle) {
          infoTitle.textContent = `Current Behavior: ${theme.name}`;
        }
        if (infoDesc) {
          infoDesc.textContent = behaviorDescriptions[value as keyof typeof behaviorDescriptions];
        }
      });

    // Add instructions
    const instructions = gui.addFolder('Instructions');
    instructions.close();
    
    const instructionsEl = document.createElement('div');
    instructionsEl.style.padding = '10px';
    instructionsEl.style.fontSize = '12px';
    instructionsEl.style.lineHeight = '1.6';
    instructionsEl.style.color = '#666';
    instructionsEl.innerHTML = `
      <strong>Try these interactions:</strong><br>
      • <strong>No Behavior:</strong> Nothing works<br>
      • <strong>Minimal:</strong> Hover over nodes<br>
      • <strong>Default:</strong> Drag nodes, click to select<br>
      • <strong>Full:</strong> All of the above + Shift+click for multi-select
    `;
    instructions.$children.appendChild(instructionsEl);
  },
};

