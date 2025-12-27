import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeStates, EdgeStates } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'State Management/Beautiful Examples',
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
# Beautiful State Management Examples

Comprehensive examples demonstrating the power and flexibility of the state management system.

## Node States
- Interactive hover, selection, and drag states
- Status indicators: loading, error, warning, success
- Custom domain-specific states

## Edge States  
- Dynamic edge styling based on connection state
- Highlighted paths and active connections
- Error and disabled edge states

## Combined Examples
- Nodes and edges working together
- Multi-state combinations
- Real-world workflow scenarios
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Interactive showcase of all built-in node states with beautiful styling
 */
export const NodeStateShowcase: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '700px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 1000,
        height: 600,
      });

      await canvas.init();

      // Row 1: Interactive States
      canvas.addNode({
        data: { id: 'default', x: 120, y: 100, label: 'Default', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            hovered: { fill: 0x40a9ff, strokeWidth: 3 },
          },
        },
      });

      canvas.addNode({
        data: { id: 'selected', x: 260, y: 100, label: 'Selected', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            selected: { fill: 0x722ed1, stroke: 0xffffff, strokeWidth: 4 },
            hovered: { fill: 0x40a9ff },
          },
        },
      });

      canvas.addNode({
        data: { id: 'hovered', x: 400, y: 100, label: 'Hover Me!', shape: 'circle' },
        style: {
          fill: 0x52c41a,
          stroke: 0x389e0d,
          strokeWidth: 2,
          radius: 35,
          states: {
            hovered: { 
              fill: 0x95de64, 
              stroke: 0xffffff,
              radius: 42,
              strokeWidth: 3,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'dragging', x: 540, y: 100, label: 'Dragging', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            dragging: { 
              fill: 0x40a9ff, 
              opacity: 0.7,
              strokeWidth: 3,
              strokeStyle: 'dashed' as any,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'focused', x: 680, y: 100, label: 'Focused', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            focused: {
              stroke: 0xfaad14,
              strokeWidth: 4,
              strokeStyle: 'solid' as any,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'highlighted', x: 820, y: 100, label: 'Highlight', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            highlighted: {
              fill: 0xfff566,
              stroke: 0xffec3d,
              strokeWidth: 3,
            },
          },
        },
      });

      // Row 2: Status States
      canvas.addNode({
        data: { id: 'loading', x: 120, y: 250, label: 'Loading...', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            loading: {
              fill: 0x8c8c8c,
              stroke: 0x595959,
              opacity: 0.6,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'error', x: 260, y: 250, label: 'Error', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            error: {
              fill: 0xff4d4f,
              stroke: 0xcf1322,
              strokeWidth: 4,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'warning', x: 400, y: 250, label: 'Warning', shape: 'triangle' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          radius: 35,
          states: {
            warning: {
              fill: 0xfaad14,
              stroke: 0xd48806,
              strokeWidth: 4,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'success', x: 540, y: 250, label: 'Success', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            success: {
              fill: 0x52c41a,
              stroke: 0x389e0d,
              strokeWidth: 3,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'disabled', x: 680, y: 250, label: 'Disabled', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            disabled: {
              fill: 0xd9d9d9,
              stroke: 0x8c8c8c,
              opacity: 0.4,
            },
          },
        },
      });

      canvas.addNode({
        data: { id: 'active', x: 820, y: 250, label: 'Active', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 100,
          height: 60,
          cornerRadius: 8,
          states: {
            active: {
              fill: 0x13c2c2,
              stroke: 0x08979c,
              strokeWidth: 3,
            },
          },
        },
      });

      // Apply states
      canvas.getNode('selected')?.setState(NodeStates.SELECTED, true);
      canvas.getNode('dragging')?.setState(NodeStates.DRAGGING, true);
      canvas.getNode('focused')?.setState(NodeStates.FOCUSED, true);
      canvas.getNode('highlighted')?.setState(NodeStates.HIGHLIGHTED, true);
      canvas.getNode('loading')?.setState(NodeStates.LOADING, true);
      canvas.getNode('error')?.setState(NodeStates.ERROR, true);
      canvas.getNode('warning')?.setState(NodeStates.WARNING, true);
      canvas.getNode('success')?.setState(NodeStates.SUCCESS, true);
      canvas.getNode('disabled')?.setState(NodeStates.DISABLED, true);
      canvas.getNode('active')?.setState(NodeStates.ACTIVE, true);

      // Add info panel
      const info = document.createElement('div');
      info.style.marginTop = '20px';
      info.style.padding = '20px';
      info.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      info.style.color = 'white';
      info.style.borderRadius = '12px';
      info.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      info.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 20px;">🎨 Node State Showcase</h3>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
          <div><strong>Row 1:</strong> Interactive states (hover, select, drag, focus, highlight)</div>
          <div><strong>Row 2:</strong> Status states (loading, error, warning, success, disabled, active)</div>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 13px;">
          💡 <strong>Tip:</strong> Try hovering over "Default" and "Hover Me!" nodes to see state transitions in action!
        </div>
      `;
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Beautiful edge state examples showing different connection states
 */
export const EdgeStateShowcase: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '700px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 1000,
        height: 600,
      });

      await canvas.init();

      // Create a grid of nodes
      const nodes = [
        { id: 'n1', x: 150, y: 150, label: 'Start' },
        { id: 'n2', x: 400, y: 150, label: 'Node 2' },
        { id: 'n3', x: 650, y: 150, label: 'Node 3' },
        { id: 'n4', x: 150, y: 350, label: 'Node 4' },
        { id: 'n5', x: 400, y: 350, label: 'Node 5' },
        { id: 'n6', x: 650, y: 350, label: 'End' },
      ];

      nodes.forEach(node => {
        canvas.addNode({
          data: { ...node, shape: 'circle' },
          style: {
            fill: 0x1890ff,
            stroke: 0x0050b3,
            strokeWidth: 2,
            radius: 35,
            states: {
              hovered: { fill: 0x40a9ff, radius: 38 },
              selected: { fill: 0x722ed1, stroke: 0xffffff, strokeWidth: 4 },
            },
          },
        });
      });

      // Default edge
      canvas.addEdge({
        data: {
          id: 'e1',
          source: { x: 185, y: 150 },
          target: { x: 365, y: 150 },
          label: 'default',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          states: {
            hovered: { stroke: '#1890ff', strokeWidth: 3 },
          },
        },
      });

      // Selected edge
      canvas.addEdge({
        data: {
          id: 'e2',
          source: { x: 435, y: 150 },
          target: { x: 615, y: 150 },
          label: 'selected',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          states: {
            selected: { 
              stroke: '#722ed1', 
              strokeWidth: 4,
            },
            hovered: { stroke: '#1890ff', strokeWidth: 3 },
          },
        },
      });

      // Highlighted edge
      canvas.addEdge({
        data: {
          id: 'e3',
          source: { x: 150, y: 185 },
          target: { x: 150, y: 315 },
          label: 'highlight',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          states: {
            highlighted: {
              stroke: '#faad14',
              strokeWidth: 4,
            },
          },
        },
      });

      // Active edge (animated dashes)
      canvas.addEdge({
        data: {
          id: 'e4',
          source: { x: 400, y: 185 },
          target: { x: 400, y: 315 },
          label: 'active',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          strokeStyle: 'solid',
          states: {
            active: {
              stroke: '#13c2c2',
              strokeWidth: 3,
              strokeStyle: 'dashed',
            },
          },
        },
      });

      // Error edge
      canvas.addEdge({
        data: {
          id: 'e5',
          source: { x: 650, y: 185 },
          target: { x: 650, y: 315 },
          label: 'error',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          states: {
            error: {
              stroke: '#ff4d4f',
              strokeWidth: 4,
              strokeStyle: 'dashed',
            },
          },
        },
      });

      // Disabled edge
      canvas.addEdge({
        data: {
          id: 'e6',
          source: { x: 185, y: 350 },
          target: { x: 365, y: 350 },
          label: 'disabled',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          states: {
            disabled: {
              stroke: '#d9d9d9',
              strokeWidth: 1,
              strokeAlpha: 0.4,
            },
          },
        },
      });

      // Hovered edge (will change on hover)
      canvas.addEdge({
        data: {
          id: 'e7',
          source: { x: 435, y: 350 },
          target: { x: 615, y: 350 },
          label: 'hover me!',
          pathType: 'line',
        },
        style: {
          stroke: '#8c8c8c',
          strokeWidth: 2,
          states: {
            hovered: { 
              stroke: '#52c41a', 
              strokeWidth: 5,
            },
          },
        },
      });

      // Apply edge states
      canvas.getEdge('e2')?.setState(EdgeStates.SELECTED, true);
      canvas.getEdge('e3')?.setState(EdgeStates.HIGHLIGHTED, true);
      canvas.getEdge('e4')?.setState(EdgeStates.ACTIVE, true);
      canvas.getEdge('e5')?.setState(EdgeStates.ERROR, true);
      canvas.getEdge('e6')?.setState(EdgeStates.DISABLED, true);

      // Add beautiful info panel
      const info = document.createElement('div');
      info.style.marginTop = '20px';
      info.style.padding = '20px';
      info.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      info.style.color = 'white';
      info.style.borderRadius = '12px';
      info.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
      info.innerHTML = `
        <h3 style="margin: 0 0 15px 0; font-size: 20px;">🔗 Edge State Showcase</h3>
        <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; font-size: 13px;">
          <div><span style="opacity: 0.8">●</span> <strong>Default:</strong> Standard edge</div>
          <div><span style="opacity: 0.8">●</span> <strong>Selected:</strong> User selection</div>
          <div><span style="opacity: 0.8">●</span> <strong>Highlighted:</strong> Attention needed</div>
          <div><span style="opacity: 0.8">●</span> <strong>Active:</strong> Currently processing</div>
          <div><span style="opacity: 0.8">●</span> <strong>Error:</strong> Connection failed</div>
          <div><span style="opacity: 0.8">●</span> <strong>Disabled:</strong> Inactive path</div>
        </div>
        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(255,255,255,0.3); font-size: 13px;">
          💡 <strong>Tip:</strong> Hover over the bottom-right edge to see the hover state effect!
        </div>
      `;
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Real-world workflow example: Data pipeline with status tracking
 */
export const WorkflowExample: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '800px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 1000,
        height: 650,
      });

      await canvas.init();

      // Pipeline nodes
      const pipelineNodes = [
        { id: 'input', x: 150, y: 200, label: 'Input', state: 'success' },
        { id: 'validate', x: 350, y: 200, label: 'Validate', state: 'loading' },
        { id: 'transform', x: 550, y: 200, label: 'Transform', state: 'default' },
        { id: 'output', x: 750, y: 200, label: 'Output', state: 'default' },
        { id: 'error-handler', x: 550, y: 380, label: 'Error', state: 'error' },
      ];

      pipelineNodes.forEach(node => {
        canvas.addNode({
          data: { id: node.id, x: node.x, y: node.y, label: node.label, shape: 'rect' },
          style: {
            fill: 0x1890ff,
            stroke: 0x0050b3,
            strokeWidth: 2,
            width: 120,
            height: 60,
            cornerRadius: 8,
            states: {
              success: {
                fill: 0x52c41a,
                stroke: 0x389e0d,
                strokeWidth: 3,
              },
              loading: {
                fill: 0xfaad14,
                stroke: 0xd48806,
                strokeWidth: 3,
                opacity: 0.8,
              },
              error: {
                fill: 0xff4d4f,
                stroke: 0xcf1322,
                strokeWidth: 3,
              },
              disabled: {
                fill: 0xd9d9d9,
                stroke: 0x8c8c8c,
                opacity: 0.5,
              },
              selected: {
                stroke: 0xffffff,
                strokeWidth: 4,
              },
              hovered: {
                fill: 0x40a9ff,
                strokeWidth: 3,
              },
            },
          },
        });

        // Apply initial state
        if (node.state !== 'default') {
          canvas.getNode(node.id)?.setState(node.state as any, true);
        }
      });

      // Pipeline edges
      const edges = [
        { id: 'e1', from: 'input', to: 'validate', state: 'active' },
        { id: 'e2', from: 'validate', to: 'transform', state: 'default' },
        { id: 'e3', from: 'transform', to: 'output', state: 'disabled' },
        { id: 'e4', from: 'validate', to: 'error-handler', state: 'error' },
      ];

      edges.forEach(edge => {
        const fromNode = canvas.getNode(edge.from);
        const toNode = canvas.getNode(edge.to);
        if (fromNode && toNode) {
          const fromX = fromNode.x + (edge.id === 'e4' ? 60 : 120);
          const fromY = fromNode.y + (edge.id === 'e4' ? 60 : 30);
          const toX = toNode.x + (edge.id === 'e4' ? 60 : 0);
          const toY = toNode.y + (edge.id === 'e4' ? 0 : 30);

          canvas.addEdge({
            data: {
              id: edge.id,
              source: { x: fromX, y: fromY },
              target: { x: toX, y: toY },
              pathType: 'line',
            },
            style: {
              stroke: '#8c8c8c',
              strokeWidth: 2,
              states: {
                active: {
                  stroke: '#13c2c2',
                  strokeWidth: 3,
                },
                error: {
                  stroke: '#ff4d4f',
                  strokeWidth: 3,
                  strokeStyle: 'dashed',
                },
                disabled: {
                  stroke: '#d9d9d9',
                  strokeWidth: 1,
                  strokeAlpha: 0.5,
                },
                selected: {
                  stroke: '#722ed1',
                  strokeWidth: 4,
                },
                hovered: {
                  stroke: '#1890ff',
                  strokeWidth: 4,
                },
              },
            },
          });

          if (edge.state !== 'default') {
            canvas.getEdge(edge.id)?.setState(edge.state as any, true);
          }
        }
      });

      // Control panel
      const controls = document.createElement('div');
      controls.style.marginTop = '20px';
      controls.style.padding = '25px';
      controls.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      controls.style.color = 'white';
      controls.style.borderRadius = '12px';
      controls.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';

      const buttonStyle = `
        padding: 10px 20px;
        margin: 5px;
        border: 2px solid rgba(255,255,255,0.3);
        background: rgba(255,255,255,0.1);
        border-radius: 8px;
        cursor: pointer;
        font-size: 14px;
        font-weight: 600;
        color: white;
        transition: all 0.3s ease;
      `;

      controls.innerHTML = `
        <h3 style="margin: 0 0 20px 0; font-size: 22px;">⚡ Data Pipeline Simulator</h3>
        <div style="background: rgba(0,0,0,0.2); padding: 15px; border-radius: 8px; margin-bottom: 20px;">
          <div style="font-size: 14px; line-height: 1.8;">
            <strong>Current Status:</strong><br>
            ✅ Input: Completed<br>
            ⏳ Validate: In Progress<br>
            ⏸️ Transform: Waiting<br>
            ⏸️ Output: Waiting
          </div>
        </div>
        <div style="margin-bottom: 15px;">
          <button id="btn-progress" style="${buttonStyle}">▶ Continue Pipeline</button>
          <button id="btn-error" style="${buttonStyle}">⚠️ Trigger Error</button>
          <button id="btn-reset" style="${buttonStyle}">🔄 Reset</button>
        </div>
        <div style="font-size: 12px; opacity: 0.9; line-height: 1.6;">
          <strong>Legend:</strong> 
          🟢 Success | 🟡 Loading | 🔴 Error | ⚪ Disabled | 🔵 Active Edge
        </div>
      `;

      let step = 1;

      const resetPipeline = () => {
        step = 1;
        canvas.getNode('input')?.setState(NodeStates.SUCCESS, true);
        canvas.getNode('validate')?.setState(NodeStates.LOADING, true);
        canvas.getNode('transform')?.clearStates();
        canvas.getNode('output')?.clearStates();
        canvas.getNode('error-handler')?.clearStates();
        
        canvas.getEdge('e1')?.setState(EdgeStates.ACTIVE, true);
        canvas.getEdge('e2')?.clearStates();
        canvas.getEdge('e3')?.setState(EdgeStates.DISABLED, true);
        canvas.getEdge('e4')?.clearStates();
      };

      controls.querySelector('#btn-progress')?.addEventListener('click', () => {
        if (step === 1) {
          // Validate complete, start transform
          canvas.getNode('validate')?.setState(NodeStates.SUCCESS, true);
          canvas.getNode('validate')?.setState(NodeStates.LOADING, false);
          canvas.getNode('transform')?.setState(NodeStates.LOADING, true);
          
          canvas.getEdge('e1')?.setState(EdgeStates.ACTIVE, false);
          canvas.getEdge('e2')?.setState(EdgeStates.ACTIVE, true);
          step = 2;
        } else if (step === 2) {
          // Transform complete, start output
          canvas.getNode('transform')?.setState(NodeStates.SUCCESS, true);
          canvas.getNode('transform')?.setState(NodeStates.LOADING, false);
          canvas.getNode('output')?.setState(NodeStates.LOADING, true);
          
          canvas.getEdge('e2')?.setState(EdgeStates.ACTIVE, false);
          canvas.getEdge('e3')?.setState(EdgeStates.DISABLED, false);
          canvas.getEdge('e3')?.setState(EdgeStates.ACTIVE, true);
          step = 3;
        } else if (step === 3) {
          // Complete!
          canvas.getNode('output')?.setState(NodeStates.SUCCESS, true);
          canvas.getNode('output')?.setState(NodeStates.LOADING, false);
          canvas.getEdge('e3')?.setState(EdgeStates.ACTIVE, false);
          step = 4;
        }
      });

      controls.querySelector('#btn-error')?.addEventListener('click', () => {
        canvas.getNode('validate')?.setState(NodeStates.ERROR, true);
        canvas.getNode('validate')?.setState(NodeStates.LOADING, false);
        canvas.getNode('error-handler')?.setState(NodeStates.ERROR, true);
        
        canvas.getEdge('e1')?.setState(EdgeStates.ACTIVE, false);
        canvas.getEdge('e2')?.setState(EdgeStates.DISABLED, true);
        canvas.getEdge('e4')?.setState(EdgeStates.ERROR, true);
      });

      controls.querySelector('#btn-reset')?.addEventListener('click', resetPipeline);

      container.appendChild(controls);
    });

    return container;
  },
};

/**
 * Multi-state combination example showing how states compose
 */
export const StateComposition: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '800px';

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 600,
      });

      await canvas.init();

      // Central demo node
      canvas.addNode({
        data: { id: 'demo', x: 400, y: 250, label: 'Compose States', shape: 'rect' },
        style: {
          fill: 0x1890ff,
          stroke: 0x0050b3,
          strokeWidth: 2,
          width: 160,
          height: 100,
          cornerRadius: 12,
          states: {
            hovered: {
              fill: 0x40a9ff,
              strokeWidth: 3,
            },
            selected: {
              stroke: 0xffffff,
              strokeWidth: 5,
            },
            loading: {
              opacity: 0.7,
              fill: 0xfaad14,
            },
            error: {
              fill: 0xff4d4f,
              strokeWidth: 4,
            },
            success: {
              fill: 0x52c41a,
            },
            highlighted: {
              stroke: 0xffffff,
              strokeWidth: 6,
            },
          },
        },
      });

      const node = canvas.getNode('demo');

      // Control panel
      const panel = document.createElement('div');
      panel.style.marginTop = '20px';
      panel.style.padding = '25px';
      panel.style.background = 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)';
      panel.style.color = 'white';
      panel.style.borderRadius = '12px';
      panel.style.boxShadow = '0 6px 16px rgba(0,0,0,0.2)';

      const checkboxStyle = `
        margin: 8px 0;
        font-size: 15px;
        cursor: pointer;
        user-select: none;
      `;

      panel.innerHTML = `
        <h3 style="margin: 0 0 20px 0; font-size: 22px;">🎛️ State Composition Lab</h3>
        <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
            <div>
              <label style="${checkboxStyle}">
                <input type="checkbox" id="cb-selected" style="margin-right: 8px; transform: scale(1.2);">
                ⭐ Selected
              </label><br>
              <label style="${checkboxStyle}">
                <input type="checkbox" id="cb-loading" style="margin-right: 8px; transform: scale(1.2);">
                ⏳ Loading
              </label><br>
              <label style="${checkboxStyle}">
                <input type="checkbox" id="cb-error" style="margin-right: 8px; transform: scale(1.2);">
                ❌ Error
              </label>
            </div>
            <div>
              <label style="${checkboxStyle}">
                <input type="checkbox" id="cb-success" style="margin-right: 8px; transform: scale(1.2);">
                ✅ Success
              </label><br>
              <label style="${checkboxStyle}">
                <input type="checkbox" id="cb-highlighted" style="margin-right: 8px; transform: scale(1.2);">
                💡 Highlighted
              </label><br>
            </div>
          </div>
        </div>
        <div id="state-display" style="
          background: rgba(0,0,0,0.3);
          padding: 15px;
          border-radius: 8px;
          font-family: 'Courier New', monospace;
          font-size: 13px;
          line-height: 1.8;
          min-height: 60px;
        "></div>
        <div style="margin-top: 15px; font-size: 12px; opacity: 0.9; line-height: 1.6;">
          <strong>💡 Try these combinations:</strong><br>
          • Selected + Loading = Selected node in loading state<br>
          • Error + Highlighted = Critical error that needs attention<br>
          • Success + Selected = Successful operation confirmed
        </div>
      `;

      const updateDisplay = () => {
        if (!node) return;
        const states = node.getActiveStates();
        const display = document.getElementById('state-display');
        if (display) {
          display.innerHTML = `
            <strong>Active States:</strong> [${states.join(', ')}]<br>
            <strong>State Count:</strong> ${states.length}<br>
            <strong>Style Priority:</strong> ${states.slice().reverse().join(' → ')}
          `;
        }
      };

      const setupCheckbox = (id: string, state: string) => {
        panel.querySelector(`#${id}`)?.addEventListener('change', (e) => {
          node?.setState(state as any, (e.target as HTMLInputElement).checked);
          updateDisplay();
        });
      };

      setupCheckbox('cb-selected', NodeStates.SELECTED);
      setupCheckbox('cb-loading', NodeStates.LOADING);
      setupCheckbox('cb-error', NodeStates.ERROR);
      setupCheckbox('cb-success', NodeStates.SUCCESS);
      setupCheckbox('cb-highlighted', NodeStates.HIGHLIGHTED);

      updateDisplay();
      container.appendChild(panel);
    });

    return container;
  },
};
