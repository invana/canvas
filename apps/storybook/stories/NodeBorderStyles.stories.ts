import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

/**
 * Node Border Styles
 * 
 * Demonstrates different border/stroke styles for node shapes:
 * - solid: Continuous line (default)
 * - dashed: Dashed line pattern
 * - dotted: Dotted line pattern
 * - custom: Custom dash patterns via strokeDashPattern array
 * 
 * Note: PixiJS v8 doesn't fully support dash patterns in the public API yet.
 * The infrastructure is in place for when it becomes available. For now,
 * the styles are configured but will render as solid lines. This can be
 * extended with custom implementations (e.g., using masks or shaders).
 */

const meta: Meta = {
  title: 'Nodes/Border Styles',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Different border styles: solid, dashed, dotted
 */
export const StrokeStyles: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1400,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const shapes = ['circle', 'rect', 'rect', 'ellipse', 'hexagon'] as const;
      const strokeStyles = [
        { style: 'solid', label: 'Solid' },
        { style: 'dashed', label: 'Dashed' },
        { style: 'dotted', label: 'Dotted' },
      ];
      
      const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6'];

      const nodes = shapes.flatMap((shape, shapeIdx) => {
        return strokeStyles.map((stroke, strokeIdx) => {
          const col = strokeIdx;
          const row = shapeIdx;
          
          return {
            data: {
              id: `${shape}-${stroke.style}`,
              x: 300 + col * 400,
              y: 120 + row * 110,
              shape,
              size: 80,
              width: shape === 'rect' || shape === 'rect' || shape === 'ellipse' ? 140 : undefined,
              height: shape === 'rect' || shape === 'rect' || shape === 'ellipse' ? 70 : undefined,
              label: `${shape}\n${stroke.label}`,
              labelPlacement: 'center' as const,
            },
            style: {
              fill: '#ffffff',
              stroke: colors[shapeIdx],
              strokeWidth: 3,
              strokeStyle: stroke.style as any,
              labelStyle: {
                fill: colors[shapeIdx],
                fontSize: 11,
                fontWeight: '500' as const,
                align: 'center',
              },
            },
          };
        });
      });

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Border Stroke Styles</strong><br/>
        <br/>
        <div style="margin: 8px 0;">
          <span style="color: #3498db;">●</span> <strong>Solid</strong> - Continuous line<br/>
          <code style="font-size: 11px; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">strokeStyle: 'solid'</code>
        </div>
        
        <div style="margin: 8px 0;">
          <span style="color: #e74c3c;">●</span> <strong>Dashed</strong> - Dashed line (8px-4px)<br/>
          <code style="font-size: 11px; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">strokeStyle: 'dashed'</code>
        </div>
        
        <div style="margin: 8px 0;">
          <span style="color: #27ae60;">●</span> <strong>Dotted</strong> - Dotted line (2px-3px)<br/>
          <code style="font-size: 11px; background: #f0f0f0; padding: 2px 6px; border-radius: 3px;">strokeStyle: 'dotted'</code>
        </div>
        <br/>
        <em style="font-size: 12px; color: #666;">Works with all node shapes!</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Custom dash patterns for borders
 */
export const CustomDashPatterns: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '700px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1400,
      height: 700,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const patterns = [
        { pattern: [10, 6], label: 'Dashed\n[10, 6]', desc: 'Default dashed' },
        { pattern: [18, 10], label: 'Long Dash\n[18, 10]', desc: 'Long dashes' },
        { pattern: [6, 4], label: 'Short Dash\n[6, 4]', desc: 'Short dashes' },
        { pattern: [3, 5], label: 'Dotted\n[3, 5]', desc: 'Default dotted' },
        { pattern: [2, 4], label: 'Fine Dots\n[2, 4]', desc: 'Fine dots' },
        { pattern: [25, 6, 8, 6], label: 'Long-Short\n[25,6,8,6]', desc: 'Long then short' },
        { pattern: [15, 5, 3, 5], label: 'Dash-Dot\n[15,5,3,5]', desc: 'Alternating' },
        { pattern: [20, 5, 10, 5, 5, 5], label: 'Complex\n[20,5,10,5,5,5]', desc: 'Multi-pattern' },
      ];

      const nodes = patterns.map((item, i) => {
        const col = i % 4;
        const row = Math.floor(i / 4);
        
        return {
          data: {
            id: `pattern-${i}`,
            x: 200 + col * 320,
            y: 150 + row * 280,
            shape: 'rect' as const,
            width: 200,
            height: 120,
            label: item.label,
            labelPlacement: 'center' as const,
          },
          style: {
            fill: '#ffffff',
            stroke: '#3498db',
            strokeWidth: 4,
            strokeDashPattern: item.pattern,
            labelStyle: {
              fill: '#2c3e50',
              fontSize: 13,
              fontWeight: '600' as const,
              align: 'center',
            },
          },
        };
      });

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.style.maxWidth = '360px';
      info.innerHTML = `
        <strong>Custom Dash Patterns</strong><br/>
        <span style="color: #666;">Define your own border patterns</span><br/>
        <br/>
        <strong>Pattern Format:</strong><br/>
        <code style="font-size: 11px; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin: 4px 0;">
          strokeDashPattern: [dash, gap, ...]
        </code><br/>
        <br/>
        <strong>Examples:</strong><br/>
        <div style="font-size: 12px; margin: 8px 0;">
          • <code>[8, 4]</code> - Standard dashes<br/>
          • <code>[2, 3]</code> - Small dots<br/>
          • <code>[8, 4, 2, 4]</code> - Dash-dot pattern<br/>
          • <code>[20, 5, 5, 5, 5, 5]</code> - Complex rhythm
        </div>
        <br/>
        <strong>Usage:</strong>
        <pre style="background: #f8f8f8; padding: 8px; border-radius: 4px; font-size: 11px; overflow-x: auto; margin: 8px 0;">
style: {
  stroke: '#3498db',
  strokeWidth: 4,
  strokeDashPattern: [8, 4, 2, 4]
}</pre>
        <br/>
        <em style="font-size: 12px; color: #666;">Array alternates dash and gap lengths</em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Combining stroke styles with different widths
 */
export const StrokeWidthVariations: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1400,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const widths = [1, 2, 3, 5, 8];
      const styles = ['solid', 'dashed', 'dotted'] as const;
      
      const nodes = widths.flatMap((width, widthIdx) => {
        return styles.map((strokeStyle, styleIdx) => {
          const col = styleIdx;
          const row = widthIdx;
          
          return {
            data: {
              id: `width-${width}-${strokeStyle}`,
              x: 300 + col * 400,
              y: 100 + row * 110,
              shape: 'circle' as const,
              size: 80,
              label: `${width}px\n${strokeStyle}`,
              labelPlacement: 'center' as const,
            },
            style: {
              fill: '#ffffff',
              stroke: '#9b59b6',
              strokeWidth: width,
              strokeStyle: strokeStyle as any,
              labelStyle: {
                fill: '#2c3e50',
                fontSize: 11,
                fontWeight: '500' as const,
                align: 'center',
              },
            },
          };
        });
      });

      canvas.render({ nodes, edges: [] });

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.top = '10px';
      info.style.right = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Stroke Width × Style</strong><br/>
        <span style="color: #666;">Combine widths with patterns</span><br/>
        <br/>
        <strong>Widths:</strong> 1px, 2px, 3px, 5px, 8px<br/>
        <strong>Styles:</strong> Solid, Dashed, Dotted<br/>
        <br/>
        <div style="font-size: 12px; color: #666; margin-top: 8px;">
          Thicker strokes make patterns more visible<br/>
          while thin strokes provide subtle borders.
        </div>
        <br/>
        <strong>Tip:</strong><br/>
        <em style="font-size: 12px;">
          Use 3-5px width for dashed/dotted<br/>
          to ensure clear visibility
        </em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};

/**
 * Mixed border styles in a diagram
 */
export const MixedStyles: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '600px';
    container.style.backgroundColor = '#f5f5f5';

    const canvas = new Canvas({
      container,
      width: 1200,
      height: 600,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      const nodes = [
        // Center: Main node (solid)
        {
          data: {
            id: 'main',
            x: 600,
            y: 300,
            shape: 'circle' as const,
            size: 100,
            label: '📊\nMain',
            labelPlacement: 'center' as const,
          },
          style: {
            fill: '#ffffff',
            stroke: '#3498db',
            strokeWidth: 4,
            strokeStyle: 'solid' as any,
            labelStyle: {
              fill: '#2c3e50',
              fontSize: 16,
              fontWeight: '600' as const,
              align: 'center',
            },
          },
        },
        
        // Active connections (solid)
        {
          data: { id: 'active-1', x: 300, y: 150, shape: 'hexagon' as const, size: 70, label: '✓ Active', labelPlacement: 'center' as const },
          style: { fill: '#ffffff', stroke: '#27ae60', strokeWidth: 3, strokeStyle: 'solid' as any, labelStyle: { fill: '#27ae60', fontSize: 12, fontWeight: '500' as const, align: 'center' } },
        },
        {
          data: { id: 'active-2', x: 900, y: 150, shape: 'hexagon' as const, size: 70, label: '✓ Active', labelPlacement: 'center' as const },
          style: { fill: '#ffffff', stroke: '#27ae60', strokeWidth: 3, strokeStyle: 'solid' as any, labelStyle: { fill: '#27ae60', fontSize: 12, fontWeight: '500' as const, align: 'center' } },
        },
        
        // Pending connections (dashed)
        {
          data: { id: 'pending-1', x: 300, y: 450, shape: 'rect' as const, width: 120, height: 60, label: '⏳ Pending', labelPlacement: 'center' as const },
          style: { fill: '#ffffff', stroke: '#f39c12', strokeWidth: 3, strokeStyle: 'dashed' as any, labelStyle: { fill: '#f39c12', fontSize: 12, fontWeight: '500' as const, align: 'center' } },
        },
        {
          data: { id: 'pending-2', x: 900, y: 450, shape: 'rect' as const, width: 120, height: 60, label: '⏳ Pending', labelPlacement: 'center' as const },
          style: { fill: '#ffffff', stroke: '#f39c12', strokeWidth: 3, strokeStyle: 'dashed' as any, labelStyle: { fill: '#f39c12', fontSize: 12, fontWeight: '500' as const, align: 'center' } },
        },
        
        // Optional/disabled (dotted)
        {
          data: { id: 'optional-1', x: 150, y: 300, shape: 'rect' as const, width: 100, height: 60, label: '○ Optional', labelPlacement: 'center' as const },
          style: { fill: '#ffffff', stroke: '#95a5a6', strokeWidth: 2, strokeStyle: 'dotted' as any, labelStyle: { fill: '#95a5a6', fontSize: 11, fontWeight: '400' as const, align: 'center' } },
        },
        {
          data: { id: 'optional-2', x: 1050, y: 300, shape: 'rect' as const, width: 100, height: 60, label: '○ Optional', labelPlacement: 'center' as const },
          style: { fill: '#ffffff', stroke: '#95a5a6', strokeWidth: 2, strokeStyle: 'dotted' as any, labelStyle: { fill: '#95a5a6', fontSize: 11, fontWeight: '400' as const, align: 'center' } },
        },
      ];

      const edges = [
        // Active connections (solid)
        { data: { id: 'e1', source: 'main', target: 'active-1' }, style: { stroke: '#27ae60', strokeWidth: 2 } },
        { data: { id: 'e2', source: 'main', target: 'active-2' }, style: { stroke: '#27ae60', strokeWidth: 2 } },
        
        // Pending connections (dashed)
        { data: { id: 'e3', source: 'main', target: 'pending-1' }, style: { stroke: '#f39c12', strokeWidth: 2, strokeStyle: 'dashed' as any } },
        { data: { id: 'e4', source: 'main', target: 'pending-2' }, style: { stroke: '#f39c12', strokeWidth: 2, strokeStyle: 'dashed' as any } },
        
        // Optional connections (dotted)
        { data: { id: 'e5', source: 'main', target: 'optional-1' }, style: { stroke: '#95a5a6', strokeWidth: 2, strokeStyle: 'dotted' as any } },
        { data: { id: 'e6', source: 'main', target: 'optional-2' }, style: { stroke: '#95a5a6', strokeWidth: 2, strokeStyle: 'dotted' as any } },
      ];

      canvas.render({ nodes, edges });

      // Add legend
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.bottom = '10px';
      info.style.left = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '14px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <strong>Connection States Legend</strong><br/>
        <br/>
        <div style="display: flex; align-items: center; margin: 8px 0;">
          <div style="width: 40px; height: 3px; background: #27ae60; margin-right: 10px;"></div>
          <span><strong>Solid</strong> - Active connections</span>
        </div>
        <div style="display: flex; align-items: center; margin: 8px 0;">
          <div style="width: 40px; height: 3px; background: #f39c12; border-top: 3px dashed #f39c12; margin-right: 10px;"></div>
          <span><strong>Dashed</strong> - Pending connections</span>
        </div>
        <div style="display: flex; align-items: center; margin: 8px 0;">
          <div style="width: 40px; height: 3px; background: #95a5a6; border-top: 3px dotted #95a5a6; margin-right: 10px;"></div>
          <span><strong>Dotted</strong> - Optional connections</span>
        </div>
        <br/>
        <em style="font-size: 12px; color: #666;">
          Use border styles to convey<br/>
          relationship states and types
        </em>
      `;
      container.style.position = 'relative';
      container.appendChild(info);
    });

    return container;
  },
};
