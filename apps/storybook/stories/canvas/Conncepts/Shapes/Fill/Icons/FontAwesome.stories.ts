import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DragPanBehaviour,
  loadIconFont,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext, ShapeFillLayer } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Shapes/Fill/Icons/FontAwesome' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the engine's `kind: 'glyph'` fill layer rendering an
 * **icon-font glyph** — Font Awesome 6 Free Solid in this case. The
 * stylesheet load and font-readiness wait are handled by the engine's
 * `loadIconFont` helper; the story itself just inlines the codepoint
 * table and feeds chars to the glyph fill.
 *
 * All FA-specific data — codepoints, font family/weight, CDN URL — lives
 * inside `play`. Deleting this file removes Font Awesome from the codebase
 * entirely.
 */
export const FontAwesomeStory: Story = {
  name: 'FontAwesome',
  render: () => createContainer({ id: 'cvs-prim-icons-fa' }),

  play: async ({ canvasElement }) => {
    // ─── Font Awesome 6 Free Solid — codepoints from the FA 6.5 cheatsheet ──
    // Stored as `\uXXXX` escapes (not literal Private-Use chars) so the
    // bytes survive every tool / editor / git round-trip. The Pixi `Text`
    // glyph layer receives the literal char at runtime regardless.
    const fa = {
      'fa-database': '\uf1c0',
      'fa-rocket':   '\uf135',
      'fa-user':     '\uf007',
      'fa-heart':    '\uf004',
      'fa-star':     '\uf005',
      'fa-bell':     '\uf0f3',
      'fa-gear':     '\uf013',
      'fa-bolt':     '\uf0e7',
    };
    const FONT_FAMILY = 'Font Awesome 6 Free';
    const FONT_WEIGHT = 900;

    // Engine helper: stylesheet inject + font readiness in one call.
    // Probe at weight 900 — FA 6 Free Solid lives there. Probing at the
    // default weight (400) preloads only the Regular face and Pixi falls
    // back to a system font on first paint, rendering blank glyphs.
    await loadIconFont(
      'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css',
      FONT_FAMILY,
      FONT_WEIGHT,
    );

    // ─── Canvas setup ──────────────────────────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-icons-fa')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
        });
      }
      hitTest() { return null; }
    }
    const layer = new RenderLayer({ id: 'icons-fa', options: {} });
    canvas.layers.add(layer);

    // ─── Initial shape ─────────────────────────────────────────────────────
    const settings = { icon: 'fa-database' as keyof typeof fa };
    const PLATE = 0x6366f1;

    const buildFill = (): ReadonlyArray<ShapeFillLayer> => [
      { kind: 'solid', color: PLATE },
      {
        kind: 'glyph',
        char: fa[settings.icon],
        fontFamily: FONT_FAMILY,
        fontWeight: FONT_WEIGHT,
        color: 0xffffff,
        sizeRatio: 0.55,
      },
    ];

    layer.renderer.addShape('fa', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 40,
      fill: buildFill(),
      stroke: { color: 0x111827, width: 1 },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Font Awesome icon' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'icon', Object.keys(fa)).onChange(() => {
      layer.renderer.updateShape('fa', { fill: buildFill() });
    });
  },
};
