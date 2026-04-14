import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, type CanvasData } from '@invana/canvas-core';
import { createDescriptionPanel } from '../../../src/div-utils';

const meta: Meta = {
  title: 'Elements/Edges/All Edge Combinations',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

// All available arrow types
const arrowTypes = [
  'triangle',
  // 'triangle-outline',
  // 'triangle-thin',
  'vee',
  'circle',
  // 'circle-outline',
  'diamond',
  // 'diamond-outline',
  'square',
  // 'square-outline',
  'tee',
  'bar',
  'none',
] as const;

/**
 * All Edge Arrow Combinations
 * Shows all possible arrow start and end combinations between circle nodes
 */
export const AllArrowCombinations: Story = {
  render: () => {
    const container = document.createElement('div');
    container.id = 'canvas-all-edges';
    container.style.width = '100vw';
    container.style.height = '100vh';
    container.style.margin = '0';
    container.style.padding = '0';
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-all-edges');
    if (!container) return;

    const nodes: any[] = [];
    const edges: any[] = [];

    // Generate all combinations of arrow types
    let rowIndex = 0;
    const spacing = 200;
    const verticalSpacing = 80;

    arrowTypes.forEach((arrowStart) => {
      arrowTypes.forEach((arrowEnd) => {
        const y = rowIndex * verticalSpacing;
        const sourceX = -spacing / 2;
        const targetX = spacing / 2;

        // Source node (left)
        nodes.push({
          id: `source-${arrowStart}-${arrowEnd}-${rowIndex}`,
          x: sourceX,
          y,
          shape: 'circle' as const,
          size: 25,
          style: {
            fill: '#3498db',
            stroke: '#2980b9',
            strokeWidth: 2,
          },
        });

        // Target node (right)
        nodes.push({
          id: `target-${arrowStart}-${arrowEnd}-${rowIndex}`,
          x: targetX,
          y,
          shape: 'circle' as const,
          size: 25,
          style: {
            fill: '#e74c3c',
            stroke: '#c0392b',
            strokeWidth: 2,
          },
        });

        // Edge with arrow combinations
        edges.push({
          id: `edge-${arrowStart}-${arrowEnd}-${rowIndex}`,
          source: `source-${arrowStart}-${arrowEnd}-${rowIndex}`,
          target: `target-${arrowStart}-${arrowEnd}-${rowIndex}`,
          pathType: 'line' as const,
          arrowSource: arrowStart === 'none' ? undefined : arrowStart,
          arrowTarget: arrowEnd === 'none' ? undefined : arrowEnd,
          arrowSize: 12,
          label: `${arrowStart} → ${arrowEnd}`,
          style: {
            stroke: '#95a5a6',
            strokeWidth: 2,
          },
        });

        rowIndex++;
      });
    });

    const canvas = new Canvas({
      container,
      behavior: 'default',
      data: { nodes, edges },
      fitPadding: 100,
      styles: {
        edge: {
          label: {
            text: (edge: any) => edge.label || '',
            fontSize: 9,
            fill: '#2c3e50',
            backgroundColor: '#ecf0f1',
            padding: 3,
            fontFamily: 'monospace',
          },
        },
      },
    });

    await canvas.init();
    canvas.render();

    // Info panel
    const info = createDescriptionPanel({
      text: `<strong>All Arrow Combinations</strong><br/>
             <br/>
             Total: ${arrowTypes.length * arrowTypes.length} combinations<br/>
             Arrow types: ${arrowTypes.length}<br/>
             <br/>
             Blue nodes (left): Source<br/>
             Red nodes (right): Target<br/>
             <br/>
             Scroll to see all combinations`,
      position: 'top-left',
      top: '20px',
      left: '20px',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      textColor: '#fff',
      padding: '15px',
      fontSize: '12px',
      maxWidth: '300px',
    });
    container.appendChild(info);
  },
};
