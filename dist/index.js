import { createContext, forwardRef, useRef, useState, useEffect, useImperativeHandle, useContext, useCallback, useMemo, useSyncExternalStore, useLayoutEffect } from 'react';
import * as canvas from '@invana/canvas';
import { Canvas as Canvas$1, BackgroundLayer as BackgroundLayer$1, DevInfoLayer as DevInfoLayer$1, isViewLocked, setViewLocked } from '@invana/canvas';
import { jsx, jsxs, Fragment } from 'react/jsx-runtime';
import * as graph from '@invana/graph';
import { GraphCanvas as GraphCanvas$1, themeFamily, GraphClipboard, registerGraphEditCommands, clearGraphLayer, copySelection, cutSelection, deleteSelection, pasteAndSelect, resolveSelectMode, selectModePatch, DEFAULT_EDGE_TYPES, edgePathType, setEdgePathType, DEFAULT_EDGE_TYPE_LABELS } from '@invana/graph';
export { DEFAULT_EDGE_TYPES, DEFAULT_EDGE_TYPE_LABELS } from '@invana/graph';
import { useThemeOptional } from '@invana/themes';
export { bestRenderPreference, canUseWebGPU, hasWebGL, hasWebGPUApi, resolveRenderPreference } from '@invana/renderer-pixijs';
import * as contour from '@invana/graph-layer-d3-contour';
import * as maplibre from '@invana/graph-layer-maplibre';
import * as d3Force from '@invana/graph-layout-d3-force';
import * as elk from '@invana/graph-layout-elkjs';
import * as d3Sankey from '@invana/graph-layout-d3-sankey';
import { select } from '@invana/canvas-store';
import { Undo2, Redo2, Eraser, ClipboardPaste, Copy, Scissors, ZoomIn, ZoomOut, Maximize, Lock, LockOpen, Cable, Waypoints, Spline, CornerDownRight, Minus } from 'lucide-react';

// src/Canvas.tsx
var CanvasContext = createContext(null);
function useCanvas() {
  const canvas6 = useContext(CanvasContext);
  if (!canvas6) {
    throw new Error("useCanvas() must be called inside a <Canvas> component");
  }
  return canvas6;
}
function useCanvasEngine(makeInstance, engineOpts, config, ref) {
  const hostRef = useRef(null);
  const [canvas6, setCanvas] = useState(null);
  const optsRef = useRef(engineOpts);
  optsRef.current = engineOpts;
  const [remountNonce, setRemountNonce] = useState(0);
  const forcedPreferenceRef = useRef(void 0);
  useEffect(() => {
    const container = hostRef.current;
    if (!container) return;
    let cancelled = false;
    let offFallback;
    const instance = makeInstance(
      optsRef.current.telemetry ? { telemetry: optsRef.current.telemetry } : {}
    );
    const preference = forcedPreferenceRef.current ?? optsRef.current.preference;
    void instance.init({ container, ...optsRef.current, ...preference ? { preference } : {} }).then(() => {
      if (cancelled) {
        instance.destroy();
        return;
      }
      offFallback = instance.events.on("canvas:renderer:fallback", () => {
        forcedPreferenceRef.current = "webgl";
        setRemountNonce((n) => n + 1);
      });
      setCanvas(instance);
    }).catch((err) => {
      if (!cancelled) {
        console.error("[canvas-react] Canvas.init() failed:", err);
      }
    });
    return () => {
      cancelled = true;
      offFallback?.();
      setCanvas(null);
      if (instance.isInitialised) instance.destroy();
    };
  }, [remountNonce]);
  useEffect(() => {
    if (!canvas6 || !config) return;
    canvas6.update(config);
    for (const [id, opts] of Object.entries(config.behaviours ?? {})) {
      canvas6.behaviours.setEnabled(id, !!opts.enabled);
    }
  }, [canvas6, config]);
  useImperativeHandle(ref, () => canvas6, [canvas6]);
  return { canvas: canvas6, hostRef };
}
function CanvasHost({
  hostRef,
  className,
  style,
  children
}) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: hostRef,
      className,
      style: { width: "100%", height: "100%", position: "relative", ...style },
      children
    }
  );
}
var Canvas = forwardRef(function Canvas2({ children, style, className, config, ...engineOpts }, ref) {
  const { canvas: canvas6, hostRef } = useCanvasEngine(
    (opts) => new Canvas$1(opts),
    engineOpts,
    config,
    ref
  );
  return /* @__PURE__ */ jsx(CanvasHost, { hostRef, className, style, children: canvas6 && /* @__PURE__ */ jsx(CanvasContext.Provider, { value: canvas6, children }) });
});
var GraphCanvasContext = createContext(null);
function useGraphCanvas() {
  const gc = useContext(GraphCanvasContext);
  if (!gc) {
    throw new Error("useGraphCanvas() must be called inside a <Canvas> component");
  }
  return gc;
}
var ToolContext = createContext(null);
var ToolBindingContext = createContext(null);

// src/control-panels/ToolBinding.tsx
function ToolBinding() {
  const canvas6 = useCanvas();
  const bind = useContext(ToolBindingContext);
  useEffect(() => bind?.(canvas6), [bind, canvas6]);
  return null;
}
var GraphCanvas = forwardRef(function GraphCanvas2({ children, style, className, config, ...engineOpts }, ref) {
  const { canvas: canvas6, hostRef } = useCanvasEngine(
    (opts) => new GraphCanvas$1(opts),
    engineOpts,
    config,
    ref
  );
  return /* @__PURE__ */ jsx(CanvasHost, { hostRef, className, style, children: canvas6 && /* @__PURE__ */ jsx(CanvasContext.Provider, { value: canvas6, children: /* @__PURE__ */ jsxs(GraphCanvasContext.Provider, { value: canvas6, children: [
    /* @__PURE__ */ jsx(ToolBinding, {}),
    children
  ] }) }) });
});
function CanvasThemeSync({ behaviourId = "theme" }) {
  const canvas6 = useCanvas();
  const theme = useThemeOptional();
  const mode = theme ? theme.isDark ? "dark" : "light" : void 0;
  const active = theme ? themeFamily(theme.theme) : void 0;
  useEffect(() => {
    if (!mode) return;
    canvas6.update({ behaviours: { [behaviourId]: { mode, active } } });
  }, [canvas6, behaviourId, mode, active]);
  const toggleMode = theme?.toggleMode;
  const isDark = theme?.isDark ?? false;
  useEffect(() => {
    if (!toggleMode) return;
    return canvas6.commands.register("theme.toggle", {
      label: "Toggle theme",
      run: () => toggleMode(),
      isActive: () => isDark
    });
  }, [canvas6, toggleMode, isDark]);
  return null;
}
var ClipboardContext = createContext(null);
function useResolvedCanvas(explicit) {
  const fromContext = useContext(CanvasContext);
  const canvas6 = explicit ?? fromContext;
  if (!canvas6) {
    throw new Error(
      "Canvas hooks need a <Canvas> ancestor, or an explicit `canvas` argument."
    );
  }
  return canvas6;
}

// src/hooks/useGraphEditState.ts
function editStateOwner(canvas6) {
  const c = canvas6;
  return typeof c.clipboard === "function" ? c : null;
}
function providerEditAccess(canvas6, layerId, own) {
  const owner = editStateOwner(canvas6);
  return {
    clipboard: (id) => id === layerId ? own() : owner?.clipboard(id) ?? null
  };
}
function useOwnedEditState(canvas6, read) {
  const subscribe = useCallback(
    (onChange) => {
      if (!canvas6) return () => {
      };
      const offs = [canvas6.events.on("scene:layer:add", onChange), canvas6.events.on("scene:layer:remove", onChange)];
      return () => {
        for (const off of offs) off();
      };
    },
    [canvas6]
  );
  const get = useCallback(() => {
    const owner = canvas6 ? editStateOwner(canvas6) : null;
    return owner ? read(owner) : null;
  }, [canvas6, read]);
  return useSyncExternalStore(subscribe, get, get);
}
function useCanvasGraphClipboard(canvas6, layerId = "graph") {
  const read = useCallback((owner) => owner.clipboard(layerId), [layerId]);
  return useOwnedEditState(canvas6, read);
}
function useGraphClipboard(layerId = "graph", canvas6) {
  const fromProvider = useContext(ClipboardContext);
  const owned = useCanvasGraphClipboard(useResolvedCanvas(canvas6), layerId);
  return fromProvider ?? owned;
}
function GraphClipboardProvider({
  layerId = "graph",
  pasteOffset,
  canvas: canvas6,
  children
}) {
  const resolved = useResolvedCanvas(canvas6);
  const owned = useCanvasGraphClipboard(resolved, layerId);
  const [own, setOwn] = useState(null);
  const offsetX = pasteOffset?.x;
  const offsetY = pasteOffset?.y;
  useEffect(() => {
    if (!owned || offsetX === void 0 || offsetY === void 0) return;
    const prev = owned.offset;
    owned.setPasteOffset({ x: offsetX, y: offsetY });
    return () => owned.setPasteOffset(prev);
  }, [owned, offsetX, offsetY]);
  useEffect(() => {
    if (owned) return;
    const layer = resolved.layers.get(layerId);
    const store = layer?.store;
    if (!store) return;
    const offset = offsetX !== void 0 && offsetY !== void 0 ? { x: offsetX, y: offsetY } : void 0;
    const instance = new GraphClipboard(store, offset ? { pasteOffset: offset } : {});
    setOwn(instance);
    return () => setOwn(null);
  }, [resolved, layerId, offsetX, offsetY, owned]);
  useEffect(() => {
    if (!own) return;
    const commands = resolved.commands;
    const offs = [
      registerGraphEditCommands(commands, providerEditAccess(resolved, layerId, () => own), {
        layerId,
        only: ["clipboard.cut", "clipboard.copy", "clipboard.paste", "clipboard.delete", "graph.erase"]
      }),
      // The buffer isn't in the view store: tell bound controls it changed.
      own.events.on("change", () => commands.invalidate())
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [own, resolved, layerId]);
  return /* @__PURE__ */ jsx(ClipboardContext.Provider, { value: owned ?? own, children });
}
function readTool(canvas6) {
  const { viewMode, viewModeArgs } = canvas6.store.view.getState().interaction;
  return { tool: viewMode, nodeKind: viewModeArgs.nodeKind };
}
function GraphToolProvider({
  defaultTool = "select",
  defaultNodeKind = "circle",
  escapeToSelect = true,
  children
}) {
  const [tool, setLocalTool] = useState(defaultTool);
  const [nodeKind, setLocalNodeKind] = useState(defaultNodeKind);
  const [bound, setBound] = useState(null);
  const latest = useRef({ tool, nodeKind });
  latest.current = { tool, nodeKind };
  const bind = useCallback((canvas6) => {
    const seed = latest.current;
    canvas6.store.actions.viewMode.set(seed.tool, {
      ...canvas6.store.view.getState().interaction.viewModeArgs,
      nodeKind: seed.nodeKind
    });
    setBound(canvas6);
    return () => setBound((cur) => cur === canvas6 ? null : cur);
  }, []);
  useEffect(() => {
    if (!bound) return;
    const sync = () => {
      const next = readTool(bound);
      setLocalTool(next.tool);
      if (next.nodeKind !== void 0) setLocalNodeKind(next.nodeKind);
    };
    sync();
    return bound.store.view.subscribe((state, prev) => {
      if (state.interaction.viewMode !== prev.interaction.viewMode || state.interaction.viewModeArgs !== prev.interaction.viewModeArgs) {
        sync();
      }
    });
  }, [bound]);
  const setTool = useCallback(
    (next) => {
      if (bound) bound.store.actions.viewMode.set(next);
      else setLocalTool(next);
    },
    [bound]
  );
  const setNodeKind = useCallback(
    (next) => {
      if (bound) bound.store.actions.viewMode.setArgs({ nodeKind: next });
      else setLocalNodeKind(next);
    },
    [bound]
  );
  useEffect(() => {
    if (!escapeToSelect) return;
    const onKey = (e) => {
      if (e.key === "Escape") setTool("select");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [escapeToSelect, setTool]);
  const value = useMemo(
    () => ({ tool, setTool, nodeKind, setNodeKind }),
    [tool, setTool, nodeKind, setNodeKind]
  );
  return /* @__PURE__ */ jsx(ToolBindingContext.Provider, { value: bind, children: /* @__PURE__ */ jsx(ToolContext.Provider, { value, children }) });
}
function GraphLayer2({ id = "graph", data, store, ...rest }) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new graph.GraphLayer({
      id,
      options: { ...rest, ...store ? { store } : {} }
    });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id]);
  useEffect(() => {
    if (data && layerRef.current) {
      layerRef.current.loadData(data);
    }
  }, [data]);
  return null;
}
function BackgroundLayer({ id = "background", ...options }) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new BackgroundLayer$1({ id, options });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id]);
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
  }, [optionsKey]);
  return null;
}
function DevInfoLayer({ id = "dev-info", zIndex, ...options }) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new DevInfoLayer$1({ id, zIndex, ...options });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id, zIndex]);
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
  }, [optionsKey]);
  return null;
}
function MiniMapLayer2({
  id = "minimap",
  graphLayerId = "graph",
  ...options
}) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new graph.MiniMapLayer({ id, options: { graphLayerId, ...options } });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id, graphLayerId]);
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
  }, [optionsKey]);
  return null;
}
function DensityContourFillLayer2({
  id = "density",
  graphLayerId = "graph",
  zIndex = -1,
  recomputeOnLayout = true,
  ...options
}) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new contour.DensityContourFillLayer({
      id,
      zIndex,
      options: { graphLayerId, ...options }
    });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    let offEnd;
    if (recomputeOnLayout) {
      offEnd = canvas6.events.on("layout:run:end", ({ id: layoutId, reason }) => {
        if (reason !== "settled") return;
        if (typeof recomputeOnLayout === "string" && layoutId !== recomputeOnLayout) return;
        layerRef.current?.recompute();
      });
    }
    return () => {
      offEnd?.();
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id, graphLayerId, zIndex, recomputeOnLayout]);
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setOptions(options);
    layer.recompute();
  }, [optionsKey]);
  return null;
}
function DensityContourStrokeLayer2({
  id = "density-stroke",
  graphLayerId = "graph",
  zIndex = -1,
  recomputeOnLayout = true,
  ...options
}) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new contour.DensityContourStrokeLayer({
      id,
      zIndex,
      options: { graphLayerId, ...options }
    });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    let offEnd;
    if (recomputeOnLayout) {
      offEnd = canvas6.events.on("layout:run:end", ({ id: layoutId, reason }) => {
        if (reason !== "settled") return;
        if (typeof recomputeOnLayout === "string" && layoutId !== recomputeOnLayout) return;
        layerRef.current?.recompute();
      });
    }
    return () => {
      offEnd?.();
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id, graphLayerId, zIndex, recomputeOnLayout]);
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    layer.setOptions(options);
    layer.recompute();
  }, [optionsKey]);
  return null;
}
function MapLayer2({ id = "map", zIndex = -100, ...options }) {
  const canvas6 = useCanvas();
  const layerRef = useRef(null);
  useEffect(() => {
    const layer = new maplibre.MapLayer({ id, zIndex, options });
    canvas6.layers.add(layer);
    layerRef.current = layer;
    return () => {
      canvas6.layers.remove(id);
      layerRef.current = null;
    };
  }, [canvas6, id, zIndex]);
  const optionsKey = useMemo(() => JSON.stringify(options), [options]);
  useEffect(() => {
    layerRef.current?.setOptions(options);
  }, [optionsKey]);
  return null;
}

// src/control-panels/slots.ts
var registries = /* @__PURE__ */ new WeakMap();
function controlPanelSlots(canvas6) {
  let slots = registries.get(canvas6);
  if (slots) return slots;
  const nodes = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  const notify = () => {
    for (const l of [...listeners]) l();
  };
  slots = {
    set(name, node) {
      nodes.set(name, node);
      notify();
    },
    delete(name, node) {
      if (nodes.get(name) !== node) return;
      nodes.delete(name);
      notify();
    },
    get: (name) => nodes.get(name),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
  registries.set(canvas6, slots);
  return slots;
}

// src/control-panels/ControlPanel.tsx
function ControlPanel({ id, items, children, ...layout }) {
  const canvas6 = useCanvas();
  const hasChildren = children !== void 0 && children !== null && children !== false;
  const spec = {
    kind: "control-panel",
    ...layout,
    items: [...items ?? [], ...hasChildren ? [{ type: "slot", slot: id, key: "children" }] : []]
  };
  const specKey = JSON.stringify(spec);
  useEffect(() => () => canvas6.store.actions.controlPanels.remove(id), [canvas6, id]);
  useEffect(() => {
    canvas6.store.actions.controlPanels.add(id, JSON.parse(specKey));
  }, [canvas6, id, specKey]);
  useEffect(() => {
    if (!hasChildren) return;
    const slots = controlPanelSlots(canvas6);
    slots.set(id, children);
    return () => slots.delete(id, children);
  }, [canvas6, id, hasChildren, children]);
  return null;
}
function useBehaviourRegistration(create, id, enabled, identity) {
  const canvas6 = useCanvas();
  useEffect(() => {
    const behaviour = create();
    canvas6.behaviours.register(behaviour);
    return () => {
      canvas6.behaviours.unregister(id);
    };
  }, [canvas6, ...identity]);
  useEffect(() => {
    canvas6.behaviours.setEnabled(id, enabled);
  }, [canvas6, enabled, ...identity]);
}

// src/behaviours/DragPanBehaviour.tsx
function DragPanBehaviour2({ id = "pan", enabled = true, ...rest }) {
  useBehaviourRegistration(
    () => new canvas.DragPanBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id]
  );
  return null;
}
function WheelZoomBehaviour2({
  id = "zoom",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new canvas.WheelZoomBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id]
  );
  return null;
}
function PinchZoomBehaviour2({
  id = "pinch",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new canvas.PinchZoomBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id]
  );
  return null;
}
function KeyboardCameraInputBehaviour2({
  id = "keyboard-camera",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new canvas.KeyboardCameraInputBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id]
  );
  return null;
}
function KeyboardShortcutsBehaviour2({ id = "keyboard-shortcuts", enabled = true, ...rest }) {
  useBehaviourRegistration(() => new canvas.KeyboardShortcutsBehaviour({ id, enabled, ...rest }), id, enabled, [id]);
  return null;
}
function DragNodeBehaviour2({
  id = "drag-node",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.DragNodeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function ContextMenuBehaviour2({
  id = "context-menu",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  const canvas6 = useCanvas();
  useBehaviourRegistration(
    () => new graph.ContextMenuBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  const { onContextMenu } = rest;
  useEffect(() => {
    canvas6.behaviours.get(id)?.setOptions({ onContextMenu });
  }, [canvas6, id, onContextMenu]);
  return null;
}
function CreateNodeBehaviour2({
  id = "create-node",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.CreateNodeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function DrawEdgeBehaviour2({
  id = "draw-edge",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.DrawEdgeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function EraseBehaviour2({
  id = "erase",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.EraseBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function HoverActivateBehaviour2({
  id = "hover",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.HoverActivateBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  const canvas6 = useCanvas();
  const { degree } = rest;
  useEffect(() => {
    if (degree === void 0) return;
    canvas6.behaviours.get(id)?.setOptions({ degree });
  }, [canvas6, id, degree]);
  return null;
}
function ClickSelectBehaviour2({
  id = "click-select",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.ClickSelectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function ClickInspectBehaviour2({
  id = "click-inspect",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.ClickInspectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function useBehaviourInstance(id, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const subscribe = useCallback(
    (onChange) => {
      const onScene = (e) => {
        if (e.id === id) onChange();
      };
      const offs = [
        resolved.events.on("scene:behaviour:register", onScene),
        resolved.events.on("scene:behaviour:unregister", onScene)
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved, id]
  );
  const read = useCallback(() => resolved.behaviours.get(id) ?? null, [resolved, id]);
  return useSyncExternalStore(subscribe, read, read);
}

// src/hooks/useViewTarget.ts
function useViewTarget(options = {}, canvas6) {
  const { viewId = "click-view" } = options;
  const behaviour = useBehaviourInstance(viewId, canvas6);
  const [target, setTarget] = useState(null);
  useEffect(() => {
    setTarget(behaviour?.getTarget() ?? null);
    if (!behaviour) return;
    return behaviour.events.on("view:change", setTarget);
  }, [behaviour]);
  return target;
}

// src/hooks/useViewData.ts
function toDisplayMap(data) {
  if (!data || typeof data !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === void 0) continue;
    out[k] = v;
  }
  return out;
}
function useViewData(options = {}, canvas6) {
  const { layerId = "graph", viewId = "click-view" } = options;
  const resolved = useResolvedCanvas(canvas6);
  const single = useViewTarget({ viewId }, canvas6);
  if (!single) return null;
  const layer = resolved.layers.get(layerId);
  const store = layer?.store;
  if (!layer || !store) return null;
  if (single.kind === "node") {
    const node = store.getNode(single.id);
    if (!node) return null;
    const label2 = layer.resolveNodeStyle(node).labelText ?? "";
    const result2 = { kind: "node", id: single.id, label: label2, data: toDisplayMap(node.data) };
    const type2 = node.type;
    if (type2) result2.type = type2;
    return result2;
  }
  const edge = store.getEdge(single.id);
  if (!edge) return null;
  const label = layer.resolveEdgeStyle(edge).labelText ?? "";
  const result = {
    kind: "edge",
    id: single.id,
    label,
    data: toDisplayMap(edge.data),
    source: edge.source,
    target: edge.target
  };
  const type = edge.type;
  if (type) result.type = type;
  return result;
}

// src/hooks/useViewContext.ts
function useViewContext(options = {}, canvas6) {
  const { layerId = "graph", viewId = "click-view" } = options;
  const resolved = useResolvedCanvas(canvas6);
  const data = useViewData(options, canvas6);
  if (!data) return null;
  const layer = resolved.layers.get(layerId);
  if (!layer) return null;
  const store = layer.store;
  const close = () => resolved.behaviours.get(viewId)?.clear();
  const ctx = { ...data, canvas: resolved, layer, store, close };
  if (data.kind === "node") {
    const node = store.getNode(data.id);
    if (node) ctx.node = node;
  } else {
    const edge = store.getEdge(data.id);
    if (edge) ctx.edge = edge;
  }
  return ctx;
}
function ClickViewBehaviour2({
  id = "click-view",
  targetLayerId = "graph",
  enabled = true,
  panel,
  onView,
  onClick,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.ClickViewBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  const notify = onView ?? onClick;
  return panel || notify ? /* @__PURE__ */ jsx(
    ClickViewSurface,
    {
      viewId: id,
      layerId: targetLayerId,
      ...panel ? { panel } : {},
      ...notify ? { onView: notify } : {}
    }
  ) : null;
}
function ClickViewSurface({
  viewId,
  layerId,
  panel,
  onView
}) {
  const ctx = useViewContext({ layerId, viewId });
  const key = ctx ? `${ctx.kind}:${ctx.id}` : null;
  const onViewRef = useRef(onView);
  onViewRef.current = onView;
  useEffect(() => {
    onViewRef.current?.(ctx);
  }, [key]);
  return panel && ctx ? /* @__PURE__ */ jsx(Fragment, { children: panel(ctx) }) : null;
}
function useHoverElementPreview(options = {}, canvas6) {
  const { previewId = "element-preview" } = options;
  const behaviour = useBehaviourInstance(previewId, canvas6);
  const [snapshot, setSnapshot] = useState(null);
  useEffect(() => {
    setSnapshot(behaviour?.current ?? null);
    if (!behaviour) return;
    const offs = [
      behaviour.events.on("preview:show", setSnapshot),
      behaviour.events.on("preview:move", setSnapshot),
      behaviour.events.on("preview:hide", () => setSnapshot(null))
    ];
    return () => offs.forEach((off) => off());
  }, [behaviour]);
  return snapshot;
}
function HoverElementPreviewBehaviour2({
  id = "element-preview",
  targetLayerId = "graph",
  enabled = true,
  gap,
  offsetX,
  offsetY,
  edgeMargin,
  zIndex,
  renderNode,
  renderEdge,
  renderCard,
  ...rest
}) {
  const canvas6 = useCanvas();
  useBehaviourRegistration(
    () => new graph.HoverElementPreviewBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  const {
    targets,
    openDelay,
    closeDelay,
    placement,
    interactive,
    enable,
    card,
    cards,
    onShow,
    onHide
  } = rest;
  useEffect(() => {
    canvas6.behaviours.get(id)?.setOptions({
      targets,
      openDelay,
      closeDelay,
      placement,
      interactive,
      enable,
      card,
      cards,
      onShow,
      onHide
    });
  }, [
    canvas6,
    id,
    targets,
    openDelay,
    closeDelay,
    placement,
    interactive,
    enable,
    card,
    cards,
    onShow,
    onHide
  ]);
  const snapshot = useHoverElementPreview({ previewId: id });
  if (!snapshot) return null;
  let content;
  if (renderCard) {
    content = renderCard(snapshot);
  } else if (snapshot.kind === "node" && renderNode) {
    content = renderNode(snapshot.node, snapshot);
  } else if (snapshot.kind === "edge" && renderEdge) {
    content = renderEdge(snapshot.edge, snapshot);
  } else {
    return null;
  }
  if (!content) return null;
  return /* @__PURE__ */ jsx(
    PreviewShell,
    {
      snapshot,
      previewId: id,
      interactive: interactive ?? true,
      gap,
      offsetX,
      offsetY,
      edgeMargin,
      zIndex,
      children: content
    }
  );
}
function PreviewShell({
  snapshot,
  previewId,
  interactive,
  gap = 12,
  offsetX = 0,
  offsetY = 0,
  edgeMargin = 8,
  zIndex = 1e3,
  children
}) {
  const canvas6 = useCanvas();
  const ref = useRef(null);
  const { screen, placement } = snapshot;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const parent = el.offsetParent ?? null;
    const W = parent?.clientWidth ?? window.innerWidth;
    const H = parent?.clientHeight ?? window.innerHeight;
    const cw = el.offsetWidth;
    const ch = el.offsetHeight;
    let place = placement;
    if (place === "auto") place = screen.y < H / 2 ? "bottom" : "top";
    let left;
    let top;
    switch (place) {
      case "bottom":
        left = screen.x - cw / 2;
        top = screen.y + gap;
        break;
      case "left":
        left = screen.x - cw - gap;
        top = screen.y - ch / 2;
        break;
      case "right":
        left = screen.x + gap;
        top = screen.y - ch / 2;
        break;
      case "top-left":
        left = screen.x - cw - gap;
        top = screen.y - ch - gap;
        break;
      case "top-right":
        left = screen.x + gap;
        top = screen.y - ch - gap;
        break;
      case "bottom-left":
        left = screen.x - cw - gap;
        top = screen.y + gap;
        break;
      case "bottom-right":
        left = screen.x + gap;
        top = screen.y + gap;
        break;
      case "top":
      default:
        left = screen.x - cw / 2;
        top = screen.y - ch - gap;
        break;
    }
    left += offsetX;
    top += offsetY;
    left = Math.max(edgeMargin, Math.min(left, W - cw - edgeMargin));
    top = Math.max(edgeMargin, Math.min(top, H - ch - edgeMargin));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
  }, [screen.x, screen.y, placement, gap, offsetX, offsetY, edgeMargin]);
  const hold = interactive ? () => canvas6.behaviours.get(previewId)?.holdOpen() : void 0;
  const release = interactive ? () => canvas6.behaviours.get(previewId)?.releaseHold() : void 0;
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: `absolute ${interactive ? "pointer-events-auto select-text" : "pointer-events-none select-none"}`,
      style: { zIndex },
      onPointerEnter: hold,
      onPointerLeave: release,
      children
    }
  );
}
function ColorByBehaviour2({
  id = "color-by",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.ColorByBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function ThemeBehaviour2({ id = "theme", enabled = true, ...rest }) {
  useBehaviourRegistration(
    () => new graph.ThemeBehaviour({ id, enabled, ...rest }),
    id,
    enabled,
    [id]
  );
  return null;
}
function BrushSelectBehaviour2({
  id = "brush-select",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.BrushSelectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function LassoSelectBehaviour2({
  id = "lasso-select",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.LassoSelectBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function CollapseExpandBehaviour2({
  id = "collapse-expand",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.CollapseExpandBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function NodeResizeBehaviour2({
  id = "node-resize",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.NodeResizeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function LabelCollisionBehaviour2({
  id = "label-collision",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.LabelCollisionBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function TextResolutionLODBehaviour2({
  id = "label-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.TextResolutionLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function EntranceBehaviour2({
  id = "entrance",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.EntranceBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function NodeScaleLODBehaviour2({
  id = "node-scale-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.NodeScaleLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function EdgeScaleLODBehaviour2({
  id = "edge-scale-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.EdgeScaleLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function ParallelEdgeBehaviour2({
  id = "parallel-edge",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.ParallelEdgeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function FocusBehaviour2({ id = "focus", targetLayerId = "graph", enabled = true, ...rest }) {
  useBehaviourRegistration(
    () => new graph.FocusBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function FisheyeBehaviour2({
  id = "fisheye",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.FisheyeBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function NodeCentralityBehaviour2({
  id = "node-centrality",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.NodeCentralityBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function NodeLabelLODBehaviour2({
  id = "node-label-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.NodeLabelLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function EdgeLabelLODBehaviour2({
  id = "edge-label-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.EdgeLabelLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function IconLODBehaviour2({
  id = "icon-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.IconLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function ImageLODBehaviour2({
  id = "image-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.ImageLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function EdgeLODBehaviour2({
  id = "edge-lod",
  targetLayerId = "graph",
  enabled = true,
  ...rest
}) {
  useBehaviourRegistration(
    () => new graph.EdgeLODBehaviour({ id, targetLayerId, enabled, ...rest }),
    id,
    enabled,
    [id, targetLayerId]
  );
  return null;
}
function D3ForceLayout2({
  id,
  targetLayerId = "graph",
  fitPadding = 80,
  options
}) {
  const canvas6 = useCanvas();
  useEffect(() => {
    const layer = canvas6.layers.get(targetLayerId);
    if (!layer) {
      console.warn(
        `[canvas-react] <D3ForceLayout> could not find layer "${targetLayerId}". Make sure the corresponding <GraphLayer> is mounted earlier in the JSX tree.`
      );
      return;
    }
    const layout = new d3Force.D3ForceLayout({
      ...options ?? {},
      ...id ? { id, targetLayerId } : {}
    });
    if (fitPadding != null) {
      layout.events.on("end", ({ reason }) => {
        if (reason === "stopped") return;
        if (layout.runOptions.preserveCamera) return;
        if (layout.runOptions.fitCamera) return;
        if (canvas6.autoFitArmed) return;
        canvas6.camera.fitContent(layer.getBounds(), fitPadding);
      });
    }
    if (id) {
      canvas6.layouts.add(layout);
      return () => {
        canvas6.layouts.remove(id);
      };
    }
    void layout.apply(layer);
    return () => {
      layout.stop();
    };
  }, [canvas6, id, targetLayerId]);
  return null;
}
function ElkLayout2({
  id,
  targetLayerId = "graph",
  fitPadding = 80,
  options
}) {
  const canvas6 = useCanvas();
  useEffect(() => {
    const layer = canvas6.layers.get(targetLayerId);
    if (!layer) {
      console.warn(
        `[canvas-react] <ElkLayout> could not find layer "${targetLayerId}". Make sure the corresponding <GraphLayer> is mounted earlier in the JSX tree.`
      );
      return;
    }
    const layout = new elk.ElkLayout({
      ...options ?? {},
      ...id ? { id, targetLayerId } : {}
    });
    if (fitPadding != null) {
      layout.events.on("end", ({ reason }) => {
        if (reason === "stopped") return;
        if (layout.runOptions.preserveCamera) return;
        if (layout.runOptions.fitCamera) return;
        if (canvas6.autoFitArmed) return;
        requestAnimationFrame(() => canvas6.fitView(fitPadding));
      });
    }
    if (id) {
      canvas6.layouts.add(layout);
      return () => {
        canvas6.layouts.remove(id);
      };
    }
    void layout.apply(layer);
    return () => {
      layout.stop();
    };
  }, [canvas6, id, targetLayerId]);
  return null;
}
function D3SankeyLayout2({
  id,
  targetLayerId = "graph",
  fitPadding = 80,
  options
}) {
  const canvas6 = useCanvas();
  useEffect(() => {
    const layer = canvas6.layers.get(targetLayerId);
    if (!layer) {
      console.warn(
        `[canvas-react] <D3SankeyLayout> could not find layer "${targetLayerId}". Make sure the corresponding <GraphLayer> is mounted earlier in the JSX tree.`
      );
      return;
    }
    const layout = new d3Sankey.D3SankeyLayout({
      ...options ?? {},
      ...id ? { id, targetLayerId } : {}
    });
    if (fitPadding != null) {
      layout.events.on("end", ({ reason }) => {
        if (reason === "stopped") return;
        if (layout.runOptions.preserveCamera) return;
        if (layout.runOptions.fitCamera) return;
        if (canvas6.autoFitArmed) return;
        requestAnimationFrame(() => canvas6.fitView(fitPadding));
      });
    }
    if (id) {
      canvas6.layouts.add(layout);
      return () => {
        canvas6.layouts.remove(id);
      };
    }
    void layout.apply(layer);
    return () => {
      layout.stop();
    };
  }, [canvas6, id, targetLayerId]);
  return null;
}
var DEFAULT_ZOOM_STEP = 1.2;
function useCamera(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  return useMemo(() => {
    const camera = resolved.camera;
    return {
      zoomIn: (factor = DEFAULT_ZOOM_STEP) => camera.zoomAt(factor),
      zoomOut: (factor = DEFAULT_ZOOM_STEP) => camera.zoomAt(1 / factor),
      setZoom: (scale) => camera.setZoom(scale),
      zoomTo: (scale, centerX, centerY) => camera.zoomAt(scale / camera.scale, centerX, centerY),
      pan: (dx, dy) => camera.pan(dx, dy),
      fitContent: (worldRect, padding) => camera.fitContent(worldRect, padding),
      getZoom: () => camera.scale
    };
  }, [resolved]);
}
function useZoom(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const { zoomIn, zoomOut, setZoom, zoomTo } = useCamera(resolved);
  const [zoom, setZoomState] = useState(() => resolved.camera.scale);
  useEffect(() => {
    setZoomState(resolved.camera.scale);
    return resolved.events.on("input:camera:zoom", ({ scale }) => setZoomState(scale));
  }, [resolved]);
  return { zoom, zoomIn, zoomOut, setZoom, zoomTo };
}
var DEFAULT_FIT_PADDING = 80;
function hasGetBounds(layer) {
  return typeof layer?.getBounds === "function";
}
function useFitContent(layerId, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const [hasContent, setHasContent] = useState(() => resolved.layers.has(layerId));
  useEffect(() => {
    const sync = () => setHasContent(resolved.layers.has(layerId));
    sync();
    const offAdded = resolved.events.on("scene:layer:add", sync);
    const offRemoved = resolved.events.on("scene:layer:remove", sync);
    return () => {
      offAdded();
      offRemoved();
    };
  }, [resolved, layerId]);
  const fitContent = useCallback(
    (padding = DEFAULT_FIT_PADDING) => {
      const layer = resolved.layers.get(layerId);
      if (hasGetBounds(layer)) {
        resolved.camera.fitContent(layer.getBounds(), padding);
      }
    },
    [resolved, layerId]
  );
  return { fitContent, hasContent };
}
function extFor(format) {
  return format === "svg" ? "svg" : format === "jpeg" ? "jpg" : format === "webp" ? "webp" : "png";
}
function triggerDownload(blob, filename) {
  if (typeof document === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
function useCanvasImageExport(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const toBlob = useCallback(
    (opts = {}) => resolved.export(opts),
    [resolved]
  );
  const download = useCallback(
    async (opts = {}) => {
      const { filename, ...exportOpts } = opts;
      const blob = await resolved.export(exportOpts);
      triggerDownload(blob, filename ?? `canvas.${extFor(exportOpts.format)}`);
    },
    [resolved]
  );
  return { toBlob, download };
}
function useCanvasStateJson(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const exportState = useCallback(() => resolved.exportState(), [resolved]);
  const toJSON = useCallback(
    (space = 2) => resolved.stateToJSON(space),
    [resolved]
  );
  const download = useCallback(
    (filename = "canvas-state.json") => resolved.downloadState(filename),
    [resolved]
  );
  const importState = useCallback(
    (source, opts) => resolved.importStateFrom(source, opts),
    [resolved]
  );
  return { export: exportState, toJSON, download, import: importState };
}
function useCanvasEvent(event, handler, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    return resolved.events.on(event, (payload) => handlerRef.current(payload));
  }, [resolved, event]);
}
var LAYER_EVENTS = /* @__PURE__ */ new Set([
  "group:visibility",
  "data:changed",
  "style:changed"
]);
function useGraphEvent(event, handler, opts = {}) {
  const resolved = useResolvedCanvas(opts.canvas);
  const layerId = opts.layerId ?? "graph";
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  useEffect(() => {
    const layer = resolved.layers.get(layerId);
    if (!layer) return;
    const emitter = LAYER_EVENTS.has(event) ? layer.events : layer.store.events;
    return emitter.on(
      event,
      (payload) => handlerRef.current(payload)
    );
  }, [resolved, layerId, event]);
}
function useStore(store, selector, isEqual) {
  const selected = useMemo(
    () => select(store, selector, isEqual),
    [store, selector, isEqual]
  );
  return useSyncExternalStore(selected.subscribe, selected.get, selected.get);
}
function useClearGraph(layerId, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const clear = useCallback(() => clearGraphLayer(resolved, layerId), [resolved, layerId]);
  return { clear };
}
function useSelection(options = {}, canvas6) {
  const { clickSelectId = "click-select" } = options;
  const resolved = useResolvedCanvas(canvas6);
  const [selectedNodeIds, setNodeIds] = useState([]);
  const [selectedEdgeIds, setEdgeIds] = useState([]);
  useEffect(() => {
    const behaviour = resolved.behaviours.get(clickSelectId);
    if (!behaviour) {
      setNodeIds([]);
      setEdgeIds([]);
      return;
    }
    setNodeIds(behaviour.getSelectedShapeIds());
    setEdgeIds(behaviour.getSelectedConnectorIds());
    return behaviour.events.on("selection:change", (snapshot) => {
      setNodeIds(snapshot.shapeIds);
      setEdgeIds(snapshot.connectorIds);
    });
  }, [resolved, clickSelectId]);
  const clear = useCallback(() => {
    resolved.behaviours.get(clickSelectId)?.clearSelection();
  }, [resolved, clickSelectId]);
  return {
    selectedNodeIds,
    selectedEdgeIds,
    count: selectedNodeIds.length + selectedEdgeIds.length,
    clear
  };
}
function useInspectTarget(options = {}, canvas6) {
  const { inspectId = "click-inspect" } = options;
  const behaviour = useBehaviourInstance(inspectId, canvas6);
  const [target, setTarget] = useState(null);
  useEffect(() => {
    setTarget(behaviour?.getTarget() ?? null);
    if (!behaviour) return;
    return behaviour.events.on("inspect:change", setTarget);
  }, [behaviour]);
  return target;
}
function hasRedraw(layer) {
  return typeof layer?.redraw === "function";
}
function useHistory(options = {}, canvas6) {
  const { layerId = "graph" } = options;
  const resolved = useResolvedCanvas(canvas6);
  const history = resolved.history;
  const subscribe = useCallback((onChange) => history.subscribe(onChange), [history]);
  const read = useCallback(() => (history.canUndo() ? 1 : 0) + (history.canRedo() ? 2 : 0), [history]);
  const flags = useSyncExternalStore(subscribe, read, read);
  const undo = useCallback(() => history.undo(), [history]);
  const redo = useCallback(() => history.redo(), [history]);
  const redraw = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    if (hasRedraw(layer)) layer.redraw();
  }, [resolved, layerId]);
  return { undo, redo, redraw, canUndo: (flags & 1) !== 0, canRedo: (flags & 2) !== 0 };
}
function usePlaybook(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const playbook = resolved.playbook;
  const version = useRef(0);
  const subscribe = useCallback(
    (onChange) => playbook.subscribe(() => {
      version.current++;
      onChange();
    }),
    [playbook]
  );
  const read = useCallback(() => version.current, []);
  const v = useSyncExternalStore(subscribe, read, read);
  return useMemo(
    () => ({
      playbook,
      title: playbook.title,
      steps: playbook.steps,
      current: playbook.current,
      index: playbook.index,
      canNext: playbook.index + 1 < playbook.steps.length,
      canPrevious: playbook.index >= 0,
      next: () => playbook.next(),
      previous: () => playbook.previous(),
      goTo: (stepId) => playbook.goTo(stepId)
    }),
    // `v` is the change signal; the playbook object itself is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playbook, v]
  );
}
function useHistoryEntries(filter, canvas6) {
  const history = useResolvedCanvas(canvas6).history;
  const actor = filter?.actor;
  const stepId = filter?.stepId;
  const cache = useRef(null);
  const version = useRef(0);
  const subscribe = useCallback(
    (onChange) => history.subscribe(() => {
      version.current++;
      onChange();
    }),
    [history]
  );
  const read = useCallback(() => {
    const key = `${version.current}\0${actor ?? ""}\0${stepId ?? ""}`;
    const hit = cache.current;
    if (hit && hit.key === key) return hit.entries;
    const entries = history.entries({
      ...actor !== void 0 ? { actor } : {},
      ...stepId !== void 0 ? { stepId } : {}
    });
    cache.current = { key, entries };
    return entries;
  }, [history, actor, stepId]);
  return useSyncExternalStore(subscribe, read, read);
}
function useGraphStore(layerId = "graph", canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const subscribe = useCallback(
    (onChange) => {
      const offAdd = resolved.events.on("scene:layer:add", ({ id }) => {
        if (id === layerId) onChange();
      });
      const offRemove = resolved.events.on("scene:layer:remove", ({ id }) => {
        if (id === layerId) onChange();
      });
      return () => {
        offAdd();
        offRemove();
      };
    },
    [resolved, layerId]
  );
  const read = useCallback(
    () => resolved.layers.get(layerId)?.store ?? null,
    [resolved, layerId]
  );
  return useSyncExternalStore(subscribe, read, read);
}
function useClipboard(options = {}, canvas6) {
  const { clickSelectId = "click-select", layerId = "graph" } = options;
  const resolved = useResolvedCanvas(canvas6);
  const clipboard = useGraphClipboard(layerId, resolved);
  const { count } = useSelection({ clickSelectId }, resolved);
  const [canPaste, setCanPaste] = useState(false);
  useEffect(() => {
    if (!clipboard) {
      setCanPaste(false);
      return;
    }
    setCanPaste(clipboard.hasContent);
    return clipboard.events.on("change", ({ hasContent }) => setCanPaste(hasContent));
  }, [clipboard]);
  const copy = useCallback(() => {
    if (clipboard) copySelection(resolved, clipboard, clickSelectId);
  }, [clipboard, resolved, clickSelectId]);
  const cut = useCallback(() => {
    if (clipboard) cutSelection(resolved, clipboard, clickSelectId);
  }, [clipboard, resolved, clickSelectId]);
  const remove = useCallback(() => {
    if (clipboard) deleteSelection(resolved, clipboard, clickSelectId);
  }, [clipboard, resolved, clickSelectId]);
  const paste = useCallback(() => {
    if (clipboard) pasteAndSelect(resolved, clipboard, clickSelectId);
  }, [clipboard, resolved, clickSelectId]);
  return { cut, copy, paste, remove, canPaste, hasSelection: count > 0 };
}
function useCommandStates(refs, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const subscribe = useCallback(
    (onChange) => {
      const offs = [resolved.store.view.subscribe(onChange), resolved.commands.subscribe(onChange)];
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved]
  );
  const getSnapshot = () => {
    const c = resolved.commands;
    return JSON.stringify(
      refs.map(({ command, args }) => ({
        available: c.has(command),
        enabled: c.isEnabled(command, args),
        active: c.isActive(command, args),
        value: c.value(command, args),
        options: c.options(command, args)
      }))
    );
  };
  const key = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const states = useMemo(() => JSON.parse(key), [key]);
  const run = useCallback((command, args) => resolved.commands.run(command, args), [resolved]);
  return { states, run };
}

// src/hooks/useGrid.ts
function useGrid(options = {}, canvas6) {
  const { backgroundLayerId = "background", patternType } = options;
  const resolved = useResolvedCanvas(canvas6);
  const args = useMemo(
    () => ({ layerId: backgroundLayerId, ...patternType ? { patternType } : {} }),
    [backgroundLayerId, patternType]
  );
  const refs = useMemo(() => [{ command: "background.grid", args }], [args]);
  const { states, run } = useCommandStates(refs, resolved);
  const showGrid = states[0]?.active ?? false;
  const setGrid = useCallback(
    (on) => {
      if (resolved.commands.isActive("background.grid", args) !== on) run("background.grid", args);
    },
    [resolved, run, args]
  );
  const toggleGrid = useCallback(() => void run("background.grid", args), [run, args]);
  return { showGrid, toggleGrid, setGrid };
}

// src/hooks/useLayoutRunning.ts
var selectLayoutRunning = (s) => s.runtime.layout.running;
function useLayoutRunning(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  return useStore(resolved.store.view, selectLayoutRunning);
}

// src/hooks/useLayout.ts
function useLayout(layouts, options = {}, canvas6) {
  const { layerId = "graph", fitPadding = 80 } = options;
  const resolved = useResolvedCanvas(canvas6);
  const keys = Object.keys(layouts);
  const [layout, setLayout] = useState(options.initial ?? keys[0] ?? "");
  const [localRunning, setRunning] = useState(false);
  const activeRef = useRef(null);
  const engineRunning = useLayoutRunning(canvas6);
  const isRunning = localRunning || engineRunning;
  const applyLayout = useCallback(
    (key) => {
      const factory = layouts[key];
      const layer = resolved.layers.get(layerId);
      if (!factory || !layer) return;
      activeRef.current?.stop?.();
      const instance = factory();
      activeRef.current = instance;
      setLayout(key);
      setRunning(true);
      Promise.resolve(instance.apply(layer)).then(() => {
        if (activeRef.current !== instance) return;
        resolved.camera.fitContent(layer.getBounds(), fitPadding);
        setRunning(false);
      }).catch(() => {
        if (activeRef.current === instance) setRunning(false);
      });
    },
    [layouts, resolved, layerId, fitPadding]
  );
  const stopLayout = useCallback(() => {
    const instance = activeRef.current;
    if (instance) {
      activeRef.current = null;
      instance.stop?.();
    }
    resolved.stopLayout();
    setRunning(false);
  }, [resolved]);
  const didInit = useRef(false);
  const applyInitial = options.applyInitial ?? true;
  useEffect(() => {
    if (didInit.current || !applyInitial || !layout) return;
    if (!resolved.layers.has(layerId)) return;
    didInit.current = true;
    applyLayout(layout);
  }, [resolved, layerId, layout, applyLayout, applyInitial]);
  const layoutOptions = options.labels ?? Object.fromEntries(keys.map((k) => [k, k]));
  return { layout, layoutOptions, applyLayout, stopLayout, isRunning };
}
var selectBehaviours = (s) => s.definition.behaviours;
function useSelectMode(behaviourIds, options = {}, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const keys = Object.keys(behaviourIds);
  const behaviours = useStore(resolved.store.view, selectBehaviours);
  const mode = useMemo(
    () => resolveSelectMode(behaviourIds, (id) => !!behaviours[id]?.enabled) ?? "",
    [behaviours, behaviourIds]
  );
  const setMode = useCallback(
    (next) => {
      resolved.update({ behaviours: selectModePatch(behaviourIds, next) });
    },
    [resolved, behaviourIds]
  );
  useEffect(() => {
    setMode(options.initial ?? keys[0] ?? "");
  }, [setMode]);
  const modeOptions = options.labels ?? Object.fromEntries(keys.map((k) => [k, k]));
  return { mode, modeOptions, setMode };
}
function useEdgeType(options = {}, canvas6) {
  const { layerId = "graph", initial, types = DEFAULT_EDGE_TYPES, labels } = options;
  const resolved = useResolvedCanvas(canvas6);
  const subscribe = useCallback(
    (onChange) => {
      let offStyle;
      const attach = () => {
        offStyle?.();
        offStyle = resolved.layers.get(layerId)?.events.on("style:changed", onChange);
        onChange();
      };
      attach();
      const offAdd = resolved.events.on("scene:layer:add", ({ id }) => {
        if (id === layerId) attach();
      });
      const offRemove = resolved.events.on("scene:layer:remove", ({ id }) => {
        if (id === layerId) attach();
      });
      return () => {
        offStyle?.();
        offAdd();
        offRemove();
      };
    },
    [resolved, layerId]
  );
  const read = useCallback(() => {
    const layer = resolved.layers.get(layerId);
    return (layer ? edgePathType(layer) : void 0) ?? null;
  }, [resolved, layerId]);
  const current = useSyncExternalStore(subscribe, read, read);
  const setEdgeType = useCallback(
    (next) => {
      const layer = resolved.layers.get(layerId);
      if (layer) setEdgePathType(layer, next);
    },
    [resolved, layerId]
  );
  const edgeTypeOptions = labels ?? Object.fromEntries(types.map((t) => [t, DEFAULT_EDGE_TYPE_LABELS[t] ?? t]));
  return { edgeType: current ?? initial ?? types[0] ?? "straight", edgeTypeOptions, setEdgeType };
}
function useLock(options = {}, canvas6) {
  const { behaviourIds, initialLocked = false } = options;
  const resolved = useResolvedCanvas(canvas6);
  const idsRef = useRef(behaviourIds);
  idsRef.current = behaviourIds;
  const subscribe = useCallback(
    (onChange) => {
      const offs = [
        resolved.events.on("scene:behaviour:enable", onChange),
        resolved.events.on("scene:behaviour:disable", onChange),
        resolved.events.on("scene:behaviour:register", onChange),
        resolved.events.on("scene:behaviour:unregister", onChange)
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [resolved]
  );
  const read = useCallback(() => isViewLocked(resolved, idsRef.current), [resolved]);
  const locked = useSyncExternalStore(subscribe, read, read);
  const setLock = useCallback((next) => setViewLocked(resolved, next, idsRef.current), [resolved]);
  const toggleLock = useCallback(() => setLock(!isViewLocked(resolved, idsRef.current)), [resolved, setLock]);
  useEffect(() => {
    if (initialLocked) setViewLocked(resolved, true, idsRef.current);
  }, [resolved]);
  return { locked, toggleLock, setLock };
}
var DEFAULT_NODE_KIND = "circle";
function useTool() {
  const provided = useContext(ToolContext);
  const canvas6 = useContext(CanvasContext);
  if (!provided && !canvas6) {
    throw new Error("useTool must be used within a <GraphToolProvider> or a canvas root.");
  }
  const fromStore = useStoreTool(provided ? null : canvas6);
  return provided ?? fromStore;
}
function useStoreTool(canvas6) {
  const subscribe = useCallback(
    (onChange) => canvas6 ? canvas6.store.view.subscribe((state, prev) => {
      if (state.interaction.viewMode !== prev.interaction.viewMode || state.interaction.viewModeArgs !== prev.interaction.viewModeArgs) {
        onChange();
      }
    }) : () => {
    },
    [canvas6]
  );
  const getMode = useCallback(() => canvas6 ? canvas6.store.view.getState().interaction.viewMode : null, [canvas6]);
  const getArgs = useCallback(() => canvas6 ? canvas6.store.view.getState().interaction.viewModeArgs : null, [canvas6]);
  const mode = useSyncExternalStore(subscribe, getMode, getMode);
  const args = useSyncExternalStore(subscribe, getArgs, getArgs);
  const setTool = useCallback((t) => canvas6?.store.actions.viewMode.set(t), [canvas6]);
  const setNodeKind = useCallback((k) => canvas6?.store.actions.viewMode.setArgs({ nodeKind: k }), [canvas6]);
  return useMemo(
    () => canvas6 && mode !== null ? { tool: mode, setTool, nodeKind: args?.nodeKind ?? DEFAULT_NODE_KIND, setNodeKind } : null,
    [canvas6, mode, args, setTool, setNodeKind]
  );
}

// src/hooks/useEntityEditor.ts
function toStringMap(data) {
  if (!data || typeof data !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(data)) {
    if (v === null || v === void 0) continue;
    out[k] = typeof v === "string" ? v : typeof v === "object" ? JSON.stringify(v) : String(v);
  }
  return out;
}
function useEntityEditor(options = {}, canvas6) {
  const { layerId = "graph", inspectId = "click-inspect", typeAsLabel = false } = options;
  const resolved = useResolvedCanvas(canvas6);
  const single = useInspectTarget({ inspectId }, canvas6);
  if (!single) return null;
  const layer = resolved.layers.get(layerId);
  const store = layer?.store;
  if (!layer || !store) return null;
  if (single.kind === "node") {
    const node = store.getNode(single.id);
    if (!node) return null;
    const label = layer.resolveNodeStyle(node).labelText ?? "";
    if (typeAsLabel) {
      const type2 = node.type ?? label;
      const commit3 = ({ type: nextType, data }) => {
        const value = nextType ?? "";
        const prior = node.style ?? {};
        const patch = { type: value, style: { ...prior, labelText: value }, data };
        store.batch(() => store.updateNode(single.id, patch), { title: "edit node" });
      };
      return { kind: "node", id: single.id, label: "", type: type2, data: toStringMap(node.data), commit: commit3 };
    }
    const commit2 = ({ label: nextLabel, data }) => {
      const prior = node.style ?? {};
      const patch = { style: { ...prior, labelText: nextLabel }, data };
      store.batch(() => store.updateNode(single.id, patch), { title: "edit node" });
    };
    return { kind: "node", id: single.id, label, data: toStringMap(node.data), commit: commit2 };
  }
  const edge = store.getEdge(single.id);
  if (!edge) return null;
  const edgeLabel = layer.resolveEdgeStyle(edge).labelText ?? "";
  const type = edge.type ?? (typeAsLabel ? edgeLabel : "");
  const commit = ({ type: nextType, data }) => {
    const value = nextType ?? "";
    const patch = { data };
    if (nextType !== void 0) patch.type = value;
    if (typeAsLabel) {
      const prior = edge.style ?? {};
      patch.style = { ...prior, labelText: value };
    }
    store.batch(() => store.updateEdge(single.id, patch), { title: "edit edge" });
  };
  const reverse = () => {
    const swap = { source: edge.target, target: edge.source };
    store.batch(() => store.updateEdge(single.id, swap), { title: "reverse edge" });
  };
  return {
    kind: "edge",
    id: single.id,
    label: "",
    type,
    data: toStringMap(edge.data),
    commit,
    reverse
  };
}
function useContextMenu() {
  const [menu, setMenu] = useState(null);
  const close = useCallback(() => setMenu(null), []);
  const open = useCallback((x, y, items) => {
    setMenu({ x, y, items });
  }, []);
  useEffect(() => {
    if (!menu) return;
    const onKey = (ev) => {
      if (ev.key === "Escape") close();
    };
    window.addEventListener("pointerdown", close);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", close);
      window.removeEventListener("keydown", onKey);
    };
  }, [menu, close]);
  return { menu, open, close };
}
function useCanvasMessage(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const [message, setMessage] = useState(null);
  const timer = useRef(null);
  useEffect(() => {
    const clearTimer = () => {
      if (timer.current !== null) {
        clearTimeout(timer.current);
        timer.current = null;
      }
    };
    const off = resolved.events.on("canvas:message:show", ({ text, timeout }) => {
      clearTimer();
      setMessage(text);
      if (text !== null && timeout && timeout > 0) {
        timer.current = setTimeout(() => setMessage(null), timeout);
      }
    });
    setMessage(resolved.currentMessage);
    return () => {
      clearTimer();
      off();
    };
  }, [resolved]);
  const showMessage = useCallback(
    (text, timeout) => resolved.showMessage(text, timeout),
    [resolved]
  );
  const clearMessage = useCallback(() => resolved.clearMessage(), [resolved]);
  return { message, showMessage, clearMessage };
}
function useGraphCanvasUpdate() {
  const canvas6 = useCanvas();
  return useCallback((patch, action) => canvas6.update(patch, action), [canvas6]);
}
var selectDefinition = (s) => s.definition;
function useGraphCanvasOptions() {
  const canvas6 = useCanvas();
  const definition = useStore(canvas6.store.view, selectDefinition);
  const options = useMemo(
    () => ({
      layers: definition.layers,
      behaviours: definition.behaviours,
      layouts: definition.layouts,
      ...definition.activeLayout !== null ? { activeLayout: definition.activeLayout } : {}
    }),
    [definition]
  );
  const update = useCallback((patch) => canvas6.update(patch), [canvas6]);
  return [options, update];
}
function useHistorySection(options = {}) {
  const { layerId, labels, canvas: canvas6 } = options;
  const { undo, redo, canUndo, canRedo } = useHistory(layerId ? { layerId } : {}, canvas6);
  return [
    { type: "button", key: "undo", icon: Undo2, label: labels?.undo ?? "Undo", onClick: undo, disabled: !canUndo },
    { type: "button", key: "redo", icon: Redo2, label: labels?.redo ?? "Redo", onClick: redo, disabled: !canRedo }
  ];
}
function useEditorSection(options = {}) {
  const { clickSelectId, layerId = "graph", canvas: canvas6, items } = options;
  const { cut, copy, paste, remove, canPaste, hasSelection } = useClipboard(
    clickSelectId ? { clickSelectId } : {},
    canvas6
  );
  const { clear } = useClearGraph(layerId, canvas6);
  const all = {
    cut: { type: "button", key: "cut", icon: Scissors, label: "Cut", onClick: cut, disabled: !hasSelection },
    copy: { type: "button", key: "copy", icon: Copy, label: "Copy", onClick: copy, disabled: !hasSelection },
    paste: { type: "button", key: "paste", icon: ClipboardPaste, label: "Paste", onClick: paste, disabled: !canPaste },
    erase: {
      type: "button",
      key: "erase",
      icon: Eraser,
      label: hasSelection ? "Erase selection" : "Clear canvas",
      ...hasSelection ? { text: "Selection" } : {},
      onClick: hasSelection ? remove : () => clear()
    }
  };
  const keys = items ?? ["cut", "copy", "paste", "erase"];
  return keys.map((k) => all[k]);
}
function useViewSection(options = {}) {
  const { showZoom = true, showLock = true, layerId = "graph", lockBehaviourIds, canvas: canvas6 } = options;
  const { zoomIn, zoomOut } = useZoom(canvas6);
  const { fitContent } = useFitContent(layerId, canvas6);
  const { locked, toggleLock } = useLock(
    lockBehaviourIds ? { behaviourIds: lockBehaviourIds } : {},
    canvas6
  );
  const items = [];
  if (showZoom) {
    items.push(
      { type: "button", key: "zoom-in", icon: ZoomIn, label: "Zoom in", onClick: () => zoomIn() },
      { type: "button", key: "zoom-out", icon: ZoomOut, label: "Zoom out", onClick: () => zoomOut() }
    );
  }
  items.push({ type: "button", key: "fit", icon: Maximize, label: "Fit to content", onClick: () => fitContent() });
  if (showLock) {
    items.push({
      type: "toggle",
      key: "lock",
      icon: LockOpen,
      activeIcon: Lock,
      label: "Lock view",
      activeLabel: "Unlock view",
      active: locked,
      onToggle: toggleLock
    });
  }
  return items;
}

// src/hooks/useLayoutsSection.ts
function useLayoutsSection(options) {
  const { layouts, label = "Layout", layerId, fitPadding, initial, labels, align, canvas: canvas6 } = options;
  const { layout, layoutOptions, applyLayout } = useLayout(
    layouts,
    {
      ...layerId ? { layerId } : {},
      ...fitPadding !== void 0 ? { fitPadding } : {},
      ...initial ? { initial } : {},
      ...labels ? { labels } : {}
    },
    canvas6
  );
  return [{ type: "select", key: "layout", label, value: layout, options: layoutOptions, onChange: applyLayout, align }];
}
var DEFAULT_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline,
  rounded: Waypoints,
  smooth: Cable
};
function useStyleEditorSection(options = {}) {
  const { layerId, label = "Edge", initial, types, labels, align, canvas: canvas6 } = options;
  const { edgeType, edgeTypeOptions, setEdgeType } = useEdgeType(
    {
      ...layerId ? { layerId } : {},
      ...initial ? { initial } : {},
      ...types ? { types } : {},
      ...labels ? { labels } : {}
    },
    canvas6
  );
  return [{ type: "select", key: "edge-type", label, value: edgeType, options: edgeTypeOptions, icons: DEFAULT_ICONS, onChange: setEdgeType, align, triggerLabelOnly: true }];
}
var selectControlPanels = (s) => s.definition.controlPanels;
function useControlPanels(canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  return useStore(resolved.store.view, selectControlPanels);
}
function useControlPanelSlot(name, canvas6) {
  const resolved = useResolvedCanvas(canvas6);
  const slots = controlPanelSlots(resolved);
  const get = useCallback(() => slots.get(name), [slots, name]);
  return useSyncExternalStore(slots.subscribe, get, get);
}

export { BackgroundLayer, BrushSelectBehaviour2 as BrushSelectBehaviour, Canvas, CanvasContext, CanvasThemeSync, ClickInspectBehaviour2 as ClickInspectBehaviour, ClickSelectBehaviour2 as ClickSelectBehaviour, ClickViewBehaviour2 as ClickViewBehaviour, ClipboardContext, CollapseExpandBehaviour2 as CollapseExpandBehaviour, ColorByBehaviour2 as ColorByBehaviour, ContextMenuBehaviour2 as ContextMenuBehaviour, ControlPanel, CreateNodeBehaviour2 as CreateNodeBehaviour, D3ForceLayout2 as D3ForceLayout, D3SankeyLayout2 as D3SankeyLayout, DensityContourFillLayer2 as DensityContourFillLayer, DensityContourStrokeLayer2 as DensityContourStrokeLayer, DevInfoLayer, DragNodeBehaviour2 as DragNodeBehaviour, DragPanBehaviour2 as DragPanBehaviour, DrawEdgeBehaviour2 as DrawEdgeBehaviour, EdgeLODBehaviour2 as EdgeLODBehaviour, EdgeLabelLODBehaviour2 as EdgeLabelLODBehaviour, EdgeScaleLODBehaviour2 as EdgeScaleLODBehaviour, ElkLayout2 as ElkLayout, EntranceBehaviour2 as EntranceBehaviour, EraseBehaviour2 as EraseBehaviour, FisheyeBehaviour2 as FisheyeBehaviour, FocusBehaviour2 as FocusBehaviour, GraphCanvas, GraphCanvasContext, GraphClipboardProvider, GraphLayer2 as GraphLayer, GraphToolProvider, HoverActivateBehaviour2 as HoverActivateBehaviour, HoverElementPreviewBehaviour2 as HoverElementPreviewBehaviour, IconLODBehaviour2 as IconLODBehaviour, ImageLODBehaviour2 as ImageLODBehaviour, KeyboardCameraInputBehaviour2 as KeyboardCameraInputBehaviour, KeyboardShortcutsBehaviour2 as KeyboardShortcutsBehaviour, LabelCollisionBehaviour2 as LabelCollisionBehaviour, LassoSelectBehaviour2 as LassoSelectBehaviour, MapLayer2 as MapLayer, MiniMapLayer2 as MiniMapLayer, NodeCentralityBehaviour2 as NodeCentralityBehaviour, NodeLabelLODBehaviour2 as NodeLabelLODBehaviour, NodeResizeBehaviour2 as NodeResizeBehaviour, NodeScaleLODBehaviour2 as NodeScaleLODBehaviour, ParallelEdgeBehaviour2 as ParallelEdgeBehaviour, PinchZoomBehaviour2 as PinchZoomBehaviour, TextResolutionLODBehaviour2 as TextResolutionLODBehaviour, ThemeBehaviour2 as ThemeBehaviour, ToolContext, WheelZoomBehaviour2 as WheelZoomBehaviour, controlPanelSlots, useBehaviourInstance, useBehaviourRegistration, useCamera, useCanvas, useCanvasEvent, useCanvasGraphClipboard, useCanvasImageExport, useCanvasMessage, useCanvasStateJson, useClearGraph, useClipboard, useCommandStates, useContextMenu, useControlPanelSlot, useControlPanels, useEdgeType, useEditorSection, useEntityEditor, useFitContent, useGraphCanvas, useGraphCanvasOptions, useGraphCanvasUpdate, useGraphClipboard, useGraphEvent, useGraphStore, useGrid, useHistory, useHistoryEntries, useHistorySection, useHoverElementPreview, useInspectTarget, useLayout, useLayoutsSection, useLock, usePlaybook, useResolvedCanvas, useSelectMode, useSelection, useStore, useStyleEditorSection, useTool, useViewContext, useViewData, useViewSection, useViewTarget, useZoom };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map