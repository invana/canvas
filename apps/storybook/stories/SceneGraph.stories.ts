import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Core/State',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// =============================================================================
// Element Tracking - Track nodes and edges using Canvas API
// =============================================================================

export const ElementTracking: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '500px';
    container.style.position = 'relative';

    // Stats panel
    const statsPanel = document.createElement('div');
    statsPanel.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 100;
    `;

    const updateStats = (canvas: Canvas) => {
      const state = canvas.state;
      statsPanel.innerHTML = `
        <div style="margin-bottom: 8px; font-weight: bold;">📊 Canvas State:</div>
        <div>Nodes: ${state.nodeCount}</div>
        <div>Edges: ${state.edgeCount}</div>
        <div>Viewport: (${state.viewport.x.toFixed(0)}, ${state.viewport.y.toFixed(0)})</div>
        <div>Zoom: ${state.viewport.zoom.toFixed(2)}x</div>
      `;
    };

    setTimeout(async () => {
      const initialData: CanvasData = {
        nodes: [
          { data: { id: 'n1', x: -100, y: -50, shape: 'circle', size: 40, label: 'Node 1' }, style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'n2', x: 100, y: -50, shape: 'circle', size: 40, label: 'Node 2' }, style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'n3', x: 0, y: 80, shape: 'hexagon', size: 35, label: 'Node 3' }, style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 } },
        ],
        edges: [
          { data: { id: 'e1', source: 'n1', target: 'n2', pathType: 'line' }, style: { stroke: '#666', strokeWidth: 2 } },
          { data: { id: 'e2', source: 'n1', target: 'n3', pathType: 'bezier', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
        ],
      };

      const canvas = new Canvas({
        container,
        width: 800,
        height: 500,
        backgroundColor: '#1a1a2e',
        data: initialData,
      });

      await canvas.init();
      canvas.render();

      container.appendChild(statsPanel);
      updateStats(canvas);

      // Update stats on viewport changes
      canvas.viewport.on('moved', () => updateStats(canvas));
      canvas.viewport.on('zoomed', () => updateStats(canvas));
    }, 100);

    return container;
  },
};

// =============================================================================
// Dynamic Updates - Add/remove elements and track state
// =============================================================================

export const DynamicUpdates: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '500px';
    container.style.position = 'relative';

    // Control panel
    const controls = document.createElement('div');
    controls.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      display: flex;
      gap: 8px;
      z-index: 100;
    `;

    const buttonStyle = `
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
      font-weight: bold;
    `;

    // Stats display
    const statsPanel = document.createElement('div');
    statsPanel.style.cssText = `
      position: absolute;
      top: 60px;
      left: 10px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 100;
    `;

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 500,
        backgroundColor: '#1a1a2e',
        data: { nodes: [], edges: [] },
      });

      await canvas.init();
      canvas.render();

      container.appendChild(controls);
      container.appendChild(statsPanel);

      let nodeCounter = 0;
      let edgeCounter = 0;

      const updateStats = () => {
        const nodes = canvas.getNodes();
        const edges = canvas.getEdges();
        statsPanel.innerHTML = `
          <div style="font-weight: bold; margin-bottom: 8px;">🔗 State:</div>
          <div>Nodes: ${nodes.length}</div>
          <div>Edges: ${edges.length}</div>
          <div style="margin-top: 8px; color: #888; font-size: 10px;">
            Node IDs: ${nodes.map(n => n.id).join(', ') || 'none'}
          </div>
        `;
      };

      // Add Node button
      const addNodeBtn = document.createElement('button');
      addNodeBtn.textContent = '➕ Add Node';
      addNodeBtn.style.cssText = buttonStyle + 'background: #4ecdc4; color: #000;';
      addNodeBtn.onclick = () => {
        nodeCounter++;
        const id = `node-${nodeCounter}`;
        const x = (Math.random() - 0.5) * 400;
        const y = (Math.random() - 0.5) * 200;
        
        canvas.addNode({ 
          id, 
          x, 
          y, 
          label: `N${nodeCounter}`, 
          shape: 'circle', 
          size: 30,
          fill: '#4a90d9', stroke: '#333', strokeWidth: 2
        });
        updateStats();
      };

      // Add Edge button
      const addEdgeBtn = document.createElement('button');
      addEdgeBtn.textContent = '🔗 Add Edge';
      addEdgeBtn.style.cssText = buttonStyle + 'background: #9b59b6; color: #fff;';
      addEdgeBtn.onclick = () => {
        const nodes = canvas.getNodes();
        if (nodes.length < 2) {
          alert('Need at least 2 nodes to create an edge');
          return;
        }
        
        edgeCounter++;
        const sourceIdx = Math.floor(Math.random() * nodes.length);
        let targetIdx = Math.floor(Math.random() * nodes.length);
        while (targetIdx === sourceIdx && nodes.length > 1) {
          targetIdx = Math.floor(Math.random() * nodes.length);
        }
        
        canvas.addEdge({
          id: `edge-${edgeCounter}`,
          source: nodes[sourceIdx]!.id,
          target: nodes[targetIdx]!.id,
          pathType: 'bezier',
          arrowTarget: 'triangle',
          stroke: '#666', strokeWidth: 2
        });
        updateStats();
      };

      // Remove Random button
      const removeBtn = document.createElement('button');
      removeBtn.textContent = '❌ Remove Random';
      removeBtn.style.cssText = buttonStyle + 'background: #e74c3c; color: #fff;';
      removeBtn.onclick = () => {
        const nodes = canvas.getNodes();
        if (nodes.length === 0) return;
        
        const randomNode = nodes[Math.floor(Math.random() * nodes.length)]!;
        canvas.removeNode(randomNode.id);
        updateStats();
      };

      // Clear button
      const clearBtn = document.createElement('button');
      clearBtn.textContent = '🗑️ Clear All';
      clearBtn.style.cssText = buttonStyle + 'background: #666; color: #fff;';
      clearBtn.onclick = () => {
        canvas.clear();
        nodeCounter = 0;
        edgeCounter = 0;
        updateStats();
      };

      controls.appendChild(addNodeBtn);
      controls.appendChild(addEdgeBtn);
      controls.appendChild(removeBtn);
      controls.appendChild(clearBtn);

      updateStats();
    }, 100);

    return container;
  },
};

// =============================================================================
// Node Queries - Query and inspect nodes
// =============================================================================

export const NodeQueries: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '800px';
    container.style.height = '500px';
    container.style.position = 'relative';

    // Query panel
    const queryPanel = document.createElement('div');
    queryPanel.style.cssText = `
      position: absolute;
      top: 10px;
      left: 10px;
      background: rgba(0,0,0,0.85);
      color: #fff;
      font-family: monospace;
      font-size: 12px;
      padding: 12px;
      border-radius: 4px;
      z-index: 100;
      width: 280px;
    `;

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 800,
        height: 500,
        backgroundColor: '#1a1a2e',
        data: {
          nodes: [
            { data: { id: 'user-1', x: -150, y: 0, label: 'Alice', shape: 'circle', size: 40 }, style: { fill: '#e74c3c', stroke: '#333', strokeWidth: 2 } },
            { data: { id: 'user-2', x: 150, y: 0, label: 'Bob', shape: 'circle', size: 40 }, style: { fill: '#3498db', stroke: '#333', strokeWidth: 2 } },
            { data: { id: 'doc-1', x: 0, y: -100, label: 'Doc A', shape: 'rect', width: 80, height: 50, cornerRadius: 8 }, style: { fill: '#f39c12', stroke: '#333', strokeWidth: 2 } },
            { data: { id: 'doc-2', x: 0, y: 100, label: 'Doc B', shape: 'rect', width: 80, height: 50, cornerRadius: 8 }, style: { fill: '#f39c12', stroke: '#333', strokeWidth: 2 } },
          ],
          edges: [
            { data: { id: 'owns-1', source: 'user-1', target: 'doc-1', pathType: 'line', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
            { data: { id: 'owns-2', source: 'user-2', target: 'doc-1', pathType: 'line', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
            { data: { id: 'owns-3', source: 'user-1', target: 'doc-2', pathType: 'line', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
          ],
        },
      });

      await canvas.init();
      canvas.render();
      container.appendChild(queryPanel);

      // Query using Canvas API
      const nodes = canvas.getNodes();
      const edges = canvas.getEdges();
      const nodeIds = nodes.map(n => n.id);
      
      const checkIds = ['user-1', 'user-2', 'user-4', 'doc-1', 'doc-3', 'owns-1', 'owns-5'];
      
      queryPanel.innerHTML = `
        <div style="font-weight: bold; margin-bottom: 12px;">🔍 Element Queries:</div>
        ${checkIds.map(id => {
          const isNode = nodeIds.includes(id);
          const isEdge = edges.some(e => e.id === id);
          const exists = isNode || isEdge;
          const type = isNode ? 'Node' : (isEdge ? 'Edge' : 'N/A');
          return `
            <div style="margin-bottom: 4px;">
              <span style="color: ${exists ? '#2ecc71' : '#e74c3c'};">
                ${exists ? '✓' : '✗'}
              </span>
              <span style="color: #888; margin-left: 8px;">${id}</span>
              <span style="color: #666; margin-left: 8px;">(${type})</span>
            </div>
          `;
        }).join('')}
        
        <div style="border-top: 1px solid #444; margin-top: 12px; padding-top: 12px;">
          <div style="font-weight: bold; margin-bottom: 8px;">📊 Summary:</div>
          <div>Total Nodes: ${nodes.length}</div>
          <div>Total Edges: ${edges.length}</div>
          <div style="margin-top: 8px; font-size: 10px; color: #888;">
            Using canvas.getNodes() and canvas.getEdges()
          </div>
        </div>
      `;
    }, 100);

    return container;
  },
};
