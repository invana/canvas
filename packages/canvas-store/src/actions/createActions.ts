import type { LayerData, NodeRecord, EdgeRecord, GroupRecord, AnnotationRecord } from '../data/LayerData';
import type { CanvasEventBus } from '../events/CanvasEventBus';
import type { ReactiveStore } from '../port/types';
import type { CanvasView } from '../view/CanvasView';

/** Loose option/patch bag for the view's per-instance config. */
type Bag = Record<string, unknown>;
/** Partial camera transform. */
type CameraInput = Partial<{ x: number; y: number; zoom: number }>;

/**
 * `createActions` — the **named, action-typed command API** over the kernel.
 *
 * Every mutation is a discoverable method (not a raw `view.update(recipe, …)`),
 * and each **bakes in its action label** (`'view:layer:setStyle'`, `'view:camera:zoom'`, …),
 * so telemetry, history, and the CRDT op-log all read as intent. View commands go
 * through the one `view.update(recipe, action)` seam; data commands proxy to the
 * target {@link LayerData}.
 *
 * Group by concern: `node / edge / group / annotation / positions` (data) and
 * `layers / behaviours / layouts / camera / selection / hover / templates / theme`
 * (view).
 */
export function createActions(
  view: ReactiveStore<CanvasView>,
  layer: (id: string) => LayerData,
  events: CanvasEventBus,
) {
  // ── view helper: every command names its action ─────────────────────────────
  const v = (action: string, recipe: (s: CanvasView) => void): void => view.update(recipe, action);
  const mergeInto = (bag: Bag | undefined, patch: Bag): Bag => ({ ...(bag ?? {}), ...patch });
  // ── data helper: emit the GRANULAR taxonomy event (e.g. 'data:node:add') on the
  //    tap — one per action (the per-frame 'data:flush' delta is separate). ─────
  const di = (type: string, layerId: string, ids: readonly string[]): void =>
    events.publish(type, { action: type, layerId, ids }, { kind: 'data', id: layerId });

  return {
    // ── DATA (proxy to the layer's bulk store + an intent record) ─────────────
    node: {
      add: (l: string, n: NodeRecord) => {
        layer(l).addNode(n);
        di('data:node:add', l, [n.id]);
      },
      update: (l: string, id: string, patch: Partial<NodeRecord>) => {
        layer(l).updateNode(id, patch);
        di('data:node:update', l, [id]);
      },
      remove: (l: string, id: string) => {
        layer(l).removeNode(id);
        di('data:node:remove', l, [id]);
      },
      moveTo: (l: string, id: string, x: number, y: number) => {
        layer(l).updateNode(id, { x, y });
        di('data:node:move', l, [id]);
      },
    },
    edge: {
      add: (l: string, e: EdgeRecord) => {
        layer(l).addEdge(e);
        di('data:edge:add', l, [e.id]);
      },
      update: (l: string, id: string, patch: Partial<EdgeRecord>) => {
        layer(l).updateEdge(id, patch);
        di('data:edge:update', l, [id]);
      },
      remove: (l: string, id: string) => {
        layer(l).removeEdge(id);
        di('data:edge:remove', l, [id]);
      },
    },
    group: {
      add: (l: string, g: GroupRecord) => {
        layer(l).addGroup(g);
        di('data:group:add', l, [g.id]);
      },
      update: (l: string, id: string, patch: Partial<GroupRecord>) => {
        layer(l).updateGroup(id, patch);
        di('data:group:update', l, [id]);
      },
      remove: (l: string, id: string) => {
        layer(l).removeGroup(id);
        di('data:group:remove', l, [id]);
      },
    },
    annotation: {
      add: (l: string, a: AnnotationRecord) => {
        layer(l).addAnnotation(a);
        di('data:annotation:add', l, [a.id]);
      },
      update: (l: string, id: string, patch: Partial<AnnotationRecord>) => {
        layer(l).updateAnnotation(id, patch);
        di('data:annotation:update', l, [id]);
      },
      remove: (l: string, id: string) => {
        layer(l).removeAnnotation(id);
        di('data:annotation:remove', l, [id]);
      },
    },
    /** Bulk layout output → node positions (transform-only re-render). */
    positions: {
      apply: (l: string, positions: Iterable<{ id: string; x: number; y: number }>) => {
        const arr = [...positions];
        layer(l).applyPositions(arr);
        di('data:position:apply', l, arr.map((p) => p.id));
      },
    },

    // ── VIEW · layers ─────────────────────────────────────────────────────────
    layers: {
      add: (id: string, opts: Bag) => v('view:layer:add', (s) => void (s.definition.layers[id] = opts)),
      update: (id: string, patch: Bag) =>
        v('view:layer:update', (s) => void (s.definition.layers[id] = mergeInto(s.definition.layers[id], patch))),
      setStyle: (id: string, style: Bag) =>
        v('view:layer:setStyle', (s) => void (s.definition.layers[id] = mergeInto(s.definition.layers[id], { style }))),
      setVisible: (id: string, visible: boolean) =>
        v('view:layer:setVisible', (s) => void (s.definition.layers[id] = mergeInto(s.definition.layers[id], { visible }))),
      remove: (id: string) => v('view:layer:remove', (s) => void delete s.definition.layers[id]),
    },

    // ── VIEW · behaviours ─────────────────────────────────────────────────────
    behaviours: {
      add: (id: string, opts: Bag) => v('view:behaviour:add', (s) => void (s.definition.behaviours[id] = opts)),
      update: (id: string, patch: Bag) =>
        v('view:behaviour:update', (s) => void (s.definition.behaviours[id] = mergeInto(s.definition.behaviours[id], patch))),
      enable: (id: string) =>
        v('view:behaviour:enable', (s) => void (s.definition.behaviours[id] = mergeInto(s.definition.behaviours[id], { enabled: true }))),
      disable: (id: string) =>
        v('view:behaviour:disable', (s) => void (s.definition.behaviours[id] = mergeInto(s.definition.behaviours[id], { enabled: false }))),
      remove: (id: string) => v('view:behaviour:remove', (s) => void delete s.definition.behaviours[id]),
    },

    // ── VIEW · layouts ────────────────────────────────────────────────────────
    layouts: {
      set: (id: string, opts: Bag) => v('view:layout:set', (s) => void (s.definition.layouts[id] = opts)),
      tune: (id: string, patch: Bag) =>
        v('view:layout:tune', (s) => void (s.definition.layouts[id] = mergeInto(s.definition.layouts[id], patch))),
      run: (id: string) => v('view:layout:run', (s) => void (s.definition.activeLayout = id)),
      remove: (id: string) =>
        v('view:layout:remove', (s) => {
          delete s.definition.layouts[id];
          if (s.definition.activeLayout === id) s.definition.activeLayout = null;
        }),
    },

    // ── VIEW · camera (interaction; abstract transform) ───────────────────────
    camera: {
      set: (c: CameraInput) => v('view:camera:set', (s) => void (s.interaction.camera = { ...s.interaction.camera, ...c })),
      pan: (dx: number, dy: number) =>
        v('view:camera:pan', (s) => {
          s.interaction.camera = {
            ...s.interaction.camera,
            x: s.interaction.camera.x + dx,
            y: s.interaction.camera.y + dy,
          };
        }),
      zoom: (factor: number) =>
        v('view:camera:zoom', (s) => void (s.interaction.camera = { ...s.interaction.camera, zoom: s.interaction.camera.zoom * factor })),
      zoomTo: (zoom: number) =>
        v('view:camera:zoomTo', (s) => void (s.interaction.camera = { ...s.interaction.camera, zoom })),
      reset: () => v('view:camera:reset', (s) => void (s.interaction.camera = { x: 0, y: 0, zoom: 1 })),
    },

    // ── VIEW · selection / hover (interaction) ────────────────────────────────
    selection: {
      set: (ids: Iterable<string>) => v('view:selection:set', (s) => void (s.interaction.selection = new Set(ids))),
      add: (ids: Iterable<string>) =>
        v('view:selection:add', (s) => void (s.interaction.selection = new Set([...s.interaction.selection, ...ids]))),
      toggle: (id: string) =>
        v('view:selection:toggle', (s) => {
          const next = new Set(s.interaction.selection);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          s.interaction.selection = next;
        }),
      clear: () => v('view:selection:clear', (s) => void (s.interaction.selection = new Set())),
    },
    hover: {
      set: (id: string) => v('view:hover:set', (s) => void (s.interaction.hover = id)),
      clear: () => v('view:hover:clear', (s) => void (s.interaction.hover = null)),
    },

    // ── VIEW · templates (e.g. node templates) ────────────────────────────────
    templates: {
      create: (template: unknown) =>
        v('view:template:create', (s) => void (s.definition.templates = [...s.definition.templates, template])),
      update: (id: string, patch: Bag) =>
        v('view:template:update', (s) => {
          s.definition.templates = s.definition.templates.map((t) =>
            (t as { id?: string }).id === id ? { ...(t as object), ...patch } : t,
          );
        }),
      remove: (id: string) =>
        v('view:template:remove', (s) => void (s.definition.templates = s.definition.templates.filter((t) => (t as { id?: string }).id !== id))),
    },

    // ── VIEW · theme ──────────────────────────────────────────────────────────
    theme: {
      set: (patch: Bag) => v('view:theme:set', (s) => void (s.definition.theme = { ...s.definition.theme, ...patch })),
    },
  };
}

/** The named, action-typed command API (see {@link createActions}). */
export type CanvasActions = ReturnType<typeof createActions>;
