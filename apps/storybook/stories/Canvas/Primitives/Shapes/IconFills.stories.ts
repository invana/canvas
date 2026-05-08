import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  IconRegistry,
  PrimitivesRenderer,
  WheelZoomBehaviour,
  WorldLayer,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import { createContainer } from '../../../div-util';

const meta: Meta = { title: 'Canvas/Primitives/Shapes/IconFills' };
export default meta;
type Story = StoryObj;

/**
 * Demonstrates the icon-fill API using the CSS-style usage model:
 *
 *   1. Inject the icon-font stylesheet (analogous to `<link rel=stylesheet>`).
 *   2. Declare a font pack on the `IconRegistry` — analogous to a CSS class
 *      like `.fa-solid` setting `font-family`+`font-weight`.
 *   3. Register named glyphs against the pack — analogous to per-icon
 *      `content: "\f1c0"` declarations.
 *   4. Reference icons by short name (`'fa-solid:database'`) from shape
 *      specs — analogous to `<i class="fa-solid fa-database">`.
 *
 * Codepoints are kept out of shape specs entirely; only human names appear.
 */
export const IconFills: Story = {
  render: () => createContainer({ id: 'cvs-prim-icon-fills' }),

  play: async ({ canvasElement }) => {
    // ─── Icon registry — populated like CSS class declarations ──────────────

    const icons = new IconRegistry();

    // (1) `.fa-solid` — Font Awesome 6 Free Solid lives at weight 900.
    icons.registerPack('fa-solid', {
      fontFamily: 'Font Awesome 6 Free',
      fontWeight: 900,
    });
    icons.registerGlyphs('fa-solid', {
      database: '',
      rocket: '',
    });

    // (2) Pure-Unicode "pack" — uses the system font, no CDN needed.
    icons.registerPack('unicode', { fontFamily: 'sans-serif' });
    icons.registerGlyphs('unicode', { star: '★' });

    // (3) SVG icons — fetched once from Lucide, registered by name.
    const databasePathD = await fetchLucideAsPathD('database');
    icons.registerSvg('lucide-database', { pathD: databasePathD, strokeWidth: 2 });

    // ─── Stylesheet + webfont readiness ─────────────────────────────────────
    //
    // Order matters here. `<link rel=stylesheet>` kicks off:
    //   stylesheet download → CSS parse → @font-face registration → WOFF fetch
    // The FontFaceSet only knows about the family AFTER the @font-face
    // is parsed, so calling `document.fonts.load(...)` before that returns
    // an empty result and Pixi rasterizes against a fallback (chopped /
    // wrong-metrics glyph). Wait for the link's `load` event first, then
    // ask the FontFaceSet to actually load the face.

    await ensureFAStylesheet();
    await icons.loadFonts();

    // ─── Canvas setup ───────────────────────────────────────────────────────

    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({
          container: this.container,
          camera: ctx.camera,
          iconRegistry: icons,
        });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-icon-fills')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'icon-fills', options: {} });
    canvas.layers.add(layer);

    // ─── Shapes — reference icons by short name only ────────────────────────

    layer.renderer.addShape('lucide-database', {
      kind: 'circle', x: 0, y: 0, radius: 32,
      fill: {
        kind: 'icon',
        icon: { kind: 'ref', name: 'lucide-database' },
        color: 0xffffff,
        background: { color: 0x10b981 },
      },
      stroke: { color: 0x047857, width: 1.5 },
    });

    layer.renderer.addShape('unicode-star', {
      kind: 'rect', x: 70, y: -32, width: 64, height: 64, cornerRadius: 10,
      fill: {
        kind: 'icon',
        icon: { kind: 'ref', name: 'unicode:star' },
        color: 0xfbbf24,
        background: { color: 0x18181b },
      },
    });

    layer.renderer.addShape('fa-database', {
      kind: 'circle', x: 190, y: 0, radius: 32,
      fill: {
        kind: 'icon',
        icon: { kind: 'ref', name: 'fa-solid:database' },
        color: 0xffffff,
        background: { color: 0x6366f1 },
      },
    });

    layer.renderer.addShape('fa-rocket', {
      kind: 'rect', x: 270, y: -32, width: 64, height: 64, cornerRadius: 32,
      fill: {
        kind: 'icon',
        icon: { kind: 'ref', name: 'fa-solid:rocket' },
        color: 0xffffff,
        background: { color: 0xef4444 },
      },
    });

    canvas.camera.fitContent(layer.getBounds(), 100);

    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * Inject the FontAwesome 6 Free webfont stylesheet once per page and
     * resolve only when it has finished parsing — at which point the
     * `@font-face` declarations are registered with the FontFaceSet.
     */
    function ensureFAStylesheet(): Promise<void> {
      const existing = document.querySelector<HTMLLinkElement>('link[data-fa-cdn]');
      if (existing) {
        if (existing.sheet) return Promise.resolve();
        return new Promise((resolve, reject) => {
          existing.addEventListener('load', () => resolve(), { once: true });
          existing.addEventListener('error', () => reject(new Error('FA stylesheet load failed')), { once: true });
        });
      }
      return new Promise((resolve, reject) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.dataset.faCdn = 'true';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css';
        link.onload = () => resolve();
        link.onerror = () => reject(new Error('FA stylesheet load failed'));
        document.head.appendChild(link);
      });
    }

    /**
     * Fetch a Lucide icon SVG from unpkg, return a concatenated path-d.
     * Lucide icons mix `<path>` with `<ellipse>` / `<circle>` / `<rect>` /
     * `<line>` / `<polyline>` / `<polygon>` — each primitive is converted
     * to an equivalent path-d before joining.
     */
    async function fetchLucideAsPathD(name: string): Promise<string> {
      const res = await fetch(`https://unpkg.com/lucide-static@latest/icons/${name}.svg`);
      const svg = await res.text();
      const doc = new DOMParser().parseFromString(svg, 'image/svg+xml');
      const num = (el: Element, attr: string) => Number(el.getAttribute(attr) ?? 0);
      const pointsToPath = (pts: string, close: boolean): string => {
        const c = pts.trim().split(/[\s,]+/).map(Number);
        if (c.length < 4) return '';
        let d = `M${c[0]},${c[1]}`;
        for (let i = 2; i < c.length; i += 2) d += ` L${c[i]},${c[i + 1]}`;
        return close ? `${d} Z` : d;
      };
      const ds: string[] = [];
      for (const el of doc.querySelectorAll('path, ellipse, circle, rect, line, polyline, polygon')) {
        switch (el.tagName.toLowerCase()) {
          case 'path': {
            const d = el.getAttribute('d');
            if (d) ds.push(d);
            break;
          }
          case 'ellipse': {
            const cx = num(el, 'cx'), cy = num(el, 'cy');
            const rx = num(el, 'rx'), ry = num(el, 'ry');
            ds.push(`M${cx - rx},${cy} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0 Z`);
            break;
          }
          case 'circle': {
            const cx = num(el, 'cx'), cy = num(el, 'cy'), r = num(el, 'r');
            ds.push(`M${cx - r},${cy} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 Z`);
            break;
          }
          case 'rect': {
            const x = num(el, 'x'), y = num(el, 'y');
            const w = num(el, 'width'), h = num(el, 'height');
            ds.push(`M${x},${y} h${w} v${h} h${-w} Z`);
            break;
          }
          case 'line': {
            ds.push(`M${num(el, 'x1')},${num(el, 'y1')} L${num(el, 'x2')},${num(el, 'y2')}`);
            break;
          }
          case 'polyline': {
            const d = pointsToPath(el.getAttribute('points') ?? '', false);
            if (d) ds.push(d);
            break;
          }
          case 'polygon': {
            const d = pointsToPath(el.getAttribute('points') ?? '', true);
            if (d) ds.push(d);
            break;
          }
        }
      }
      return ds.join(' ');
    }
  },
};
