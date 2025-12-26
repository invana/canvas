import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, NodeShape, EdgeShape } from '@aspect-ui/canvas-core';

interface AnimationsArgs {
  backgroundColor: string;
  animationDuration: number;
}

const createPulseAnimation = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Pulse Animation</strong> - Nodes with pulsing effect';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 300,
      backgroundColor: args.backgroundColor,
    });

    await canvas.init();

    const colors = ['#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4'];

    colors.forEach((color, i) => {
      const x = (i - 2) * 130;

      const node = new NodeShape({
        data: {
          id: `pulse-${i}`,
          x,
          y: 0,
          shape: 'circle',
          size: 40,
          animation: {
            type: 'pulse',
            duration: args.animationDuration + i * 200,
            easing: 'easeInOut',
          },
        },
        style: {
          fill: color,
          stroke: '#333',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      canvas.addToNodeLayer(node);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const createRippleEffect = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Ripple Effect</strong> - Click on nodes to trigger ripple, or they auto-ripple';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 300,
      backgroundColor: args.backgroundColor,
    });

    await canvas.init();

    const positions = [
      { x: -150, y: -50, color: '#e91e63' },
      { x: 0, y: 50, color: '#4caf50' },
      { x: 150, y: -50, color: '#2196f3' },
    ];

    positions.forEach((pos, i) => {
      const node = new NodeShape({
        data: {
          id: `ripple-${i}`,
          x: pos.x,
          y: pos.y,
          shape: 'circle',
          size: 50,
        },
        style: {
          fill: pos.color,
          stroke: '#333',
          strokeWidth: 2,
          rippleColor: pos.color,
        },
        interactive: true,
        registry: canvas.registry,
      });
      
      // Start continuous ripple animation
      node.startRipple({
        duration: args.animationDuration + i * 300,
        color: pos.color,
        ringCount: 3,
        loop: true,
      });
      
      // Also trigger single ripple on click
      node.on('pointertap', () => {
        node.stopRipple();
        node.triggerRipple({
          duration: 800,
          color: '#ffffff',
          ringCount: 2,
        });
      });

      canvas.addToNodeLayer(node);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const createGlowEffect = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Glow Effect</strong> - Nodes with animated glow';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.border = '#1a1a2e';
  container.style.backgroundColor = '#1a1a2e';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 300,
      backgroundColor: '#1a1a2e',
    });

    await canvas.init();

    const glowColors = ['#00ff88', '#ff00ff', '#00ffff', '#ffff00'];

    glowColors.forEach((color, i) => {
      const x = (i - 1.5) * 160;

      const node = new NodeShape({
        data: {
          id: `glow-${i}`,
          x,
          y: 0,
          shape: 'circle',
          size: 45,
          effects: {
            glow: {
              enabled: true,
              color,
              blur: 20,
              animated: true,
              duration: args.animationDuration,
            },
          },
        },
        style: {
          fill: color,
          stroke: 'rgba(255,255,255,0.3)',
          strokeWidth: 2,
        },
        registry: canvas.registry,
      });

      canvas.addToNodeLayer(node);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const createEdgeAnimation = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Edge Animation</strong> - Animated data flow on edges';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 300,
      backgroundColor: args.backgroundColor,
    });

    await canvas.init();

    // Create nodes
    const nodePositions = [
      { id: 'server', x: -200, y: 0, label: 'Server', fill: '#4caf50' },
      { id: 'process', x: 0, y: 0, label: 'Process', fill: '#2196f3' },
      { id: 'client', x: 200, y: 0, label: 'Client', fill: '#ff9800' },
    ];

    nodePositions.forEach((pos) => {
      const node = new NodeShape({
        data: {
          id: pos.id,
          x: pos.x,
          y: pos.y,
          shape: 'roundedRect',
          width: 80,
          height: 50,
          label: pos.label,
        },
        style: {
          fill: pos.fill,
          stroke: '#333',
          strokeWidth: 2,
          labelStyle: {
            fill: '#ffffff',
            fontSize: 12,
            fontWeight: 'bold',
          },
        },
        registry: canvas.registry,
      });

      canvas.addToNodeLayer(node);
    });

    // Create animated edges
    const edges = [
      { source: { x: -160, y: 0 }, target: { x: -40, y: 0 } },
      { source: { x: 40, y: 0 }, target: { x: 160, y: 0 } },
    ];

    edges.forEach((e, i) => {
      const edge = new EdgeShape({
        data: {
          id: `flow-edge-${i}`,
          source: e.source,
          target: e.target,
          pathType: 'line',
          arrowTarget: 'triangle',
          animation: {
            type: 'dash',
            duration: args.animationDuration,
            direction: 'forward',
          },
        },
        style: {
          stroke: '#666',
          strokeWidth: 3,
        },
        registry: canvas.registry,
      });

      canvas.addToEdgeLayer(edge);
    });

    setTimeout(() => canvas.fitContent(50), 100);
  });

  return wrapper;
};

const meta: Meta<AnimationsArgs> = {
  title: 'Canvas/Animations',
  render: (args) => createPulseAnimation(args),
  argTypes: {
    backgroundColor: { control: 'color' },
    animationDuration: { control: { type: 'range', min: 500, max: 3000, step: 100 } },
  },
  args: {
    backgroundColor: '#ffffff',
    animationDuration: 1000,
  },
};

export default meta;

type Story = StoryObj<AnimationsArgs>;

export const PulseAnimation: Story = {};

export const RippleEffect: Story = {
  render: (args) => createRippleEffect(args),
};

export const GlowEffect: Story = {
  render: (args) => createGlowEffect(args),
};

export const EdgeAnimation: Story = {
  render: (args) => createEdgeAnimation(args),
};

export const FastAnimations: Story = {
  args: {
    animationDuration: 500,
  },
};

export const SlowAnimations: Story = {
  args: {
    animationDuration: 2500,
  },
};
