import { ElementInspectorViewPanel, LayersViewPanel, GraphCanvasAppRoot, GraphCanvasAppSurface } from './chunk-VW3P45XP.js';
import { createContext, useState, useCallback, useMemo, useContext, useEffect } from 'react';
import { BlockPanel, Board } from '@invana/boards';
import { jsx, jsxs } from 'react/jsx-runtime';
import { ClickInspectBehaviour } from '@invana/canvas-react';

// src/boards/types.ts
var DEFAULT_CANVAS_ID = "canvas";
var CanvasBoardContext = createContext(null);
function CanvasBoardProvider({ resolveData, children }) {
  const [engines, setEngines] = useState({});
  const register = useCallback((canvasId, canvas) => {
    setEngines((prev) => prev[canvasId] === canvas ? prev : { ...prev, [canvasId]: canvas });
  }, []);
  const value = useMemo(() => ({ resolveData, engines, register }), [resolveData, engines, register]);
  return /* @__PURE__ */ jsx(CanvasBoardContext.Provider, { value, children });
}
function useCanvasBoardContext(kind) {
  const value = useContext(CanvasBoardContext);
  if (!value) {
    throw new Error(
      `A "${kind}" panel must be rendered inside a <CanvasBoardProvider> (or use <CanvasBoard>, which includes one).`
    );
  }
  return value;
}
function useBoardCanvas(canvasId = DEFAULT_CANVAS_ID) {
  return useCanvasBoardContext("canvas-*").engines[canvasId] ?? null;
}
function CanvasInspectorPanel({ options }) {
  const canvas = useBoardCanvas(options.canvasId);
  if (!canvas) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-3 text-base", children: "Waiting for the canvas\u2026" });
  }
  return /* @__PURE__ */ jsx(
    ElementInspectorViewPanel,
    {
      canvas,
      layerId: options.layerId ?? "graph",
      ...options.focusZoom !== void 0 ? { focusZoom: options.focusZoom } : {}
    }
  );
}
function CanvasLayersPanel({ options }) {
  const canvas = useBoardCanvas(options.canvasId);
  if (!canvas) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-3 text-base", children: "Waiting for the canvas\u2026" });
  }
  return /* @__PURE__ */ jsx(LayersViewPanel, { canvas });
}
var DEFAULT_HEIGHT = 520;
function CanvasPanel({ options }) {
  const board = useCanvasBoardContext("canvas");
  const canvasId = options.canvasId ?? DEFAULT_CANVAS_ID;
  const { resolveData, register } = board;
  const data = useMemo(() => resolveData(options.dataRef), [resolveData, options.dataRef]);
  const onReady = useCallback((canvas) => register(canvasId, canvas), [register, canvasId]);
  if (!data) {
    return /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground p-3 text-base", children: [
      "No graph for ",
      /* @__PURE__ */ jsx("span", { className: "font-mono", children: options.dataRef }),
      "."
    ] });
  }
  return /* @__PURE__ */ jsx(
    GraphCanvasAppRoot,
    {
      data,
      config: options.config,
      bundle: options.bundle ?? true,
      onReady,
      height: options.height ?? DEFAULT_HEIGHT,
      ...options.preference ? { preference: options.preference } : {},
      children: /* @__PURE__ */ jsx(GraphCanvasAppSurface, { children: options.inspect ? /* @__PURE__ */ jsx(ClickInspectBehaviour, { id: "click-inspect", targetLayerId: options.layerId ?? "graph" }) : null })
    }
  );
}
var DEFAULT_COLUMNS = [
  { key: "id", label: "Id", mono: true },
  { key: "type", label: "Type" },
  { key: "degree", label: "Degree", align: "right" }
];
var DEFAULT_LIMIT = 25;
var LABEL_KEYS = ["label", "name", "title"];
function cellOf(node, key, degree) {
  const data = node.data ?? {};
  if (key === "id") return node.id;
  if (key === "type") return node.type;
  if (key === "degree") return degree.get(node.id) ?? 0;
  if (key === "label") {
    for (const k of LABEL_KEYS) if (typeof data[k] === "string") return data[k];
    return node.id;
  }
  if (key.startsWith("data.")) {
    const v = data[key.slice(5)];
    return typeof v === "number" || typeof v === "string" ? v : v == null ? null : JSON.stringify(v);
  }
  return null;
}
function useGraphSnapshot(layer) {
  const [snapshot, setSnapshot] = useState({ nodes: [], edges: [] });
  const store = layer?.store;
  useEffect(() => {
    if (!store) {
      setSnapshot({ nodes: [], edges: [] });
      return;
    }
    let frame = 0;
    const recompute = () => setSnapshot({ nodes: [...store.nodes()], edges: [...store.edges()] });
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        recompute();
      });
    };
    recompute();
    const unsubs = [
      store.events.on("node:add", schedule),
      store.events.on("node:remove", schedule),
      store.events.on("node:update", schedule),
      store.events.on("edge:add", schedule),
      store.events.on("edge:remove", schedule)
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store]);
  return snapshot;
}
function CanvasTablePanel({ panel, options, onAction, icons, gap }) {
  const canvas = useBoardCanvas(options.canvasId);
  const layer = canvas?.layers.get(options.layerId ?? "graph") ?? void 0;
  const { nodes, edges } = useGraphSnapshot(layer);
  const [showAll, setShowAll] = useState(false);
  const [selected, setSelected] = useState(null);
  const columns = options.columns ?? DEFAULT_COLUMNS;
  const sortBy = options.sortBy ?? "degree";
  const limit = options.limit ?? DEFAULT_LIMIT;
  const rows = useMemo(() => {
    const degree = /* @__PURE__ */ new Map();
    for (const e of edges) {
      degree.set(e.source, (degree.get(e.source) ?? 0) + 1);
      degree.set(e.target, (degree.get(e.target) ?? 0) + 1);
    }
    const all = nodes.map((n) => {
      const row = { __id: n.id };
      for (const c of columns) row[c.key] = cellOf(n, c.key, degree);
      if (!(sortBy in row)) row[sortBy] = cellOf(n, sortBy, degree);
      return row;
    });
    all.sort((a, b) => {
      const x = a[sortBy];
      const y = b[sortBy];
      if (typeof x === "number" && typeof y === "number") return y - x;
      return String(y ?? "").localeCompare(String(x ?? ""));
    });
    return all;
  }, [nodes, edges, columns, sortBy]);
  if (!canvas) {
    return /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-3 text-base", children: "Waiting for the canvas\u2026" });
  }
  const shown = showAll ? rows : rows.slice(0, limit);
  const tableOptions = {
    columns: columns.map(({ key, label, align, mono }) => ({ key, label, align, mono })),
    rows: shown,
    total: rows.length,
    noun: options.noun ?? "nodes",
    rowKey: "__id",
    selected,
    ...columns.some((c) => c.key === sortBy) ? { sort: { key: sortBy, dir: "desc" } } : {}
  };
  const handleAction = (actionId, ctx) => {
    if (actionId === "open") {
      setShowAll(true);
      return;
    }
    if (actionId === "select" && typeof ctx?.value === "string") {
      const id = ctx.value;
      setSelected(id);
      canvas.behaviours.get("click-select")?.select(id, "shape");
      canvas.behaviours.get("click-inspect")?.setTarget({ kind: "node", id });
      onAction("select", { panelId: panel.id, itemId: id });
      return;
    }
    onAction(actionId, ctx);
  };
  return /* @__PURE__ */ jsx(
    BlockPanel,
    {
      panel: { ...panel, kind: "table" },
      options: tableOptions,
      onAction: handleAction,
      icons,
      gap
    }
  );
}
var CANVAS_PANELS = {
  canvas: CanvasPanel,
  "canvas-inspector": CanvasInspectorPanel,
  "canvas-layers": CanvasLayersPanel,
  "canvas-table": CanvasTablePanel
};
function CanvasBoard({ resolveData, registry, ...board }) {
  const merged = useMemo(() => ({ ...CANVAS_PANELS, ...registry }), [registry]);
  return /* @__PURE__ */ jsx(CanvasBoardProvider, { resolveData, children: /* @__PURE__ */ jsx(Board, { registry: merged, ...board }) });
}

export { CANVAS_PANELS, CanvasBoard, CanvasBoardProvider, CanvasInspectorPanel, CanvasLayersPanel, CanvasPanel, CanvasTablePanel, DEFAULT_CANVAS_ID, useBoardCanvas };
//# sourceMappingURL=boards.js.map
//# sourceMappingURL=boards.js.map