import type { CameraTransform, CanvasView } from '@invana/canvas-store';

import type { Canvas } from '../engine/Canvas';

/**
 * Schema version stamped onto every {@link CanvasStateSnapshot}. Bump when the
 * envelope shape changes so importers can detect (and refuse / migrate)
 * incompatible files. Layer *data* payloads are versioned by their own layer.
 */
export const CANVAS_STATE_VERSION = 1 as const;

/**
 * The structural contract a {@link Canvas} layer implements to round-trip its
 * **bulk data** (nodes / edges / rows …) through the JSON state snapshot.
 *
 * Duck-typed on purpose — `@invana/canvas` can't depend on the domain packages
 * that own the data (e.g. `@invana/graph`'s `GraphLayer`), so the exporter only
 * asks: *does this layer expose `exportData` / `importData`?* A layer that holds
 * no serialisable data simply doesn't implement it and is skipped.
 */
export interface DataSerializableLayer {
  /** Return a JSON-serialisable snapshot of this layer's data. */
  exportData(): unknown;
  /** Replace this layer's data from a snapshot previously produced by {@link exportData}. */
  importData(data: unknown): void;
}

/**
 * The structural contract a layer / behaviour / layout implements to contribute
 * its **serialisable configuration** (styling template, options, params) to the
 * snapshot's `definition`.
 *
 * Needed because a declarative (React) canvas passes options to **constructors**,
 * not through `canvas.update()`, so the reactive `store.view.definition` is
 * empty. Each instance can instead expose its own JSON-safe config slice here;
 * {@link exportCanvasState} overlays it onto `definition.{layers,behaviours,layouts}`
 * keyed by the instance id. Duck-typed like {@link DataSerializableLayer} so the
 * engine stays free of domain deps.
 *
 * The returned object must be JSON-safe — function-valued style resolvers (e.g.
 * `labelText: (n) => …`) cannot serialise and should be dropped (implementations
 * use {@link jsonSafe}). Import re-applies the slice through `setOptions`, whose
 * shallow merge preserves any live resolver a serialised template omitted.
 */
export interface DefinitionSerializable {
  /** Return this instance's JSON-safe config slice, or `undefined` to contribute nothing. */
  serializeDefinition(): Record<string, unknown> | undefined;
}

/**
 * JSON-safe projection of {@link CanvasView.interaction} — every `Set` is
 * flattened to an array (and rehydrated on import). Camera is a plain
 * `{ x, y, zoom }` already.
 */
export interface CanvasInteractionSnapshot {
  selection: string[];
  hover: string | null;
  states: Record<string, string[]>;
  camera: CameraTransform;
  focus: { ids: string[]; dim: boolean } | null;
  transientPins: string[];
  viewMode: string;
}

/**
 * The full, self-contained JSON document describing a canvas — everything a
 * fresh (structurally identical) canvas needs to re-render the same scene:
 *
 * - **`view.definition`** — "what it IS": scene options, layer/behaviour/layout
 *   options, `activeLayout`, authored templates, theme config. (styling lives
 *   inside the per-layer options + templates.)
 * - **`view.interaction`** — "the live view": selection, hover, camera, focus,
 *   view states, view mode.
 * - **`data`** — each data-owning layer's bulk records (nodes/edges with
 *   positions), keyed by layer id.
 *
 * Serialise with {@link exportCanvasState}; restore with {@link importCanvasState}.
 * `runtime` (transient layout/message status) is intentionally omitted — it is
 * never persisted.
 */
export interface CanvasStateSnapshot {
  /** Envelope schema version — see {@link CANVAS_STATE_VERSION}. */
  version: number;
  view: {
    definition: CanvasView['definition'];
    interaction: CanvasInteractionSnapshot;
  };
  /** Per-layer bulk data keyed by layer id (only layers that implement {@link DataSerializableLayer}). */
  data: Record<string, unknown>;
}

/** Options for {@link importCanvasState}. */
export interface ImportCanvasStateOptions {
  /**
   * Skip restoring the ephemeral `interaction` slice (selection / hover /
   * camera / focus / view states). Default `false` — the full live view is
   * restored. Set `true` to load a document's definition + data while keeping
   * the viewer's current camera and selection.
   */
  skipInteraction?: boolean;
}

/** Deep JSON clone — detaches the snapshot from live store state and asserts JSON-safety. */
function jsonClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * JSON-safe deep copy: drops functions, `undefined`, and other non-serialisable
 * values (via `JSON.stringify`, which omits them). Returns `undefined` when the
 * whole value serialises away. Used by `serializeDefinition()` implementers so a
 * template carrying resolver functions still yields a clean, portable slice.
 */
export function jsonSafe<T>(value: T): T | undefined {
  const json = JSON.stringify(value);
  return json === undefined ? undefined : (JSON.parse(json) as T);
}

/** `Record<string, ReadonlySet<string>>` → `Record<string, string[]>`. */
function setsToArrays(states: Record<string, ReadonlySet<string>>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [name, set] of Object.entries(states)) out[name] = [...set];
  return out;
}

/** `Record<string, string[]>` → `Record<string, Set<string>>`. */
function arraysToSets(states: Record<string, string[]>): Record<string, Set<string>> {
  const out: Record<string, Set<string>> = {};
  for (const [name, ids] of Object.entries(states)) out[name] = new Set(ids);
  return out;
}

/**
 * Return the layer typed as {@link DataSerializableLayer} if it implements the
 * contract, else `undefined`. Unlike a `layer is …` predicate this keeps the
 * caller's original reference (so `ILayer.redraw()` stays callable after the check).
 */
function asDataSerializable(layer: unknown): DataSerializableLayer | undefined {
  return typeof (layer as DataSerializableLayer | null)?.exportData === 'function' &&
    typeof (layer as DataSerializableLayer | null)?.importData === 'function'
    ? (layer as DataSerializableLayer)
    : undefined;
}

/** Return the instance's {@link DefinitionSerializable.serializeDefinition} slice, or `undefined`. */
function serializeDefinitionOf(inst: unknown): Record<string, unknown> | undefined {
  const fn = (inst as DefinitionSerializable | null)?.serializeDefinition;
  return typeof fn === 'function' ? fn.call(inst) : undefined;
}

/**
 * Serialise a canvas's **full render state** to a plain JSON object — the view
 * definition (scene / layers / behaviours / layouts / templates / theme), the
 * live interaction (selection / hover / camera / focus / states / view mode),
 * and every data-owning layer's records (nodes / edges with positions).
 *
 * The result is a pure POJO safe to `JSON.stringify`, persist, diff, or hand to
 * {@link importCanvasState}. It does **not** describe *which classes* to
 * register — import restores into a canvas whose layers/behaviours/layouts are
 * already registered under the same ids (see {@link importCanvasState}).
 *
 * @example
 * const snapshot = exportCanvasState(canvas);
 * localStorage.setItem('scene', JSON.stringify(snapshot));
 */
export function exportCanvasState(canvas: Canvas): CanvasStateSnapshot {
  const view = canvas.store.view.getState();
  const { interaction } = view;

  const data: Record<string, unknown> = {};
  for (const layer of canvas.layers.list()) {
    const ser = asDataSerializable(layer);
    if (ser) data[layer.id] = ser.exportData();
  }

  // Start from the reactive definition (populated when a canvas is configured via
  // `canvas.update`), then overlay each live instance's serialisable config. This
  // captures styling / templates / options even on a declarative canvas whose
  // options were passed to constructors and never reached `store.view.definition`.
  const definition = jsonClone(view.definition);
  const overlay = (
    slice: Record<string, Record<string, unknown>>,
    id: string,
    inst: unknown,
  ) => {
    const d = serializeDefinitionOf(inst);
    if (d) slice[id] = { ...(slice[id] ?? {}), ...d };
  };
  for (const layer of canvas.layers.list()) overlay(definition.layers, layer.id, layer);
  for (const behaviour of canvas.behaviours.list()) overlay(definition.behaviours, behaviour.id, behaviour);
  for (const layout of canvas.layouts.list()) overlay(definition.layouts, layout.id, layout);

  return {
    version: CANVAS_STATE_VERSION,
    view: {
      definition,
      interaction: {
        selection: [...interaction.selection],
        hover: interaction.hover,
        states: setsToArrays(interaction.states),
        camera: { ...interaction.camera },
        focus: interaction.focus
          ? { ids: [...interaction.focus.ids], dim: interaction.focus.dim }
          : null,
        transientPins: [...interaction.transientPins],
        viewMode: interaction.viewMode,
      },
    },
    data,
  };
}

/**
 * Restore a canvas from a {@link CanvasStateSnapshot} produced by
 * {@link exportCanvasState}.
 *
 * Because a snapshot carries options + data keyed by id but **not** class
 * references, the canvas must already have its layers/behaviours/layouts
 * registered under those same ids (e.g. the same `<Canvas>` JSX or imperative
 * `canvas.layers.add(...)` wiring). Import then:
 *
 * 1. loads each layer's bulk data (so positions/nodes exist before anything
 *    reads them),
 * 2. pushes the definition — layer/behaviour/layout option slices reach each
 *    instance's `setOptions`; scene / templates / theme / `activeLayout` are
 *    written to the store. The active layout is **not** re-run, so the restored
 *    node positions are preserved rather than recomputed,
 * 3. restores the interaction slice (camera via the camera action so the
 *    renderer's viewport follows) unless {@link ImportCanvasStateOptions.skipInteraction}.
 *
 * @throws if the snapshot's {@link CanvasStateSnapshot.version} is newer than
 * this engine understands.
 */
export function importCanvasState(
  canvas: Canvas,
  snapshot: CanvasStateSnapshot,
  opts: ImportCanvasStateOptions = {},
): void {
  if (snapshot.version > CANVAS_STATE_VERSION) {
    throw new Error(
      `importCanvasState: snapshot version ${snapshot.version} is newer than the ` +
        `supported version ${CANVAS_STATE_VERSION}. Upgrade @invana/canvas to import it.`,
    );
  }

  const { definition, interaction } = snapshot.view;

  // 1. Bulk data first — layouts / renderers / dependent layers can then read it.
  //    `redraw()` forces a full re-render straight from store state after the
  //    load, so the restore never depends on the incremental `node:add` event
  //    path (self-heals any render desync — e.g. loading over a just-cleared layer).
  for (const layer of canvas.layers.list()) {
    const ser = asDataSerializable(layer);
    if (ser && Object.prototype.hasOwnProperty.call(snapshot.data, layer.id)) {
      ser.importData(snapshot.data[layer.id]);
      layer.redraw();
    }
  }

  // 2a. Option slices → registered instances (resolved by id → setOptions), and
  //     into `definition.{layers,behaviours,layouts,activeLayout}`. Storing
  //     `activeLayout` records which layout is active *without* running it.
  canvas.update({
    layers: definition.layers,
    behaviours: definition.behaviours,
    layouts: definition.layouts,
    ...(definition.activeLayout !== null ? { activeLayout: definition.activeLayout } : {}),
  });

  // 2b. Scene / templates / theme aren't part of `CanvasConfig` — write them to
  //     the definition directly. Deep-cloned so the store owns fresh objects.
  canvas.store.view.update((s) => {
    s.definition.canvas = jsonClone(definition.canvas);
    s.definition.templates = jsonClone(definition.templates);
    s.definition.theme = jsonClone(definition.theme);
  }, 'canvas:importState:scene');

  // 3. Interaction (ephemeral live view). Camera goes through the action so the
  //    Camera adapter applies it to the renderer viewport.
  if (!opts.skipInteraction) {
    canvas.store.view.update((s) => {
      s.interaction.selection = new Set(interaction.selection);
      s.interaction.hover = interaction.hover;
      s.interaction.states = arraysToSets(interaction.states);
      s.interaction.focus = interaction.focus
        ? { ids: new Set(interaction.focus.ids), dim: interaction.focus.dim }
        : null;
      s.interaction.transientPins = new Set(interaction.transientPins);
      s.interaction.viewMode = interaction.viewMode;
    }, 'canvas:importState:interaction');
    canvas.store.actions.camera.set({ ...interaction.camera });
  }
}

/** Anything the file-I/O helpers accept as a source of a {@link CanvasStateSnapshot}. */
export type CanvasStateSource = CanvasStateSnapshot | string | File | Blob;

/**
 * The current canvas state as a JSON string (pretty-printed by default). Sugar
 * over `JSON.stringify(exportCanvasState(canvas), null, space)`.
 */
export function canvasStateToJSON(canvas: Canvas, space: string | number = 2): string {
  return JSON.stringify(exportCanvasState(canvas), null, space);
}

/** Create an object URL for `blob`, click a temporary `<a download>`, and revoke it. */
function triggerBlobDownload(blob: Blob, filename: string): void {
  if (typeof document === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the click's navigation has started.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Serialise the canvas's full state and trigger a browser download of the
 * `.json` file. Framework-agnostic (no React) — the file counterpart to
 * {@link exportCanvasState}. No-op outside a DOM environment.
 */
export function downloadCanvasState(canvas: Canvas, filename = 'canvas-state.json'): void {
  const blob = new Blob([JSON.stringify(exportCanvasState(canvas))], {
    type: 'application/json',
  });
  triggerBlobDownload(blob, filename);
}

/** Resolve any {@link CanvasStateSource} down to a parsed {@link CanvasStateSnapshot}. */
async function toSnapshot(source: CanvasStateSource): Promise<CanvasStateSnapshot> {
  if (typeof source === 'string') return JSON.parse(source) as CanvasStateSnapshot;
  if (source instanceof Blob) return JSON.parse(await source.text()) as CanvasStateSnapshot;
  return source;
}

/**
 * Restore the canvas from a snapshot, a JSON string, or a picked `File` / `Blob`
 * (e.g. from an `<input type="file">`) — the file counterpart to
 * {@link importCanvasState}. Parses `source` then delegates to
 * {@link importCanvasState} (same registered-instances requirement).
 */
export async function importCanvasStateFromFile(
  canvas: Canvas,
  source: CanvasStateSource,
  opts?: ImportCanvasStateOptions,
): Promise<void> {
  importCanvasState(canvas, await toSnapshot(source), opts);
}
