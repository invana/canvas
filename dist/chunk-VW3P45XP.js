import { Cable, Waypoints, Spline, CornerDownRight, Minus, Grid3x3, Lasso, SquareDashedMousePointer, Trash2, Eraser, ClipboardPaste, Copy, Scissors, Keyboard, Mouse, Move, LocateFixed, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Hand, MousePointer2, Download, Info, Layers, Settings, Search, X, Plus, Moon, Sun, Redo2, Undo2, RefreshCw, Play, LockOpen, Lock, Crosshair, Shrink, Expand, Maximize, ZoomOut, ZoomIn, Square, MonitorX, Zap, Gauge, ImageDown, FileJson, Upload, Map as Map$1, MousePointerClick, HelpCircle, Image, Network, EyeOff, Eye, MoreHorizontal, Circle, Frame, Boxes, Check } from 'lucide-react';
import { createContext, createElement, useState, useEffect, useMemo, Fragment, useRef, useContext, useReducer, useCallback, useSyncExternalStore } from 'react';
import { cn, Button, Accordion, AccordionItem, AccordionTrigger, Badge, AccordionContent, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Separator, NavVertical, NavHorizontal, Toggle, ClampedText, Alert, AlertTitle, AlertDescription, MenuItem, HoverCard, HoverCardTrigger, HoverCardContent, TreeView, DropdownMenu, DropdownMenuTrigger, Card, PropertyList, PropertyRow, ToggleGroup, ToggleGroupItem, RichSelect, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@invana/ui';
import { jsx, jsxs, Fragment as Fragment$1 } from 'react/jsx-runtime';
import { useCanvas, useGraphCanvasUpdate, useCanvasMessage, useResolvedCanvas, useZoom, useSelection, useCanvasEvent, CanvasContext, DevInfoLayer, useCanvasImageExport, useCanvasStateJson, MiniMapLayer, useCommandStates, GraphCanvasContext, useControlPanels, hasWebGPUApi, hasWebGL, canUseWebGPU, useControlPanelSlot, useBehaviourInstance, GraphCanvas, BackgroundLayer, GraphLayer, ColorByBehaviour, D3ForceLayout, ThemeBehaviour, CanvasThemeSync, DragPanBehaviour, WheelZoomBehaviour, DragNodeBehaviour, HoverActivateBehaviour, ClickSelectBehaviour, BrushSelectBehaviour, LassoSelectBehaviour, EntranceBehaviour, useGraphCanvas } from '@invana/canvas-react';
export { CanvasThemeSync } from '@invana/canvas-react';
import { deepMerge } from '@invana/canvas';
import { useTheme, AppLayoutV2 } from '@invana/themes';

// src/control-panels/icons.ts
var StopIcon = ({ className, ...props }) => createElement(Square, { ...props, className: cn("fill-current", className) });
var DEFAULT_CONTROL_ICONS = {
  "zoom-in": ZoomIn,
  "zoom-out": ZoomOut,
  maximize: Maximize,
  expand: Expand,
  shrink: Shrink,
  crosshair: Crosshair,
  lock: Lock,
  "lock-open": LockOpen,
  play: Play,
  stop: StopIcon,
  refresh: RefreshCw,
  undo: Undo2,
  redo: Redo2,
  sun: Sun,
  moon: Moon,
  plus: Plus,
  minus: Minus,
  x: X,
  search: Search,
  settings: Settings,
  layers: Layers,
  info: Info,
  download: Download,
  pointer: MousePointer2,
  spline: Spline,
  hand: Hand,
  // camera / input
  "arrow-up": ArrowUp,
  "arrow-down": ArrowDown,
  "arrow-left": ArrowLeft,
  "arrow-right": ArrowRight,
  locate: LocateFixed,
  move: Move,
  mouse: Mouse,
  keyboard: Keyboard,
  // edit / history
  scissors: Scissors,
  copy: Copy,
  "clipboard-paste": ClipboardPaste,
  eraser: Eraser,
  trash: Trash2,
  // selection modes
  "select-box": SquareDashedMousePointer,
  lasso: Lasso,
  grid: Grid3x3,
  // edge routing (`graph.edgeType` options name these `edge-<pathType>`)
  "edge-straight": Minus,
  "edge-orth": CornerDownRight,
  "edge-bezier": Spline,
  "edge-rounded": Waypoints,
  "edge-smooth": Cable
};

// src/control-panels/defineControlItems.ts
function defineControlItems(items) {
  return items;
}

// src/control-panels/presets.ts
var divider = (key) => ({ type: "divider", key });
var ZOOM_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "zoom-in", command: "camera.zoomIn", icon: "zoom-in", label: "Zoom in" },
  { type: "widget", key: "zoom", widget: "zoom-readout" },
  { type: "command", key: "zoom-out", command: "camera.zoomOut", icon: "zoom-out", label: "Zoom out" }
]);
var VIEW_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "zoom-in", command: "camera.zoomIn", icon: "zoom-in", label: "Zoom in" },
  { type: "command", key: "zoom-out", command: "camera.zoomOut", icon: "zoom-out", label: "Zoom out" },
  { type: "command", key: "fit", command: "camera.fit", icon: "maximize", label: "Fit to content" },
  {
    type: "toggle",
    key: "lock",
    command: "view.lock",
    icon: "lock-open",
    activeIcon: "lock",
    label: "Lock view",
    activeLabel: "Unlock view"
  }
]);
var HISTORY_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "undo", command: "history.undo", icon: "undo", label: "Undo" },
  { type: "command", key: "redo", command: "history.redo", icon: "redo", label: "Redo" }
]);
var EDIT_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "cut", command: "clipboard.cut", icon: "scissors", label: "Cut" },
  { type: "command", key: "copy", command: "clipboard.copy", icon: "copy", label: "Copy" },
  { type: "command", key: "paste", command: "clipboard.paste", icon: "clipboard-paste", label: "Paste" },
  { type: "command", key: "delete", command: "clipboard.delete", icon: "eraser", label: "Delete selection" }
]);
var SELECT_MODE_CONTROL_ITEMS = defineControlItems([
  { type: "choice", key: "select-mode", command: "select.mode", label: "Select" }
]);
var EDGE_TYPE_CONTROL_ITEMS = defineControlItems([
  { type: "choice", key: "edge-type", command: "graph.edgeType", label: "Edges" }
]);
var LAYOUT_CONTROL_ITEMS = defineControlItems([
  { type: "choice", key: "layout", command: "layout.activate", label: "Layout" },
  {
    type: "command",
    key: "run-layout",
    command: "layout.toggle",
    icon: "play",
    activeIcon: "stop",
    label: "Run layout",
    activeLabel: "Stop layout"
  }
]);
var GRID_CONTROL_ITEMS = defineControlItems([
  { type: "toggle", key: "grid", command: "background.grid", icon: "grid", label: "Toggle grid" }
]);
var GRAPH_CONTROL_ITEMS = defineControlItems([
  ...LAYOUT_CONTROL_ITEMS,
  divider("d-history"),
  ...HISTORY_CONTROL_ITEMS,
  divider("d-select"),
  ...SELECT_MODE_CONTROL_ITEMS,
  ...EDGE_TYPE_CONTROL_ITEMS,
  { type: "command", key: "delete", command: "clipboard.delete", icon: "eraser", label: "Delete selection" },
  divider("d-view"),
  { type: "command", key: "fit", command: "camera.fit", icon: "maximize", label: "Fit to content" },
  {
    type: "toggle",
    key: "lock",
    command: "view.lock",
    icon: "lock-open",
    activeIcon: "lock",
    label: "Lock view",
    activeLabel: "Unlock view"
  },
  ...GRID_CONTROL_ITEMS
]);
var PAN_STEP = 80;
var FIT_ITEM = { type: "command", key: "fit", command: "camera.fit", icon: "maximize", label: "Fit to content" };
var RESET_ITEM = { type: "command", key: "reset", command: "camera.reset", icon: "locate", label: "Reset view" };
var LOCK_ITEM = {
  type: "toggle",
  key: "lock",
  command: "view.lock",
  icon: "lock-open",
  activeIcon: "lock",
  label: "Lock view",
  activeLabel: "Unlock view"
};
var PAN_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "pan-left", command: "camera.pan", args: { dx: PAN_STEP }, icon: "arrow-left", label: "Pan left" },
  { type: "command", key: "pan-up", command: "camera.pan", args: { dy: PAN_STEP }, icon: "arrow-up", label: "Pan up" },
  { type: "command", key: "pan-down", command: "camera.pan", args: { dy: -PAN_STEP }, icon: "arrow-down", label: "Pan down" },
  { type: "command", key: "pan-right", command: "camera.pan", args: { dx: -PAN_STEP }, icon: "arrow-right", label: "Pan right" },
  RESET_ITEM
]);
var PAN_PAD_CONTROL_ITEMS = defineControlItems([{ type: "widget", key: "pan-pad", widget: "pan-pad" }]);
var ZOOM_LEVEL_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "zoom-out", command: "camera.zoomOut", icon: "zoom-out", label: "Zoom out" },
  { type: "choice", key: "zoom-level", command: "camera.zoomTo", label: "Zoom" },
  { type: "command", key: "zoom-in", command: "camera.zoomIn", icon: "zoom-in", label: "Zoom in" },
  { type: "command", key: "zoom-100", command: "camera.zoomTo", args: { value: 1 }, label: "Zoom to 100%", text: "100%" }
]);
var INPUT_CONTROL_ITEMS = defineControlItems([
  { type: "toggle", key: "input-pan", command: "behaviour.toggle", args: { id: "pan" }, icon: "hand", label: "Drag to pan" },
  { type: "toggle", key: "input-zoom", command: "behaviour.toggle", args: { id: "zoom" }, icon: "mouse", label: "Wheel zoom" },
  { type: "toggle", key: "input-keyboard", command: "behaviour.toggle", args: { id: "keyboard-camera" }, icon: "keyboard", label: "Keyboard camera" }
]);
var NAVIGATION_CONTROL_ITEMS = defineControlItems([
  ...PAN_PAD_CONTROL_ITEMS,
  divider("d-zoom"),
  ...ZOOM_CONTROL_ITEMS,
  divider("d-fit"),
  FIT_ITEM
]);
var THEME_CONTROL_ITEMS = defineControlItems([
  { type: "toggle", key: "theme", command: "theme.toggle", icon: "moon", activeIcon: "sun", label: "Switch to dark theme", activeLabel: "Switch to light theme" }
]);
var CANVAS_CONTROL_ITEMS = defineControlItems([
  { type: "command", key: "zoom-in", command: "camera.zoomIn", icon: "zoom-in", label: "Zoom in" },
  { type: "command", key: "zoom-out", command: "camera.zoomOut", icon: "zoom-out", label: "Zoom out" },
  FIT_ITEM,
  RESET_ITEM,
  divider("d-lock"),
  LOCK_ITEM,
  ...GRID_CONTROL_ITEMS
]);
var EXPLORER_CONTROL_ITEMS = defineControlItems([
  ...LAYOUT_CONTROL_ITEMS,
  divider("d-select"),
  ...SELECT_MODE_CONTROL_ITEMS,
  ...EDGE_TYPE_CONTROL_ITEMS,
  divider("d-view"),
  FIT_ITEM,
  LOCK_ITEM
]);
var MODELLER_CONTROL_ITEMS = defineControlItems([
  { type: "choice", key: "tool", command: "tool.active", label: "Tool", display: "segmented" },
  { type: "choice", key: "node-kind", command: "tool.nodeKind", label: "Shape" },
  divider("d-history"),
  ...HISTORY_CONTROL_ITEMS,
  divider("d-edit"),
  { type: "command", key: "delete", command: "clipboard.delete", icon: "eraser", label: "Delete selection" },
  { type: "command", key: "clear", command: "graph.clear", icon: "trash", label: "Clear canvas" },
  divider("d-view"),
  FIT_ITEM
]);
function pinStyle(position, offset) {
  if (position === "left" || position === "right") {
    return { position: "absolute", top: offset, bottom: offset, [position]: offset };
  }
  const [vertical, horizontal] = position.split("-");
  const style = { position: "absolute", [vertical]: offset };
  if (horizontal === "center") {
    style.left = "50%";
    style.transform = "translateX(-50%)";
  } else {
    style[horizontal] = offset;
  }
  return style;
}
function Panel({
  position = "top-left",
  orientation = "vertical",
  offset = 8,
  gap = 4,
  zIndex = 5,
  className,
  style,
  children
}) {
  const isSide = position === "left" || position === "right";
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: {
        ...pinStyle(position, offset),
        zIndex,
        pointerEvents: "none",
        ...isSide && style ? style : {}
      },
      children: /* @__PURE__ */ jsx(
        "div",
        {
          className,
          style: {
            display: "flex",
            flexDirection: orientation === "vertical" ? "column" : "row",
            gap,
            pointerEvents: "auto",
            // A side dock fills the available height; the child manages scroll.
            ...isSide ? { height: "100%" } : {},
            ...isSide ? {} : style
          },
          children
        }
      )
    }
  );
}
function PanelContent({
  header,
  onClose,
  fill = false,
  width,
  className,
  style,
  children
}) {
  const hasHeader = header !== void 0 || onClose !== void 0;
  const resolvedWidth = width ?? (fill ? 320 : void 0);
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex flex-col overflow-hidden border border-border bg-popover text-popover-foreground shadow-lg",
        fill ? "h-full rounded-none" : "max-w-80 rounded-lg",
        className
      ),
      style: { ...resolvedWidth !== void 0 ? { width: resolvedWidth } : {}, ...style },
      children: [
        hasHeader && /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center justify-between gap-2 border-b border-border px-3 py-2", children: [
          /* @__PURE__ */ jsx("div", { className: "min-w-0 truncate text-[13px] font-semibold", children: header }),
          onClose && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              "aria-label": "Close",
              onClick: onClose,
              className: "-mr-1 shrink-0",
              children: "\u2715"
            }
          )
        ] }),
        /* @__PURE__ */ jsx("div", { className: cn("min-h-0", fill ? "flex-1 overflow-y-auto" : "overflow-y-auto"), children })
      ]
    }
  );
}
var SECTION_LABEL = {
  layers: "Layers",
  behaviours: "Behaviours",
  layouts: "Layouts"
};
var DEFAULT_SECTIONS = ["layers", "behaviours", "layouts"];
function readOptions(instance, descriptor) {
  if (descriptor?.read) return descriptor.read(instance);
  const getOptions = instance.getOptions;
  if (typeof getOptions === "function") {
    const opts = getOptions.call(instance);
    if (opts && typeof opts === "object") return { ...opts };
  }
  const options = instance.options;
  if (options && typeof options === "object") return { ...options };
  return {};
}
function CanvasSettingsBrowser({
  registry = [],
  sections = DEFAULT_SECTIONS,
  activeLayoutId,
  className
}) {
  const canvas = useCanvas();
  const update = useGraphCanvasUpdate();
  const [rows, setRows] = useState([]);
  useEffect(() => {
    const collect = [];
    for (const section of sections) {
      const instances = section === "layers" ? canvas.layers.list() : section === "behaviours" ? canvas.behaviours.list() : canvas.layouts.list();
      for (const instance of instances) {
        const id = instance.id;
        const descriptor = registry.find((d) => d.section === section && d.match(instance));
        collect.push({
          section,
          id,
          typeName: descriptor?.typeLabel ?? instance.constructor.name,
          instance,
          enabled: section === "behaviours" ? instance.enabled : void 0,
          descriptor
        });
      }
    }
    setRows(collect);
  }, [canvas, registry, sections]);
  const rowsBySection = useMemo(() => {
    const map = /* @__PURE__ */ new Map();
    for (const section of sections) map.set(section, []);
    for (const row of rows) map.get(row.section)?.push(row);
    return map;
  }, [rows, sections]);
  return /* @__PURE__ */ jsx("div", { className: cn("flex flex-col gap-1 p-2 text-base", className), children: /* @__PURE__ */ jsx(Accordion, { type: "multiple", defaultValue: sections, children: sections.map((section) => {
    const sectionRows = rowsBySection.get(section) ?? [];
    return /* @__PURE__ */ jsxs(AccordionItem, { value: section, className: "border-b", children: [
      /* @__PURE__ */ jsx(AccordionTrigger, { className: "py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline", children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2", children: [
        SECTION_LABEL[section],
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", children: sectionRows.length })
      ] }) }),
      /* @__PURE__ */ jsx(AccordionContent, { className: "pb-1 pl-1", children: sectionRows.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-2 py-1 text-sm italic text-muted-foreground", children: "None registered" }) : /* @__PURE__ */ jsx(Accordion, { type: "multiple", children: sectionRows.map((row) => /* @__PURE__ */ jsxs(
        AccordionItem,
        {
          value: `${section}:${row.id}`,
          className: "last:border-b-0",
          children: [
            /* @__PURE__ */ jsx(AccordionTrigger, { className: "py-2 hover:no-underline", children: /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
              /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: row.id }),
              /* @__PURE__ */ jsx("span", { className: "truncate text-sm text-muted-foreground", children: row.typeName }),
              row.enabled !== void 0 && /* @__PURE__ */ jsx(
                Badge,
                {
                  variant: row.enabled ? "default" : "outline",
                  className: "px-1.5 py-0 text-[10px]",
                  children: row.enabled ? "on" : "off"
                }
              ),
              section === "layouts" && row.id === activeLayoutId && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", children: "active" }),
              !row.descriptor && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "px-1.5 py-0 text-[10px] opacity-60", children: "no editor" })
            ] }) }),
            /* @__PURE__ */ jsx(AccordionContent, { className: "p-0", children: row.descriptor ? row.descriptor.render({
              instance: row.instance,
              id: row.id,
              section,
              options: readOptions(row.instance, row.descriptor),
              apply: (patch) => update({ [section]: { [row.id]: patch } }, `edit:settings:${section}:${row.id}`)
            }) : /* @__PURE__ */ jsxs("p", { className: "px-3 py-2 text-sm italic text-muted-foreground", children: [
              "No settings editor registered for ",
              row.typeName,
              "."
            ] }) })
          ]
        },
        row.id
      )) }) })
    ] }, section);
  }) }) });
}
function Tooltipped({ label, side, delayDuration = 0, children }) {
  if (label == null || label === "") return children;
  return /* @__PURE__ */ jsx(TooltipProvider, { delayDuration, children: /* @__PURE__ */ jsxs(Tooltip, { children: [
    /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children }),
    /* @__PURE__ */ jsx(TooltipContent, { side, children: label })
  ] }) });
}

// src/components/styles.ts
var ACTIVE_CLASS = "bg-primary/15 text-primary ring-1 ring-primary/25";
var ACTIVE_MENU_ITEM_CLASS = "text-primary font-medium";
var ACTIVE_SEGMENT_STYLE = {
  color: "var(--color-primary)",
  backgroundColor: "color-mix(in oklab, var(--color-primary) 15%, transparent)",
  boxShadow: "inset 0 0 0 1px color-mix(in oklab, var(--color-primary) 25%, transparent)"
};
function renderButton(key, opts) {
  const { icon: Icon, iconClass, label, text, active = false, disabled = false, onClick, tooltipSide } = opts;
  return /* @__PURE__ */ jsx(Tooltipped, { label, side: tooltipSide, children: /* @__PURE__ */ jsxs(
    Button,
    {
      variant: "ghost",
      size: text ? "sm" : "icon",
      "aria-label": label,
      disabled,
      onClick,
      className: active ? ACTIVE_CLASS : void 0,
      children: [
        /* @__PURE__ */ jsx(Icon, { size: 16, className: iconClass }),
        text ?? null
      ]
    }
  ) }, key);
}
function renderSelect(key, item, tipSide) {
  const { label, value, options, icons, onChange, align = "start", tooltip, renderTrigger, triggerLabelOnly, disabled } = item;
  const richOptions = Object.keys(options).map((k) => ({
    value: k,
    label: options[k] ?? k,
    icon: icons?.[k]
  }));
  return /* @__PURE__ */ jsx(
    RichSelect,
    {
      options: richOptions,
      value,
      onChange: (v) => onChange(v),
      label,
      align,
      tooltip: tooltip ?? label,
      tooltipSide: item.tooltipSide ?? tipSide,
      disabled,
      renderValue: renderTrigger ? () => renderTrigger() : (selected) => {
        const only = selected[0];
        const ActiveIcon = only?.icon;
        return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
          ActiveIcon && /* @__PURE__ */ jsx(ActiveIcon, { size: 16, className: item.iconClass }),
          triggerLabelOnly ? label : `${label}: ${only?.label ?? value}`
        ] });
      },
      renderOption: (option, { selected }) => {
        const Icon = option.icon;
        return /* @__PURE__ */ jsxs("span", { className: cn("flex items-center gap-1.5", selected && ACTIVE_MENU_ITEM_CLASS), children: [
          Icon && /* @__PURE__ */ jsx(Icon, { size: 14 }),
          option.label
        ] });
      }
    },
    key
  );
}
function renderSegmented(key, item, tipSide) {
  const { label, value, options, icons, onChange, tooltip, disabled } = item;
  const side = item.tooltipSide ?? tipSide;
  return /* @__PURE__ */ jsx(
    ToggleGroup,
    {
      type: "single",
      value,
      onValueChange: (v) => v && onChange(v),
      size: "sm",
      disabled,
      "aria-label": tooltip ?? label,
      className: item.className,
      children: Object.keys(options).map((k) => {
        const optLabel = options[k] ?? k;
        const Icon = icons?.[k];
        return /* @__PURE__ */ jsx(Tooltipped, { label: optLabel, side, children: /* @__PURE__ */ jsx(
          ToggleGroupItem,
          {
            value: k,
            size: "sm",
            "aria-label": optLabel,
            style: k === value ? ACTIVE_SEGMENT_STYLE : void 0,
            children: Icon ? /* @__PURE__ */ jsx(Icon, { size: 16, className: item.iconClass }) : optLabel
          }
        ) }, k);
      })
    },
    key
  );
}
function ToolbarItems({
  items,
  orientation = "horizontal",
  tooltipSide,
  className
}) {
  const tipSide = tooltipSide ?? (orientation === "vertical" ? "right" : "bottom");
  const nodes = items.map((item, i) => {
    const key = item.key ?? `${item.type}-${i}`;
    switch (item.type) {
      case "button": {
        const it = item;
        return renderButton(key, {
          icon: it.icon,
          ...it.iconClass !== void 0 ? { iconClass: it.iconClass } : {},
          label: it.label,
          ...it.text !== void 0 ? { text: it.text } : {},
          ...it.disabled !== void 0 ? { disabled: it.disabled } : {},
          onClick: it.onClick,
          tooltipSide: it.tooltipSide ?? tipSide
        });
      }
      case "toggle": {
        const it = item;
        const Icon = it.active ? it.activeIcon ?? it.icon : it.icon;
        const label = it.active ? it.activeLabel ?? it.label : it.label;
        return renderButton(key, {
          icon: Icon,
          ...it.iconClass !== void 0 ? { iconClass: it.iconClass } : {},
          label,
          active: it.active,
          ...it.disabled !== void 0 ? { disabled: it.disabled } : {},
          onClick: it.onToggle,
          tooltipSide: it.tooltipSide ?? tipSide
        });
      }
      case "select":
        return item.display === "segmented" ? renderSegmented(key, item, tipSide) : renderSelect(key, item, tipSide);
      case "divider":
        return /* @__PURE__ */ jsx(
          Separator,
          {
            orientation: orientation === "vertical" ? "horizontal" : "vertical",
            className: orientation === "vertical" ? "w-6 self-center" : "h-6 self-center"
          },
          key
        );
      case "custom":
        return /* @__PURE__ */ jsx(Fragment, { children: item.render() }, key);
    }
  });
  const content = /* @__PURE__ */ jsx(Fragment$1, { children: nodes });
  return orientation === "vertical" ? /* @__PURE__ */ jsx(NavVertical, { top: content, className }) : /* @__PURE__ */ jsx(NavHorizontal, { left: content, className });
}

// src/components/ToolbarItem.ts
function applyIconOverrides(items, icons) {
  if (!icons) return items;
  return items.map(
    (item) => (item.type === "button" || item.type === "toggle") && item.key && icons[item.key] ? { ...item, icon: icons[item.key] } : item
  );
}
var EXPORT_IMAGE_FORMAT_OPTIONS = [
  { value: "png", label: "PNG" },
  { value: "jpeg", label: "JPG" },
  { value: "webp", label: "WebP" },
  { value: "svg", label: "SVG" }
];
var EXPORT_IMAGE_AREA_OPTIONS = [
  { value: "viewport", label: "Viewport" },
  { value: "content", label: "Content" }
];
var EXPORT_IMAGE_BACKGROUND_OPTIONS = [
  { value: "canvas", label: "Canvas" },
  { value: "transparent", label: "None" },
  { value: "#ffffff", label: "White" },
  { value: "#0b1220", label: "Dark" }
];
var EXPORT_IMAGE_SCALE_OPTIONS = [1, 2, 3, 4, 5];
var EXPORT_IMAGE_RATIO_OPTIONS = [
  { value: 0, label: "Free" },
  { value: 1, label: "1:1" },
  { value: 16 / 9, label: "16:9" },
  { value: 4 / 3, label: "4:3" },
  { value: 3 / 2, label: "3:2" },
  { value: 9 / 16, label: "9:16" }
];
function Field({ label, children }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: label }),
    children
  ] });
}
function Segmented({
  value,
  options,
  onValueChange,
  disabled,
  columns
}) {
  return /* @__PURE__ */ jsx(
    ToggleGroup,
    {
      type: "single",
      value,
      disabled,
      onValueChange: (v) => {
        if (v) onValueChange(v);
      },
      variant: "outline",
      size: "sm",
      className: "grid w-full gap-1",
      style: { gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` },
      children: options.map((o) => /* @__PURE__ */ jsx(
        ToggleGroupItem,
        {
          value: o.value,
          "aria-label": o.label,
          className: "w-full min-w-0 px-1 text-sm",
          children: o.label
        },
        o.value
      ))
    }
  );
}
function ExportImagePanel({
  value,
  onChange,
  onSave,
  title = "Export",
  saveLabel = "Save as Image",
  saveIcon: SaveIcon,
  formats = EXPORT_IMAGE_FORMAT_OPTIONS,
  areas = EXPORT_IMAGE_AREA_OPTIONS,
  backgrounds = EXPORT_IMAGE_BACKGROUND_OPTIONS,
  scales = EXPORT_IMAGE_SCALE_OPTIONS,
  ratios = EXPORT_IMAGE_RATIO_OPTIONS,
  className
}) {
  const isSvg = value.format === "svg";
  const scaleOptions = scales.map((s) => ({ value: String(s), label: `${s}\xD7` }));
  const ratioOptions = ratios.map((r) => ({ value: String(r.value), label: r.label }));
  return /* @__PURE__ */ jsxs("div", { className: cn("flex w-full flex-col gap-3", className), children: [
    title != null && title !== "" && /* @__PURE__ */ jsx("div", { className: "text-base font-semibold text-foreground", children: title }),
    /* @__PURE__ */ jsx(Field, { label: "Format", children: /* @__PURE__ */ jsx(
      Segmented,
      {
        value: value.format,
        options: formats,
        columns: formats.length,
        onValueChange: (v) => onChange({ format: v })
      }
    ) }),
    /* @__PURE__ */ jsx(Field, { label: "Area", children: /* @__PURE__ */ jsx(
      Segmented,
      {
        value: value.area,
        options: areas,
        columns: areas.length,
        onValueChange: (v) => onChange({ area: v })
      }
    ) }),
    /* @__PURE__ */ jsx(Field, { label: "Background", children: /* @__PURE__ */ jsx(
      Segmented,
      {
        value: value.background,
        options: backgrounds,
        columns: backgrounds.length,
        onValueChange: (v) => onChange({ background: v })
      }
    ) }),
    /* @__PURE__ */ jsx(Field, { label: "Scale", children: /* @__PURE__ */ jsx(
      Segmented,
      {
        value: String(value.scale),
        options: scaleOptions,
        columns: scaleOptions.length,
        onValueChange: (v) => onChange({ scale: Number(v) }),
        disabled: isSvg
      }
    ) }),
    /* @__PURE__ */ jsx(Field, { label: "Aspect ratio", children: /* @__PURE__ */ jsx(
      Segmented,
      {
        value: String(value.aspectRatio),
        options: ratioOptions,
        columns: Math.min(ratioOptions.length, 3),
        onValueChange: (v) => onChange({ aspectRatio: Number(v) })
      }
    ) }),
    /* @__PURE__ */ jsxs(Button, { variant: "default", size: "sm", className: "mt-1 w-full gap-2", onClick: onSave, children: [
      SaveIcon ? /* @__PURE__ */ jsx(SaveIcon, { size: 16 }) : null,
      saveLabel
    ] })
  ] });
}
function ExportStatePanel({
  onExport,
  onImport,
  restoreView,
  onRestoreViewChange,
  title = "Canvas State",
  exportLabel = "Download JSON",
  importLabel = "Load JSON\u2026",
  exportIcon: ExportIcon,
  importIcon: ImportIcon,
  className
}) {
  const inputRef = useRef(null);
  const onPick = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) onImport(file);
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("flex w-full flex-col gap-3", className), children: [
    title != null && title !== "" && /* @__PURE__ */ jsx("div", { className: "text-base font-semibold text-foreground", children: title }),
    /* @__PURE__ */ jsxs(Button, { variant: "default", size: "sm", className: "w-full gap-2", onClick: onExport, children: [
      ExportIcon ? /* @__PURE__ */ jsx(ExportIcon, { size: 16 }) : null,
      exportLabel
    ] }),
    /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "outline",
        size: "sm",
        className: "w-full gap-2",
        onClick: () => inputRef.current?.click(),
        children: [
          ImportIcon ? /* @__PURE__ */ jsx(ImportIcon, { size: 16 }) : null,
          importLabel
        ]
      }
    ),
    /* @__PURE__ */ jsx(
      "input",
      {
        ref: inputRef,
        type: "file",
        accept: "application/json,.json",
        className: "hidden",
        onChange: onPick
      }
    ),
    onRestoreViewChange && /* @__PURE__ */ jsxs(Fragment$1, { children: [
      /* @__PURE__ */ jsx(Separator, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Restore view (camera & selection)" }),
        /* @__PURE__ */ jsx(
          Toggle,
          {
            size: "sm",
            pressed: restoreView ?? true,
            onPressedChange: onRestoreViewChange,
            "aria-label": "Restore view on import",
            className: "text-sm",
            children: restoreView ?? true ? "On" : "Off"
          }
        )
      ] })
    ] })
  ] });
}
var INPUT_CLASS = "h-7 w-full flex-1 rounded-md border border-border bg-background px-2 text-[13px] text-foreground outline-none";
function PropertiesEditor({
  title,
  defaults,
  onSubmit,
  submitLabel = "Apply",
  showLabel = true,
  showType = false,
  onReverse,
  className
}) {
  const [label, setLabel] = useState(defaults?.label ?? "");
  const [type, setType] = useState(defaults?.type ?? "");
  const [rows, setRows] = useState(
    () => Object.entries(defaults?.data ?? {}).map(([k, v]) => ({ k, v }))
  );
  const setRow = (i, patch) => setRows((rs) => rs.map((r, j) => j === i ? { ...r, ...patch } : r));
  const removeRow = (i) => setRows((rs) => rs.filter((_, j) => j !== i));
  const addRow = () => setRows((rs) => [...rs, { k: "", v: "" }]);
  const apply = () => {
    const data = {};
    for (const { k, v } of rows) {
      const key = k.trim();
      if (key) data[key] = v;
    }
    onSubmit(showType ? { label, type, data } : { label, data });
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex min-w-[240px] flex-col gap-3 rounded-lg border border-border bg-popover p-3 text-popover-foreground shadow-lg",
        className
      ),
      children: [
        title && /* @__PURE__ */ jsx("div", { className: "text-[13px] font-semibold", children: title }),
        showLabel && /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Label" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: INPUT_CLASS,
              value: label,
              placeholder: "Label text",
              onChange: (e) => setLabel(e.target.value)
            }
          )
        ] }),
        showType && /* @__PURE__ */ jsxs("label", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Type" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              className: INPUT_CLASS,
              value: type,
              placeholder: "Type tag",
              onChange: (e) => setType(e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
          /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: "Properties" }),
          rows.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: "No properties yet." }),
          rows.map((row, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
            /* @__PURE__ */ jsx(
              "input",
              {
                className: INPUT_CLASS,
                value: row.k,
                placeholder: "key",
                onChange: (e) => setRow(i, { k: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx(
              "input",
              {
                className: INPUT_CLASS,
                value: row.v,
                placeholder: "value",
                onChange: (e) => setRow(i, { v: e.target.value })
              }
            ),
            /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", "aria-label": "Remove field", onClick: () => removeRow(i), children: "\u2715" })
          ] }, i)),
          /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: addRow, children: "Add field" }) })
        ] }),
        /* @__PURE__ */ jsxs("div", { className: cn("flex items-center", onReverse ? "justify-between" : "justify-end"), children: [
          onReverse && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: onReverse, children: "Reverse direction" }),
          /* @__PURE__ */ jsx(Button, { onClick: apply, children: submitLabel })
        ] })
      ]
    }
  );
}
function DetailCard({
  title,
  titleColor,
  subtitle,
  badge,
  rows,
  onClose,
  className,
  style,
  children
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex w-full flex-col gap-3 p-3", className),
      ...style !== void 0 ? { style } : {},
      children: [
        (title || badge || onClose) && /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
            title && /* @__PURE__ */ jsx(
              "span",
              {
                className: "text-lg font-semibold",
                ...titleColor ? { style: { color: titleColor } } : {},
                children: title
              }
            ),
            badge && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[11px]", children: badge })
          ] }),
          onClose && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon", "aria-label": "Close", onClick: onClose, children: "\u2715" })
        ] }),
        subtitle && /* @__PURE__ */ jsx("div", { className: "-mt-1.5 break-all font-mono text-sm text-muted-foreground", children: subtitle }),
        rows && rows.length > 0 && /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-1.5", children: rows.map((row) => /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 text-[13px]", children: [
          /* @__PURE__ */ jsx("span", { className: "shrink-0 grow-0 basis-[38%] break-words text-muted-foreground", children: row.label }),
          /* @__PURE__ */ jsx("span", { className: cn("flex-1 break-words", row.mono && "font-mono text-sm"), children: row.value })
        ] }, row.label)) }),
        children
      ]
    }
  );
}
var LONG_TEXT_THRESHOLD = 140;
var TAG_MAX_LEN = 24;
var LIST_ITEM_CAP = 50;
var MAX_DEPTH = 2;
var CLAMP_LINES = 3;
function isPlainObject(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
function isPrimitive(v) {
  const t = typeof v;
  return t === "string" || t === "number" || t === "boolean";
}
function isSafeHref(s) {
  const t = s.trim();
  if (t.startsWith("//")) return true;
  const m = /^([a-z][a-z0-9+.-]*):/i.exec(t);
  if (!m) return false;
  return ["http", "https", "file", "mailto"].includes(m[1].toLowerCase());
}
function isImageUrl(s) {
  const t = s.trim();
  if (/^data:image\//i.test(t)) return true;
  return isSafeHref(t) && /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i.test(t);
}
function NumberValue({ value }) {
  return /* @__PURE__ */ jsx("span", { className: "block w-full text-right font-mono tabular-nums", children: String(value) });
}
function LinkValue({ href }) {
  if (!isSafeHref(href)) return /* @__PURE__ */ jsx("span", { className: "break-all", children: href });
  const external = /^https?:/i.test(href.trim());
  return /* @__PURE__ */ jsxs(
    "a",
    {
      href,
      ...external ? { target: "_blank" } : {},
      rel: "noopener noreferrer",
      className: "break-all text-primary hover:underline",
      children: [
        href,
        external ? " \u2197" : ""
      ]
    }
  );
}
function ImageValue({ url }) {
  if (!isImageUrl(url)) return /* @__PURE__ */ jsx("span", { className: "break-all", children: url });
  return /* @__PURE__ */ jsx("a", { href: url, target: "_blank", rel: "noopener noreferrer", children: /* @__PURE__ */ jsx(
    "img",
    {
      src: url,
      alt: "",
      loading: "lazy",
      className: "max-h-40 w-full rounded-md border border-border object-contain",
      onError: (e) => {
        e.currentTarget.style.display = "none";
      }
    }
  ) });
}
var TOGGLE_CLASS = "h-auto p-0 text-sm font-normal text-primary";
function TagList({ items }) {
  const shown = items.slice(0, LIST_ITEM_CAP);
  const extra = items.length - shown.length;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
    shown.map((t, i) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[11px]", children: String(t) }, i)),
    extra > 0 && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
      "+",
      extra,
      " more"
    ] })
  ] });
}
function ListValue({
  items,
  renderValue
}) {
  const shown = items.slice(0, LIST_ITEM_CAP);
  const extra = items.length - shown.length;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
    shown.map((it, i) => /* @__PURE__ */ jsxs("div", { className: "flex gap-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: "select-none text-muted-foreground", children: "\u2022" }),
      /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 break-words", children: renderValue(it, { name: `[${i}]` }) })
    ] }, i)),
    extra > 0 && /* @__PURE__ */ jsxs("span", { className: "text-sm text-muted-foreground", children: [
      "+",
      extra,
      " more"
    ] })
  ] });
}
function JsonValue({
  value,
  depth,
  renderValue
}) {
  const [open, setOpen] = useState(false);
  const entries = Object.entries(value);
  if (depth >= MAX_DEPTH) {
    return /* @__PURE__ */ jsx("pre", { className: "overflow-x-auto rounded-md bg-muted/50 p-2 text-[11px] leading-snug", children: JSON.stringify(value, null, 2) });
  }
  return /* @__PURE__ */ jsxs("div", { children: [
    /* @__PURE__ */ jsx(Button, { variant: "link", size: "sm", className: TOGGLE_CLASS, onClick: () => setOpen((o) => !o), children: open ? "Hide" : `{ ${entries.length} ${entries.length === 1 ? "key" : "keys"} }` }),
    open && /* @__PURE__ */ jsx("div", { className: "mt-1 flex flex-col gap-1.5 border-l border-border pl-2", children: entries.map(([k, v]) => /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: k }),
      /* @__PURE__ */ jsx("span", { className: "break-words", children: renderValue(v, { name: k }) })
    ] }, k)) })
  ] });
}
var defaultPropertyRenderers = [
  {
    kind: "number",
    layout: "inline",
    match: (v) => typeof v === "number" && Number.isFinite(v),
    render: ({ value }) => /* @__PURE__ */ jsx(NumberValue, { value })
  },
  {
    kind: "image",
    layout: "block",
    match: (v) => typeof v === "string" && isImageUrl(v),
    render: ({ value }) => /* @__PURE__ */ jsx(ImageValue, { url: value })
  },
  {
    kind: "url",
    layout: "inline",
    match: (v) => typeof v === "string" && isSafeHref(v),
    render: ({ value }) => /* @__PURE__ */ jsx(LinkValue, { href: value })
  },
  {
    kind: "longtext",
    layout: "block",
    match: (v) => typeof v === "string" && (v.length > LONG_TEXT_THRESHOLD || v.includes("\n")),
    render: ({ value }) => /* @__PURE__ */ jsx(ClampedText, { lines: CLAMP_LINES, className: "break-words", children: value })
  },
  {
    kind: "tags",
    layout: "block",
    match: (v) => Array.isArray(v) && v.length > 0 && v.every((it) => isPrimitive(it) && (typeof it !== "string" || it.length <= TAG_MAX_LEN)),
    render: ({ value }) => /* @__PURE__ */ jsx(TagList, { items: value })
  },
  {
    kind: "list",
    layout: "block",
    match: (v) => Array.isArray(v),
    render: ({ value, renderValue }) => /* @__PURE__ */ jsx(ListValue, { items: value, renderValue })
  },
  {
    kind: "json",
    layout: "block",
    match: (v) => isPlainObject(v),
    render: ({ value, depth, renderValue }) => /* @__PURE__ */ jsx(JsonValue, { value, depth, renderValue })
  },
  {
    kind: "text",
    layout: "inline",
    match: () => true,
    render: ({ value }) => /* @__PURE__ */ jsx("span", { className: "break-words", children: typeof value === "boolean" ? String(value) : value })
  }
];
var TEXT_RENDERER = defaultPropertyRenderers[defaultPropertyRenderers.length - 1];
function resolvePropertyRenderer(value, ctx, custom) {
  const all = custom && custom.length ? [...custom, ...defaultPropertyRenderers] : defaultPropertyRenderers;
  if (ctx.hint) {
    const forced = all.find((r) => r.kind === ctx.hint);
    if (forced) return forced;
  }
  return all.find((r) => r.match(value, ctx)) ?? TEXT_RENDERER;
}
function renderPropertyValue(value, opts) {
  const { name, hint, depth = 0, renderers } = opts;
  const renderer = resolvePropertyRenderer(value, { name, hint }, renderers);
  return renderer.render({
    name,
    value,
    ...hint !== void 0 ? { hint } : {},
    depth,
    renderValue: (v, o) => renderPropertyValue(v, {
      name: o?.name ?? name,
      ...o?.hint !== void 0 ? { hint: o.hint } : {},
      depth: depth + 1,
      ...renderers ? { renderers } : {}
    })
  });
}
function PropertyDetailView({
  data,
  renderers,
  hints,
  title = "Properties",
  emptyText = "No properties.",
  className
}) {
  const entries = Object.entries(data ?? {});
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1.5", className), children: [
    title && // Full-bleed section bar: negative horizontal margins (`-mx-2.5`) cancel
    // the card's padding so the muted band reaches both edges, while `px-3`
    // keeps the text aligned with the rows.
    /* @__PURE__ */ jsx("div", { className: "-mx-2.5 bg-muted px-3 py-1 font-medium uppercase text-muted-foreground", children: title }),
    entries.length === 0 && /* @__PURE__ */ jsx("span", { className: "text-sm text-muted-foreground", children: emptyText }),
    entries.map(([key, value]) => {
      const hint = hints?.[key];
      const renderer = resolvePropertyRenderer(value, { name: key, ...hint ? { hint } : {} }, renderers);
      const content = renderPropertyValue(value, {
        name: key,
        ...hint ? { hint } : {},
        ...renderers ? { renderers } : {}
      });
      if ((renderer.layout ?? "inline") === "block") {
        return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5 text-[13px]", children: [
          /* @__PURE__ */ jsx("span", { className: "break-words text-muted-foreground", children: key }),
          /* @__PURE__ */ jsx("div", { className: "min-w-0", children: content })
        ] }, key);
      }
      return /* @__PURE__ */ jsxs("div", { className: "flex items-baseline gap-2 text-[13px]", children: [
        /* @__PURE__ */ jsx("span", { className: "shrink-0 grow-0 basis-[38%] break-words text-muted-foreground", children: key }),
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 break-words", children: content })
      ] }, key);
    })
  ] });
}
function Endpoint({ role, ep }) {
  const colorStyle = ep.color ? { style: { color: ep.color } } : {};
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium text-muted-foreground", children: role }),
    (ep.label || ep.type) && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-2", children: [
      ep.label && /* @__PURE__ */ jsx("span", { className: "text-[13px] font-medium", ...colorStyle, children: ep.label }),
      ep.type && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "text-[11px]", children: ep.type })
    ] }),
    /* @__PURE__ */ jsx(
      "span",
      {
        className: "break-all font-mono text-sm text-muted-foreground",
        ...!ep.label && ep.color ? { style: { color: ep.color } } : {},
        children: ep.id
      }
    )
  ] });
}
function EdgeEndpoints({ source, target, directed = true }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx(Endpoint, { role: "Source", ep: source }),
    /* @__PURE__ */ jsx(
      "div",
      {
        className: "text-base leading-none text-muted-foreground",
        "aria-label": directed ? "points to" : "connected to",
        children: directed ? "\u2193" : "|"
      }
    ),
    /* @__PURE__ */ jsx(Endpoint, { role: "Target", ep: target })
  ] });
}
function CanvasMessageBar({ icon: Icon, canvas, className, style }) {
  const { message } = useCanvasMessage(canvas);
  if (message === null) return null;
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn("flex items-center gap-1.5 whitespace-nowrap text-sm opacity-80", className),
      style,
      children: [
        Icon ? /* @__PURE__ */ jsx(Icon, { size: 13 }) : null,
        /* @__PURE__ */ jsx("span", { children: message })
      ]
    }
  );
}
function probe() {
  return { webgpu: canUseWebGPU(), webgl: hasWebGL(), webgpuApi: hasWebGPUApi() };
}
function RendererCapabilityBanner({
  capabilities,
  className
}) {
  const [dismissed, setDismissed] = useState(false);
  const { webgpu, webgl, webgpuApi } = capabilities ?? probe();
  if (webgpu) return null;
  if (!webgl) {
    return /* @__PURE__ */ jsx(Panel, { position: "top-center", offset: 12, zIndex: 10, className, children: /* @__PURE__ */ jsxs(Alert, { variant: "destructive", className: "max-w-xl shadow-lg", children: [
      /* @__PURE__ */ jsx(MonitorX, { className: "size-4" }),
      /* @__PURE__ */ jsx(AlertTitle, { children: "Graph canvas can't render" }),
      /* @__PURE__ */ jsx(AlertDescription, { children: "This browser supports neither WebGPU nor WebGL, which the graph canvas needs to draw. Try a recent version of Chrome, Edge, or Firefox, or enable hardware acceleration in your browser settings." })
    ] }) });
  }
  if (dismissed) return null;
  return /* @__PURE__ */ jsx(Panel, { position: "top-center", offset: 12, zIndex: 10, className, children: /* @__PURE__ */ jsxs(Alert, { className: "max-w-xl shadow-lg", children: [
    /* @__PURE__ */ jsx(Zap, { className: "size-4" }),
    /* @__PURE__ */ jsx(AlertTitle, { children: "Using WebGL \u2014 WebGPU unavailable" }),
    /* @__PURE__ */ jsxs(AlertDescription, { className: "flex items-start gap-2", children: [
      /* @__PURE__ */ jsxs("span", { children: [
        webgpuApi ? "This browser's WebGPU isn't supported by the renderer yet, so the canvas is using WebGL." : "WebGPU isn't available in this browser, so the canvas is using WebGL.",
        " ",
        "Rendering works as normal; very large graphs may be faster with WebGPU (available in recent Chrome / Edge)."
      ] }),
      /* @__PURE__ */ jsx(
        Button,
        {
          size: "icon",
          variant: "ghost",
          className: "-mr-1 -mt-1 shrink-0",
          onClick: () => setDismissed(true),
          "aria-label": "Dismiss",
          children: /* @__PURE__ */ jsx(X, { className: "size-4" })
        }
      )
    ] })
  ] }) });
}
function GraphStatusBar({
  layerId = "graph",
  clickSelectId,
  canvas,
  className,
  style
}) {
  const resolved = useResolvedCanvas(canvas);
  const { zoom } = useZoom(canvas);
  const { selectedNodeIds, selectedEdgeIds, count: selectionCount } = useSelection(
    clickSelectId ? { clickSelectId } : {},
    canvas
  );
  const [pan, setPan] = useState({ x: resolved.camera.x, y: resolved.camera.y });
  const [pointer, setPointer] = useState(null);
  const [hover, setHover] = useState(null);
  const [counts, setCounts] = useState({ nodes: 0, edges: 0 });
  useCanvasEvent("input:camera:pan", ({ x, y }) => setPan({ x, y }), canvas);
  useEffect(() => {
    const store = resolved.layers.get(layerId)?.store;
    if (!store) return;
    const sync = () => setCounts({ nodes: store.nodeCount(), edges: store.edgeCount() });
    sync();
    return store.events.on("flush", sync);
  }, [resolved, layerId]);
  useEffect(() => {
    const el = resolved.renderer?.canvasElement;
    if (!el) return;
    const onMove = (e) => setPointer(resolved.camera.toWorld(e.offsetX, e.offsetY));
    const onLeave = () => setPointer(null);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerleave", onLeave);
    return () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, [resolved]);
  useEffect(() => {
    const layer = resolved.layers.get(layerId);
    const renderer = layer?.getRenderer();
    const store = layer?.store;
    if (!renderer || !store) return;
    const nodeLabel = (id) => {
      const node = store.getNode(id);
      if (!node) return id;
      return layer.resolveNodeStyle(node).labelText || id;
    };
    const edgeLabel = (id) => {
      const edge = store.getEdge(id);
      if (!edge) return id;
      return layer.resolveEdgeStyle(edge).labelText || edge.type || id;
    };
    const onShapeOver = (e) => setHover({ kind: "node", id: e.id, label: nodeLabel(e.id) });
    const onConnOver = (e) => setHover({ kind: "edge", id: e.id, label: edgeLabel(e.id) });
    const onOut = () => setHover(null);
    renderer.events.on("shape:pointerover", onShapeOver);
    renderer.events.on("shape:pointerout", onOut);
    renderer.events.on("connector:pointerover", onConnOver);
    renderer.events.on("connector:pointerout", onOut);
    return () => {
      renderer.events.off("shape:pointerover", onShapeOver);
      renderer.events.off("shape:pointerout", onOut);
      renderer.events.off("connector:pointerover", onConnOver);
      renderer.events.off("connector:pointerout", onOut);
    };
  }, [resolved, layerId]);
  const coord = (p) => p ? `${p.x.toFixed(0)}, ${p.y.toFixed(0)}` : "\u2014";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "flex items-center gap-2 whitespace-nowrap text-sm tabular-nums opacity-80",
        className
      ),
      style,
      children: [
        /* @__PURE__ */ jsxs("span", { children: [
          counts.nodes,
          " nodes and ",
          counts.edges,
          " edges rendered"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "opacity-40", children: "\xB7" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Zoom: ",
          Math.round(zoom * 100),
          "%"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "opacity-40", children: "\xB7" }),
        /* @__PURE__ */ jsxs("span", { children: [
          "Pan: ",
          coord(pan)
        ] }),
        pointer && /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx("span", { className: "opacity-40", children: "\xB7" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Pointer: ",
            coord(pointer)
          ] })
        ] }),
        hover && /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx("span", { className: "opacity-40", children: "\xB7" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Hovered ",
            `${hover.kind.charAt(0).toUpperCase() + hover.kind.slice(1)} - ${hover.label} [ID: ${hover.id}]`
          ] })
        ] }),
        selectionCount > 0 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx("span", { className: "opacity-40", children: "\xB7" }),
          /* @__PURE__ */ jsxs("span", { children: [
            "Selected:",
            " ",
            [
              selectedNodeIds.length > 0 ? `${selectedNodeIds.length} nodes` : null,
              selectedEdgeIds.length > 0 ? `${selectedEdgeIds.length} edges` : null
            ].filter(Boolean).join(", ")
          ] })
        ] })
      ]
    }
  );
}
function MenuItemList({ items, className }) {
  return /* @__PURE__ */ jsx("nav", { className: cn("w-[220px] !py-0 border bg-card text-card-foreground shadow-sm", className), role: "menubar", children: /* @__PURE__ */ jsx("ul", { className: "space-y-0.5 p-0", role: "menu", children: items.map((item) => /* @__PURE__ */ jsx(MenuItem, { ...item, className: cn("px-3 py-1.5", item.className) }, item.id)) }) });
}
function ContextMenuOverlay({ x, y, items, zIndex = 1e3, style }) {
  return /* @__PURE__ */ jsx(
    "div",
    {
      style: { position: "absolute", left: x, top: y, zIndex, ...style },
      onPointerDown: (ev) => ev.stopPropagation(),
      onContextMenu: (ev) => ev.preventDefault(),
      children: /* @__PURE__ */ jsx(MenuItemList, { items })
    }
  );
}
function isSafeImageSrc(s) {
  const t = s.trim();
  return /^data:image\//i.test(t) || /^https:\/\//i.test(t);
}
function HoverElementPreviewCard({ card, className, style }) {
  const imageUrl = card.imageUrl && isSafeImageSrc(card.imageUrl) ? card.imageUrl : void 0;
  const hasIdentity = !!(imageUrl || card.title || card.subtitle);
  return (
    // Design-kit tokens + Tailwind utilities (`bg-card` / `text-card-foreground`
    // / `border` / `shadow-xl` / `w-72` / `p-3` / `rounded-[10px]`) — the same
    // chrome the other canvas-ui cards use.
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: cn(
          "w-72 rounded-[10px] border bg-card p-3 text-card-foreground shadow-xl",
          className
        ),
        style,
        children: [
          hasIdentity ? /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2.5", children: [
            imageUrl ? /* @__PURE__ */ jsx(
              "img",
              {
                src: imageUrl,
                alt: "",
                className: cn(
                  "h-12 w-12 shrink-0 bg-muted object-cover",
                  card.imageShape === "circle" ? "rounded-full" : "rounded-md"
                ),
                onError: (e) => {
                  e.currentTarget.style.display = "none";
                }
              }
            ) : null,
            /* @__PURE__ */ jsxs("div", { className: "min-w-0 flex-1", children: [
              card.title ? /* @__PURE__ */ jsx("div", { className: "text-base font-semibold text-foreground", children: card.title }) : null,
              card.subtitle ? /* @__PURE__ */ jsx(
                "div",
                {
                  className: "mt-0.5 overflow-hidden text-sm text-muted-foreground",
                  style: {
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: card.subtitleMaxLines
                  },
                  children: card.subtitle
                }
              ) : null
            ] })
          ] }) : null,
          card.rows.length > 0 ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            hasIdentity ? /* @__PURE__ */ jsx(Separator, { className: "my-2.5" }) : null,
            /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-0.5", children: card.rows.map((row) => /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-3 text-sm", children: [
              /* @__PURE__ */ jsx("span", { className: "shrink-0 text-muted-foreground", children: row.label }),
              /* @__PURE__ */ jsx("span", { className: "truncate text-right text-foreground", title: row.value, children: row.value })
            ] }, row.label)) })
          ] }) : null
        ]
      }
    )
  );
}
function DevInfoToggleButton({
  defaultOn = false,
  canvas,
  ...layerOptions
}) {
  const [on, setOn] = useState(defaultOn);
  const contextCanvas = useContext(CanvasContext);
  const resolved = canvas ?? contextCanvas;
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx(
      ToolbarItems,
      {
        orientation: "horizontal",
        items: [
          {
            type: "toggle",
            key: "dev-info",
            icon: Gauge,
            label: "Dev overlay: off",
            activeLabel: "Dev overlay: on",
            active: on,
            onToggle: () => setOn((v) => !v)
          }
        ]
      }
    ),
    on && resolved ? /* @__PURE__ */ jsx(DevInfoLayer, { enabled: true, ...layerOptions }) : null
  ] });
}
var DEFAULT_VALUE = {
  format: "png",
  area: "content",
  background: "canvas",
  scale: 2,
  aspectRatio: 0
};
function ExportImageToolbar({
  formats,
  defaultValue,
  filename = "canvas",
  label = "Export",
  triggerText,
  triggerIcon: TriggerIcon = Download,
  align = "end",
  openDelay = 120,
  closeDelay = 200,
  canvas,
  className
}) {
  const { download } = useCanvasImageExport(canvas);
  const [value, setValue] = useState({ ...DEFAULT_VALUE, ...defaultValue });
  const onChange = (patch) => setValue((v) => ({ ...v, ...patch }));
  const onSave = () => {
    const opts = {
      format: value.format,
      area: value.area,
      background: value.background,
      scale: value.scale,
      filename: `${filename}-${value.area}`,
      ...value.aspectRatio > 0 ? { aspectRatio: value.aspectRatio } : {}
    };
    void download(opts);
  };
  const formatOptions = formats ? EXPORT_IMAGE_FORMAT_OPTIONS.filter((f) => formats.includes(f.value)) : void 0;
  return /* @__PURE__ */ jsxs(HoverCard, { openDelay, closeDelay, children: [
    /* @__PURE__ */ jsx(HoverCardTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: triggerText ? "sm" : "icon",
        "aria-label": label,
        className,
        children: [
          /* @__PURE__ */ jsx(TriggerIcon, { size: 16 }),
          triggerText
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(HoverCardContent, { align, className: "w-72 max-w-[calc(100vw-1rem)] p-3", children: /* @__PURE__ */ jsx(
      ExportImagePanel,
      {
        value,
        onChange,
        onSave,
        title: label,
        saveIcon: ImageDown,
        ...formatOptions ? { formats: formatOptions } : {}
      }
    ) })
  ] });
}
function ExportStateToolbar({
  filename = "canvas-state",
  label = "Canvas State",
  restoreView = true,
  showRestoreToggle = true,
  triggerText,
  triggerIcon: TriggerIcon = FileJson,
  align = "end",
  openDelay = 120,
  closeDelay = 200,
  canvas,
  className
}) {
  const { download, import: importState } = useCanvasStateJson(canvas);
  const [restore, setRestore] = useState(restoreView);
  const onExport = () => download(`${filename}.json`);
  const onImport = (file) => void importState(file, { skipInteraction: !restore });
  return /* @__PURE__ */ jsxs(HoverCard, { openDelay, closeDelay, children: [
    /* @__PURE__ */ jsx(HoverCardTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: triggerText ? "sm" : "icon",
        "aria-label": label,
        className,
        children: [
          /* @__PURE__ */ jsx(TriggerIcon, { size: 16 }),
          triggerText
        ]
      }
    ) }),
    /* @__PURE__ */ jsx(HoverCardContent, { align, className: "w-64 max-w-[calc(100vw-1rem)] p-3", children: /* @__PURE__ */ jsx(
      ExportStatePanel,
      {
        title: label,
        onExport,
        onImport,
        exportIcon: Download,
        importIcon: Upload,
        ...showRestoreToggle ? { restoreView: restore, onRestoreViewChange: setRestore } : {}
      }
    ) })
  ] });
}
function MiniMapToggleButton({
  defaultOn = true,
  canvas,
  ...layerOptions
}) {
  const [on, setOn] = useState(defaultOn);
  const contextCanvas = useContext(CanvasContext);
  const resolved = canvas ?? contextCanvas;
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx(
      ToolbarItems,
      {
        orientation: "horizontal",
        items: [
          {
            type: "toggle",
            key: "minimap",
            icon: Map$1,
            label: "Minimap: off",
            activeLabel: "Minimap: on",
            active: on,
            onToggle: () => setOn((v) => !v)
          }
        ]
      }
    ),
    on && resolved ? /* @__PURE__ */ jsx(MiniMapLayer, { ...layerOptions }) : null
  ] });
}
function controlWidgetOptionsSpecs(widgets) {
  const out = {};
  for (const [name, widget] of Object.entries(widgets)) if (widget.optionsSpec) out[name] = widget.optionsSpec;
  return out;
}
function ZoomReadoutWidget({ canvas }) {
  const { zoom } = useZoom(canvas);
  return /* @__PURE__ */ jsxs("span", { className: "px-2 text-sm tabular-nums text-muted-foreground", children: [
    Math.round(zoom * 100),
    "%"
  ] });
}
var PAN_STEP2 = 80;
var PAN_CELLS = [
  { key: "up", slot: "col-start-2 row-start-1", icon: ArrowUp, label: "Pan up", dx: 0, dy: 1 },
  { key: "left", slot: "col-start-1 row-start-2", icon: ArrowLeft, label: "Pan left", dx: 1, dy: 0 },
  { key: "right", slot: "col-start-3 row-start-2", icon: ArrowRight, label: "Pan right", dx: -1, dy: 0 },
  { key: "down", slot: "col-start-2 row-start-3", icon: ArrowDown, label: "Pan down", dx: 0, dy: -1 }
];
function PanPadWidget({ canvas, options }) {
  const step = typeof options?.step === "number" ? options.step : PAN_STEP2;
  const { states, run } = useCommandStates([{ command: "camera.pan" }, { command: "camera.reset" }], canvas);
  const panEnabled = states[0]?.enabled ?? false;
  return /* @__PURE__ */ jsxs("div", { className: "grid grid-cols-3 grid-rows-3 place-items-center", children: [
    PAN_CELLS.map((c) => /* @__PURE__ */ jsx("div", { className: c.slot, children: /* @__PURE__ */ jsx(
      ToolbarItems,
      {
        items: [{
          type: "button",
          key: c.key,
          icon: c.icon,
          label: c.label,
          disabled: !panEnabled,
          onClick: () => void run("camera.pan", { dx: c.dx * step, dy: c.dy * step })
        }]
      }
    ) }, c.key)),
    /* @__PURE__ */ jsx("div", { className: "col-start-2 row-start-2", children: /* @__PURE__ */ jsx(
      ToolbarItems,
      {
        items: [{
          type: "button",
          key: "reset",
          icon: LocateFixed,
          label: "Reset view",
          disabled: !states[1]?.enabled,
          onClick: () => void run("camera.reset")
        }]
      }
    ) })
  ] });
}
PanPadWidget.optionsSpec = {
  step: { kind: "number", label: "Step (px)", description: "How far one arrow click pans.", default: PAN_STEP2 }
};
function ExportImageWidget({ canvas, options }) {
  return /* @__PURE__ */ jsx(ExportImageToolbar, { ...options, canvas });
}
ExportImageWidget.optionsSpec = {
  formats: { kind: "strings", label: "Formats", description: "Offered formats, in order: png, jpg, webp, svg.", default: ["png", "jpg", "webp", "svg"] },
  filename: { kind: "string", label: "Filename", default: "canvas" },
  label: { kind: "string", label: "Label", default: "Export" },
  triggerText: { kind: "string", label: "Trigger text" },
  align: {
    kind: "enum",
    label: "Card alignment",
    default: "end",
    options: [
      { value: "start", label: "Start" },
      { value: "center", label: "Center" },
      { value: "end", label: "End" }
    ]
  },
  openDelay: { kind: "number", label: "Open delay (ms)", default: 120 },
  closeDelay: { kind: "number", label: "Close delay (ms)", default: 200 }
};
function ExportStateWidget({ canvas, options }) {
  return /* @__PURE__ */ jsx(ExportStateToolbar, { ...options, canvas });
}
function MiniMapToggleWidget({ canvas, options }) {
  return /* @__PURE__ */ jsx(MiniMapToggleButton, { ...options, canvas });
}
function DevInfoToggleWidget({ canvas, options }) {
  return /* @__PURE__ */ jsx(DevInfoToggleButton, { ...options, canvas });
}
var DEFAULT_CONTROL_WIDGETS = {
  "zoom-readout": ZoomReadoutWidget,
  "pan-pad": PanPadWidget,
  "export-image": ExportImageWidget,
  "export-state": ExportStateWidget,
  "minimap-toggle": MiniMapToggleWidget,
  "devinfo-toggle": DevInfoToggleWidget
};
var FOCUS_ZOOM = 2;
var DEFAULT_SHOWN = 15;
var REVEAL_STEP = 15;
var NAME_KEYS = ["name", "title", "label", "displayName", "id"];
function elementLabel(data, fallback) {
  if (data && typeof data === "object") {
    const rec = data;
    for (const key of NAME_KEYS) {
      const v = rec[key];
      if (typeof v === "string" && v.trim()) return v;
      if (typeof v === "number") return String(v);
    }
  }
  return fallback;
}
var ACTIVE_ROW_CLASSES = ["bg-accent", "text-accent-foreground"];
function RowContent({
  icon,
  label,
  trailing,
  muted,
  menuTarget
}) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "flex min-w-0 flex-1 select-none items-center gap-2",
      "data-menu-kind": menuTarget?.kind,
      "data-menu-id": menuTarget?.id,
      children: [
        icon,
        /* @__PURE__ */ jsx(
          "span",
          {
            title: label,
            className: `min-w-0 flex-1 truncate text-left ${muted ? "text-muted-foreground/50 line-through" : ""}`,
            children: label
          }
        ),
        trailing
      ]
    }
  );
}
function VisibilityToggle({
  visible,
  label,
  onToggle
}) {
  const Icon = visible ? Eye : EyeOff;
  return (
    // A role="button" span (not a real <button>) — this sits inside TreeItem's
    // row <button>, where nested interactive <button>s would be invalid markup.
    /* @__PURE__ */ jsx(
      "span",
      {
        role: "button",
        tabIndex: 0,
        "aria-label": `${visible ? "Hide" : "Show"} ${label} layer`,
        title: visible ? "Hide layer" : "Show layer",
        onClick: (e) => {
          e.stopPropagation();
          onToggle();
        },
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            onToggle();
          }
        },
        className: `grid h-5 w-5 shrink-0 place-items-center rounded hover:bg-accent ${visible ? "text-foreground" : "text-muted-foreground/60"}`,
        children: /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" })
      }
    )
  );
}
function IconToggle({
  icon: Icon,
  muted,
  ariaLabel,
  title,
  onToggle
}) {
  return /* @__PURE__ */ jsx(
    "span",
    {
      role: "button",
      tabIndex: 0,
      "aria-label": ariaLabel,
      title,
      onClick: (e) => {
        e.stopPropagation();
        onToggle();
      },
      onKeyDown: (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          onToggle();
        }
      },
      className: `grid h-5 w-5 shrink-0 place-items-center rounded hover:bg-accent ${muted ? "text-muted-foreground/60" : "text-foreground"}`,
      children: /* @__PURE__ */ jsx(Icon, { className: "h-3.5 w-3.5" })
    }
  );
}
function groupByType(entries, opts) {
  const { prefix, kind, typeIcon, leafIcon, labelOf, isHidden, forceHidden, ctx } = opts;
  const counts = /* @__PURE__ */ new Map();
  const samples = /* @__PURE__ */ new Map();
  let total = 0;
  for (const el of entries) {
    total += 1;
    const type = el.type ?? "(untyped)";
    counts.set(type, (counts.get(type) ?? 0) + 1);
    let bucket = samples.get(type);
    if (!bucket) {
      bucket = [];
      samples.set(type, bucket);
    }
    if (bucket.length < ctx.limitFor(`${prefix}:${type}`)) bucket.push(el);
  }
  const TypeIcon = typeIcon;
  const LeafIcon = leafIcon;
  const groups = [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([type, count]) => {
    const key = `${prefix}:${type}`;
    const shown = samples.get(type) ?? [];
    const children = shown.map((el) => {
      const id = String(el.id);
      const hidden = isHidden(el) || forceHidden;
      return {
        id: `${key}:${id}`,
        label: "",
        icon: /* @__PURE__ */ jsx(
          RowContent,
          {
            icon: hidden ? /* @__PURE__ */ jsx(EyeOff, { className: "h-3 w-3 shrink-0 text-muted-foreground/50" }) : /* @__PURE__ */ jsx(LeafIcon, { className: "h-3 w-3 shrink-0 text-muted-foreground/70" }),
            label: labelOf(el),
            muted: hidden,
            menuTarget: { kind, id }
          }
        ),
        onClick: () => ctx.onLeafClick(kind, id)
      };
    });
    const remaining = count - children.length;
    if (remaining > 0) {
      children.push({
        id: `${key}:__more`,
        label: "",
        icon: /* @__PURE__ */ jsx(
          RowContent,
          {
            icon: /* @__PURE__ */ jsx(MoreHorizontal, { className: "h-3 w-3 shrink-0 text-muted-foreground/50" }),
            label: remaining <= REVEAL_STEP ? `Show ${remaining} more` : `Show ${REVEAL_STEP} more of ${remaining}`,
            muted: forceHidden
          }
        ),
        onClick: () => ctx.onReveal(key)
      });
    }
    return {
      id: key,
      label: "",
      icon: /* @__PURE__ */ jsx(
        RowContent,
        {
          icon: /* @__PURE__ */ jsx(TypeIcon, { className: "h-3 w-3 shrink-0 text-muted-foreground" }),
          label: `${type} \xB7 ${count}`,
          muted: forceHidden
        },
        type
      ),
      children
    };
  });
  return { groups, total };
}
var LAYER_META = {
  graph: { label: "Graph", icon: Network },
  background: { label: "Background", icon: Image },
  minimap: { label: "Minimap", icon: Map$1 }
};
function buildGroupsSection(layer, store, ctx, forceHidden) {
  const groupIds = [];
  for (const n of store.nodes()) {
    if (layer.isGroupNode(n)) groupIds.push(String(n.id));
  }
  if (groupIds.length === 0) return null;
  groupIds.sort((a, b) => a.localeCompare(b));
  const groupRows = groupIds.map((gid) => {
    const gnode = store.getNode(gid);
    const gLabel = elementLabel(gnode?.data, gid);
    const frameHidden = layer.isGroupHidden(gid);
    let allHidden = frameHidden;
    if (frameHidden) {
      for (const descId of store.descendantsOf(gid)) {
        if (!store.isNodeHidden(descId)) {
          allHidden = false;
          break;
        }
      }
    }
    const frameMuted = frameHidden || forceHidden;
    const allMuted = allHidden || forceHidden;
    const gHidden = frameHidden || forceHidden;
    const memberRows = [];
    for (const mid of store.childrenOf(gid)) {
      const id = String(mid);
      const m = store.getNode(id);
      const hidden = store.isNodeHidden(id) || forceHidden;
      memberRows.push({
        id: `graph:group:${gid}:member:${id}`,
        label: "",
        icon: /* @__PURE__ */ jsx(
          RowContent,
          {
            icon: hidden ? /* @__PURE__ */ jsx(EyeOff, { className: "h-3 w-3 shrink-0 text-muted-foreground/50" }) : /* @__PURE__ */ jsx(Circle, { className: "h-3 w-3 shrink-0 text-muted-foreground/70" }),
            label: elementLabel(m?.data, id),
            muted: hidden,
            menuTarget: { kind: "node", id }
          }
        ),
        onClick: () => ctx.onLeafClick("node", id)
      });
    }
    return {
      id: `graph:group:${gid}`,
      label: "",
      icon: /* @__PURE__ */ jsx(
        RowContent,
        {
          icon: gHidden ? /* @__PURE__ */ jsx(EyeOff, { className: "h-3 w-3 shrink-0 text-muted-foreground/50" }) : /* @__PURE__ */ jsx(Boxes, { className: "h-3 w-3 shrink-0 text-muted-foreground/70" }),
          label: gLabel,
          muted: gHidden,
          menuTarget: { kind: "group", id: gid },
          trailing: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-0.5", children: [
            /* @__PURE__ */ jsx(
              IconToggle,
              {
                icon: Frame,
                muted: frameMuted,
                ariaLabel: `${frameHidden ? "Show" : "Hide"} ${gLabel} group frame only`,
                title: frameHidden ? "Show group frame" : "Hide group frame only",
                onToggle: () => {
                  if (frameHidden) layer.showNode(gid);
                  else layer.hideNode(gid);
                  ctx.refresh();
                }
              }
            ),
            /* @__PURE__ */ jsx(
              IconToggle,
              {
                icon: allMuted ? EyeOff : Eye,
                muted: allMuted,
                ariaLabel: `${allHidden ? "Show" : "Hide"} ${gLabel} group and members`,
                title: allHidden ? "Show group + members" : "Hide group + members",
                onToggle: () => {
                  if (allHidden) layer.showGroup(gid);
                  else layer.hideGroup(gid);
                  ctx.refresh();
                }
              }
            )
          ] })
        }
      ),
      children: memberRows.length > 0 ? memberRows : void 0
    };
  });
  return {
    id: "graph:groups",
    label: "",
    icon: /* @__PURE__ */ jsx(
      RowContent,
      {
        icon: /* @__PURE__ */ jsx(Boxes, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
        label: `Groups \xB7 ${groupIds.length}`,
        muted: forceHidden
      }
    ),
    children: groupRows
  };
}
function buildItems(canvas, ctx) {
  if (!canvas) return [];
  const layers = [...canvas.layers.byZOrder()].reverse();
  return layers.map((layer) => {
    const meta = LAYER_META[layer.id] ?? { label: layer.id, icon: Layers };
    const LayerIcon = meta.icon;
    let children;
    if (layer.id === "graph") {
      const graphLayer = canvas.layers.get("graph");
      const store = graphLayer?.store;
      if (store && graphLayer) {
        const forceHidden = !graphLayer.visible;
        const nodes = groupByType(store.nodes(), {
          prefix: "graph:node",
          kind: "node",
          typeIcon: Circle,
          leafIcon: Circle,
          labelOf: (n) => elementLabel(n.data, String(n.id)),
          isHidden: (n) => store.isNodeHidden(String(n.id)),
          forceHidden,
          ctx
        });
        const edges = groupByType(store.edges(), {
          prefix: "graph:edge",
          kind: "edge",
          typeIcon: Spline,
          leafIcon: ArrowRight,
          labelOf: (e) => `${e.source} \u2192 ${e.target}`,
          isHidden: (e) => store.isEdgeHidden(String(e.id)),
          forceHidden,
          ctx
        });
        const groupsSection = buildGroupsSection(graphLayer, store, ctx, forceHidden);
        children = [
          {
            id: "graph:nodes",
            label: "",
            icon: /* @__PURE__ */ jsx(
              RowContent,
              {
                icon: /* @__PURE__ */ jsx(Circle, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
                label: `Nodes \xB7 ${nodes.total}`,
                muted: forceHidden
              }
            ),
            children: nodes.groups
          },
          {
            id: "graph:edges",
            label: "",
            icon: /* @__PURE__ */ jsx(
              RowContent,
              {
                icon: /* @__PURE__ */ jsx(Spline, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" }),
                label: `Edges \xB7 ${edges.total}`,
                muted: forceHidden
              }
            ),
            children: edges.groups
          },
          ...groupsSection ? [groupsSection] : []
        ];
      }
    }
    return {
      id: layer.id,
      label: "",
      icon: /* @__PURE__ */ jsx(
        RowContent,
        {
          icon: /* @__PURE__ */ jsx(LayerIcon, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
          label: meta.label,
          menuTarget: { kind: "layer", id: layer.id },
          trailing: /* @__PURE__ */ jsx(
            VisibilityToggle,
            {
              visible: layer.visible,
              label: meta.label,
              onToggle: () => {
                layer.setVisible(!layer.visible);
                ctx.refresh();
              }
            }
          )
        }
      ),
      children
    };
  });
}
function graphRefs(canvas) {
  const layer = canvas?.layers.get("graph") ?? void 0;
  const select = canvas?.behaviours.get("click-select") ?? void 0;
  return { layer, store: layer?.store, select };
}
function selectElement(canvas, kind, id) {
  graphRefs(canvas).select?.select(id, kind === "node" ? "shape" : "connector");
}
function focusElement(canvas, kind, id) {
  const { layer, select } = graphRefs(canvas);
  if (kind === "node") {
    select?.select(id, "shape");
    layer?.focusNode(id, { zoom: FOCUS_ZOOM });
  } else {
    select?.select(id, "connector");
    layer?.focusEdges([id]);
  }
}
function setElementHidden(store, kind, id, hidden) {
  if (kind === "node") store.setNodeHidden(id, hidden);
  else store.setEdgeHidden(id, hidden);
}
function ContextMenuItems({
  canvas,
  target,
  refresh
}) {
  if (target.kind === "layer") {
    const layer = canvas?.layers.get(target.id);
    const visible = layer?.visible ?? true;
    return /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "start", className: "w-44", children: [
      target.id === "graph" && /* @__PURE__ */ jsxs(
        DropdownMenuItem,
        {
          onSelect: () => {
            const g = canvas?.layers.get("graph");
            if (g && canvas) canvas.camera.fitContent(g.getBounds(), 80);
          },
          children: [
            /* @__PURE__ */ jsx(Crosshair, { className: "mr-2 h-4 w-4" }),
            " Focus layer"
          ]
        }
      ),
      /* @__PURE__ */ jsx(
        DropdownMenuItem,
        {
          onSelect: () => {
            layer?.setVisible(!layer.visible);
            refresh();
          },
          children: visible ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(EyeOff, { className: "mr-2 h-4 w-4" }),
            " Hide layer"
          ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(Eye, { className: "mr-2 h-4 w-4" }),
            " Show layer"
          ] })
        }
      )
    ] });
  }
  if (target.kind === "group") {
    const layer = graphRefs(canvas).layer;
    const gid = target.id;
    const gHidden = layer?.isGroupHidden(gid) ?? false;
    return /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "start", className: "w-52", children: [
      /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => layer?.focusNode(gid, { zoom: FOCUS_ZOOM }), children: [
        /* @__PURE__ */ jsx(Crosshair, { className: "mr-2 h-4 w-4" }),
        " Focus on group"
      ] }),
      /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
      gHidden ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => {
          layer?.showNode(gid);
          refresh();
        }, children: [
          /* @__PURE__ */ jsx(Eye, { className: "mr-2 h-4 w-4" }),
          " Show group only"
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => {
          layer?.showGroup(gid);
          refresh();
        }, children: [
          /* @__PURE__ */ jsx(Eye, { className: "mr-2 h-4 w-4" }),
          " Show group + members"
        ] })
      ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => {
          layer?.hideNode(gid);
          refresh();
        }, children: [
          /* @__PURE__ */ jsx(EyeOff, { className: "mr-2 h-4 w-4" }),
          " Hide group only"
        ] }),
        /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => {
          layer?.hideGroup(gid);
          refresh();
        }, children: [
          /* @__PURE__ */ jsx(EyeOff, { className: "mr-2 h-4 w-4" }),
          " Hide group + members"
        ] })
      ] })
    ] });
  }
  const { kind, id } = target;
  const store = graphRefs(canvas).store;
  const hidden = kind === "node" ? store?.isNodeHidden(id) ?? false : store?.isEdgeHidden(id) ?? false;
  const noun = kind === "node" ? "node" : "edge";
  return /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "start", className: "w-44", children: [
    /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => focusElement(canvas, kind, id), children: [
      /* @__PURE__ */ jsx(Crosshair, { className: "mr-2 h-4 w-4" }),
      " Focus on ",
      noun
    ] }),
    /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => selectElement(canvas, kind, id), children: [
      /* @__PURE__ */ jsx(MousePointer2, { className: "mr-2 h-4 w-4" }),
      " Select ",
      noun
    ] }),
    /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
    /* @__PURE__ */ jsx(
      DropdownMenuItem,
      {
        onSelect: () => {
          if (!store) return;
          setElementHidden(store, kind, id, !hidden);
          refresh();
        },
        children: hidden ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx(Eye, { className: "mr-2 h-4 w-4" }),
          " Show ",
          noun
        ] }) : /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx(EyeOff, { className: "mr-2 h-4 w-4" }),
          " Hide ",
          noun
        ] })
      }
    )
  ] });
}
function LayersViewPanel({ canvas: explicit }) {
  const contextCanvas = useContext(GraphCanvasContext);
  const canvas = explicit ?? contextCanvas;
  const [rev, bumpRev] = useReducer((n) => n + 1, 0);
  const [menu, setMenu] = useState(null);
  const activeRowRef = useRef(null);
  const clearActiveRow = useCallback(() => {
    activeRowRef.current?.classList.remove(...ACTIVE_ROW_CLASSES);
    activeRowRef.current = null;
  }, []);
  const handleContextMenu = useCallback(
    (e) => {
      e.preventDefault();
      clearActiveRow();
      const row = e.target.closest("button");
      const holder = row?.querySelector("[data-menu-id]");
      const kind = holder?.dataset.menuKind;
      const id = holder?.dataset.menuId;
      if (!row || !kind || !id) {
        setMenu(null);
        return;
      }
      row.classList.add(...ACTIVE_ROW_CLASSES);
      activeRowRef.current = row;
      setMenu({
        x: e.clientX,
        y: e.clientY,
        target: { kind, id }
      });
    },
    [clearActiveRow]
  );
  const onLeafClick = useCallback(
    (kind, id) => selectElement(canvas, kind, id),
    [canvas]
  );
  const shownRef = useRef(/* @__PURE__ */ new Map());
  const limitFor = useCallback(
    (typeKey) => shownRef.current.get(typeKey) ?? DEFAULT_SHOWN,
    []
  );
  const reveal = useCallback((typeKey) => {
    const cur = shownRef.current.get(typeKey) ?? DEFAULT_SHOWN;
    shownRef.current.set(typeKey, cur + REVEAL_STEP);
    bumpRev();
  }, []);
  const frameRef = useRef(null);
  const scheduleRebuild = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      bumpRev();
    });
  }, []);
  useEffect(() => {
    if (!canvas) return;
    const graph = canvas.layers.get("graph");
    const store = graph?.store;
    const unsubs = [];
    if (store) {
      const storeEvents = [
        "node:add",
        "node:remove",
        "edge:add",
        "edge:remove",
        "node:visibility",
        "edge:visibility"
      ];
      for (const ev of storeEvents) unsubs.push(store.events.on(ev, scheduleRebuild));
    }
    if (graph) unsubs.push(graph.events.on("data:changed", scheduleRebuild));
    if (graph) unsubs.push(graph.events.on("group:visibility", scheduleRebuild));
    unsubs.push(canvas.events.on("scene:layer:visibilitychange", scheduleRebuild));
    unsubs.push(canvas.events.on("scene:layer:add", scheduleRebuild));
    scheduleRebuild();
    return () => {
      for (const off of unsubs) off();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [canvas, scheduleRebuild]);
  const ctx = useMemo(
    () => ({ limitFor, onReveal: reveal, onLeafClick, refresh: bumpRev }),
    [limitFor, reveal, onLeafClick]
  );
  const items = useMemo(() => buildItems(canvas, ctx), [canvas, ctx, rev]);
  return /* @__PURE__ */ jsx("div", { className: "flex h-full flex-col overflow-hidden bg-popover text-popover-foreground", children: /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto p-2", children: items.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-muted-foreground", children: [
    /* @__PURE__ */ jsx(Layers, { className: "h-6 w-6" }),
    /* @__PURE__ */ jsx("p", { className: "text-base", children: "No canvas layers" }),
    /* @__PURE__ */ jsx("p", { className: "text-sm", children: "Mount a canvas to see its layers." })
  ] }) : /* @__PURE__ */ jsxs("div", { onContextMenu: handleContextMenu, children: [
    /* @__PURE__ */ jsx(
      TreeView,
      {
        items,
        className: "w-full border-0 bg-transparent p-0 shadow-none"
      }
    ),
    /* @__PURE__ */ jsxs(
      DropdownMenu,
      {
        open: menu !== null,
        onOpenChange: (open) => {
          if (!open) {
            clearActiveRow();
            setMenu(null);
          }
        },
        children: [
          /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
            "span",
            {
              "aria-hidden": true,
              className: "pointer-events-none fixed h-0 w-0",
              style: { left: menu?.x ?? 0, top: menu?.y ?? 0 }
            }
          ) }),
          menu && /* @__PURE__ */ jsx(
            ContextMenuItems,
            {
              canvas,
              target: menu.target,
              refresh: bumpRev
            }
          )
        ]
      }
    )
  ] }) }) });
}
var NoIcon = () => null;
var UNAVAILABLE = " (unavailable)";
var PROVIDER_HINTS = [
  ["clipboard.", "use a GraphCanvas, or mount <GraphClipboardProvider> on a plain Canvas"],
  ["theme.toggle", "mount <CanvasThemeSync> inside a <ThemeProvider>"]
];
var UNAVAILABLE_GRACE_MS = 1e3;
var warnedUnavailable = /* @__PURE__ */ new WeakMap();
function isDevBuild() {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}
function useWarnUnavailable(canvas, missing) {
  const key = missing.join("\n");
  useEffect(() => {
    if (!key || !isDevBuild()) return;
    const timer = setTimeout(() => {
      const warned = warnedUnavailable.get(canvas) ?? /* @__PURE__ */ new Set();
      warnedUnavailable.set(canvas, warned);
      for (const name of key.split("\n")) {
        if (warned.has(name) || canvas.commands.has(name)) continue;
        warned.add(name);
        const hint = PROVIDER_HINTS.find(([prefix]) => name.startsWith(prefix))?.[1];
        console.warn(
          `[canvas-ui] control bound to command "${name}", which isn't registered on this canvas \u2014 it draws disabled.${hint ? ` To enable it, ${hint}.` : ""}`
        );
      }
    }, UNAVAILABLE_GRACE_MS);
    return () => clearTimeout(timer);
  }, [canvas, key]);
}
function SlotContent({ name, canvas }) {
  return /* @__PURE__ */ jsx(Fragment$1, { children: useControlPanelSlot(name, canvas) });
}
function useControlItems(items, { icons, widgets, canvas } = {}) {
  const resolved = useResolvedCanvas(canvas);
  const iconMap = useMemo(() => ({ ...DEFAULT_CONTROL_ICONS, ...icons }), [icons]);
  const widgetMap = useMemo(() => ({ ...DEFAULT_CONTROL_WIDGETS, ...widgets }), [widgets]);
  const refs = items.flatMap(
    (it) => it.type === "command" || it.type === "toggle" || it.type === "choice" ? [{ command: it.command, args: it.args }] : []
  );
  const { states, run } = useCommandStates(refs, resolved);
  useWarnUnavailable(
    resolved,
    refs.flatMap((r, i) => states[i]?.available === false ? [r.command] : [])
  );
  let c = 0;
  return items.flatMap((it, i) => {
    const key = it.key ?? `${it.type}-${i}`;
    switch (it.type) {
      case "command": {
        const st = states[c++];
        const active = st?.active ?? false;
        const iconName = (active ? it.activeIcon : void 0) ?? it.icon;
        const icon = iconName ? iconMap[iconName] : void 0;
        const label = `${(active ? it.activeLabel : void 0) ?? it.label}${st?.available === false ? UNAVAILABLE : ""}`;
        const text = (active ? it.activeText : void 0) ?? it.text ?? (icon ? void 0 : label);
        return [{
          type: "button",
          key,
          icon: icon ?? NoIcon,
          label,
          ...text !== void 0 ? { text } : {},
          disabled: !st?.enabled,
          onClick: () => void run(it.command, it.args)
        }];
      }
      case "toggle": {
        const st = states[c++];
        const icon = (it.icon ? iconMap[it.icon] : void 0) ?? NoIcon;
        const activeIcon = it.activeIcon ? iconMap[it.activeIcon] : void 0;
        const suffix = st?.available === false ? UNAVAILABLE : "";
        return [{
          type: "toggle",
          key,
          icon,
          ...activeIcon ? { activeIcon } : {},
          label: `${it.label}${suffix}`,
          ...it.activeLabel !== void 0 ? { activeLabel: `${it.activeLabel}${suffix}` } : {},
          active: st?.active ?? false,
          disabled: !st?.enabled,
          onToggle: () => void run(it.command, it.args)
        }];
      }
      case "choice": {
        const st = states[c++];
        const options = it.options ?? st?.options ?? [];
        if (options.length === 0) return [];
        const optionIcons = {};
        for (const o of options) {
          const Icon = o.icon ? iconMap[o.icon] : void 0;
          if (Icon) optionIcons[o.value] = Icon;
        }
        return [{
          type: "select",
          key,
          label: it.label,
          value: st?.value ?? options[0].value,
          options: Object.fromEntries(options.map((o) => [o.value, o.label])),
          ...Object.keys(optionIcons).length > 0 ? { icons: optionIcons, triggerLabelOnly: true } : {},
          ...it.display ? { display: it.display } : {},
          disabled: !st?.enabled,
          onChange: (value) => void run(it.command, { ...it.args, value })
        }];
      }
      case "divider":
        return [{ type: "divider", key }];
      case "text":
        return [{
          type: "custom",
          key,
          render: () => /* @__PURE__ */ jsx("span", { className: "px-2 text-sm font-semibold whitespace-nowrap text-foreground", children: it.text })
        }];
      case "widget": {
        const Widget = widgetMap[it.widget];
        return Widget ? [{ type: "custom", key, render: () => /* @__PURE__ */ jsx(Widget, { canvas: resolved, ...it.options ? { options: it.options } : {} }) }] : [];
      }
      case "slot":
        return [{ type: "custom", key, render: () => /* @__PURE__ */ jsx(SlotContent, { name: it.slot, canvas: resolved }) }];
      default:
        return [];
    }
  });
}
function ControlItems({ items, orientation = "horizontal", tooltipSide, extra, className, ...opts }) {
  const resolved = useControlItems(items, opts);
  const all = extra && extra.length > 0 ? [...resolved, ...extra] : resolved;
  return /* @__PURE__ */ jsx(
    ToolbarItems,
    {
      items: all,
      orientation,
      ...tooltipSide ? { tooltipSide } : {},
      ...className ? { className } : {}
    }
  );
}

// src/view-panels/element-display.ts
var asName = (v) => typeof v === "string" && v.length > 0 ? v : void 0;
var isRecord = (v) => typeof v === "object" && v !== null;
var labelOfNode = (n) => {
  const d = n.data;
  return asName(n.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) ?? asName(d.group) ?? asName(d.category) : void 0) ?? "node";
};
var labelOfEdge = (e) => {
  const d = e.data;
  return asName(e.type) ?? (isRecord(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) : void 0) ?? "edge";
};
var displayNameOf = (el) => {
  const d = el.data;
  return (isRecord(d) ? asName(d.name) ?? asName(d.title) ?? asName(d.label) : void 0) ?? el.id;
};
var hexColor = (c) => `#${(c & 16777215).toString(16).padStart(6, "0")}`;
function solidColorOf(fill) {
  if (typeof fill === "number") return fill;
  const layers = Array.isArray(fill) ? fill : fill != null ? [fill] : [];
  for (const l of layers) if (isRecord(l) && l.kind === "solid" && typeof l.color === "number") return l.color;
  return void 0;
}
function nodeSwatchColor(style) {
  const shape = style.shape;
  const c = solidColorOf(style.bgFill) ?? (typeof shape?.fill === "number" ? shape.fill : void 0) ?? (typeof style.bgStrokeColor === "number" ? style.bgStrokeColor : void 0);
  return c === void 0 ? void 0 : hexColor(c);
}
function useInspectedTarget(canvas, inspectBehaviourId) {
  const behaviour = useBehaviourInstance(inspectBehaviourId, canvas);
  const [target, setTarget] = useState(() => behaviour?.getTarget() ?? null);
  useEffect(() => {
    setTarget(behaviour?.getTarget() ?? null);
    if (!behaviour) return;
    return behaviour.events.on("inspect:change", setTarget);
  }, [behaviour]);
  return { target, behaviourPresent: behaviour !== null };
}
var MAX_VALUE_CHARS = 400;
function formatValue(v) {
  if (v === null || v === void 0) return null;
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}
function CopyButton({ text, label }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1200);
    return () => clearTimeout(t);
  }, [copied]);
  if (typeof navigator === "undefined" || !navigator.clipboard) return null;
  return /* @__PURE__ */ jsx(
    Button,
    {
      variant: "ghost",
      size: "icon",
      title: label,
      onClick: () => void navigator.clipboard.writeText(text).then(() => setCopied(true)),
      className: "h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100",
      children: copied ? /* @__PURE__ */ jsx(Check, { className: "h-3 w-3 text-primary" }) : /* @__PURE__ */ jsx(Copy, { className: "text-muted-foreground/70 h-3 w-3" })
    }
  );
}
function Section({ title, children }) {
  return /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-1.5", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-muted-foreground px-1 text-sm font-medium", children: title }),
    children
  ] });
}
function ValueRow({ label, value, mono }) {
  return /* @__PURE__ */ jsx(PropertyRow, { label, mono, className: "group", children: /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-start gap-1", children: [
    value === null ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/60", children: "\u2014" }) : /* @__PURE__ */ jsx("span", { className: "min-w-0 break-all", title: value.length > MAX_VALUE_CHARS ? value : void 0, children: value.length > MAX_VALUE_CHARS ? `${value.slice(0, MAX_VALUE_CHARS)}\u2026` : value }),
    value === null ? null : /* @__PURE__ */ jsx(CopyButton, { text: value, label: `Copy ${label}` })
  ] }) });
}
function ElementInspectorViewPanel({ canvas, className, ...rest }) {
  if (!canvas) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full items-center justify-center", className), children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-4 text-base", children: "Failed to load \u2014 no canvas." }) });
  }
  return /* @__PURE__ */ jsx(ElementInspectorViewPanelContent, { canvas, className, ...rest });
}
function ElementInspectorViewPanelContent({
  canvas,
  layerId = "graph",
  inspectBehaviourId = "click-inspect",
  elementId,
  focusZoom = 2,
  renderExtra,
  className
}) {
  const layer = canvas.layers.get(layerId) ?? void 0;
  const store = layer?.store;
  const { target, behaviourPresent } = useInspectedTarget(canvas, inspectBehaviourId);
  const controlled = elementId !== void 0;
  const inspectedId = controlled ? elementId ?? null : target?.id ?? null;
  const [dataRev, setDataRev] = useState(0);
  useEffect(() => {
    if (!store) return;
    let frame = 0;
    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setDataRev((r) => r + 1);
      });
    };
    const unsubs = [
      store.events.on("node:update", schedule),
      store.events.on("node:remove", schedule),
      store.events.on("edge:update", schedule),
      store.events.on("edge:remove", schedule)
    ];
    return () => {
      if (frame) cancelAnimationFrame(frame);
      for (const off of unsubs) off();
    };
  }, [store]);
  const resolved = useMemo(() => {
    if (!inspectedId || !store) return null;
    const node = store.getNode(inspectedId);
    if (node) return { kind: "node", node };
    const edge = store.getEdge(inspectedId);
    if (edge) return { kind: "edge", edge };
    return null;
  }, [inspectedId, store, dataRev]);
  const focusNode = useCallback(
    (id) => layer?.focusNode(id, { zoom: focusZoom, includeHidden: true }),
    [layer, focusZoom]
  );
  const focusInspected = useCallback(() => {
    if (!resolved) return;
    if (resolved.kind === "node") focusNode(resolved.node.id);
    else layer?.focusEdges([resolved.edge.id], { includeHidden: true });
  }, [resolved, layer, focusNode]);
  const element = resolved ? resolved.kind === "node" ? resolved.node : resolved.edge : null;
  const properties = element && isRecord(element.data) ? Object.entries(element.data) : [];
  return /* @__PURE__ */ jsxs("div", { className: cn("flex h-full flex-col gap-2 overflow-hidden p-2 text-base", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground min-w-0 truncate text-sm", children: controlled ? "Inspecting" : resolved ? `Clicked ${resolved.kind}` : "No element" }),
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          disabled: !resolved,
          onClick: focusInspected,
          title: "Frame this element on the canvas",
          className: "shrink-0 gap-1.5 [&_svg]:size-3.5",
          children: [
            /* @__PURE__ */ jsx(Crosshair, { className: "text-muted-foreground/70" }),
            "Focus"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: !inspectedId ? (
      // Two different nothings: no click yet, versus nothing that can report a
      // click. Collapsing them would leave a host debugging an empty panel that
      // was never wired up.
      /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground flex items-start gap-2 px-1 text-sm", children: [
        /* @__PURE__ */ jsx(MousePointerClick, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
        /* @__PURE__ */ jsx("span", { className: "min-w-0", children: behaviourPresent || controlled ? "Click a node or an edge on the canvas to inspect it." : /* @__PURE__ */ jsxs(Fragment$1, { children: [
          "No ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: "ClickInspectBehaviour" }),
          " is registered, so nothing reports which element was clicked. Register and enable one (id",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: inspectBehaviourId }),
          "), or pass an explicit",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: "elementId" }),
          "."
        ] }) })
      ] })
    ) : !resolved || !element ? (
      // The id is selected but resolves to no element in this layer: removed
      // while selected, or belonging to a different layer. Say which id.
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 px-1", children: [
        /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground flex items-start gap-2 text-sm", children: [
          /* @__PURE__ */ jsx(HelpCircle, { className: "mt-0.5 h-3.5 w-3.5 shrink-0" }),
          /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
            "This element is no longer in the ",
            /* @__PURE__ */ jsx("span", { className: "font-mono", children: layerId }),
            " layer \u2014 it may have been removed since it was clicked."
          ] })
        ] }),
        /* @__PURE__ */ jsx("p", { className: "text-muted-foreground/80 break-all font-mono text-sm", children: inspectedId })
      ] })
    ) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3", children: [
      /* @__PURE__ */ jsxs(Section, { title: "Element", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 px-1", children: [
          resolved.kind === "node" ? (
            // Hollow when the node has no representable solid colour.
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "border-muted-foreground/40 mt-1 block h-3 w-3 shrink-0 rounded-full border",
                style: layer && nodeSwatchColor(layer.resolveNodeStyle(resolved.node)) ? { backgroundColor: nodeSwatchColor(layer.resolveNodeStyle(resolved.node)) } : void 0
              }
            )
          ) : /* @__PURE__ */ jsx(ArrowRight, { className: "text-muted-foreground/70 mt-1 h-3 w-3 shrink-0" }),
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-col gap-1", children: [
            /* @__PURE__ */ jsx("span", { className: "break-words font-medium", children: displayNameOf(element) }),
            /* @__PURE__ */ jsxs("span", { className: "flex flex-wrap items-center gap-1", children: [
              /* @__PURE__ */ jsx(Badge, { variant: "soft", tone: resolved.kind === "node" ? "info" : "primary", size: "xs", children: resolved.kind }),
              /* @__PURE__ */ jsx(Badge, { variant: "outline", size: "xs", children: resolved.kind === "node" ? labelOfNode(resolved.node) : labelOfEdge(resolved.edge) })
            ] })
          ] })
        ] }),
        /* @__PURE__ */ jsx(PropertyList, { labelWidth: 72, className: "px-1", children: /* @__PURE__ */ jsx(ValueRow, { label: "id", value: element.id, mono: true }) })
      ] }),
      resolved.kind === "edge" && /* @__PURE__ */ jsx(Section, { title: "Endpoints", children: /* @__PURE__ */ jsx(PropertyList, { labelWidth: 72, className: "px-1", children: ["source", "target"].map((end) => {
        const id = resolved.edge[end];
        const node = store?.getNode(id);
        return /* @__PURE__ */ jsx(PropertyRow, { label: end, children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            onClick: () => focusNode(id),
            title: `Focus ${end} node ${id}`,
            className: "h-auto min-w-0 justify-start px-1.5 py-0.5 text-left font-normal",
            children: /* @__PURE__ */ jsxs("span", { className: "min-w-0 truncate", children: [
              node ? displayNameOf(node) : id,
              node ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/60 ml-1 font-mono", children: id }) : null
            ] })
          }
        ) }, end);
      }) }) }),
      renderExtra ? /* @__PURE__ */ jsx("div", { className: "px-1", children: renderExtra(element, resolved.kind) }) : null,
      /* @__PURE__ */ jsx(Section, { title: `Properties${properties.length > 0 ? ` (${properties.length})` : ""}`, children: properties.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-sm italic", children: "No properties" }) : /* @__PURE__ */ jsx(PropertyList, { labelWidth: 96, className: "px-1", children: properties.map(([key, value]) => /* @__PURE__ */ jsx(ValueRow, { label: key, value: formatValue(value) }, key)) }) }),
      /* @__PURE__ */ jsx(Section, { title: "State", children: /* @__PURE__ */ jsxs(PropertyList, { labelWidth: 96, className: "px-1", children: [
        /* @__PURE__ */ jsx(ValueRow, { label: "type", value: element.type }),
        /* @__PURE__ */ jsx(ValueRow, { label: "hidden", value: String(element.hidden === true) }),
        resolved.kind === "node" && /* @__PURE__ */ jsx(ValueRow, { label: "pinned", value: String(resolved.node.pinned === true) }),
        resolved.kind === "node" && /* @__PURE__ */ jsx(
          ValueRow,
          {
            label: "position",
            value: resolved.node.position ? `${Math.round(resolved.node.position.x)}, ${Math.round(resolved.node.position.y)}` : null,
            mono: true
          }
        )
      ] }) })
    ] }) })
  ] });
}
function defaultOrientation(position) {
  return position === "left" || position === "right" ? "vertical" : "horizontal";
}
function tooltipSideFor(position) {
  if (position === "right") return "left";
  if (position === "left") return "right";
  if (typeof position === "string" && position.startsWith("bottom")) return "top";
  return "bottom";
}
function stretches(spec) {
  const p = spec.position;
  return spec.stretch === true && (p === "top" || p === "bottom" || p === "left" || p === "right");
}
function placement(spec) {
  const position = spec.position ?? "top-left";
  if (typeof position !== "string") return { position: "absolute", ...position };
  const off = spec.offset ?? 8;
  const ox = typeof off === "number" ? off : off.x;
  const oy = typeof off === "number" ? off : off.y;
  const anchor = position;
  const vertical = anchor.startsWith("top") ? "top" : anchor.startsWith("bottom") ? "bottom" : "middle";
  const horizontal = anchor.endsWith("left") ? "left" : anchor.endsWith("right") ? "right" : "middle";
  const stretch = stretches(spec);
  const style = { position: "absolute" };
  const translate = [];
  if (vertical === "top") style.top = oy;
  else if (vertical === "bottom") style.bottom = oy;
  else if (stretch) {
    style.top = oy;
    style.bottom = oy;
  } else {
    style.top = "50%";
    translate.push("translateY(-50%)");
  }
  if (horizontal === "left") style.left = ox;
  else if (horizontal === "right") style.right = ox;
  else if (stretch) {
    style.left = ox;
    style.right = ox;
  } else {
    style.left = "50%";
    translate.push("translateX(-50%)");
  }
  if (translate.length) style.transform = translate.join(" ");
  return style;
}
function ControlPanelView({
  spec,
  canvas,
  icons,
  widgets,
  zIndex
}) {
  const items = useControlItems(spec.items, { canvas, ...icons ? { icons } : {}, ...widgets ? { widgets } : {} });
  const orientation = spec.orientation ?? defaultOrientation(spec.position);
  const surface = spec.surface ?? true;
  const fill = stretches(spec);
  return (
    // The positioner lets the canvas keep every pointer event its content doesn't claim.
    /* @__PURE__ */ jsx("div", { style: { ...placement(spec), zIndex, pointerEvents: "none" }, children: /* @__PURE__ */ jsx(
      "div",
      {
        className: cn(
          "pointer-events-auto flex",
          fill ? "h-full w-full" : "shrink-0",
          surface && "rounded-md border border-border bg-background p-0.5 shadow-sm"
        ),
        children: /* @__PURE__ */ jsx(ToolbarItems, { items, orientation, tooltipSide: tooltipSideFor(spec.position) })
      }
    ) })
  );
}
function ControlPanels({ icons, widgets, zIndex = 5, canvas }) {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  return /* @__PURE__ */ jsx(Fragment$1, { children: Object.entries(panels).map(
    ([id, spec]) => spec.visible === false || (spec.placement ?? "canvas") !== "canvas" ? null : /* @__PURE__ */ jsx(ControlPanelView, { spec, canvas: resolved, icons, widgets, zIndex }, id)
  ) });
}
function inRail(placement2, rail) {
  return placement2?.startsWith(`${rail}-`) ?? false;
}
function hasRailControlPanels(panels, rail) {
  return Object.values(panels).some((p) => p.visible !== false && inRail(p.placement, rail));
}
function RailPanelView({
  spec,
  canvas,
  rail,
  icons,
  widgets
}) {
  const items = useControlItems(spec.items, { canvas, ...icons ? { icons } : {}, ...widgets ? { widgets } : {} });
  return /* @__PURE__ */ jsx("div", { className: cn("flex shrink-0", spec.surface === true && "rounded-md border border-border bg-background p-0.5"), children: /* @__PURE__ */ jsx(ToolbarItems, { items, orientation: "horizontal", tooltipSide: rail === "header" ? "bottom" : "top" }) });
}
function RegionControlPanels({ rail, region, icons, widgets, canvas }) {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  const placement2 = `${rail}-${region}`;
  return /* @__PURE__ */ jsx(Fragment$1, { children: Object.entries(panels).map(
    ([id, spec]) => spec.visible === false || spec.placement !== placement2 ? null : /* @__PURE__ */ jsx(RailPanelView, { spec, canvas: resolved, rail, icons, widgets }, id)
  ) });
}
function HeaderControlPanels(props) {
  return /* @__PURE__ */ jsx(RegionControlPanels, { rail: "header", ...props });
}
var ACTIVE_LAYOUT_ID = "graph-force";
var BASE_CONFIG = {
  activeLayout: ACTIVE_LAYOUT_ID,
  // Centre the graph once on load (engine one-shot). Consumers opt out with
  // `config={{ fitOnLoad: false }}`.
  fitOnLoad: true,
  layers: {
    background: { type: "pattern", patternType: "grid", alpha: 0.5 },
    graph: {
      node: {
        style: {
          shape: { kind: "circle", radius: 8 },
          // Neutral default fill so nodes stay visible when nothing tints them
          // (e.g. the `color` behaviour is off). The colour-by-label behaviour
          // overrides `bgFill` per category while enabled, and restores to this
          // default on disable.
          bgFill: 9741240,
          bgStrokeWidth: 1.5,
          labelFontSize: 11,
          labelPlacement: "bottom",
          labelOffsetY: 4
        }
      },
      edge: { style: { strokeWidth: 1, arrowTargetShape: "none" } }
    }
  },
  layouts: {
    [ACTIVE_LAYOUT_ID]: {
      charge: { strength: -160 },
      // Link force on, but no fixed `distance` — a hardcoded length pulls large
      // nodes / composite cards to a center gap smaller than their own width, so
      // they overlap. Let collision set the spacing instead.
      link: {},
      // Size-aware collision: leave `radius` unset so `D3ForceLayout` derives it
      // per node from the render footprint (`max(width, height) / 2`). A fixed
      // radius treats every node as one disc size, so anything bigger overlaps.
      collide: {},
      animate: false
    }
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    "drag-node": { enabled: true },
    hover: { enabled: true, state: "highlighted", degree: 1 },
    color: {
      enabled: true,
      colorEdges: false,
      // Distinct colour per node category (its `type`).
      palette: [
        10265519,
        15680580,
        16096779,
        15381256,
        1096065,
        440020,
        3900150,
        9133302,
        15485081,
        1357990,
        10741301
      ]
    },
    "click-select": { enabled: true, multiple: true },
    // Registered but disarmed — the toolbar's select-mode picker arms one at a time.
    "brush-select": { enabled: false },
    "lasso-select": { enabled: false },
    // Also registered disarmed: the staggered load animation. Registering it is
    // what puts it in the settings editor (which introspects the live registries
    // by `kind`); leaving it off is rule 7, and keeps an entrance nobody asked
    // for from becoming a tax on every embedding. Turn it on per canvas — in the
    // settings panel, or with `behaviours: { entrance: { enabled: true } }`.
    entrance: { enabled: false },
    // The sole theme publisher. Reads the host page's theme itself (`document`),
    // so the canvas is correct on first paint and stays correct even without the
    // bridge below; `CanvasThemeSync`
    // immediately pins it to the host theme's resolved mode + family, and the
    // accent role tracks the design-kit `--color-primary`. The published palette
    // recolours background, nodes, edges, labels and group frames — every layer
    // subscribes, so a theme switch repaints the whole canvas, not just the bg.
    theme: { enabled: true, mode: "document", active: "default", accent: "css-var" }
  }
};
function shellThemeAttrs(family, kind) {
  const variantId = `${family}-${kind}`;
  return { dataTheme: variantId, className: `theme-${variantId} ${kind}` };
}
function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}
function CanvasReady({ onReady }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}
function GraphCanvasAppMain({
  data,
  config,
  bundle,
  instanceKey,
  onReady,
  telemetry,
  preference,
  controlPanels,
  children
}) {
  return (
    // The `<Canvas>` host fills its parent (`100%/100%`); the layout's main cell
    // bounds it. Keyed on instanceKey so a reset remounts the engine. The render
    // backend is auto-resolved unless `preference` pins it.
    /* @__PURE__ */ jsxs(
      GraphCanvas,
      {
        autoResize: true,
        config,
        telemetry,
        ...preference ? { preference } : {},
        children: [
          bundle ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
            /* @__PURE__ */ jsx(BackgroundLayer, { id: "background" }),
            /* @__PURE__ */ jsx(GraphLayer, { id: "graph", data }),
            /* @__PURE__ */ jsx(ColorByBehaviour, { id: "color", targetLayerId: "graph" }),
            /* @__PURE__ */ jsx(D3ForceLayout, { id: ACTIVE_LAYOUT_ID, targetLayerId: "graph", fitPadding: null }),
            /* @__PURE__ */ jsx(ThemeBehaviour, { id: "theme" }),
            /* @__PURE__ */ jsx(CanvasThemeSync, {}),
            /* @__PURE__ */ jsx(DragPanBehaviour, { id: "pan" }),
            /* @__PURE__ */ jsx(WheelZoomBehaviour, { id: "wheel" }),
            /* @__PURE__ */ jsx(DragNodeBehaviour, { id: "drag-node", targetLayerId: "graph" }),
            /* @__PURE__ */ jsx(HoverActivateBehaviour, { id: "hover", targetLayerId: "graph" }),
            /* @__PURE__ */ jsx(ClickSelectBehaviour, { id: "click-select", targetLayerId: "graph" }),
            /* @__PURE__ */ jsx(BrushSelectBehaviour, { id: "brush-select", targetLayerId: "graph" }),
            /* @__PURE__ */ jsx(LassoSelectBehaviour, { id: "lasso-select", targetLayerId: "graph" }),
            /* @__PURE__ */ jsx(EntranceBehaviour, { id: "entrance", targetLayerId: "graph", enabled: false })
          ] }) : null,
          children,
          /* @__PURE__ */ jsx(ControlPanels, { ...controlPanels }),
          /* @__PURE__ */ jsx(CanvasReady, { onReady })
        ]
      },
      instanceKey
    )
  );
}
var SurfaceContext = createContext(null);
var AppContext = createContext(null);
function GraphCanvasAppRoot({
  data,
  config,
  bundle = true,
  instanceKey,
  onReady,
  telemetry: telemetryProp,
  preference,
  debug,
  controlPanels,
  width,
  height,
  style,
  className,
  wrap,
  children
}) {
  const [canvas, setCanvas] = useState(null);
  let theme;
  try {
    theme = useTheme();
  } catch {
    throw new Error(
      "<GraphCanvasApp> / <GraphCanvasAppRoot> must be rendered inside a <ThemeProvider> from @invana/themes \u2014 it reads the active light/dark theme via useTheme(). Wrap it: <ThemeProvider><GraphCanvasApp \u2026 /></ThemeProvider>."
    );
  }
  const { isDark, toggleMode } = theme;
  const themeKind = isDark ? "dark" : "light";
  const handleReady = useCallback(
    (c) => {
      setCanvas(c);
      onReady?.(c);
    },
    [onReady]
  );
  const telemetry = useMemo(
    () => telemetryProp ?? (debug ? { metrics: true } : void 0),
    [telemetryProp, debug]
  );
  const ctx = useMemo(
    () => ({ canvas, themeKind, toggleTheme: toggleMode }),
    [canvas, themeKind, toggleMode]
  );
  const mergedConfig = useMemo(
    () => bundle ? config ? deepMerge(BASE_CONFIG, config) : BASE_CONFIG : config ?? {},
    [bundle, config]
  );
  const surface = useMemo(
    () => ({
      data,
      config: mergedConfig,
      bundle,
      instanceKey,
      onReady: handleReady,
      telemetry,
      preference,
      controlPanels
    }),
    [data, mergedConfig, bundle, instanceKey, handleReady, telemetry, preference, controlPanels]
  );
  const { dataTheme, className: themeClass } = shellThemeAttrs(theme.theme, themeKind);
  const rootStyle = { width: width ?? "100%", height: height ?? "100%", ...style };
  const tree = /* @__PURE__ */ jsx(AppContext.Provider, { value: ctx, children: /* @__PURE__ */ jsx(SurfaceContext.Provider, { value: surface, children: /* @__PURE__ */ jsx(CanvasContext.Provider, { value: canvas, children: /* @__PURE__ */ jsx(GraphCanvasContext.Provider, { value: canvas, children: /* @__PURE__ */ jsx(
    "div",
    {
      "data-theme": dataTheme,
      "data-canvas-scope": "",
      className: cx("bg-background text-foreground overflow-hidden", themeClass, className),
      style: rootStyle,
      children
    }
  ) }) }) }) });
  return /* @__PURE__ */ jsx(Fragment$1, { children: wrap ? wrap(tree) : tree });
}
function GraphCanvasAppSurface({ children }) {
  const surface = useContext(SurfaceContext);
  if (!surface) {
    throw new Error("<GraphCanvasAppSurface> must be rendered inside a <GraphCanvasAppRoot>.");
  }
  return /* @__PURE__ */ jsx(
    GraphCanvasAppMain,
    {
      data: surface.data,
      config: surface.config,
      bundle: surface.bundle,
      instanceKey: surface.instanceKey,
      onReady: surface.onReady,
      telemetry: surface.telemetry,
      preference: surface.preference,
      ...surface.controlPanels ? { controlPanels: surface.controlPanels } : {},
      children
    }
  );
}
function useGraphCanvasApp() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useGraphCanvasApp() must be called inside a <GraphCanvasAppRoot>.");
  }
  return ctx;
}
function renderSlot(slot, ctx) {
  return typeof slot === "function" ? slot(ctx) : slot ?? null;
}
function cx2(...parts) {
  return parts.filter(Boolean).join(" ");
}
function buildHeaderNav({ title = "Graph", left, center, right, className }, ctx) {
  const live = ctx.canvas != null;
  const saved = (region) => live ? /* @__PURE__ */ jsx(HeaderControlPanels, { region, canvas: ctx.canvas }) : null;
  const leftNode = /* @__PURE__ */ jsxs(Fragment$1, { children: [
    left !== void 0 ? renderSlot(left, ctx) : /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold whitespace-nowrap", children: title }),
    saved("left")
  ] });
  const centerNode = /* @__PURE__ */ jsxs(Fragment$1, { children: [
    center !== void 0 && live ? renderSlot(center, ctx) : null,
    saved("center")
  ] });
  const rightNode = /* @__PURE__ */ jsxs(Fragment$1, { children: [
    right !== void 0 && live ? renderSlot(right, ctx) : null,
    saved("right")
  ] });
  const bar = /* @__PURE__ */ jsxs("div", { className: "flex w-full items-center", children: [
    /* @__PURE__ */ jsx("div", { className: "flex flex-1 min-w-0 items-center", children: /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center gap-1 text-foreground", children: leftNode }) }),
    /* @__PURE__ */ jsx("div", { className: "flex shrink-0 items-center gap-1", children: centerNode }),
    /* @__PURE__ */ jsx("div", { className: "flex flex-1 min-w-0 items-center", children: /* @__PURE__ */ jsx("div", { className: "ml-auto flex shrink-0 items-center gap-1", children: rightNode }) })
  ] });
  return {
    center: bar,
    className: cx2("h-[40px] px-3 border-b border-border bg-background", className)
  };
}
function renderSlot2(slot, ctx) {
  return typeof slot === "function" ? slot(ctx) : slot ?? null;
}
function cx3(...parts) {
  return parts.filter(Boolean).join(" ");
}
function buildFooterNav({ left, center, right, className }, ctx) {
  const live = ctx.canvas != null;
  const region = (slot, name) => live ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
    slot !== void 0 ? renderSlot2(slot, ctx) : null,
    /* @__PURE__ */ jsx(RegionControlPanels, { rail: "footer", region: name, canvas: ctx.canvas })
  ] }) : null;
  const leftNode = region(left, "left");
  const centerNode = region(center, "center");
  const rightNode = region(right, "right");
  return {
    left: leftNode,
    center: centerNode,
    right: rightNode,
    className: cx3("h-[25px] px-3 border-t border-border bg-background", className)
  };
}
function resolveSlot(slot, ctx) {
  return typeof slot === "function" ? slot(ctx) : slot ?? null;
}
function toSection(bag, ctx) {
  if (!bag) return void 0;
  const body = resolveSlot(bag.content, ctx);
  return {
    content: bag.className ? /* @__PURE__ */ jsx("div", { className: cx4("h-full", bag.className), children: body }) : body,
    defaultSize: toLayoutSize(bag.defaultSize),
    // Default the floor to 0 (panel can shrink fully) rather than the layout's
    // built-in per-region minimum; a consumer-set `minSize` overrides it.
    minSize: toLayoutSize(bag.minSize) ?? "0px",
    maxSize: toLayoutSize(bag.maxSize),
    collapsible: bag.collapsible ?? true
  };
}
function toLayoutSize(size) {
  return typeof size === "number" ? `${size}%` : size;
}
function cx4(...parts) {
  return parts.filter(Boolean).join(" ");
}
function useHasFooterPanels(canvas) {
  const subscribe = useCallback(
    (onChange) => canvas ? canvas.store.view.subscribe(onChange) : () => {
    },
    [canvas]
  );
  const read = useCallback(
    () => canvas ? hasRailControlPanels(canvas.store.view.getState().definition.controlPanels, "footer") : false,
    [canvas]
  );
  return useSyncExternalStore(subscribe, read, read);
}
function GraphCanvasAppLayout({
  showHeader,
  showFooter,
  header,
  footer,
  right,
  bottom,
  bottomSpan,
  children
}) {
  const ctx = useGraphCanvasApp();
  const hasFooterPanels = useHasFooterPanels(ctx.canvas);
  const headerNav = showHeader ? buildHeaderNav(header ?? {}, ctx) : { className: "hidden" };
  const footerNav = showFooter ?? (footer !== void 0 || hasFooterPanels) ? buildFooterNav(footer ?? {}, ctx) : { className: "hidden" };
  const rightSection = toSection(right, ctx);
  const bottomSection = toSection(bottom, ctx);
  return (
    // `AppLayoutV2` is `h-screen` by default; force `h-full` (tailwind-merge lets
    // the later `h-full` win) so it fills the root's sized box instead.
    /* @__PURE__ */ jsx(
      AppLayoutV2,
      {
        className: "h-full",
        header: headerNav,
        footer: footerNav,
        mainSection: {
          content: /* @__PURE__ */ jsx("div", { className: "h-full w-full overflow-hidden", children: /* @__PURE__ */ jsx(GraphCanvasAppSurface, { children }) })
        },
        rightSection,
        bottomSection,
        bottomSpan
      }
    )
  );
}
function GraphCanvasApp({
  data,
  config,
  bundle = true,
  instanceKey,
  onReady,
  telemetry,
  preference,
  debug,
  showHeader = true,
  showFooter,
  width,
  height,
  style,
  className,
  header,
  footer,
  right,
  bottom,
  bottomSpan = "main-right",
  wrap,
  controlPanels,
  children
}) {
  return /* @__PURE__ */ jsx(
    GraphCanvasAppRoot,
    {
      data,
      config,
      bundle,
      instanceKey,
      onReady,
      telemetry,
      preference,
      debug,
      controlPanels,
      width,
      height,
      style,
      className,
      wrap,
      children: /* @__PURE__ */ jsx(
        GraphCanvasAppLayout,
        {
          showHeader,
          showFooter,
          header,
          footer,
          right,
          bottom,
          bottomSpan,
          children
        }
      )
    }
  );
}

export { ACTIVE_CLASS, BASE_CONFIG, CANVAS_CONTROL_ITEMS, CanvasMessageBar, CanvasSettingsBrowser, ContextMenuOverlay, ControlItems, ControlPanels, DEFAULT_CONTROL_ICONS, DEFAULT_CONTROL_WIDGETS, DetailCard, DevInfoToggleButton, EDGE_TYPE_CONTROL_ITEMS, EDIT_CONTROL_ITEMS, EXPLORER_CONTROL_ITEMS, EXPORT_IMAGE_AREA_OPTIONS, EXPORT_IMAGE_BACKGROUND_OPTIONS, EXPORT_IMAGE_FORMAT_OPTIONS, EXPORT_IMAGE_RATIO_OPTIONS, EXPORT_IMAGE_SCALE_OPTIONS, EdgeEndpoints, ElementInspectorViewPanel, ExportImagePanel, ExportImageToolbar, ExportStatePanel, ExportStateToolbar, GRAPH_CONTROL_ITEMS, GRID_CONTROL_ITEMS, GraphCanvasApp, GraphCanvasAppRoot, GraphCanvasAppSurface, GraphStatusBar, HISTORY_CONTROL_ITEMS, HeaderControlPanels, HoverElementPreviewCard, INPUT_CONTROL_ITEMS, LAYOUT_CONTROL_ITEMS, LayersViewPanel, MODELLER_CONTROL_ITEMS, MenuItemList, MiniMapToggleButton, NAVIGATION_CONTROL_ITEMS, PAN_CONTROL_ITEMS, PAN_PAD_CONTROL_ITEMS, Panel, PanelContent, PropertiesEditor, PropertyDetailView, RegionControlPanels, RendererCapabilityBanner, SELECT_MODE_CONTROL_ITEMS, THEME_CONTROL_ITEMS, ToolbarItems, Tooltipped, VIEW_CONTROL_ITEMS, ZOOM_CONTROL_ITEMS, ZOOM_LEVEL_CONTROL_ITEMS, applyIconOverrides, controlWidgetOptionsSpecs, defaultPropertyRenderers, defineControlItems, displayNameOf, hasRailControlPanels, isImageUrl, isSafeHref, labelOfEdge, labelOfNode, nodeSwatchColor, renderPropertyValue, resolvePropertyRenderer, useControlItems, useGraphCanvasApp };
//# sourceMappingURL=chunk-VW3P45XP.js.map
//# sourceMappingURL=chunk-VW3P45XP.js.map