import type { CanvasEventBus, InteractionKind } from '@invana/canvas-store';

/**
 * Attributes each rendered frame to the user gesture in flight, so the frame
 * meter can tag its samples with an {@link InteractionKind}. This is the piece
 * that turns a flat FPS trace into "which action caused the dip".
 *
 * It listens to the bus's interaction lifecycle and derives a single current
 * label. Two shapes of gesture are handled differently:
 *
 * - **Bracketed** (`drag`, `layout`) — have explicit start/end events, so they
 *   are sticky: active from start until end.
 * - **Momentary** (`zoom`, `pan`) — fire a burst of events during the gesture
 *   but have no "end", so they decay to `'idle'` after {@link IDLE_MS} of
 *   silence, capturing the inertia tail without sticking forever.
 * - **Hover** sits between: `input:node:hover` carries an id (enter) or `null`
 *   (leave), so it is tracked as an explicit boolean.
 *
 * Priority when several are live: `layout` > `drag` > `hover` > momentary
 * (`zoom`/`pan`) > `idle`. Bracketed, higher-intent gestures win over the
 * momentary camera tail.
 */
export class InteractionTracker {
  /** Revert to `'idle'` this many ms after the last momentary (zoom/pan) event. */
  private static readonly IDLE_MS = 140;

  private layoutActive = false;
  private dragActive = false;
  private hoverActive = false;
  /** Most recent momentary gesture (`zoom` / `pan`) and when it last fired. */
  private momentary: InteractionKind = 'idle';
  private momentaryAt = 0;

  private readonly offs: Array<() => void> = [];

  constructor(
    bus: CanvasEventBus,
    private readonly now: () => number = () =>
      typeof performance !== 'undefined' ? performance.now() : Date.now(),
  ) {
    this.offs.push(
      bus.on('input:camera:zoom', () => this.markMomentary('zoom')),
      bus.on('input:camera:pan', () => this.markMomentary('pan')),
      bus.on('input:node:drag:start', () => {
        this.dragActive = true;
      }),
      bus.on('input:node:drag:end', () => {
        this.dragActive = false;
      }),
      bus.on('input:node:hover', ({ id }) => {
        this.hoverActive = id !== null;
      }),
      bus.on('layout:run:start', () => {
        this.layoutActive = true;
      }),
      bus.on('layout:run:end', () => {
        this.layoutActive = false;
      }),
    );
  }

  /** Record a momentary gesture and stamp its time so it decays to idle. */
  private markMomentary(kind: InteractionKind): void {
    this.momentary = kind;
    this.momentaryAt = this.now();
  }

  /**
   * The interaction the frame at `now` (a `performance.now()`-scale timestamp)
   * should be attributed to. Pass the frame's own start time so the idle-decay
   * is measured against the frame, not wall-clock drift.
   */
  current(now: number = this.now()): InteractionKind {
    if (this.layoutActive) return 'layout';
    if (this.dragActive) return 'drag';
    if (this.hoverActive) return 'hover';
    if (now - this.momentaryAt < InteractionTracker.IDLE_MS) return this.momentary;
    return 'idle';
  }

  /** Detach every bus subscription. */
  dispose(): void {
    for (const off of this.offs) off();
    this.offs.length = 0;
  }
}
