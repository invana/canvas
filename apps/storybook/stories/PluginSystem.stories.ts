import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GroupsPlugin } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Core/Plugin System',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Demonstrates the plugin-based layer architecture
 */
export const PluginLayerSystem: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f0f0f0';

    // Initialize canvas
    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(async () => {
      // Register the groups plugin
      const groupsPlugin = new GroupsPlugin();
      await canvas.registerPlugin(groupsPlugin);

      // Render some nodes
      canvas.render({
        nodes: [
          // Team A nodes
          { id: 'n1', x: 100, y: 100, shape: 'circle', label: 'Alice', style: { fill: '#4a90d9' } },
          { id: 'n2', x: 200, y: 100, shape: 'circle', label: 'Bob', style: { fill: '#4a90d9' } },
          { id: 'n3', x: 150, y: 200, shape: 'circle', label: 'Carol', style: { fill: '#4a90d9' } },

          // Team B nodes
          { id: 'n4', x: 400, y: 150, shape: 'rect', label: 'Dave', style: { fill: '#f4a261' } },
          { id: 'n5', x: 500, y: 150, shape: 'rect', label: 'Eve', style: { fill: '#f4a261' } },
          { id: 'n6', x: 450, y: 250, shape: 'rect', label: 'Frank', style: { fill: '#f4a261' } },

          // Team C nodes
          { id: 'n7', x: 750, y: 100, shape: 'roundedRect', label: 'Grace', style: { fill: '#2a9d8f' } },
          { id: 'n8', x: 850, y: 100, shape: 'roundedRect', label: 'Heidi', style: { fill: '#2a9d8f' } },
          { id: 'n9', x: 800, y: 200, shape: 'roundedRect', label: 'Ivan', style: { fill: '#2a9d8f' } },
        ],
        edges: [
          // Team A connections
          { id: 'e1', source: 'n1', target: 'n2', pathType: 'straight' },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'straight' },
          { id: 'e3', source: 'n3', target: 'n1', pathType: 'straight' },

          // Team B connections
          { id: 'e4', source: 'n4', target: 'n5', pathType: 'straight' },
          { id: 'e5', source: 'n5', target: 'n6', pathType: 'straight' },
          { id: 'e6', source: 'n6', target: 'n4', pathType: 'straight' },

          // Team C connections
          { id: 'e7', source: 'n7', target: 'n8', pathType: 'straight' },
          { id: 'e8', source: 'n8', target: 'n9', pathType: 'straight' },
          { id: 'e9', source: 'n9', target: 'n7', pathType: 'straight' },

          // Inter-team connections
          { id: 'e10', source: 'n2', target: 'n4', pathType: 'bezier', style: { stroke: '#999', strokeWidth: 1 } },
          { id: 'e11', source: 'n5', target: 'n7', pathType: 'bezier', style: { stroke: '#999', strokeWidth: 1 } },
        ],
      });

      // Add groups using the plugin
      groupsPlugin.addGroup({
        id: 'team-a',
        nodeIds: ['n1', 'n2', 'n3'],
        x: 60,
        y: 60,
        width: 180,
        height: 180,
        label: 'Team A',
        style: {
          fill: '#e3f2fd',
          fillAlpha: 0.3,
          stroke: '#2196f3',
          strokeWidth: 2,
        },
      });

      groupsPlugin.addGroup({
        id: 'team-b',
        nodeIds: ['n4', 'n5', 'n6'],
        x: 360,
        y: 110,
        width: 180,
        height: 180,
        label: 'Team B',
        style: {
          fill: '#fff3e0',
          fillAlpha: 0.3,
          stroke: '#ff9800',
          strokeWidth: 2,
        },
      });

      groupsPlugin.addGroup({
        id: 'team-c',
        nodeIds: ['n7', 'n8', 'n9'],
        x: 710,
        y: 60,
        width: 180,
        height: 180,
        label: 'Team C',
        style: {
          fill: '#e0f2f1',
          fillAlpha: 0.3,
          stroke: '#009688',
          strokeWidth: 2,
        },
      });

      // Add info text
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      info.style.color = '#fff';
      info.style.padding = '12px';
      info.style.borderRadius = '4px';
      info.style.fontFamily = 'monospace';
      info.style.fontSize = '12px';
      info.style.maxWidth = '300px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Plugin-Based Layer Architecture</strong><br/>
        <br/>
        <strong>Layers (by z-index):</strong><br/>
        • core-edges (100-199)<br/>
        &nbsp;&nbsp;- shapes: 100<br/>
        &nbsp;&nbsp;- labels: 101<br/>
        • core-nodes (200-299)<br/>
        &nbsp;&nbsp;- shapes: 200<br/>
        &nbsp;&nbsp;- labels: 201<br/>
        • plugin-groups (300-399)<br/>
        &nbsp;&nbsp;- shapes: 300<br/>
        &nbsp;&nbsp;- labels: 301<br/>
        <br/>
        <strong>Groups render behind nodes!</strong><br/>
        Group z-index (300) < Node z-index (200)<br/>
        <br/>
        <em>Try panning/zooming - all layers<br/>move together automatically!</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);

      // Log layer information
      console.log('=== Layer Manager Info ===');
      console.log('Groups:', Array.from(canvas.layerManager.getAllGroups().keys()));
      
      const edgeGroup = canvas.layerManager.getGroup('core-edges');
      const nodeGroup = canvas.layerManager.getGroup('core-nodes');
      const pluginGroup = canvas.layerManager.getGroup('plugin-groups');
      
      console.log('Edge Group:', {
        id: edgeGroup?.id,
        baseZIndex: edgeGroup?.baseZIndex,
        layers: edgeGroup?.getAllLayers().map(l => ({ name: l.name, zIndex: l.zIndex }))
      });
      
      console.log('Node Group:', {
        id: nodeGroup?.id,
        baseZIndex: nodeGroup?.baseZIndex,
        layers: nodeGroup?.getAllLayers().map(l => ({ name: l.name, zIndex: l.zIndex }))
      });
      
      console.log('Plugin Group:', {
        id: pluginGroup?.id,
        baseZIndex: pluginGroup?.baseZIndex,
        layers: pluginGroup?.getAllLayers().map(l => ({ name: l.name, zIndex: l.zIndex }))
      });
    });

    return container;
  },
};

/**
 * Demonstrates toggling plugin layers
 */
export const TogglePluginLayers: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.width = '100%';
    wrapper.style.height = '600px';
    wrapper.style.position = 'relative';

    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.backgroundColor = '#f0f0f0';
    wrapper.appendChild(container);

    // Initialize canvas
    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(async () => {
      // Register the groups plugin
      const groupsPlugin = new GroupsPlugin();
      await canvas.registerPlugin(groupsPlugin);

      // Render nodes
      canvas.render({
        nodes: [
          { id: 'n1', x: 200, y: 150, shape: 'circle', label: 'Node 1' },
          { id: 'n2', x: 300, y: 150, shape: 'circle', label: 'Node 2' },
          { id: 'n3', x: 250, y: 250, shape: 'circle', label: 'Node 3' },
          { id: 'n4', x: 500, y: 200, shape: 'rect', label: 'Node 4' },
          { id: 'n5', x: 600, y: 200, shape: 'rect', label: 'Node 5' },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', pathType: 'straight' },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'straight' },
          { id: 'e3', source: 'n3', target: 'n1', pathType: 'straight' },
          { id: 'e4', source: 'n2', target: 'n4', pathType: 'bezier' },
          { id: 'e5', source: 'n4', target: 'n5', pathType: 'straight' },
        ],
      });

      // Add groups
      groupsPlugin.addGroup({
        id: 'group1',
        nodeIds: ['n1', 'n2', 'n3'],
        x: 160,
        y: 110,
        width: 180,
        height: 180,
        style: { fill: '#e3f2fd', fillAlpha: 0.3, stroke: '#2196f3', strokeWidth: 2 },
      });

      groupsPlugin.addGroup({
        id: 'group2',
        nodeIds: ['n4', 'n5'],
        x: 460,
        y: 160,
        width: 180,
        height: 100,
        style: { fill: '#fff3e0', fillAlpha: 0.3, stroke: '#ff9800', strokeWidth: 2 },
      });

      // Add controls
      const controls = document.createElement('div');
      controls.style.position = 'absolute';
      controls.style.top = '10px';
      controls.style.left = '10px';
      controls.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      controls.style.padding = '16px';
      controls.style.borderRadius = '8px';
      controls.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      controls.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      controls.style.fontSize = '14px';
      controls.style.zIndex = '1000';

      const title = document.createElement('div');
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '12px';
      title.textContent = 'Layer Controls';
      controls.appendChild(title);

      // Helper to create toggle
      const createToggle = (label: string, initialState: boolean, onChange: (checked: boolean) => void) => {
        const row = document.createElement('div');
        row.style.marginBottom = '8px';
        row.style.display = 'flex';
        row.style.alignItems = 'center';

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = initialState;
        checkbox.style.marginRight = '8px';
        checkbox.addEventListener('change', () => onChange(checkbox.checked));

        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        labelEl.style.cursor = 'pointer';
        labelEl.addEventListener('click', () => {
          checkbox.checked = !checkbox.checked;
          onChange(checkbox.checked);
        });

        row.appendChild(checkbox);
        row.appendChild(labelEl);
        controls.appendChild(row);
      };

      createToggle('Show Edges', true, (checked) => {
        canvas.layerManager.setGroupVisibility('core-edges', checked);
      });

      createToggle('Show Nodes', true, (checked) => {
        canvas.layerManager.setGroupVisibility('core-nodes', checked);
      });

      createToggle('Show Groups', true, (checked) => {
        canvas.layerManager.setGroupVisibility('plugin-groups', checked);
      });

      wrapper.appendChild(controls);
    });

    return wrapper;
  },
};

/**
 * Demonstrates multiple plugins
 */
export const MultiplePlugins: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f0f0f0';
    container.style.position = 'relative';

    // Initialize canvas
    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(async () => {
      // Register groups plugin
      const groupsPlugin = new GroupsPlugin();
      await canvas.registerPlugin(groupsPlugin);

      // Check if plugin is registered
      console.log('Has groups plugin:', canvas.hasPlugin('groups'));
      console.log('Groups plugin:', canvas.getPlugin('groups'));

      // Render nodes
      canvas.render({
        nodes: [
          { id: 'n1', x: 300, y: 200, shape: 'circle', label: 'Node 1' },
          { id: 'n2', x: 400, y: 200, shape: 'circle', label: 'Node 2' },
          { id: 'n3', x: 500, y: 200, shape: 'circle', label: 'Node 3' },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', pathType: 'straight' },
          { id: 'e2', source: 'n2', target: 'n3', pathType: 'straight' },
        ],
      });

      // Add group
      groupsPlugin.addGroup({
        id: 'main-group',
        nodeIds: ['n1', 'n2', 'n3'],
        x: 260,
        y: 160,
        width: 280,
        height: 100,
        style: { fill: '#e8f5e9', fillAlpha: 0.3, stroke: '#4caf50', strokeWidth: 2 },
      });

      // Info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.right = '10px';
      info.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
      info.style.color = '#fff';
      info.style.padding = '12px';
      info.style.borderRadius = '4px';
      info.style.fontFamily = 'monospace';
      info.style.fontSize = '12px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Plugin Architecture</strong><br/>
        <br/>
        Registered Plugins:<br/>
        • ${canvas.hasPlugin('groups') ? '✓' : '✗'} groups<br/>
        <br/>
        Layer Groups:<br/>
        • core-edges (z: 100-199)<br/>
        • core-nodes (z: 200-299)<br/>
        • plugin-groups (z: 300-399)<br/>
        <br/>
        Future plugins can add:<br/>
        • Annotations (z: 400-499)<br/>
        • Minimap (z: 500-599)<br/>
        • Timeline (z: 600-699)<br/>
        • Custom layers (z: auto)
      `;
      container.appendChild(info);

      console.log('All layer groups:', Array.from(canvas.layerManager.getAllGroups().keys()));
    });

    return container;
  },
};
