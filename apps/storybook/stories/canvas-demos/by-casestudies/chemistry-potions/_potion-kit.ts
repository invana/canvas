/**
 * Shared kit for the `chemistry-potions` stories — a wizard's potion workshop
 * for kids, where every "spell" is a real reaction underneath.
 *
 * **Who it is for:** a teacher showing kids that mixing two liquids can make
 * bubbles or change colour. The fantasy names are the hook; the lesson card
 * always says what the real chemicals are.
 *
 * **What the engine does vs what the story does.**
 * - **Glassware liquid** (beaker / flask) is engine capability: a `'path'` shape
 *   per vessel with a `'liquid-fill'` decoration — masked to the glass outline,
 *   vertical gradient, animated wave, surface gloss. The story only sets the
 *   level and the colour.
 * - **Everything that flies** — bubbles, pops, foam, the pour stream, drops,
 *   splashes, colour clouds, sparkles, the tilting test tube — is drawn every
 *   frame through one world-space `surface.overlay(...)`, the same immediate-mode
 *   approach as the `physics-pulleys` demo. The simulation lives in the story,
 *   never in the store (the canvas has no clock by design —
 *   `docs/rfcs/feat/2026-11-17-the-canvas-has-no-time.md`).
 * - **Words** are `'label'` decorations on invisible 1×1 anchor rects
 *   ({@link Board.text}), on a layer above the ink.
 *
 * **Known gap (why some waves pause).** `setDecoration` disposes and rebuilds the
 * decoration, and there is no in-place style update, so every level / colour
 * change through the public API restarts the liquid's wave phase. {@link Vessel.sync}
 * therefore only re-sets the decoration when the level or colour changed by a
 * visible step. While a colour is actively tweening the surface wave holds still.
 *
 * **Colour is pinned, on purpose** — colour *is* the lesson (indicator colours),
 * so the scene mounts no `ThemeBehaviour`, like `physics-pulleys`.
 */
import { BackgroundLayer, Canvas, WorldLayer, type IElementRenderer, type IOverlayDevice } from '@invana/canvas';
import { onStoryTeardown } from '../../../div-util';

// ─── Layout + palette ─────────────────────────────────────────────────────

/** The fixed world rectangle the camera frames: bench on the left, lesson card in the middle, an empty strip on the right for lil-gui. */
const WORLD = { x: 0, y: 0, width: 1480, height: 760 } as const;
/** Lesson card bounds (world). */
const CARD = { x: 800, y: 40, width: 380, height: 680 } as const;
/** World y of the table top every vessel stands on. */
export const TABLE_Y = 600;

/** Workshop palette. Liquids get their colours from the reaction, not from here. */
export const P = {
  bg: '#1b1233',
  dots: '#2c2150',
  ink: 0xf5f3ff,
  dim: 0xb8b0d9,
  card: 0x271c44,
  cardEdge: 0x5b4a8a,
  gold: 0xfcd34d,
  glass: 0xe0f2fe,
  wood: 0x6b3f24,
  woodTop: 0x8a5532,
  woodEdge: 0x3f2414,
  shelf: 0x4a2f1c,
  rubber: 0xf472b6,
  moon: 0xfef3c7,
  bubble: 0xffffff,
  /** Water / clear potion look: barely-blue, mostly see-through. */
  clear: 0xcfe8ff,
} as const;

// ─── Colour helpers ───────────────────────────────────────────────────────

/** Linear blend of two `0xRRGGBB` colours, `t` in [0, 1]. */
export function mix(a: number, b: number, t: number): number {
  const k = Math.min(1, Math.max(0, t));
  const ar = (a >> 16) & 255, ag = (a >> 8) & 255, ab = a & 255;
  const br = (b >> 16) & 255, bg = (b >> 8) & 255, bb = b & 255;
  return (Math.round(ar + (br - ar) * k) << 16) | (Math.round(ag + (bg - ag) * k) << 8) | Math.round(ab + (bb - ab) * k);
}

/** Sample a multi-stop colour ramp `[[value, colour], …]` (stops sorted by value). */
export function ramp(stops: ReadonlyArray<readonly [number, number]>, v: number): number {
  if (v <= stops[0]![0]) return stops[0]![1];
  for (let i = 1; i < stops.length; i++) {
    const [v1, c1] = stops[i]!;
    const [v0, c0] = stops[i - 1]!;
    if (v <= v1) return mix(c0, c1, (v - v0) / (v1 - v0));
  }
  return stops[stops.length - 1]![1];
}

/** Smooth 0→1 ease. */
export function ease(t: number): number {
  const k = Math.min(1, Math.max(0, t));
  return k * k * (3 - 2 * k);
}

/** Format a number with fixed decimals, dropping a trailing `.0`. */
export function fmt(v: number, digits = 1): string {
  const s = v.toFixed(digits);
  return digits > 0 && /\.0+$/.test(s) ? s.replace(/\.0+$/, '') : s;
}

/** Red-cabbage indicator colour by pH — pink in sour, purple in neutral, blue → green in soapy. */
export const CABBAGE: ReadonlyArray<readonly [number, number]> = [
  [2, 0xff2d6f],
  [4, 0xe0479e],
  [6, 0x9b4fd0],
  [7, 0x6d4fd8],
  [8, 0x3b6fe6],
  [10, 0x22b8a6],
  [12, 0x9bd33a],
];

// ─── Board: immediate-mode drawing + pooled text ──────────────────────────

/** Text style for {@link Board.text}. */
export interface TextStyle {
  readonly size?: number;
  readonly color?: number;
  readonly weight?: number;
  /** `'center'` centres on (x, y); `'left'` puts the block's top-left corner at (x, y). */
  readonly align?: 'center' | 'left';
  /** Wrap width in world px. */
  readonly maxWidth?: number;
  /** Draw a dark pill behind the text so it reads over the scene. */
  readonly pill?: boolean;
}

/**
 * One frame's drawing surface over an overlay device. Call {@link begin}, draw,
 * then {@link end}: `end` hides every text id not written this frame, so a scene
 * can draw text conditionally without tracking what it showed last time.
 *
 * A slimmer cousin of the `physics-pulleys` board — copied rather than imported
 * so the two demos don't couple.
 */
export class Board {
  private readonly texts = new Map<string, { key: string; x: number; y: number; visible: boolean }>();
  private readonly used = new Set<string>();
  private readonly heights = new Map<string, number>();

  constructor(
    /** The raw overlay, for paths the helpers don't cover. */
    readonly ink: IOverlayDevice,
    private readonly prims: IElementRenderer,
  ) {}

  /** Start a frame: wipe the ink. */
  begin(): void {
    this.ink.clear();
    this.used.clear();
  }

  /** Finish a frame: hide text not written since {@link begin}. */
  end(): void {
    for (const [id, t] of this.texts) {
      if (!this.used.has(id) && t.visible) {
        this.prims.setDecorationVisible(id, 'label', false);
        t.visible = false;
      }
    }
  }

  /** Straight stroke. */
  line(x1: number, y1: number, x2: number, y2: number, color: number, width = 3, alpha = 1): void {
    this.ink.moveTo(x1, y1).lineTo(x2, y2).stroke({ color, width, alpha });
  }

  /** Circle with optional fill and outline. */
  circle(cx: number, cy: number, r: number, fill?: number, fillAlpha = 1, stroke?: number, width = 2, strokeAlpha = 1): void {
    if (r <= 0) return;
    if (fill !== undefined) this.ink.ellipse(cx, cy, r, r).fill({ color: fill, alpha: fillAlpha });
    if (stroke !== undefined) this.ink.ellipse(cx, cy, r, r).stroke({ color: stroke, width, alpha: strokeAlpha });
  }

  /** Filled rectangle with an optional outline. */
  box(x: number, y: number, w: number, h: number, fill: number, stroke?: number, radius = 0, alpha = 1): void {
    if (radius > 0) this.ink.roundRect(x, y, w, h, radius).fill({ color: fill, alpha });
    else this.ink.rect(x, y, w, h).fill({ color: fill, alpha });
    if (stroke !== undefined) {
      if (radius > 0) this.ink.roundRect(x, y, w, h, radius).stroke({ color: stroke, width: 2 });
      else this.ink.rect(x, y, w, h).stroke({ color: stroke, width: 2 });
    }
  }

  /** Open polyline through flat `[x0, y0, x1, y1, …]` points. */
  polyline(points: readonly number[], color: number, width = 3, alpha = 1): void {
    if (points.length < 4) return;
    this.ink.poly(points, false).stroke({ color, width, alpha });
  }

  /** Filled closed polygon through flat points. */
  polygon(points: readonly number[], color: number, alpha = 1): void {
    if (points.length < 6) return;
    this.ink.poly(points, true).fill({ color, alpha });
  }

  /** A four-point twinkle star of radius `s`. */
  sparkle(cx: number, cy: number, s: number, color: number, alpha = 1): void {
    const k = s * 0.28;
    this.polygon([cx, cy - s, cx + k, cy - k, cx + s, cy, cx + k, cy + k, cx, cy + s, cx - k, cy + k, cx - s, cy, cx - k, cy - k], color, alpha);
  }

  /**
   * Draw text by stable `id`. Re-styles the label only when its text or style
   * changed; otherwise just moves it. Returns the block's height (world px).
   */
  text(id: string, x: number, y: number, str: string, style: TextStyle = {}): number {
    const { size = 16, color = P.ink, weight = 400, align = 'center', maxWidth, pill = false } = style;
    const key = `${str}|${size}|${color}|${weight}|${align}|${maxWidth ?? ''}|${pill}`;
    const content = {
      kind: 'text' as const,
      text: str,
      fontSize: size,
      fontWeight: weight,
      fill: color,
      align: align === 'left' ? ('left' as const) : ('center' as const),
      fontFamily: 'ui-rounded, "Comic Sans MS", system-ui, sans-serif',
    };
    const wrap = maxWidth ? { maxWidth, wordWrap: true } : undefined;
    let t = this.texts.get(id);
    if (!t) {
      this.prims.addShape(id, { kind: 'rect', x, y, width: 1, height: 1, zIndex: 10 });
      t = { key: '', x, y, visible: true };
      this.texts.set(id, t);
    }
    if (t.key !== key) {
      this.prims.setDecoration(id, 'label', {
        kind: 'label',
        style: {
          content,
          ...(wrap ? { wrap } : {}),
          ...(pill ? { background: { fill: 0x120b24, fillAlpha: 0.8, radius: 8, padding: [3, 8] as [number, number] } } : {}),
          placement: align === 'left' ? 'bottom-right' : 'center',
        },
      });
      t.key = key;
      this.heights.set(key, this.prims.measureLabel(content, wrap)?.height ?? size * 1.3);
    }
    if (t.x !== x || t.y !== y) {
      this.prims.moveShape(id, x, y);
      t.x = x;
      t.y = y;
    }
    if (!t.visible) {
      this.prims.setDecorationVisible(id, 'label', true);
      t.visible = true;
    }
    this.used.add(id);
    return this.heights.get(key) ?? size * 1.3;
  }
}

// ─── Mounting ─────────────────────────────────────────────────────────────

/**
 * A world layer that exposes its primitives + one overlay, and runs a frame
 * callback from the engine's own clock (`Canvas.tickOnce` calls a layer's
 * duck-typed `tickAnimations(deltaMs)` every frame), so no story needs a
 * `requestAnimationFrame` loop of its own.
 */
class WorkshopLayer extends WorldLayer {
  ink!: IOverlayDevice;
  prims!: IElementRenderer;
  onFrame?: (dt: number) => void;
  protected createState() {
    return {};
  }
  protected onMount() {
    this.prims = this.surface.primitives;
    this.ink = this.surface.overlay('potion-ink');
  }
  /** Engine frame hook. `deltaMs` is capped at 50 ms so a stalled tab doesn't teleport a drop. */
  tickAnimations(deltaMs: number): void {
    this.onFrame?.(Math.min(0.05, deltaMs / 1000));
  }
  hitTest() {
    return null;
  }
}

/** A mounted workshop: the boards to draw on, the glassware primitives, and a per-frame hook. */
export interface Workshop {
  readonly canvas: Canvas;
  /** Scenery ink — drawn *behind* the glassware (table, shelf, window). */
  readonly back: Board;
  /** Effects ink — drawn *in front of* the glassware liquid (bubbles, glass outline, tube, stream). */
  readonly fx: Board;
  /** Primitives of the glassware layer — {@link Vessel} adds its shape here. */
  readonly glassware: IElementRenderer;
  /** Seconds since mount (for twinkles and wobbles). */
  readonly time: () => number;
  /** Run `fn(dt)` every engine frame (dt in seconds, capped at 50 ms). */
  onFrame(fn: (dt: number) => void): void;
}

/**
 * Mount the workshop into `container`. Four stacked layers, because a surface
 * paints its overlay *above* its own primitives: scenery ink (z1) → glassware
 * primitives + effects ink (z2) → words (z3). Fixed camera framing {@link WORLD},
 * refit on resize; no pan / zoom so the lesson can't get lost.
 */
export async function mountWorkshop(container: HTMLDivElement): Promise<Workshop> {
  const canvas = new Canvas();
  onStoryTeardown(() => canvas.destroy());
  await canvas.init({ container, autoResize: true });
  canvas.layers.add(
    new BackgroundLayer({
      id: 'bg',
      options: { type: 'pattern', patternType: 'dots', backgroundColor: P.bg, color: P.dots, spacing: 28 },
    }),
  );
  const scenery = new WorkshopLayer({ id: 'scenery', options: {}, zIndex: 1 });
  const lab = new WorkshopLayer({ id: 'glassware', options: {}, zIndex: 2 });
  const words = new WorkshopLayer({ id: 'words', options: {}, zIndex: 3 });
  canvas.layers.add(scenery);
  canvas.layers.add(lab);
  canvas.layers.add(words);

  const fit = (): void => canvas.camera.fitContent({ ...WORLD }, 12);
  fit();
  const observer = new ResizeObserver(() => setTimeout(fit, 0));
  observer.observe(container);
  onStoryTeardown(() => observer.disconnect());

  const back = new Board(scenery.ink, words.prims);
  const fx = new Board(lab.ink, words.prims);
  let clock = 0;
  const frames: Array<(dt: number) => void> = [];
  lab.onFrame = (dt) => {
    clock += dt;
    back.begin();
    fx.begin();
    for (const fn of frames) fn(dt);
    back.end();
    fx.end();
  };

  return { canvas, back, fx, glassware: lab.prims, time: () => clock, onFrame: (fn) => frames.push(fn) };
}

// ─── Scenery ──────────────────────────────────────────────────────────────

/** Ingredient jars on the shelf: [x, colour]. */
const JARS: ReadonlyArray<readonly [number, number]> = [
  [70, 0x34d399],
  [125, 0xf472b6],
  [180, 0x60a5fa],
  [235, 0xfbbf24],
  [290, 0xa78bfa],
];

/**
 * The workshop backdrop: moon window, a shelf of jars, twinkling stars and the
 * wooden table. Purely decorative — drawn on the scenery board each frame so
 * the stars can twinkle.
 */
export function drawWorkshop(board: Board, t: number): void {
  // Moon window.
  board.box(600, 40, 150, 130, 0x0d0a1f, 0x6b5a99, 70);
  board.circle(668, 92, 26, P.moon, 1);
  board.circle(682, 84, 24, 0x0d0a1f, 1);
  board.line(675, 40, 675, 170, 0x6b5a99, 3);
  board.line(600, 108, 750, 108, 0x6b5a99, 3);
  // Shelf + jars.
  board.box(40, 160, 300, 12, P.shelf, P.woodEdge, 3);
  for (const [x, color] of JARS) {
    board.box(x - 18, 112, 36, 48, 0x2d2350, P.glass, 8, 0.5);
    board.box(x - 15, 130, 30, 27, color, undefined, 6, 0.8);
    board.box(x - 12, 104, 24, 10, 0x8a5532, P.woodEdge, 3);
  }
  // Twinkles.
  for (let i = 0; i < 14; i++) {
    const x = 30 + ((i * 197) % 740);
    const y = 30 + ((i * 113) % 230);
    const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(t * (1.2 + (i % 5) * 0.3) + i));
    board.sparkle(x, y, 3 + (i % 3) * 1.5, P.gold, a);
  }
  // Table.
  board.box(10, TABLE_Y, 780, 16, P.woodTop, P.woodEdge, 4);
  board.box(24, TABLE_Y + 16, 752, 130, P.wood, undefined, 0);
  for (let x = 40; x < 770; x += 70) board.line(x, TABLE_Y + 22, x + 40, TABLE_Y + 22, P.woodEdge, 2, 0.5);
}

// ─── Glassware: vessels with engine liquid ────────────────────────────────

/** `[height above the inner bottom, half-width]` pairs, bottom to top. */
export type Profile = ReadonlyArray<readonly [number, number]>;

/** A round-cornered straight beaker, 190 px tall. */
export const BEAKER: Profile = [
  [0, 76],
  [4, 84],
  [12, 88],
  [190, 88],
  [196, 93],
];

/** An Erlenmeyer (cone) flask with a neck, 236 px tall. */
export const FLASK: Profile = [
  [0, 82],
  [4, 92],
  [12, 96],
  [150, 26],
  [160, 22],
  [230, 22],
  [236, 28],
];

/** Options for a {@link Vessel}. */
export interface VesselOptions {
  readonly id: string;
  /** World x of the vessel's centre line. */
  readonly x: number;
  /** World y of the vessel's inner bottom (usually {@link TABLE_Y}). */
  readonly y: number;
  readonly profile: Profile;
  /** Draw measuring marks up the right wall. */
  readonly marks?: boolean;
}

/**
 * A beaker or flask: an engine `'path'` shape for the glass body, carrying a
 * `'liquid-fill'` decoration for the liquid. Liquid amount is an **area**
 * (world px² — a 2-D "volume"), so pouring conserves what you see: the level
 * rises faster in the flask's narrow neck than in its wide body.
 *
 * The glass *outline* is drawn on the effects board ({@link drawGlass}), not as
 * the shape's stroke — a closed path would stroke a line across the open mouth.
 */
export class Vessel {
  /** Liquid area, world px². */
  area = 0;
  /** Liquid colour (the gradient is derived from it). */
  color: number = P.clear;
  /** Liquid opacity — low for clear potions. */
  alpha = 0.55;
  /** How far the gradient's top is lightened toward white (0 = flat colour). Lower it for dark liquids. */
  sheen = 0.3;
  /** Total inner height, px. */
  readonly height: number;
  /** Area when filled to the brim. */
  readonly capacity: number;
  private readonly cum: number[] = [0];
  private lastKey = '';

  constructor(
    private readonly prims: IElementRenderer,
    readonly opts: VesselOptions,
  ) {
    const pr = opts.profile;
    this.height = pr[pr.length - 1]![0];
    for (let i = 1; i < pr.length; i++) {
      const [h0, w0] = pr[i - 1]!;
      const [h1, w1] = pr[i]!;
      this.cum.push(this.cum[i - 1]! + (w0 + w1) * (h1 - h0));
    }
    this.capacity = this.cum[this.cum.length - 1]!;
    const points = [...pr.map(([h, w]) => ({ x: -w, y: -h })), ...[...pr].reverse().map(([h, w]) => ({ x: w, y: -h }))];
    prims.addShape(opts.id, {
      kind: 'path',
      x: opts.x,
      y: opts.y,
      points,
      closed: true,
      fill: { kind: 'solid', color: P.glass, alpha: 0.08 },
      zIndex: 1,
    });
  }

  /** Inner half-width at height `h` above the bottom. */
  halfWidthAt(h: number): number {
    const pr = this.opts.profile;
    if (h <= 0) return pr[0]![1];
    for (let i = 1; i < pr.length; i++) {
      const [h1, w1] = pr[i]!;
      if (h <= h1) {
        const [h0, w0] = pr[i - 1]!;
        return w0 + ((w1 - w0) * (h - h0)) / (h1 - h0);
      }
    }
    return pr[pr.length - 1]![1];
  }

  /** Liquid area below height `h`. */
  areaBelow(h: number): number {
    const pr = this.opts.profile;
    if (h <= 0) return 0;
    for (let i = 1; i < pr.length; i++) {
      const [h1] = pr[i]!;
      if (h <= h1) {
        const [h0, w0] = pr[i - 1]!;
        return this.cum[i - 1]! + (w0 + this.halfWidthAt(h)) * (h - h0);
      }
    }
    return this.capacity;
  }

  /** Height of a liquid area (inverse of {@link areaBelow}). */
  heightOf(area: number): number {
    if (area <= 0) return 0;
    if (area >= this.capacity) return this.height;
    let lo = 0;
    let hi = this.height;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      if (this.areaBelow(mid) < area) lo = mid;
      else hi = mid;
    }
    return (lo + hi) / 2;
  }

  /** Current liquid level, px above the bottom. */
  get level(): number {
    return this.heightOf(this.area);
  }

  /** World y of the liquid surface. */
  get surfaceY(): number {
    return this.opts.y - this.level;
  }

  /** World y of the rim. */
  get rimY(): number {
    return this.opts.y - this.height;
  }

  /** World x-range of the mouth (inside the rim). */
  get mouth(): { left: number; right: number } {
    const w = this.halfWidthAt(this.height - 6);
    return { left: this.opts.x - w, right: this.opts.x + w };
  }

  /** Add (or with a negative value, remove) liquid. Overfill is clamped to the brim. */
  add(dArea: number): void {
    this.area = Math.min(this.capacity, Math.max(0, this.area + dArea));
  }

  /** A random point inside the liquid, `margin` px from the glass. */
  randomPoint(margin = 6): { x: number; y: number } {
    const h = Math.random() * Math.max(0, this.level - margin) + margin * 0.5;
    const w = Math.max(0, this.halfWidthAt(h) - margin);
    return { x: this.opts.x + (Math.random() * 2 - 1) * w, y: this.opts.y - h };
  }

  /** Clamp a world point into the liquid, `margin` px from the glass and below the surface. */
  clampInside(x: number, y: number, margin = 4): { x: number; y: number } {
    const top = this.surfaceY + margin;
    const cy = Math.min(this.opts.y - margin, Math.max(top, y));
    const w = Math.max(0, this.halfWidthAt(this.opts.y - cy) - margin);
    return { x: Math.min(this.opts.x + w, Math.max(this.opts.x - w, x)), y: cy };
  }

  /**
   * Push the level + colour to the engine's `liquid-fill` decoration — only
   * when they moved by a visible step (see the module note on wave resets).
   * Call once per frame after the story updated {@link area} / {@link color}.
   */
  sync(): void {
    const q = (c: number): number => (((c >> 16) & 252) << 16) | (((c >> 8) & 252) << 8) | (c & 252);
    const level = this.level / this.height;
    const key = this.area <= 1 ? 'empty' : `${Math.round(level * 600)}|${q(this.color)}|${Math.round(this.alpha * 40)}|${Math.round(this.sheen * 40)}`;
    if (key === this.lastKey) return;
    this.lastKey = key;
    if (key === 'empty') {
      this.prims.setDecoration(this.opts.id, 'liquid', null);
      return;
    }
    this.prims.setDecoration(this.opts.id, 'liquid', {
      kind: 'liquid-fill',
      style: {
        fillLevel: level,
        colorTop: mix(this.color, 0xffffff, this.sheen),
        colorBottom: mix(this.color, 0x000000, 0.25),
        alpha: this.alpha,
        wave: { amplitude: 2.5, wavelength: 55, periodMs: 1500 },
        surfaceHighlight: { color: 0xffffff, alpha: 0.5, thickness: 2.5 },
      },
    });
  }

  /** The glass outline (open at the top), a shine stripe and optional measuring marks. */
  drawGlass(board: Board): void {
    const { x, y, profile } = this.opts;
    const pts: number[] = [];
    for (let i = profile.length - 1; i >= 0; i--) pts.push(x - profile[i]![1], y - profile[i]![0]);
    for (const [h, w] of profile) pts.push(x + w, y - h);
    board.polyline(pts, P.glass, 3.5, 0.9);
    // Shine.
    const shine: number[] = [];
    for (let h = this.height * 0.12; h <= this.height * 0.8; h += 6) shine.push(x - this.halfWidthAt(h) + 11, y - h);
    board.polyline(shine, 0xffffff, 4, 0.22);
    if (this.opts.marks) {
      for (let h = 30, i = 1; h < this.height - 10; h += 30, i++) {
        const xr = x + this.halfWidthAt(h);
        board.line(xr - (i % 2 ? 14 : 22), y - h, xr - 2, y - h, P.glass, 2, 0.55);
      }
    }
  }
}

// ─── Test tube: an overlay vessel that tilts and pours ────────────────────

/** Where the tube is in its pour choreography. */
export type TubePhase = 'rest' | 'out' | 'tilt' | 'pour' | 'back';

/**
 * A test tube drawn entirely on the overlay (the engine's `liquid-fill` levels
 * against the host's bounding box, so a tilted host would tilt the liquid
 * surface too). The liquid here is the tube's interior polygon clipped by a
 * **horizontal** surface, with that surface solved so the liquid area stays
 * constant as the tube turns — so liquid only spills once the tilt brings the
 * surface above the lip. Spilled area is returned by {@link step}.
 */
export class TestTube {
  /** Liquid area, world px². */
  volume: number;
  color: number;
  alpha: number;
  /** Mouth centre (world) and tilt (radians, + = mouth swings right). */
  mouth: { x: number; y: number };
  angle = 0;
  phase: TubePhase = 'rest';
  /** Smoothed outflow, area/s — drives the stream width. */
  flow = 0;
  /** The lowest mouth corner — where the stream leaves (world). */
  lip = { x: 0, y: 0 };
  readonly r = 16;
  readonly length = 150;
  private t = 0;
  private hold = 0;

  constructor(
    /** Mouth centre while standing in the rack. */
    readonly rest: { x: number; y: number },
    /** Mouth centre while pouring. */
    readonly pourAt: { x: number; y: number },
    volume: number,
    color: number,
    alpha = 0.6,
    /** Maximum tilt, radians. */
    readonly maxAngle = 2.05,
  ) {
    this.volume = volume;
    this.color = color;
    this.alpha = alpha;
    this.mouth = { ...rest };
  }

  /** Inner area of the whole tube. */
  get capacity(): number {
    return polyArea(this.world());
  }

  /** Start the pour choreography (no-op unless resting with liquid in it). */
  pour(): void {
    if (this.phase === 'rest' && this.volume > 1) {
      this.phase = 'out';
      this.t = 0;
    }
  }

  /** Put the tube back in the rack, refilled. */
  reset(volume: number, color: number, alpha = this.alpha): void {
    this.volume = volume;
    this.color = color;
    this.alpha = alpha;
    this.phase = 'rest';
    this.angle = 0;
    this.mouth = { ...this.rest };
    this.flow = 0;
  }

  /** Advance the choreography and the spill. Returns the area poured out this frame. */
  step(dt: number): number {
    const lift = (e: number): number => -70 * Math.sin(Math.PI * e);
    const lerp = (a: number, b: number, e: number): number => a + (b - a) * e;
    if (this.phase === 'out') {
      this.t += dt / 0.9;
      const e = ease(this.t);
      this.mouth = { x: lerp(this.rest.x, this.pourAt.x, e), y: lerp(this.rest.y, this.pourAt.y, e) + lift(e) };
      this.angle = 0.3 * e;
      if (this.t >= 1) { this.phase = 'tilt'; this.t = 0; }
    } else if (this.phase === 'tilt') {
      this.t += dt / 1.2;
      this.angle = lerp(0.3, this.maxAngle, ease(this.t));
      if (this.t >= 1) { this.phase = 'pour'; this.hold = 0; }
    } else if (this.phase === 'pour') {
      this.hold += dt;
      this.angle = this.maxAngle + 0.03 * Math.sin(this.hold * 5);
      if (this.volume < 2 || this.hold > 5) { this.phase = 'back'; this.t = 0; }
    } else if (this.phase === 'back') {
      this.t += dt / 1.4;
      this.angle = lerp(this.maxAngle, 0, ease(this.t * 1.6));
      const e = ease((this.t - 0.35) / 0.65);
      this.mouth = { x: lerp(this.pourAt.x, this.rest.x, e), y: lerp(this.pourAt.y, this.rest.y, e) + lift(e) };
      if (this.t >= 1) { this.phase = 'rest'; this.angle = 0; this.mouth = { ...this.rest }; }
    }

    // Spill: whatever no longer fits below the lip pours out (gently, not all at once).
    const poly = this.world();
    const [a, b] = [this.toWorld(-this.r, 0), this.toWorld(this.r, 0)];
    this.lip = a.y > b.y ? a : b;
    const belowLip = clipArea(poly, this.lip.y);
    let out = 0;
    if (this.volume > belowLip) out = Math.min(this.volume, (this.volume - belowLip) * Math.min(1, 5 * dt) + 40 * dt);
    this.volume -= out;
    const rate = dt > 0 ? out / dt : 0;
    this.flow += (rate - this.flow) * Math.min(1, 12 * dt);
    return out;
  }

  /** Local (u across, v down the axis from the mouth) → world. */
  toWorld(u: number, v: number): { x: number; y: number } {
    const c = Math.cos(this.angle);
    const s = Math.sin(this.angle);
    return { x: this.mouth.x + u * c - v * s, y: this.mouth.y + u * s + v * c };
  }

  /** Inner outline, mouth-left → down → round bottom → up → mouth-right (convex). */
  private local(): Array<{ u: number; v: number }> {
    const { r, length: L } = this;
    const pts = [{ u: -r, v: 0 }, { u: -r, v: L - r }];
    for (let i = 1; i < 12; i++) {
      const ang = Math.PI - (Math.PI * i) / 12;
      pts.push({ u: r * Math.cos(ang), v: L - r + r * Math.sin(ang) });
    }
    pts.push({ u: r, v: L - r }, { u: r, v: 0 });
    return pts;
  }

  private world(): Array<{ x: number; y: number }> {
    return this.local().map((p) => this.toWorld(p.u, p.v));
  }

  /** Draw the liquid, the glass and the rim. */
  draw(board: Board): void {
    const poly = this.world();
    if (this.volume > 1) {
      // Solve the surface height: clipped area decreases as the surface y goes down.
      let lo = Math.min(...poly.map((p) => p.y));
      let hi = Math.max(...poly.map((p) => p.y));
      for (let i = 0; i < 26; i++) {
        const mid = (lo + hi) / 2;
        if (clipArea(poly, mid) > this.volume) lo = mid;
        else hi = mid;
      }
      const liquid = clipBelow(poly, (lo + hi) / 2);
      board.polygon(liquid.flatMap((p) => [p.x, p.y]), this.color, this.alpha);
    }
    board.polygon(poly.flatMap((p) => [p.x, p.y]), P.glass, 0.07);
    board.polyline(poly.flatMap((p) => [p.x, p.y]), P.glass, 3.5, 0.9);
    const s0 = this.toWorld(-this.r + 6, 14);
    const s1 = this.toWorld(-this.r + 6, this.length - 28);
    board.line(s0.x, s0.y, s1.x, s1.y, 0xffffff, 4, 0.22);
    // Lip ring.
    const l0 = this.toWorld(-this.r - 4, 0);
    const l1 = this.toWorld(this.r + 4, 0);
    board.line(l0.x, l0.y, l1.x, l1.y, P.glass, 4, 0.9);
  }
}

/** A wooden test-tube rack around a resting tube at mouth `(x, y)`. */
export function drawRack(board: Board, x: number, y: number): void {
  board.box(x - 50, y + 95, 100, 12, P.woodTop, P.woodEdge, 3);
  board.box(x - 46, y + 107, 8, TABLE_Y - y - 107, P.wood, P.woodEdge, 2);
  board.box(x + 38, y + 107, 8, TABLE_Y - y - 107, P.wood, P.woodEdge, 2);
  board.box(x - 50, TABLE_Y - 14, 100, 14, P.woodTop, P.woodEdge, 3);
}

/** Shoelace area of a polygon. */
function polyArea(p: ReadonlyArray<{ x: number; y: number }>): number {
  let a = 0;
  for (let i = 0; i < p.length; i++) {
    const q = p[i]!;
    const r = p[(i + 1) % p.length]!;
    a += q.x * r.y - r.x * q.y;
  }
  return Math.abs(a) / 2;
}

/** Part of a convex polygon below the horizontal line `y = s` (world y grows down). */
function clipBelow(p: ReadonlyArray<{ x: number; y: number }>, s: number): Array<{ x: number; y: number }> {
  const out: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i]!;
    const b = p[(i + 1) % p.length]!;
    const ain = a.y >= s;
    const bin = b.y >= s;
    if (ain) out.push(a);
    if (ain !== bin) {
      const t = (s - a.y) / (b.y - a.y);
      out.push({ x: a.x + (b.x - a.x) * t, y: s });
    }
  }
  return out;
}

function clipArea(p: ReadonlyArray<{ x: number; y: number }>, s: number): number {
  return polyArea(clipBelow(p, s));
}

/**
 * The falling stream from a pouring tube's lip into a vessel: a ballistic curve
 * (x ∝ √y) whose width follows the flow. Returns the landing point, or `null`
 * when nothing is flowing.
 */
export function drawStream(board: Board, tube: TestTube, into: Vessel): { x: number; y: number } | null {
  if (tube.flow < 8) return null;
  const { left, right } = into.mouth;
  const lx = tube.lip.x;
  const ly = tube.lip.y;
  const tx = Math.min(right - 10, Math.max(left + 10, lx + 16));
  const ty = into.surfaceY;
  const pts: number[] = [];
  for (let i = 0; i <= 14; i++) {
    const k = i / 14;
    pts.push(lx + (tx - lx) * Math.sqrt(k), ly + (ty - ly) * k);
  }
  const width = Math.min(9, Math.max(2, Math.sqrt(tube.flow) * 0.22));
  board.polyline(pts, tube.color, width, Math.min(1, tube.alpha + 0.25));
  board.polyline(pts, 0xffffff, Math.max(1, width * 0.3), 0.25);
  return { x: tx, y: ty };
}

// ─── Dropper ──────────────────────────────────────────────────────────────

/**
 * A glass dropper with a rubber bulb, hanging over a vessel. {@link squeeze}
 * queues a drop; the drop swells at the tip, falls with gravity, and
 * `onHit(x, y)` fires when it reaches the liquid surface.
 */
export class Dropper {
  private queued = 0;
  private forming = 0;
  private press = 0;
  private readonly drops: Array<{ y: number; vy: number }> = [];

  constructor(
    readonly x: number,
    /** World y of the tip. */
    readonly tipY: number,
    public color: number,
  ) {}

  /** Queue one drop. */
  squeeze(): void {
    this.queued++;
  }

  /** Drops still to come (queued + forming + falling). */
  get pending(): number {
    return this.queued + (this.forming > 0 ? 1 : 0) + this.drops.length;
  }

  /** Advance drops; `onHit` gets the impact point. */
  step(dt: number, surfaceY: number, onHit: (x: number, y: number) => void): void {
    if (this.forming === 0 && this.queued > 0) {
      this.queued--;
      this.forming = 0.001;
    }
    if (this.forming > 0) {
      this.forming += dt * 3.2;
      this.press = Math.min(1, this.press + dt * 8);
      if (this.forming >= 1) {
        this.drops.push({ y: this.tipY + 7, vy: 40 });
        this.forming = 0;
      }
    } else {
      this.press = Math.max(0, this.press - dt * 5);
    }
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const d = this.drops[i]!;
      d.vy += 1300 * dt;
      d.y += d.vy * dt;
      if (d.y >= surfaceY) {
        this.drops.splice(i, 1);
        onHit(this.x, surfaceY);
      }
    }
  }

  draw(board: Board): void {
    const { x, tipY } = this;
    const top = tipY - 150;
    // Glass barrel narrowing to the tip, with potion inside.
    board.polygon([x - 11, top + 40, x + 11, top + 40, x + 11, tipY - 40, x + 3, tipY, x - 3, tipY, x - 11, tipY - 40], P.glass, 0.1);
    board.polygon([x - 8, top + 70, x + 8, top + 70, x + 8, tipY - 41, x + 2, tipY - 3, x - 2, tipY - 3, x - 8, tipY - 41], this.color, 0.8);
    board.polyline([x - 11, top + 40, x - 11, tipY - 40, x - 3, tipY, x + 3, tipY, x + 11, tipY - 40, x + 11, top + 40], P.glass, 3, 0.9);
    // Rubber bulb (squashes while a drop forms).
    const sq = 1 - 0.22 * this.press;
    board.ink.ellipse(x, top + 18, 20 * sq, 28 * (2 - sq) * 0.5 + 14).fill(P.rubber);
    board.box(x - 14, top + 34, 28, 10, 0xdb2777, undefined, 3);
    // Forming + falling drops.
    if (this.forming > 0) teardrop(board, x, tipY + 4 + 4 * this.forming, 6 * this.forming, this.color);
    for (const d of this.drops) teardrop(board, x, d.y, 6, this.color);
  }
}

/** A drop shape: a circle with a point on top. */
export function teardrop(board: Board, x: number, y: number, r: number, color: number): void {
  if (r < 0.5) return;
  board.polygon([x - r * 0.85, y - r * 0.4, x, y - r * 2.2, x + r * 0.85, y - r * 0.4], color, 0.95);
  board.circle(x, y, r, color, 0.95);
  board.circle(x - r * 0.35, y - r * 0.3, r * 0.3, 0xffffff, 0.7);
}

// ─── Particles: bubbles, puffs, sparks ────────────────────────────────────

interface Bubble {
  x: number;
  y: number;
  r: number;
  vy: number;
  ph: number;
}

interface Pop {
  x: number;
  y: number;
  life: number;
}

/**
 * Gas bubbles inside a vessel: they swell as they rise, wobble side to side,
 * and **pop** at the surface — a ring plus two flecks of spray.
 */
export class Bubbles {
  readonly items: Bubble[] = [];
  private readonly pops: Pop[] = [];
  private readonly spray: Spark[] = [];

  /** Release `n` bubbles at random points in the liquid (or near `at`). */
  spawn(v: Vessel, n: number, at?: { x: number; y: number }): void {
    if (v.level < 8) return;
    for (let i = 0; i < n; i++) {
      const p = at ? v.clampInside(at.x + (Math.random() - 0.5) * 30, at.y + Math.random() * 30, 6) : v.randomPoint(8);
      this.items.push({ x: p.x, y: p.y, r: 1.5 + Math.random() * 2.5, vy: 20 + Math.random() * 20, ph: Math.random() * 6 });
    }
  }

  /** Rise, wobble, swell, pop. */
  step(dt: number, v: Vessel): void {
    const surface = v.surfaceY;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const b = this.items[i]!;
      b.vy = Math.min(60 + b.r * 22, b.vy + 220 * dt);
      b.y -= b.vy * dt;
      b.ph += dt * 7;
      b.r = Math.min(9, b.r + dt * 2.2);
      const c = v.clampInside(b.x + Math.sin(b.ph) * 0.7, b.y, b.r + 3);
      b.x = c.x;
      if (b.y <= surface + b.r * 0.4) {
        this.items.splice(i, 1);
        this.pops.push({ x: b.x, y: surface, life: 1 });
        for (const dir of [-1, 1]) {
          this.spray.push({ x: b.x, y: surface - 2, vx: dir * (20 + Math.random() * 40), vy: -80 - Math.random() * 90, r: 1.6, life: 0.5, max: 0.5, color: P.bubble });
        }
      }
    }
    for (let i = this.pops.length - 1; i >= 0; i--) {
      this.pops[i]!.life -= dt * 3.5;
      if (this.pops[i]!.life <= 0) this.pops.splice(i, 1);
    }
    stepSparks(this.spray, dt, 500);
  }

  draw(board: Board): void {
    for (const b of this.items) {
      board.circle(b.x, b.y, b.r, P.bubble, 0.18, P.bubble, 1.4, 0.75);
      board.circle(b.x - b.r * 0.35, b.y - b.r * 0.35, Math.max(0.8, b.r * 0.25), 0xffffff, 0.9);
    }
    for (const p of this.pops) {
      const r = 4 + (1 - p.life) * 12;
      board.ink.ellipse(p.x, p.y, r, r * 0.4).stroke({ color: 0xffffff, width: 1.5, alpha: p.life * 0.8 });
    }
    drawSparks(board, this.spray);
  }

  clear(): void {
    this.items.length = 0;
    this.pops.length = 0;
    this.spray.length = 0;
  }
}

/** A soft, fading colour cloud inside the liquid (a drop of something mixing in). */
export interface Puff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  grow: number;
  color: number;
  alpha: number;
  life: number;
  max: number;
}

/** Advance colour clouds, keeping each inside the vessel's liquid. `swirl` adds a stirring current. */
export function stepPuffs(puffs: Puff[], dt: number, v: Vessel, swirl = 0): void {
  for (let i = puffs.length - 1; i >= 0; i--) {
    const p = puffs[i]!;
    p.life -= dt;
    if (p.life <= 0) {
      puffs.splice(i, 1);
      continue;
    }
    if (swirl) {
      const cy = v.opts.y - v.level / 2;
      p.vx += (-(p.y - cy) * swirl) * dt;
      p.vy += ((p.x - v.opts.x) * swirl * 0.5) * dt;
    }
    p.vx *= 1 - 1.2 * dt;
    p.vy *= 1 - 1.2 * dt;
    // The overlay can't clip to the glass, so a cloud may only grow as big as
    // the liquid around it allows, and its centre stays a full radius inside.
    const room = Math.min(28, v.halfWidthAt(v.opts.y - p.y) - 6, v.level / 2 - 4);
    p.r = Math.max(2, Math.min(room, p.r + p.grow * dt));
    const c = v.clampInside(p.x + p.vx * dt, p.y + p.vy * dt, p.r + 2);
    p.x = c.x;
    p.y = c.y;
  }
}

export function drawPuffs(board: Board, puffs: readonly Puff[]): void {
  for (const p of puffs) {
    const a = p.alpha * Math.min(1, p.life / (p.max * 0.5));
    board.circle(p.x, p.y, p.r, p.color, a * 0.6);
    board.circle(p.x, p.y, p.r * 0.55, p.color, a);
  }
}

/** A ballistic speck: spray, splash, spill, sparkle. */
export interface Spark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  life: number;
  max: number;
  color: number;
  /** Draw as a twinkle star instead of a dot. */
  star?: boolean;
}

export function stepSparks(sparks: Spark[], dt: number, gravity: number): void {
  for (let i = sparks.length - 1; i >= 0; i--) {
    const s = sparks[i]!;
    s.life -= dt;
    if (s.life <= 0) {
      sparks.splice(i, 1);
      continue;
    }
    s.vy += gravity * dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
  }
}

export function drawSparks(board: Board, sparks: readonly Spark[]): void {
  for (const s of sparks) {
    const a = Math.min(1, s.life / (s.max * 0.6));
    if (s.star) board.sparkle(s.x, s.y, s.r, s.color, a);
    else board.circle(s.x, s.y, s.r, s.color, a);
  }
}

/** A burst of twinkle stars around (x, y) — the "it worked!" moment. */
export function burst(sparks: Spark[], x: number, y: number, n: number, colors: readonly number[]): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const sp = 80 + Math.random() * 160;
    sparks.push({
      x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 120, r: 4 + Math.random() * 5,
      life: 1.2 + Math.random() * 0.6, max: 1.8, color: colors[i % colors.length]!, star: true,
    });
  }
}

/** Splash flecks where a stream or drop lands. */
export function splash(sparks: Spark[], x: number, y: number, n: number, color: number): void {
  for (let i = 0; i < n; i++) {
    sparks.push({ x, y: y - 2, vx: (Math.random() - 0.5) * 120, vy: -60 - Math.random() * 120, r: 1.5 + Math.random() * 1.5, life: 0.45, max: 0.45, color });
  }
}

// ─── Lesson card ──────────────────────────────────────────────────────────

/** One row of the lesson card: plain text, a label/value pair with an optional swatch, or a gap. */
export type CardLine =
  | { readonly kind: 'para'; readonly text: string; readonly color?: number; readonly size?: number; readonly weight?: number }
  | { readonly kind: 'row'; readonly label: string; readonly value: string; readonly color?: number }
  | { readonly kind: 'gap'; readonly size?: number };

/** What the lesson card shows. */
export interface CardContent {
  readonly title: string;
  readonly tag?: string;
  readonly lines: readonly CardLine[];
}

/** Draw the spell-book card to the right of the bench. */
export function drawCard(board: Board, card: CardContent): void {
  board.box(CARD.x, CARD.y, CARD.width, CARD.height, P.card, P.cardEdge, 16);
  const left = CARD.x + 22;
  const inner = CARD.width - 44;
  let y = CARD.y + 20;
  if (card.tag) y += board.text('card-tag', left, y, card.tag.toUpperCase(), { align: 'left', size: 12, weight: 700, color: P.gold }) + 4;
  y += board.text('card-title', left, y, card.title, { align: 'left', size: 26, weight: 800, maxWidth: inner }) + 14;
  card.lines.forEach((line, i) => {
    const id = `card-l${i}`;
    if (line.kind === 'gap') {
      y += line.size ?? 12;
    } else if (line.kind === 'para') {
      y += board.text(id, left, y, line.text, { align: 'left', size: line.size ?? 15, weight: line.weight ?? 400, color: line.color ?? P.ink, maxWidth: inner }) + 8;
    } else {
      let x = left;
      if (line.color !== undefined) {
        board.box(left, y + 4, 12, 12, line.color, undefined, 3);
        x += 20;
      }
      const h = board.text(id, x, y, line.label, { align: 'left', size: 15, color: P.dim, maxWidth: 190 });
      board.text(`${id}-v`, left + 214, y, line.value, { align: 'left', size: 15, weight: 700, maxWidth: inner - 214 });
      y += Math.max(h, 20) + 6;
    }
  });
}

/** A horizontal meter bar on the bench front (0..1), with a caption above. */
export function drawMeter(board: Board, id: string, x: number, y: number, w: number, value: number, color: number, caption: string): void {
  board.text(`${id}-cap`, x, y - 22, caption, { align: 'left', size: 13, weight: 700, color: P.dim });
  board.box(x, y, w, 14, 0x120b24, P.cardEdge, 7);
  if (value > 0.01) board.box(x + 2, y + 2, Math.max(10, (w - 4) * Math.min(1, value)), 10, color, undefined, 5);
}
