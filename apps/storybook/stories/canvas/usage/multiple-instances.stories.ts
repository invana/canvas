import type { Meta, StoryObj } from '@storybook/html';
import { Canvas, GraphDataPlugin } from '@invana/canvas-core';
import { createContainer, createCanvasSection } from '../../../src/div-utils';

const meta: Meta = {
  title: 'Canvas/Usage/Multiple Instances',
};

export default meta;
type Story = StoryObj;

/**
 * Example showing custom states like loading, error, and warning
 */
export const MultipleInstances: Story = {
  parameters: {
    layout: 'fullscreen',
  },
  render: () => {
    const container = createContainer({ height: "600px", id: 'big-container' });
    container.style.display = "grid";
    container.style.gridTemplateColumns = "1fr 1fr";
    container.style.gridTemplateRows = "1fr 1fr";
    container.style.gap = "20px";
    container.style.padding = "20px";
    container.style.backgroundColor = "#f5f5f5";

    const container1 = createCanvasSection(container, 'canvas-example-1', 'Canvas 1', 'First canvas instance');
    const container2 = createCanvasSection(container, 'canvas-example-2', 'Canvas 2', 'Second canvas instance');

    if (container1) container1.style.height = "600px";
    if (container2) container2.style.height = "600px";

    // const container3 = createContainer({ height: "600px", width: "50%", id: 'canvas-example-3', title: "Canvas 3" });
    // container.appendChild(container3);

    // const container4 = createContainer({ height: "600px", width: "50%", id: 'canvas-example-4', title: "Canvas 4" });
    //   container.appendChild(container4);

    return container;
  },
  play: async () => {
    const container = document.getElementById('big-container');
    if (!container) return;
    
    const container1 = document.getElementById('canvas-example-1');
    const container2 = document.getElementById('canvas-example-2');
    if (!container1 || !container2) return;
    console.log('Containers found, initializing canvases');

    const sharedNodes = [
      { id: 'n1', x: -80, y: 0, label: 'Hello', shape: 'circle' as const, size: 50 },
      { id: 'n2', x:  80, y: 0, label: 'World', shape: 'circle' as const, size: 50 },
    ];
    const sharedEdges = [
      { id: 'e1', source: 'n1', target: 'n2', pathType: 'bezier' as const },
    ];

    const canvas = new Canvas({
      container: container1,
      width: container1.clientWidth || 400,
      height: container1.clientHeight || 300,
      behavior: 'full',
    });
    await canvas.init();
    const graphPlugin1 = new GraphDataPlugin({ fitOnRender: true, fitPadding: 60 });
    await canvas.registerPlugin(graphPlugin1);
    graphPlugin1.setData({ nodes: sharedNodes, edges: sharedEdges });

    const canvas2 = new Canvas({
      container: container2,
      width: container2.clientWidth || 400,
      height: container2.clientHeight || 300,
      behavior: 'full',
    });
    await canvas2.init();
    const graphPlugin2 = new GraphDataPlugin({ fitOnRender: true, fitPadding: 60 });
    await canvas2.registerPlugin(graphPlugin2);
    graphPlugin2.setData({ nodes: sharedNodes, edges: sharedEdges });
  },
};

