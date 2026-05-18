import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type EdgeData, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Edges/Loops' };
export default meta;
type Story = StoryObj;

/**
 * Self-loops at the GraphLayer level — three nodes, each carrying a
 * different multi-loop pattern. Mirrors the right panel of the reference
 * G6 screenshot (the "Nested Loop" example).
 *
 * Two pathTypes are exercised:
 *  - `loop-curve` — cubic-bezier petal. Knobs: `angle`, `radius`, `width`.
 *  - `loop-orth`  — rectangular U-bracket. Knobs: `side`, `stubLength`,
 *    `gap`.
 *
 * "Nesting" isn't a separate pathType; it's the same pathType used N
 * times on the same node with different `angle` / `radius` / `side` opts.
 * Each connector carries its own `labelText` so the loops read like
 * independent edges, including arrow markers and per-edge stroke colour.
 *
 * Edge data here is hand-authored — `source === target` for every edge.
 */
export const Loops: Story = {
  render: () => createContainer({ id: 'graph-edges-loops' }),

  play: async ({ canvasElement }) => {
    const DEG = Math.PI / 180;

    const nodes: NodeData[] = [
      { id: 'node1', position: { x: -260, y: -120 },
        style: { labelText: 'node1', labelPlacement: 'bottom' } },
      { id: 'node2', position: { x:  220, y: -120 },
        style: { labelText: 'node2', labelPlacement: 'bottom' } },
      { id: 'node3', position: { x:  -20, y:  140 },
        style: { labelText: 'node3', labelPlacement: 'bottom' } },
    ];

    // Host nodes are 24-radius circles. `baseOffset` controls the
    // distance from node centre to each loop's feet — set it ≥ the host
    // radius so the arrow markers (which land on the trailing foot) sit
    // clear of the silhouette. Nested loops on the same node stack their
    // `baseOffset` so each successive loop is wholly outside the previous.
    //
    // node1 — three stacked curve petals all pointing up, growing
    // outward. node2 — petals right/left + two bottom orth brackets.
    // node3 — two left orth brackets + one top-right curve petal.
    const edges: EdgeData[] = [
      { id: 'loop-1', source: 'node1', target: 'node1',
        style: {
          shape: {
            pathType: 'loop-curve',
            pathStyleOpts: { angle: -90 * DEG, baseOffset: 28, radius: 24, width: 22 },
          },
          strokeColor: 0xb45309,
          strokeWidth: 1.5,
          labelText: 'loop-1',
          labelPathOffset: 4,
        } },
      { id: 'loop-2', source: 'node1', target: 'node1',
        style: {
          shape: {
            pathType: 'loop-curve',
            pathStyleOpts: { angle: -90 * DEG, baseOffset: 58, radius: 30, width: 30 },
          },
          strokeColor: 0x047857,
          strokeWidth: 1.5,
          labelText: 'loop-2',
          labelPathOffset: 4,
        } },
      { id: 'loop-3', source: 'node1', target: 'node1',
        style: {
          shape: {
            pathType: 'loop-curve',
            pathStyleOpts: { angle: -90 * DEG, baseOffset: 92, radius: 38, width: 40 },
          },
          strokeColor: 0x6d28d9,
          strokeWidth: 1.5,
          labelText: 'loop-3',
          labelPathOffset: 4,
        } },

      { id: 'loop-4', source: 'node2', target: 'node2',
        style: {
          shape: {
            pathType: 'loop-curve',
            pathStyleOpts: { angle: 0, baseOffset: 28, radius: 28, width: 24 },
          },
          strokeColor: 0xbe123c,
          strokeWidth: 1.5,
          labelText: 'loop-4',
          labelPathOffset: 4,
        } },
      { id: 'loop-5', source: 'node2', target: 'node2',
        style: {
          shape: {
            pathType: 'loop-curve',
            pathStyleOpts: { angle: 180 * DEG, baseOffset: 28, radius: 28, width: 24 },
          },
          strokeColor: 0x0369a1,
          strokeWidth: 1.5,
          labelText: 'loop-5',
          labelPathOffset: 4,
        } },
      { id: 'loop-6', source: 'node2', target: 'node2',
        style: {
          shape: {
            pathType: 'loop-orth',
            pathStyleOpts: { side: 'bottom', baseOffset: 28, stubLength: 24, gap: 22 },
          },
          strokeColor: 0x111827,
          strokeWidth: 1.5,
          labelText: 'loop-6',
          labelPathOffset: 4,
        } },
      { id: 'loop-7', source: 'node2', target: 'node2',
        style: {
          shape: {
            pathType: 'loop-orth',
            pathStyleOpts: { side: 'bottom', baseOffset: 60, stubLength: 30, gap: 44 },
          },
          strokeColor: 0x9333ea,
          strokeWidth: 1.5,
          labelText: 'loop-7',
          labelPathOffset: 4,
        } },

      { id: 'loop-8', source: 'node3', target: 'node3',
        style: {
          shape: {
            pathType: 'loop-orth',
            pathStyleOpts: { side: 'left', baseOffset: 28, stubLength: 24, gap: 22 },
          },
          strokeColor: 0xb45309,
          strokeWidth: 1.5,
          labelText: 'loop-8',
          labelPathOffset: 4,
        } },
      { id: 'loop-9', source: 'node3', target: 'node3',
        style: {
          shape: {
            pathType: 'loop-orth',
            pathStyleOpts: { side: 'left', baseOffset: 60, stubLength: 30, gap: 44 },
          },
          strokeColor: 0x047857,
          strokeWidth: 1.5,
          labelText: 'loop-9',
          labelPathOffset: 4,
        } },
      { id: 'loop-10', source: 'node3', target: 'node3',
        style: {
          shape: {
            pathType: 'loop-curve',
            pathStyleOpts: { angle: -45 * DEG, baseOffset: 30, radius: 36, width: 26 },
          },
          strokeColor: 0x9333ea,
          strokeWidth: 1.5,
          labelText: 'loop-10',
          labelPathOffset: 4,
        } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edges-loops')!;
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
            shape: { kind: 'circle', radius: 24 },
            bgFill: 0x3b82f6,
            bgStrokeColor: 0x1d4ed8,
            bgStrokeWidth: 2,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelColor: 0x0f172a,
            labelOffsetY: 6,
          },
        },
        edge: {
          style: {
            // Every loop edge sets its own pathType/pathStyleOpts; the
            // template carries the shared label typography and arrow.
            arrowTargetShape: 'triangle',
            labelFontSize: 10,
            labelFontWeight: 500,
            labelColor: 0x334155,
            labelBackgroundFill: 0xffffff,
            labelBackgroundAlpha: 0.85,
            labelBackgroundPadding: 2,
            labelAutoRotate: true,
            labelKeepUpright: true,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
