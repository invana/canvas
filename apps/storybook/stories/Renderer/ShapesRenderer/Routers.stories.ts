import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  WorldLayer,
  ShapesRenderer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

const meta: Meta = {
  title: 'Canvas/Renderer/Routers',
};
export default meta;
type Story = StoryObj;

class GenericLayer extends WorldLayer {
  renderer!: ShapesRenderer;
  protected createState() { return {}; }
  protected override onMount(ctx: CanvasContext): void {
    this.renderer = new ShapesRenderer({ subLayer: this.subLayer, camera: ctx.camera });
  }
  hitTest() { return null; }
}

// Three built-in routers demonstrated with standalone connectors (kind:'point' endpoints).
//
// straight  — 2-point direct segment; ignores endpoint tangents.
// orthogonal — Manhattan-style elbow: horizontal-first when |dx|>=|dy|, vertical-first otherwise.
//              Produces 2 points when endpoints share an axis, 4 points otherwise.
// bezier     — Samples a cubic Bézier into a polyline.
//              Uses endpoint.tangent if provided; otherwise synthesises horizontal control vectors
//              with magnitude = distance/3. Resolution controlled by 'samples' option (default 16).
const connectors = [
  {
    // straight: same y — produces a straight horizontal segment
    id: 'straight-horizontal',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y:  80 },
    target: { kind: 'point', x: 400, y:  80 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // straight: different y — diagonal segment, no bending
    id: 'straight-diagonal',
    kind: 'line',
    router: 'straight',
    source: { kind: 'point', x:  80, y: 180 },
    target: { kind: 'point', x: 400, y: 240 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // orthogonal: |dx| > |dy| → horizontal-first L-shape (elbow on x midpoint)
    id: 'orthogonal-l-horizontal',
    kind: 'line',
    router: 'orthogonal',
    source: { kind: 'point', x:  80, y: 340 },
    target: { kind: 'point', x: 400, y: 390 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // orthogonal: |dy| > |dx| → vertical-first Z-shape (elbow on y midpoint)
    id: 'orthogonal-z-vertical',
    kind: 'line',
    router: 'orthogonal',
    source: { kind: 'point', x: 160, y: 480 },
    target: { kind: 'point', x: 200, y: 580 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // bezier: default tangents synthesised from distance (magnitude = distance/3, horizontal direction)
    id: 'bezier-default',
    kind: 'curve',
    router: 'bezier',
    source: { kind: 'point', x:  80, y: 680 },
    target: { kind: 'point', x: 400, y: 730 },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
  {
    // bezier: explicit tangents — source exits downward, target enters from above
    id: 'bezier-tangents',
    kind: 'curve',
    router: 'bezier',
    source: { kind: 'point', x:  80, y: 860, tangent: { x: 0, y: 1 } },
    target: { kind: 'point', x: 400, y: 860, tangent: { x: 0, y: -1 } },
    stroke: 0x374151,
    strokeWidth: 2,
    targetMarker: 'arrow',
    targetMarkerOptions: { color: 0x374151, size: 12 },
  },
];

export const Routers: Story = {
  render: () => {
    const container = document.createElement('div');
    container.style.width = '100%';
    container.style.height = '100%';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container, autoResize: true });

      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

      const layer = new GenericLayer({ id: 'routers', options: {} });
      canvas.layers.add(layer);

      for (const { id, ...spec } of connectors) {
        layer.renderer.addConnector(id, spec as never);
      }
    });

    return container;
  },
};
