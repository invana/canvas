import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData, NodeShape } from '@aspect-ui/canvas-core';

interface AnimationsArgs {
  backgroundColor: string;
  animationDuration: number;
}

const generatePulseData = (): CanvasData => {
  const colors = ['#e91e63', '#9c27b0', '#3f51b5', '#2196f3', '#00bcd4'];

  const nodes = colors.map((color, i) => ({
    id: `pulse-${i}`,
    x: (i - 2) * 130,
    y: 0,
    shape: 'circle' as const,
    size: 40,
    fill: color,
    stroke: '#333',
    strokeWidth: 2,
  }));

  return { nodes, edges: [] };
};

const createPulseAnimation = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Pulse Animation</strong> - Nodes with pulsing effect (via custom animation)';
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
      data: generatePulseData(),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();

    // Add simple scale animation to nodes
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const baseScale = 1;
      const animateScale = () => {
        const time = Date.now() / (args.animationDuration + i * 200);
        const scale = baseScale + Math.sin(time) * 0.1;
        node.scale.set(scale);
        requestAnimationFrame(animateScale);
      };
      animateScale();
    });
  });

  return wrapper;
};

const generateRippleData = (): CanvasData => {
  const positions = [
    { x: -150, y: -50, color: '#e91e63' },
    { x: 0, y: 50, color: '#4caf50' },
    { x: 150, y: -50, color: '#2196f3' },
  ];

  const nodes = positions.map((pos, i) => ({
    id: `ripple-${i}`,
    x: pos.x,
    y: pos.y,
    shape: 'circle' as const,
    size: 50,
    fill: pos.color,
    stroke: '#333',
    strokeWidth: 2,
    rippleColor: pos.color,
  }));

  return { nodes, edges: [] };
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
  info.innerHTML = '<strong>Ripple Effect</strong> - Click on nodes to trigger ripple';
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
      data: generateRippleData(),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();

    // Add ripple animations
    const colors = ['#e91e63', '#4caf50', '#2196f3'];
    canvas.getNodes().forEach((node, i) => {
      // Start continuous ripple
      node.startRipple({
        duration: args.animationDuration + i * 300,
        color: colors[i],
        ringCount: 3,
        loop: true,
      });

      // Trigger single ripple on click
      node.on('pointertap', () => {
        node.stopRipple();
        node.triggerRipple({
          duration: 800,
          color: '#ffffff',
          ringCount: 2,
        });
      });
    });
  });

  return wrapper;
};

const generateGlowData = (): CanvasData => {
  const glowColors = ['#00ff88', '#ff00ff', '#00ffff', '#ffff00'];

  const nodes = glowColors.map((color, i) => ({
    id: `glow-${i}`,
    x: (i - 1.5) * 160,
    y: 0,
    shape: 'circle' as const,
    size: 45,
    label: color,
    fill: color,
    stroke: '#333',
    strokeWidth: 2,
    labelStyle: {
      fill: '#ffffff',
      fontSize: 10,
    },
  }));

  return { nodes, edges: [] };
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
  info.innerHTML = '<strong>Glow Effect</strong> - Nodes with animated glow (via opacity animation)';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.backgroundColor = '#1a1a2e';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 800,
      height: container.clientHeight || 300,
      backgroundColor: '#1a1a2e',
      data: generateGlowData(),
      fitPadding: 50,
    });

    await canvas.init();
    canvas.render();

    // Add glow effect via alpha animation
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const animateGlow = () => {
        const time = Date.now() / (args.animationDuration + i * 200);
        const alpha = 0.7 + Math.sin(time) * 0.3;
        node.alpha = alpha;
        requestAnimationFrame(animateGlow);
      };
      animateGlow();
    });
  });

  return wrapper;
};

const meta: Meta<AnimationsArgs> = {
  title: 'Canvas/Animations',
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

export const PulseAnimation: Story = {
  render: (args) => createPulseAnimation(args),
};

export const RippleEffect: Story = {
  render: (args) => createRippleEffect(args),
};

export const GlowEffect: Story = {
  render: (args) => createGlowEffect(args),
  args: {
    backgroundColor: '#1a1a2e',
  },
};

export const FastAnimations: Story = {
  render: (args) => createPulseAnimation(args),
  args: {
    animationDuration: 500,
  },
};

export const SlowAnimations: Story = {
  render: (args) => createPulseAnimation(args),
  args: {
    animationDuration: 2500,
  },
};
