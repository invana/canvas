import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, BackgroundPlugin } from '@aspect-ui/canvas-core';
import type { BackgroundPatternType } from '@aspect-ui/canvas-core';

const meta: Meta = {
  title: 'Canvas/Background Styling',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

// Helper to generate sample data
const generateSampleNodes = () => ({
  nodes: [
    { 
      data: { id: 'n1', x: -200, y: -100, shape: 'circle' as const, label: 'Node 1', size: 50 },
      style: { fill: '#4a90d9', stroke: '#333', strokeWidth: 2 }
    },
    { 
      data: { id: 'n2', x: 200, y: -100, shape: 'roundedRect' as const, label: 'Node 2', size: 50 },
      style: { fill: '#50c878', stroke: '#333', strokeWidth: 2 }
    },
    { 
      data: { id: 'n3', x: 0, y: 150, shape: 'hexagon' as const, label: 'Node 3', size: 50 },
      style: { fill: '#ff6b6b', stroke: '#333', strokeWidth: 2 }
    },
  ],
  edges: [
    { 
      data: { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' as const },
      style: { stroke: '#666', strokeWidth: 2 }
    },
    { 
      data: { id: 'e2', source: 'n2', target: 'n3', pathType: 'bezier' as const },
      style: { stroke: '#666', strokeWidth: 2 }
    },
    { 
      data: { id: 'e3', source: 'n3', target: 'n1', pathType: 'bezier' as const },
      style: { stroke: '#666', strokeWidth: 2 }
    },
  ],
});

/**
 * Solid color backgrounds
 */
export const SolidColors: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 700px; display: flex; flex-direction: column; gap: 10px; padding: 20px;';

    const title = document.createElement('h3');
    title.textContent = 'Solid Color Backgrounds';
    title.style.margin = '0 0 10px 0';
    wrapper.appendChild(title);

    const container = document.createElement('div');
    container.style.cssText = 'flex: 1; border: 1px solid #ccc;';
    wrapper.appendChild(container);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; align-items: center;';
    controls.innerHTML = `
      <button id="white-bg" style="padding: 8px 16px; cursor: pointer;">White</button>
      <button id="light-bg" style="padding: 8px 16px; cursor: pointer;">Light Gray</button>
      <button id="dark-bg" style="padding: 8px 16px; cursor: pointer;">Dark</button>
      <button id="blue-bg" style="padding: 8px 16px; cursor: pointer;">Blue</button>
      <button id="custom-bg" style="padding: 8px 16px; cursor: pointer;">Custom</button>
      <input type="color" id="color-picker" value="#f0f0f0" style="margin-left: 10px;">
    `;
    wrapper.appendChild(controls);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        data: generateSampleNodes(),
      });

      await canvas.init();

      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);

      canvas.render();

      // Button handlers
      document.getElementById('white-bg')?.addEventListener('click', () => {
        bgPlugin.setSolidBackground('#ffffff');
      });

      document.getElementById('light-bg')?.addEventListener('click', () => {
        bgPlugin.setSolidBackground('#f5f5f5');
      });

      document.getElementById('dark-bg')?.addEventListener('click', () => {
        bgPlugin.setSolidBackground('#1a1a2e');
      });

      document.getElementById('blue-bg')?.addEventListener('click', () => {
        bgPlugin.setSolidBackground('#e3f2fd');
      });

      document.getElementById('custom-bg')?.addEventListener('click', () => {
        const color = (document.getElementById('color-picker') as HTMLInputElement)?.value;
        bgPlugin.setSolidBackground(color);
      });

      document.getElementById('color-picker')?.addEventListener('change', (e) => {
        const color = (e.target as HTMLInputElement).value;
        bgPlugin.setSolidBackground(color);
      });
    });

    return wrapper;
  },
};

/**
 * Linear gradient backgrounds
 */
export const LinearGradients: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 700px; display: flex; flex-direction: column; gap: 10px; padding: 20px;';

    const title = document.createElement('h3');
    title.textContent = 'Linear Gradient Backgrounds';
    title.style.margin = '0 0 10px 0';
    wrapper.appendChild(title);

    const container = document.createElement('div');
    container.style.cssText = 'flex: 1; border: 1px solid #ccc;';
    wrapper.appendChild(container);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
    controls.innerHTML = `
      <button id="gradient-1" style="padding: 8px 16px; cursor: pointer;">Top to Bottom</button>
      <button id="gradient-2" style="padding: 8px 16px; cursor: pointer;">Left to Right</button>
      <button id="gradient-3" style="padding: 8px 16px; cursor: pointer;">Diagonal</button>
      <button id="gradient-4" style="padding: 8px 16px; cursor: pointer;">Sunset</button>
      <button id="gradient-5" style="padding: 8px 16px; cursor: pointer;">Ocean</button>
    `;
    wrapper.appendChild(controls);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        data: generateSampleNodes(),
      });

      await canvas.init();

      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);

      canvas.render();

      // Gradient presets
      document.getElementById('gradient-1')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 0, y1: 1,
          stops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#e0e0e0' },
          ],
        });
      });

      document.getElementById('gradient-2')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 1, y1: 0,
          stops: [
            { offset: 0, color: '#e3f2fd' },
            { offset: 1, color: '#bbdefb' },
          ],
        });
      });

      document.getElementById('gradient-3')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 1, y1: 1,
          stops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' },
          ],
        });
      });

      document.getElementById('gradient-4')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 0, y1: 1,
          stops: [
            { offset: 0, color: '#ff6b6b' },
            { offset: 0.5, color: '#feca57' },
            { offset: 1, color: '#ee5a6f' },
          ],
        });
      });

      document.getElementById('gradient-5')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 0, y1: 1,
          stops: [
            { offset: 0, color: '#2193b0' },
            { offset: 1, color: '#6dd5ed' },
          ],
        });
      });
    });

    return wrapper;
  },
};

/**
 * Radial gradient backgrounds
 */
export const RadialGradients: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 700px; display: flex; flex-direction: column; gap: 10px; padding: 20px;';

    const title = document.createElement('h3');
    title.textContent = 'Radial Gradient Backgrounds';
    title.style.margin = '0 0 10px 0';
    wrapper.appendChild(title);

    const container = document.createElement('div');
    container.style.cssText = 'flex: 1; border: 1px solid #ccc;';
    wrapper.appendChild(container);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
    controls.innerHTML = `
      <button id="radial-1" style="padding: 8px 16px; cursor: pointer;">Center Glow</button>
      <button id="radial-2" style="padding: 8px 16px; cursor: pointer;">Corner Glow</button>
      <button id="radial-3" style="padding: 8px 16px; cursor: pointer;">Spotlight</button>
      <button id="radial-4" style="padding: 8px 16px; cursor: pointer;">Dark Vignette</button>
    `;
    wrapper.appendChild(controls);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        data: generateSampleNodes(),
      });

      await canvas.init();

      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);

      canvas.render();

      document.getElementById('radial-1')?.addEventListener('click', () => {
        bgPlugin.setRadialGradient({
          cx: 0.5, cy: 0.5, radius: 0.7,
          stops: [
            { offset: 0, color: '#ffffff' },
            { offset: 1, color: '#e0e0e0' },
          ],
        });
      });

      document.getElementById('radial-2')?.addEventListener('click', () => {
        bgPlugin.setRadialGradient({
          cx: 0, cy: 0, radius: 1,
          stops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' },
          ],
        });
      });

      document.getElementById('radial-3')?.addEventListener('click', () => {
        bgPlugin.setRadialGradient({
          cx: 0.5, cy: 0.5, radius: 0.5,
          stops: [
            { offset: 0, color: '#ffffff' },
            { offset: 0.5, color: '#f0f0f0' },
            { offset: 1, color: '#cccccc' },
          ],
        });
      });

      document.getElementById('radial-4')?.addEventListener('click', () => {
        bgPlugin.setRadialGradient({
          cx: 0.5, cy: 0.5, radius: 0.8,
          stops: [
            { offset: 0, color: '#2c3e50' },
            { offset: 1, color: '#000000' },
          ],
        });
      });
    });

    return wrapper;
  },
};

/**
 * Pattern backgrounds (dots, grid, cross)
 */
export const Patterns: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 700px; display: flex; flex-direction: column; gap: 10px; padding: 20px;';

    const title = document.createElement('h3');
    title.textContent = 'Pattern Backgrounds (ReactFlow Style)';
    title.style.margin = '0 0 10px 0';
    wrapper.appendChild(title);

    const container = document.createElement('div');
    container.style.cssText = 'flex: 1; border: 1px solid #ccc;';
    wrapper.appendChild(container);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap; align-items: center;';
    controls.innerHTML = `
      <button id="pattern-dots" style="padding: 8px 16px; cursor: pointer;">Dots</button>
      <button id="pattern-grid" style="padding: 8px 16px; cursor: pointer;">Grid</button>
      <button id="pattern-cross" style="padding: 8px 16px; cursor: pointer;">Cross</button>
      <button id="pattern-none" style="padding: 8px 16px; cursor: pointer;">None</button>
      <label style="margin-left: 20px;">Size: <input type="range" id="pattern-size" min="10" max="50" value="20" style="width: 150px;"></label>
      <span id="size-value">20</span>
    `;
    wrapper.appendChild(controls);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: '#ffffff',
        data: generateSampleNodes(),
      });

      await canvas.init();

      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);

      canvas.render();

      let currentPattern: BackgroundPatternType = 'dots';
      bgPlugin.setPattern('dots');

      const sizeSlider = document.getElementById('pattern-size') as HTMLInputElement;
      const sizeValue = document.getElementById('size-value');

      sizeSlider?.addEventListener('input', (e) => {
        const size = parseInt((e.target as HTMLInputElement).value);
        if (sizeValue) sizeValue.textContent = size.toString();
        if (currentPattern !== 'none') {
          bgPlugin.setPattern(currentPattern, { size });
        }
      });

      document.getElementById('pattern-dots')?.addEventListener('click', () => {
        currentPattern = 'dots';
        bgPlugin.setPattern('dots', { 
          size: parseInt(sizeSlider.value),
          color: '#d0d0d0',
          dotSize: 2,
        });
      });

      document.getElementById('pattern-grid')?.addEventListener('click', () => {
        currentPattern = 'grid';
        bgPlugin.setPattern('grid', { 
          size: parseInt(sizeSlider.value),
          color: '#e0e0e0',
          lineWidth: 1,
        });
      });

      document.getElementById('pattern-cross')?.addEventListener('click', () => {
        currentPattern = 'cross';
        bgPlugin.setPattern('cross', { 
          size: parseInt(sizeSlider.value),
          color: '#d0d0d0',
          lineWidth: 1,
        });
      });

      document.getElementById('pattern-none')?.addEventListener('click', () => {
        currentPattern = 'none';
        bgPlugin.clearPattern();
      });
    });

    return wrapper;
  },
};

/**
 * Combined: Gradient + Pattern
 */
export const CombinedGradientAndPattern: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 700px; display: flex; flex-direction: column; gap: 10px; padding: 20px;';

    const title = document.createElement('h3');
    title.textContent = 'Combined: Gradient Background + Pattern';
    title.style.margin = '0 0 10px 0';
    wrapper.appendChild(title);

    const container = document.createElement('div');
    container.style.cssText = 'flex: 1; border: 1px solid #ccc;';
    wrapper.appendChild(container);

    const controls = document.createElement('div');
    controls.style.cssText = 'display: flex; gap: 10px; flex-wrap: wrap;';
    controls.innerHTML = `
      <button id="combo-1" style="padding: 8px 16px; cursor: pointer;">Blue Gradient + Dots</button>
      <button id="combo-2" style="padding: 8px 16px; cursor: pointer;">Purple Gradient + Grid</button>
      <button id="combo-3" style="padding: 8px 16px; cursor: pointer;">Sunset + Cross</button>
      <button id="combo-4" style="padding: 8px 16px; cursor: pointer;">Dark Radial + Grid</button>
    `;
    wrapper.appendChild(controls);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        data: generateSampleNodes(),
      });

      await canvas.init();

      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);

      canvas.render();

      document.getElementById('combo-1')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 0, y1: 1,
          stops: [
            { offset: 0, color: '#e3f2fd' },
            { offset: 1, color: '#bbdefb' },
          ],
        });
        bgPlugin.setPattern('dots', { color: '#90caf9', alpha: 0.5, size: 20, dotSize: 2 });
      });

      document.getElementById('combo-2')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 1, y1: 1,
          stops: [
            { offset: 0, color: '#667eea' },
            { offset: 1, color: '#764ba2' },
          ],
        });
        bgPlugin.setPattern('grid', { color: '#ffffff', alpha: 0.2, size: 30, lineWidth: 1 });
      });

      document.getElementById('combo-3')?.addEventListener('click', () => {
        bgPlugin.setLinearGradient({
          x0: 0, y0: 0, x1: 0, y1: 1,
          stops: [
            { offset: 0, color: '#ff6b6b' },
            { offset: 0.5, color: '#feca57' },
            { offset: 1, color: '#ee5a6f' },
          ],
        });
        bgPlugin.setPattern('cross', { color: '#ffffff', alpha: 0.3, size: 25, lineWidth: 1.5 });
      });

      document.getElementById('combo-4')?.addEventListener('click', () => {
        bgPlugin.setRadialGradient({
          cx: 0.5, cy: 0.5, radius: 0.8,
          stops: [
            { offset: 0, color: '#2c3e50' },
            { offset: 1, color: '#000000' },
          ],
        });
        bgPlugin.setPattern('grid', { color: '#ffffff', alpha: 0.1, size: 40, lineWidth: 1 });
      });
    });

    return wrapper;
  },
};

/**
 * ReactFlow-like demo
 */
export const ReactFlowStyle: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'width: 100%; height: 700px; display: flex; flex-direction: column; gap: 10px; padding: 20px;';

    const title = document.createElement('h3');
    title.textContent = 'ReactFlow-Inspired Background';
    title.style.margin = '0 0 10px 0';
    wrapper.appendChild(title);

    const info = document.createElement('p');
    info.style.cssText = 'margin: 0; color: #666; font-size: 14px;';
    info.textContent = 'Light theme with dot pattern - similar to ReactFlow default background';
    wrapper.appendChild(info);

    const container = document.createElement('div');
    container.style.cssText = 'flex: 1; border: 1px solid #ccc; border-radius: 8px; overflow: hidden;';
    wrapper.appendChild(container);

    requestAnimationFrame(async () => {
      const canvas = new Canvas({
        container,
        width: container.clientWidth,
        height: container.clientHeight,
        backgroundColor: '#ffffff',
        data: generateSampleNodes(),
      });

      await canvas.init();

      const bgPlugin = new BackgroundPlugin();
      await canvas.registerPlugin(bgPlugin);

      // Set ReactFlow-style background
      bgPlugin.setSolidBackground('#fafafa');
      bgPlugin.setPattern('dots', {
        color: '#d0d0d0',
        alpha: 1,
        size: 20,
        dotSize: 1.5,
      });

      canvas.render();
    });

    return wrapper;
  },
};
