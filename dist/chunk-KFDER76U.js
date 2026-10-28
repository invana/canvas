import { GitCommitVertical, CircleDot, Highlighter, Type, ArrowUpRight, SquarePen, Spline, CirclePlus, Map as Map$1, Diff, Rows3, History, Palette, List, Presentation, ScanEye, MessageSquareText, BoxSelect, StickyNote, Pencil, Compass, Cable, Waypoints, CornerDownRight, Minus, Grid3x3, Lasso, SquareDashedMousePointer, Trash2, Eraser, ClipboardPaste, Copy, Scissors, Keyboard, Mouse, Move, LocateFixed, ArrowRight, ArrowLeft, ArrowDown, ArrowUp, Hand, MousePointer2, Image, Download, Info, Layers, Settings, Search, X, Plus, Moon, Sun, Redo2, Undo2, RefreshCw, Play, LockOpen, Lock, Crosshair, Shrink, Expand, Scan, Maximize, ZoomOut, ZoomIn, Square, ArrowUpDown, TriangleAlert, MonitorX, Zap, Gauge, ImageDown, FileJson, Upload, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, Orbit, Workflow, Network, Share2, MousePointerClick, HelpCircle, EyeOff, Eye, Check, MoreHorizontal, Circle, Frame, Boxes } from 'lucide-react';
import { createContext, createElement, useState, useEffect, useMemo, Fragment, useRef, useLayoutEffect, useContext, isValidElement, useCallback, useSyncExternalStore, useReducer } from 'react';
import { cn, Accordion, AccordionItem, AccordionTrigger, Badge, AccordionContent, TooltipProvider, Tooltip, TooltipTrigger, TooltipContent, Separator, NavVertical, NavHorizontal, Button, Toggle, Eyebrow, PropertyList, PropertyRow, Alert, AlertDescription, ClampedText, AlertTitle, MenuItem, HoverCard, HoverCardTrigger, HoverCardContent, SegmentedControl, FloatingPanel, Legend, LegendItem, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuRadioGroup, DropdownMenuSeparator, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuItem, DropdownMenuShortcut, Popover, PopoverTrigger, PopoverContent, TreeView, Card, ToggleGroup, ToggleGroupItem, RichSelect } from '@invana/ui';
import { jsx, jsxs, Fragment as Fragment$1 } from 'react/jsx-runtime';
import { useCanvas, useGraphCanvasUpdate, useCanvasMessage, useResolvedCanvas, useZoom, useSelection, useCanvasEvent, CanvasContext, DevInfoLayer, useCanvasImageExport, useCanvasStateJson, MiniMapLayer, usePlaybook, useBoardMode, useCommandStates, inBoardMode, ControlPanel, useGraphCanvas, BOARD_MODE_COMMAND, GraphCanvasContext, useControlPanels, useEntityEditor, useInspectTarget, hasWebGPUApi, hasWebGL, canUseWebGPU, useControlPanelSlot, useBehaviourInstance, GraphCanvas, BackgroundLayer, GraphLayer, ColorByBehaviour, D3ForceLayout, ThemeBehaviour, CanvasThemeSync, DragPanBehaviour, WheelZoomBehaviour, DragNodeBehaviour, HoverActivateBehaviour, ClickSelectBehaviour, BrushSelectBehaviour, LassoSelectBehaviour, EntranceBehaviour } from '@invana/canvas-react';
export { CanvasThemeSync } from '@invana/canvas-react';
import { FormField, Input } from '@invana/forms';
import { useForm, useWatch, FormProvider } from 'react-hook-form';
import { remapLayoutPresets, DEFAULT_LAYOUT_PRESETS, ANNOTATION_NODE_TYPE, edgesThinned, EDGE_DENSITY, readableLabel, isAnnotationElement, ANNOTATION_COUNT_TYPE, annotationTemplates, GroupFramesLayer, readCssColor, ANNOTATION_VALUE_TYPE, ANNOTATION_VALUE_CARD_HEIGHT, ANNOTATION_CARD_HEIGHT, ANNOTATION_CARD_WIDTH, ANNOTATION_EDGE_TYPE, placeBeside, ANNOTATION_TYPES, recordsOnly } from '@invana/graph';
import { select, deepMerge } from '@invana/canvas';
import { useTheme, AppLayoutV2 } from '@invana/themes';

// src/control-panels/icons.ts
var StopIcon = ({ className, ...props }) => createElement(Square, { ...props, className: cn("fill-current", className) });
var DEFAULT_CONTROL_ICONS = {
  "zoom-in": ZoomIn,
  "zoom-out": ZoomOut,
  maximize: Maximize,
  // Fit to content frames the drawing — a frame, not the full-screen arrows.
  fit: Scan,
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
  image: Image,
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
  "edge-smooth": Cable,
  // board modes
  compass: Compass,
  pencil: Pencil,
  "sticky-note": StickyNote,
  "annotation-group": BoxSelect,
  annotations: MessageSquareText,
  "scan-eye": ScanEye,
  presentation: Presentation,
  // board panels
  legend: List,
  palette: Palette,
  history: History,
  properties: Rows3,
  changes: Diff,
  minimap: Map$1,
  // board tools
  "node-add": CirclePlus,
  connect: Spline,
  shape: SquarePen,
  arrow: ArrowUpRight,
  text: Type,
  highlight: Highlighter,
  "size-by-connections": CircleDot,
  versions: GitCommitVertical
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
var ToolbarSizeContext = createContext("md");
function useToolbarSize() {
  return useContext(ToolbarSizeContext);
}
function iconButtonSize(size) {
  return size === "sm" ? "icon-sm" : "icon";
}
function renderButton(key, opts) {
  const { icon: Icon, iconClass, label, text, active = false, disabled = false, badge, onClick, tooltipSide, size } = opts;
  return /* @__PURE__ */ jsx(Tooltipped, { label, side: tooltipSide, children: /* @__PURE__ */ jsxs(
    Button,
    {
      variant: "ghost",
      size: text ? "sm" : iconButtonSize(size),
      "aria-label": badge ? `${label} (${badge})` : label,
      disabled,
      onClick,
      className: cn(active && ACTIVE_CLASS, badge && "relative overflow-visible"),
      children: [
        /* @__PURE__ */ jsx(Icon, { className: iconClass }),
        text ?? null,
        badge ? /* @__PURE__ */ jsx(
          "span",
          {
            "aria-hidden": "true",
            className: "bg-warning text-warning-foreground ring-background pointer-events-none absolute -top-1.5 -right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] leading-none font-semibold tabular-nums ring-2",
            children: badge
          }
        ) : null
      ]
    }
  ) }, key);
}
function renderSelect(key, item, tipSide, inline) {
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
      ...inline ? { appearance: "inline" } : {},
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
            children: Icon ? /* @__PURE__ */ jsx(Icon, { className: item.iconClass }) : optLabel
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
  className,
  bare = false,
  size: sizeProp
}) {
  const regionSize = useToolbarSize();
  const size = sizeProp ?? regionSize;
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
          tooltipSide: it.tooltipSide ?? tipSide,
          size
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
          ...it.badge ? { badge: it.badge } : {},
          ...it.disabled !== void 0 ? { disabled: it.disabled } : {},
          onClick: it.onToggle,
          tooltipSide: it.tooltipSide ?? tipSide,
          size
        });
      }
      case "select":
        return item.display === "segmented" ? renderSegmented(key, item, tipSide) : renderSelect(key, item, tipSide, bare);
      case "divider":
        return /* @__PURE__ */ jsx(
          Separator,
          {
            orientation: orientation === "vertical" ? "horizontal" : "vertical",
            className: orientation === "vertical" ? cn(size === "sm" ? "w-4" : "w-6", "self-center") : cn(size === "sm" ? "h-4" : "h-6", "self-center")
          },
          key
        );
      case "custom":
        return /* @__PURE__ */ jsx(Fragment, { children: item.render() }, key);
    }
  });
  const content = /* @__PURE__ */ jsx(Fragment$1, { children: nodes });
  if (bare) return content;
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
function fieldsFor({ showLabel, showType, requireType, typeSuggestions, types, keys, strict }) {
  const label = showLabel ? [{ name: "label", type: "text", label: "Label", placeholder: "Label text" }] : [];
  const required = requireType ? { rules: { validate: (v) => typeof v === "string" && v.trim() !== "" || requireType } } : {};
  const pick = strict && types.length > 0;
  const offered = [.../* @__PURE__ */ new Set([...types, ...typeSuggestions])];
  const type = showType ? [
    pick ? { name: "type", type: "select", label: "Type", placeholder: "Pick a type", options: types.map((t) => ({ label: t, value: t })), ...required } : {
      name: "type",
      type: "text",
      label: "Type",
      placeholder: requireType ? "Pick or type a type" : "Type",
      ...offered.length ? { options: offered.map((t) => ({ label: t, value: t })) } : {},
      ...requireType ? { autoFocus: true } : {},
      ...required
    }
  ] : [];
  return [
    ...requireType ? [...type, ...label] : [...label, ...type],
    {
      name: "properties",
      type: "keyvalue",
      label: "Properties",
      keyPlaceholder: "Key",
      valuePlaceholder: "Value",
      addLabel: "Add property",
      emptyLabel: requireType && keys.length === 0 && pick ? "Pick a type to see its keys." : "No properties yet.",
      ...keys.length ? { options: keys.map((k) => ({ label: k.key, value: k.key, ...k.kind ? { description: k.kind } : {} })) } : {},
      ...strict ? { strictKeys: true } : {}
    }
  ];
}
function formOf(v) {
  return {
    element: {
      label: v?.label ?? "",
      type: v?.type ?? "",
      properties: Object.entries(v?.data ?? {}).map(([key, value]) => ({ key, value }))
    }
  };
}
function valuesOf(element, withType) {
  const data = {};
  for (const { key, value } of element.properties ?? []) {
    const k = (key ?? "").trim();
    if (k && (value ?? "").trim() !== "") data[k] = value;
  }
  const label = element.label ?? "";
  return withType ? { label, type: (element.type ?? "").trim(), data } : { label, data };
}
function rowsForType(rows, keys, strict) {
  const value = new Map(rows.map((r) => [r.key.trim(), r.value]));
  if (strict) return keys.map((k) => ({ key: k.key, value: value.get(k.key) ?? "" }));
  const have = new Set(rows.map((r) => r.key.trim()));
  return [...rows, ...keys.filter((k) => !have.has(k.key)).map((k) => ({ key: k.key, value: "" }))];
}
function ElementEditorPanel({
  title,
  defaults,
  onSubmit,
  submitLabel = "Apply",
  showLabel = true,
  showType: showTypeProp = false,
  requireType,
  typeSuggestions = [],
  schema,
  strictSchema = false,
  endpoints,
  onReverse,
  onCancel,
  onReset,
  onDelete,
  values,
  onChange,
  className
}) {
  const showType = showTypeProp || !!requireType;
  const form = useForm({ defaultValues: formOf(values ?? defaults) });
  const valuesKey = values ? JSON.stringify(values) : null;
  useEffect(() => {
    if (valuesKey !== null) form.reset(formOf(JSON.parse(valuesKey)));
  }, [valuesKey, form]);
  const changed = useRef(onChange);
  changed.current = onChange;
  useEffect(() => {
    const sub = form.watch((all) => {
      const el = all.element;
      if (el && changed.current) changed.current(valuesOf(el, showTypeProp || !!requireType));
    });
    return () => sub.unsubscribe();
  }, [form, showTypeProp, requireType]);
  const types = schema?.map((t) => t.type) ?? [];
  const keysOf = (type) => schema?.find((t) => t.type === type.trim())?.keys ?? [];
  const strict = strictSchema && !!schema;
  const watchedType = useWatch({ control: form.control, name: "element.type" }) ?? "";
  const lastType = useRef(watchedType);
  const [dropped, setDropped] = useState([]);
  useEffect(() => {
    if (watchedType === lastType.current) return;
    lastType.current = watchedType;
    const keys = keysOf(watchedType);
    if (keys.length === 0 && !strict) return;
    const rows = form.getValues("element.properties");
    const next = rowsForType(rows, keys, strict);
    const kept = new Set(next.map((r) => r.key));
    setDropped(rows.filter((r) => r.key.trim() && r.value.trim() && !kept.has(r.key.trim())).map((r) => r.key.trim()));
    form.setValue("element.properties", next, { shouldDirty: true });
  }, [watchedType, strict]);
  const apply = ({ element }) => onSubmit(valuesOf(element, showType));
  const reset = () => {
    form.reset(formOf(values ?? defaults));
    setDropped([]);
    onReset?.();
  };
  const control = form.control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: cn("flex min-w-[240px] flex-col gap-3 p-3", className), children: [
    title && /* @__PURE__ */ jsx(Eyebrow, { children: title }),
    endpoints && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxs(PropertyList, { labelWidth: "auto", variant: "summary", className: "min-w-0 flex-1", children: [
        /* @__PURE__ */ jsx(PropertyRow, { label: "From", children: endpoints.from }),
        /* @__PURE__ */ jsx(PropertyRow, { label: "To", children: endpoints.to })
      ] }),
      onReverse && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon-sm", "aria-label": "Reverse direction", title: "Reverse direction", onClick: onReverse, children: /* @__PURE__ */ jsx(ArrowUpDown, {}) })
    ] }),
    /* @__PURE__ */ jsx(
      FormField.ObjectField,
      {
        control,
        columns: 1,
        labelPosition: "top",
        size: "xs",
        name: "element",
        fields: fieldsFor({ showLabel, showType, requireType, typeSuggestions, types, keys: keysOf(watchedType), strict })
      }
    ),
    dropped.length > 0 && /* @__PURE__ */ jsxs(Alert, { tone: "warning", role: "status", children: [
      /* @__PURE__ */ jsx(TriangleAlert, {}),
      /* @__PURE__ */ jsxs(AlertDescription, { children: [
        "A ",
        watchedType,
        " takes other keys: ",
        dropped.join(", "),
        " ",
        dropped.length === 1 ? "is" : "are",
        " dropped on Apply."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: cn("flex flex-wrap items-center gap-1.5", onReverse && !endpoints ? "justify-between" : "justify-end"), children: [
      onReverse && !endpoints && /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", onClick: onReverse, children: "Reverse direction" }),
      onDelete && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "text-destructive", onClick: onDelete, children: "Delete" }),
      /* @__PURE__ */ jsxs("div", { className: "ml-auto flex items-center gap-1.5", children: [
        onReset && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: reset, children: "Reset" }),
        onCancel && /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: onCancel, children: "Cancel" }),
        /* @__PURE__ */ jsx(Button, { size: "sm", onClick: () => void form.handleSubmit(apply)(), children: submitLabel })
      ] })
    ] })
  ] }) });
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
function MessageStatus({ canvas, layerId = "graph" }) {
  return canvas ? /* @__PURE__ */ jsx(MessageStatusLive, { canvas, layerId }) : null;
}
function MessageStatusLive({ canvas, layerId }) {
  const { message } = useCanvasMessage(canvas);
  const [hover, setHover] = useState(null);
  useEffect(() => {
    const layer = canvas.layers.get(layerId);
    const renderer = layer?.getRenderer();
    const store = layer?.store;
    if (!layer || !renderer || !store) return;
    const onNode = ({ id }) => {
      const node = store.getNode(id);
      const label = node ? layer.resolveNodeStyle(node).labelText : "";
      setHover([node?.type, label || id].filter(Boolean).join(" \xB7 "));
    };
    const onEdge = ({ id }) => setHover(store.getEdge(id)?.type ?? id);
    const onOut = () => setHover(null);
    renderer.events.on("shape:pointerover", onNode);
    renderer.events.on("shape:pointerout", onOut);
    renderer.events.on("connector:pointerover", onEdge);
    renderer.events.on("connector:pointerout", onOut);
    return () => {
      renderer.events.off("shape:pointerover", onNode);
      renderer.events.off("shape:pointerout", onOut);
      renderer.events.off("connector:pointerover", onEdge);
      renderer.events.off("connector:pointerout", onOut);
    };
  }, [canvas, layerId]);
  const text = hover ?? message;
  if (!text) return null;
  return /* @__PURE__ */ jsx("span", { title: text, className: "border-border text-muted-foreground min-w-0 truncate border-l pl-3", children: text });
}
function ViewStatus({ canvas, layerId = "graph" }) {
  return canvas ? /* @__PURE__ */ jsx(ViewStatusLive, { canvas, layerId }) : null;
}
function ViewStatusLive({ canvas, layerId }) {
  const { zoom } = useZoom(canvas);
  const { count } = useSelection({}, canvas);
  const [edges, setEdges] = useState(0);
  useEffect(() => {
    const store = canvas.layers.get(layerId)?.store;
    if (!store) return;
    const sync = () => setEdges(store.edgeCount());
    sync();
    return store.events.on("flush", sync);
  }, [canvas, layerId]);
  return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-3 px-2", children: [
    edgesThinned(edges, zoom) ? /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground", children: [
      "About 1 in ",
      Math.round(1 / EDGE_DENSITY.thinKeep),
      " relationships drawn \xB7 zoom in for all"
    ] }) : null,
    count > 0 ? /* @__PURE__ */ jsxs("span", { children: [
      count,
      " selected"
    ] }) : null,
    /* @__PURE__ */ jsxs("span", { className: "tabular-nums", children: [
      Math.round(zoom * 100),
      "%"
    ] })
  ] });
}
function RendererStatus({ canvas, backend }) {
  const [fps, setFps] = useState(null);
  useEffect(() => {
    if (!canvas) {
      setFps(null);
      return;
    }
    const read = () => {
      const stats = canvas.frames.stats();
      setFps(stats.count ? Math.round(stats.fps) : null);
    };
    read();
    const timer = window.setInterval(read, 1e3);
    return () => window.clearInterval(timer);
  }, [canvas]);
  return /* @__PURE__ */ jsxs("span", { className: "px-2", children: [
    backend === "webgpu" ? "WebGPU" : "WebGL",
    fps != null && ` \xB7 ${fps} fps`
  ] });
}
function MenuItemList({ items, header, className }) {
  return /* @__PURE__ */ jsxs("nav", { className: cn("w-[220px] !py-0 border bg-card text-card-foreground shadow-sm", className), role: "menubar", children: [
    header && /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground flex items-center gap-1.5 px-3 pt-2 pb-1 text-xs", children: [
      header.swatch && // The swatch is the type's drawn colour — a runtime value.
      /* @__PURE__ */ jsx("span", { className: "size-2 shrink-0 rounded-full", style: { background: header.swatch } }),
      /* @__PURE__ */ jsx("span", { className: "text-foreground truncate font-semibold", children: header.title }),
      header.sub && /* @__PURE__ */ jsx("span", { className: "truncate font-mono", children: header.sub })
    ] }),
    /* @__PURE__ */ jsx("ul", { className: "space-y-0.5 p-0", role: "menu", children: items.map((item) => /* @__PURE__ */ jsx(MenuItem, { ...item, className: cn("px-3 py-1.5", item.className) }, item.id)) })
  ] });
}
function ContextMenuOverlay({ x, y, items, header, zIndex = 1e3, style }) {
  const ref = useRef(null);
  const [at, setAt] = useState({ left: x, top: y });
  useLayoutEffect(() => {
    const el = ref.current;
    const host = el?.offsetParent;
    if (!el || !host) return setAt({ left: x, top: y });
    const { offsetWidth: w, offsetHeight: h } = el;
    const left = x + w > host.clientWidth ? Math.max(4, x - w) : x;
    const top = y + h > host.clientHeight ? Math.max(4, host.clientHeight - h - 4) : y;
    setAt({ left, top });
  }, [x, y, items, header]);
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      style: { position: "absolute", left: at.left, top: at.top, zIndex, ...style },
      onPointerDown: (ev) => ev.stopPropagation(),
      onContextMenu: (ev) => ev.preventDefault(),
      children: /* @__PURE__ */ jsx(MenuItemList, { items, ...header ? { header } : {} })
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
        bare: true,
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
  const toolbarSize = useToolbarSize();
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
        size: triggerText ? "sm" : iconButtonSize(toolbarSize),
        "aria-label": label,
        className,
        children: [
          /* @__PURE__ */ jsx(TriggerIcon, {}),
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
  const toolbarSize = useToolbarSize();
  const { download, import: importState } = useCanvasStateJson(canvas);
  const [restore, setRestore] = useState(restoreView);
  const onExport = () => download(`${filename}.json`);
  const onImport = (file) => void importState(file, { skipInteraction: !restore });
  return /* @__PURE__ */ jsxs(HoverCard, { openDelay, closeDelay, children: [
    /* @__PURE__ */ jsx(HoverCardTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
      Button,
      {
        variant: "ghost",
        size: triggerText ? "sm" : iconButtonSize(toolbarSize),
        "aria-label": label,
        className,
        children: [
          /* @__PURE__ */ jsx(TriggerIcon, {}),
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
        bare: true,
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

// src/view-panels/layout-presets/defaults.ts
var DEFAULT_LAYOUT_PRESET_CARDS = [
  { id: "network", label: "Network", description: "Who is near whom", picture: "network" },
  { id: "tree", label: "Tree \u2193", description: "What sits under what", picture: "tree" },
  { id: "flow", label: "Flow \u2192", description: "What leads to what", picture: "flow" },
  { id: "radial", label: "Radial", description: "One node and its rings", picture: "radial" }
];
var DIRECTION = {
  key: "direction",
  label: "Direction",
  choices: [
    { value: "down", label: "\u2193" },
    { value: "right", label: "\u2192" },
    { value: "left", label: "\u2190" },
    { value: "up", label: "\u2191" }
  ]
};
var EDGES = {
  key: "edges",
  label: "Edges",
  choices: [
    { value: "straight", label: "Straight" },
    { value: "curved", label: "Curved" },
    { value: "orthogonal", label: "Orthogonal" }
  ]
};
var SPACING = {
  key: "spacing",
  label: "Spacing",
  choices: [
    { value: "compact", label: "Compact" },
    { value: "comfortable", label: "Comfortable" },
    { value: "roomy", label: "Roomy" }
  ]
};
var ROOT = {
  key: "root",
  label: "Root",
  choices: [
    { value: "auto", label: "Automatic" },
    { value: "selection", label: "Selection" }
  ]
};
var CENTRE = { ...ROOT, key: "centre", label: "Centre" };
var DEFAULT_LAYOUT_PRESET_OPTIONS = {
  network: [EDGES, SPACING],
  tree: [DIRECTION, EDGES, SPACING, ROOT],
  flow: [DIRECTION, EDGES, SPACING, ROOT],
  radial: [EDGES, SPACING, CENTRE]
};
var DEFAULT_LAYOUT_PRESET_DEFAULTS = {
  network: { edges: "straight", spacing: "comfortable" },
  tree: { direction: "down", edges: "orthogonal", spacing: "comfortable", root: "auto" },
  flow: { direction: "right", edges: "curved", spacing: "comfortable", root: "auto" },
  radial: { edges: "curved", spacing: "comfortable", centre: "auto" }
};
function LayoutPresetOptions({ title, options, defaults, overrides, onChange, className }) {
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1", className), children: [
    title && /* @__PURE__ */ jsx(Eyebrow, { children: title }),
    options.map((option) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 py-0.5", children: [
      /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1", children: option.label }),
      /* @__PURE__ */ jsx(
        SegmentedControl,
        {
          size: "xs",
          className: "shrink-0",
          "aria-label": option.label,
          options: option.choices.map((c) => ({ value: c.value, label: c.label })),
          value: overrides[option.key] ?? defaults[option.key] ?? null,
          onValueChange: (v) => onChange(option.key, v)
        }
      )
    ] }, option.key))
  ] });
}
function hasOverrides(defaults, overrides) {
  return Object.entries(overrides).some(([k, v]) => defaults[k] !== v);
}
function LayoutPresetReset({ presetLabel, onReset }) {
  return /* @__PURE__ */ jsxs(Button, { variant: "link", size: "sm", className: "h-auto p-0", onClick: onReset, children: [
    "Reset to ",
    presetLabel
  ] });
}
var RING_ANGLES = [0, 1, 2, 3, 4].map((i) => i * 2 * Math.PI / 5 - Math.PI / 2);
function LayoutPresetThumbnail({ picture, className }) {
  return /* @__PURE__ */ jsxs("svg", { viewBox: "0 0 120 64", "aria-hidden": "true", className: cn("h-16 w-full text-muted-foreground", className), children: [
    /* @__PURE__ */ jsxs("g", { fill: "none", stroke: "currentColor", strokeWidth: 1, children: [
      picture === "network" && /* @__PURE__ */ jsx(NetworkLines, {}),
      picture === "tree" && /* @__PURE__ */ jsx("path", { d: "M60 14V24M24 24H96M24 24V36M60 24V36M96 24V36M24 42V50M14 50H34M96 42V50M86 50H106" }),
      picture === "flow" && [12, 32, 52].map((y) => /* @__PURE__ */ jsxs("g", { children: [
        /* @__PURE__ */ jsx("path", { d: `M22 32C46 32 46 ${y} 70 ${y}` }),
        /* @__PURE__ */ jsx("path", { d: `M74 ${y}C88 ${y} 88 ${y - 6} 102 ${y - 6}M74 ${y}C88 ${y} 88 ${y + 6} 102 ${y + 6}` })
      ] }, y)),
      picture === "radial" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsx("circle", { cx: 60, cy: 32, r: 14, strokeDasharray: "2 3" }),
        /* @__PURE__ */ jsx("circle", { cx: 60, cy: 32, r: 27, strokeDasharray: "2 3" }),
        RING_ANGLES.map((a) => /* @__PURE__ */ jsx("path", { d: `M60 32L${60 + 14 * Math.cos(a)} ${32 + 14 * Math.sin(a)}` }, a))
      ] })
    ] }),
    /* @__PURE__ */ jsxs("g", { className: "fill-primary", children: [
      picture === "network" && /* @__PURE__ */ jsx(NetworkNodes, {}),
      picture === "tree" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsx("circle", { cx: 60, cy: 12, r: 5 }),
        [24, 60, 96].map((x) => /* @__PURE__ */ jsx("circle", { cx: x, cy: 40, r: 3.5 }, x)),
        [14, 34, 86, 106].map((x) => /* @__PURE__ */ jsx("circle", { cx: x, cy: 54, r: 2.5 }, x))
      ] }),
      picture === "flow" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsx("circle", { cx: 18, cy: 32, r: 5 }),
        [12, 32, 52].map((y) => /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx("circle", { cx: 72, cy: y, r: 3.5 }),
          /* @__PURE__ */ jsx("circle", { cx: 104, cy: y - 6, r: 2.2 }),
          /* @__PURE__ */ jsx("circle", { cx: 104, cy: y + 6, r: 2.2 })
        ] }, y))
      ] }),
      picture === "radial" && /* @__PURE__ */ jsxs(Fragment$1, { children: [
        /* @__PURE__ */ jsx("circle", { cx: 60, cy: 32, r: 5 }),
        RING_ANGLES.map((a) => /* @__PURE__ */ jsxs("g", { children: [
          /* @__PURE__ */ jsx("circle", { cx: 60 + 14 * Math.cos(a), cy: 32 + 14 * Math.sin(a), r: 3 }),
          /* @__PURE__ */ jsx("circle", { cx: 60 + 27 * Math.cos(a + 0.3), cy: 32 + 27 * Math.sin(a + 0.3), r: 2.2 }),
          /* @__PURE__ */ jsx("circle", { cx: 60 + 27 * Math.cos(a - 0.3), cy: 32 + 27 * Math.sin(a - 0.3), r: 2.2 })
        ] }, a))
      ] })
    ] })
  ] });
}
var NETWORK_POINTS = [
  [30, 16],
  [92, 14],
  [34, 50],
  [90, 50],
  [14, 32],
  [110, 34]
];
function NetworkLines() {
  return /* @__PURE__ */ jsx(Fragment$1, { children: NETWORK_POINTS.map(([x, y]) => /* @__PURE__ */ jsx("line", { x1: 60, y1: 32, x2: x, y2: y }, `${x}-${y}`)) });
}
function NetworkNodes() {
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx("circle", { cx: 60, cy: 32, r: 5 }),
    NETWORK_POINTS.map(([x, y]) => /* @__PURE__ */ jsx("circle", { cx: x, cy: y, r: 3 }, `${x}-${y}`))
  ] });
}
function LayoutPresetPicker({ presets, value, onSelect, className }) {
  return /* @__PURE__ */ jsx("div", { role: "radiogroup", "aria-label": "Layout", className: cn("grid grid-cols-2 gap-2", className), children: presets.map((preset) => {
    const card = /* @__PURE__ */ jsxs(
      "button",
      {
        type: "button",
        role: "radio",
        "aria-checked": preset.id === value,
        "aria-disabled": preset.disabledReason ? true : void 0,
        onClick: () => {
          if (!preset.disabledReason && preset.id !== value) onSelect(preset.id);
        },
        className: cn(
          "flex flex-col gap-1 rounded-sm border p-1.5 text-left outline-none transition-colors",
          "focus-visible:ring-ring focus-visible:ring-2",
          preset.id === value ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
          preset.disabledReason && "cursor-not-allowed opacity-40 hover:bg-transparent"
        ),
        children: [
          /* @__PURE__ */ jsx("span", { className: "bg-background rounded-sm", children: isPicture(preset.picture) ? /* @__PURE__ */ jsx(LayoutPresetThumbnail, { picture: preset.picture }) : preset.picture }),
          /* @__PURE__ */ jsx("span", { className: cn("font-semibold", preset.id === value && "text-primary"), children: preset.label }),
          preset.description && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: preset.description })
        ]
      },
      preset.id
    );
    if (!preset.disabledReason) return card;
    return /* @__PURE__ */ jsxs(Tooltip, { children: [
      /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: card }),
      /* @__PURE__ */ jsx(TooltipContent, { children: preset.disabledReason })
    ] }, preset.id);
  }) });
}
function isPicture(p) {
  return typeof p === "string" && !isValidElement(p);
}
function LayoutPresetsViewPanel({
  value,
  onChange,
  onRunAgain,
  presets = DEFAULT_LAYOUT_PRESET_CARDS,
  options = DEFAULT_LAYOUT_PRESET_OPTIONS,
  defaults = DEFAULT_LAYOUT_PRESET_DEFAULTS,
  note = "The board keeps what you pick",
  className
}) {
  const active = presets.find((p) => p.id === value.presetId);
  const presetDefaults = defaults[value.presetId] ?? {};
  const rows = options[value.presetId] ?? [];
  const changed = hasOverrides(presetDefaults, value.overrides);
  const setOption = (key, v) => {
    const next = { ...value.overrides };
    if (presetDefaults[key] === v) delete next[key];
    else next[key] = v;
    onChange({ presetId: value.presetId, overrides: next });
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("flex w-[22rem] flex-col", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 p-3", children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Layout" }),
      /* @__PURE__ */ jsx(LayoutPresetPicker, { presets, value: value.presetId, onSelect: (id) => onChange({ presetId: id, overrides: {} }) })
    ] }),
    rows.length > 0 && /* @__PURE__ */ jsxs(Fragment$1, { children: [
      /* @__PURE__ */ jsx(Separator, {}),
      /* @__PURE__ */ jsx(
        LayoutPresetOptions,
        {
          className: "p-3",
          title: active ? `${active.label} options` : void 0,
          options: rows,
          defaults: presetDefaults,
          overrides: value.overrides,
          onChange: setOption
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-2", children: [
      changed && active ? /* @__PURE__ */ jsx(LayoutPresetReset, { presetLabel: active.label, onReset: () => onChange({ presetId: value.presetId, overrides: {} }) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm", children: note }),
      /* @__PURE__ */ jsx("span", { className: "flex-1" }),
      onRunAgain && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onRunAgain, children: [
        /* @__PURE__ */ jsx(RotateCcw, {}),
        " Run again"
      ] })
    ] })
  ] });
}
function PlaybookStepper({ canvas, ...rest }) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === void 0 ? fromContext : canvas;
  if (!resolved) return null;
  return /* @__PURE__ */ jsx(PlaybookStepperContent, { canvas: resolved, ...rest });
}
function PlaybookStepperContent({ canvas, onClose, className }) {
  const { steps, index, canNext, canPrevious, next, previous } = usePlaybook(canvas);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const run = useCallback(async (move) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      await move();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);
  const position = steps.length === 0 ? "0/0" : `${Math.max(index + 1, 0)}/${steps.length}`;
  return /* @__PURE__ */ jsx(
    ToolbarItems,
    {
      className: cn(className),
      items: [
        { type: "button", key: "previous", icon: ChevronLeft, label: "Previous step", disabled: busy || !canPrevious, onClick: () => void run(previous) },
        {
          type: "custom",
          key: "position",
          render: () => /* @__PURE__ */ jsx("span", { "aria-live": "polite", className: "min-w-8 px-1 text-center text-sm tabular-nums", children: position })
        },
        { type: "button", key: "next", icon: ChevronRight, label: "Next step", disabled: busy || !canNext, onClick: () => void run(next) },
        ...onClose ? [{ type: "button", key: "close", icon: X, label: "Close presenting", onClick: onClose }] : []
      ]
    }
  );
}
var BOARD_PANEL_COMMAND = "board.panel";
var RAIL_W = 32;
var GAP = 6;
function BoardPanels({ panels, defaultOpen = null, onOpenChange, offset = 12, width = 300, modes }) {
  const canvas = useCanvas();
  const mode = useBoardMode(canvas);
  const [open, setOpen] = useState(defaultOpen);
  const latest = useRef({ open, panels, onOpenChange });
  latest.current = { open, panels, onOpenChange };
  useEffect(() => {
    const set = (next) => {
      setOpen(next);
      latest.current.onOpenChange?.(next);
    };
    return canvas.commands.register(BOARD_PANEL_COMMAND, {
      label: "Panel",
      category: "View",
      value: () => latest.current.open,
      isActive: (_c, args) => args?.value === latest.current.open,
      options: () => latest.current.panels.map((p) => ({ value: p.id, label: p.title, icon: p.icon })),
      run: (_c, args) => {
        const value = args?.value ?? null;
        set(value === latest.current.open ? null : value);
      }
    });
  }, [canvas]);
  useEffect(() => canvas.commands.invalidate(), [canvas, open]);
  const when = panels.filter((p) => p.alsoWhen);
  const { states: whenStates } = useCommandStates(when.map((p) => ({ command: p.alsoWhen })), canvas);
  const modesOf = (p) => {
    const i = when.indexOf(p);
    return i >= 0 && whenStates[i]?.value ? void 0 : p.modes;
  };
  const items = panels.flatMap((p) => {
    const pm = modesOf(p);
    return [
      ...p.separatorBefore ? [{ type: "divider", ...pm ? { modes: pm } : {} }] : [],
      {
        type: "toggle",
        key: p.id,
        command: BOARD_PANEL_COMMAND,
        args: { value: p.id },
        icon: p.icon,
        label: p.title,
        ...pm ? { modes: pm } : {},
        ...p.badge ? { badge: p.badge } : {}
      }
    ];
  });
  const everywhere = panels.some((p) => !p.modes);
  const railModes = modes ?? (everywhere ? void 0 : [...new Set(panels.flatMap((p) => p.modes ?? []))]);
  const shown = panels.find((p) => p.id === open && inBoardMode(modesOf(p), mode) && inBoardMode(railModes, mode));
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsx(
      ControlPanel,
      {
        id: "board-rail",
        position: "top-right",
        offset,
        orientation: "vertical",
        surface: "hairline",
        ...railModes ? { modes: railModes } : {},
        items
      }
    ),
    shown && /* @__PURE__ */ jsx(
      "div",
      {
        className: "pointer-events-auto absolute z-[6] flex",
        style: { top: offset, right: offset + RAIL_W + GAP, width, maxHeight: `calc(100% - ${2 * offset}px)` },
        children: /* @__PURE__ */ jsx(
          FloatingPanel,
          {
            title: shown.title,
            aside: shown.count,
            actions: shown.actions,
            onClose: () => void canvas.commands.run(BOARD_PANEL_COMMAND, { value: shown.id }),
            className: "w-full",
            children: shown.render(canvas)
          }
        )
      }
    )
  ] });
}
var BOARD_MODES = [
  { id: "explore", label: "Explore", icon: "compass", description: "Look, ask and expand" },
  { id: "edit", label: "Edit", icon: "pencil", description: "Add, change and delete data" },
  { id: "annotate", label: "Annotate", icon: "sticky-note", description: "Annotate the data: records, values, paths" },
  {
    id: "focus",
    label: "Focus",
    icon: "scan-eye",
    description: "Just the graph \u2014 no tools",
    group: "view",
    shortcut: { key: "\\", mod: true }
  },
  { id: "present", label: "Present", icon: "presentation", description: "Walk through the answers", group: "view" }
];
var WORK_MODES = ["explore", "edit", "annotate"];
var VIEW_MODES = ["focus", "present"];
var BOARD_EDGE = 12;
var BOARD_DOCK = { width: 200, minimapHeight: 116, barHeight: 32 };
var BOARD_IDS = {
  graph: "graph",
  background: "background",
  layout: "board-force",
  elk: "elk",
  minimap: "minimap",
  sizeByConnections: "size-by-connections",
  edgeThin: "edge-thin",
  clickSelect: "click-select",
  clickInspect: "click-inspect"
};
var ANNOTATE_TOOL_KEYS = { a: "annotate", h: "highlight", g: "group" };
var ANNOTATE_TOOLS = [
  ["annotate", "sticky-note", "Annotate (A)"],
  ["highlight", "highlight", "Highlight (H)"],
  ["group", "annotation-group", "Group (G)"]
].map(([value, icon, label]) => ({
  type: "toggle",
  key: `annotate-${value}`,
  command: "tool.active",
  args: { value },
  icon,
  label,
  modes: ["annotate"]
}));
var BOARD_ROW_ITEMS = [
  { type: "widget", widget: "board-mode" },
  { type: "divider" },
  { type: "widget", widget: "pointer-tools" },
  { type: "divider", modes: ["edit", "annotate"] },
  { type: "toggle", key: "add", command: "tool.active", args: { value: "add" }, icon: "node-add", label: "Add node (N)", modes: ["edit"] },
  { type: "toggle", key: "connect", command: "tool.active", args: { value: "connect" }, icon: "connect", label: "Connect (C)", modes: ["edit"] },
  ...ANNOTATE_TOOLS,
  { type: "divider", modes: ["edit", "annotate"] },
  { type: "command", key: "undo", command: "history.undo", icon: "undo", label: "Undo (\u2318Z)", modes: ["edit", "annotate"] },
  { type: "command", key: "redo", command: "history.redo", icon: "redo", label: "Redo (\u21E7\u2318Z)", modes: ["edit", "annotate"] },
  { type: "command", key: "redraw", command: "graph.redraw", icon: "refresh", label: "Redraw", modes: ["edit", "annotate"] }
];
var BOARD_VIEW_ROW_ITEMS = [
  { type: "widget", widget: "board-mode" },
  { type: "divider", modes: ["present"] },
  { type: "widget", widget: "playbook-stepper", modes: ["present"] }
];
var BOARD_DOCK_ITEMS = [
  { type: "widget", widget: "zoom-field" },
  { type: "command", key: "fit", command: "camera.fit", icon: "fit", label: "Fit to screen (\u21E71)" },
  {
    type: "toggle",
    key: "lock",
    command: "view.lock",
    icon: "lock-open",
    activeIcon: "lock",
    label: "Lock the view",
    activeLabel: "Unlock the view"
  }
];
var BOARD_LAYOUT_PRESETS = remapLayoutPresets(DEFAULT_LAYOUT_PRESETS, {
  network: BOARD_IDS.layout
});
var NODE_RADIUS = 8;
var NODE_GAP = 22;
var BOARD_CENTRALITY = { minSize: NODE_RADIUS, maxSize: 28 };
function boardConfig(colorFor) {
  const edgeColor = (e) => colorFor(String(e.type ?? ""), "edge");
  return {
    activeLayout: BOARD_IDS.layout,
    layers: {
      [BOARD_IDS.background]: { type: "pattern", patternType: "dots", alpha: 0.5 },
      [BOARD_IDS.minimap]: {
        borderColor: { role: "divider", fallback: 4473924 },
        viewportFill: { role: "accent", fallback: 4886745 },
        viewportStroke: { role: "accent", fallback: 2781369 }
      },
      [BOARD_IDS.graph]: {
        node: {
          style: {
            shape: { kind: "circle", radius: NODE_RADIUS },
            bgStrokeWidth: 1.5,
            labelFontSize: 11,
            labelPlacement: "bottom",
            labelOffsetY: 4,
            bgFill: (n) => colorFor(String(n.type ?? ""), "node"),
            labelText: (n) => readableLabel(n)
          }
        },
        edge: {
          style: {
            strokeWidth: 1,
            arrowTargetShape: "none",
            strokeColor: edgeColor,
            arrowTargetColor: edgeColor
          }
        }
      }
    },
    layouts: {
      [BOARD_IDS.layout]: {
        animate: false,
        charge: { strength: -600, distanceMax: 600 },
        link: { distance: 150 },
        center: { x: 0, y: 0 },
        collide: {
          radius: (node) => (node.style?.size ?? NODE_RADIUS) + NODE_GAP,
          iterations: 2
        },
        alphaDecay: 0.035,
        alphaMin: 5e-3,
        velocityDecay: 0.5
      }
    },
    behaviours: {
      pan: { enabled: true },
      "drag-node": { enabled: true },
      wheel: { enabled: true },
      pinch: { enabled: true },
      hover: { enabled: true },
      [BOARD_IDS.clickSelect]: { enabled: true },
      "brush-select": { enabled: false },
      "lasso-select": { enabled: false },
      "click-view": { enabled: true },
      "label-lod": { enabled: true }
    }
  };
}

// src/board/annotations/types.ts
var DEFAULT_ANNOTATION_VIEW = { density: "full", hidden: {} };
var ANNOTATION_TOKEN = {
  amber: "var(--color-warning)",
  blue: "var(--color-primary)",
  green: "var(--color-success)",
  red: "var(--color-destructive)",
  grey: "var(--color-muted-foreground)"
};
var DRAFT_ID = "__draft__";
var AnnotationsContext = createContext(null);
function useAnnotations() {
  const ctx = useContext(AnnotationsContext);
  if (!ctx) throw new Error("useAnnotations needs an AnnotationsProvider \u2014 a GraphBoard has one.");
  return ctx;
}
function useAnnotationsOptional() {
  return useContext(AnnotationsContext);
}
var localSeq = 0;
function AnnotationsProvider({
  annotations: annotationsProp,
  onCreate,
  onUpdate,
  onDelete,
  onLoadRecords,
  view: viewProp,
  onViewChange,
  actor = { canWrite: true, canSaveView: true },
  children
}) {
  const canvas = useGraphCanvas();
  const mode = useBoardMode(canvas);
  const [ownList, setOwnList] = useState([]);
  const raw = annotationsProp ?? ownList;
  const [ownView, setOwnView] = useState(DEFAULT_ANNOTATION_VIEW);
  const view = viewProp ?? ownView;
  const setView = useCallback((next) => (onViewChange ?? setOwnView)(next), [onViewChange]);
  const [draft, setDraft] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [panel, setPanel] = useState({ kind: "list" });
  const [error, setError] = useState(null);
  const loaded = useLoadedIds(canvas);
  const annotations = useMemo(() => {
    const layer = canvas.layers.get(BOARD_IDS.graph);
    return raw.map(
      (a) => a.records.every((r) => r.label) ? a : { ...a, records: a.records.map((r) => r.label || !loaded.has(r.id) ? r : { ...r, label: labelOf(layer, r.id, r.kind) }) }
    );
  }, [raw, loaded, canvas]);
  const isMine = useCallback(
    (a) => a.author.kind === "person" && (a.author.id ? a.author.id === actor.id : a.canEdit === true),
    [actor.id]
  );
  const onBoard = useCallback((a) => a.records.some((r) => loaded.has(r.id)), [loaded]);
  const hidden = useCallback(
    (a) => {
      const h = view.hidden;
      if (h.all || view.hiddenIds?.includes(a.id)) return true;
      if (a.author.kind === "assistant" ? h.assistant : isMine(a) ? h.mine : h.others) return true;
      return a.kind === "highlight" && !!h.highlight || a.kind === "group" && !!h.group;
    },
    [view, isMine]
  );
  const openPanel = useCallback(
    (next) => {
      setPanel(next);
      if (canvas.commands.value(BOARD_PANEL_COMMAND) !== "annotations") void canvas.commands.run(BOARD_PANEL_COMMAND, { value: "annotations" });
    },
    [canvas]
  );
  const report = useCallback((p) => {
    if (p && typeof p.then === "function") {
      p.then(
        () => setError(null),
        (e) => setError(e instanceof Error ? e.message : "Couldn't save \u2014 try again")
      );
    }
  }, []);
  const begin = useCallback(
    (d) => {
      if (!actor.canWrite) return;
      setDraft({
        id: DRAFT_ID,
        kind: d.kind,
        records: d.records,
        prop: d.prop ?? null,
        valueThen: d.valueThen,
        text: d.text ?? "",
        label: d.label ?? "",
        color: d.color ?? (d.kind === "group" ? "blue" : "amber"),
        author: { id: actor.id ?? null, name: "You", kind: "person", initials: "Y" },
        meta: "just now",
        canEdit: true,
        canDelete: true
      });
      setSelectedId(DRAFT_ID);
      if (d.kind === "highlight") {
        setDraft(null);
        saveRef.current({ kind: "highlight", records: d.records, text: d.text ?? "", color: d.color ?? "amber" });
      }
    },
    [actor.canWrite, actor.id]
  );
  const save = useCallback(
    (d) => {
      if (onCreate) return report(onCreate(d));
      const a = {
        ...d,
        id: `local-${++localSeq}`,
        author: { id: actor.id ?? null, name: "You", kind: "person", initials: "Y" },
        meta: "just now",
        canEdit: true,
        canDelete: true
      };
      setOwnList((l) => [...l, a]);
      setSelectedId(a.id);
    },
    [onCreate, report, actor.id]
  );
  const saveRef = useRef(save);
  saveRef.current = save;
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const commit = useCallback((text, label) => {
    const d = draftRef.current;
    draftRef.current = null;
    setDraft(null);
    if (!d) return;
    const says = text.trim();
    if ((d.kind === "note" || d.kind === "value") && !says) return;
    saveRef.current({
      kind: d.kind,
      records: [...d.records],
      ...d.prop ? { prop: d.prop } : {},
      ...d.valueThen !== void 0 ? { valueThen: d.valueThen } : {},
      text: says,
      label: (label ?? d.label ?? "").trim(),
      color: d.color
    });
  }, []);
  const cancel = useCallback(() => setDraft(null), []);
  const update = useCallback(
    (id, patch) => {
      if (id === DRAFT_ID) return setDraft((d) => d ? { ...d, ...patch } : d);
      if (onUpdate) return report(onUpdate(id, patch));
      setOwnList((l) => l.map((a) => a.id === id ? { ...a, ...patch } : a));
    },
    [onUpdate, report]
  );
  const remove = useCallback(
    (id) => {
      setSelectedId((s) => s === id ? null : s);
      setPanel((p) => p.kind === "detail" && p.id === id ? { kind: "list" } : p);
      if (onDelete) return report(onDelete(id));
      setOwnList((l) => l.filter((a) => a.id !== id));
    },
    [onDelete, report]
  );
  const toggleHide = useCallback(
    (key) => {
      const h = { ...view.hidden, [key]: !view.hidden[key] };
      if (key !== "all" && !h[key]) h.all = false;
      setView({ ...view, hidden: h });
    },
    [view, setView]
  );
  const toggleHideId = useCallback(
    (id) => {
      const ids = new Set(view.hiddenIds ?? []);
      if (ids.has(id)) ids.delete(id);
      else ids.add(id);
      setView({ ...view, hiddenIds: [...ids] });
    },
    [view, setView]
  );
  const showAll = useCallback(() => setView({ ...view, hidden: {}, hiddenIds: [] }), [view, setView]);
  const load = useCallback((ids) => onLoadRecords?.(ids), [onLoadRecords]);
  useEffect(() => {
    if (mode !== "annotate") {
      setDraft(null);
      setSelectedId(null);
    }
  }, [mode]);
  const modeRef = useRef(mode);
  modeRef.current = mode;
  useEffect(() => {
    const inspect = canvas.behaviours.get(BOARD_IDS.clickInspect);
    return inspect?.events.on("inspect:change", (t) => {
      if (!t) return;
      const layer = canvas.layers.get(BOARD_IDS.graph);
      const drawn = t.kind === "node" ? layer?.store.getNode(t.id) : void 0;
      if (drawn && isAnnotationElement(drawn)) {
        const id = annotationIdOf(drawn);
        const record = drawn.data?.recordId;
        setTimeout(() => {
          if (id) {
            setSelectedId(id);
            openPanel({ kind: "detail", id });
          } else if (record) openPanel({ kind: "record", recordId: record });
        }, 0);
        return;
      }
      if (modeRef.current !== "annotate") return;
      if (canvas.commands.value("tool.active") && canvas.commands.value("tool.active") !== "select") return;
      setTimeout(() => openPanel({ kind: "record", recordId: t.id }), 0);
    });
  }, [canvas, openPanel]);
  const value = useMemo(
    () => ({
      annotations,
      draft,
      view,
      actor,
      loaded,
      selectedId,
      panel,
      error,
      canLoad: onLoadRecords !== void 0,
      isMine,
      onBoard,
      hidden,
      select: setSelectedId,
      openPanel,
      begin,
      commit,
      cancel,
      update,
      remove,
      setView,
      toggleHide,
      toggleHideId,
      showAll,
      load
    }),
    [annotations, draft, view, actor, loaded, selectedId, panel, error, onLoadRecords, isMine, onBoard, hidden, openPanel, begin, commit, cancel, update, remove, setView, toggleHide, toggleHideId, showAll, load]
  );
  return /* @__PURE__ */ jsx(AnnotationsContext.Provider, { value, children });
}
function useLoadedIds(canvas) {
  const [ids, setIds] = useState(() => /* @__PURE__ */ new Set());
  useEffect(() => {
    let frame = null;
    let layer;
    const read = () => {
      frame = null;
      layer ??= canvas.layers.get(BOARD_IDS.graph);
      if (!layer) return;
      const next = /* @__PURE__ */ new Set();
      for (const n of layer.store.nodes()) if (!isAnnotationElement(n)) next.add(n.id);
      for (const e of layer.store.edges()) if (!isAnnotationElement(e)) next.add(e.id);
      setIds((prev) => same(prev, next) ? prev : next);
    };
    const schedule = () => {
      if (frame === null) frame = requestAnimationFrame(read);
    };
    const offs = [];
    const attach = () => {
      layer = canvas.layers.get(BOARD_IDS.graph);
      if (!layer || offs.length) return;
      for (const ev of ["node:add", "node:remove", "edge:add", "edge:remove"]) offs.push(layer.store.events.on(ev, schedule));
      offs.push(layer.events.on("data:changed", schedule));
      schedule();
    };
    attach();
    const retry = requestAnimationFrame(attach);
    return () => {
      cancelAnimationFrame(retry);
      if (frame !== null) cancelAnimationFrame(frame);
      for (const off of offs) off();
    };
  }, [canvas]);
  return ids;
}
function same(a, b) {
  if (a.size !== b.size) return false;
  for (const x of b) if (!a.has(x)) return false;
  return true;
}
function authorGroup(a, isMine) {
  return a.author.kind === "assistant" ? "assistant" : isMine(a) ? "mine" : "others";
}
function whereOf(a) {
  if (a.kind === "note" || a.kind === "value") {
    const r = a.records[0];
    const name = r?.label || r?.id || "";
    return a.kind === "value" && a.prop ? `${name} \xB7 ${a.prop}` : name;
  }
  return `${a.records.length} record${a.records.length === 1 ? "" : "s"}`;
}
function recordsOf(canvas, ids, kind) {
  const layer = canvas.layers.get(BOARD_IDS.graph);
  return ids.map((id) => ({ id, kind, label: labelOf(layer, id, kind) }));
}
function labelOf(layer, id, kind) {
  if (kind === "edge") {
    const e = layer?.store.getEdge(id);
    return e ? `${labelOf(layer, e.source, "node")}\u2013${labelOf(layer, e.target, "node")}` : id;
  }
  const rec = layer?.store.getNode(id);
  if (!rec) return id;
  const drawn = layer.resolveNodeStyle(rec).labelText;
  if (typeof drawn === "string" && drawn) return drawn;
  const data = rec.data ?? {};
  for (const k of ["label", "name", "title", "code", "id"]) {
    const v = data[k];
    if (typeof v === "string" && v) return v;
  }
  return rec.type || id;
}

// src/board/annotations/AnnotationsProjection.tsx
var COLORS = ["amber", "blue", "green", "red", "grey"];
var FALLBACK = {
  amber: 14251782,
  blue: 2450411,
  green: 1483594,
  red: 14427686,
  grey: 7041664
};
var COUNT_SIZE = { width: 28, height: 20 };
var NO_LABEL = { labelText: "" };
var annotationNodeId = (id) => `${ANNOTATION_NODE_TYPE}:${id}`;
var ANNOTATION_FRAMES_LAYER = "annotation-frames";
function annotationIdOf(node) {
  if (!node || !isAnnotationElement(node) || node.type === ANNOTATION_COUNT_TYPE) return null;
  return (node.data ?? {}).annotationId ?? null;
}
var stateOf = (c) => `annotation-${c}`;
var colorOf = (c) => readCssColor(ANNOTATION_TOKEN[c]) ?? FALLBACK[c];
function fmt(v) {
  if (v === null || v === void 0 || v === "") return "\u2014";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
var colorMap = () => Object.fromEntries(COLORS.map((c) => [c, colorOf(c)]));
function install(layer, done) {
  if (done.has(layer)) return;
  layer.setOptions({ ...annotationTemplates(colorMap()), exportSkipTypes: ANNOTATION_TYPES });
  layer.setStateConfigs(ringStyles());
  done.add(layer);
}
function ringStyles() {
  const node = {};
  const edge = {};
  for (const c of COLORS) {
    const color = colorOf(c);
    node[stateOf(c)] = { decorations: [{ kind: "ring", id: `annotation-ring-${c}`, color, width: 3, gap: 5, alpha: 1 }] };
    edge[stateOf(c)] = { strokeColor: color, strokeWidth: 4, strokeAlpha: 0.7 };
  }
  return { node, edge };
}
function AnnotationsProjection() {
  const canvas = useGraphCanvas();
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas) ?? "explore";
  const [themeStamp, setThemeStamp] = useState(0);
  const installed = useRef(/* @__PURE__ */ new WeakSet());
  const toFree = useRef(/* @__PURE__ */ new Set());
  const freeFrame = useRef(null);
  useEffect(
    () => () => {
      if (freeFrame.current !== null) cancelAnimationFrame(freeFrame.current);
    },
    []
  );
  useEffect(() => {
    const layer = canvas.layers.get(BOARD_IDS.graph);
    if (!layer) return;
    if (installed.current.has(layer)) layer.setOptions(annotationTemplates(colorMap()));
    install(layer, installed.current);
    layer.setStateConfigs(ringStyles());
  }, [canvas, themeStamp]);
  const { select: select2, openPanel } = ctx;
  useEffect(() => {
    const frames = new GroupFramesLayer({ id: ANNOTATION_FRAMES_LAYER, zIndex: -1, options: { graphLayerId: BOARD_IDS.graph } });
    canvas.layers.add(frames);
    const off = frames.events.on("frame:click", ({ frameId }) => {
      select2(frameId);
      openPanel({ kind: "detail", id: frameId });
    });
    return () => {
      off();
      canvas.layers.remove(ANNOTATION_FRAMES_LAYER);
    };
  }, [canvas, select2, openPanel]);
  useEffect(() => canvas.events.on("theme:change", () => setThemeStamp((s) => s + 1)), [canvas]);
  useEffect(() => {
    const layer = canvas.layers.get(BOARD_IDS.graph);
    if (!layer) return;
    install(layer, installed.current);
    const store = layer.store;
    const drawing = mode !== "focus";
    const density = mode === "annotate" ? "full" : ctx.view.density;
    const all = ctx.draft ? [...ctx.annotations, ctx.draft] : [...ctx.annotations];
    const shown = drawing ? all.filter((a) => a.id === DRAFT_ID || ctx.onBoard(a) && !ctx.hidden(a)) : [];
    const nodes = /* @__PURE__ */ new Map();
    const edges = /* @__PURE__ */ new Map();
    const nodeStates = /* @__PURE__ */ new Map();
    const edgeStates = /* @__PURE__ */ new Map();
    const counts = /* @__PURE__ */ new Map();
    const frames = [];
    const heading = readCssColor("var(--color-foreground)");
    const dashed = (color) => ({
      strokeColor: colorOf(color),
      strokeWidth: 1.2,
      strokeDashArray: [4, 3],
      arrowTargetShape: "none"
    });
    const anchorOf = (r) => r.kind === "edge" ? store.getEdge(r.id)?.source : r.id;
    const loadedNode = (id) => !!id && store.hasNode(id) && !isAnnotationElement(store.getNode(id));
    for (const a of shown) {
      if (a.kind === "highlight") {
        const ids = new Set(a.records.filter((r) => r.kind === "node" && loadedNode(r.id)).map((r) => r.id));
        for (const id2 of ids) (nodeStates.get(id2) ?? nodeStates.set(id2, /* @__PURE__ */ new Set()).get(id2)).add(stateOf(a.color));
        for (const e of store.edges()) {
          if (ids.has(e.source) && ids.has(e.target)) (edgeStates.get(e.id) ?? edgeStates.set(e.id, /* @__PURE__ */ new Set()).get(e.id)).add(stateOf(a.color));
        }
        continue;
      }
      if (a.kind === "group") {
        const members = a.records.filter((r) => r.kind === "node" && loadedNode(r.id)).map((r) => r.id);
        if (members.length === 0) continue;
        frames.push({
          id: a.id,
          members,
          label: `${a.label || "Group"} \xB7 ${members.length < a.records.length ? `${members.length} of ${a.records.length}` : `${members.length} records`}`,
          color: colorOf(a.color),
          ...heading !== void 0 ? { labelColor: heading } : {},
          dashed: members.length < a.records.length
        });
        continue;
      }
      const rec = a.records[0];
      const anchor = rec ? anchorOf(rec) : void 0;
      if (!loadedNode(anchor)) continue;
      if (density === "badges" && a.id !== DRAFT_ID) {
        const c = counts.get(anchor) ?? { n: 0, color: a.color };
        c.n += 1;
        counts.set(anchor, c);
        continue;
      }
      const id = annotationNodeId(a.id);
      let valueLine;
      if (a.kind === "value" && a.prop && rec) {
        const target = rec.kind === "node" ? store.getNode(rec.id) : store.getEdge(rec.id);
        const now = fmt(target?.data?.[a.prop]);
        const then = a.valueThen === void 0 ? void 0 : fmt(a.valueThen);
        valueLine = then !== void 0 && then !== now ? `${a.prop}  ${now} \xB7 was ${then}` : `${a.prop}  ${now}`;
      }
      nodes.set(id, {
        anchor,
        size: { width: ANNOTATION_CARD_WIDTH, height: valueLine ? ANNOTATION_VALUE_CARD_HEIGHT : ANNOTATION_CARD_HEIGHT },
        node: {
          id,
          type: valueLine ? ANNOTATION_VALUE_TYPE : ANNOTATION_NODE_TYPE,
          // The card prints its own text; no board label under it.
          style: NO_LABEL,
          data: {
            annotationId: a.id,
            text: a.text || (a.id === DRAFT_ID ? " " : ""),
            color: a.color,
            author: a.author.name,
            initials: a.author.initials ?? a.author.name.slice(0, 1).toUpperCase(),
            ...a.meta ? { meta: a.meta } : {},
            ...valueLine ? { valueLine } : {}
          }
        }
      });
      edges.set(`${ANNOTATION_EDGE_TYPE}:${a.id}`, {
        id: `${ANNOTATION_EDGE_TYPE}:${a.id}`,
        type: ANNOTATION_EDGE_TYPE,
        source: id,
        target: anchor,
        style: dashed(a.color)
      });
    }
    for (const [record, c] of counts) {
      const id = `${ANNOTATION_COUNT_TYPE}:${record}`;
      nodes.set(id, {
        anchor: record,
        size: COUNT_SIZE,
        node: { id, type: ANNOTATION_COUNT_TYPE, style: NO_LABEL, data: { count: String(c.n), color: c.color, recordId: record } }
      });
      edges.set(`${ANNOTATION_EDGE_TYPE}:count:${record}`, {
        id: `${ANNOTATION_EDGE_TYPE}:count:${record}`,
        type: ANNOTATION_EDGE_TYPE,
        source: id,
        target: record,
        style: dashed(c.color)
      });
    }
    const sig = (x) => JSON.stringify(x);
    const removedNodes = [];
    const removedEdges = [];
    const addedNodes = [];
    const addedEdges = [];
    const updatedNodes = [];
    const updatedEdges = [];
    for (const n of store.nodes()) if (isAnnotationElement(n) && !nodes.has(n.id)) removedNodes.push(n.id);
    for (const e of store.edges()) if (isAnnotationElement(e) && !edges.has(e.id)) removedEdges.push(e.id);
    const placed = [];
    const occupied = [];
    const settled = !canvas.store.view.getState().runtime.layout.running;
    for (const [id, want] of nodes) {
      const have = store.getNode(id);
      if (!have) {
        const at = settled && want.anchor ? placeBeside(layer, want.anchor, want.size, { ignore: id, occupied }) : null;
        addedNodes.push({ ...want.node, ...at ? { position: at, pinned: true } : {} });
        if (at) {
          placed.push(id);
          occupied.push({ ...at, ...want.size });
        }
      } else if (have.type !== want.node.type || sig(have.data) !== sig(want.node.data) || sig(have.style ?? null) !== sig(want.node.style ?? null)) {
        updatedNodes.push({ id, patch: { type: want.node.type, data: want.node.data, ...want.node.style ? { style: want.node.style } : {} } });
      }
    }
    for (const [id, want] of edges) {
      const have = store.getEdge(id);
      if (!have) addedEdges.push(want);
      else if (have.target !== want.target || sig(have.style ?? null) !== sig(want.style ?? null)) {
        updatedEdges.push({ id, patch: { target: want.target, ...want.style ? { style: want.style } : {} } });
      }
    }
    if (removedNodes.length + removedEdges.length + addedNodes.length + addedEdges.length + updatedNodes.length + updatedEdges.length > 0) {
      store.internal.applyDelta({
        removed: { nodeIds: removedNodes, edgeIds: removedEdges },
        added: { nodes: addedNodes, edges: addedEdges },
        updated: { nodes: updatedNodes, edges: updatedEdges }
      });
    }
    canvas.layers.get(ANNOTATION_FRAMES_LAYER)?.setFrames(frames);
    store.internal.run(() => {
      for (const n of store.nodes()) {
        for (const s of store.nodeStatesOf(n.id)) {
          if (s.startsWith("annotation-") && !nodeStates.get(n.id)?.has(s)) store.removeNodeState(n.id, s);
        }
      }
      for (const [id, want] of nodeStates) for (const s of want) if (!store.nodeStatesOf(id).includes(s)) store.addNodeState(id, s);
      for (const e of store.edges()) {
        for (const s of store.edgeStatesOf(e.id)) {
          if (s.startsWith("annotation-") && !edgeStates.get(e.id)?.has(s)) store.removeEdgeState(e.id, s);
        }
      }
      for (const [id, want] of edgeStates) for (const s of want) if (!store.edgeStatesOf(id).includes(s)) store.addEdgeState(id, s);
    });
    for (const id of placed) toFree.current.add(id);
    if (toFree.current.size > 0 && freeFrame.current === null) {
      freeFrame.current = requestAnimationFrame(() => {
        freeFrame.current = null;
        const ids = [...toFree.current].filter((id) => store.hasNode(id));
        toFree.current.clear();
        if (ids.length > 0) store.internal.applyDelta({ pinned: ids.map((id) => ({ id, pinned: false })) });
      });
    }
  }, [canvas, ctx, mode, themeStamp]);
  useEffect(
    () => () => {
      const store = canvas.layers.get(BOARD_IDS.graph)?.store;
      if (!store) return;
      store.internal.applyDelta({
        removed: {
          nodeIds: [...store.nodes()].filter((n) => isAnnotationElement(n)).map((n) => n.id),
          edgeIds: [...store.edges()].filter((e) => isAnnotationElement(e)).map((e) => e.id)
        }
      });
    },
    [canvas]
  );
  return null;
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
var NO_TYPE = "unknown";
var ROWS = [
  { key: "mine", label: "By you", color: "var(--color-primary)" },
  { key: "others", label: "By others", color: "var(--color-success)" },
  { key: "assistant", label: "By the assistant", color: "var(--color-info)" },
  { key: "highlight", label: "Highlights", color: "var(--color-warning)" },
  { key: "group", label: "Groups", color: "var(--color-primary)" }
];
function LegendAnnotations({ canvas }) {
  const ctx = useAnnotationsOptional();
  const mode = useBoardMode(canvas ?? void 0);
  if (!ctx) return null;
  const here = ctx.annotations.filter((a) => ctx.onBoard(a));
  if (here.length === 0) return null;
  const count = (key) => here.filter((a) => key === "highlight" || key === "group" ? a.kind === key : authorGroup(a, ctx.isMine) === key).length;
  const all = !!ctx.view.hidden.all;
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 pt-1", children: [
      /* @__PURE__ */ jsx(Eyebrow, { className: "flex-1", children: "Annotations" }),
      mode !== "annotate" && /* @__PURE__ */ jsx(
        SegmentedControl,
        {
          size: "xs",
          "aria-label": "How annotations draw",
          options: [
            { value: "full", label: "In full" },
            { value: "badges", label: "Badges" }
          ],
          value: ctx.view.density,
          onValueChange: (v) => ctx.setView({ ...ctx.view, density: v })
        }
      )
    ] }),
    ctx.actor.canSaveView === false && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-xs", children: "Not saved: you can view this board only." }),
    /* @__PURE__ */ jsxs(Legend, { orientation: "column", children: [
      /* @__PURE__ */ jsx(
        LegendItem,
        {
          kind: "dot",
          color: "var(--color-warning)",
          label: "All annotations",
          count: here.length.toLocaleString(),
          pressed: !all,
          onToggle: () => ctx.toggleHide("all"),
          title: `${all ? "Show" : "Hide"} every annotation on this board`
        }
      ),
      ROWS.filter((r) => count(r.key) > 0).map((r) => {
        const off = all || !!ctx.view.hidden[r.key];
        return /* @__PURE__ */ jsx(
          LegendItem,
          {
            kind: r.key === "group" ? "box" : r.key === "highlight" ? "ring" : "dot",
            color: r.color,
            label: r.label,
            count: count(r.key).toLocaleString(),
            pressed: !off,
            onToggle: () => ctx.toggleHide(r.key),
            title: `${off ? "Show" : "Hide"} ${r.label.toLowerCase()}`
          },
          r.key
        );
      })
    ] }),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-xs", children: "Hidden here is hidden for everyone who opens this board." })
  ] });
}
function LegendViewPanel({ canvas, layerId = "graph", colorForType, title = null, toggleTypes = true, className }) {
  const [rows, setRows] = useState({ nodes: [], edges: [] });
  const frame = useRef(null);
  const colorRef = useRef(colorForType);
  colorRef.current = colorForType;
  useEffect(() => {
    const layer = canvas?.layers.get(layerId);
    if (!layer) return;
    const rebuild = () => {
      frame.current = null;
      const hidden = layer.hiddenTypes;
      setRows({
        nodes: tally(recordsOnly(layer.store.nodes()), hidden.node, (n) => colorRef.current?.(n.type ?? "", "node") ?? nodeSwatchColor(layer.resolveNodeStyle(n))),
        edges: tally(recordsOnly(layer.store.edges()), hidden.edge, (e) => colorRef.current?.(e.type ?? "", "edge"))
      });
    };
    const schedule = () => {
      if (frame.current === null) frame.current = requestAnimationFrame(rebuild);
    };
    const offs = ["node:add", "node:remove", "edge:add", "edge:remove", "node:visibility", "edge:visibility"].map(
      (ev) => layer.store.events.on(ev, schedule)
    );
    offs.push(layer.events.on("data:changed", schedule));
    schedule();
    return () => {
      for (const off of offs) off();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [canvas, layerId]);
  if (rows.nodes.length === 0 && rows.edges.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: cn("text-muted-foreground px-1 py-4 text-center text-sm", className), children: "Nothing drawn yet." });
  }
  const toggle = (kind, r) => toggleTypes && canvas ? {
    pressed: !r.hidden,
    onToggle: () => canvas.commands.run("graph.typeVisible", { layerId, kind, type: r.type }),
    title: `${r.hidden ? "Show" : "Hide"} ${r.type}`
  } : { muted: r.hidden };
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1.5", className), children: [
    title && /* @__PURE__ */ jsx(Eyebrow, { children: title }),
    rows.nodes.length > 0 && /* @__PURE__ */ jsx(Eyebrow, { children: "Nodes" }),
    /* @__PURE__ */ jsx(Legend, { orientation: "column", children: rows.nodes.map((r) => /* @__PURE__ */ jsx(LegendItem, { kind: "dot", color: r.color, label: r.type, count: r.count.toLocaleString(), ...toggle("node", r) }, `n-${r.type}`)) }),
    rows.edges.length > 0 && /* @__PURE__ */ jsx(Eyebrow, { children: "Relationships" }),
    /* @__PURE__ */ jsx(Legend, { orientation: "column", children: rows.edges.map((r) => /* @__PURE__ */ jsx(LegendItem, { kind: "line", color: r.color, label: r.type, count: r.count.toLocaleString(), ...toggle("edge", r) }, `e-${r.type}`)) }),
    /* @__PURE__ */ jsx(LegendAnnotations, { canvas })
  ] });
}
function tally(items, hiddenTypes, colorOf2) {
  const out = /* @__PURE__ */ new Map();
  for (const item of items) {
    if (item.hidden) continue;
    const type = item.type ?? "";
    const row = out.get(type);
    if (row) row.count += 1;
    else out.set(type, { type, count: 1, color: colorOf2(item), hidden: hiddenTypes.includes(type) });
  }
  return [...out.values()].sort((a, b) => b.count - a.count);
}
var REFS = [{ command: BOARD_MODE_COMMAND }];
function BoardModePicker({ canvas, icons, groupLabels }) {
  const resolved = useResolvedCanvas(canvas);
  const { states: states2, run } = useCommandStates(REFS, resolved);
  const state = states2[0];
  if (!state?.available) return null;
  const options = state.options;
  const registry = { ...DEFAULT_CONTROL_ICONS, ...icons };
  const current = options.find((o) => o.value === state.value);
  const Icon = current?.icon ? registry[current.icon] : void 0;
  const groups = ["work", "view"].map((g) => ({ g, list: options.filter((o) => (o.group ?? "work") === g) })).filter(({ list }) => list.length > 0);
  const heading = { work: groupLabels?.work ?? "Work", view: groupLabels?.view ?? "View" };
  return /* @__PURE__ */ jsxs(DropdownMenu, { children: [
    /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", "aria-label": `Mode \xB7 ${current?.label ?? ""}`, className: "gap-1.5 px-2 font-medium", children: [
      Icon && /* @__PURE__ */ jsx(Icon, {}),
      current?.label,
      /* @__PURE__ */ jsx(ChevronDown, { className: "size-3 opacity-60" })
    ] }) }),
    /* @__PURE__ */ jsx(DropdownMenuContent, { align: "start", className: "w-64", children: /* @__PURE__ */ jsx(DropdownMenuRadioGroup, { value: state.value ?? "", onValueChange: (value) => void run(BOARD_MODE_COMMAND, { value }), children: groups.map(({ g, list }, i) => /* @__PURE__ */ jsxs(Fragment, { children: [
      i > 0 && /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
      /* @__PURE__ */ jsx(DropdownMenuLabel, { className: "text-muted-foreground text-xs", children: heading[g] }),
      list.map((o) => {
        const OptionIcon = o.icon ? registry[o.icon] : void 0;
        return /* @__PURE__ */ jsxs(DropdownMenuRadioItem, { value: o.value, disabled: o.disabled, className: "items-start gap-2", children: [
          OptionIcon && /* @__PURE__ */ jsx(OptionIcon, { className: "mt-0.5 size-4 shrink-0" }),
          /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 flex-col", children: [
            /* @__PURE__ */ jsx("span", { className: "font-medium", children: o.label }),
            o.description && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: o.description })
          ] })
        ] }, o.value);
      })
    ] }, g)) }) })
  ] });
}
var HAND_TOOL = "hand";
var POINTER_SELECT_OPTIONS = [
  { value: "click", label: "Select", icon: "pointer" },
  { value: "lasso", label: "Lasso select", icon: "lasso" },
  { value: "brush", label: "Box select", icon: "select-box" }
];
var REFS2 = [{ command: "tool.active" }, { command: "select.mode" }];
function PointerTools({ canvas, options = POINTER_SELECT_OPTIONS, icons }) {
  const resolved = useResolvedCanvas(canvas);
  const { states: states2, run } = useCommandStates(REFS2, resolved);
  const size = iconButtonSize(useToolbarSize());
  const tool = String(states2[0]?.value ?? "select");
  const kind = String(states2[1]?.value ?? options[0]?.value ?? "");
  const registry = { ...DEFAULT_CONTROL_ICONS, ...icons };
  const current = options.find((o) => o.value === kind) ?? options[0];
  const KindIcon = current ? registry[current.icon] : void 0;
  const HandIcon = registry.hand;
  const selecting = tool === "select";
  const panning = tool === HAND_TOOL;
  const pick = (value) => {
    void run("select.mode", { value });
    void run("tool.active", { value: "select" });
  };
  return /* @__PURE__ */ jsxs(Fragment$1, { children: [
    /* @__PURE__ */ jsxs(DropdownMenu, { children: [
      /* @__PURE__ */ jsx(Tooltipped, { label: current?.label ?? "Select", children: /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          "aria-label": `Select \xB7 ${current?.label ?? ""}`,
          "aria-pressed": selecting,
          className: cn("gap-0.5 px-1.5", selecting && ACTIVE_CLASS),
          children: [
            KindIcon && /* @__PURE__ */ jsx(KindIcon, {}),
            /* @__PURE__ */ jsx(ChevronDown, { className: "size-3 opacity-60" })
          ]
        }
      ) }) }),
      /* @__PURE__ */ jsx(DropdownMenuContent, { align: "start", children: /* @__PURE__ */ jsx(DropdownMenuRadioGroup, { value: selecting ? kind : "", onValueChange: pick, children: options.map((o) => {
        const Icon = registry[o.icon];
        return /* @__PURE__ */ jsxs(DropdownMenuRadioItem, { value: o.value, className: "gap-2", children: [
          Icon && /* @__PURE__ */ jsx(Icon, { className: "size-4 shrink-0" }),
          o.label
        ] }, o.value);
      }) }) })
    ] }),
    /* @__PURE__ */ jsx(Tooltipped, { label: "Hand (hold Space)", children: /* @__PURE__ */ jsx(
      Button,
      {
        variant: "ghost",
        size,
        "aria-label": "Hand",
        "aria-pressed": panning,
        className: cn(panning && ACTIVE_CLASS),
        onClick: () => void run("tool.active", { value: panning ? "select" : HAND_TOOL }),
        children: /* @__PURE__ */ jsx(HandIcon, {})
      }
    ) })
  ] });
}
var LADDER = [10, 25, 33, 50, 67, 75, 100, 125, 150, 200, 300, 400];
var REFS3 = [{ command: "camera.zoomTo" }, { command: "camera.fit" }];
function ZoomField({ canvas, presets = [50, 100, 200], ladder = LADDER, min = 10, max = 400 }) {
  const resolved = useResolvedCanvas(canvas);
  const { zoom } = useZoom(resolved);
  const { states: states2, run } = useCommandStates(REFS3, resolved);
  const [draft, setDraft] = useState(null);
  const pct = Math.round(zoom * 100);
  const enabled = states2[0]?.enabled ?? false;
  const to = (percent) => void run("camera.zoomTo", { value: Math.min(max, Math.max(min, percent)) / 100 });
  const step = (dir) => {
    const next = dir > 0 ? ladder.find((v) => v > pct) : [...ladder].reverse().find((v) => v < pct);
    if (next !== void 0) to(next);
  };
  const commit = () => {
    if (draft === null) return;
    const n = Number.parseFloat(draft.replace("%", ""));
    if (Number.isFinite(n)) to(n);
    setDraft(null);
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-px", children: [
    /* @__PURE__ */ jsx(Tooltipped, { label: "Zoom out (\u2318\u2212)", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon-sm", "aria-label": "Zoom out", disabled: !enabled || pct <= min, onClick: () => step(-1), children: /* @__PURE__ */ jsx(ZoomOut, {}) }) }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center rounded-control focus-within:ring-1 focus-within:ring-ring hover:bg-accent", children: [
      /* @__PURE__ */ jsx(
        Input,
        {
          inputSize: "sm",
          "aria-label": "Zoom, in percent",
          value: draft ?? `${pct}%`,
          disabled: !enabled,
          onFocus: (e) => {
            setDraft(String(pct));
            const el = e.currentTarget;
            requestAnimationFrame(() => el.select());
          },
          onChange: (e) => setDraft(e.target.value),
          onBlur: commit,
          onKeyDown: (e) => {
            if (e.key === "Enter") {
              commit();
              e.currentTarget.blur();
            } else if (e.key === "Escape") {
              setDraft(null);
              e.currentTarget.blur();
            } else if (e.key === "ArrowUp" || e.key === "ArrowDown") {
              e.preventDefault();
              setDraft(null);
              step(e.key === "ArrowUp" ? 1 : -1);
            }
          },
          className: "w-14 border-0 bg-transparent px-1.5 text-xs tabular-nums shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
        }
      ),
      /* @__PURE__ */ jsxs(DropdownMenu, { children: [
        /* @__PURE__ */ jsx(DropdownMenuTrigger, { asChild: true, children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon-xs", "aria-label": "Zoom presets", disabled: !enabled, className: "hover:bg-transparent", children: /* @__PURE__ */ jsx(ChevronDown, { className: "size-3 opacity-60" }) }) }),
        /* @__PURE__ */ jsxs(DropdownMenuContent, { align: "start", side: "top", className: "w-40", children: [
          presets.map((p) => /* @__PURE__ */ jsxs(DropdownMenuItem, { onSelect: () => to(p), children: [
            p,
            "%",
            p === 100 && /* @__PURE__ */ jsx(DropdownMenuShortcut, { children: "\u23180" })
          ] }, p)),
          /* @__PURE__ */ jsx(DropdownMenuSeparator, {}),
          /* @__PURE__ */ jsxs(DropdownMenuItem, { disabled: !states2[1]?.enabled, onSelect: () => void run("camera.fit"), children: [
            "Fit to screen ",
            /* @__PURE__ */ jsx(DropdownMenuShortcut, { children: "\u21E71" })
          ] })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Tooltipped, { label: "Zoom in (\u2318+)", children: /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "icon-sm", "aria-label": "Zoom in", disabled: !enabled || pct >= max, onClick: () => step(1), children: /* @__PURE__ */ jsx(ZoomIn, {}) }) })
  ] });
}
var PRESET_ICONS = {
  network: Share2,
  tree: Network,
  flow: Workflow,
  radial: Orbit
};
function useLayoutPresetCards(canvas) {
  const { states: states2, run } = useCommandStates([{ command: "layout.preset" }, { command: "layout.presetRun" }], canvas);
  const preset = useLayoutPreset(canvas);
  const value = { presetId: preset?.id ?? "", overrides: preset?.overrides ?? {} };
  const offered = states2[0]?.options ?? [];
  const presets = DEFAULT_LAYOUT_PRESET_CARDS.flatMap((card) => {
    const option = offered.find((o) => o.value === card.id);
    if (!option) return [];
    return [{ ...card, label: option.label, ...option.disabled ? { disabledReason: option.description ?? "Unavailable" } : {} }];
  });
  return {
    value,
    presets,
    label: presets.find((p) => p.id === value.presetId)?.label ?? "Layout",
    onChange: (next) => void run("layout.preset", { value: next.presetId, overrides: next.overrides }),
    ...states2[1]?.enabled ? { onRunAgain: () => void run("layout.presetRun") } : {}
  };
}
function LayoutPresetsWidget({ canvas }) {
  const { value, presets, label, onChange, onRunAgain } = useLayoutPresetCards(canvas);
  const Icon = PRESET_ICONS[value.presetId] ?? Share2;
  return /* @__PURE__ */ jsxs(Popover, { children: [
    /* @__PURE__ */ jsxs(Tooltip, { children: [
      /* @__PURE__ */ jsx(TooltipTrigger, { asChild: true, children: /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", "aria-label": `Layout \xB7 ${label}`, className: "gap-0.5 px-1.5", children: [
        /* @__PURE__ */ jsx(Icon, {}),
        /* @__PURE__ */ jsx(ChevronDown, { className: "size-3 opacity-70" })
      ] }) }) }),
      /* @__PURE__ */ jsxs(TooltipContent, { children: [
        "Layout \xB7 ",
        label
      ] })
    ] }),
    /* @__PURE__ */ jsx(PopoverContent, { align: "start", className: "w-auto p-0", children: /* @__PURE__ */ jsx(LayoutPresetsViewPanel, { value, presets, onChange, ...onRunAgain ? { onRunAgain } : {} }) })
  ] });
}
LayoutPresetsWidget.optionsSpec = {};
function useLayoutPreset(canvas) {
  const subscribe = useCallback((onChange) => canvas.store.view.subscribe(onChange), [canvas]);
  const read = () => canvas.store.view.getState().definition.layoutPreset;
  return useSyncExternalStore(subscribe, read, read);
}
function PlaybookPresentButton({ canvas, onPresent, minSteps = 2 }) {
  const { steps } = usePlaybook(canvas);
  if (steps.length < minSteps) return null;
  return /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", onClick: onPresent, className: "gap-1 px-2", children: [
    /* @__PURE__ */ jsx(Presentation, {}),
    " Present"
  ] });
}
function PlaybookStepperWidget({ canvas }) {
  return /* @__PURE__ */ jsx(PlaybookStepper, { canvas });
}
function viewCentre(canvas) {
  const cam = canvas.camera;
  const p = cam.toWorld(cam.screenWidth / 2, cam.screenHeight / 2);
  return { x: Math.round(p.x), y: Math.round(p.y), zoom: cam.scale };
}
function ViewReadoutWidget({ canvas, options }) {
  const panOnly = options?.show === "pan";
  const [view, setView] = useState(() => viewCentre(canvas));
  useEffect(() => {
    let frame = null;
    const read = () => {
      if (frame !== null) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        setView(viewCentre(canvas));
      });
    };
    const offs = [
      select(canvas.store.view, (s) => s.interaction.camera).subscribe(read),
      canvas.events.on("input:camera:pan", read),
      canvas.events.on("input:camera:zoom", read)
    ];
    read();
    return () => {
      for (const off of offs) off();
      if (frame !== null) cancelAnimationFrame(frame);
    };
  }, [canvas]);
  const fmt2 = (n) => n.toLocaleString().replace("-", "\u2212");
  return /* @__PURE__ */ jsxs("span", { className: "text-sm whitespace-nowrap tabular-nums text-muted-foreground", children: [
    panOnly ? null : `Zoom ${Math.round(view.zoom * 100)}% \xB7 `,
    "Pan ",
    fmt2(view.x),
    ", ",
    fmt2(view.y)
  ] });
}
ViewReadoutWidget.optionsSpec = {
  show: {
    kind: "enum",
    label: "Show",
    default: "zoom-pan",
    description: "The pan alone when the zoom is on the board (`zoom-field`).",
    options: [
      { value: "zoom-pan", label: "Zoom and pan" },
      { value: "pan", label: "Pan" }
    ]
  }
};
function FullscreenWidget() {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const sync = () => setOn(document.fullscreenElement != null);
    document.addEventListener("fullscreenchange", sync);
    return () => document.removeEventListener("fullscreenchange", sync);
  }, []);
  return /* @__PURE__ */ jsx("span", { ref, className: "contents", children: /* @__PURE__ */ jsx(
    ToolbarItems,
    {
      bare: true,
      items: [{
        type: "toggle",
        key: "fullscreen",
        icon: Expand,
        activeIcon: Shrink,
        label: "Full screen",
        activeLabel: "Leave full screen",
        active: on,
        onToggle: () => {
          if (document.fullscreenElement) void document.exitFullscreen();
          else void positionedHost(ref.current)?.requestFullscreen();
        }
      }]
    }
  ) });
}
function positionedHost(el) {
  let node = el?.parentElement ?? null;
  let passedPanel = false;
  while (node) {
    const pos = getComputedStyle(node).position;
    if (pos === "absolute") passedPanel = true;
    else if (passedPanel && pos === "relative") return node;
    node = node.parentElement;
  }
  return document.documentElement;
}
function GraphLegendWidget({ canvas, options }) {
  return /* @__PURE__ */ jsx(FloatingPanel, { title: "Legend", className: "w-60", children: /* @__PURE__ */ jsx(LegendViewPanel, { canvas, layerId: options?.layerId ?? "graph", className: "p-2" }) });
}
function BoardModeWidget({ canvas }) {
  return /* @__PURE__ */ jsx(BoardModePicker, { canvas });
}
BoardModeWidget.optionsSpec = {};
function PointerToolsWidget({ canvas }) {
  return /* @__PURE__ */ jsx(PointerTools, { canvas });
}
PointerToolsWidget.optionsSpec = {};
function ZoomFieldWidget({ canvas }) {
  return /* @__PURE__ */ jsx(ZoomField, { canvas });
}
ZoomFieldWidget.optionsSpec = {};
GraphLegendWidget.optionsSpec = {
  layerId: { kind: "string", label: "Graph layer", default: "graph" }
};
var CHROME_CONTROL_WIDGETS = {
  "layout-presets": LayoutPresetsWidget,
  "playbook-stepper": PlaybookStepperWidget,
  "view-readout": ViewReadoutWidget,
  fullscreen: FullscreenWidget,
  "graph-legend": GraphLegendWidget,
  "board-mode": BoardModeWidget,
  "pointer-tools": PointerToolsWidget,
  "zoom-field": ZoomFieldWidget
};
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
  const { states: states2, run } = useCommandStates([{ command: "camera.pan" }, { command: "camera.reset" }], canvas);
  const panEnabled = states2[0]?.enabled ?? false;
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
          disabled: !states2[1]?.enabled,
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
  const { icon, ...rest } = options ?? {};
  const triggerIcon = icon ? DEFAULT_CONTROL_ICONS[icon] : void 0;
  return /* @__PURE__ */ jsx(ExportImageToolbar, { ...rest, ...triggerIcon ? { triggerIcon } : {}, canvas });
}
ExportImageWidget.optionsSpec = {
  formats: { kind: "strings", label: "Formats", description: "Offered formats, in order: png, jpg, webp, svg.", default: ["png", "jpg", "webp", "svg"] },
  filename: { kind: "string", label: "Filename", default: "canvas" },
  label: { kind: "string", label: "Label", default: "Export" },
  icon: { kind: "string", label: "Icon", description: "An icon-registry name, e.g. `image`.", default: "download" },
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
  "devinfo-toggle": DevInfoToggleWidget,
  ...CHROME_CONTROL_WIDGETS
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
  const { prefix, kind, typeIcon, leafIcon, labelOf: labelOf2, isHidden, forceHidden, ctx } = opts;
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
            label: labelOf2(el),
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
        const nodes = groupByType(recordsOnly(store.nodes()), {
          prefix: "graph:node",
          kind: "node",
          typeIcon: Circle,
          leafIcon: Circle,
          labelOf: (n) => elementLabel(n.data, String(n.id)),
          isHidden: (n) => store.isNodeHidden(String(n.id)),
          forceHidden,
          ctx
        });
        const edges = groupByType(recordsOnly(store.edges()), {
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
  const select2 = canvas?.behaviours.get("click-select") ?? void 0;
  return { layer, store: layer?.store, select: select2 };
}
function selectElement(canvas, kind, id) {
  graphRefs(canvas).select?.select(id, kind === "node" ? "shape" : "connector");
}
function focusElement(canvas, kind, id) {
  const { layer, select: select2 } = graphRefs(canvas);
  if (kind === "node") {
    select2?.select(id, "shape");
    layer?.focusNode(id, { zoom: FOCUS_ZOOM });
  } else {
    select2?.select(id, "connector");
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
  const { states: states2, run } = useCommandStates(refs, resolved);
  const badgeRefs = items.flatMap((it) => it.type === "toggle" && it.badge ? [{ command: it.badge }] : []);
  const { states: badgeStates } = useCommandStates(badgeRefs, resolved);
  useWarnUnavailable(
    resolved,
    refs.flatMap((r, i) => states2[i]?.available === false ? [r.command] : [])
  );
  let c = 0;
  let b = 0;
  return items.flatMap((it, i) => {
    const key = it.key ?? `${it.type}-${i}`;
    switch (it.type) {
      case "command": {
        const st = states2[c++];
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
        const st = states2[c++];
        const icon = (it.icon ? iconMap[it.icon] : void 0) ?? NoIcon;
        const activeIcon = it.activeIcon ? iconMap[it.activeIcon] : void 0;
        const suffix = st?.available === false ? UNAVAILABLE : "";
        const badge = it.badge ? badgeStates[b++]?.value : null;
        return [{
          type: "toggle",
          key,
          icon,
          ...badge ? { badge } : {},
          ...activeIcon ? { activeIcon } : {},
          label: `${it.label}${suffix}`,
          ...it.activeLabel !== void 0 ? { activeLabel: `${it.activeLabel}${suffix}` } : {},
          active: st?.active ?? false,
          disabled: !st?.enabled,
          onToggle: () => void run(it.command, it.args)
        }];
      }
      case "choice": {
        const st = states2[c++];
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

// src/control-panels/surface.ts
function surfaceClass(surface) {
  if (surface === "hairline") return "rounded-md border border-border bg-background/80 p-0.5 backdrop-blur-sm";
  return surface === true && "rounded-md border border-border bg-background p-0.5 shadow-sm";
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
function itemsInMode(items, mode) {
  const out = [];
  for (const item of items) {
    if (!inBoardMode(item.modes, mode)) continue;
    if (item.type === "divider" && (out.length === 0 || out[out.length - 1].type === "divider")) continue;
    out.push(item);
  }
  while (out.length > 0 && out[out.length - 1].type === "divider") out.pop();
  return out;
}
var IDLE_MS = 2e3;
function usePointerIdle(on) {
  const [idle, setIdle] = useState(false);
  useEffect(() => {
    if (!on) {
      setIdle(false);
      return;
    }
    let timer = setTimeout(() => setIdle(true), IDLE_MS);
    const wake = () => {
      setIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIdle(true), IDLE_MS);
    };
    window.addEventListener("pointermove", wake);
    window.addEventListener("keydown", wake);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointermove", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [on]);
  return idle;
}
function ControlPanelView({
  spec,
  canvas,
  icons,
  widgets,
  zIndex,
  folded,
  onFold,
  mode
}) {
  const fold = spec.collapsible;
  const shown = useMemo(() => {
    const items2 = itemsInMode(spec.items, mode);
    return fold && folded ? items2.filter((it) => it.key !== void 0 && fold.keep.includes(it.key)) : items2;
  }, [spec.items, fold, folded, mode]);
  const idle = usePointerIdle(spec.fade === "idle");
  const controls = useControlItems(shown, { canvas, ...icons ? { icons } : {}, ...widgets ? { widgets } : {} });
  const items = fold ? [
    ...controls,
    { type: "divider", key: "fold-divider" },
    folded ? {
      type: "button",
      key: "fold",
      icon: ChevronDown,
      label: fold.showLabel ?? "Show the tools",
      text: fold.showLabel ?? "Show the tools",
      onClick: () => onFold(false)
    } : { type: "button", key: "fold", icon: ChevronLeft, label: fold.hideLabel ?? "Hide the tools", onClick: () => onFold(true) }
  ] : controls;
  const orientation = spec.orientation ?? defaultOrientation(spec.position);
  const surface = spec.surface ?? true;
  const fill = stretches(spec);
  const width = spec.width;
  return (
    // The positioner lets the canvas keep every pointer event its content doesn't claim.
    /* @__PURE__ */ jsx("div", { style: { ...placement(spec), zIndex, pointerEvents: "none" }, children: /* @__PURE__ */ jsx(
      "div",
      {
        style: width !== void 0 ? { width } : void 0,
        className: cn(
          "pointer-events-auto flex transition-opacity duration-300",
          fill ? "h-full w-full" : "shrink-0",
          surfaceClass(surface),
          idle && "opacity-35 focus-within:opacity-100 hover:opacity-100"
        ),
        children: /* @__PURE__ */ jsx(
          "div",
          {
            className: cn(
              "flex items-center gap-0.5",
              orientation === "vertical" && "flex-col",
              width !== void 0 && "w-full justify-between"
            ),
            children: /* @__PURE__ */ jsx(ToolbarSizeContext.Provider, { value: "sm", children: /* @__PURE__ */ jsx(ToolbarItems, { items, orientation, tooltipSide: tooltipSideFor(spec.position), bare: true }) })
          }
        )
      }
    ) })
  );
}
function ControlPanels({ icons, widgets, zIndex = 5, canvas }) {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  const mode = useBoardMode(resolved);
  const [folded, setFolded] = useState({});
  const isFolded = (id, spec) => folded[id] ?? spec.collapsed === true;
  const hidden = /* @__PURE__ */ new Set();
  for (const [id, spec] of Object.entries(panels)) {
    if (spec.collapsible && isFolded(id, spec)) for (const other of spec.collapsible.hides ?? []) hidden.add(other);
  }
  return /* @__PURE__ */ jsx(Fragment$1, { children: Object.entries(panels).map(
    ([id, spec]) => spec.visible === false || hidden.has(id) || !inBoardMode(spec.modes, mode) || (spec.placement ?? "canvas") !== "canvas" ? null : /* @__PURE__ */ jsx(
      ControlPanelView,
      {
        spec,
        canvas: resolved,
        icons,
        widgets,
        zIndex,
        folded: isFolded(id, spec),
        mode,
        onFold: (next) => setFolded((f) => ({ ...f, [id]: next }))
      },
      id
    )
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
  const mode = useBoardMode(canvas);
  const shown = useMemo(() => itemsInMode(spec.items, mode), [spec.items, mode]);
  const items = useControlItems(shown, { canvas, ...icons ? { icons } : {}, ...widgets ? { widgets } : {} });
  return /* @__PURE__ */ jsx("div", { className: cn("flex shrink-0", spec.surface === true ? "rounded-md border border-border bg-background p-0.5" : surfaceClass(spec.surface ?? false)), children: /* @__PURE__ */ jsx(ToolbarItems, { items, orientation: "horizontal", tooltipSide: rail === "header" ? "bottom" : "top" }) });
}
function RegionControlPanels({ rail, region, icons, widgets, canvas }) {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  const placement2 = `${rail}-${region}`;
  const mode = useBoardMode(resolved);
  return /* @__PURE__ */ jsx(Fragment$1, { children: Object.entries(panels).map(
    ([id, spec]) => spec.visible === false || spec.placement !== placement2 || !inBoardMode(spec.modes, mode) ? null : /* @__PURE__ */ jsx(RailPanelView, { spec, canvas: resolved, rail, icons, widgets }, id)
  ) });
}
function HeaderControlPanels(props) {
  return /* @__PURE__ */ jsx(RegionControlPanels, { rail: "header", ...props });
}
var states = /* @__PURE__ */ new WeakMap();
function stateOf2(canvas) {
  let s = states.get(canvas);
  if (!s) {
    s = { key: null, isNew: false, listeners: /* @__PURE__ */ new Set() };
    states.set(canvas, s);
  }
  return s;
}
function setKey(canvas, key, isNew = false) {
  const s = stateOf2(canvas);
  if (s.key === key && s.isNew === isNew) return;
  s.key = key;
  s.isNew = key !== null && isNew;
  for (const l of s.listeners) l();
}
function elementKey(target) {
  return `${target.kind}:${target.id}`;
}
function editElement(canvas, target, opts = {}) {
  canvas.behaviours.get(opts.inspectBehaviourId ?? "click-inspect")?.setTarget(target);
  setKey(canvas, elementKey(target), opts.isNew ?? false);
}
function stopEditingElement(canvas) {
  setKey(canvas, null);
}
function isEditingNewElement(canvas) {
  return canvas ? stateOf2(canvas).isNew : false;
}
function useElementEditing(canvas) {
  const subscribe = useCallback(
    (onChange) => {
      if (!canvas) return () => {
      };
      const s = stateOf2(canvas);
      s.listeners.add(onChange);
      return () => void s.listeners.delete(onChange);
    },
    [canvas]
  );
  const get = useCallback(() => canvas ? stateOf2(canvas).key : null, [canvas]);
  return useSyncExternalStore(subscribe, get, get);
}
function ElementViewPanel({
  canvas,
  layerId = "graph",
  inspectBehaviourId = "click-inspect",
  editable = false,
  typeAsLabel = false,
  labelField = true,
  schema,
  strictSchema = false,
  nodeTitle = "Node",
  edgeTitle = "Relationship",
  focusZoom,
  elementId,
  renderExtra,
  actions,
  inlineActions = true,
  footer,
  hiddenKeys,
  onApply,
  onCancel,
  onDelete,
  deletable = true,
  onEditingChange,
  className
}) {
  const target = useEntityEditor({ layerId, inspectId: inspectBehaviourId, typeAsLabel }, canvas);
  const editingKey = useElementEditing(canvas);
  const key = target ? elementKey(target) : null;
  const editing = editable && key !== null && editingKey === key;
  const lastKey = useRef(null);
  const [, redraw] = useReducer((n) => n + 1, 0);
  useEffect(() => {
    const was = lastKey.current;
    lastKey.current = key;
    if (!canvas || editingKey === null) return;
    if (!editable || was === editingKey && key !== editingKey) stopEditingElement(canvas);
  }, [canvas, editable, editingKey, key]);
  const editingNow = editable && key !== null && editingKey === key;
  const told = useRef(onEditingChange);
  told.current = onEditingChange;
  useEffect(() => {
    if (!told.current || !canvas) return;
    told.current(editingNow && target ? { kind: target.kind, id: target.id, isNew: isEditingNewElement(canvas) } : null);
  }, [editingNow, key]);
  if (editing && target && canvas) {
    const isEdge = target.kind === "edge";
    const isNew = isEditingNewElement(canvas);
    const showLabel = !isEdge && !typeAsLabel && labelField;
    const layer = canvas.layers.get(layerId);
    const element = { kind: target.kind, id: target.id, isNew };
    const remove = () => {
      const store = layer?.store;
      if (store) store.batch(() => isEdge ? store.removeEdge(target.id) : store.removeNode(target.id), { title: isEdge ? "delete edge" : "delete node" });
    };
    const discard = () => {
      const store = layer?.store;
      if (store) store.batch(() => isEdge ? store.removeEdge(target.id) : store.removeNode(target.id), { title: isEdge ? "discard new edge" : "discard new node" });
    };
    return /* @__PURE__ */ jsx(
      ElementEditorPanel,
      {
        title: isNew ? `New ${(isEdge ? edgeTitle : nodeTitle).toLowerCase()}` : isEdge ? edgeTitle : nodeTitle,
        defaults: {
          // A new element's drawn label is its placeholder type; it starts blank.
          label: isNew ? "" : target.label,
          type: isNew && target.type === NO_TYPE ? "" : target.type,
          data: shownData(target.data, hiddenKeys)
        },
        showLabel,
        showType: true,
        ...schema ? { schema: isEdge ? schema.edgeTypes : schema.nodeTypes, strictSchema } : {},
        ...isNew ? {
          requireType: `A new ${(isEdge ? edgeTitle : nodeTitle).toLowerCase()} needs a type`,
          typeSuggestions: layer ? typesOn(layer, target.kind) : []
        } : {},
        ...isEdge && layer ? { endpoints: endpointsOf(layer, target.id) } : {},
        ...isEdge && target.reverse ? {
          onReverse: () => {
            target.reverse?.();
            redraw();
          }
        } : {},
        onCancel: () => {
          if (onCancel) onCancel(element);
          else if (isNew) discard();
          stopEditingElement(canvas);
        },
        ...deletable && !isNew ? {
          onDelete: () => {
            if (onDelete) onDelete(element);
            else remove();
            stopEditingElement(canvas);
          }
        } : {},
        onSubmit: (values) => {
          const full = {
            ...values,
            // A label not shown is not edited: commit the one drawn now.
            label: showLabel ? values.label : target.label,
            data: { ...keptData(layer, target, hiddenKeys), ...values.data }
          };
          if (onApply) {
            void Promise.resolve(onApply({ ...element, values: full })).then(() => stopEditingElement(canvas));
            return;
          }
          target.commit(full);
          stopEditingElement(canvas);
        },
        ...className !== void 0 ? { className } : {}
      },
      key
    );
  }
  return /* @__PURE__ */ jsx(
    ElementDetail,
    {
      canvas,
      layerId,
      inspectBehaviourId,
      ...focusZoom !== void 0 ? { focusZoom } : {},
      ...elementId !== void 0 ? { elementId } : {},
      ...renderExtra ? { renderExtra } : {},
      ...className !== void 0 ? { className } : {},
      ...hiddenKeys ? { hiddenKeys } : {},
      inlineActions,
      footer,
      actions: /* @__PURE__ */ jsxs(Fragment$1, { children: [
        actions,
        editable && target && canvas ? /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            onClick: () => editElement(canvas, target, { inspectBehaviourId }),
            className: "gap-1.5 [&_svg]:size-3.5",
            children: [
              /* @__PURE__ */ jsx(Pencil, { className: "text-muted-foreground/70" }),
              "Edit"
            ]
          }
        ) : null
      ] })
    }
  );
}
function shownData(data, hidden) {
  if (!hidden) return data;
  return Object.fromEntries(Object.entries(data).filter(([k]) => !hidden(k)));
}
function keptData(layer, target, hidden) {
  if (!hidden || !layer) return {};
  const el = target.kind === "node" ? layer.store.getNode(target.id) : layer.store.getEdge(target.id);
  const data = el && isRecord(el.data) ? el.data : {};
  return Object.fromEntries(Object.entries(data).filter(([k]) => hidden(k)));
}
function typesOn(layer, kind) {
  const seen = /* @__PURE__ */ new Set();
  for (const el of kind === "node" ? layer.store.nodes() : layer.store.edges()) {
    if (isAnnotationElement(el)) continue;
    const t = typeof el.type === "string" ? el.type.trim() : "";
    if (t && t !== NO_TYPE) seen.add(t);
  }
  return [...seen];
}
function endpointsOf(layer, edgeId) {
  const edge = layer.store.getEdge(edgeId);
  if (!edge) return void 0;
  const end = (id) => {
    const node = layer.store.getNode(id);
    if (!node) return id;
    const type = typeof node.type === "string" && node.type !== NO_TYPE ? labelOfNode(node) : "";
    return /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-1.5", children: [
      /* @__PURE__ */ jsx("span", { className: "truncate", children: displayNameOf(node) }),
      type && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0 font-mono text-xs", children: type })
    ] });
  };
  return { from: end(edge.source), to: end(edge.target) };
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
function Section({ title, count, children }) {
  return /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-0.5 pt-2", children: [
    /* @__PURE__ */ jsxs(Eyebrow, { className: "px-3", children: [
      title,
      count !== void 0 && count > 0 ? ` ${count}` : ""
    ] }),
    children
  ] });
}
function ValueRow({ label, value, mono }) {
  return /* @__PURE__ */ jsx(PropertyRow, { label, mono, className: "group", children: /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-start gap-1", children: [
    value === null ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground/60", children: "\u2014" }) : /* @__PURE__ */ jsx("span", { className: "min-w-0 break-all", title: value.length > MAX_VALUE_CHARS ? value : void 0, children: value.length > MAX_VALUE_CHARS ? `${value.slice(0, MAX_VALUE_CHARS)}\u2026` : value }),
    value === null ? null : /* @__PURE__ */ jsx(CopyButton, { text: value, label: `Copy ${label}` })
  ] }) });
}
function ElementDetail({ canvas, className, ...rest }) {
  if (!canvas) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full items-center justify-center", className), children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-4 text-base", children: "Failed to load \u2014 no canvas." }) });
  }
  return /* @__PURE__ */ jsx(ElementDetailContent, { canvas, className, ...rest });
}
function ElementDetailContent({
  canvas,
  layerId = "graph",
  inspectBehaviourId = "click-inspect",
  elementId,
  focusZoom = 2,
  renderExtra,
  actions,
  inlineActions = true,
  footer,
  hiddenKeys,
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
  const footerNode = !resolved ? null : typeof footer === "function" ? footer(resolved.kind === "node" ? resolved.node : resolved.edge, resolved.kind) : footer;
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
  const properties = element && isRecord(element.data) ? Object.entries(element.data).filter(([k]) => !hiddenKeys?.(k)) : [];
  const relationships = resolved?.kind === "node" && store ? relationshipsOf(store, resolved.node.id) : [];
  return /* @__PURE__ */ jsxs("div", { className: cn("flex h-full flex-col overflow-hidden text-base", className), children: [
    /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: !inspectedId ? (
      // Two different nothings: no click yet, versus nothing that can report a
      // click. Collapsing them would leave a host debugging an empty panel that
      // was never wired up.
      /* @__PURE__ */ jsxs("div", { className: "text-muted-foreground flex flex-col items-center gap-1.5 px-4 py-8 text-center text-sm", children: [
        /* @__PURE__ */ jsx(MousePointerClick, { className: "h-5 w-5" }),
        behaviourPresent || controlled ? /* @__PURE__ */ jsxs(Fragment$1, { children: [
          /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold", children: "Nothing picked" }),
          /* @__PURE__ */ jsx("span", { children: "Click a node or a relationship to see it here." })
        ] }) : /* @__PURE__ */ jsxs("span", { className: "min-w-0", children: [
          "No ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: "ClickInspectBehaviour" }),
          " is registered, so nothing reports which element was clicked. Register and enable one (id",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: inspectBehaviourId }),
          "), or pass an explicit",
          " ",
          /* @__PURE__ */ jsx("span", { className: "font-mono", children: "elementId" }),
          "."
        ] })
      ] })
    ) : !resolved || !element ? (
      // The id is selected but resolves to no element in this layer: removed
      // while selected, or belonging to a different layer. Say which id.
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2 p-3", children: [
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
    ) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1 pb-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "group flex flex-col gap-1 px-3 pt-3 pb-2", children: [
        /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 items-center gap-2", children: [
          resolved.kind === "node" ? (
            // Hollow when the node has no representable solid colour.
            /* @__PURE__ */ jsx(
              "span",
              {
                className: "border-muted-foreground/40 block size-2.5 shrink-0 rounded-full border",
                style: layer && nodeSwatchColor(layer.resolveNodeStyle(resolved.node)) ? { backgroundColor: nodeSwatchColor(layer.resolveNodeStyle(resolved.node)) } : void 0
              }
            )
          ) : /* @__PURE__ */ jsx(ArrowRight, { className: "text-muted-foreground/70 size-3 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate font-semibold", children: elementTitle(resolved, store) }),
          /* @__PURE__ */ jsx(Badge, { variant: "outline", size: "xs", className: "shrink-0 font-mono", children: resolved.kind === "node" ? labelOfNode(resolved.node) : labelOfEdge(resolved.edge) }),
          inlineActions && /* @__PURE__ */ jsxs("span", { className: "ml-auto flex shrink-0 items-center gap-0.5", children: [
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon-sm",
                onClick: focusInspected,
                "aria-label": "Focus",
                title: "Frame this element on the canvas",
                children: /* @__PURE__ */ jsx(Crosshair, {})
              }
            ),
            actions
          ] })
        ] }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground flex items-center gap-1 font-mono text-xs", children: [
          /* @__PURE__ */ jsxs("span", { className: "min-w-0 truncate", children: [
            "id ",
            element.id
          ] }),
          /* @__PURE__ */ jsx(CopyButton, { text: element.id, label: "Copy id" })
        ] })
      ] }),
      renderExtra ? /* @__PURE__ */ jsx("div", { className: "px-3", children: renderExtra(element, resolved.kind) }) : null,
      resolved.kind === "edge" && /* @__PURE__ */ jsx(Section, { title: "Ends", children: /* @__PURE__ */ jsx(PropertyList, { labelWidth: 56, className: "px-3", children: [["From", "source"], ["To", "target"]].map(([label, end]) => {
        const id = resolved.edge[end];
        const node = store?.getNode(id);
        return /* @__PURE__ */ jsx(PropertyRow, { label, children: /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            onClick: () => focusNode(id),
            title: `Show ${node ? displayNameOf(node) : id} on the board`,
            className: "h-auto min-w-0 justify-start gap-1.5 px-1.5 py-0.5 text-left font-normal",
            children: [
              /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate", children: node ? displayNameOf(node) : id }),
              node && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-mono text-xs", children: labelOfNode(node) })
            ]
          }
        ) }, end);
      }) }) }),
      /* @__PURE__ */ jsx(Section, { title: "Properties", count: properties.length, children: properties.length === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-3 text-sm", children: "No properties" }) : /* @__PURE__ */ jsx(PropertyList, { labelWidth: 96, className: "px-3", children: properties.map(([key, value]) => /* @__PURE__ */ jsx(ValueRow, { label: key, value: formatValue(value) }, key)) }) }),
      resolved.kind === "node" && relationships.length > 0 && /* @__PURE__ */ jsx(Section, { title: "Relationships", count: relationships.reduce((n, r) => n + r.names.length, 0), children: /* @__PURE__ */ jsx("div", { className: "flex flex-col px-3", children: relationships.map((r) => /* @__PURE__ */ jsxs("div", { className: "flex min-h-7 items-center gap-2 text-sm", children: [
        r.dir === "out" ? /* @__PURE__ */ jsx(ArrowRight, { className: "text-muted-foreground size-3 shrink-0", "aria-label": "out" }) : /* @__PURE__ */ jsx(ArrowLeft, { className: "text-muted-foreground size-3 shrink-0", "aria-label": "in" }),
        /* @__PURE__ */ jsx("span", { className: "w-24 shrink-0 truncate font-mono text-xs", children: r.type }),
        /* @__PURE__ */ jsx("span", { className: "w-5 shrink-0 font-semibold", children: r.names.length }),
        /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground min-w-0 truncate", children: [
          r.names.slice(0, 3).join(", "),
          r.names.length > 3 ? ` +${r.names.length - 3}` : ""
        ] })
      ] }, r.dir + r.type)) }) })
    ] }) }),
    footerNode ? /* @__PURE__ */ jsx("div", { className: "border-border flex shrink-0 flex-wrap items-center gap-1.5 border-t p-2", children: footerNode }) : null
  ] });
}
function elementTitle(resolved, store) {
  if (resolved.kind === "node") return displayNameOf(resolved.node);
  const name = (id) => {
    const n = store?.getNode(id);
    return n ? displayNameOf(n) : id;
  };
  return `${name(resolved.edge.source)} \u2192 ${name(resolved.edge.target)}`;
}
function relationshipsOf(store, id) {
  const groups = /* @__PURE__ */ new Map();
  for (const e of store.edges()) {
    if (isAnnotationElement(e)) continue;
    const dir = e.source === id ? "out" : e.target === id ? "in" : null;
    if (!dir) continue;
    const other = store.getNode(dir === "out" ? e.target : e.source);
    const type = labelOfEdge(e);
    const k = dir + ":" + type;
    if (!groups.has(k)) groups.set(k, { dir, type, names: [] });
    groups.get(k).names.push(other ? displayNameOf(other) : dir === "out" ? e.target : e.source);
  }
  return [...groups.values()].sort((a, b) => a.dir === b.dir ? a.type.localeCompare(b.type) : a.dir === "out" ? -1 : 1);
}
function useElementPanel(canvas, options = {}) {
  const { layerId = "graph", inspectBehaviourId = "click-inspect", focusZoom = 2 } = options;
  const target = useInspectTarget({ inspectId: inspectBehaviourId }, canvas);
  const editingKey = useElementEditing(canvas);
  const editing = target !== null && editingKey === elementKey(target);
  const focus = useCallback(() => {
    const layer = canvas?.layers.get(layerId);
    if (!layer || !target) return;
    if (target.kind === "node") layer.focusNode(target.id, { zoom: focusZoom, includeHidden: true });
    else layer.focusEdges([target.id], { includeHidden: true });
  }, [canvas, layerId, target, focusZoom]);
  const edit = useCallback(() => {
    if (canvas && target) editElement(canvas, target, { inspectBehaviourId });
  }, [canvas, target, inspectBehaviourId]);
  return {
    kind: target ? target.kind === "node" ? "node" : "relationship" : null,
    editing,
    isNew: editing && canvas ? isEditingNewElement(canvas) : false,
    focus,
    edit
  };
}
var ACTIVE_LAYOUT_ID = "graph-force";
var LAYOUT_PRESETS = remapLayoutPresets(DEFAULT_LAYOUT_PRESETS, {
  network: ACTIVE_LAYOUT_ID
});
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
function BundleLayoutPresets() {
  const canvas = useGraphCanvas();
  useEffect(() => {
    canvas?.setLayoutPresets(LAYOUT_PRESETS);
  }, [canvas]);
  return null;
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
            /* @__PURE__ */ jsx(BundleLayoutPresets, {}),
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

export { ACTIVE_CLASS, ANNOTATE_TOOLS, ANNOTATE_TOOL_KEYS, ANNOTATION_FRAMES_LAYER, ANNOTATION_TOKEN, AnnotationsProjection, AnnotationsProvider, BASE_CONFIG, BOARD_CENTRALITY, BOARD_DOCK, BOARD_DOCK_ITEMS, BOARD_EDGE, BOARD_IDS, BOARD_LAYOUT_PRESETS, BOARD_MODES, BOARD_PANEL_COMMAND, BOARD_ROW_ITEMS, BOARD_VIEW_ROW_ITEMS, BoardModePicker, BoardPanels, CANVAS_CONTROL_ITEMS, CHROME_CONTROL_WIDGETS, CanvasMessageBar, CanvasSettingsBrowser, ContextMenuOverlay, ControlItems, ControlPanels, DEFAULT_ANNOTATION_VIEW, DEFAULT_CONTROL_ICONS, DEFAULT_CONTROL_WIDGETS, DEFAULT_LAYOUT_PRESET_CARDS, DEFAULT_LAYOUT_PRESET_DEFAULTS, DEFAULT_LAYOUT_PRESET_OPTIONS, DRAFT_ID, DetailCard, DevInfoToggleButton, EDGE_TYPE_CONTROL_ITEMS, EDIT_CONTROL_ITEMS, EXPLORER_CONTROL_ITEMS, EXPORT_IMAGE_AREA_OPTIONS, EXPORT_IMAGE_BACKGROUND_OPTIONS, EXPORT_IMAGE_FORMAT_OPTIONS, EXPORT_IMAGE_RATIO_OPTIONS, EXPORT_IMAGE_SCALE_OPTIONS, EdgeEndpoints, ElementEditorPanel, ElementViewPanel, ExportImagePanel, ExportImageToolbar, ExportStatePanel, ExportStateToolbar, GRAPH_CONTROL_ITEMS, GRID_CONTROL_ITEMS, GraphCanvasApp, GraphCanvasAppRoot, GraphCanvasAppSurface, GraphStatusBar, HAND_TOOL, HISTORY_CONTROL_ITEMS, HeaderControlPanels, HoverElementPreviewCard, INPUT_CONTROL_ITEMS, LAYOUT_CONTROL_ITEMS, LAYOUT_PRESETS, LayersViewPanel, LayoutPresetOptions, LayoutPresetPicker, LayoutPresetReset, LayoutPresetThumbnail, LayoutPresetsViewPanel, LegendViewPanel, MODELLER_CONTROL_ITEMS, MenuItemList, MessageStatus, MiniMapToggleButton, NAVIGATION_CONTROL_ITEMS, NO_TYPE, PAN_CONTROL_ITEMS, PAN_PAD_CONTROL_ITEMS, POINTER_SELECT_OPTIONS, Panel, PlaybookPresentButton, PlaybookStepper, PointerTools, PropertyDetailView, RegionControlPanels, RendererCapabilityBanner, RendererStatus, SELECT_MODE_CONTROL_ITEMS, THEME_CONTROL_ITEMS, ToolbarItems, Tooltipped, VIEW_CONTROL_ITEMS, VIEW_MODES, ViewStatus, WORK_MODES, ZOOM_CONTROL_ITEMS, ZOOM_LEVEL_CONTROL_ITEMS, ZoomField, annotationIdOf, annotationNodeId, applyIconOverrides, authorGroup, boardConfig, controlWidgetOptionsSpecs, defaultPropertyRenderers, defineControlItems, displayNameOf, editElement, elementKey, hasOverrides, hasRailControlPanels, isEditingNewElement, isImageUrl, isRecord, isSafeHref, labelOf, labelOfEdge, labelOfNode, nodeSwatchColor, recordsOf, renderPropertyValue, resolvePropertyRenderer, stopEditingElement, useAnnotations, useAnnotationsOptional, useControlItems, useElementEditing, useElementPanel, useGraphCanvasApp, useLayoutPresetCards, whereOf };
//# sourceMappingURL=chunk-KFDER76U.js.map
//# sourceMappingURL=chunk-KFDER76U.js.map