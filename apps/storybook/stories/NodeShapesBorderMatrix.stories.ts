import type { Meta, StoryObj } from '@storybook/html';
import { Canvas } from '@aspect-ui/canvas-core';

/**
 * Node Shapes × Border Styles Matrix
 * 
 * Complete matrix showing all node shape types with all border style variations.
 * This comprehensive view helps visualize how different border styles (solid, dashed, dotted)
 * appear across all available node shapes.
 */

const meta: Meta = {
  title: 'Nodes/Shapes × Border Matrix',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

type Story = StoryObj;

/**
 * Complete matrix of all node shapes with all border styles
 */
export const AllShapesAllBorders: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '800px';
    container.style.backgroundColor = '#f5f5f5';
    container.style.position = 'relative';

    const canvas = new Canvas({
      container,
      width: 1600,
      height: 800,
      backgroundColor: '#ffffff',
    });

    canvas.init().then(() => {
      // All available shapes
      const shapes = [
        { type: 'circle', label: 'Circle', size: 70 },
        { type: 'rect', label: 'Rectangle', width: 120, height: 60 },
        { type: 'rect', label: 'Rounded Rect', width: 120, height: 60, cornerRadius: 8 },
        { type: 'ellipse', label: 'Ellipse', width: 130, height: 65 },
        { type: 'hexagon', label: 'Hexagon', size: 70 },
        { type: 'triangle', label: 'Triangle', size: 70 },
        { type: 'diamond', label: 'Diamond', size: 70 },
      ] as const;

      // All border styles
      const borderStyles = [
        { style: 'solid', label: 'Solid', pattern: null },
        { style: 'dashed', label: 'Dashed [8,4]', pattern: [8, 4] },
        { style: 'dotted', label: 'Dotted [2,3]', pattern: [2, 3] },
        { style: 'custom1', label: 'Long Dash [16,8]', pattern: [16, 8] },
        { style: 'custom2', label: 'Short Dash [4,2]', pattern: [4, 2] },
      ] as const;

      const colors = ['#3498db', '#e74c3c', '#27ae60', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];

      const startX = 200;
      const startY = 120;
      const colSpacing = 280;
      const rowSpacing = 100;

      const nodes = shapes.flatMap((shape, shapeIdx) => {
        return borderStyles.map((border, borderIdx) => {
          const col = borderIdx;
          const row = shapeIdx;

          const nodeData: any = {
            id: `${shape.type}-${border.style}`,
            x: startX + col * colSpacing,
            y: startY + row * rowSpacing,
            shape: shape.type,
          };

          // Add shape-specific dimensions
          if ('size' in shape) {
            nodeData.size = shape.size;
          }
          if ('width' in shape && 'height' in shape) {
            nodeData.width = shape.width;
            nodeData.height = shape.height;
          }

          const nodeStyle: any = {
            fill: '#ffffff',
            stroke: colors[shapeIdx],
            strokeWidth: 3,
            strokeAlpha: 1,
          };

          // Apply border style
          if (border.style === 'solid') {
            nodeStyle.strokeStyle = 'solid';
          } else if (border.style === 'dashed') {
            nodeStyle.strokeStyle = 'dashed';
          } else if (border.style === 'dotted') {
            nodeStyle.strokeStyle = 'dotted';
          } else if (border.pattern) {
            nodeStyle.strokeDashPattern = border.pattern;
          }

          return {
            data: nodeData,
            style: nodeStyle,
          };
        });
      });

      canvas.render({ nodes, edges: [] });

      // Add header labels for border styles
      const headerContainer = document.createElement('div');
      headerContainer.style.position = 'absolute';
      headerContainer.style.top = '10px';
      headerContainer.style.left = '0';
      headerContainer.style.right = '0';
      headerContainer.style.display = 'flex';
      headerContainer.style.justifyContent = 'center';
      headerContainer.style.gap = '20px';
      headerContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      headerContainer.style.fontSize = '13px';
      headerContainer.style.fontWeight = '600';
      headerContainer.style.color = '#2c3e50';
      headerContainer.style.zIndex = '1000';

      borderStyles.forEach((border, idx) => {
        const label = document.createElement('div');
        label.style.width = '250px';
        label.style.textAlign = 'center';
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        label.style.padding = '8px 12px';
        label.style.borderRadius = '6px';
        label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        label.textContent = border.label;
        headerContainer.appendChild(label);
      });

      container.appendChild(headerContainer);

      // Add side labels for shapes
      const sideLabelsContainer = document.createElement('div');
      sideLabelsContainer.style.position = 'absolute';
      sideLabelsContainer.style.left = '10px';
      sideLabelsContainer.style.top = `${startY - 40}px`;
      sideLabelsContainer.style.display = 'flex';
      sideLabelsContainer.style.flexDirection = 'column';
      sideLabelsContainer.style.gap = `${rowSpacing - 40}px`;
      sideLabelsContainer.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      sideLabelsContainer.style.fontSize = '13px';
      sideLabelsContainer.style.fontWeight = '600';
      sideLabelsContainer.style.color = '#2c3e50';
      sideLabelsContainer.style.zIndex = '1000';

      shapes.forEach((shape, idx) => {
        const label = document.createElement('div');
        label.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        label.style.padding = '8px 12px';
        label.style.borderRadius = '6px';
        label.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
        label.style.borderLeft = `4px solid ${colors[idx]}`;
        label.textContent = shape.label;
        sideLabelsContainer.appendChild(label);
      });

      container.appendChild(sideLabelsContainer);

      // Add info panel
      const info = document.createElement('div');
      info.style.position = 'absolute';
      info.style.bottom = '10px';
      info.style.right = '10px';
      info.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      info.style.padding = '16px';
      info.style.borderRadius = '8px';
      info.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      info.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      info.style.fontSize = '12px';
      info.style.color = '#34495e';
      info.style.maxWidth = '280px';
      info.style.zIndex = '1000';
      info.innerHTML = `
        <div style="font-size: 14px; font-weight: 600; margin-bottom: 8px; color: #2c3e50;">
          Shape × Border Matrix
        </div>
        <div style="margin-bottom: 8px;">
          <strong>${shapes.length} shapes</strong> × <strong>${borderStyles.length} border styles</strong> = 
          <strong>${shapes.length * borderStyles.length} variations</strong>
        </div>
        <div style="font-size: 11px; color: #7f8c8d; line-height: 1.6;">
          This matrix shows how each border style renders across all available node shapes.
          Border styles can be applied using <code style="background: #ecf0f1; padding: 2px 4px; border-radius: 3px;">strokeStyle</code> 
          or custom <code style="background: #ecf0f1; padding: 2px 4px; border-radius: 3px;">strokeDashPattern</code>.
        </div>
      `;
      container.appendChild(info);

      // Add title
      const title = document.createElement('div');
      title.style.position = 'absolute';
      title.style.top = '10px';
      title.style.left = '10px';
      title.style.fontSize = '18px';
      title.style.fontWeight = '700';
      title.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      title.style.color = '#2c3e50';
      title.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
      title.style.padding = '12px 16px';
      title.style.borderRadius = '8px';
      title.style.boxShadow = '0 2px 8px rgba(0,0,0,0.2)';
      title.style.zIndex = '1000';
      title.innerHTML = `
        <div>Node Shapes × Border Styles</div>
        <div style="font-size: 11px; font-weight: 400; color: #7f8c8d; margin-top: 4px;">
          Complete visual reference
        </div>
      `;
      container.appendChild(title);
    });

    return container;
  },
};
