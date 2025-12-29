import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeStates } from '@invana/canvas-core';

const meta: Meta = {
  title: 'Elements/Nodes/States',
};

export default meta;
type Story = StoryObj;

/**
 * Basic example showing default, hovered, and selected states
 */
export const BasicStates: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
      });

      await canvas.init();

    // Add nodes with state-based styling
    canvas.addNode({
      id: 'node1',
      x: 200,
      y: 150,
      label: 'Hover Me',
      shape: 'rect',
      width: 120,
      height: 60,
      cornerRadius: 8,
      style: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        // states: {
        //   hovered: {
        //     fill: 0x40a9ff,
        //     stroke: '#096dd9',
        //     strokeWidth: 3,
        //   },
        //   selected: {
        //     fill: 0xff4d4f,
        //     stroke: '#ffffff',
        //     strokeWidth: 4,
        //   },
        // },
      },
    });

    canvas.addNode({
      id: 'node2',
      x: 400,
      y: 150,
      label: 'Click Me',
      shape: 'circle',
      size: 40,
      style: {
        fill: 0x52c41a,
        stroke: '#389e0d',
        strokeWidth: 2,
        // states: {
        //   hovered: {
        //     fill: 0x73d13d,
        //   },
        //   selected: {
        //     fill: 0xfaad14,
        //     stroke: '#ffffff',
        //     strokeWidth: 4,
        //   },
        // },
      },
    });

    canvas.addNode({
      id: 'node3',
      x: 600,
      y: 150,
      label: 'Pre-selected',
      shape: 'rect',
      width: 120,
      height: 60,
      cornerRadius: 8,
      style: {
        fill: 0x722ed1,
        stroke: '#531dab',
        strokeWidth: 2,
        // states: {
        //   hovered: {
        //     fill: 0x9254de,
        //   },
        //   selected: {
        //     fill: 0xf759ab,
        //     stroke: '#ffffff',
        //     strokeWidth: 4,
        //   },
        // },
      },
    });
    

    });

    return container;
  },
};

/**
 * Example showing custom states like loading, error, and warning
 */
export const CustomStates: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
      });

      await canvas.init();

    // Add nodes with custom state styling
    canvas.addNode({
      id: 'normal',
      x: 150,
      y: 150,
      label: 'Normal',
      shape: 'rect',
      width: 100,
      height: 60,
      cornerRadius: 8,
      style: {
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
          },
        },
      },
    });

    canvas.addNode({
      id: 'loading',
      x: 300,
      y: 150,
      label: 'Loading...',
      shape: 'rect',
      width: 100,
      height: 60,
      cornerRadius: 8,
      style: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        states: {
          loading: {
            fill: 0x8c8c8c,
          },
        },
      },
    });
    
    canvas.addNode({
      id: 'error',
      x: 450,
      y: 150,
      label: 'Error',
      shape: 'rect',
      width: 100,
      height: 60,
      cornerRadius: 8,
      style: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        states: {
          error: {
            fill: 0xff4d4f,
            stroke: '#cf1322',
            strokeWidth: 3,
          },
        },
      },
    });

    canvas.addNode({
      id: 'warning',
      x: 600,
      y: 150,
      label: 'Warning',
      shape: 'rect',
      width: 100,
      height: 60,
      cornerRadius: 8,
      style: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        states: {
          warning: {
            fill: 0xfaad14,
            stroke: '#d48806',
            strokeWidth: 3,
          },
        },
      },
    });
    
    // Get node references and set their states
    const normalNode = canvas.getNode('normal');
    const loadingNode = canvas.getNode('loading');
    const errorNode = canvas.getNode('error');
    const warningNode = canvas.getNode('warning');
    
    loadingNode.setState(NodeStates.LOADING, true);
    errorNode.setState(NodeStates.ERROR, true);
    warningNode.setState(NodeStates.WARNING, true);

    // Add buttons to toggle states
    const controls = document.createElement('div');
    controls.style.marginTop = '20px';
    controls.style.padding = '15px';
    controls.style.backgroundColor = '#f0f0f0';
    controls.style.borderRadius = '4px';
    
    const buttonStyle = `
      padding: 8px 16px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;

    controls.innerHTML = `
      <h4 style="margin-top: 0">Toggle states on "Normal" node:</h4>
      <button id="btn-loading" style="${buttonStyle} background: #8c8c8c; color: white;">Loading</button>
      <button id="btn-error" style="${buttonStyle} background: #ff4d4f; color: white;">Error</button>
      <button id="btn-warning" style="${buttonStyle} background: #faad14; color: white;">Warning</button>
      <button id="btn-clear" style="${buttonStyle} background: #1890ff; color: white;">Clear States</button>
      <div id="state-info" style="margin-top: 10px; font-family: monospace; font-size: 12px;"></div>
    `;

    const updateStateInfo = () => {
      const states = normalNode.getActiveStates();
      const info = document.getElementById('state-info');
      if (info) {
        info.textContent = `Active states: [${states.join(', ')}]`;
      }
    };

    controls.querySelector('#btn-loading')?.addEventListener('click', () => {
      const isActive = normalNode.getState(NodeStates.LOADING);
      normalNode.setState(NodeStates.LOADING, !isActive);
      updateStateInfo();
    });

    controls.querySelector('#btn-error')?.addEventListener('click', () => {
      const isActive = normalNode.getState(NodeStates.ERROR);
      normalNode.setState(NodeStates.ERROR, !isActive);
      updateStateInfo();
    });

    controls.querySelector('#btn-warning')?.addEventListener('click', () => {
      const isActive = normalNode.getState(NodeStates.WARNING);
      normalNode.setState(NodeStates.WARNING, !isActive);
      updateStateInfo();
    });

    controls.querySelector('#btn-clear')?.addEventListener('click', () => {
      normalNode.clearStates([NodeStates.LOADING, NodeStates.ERROR, NodeStates.WARNING]);
      updateStateInfo();
    });

      updateStateInfo();
      container.appendChild(controls);
    });

    return container;
  },
};

/**
 * Example showing multiple states active simultaneously with proper priority
 */
export const MultipleStates: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
      });

      await canvas.init();

    canvas.addNode({
      id: 'multi',
      x: 400,
      y: 200,
      label: 'Multi-State Node',
      shape: 'rect',
      width: 140,
      height: 80,
      cornerRadius: 8,
      style: {
        fill: 0x1890ff,
        stroke: '#0050b3',
        strokeWidth: 2,
        states: {
          hovered: {
            fill: 0x40a9ff,
            strokeWidth: 3,
          },
          selected: {
            stroke: '#ffffff',
            strokeWidth: 4,
          },
          loading: {
          },
          error: {
            fill: 0xff4d4f,
          },
        },
      },
    });
    
    // Get node reference
    const node = canvas.getNode('multi');

    const info = document.createElement('div');
    info.style.marginTop = '20px';
    info.style.padding = '15px';
    info.style.backgroundColor = '#f0f0f0';
    info.style.borderRadius = '4px';
    
    const buttonStyle = `
      padding: 8px 16px;
      margin: 5px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    `;

    info.innerHTML = `
      <h4 style="margin-top: 0">Combine multiple states:</h4>
      <div>
        <label><input type="checkbox" id="cb-selected"> Selected</label>
        <label><input type="checkbox" id="cb-loading" style="margin-left: 15px"> Loading</label>
        <label><input type="checkbox" id="cb-error" style="margin-left: 15px"> Error</label>
      </div>
      <div id="multi-state-info" style="margin-top: 10px; font-family: monospace; font-size: 12px;"></div>
      <div style="margin-top: 10px; color: #666; font-size: 13px;">
        <strong>Priority:</strong> default → hovered → selected → error → loading<br>
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

    info.querySelector('#cb-selected')?.addEventListener('change', (e) => {
      node.setState(NodeStates.SELECTED, (e.target as HTMLInputElement).checked);
      updateInfo();
    });

    info.querySelector('#cb-loading')?.addEventListener('change', (e) => {
      node.setState(NodeStates.LOADING, (e.target as HTMLInputElement).checked);
      updateInfo();
    });

    info.querySelector('#cb-error')?.addEventListener('change', (e) => {
      node.setState(NodeStates.ERROR, (e.target as HTMLInputElement).checked);
      updateInfo();
    });

      updateInfo();
      container.appendChild(info);
    });

    return container;
  },
};
