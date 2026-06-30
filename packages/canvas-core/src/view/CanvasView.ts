/**
 * `CanvasView` — the reactive, observable, syncable half of `CanvasState`: how a
 * visualisation is **defined** and **viewed**. Small + human-rate → it lives on a
 * {@link ReactiveStore}. Bulk data (nodes/edges/positions) is the **other** half
 * (`CanvasState.data`, typed-array, never reactive).
 *
 * Per-instance option bags are intentionally loose (`Record<string, unknown>`) at
 * this layer — the engine and the schema-driven editors give them concrete shape.
 */
export interface CanvasView {
  /** "What the visualisation IS" — persisted, converged (a CRDT doc later). */
  definition: {
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
    /** Theme state (mode + family + accent). */
    theme: Record<string, unknown>;
  };
  /** "The live view onto it" — mostly ephemeral / per-user (Awareness later). */
  interaction: {
    /** The semantic selection set (D11 — owned here, not in a behaviour). */
    selection: ReadonlySet<string>;
    /** Hovered element id, or `null`. */
    hover: string | null;
    /** Visual state sets (highlighted / context-open / …) keyed by state name. */
    states: Record<string, ReadonlySet<string>>;
    /** Abstract camera transform — renderer-agnostic; throttled/ephemeral. */
    camera: { x: number; y: number; zoom: number };
    /** Active interaction mode. */
    viewMode: string;
  };
}

/** The empty-but-valid initial {@link CanvasView}. */
export function defaultCanvasView(): CanvasView {
  return {
    definition: {
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
      camera: { x: 0, y: 0, zoom: 1 },
      viewMode: 'select',
    },
  };
}
