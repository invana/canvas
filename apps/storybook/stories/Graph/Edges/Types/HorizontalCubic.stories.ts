import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Edges/Types/HorizontalCubic' };
export default meta;
type Story = StoryObj;

/**
 * `pathType: 'bezier'` with `axis: 'h'` — control handles always pull
 * horizontally regardless of the chord angle. A horizontal-tree layout
 * (one root on the left, five children fanned right) makes the family of
 * horizontal-cubic links read like an org chart: each curve leaves the
 * root pointing right and arrives at its child pointing right, with the
 * vertical bend absorbed by the x-axis handle length.
 *
 * One child per canonical edge state, so the colour-coded state overlays
 * read against the horizontal-cubic geometry.
 */
export const HorizontalCubic: Story = {
  render: () => createContainer({ id: 'graph-edge-types-horizontal-cubic' }),

  play: async ({ canvasElement }) => {
    // Root on the left, five children stacked along x = +220, evenly
    // spaced from y = -200 to y = +200.
    const nodes: NodeData[] = [
      { id: 'root',        position: { x: -220, y:    0 } },
      { id: 'default',     position: { x:  220, y: -200 } },
      { id: 'selected',    position: { x:  220, y: -100 } },
      { id: 'highlighted', position: { x:  220, y:    0 } },
      { id: 'dimmed',      position: { x:  220, y:  100 } },
      { id: 'disabled',    position: { x:  220, y:  200 } },
    ];

    const edges: EdgeData[] = [
      { id: 'hcubic-default',     source: 'root', target: 'default',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } },
                 labelText: 'default' } },
      { id: 'hcubic-selected',    source: 'root', target: 'selected',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } },
                 labelText: 'selected' },
        states: ['selected'] },
      { id: 'hcubic-highlighted', source: 'root', target: 'highlighted',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } },
                 labelText: 'highlighted' },
        states: ['highlighted'] },
      { id: 'hcubic-dimmed',      source: 'root', target: 'dimmed',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } },
                 labelText: 'dimmed' },
        states: ['dimmed'] },
      { id: 'hcubic-disabled',    source: 'root', target: 'disabled',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } },
                 labelText: 'disabled' },
        states: ['disabled'] },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-types-horizontal-cubic')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 14 },
            bgFill: 0x4f9cf9,
            bgStrokeColor: 0x1d4ed8,
            bgStrokeWidth: 1.5,
          },
        },
        edge: {
          style: {
            strokeColor: 0x94a3b8,
            strokeWidth: 1.5,
            arrowTargetShape: 'triangle',
            labelFontSize: 10,
            labelFontWeight: 500,
            labelColor: 0x334155,
            labelPlacement: 'center',
            labelAutoRotate: true,
            labelKeepUpright: true,
            labelBackgroundFill: 0xffffff,
            labelBackgroundStrokeColor: 0xe2e8f0,
            labelBackgroundStrokeWidth: 1,
            labelBackgroundCornerRadius: 3,
            labelBackgroundPadding: 3,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
