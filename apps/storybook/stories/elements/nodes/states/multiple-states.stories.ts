import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasNode,
   CanvasOptions, NodeStates } from '@invana/canvas-core';
import { getFullHeightContainer } from '../../../../src/div-utils';

const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;


/**
 * Example showing multiple states active simultaneously with proper priority
 */
export const MultipleStates: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = getFullHeightContainer();
    container.id = 'canvas-multiple-states';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-multiple-states');
    if (!container) return;
    container.style.height = "500px";

     const nodes: CanvasNode[] = [{
      id: 'multi',
      x: 400,
      y: 200,
      label: 'Multi-State Node',
      shape: 'rect',
      width: 140,
      height: 80,
      cornerRadius: 8,
    }]

    const options: CanvasOptions = {
      container,
      styles: {
        node: {
          fill: 0x1890ff,
          stroke: '#0050b3',
          strokeWidth: 2,
          states: {
            loading: {
              fill: 0x8c8c8c,
            },
            error: {
              fill: 0xff4d4f,
              stroke: '#cf1322',
              strokeWidth: 3,
            },
            warning: {
              fill: 0xfaad14,
              stroke: '#d48806',
              strokeWidth: 3,
            }
          },
        },
      },
      data: { nodes: nodes, edges: [] },
    };
    const canvas = new Canvas(options);
    await canvas.init();

    
    // Get node reference
    const node = canvas.getNode('multi');

    const info = document.createElement('div');
    info.style.marginTop = '20px';
    info.style.padding = '15px';
    info.style.backgroundColor = '#f0f0f0';
    info.style.borderRadius = '4px';

    info.innerHTML = `
      <h4 style="margin-top: 0">Combine multiple states:</h4>
      <div>
        <label><input type="checkbox" id="cb-selected"> Selected</label>
        <label><input type="checkbox" id="cb-highlighted" style="margin-left: 15px"> highlighted</label>
        <label><input type="checkbox" id="cb-loading" style="margin-left: 15px"> Loading</label>
        <label><input type="checkbox" id="cb-error" style="margin-left: 15px"> Error</label>
      </div>
      <div id="multi-state-info" style="margin-top: 10px; font-family: monospace; font-size: 12px;"></div>
      <div style="margin-top: 10px; color: #666; font-size: 13px;">
        <strong>Priority:</strong> default → highlighted → selected → error → loading<br>
        Later states override earlier ones. Try selecting + loading + error to see how they combine.
      </div>
    `;

    const updateInfo = () => {
      const states = node.getActiveStates();
      const infoEl = document.getElementById('multi-state-info');
      if (infoEl) {
        infoEl.textContent = `Active states: [${states.join(', ')}]`;
      }
    };

    info.querySelector('#cb-highlighted')?.addEventListener('change', (e) => {
      node.setState(NodeStates.HIGHLIGHTED, (e.target as HTMLInputElement).checked);
      updateInfo();
    });

    info.querySelector('#cb-selected')?.addEventListener('change', (e) => {
      node.setState(NodeStates.SELECTED, (e.target as HTMLInputElement).checked);
      updateInfo();
    });

    info.querySelector('#cb-loading')?.addEventListener('change', (e) => {
      node.setState("loading", (e.target as HTMLInputElement).checked);
      updateInfo();
    });

    info.querySelector('#cb-error')?.addEventListener('change', (e) => {
      node.setState("error", (e.target as HTMLInputElement).checked);
      updateInfo();
    });

    updateInfo();
    container.appendChild(info);
  },
};