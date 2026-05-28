/**
 * `DrawEdgeBehaviour` — drag from a source node to a target node to create an
 * edge, with a dashed rubber-band preview that follows the cursor.
 *
 * Layer-scoped; mutates the store directly (like `DragNodeBehaviour`) and fires
 * an `onEdgeCreate` callback. A `createEdge` factory shapes the edge (id, style,
 * data) or vetoes by returning `null` (e.g. to reject duplicates).
 *
 * The preview is a **transient renderer connector** routed from the source
 * shape to a free `{ kind: 'point' }` endpoint updated on every pointermove —
 * no "cursor node", so hit-testing for the drop target is unaffected. The
 * target node under the cursor is found with `renderer.hitTest(...)`.
 *
 * Pointer-capture + `clientToScreen` lifecycle mirrors `DragNodeBehaviour`.
 *
 * Default `enabled: false`. Don't run this and `DragNodeBehaviour` enabled at
 * the same time — both start on `shape:pointerdown` (a tool mode toggle should
 * pick one).
 */

import { Behaviour, type BehaviourOptions, type CanvasContext } from '@invana/canvas';
import type { BaseConnectorSpec } from '@invana/canvas';

import { GraphLayer } from '../layer/GraphLayer';
import type { GraphEdge } from '../store/types';

/** Constructor options for `DrawEdgeBehaviour`. */
export interface DrawEdgeBehaviourOptions extends BehaviourOptions {
  /** Required — the `GraphLayer` id this behaviour draws edges in. */
  layerId: string;

  /**
   * Allow releasing on the *source* node to create a self-loop. Default
   * `false` (releasing on the source cancels). When `true`, the default
   * `createEdge` factory styles a self-loop as `pathType: 'loop-curve'` with
   * `sourceAnchor`/`targetAnchor` set to `'center'` (a loop needs center
   * anchors — `'boundary'` collapses it onto a single silhouette point).
   */
  allowSelfLoop?: boolean;

  /**
   * Build the edge to insert from the endpoints. Return `null` to veto (e.g.
   * a duplicate or disallowed pair). Default: `{ id: <generated>, source, target }`,
   * or a loop-styled edge when `source === target` (see {@link allowSelfLoop}).
   */
  createEdge?: (source: string, target: string) => GraphEdge | null;

  /** Fired after an edge is added to the store. */
  onEdgeCreate?: (edge: GraphEdge) => void;

  /** Rubber-band preview stroke. Defaults to a dashed light-blue line. */
  draftStyle?: Partial<{ color: number; width: number; alpha: number; dash: [number, number] }>;
}

/** Renderer id of the transient preview connector — never a real edge id. */
const DRAFT_ID = '__draw_edge__';
/** Exclude the preview from hit-testing so it can't mask the drop target. */
const DRAFT_EXCLUDE: ReadonlySet<string> = new Set([DRAFT_ID]);

let drawEdgeSeq = 0;

export class DrawEdgeBehaviour extends Behaviour {
  private layer: GraphLayer | null = null;
  private ctxRef: CanvasContext | null = null;
  private canvasEl: HTMLCanvasElement | null = null;

  private readonly makeEdge: (source: string, target: string) => GraphEdge | null;
  private readonly onEdgeCreate?: (edge: GraphEdge) => void;
  private readonly allowSelfLoop: boolean;
  private readonly draft: { color: number; width: number; alpha: number; dash: [number, number] };

  private offShapeDown: (() => void) | null = null;
  private sourceId: string | null = null;
  private candidateTarget: string | null = null;
  private capturedPointerId: number | null = null;

  constructor(opts: DrawEdgeBehaviourOptions) {
    super({ ...opts, shortcuts: opts.shortcuts ?? ['shape+drag'] });
    this.allowSelfLoop = opts.allowSelfLoop ?? false;
    this.makeEdge =
      opts.createEdge ??
      ((source, target) => {
        const id = `e-${Date.now().toString(36)}-${(drawEdgeSeq++).toString(36)}`;
        if (source === target) {
          // A loop needs center anchors — boundary anchors collapse it onto a
          // single silhouette point.
          return {
            id,
            source,
            target,
            style: {
              shape: { pathType: 'loop-curve', sourceAnchor: 'center', targetAnchor: 'center' },
            },
          };
        }
        return { id, source, target };
      });
    this.onEdgeCreate = opts.onEdgeCreate;
    this.draft = {
      color: opts.draftStyle?.color ?? 0x60a5fa,
      width: opts.draftStyle?.width ?? 2,
      alpha: opts.draftStyle?.alpha ?? 0.9,
      dash: opts.draftStyle?.dash ?? [6, 4],
    };
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────

  protected override onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<GraphLayer>(this.layerId!);
    if (!layer) {
      throw new Error(`DrawEdgeBehaviour "${this.id}": layer "${this.layerId}" not found.`);
    }
    this.layer = layer;
    this.ctxRef = ctx;
    this.canvasEl = ctx.canvasElement ?? null;

    const renderer = layer.getRenderer();
    if (!renderer) {
      throw new Error(`DrawEdgeBehaviour "${this.id}": target layer is not mounted.`);
    }

    const onShapeDown = (e: {
      id: string;
      worldX: number;
      worldY: number;
      button: number;
      pointerId: number;
    }): void => {
      if (!this.isEnabled || e.button !== 0) return;
      this.capturedPointerId = e.pointerId;
      this.startDraw(e.id, e.worldX, e.worldY);
    };
    renderer.events.on('shape:pointerdown', onShapeDown);
    this.offShapeDown = () => renderer.events.off('shape:pointerdown', onShapeDown);
  }

  protected override onDestroy(): void {
    this.endDraw(false);
    this.offShapeDown?.();
    this.offShapeDown = null;
    this.layer = null;
    this.ctxRef = null;
    this.canvasEl = null;
  }

  protected override onDisable(): void {
    if (this.sourceId !== null) this.endDraw(false);
  }

  // ─── Draw flow ────────────────────────────────────────────────────────────

  private startDraw(sourceId: string, worldX: number, worldY: number): void {
    const renderer = this.layer?.getRenderer();
    if (!renderer) return;
    this.sourceId = sourceId;
    this.candidateTarget = null;

    // Don't let the camera pan while drawing.
    this.ctxRef?.camera.viewport.plugins.pause('drag');

    const spec: BaseConnectorSpec = {
      kind: 'connector',
      source: { kind: 'shape', shapeId: sourceId },
      target: { kind: 'point', x: worldX, y: worldY },
      router: 'straight',
      stroke: {
        color: this.draft.color,
        width: this.draft.width,
        alpha: this.draft.alpha,
        dashArray: this.draft.dash,
      },
      zIndex: 10_000,
    };
    renderer.addConnector(DRAFT_ID, spec);

    window.addEventListener('pointermove', this.onWindowPointerMove);
    window.addEventListener('pointerup', this.onWindowPointerUp);
    window.addEventListener('pointercancel', this.onWindowPointerUp);

    if (this.canvasEl && this.capturedPointerId !== null) {
      try {
        this.canvasEl.setPointerCapture(this.capturedPointerId);
      } catch {
        // Pointer already released — endDraw handles the missing capture.
      }
    }
  }

  private endDraw(finalize: boolean): void {
    if (this.sourceId === null) return;
    const source = this.sourceId;
    const target = this.candidateTarget;
    this.sourceId = null;
    this.candidateTarget = null;

    window.removeEventListener('pointermove', this.onWindowPointerMove);
    window.removeEventListener('pointerup', this.onWindowPointerUp);
    window.removeEventListener('pointercancel', this.onWindowPointerUp);

    const renderer = this.layer?.getRenderer();
    if (renderer?.hasConnector(DRAFT_ID)) renderer.removeConnector(DRAFT_ID);

    if (this.canvasEl && this.capturedPointerId !== null) {
      try {
        this.canvasEl.releasePointerCapture(this.capturedPointerId);
      } catch {
        // Already released by the browser.
      }
    }
    this.capturedPointerId = null;
    this.ctxRef?.camera.viewport.plugins.resume('drag');

    // `candidateTarget` already enforced the self-loop rule, so a non-null
    // target is valid to connect (including target === source when allowed).
    if (finalize && target !== null && this.layer) {
      const edge = this.makeEdge(source, target);
      if (edge) {
        this.layer.store.addEdge(edge);
        this.onEdgeCreate?.(edge);
      }
    }
  }

  private readonly onWindowPointerMove = (e: PointerEvent): void => {
    if (this.sourceId === null || !this.ctxRef || !this.layer) return;
    const renderer = this.layer.getRenderer();
    if (!renderer) return;
    const { screenX, screenY } = this.clientToScreen(e.clientX, e.clientY);
    const world = this.ctxRef.camera.toWorld(screenX, screenY);

    renderer.updateConnector(DRAFT_ID, { target: { kind: 'point', x: world.x, y: world.y } });

    const hit = renderer.hitTest(world.x, world.y, DRAFT_EXCLUDE);
    const onNode = hit !== null && hit.kind === 'shape';
    // Releasing on the source is allowed only when self-loops are enabled.
    this.candidateTarget =
      onNode && (this.allowSelfLoop || hit.id !== this.sourceId) ? hit.id : null;
  };

  private readonly onWindowPointerUp = (): void => {
    this.endDraw(true);
  };

  private clientToScreen(clientX: number, clientY: number): { screenX: number; screenY: number } {
    if (!this.canvasEl) return { screenX: clientX, screenY: clientY };
    const rect = this.canvasEl.getBoundingClientRect();
    return { screenX: clientX - rect.left, screenY: clientY - rect.top };
  }
}
