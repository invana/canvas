import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, WheelZoomBehaviour, WorldLayer, PrimitivesRenderer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import type { CompositeSpec } from '@invana/canvas/primitives';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Shapes/Composite' };
export default meta;
type Story = StoryObj;

/**
 * **Composite shape** — one `kind: 'composite'` shape whose `parts[]` declare
 * child geometry (`rect` accent bar, `line` divider) and six `label` text
 * blocks, each at a coordinate relative to the composite's top-left origin.
 * Demonstrates a "card node": all field positions live in the single spec
 * (the node definition); the border colour drives both the frame stroke and
 * the accent bar. Edit the six fields + border live in the gui.
 */
export const Composite: Story = {
  render: () => createContainer({ id: 'cvs-prim-shape-composite' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    // ── Card geometry (the "node definition" — all positions live here) ──
    const CARD = { w: 300, h: 165, pad: 18, radius: 14 };
    const inner = CARD.w - CARD.pad * 2; // 264

    interface CardFields {
      topLeft: string;
      topRight: string;
      heading: string;
      description: string;
      bottomLeft: string;
      bottomRight: string;
      borderColor: number;
    }

    const cardSpec = (f: CardFields): CompositeSpec => ({
      kind: 'composite',
      x: -CARD.w / 2, y: -CARD.h / 2, // centre the card at world (0, 0)
      width: CARD.w, height: CARD.h, cornerRadius: CARD.radius,
      fill: 0x1f2937,
      stroke: { color: f.borderColor, width: 2 }, // ← configurable border
      parts: [
        // left accent bar (rect) + header divider (line)
        { part: 'rect', x: 0, y: CARD.radius, width: 4, height: CARD.h - 2 * CARD.radius, fill: f.borderColor },
        { part: 'line', x: CARD.pad, y: 46, x2: CARD.w - CARD.pad, y2: 46, stroke: { color: 0x374151, width: 1 } },
        // top tags
        { part: 'label', x: CARD.pad, y: 16, text: f.topLeft, fontSize: 10, fontWeight: 600, fontVariant: 'small-caps', fill: 0x94a3b8 },
        { part: 'label', x: CARD.w - CARD.pad, y: 16, text: f.topRight, anchor: 'right', fontSize: 10, fontWeight: 600, fill: 0xf59e0b },
        // heading + description
        { part: 'label', x: CARD.pad, y: 56, text: f.heading, fontSize: 16, fontWeight: 700, fill: 0xf1f5f9, maxWidth: inner, maxLines: 1, overflow: 'ellipsis' },
        { part: 'label', x: CARD.pad, y: 86, text: f.description, fontSize: 12, fill: 0x94a3b8, lineHeight: 16, maxWidth: inner, maxLines: 2, overflow: 'ellipsis' },
        // footer
        { part: 'label', x: CARD.pad, y: CARD.h - 28, text: f.bottomLeft, fontSize: 11, fontWeight: 500, fill: 0x64748b },
        { part: 'label', x: CARD.w - CARD.pad, y: CARD.h - 28, text: f.bottomRight, anchor: 'right', fontSize: 11, fontWeight: 500, fill: 0x64748b },
      ],
    });

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-shape-composite')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'composite-card', options: {} });
    canvas.layers.add(layer);

    const fields: CardFields = {
      topLeft: 'LAYER',
      topRight: 'moderate',
      heading: 'Terraform Infrastructure',
      description: 'Terraform modules for provisioning GCP infrastructure including GKE clusters, networking and IAM policies across staging and production.',
      bottomLeft: '6 files',
      bottomRight: '',
      borderColor: 0xf59e0b,
    };

    const ID = 'card';
    const draw = (): void => {
      if (layer.renderer.hasShape(ID)) layer.renderer.removeShape(ID);
      layer.renderer.addShape(ID, cardSpec(fields));
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 80);

    const gui = new GUI({ title: 'card' });
    onStoryTeardown(() => gui.destroy());
    (['topLeft', 'topRight', 'heading', 'description', 'bottomLeft', 'bottomRight'] as const)
      .forEach((k) => gui.add(fields, k).onChange(draw));
    gui.addColor(fields, 'borderColor').onChange(draw);
  },
};
