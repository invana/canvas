import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type EdgeData,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'Graph/Edges/EdgeLabels' };
export default meta;
type Story = StoryObj;

/**
 * `GraphLayer` rendering edges with text labels via the v3 `EdgeData` shape.
 *
 * One row per built-in `pathType` — `straight`, `bezier`, `bump-radial`,
 * `smooth`, `rounded`, `orth`, `manhattan`. The shared label payload lives
 * on the layer's `edge.style.labelStyle` template; each edge only carries
 * its pathType-specific `shape`.
 *
 * Drag any endpoint to confirm the label tracks the path under live
 * re-routing — `autoRotate` + `keepUpright` on the layer-level labelStyle
 * apply uniformly across all path styles.
 */
export const EdgeLabels: Story = {
  render: () => createContainer({ id: 'graph-edge-labels' }),

  play: async ({ canvasElement }) => {
    // Source nodes — blue circle on the left edge of each row, tagged with
    // the variant name as a left-placed label. Target nodes — green circle
    // on the right, offset vertically by +60 so the orth-family routers
    // (smooth / rounded / orth / manhattan) actually demonstrate a corner
    // instead of collapsing to a horizontal line. Row spacing 120, centred
    // — source y values: -360, -240, -120, 0, 120, 240, 360.
    //
    // Layer-level `node.style` carries the shared circle shape AND the
    // shared label font / placement / colour (only sources have a
    // labelText so targets effectively skip the label).
    const nodes: NodeData[] = [
      // sources
      { id: 'straight-src',    position: { x: -240, y: -360 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'straight' } },
      { id: 'bezier-src',      position: { x: -240, y: -240 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'bezier' } },
      { id: 'bump-radial-src', position: { x: -240, y: -120 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'bump-radial' } },
      { id: 'smooth-src',      position: { x: -240, y:    0 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'smooth' } },
      { id: 'rounded-src',     position: { x: -240, y:  120 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'rounded' } },
      { id: 'orth-src',        position: { x: -240, y:  240 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'orth' } },
      { id: 'manhattan-src',   position: { x: -240, y:  360 }, style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8, labelText: 'manhattan' } },
      // targets — each at source.y + 60 so routers have a vertical delta to bridge
      { id: 'straight-tgt',    position: { x: 240, y: -300 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
      { id: 'bezier-tgt',      position: { x: 240, y: -180 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
      { id: 'bump-radial-tgt', position: { x: 240, y:  -60 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
      { id: 'smooth-tgt',      position: { x: 240, y:   60 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
      { id: 'rounded-tgt',     position: { x: 240, y:  180 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
      { id: 'orth-tgt',        position: { x: 240, y:  300 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
      { id: 'manhattan-tgt',   position: { x: 240, y:  420 }, style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } },
    ];

    // Bezier needs an explicit axis to bend horizontally; bump-radial needs
    // an origin reference so the arc bulges away from the centre of the
    // layout. Other path types take no pathStyleOpts. Each edge's
    // `labelText` shows its pathType + (when present) the pathStyleOpts
    // payload so the demo also documents the data.
    const edges: EdgeData[] = [
      {
        id: 'straight',    source: 'straight-src',    target: 'straight-tgt',
        style: { shape: { pathType: 'straight' }, labelText: 'straight' },
      },
      {
        id: 'bezier',      source: 'bezier-src',      target: 'bezier-tgt',
        style: {
          shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } },
          labelText: "bezier · { axis: 'h', tension: 0.6 }",
        },
      },
      {
        id: 'bump-radial', source: 'bump-radial-src', target: 'bump-radial-tgt',
        style: {
          shape: { pathType: 'bump-radial', pathStyleOpts: { origin: { x: 0, y: 0 } } },
          labelText: 'bump-radial · { origin: { x: 0, y: 0 } }',
        },
      },
      {
        id: 'smooth',      source: 'smooth-src',      target: 'smooth-tgt',
        style: { shape: { pathType: 'smooth' }, labelText: 'smooth' },
      },
      {
        id: 'rounded',     source: 'rounded-src',     target: 'rounded-tgt',
        style: { shape: { pathType: 'rounded' }, labelText: 'rounded' },
      },
      {
        id: 'orth',        source: 'orth-src',        target: 'orth-tgt',
        style: { shape: { pathType: 'orth' }, labelText: 'orth' },
      },
      {
        id: 'manhattan',   source: 'manhattan-src',   target: 'manhattan-tgt',
        style: { shape: { pathType: 'manhattan' }, labelText: 'manhattan' },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edge-labels')!;
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
            shape: { kind: 'circle', radius: 9 },
            labelFontSize: 11,
            labelFontWeight: 600,
            labelColor: 0x475569,
            labelPlacement: 'left',
            labelOffsetX: -4,
          },
        },
        edge: {
          style: {
            strokeColor: 0xcbd5e1,
            strokeWidth: 1.5,
            arrowTargetShape: 'triangle',
            // Shared label styling — per-edge `labelText` supplies the text.
            labelFontSize: 11,
            labelFontWeight: 500,
            labelColor: 0x0f172a,
            labelPlacement: 'center',
            labelOffsetY: -8,
            labelAutoRotate: true,
            labelKeepUpright: true,
            labelBackgroundFill: 0xffffff,
            labelBackgroundStrokeColor: 0xe2e8f0,
            labelBackgroundStrokeWidth: 1,
            labelBackgroundCornerRadius: 4,
            labelBackgroundPadding: 4,
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
