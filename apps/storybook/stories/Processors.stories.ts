import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface ProcessorsArgs {
  enableClickEvents: boolean;
  enableHoverEvents: boolean;
}

const generateGraphData = (): CanvasData => ({
  nodes: [
    { id: 'n1', x: -100, y: 0, shape: 'circle', size: 40, label: 'Click Me', style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 } },
    { id: 'n2', x: 100, y: 0, shape: 'rect', width: 80, height: 50, cornerRadius: 8, label: 'Or Me', style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 } },
    { id: 'n3', x: 0, y: -100, shape: 'hexagon', size: 35, label: 'Hover', style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 } },
  ],
  edges: [
    { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier', arrowTarget: 'triangle', style: { stroke: '#666', strokeWidth: 2 } },
    { id: 'e2', source: 'n1', target: 'n3', pathType: 'bezier', arrowTarget: 'triangle', style: { stroke: '#666', strokeWidth: 2 } },
  ],
});

const createEventHandlingDemo = (args: ProcessorsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Event Handling</strong> - Node click and hover events';
  wrapper.appendChild(info);

  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '12px';
  controls.innerHTML = `
    <label><input type="checkbox" id="click-events" ${args.enableClickEvents ? 'checked' : ''}> Click Events</label>
    <label><input type="checkbox" id="hover-events" ${args.enableHoverEvents ? 'checked' : ''}> Hover Events</label>
    <button id="clear-log">Clear Log</button>
  `;
  wrapper.appendChild(controls);

  const output = document.createElement('pre');
  output.style.padding = '10px';
  output.style.backgroundColor = '#1a1a2e';
  output.style.color = '#00ff88';
  output.style.fontSize = '11px';
  output.style.fontFamily = 'monospace';
  output.style.maxHeight = '150px';
  output.style.overflow = 'auto';
  output.id = 'event-log';
  output.textContent = 'Event log will appear here...\\n';
  wrapper.appendChild(output);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '350px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 350,
      backgroundColor: '#f5f5f5',
      data: generateGraphData(),
    });

    await canvas.init();
    canvas.render();

    const log = (msg: string) => {
      const out = document.getElementById('event-log');
      if (out) {
        const timestamp = new Date().toISOString().slice(11, 23);
        out.textContent += `[${timestamp}] ${msg}\\n`;
        out.scrollTop = out.scrollHeight;
      }
    };

    let clickEnabled = args.enableClickEvents;
    let hoverEnabled = args.enableHoverEvents;

    // Set up event handlers on nodes using Canvas API
    canvas.getNodes().forEach((node) => {
      node.on('pointerdown', () => {
        if (clickEnabled) {
          log(`Click: ${node.id}`);
          // Visual feedback
          canvas.updateNode(node.id, { 
            style: { strokeWidth: 4, stroke: '#ff0000' }
          });
          setTimeout(() => {
            canvas.updateNode(node.id, { 
              style: { strokeWidth: 2, stroke: '#333' }
            });
          }, 300);
        }
      });

      node.on('pointerover', () => {
        if (hoverEnabled) {
          log(`Hover: ${node.id}`);
        }
      });

      node.on('pointerout', () => {
        if (hoverEnabled) {
          log(`Leave: ${node.id}`);
        }
      });
    });

    // Set up edge event handlers
    canvas.getEdges().forEach((edge) => {
      edge.on('pointerdown', () => {
        if (clickEnabled) {
          log(`Click edge: ${edge.id}`);
        }
      });
    });

    // Control handlers
    document.getElementById('click-events')?.addEventListener('change', (e) => {
      clickEnabled = (e.target as HTMLInputElement).checked;
      log(`Click events: ${clickEnabled ? 'enabled' : 'disabled'}`);
    });

    document.getElementById('hover-events')?.addEventListener('change', (e) => {
      hoverEnabled = (e.target as HTMLInputElement).checked;
      log(`Hover events: ${hoverEnabled ? 'enabled' : 'disabled'}`);
    });

    document.getElementById('clear-log')?.addEventListener('click', () => {
      const out = document.getElementById('event-log');
      if (out) out.textContent = 'Log cleared\\n';
    });
  });

  return wrapper;
};

const createSelectionDemo = (): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Selection</strong> - Click nodes to select/deselect';
  wrapper.appendChild(info);

  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '12px';
  controls.innerHTML = `
    <button id="select-all">Select All</button>
    <button id="deselect-all">Deselect All</button>
    <span style="margin-left: 20px; font-size: 12px;" id="selection-info">Selected: 0</span>
  `;
  wrapper.appendChild(controls);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '500px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 500,
      backgroundColor: '#f5f5f5',
      data: {
        nodes: [
          { id: 'n1', x: -150, y: -80, shape: 'circle', size: 40, label: 'Node 1', style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 } },
          { id: 'n2', x: 0, y: -80, shape: 'circle', size: 40, label: 'Node 2', style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 } },
          { id: 'n3', x: 150, y: -80, shape: 'circle', size: 40, label: 'Node 3', style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 } },
          { id: 'n4', x: -75, y: 60, shape: 'rect', width: 80, height: 50, cornerRadius: 8, label: 'Node 4', style: { fill: '#ffd93d', stroke: '#333', strokeWidth: 2 } },
          { id: 'n5', x: 75, y: 60, shape: 'rect', width: 80, height: 50, cornerRadius: 8, label: 'Node 5', style: { fill: '#9b59b6', stroke: '#333', strokeWidth: 2 } },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', pathType: 'line', style: { stroke: '#666', strokeWidth: 2 } },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'line', style: { stroke: '#666', strokeWidth: 2 } },
          { id: 'e3', source: 'n1', target: 'n4', pathType: 'bezier', arrowTarget: 'triangle', style: { stroke: '#666', strokeWidth: 2 } },
          { id: 'e4', source: 'n3', target: 'n5', pathType: 'bezier', arrowTarget: 'triangle', style: { stroke: '#666', strokeWidth: 2 } },
        ],
      },
    });

    await canvas.init();
    canvas.render();

    const selected = new Set<string>();
    const originalStyles = new Map<string, any>();

    // Store original styles
    canvas.getNodes().forEach((node) => {
      originalStyles.set(node.id, { ...node.nodeStyle });
    });

    const updateSelectionInfo = () => {
      const info = document.getElementById('selection-info');
      if (info) {
        info.textContent = `Selected: ${selected.size}`;
      }
    };

    const selectNode = (id: string) => {
      selected.add(id);
      canvas.updateNode(id, { 
        style: { stroke: '#ff0000', strokeWidth: 4 }
      });
      updateSelectionInfo();
    };

    const deselectNode = (id: string) => {
      selected.delete(id);
      const original = originalStyles.get(id);
      if (original) {
        canvas.updateNode(id, original);
      }
      updateSelectionInfo();
    };

    // Node click handlers
    canvas.getNodes().forEach((node) => {
      node.on('pointerdown', () => {
        if (selected.has(node.id)) {
          deselectNode(node.id);
        } else {
          selectNode(node.id);
        }
      });
    });

    // Control handlers
    document.getElementById('select-all')?.addEventListener('click', () => {
      canvas.getNodes().forEach((node) => {
        if (!selected.has(node.id)) {
          selectNode(node.id);
        }
      });
    });

    document.getElementById('deselect-all')?.addEventListener('click', () => {
      Array.from(selected).forEach((id) => {
        deselectNode(id);
      });
    });
  });

  return wrapper;
};

const meta: Meta<ProcessorsArgs> = {
  title: 'Core/Events',
  render: (args) => createEventHandlingDemo(args),
  argTypes: {
    enableClickEvents: { control: 'boolean' },
    enableHoverEvents: { control: 'boolean' },
  },
  args: {
    enableClickEvents: true,
    enableHoverEvents: true,
  },
};

export default meta;

type Story = StoryObj<ProcessorsArgs>;

export const EventHandling: Story = {};

export const Selection: Story = {
  render: () => createSelectionDemo(),
};
