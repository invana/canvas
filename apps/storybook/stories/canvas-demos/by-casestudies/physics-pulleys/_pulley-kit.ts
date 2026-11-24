/**
 * Shared kit for the `physics-pulleys` lesson stories.
 *
 * **Who it is for:** a teacher explaining pulleys and torque to kids. Each story
 * is one lesson step; `GuidedLesson` walks through all of them.
 *
 * **How it draws.** Everything that moves (ropes, wheels, crates, force arrows,
 * torque arcs) is redrawn every animation frame through one world-space
 * `surface.overlay(...)`. The simulation state lives in the story, never in the
 * store — the canvas has no clock by design
 * (`docs/rfcs/feat/2026-11-17-the-canvas-has-no-time.md`, rejected: view time is
 * the app's concern). The overlay has no text, so words are `'label'`
 * decorations on invisible 1×1 anchor rects, moved with `moveShape` and
 * re-styled only when their text changes ({@link Board.text}).
 *
 * **Colour is pinned, on purpose.** The scene is a chalkboard, and each force
 * colour carries meaning (red = gravity, blue = rope tension, green = your pull,
 * amber = support / floor, violet = torque), so it mounts no `ThemeBehaviour` —
 * the same exception as `graph/Groups/HackerStyle`.
 *
 * **Physics model.** Ropes are massless and don't stretch; pulleys are
 * frictionless. In the rope scenes the pulleys are also massless. In the torque
 * scene the wheel is a solid disc (`I = ½ M R²`), so its mass resists spinning.
 * Arrow length is proportional to force ({@link N_TO_PX}) so kids can compare
 * arrows by eye.
 */
import { BackgroundLayer, Canvas, WorldLayer, type IElementRenderer, type IOverlayDevice } from '@invana/canvas';
import { onStoryTeardown } from '../../../div-util';

// ─── Units, layout, palette ───────────────────────────────────────────────

/** Gravity, m/s². */
export const G = 9.8;
/** World pixels per metre of rope / height. */
export const PX_PER_M = 120;
/** World pixels per newton — every force arrow uses this one scale. */
export const N_TO_PX = 1.1;

/**
 * The fixed world rectangle the camera frames: machine on the left, lesson
 * card in the middle, and an empty strip on the right where lil-gui floats.
 */
const WORLD = { x: 0, y: 0, width: 1480, height: 760 } as const;
/** Lesson card bounds (world). */
const CARD = { x: 790, y: 40, width: 380, height: 680 } as const;
const CEIL_Y = 70;
const GROUND_Y = 690;

/** Chalkboard palette. Force colours are meaning, not decoration. */
export const C = {
  bg: '#132019',
  grid: '#20362a',
  chalk: 0xf1f5ef,
  dim: 0x9fb3a6,
  card: 0x1a2c23,
  rope: 0xe2c08d,
  wheel: 0x334155,
  rim: 0xcbd5e1,
  crate: 0xa16207,
  crateEdge: 0x713f12,
  steel: 0x94a3b8,
  weight: 0xf87171,
  tension: 0x60a5fa,
  pull: 0x4ade80,
  support: 0xfbbf24,
  torque: 0xc084fc,
} as const;

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
  /** Draw a dark pill behind the text so it reads over ropes and arrows. */
  readonly pill?: boolean;
}

/**
 * One frame's drawing surface. Call {@link begin}, draw, then {@link end}:
 * `end` hides every text id that wasn't written this frame, so a scene can
 * draw text conditionally without tracking what it showed last time.
 */
export class Board {
  private readonly texts = new Map<string, { key: string; x: number; y: number; visible: boolean }>();
  private readonly used = new Set<string>();
  private readonly heights = new Map<string, number>();

  constructor(
    private readonly ink: IOverlayDevice,
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
  line(x1: number, y1: number, x2: number, y2: number, color: number, width = 3, dash?: readonly [number, number]): void {
    this.ink.moveTo(x1, y1).lineTo(x2, y2).stroke(dash ? { color, width, dashArray: dash } : { color, width });
  }

  /** Filled + outlined circle. */
  disc(cx: number, cy: number, r: number, fill: number, stroke?: number, width = 2): void {
    this.ink.ellipse(cx, cy, r, r).fill(fill);
    if (stroke !== undefined) this.ink.ellipse(cx, cy, r, r).stroke({ color: stroke, width });
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

  /** Open polyline stroke through flat `[x0, y0, x1, y1, …]` points. */
  polyline(points: readonly number[], color: number, width = 3, dash?: readonly [number, number]): void {
    this.ink.poly(points, false).stroke(dash ? { color, width, dashArray: dash } : { color, width });
  }

  /**
   * A force arrow from (x, y) along (dx, dy) — length is the force already
   * scaled by the caller (usually `newtons * N_TO_PX`). Below 2 px it is skipped.
   */
  arrow(x: number, y: number, dx: number, dy: number, color: number, width = 5): void {
    const len = Math.hypot(dx, dy);
    if (len < 2) return;
    const ux = dx / len;
    const uy = dy / len;
    const head = Math.min(len, 10 + width * 2.4);
    const half = head * 0.55;
    const bx = x + dx - ux * head;
    const by = y + dy - uy * head;
    if (len > head) this.line(x, y, bx, by, color, width);
    this.ink
      .poly([x + dx, y + dy, bx - uy * half, by + ux * half, bx + uy * half, by - ux * half], true)
      .fill(color);
  }

  /**
   * A curved arrow on a circle of radius `r` around (cx, cy), sweeping from
   * angle `from` to `to` (radians, screen coords: positive = clockwise).
   */
  arcArrow(cx: number, cy: number, r: number, from: number, to: number, color: number, width = 5): void {
    const sweep = to - from;
    if (Math.abs(sweep) < 0.05) return;
    const dir = Math.sign(sweep);
    const head = 12 + width * 2;
    const headAngle = head / r;
    const shaftEnd = Math.abs(sweep) > headAngle ? to - dir * headAngle : from;
    const pts: number[] = [];
    const steps = Math.max(8, Math.ceil(Math.abs(shaftEnd - from) * 24));
    for (let i = 0; i <= steps; i++) {
      const a = from + ((shaftEnd - from) * i) / steps;
      pts.push(cx + r * Math.cos(a), cy + r * Math.sin(a));
    }
    if (pts.length >= 4) this.polyline(pts, color, width);
    const tipX = cx + r * Math.cos(to);
    const tipY = cy + r * Math.sin(to);
    const baseX = cx + r * Math.cos(shaftEnd);
    const baseY = cy + r * Math.sin(shaftEnd);
    // Radial direction at the base widens the head across the arc.
    const rx = Math.cos(shaftEnd);
    const ry = Math.sin(shaftEnd);
    const half = head * 0.55;
    this.ink
      .poly([tipX, tipY, baseX + rx * half, baseY + ry * half, baseX - rx * half, baseY - ry * half], true)
      .fill(color);
  }

  /** A pulley wheel: grooved rim, four spokes turned by `angle`, and the axle. */
  wheel(cx: number, cy: number, r: number, angle: number): void {
    this.disc(cx, cy, r, C.wheel, C.rim, 3);
    this.ink.ellipse(cx, cy, r - 7, r - 7).stroke({ color: C.steel, width: 1.5, alpha: 0.6 });
    for (let i = 0; i < 4; i++) {
      const a = angle + (i * Math.PI) / 2;
      this.line(cx, cy, cx + (r - 8) * Math.cos(a), cy + (r - 8) * Math.sin(a), C.steel, 3);
    }
    // One painted spoke so kids can see the wheel turn.
    this.line(cx, cy, cx + (r - 8) * Math.cos(angle), cy + (r - 8) * Math.sin(angle), C.support, 4);
    this.disc(cx, cy, 6, C.rim, C.wheel, 2);
  }

  /** A wooden crate whose top-left is (x, y), labelled with its mass. */
  crate(id: string, x: number, y: number, w: number, h: number, kg: number): void {
    this.box(x, y, w, h, C.crate, C.crateEdge, 4);
    this.line(x + 6, y + 6, x + w - 6, y + h - 6, C.crateEdge, 2);
    this.line(x + w - 6, y + 6, x + 6, y + h - 6, C.crateEdge, 2);
    this.text(id, x + w / 2, y + h / 2, `${fmt(kg, 0)} kg`, { size: 18, weight: 700, pill: true });
  }

  /** The ceiling beam with hatching above it. */
  ceiling(x1: number, x2: number): void {
    this.line(x1, CEIL_Y, x2, CEIL_Y, C.rim, 5);
    for (let x = x1; x < x2; x += 18) this.line(x, CEIL_Y, x + 12, CEIL_Y - 14, C.dim, 2);
  }

  /** The floor with hatching below it. */
  ground(x1: number, x2: number): void {
    this.line(x1, GROUND_Y, x2, GROUND_Y, C.rim, 5);
    for (let x = x1; x < x2; x += 18) this.line(x, GROUND_Y + 14, x + 12, GROUND_Y, C.dim, 2);
  }

  /**
   * Draw text by stable `id`. Re-styles the label only when its text or style
   * changed; otherwise just moves it. Returns the text block's height (world
   * px) so callers can stack paragraphs.
   */
  text(id: string, x: number, y: number, str: string, style: TextStyle = {}): number {
    const { size = 16, color = C.chalk, weight = 400, align = 'center', maxWidth, pill = false } = style;
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
          ...(pill ? { background: { fill: 0x0b1410, fillAlpha: 0.78, radius: 6, padding: [2, 6] as [number, number] } } : {}),
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

/** Format a number with fixed decimals, dropping a trailing `.0`. */
export function fmt(v: number, digits = 1): string {
  const s = v.toFixed(digits);
  return digits > 0 && /\.0+$/.test(s) ? s.replace(/\.0+$/, '') : s;
}

// ─── Lesson card ──────────────────────────────────────────────────────────

/** One row of the lesson card: plain text, or a label/value pair with an optional colour swatch. */
export type CardLine =
  | { readonly kind: 'para'; readonly text: string; readonly color?: number; readonly size?: number; readonly weight?: number }
  | { readonly kind: 'row'; readonly label: string; readonly value: string; readonly color?: number }
  | { readonly kind: 'gap'; readonly size?: number };

/** What the lesson card shows: a title, a step tag, and its lines. */
export interface CardContent {
  readonly title: string;
  readonly tag?: string;
  readonly lines: readonly CardLine[];
}

/**
 * Draw the lesson card on the right of the board. Rows with a `color` get a
 * swatch matching their force arrow, so the card doubles as the colour key.
 */
export function drawCard(board: Board, card: CardContent): void {
  board.box(CARD.x, CARD.y, CARD.width, CARD.height, C.card, 0x2f4a3b, 14);
  const left = CARD.x + 22;
  const inner = CARD.width - 44;
  let y = CARD.y + 20;
  if (card.tag) y += board.text('card-tag', left, y, card.tag.toUpperCase(), { align: 'left', size: 12, weight: 700, color: C.support }) + 4;
  y += board.text('card-title', left, y, card.title, { align: 'left', size: 26, weight: 800, maxWidth: inner }) + 14;
  card.lines.forEach((line, i) => {
    const id = `card-l${i}`;
    if (line.kind === 'gap') {
      y += line.size ?? 12;
    } else if (line.kind === 'para') {
      y += board.text(id, left, y, line.text, {
        align: 'left',
        size: line.size ?? 16,
        weight: line.weight ?? 400,
        color: line.color ?? C.chalk,
        maxWidth: inner,
      }) + 8;
    } else {
      let x = left;
      if (line.color !== undefined) {
        board.box(left, y + 4, 12, 12, line.color, undefined, 3);
        x += 20;
      }
      const h = board.text(id, x, y, line.label, { align: 'left', size: 15, color: C.dim, maxWidth: 190 });
      board.text(`${id}-v`, left + 214, y, line.value, { align: 'left', size: 15, weight: 700, maxWidth: inner - 214 });
      y += Math.max(h, 20) + 6;
    }
  });
}

// ─── Mounting ─────────────────────────────────────────────────────────────

/**
 * Two of these are stacked: an **ink** layer (its overlay draws the machine)
 * under a **text** layer (its primitives carry the labels). One layer can't do
 * both — a surface paints its overlay above its own primitives, which would
 * bury every label under the ink. The ink layer also runs the lesson's frame callbacks from the engine's own clock:
 * `Canvas.tickOnce` calls a layer's duck-typed `tickAnimations(dt)` every frame
 * (the same hook animated decorations use), so the story needs no
 * `requestAnimationFrame` loop of its own.
 */
class ChalkboardLayer extends WorldLayer {
  ink!: IOverlayDevice;
  prims!: IElementRenderer;
  /** Called once per engine frame with dt in seconds. */
  onFrame?: (dt: number) => void;
  protected createState() {
    return {};
  }
  protected onMount() {
    this.prims = this.surface.primitives;
    this.ink = this.surface.overlay('chalk');
  }
  /** Engine frame hook (see class doc). `deltaMs` is capped at 50 ms so a stalled tab doesn't teleport the crate. */
  tickAnimations(deltaMs: number): void {
    this.onFrame?.(Math.min(0.05, deltaMs / 1000));
  }
  hitTest() {
    return null;
  }
}

/** A mounted lesson: the board to draw on and a hook to run code every frame. */
export interface Lesson {
  readonly canvas: Canvas;
  readonly board: Board;
  /** Run `fn(dt)` every engine frame (dt in seconds, capped at 50 ms). */
  onFrame(fn: (dt: number) => void): void;
}

/**
 * Mount a chalkboard canvas into `container`: pinned background, one drawing
 * layer, and a fixed camera framing {@link WORLD} (refit on resize; no pan/zoom
 * so the lesson can't get lost). Frames run on the engine's ticker.
 */
export async function mountLesson(container: HTMLDivElement): Promise<Lesson> {
  const canvas = new Canvas();
  onStoryTeardown(() => canvas.destroy());
  await canvas.init({ container, autoResize: true });
  canvas.layers.add(
    new BackgroundLayer({
      id: 'bg',
      options: { type: 'pattern', patternType: 'grid', backgroundColor: C.bg, color: C.grid, spacing: 40 },
    }),
  );
  const layer = new ChalkboardLayer({ id: 'chalkboard', options: {}, zIndex: 1 });
  const words = new ChalkboardLayer({ id: 'chalkboard-text', options: {}, zIndex: 2 });
  canvas.layers.add(layer);
  canvas.layers.add(words);

  const fit = (): void => canvas.camera.fitContent({ ...WORLD }, 12);
  fit();
  // Refit after the canvas has resized to the container (autoResize runs first).
  const observer = new ResizeObserver(() => setTimeout(fit, 0));
  observer.observe(container);
  onStoryTeardown(() => observer.disconnect());

  const board = new Board(layer.ink, words.prims);
  const frames: Array<(dt: number) => void> = [];
  layer.onFrame = (dt) => {
    board.begin();
    for (const fn of frames) fn(dt);
    board.end();
  };

  return { canvas, board, onFrame: (fn) => frames.push(fn) };
}

// ─── Scene 1–3: rope-and-pulley systems ───────────────────────────────────

/** Which arrows a rope scene draws. */
export interface RopeShow {
  weight: boolean;
  tension: boolean;
  pull: boolean;
  /** Floor push when the crate rests on the ground. */
  floor: boolean;
  /** The ceiling holding up each top pulley. */
  support: boolean;
  /** Number each rope strand that holds the crate. */
  countStrands: boolean;
}

/** Live settings of a rope scene — the lil-gui panel binds straight to these. */
export interface RopeParams {
  /** Rope strands holding the crate (1 = fixed pulley, 2 = movable pulley, 3–4 = block & tackle). */
  strands: number;
  /** Crate mass, kg. */
  mass: number;
  /** `true`: you pull exactly hard enough and the crate rises at a steady speed. `false`: you set the pull. */
  autoPull: boolean;
  /** Your pull in newtons when `autoPull` is off. */
  pull: number;
  /** Animation running. */
  playing: boolean;
  show: RopeShow;
}

/** Defaults for {@link RopeParams}. */
export function ropeDefaults(strands: number): RopeParams {
  return {
    strands,
    mass: 10,
    autoPull: true,
    pull: 40,
    playing: true,
    show: { weight: true, tension: true, pull: true, floor: true, support: false, countStrands: strands > 1 },
  };
}

const PULLEY_R = 40;
const STRAND_GAP = PULLEY_R * 2;
const TOP_Y = 150;
const CRATE_W = 110;
const CRATE_H = 80;
const MACHINE_CX = 380;
const HAND_Y0 = 250;
/** Max distance the hand travels, px — the crate's rise is this ÷ strands. */
const HAND_TRAVEL = 380;
/** Steady lifting speed in auto mode, m/s. */
const LIFT_SPEED = 0.3;

/**
 * A rope with `n` strands holding the crate. The same machine covers the fixed
 * pulley (n = 1), the movable pulley (n = 2) and a block & tackle (n ≥ 3): rope
 * strands sit side by side, and the pulley between strand k and k+1 is a fixed
 * (top) pulley when `n-1-k` is even, a movable (bottom) one otherwise, so the
 * last strand always comes down off a top pulley into your hand.
 *
 * Physics: with massless, frictionless pulleys every strand carries the same
 * tension `T = F`, so the crate feels `n·F` upward against `W = m·g`; and since
 * the rope can't stretch, the hand moves `n` times as far as the crate.
 */
export class RopeScene {
  /** Crate height above the floor, m. */
  h = 0;
  /** Crate velocity, m/s (up = +). */
  v = 0;
  private dir = 1;
  private hold = 0;

  constructor(readonly p: RopeParams) {}

  /** Highest the crate goes before the loop turns around, m. */
  get maxRise(): number {
    return Math.min(2.4, HAND_TRAVEL / (this.p.strands * PX_PER_M));
  }
  /** Crate weight W = m·g, N. */
  get weight(): number {
    return this.p.mass * G;
  }
  /** Pull that exactly balances the crate: W ÷ n. */
  get needed(): number {
    return this.weight / this.p.strands;
  }
  /** The pull actually applied this frame, N. */
  get force(): number {
    return this.p.autoPull ? this.needed : this.p.pull;
  }
  /** Floor push on the crate (0 once it's off the floor), N. */
  get floorPush(): number {
    return this.h <= 0 ? Math.max(0, this.weight - this.p.strands * this.force) : 0;
  }

  /** Put the crate back on the floor. */
  reset(): void {
    this.h = 0;
    this.v = 0;
    this.dir = 1;
    this.hold = 0;
  }

  /** Advance the simulation by `dt` seconds. */
  step(dt: number): void {
    if (!this.p.playing) return;
    const max = this.maxRise;
    if (this.p.autoPull) {
      // Balanced forces → no acceleration; the crate drifts at a steady speed.
      if (this.hold > 0) {
        this.hold -= dt;
        this.v = 0;
        return;
      }
      this.v = LIFT_SPEED * this.dir;
      this.h += this.v * dt;
      if (this.h >= max || this.h <= 0) {
        this.h = Math.min(max, Math.max(0, this.h));
        this.dir = -this.dir;
        this.hold = 1.2;
      }
      return;
    }
    // Newton's second law on the crate: m·a = n·F − W (+ floor push when resting).
    const a = (this.p.strands * this.p.pull - this.weight) / this.p.mass;
    if (this.h <= 0 && a <= 0) {
      this.h = 0;
      this.v = 0;
      return;
    }
    this.v += a * dt;
    this.h += this.v * dt;
    if (this.h <= 0) {
      this.h = 0;
      this.v = 0;
    } else if (this.h >= max) {
      this.h = max;
      this.v = 0;
    }
  }

  /** Draw the machine and its force arrows. */
  draw(b: Board): void {
    const { strands: n, show } = this.p;
    const hPx = this.h * PX_PER_M;
    const x0 = MACHINE_CX - (n * STRAND_GAP) / 2;
    const sx = (k: number) => x0 + k * STRAND_GAP;
    const isTop = (j: number) => (n - 1 - j) % 2 === 0;

    const crateTop = GROUND_Y - CRATE_H - hPx;
    const crateCx = n === 1 ? sx(0) : x0 + ((n - 1) * STRAND_GAP) / 2;
    const plateY = crateTop - 34; // lower block plate (n ≥ 2)
    const bottomY = plateY - 16 - PULLEY_R; // bottom pulley centres
    const handY = HAND_Y0 + n * hPx;
    const T = this.force;

    b.ceiling(60, 740);
    b.ground(60, 740);

    // Where each strand ends at the bottom.
    const strandBottom = (k: number): number => {
      if (n === 1) return crateTop - 10;
      const left = k > 0 ? !isTop(k - 1) : false;
      const right = k < n ? !isTop(k) : false;
      return left || right ? bottomY : plateY;
    };
    const strandTop = (k: number): number => {
      const left = k > 0 ? isTop(k - 1) : false;
      const right = k < n ? isTop(k) : false;
      return left || right ? TOP_Y : CEIL_Y;
    };

    // Hangers: ceiling → top pulleys; bottom pulleys → plate → crate.
    for (let j = 0; j < n; j++) {
      const cx = sx(j) + PULLEY_R;
      if (isTop(j)) b.line(cx, CEIL_Y, cx, TOP_Y, C.steel, 6);
      else b.line(cx, bottomY, cx, plateY, C.steel, 6);
    }
    if (n === 1) {
      b.line(crateCx, crateTop - 10, crateCx, crateTop, C.steel, 4);
    } else {
      b.box(x0 - 14, plateY, (n - 1) * STRAND_GAP + 28, 10, C.steel, C.rim, 3);
      b.line(crateCx, plateY + 10, crateCx, crateTop, C.steel, 5);
    }

    // Rope: supporting strands, the wraps, and the pull strand.
    for (let k = 0; k < n; k++) b.line(sx(k), strandTop(k), sx(k), strandBottom(k), C.rope, 4);
    b.line(sx(n), TOP_Y, sx(n), handY, C.rope, 4);

    // Pulleys turn as rope runs through them (rope passed = (j+1)·h for a top pulley).
    for (let j = 0; j < n; j++) {
      const cx = sx(j) + PULLEY_R;
      const cy = isTop(j) ? TOP_Y : bottomY;
      const run = isTop(j) ? (j + 1) * hPx : (j + 0.5) * hPx;
      b.wheel(cx, cy, PULLEY_R, (isTop(j) ? 1 : -1) * (run / PULLEY_R));
      const arc: number[] = [];
      for (let i = 0; i <= 16; i++) {
        const a = Math.PI + (Math.PI * i) / 16;
        arc.push(cx + PULLEY_R * Math.cos(a), cy + (isTop(j) ? 1 : -1) * PULLEY_R * Math.sin(a));
      }
      b.polyline(arc, C.rope, 4);
    }

    // The crate and the hand.
    b.crate('crate', crateCx - CRATE_W / 2, crateTop, CRATE_W, CRATE_H, this.p.mass);
    b.box(sx(n) - 22, handY, 44, 18, C.pull, 0x166534, 9);
    b.text('hand', sx(n) + 70, handY + 9, 'you pull', { size: 14, color: C.pull, weight: 700 });

    // ── Forces ──
    if (show.weight) {
      const len = this.weight * N_TO_PX;
      b.arrow(crateCx + CRATE_W / 2 + 18, crateTop + CRATE_H / 2, 0, len, C.weight);
      b.text('f-w', crateCx + CRATE_W / 2 + 72, crateTop + CRATE_H / 2 + len / 2, `W = ${fmt(this.weight)} N`, { size: 14, color: C.weight, weight: 700, pill: true });
    }
    if (show.tension) {
      for (let k = 0; k < n; k++) {
        const y = strandBottom(k);
        b.arrow(sx(k) - 12, y, 0, -T * N_TO_PX, C.tension, 4);
      }
      b.text('f-t', sx(0) - 82, strandBottom(0) - (T * N_TO_PX) / 2, `T = ${fmt(T)} N`, { size: 14, color: C.tension, weight: 700, pill: true });
    }
    if (show.countStrands) {
      for (let k = 0; k < n; k++) {
        const y = (strandTop(k) + strandBottom(k)) / 2 + 20;
        b.disc(sx(k), y, 13, C.support);
        b.text(`n-${k}`, sx(k), y, String(k + 1), { size: 15, weight: 800, color: 0x1c1917 });
      }
    }
    if (show.pull) {
      b.arrow(sx(n), handY + 18, 0, T * N_TO_PX, C.pull);
      b.text('f-f', sx(n) + 62, handY + 26 + (T * N_TO_PX) / 2, `F = ${fmt(T)} N`, { size: 14, color: C.pull, weight: 700, pill: true });
    }
    if (show.floor && this.floorPush > 0.05) {
      const len = this.floorPush * N_TO_PX;
      b.arrow(crateCx - CRATE_W / 2 - 18, GROUND_Y, 0, -len, C.support);
      b.text('f-n', crateCx - CRATE_W / 2 - 66, GROUND_Y - len / 2, `floor ${fmt(this.floorPush)} N`, { size: 14, color: C.support, weight: 700, pill: true });
    }
    if (show.support) {
      for (let j = 0; j < n; j++) {
        if (!isTop(j)) continue;
        const cx = sx(j) + PULLEY_R;
        b.arrow(cx + 14, TOP_Y - 4, 0, -Math.min(2 * T * N_TO_PX, 70), C.support, 4);
      }
      b.text('f-s', sx(n) + 70, TOP_Y - 40, `ceiling holds 2T = ${fmt(2 * T)} N per pulley`, { size: 12, color: C.support, pill: true });
    }
  }

  /** Live numbers for the lesson card. */
  readouts(): CardLine[] {
    const n = this.p.strands;
    const F = this.force;
    const lift = this.h;
    const pulled = n * lift;
    const up = n * F;
    let status: string;
    if (this.p.autoPull) status = this.v === 0 ? 'Balanced — holding still.' : this.v > 0 ? 'Balanced — rising at a steady speed.' : 'Balanced — lowering at a steady speed.';
    else if (up < this.weight - 0.01 && this.h <= 0) status = `Too weak! You need ${fmt(this.needed)} N. The floor holds up the rest.`;
    else if (up > this.weight + 0.01) status = 'Up-forces beat W — the crate speeds up!';
    else if (up < this.weight - 0.01) status = 'W beats the up-forces — the crate speeds downward!';
    else status = 'Balanced — it keeps whatever speed it has.';
    return [
      { kind: 'row', label: 'Weight  W = m × g', value: `${fmt(this.weight)} N`, color: C.weight },
      { kind: 'row', label: 'Ropes holding it', value: String(n), color: C.support },
      { kind: 'row', label: 'Your pull  F', value: `${fmt(F)} N`, color: C.pull },
      { kind: 'row', label: 'Up-force  n × T', value: `${fmt(up)} N`, color: C.tension },
      { kind: 'gap', size: 6 },
      { kind: 'row', label: 'Rope you pulled', value: `${fmt(pulled, 2)} m` },
      { kind: 'row', label: 'Crate went up', value: `${fmt(lift, 2)} m` },
      { kind: 'row', label: 'Work in  F × pulled', value: `${fmt(F * pulled, 0)} J` },
      { kind: 'row', label: 'Work out  W × up', value: `${fmt(this.weight * lift, 0)} J` },
      { kind: 'gap', size: 6 },
      { kind: 'para', text: status, color: C.support, weight: 700 },
    ];
  }
}

// ─── Scene 4: torque on the wheel ─────────────────────────────────────────

/** Live settings of the torque scene. */
export interface TorqueParams {
  /** Left crate mass, kg. */
  leftMass: number;
  /** Right crate mass, kg. */
  rightMass: number;
  /** Wheel mass, kg — a heavier wheel is harder to spin. */
  wheelMass: number;
  /** Wheel radius, m. */
  radius: number;
  playing: boolean;
  show: { forces: boolean; leverArms: boolean; torques: boolean };
}

/** Defaults for {@link TorqueParams}. */
export function torqueDefaults(): TorqueParams {
  return {
    leftMass: 5,
    rightMass: 7,
    wheelMass: 4,
    radius: 0.9,
    playing: true,
    show: { forces: true, leverArms: true, torques: true },
  };
}

const WHEEL_CX = 390;
const WHEEL_CY = 230;
const HANG_Y0 = 480;
const SMALL_CRATE = 72;
/** Torque arrow sweep, radians per N·m (clamped). */
const TORQUE_TO_RAD = 0.012;
/** Smallest drawn twist, radians — so a small net torque is still visible (its number is on the label). */
const MIN_TWIST = 0.3;

/**
 * Two crates on one rope over a heavy wheel (an Atwood machine). Each rope
 * side pulls down on the rim, and a pull at distance `r` from the axle makes a
 * twist — **torque** `τ = T × r`. The two torques fight; the bigger one wins
 * and the wheel speeds up its spin (`τ_net = I·α`).
 *
 * Solving the three bodies together: `a = (m₂ − m₁)·g / (m₁ + m₂ + M/2)`,
 * `T₁ = m₁(g + a)`, `T₂ = m₂(g − a)`, `α = a / r`.
 */
export class TorqueScene {
  /** Rope displacement (right side down = +), m. */
  s = 0;
  /** Rope speed, m/s. */
  v = 0;
  private hold = 0;

  constructor(readonly p: TorqueParams) {}

  /** Crate acceleration (right crate down = +), m/s². */
  get accel(): number {
    const { leftMass: m1, rightMass: m2, wheelMass: M } = this.p;
    return ((m2 - m1) * G) / (m1 + m2 + M / 2);
  }
  /** Left rope tension, N. */
  get t1(): number {
    return this.p.leftMass * (G + this.accel);
  }
  /** Right rope tension, N. */
  get t2(): number {
    return this.p.rightMass * (G - this.accel);
  }

  /** Bring both crates back level. */
  reset(): void {
    this.s = 0;
    this.v = 0;
    this.hold = 0;
  }

  /** Advance by `dt` seconds; resets after a crate reaches the floor or the wheel. */
  step(dt: number): void {
    if (!this.p.playing) return;
    if (this.hold > 0) {
      this.hold -= dt;
      if (this.hold <= 0) this.reset();
      return;
    }
    this.v += this.accel * dt;
    this.s += this.v * dt;
    // Stop when a crate lands on the floor or reaches the wheel — the side that
    // goes down meets the floor, the side that goes up meets the rim.
    const R = this.p.radius * PX_PER_M;
    const toFloor = GROUND_Y - SMALL_CRATE - HANG_Y0;
    const toWheel = HANG_Y0 - (WHEEL_CY + R + 12);
    const limit = Math.min(toFloor, toWheel) / PX_PER_M;
    if (Math.abs(this.s) >= limit) {
      this.s = Math.sign(this.s) * limit;
      this.v = 0;
      this.hold = 1.4;
    }
  }

  /** Draw the wheel, crates, and force / torque arrows. */
  draw(b: Board): void {
    const { show } = this.p;
    const R = this.p.radius * PX_PER_M;
    const sPx = this.s * PX_PER_M;
    const lx = WHEEL_CX - R;
    const rx = WHEEL_CX + R;
    const ly = HANG_Y0 - sPx;
    const ry = HANG_Y0 + sPx;

    b.ceiling(60, 740);
    b.ground(60, 740);
    b.line(WHEEL_CX, CEIL_Y, WHEEL_CX, WHEEL_CY, C.steel, 8);

    // Rope over the top of the wheel, down to both crates.
    b.line(lx, WHEEL_CY, lx, ly, C.rope, 4);
    b.line(rx, WHEEL_CY, rx, ry, C.rope, 4);
    b.wheel(WHEEL_CX, WHEEL_CY, R, sPx / R);
    const arc: number[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = Math.PI + (Math.PI * i) / 24;
      arc.push(WHEEL_CX + R * Math.cos(a), WHEEL_CY + R * Math.sin(a));
    }
    b.polyline(arc, C.rope, 4);

    b.crate('crate-l', lx - SMALL_CRATE / 2, ly, SMALL_CRATE, SMALL_CRATE, this.p.leftMass);
    b.crate('crate-r', rx - SMALL_CRATE / 2, ry, SMALL_CRATE, SMALL_CRATE, this.p.rightMass);

    const t1 = this.t1;
    const t2 = this.t2;
    if (show.forces) {
      // On the wheel: each rope side pulls the rim down.
      b.arrow(lx - 14, WHEEL_CY, 0, t1 * N_TO_PX, C.tension, 4);
      b.arrow(rx + 14, WHEEL_CY, 0, t2 * N_TO_PX, C.tension, 4);
      b.text('t1', lx - 64, WHEEL_CY + 26, `T₁ = ${fmt(t1)} N`, { size: 14, color: C.tension, weight: 700, pill: true });
      b.text('t2', rx + 64, WHEEL_CY + 26, `T₂ = ${fmt(t2)} N`, { size: 14, color: C.tension, weight: 700, pill: true });
      // On the crates: rope up, gravity down.
      const w1 = this.p.leftMass * G;
      const w2 = this.p.rightMass * G;
      b.arrow(lx + SMALL_CRATE / 2 + 12, ly + SMALL_CRATE / 2, 0, w1 * N_TO_PX, C.weight, 4);
      b.arrow(rx + SMALL_CRATE / 2 + 12, ry + SMALL_CRATE / 2, 0, w2 * N_TO_PX, C.weight, 4);
      b.arrow(lx - SMALL_CRATE / 2 - 12, ly + SMALL_CRATE / 2, 0, -t1 * N_TO_PX, C.tension, 4);
      b.arrow(rx - SMALL_CRATE / 2 - 12, ry + SMALL_CRATE / 2, 0, -t2 * N_TO_PX, C.tension, 4);
      b.text('w1', lx - SMALL_CRATE / 2 - 72, ly + SMALL_CRATE + 18, `W₁ = ${fmt(w1)} N`, { size: 13, color: C.weight, weight: 700, pill: true });
      b.text('w2', rx + SMALL_CRATE / 2 + 72, ry + SMALL_CRATE + 18, `W₂ = ${fmt(w2)} N`, { size: 13, color: C.weight, weight: 700, pill: true });
    }
    if (show.leverArms) {
      b.line(WHEEL_CX, WHEEL_CY, lx, WHEEL_CY, C.chalk, 2, [6, 5]);
      b.line(WHEEL_CX, WHEEL_CY, rx, WHEEL_CY, C.chalk, 2, [6, 5]);
      b.text('r-l', (WHEEL_CX + lx) / 2, WHEEL_CY - 14, 'r', { size: 16, weight: 800, pill: true });
      b.text('r-r', (WHEEL_CX + rx) / 2, WHEEL_CY - 14, 'r', { size: 16, weight: 800, pill: true });
    }
    if (show.torques) {
      const r = this.p.radius;
      const tau1 = t1 * r; // left side → counter-clockwise
      const tau2 = t2 * r; // right side → clockwise
      const sweep = (tau: number) => Math.min(1.4, tau * TORQUE_TO_RAD);
      // Each side's twist starts where its rope grips the rim and turns the
      // way that rope drags it: the left rim is pulled down → ↺ (screen angle
      // decreasing from 9 o'clock), the right rim down → ↻ (increasing from 3).
      b.arcArrow(WHEEL_CX, WHEEL_CY, R * 0.62, Math.PI, Math.PI - sweep(tau1), C.torque, 4);
      b.arcArrow(WHEEL_CX, WHEEL_CY, R * 0.62, 0, sweep(tau2), C.torque, 4);
      // Net twist, outside the rim.
      const net = tau2 - tau1;
      if (Math.abs(net) > 0.05) {
        const a = Math.max(MIN_TWIST, sweep(Math.abs(net)));
        const from = -Math.PI / 2 - (Math.sign(net) * a) / 2;
        b.arcArrow(WHEEL_CX, WHEEL_CY, R + 22, from, from + Math.sign(net) * a, C.torque, 6);
      }
      b.text('tau', WHEEL_CX + R + 110, WHEEL_CY - R, Math.abs(net) > 0.05 ? `net twist ${fmt(Math.abs(net))} N·m ${net > 0 ? '↻' : '↺'}` : 'twists cancel — no spin-up', { size: 14, color: C.torque, weight: 700, pill: true });
    }
  }

  /** Live numbers for the lesson card. */
  readouts(): CardLine[] {
    const r = this.p.radius;
    const tau1 = this.t1 * r;
    const tau2 = this.t2 * r;
    const net = tau2 - tau1;
    const I = 0.5 * this.p.wheelMass * r * r;
    const alpha = this.accel / r;
    const spin = Math.abs(net) < 0.05 ? 'The twists cancel. The wheel keeps its spin (none, if it started still).' : `The ${net > 0 ? 'right (clockwise)' : 'left (counter-clockwise)'} twist wins, so the wheel spins faster and faster that way.`;
    return [
      { kind: 'row', label: 'Left rope  T₁', value: `${fmt(this.t1)} N`, color: C.tension },
      { kind: 'row', label: 'Right rope  T₂', value: `${fmt(this.t2)} N`, color: C.tension },
      { kind: 'row', label: 'Lever arm  r', value: `${fmt(r, 2)} m` },
      { kind: 'gap', size: 6 },
      { kind: 'row', label: 'Twist ↺  T₁ × r', value: `${fmt(tau1)} N·m`, color: C.torque },
      { kind: 'row', label: 'Twist ↻  T₂ × r', value: `${fmt(tau2)} N·m`, color: C.torque },
      { kind: 'row', label: 'Net torque  τ', value: `${fmt(Math.abs(net))} N·m`, color: C.torque },
      { kind: 'row', label: 'Wheel inertia  I', value: `${fmt(I, 2)} kg·m²` },
      { kind: 'row', label: 'Spin-up  α = τ ÷ I', value: `${fmt(Math.abs(alpha), 2)} rad/s²` },
      { kind: 'gap', size: 6 },
      { kind: 'para', text: spin, color: C.support, weight: 700 },
    ];
  }
}
