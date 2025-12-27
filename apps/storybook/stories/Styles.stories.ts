import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface StylesArgs {
  theme: 'default' | 'dark';
}

const generateGraphData = (): CanvasData => ({
  nodes: [
    { data: { id: 'n1', x: -150, y: -50, shape: 'circle', size: 40, label: 'Node 1' }, style: { fill: '#4a90d9', stroke: '#2d5f8a', strokeWidth: 2 } },
    { data: { id: 'n2', x: 150, y: -50, shape: 'circle', size: 40, label: 'Node 2' }, style: { fill: '#50c878', stroke: '#3d9d5c', strokeWidth: 2 } },
    { data: { id: 'n3', x: 0, y: 80, shape: 'hexagon', size: 45, label: 'Node 3' }, style: { fill: '#ff6b6b', stroke: '#cc5555', strokeWidth: 2 } },
    { data: { id: 'n4', x: -150, y: 80, shape: 'rect', width: 80, height: 50, cornerRadius: 8, label: 'Node 4' }, style: { fill: '#ffd93d', stroke: '#ccae30', strokeWidth: 2 } },
    { data: { id: 'n5', x: 150, y: 80, shape: 'diamond', size: 40, label: 'Node 5' }, style: { fill: '#9b59b6', stroke: '#7d478f', strokeWidth: 2 } },
  ],
  edges: [
    { data: { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
    { data: { id: 'e2', source: 'n1', target: 'n3', pathType: 'bezier', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
    { data: { id: 'e3', source: 'n2', target: 'n3', pathType: 'bezier', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
    { data: { id: 'e4', source: 'n4', target: 'n3', pathType: 'line', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
    { data: { id: 'e5', source: 'n5', target: 'n3', pathType: 'line', arrowTarget: 'triangle' }, style: { stroke: '#666', strokeWidth: 2 } },
  ],
});

const createThemeSwitcherDemo = (args: StylesArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '12px';
  controls.style.alignItems = 'center';
  controls.innerHTML = `
    <strong>Theme:</strong>
    <button id="theme-default">Default</button>
    <button id="theme-dark">Dark</button>
    <button id="theme-custom">Custom (Neon)</button>
    <span style="margin-left: 20px; font-size: 12px; color: #666;" id="theme-info">Current: default</span>
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
      backgroundColor: args.theme === 'dark' ? '#1a1a2e' : '#f5f5f5',
      data: generateGraphData(),
    });

    await canvas.init();
    canvas.render();

    const themeInfo = document.getElementById('theme-info');

    // Theme button handlers using Canvas API
    document.getElementById('theme-default')?.addEventListener('click', () => {
      canvas.setBackgroundColor('#f5f5f5');
      if (themeInfo) themeInfo.textContent = 'Current: default (light)';
    });

    document.getElementById('theme-dark')?.addEventListener('click', () => {
      canvas.setBackgroundColor('#1a1a2e');
      if (themeInfo) themeInfo.textContent = 'Current: dark';
    });

    document.getElementById('theme-custom')?.addEventListener('click', () => {
      canvas.setBackgroundColor('#0a0a1a');
      if (themeInfo) themeInfo.textContent = 'Current: neon (custom)';
    });
  });

  return wrapper;
};

const createDynamicStylesDemo = (): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Dynamic Styles</strong> - Update node styles using canvas.updateNode()';
  wrapper.appendChild(info);

  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.display = 'flex';
  controls.style.gap = '8px';
  controls.style.flexWrap = 'wrap';
  controls.innerHTML = `
    <button id="highlight-a">Highlight A nodes (Red)</button>
    <button id="highlight-b">Highlight B nodes (Green)</button>
    <button id="highlight-imp">Highlight Important (Yellow)</button>
    <button id="clear-highlights">Reset Styles</button>
  `;
  wrapper.appendChild(controls);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '450px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 450,
      backgroundColor: '#ffffff',
      data: {
        nodes: [
          { data: { id: 'a1', x: -200, y: -50, shape: 'circle', size: 35, label: 'A1' }, style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'a2', x: -100, y: -50, shape: 'circle', size: 35, label: 'A2' }, style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'b1', x: 100, y: -50, shape: 'rect', width: 70, height: 45, cornerRadius: 8, label: 'B1' }, style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'b2', x: 200, y: -50, shape: 'rect', width: 70, height: 45, cornerRadius: 8, label: 'B2' }, style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'imp1', x: -50, y: 60, shape: 'hexagon', size: 40, label: 'IMP' }, style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 } },
          { data: { id: 'imp2', x: 50, y: 60, shape: 'hexagon', size: 40, label: 'IMP' }, style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 } },
        ],
        edges: [
          { data: { id: 'e1', source: 'a1', target: 'a2', pathType: 'line' }, style: { stroke: '#888', strokeWidth: 2 } },
          { data: { id: 'e2', source: 'b1', target: 'b2', pathType: 'line' }, style: { stroke: '#888', strokeWidth: 2 } },
          { data: { id: 'e3', source: 'a2', target: 'imp1', pathType: 'bezier', arrowTarget: 'triangle' }, style: { stroke: '#888', strokeWidth: 2 } },
          { data: { id: 'e4', source: 'b1', target: 'imp2', pathType: 'bezier', arrowTarget: 'triangle' }, style: { stroke: '#888', strokeWidth: 2 } },
        ],
      },
    });

    await canvas.init();
    canvas.render();

    const originalStyles = new Map([
      ['a1', { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 }],
      ['a2', { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 }],
      ['b1', { fill: '#50c878', stroke: '#333', strokeWidth: 2 }],
      ['b2', { fill: '#50c878', stroke: '#333', strokeWidth: 2 }],
      ['imp1', { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 }],
      ['imp2', { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 }],
    ]);

    document.getElementById('highlight-a')?.addEventListener('click', () => {
      canvas.updateNode('a1', { fill: '#ff0000', stroke: '#cc0000', strokeWidth: 4 });
      canvas.updateNode('a2', { fill: '#ff0000', stroke: '#cc0000', strokeWidth: 4 });
    });

    document.getElementById('highlight-b')?.addEventListener('click', () => {
      canvas.updateNode('b1', { fill: '#00ff00', stroke: '#00cc00', strokeWidth: 4 });
      canvas.updateNode('b2', { fill: '#00ff00', stroke: '#00cc00', strokeWidth: 4 });
    });

    document.getElementById('highlight-imp')?.addEventListener('click', () => {
      canvas.updateNode('imp1', { fill: '#ffff00', stroke: '#ff8800', strokeWidth: 4 });
      canvas.updateNode('imp2', { fill: '#ffff00', stroke: '#ff8800', strokeWidth: 4 });
    });

    document.getElementById('clear-highlights')?.addEventListener('click', () => {
      originalStyles.forEach((style, id) => {
        canvas.updateNode(id, style);
      });
    });
  });

  return wrapper;
};

const meta: Meta<StylesArgs> = {
  title: 'Core/Styles',
  render: (args) => createThemeSwitcherDemo(args),
  argTypes: {
    theme: { 
      control: { type: 'select' },
      options: ['default', 'dark'],
    },
  },
  args: {
    theme: 'default',
  },
};

export default meta;

type Story = StoryObj<StylesArgs>;

export const ThemeSwitcher: Story = {};

export const DynamicStyles: Story = {
  render: () => createDynamicStylesDemo(),
};
