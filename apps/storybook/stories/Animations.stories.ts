import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';
import type { AnimationType, NodeShapeType, EdgeShapeType } from '@aspect-ui/canvas-core';

interface AnimationsArgs {
  theme: 'light' | 'dark';
  animationDuration: number;
}

// All available node shapes
const nodeShapes: NodeShapeType[] = [
  'circle',
  'rectangle',
  'triangle',
  'diamond',
  'pentagon',
  'hexagon',
  'octagon',
];

// All available animations
const animations: AnimationType[] = [
  'pulse',
  'breathe',
  'shake',
  'bounce',
  'rotate',
  'blink',
  'ripple',
  'shape-ripple',
  'glow',
];

// All edge types
const edgeTypes: EdgeShapeType[] = [
  'straight',
  'bezier',
  'orthogonal',
];

// Colors for nodes
const nodeColors = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#E91E63', // Pink
  '#9C27B0', // Purple
  '#00BCD4', // Cyan
  '#795548', // Brown
];

// Colors for edges
const edgeColors = [
  '#E91E63', // Pink
  '#4CAF50', // Green
  '#2196F3', // Blue
];

/**
 * Node Animations Matrix - Shows all shapes with all animations
 */
const createNodeAnimationsMatrix = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '700px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = `
    <strong>Node Animations Matrix</strong> - All shapes × All animations<br/>
    <small>Rows: Shapes (${nodeShapes.join(', ')}) | Columns: Animations (${animations.join(', ')})</small>
  `;
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-node-animations-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '600px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '1200px';
      container.style.height = '600px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const startX = -500;
      const startY = -250;
      const spacingX = 130;
      const spacingY = 90;

      // Create matrix: rows = shapes, columns = animations
      nodeShapes.forEach((shape, shapeIndex) => {
        animations.forEach((animation, animIndex) => {
          const x = startX + animIndex * spacingX;
          const y = startY + shapeIndex * spacingY;

          canvas.addNode({
            id: `${shape}-${animation}`,
            x,
            y,
            style: {
              shape,
              size: 35,
              fill: nodeColors[shapeIndex % nodeColors.length],
              stroke: '#333',
              strokeWidth: 2,
              animation: {
                type: animation,
                duration: args.animationDuration,
                loop: true,
                intensity: 0.5,
              },
              label: animIndex === 0 ? {
                visible: true,
                text: shape,
                position: 'left',
                fontSize: 10,
                offsetX: -10,
              } : undefined,
            },
          });
        });
      });

      // Add column headers (animation names)
      animations.forEach((animation, animIndex) => {
        const x = startX + animIndex * spacingX;
        const y = startY - 60;

        canvas.addNode({
          id: `header-${animation}`,
          x,
          y,
          style: {
            shape: 'rectangle',
            width: 80,
            height: 25,
            fill: '#333',
            stroke: 'none',
            label: {
              visible: true,
              text: animation,
              fontSize: 10,
              textColor: '#fff',
              position: 'center',
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(50), 100);

      // Hover info
      canvas.on('node:hover', (data: unknown) => {
        const { node } = data as { node: { id: string } };
        if (!node.id.startsWith('header-')) {
          const [shape, anim] = node.id.split('-');
          info.innerHTML = `<strong>Hovering:</strong> ${shape} with <em>${anim}</em> animation`;
        }
      });

      canvas.on('node:hoverEnd', () => {
        info.innerHTML = `
          <strong>Node Animations Matrix</strong> - All shapes × All animations<br/>
          <small>Rows: Shapes | Columns: Animations</small>
        `;
      });

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

/**
 * Single Animation Showcase - Focus on one animation type across all shapes
 */
const createSingleAnimationShowcase = (animationType: AnimationType) => (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '400px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = `<strong>${animationType.charAt(0).toUpperCase() + animationType.slice(1)} Animation</strong> - Applied to all node shapes`;
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-${animationType}-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '300px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '900px';
      container.style.height = '300px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const spacing = 120;
      const startX = -((nodeShapes.length - 1) * spacing) / 2;

      nodeShapes.forEach((shape, index) => {
        canvas.addNode({
          id: `${shape}-node`,
          x: startX + index * spacing,
          y: 0,
          style: {
            shape,
            size: 50,
            fill: nodeColors[index % nodeColors.length],
            stroke: '#333',
            strokeWidth: 2,
            animation: {
              type: animationType,
              duration: args.animationDuration,
              loop: true,
              intensity: 0.6,
            },
            label: {
              visible: true,
              text: shape,
              position: 'bottom',
              fontSize: 11,
              offsetY: 10,
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(60), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

/**
 * Edge Animations - Shows edge types with animations
 */
const createEdgeAnimations = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '600px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = `
    <strong>Edge Animations</strong> - All edge types with animations<br/>
    <small>Rows: Edge types | Columns: Animations (pulse, glow, blink)</small>
  `;
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-edge-animations-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '500px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '1200px';
      container.style.height = '500px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const startX = -350;
      const startY = -120;
      const spacingX = 200;
      const spacingY = 100;
      const edgeLength = 140;

      // Edge animations that work well
      const edgeAnimations: AnimationType[] = ['pulse', 'glow', 'blink'];

      // Create matrix: rows = edge types, columns = animations
      edgeTypes.forEach((edgeType, rowIndex) => {
        edgeAnimations.forEach((animation, colIndex) => {
          const baseX = startX + colIndex * spacingX;
          const y = startY + rowIndex * spacingY;

          // Source node
          const sourceId = `source-${edgeType}-${animation}`;
          canvas.addNode({
            id: sourceId,
            x: baseX,
            y,
            style: {
              shape: 'circle',
              size: 25,
              fill: edgeColors[rowIndex % edgeColors.length],
              stroke: '#333',
              strokeWidth: 2,
            },
          });

          // Target node
          const targetId = `target-${edgeType}-${animation}`;
          canvas.addNode({
            id: targetId,
            x: baseX + edgeLength,
            y,
            style: {
              shape: 'circle',
              size: 25,
              fill: edgeColors[rowIndex % edgeColors.length],
              stroke: '#333',
              strokeWidth: 2,
            },
          });

          // Edge with animation
          canvas.addEdge({
            id: `edge-${edgeType}-${animation}`,
            source: sourceId,
            target: targetId,
            style: {
              type: edgeType,
              stroke: edgeColors[rowIndex % edgeColors.length],
              strokeWidth: 3,
              targetArrow: { type: 'triangle', size: 10 },
              animation: {
                type: animation,
                duration: args.animationDuration,
                loop: true,
                intensity: 0.5,
              },
            },
          });
        });

        // Row label
        canvas.addNode({
          id: `row-label-${edgeType}`,
          x: startX - 80,
          y: startY + rowIndex * spacingY,
          style: {
            shape: 'rectangle',
            width: 80,
            height: 25,
            fill: '#555',
            label: {
              visible: true,
              text: edgeType,
              fontSize: 11,
              textColor: '#fff',
              position: 'center',
            },
          },
        });
      });

      // Column headers
      edgeAnimations.forEach((animation, colIndex) => {
        canvas.addNode({
          id: `col-header-${animation}`,
          x: startX + colIndex * spacingX + edgeLength / 2,
          y: startY - 50,
          style: {
            shape: 'rectangle',
            width: 80,
            height: 25,
            fill: '#333',
            label: {
              visible: true,
              text: animation,
              fontSize: 11,
              textColor: '#fff',
              position: 'center',
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(50), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

/**
 * Interactive Animation Playground
 */
const createAnimationPlayground = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const controls = document.createElement('div');
  controls.style.padding = '10px';
  controls.style.fontFamily = 'sans-serif';
  controls.style.display = 'flex';
  controls.style.gap = '20px';
  controls.style.alignItems = 'center';
  controls.style.flexWrap = 'wrap';
  controls.innerHTML = `
    <strong>Animation Playground</strong>
    <label>Shape: <select id="shape-select">
      ${nodeShapes.map(s => `<option value="${s}">${s}</option>`).join('')}
    </select></label>
    <label>Animation: <select id="anim-select">
      <option value="none">none</option>
      ${animations.map(a => `<option value="${a}">${a}</option>`).join('')}
    </select></label>
    <label>Duration: <input type="range" id="duration-slider" min="500" max="3000" value="1000" /> <span id="duration-value">1000ms</span></label>
    <button id="apply-btn">Apply</button>
  `;
  wrapper.appendChild(controls);

  const container = document.createElement('div');
  container.id = `canvas-playground-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '350px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '800px';
      container.style.height = '350px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      // Create initial node
      canvas.addNode({
        id: 'playground-node',
        x: 0,
        y: 0,
        style: {
          shape: 'circle',
          size: 80,
          fill: '#4CAF50',
          stroke: '#2E7D32',
          strokeWidth: 4,
          label: {
            visible: true,
            text: 'Click Apply',
            position: 'center',
            fontSize: 12,
            textColor: '#fff',
          },
        },
      });

      // Setup controls
      const shapeSelect = controls.querySelector('#shape-select') as HTMLSelectElement;
      const animSelect = controls.querySelector('#anim-select') as HTMLSelectElement;
      const durationSlider = controls.querySelector('#duration-slider') as HTMLInputElement;
      const durationValue = controls.querySelector('#duration-value') as HTMLSpanElement;
      const applyBtn = controls.querySelector('#apply-btn') as HTMLButtonElement;

      durationSlider.addEventListener('input', () => {
        durationValue.textContent = `${durationSlider.value}ms`;
      });

      applyBtn.addEventListener('click', () => {
        const shape = shapeSelect.value as NodeShapeType;
        const animation = animSelect.value as AnimationType;
        const duration = parseInt(durationSlider.value, 10);

        canvas.updateNode('playground-node', {
          style: {
            shape,
            size: 80,
            fill: '#4CAF50',
            stroke: '#2E7D32',
            strokeWidth: 4,
            animation: animation !== 'none' ? {
              type: animation,
              duration,
              loop: true,
              intensity: 0.6,
            } : undefined,
            label: {
              visible: true,
              text: animation !== 'none' ? animation : shape,
              position: 'center',
              fontSize: 12,
              textColor: '#fff',
            },
          },
        });
      });

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

/**
 * All Animations Overview - Compact grid showing all animations
 */
const createAllAnimationsOverview = (args: AnimationsArgs): HTMLElement => {
  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.style.height = '500px';
  wrapper.style.display = 'flex';
  wrapper.style.flexDirection = 'column';

  const info = document.createElement('div');
  info.style.padding = '10px';
  info.style.fontFamily = 'sans-serif';
  info.innerHTML = `
    <strong>All Animations Overview</strong><br/>
    <small>Each animation shown on a circle node</small>
  `;
  wrapper.appendChild(info);

  const container = document.createElement('div');
  container.id = `canvas-all-anims-${Date.now()}`;
  container.style.flex = '1';
  container.style.minHeight = '400px';
  container.style.border = '1px solid #ccc';
  wrapper.appendChild(container);

  requestAnimationFrame(async () => {
    if (container.clientWidth === 0) {
      container.style.width = '1000px';
      container.style.height = '400px';
    }

    const canvas = new Canvas(container, {
      theme: args.theme,
      autoResize: true,
    });

    try {
      await canvas.initialize();

      const cols = 4;
      const spacing = 150;
      const startX = -((cols - 1) * spacing) / 2;
      const startY = -100;

      animations.forEach((animation, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        const x = startX + col * spacing;
        const y = startY + row * spacing;

        canvas.addNode({
          id: `anim-${animation}`,
          x,
          y,
          style: {
            shape: 'circle',
            size: 50,
            fill: nodeColors[index % nodeColors.length],
            stroke: '#333',
            strokeWidth: 2,
            animation: {
              type: animation,
              duration: args.animationDuration,
              loop: true,
              intensity: 0.6,
            },
            label: {
              visible: true,
              text: animation,
              position: 'bottom',
              fontSize: 12,
              offsetY: 15,
            },
          },
        });
      });

      setTimeout(() => canvas.fitToContent(60), 100);

    } catch (error) {
      console.error('Error:', error);
    }
  });

  return wrapper;
};

// Meta configuration
const meta: Meta<AnimationsArgs> = {
  title: 'Canvas/Animations',
  argTypes: {
    theme: {
      control: 'select',
      options: ['light', 'dark'],
    },
    animationDuration: {
      control: { type: 'range', min: 500, max: 3000, step: 100 },
    },
  },
  args: {
    theme: 'dark',
    animationDuration: 1000,
  },
};

export default meta;

type Story = StoryObj<AnimationsArgs>;

// Main stories
export const AllAnimationsOverview: Story = {
  name: 'All Animations Overview',
  render: (args) => createAllAnimationsOverview(args),
};

export const NodeAnimationsMatrix: Story = {
  name: 'Node Animations Matrix',
  render: (args) => createNodeAnimationsMatrix(args),
};

export const EdgeAnimations: Story = {
  name: 'Edge Animations',
  render: (args) => createEdgeAnimations(args),
};

export const AnimationPlayground: Story = {
  name: 'Interactive Playground',
  render: (args) => createAnimationPlayground(args),
};

// Individual animation stories
export const PulseAnimation: Story = {
  name: 'Pulse Animation',
  render: createSingleAnimationShowcase('pulse'),
};

export const BreatheAnimation: Story = {
  name: 'Breathe Animation',
  render: createSingleAnimationShowcase('breathe'),
};

export const ShakeAnimation: Story = {
  name: 'Shake Animation',
  render: createSingleAnimationShowcase('shake'),
};

export const BounceAnimation: Story = {
  name: 'Bounce Animation',
  render: createSingleAnimationShowcase('bounce'),
};

export const RotateAnimation: Story = {
  name: 'Rotate Animation',
  render: createSingleAnimationShowcase('rotate'),
};

export const BlinkAnimation: Story = {
  name: 'Blink Animation',
  render: createSingleAnimationShowcase('blink'),
};

export const RippleAnimation: Story = {
  name: 'Ripple Animation',
  render: createSingleAnimationShowcase('ripple'),
};

export const ShapeRippleAnimation: Story = {
  name: 'Shape Ripple Animation',
  render: createSingleAnimationShowcase('shape-ripple'),
};

export const GlowAnimation: Story = {
  name: 'Glow Animation',
  render: createSingleAnimationShowcase('glow'),
};
