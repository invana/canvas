/**
 * `TrackingBehaviour` — live tracking of moving objects (ships, riders,
 * shipments) on a `GraphLayer`. A feed pushes **fixes** (`pushFixes`); each frame
 * the behaviour draws every object where it should be *now*:
 *
 * - **Motion.** Objects are drawn `renderDelayMs` in the past, interpolated
 *   between the two fixes either side of that instant; past the newest fix they
 *   are dead-reckoned from `speed` + `course` for at most `maxExtrapolateMs`,
 *   then held (see {@link sampleTrack}). The delay is deliberate: it is what makes
 *   motion smooth at 1 Hz, and it means the picture is that much behind the feed.
 * - **Signal state.** From the age of the newest fix (and, optionally, how long
 *   the object has been slow) each object carries exactly one runtime state:
 *   `moving`, `stopped`, `stale` or `lost`. What each looks like is the style
 *   catalogue's job — `node.state.<name>` overlays and
 *   `nodeTypes.<type>.states.<name>.label`.
 * - **Heading.** The sampled course is written to `data[courseKey]` (default
 *   `course`) when it moved by `courseEpsilonDeg`, so an icon bound with
 *   `rotationBind: 'data.course'` turns with the object.
 * - **Follow.** `follow: { targetId }` keeps the camera on one object.
 *
 * Positions go through **one `setPositionsBulk` per frame**, only for the objects
 * that moved — never the reactive store. The frame comes from the engine's own
 * `render:loop:tick`; the behaviour owns no timer. Units are world units, ms and
 * compass degrees; a geographic feed converts first (`@invana/graph-layer-maplibre`).
 *
 * Everything is written through `store.internal`, so none of it is undo history.
 * `data[courseKey]` is the one write into a node's `.data`: a live heading is
 * the feed's own attribute (like the position), not presentation derived from
 * something else. Set `courseKey: null` to write no heading at all.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * const tracking = new TrackingBehaviour({ id: 'tracking', targetLayerId: 'vessels' });
 * canvas.behaviours.register(tracking);
 * canvas.update({ behaviours: { tracking: { enabled: true, staleAfterMs: 20_000 } } });
 * socket.onmessage = (m) => tracking.pushFixes(JSON.parse(m.data));
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import {
  MOTION_DEFAULTS,
  SIGNAL_DEFAULTS,
  pushFix,
  sampleTrack,
  shortestArc,
  signalState,
  type Fix,
  type Sample,
  type SignalState,
} from './tracking/motion';

/** Moves the camera for {@link TrackingBehaviour}'s follow mode. */
export interface TrackingCameraDriver {
  /** Centre the view on a world point, keeping the zoom. Called once per frame while following. */
  centerOn(x: number, y: number): void;
  /** Subscribe to the user taking the camera back (a drag or pan gesture). Returns the unsubscribe. */
  onUserGesture(cb: () => void): () => void;
}

/** Constructor options for {@link TrackingBehaviour}. All but the wiring are settings (`config.behaviours.<id>`). */
export interface TrackingBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id whose nodes the fixes move. */
  targetLayerId: string;

  /** Draw objects this far in the past so there are two fixes to interpolate between. Default `1500`. */
  renderDelayMs?: number;
  /** Past the newest fix, dead-reckon for at most this long, then hold. Default `30000`. */
  maxExtrapolateMs?: number;

  /** No fix for longer than this → the `stale` state. Default `60000`. */
  staleAfterMs?: number;
  /** No fix for longer than this → the `lost` state. Default `180000`. */
  lostAfterMs?: number;
  /** Speed (world units per second) below which an object counts as stopped. Unset = no `stopped` state. */
  stoppedBelowSpeed?: number;
  /** How long the speed must stay below `stoppedBelowSpeed` before `stopped`. Default `30000`. */
  stoppedAfterMs?: number;

  /** The `data` key the sampled heading is written to, or `null` to write none. Default `'course'`. */
  courseKey?: string | null;
  /** Write the heading only when it moved by at least this many degrees. Default `1`. */
  courseEpsilonDeg?: number;

  /** Keep the camera on one object. `targetId: null` (or absent) follows nothing. */
  follow?: { targetId: string | null };

  /** Wiring, not a setting: called for a fix whose id is not a node of the layer (the fix is dropped). */
  onUnknownFix?: (fix: Fix) => void;
  /** Wiring, not a setting: called when the user takes the camera back and the follow is released. */
  onFollowReleased?: (targetId: string) => void;
  /** Wiring, not a setting: how follow moves the camera. Default: the canvas camera. */
  cameraDriver?: TrackingCameraDriver;
}

/** What the behaviour keeps per tracked object. */
interface Track {
  /** Accepted fixes, oldest first — a short window, trimmed on every push. */
  fixes: Fix[];
  /** The `t` of the first fix of the current slow run, or `undefined`. */
  slowSince?: number;
  /** The signal state last written. */
  state?: SignalState;
  /** The position last written (float32-rounded), so an unmoved object costs nothing. */
  wx?: number;
  wy?: number;
  /** The heading last written. */
  wcourse?: number;
  /** The position the object is drawn at (what follow and tests read). */
  sample?: Sample;
}

export class TrackingBehaviour extends Behaviour<TrackingBehaviourOptions> {
  override readonly kind = 'tracking';

  private layer: GraphLayer | null = null;
  private readonly tracks = new Map<string, Track>();
  private readonly fixListeners = new Set<(fix: Fix) => void>();
  private readonly subs: Array<() => void> = [];
  private gestureOff: (() => void) | null = null;

  /** Reused across frames; grown on demand. `[x0, y0, x1, y1, …]`. */
  private xy = new Float32Array(0);

  constructor(opts: TrackingBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /**
   * Accept position fixes. Transport-agnostic: call it from a WebSocket handler,
   * a poll, or a replay. A fix older than (or as old as) the newest one for its id,
   * or with a non-finite coordinate, is dropped; a fix for an id the layer does not
   * have goes to `onUnknownFix` and is dropped. Returns how many were accepted.
   */
  pushFixes(fixes: readonly Fix[], now: number = Date.now()): number {
    const store = this.layer?.store;
    if (!store) return 0;
    const keepMs = this.num('renderDelayMs', MOTION_DEFAULTS.renderDelayMs) + 1000;
    const slowBelow = this._options.stoppedBelowSpeed;
    let accepted = 0;
    for (const fix of fixes) {
      let track = this.tracks.get(fix.id);
      if (!track) {
        if (!store.hasNode(fix.id)) {
          this._options.onUnknownFix?.(fix);
          continue;
        }
        track = { fixes: [] };
        this.tracks.set(fix.id, track);
      }
      if (!pushFix(track.fixes, fix, now, keepMs)) continue;
      accepted++;
      if (slowBelow !== undefined && fix.speed !== undefined) {
        track.slowSince = fix.speed < slowBelow ? (track.slowSince ?? fix.t) : undefined;
      }
      for (const cb of this.fixListeners) cb(fix);
    }
    return accepted;
  }

  /** Subscribe to every **accepted** fix (what `TrailsLayer` draws). Returns the unsubscribe. */
  onFix(cb: (fix: Fix) => void): () => void {
    this.fixListeners.add(cb);
    return () => this.fixListeners.delete(cb);
  }

  /** Follow one object (`null` stops). The same as `setOptions({ follow: { targetId } })`. */
  follow(targetId: string | null): void {
    this.setOptions({ follow: { targetId } });
  }

  /** Where an object is drawn as of the last step, or `undefined` if it is not tracked. */
  getSample(id: string): Readonly<Sample> | undefined {
    return this.tracks.get(id)?.sample;
  }

  /** The signal state an object last carried, or `undefined`. */
  getSignalState(id: string): SignalState | undefined {
    return this.tracks.get(id)?.state;
  }

  /** Ids of every tracked object. */
  trackedIds(): IterableIterator<string> {
    return this.tracks.keys();
  }

  /** Stop tracking one object and clear the state this behaviour wrote on it. */
  forget(id: string): void {
    const track = this.tracks.get(id);
    if (!track) return;
    if (track.state) this.layer?.store.internal.setNodeState(id, track.state, false);
    this.tracks.delete(id);
  }

  /**
   * Advance every track to `now` and write the result. The frame handler calls it
   * with `Date.now()`; a test or a replay calls it with the time it wants. Returns
   * the number of objects whose position was written.
   */
  step(now: number): number {
    const layer = this.layer;
    if (!layer) return 0;
    const store = layer.store;
    const motion = {
      renderDelayMs: this.num('renderDelayMs', MOTION_DEFAULTS.renderDelayMs),
      maxExtrapolateMs: this.num('maxExtrapolateMs', MOTION_DEFAULTS.maxExtrapolateMs),
    };
    const signal = {
      staleAfterMs: this.num('staleAfterMs', SIGNAL_DEFAULTS.staleAfterMs),
      lostAfterMs: this.num('lostAfterMs', SIGNAL_DEFAULTS.lostAfterMs),
      stoppedBelowSpeed: this._options.stoppedBelowSpeed,
      stoppedAfterMs: this.num('stoppedAfterMs', SIGNAL_DEFAULTS.stoppedAfterMs),
    };
    const courseKey = this._options.courseKey === undefined ? 'course' : this._options.courseKey;
    const epsilon = this.num('courseEpsilonDeg', 1);

    if (this.xy.length < this.tracks.size * 2) this.xy = new Float32Array(this.tracks.size * 2);
    const ids: string[] = [];
    const xy = this.xy;

    for (const [id, track] of this.tracks) {
      const sample = sampleTrack(track.fixes, now, motion);
      if (!sample) continue;
      track.sample = sample;

      const x = Math.fround(sample.x);
      const y = Math.fround(sample.y);
      if (x !== track.wx || y !== track.wy) {
        xy[ids.length * 2] = x;
        xy[ids.length * 2 + 1] = y;
        ids.push(id);
        track.wx = x;
        track.wy = y;
      }

      const next = signalState(track.fixes[track.fixes.length - 1]!.t, track.slowSince, now, signal);
      if (next !== track.state) {
        if (track.state) store.internal.setNodeState(id, track.state, false);
        store.internal.setNodeState(id, next, true);
        track.state = next;
      }

      if (courseKey && sample.course !== undefined) {
        const was = track.wcourse;
        if (was === undefined || Math.abs(shortestArc(was, sample.course)) >= epsilon) {
          const node = store.getNode(id);
          if (node) {
            const data = { ...((node.data as Record<string, unknown> | undefined) ?? {}), [courseKey]: Math.round(sample.course * 10) / 10 };
            store.internal.updateNode(id, { data });
            track.wcourse = sample.course;
          }
        }
      }
    }

    // `setPositionsBulk` wants exactly `ids.length * 2` numbers — a view, not a copy.
    if (ids.length > 0) store.internal.setPositionsBulk(ids, xy.subarray(0, ids.length * 2));

    const target = this._options.follow?.targetId;
    if (target) {
      const s = this.tracks.get(target)?.sample;
      if (s) this.driver()?.centerOn(s.x, s.y);
    }
    return ids.length;
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `TrackingBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    // The engine's own frame: no second clock. The write lands in the next flush.
    this.subs.push(ctx.events.on('render:loop:tick', () => this.onFrame()));
    // The user taking the camera back releases a follow.
    this.gestureOff = this.driver()?.onUserGesture(() => this.releaseFollow()) ?? null;
  }

  protected override onDisable(): void {
    this.clearStates();
  }

  protected override onDestroy(): void {
    this.clearStates();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.gestureOff?.();
    this.gestureOff = null;
    this.fixListeners.clear();
    this.tracks.clear();
    this.layer = null;
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private onFrame(): void {
    if (this._enabled && this.tracks.size > 0) this.step(Date.now());
  }

  /** The driver follow moves the camera with: the one passed in, or the canvas camera. */
  private driver(): TrackingCameraDriver | undefined {
    const given = this._options.cameraDriver;
    if (given) return given;
    const camera = this.ctx?.camera;
    if (!camera) return undefined;
    return {
      centerOn: (x, y) => camera.setPosition(camera.screenWidth / 2 - x * camera.scale, camera.screenHeight / 2 - y * camera.scale),
      onUserGesture: (cb) => camera.onDragStart(cb),
    };
  }

  private releaseFollow(): void {
    const id = this._options.follow?.targetId;
    if (!id) return;
    this.setOptions({ follow: { targetId: null } });
    this._options.onFollowReleased?.(id);
  }

  /** Remove the signal state this behaviour wrote, so a disabled tracker leaves no overlay behind. */
  private clearStates(): void {
    const store = this.layer?.store;
    if (!store) return;
    for (const [id, track] of this.tracks) {
      if (track.state) store.internal.setNodeState(id, track.state, false);
      track.state = undefined;
    }
  }

  /** A numeric option, or its default. */
  private num(key: 'renderDelayMs' | 'maxExtrapolateMs' | 'staleAfterMs' | 'lostAfterMs' | 'stoppedAfterMs' | 'courseEpsilonDeg', fallback: number): number {
    return this._options[key] ?? fallback;
  }
}
