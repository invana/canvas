import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  WorldLayer,
  ShapesRenderer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  PinchZoomBehaviour,
  KeyboardCameraInputBehaviour,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';

const meta: Meta = {
  title: 'Canvas/Setup',
};
export default meta;

type Story = StoryObj;

let activeCanvas: Canvas | null = null;

function attachCameraBehaviours(canvas: Canvas): void {
  const pan = new DragPanBehaviour({ id: 'pan' });
  const zoom = new WheelZoomBehaviour({ id: 'zoom' });
  const pinch = new PinchZoomBehaviour({ id: 'pinch' });
  const keyboard = new KeyboardCameraInputBehaviour({ id: 'keyboard-camera' });
  canvas.behaviours.register(pan);    pan.enable();
  canvas.behaviours.register(zoom);   zoom.enable();
  canvas.behaviours.register(pinch);  pinch.enable();
  canvas.behaviours.register(keyboard); keyboard.enable();
}

// A minimal generic WorldLayer — no opinion about what it renders. It just
// owns a `ShapesRenderer` so the story can drive shape mutations directly.
class GenericLayer extends WorldLayer {
  renderer!: ShapesRenderer;

  protected createState() {
    return {};
  }

  protected override onMount(ctx: CanvasContext): void {
    this.renderer = new ShapesRenderer({ subLayer: this.subLayer, camera: ctx.camera });
  }

  hitTest() {
    return null;
  }
}

export const DrawCircle: Story = {
  render: () => {
    activeCanvas?.destroy();

    const container = document.createElement('div');
    container.style.cssText = 'width: 100%; height: 500px;';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container });
      activeCanvas = canvas;
      attachCameraBehaviours(canvas);

      const layer = new GenericLayer({ id: 'demo', options: {} });
      canvas.layers.add(layer);

      layer.renderer.addShape('circle', {
        kind: 'circle',
        x: 200,
        y: 200,
        r: 60,
        fill: 0x4f9cf9,
        stroke: 0x2563eb,
        strokeWidth: 2,
      });
    });

    return container;
  },
};

// Showcase every built-in shape, connector, router, and marker on a single
// canvas. Layout: a row of shapes across the top, then a matrix of
// connectors below — rows = connector kind (line / curve), columns =
// router (straight / orthogonal / bezier), with each column also rotating
// through the four marker styles on the target end.
export const Showcase: Story = {
  render: () => {
    activeCanvas?.destroy();

    const container = document.createElement('div');
    container.style.cssText = 'width: 100%; height: 720px;';

    requestAnimationFrame(async () => {
      const canvas = new Canvas();
      await canvas.init({ container });
      activeCanvas = canvas;
      attachCameraBehaviours(canvas);

      const layer = new GenericLayer({ id: 'showcase', options: {} });
      canvas.layers.add(layer);
      const r = layer.renderer;

      // ─── Row 1: every built-in shape ──────────────────────────────────
      // Spaced evenly across the top so each primitive stands alone.
      r.addShape('shape-circle', {
        kind: 'circle',
        x: 100,
        y: 100,
        r: 40,
        fill: 0x4f9cf9,
        stroke: 0x1e3a8a,
        strokeWidth: 2,
      });

      r.addShape('shape-rect', {
        kind: 'rect',
        x: 220,
        y: 100,
        width: 90,
        height: 60,
        cornerRadius: 8,
        fill: 0x10b981,
        stroke: 0x065f46,
        strokeWidth: 2,
      });

      r.addShape('shape-ellipse', {
        kind: 'ellipse',
        x: 380,
        y: 100,
        rx: 55,
        ry: 35,
        fill: 0xf59e0b,
        stroke: 0x92400e,
        strokeWidth: 2,
      });

      // Hexagon polygon — points in shape-local space, centered on (0,0).
      r.addShape('shape-polygon', {
        kind: 'polygon',
        x: 520,
        y: 100,
        points: hexagonPoints(40),
        fill: 0xa855f7,
        stroke: 0x6b21a8,
        strokeWidth: 2,
      });

      // Star path drawn with cubic Beziers + lines.
      r.addShape('shape-path', {
        kind: 'path',
        x: 660,
        y: 100,
        commands: starPathCommands(40, 18),
        fill: 0xef4444,
        stroke: 0x7f1d1d,
        strokeWidth: 2,
      });

      r.addShape('shape-text', {
        kind: 'text',
        x: 800,
        y: 100,
        text: 'Hello canvas',
        style: { fill: 0x111827, fontSize: 18, fontWeight: '600' },
      });

      // Shape labels for the top row.
      const shapeLabels: Array<[string, number]> = [
        ['circle', 100],
        ['rect', 220],
        ['ellipse', 380],
        ['polygon', 520],
        ['path', 660],
        ['text', 800],
      ];
      for (const [name, x] of shapeLabels) {
        r.addShape(`label-${name}`, {
          kind: 'text',
          x,
          y: 170,
          text: name,
          style: { fill: 0x6b7280, fontSize: 12 },
        });
      }

      // ─── Connector matrix ─────────────────────────────────────────────
      // Two rows × three columns of connectors. Each cell has a pair of
      // anchor circles connected by a different (kind, router, marker)
      // combination. Markers cycle so all four built-ins are visible.
      const routers: Array<'straight' | 'orthogonal' | 'bezier'> = [
        'straight',
        'orthogonal',
        'bezier',
      ];
      const kinds: Array<'line' | 'curve'> = ['line', 'curve'];
      const markers = ['arrow', 'circle', 'square', 'diamond'] as const;

      const baseY = 280;
      const cellW = 280;
      const cellH = 180;
      const startX = 80;

      // Column headers.
      routers.forEach((router, ci) => {
        r.addShape(`col-${router}`, {
          kind: 'text',
          x: startX + ci * cellW + 110,
          y: baseY - 30,
          text: `router: ${router}`,
          style: { fill: 0x111827, fontSize: 13, fontWeight: '600' },
        });
      });

      // Row headers + cells.
      kinds.forEach((kind, ri) => {
        r.addShape(`row-${kind}`, {
          kind: 'text',
          x: 30,
          y: baseY + ri * cellH + 60,
          text: kind,
          style: { fill: 0x111827, fontSize: 13, fontWeight: '600' },
        });

        routers.forEach((router, ci) => {
          const cx = startX + ci * cellW;
          const cy = baseY + ri * cellH;

          const srcId = `src-${kind}-${router}`;
          const tgtId = `tgt-${kind}-${router}`;

          // Source anchor (left side of the cell).
          r.addShape(srcId, {
            kind: 'circle',
            x: cx + 30,
            y: cy + 60,
            r: 8,
            fill: 0x2563eb,
          });

          // Target anchor (right side of the cell, slightly offset
          // vertically so non-straight routers have something to bend
          // around).
          r.addShape(tgtId, {
            kind: 'circle',
            x: cx + 220,
            y: cy + 110,
            r: 8,
            fill: 0xdc2626,
          });

          // Pick a marker for this cell — cycles through arrow/circle/
          // square/diamond as we walk the matrix.
          const marker = markers[(ri * routers.length + ci) % markers.length]!;

          r.addConnector(`edge-${kind}-${router}`, {
            kind,
            router,
            source: { kind: 'shape', shapeId: srcId },
            target: { kind: 'shape', shapeId: tgtId },
            stroke: 0x374151,
            strokeWidth: 2,
            cap: 'round',
            targetMarker: marker,
            targetMarkerOptions: { color: 0x374151, size: 12 },
          });

          // Marker name caption under the cell.
          r.addShape(`marker-${kind}-${router}`, {
            kind: 'text',
            x: cx + 125,
            y: cy + 160,
            text: `marker: ${marker}`,
            style: { fill: 0x6b7280, fontSize: 11 },
          });
        });
      });
    });

    return container;
  },
};

// ─── Shape geometry helpers ────────────────────────────────────────────

function hexagonPoints(radius: number): Array<{ x: number; y: number }> {
  const pts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 3) * i - Math.PI / 2;
    pts.push({ x: Math.cos(a) * radius, y: Math.sin(a) * radius });
  }
  return pts;
}

function starPathCommands(
  outer: number,
  inner: number,
): Array<
  | { kind: 'moveTo'; x: number; y: number }
  | { kind: 'lineTo'; x: number; y: number }
  | { kind: 'close' }
> {
  const cmds: Array<
    | { kind: 'moveTo'; x: number; y: number }
    | { kind: 'lineTo'; x: number; y: number }
    | { kind: 'close' }
  > = [];
  const steps = 10;
  for (let i = 0; i < steps; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / (steps / 2)) * i - Math.PI / 2;
    const p = { x: Math.cos(a) * r, y: Math.sin(a) * r };
    cmds.push({ kind: i === 0 ? 'moveTo' : 'lineTo', x: p.x, y: p.y });
  }
  cmds.push({ kind: 'close' });
  return cmds;
}
