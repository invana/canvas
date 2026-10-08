import { useState, useRef, useCallback, useEffect } from 'react';
import { FormField } from '@invana/forms';
import { Button } from '@invana/ui';
import { useForm, FormProvider } from 'react-hook-form';
import { roleField, NO_ROLE, asRole, numberToHex } from '@invana/canvas-ui';
import { jsx, jsxs } from 'react/jsx-runtime';

// src/templates/NodeCardDesigner.tsx
var NO_BIND = "__static__";
var CARD_FIELDS = [
  { name: "name", type: "text", label: "Template name" },
  { name: "width", type: "number", label: "Width", min: 40, step: 2 },
  { name: "height", type: "number", label: "Height", min: 40, step: 2 },
  { name: "cornerRadius", type: "number", label: "Corner radius", min: 0, step: 1 },
  roleField("bgRole", "Background role")
];
function bindField(dataFields) {
  const known = dataFields.map((f) => f.key).join(", ");
  const example = dataFields[0]?.key ?? "data.name";
  return {
    name: "bind",
    type: "text",
    label: "Bind to field",
    placeholder: example,
    description: known ? `Data path, e.g. ${example}. Known fields: ${known}. Empty = static text.` : "Data path (e.g. data.name). Empty = static text."
  };
}
function elementFields(type, dataFields) {
  switch (type) {
    case "text":
      return [
        bindField(dataFields),
        { name: "text", type: "text", label: "Static text", description: "Used when not bound" },
        { name: "fontSize", type: "number", label: "Font size", min: 6, step: 1 },
        { name: "fontWeight", type: "number", label: "Font weight", min: 100, max: 900, step: 100 },
        roleField("colorRole", "Colour role"),
        { name: "uppercase", type: "boolean", label: "Uppercase" },
        { name: "maxWidth", type: "number", label: "Max width (0 = none)", min: 0, step: 4 }
      ];
    case "rect":
      return [
        { name: "width", type: "number", label: "Width", min: 1, step: 1 },
        { name: "height", type: "number", label: "Height", min: 1, step: 1 },
        { name: "cornerRadius", type: "number", label: "Corner radius", min: 0, step: 1 },
        roleField("fillRole", "Fill role")
      ];
    case "circle":
      return [
        { name: "radius", type: "number", label: "Radius", min: 1, step: 1 },
        roleField("fillRole", "Fill role")
      ];
    case "line":
      return [
        { name: "x2", type: "number", label: "End X", step: 1 },
        { name: "y2", type: "number", label: "End Y", step: 1 },
        { name: "strokeWidth", type: "number", label: "Thickness", min: 1, step: 1 },
        roleField("colorRole", "Colour role")
      ];
    case "image":
      return [
        bindField(dataFields),
        { name: "size", type: "number", label: "Size", min: 8, step: 2 },
        {
          name: "shape",
          type: "select",
          label: "Shape",
          options: [
            { value: "circle", label: "Circle" },
            { value: "rounded", label: "Rounded" }
          ]
        }
      ];
    default:
      return [];
  }
}

// src/templates/mapping.ts
function cardToForm(tpl) {
  return {
    name: tpl.name ?? "",
    width: tpl.width,
    height: tpl.height,
    cornerRadius: tpl.cornerRadius ?? 10,
    bgRole: tpl.bgRole ?? NO_ROLE
  };
}
function applyFormToCard(tpl, v) {
  const next = {
    ...tpl,
    name: (v.name ?? "").trim() || tpl.name,
    width: v.width || tpl.width,
    height: v.height || tpl.height,
    cornerRadius: v.cornerRadius
  };
  const role = asRole(v.bgRole);
  if (role) next.bgRole = role;
  else delete next.bgRole;
  return next;
}
function elementToForm(el) {
  const base = {
    bind: "",
    text: "",
    fontSize: 13,
    fontWeight: 400,
    colorRole: NO_ROLE,
    uppercase: false,
    maxWidth: 0,
    width: 40,
    height: 24,
    cornerRadius: 0,
    fillRole: NO_ROLE,
    radius: 16,
    x2: 0,
    y2: 0,
    strokeWidth: 1,
    size: 40,
    shape: "circle"
  };
  switch (el.type) {
    case "text":
      return {
        ...base,
        bind: el.bind ?? "",
        text: el.text ?? "",
        fontSize: el.fontSize ?? 13,
        fontWeight: typeof el.fontWeight === "number" ? el.fontWeight : 400,
        colorRole: el.colorRole ?? NO_ROLE,
        uppercase: el.uppercase ?? false,
        maxWidth: el.maxWidth ?? 0
      };
    case "rect":
      return {
        ...base,
        width: el.width,
        height: el.height,
        cornerRadius: el.cornerRadius ?? 0,
        fillRole: el.fillRole ?? NO_ROLE
      };
    case "circle":
      return { ...base, radius: el.radius, fillRole: el.fillRole ?? NO_ROLE };
    case "line":
      return {
        ...base,
        x2: el.x2,
        y2: el.y2,
        strokeWidth: el.strokeWidth ?? 1,
        colorRole: el.colorRole ?? NO_ROLE
      };
    case "image":
      return { ...base, bind: el.bind ?? "", size: el.size, shape: el.shape ?? "circle" };
    default:
      return base;
  }
}
function applyFormToElement(el, v) {
  const bound = v.bind?.trim();
  const bind = bound && bound !== NO_BIND ? bound : void 0;
  switch (el.type) {
    case "text":
      return {
        ...el,
        bind,
        text: v.text,
        fontSize: v.fontSize,
        fontWeight: v.fontWeight,
        uppercase: v.uppercase,
        maxWidth: v.maxWidth > 0 ? v.maxWidth : void 0,
        colorRole: asRole(v.colorRole)
      };
    case "rect":
      return {
        ...el,
        width: v.width,
        height: v.height,
        cornerRadius: v.cornerRadius || void 0,
        fillRole: asRole(v.fillRole)
      };
    case "circle":
      return { ...el, radius: v.radius, fillRole: asRole(v.fillRole) };
    case "line":
      return { ...el, x2: v.x2, y2: v.y2, strokeWidth: v.strokeWidth, colorRole: asRole(v.colorRole) };
    case "image":
      return { ...el, bind, size: v.size, shape: v.shape === "rounded" ? "rounded" : "circle" };
    default:
      return el;
  }
}
function previewColor(role, direct, palette, fallback) {
  if (role && palette[role] !== void 0) return numberToHex(palette[role]);
  if (typeof direct === "number") return numberToHex(direct);
  return numberToHex(fallback);
}
function templateToJson(tpl) {
  return JSON.stringify(tpl, null, 2);
}
function parseTemplate(text) {
  try {
    const o = JSON.parse(text);
    if (o && o.kind === "freeform" && typeof o.width === "number" && Array.isArray(o.elements)) {
      return o;
    }
  } catch {
  }
  return null;
}
function elementLabel(el) {
  if (el.label) return el.label;
  if (el.type === "text") return el.bind ? `text \xB7 {${el.bind}}` : `text \xB7 "${el.text ?? ""}"`;
  if (el.type === "image") return el.bind ? `image \xB7 {${el.bind}}` : "image";
  return el.type;
}
function newElement(type, id) {
  switch (type) {
    case "text":
      return { id, type: "text", x: 16, y: 16, text: "Text", fontSize: 14, fontWeight: 400, colorRole: "foreground" };
    case "rect":
      return { id, type: "rect", x: 16, y: 16, width: 60, height: 24, fillRole: "accent" };
    case "circle":
      return { id, type: "circle", x: 30, y: 30, radius: 16, fillRole: "accent" };
    case "line":
      return { id, type: "line", x: 16, y: 40, x2: 160, y2: 40, colorRole: "divider", strokeWidth: 1 };
    case "image":
      return { id, type: "image", x: 16, y: 16, size: 40, shape: "circle" };
    default:
      return { id, type: "text", x: 16, y: 16, text: "Text" };
  }
}
function CardElementView({ el, palette, text = "", selected, onPointerDown }) {
  const common = {
    position: "absolute",
    cursor: onPointerDown ? "move" : "default",
    boxShadow: selected ? "0 0 0 2px #3b82f6" : void 0
  };
  if (el.type === "text") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        onPointerDown,
        style: {
          ...common,
          left: el.x,
          top: el.y,
          fontSize: el.fontSize ?? 13,
          fontWeight: el.fontWeight ?? 400,
          color: previewColor(el.colorRole, el.color, palette, 1118481),
          textTransform: el.uppercase ? "uppercase" : "none",
          whiteSpace: el.maxLines && el.maxLines > 1 ? "normal" : "nowrap",
          maxWidth: el.maxWidth || void 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          lineHeight: 1.2,
          display: "-webkit-box",
          WebkitLineClamp: el.maxLines ?? 1,
          WebkitBoxOrient: "vertical"
        },
        children: text || "Text"
      }
    );
  }
  if (el.type === "rect") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        onPointerDown,
        style: {
          ...common,
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
          borderRadius: el.cornerRadius ?? 0,
          background: previewColor(el.fillRole, el.fill, palette, 10265519)
        }
      }
    );
  }
  if (el.type === "circle") {
    return /* @__PURE__ */ jsx(
      "div",
      {
        onPointerDown,
        style: {
          ...common,
          left: el.x,
          top: el.y,
          width: el.radius * 2,
          height: el.radius * 2,
          borderRadius: "50%",
          background: previewColor(el.fillRole, el.fill, palette, 10265519)
        }
      }
    );
  }
  if (el.type === "image") {
    const slot = el.bind ? `{${el.bind.split(".").pop()}}` : "IMG";
    return /* @__PURE__ */ jsx(
      "div",
      {
        onPointerDown,
        style: {
          ...common,
          left: el.x,
          top: el.y,
          width: el.size,
          height: el.size,
          borderRadius: el.shape === "rounded" ? 8 : "50%",
          background: previewColor("divider", void 0, palette, 13421772),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 10,
          color: "#fff",
          overflow: "hidden",
          padding: 2,
          boxSizing: "border-box"
        },
        children: /* @__PURE__ */ jsx(
          "span",
          {
            style: {
              maxWidth: "100%",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
            },
            children: slot
          }
        )
      }
    );
  }
  if (el.type === "icon") {
    const slot = el.bind ? `{${el.bind.split(".").pop()}}` : el.icon?.split("/").pop() ?? "ICON";
    return /* @__PURE__ */ jsx(
      "div",
      {
        onPointerDown,
        title: el.icon,
        style: {
          ...common,
          left: el.x,
          top: el.y,
          width: el.size,
          height: el.size,
          borderRadius: 4,
          border: `1px dashed ${previewColor(el.colorRole, el.color, palette, 6583435)}`,
          color: previewColor(el.colorRole, el.color, palette, 6583435),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 8,
          overflow: "hidden",
          boxSizing: "border-box"
        },
        children: slot
      }
    );
  }
  const dx = el.x2 - el.x;
  const dy = el.y2 - el.y;
  const len = Math.hypot(dx, dy);
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  return /* @__PURE__ */ jsx(
    "div",
    {
      onPointerDown,
      style: {
        ...common,
        left: el.x,
        top: el.y,
        width: len,
        height: Math.max(el.strokeWidth ?? 1, 2),
        background: previewColor(el.colorRole, el.color, palette, 14870768),
        transformOrigin: "0 0",
        transform: `rotate(${angle}deg)`
      }
    }
  );
}
var COALESCE_MS = 700;
function useHistory(initial) {
  const [state, setState] = useState(initial);
  const stateRef = useRef(initial);
  const past = useRef([]);
  const future = useRef([]);
  const lastTag = useRef({ time: 0 });
  const version = useRef(0);
  const [, force] = useState(0);
  const rerender = useCallback(() => force((n) => n + 1), []);
  const apply = useCallback((next) => {
    stateRef.current = next;
    setState(next);
  }, []);
  const set = useCallback((next) => apply(next), [apply]);
  const commit = useCallback(
    (next, tag) => {
      const now = Date.now();
      const coalesce = tag !== void 0 && lastTag.current.tag === tag && now - lastTag.current.time < COALESCE_MS;
      if (!coalesce) {
        past.current.push(stateRef.current);
        future.current = [];
      }
      lastTag.current = { tag, time: now };
      apply(next);
      rerender();
    },
    [apply, rerender]
  );
  const record = useCallback(
    (snapshot) => {
      past.current.push(snapshot);
      future.current = [];
      lastTag.current = { time: 0 };
      rerender();
    },
    [rerender]
  );
  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (prev === void 0) return;
    future.current.push(stateRef.current);
    lastTag.current = { time: 0 };
    version.current += 1;
    apply(prev);
    rerender();
  }, [apply, rerender]);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (next === void 0) return;
    past.current.push(stateRef.current);
    lastTag.current = { time: 0 };
    version.current += 1;
    apply(next);
    rerender();
  }, [apply, rerender]);
  const reset = useCallback(
    (next) => {
      past.current = [];
      future.current = [];
      lastTag.current = { time: 0 };
      version.current += 1;
      apply(next);
      rerender();
    },
    [apply, rerender]
  );
  return {
    state,
    set,
    commit,
    record,
    undo,
    redo,
    reset,
    canUndo: past.current.length > 0,
    canRedo: future.current.length > 0,
    version: version.current
  };
}
var EMPTY_TEMPLATE = {
  name: "card",
  kind: "freeform",
  width: 240,
  height: 140,
  cornerRadius: 12,
  bgRole: "cardBg",
  elements: []
};
var PALETTE_ITEMS = [
  { type: "text", label: "Text" },
  { type: "rect", label: "Rect" },
  { type: "circle", label: "Circle" },
  { type: "line", label: "Line" },
  { type: "image", label: "Image" }
];
function NodeCardDesigner({
  defaults,
  dataFields = [],
  palette = {},
  onChange,
  onSubmit,
  submitLabel = "Apply template"
}) {
  const history = useHistory(defaults ?? EMPTY_TEMPLATE);
  const tpl = history.state;
  const [selectedId, setSelectedId] = useState(null);
  const idSeq = useRef(0);
  const fileInput = useRef(null);
  const preDrag = useRef(null);
  useEffect(() => {
    onChange?.(tpl);
  }, [tpl, onChange]);
  const selected = tpl.elements.find((e) => e.id === selectedId) ?? null;
  const addElement = (type) => {
    const id = `el-${type}-${idSeq.current += 1}`;
    history.commit({ ...tpl, elements: [...tpl.elements, newElement(type, id)] });
    setSelectedId(id);
  };
  const updateElement = useCallback(
    (id, next) => {
      history.commit(
        { ...history.state, elements: history.state.elements.map((e) => e.id === id ? next : e) },
        `prop:${id}`
      );
    },
    [history]
  );
  const removeElement = (id) => {
    history.commit({ ...tpl, elements: tpl.elements.filter((e) => e.id !== id) });
    if (selectedId === id) setSelectedId(null);
  };
  const toggleHidden = (id) => {
    history.commit({
      ...tpl,
      elements: tpl.elements.map((e) => e.id === id ? { ...e, hidden: !e.hidden } : e)
    });
  };
  const moveZ = (id, dir) => {
    const els = [...tpl.elements];
    const i = els.indexOf(els.find((e) => e.id === id));
    const j = i + dir;
    if (j < 0 || j >= els.length) return;
    [els[i], els[j]] = [els[j], els[i]];
    history.commit({ ...tpl, elements: els });
  };
  const updateCard = useCallback(
    (v) => history.commit(applyFormToCard(history.state, v), "card"),
    [history]
  );
  const onMoveStart = () => {
    preDrag.current = history.state;
  };
  const onMove = (id, x, y) => {
    history.set({ ...history.state, elements: history.state.elements.map((e) => e.id === id ? { ...e, x, y } : e) });
  };
  const onMoveEnd = () => {
    if (preDrag.current) history.record(preDrag.current);
    preDrag.current = null;
  };
  const onSave = () => download(`${tpl.name || "card"}.json`, templateToJson(tpl));
  const onLoadFile = async (file) => {
    const parsed = parseTemplate(await file.text());
    if (parsed) {
      history.reset(parsed);
      setSelectedId(null);
    }
  };
  const onNew = () => {
    history.reset(EMPTY_TEMPLATE);
    setSelectedId(null);
  };
  const rootRef = useRef(null);
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onKey = (e) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const k = e.key.toLowerCase();
      if (k === "z") {
        e.preventDefault();
        if (e.shiftKey) history.redo();
        else history.undo();
      } else if (k === "y") {
        e.preventDefault();
        history.redo();
      }
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [history]);
  return /* @__PURE__ */ jsxs("div", { ref: rootRef, tabIndex: -1, style: { outline: "none" }, children: [
    /* @__PURE__ */ jsxs("div", { style: toolbarStyle, children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: onNew, children: "New" }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: () => fileInput.current?.click(), children: "Load" }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: onSave, children: "Save" }),
      /* @__PURE__ */ jsx("span", { style: dividerStyle }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", disabled: !history.canUndo, onClick: history.undo, children: "Undo" }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", disabled: !history.canRedo, onClick: history.redo, children: "Redo" }),
      /* @__PURE__ */ jsx("span", { style: { flex: 1 } }),
      onSubmit ? /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(tpl), children: submitLabel }) : null,
      /* @__PURE__ */ jsx(
        "input",
        {
          ref: fileInput,
          type: "file",
          accept: "application/json",
          style: { display: "none" },
          onChange: (e) => {
            const f = e.target.files?.[0];
            if (f) void onLoadFile(f);
            e.target.value = "";
          }
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { style: shellStyle, children: [
      /* @__PURE__ */ jsxs("div", { style: layersStyle, children: [
        /* @__PURE__ */ jsx("span", { style: sectionLabel, children: "Add element" }),
        /* @__PURE__ */ jsx("div", { style: { display: "flex", flexWrap: "wrap", gap: 4 }, children: PALETTE_ITEMS.map((it) => /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => addElement(it.type), children: it.label }, it.type)) }),
        /* @__PURE__ */ jsx("span", { style: { ...sectionLabel, marginTop: 8 }, children: "Layers (top = front)" }),
        /* @__PURE__ */ jsxs("div", { style: { display: "flex", flexDirection: "column", gap: 2 }, children: [
          [...tpl.elements].reverse().map((el) => /* @__PURE__ */ jsxs(
            "div",
            {
              style: layerRowStyle(el.id === selectedId),
              onClick: () => setSelectedId(el.id),
              children: [
                /* @__PURE__ */ jsx(
                  "button",
                  {
                    type: "button",
                    title: el.hidden ? "Show" : "Hide",
                    style: iconBtnStyle,
                    onClick: (e) => {
                      e.stopPropagation();
                      toggleHidden(el.id);
                    },
                    children: el.hidden ? "\u25CB" : "\u25C9"
                  }
                ),
                /* @__PURE__ */ jsx("span", { style: layerLabelStyle(!!el.hidden), children: elementLabel(el) }),
                /* @__PURE__ */ jsx("button", { type: "button", title: "Forward", style: iconBtnStyle, onClick: (e) => {
                  e.stopPropagation();
                  moveZ(el.id, 1);
                }, children: "\u2191" }),
                /* @__PURE__ */ jsx("button", { type: "button", title: "Backward", style: iconBtnStyle, onClick: (e) => {
                  e.stopPropagation();
                  moveZ(el.id, -1);
                }, children: "\u2193" }),
                /* @__PURE__ */ jsx("button", { type: "button", title: "Delete", style: iconBtnStyle, onClick: (e) => {
                  e.stopPropagation();
                  removeElement(el.id);
                }, children: "\u2715" })
              ]
            },
            el.id
          )),
          tpl.elements.length === 0 ? /* @__PURE__ */ jsx("span", { style: { fontSize: 11, opacity: 0.6 }, children: "No elements yet \u2014 add one above." }) : null
        ] })
      ] }),
      /* @__PURE__ */ jsx("div", { style: canvasWrapStyle, onPointerDown: () => setSelectedId(null), children: /* @__PURE__ */ jsx(
        DesignCanvas,
        {
          tpl,
          palette,
          dataFields,
          selectedId,
          onSelect: setSelectedId,
          onMoveStart,
          onMove,
          onMoveEnd
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { style: propsStyle, children: [
        /* @__PURE__ */ jsx("span", { style: sectionLabel, children: "Card" }),
        /* @__PURE__ */ jsx(CardPropsForm, { tpl, onChange: updateCard }, `card-${history.version}`),
        /* @__PURE__ */ jsx("span", { style: { ...sectionLabel, marginTop: 12 }, children: selected ? `Element \xB7 ${selected.type}` : "Element" }),
        selected ? /* @__PURE__ */ jsx(
          ElementPropsForm,
          {
            element: selected,
            dataFields,
            onChange: (next) => updateElement(selected.id, next)
          },
          `${selected.id}-${history.version}`
        ) : /* @__PURE__ */ jsx("p", { style: { fontSize: 12, opacity: 0.6, margin: "4px 0" }, children: "Select an element to edit it." })
      ] })
    ] })
  ] });
}
function DesignCanvas({
  tpl,
  palette,
  dataFields,
  selectedId,
  onSelect,
  onMoveStart,
  onMove,
  onMoveEnd
}) {
  const drag = useRef(null);
  const onPointerDownEl = (e, el) => {
    e.stopPropagation();
    onSelect(el.id);
    drag.current = { id: el.id, ox: e.clientX, oy: e.clientY, ex: el.x, ey: el.y };
    onMoveStart();
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.round(Math.max(0, Math.min(tpl.width, d.ex + (e.clientX - d.ox))));
    const y = Math.round(Math.max(0, Math.min(tpl.height, d.ey + (e.clientY - d.oy))));
    onMove(d.id, x, y);
  };
  const onPointerUp = () => {
    if (drag.current) onMoveEnd();
    drag.current = null;
  };
  const labelFor = (key) => dataFields.find((f) => f.key === key)?.label ?? key ?? "";
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        position: "relative",
        width: tpl.width,
        height: tpl.height,
        borderRadius: tpl.cornerRadius ?? 10,
        background: previewColor(tpl.bgRole, tpl.bg, palette, 16777215),
        boxShadow: "0 1px 6px rgba(0,0,0,0.15)",
        overflow: "hidden",
        touchAction: "none"
      },
      onPointerMove,
      onPointerUp,
      children: tpl.elements.map(
        (el) => el.hidden ? null : /* @__PURE__ */ jsx(
          CardElementView,
          {
            el,
            palette,
            selected: el.id === selectedId,
            text: el.type === "text" ? el.bind ? `{${labelFor(el.bind)}}` : el.text ?? "" : "",
            onPointerDown: (e) => onPointerDownEl(e, el)
          },
          el.id
        )
      )
    }
  );
}
function CardPropsForm({ tpl, onChange }) {
  const form = useForm({ defaultValues: { card: cardToForm(tpl) } });
  const { control, watch } = form;
  useEffect(() => {
    const sub = watch((values) => values.card && onChange(values.card));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, name: "card", fields: CARD_FIELDS }) });
}
function ElementPropsForm({
  element,
  dataFields,
  onChange
}) {
  const form = useForm({ defaultValues: { el: elementToForm(element) } });
  const { control, watch } = form;
  useEffect(() => {
    const sub = watch((values) => values.el && onChange(applyFormToElement(element, values.el)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, name: "el", fields: elementFields(element.type, dataFields) }) });
}
function download(filename, text) {
  if (typeof document === "undefined") return;
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
var toolbarStyle = {
  display: "flex",
  alignItems: "center",
  gap: 4,
  padding: "6px 12px",
  borderBottom: "1px solid var(--border, #e4e4e7)"
};
var dividerStyle = { width: 1, height: 20, background: "var(--border, #e4e4e7)", margin: "0 4px" };
var shellStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 12,
  alignItems: "flex-start",
  padding: 12
};
var layersStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  width: 200,
  flexShrink: 0
};
var canvasWrapStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flex: "2 1 340px",
  minWidth: 0,
  minHeight: 260,
  padding: 24,
  background: "var(--muted, #f4f4f5)",
  borderRadius: 8,
  overflow: "auto"
};
var propsStyle = {
  display: "flex",
  flexDirection: "column",
  gap: 6,
  flex: "1 1 280px",
  minWidth: 260
};
var sectionLabel = { fontSize: 13, fontWeight: 600 };
var layerRowStyle = (on) => ({
  display: "flex",
  alignItems: "center",
  gap: 2,
  padding: "2px 4px",
  borderRadius: 5,
  cursor: "pointer",
  background: on ? "rgba(59,130,246,0.12)" : "transparent",
  border: `1px solid ${on ? "var(--primary, #3b82f6)" : "transparent"}`
});
var layerLabelStyle = (hidden) => ({
  flex: 1,
  fontSize: 11,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis",
  opacity: hidden ? 0.4 : 1
});
var iconBtnStyle = {
  width: 20,
  height: 20,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  border: "none",
  background: "transparent",
  cursor: "pointer",
  fontSize: 12,
  color: "inherit",
  padding: 0,
  borderRadius: 4
};
function readPath(obj, path) {
  if (!obj) return void 0;
  let cur = obj;
  for (const key of path.split(".")) {
    if (cur == null || typeof cur !== "object") return void 0;
    cur = cur[key];
  }
  return cur;
}
function CardPreview({ template, palette = {}, sample, scale = 1 }) {
  const text = (bind, fallback) => {
    if (bind) {
      const v = readPath(sample, bind);
      if (v != null) return String(v);
      return `{${bind}}`;
    }
    return fallback ?? "";
  };
  const frame = {
    position: "relative",
    width: template.width * scale,
    height: template.height * scale,
    flex: "none",
    overflow: "hidden"
  };
  const card = {
    position: "absolute",
    top: 0,
    left: 0,
    width: template.width,
    height: template.height,
    borderRadius: template.cornerRadius ?? 10,
    background: previewColor(template.bgRole, template.bg, palette, 16777215),
    overflow: "hidden",
    transform: scale === 1 ? void 0 : `scale(${scale})`,
    transformOrigin: "top left"
  };
  return /* @__PURE__ */ jsx("div", { style: frame, children: /* @__PURE__ */ jsx("div", { style: card, children: template.elements.map(
    (el) => el.hidden ? null : /* @__PURE__ */ jsx(
      CardElementView,
      {
        el,
        palette,
        text: el.type === "text" ? text(el.bind, el.text) : ""
      },
      el.id
    )
  ) }) });
}
function NodeTemplateList({
  items,
  palette = {},
  onEdit,
  thumb = { w: 168, h: 100 }
}) {
  return /* @__PURE__ */ jsx("div", { style: listStyle, children: items.map((it) => {
    const scale = Math.min(thumb.w / it.template.width, thumb.h / it.template.height, 1);
    return /* @__PURE__ */ jsxs("div", { style: rowStyle, children: [
      /* @__PURE__ */ jsx("div", { style: { ...thumbStyle, width: thumb.w, height: thumb.h }, children: /* @__PURE__ */ jsx(CardPreview, { template: it.template, palette, sample: it.sample, scale }) }),
      /* @__PURE__ */ jsxs("div", { style: { flex: 1, minWidth: 0 }, children: [
        /* @__PURE__ */ jsx("div", { style: { fontSize: 14, fontWeight: 600 }, children: it.type }),
        /* @__PURE__ */ jsxs("div", { style: metaStyle, children: [
          it.template.name,
          " \xB7 ",
          it.template.elements.length,
          " elements"
        ] })
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", onClick: () => onEdit(it.type), children: "Edit" })
    ] }, it.type);
  }) });
}
var listStyle = { display: "flex", flexDirection: "column", gap: 8, padding: 12 };
var rowStyle = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: 8,
  border: "1px solid var(--border, #e4e4e7)",
  borderRadius: 8
};
var thumbStyle = {
  position: "relative",
  overflow: "hidden",
  flex: "none",
  borderRadius: 6,
  background: "var(--muted, #f4f4f5)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};
var metaStyle = {
  fontSize: 11,
  opacity: 0.6,
  whiteSpace: "nowrap",
  overflow: "hidden",
  textOverflow: "ellipsis"
};

export { CARD_FIELDS, CardElementView, CardPreview, NO_BIND, NodeCardDesigner, NodeTemplateList, applyFormToCard, applyFormToElement, cardToForm, elementFields, elementLabel, elementToForm, newElement, parseTemplate, previewColor, templateToJson, useHistory };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map