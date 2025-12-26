import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@aspect-ui/canvas-core';

interface NodeFillsArgs {
  backgroundColor: string;
}

const meta: Meta<NodeFillsArgs> = {
  title: 'Canvas/Node Fills',
  argTypes: {
    backgroundColor: { 
      control: 'color',
      description: 'Background color of the canvas',
    },
  },
  args: {
    backgroundColor: '#f5f5f5',
  },
};

export default meta;
type Story = StoryObj<NodeFillsArgs>;

// Story 1: Gradient Patterns - showing linear and radial gradients on all shapes
export const GradientPatterns: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Gradient Fill Patterns</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Top row: Linear gradients on all node shapes<br/>
        Bottom row: Radial gradients on all node shapes
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 1400px; height: 600px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 1400,
        height: 600,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const shapes = [
        'circle', 'rect', 'roundedRect', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon'
      ] as const;

      const gradients = [
        // Linear gradients (top row)
        { x0: 0, y0: 0, x1: 1, y1: 1, stops: [
          { offset: 0, color: '#FF6B6B' },
          { offset: 1, color: '#4ECDC4' }
        ]},
        { x0: 0, y0: 0, x1: 1, y1: 1, stops: [
          { offset: 0, color: '#A8E6CF' },
          { offset: 1, color: '#3D5A80' }
        ]},
        { x0: 0, y0: 0.5, x1: 1, y1: 0.5, stops: [
          { offset: 0, color: '#FFD93D' },
          { offset: 1, color: '#6BCF7F' }
        ]},
        { x0: 0.5, y0: 0, x1: 0.5, y1: 1, stops: [
          { offset: 0, color: '#FF6B9D' },
          { offset: 1, color: '#C44569' }
        ]},
        { x0: 0, y0: 0, x1: 1, y1: 0, stops: [
          { offset: 0, color: '#667EEA' },
          { offset: 1, color: '#764BA2' }
        ]},
        { x0: 0, y0: 1, x1: 1, y1: 0, stops: [
          { offset: 0, color: '#F093FB' },
          { offset: 1, color: '#F5576C' }
        ]},
        { x0: 0, y0: 0, x1: 1, y1: 1, stops: [
          { offset: 0, color: '#4FACFE' },
          { offset: 0.5, color: '#00F2FE' },
          { offset: 1, color: '#43E97B' }
        ]},
        { x0: 0, y0: 0, x1: 1, y1: 1, stops: [
          { offset: 0, color: '#FA8BFF' },
          { offset: 0.5, color: '#2BD2FF' },
          { offset: 1, color: '#2BFF88' }
        ]},
        { x0: 0, y0: 0, x1: 1, y1: 1, stops: [
          { offset: 0, color: '#FEE140' },
          { offset: 1, color: '#FA709A' }
        ]},
      ];

      const radialGradients = [
        // Radial gradients (bottom row)
        { x: 0.5, y: 0.5, radius: 0.8, stops: [
          { offset: 0, color: '#FFE66D' },
          { offset: 1, color: '#FF6B6B' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.8, stops: [
          { offset: 0, color: '#FFFFFF' },
          { offset: 1, color: '#667EEA' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.7, stops: [
          { offset: 0, color: '#56CCF2' },
          { offset: 1, color: '#2F80ED' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.8, stops: [
          { offset: 0, color: '#F5576C' },
          { offset: 1, color: '#8B008B' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.9, stops: [
          { offset: 0, color: '#A8FF78' },
          { offset: 1, color: '#78FFD6' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.8, stops: [
          { offset: 0, color: '#FFD26F' },
          { offset: 0.5, color: '#FF8C42' },
          { offset: 1, color: '#C44569' }
        ]},
        { x: 0.3, y: 0.3, radius: 1.0, stops: [
          { offset: 0, color: '#FFFFFF' },
          { offset: 1, color: '#00D4FF' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.8, stops: [
          { offset: 0, color: '#96DEDA' },
          { offset: 1, color: '#50C9C3' }
        ]},
        { x: 0.5, y: 0.5, radius: 0.8, stops: [
          { offset: 0, color: '#FEAC5E' },
          { offset: 0.5, color: '#C779D0' },
          { offset: 1, color: '#4BC0C8' }
        ]},
      ];

      const nodes = [];

      // Top row - Linear gradients
      shapes.forEach((shape, i) => {
        nodes.push({
          data: {
            id: `linear-${i}`,
            x: 150 + i * 140,
            y: 150,
            shape,
            size: 60,
            label: shape,
          },
          style: {
            fill: {
              type: 'linear' as const,
              ...gradients[i],
            },
            stroke: '#333',
            strokeWidth: 2,
            labelStyle: {
              fill: '#ffffff',
              fontSize: 10,
              fontWeight: 'bold',
            },
          },
        });
      });

      // Bottom row - Radial gradients
      shapes.forEach((shape, i) => {
        nodes.push({
          data: {
            id: `radial-${i}`,
            x: 150 + i * 140,
            y: 400,
            shape,
            size: 60,
            label: shape,
          },
          style: {
            fill: {
              type: 'radial' as const,
              ...radialGradients[i],
            },
            stroke: '#333',
            strokeWidth: 2,
            labelStyle: {
              fill: '#ffffff',
              fontSize: 10,
              fontWeight: 'bold',
            },
          },
        });
      });

      const data: CanvasData = {
        nodes,
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story 2: Image Fills - showing image fills on all shapes
export const ImageFills: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Image Fill Patterns</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Top row: Cover mode (image fills shape, crops if needed)<br/>
        Middle row: Contain mode (image fits inside shape)<br/>
        Bottom row: Fill mode (image stretches to fill shape)
      </p>
      <p style="margin: 8px 0 0 0; opacity: 0.6; font-size: 12px;">
        Note: Using placeholder images. Replace with your own images for production.
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 1400px; height: 800px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 1400,
        height: 800,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const shapes = [
        'circle', 'rect', 'roundedRect', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon'
      ] as const;

      // Using different placeholder image services for variety
      const imageUrls = [
        'https://picsum.photos/200/200?random=1',
        'https://picsum.photos/200/200?random=2',
        'https://picsum.photos/200/200?random=3',
        'https://picsum.photos/200/200?random=4',
        'https://picsum.photos/200/200?random=5',
        'https://picsum.photos/200/200?random=6',
        'https://picsum.photos/200/200?random=7',
        'https://picsum.photos/200/200?random=8',
        'https://picsum.photos/200/200?random=9',
      ];

      const nodes = [];

      // Top row - Cover mode (fills and crops)
      shapes.forEach((shape, i) => {
        nodes.push({
          data: {
            id: `cover-${i}`,
            x: 150 + i * 140,
            y: 150,
            shape,
            size: 70,
            label: 'cover',
          },
          style: {
            fill: {
              type: 'image' as const,
              src: imageUrls[i],
              fit: 'cover' as const,
              alignX: 0.5,
              alignY: 0.5,
            },
            stroke: '#333',
            strokeWidth: 2,
            labelStyle: {
              fill: '#ffffff',
              fontSize: 9,
              fontWeight: 'bold',
            },
          },
        });
      });

      // Middle row - Contain mode (fits inside)
      shapes.forEach((shape, i) => {
        nodes.push({
          data: {
            id: `contain-${i}`,
            x: 150 + i * 140,
            y: 400,
            shape,
            size: 70,
            label: 'contain',
          },
          style: {
            fill: {
              type: 'image' as const,
              src: imageUrls[i],
              fit: 'contain' as const,
              alignX: 0.5,
              alignY: 0.5,
            },
            stroke: '#333',
            strokeWidth: 2,
            labelStyle: {
              fill: '#333333',
              fontSize: 9,
              fontWeight: 'bold',
            },
          },
        });
      });

      // Bottom row - Fill mode (stretches)
      shapes.forEach((shape, i) => {
        nodes.push({
          data: {
            id: `fill-${i}`,
            x: 150 + i * 140,
            y: 650,
            shape,
            size: 70,
            label: 'fill',
          },
          style: {
            fill: {
              type: 'image' as const,
              src: imageUrls[i],
              fit: 'fill' as const,
              alignX: 0.5,
              alignY: 0.5,
            },
            stroke: '#333',
            strokeWidth: 2,
            labelStyle: {
              fill: '#ffffff',
              fontSize: 9,
              fontWeight: 'bold',
            },
          },
        });
      });

      const data: CanvasData = {
        nodes,
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story 3: Icon/Avatar Style - centered icons in shapes with tinted backgrounds
export const IconAvatars: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Icon/Avatar Style Fills</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Images with colored tints and contain mode for icon/avatar style nodes
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 1400px; height: 400px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 1400,
        height: 400,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const shapes = [
        'circle', 'rect', 'roundedRect', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'hexagon', 'octagon'
      ] as const;

      const tints = [
        0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0x6BCF7F,
        0x667EEA, 0xFF6B9D, 0x4FACFE, 0xFA8BFF, 0xFEE140
      ];

      const imageUrls = [
        'https://picsum.photos/100/100?random=10',
        'https://picsum.photos/100/100?random=11',
        'https://picsum.photos/100/100?random=12',
        'https://picsum.photos/100/100?random=13',
        'https://picsum.photos/100/100?random=14',
        'https://picsum.photos/100/100?random=15',
        'https://picsum.photos/100/100?random=16',
        'https://picsum.photos/100/100?random=17',
        'https://picsum.photos/100/100?random=18',
      ];

      const nodes = shapes.map((shape, i) => ({
        data: {
          id: `icon-${i}`,
          x: 150 + i * 140,
          y: 200,
          shape,
          size: 80,
          label: shape,
          labelPlacement: 'bottom' as const,
        },
        style: {
          fill: {
            type: 'image' as const,
            src: imageUrls[i],
            fit: 'contain' as const,
            alignX: 0.5,
            alignY: 0.5,
            tint: tints[i],
            alpha: 0.9,
          },
          stroke: '#333',
          strokeWidth: 3,
          labelStyle: {
            fill: '#333333',
            fontSize: 11,
            fontWeight: '500',
          },
        },
      }));

      const data: CanvasData = {
        nodes,
        edges: [],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};

// Story 4: Mixed Fills - combining different fill types
export const MixedFills: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Mixed Fill Types</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Demonstrating solid colors, gradients, and images together in a network
      </p>
    `;

    const container = document.createElement('div');
    container.style.cssText = 'width: 1000px; height: 600px; border-radius: 8px; overflow: hidden;';
    
    wrapper.appendChild(info);
    wrapper.appendChild(container);

    setTimeout(async () => {
      const canvas = new Canvas({
        container,
        width: 1000,
        height: 600,
        backgroundColor: args.backgroundColor,
      });

      await canvas.init();

      const data: CanvasData = {
        nodes: [
          // Solid color
          {
            data: {
              id: 'solid-1',
              x: 200,
              y: 150,
              shape: 'circle',
              size: 60,
              label: 'Solid',
            },
            style: {
              fill: '#4ECDC4',
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
          // Linear gradient
          {
            data: {
              id: 'gradient-1',
              x: 500,
              y: 150,
              shape: 'roundedRect',
              size: 60,
              label: 'Gradient',
            },
            style: {
              fill: {
                type: 'linear' as const,
                x0: 0, y0: 0, x1: 1, y1: 1,
                stops: [
                  { offset: 0, color: '#667EEA' },
                  { offset: 1, color: '#764BA2' }
                ],
              },
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
          // Image fill
          {
            data: {
              id: 'image-1',
              x: 800,
              y: 150,
              shape: 'hexagon',
              size: 60,
              label: 'Image',
            },
            style: {
              fill: {
                type: 'image' as const,
                src: 'https://picsum.photos/150/150?random=20',
                fit: 'cover' as const,
              },
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
          // Radial gradient
          {
            data: {
              id: 'radial-1',
              x: 350,
              y: 400,
              shape: 'diamond',
              size: 60,
              label: 'Radial',
            },
            style: {
              fill: {
                type: 'radial' as const,
                x: 0.5, y: 0.5, radius: 0.8,
                stops: [
                  { offset: 0, color: '#FFE66D' },
                  { offset: 1, color: '#FF6B6B' }
                ],
              },
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
          // Image with tint
          {
            data: {
              id: 'tinted-1',
              x: 650,
              y: 400,
              shape: 'octagon',
              size: 60,
              label: 'Tinted',
            },
            style: {
              fill: {
                type: 'image' as const,
                src: 'https://picsum.photos/150/150?random=21',
                fit: 'cover' as const,
                tint: 0xFF6B9D,
                alpha: 0.85,
              },
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
        ],
        edges: [
          {
            data: {
              id: 'edge-1',
              source: 'solid-1',
              target: 'gradient-1',
              pathType: 'bezier' as const,
            },
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            data: {
              id: 'edge-2',
              source: 'gradient-1',
              target: 'image-1',
              pathType: 'bezier' as const,
            },
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            data: {
              id: 'edge-3',
              source: 'solid-1',
              target: 'radial-1',
              pathType: 'line' as const,
            },
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            data: {
              id: 'edge-4',
              source: 'gradient-1',
              target: 'radial-1',
              pathType: 'line' as const,
            },
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            data: {
              id: 'edge-5',
              source: 'radial-1',
              target: 'tinted-1',
              pathType: 'bezier' as const,
            },
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            data: {
              id: 'edge-6',
              source: 'image-1',
              target: 'tinted-1',
              pathType: 'line' as const,
            },
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
        ],
      };

      canvas.render(data);
    }, 0);

    return wrapper;
  },
};
