import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import GUI from 'lil-gui';
import { createContainer } from '../../src/div-utils';

const meta: Meta = {
  title: 'Animations/Viewport',
  parameters: { layout: 'fullscreen' },
};

export default meta;
type Story = StoryObj;

// ---------------------------------------------------------------------------

/**
 * Each node animates to a new y-position one second apart, demonstrating
 * `updateNodePosition()` for smooth viewport-level animation.
 */
export const NodePosition: Story = {
  render: () => createContainer({ id: 'anim-node-position' }),
  play: async () => {
    const container = document.getElementById('anim-node-position');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        { plugin: 'background', key: 'bg', options: { type: 'pattern', patternType: 'dots', backgroundColor: '#0f172a', color: '#334155', size: 1.5, spacing: 28, alpha: 0.75 } },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);

    graphPlugin.setData({
      nodes: [
        { id: 'A', x: -150, y: -150, shape: 'circle'  as const, size: 50, label: 'Node A' },
        { id: 'B', x:  150, y: -150, shape: 'rect'    as const, width: 100, height: 70, cornerRadius: 10, label: 'Node B' },
        { id: 'C', x: -150, y:  150, shape: 'diamond' as const, size: 60,  label: 'Node C' },
        { id: 'D', x:  150, y:  150, shape: 'hexagon' as const, size: 55,  label: 'Node D' },
      ],
      edges: [
        { id: 'e1', source: 'A', target: 'B', pathType: 'bezier' as const },
        { id: 'e2', source: 'B', target: 'D', pathType: 'bezier' as const },
        { id: 'e3', source: 'D', target: 'C', pathType: 'bezier' as const },
        { id: 'e4', source: 'C', target: 'A', pathType: 'bezier' as const },
      ],
    });

    // Animate nodes upward one at a time
    const nodeIds = ['A', 'B', 'C', 'D'];
    const nodeData = graphPlugin.getNodeData();
    nodeIds.forEach((id, i) => {
      setTimeout(() => {
        const node = nodeData.get(id);
        if (node) graphPlugin.updateNodePosition(id, node.x, node.y - 100);
      }, (i + 1) * 1000);
    });
  },
};

// ---------------------------------------------------------------------------

/**
 * Pan and zoom the viewport programmatically using `fitWorld` and `moveCenter`.
 */
export const ViewportControls: Story = {
  render: () => createContainer({ id: 'anim-viewport-controls' }),
  play: async () => {
    const container = document.getElementById('anim-viewport-controls');
    if (!container) return;

    const canvas = new Canvas({
      container,
      width: container.clientWidth || 1000,
      height: container.clientHeight || 600,
      behavior: 'default',
      plugins: [
        { plugin: 'background', key: 'bg', options: { type: 'pattern', patternType: 'grid', backgroundColor: '#101827', color: '#1e3a5f', spacing: 30, lineWidth: 0.5, alpha: 0.8 } },
      ],
    });
    await canvas.init();

    const graphPlugin = new GraphDataPlugin({ fitOnRender: true, fitPadding: 80 });
    await canvas.registerPlugin(graphPlugin);

    graphPlugin.setData({
      nodes: [
        { id: 'n1', x: -400, y: -200, shape: 'circle'   as const, size: 44, label: 'Far Left'  },
        { id: 'n2', x:  400, y: -200, shape: 'rect'     as const, width: 100, height: 54, label: 'Far Right' },
        { id: 'n3', x:    0, y:  300, shape: 'diamond'  as const, size: 52, label: 'Bottom'    },
        { id: 'n4', x:    0, y: -200, shape: 'hexagon'  as const, size: 46, label: 'Top'       },
        { id: 'n5', x:    0, y:    0, shape: 'star'     as const, size: 50, label: 'Centre'    },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n5', pathType: 'bezier' as const },
        { id: 'e2', source: 'n2', target: 'n5', pathType: 'bezier' as const },
        { id: 'e3', source: 'n3', target: 'n5', pathType: 'bezier' as const },
        { id: 'e4', source: 'n4', target: 'n5', pathType: 'bezier' as const },
      ],
    });

    const gui = new GUI({ container, title: 'Viewport' });
    gui.domElement.style.position = 'absolute';
    gui.domElement.style.top = '10px';
    gui.domElement.style.right = '10px';

    const actions = {
      fitAll:     () => canvas.viewport?.fitWorld(),
      goToCenter: () => canvas.viewport?.moveCenter(0, 0),
      goToLeft:   () => canvas.viewport?.moveCenter(-400, -200),
      goToRight:  () => canvas.viewport?.moveCenter(400, -200),
    };
    gui.add(actions, 'fitAll').name('Fit All');
    gui.add(actions, 'goToCenter').name('Go to Centre');
    gui.add(actions, 'goToLeft').name('Go to Far Left');
    gui.add(actions, 'goToRight').name('Go to Far Right');
  },
};
