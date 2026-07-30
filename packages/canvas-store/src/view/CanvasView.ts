import type { CameraTransform, Rect } from '../geom/types';

/**
 * `CanvasView` — the reactive, observable, syncable half of `CanvasStore`: how a
 * visualisation is **defined**, **viewed**, and its small transient **runtime**
 * status. Small + human-rate → it lives on a {@link ReactiveStore}. Bulk data
 * (nodes/edges/positions) is the **other** half (`CanvasStore.data`, typed-array,
 * never reactive).
 *
 * Three compartments, three sync physics (see `docs/canvas-state-plan.md` §9):
 * - **`definition`** — "what it IS": persisted, converges (a CRDT doc later).
 * - **`interaction`** — "the live view": ephemeral / per-user (Awareness later).
 * - **`runtime`** — small observable transient status (layout run, message):
 *   reactive so UIs can react, but **never synced**.
 *
 * Per-instance option bags are intentionally loose (`Record<string, unknown>`) at
 * this layer — the engine and the schema-driven editors give them concrete shape,
 * and the kernel stays domain-free (it treats element `style` as opaque).
 */
export interface CanvasView {
  /** "What the visualisation IS" — persisted, converged (a CRDT doc later). */
  definition: {
    /** Canvas/scene-level config (background, zoom limits, world bounds, …). */
    canvas: CanvasSceneOptions;
    /** Layer options keyed by instance id (a rendering layer binds a data source). */
    layers: Record<string, Record<string, unknown>>;
    /** Behaviour options keyed by instance id. `enabled` is explicit (rule 7). */
    behaviours: Record<string, Record<string, unknown>>;
    /** Layout options keyed by instance id. */
    layouts: Record<string, Record<string, unknown>>;
    /** Id of the active layout among {@link layouts}, or `null`. */
    activeLayout: string | null;
    /** Authored node/edge templates (designer output). */
    templates: unknown[];
    /** Theme **config** (registry + active family + mode + accent). The *resolved* theme is derived. */
    theme: Record<string, unknown>;
  };
  /** "The live view onto it" — mostly ephemeral / per-user (Awareness later). */
  interaction: {
    /** The semantic selection set (D11 — owned here, not in a behaviour). */
    selection: ReadonlySet<string>;
    /** Hovered element id, or `null`. */
    hover: string | null;
    /** Visual state sets (highlighted / context-open / …) keyed by state name (presence overlay). */
    states: Record<string, ReadonlySet<string>>;
    /**
     * Elements lifted above their peers, keyed by the **source** that lifted
     * them (a behaviour id) — so independent sources (hover, selection, …)
     * never clobber each other's set, and each can be cleared on its own.
     *
     * The renderer projects the union of every source onto its own paint order
     * and lowers anything absent from it. That single projection is what keeps
     * the lift honest: a raise is *derived from state*, not a side effect, so
     * it self-corrects when the state that motivated it changes (an element
     * stops being hovered, a frame opens and becomes a backdrop, …). Before,
     * each behaviour reparented display objects imperatively and tracked what
     * it had touched privately — nothing could reconcile them, so a stale lift
     * outranked the whole scene until that behaviour happened to run again.
     *
     * Ids only: the kernel stays domain-free. What an id *means* (a frame
     * lifting its contents instead of itself, say) is the renderer's business.
     */
    raised: Record<string, ReadonlySet<string>>;
    /** Abstract camera transform — renderer-agnostic; throttled/ephemeral. */
    camera: CameraTransform;
    /**
     * Focal-emphasis: the highlight set + whether the rest is dimmed. O(1) to set;
     * "muted" is a render-time derivation (`dim && !ids.has(id)`), not a per-node
     * write (see `canvas-state-plan.md` §7.1B). `null` when no focus is active.
     */
    focus: { ids: ReadonlySet<string>; dim: boolean } | null;
    /**
     * Nodes transiently locked during a drag/resize gesture — held against the
     * layout for the gesture's duration. **Distinct from data `pinned`** (the
     * permanent, synced user flag); these are ephemeral and never synced.
     */
    transientPins: ReadonlySet<string>;
    /** Active interaction mode. */
    viewMode: string;
  };
  /** Small observable transient status — reactive (UIs react) but **never synced**. */
  runtime: {
    /** Layout run status — drives spinners / a stop control. */
    layout: {
      running: boolean;
      /** The layout id currently executing, or `null`. */
      activeId: string | null;
      /** Whether the run animates its settle (force sim) vs jumps to final positions. */
      animate: boolean;
      /** 0..1 progress when known (force `alpha`); `null` for one-shot / unknown. */
      progress: number | null;
    };
    /** Transient overlay/status message, or `null`. */
    message: string | null;
  };
}

/**
 * Canvas/scene-level configuration — the settings that sit *above* individual
 * layers/behaviours/layouts. Renderer-init options (`preference`, `antialias`,
 * `resolution`, …) are deliberately **not** here: those belong to the renderer
 * adapter, not the syncable definition.
 */
export interface CanvasSceneOptions {
  /** Scene background colour (`0xRRGGBB`). */
  backgroundColor?: number;
  /** Suppress the browser's native context menu over the canvas. */
  suppressBrowserContextMenu?: boolean;
  /** Zoom clamp for the abstract camera. */
  zoom: { min: number; max: number };
  /** Initial camera transform applied on load. */
  initialCamera?: CameraTransform;
  /** Optional world/scene bounds (for fit-on-load / clamping), or `null`. */
  worldBounds?: Rect | null;
  /** Default interaction mode the view starts in. */
  defaultViewMode?: string;
}

/** The empty-but-valid initial {@link CanvasView}. */
export function defaultCanvasView(): CanvasView {
  return {
    definition: {
      canvas: { zoom: { min: 0.01, max: 100 } },
      layers: {},
      behaviours: {},
      layouts: {},
      activeLayout: null,
      templates: [],
      theme: {},
    },
    interaction: {
      selection: new Set<string>(),
      hover: null,
      states: {},
      raised: {},
      camera: { x: 0, y: 0, zoom: 1 },
      focus: null,
      transientPins: new Set<string>(),
      viewMode: 'select',
    },
    runtime: {
      layout: { running: false, activeId: null, animate: false, progress: null },
      message: null,
    },
  };
}
