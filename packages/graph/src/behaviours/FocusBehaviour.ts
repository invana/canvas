/**
 * `FocusBehaviour` — draws the kernel's `view.interaction.focus`: the focused
 * nodes are emphasised, the rest optionally dimmed, and on request the camera
 * frames them.
 *
 * `interaction.focus` is written by whoever points at nodes — a playbook step
 * (`view.focus`), the assistant, a panel, `canvas.store.actions.focus.set` —
 * and until this behaviour nothing drew it (RFC
 * `feat-2026-09-28-an-analysis-cannot-be-recorded-or-replayed`, F9 / M8). It
 * follows the store; it never writes it.
 *
 * - **Emphasis** — focused nodes (and, with `includeEdges`, the edges between
 *   two of them) get {@link FocusBehaviourOptions.focusState}; everything else
 *   gets {@link FocusBehaviourOptions.dimState} when the focus asks to dim
 *   (`focus.dim`). Written as runtime states through `store.internal`, so they
 *   are never recorded: undo moves the focus, and this behaviour redraws it.
 * - **Framing** — a `'focus'` camera intent (`interaction.cameraIntent`, a
 *   playbook step's `view.camera: 'focus'`) frames the focused nodes once the
 *   canvas settles. With {@link FocusBehaviourOptions.frame} on, every focus
 *   change frames too.
 *
 * Convergent: it re-derives the wanted states from the store on every change
 * (focus, data added / removed) and writes only the difference, and clears
 * everything it wrote on disable.
 *
 * Default `enabled: false` — register, then explicitly enable.
 *
 * @example
 * ```ts
 * canvas.behaviours.register(
 *   new FocusBehaviour({ id: 'focus', targetLayerId: 'graph', frame: true, enabled: true }),
 * );
 * canvas.store.actions.focus.set(['valjean', 'javert']); // highlight + dim the rest
 * canvas.store.actions.cameraIntent.request('focus');     // frame them
 * ```
 */

import { Behaviour, type BehaviourOptions, type CanvasContext, type CanvasView } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';

/** Constructor options for {@link FocusBehaviour}. */
export interface FocusBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id whose nodes this behaviour emphasises. */
  targetLayerId: string;

  /** Runtime state written on focused nodes (and edges). Default `'highlighted'`. */
  focusState?: string;

  /**
   * Runtime state written on everything outside the focus when the focus asks
   * to dim (`interaction.focus.dim`). Default `'dimmed'`. `''` never dims.
   */
  dimState?: string;

  /** Also emphasise the edges whose two endpoints are both focused. Default `true`. */
  includeEdges?: boolean;

  /**
   * Frame the focused nodes after **every** focus change, once the canvas
   * settles. Default `false`: only a `'focus'` camera intent frames.
   */
  frame?: boolean;

  /** Screen-px margin around the framed nodes. Default `80`. */
  framePadding?: number;

  /** Length of the framing glide in ms. `0` snaps. Default `450`. */
  frameDurationMs?: number;

  /**
   * Never zoom in past this when framing — keeps one focused node from
   * filling the screen. Default `2`.
   */
  frameMaxZoom?: number;
}

/** {@link FocusBehaviourOptions} with every default applied. */
interface ResolvedOptions {
  focusState: string;
  dimState: string;
  includeEdges: boolean;
  frame: boolean;
  framePadding: number;
  frameDurationMs: number;
  frameMaxZoom: number;
}

function resolveOptions(prev: ResolvedOptions | null, patch: Partial<FocusBehaviourOptions>): ResolvedOptions {
  const base: ResolvedOptions = prev ?? {
    focusState: 'highlighted',
    dimState: 'dimmed',
    includeEdges: true,
    frame: false,
    framePadding: 80,
    frameDurationMs: 450,
    frameMaxZoom: 2,
  };
  return {
    focusState: patch.focusState ?? base.focusState,
    dimState: patch.dimState ?? base.dimState,
    includeEdges: patch.includeEdges ?? base.includeEdges,
    frame: patch.frame ?? base.frame,
    framePadding: patch.framePadding ?? base.framePadding,
    frameDurationMs: patch.frameDurationMs ?? base.frameDurationMs,
    frameMaxZoom: patch.frameMaxZoom ?? base.frameMaxZoom,
  };
}

/** Which runtime state an element should carry: emphasised, dimmed, or none. */
type Mark = 'focus' | 'dim';

export class FocusBehaviour extends Behaviour {
  override readonly kind = 'focus';

  private opts: ResolvedOptions;
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private readonly subs: Array<() => void> = [];

  /**
   * What this behaviour has written, per element id, with the state name it
   * used — so an option change (a new `focusState`) still clears the old name.
   */
  private readonly nodeMarks = new Map<string, { mark: Mark; state: string }>();
  private readonly edgeMarks = new Map<string, { mark: Mark; state: string }>();

  constructor(opts: FocusBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? [] });
    this.opts = resolveOptions(null, opts);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.targetLayerId!);
    if (!layer) {
      throw new Error(
        `FocusBehaviour "${this.id}": layer "${this.targetLayerId}" not found. ` +
          `Add the GraphLayer before registering this behaviour.`,
      );
    }
    this.layer = layer;
    this.ctxRef = ctx;

    this.subs.push(
      ctx.store.view.subscribe((state, prev) => {
        if (!this.isEnabled) return;
        const focusChanged = state.interaction.focus !== prev.interaction.focus;
        if (focusChanged) {
          this.sync();
          if (this.opts.frame && state.interaction.focus) this.frameWhenSettled();
        }
        const intent = state.interaction.cameraIntent;
        if (intent && intent !== prev.interaction.cameraIntent && intent.intent === 'focus') {
          this.frameWhenSettled();
        }
      }),
      // Nodes added or removed under an active focus: dim the newcomers, forget the gone.
      layer.events.on('data:changed', (e) => {
        if (e.addedNodes > 0 || e.removedNodes > 0 || e.addedEdges > 0 || e.removedEdges > 0) this.sync();
      }),
    );
  }

  protected override onEnable(): void {
    this.sync();
  }

  protected override onDisable(): void {
    this.clearAll();
  }

  protected override onDestroy(): void {
    this.clearAll();
    for (const off of this.subs) off();
    this.subs.length = 0;
    this.layer = null;
    this.ctxRef = null;
  }

  // ─── Public API ─────────────────────────────────────────────────────────

  /** Resolved current options (read-only snapshot). */
  get options(): Readonly<ResolvedOptions> {
    return this.opts;
  }

  /** Runtime option update; redraws the current focus when enabled. */
  setOptions(patch: Partial<FocusBehaviourOptions>): void {
    this.recordOptions(patch);
    this.opts = resolveOptions(this.opts, patch);
    if (this.isEnabled) this.sync();
  }

  // ─── Internals ──────────────────────────────────────────────────────────

  private focus(): CanvasView['interaction']['focus'] {
    return this.ctxRef?.store.view.getState().interaction.focus ?? null;
  }

  /** Bring the written states in line with the store's focus, writing only the difference. */
  private sync(): void {
    const layer = this.layer;
    if (!layer || !this.isEnabled) return;
    const focus = this.focus();
    const { focusState, dimState, includeEdges } = this.opts;
    const dim = focus !== null && focus.dim && dimState !== '';

    const wantNodes = new Map<string, Mark>();
    const wantEdges = new Map<string, Mark>();
    if (focus && focus.ids.size > 0) {
      for (const node of layer.store.nodes()) {
        if (focus.ids.has(node.id)) wantNodes.set(node.id, 'focus');
        else if (dim) wantNodes.set(node.id, 'dim');
      }
      for (const edge of layer.store.edges()) {
        const inside = focus.ids.has(edge.source) && focus.ids.has(edge.target);
        if (inside && includeEdges) wantEdges.set(edge.id, 'focus');
        else if (dim && !inside) wantEdges.set(edge.id, 'dim');
      }
    }

    const nameOf = (mark: Mark): string => (mark === 'focus' ? focusState : dimState);
    const store = layer.store;
    store.batch(() => {
      reconcile(this.nodeMarks, wantNodes, nameOf, (id, state, on) => {
        if (on || store.hasNode(id)) store.internal.setNodeState(id, state, on);
      });
      reconcile(this.edgeMarks, wantEdges, nameOf, (id, state, on) => {
        if (on || store.hasEdge(id)) store.internal.setEdgeState(id, state, on);
      });
    });
  }

  private clearAll(): void {
    const store = this.layer?.store;
    if (!store) {
      this.nodeMarks.clear();
      this.edgeMarks.clear();
      return;
    }
    store.batch(() => {
      for (const [id, { state }] of this.nodeMarks) if (store.hasNode(id)) store.internal.setNodeState(id, state, false);
      for (const [id, { state }] of this.edgeMarks) if (store.hasEdge(id)) store.internal.setEdgeState(id, state, false);
    });
    this.nodeMarks.clear();
    this.edgeMarks.clear();
  }

  /**
   * Frame the focus once the canvas settles — after the layout a step
   * triggered has placed the nodes, so the camera aims at where they end up.
   * A focus that changed meanwhile is framed as it is then.
   */
  private frameWhenSettled(): void {
    const ctx = this.ctxRef;
    if (!ctx) return;
    const settled = ctx.whenSettled?.() ?? Promise.resolve();
    void settled.then(() => this.frameNow());
  }

  private frameNow(): void {
    const layer = this.layer;
    const ctx = this.ctxRef;
    const focus = this.focus();
    if (!layer || !ctx || !focus || focus.ids.size === 0 || !this.isEnabled) return;
    // Store-derived boxes (the auto-fitter's measure), so a layout that just
    // settled is framed where it put the nodes, not where they were drawn.
    const rect = layer.getBounds({ ids: focus.ids });
    if (!rect) return;

    const cam = ctx.camera;
    const { framePadding: pad, frameMaxZoom, frameDurationMs } = this.opts;
    const minX = rect.x;
    const minY = rect.y;
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    const zoom = Math.min(
      frameMaxZoom,
      Math.max(1, cam.screenWidth - pad * 2) / width,
      Math.max(1, cam.screenHeight - pad * 2) / height,
    );
    const cx = minX + width / 2;
    const cy = minY + height / 2;
    const to = { x: cam.screenWidth / 2 - cx * zoom, y: cam.screenHeight / 2 - cy * zoom, zoom };
    if (frameDurationMs > 0) cam.animateTo(to, { durationMs: frameDurationMs, easing: 'easeOutCubic' });
    else cam.setTransform(to);
  }
}

/**
 * Diff `written` (what is on screen) against `want` and call `write` for each
 * change, updating `written` to match. A mark whose state name changed is
 * cleared under the old name before the new one is set.
 */
function reconcile(
  written: Map<string, { mark: Mark; state: string }>,
  want: ReadonlyMap<string, Mark>,
  nameOf: (mark: Mark) => string,
  write: (id: string, state: string, on: boolean) => void,
): void {
  for (const [id, prev] of written) {
    const mark = want.get(id);
    if (mark !== undefined && nameOf(mark) === prev.state && mark === prev.mark) continue;
    write(id, prev.state, false);
    written.delete(id);
  }
  for (const [id, mark] of want) {
    if (written.has(id)) continue;
    const state = nameOf(mark);
    write(id, state, true);
    written.set(id, { mark, state });
  }
}
