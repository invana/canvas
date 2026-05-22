





```typescript
/**
 * Theming Stories
 * 
 * Demonstrates dynamic theme switching with:
 * - Blueprint style (dark blue with grid)
 * - Minimal Light (white with subtle dots)
 * - Dark theme (dark gray with dots)
 * 
 * Uses lil-gui for interactive theme switching
 * Uses the declarative plugin configuration pattern
 */

import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer } from '@/div-utils';

const meta: Meta = {
  title: 'canvas/Concepts/<Styling>/<Theming>',
};

export default meta;
type Story = StoryObj;

// Theme configurations
const themes = {
  dark: {
    name: 'Dark',
    styles: {
      node: {
        fill:  '#3fcbeb',
        stroke:  '#ffffff',
        strokeWidth: () => 2,
      },
      edge: {
        stroke: () => '#58a6ff',
        strokeWidth: () => 2,
      }
    },
    background: {
      plugin: 'background',
      key: 'theme-background',
      options: {
        type: 'pattern' as const,
        patternType: 'dots' as const,
        color: '#595959',
        backgroundColor: '#212121',
        size: 1.5,
        spacing: 30,
        alpha: 0.6
      }
    }
  }
};
 
export const Theming: Story = {
  name: 'Theming',
  render: () => {
    const container = createContainer();
    return container;
  },
  play: async () => {
    const container = document.getElementById('canvas-example');

    if (!container) return;

      const styles = themes.dark;

      // Create canvas with v2.0 API
      const canvas = new Canvas({
        container,
        width: container.clientWidth || 800,
        height: container.clientHeight || 600,
        plugins: [
          styles.background
        ]
      });

      await canvas.init();

      // Create and register GraphDataPlugin
      const graphPlugin = new GraphDataPlugin({
        fitOnRender: true,
        fitPadding: 50
      });
      await canvas.registerPlugin(graphPlugin);

      // Initial theme
      const graphData: ICanvasData = {
          nodes: [
            { 
              id: 'n1', x: -300, y: -150, shape: 'circle' as const, size: 40, label: 'Circle',
            },
            ...
          ],
          edges: [
            { id: 'e1', source: 'n1', target: 'n5', pathType: 'bezier' as const },
            ...
          ],
        };

      // Set initial data and styles
      graphPlugin.setData(graphData);
      graphPlugin.setStyles(styles);

      // Create GUI for theme switching - positioned at top-right
      const gui = new GUI({ container });
      gui.domElement.style.position = 'absolute';
      gui.domElement.style.top = '10px';
      gui.domElement.style.right = '10px';

      // gui settings here based on story 
  }
};

````