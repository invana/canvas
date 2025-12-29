import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@invana/canvas-core';

interface ShapeAnimationsArgs {
  backgroundColor: string;
  animationSpeed: number;
  animationType: 'pulse' | 'rotate' | 'bounce' | 'ripple' | 'glow';
}

// Generate all shape types
const generateAllShapes = (): CanvasData => {
  const shapes = [
    { shape: 'circle', label: 'Circle', size: 50 },
    { shape: 'rect', label: 'Rect', width: 70, height: 50 },
    { shape: 'rect', label: 'Rounded', width: 70, height: 50, cornerRadius: 10 },
    { shape: 'ellipse', label: 'Ellipse', width: 80, height: 50 },
    { shape: 'triangle', label: 'Triangle', size: 55 },
    { shape: 'diamond', label: 'Diamond', size: 55 },
    { shape: 'pentagon', label: 'Pentagon', size: 50 },
    { shape: 'hexagon', label: 'Hexagon', size: 50 },
    { shape: 'octagon', label: 'Octagon', size: 50 },
  ];

  const nodes = shapes.map((config, i) => ({
    id: `shape-${i}`,
    x: (i - 4) * 140,
    y: 0,
    shape: config.shape as any,
    size: config.size,
    width: config.width,
    height: config.height,
    cornerRadius: config.cornerRadius,
    label: config.label,
    style: {
      fill: 0x4a90d9,
      stroke: 0x333333,
      strokeWidth: 2,
      labelStyle: {
        fill: '#ffffff',
        fontSize: 11,
      },
    },
  }));

  return { nodes, edges: [] };
};

const createPulseAllShapes = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Pulse Animation</strong> - All shape types with pulsing scale effect';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateAllShapes(),
      fitPadding: 80,
    });

    await canvas.init();

    // Add pulse animation to all nodes
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const baseScale = 1;
      const animatePulse = () => {
        const time = Date.now() / (args.animationSpeed + i * 100);
        const scale = baseScale + Math.sin(time) * 0.15;
        node.scale.set(scale);
        requestAnimationFrame(animatePulse);
      };
      animatePulse();
    });
  });

  return wrapper;
};

const createRotateAllShapes = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Rotation Animation</strong> - All shapes rotating continuously';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateAllShapes(),
      fitPadding: 80,
    });

    await canvas.init();

    // Add rotation animation
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const speed = (i % 2 === 0 ? 1 : -1) * (0.001 / args.animationSpeed) * 1000;
      const animateRotation = () => {
        node.rotation += speed;
        requestAnimationFrame(animateRotation);
      };
      animateRotation();
    });
  });

  return wrapper;
};

const createBounceAllShapes = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Bounce Animation</strong> - Vertical bouncing motion';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateAllShapes(),
      fitPadding: 80,
    });

    await canvas.init();

    // Add bounce animation
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const baseY = node.y;
      const animateBounce = () => {
        const time = Date.now() / (args.animationSpeed + i * 150);
        const offset = Math.abs(Math.sin(time)) * 30;
        node.y = baseY - offset;
        requestAnimationFrame(animateBounce);
      };
      animateBounce();
    });
  });

  return wrapper;
};

const createRippleAllShapes = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Ripple Effect</strong> - Click any shape to trigger ripple animation';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateAllShapes(),
      fitPadding: 80,
    });

    await canvas.init();

    // Add ripple effect on click
    const colors = [
      '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', 
      '#2196f3', '#00bcd4', '#009688', '#4caf50', '#ff9800'
    ];

    canvas.getNodes().forEach((node, i) => {
      // Start with continuous ripple
      node.startRipple({
        duration: args.animationSpeed + i * 200,
        color: colors[i],
        ringCount: 2,
        loop: true,
      });

      // Trigger single ripple on click
      node.on('pointertap', () => {
        node.stopRipple();
        node.triggerRipple({
          duration: 1000,
          color: '#ffffff',
          ringCount: 3,
        });
      });
    });
  });

  return wrapper;
};

const createGlowAllShapes = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Glow Effect</strong> - Animated glow with opacity changes';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.backgroundColor = '#1a1a2e';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const glowColors = [
      0x00ff88, 0xff00ff, 0x00ffff, 0xffff00, 
      0xff00aa, 0x00aaff, 0xaaff00, 0xff5500, 0x5500ff
    ];

    const nodes = glowColors.map((color, i) => ({
      id: `glow-${i}`,
      x: (i - 4) * 140,
      y: 0,
      shape: ['circle', 'rect', 'rect', 'ellipse', 'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon'][i] as any,
      size: 50,
      width: 70,
      height: 50,
      cornerRadius: 10,
      style: {
        fill: color,
        stroke: 0x333333,
        strokeWidth: 2,
      },
    }));

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: '#1a1a2e',
      fitPadding: 80,
    });

    await canvas.init();
    canvas.render({ nodes, edges: [] });

    // Add glow effect
    const canvasNodes = canvas.getNodes();
    canvasNodes.forEach((node, i) => {
      const animateGlow = () => {
        const time = Date.now() / (args.animationSpeed + i * 150);
        const alpha = 0.6 + Math.sin(time) * 0.4;
        node.alpha = alpha;
        requestAnimationFrame(animateGlow);
      };
      animateGlow();
    });
  });

  return wrapper;
};

const createCombinedAnimations = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Combined Animations</strong> - Multiple effects combined (pulse + rotate)';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateAllShapes(),
      fitPadding: 80,
    });

    await canvas.init();

    // Combine pulse and rotation
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const baseScale = 1;
      const rotationSpeed = (i % 2 === 0 ? 1 : -1) * 0.002;
      
      const animateCombined = () => {
        const time = Date.now() / (args.animationSpeed + i * 100);
        const scale = baseScale + Math.sin(time) * 0.1;
        node.scale.set(scale);
        node.rotation += rotationSpeed;
        requestAnimationFrame(animateCombined);
      };
      animateCombined();
    });
  });

  return wrapper;
};

const createSequentialAnimation = (args: ShapeAnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = '<strong>Sequential Animation</strong> - Wave effect across shapes';
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1200,
      height: container.clientHeight || 400,
      backgroundColor: args.backgroundColor,
      data: generateAllShapes(),
      fitPadding: 80,
    });

    await canvas.init();

    // Wave animation with phase offset
    const nodes = canvas.getNodes();
    nodes.forEach((node, i) => {
      const baseY = node.y;
      const phaseOffset = i * 0.5;
      
      const animateWave = () => {
        const time = Date.now() / args.animationSpeed;
        const offset = Math.sin(time + phaseOffset) * 40;
        node.y = baseY + offset;
        requestAnimationFrame(animateWave);
      };
      animateWave();
    });
  });

  return wrapper;
};

const meta: Meta<ShapeAnimationsArgs> = {
  title: 'Canvas/Shape Animations',
  argTypes: {
    backgroundColor: { control: 'color' },
    animationSpeed: { control: { type: 'range', min: 300, max: 2000, step: 100 } },
    animationType: {
      control: 'select',
      options: ['pulse', 'rotate', 'bounce', 'ripple', 'glow'],
    },
  },
  args: {
    backgroundColor: '#ffffff',
    animationSpeed: 1000,
    animationType: 'pulse',
  },
};

export default meta;

type Story = StoryObj<ShapeAnimationsArgs>;

export const PulseAnimation: Story = {
  render: (args) => createPulseAllShapes(args),
};

export const RotateAnimation: Story = {
  render: (args) => createRotateAllShapes(args),
};

export const BounceAnimation: Story = {
  render: (args) => createBounceAllShapes(args),
};

export const RippleAnimation: Story = {
  render: (args) => createRippleAllShapes(args),
};

export const GlowAnimation: Story = {
  render: (args) => createGlowAllShapes(args),
  args: {
    backgroundColor: '#1a1a2e',
  },
};

export const CombinedAnimations: Story = {
  render: (args) => createCombinedAnimations(args),
};

export const SequentialWave: Story = {
  render: (args) => createSequentialAnimation(args),
};

export const FastAnimations: Story = {
  render: (args) => createPulseAllShapes(args),
  args: {
    animationSpeed: 500,
  },
};

export const SlowAnimations: Story = {
  render: (args) => createPulseAllShapes(args),
  args: {
    animationSpeed: 2000,
  },
};
