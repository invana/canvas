import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@invana/canvas-core';

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
        'circle', 'rect', 'hexagon', 'ellipse',
        'triangle', 'diamond', 'pentagon', 'octagon'
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
          id: `linear-${i}`,
          x: 150 + i * 140,
          y: 150,
          shape,
          size: 60,
          label: shape,
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
          id: `radial-${i}`,
          x: 150 + i * 140,
          y: 400,
          shape,
          size: 60,
          label: shape,
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

// Story 2: SVG Data URI Images - inline SVG images as base64
export const SVGDataURIImages: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">SVG Data URI Image Fills</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Using inline SVG images encoded as base64 data URIs<br/>
        <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">data:image/svg+xml;base64,...</code>
      </p>
      <p style="margin: 8px 0 0 0; opacity: 0.6; font-size: 12px;">
        Best for: Icons, logos, and vector graphics. No external dependencies.
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
        'circle', 'rect', 'hexagon', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'octagon'
      ] as const;

      // SVG data URIs with different designs
      const svgImages = [
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="g1" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:#FF6B6B"/><stop offset="100%" style="stop-color:#C44569"/></linearGradient></defs><rect width="200" height="200" fill="url(#g1)"/><circle cx="100" cy="100" r="40" fill="white" opacity="0.3"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#4ECDC4"/><path d="M 50 150 L 100 50 L 150 150 Z" fill="white" opacity="0.4"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="r1"><stop offset="0%" style="stop-color:#A8E6CF"/><stop offset="100%" style="stop-color:#56ab2f"/></radialGradient></defs><rect width="200" height="200" fill="url(#r1)"/><rect x="60" y="60" width="80" height="80" fill="white" opacity="0.3"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FFD93D"/><polygon points="100,40 120,80 160,80 130,110 140,150 100,120 60,150 70,110 40,80 80,80" fill="#f39c12"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FF6B9D"/><circle cx="70" cy="70" r="30" fill="white" opacity="0.2"/><circle cx="130" cy="130" r="40" fill="white" opacity="0.3"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#667EEA"/><path d="M 0 100 Q 50 50 100 100 T 200 100 L 200 200 L 0 200 Z" fill="white" opacity="0.3"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#F093FB"/><rect x="20" y="20" width="160" height="160" fill="none" stroke="white" stroke-width="8" opacity="0.4"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p1" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse"><circle cx="20" cy="20" r="8" fill="white" opacity="0.3"/></pattern></defs><rect width="200" height="200" fill="#4FACFE"/><rect width="200" height="200" fill="url(#p1)"/></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="200" height="200" fill="#FA8BFF"/><path d="M 100 50 L 150 100 L 100 150 L 50 100 Z" fill="white" opacity="0.4" transform="rotate(45 100 100)"/></svg>'),
      ];

      const nodes = shapes.map((shape, i) => ({
        id: `svg-${i}`,
        x: 150 + i * 140,
        y: 200,
        shape,
        size: 70,
        label: shape,
        style: {
          fill: {
            type: 'image' as const,
            src: svgImages[i],
            fit: 'cover' as const,
            alignX: 0.5,
            alignY: 0.5,
          },
          stroke: '#333',
          strokeWidth: 2,
          labelStyle: {
            fill: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold',
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

// Story 3: Base64 PNG Images - raster images as base64
export const Base64PNGImages: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Base64 PNG Image Fills</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Using base64-encoded PNG images<br/>
        <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">data:image/png;base64,iVBORw0KG...</code>
      </p>
      <p style="margin: 8px 0 0 0; opacity: 0.6; font-size: 12px;">
        Best for: Small raster images, pixel art. Increases bundle size.
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
        'circle', 'rect', 'hexagon', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'octagon'
      ] as const;

      // Small 32x32 colored PNG images as base64 (these are tiny solid color PNGs)
      const pngImages = [
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OMQ0AAAwCoP6/aE/AYCAkJycnJycnJycnJycnJycnJyfHAQBvAAG4AAAAAElFTkSuQmCC', // Red
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OIQ0AAAzD0P//6BAOBEJycnJycnJycnJycnJycnJycnJyHADmAAG4AAAAAElFTkSuQmCC', // Blue
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OQQ0AAAwCoP6/aE/AYGBISEhISEhISEhISEhISEhISEhIyAEAcgABuAAAAAElFTkSuQmCC', // Green
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OQQ0AAAwCoP6/6BUYDIyEhISEhISEhISEhISEhISEhISEhBwAvwABuAAAAAElFTkSuQmCC', // Yellow
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OIQ0AAAzE0L9/dAoMBkZCQkJCQkJCQkJCQkJCQkJCQkJCQg4AZwABuAAAAAElFTkSuQmCC', // Purple
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OIQ0AAAzE0M9/dAgHAiMhISEhISEhISEhISEhISEhISEhIQcAYgABuAAAAAElFTkSuQmCC', // Cyan
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OIQ0AAAzE0N9/dAgMBkZCQkJCQkJCQkJCQkJCQkJCQkJCQg4AYAABuAAAAAElFTkSuQmCC', // Pink
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OIQ0AAAzE0P+/aE/AYCAkJCQkJCQkJCQkJCQkJCQkJCQkJOQAcAABuAAAAAElFTkSuQmCC', // Orange
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAKklEQVR42u3OIQ0AAAwDoP+/6BAOBEJCQkJCQkJCQkJCQkJCQkJCQkJCQg4AZgABuAAAAAElFTkSuQmCC', // Gray
      ];

      const nodes = shapes.map((shape, i) => ({
        id: `png-${i}`,
        x: 150 + i * 140,
        y: 200,
        shape,
        size: 70,
        label: shape,
        style: {
          fill: {
            type: 'image' as const,
            src: pngImages[i],
            fit: 'fill' as const,
            alignX: 0.5,
            alignY: 0.5,
          },
          stroke: '#333',
          strokeWidth: 2,
          labelStyle: {
            fill: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold',
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

// Story 4: External URL Images - loading from CDN/external URLs
export const ExternalURLImages: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">External URL Image Fills</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        Loading images from external URLs (CDN, API, etc.)<br/>
        <code style="background: #f0f0f0; padding: 2px 4px; border-radius: 3px;">https://example.com/image.png</code>
      </p>
      <p style="margin: 8px 0 0 0; opacity: 0.6; font-size: 12px;">
        Best for: User avatars, dynamic content. Requires network access and CORS configuration.
      </p>
      <p style="margin: 8px 0 0 0; color: #e74c3c; font-size: 12px;">
        ⚠️ Using placeholder service - may show gray fallback if service is unavailable.
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
        'circle', 'rect', 'hexagon', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'octagon'
      ] as const;

      // Using placeholder URLs with .png extension so PixiJS can detect the format
      // Note: These URLs may fail due to CORS or service availability
      const externalUrls = [
        'https://via.placeholder.com/200/FF6B6B/FFFFFF.png?text=1',
        'https://via.placeholder.com/200/4ECDC4/FFFFFF.png?text=2',
        'https://via.placeholder.com/200/A8E6CF/FFFFFF.png?text=3',
        'https://via.placeholder.com/200/FFD93D/000000.png?text=4',
        'https://via.placeholder.com/200/FF6B9D/FFFFFF.png?text=5',
        'https://via.placeholder.com/200/667EEA/FFFFFF.png?text=6',
        'https://via.placeholder.com/200/F093FB/FFFFFF.png?text=7',
        'https://via.placeholder.com/200/4FACFE/FFFFFF.png?text=8',
        'https://via.placeholder.com/200/FA8BFF/FFFFFF.png?text=9',
      ];

      const nodes = shapes.map((shape, i) => ({
        id: `url-${i}`,
        x: 150 + i * 140,
        y: 200,
        shape,
        size: 70,
        label: shape,
        style: {
          fill: {
            type: 'image' as const,
            src: externalUrls[i],
            fit: 'cover' as const,
            alignX: 0.5,
            alignY: 0.5,
          },
          stroke: '#333',
          strokeWidth: 2,
          labelStyle: {
            fill: '#ffffff',
            fontSize: 10,
            fontWeight: 'bold',
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

// Story 5: Image Fit Modes - comparing different fit modes
export const ImageFitModes: Story = {
  render: (args) => {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; width: 100%; height: 100%;';

    const info = document.createElement('div');
    info.style.cssText = 'padding: 16px; color: #333; font-family: system-ui;';
    info.innerHTML = `
      <h3 style="margin: 0 0 8px 0;">Image Fit Modes Comparison</h3>
      <p style="margin: 0; opacity: 0.8; font-size: 14px;">
        <strong>Cover:</strong> Image fills shape, crops if needed (maintains aspect ratio)<br/>
        <strong>Contain:</strong> Image fits inside shape (maintains aspect ratio)<br/>
        <strong>Fill:</strong> Image stretches to fill shape (may distort)<br/>
        <strong>None:</strong> Image at original size, positioned by align values
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
        'circle', 'rect', 'hexagon', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'octagon'
      ] as const;

      // SVG with clear aspect ratio for testing fit modes
      const testImage = 'data:image/svg+xml;base64,' + btoa('<svg width="300" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="300" height="200" fill="#667EEA"/><rect x="10" y="10" width="280" height="180" fill="none" stroke="white" stroke-width="4"/><text x="150" y="100" text-anchor="middle" dominant-baseline="middle" fill="white" font-size="32" font-family="Arial">300×200</text></svg>');

      const nodes = [];
      const fitModes = ['cover', 'contain', 'fill', 'none'] as const;

      fitModes.forEach((mode, rowIndex) => {
        shapes.forEach((shape, i) => {
          nodes.push({
            id: `${mode}-${i}`,
            x: 150 + i * 140,
            y: 150 + rowIndex * 180,
            shape,
            size: 70,
            label: mode,
            style: {
              fill: {
                type: 'image' as const,
                src: testImage,
                fit: mode,
                alignX: 0.5,
                alignY: 0.5,
              },
              stroke: '#333',
              strokeWidth: 2,
              labelStyle: {
                fill: rowIndex === 1 ? '#333333' : '#ffffff',
                fontSize: 9,
                fontWeight: 'bold',
              },
            },
          });
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

// Story 6: Icon/Avatar Style - centered icons in shapes with tinted backgrounds
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
        'circle', 'rect', 'hexagon', 'ellipse', 
        'triangle', 'diamond', 'pentagon', 'octagon'
      ] as const;

      const tints = [
        0xFF6B6B, 0x4ECDC4, 0xFFD93D, 0x6BCF7F,
        0x667EEA, 0xFF6B9D, 0x4FACFE, 0xFA8BFF, 0xFEE140
      ];

      const iconUrls = [
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#3498db"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">A</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#2ecc71"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">B</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#e74c3c"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">C</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#f39c12"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">D</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#9b59b6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">E</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#1abc9c"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">F</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#34495e"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">G</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#e67e22"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">H</text></svg>'),
        'data:image/svg+xml;base64,' + btoa('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg"><circle cx="50" cy="50" r="50" fill="#95a5a6"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="48" font-family="Arial">I</text></svg>'),
      ];

      const nodes = shapes.map((shape, i) => ({
        id: `icon-${i}`,
        x: 150 + i * 140,
        y: 200,
        shape,
        size: 80,
        label: shape,
        labelPlacement: 'bottom' as const,
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

// Story 7: Mixed Fills - combining different fill types
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
            id: 'solid-1',
            x: 200,
            y: 150,
            shape: 'circle',
            size: 60,
            label: 'Solid',
            style: {
              fill: '#4ECDC4',
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
          // Linear gradient
          {
            id: 'gradient-1',
            x: 500,
            y: 150,
            shape: 'rect',
            cornerRadius: 8,
            size: 60,
            label: 'Gradient',
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
            id: 'image-1',
            x: 800,
            y: 150,
            shape: 'hexagon',
            size: 60,
            label: 'Image',
            style: {
              fill: {
                type: 'image' as const,
                src: 'data:image/svg+xml;base64,' + btoa('<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="#FF6B6B"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24" font-family="Arial">User</text></svg>'),
                fit: 'cover' as const,
              },
              stroke: '#2C3E50',
              strokeWidth: 2,
              labelStyle: { fill: '#ffffff', fontSize: 12 },
            },
          },
          // Radial gradient
          {
            id: 'radial-1',
            x: 350,
            y: 400,
            shape: 'diamond',
            size: 60,
            label: 'Radial',
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
            id: 'tinted-1',
            x: 650,
            y: 400,
            shape: 'octagon',
            size: 60,
            label: 'Tinted',
            style: {
              fill: {
                type: 'image' as const,
                src: 'data:image/svg+xml;base64,' + btoa('<svg width="150" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="150" height="150" fill="#4ECDC4"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="white" font-size="24" font-family="Arial">Data</text></svg>'),
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
            id: 'edge-1',
            source: 'solid-1',
            target: 'gradient-1',
            pathType: 'bezier' as const,
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            id: 'edge-2',
            source: 'gradient-1',
            target: 'image-1',
            pathType: 'bezier' as const,
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            id: 'edge-3',
            source: 'solid-1',
            target: 'radial-1',
            pathType: 'line' as const,
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            id: 'edge-4',
            source: 'gradient-1',
            target: 'radial-1',
            pathType: 'line' as const,
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            id: 'edge-5',
            source: 'radial-1',
            target: 'tinted-1',
            pathType: 'bezier' as const,
            style: {
              stroke: '#95a5a6',
              strokeWidth: 2,
            },
          },
          {
            id: 'edge-6',
            source: 'image-1',
            target: 'tinted-1',
            pathType: 'line' as const,
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
