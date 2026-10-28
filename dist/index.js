import { THEME_CONTROL_ITEMS, GRID_CONTROL_ITEMS, LAYOUT_CONTROL_ITEMS, EDGE_TYPE_CONTROL_ITEMS, SELECT_MODE_CONTROL_ITEMS, EDIT_CONTROL_ITEMS, HISTORY_CONTROL_ITEMS, GRAPH_CONTROL_ITEMS, MODELLER_CONTROL_ITEMS, EXPLORER_CONTROL_ITEMS, CANVAS_CONTROL_ITEMS, INPUT_CONTROL_ITEMS, NAVIGATION_CONTROL_ITEMS, PAN_PAD_CONTROL_ITEMS, PAN_CONTROL_ITEMS, VIEW_CONTROL_ITEMS, ZOOM_LEVEL_CONTROL_ITEMS, ZOOM_CONTROL_ITEMS, ACTIVE_CLASS, DEFAULT_CONTROL_ICONS, DEFAULT_CONTROL_WIDGETS, controlWidgetOptionsSpecs, nodeSwatchColor, displayNameOf, labelOfNode, labelOfEdge, useLayoutPresetCards, LayoutPresetsViewPanel, useControlItems, applyIconOverrides, ToolbarItems, ControlPanels, useAnnotations, BOARD_IDS, DRAFT_ID, BOARD_PANEL_COMMAND, editElement, authorGroup, labelOf, recordsOf, ExportImagePanel, LegendViewPanel, ControlItems, ElementViewPanel, BOARD_LAYOUT_PRESETS, boardConfig, BOARD_MODES, AnnotationsProvider, BOARD_CENTRALITY, HAND_TOOL, ANNOTATE_TOOL_KEYS, WORK_MODES, AnnotationsProjection, BOARD_EDGE, BOARD_DOCK, BOARD_ROW_ITEMS, BOARD_VIEW_ROW_ITEMS, VIEW_MODES, BOARD_DOCK_ITEMS, BoardPanels, Tooltipped, DetailCard, PropertyDetailView, EdgeEndpoints, GraphCanvasApp, CanvasMessageBar, GraphStatusBar, annotationNodeId, ANNOTATION_FRAMES_LAYER, ContextMenuOverlay, whereOf, NO_TYPE, isRecord } from './chunk-KFDER76U.js';
export { ANNOTATE_TOOLS, ANNOTATE_TOOL_KEYS, ANNOTATION_TOKEN, AnnotationsProvider, BOARD_CENTRALITY, BOARD_DOCK, BOARD_DOCK_ITEMS, BOARD_EDGE, BOARD_IDS, BOARD_LAYOUT_PRESETS, BOARD_MODES, BOARD_PANEL_COMMAND, BOARD_ROW_ITEMS, BOARD_VIEW_ROW_ITEMS, BoardModePicker, BoardPanels, CANVAS_CONTROL_ITEMS, CHROME_CONTROL_WIDGETS, CanvasMessageBar, CanvasSettingsBrowser, CanvasThemeSync, ContextMenuOverlay, ControlItems, ControlPanels, DEFAULT_ANNOTATION_VIEW, DEFAULT_CONTROL_ICONS, DEFAULT_CONTROL_WIDGETS, DEFAULT_LAYOUT_PRESET_CARDS, DEFAULT_LAYOUT_PRESET_DEFAULTS, DEFAULT_LAYOUT_PRESET_OPTIONS, DetailCard, DevInfoToggleButton, EDGE_TYPE_CONTROL_ITEMS, EDIT_CONTROL_ITEMS, EXPLORER_CONTROL_ITEMS, EXPORT_IMAGE_AREA_OPTIONS, EXPORT_IMAGE_BACKGROUND_OPTIONS, EXPORT_IMAGE_FORMAT_OPTIONS, EXPORT_IMAGE_RATIO_OPTIONS, EXPORT_IMAGE_SCALE_OPTIONS, EdgeEndpoints, ElementEditorPanel, ElementViewPanel, ExportImagePanel, ExportImageToolbar, ExportStatePanel, ExportStateToolbar, GRAPH_CONTROL_ITEMS, GRID_CONTROL_ITEMS, GraphCanvasApp, GraphCanvasAppRoot, GraphCanvasAppSurface, GraphStatusBar, HAND_TOOL, HISTORY_CONTROL_ITEMS, HeaderControlPanels, HoverElementPreviewCard, INPUT_CONTROL_ITEMS, LAYOUT_CONTROL_ITEMS, LayersViewPanel, LayoutPresetOptions, LayoutPresetPicker, LayoutPresetReset, LayoutPresetThumbnail, LayoutPresetsViewPanel, LegendViewPanel, MODELLER_CONTROL_ITEMS, MenuItemList, MessageStatus, MiniMapToggleButton, NAVIGATION_CONTROL_ITEMS, PAN_CONTROL_ITEMS, PAN_PAD_CONTROL_ITEMS, POINTER_SELECT_OPTIONS, Panel, PlaybookPresentButton, PlaybookStepper, PointerTools, PropertyDetailView, RegionControlPanels, RendererCapabilityBanner, RendererStatus, SELECT_MODE_CONTROL_ITEMS, THEME_CONTROL_ITEMS, ToolbarItems, Tooltipped, VIEW_CONTROL_ITEMS, VIEW_MODES, ViewStatus, WORK_MODES, ZOOM_CONTROL_ITEMS, ZOOM_LEVEL_CONTROL_ITEMS, ZoomField, annotationIdOf, applyIconOverrides, boardConfig, controlWidgetOptionsSpecs, defaultPropertyRenderers, defineControlItems, editElement, elementKey, BASE_CONFIG as graphCanvasAppBaseConfig, LAYOUT_PRESETS as graphCanvasAppLayoutPresets, hasOverrides, hasRailControlPanels, isEditingNewElement, isImageUrl, isSafeHref, renderPropertyValue, resolvePropertyRenderer, stopEditingElement, useAnnotations, useAnnotationsOptional, useControlItems, useElementEditing, useElementPanel, useGraphCanvasApp, useLayoutPresetCards, whereOf } from './chunk-KFDER76U.js';
import { useState, useMemo, useCallback, useSyncExternalStore, useRef, useEffect, useContext, useLayoutEffect } from 'react';
import { Button, Badge, cn, Card, CardContent, PanelStack, Alert, AlertDescription, CardHeader, CardTitle, Separator, ToggleGroup, ToggleGroupItem, RichSelect, Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, FloatingPanel, EmptyState, SegmentedControl, Eyebrow, AnnotationRow, PropertyList, PropertyRow, AuthorMark, AlertTitle, DiffList, DiffRow, Spinner, ScrollArea, Legend, LegendItem, Skeleton, Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandShortcut, Dialog, DialogContent, DialogTitle, Accordion, AccordionItem, AccordionTrigger, AccordionContent, Popover, PopoverTrigger, PopoverContent } from '@invana/ui';
import { Input, FormField, Textarea, Select, SelectTrigger, SelectValue, SelectContent, SelectItem, Switch, ColorSwatches, SettingsPanel } from '@invana/forms';
import { useForm, useFieldArray, useWatch, FormProvider } from 'react-hook-form';
import { Plus, Trash2, Search, Circle, Crosshair, Eye, EyeOff, X, ArrowRight, HelpCircle, ChevronLeft, ChevronRight, Copy, StickyNote, Highlighter, MessageSquareText, CircleCheck, CircleAlert, Lock, RotateCcw, ImageDown, Download, Moon, Sun, Settings, Link2, Spline, MousePointer2, Camera, ImageOff, LockOpen, Check, Table, CornerDownRight, Minus, Pencil, ArrowUp, ArrowDown } from 'lucide-react';
import { useResolvedCanvas, useControlPanels, useStore, CanvasContext, usePlaybook, useHistoryEntries, useCanvas, useCommandStates, useBoardMode, inBoardMode, GraphCanvas, BackgroundLayer, ThemeBehaviour, CanvasThemeSync, GraphLayer, WheelZoomBehaviour, DragPanBehaviour, DragNodeBehaviour, ParallelEdgeBehaviour, TextResolutionLODBehaviour, HoverActivateBehaviour, ControlPanel, useGraphCanvas, useUnsavedChanges, useCanvasImageExport, useSelection, GraphCanvasContext, D3ForceLayout, ElkLayout, NodeCentralityBehaviour, EdgeLODBehaviour, PinchZoomBehaviour, ClickSelectBehaviour, BrushSelectBehaviour, LassoSelectBehaviour, ClickViewBehaviour, BoardModes, BoardToolKeys, ClickInspectBehaviour, UnsavedChangesBehaviour, UnsavedGhostLayer, MiniMapLayer, CreateNodeBehaviour, DrawEdgeBehaviour, useUnsavedGuard, useCanvasEvent, useViewContext, useStyleEditorSection, useClipboard, useClearGraph, GraphClipboardProvider, useLayoutsSection, useSelectMode, useTool, CollapseExpandBehaviour, NodeLabelLODBehaviour, HoverElementPreviewBehaviour, useContextMenu, ContextMenuBehaviour, useLayout } from '@invana/canvas-react';
import { jsxs, jsx, Fragment } from 'react/jsx-runtime';
import { DEFAULT_EDGE_STATES, readCssColor, schemaSignature, UNKNOWN_TYPE, isAnnotationElement, UNSAVED_COUNT_COMMAND, edgeAlphaForCount, EDGE_DENSITY, thinsEdges, schemaCardStructure, recordsOnly, deriveSchema, schemaTableCard, resolveField, readValueKey, selectedElementIds, resolveNodeSize } from '@invana/graph';
export { defaultEdgeTypeOf, defaultNodeTypeOf, deriveSchema, schemaSignature } from '@invana/graph';
import { deepMerge } from '@invana/canvas';
import { colorSlotByString } from '@invana/styling/color';
import { D3ForceLayout as D3ForceLayout$1 } from '@invana/graph-layout-d3-force';

// src/editor-panels/control-panels/types.ts
var NO_ICON = "__none__";
var ARG_DEFAULT = "__default__";

// src/editor-panels/control-panels/fields.ts
var ANCHORS = ["top-left", "top", "top-right", "left", "center", "right", "bottom-left", "bottom", "bottom-right"];
var PLACEMENTS = [
  { label: "Over the canvas", value: "canvas" },
  { label: "Header \xB7 left", value: "header-left" },
  { label: "Header \xB7 centre", value: "header-center" },
  { label: "Header \xB7 right", value: "header-right" },
  { label: "Footer \xB7 left", value: "footer-left" },
  { label: "Footer \xB7 centre", value: "footer-center" },
  { label: "Footer \xB7 right", value: "footer-right" }
];
var SURFACE_FIELD = {
  name: "surface",
  type: "select",
  label: "Surface",
  options: [
    { label: "Card", value: "card" },
    { label: "Hairline", value: "hairline" },
    { label: "None", value: "none" }
  ]
};
function controlPanelFields(positionMode, placement = "canvas") {
  const placementField = { name: "placement", type: "select", label: "Placement", options: PLACEMENTS };
  if (placement !== "canvas") {
    return [
      placementField,
      SURFACE_FIELD,
      { name: "visible", type: "boolean", label: "Visible", control: "checkbox" }
    ];
  }
  const position = positionMode === "insets" ? [
    { name: "insetTop", type: "text", label: "Top", placeholder: "e.g. 12 or 10%" },
    { name: "insetRight", type: "text", label: "Right" },
    { name: "insetBottom", type: "text", label: "Bottom" },
    { name: "insetLeft", type: "text", label: "Left" }
  ] : [
    { name: "anchor", type: "select", label: "Anchor", options: ANCHORS.map((a) => ({ label: a, value: a })) },
    { name: "offsetX", type: "number", label: "Offset X", min: 0, step: 1 },
    { name: "offsetY", type: "number", label: "Offset Y", min: 0, step: 1 }
  ];
  return [
    placementField,
    {
      name: "positionMode",
      type: "select",
      label: "Position",
      options: [
        { label: "Anchor", value: "anchor" },
        { label: "Insets", value: "insets" }
      ]
    },
    ...position,
    {
      name: "orientation",
      type: "select",
      label: "Flow",
      options: [
        { label: "Auto", value: "auto" },
        { label: "Row", value: "horizontal" },
        { label: "Column", value: "vertical" }
      ]
    },
    { name: "stretch", type: "boolean", label: "Stretch along the edge", control: "checkbox" },
    SURFACE_FIELD,
    { name: "visible", type: "boolean", label: "Visible", control: "checkbox" }
  ];
}
var ITEM_TYPE_OPTIONS = [
  { label: "Button", value: "command" },
  { label: "Toggle", value: "toggle" },
  { label: "Picker", value: "choice" },
  { label: "Widget", value: "widget" },
  { label: "Text", value: "text" },
  { label: "Divider", value: "divider" },
  { label: "Slot (runtime)", value: "slot" }
];
function namesOptions(names, current, missing) {
  const options = names.map((n) => ({ label: n, value: n }));
  return current && !names.includes(current) ? [{ label: `${current} (${missing})`, value: current }, ...options] : options;
}
function iconField(name, label, icons, current) {
  const known = current && current !== NO_ICON ? namesOptions(icons, current, "not registered") : icons.map((n) => ({ label: n, value: n }));
  return { name, type: "select", label, options: [{ label: "(none)", value: NO_ICON }, ...known] };
}
function defaultHint(spec) {
  if (spec.default === void 0) return void 0;
  return Array.isArray(spec.default) ? spec.default.join(", ") : typeof spec.default === "object" ? JSON.stringify(spec.default) : String(spec.default);
}
function describedFields(described, prefix, values, choices, skipPick = false) {
  const refs = {
    layer: choices.layers ?? [],
    behaviour: choices.behaviours ?? [],
    layout: choices.layouts ?? []
  };
  const fields = [];
  for (const [key, spec] of Object.entries(described)) {
    if (spec.pick && skipPick) continue;
    const hint = defaultHint(spec);
    const base = {
      name: `${prefix}.${key}`,
      label: spec.label ?? key,
      ...spec.description ? { description: spec.description } : {}
    };
    const unset = { label: hint !== void 0 ? `(default: ${hint})` : "(not set)", value: ARG_DEFAULT };
    const current = values?.[key];
    const currentText = typeof current === "string" && current !== ARG_DEFAULT ? current : "";
    switch (spec.kind) {
      case "number":
        fields.push({ ...base, type: "number", ...hint !== void 0 ? { placeholder: hint } : {} });
        break;
      case "boolean":
        fields.push({ ...base, type: "select", options: [unset, { label: "Yes", value: "true" }, { label: "No", value: "false" }] });
        break;
      case "enum":
        fields.push({ ...base, type: "select", options: [unset, ...(spec.options ?? []).map((o) => ({ label: o.label, value: o.value }))] });
        break;
      case "layer":
      case "behaviour":
      case "layout":
        fields.push({ ...base, type: "select", options: [unset, ...namesOptions(refs[spec.kind] ?? [], currentText, "not registered")] });
        break;
      case "json":
        fields.push({ ...base, type: "textarea", rows: 2, colSpan: 2, ...hint !== void 0 ? { placeholder: hint } : {} });
        break;
      case "strings":
        fields.push({ ...base, type: "text", placeholder: hint ?? "a, b, c" });
        break;
      default:
        fields.push({ ...base, type: "text", ...hint !== void 0 ? { placeholder: hint } : {} });
    }
  }
  return fields;
}
function controlItemFields(row, choices) {
  const typeField = { name: "type", type: "select", label: "Kind", options: ITEM_TYPE_OPTIONS };
  const keyField = { name: "key", type: "text", label: "Key", placeholder: "optional" };
  const commandField = {
    name: "command",
    type: "select",
    label: "Command",
    options: namesOptions(choices.commands, row.command, "not registered")
  };
  const described = choices.commandArgs?.[row.command];
  const argsFields = [
    ...described ? describedFields(described, "args", row.args, choices, row.type === "choice") : [],
    {
      name: "argsJson",
      type: "textarea",
      label: described ? "More args (JSON)" : "Args (JSON)",
      rows: 2,
      colSpan: 2,
      placeholder: "{ }"
    }
  ];
  switch (row.type) {
    case "command":
      return [
        typeField,
        keyField,
        commandField,
        { name: "label", type: "text", label: "Label" },
        iconField("icon", "Icon", choices.icons, row.icon),
        { name: "text", type: "text", label: "Text", placeholder: "optional" },
        iconField("activeIcon", "Icon while active", choices.icons, row.activeIcon),
        { name: "activeLabel", type: "text", label: "Label while active" },
        { name: "activeText", type: "text", label: "Text while active" },
        ...argsFields
      ];
    case "toggle":
      return [
        typeField,
        keyField,
        commandField,
        { name: "label", type: "text", label: "Label" },
        iconField("icon", "Icon", choices.icons, row.icon),
        iconField("activeIcon", "Icon while on", choices.icons, row.activeIcon),
        { name: "activeLabel", type: "text", label: "Label while on" },
        ...argsFields
      ];
    case "choice":
      return [
        typeField,
        keyField,
        commandField,
        { name: "label", type: "text", label: "Label" },
        {
          name: "display",
          type: "select",
          label: "Display",
          options: [
            { label: "Dropdown", value: "dropdown" },
            { label: "Segmented", value: "segmented" }
          ]
        },
        ...argsFields
        // The static options are rows — `ChoiceOptionsField`, below these fields.
      ];
    case "widget": {
      const optionsSpec = choices.widgetOptions?.[row.widget];
      return [
        typeField,
        keyField,
        { name: "widget", type: "select", label: "Widget", options: namesOptions(choices.widgets, row.widget, "not registered") },
        ...optionsSpec ? describedFields(optionsSpec, "widgetOptions", row.widgetOptions, choices) : [],
        {
          name: "widgetOptionsJson",
          type: "textarea",
          label: optionsSpec ? "More options (JSON)" : "Options (JSON)",
          rows: 2,
          colSpan: 2,
          placeholder: "{ }"
        }
      ];
    }
    case "text":
      return [typeField, keyField, { name: "text", type: "text", label: "Text" }];
    case "divider":
      return [typeField, keyField];
    case "slot":
      return [keyField];
    default:
      return [typeField];
  }
}

// src/editor-panels/control-panels/mapping.ts
function emptyItemFields(type = "command") {
  return {
    type,
    key: "",
    command: "",
    args: {},
    argsJson: "",
    label: "",
    activeLabel: "",
    text: "",
    activeText: "",
    icon: NO_ICON,
    activeIcon: NO_ICON,
    display: "dropdown",
    choiceOptions: [],
    widget: "",
    widgetOptions: {},
    widgetOptionsJson: "",
    slot: ""
  };
}
var toJson = (v) => v === void 0 ? "" : JSON.stringify(v, null, 1);
var insetText = (v) => v === void 0 ? "" : String(v);
function argToForm(spec, value) {
  if (value === void 0) return spec.kind === "number" ? void 0 : SELECT_KINDS.has(spec.kind) ? ARG_DEFAULT : "";
  switch (spec.kind) {
    case "number":
      return typeof value === "number" ? value : Number(value);
    case "boolean":
      return value ? "true" : "false";
    case "strings":
      return Array.isArray(value) ? value.join(", ") : String(value);
    case "json":
      return JSON.stringify(value);
    default:
      return String(value);
  }
}
var SELECT_KINDS = /* @__PURE__ */ new Set(["enum", "boolean", "layer", "behaviour", "layout"]);
function describedToForm(bag, described) {
  if (!described) return { values: {}, json: toJson(bag) };
  const obj = bag && typeof bag === "object" && !Array.isArray(bag) ? bag : {};
  const values = {};
  for (const [key, spec] of Object.entries(described)) values[key] = argToForm(spec, obj[key]);
  const rest = Object.fromEntries(Object.entries(obj).filter(([k]) => !(k in described)));
  const json = bag !== void 0 && obj !== bag ? toJson(bag) : Object.keys(rest).length > 0 ? toJson(rest) : "";
  return { values, json };
}
function argsToForm(args, described) {
  const { values, json } = describedToForm(args, described);
  return { args: values, argsJson: json };
}
function choiceOptionsToForm(options) {
  return (options ?? []).map((o) => ({ value: o.value, label: o.label, icon: o.icon ?? NO_ICON }));
}
function itemToForm(item, descriptors, widgetDescriptors) {
  const row = { ...emptyItemFields(item.type), key: item.key ?? "" };
  switch (item.type) {
    case "command":
      return {
        ...row,
        command: item.command,
        ...argsToForm(item.args, descriptors?.[item.command]),
        label: item.label,
        text: item.text ?? "",
        icon: item.icon ?? NO_ICON,
        activeIcon: item.activeIcon ?? NO_ICON,
        activeLabel: item.activeLabel ?? "",
        activeText: item.activeText ?? ""
      };
    case "toggle":
      return {
        ...row,
        command: item.command,
        ...argsToForm(item.args, descriptors?.[item.command]),
        label: item.label,
        icon: item.icon ?? NO_ICON,
        activeIcon: item.activeIcon ?? NO_ICON,
        activeLabel: item.activeLabel ?? ""
      };
    case "choice":
      return {
        ...row,
        command: item.command,
        ...argsToForm(item.args, descriptors?.[item.command]),
        label: item.label,
        display: item.display ?? "dropdown",
        choiceOptions: choiceOptionsToForm(item.options)
      };
    case "widget": {
      const { values, json } = describedToForm(item.options, widgetDescriptors?.[item.widget]);
      return { ...row, widget: item.widget, widgetOptions: values, widgetOptionsJson: json };
    }
    case "text":
      return { ...row, text: item.text };
    case "slot":
      return { ...row, slot: item.slot };
    default:
      return row;
  }
}
function panelToForm(spec, descriptors, widgetDescriptors) {
  const position = spec.position ?? "top-left";
  const insets = typeof position === "string" ? {} : position;
  const offset = spec.offset ?? 8;
  const placement = spec.placement ?? "canvas";
  const panel = {
    placement,
    positionMode: typeof position === "string" ? "anchor" : "insets",
    anchor: typeof position === "string" ? position : "top-left",
    insetTop: insetText(insets.top),
    insetRight: insetText(insets.right),
    insetBottom: insetText(insets.bottom),
    insetLeft: insetText(insets.left),
    offsetX: typeof offset === "number" ? offset : offset.x,
    offsetY: typeof offset === "number" ? offset : offset.y,
    orientation: spec.orientation ?? "auto",
    stretch: spec.stretch ?? false,
    // The card surface is on by default over the canvas, off in the header.
    surface: spec.surface === "hairline" ? "hairline" : spec.surface ?? placement === "canvas" ? "card" : "none",
    visible: spec.visible ?? true
  };
  return { panel, items: spec.items.map((item) => itemToForm(item, descriptors, widgetDescriptors)) };
}
function parseJson(text2, where, errors) {
  const t = text2.trim();
  if (t === "") return void 0;
  try {
    return JSON.parse(t);
  } catch (e) {
    errors.push({ ...where, message: e instanceof Error ? e.message : "Invalid JSON" });
    return void 0;
  }
}
function insetValue(text2) {
  const t = text2.trim();
  if (t === "") return void 0;
  const n = Number(t);
  return Number.isFinite(n) ? n : t;
}
function argFromForm(spec, value, where, errors) {
  if (value === void 0 || value === ARG_DEFAULT) return void 0;
  if (typeof value === "number") return Number.isFinite(value) ? value : void 0;
  const t = value.trim();
  if (t === "") return void 0;
  switch (spec.kind) {
    case "number": {
      const n = Number(t);
      if (Number.isFinite(n)) return n;
      errors.push({ ...where, message: "Not a number" });
      return void 0;
    }
    case "boolean":
      return t === "true";
    case "strings":
      return t.split(",").map((x) => x.trim()).filter((x) => x !== "");
    case "json":
      return parseJson(t, where, errors);
    default:
      return t;
  }
}
function describedFromForm(values, json, described, names, index, errors) {
  const rest = parseJson(json, { item: index, field: names.jsonField }, errors);
  if (!described) return rest;
  const out = rest && typeof rest === "object" && !Array.isArray(rest) ? { ...rest } : {};
  for (const [key, spec] of Object.entries(described)) {
    const v = argFromForm(spec, values?.[key], { item: index, field: `${names.prefix}.${key}` }, errors);
    if (v !== void 0) out[key] = v;
  }
  return Object.keys(out).length > 0 ? out : void 0;
}
function choiceOptionsFromForm(rows) {
  const options = (rows ?? []).filter((r) => r.value.trim() !== "").map((r) => ({ value: r.value, label: r.label.trim() === "" ? r.value : r.label, ...icon(r.icon) ? { icon: r.icon } : {} }));
  return options.length > 0 ? options : void 0;
}
var icon = (v) => v && v !== NO_ICON ? v : void 0;
var opt = (v) => v.trim() === "" ? void 0 : v;
function formToItem(row, index, errors, descriptors, widgetDescriptors) {
  const key = opt(row.key);
  const base = key ? { key } : {};
  const args = () => describedFromForm(row.args, row.argsJson, descriptors?.[row.command], { prefix: "args", jsonField: "argsJson" }, index, errors);
  switch (row.type) {
    case "command": {
      const a = args();
      return {
        type: "command",
        ...base,
        command: row.command,
        ...a !== void 0 ? { args: a } : {},
        label: row.label,
        ...opt(row.text) ? { text: row.text } : {},
        ...icon(row.icon) ? { icon: row.icon } : {},
        ...icon(row.activeIcon) ? { activeIcon: row.activeIcon } : {},
        ...opt(row.activeLabel) ? { activeLabel: row.activeLabel } : {},
        ...opt(row.activeText) ? { activeText: row.activeText } : {}
      };
    }
    case "toggle": {
      const a = args();
      return {
        type: "toggle",
        ...base,
        command: row.command,
        ...a !== void 0 ? { args: a } : {},
        label: row.label,
        ...icon(row.icon) ? { icon: row.icon } : {},
        ...icon(row.activeIcon) ? { activeIcon: row.activeIcon } : {},
        ...opt(row.activeLabel) ? { activeLabel: row.activeLabel } : {}
      };
    }
    case "choice": {
      const a = args();
      const options = choiceOptionsFromForm(row.choiceOptions);
      return {
        type: "choice",
        ...base,
        command: row.command,
        ...a !== void 0 ? { args: a } : {},
        label: row.label,
        ...options !== void 0 ? { options } : {},
        ...row.display === "segmented" ? { display: "segmented" } : {}
      };
    }
    case "widget": {
      const options = describedFromForm(
        row.widgetOptions,
        row.widgetOptionsJson,
        widgetDescriptors?.[row.widget],
        { prefix: "widgetOptions", jsonField: "widgetOptionsJson" },
        index,
        errors
      );
      return {
        type: "widget",
        ...base,
        widget: row.widget,
        ...options !== void 0 ? { options } : {}
      };
    }
    case "text":
      return { type: "text", ...base, text: row.text };
    case "slot":
      return { type: "slot", ...base, slot: row.slot };
    case "divider":
    default:
      return { type: "divider", ...base };
  }
}
function formToPanel(state, descriptors, widgetDescriptors) {
  const errors = [];
  const p = state.panel;
  const position = p.positionMode === "insets" ? Object.fromEntries(
    ["top", "right", "bottom", "left"].map((side) => [side, insetValue(p[`inset${side[0].toUpperCase()}${side.slice(1)}`])]).filter(([, v]) => v !== void 0)
  ) : p.anchor;
  const ox = p.offsetX ?? 8;
  const oy = p.offsetY ?? 8;
  const items = state.items.map((row, i) => formToItem(row, i, errors, descriptors, widgetDescriptors));
  if (p.placement && p.placement !== "canvas") {
    return {
      spec: {
        kind: "control-panel",
        placement: p.placement,
        ...p.surface === "card" ? { surface: true } : p.surface === "hairline" ? { surface: "hairline" } : {},
        ...p.visible ? {} : { visible: false },
        items
      },
      errors
    };
  }
  const spec = {
    kind: "control-panel",
    position,
    ...p.positionMode === "anchor" && !(ox === 8 && oy === 8) ? { offset: ox === oy ? ox : { x: ox, y: oy } } : {},
    ...p.orientation !== "auto" ? { orientation: p.orientation } : {},
    ...p.stretch ? { stretch: true } : {},
    ...p.surface === "card" ? {} : { surface: p.surface === "hairline" ? "hairline" : false },
    ...p.visible ? {} : { visible: false },
    items
  };
  return { spec, errors };
}
function newPanelSpec() {
  return { kind: "control-panel", position: "top-left", items: [] };
}
function ChoiceOptionsField({
  index,
  control,
  icons
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: `items.${index}.choiceOptions` });
  const rows = useWatch({ control, name: `items.${index}.choiceOptions` });
  const c = control;
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1", children: [
    /* @__PURE__ */ jsx("span", { className: "text-sm font-medium", children: "Options" }),
    fields.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm italic text-muted-foreground", children: "None \u2014 the command\u2019s own options." }),
    fields.map((f, i) => /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-1", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
        FormField.ObjectField,
        {
          control: c,
          columns: 3,
          labelPosition: "top",
          name: `items.${index}.choiceOptions.${i}`,
          fields: [
            { name: "value", type: "text", label: "Value" },
            { name: "label", type: "text", label: "Label", placeholder: "the value" },
            iconField("icon", "Icon", icons, rows?.[i]?.icon ?? NO_ICON)
          ]
        }
      ) }),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-0.5 pt-5", children: [
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", disabled: i === 0, onClick: () => move(i, i - 1), "aria-label": "Move option up", children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4" }) }),
        /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => remove(i), "aria-label": "Remove option", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
      ] })
    ] }, f.id)),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => append({ value: "", label: "", icon: NO_ICON }), children: "+ Add option" }) })
  ] });
}
function ControlItemRow({
  index,
  count: count2,
  control,
  choices,
  onMove,
  onRemove
}) {
  const row = useWatch({ control, name: `items.${index}` });
  if (!row) return null;
  const c = control;
  return /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-1 flex-col gap-1", children: [
      row.type === "slot" && /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 text-sm text-muted-foreground", children: [
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: "slot" }),
        /* @__PURE__ */ jsxs("span", { children: [
          row.slot,
          " \u2014 runtime content from a ",
          "<ControlPanel>",
          "; kept as is"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        FormField.ObjectField,
        {
          control: c,
          columns: 2,
          labelPosition: "top",
          name: `items.${index}`,
          fields: controlItemFields(row, choices)
        }
      ),
      row.type === "choice" && /* @__PURE__ */ jsx(ChoiceOptionsField, { index, control, icons: choices.icons })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", disabled: index === 0, onClick: () => onMove(index, index - 1), "aria-label": "Move up", children: /* @__PURE__ */ jsx(ArrowUp, { className: "size-4" }) }),
      /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          disabled: index === count2 - 1,
          onClick: () => onMove(index, index + 1),
          "aria-label": "Move down",
          children: /* @__PURE__ */ jsx(ArrowDown, { className: "size-4" })
        }
      ),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onRemove(index), "aria-label": "Remove item", children: /* @__PURE__ */ jsx(X, { className: "size-4" }) })
    ] })
  ] });
}
function ControlItemsField({ control, choices }) {
  const { fields, append, remove, move } = useFieldArray({ control, name: "items" });
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: "Items" }),
    fields.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-sm italic text-muted-foreground", children: "No items yet." }),
    fields.map((f, i) => /* @__PURE__ */ jsx(
      ControlItemRow,
      {
        index: i,
        count: fields.length,
        control,
        choices,
        onMove: move,
        onRemove: remove
      },
      f.id
    )),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: () => append(emptyItemFields("command")), children: "+ Add item" }) })
  ] });
}
function nextPanelId(ids) {
  let n = ids.length + 1;
  while (ids.includes(`panel-${n}`)) n++;
  return `panel-${n}`;
}
function ControlPanelForm({
  spec,
  choices,
  presets,
  submitLabel,
  onApply
}) {
  const descriptors = choices.commandArgs;
  const widgetDescriptors = choices.widgetOptions;
  const form = useForm({ defaultValues: panelToForm(spec, descriptors, widgetDescriptors) });
  const { control, getValues, setValue, setError, clearErrors } = form;
  const positionMode = useWatch({ control, name: "panel.positionMode" });
  const placement = useWatch({ control, name: "panel.placement" });
  const lastPlacement = useRef(placement);
  useEffect(() => {
    const from = lastPlacement.current;
    lastPlacement.current = placement;
    if (from === "canvas" !== (placement === "canvas")) setValue("panel.surface", placement === "canvas" ? "card" : "none");
  }, [placement, setValue]);
  const [errors, setErrors] = useState([]);
  const presetForm = useForm({
    defaultValues: { pick: { preset: Object.keys(presets ?? {})[0] ?? "" } }
  });
  const presetFields = useMemo(
    () => [
      {
        name: "preset",
        type: "select",
        label: "Insert preset",
        options: Object.keys(presets ?? {}).map((k) => ({ label: k, value: k }))
      }
    ],
    [presets]
  );
  const insertPreset = () => {
    const items = presets?.[presetForm.getValues("pick.preset")];
    if (!items) return;
    setValue("items", [...getValues("items"), ...items.map((item) => itemToForm(item, descriptors, widgetDescriptors))], {
      shouldDirty: true
    });
  };
  const apply = () => {
    const { spec: next, errors: found } = formToPanel(getValues(), descriptors, widgetDescriptors);
    setErrors(found);
    clearErrors();
    for (const e of found) {
      const path = e.item === null ? `panel.${e.field}` : `items.${e.item}.${e.field}`;
      setError(path, { type: "validate", message: e.message });
    }
    if (found.length === 0) onApply(next);
  };
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 2, labelPosition: "top", name: "panel", fields: controlPanelFields(positionMode, placement) }),
    /* @__PURE__ */ jsx(ControlItemsField, { control, choices }),
    presets && Object.keys(presets).length > 0 && /* @__PURE__ */ jsxs("div", { className: "flex items-end gap-2", children: [
      /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
        FormField.ObjectField,
        {
          control: presetForm.control,
          columns: 1,
          labelPosition: "top",
          name: "pick",
          fields: presetFields
        }
      ) }),
      /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", size: "sm", onClick: insertPreset, children: "Insert" })
    ] }),
    errors.length > 0 && /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsx(AlertDescription, { children: errors.map((e) => /* @__PURE__ */ jsxs("div", { children: [
      e.item === null ? "Panel" : `Item ${e.item + 1}`,
      " \xB7 ",
      e.field,
      ": ",
      e.message
    ] }, `${e.item}-${e.field}`)) }) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { type: "button", onClick: apply, children: submitLabel }) })
  ] }) });
}
function ControlPanelsEditorPanel({
  panels,
  commands,
  icons,
  widgets,
  widgetOptions,
  commandArgs,
  layers,
  behaviours,
  layouts,
  presets,
  onSubmit,
  submitLabel = "Apply",
  className
}) {
  const ids = Object.keys(panels);
  const [picked, setPicked] = useState(null);
  const selected = picked !== null && picked in panels ? picked : ids[0] ?? null;
  const choices = useMemo(
    () => ({
      // `name#…` commands are private to one mounted component — not for saving.
      commands: commands.filter((n) => !n.includes("#")).sort(),
      icons: [...icons].sort(),
      widgets: [...widgets].sort(),
      ...widgetOptions ? { widgetOptions } : {},
      ...commandArgs ? { commandArgs } : {},
      ...layers ? { layers: [...layers].sort() } : {},
      ...behaviours ? { behaviours: [...behaviours].sort() } : {},
      ...layouts ? { layouts: [...layouts].sort() } : {}
    }),
    [commands, icons, widgets, widgetOptions, commandArgs, layers, behaviours, layouts]
  );
  const described = useMemo(() => Object.keys(commandArgs ?? {}).sort().join(","), [commandArgs]);
  const addPanel = () => {
    const id = nextPanelId(ids);
    onSubmit({ [id]: newPanelSpec() });
    setPicked(id);
  };
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-4 p-4", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
      ids.map((id) => /* @__PURE__ */ jsxs(
        Button,
        {
          type: "button",
          variant: "ghost",
          size: "sm",
          className: cn(id === selected && ACTIVE_CLASS),
          onClick: () => setPicked(id),
          children: [
            id,
            panels[id].visible === false && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "ml-1 px-1 py-0 text-[10px]", children: "hidden" })
          ]
        },
        id
      )),
      /* @__PURE__ */ jsxs(Button, { type: "button", variant: "outline", size: "sm", onClick: addPanel, children: [
        /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
        " New panel"
      ] })
    ] }),
    selected === null ? /* @__PURE__ */ jsx("p", { className: "text-base italic text-muted-foreground", children: "No control panels on this canvas." }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
        /* @__PURE__ */ jsx("span", { className: "text-base font-semibold", children: selected }),
        /* @__PURE__ */ jsxs(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => onSubmit({ [selected]: null }), "aria-label": "Remove panel", children: [
          /* @__PURE__ */ jsx(Trash2, { className: "size-4" }),
          " Remove"
        ] })
      ] }),
      /* @__PURE__ */ jsx(
        ControlPanelForm,
        {
          spec: panels[selected],
          choices,
          ...presets ? { presets } : {},
          submitLabel,
          onApply: (spec) => onSubmit({ [selected]: spec })
        },
        `${selected}:${described}:${JSON.stringify(panels[selected])}`
      )
    ] })
  ] });
}
var DEFAULT_CONTROL_PRESETS = {
  Zoom: ZOOM_CONTROL_ITEMS,
  "Zoom level": ZOOM_LEVEL_CONTROL_ITEMS,
  View: VIEW_CONTROL_ITEMS,
  Pan: PAN_CONTROL_ITEMS,
  "Pan pad": PAN_PAD_CONTROL_ITEMS,
  Navigation: NAVIGATION_CONTROL_ITEMS,
  Input: INPUT_CONTROL_ITEMS,
  Canvas: CANVAS_CONTROL_ITEMS,
  Explorer: EXPLORER_CONTROL_ITEMS,
  Modeller: MODELLER_CONTROL_ITEMS,
  Graph: GRAPH_CONTROL_ITEMS,
  History: HISTORY_CONTROL_ITEMS,
  Edit: EDIT_CONTROL_ITEMS,
  "Select mode": SELECT_MODE_CONTROL_ITEMS,
  "Edge type": EDGE_TYPE_CONTROL_ITEMS,
  Layout: LAYOUT_CONTROL_ITEMS,
  Grid: GRID_CONTROL_ITEMS,
  Theme: THEME_CONTROL_ITEMS
};
function useRegistryIds(canvas) {
  const subscribe = useCallback(
    (onChange) => {
      const offs = [
        canvas.events.on("scene:layer:add", onChange),
        canvas.events.on("scene:layer:remove", onChange),
        canvas.events.on("scene:behaviour:register", onChange),
        canvas.events.on("scene:behaviour:unregister", onChange),
        canvas.events.on("scene:layout:add", onChange),
        canvas.events.on("scene:layout:remove", onChange)
      ];
      return () => {
        for (const off of offs) off();
      };
    },
    [canvas]
  );
  const read = useCallback(
    () => [canvas.layers.list(), canvas.behaviours.list(), canvas.layouts.list()].map((list) => list.map((i) => i.id).join(",")).join("|"),
    [canvas]
  );
  const key = useSyncExternalStore(subscribe, read, read);
  return useMemo(() => {
    const [layers = "", behaviours = "", layouts = ""] = key.split("|");
    const split = (s) => s ? s.split(",") : [];
    return { layers: split(layers), behaviours: split(behaviours), layouts: split(layouts) };
  }, [key]);
}
function ControlPanelsEditor({ icons, widgets, presets = DEFAULT_CONTROL_PRESETS, canvas, className }) {
  const resolved = useResolvedCanvas(canvas);
  const panels = useControlPanels(resolved);
  const subscribe = useCallback((onChange) => resolved.commands.subscribe(onChange), [resolved]);
  const getNames = useCallback(() => resolved.commands.list().join("\n"), [resolved]);
  const names = useSyncExternalStore(subscribe, getNames, getNames);
  const commands = useMemo(() => names ? names.split("\n") : [], [names]);
  const commandArgs = useMemo(() => {
    const out = {};
    for (const name of commands) {
      const args = resolved.commands.get(name)?.args;
      if (args) out[name] = args;
    }
    return out;
  }, [resolved, commands]);
  const ids = useRegistryIds(resolved);
  const iconNames = useMemo(() => Object.keys({ ...DEFAULT_CONTROL_ICONS, ...icons }), [icons]);
  const widgetMap = useMemo(() => ({ ...DEFAULT_CONTROL_WIDGETS, ...widgets }), [widgets]);
  const widgetNames = useMemo(() => Object.keys(widgetMap), [widgetMap]);
  const widgetOptions = useMemo(() => controlWidgetOptionsSpecs(widgetMap), [widgetMap]);
  const apply = useCallback(
    (patch) => resolved.update({ controlPanels: patch }, "edit:control-panels"),
    [resolved]
  );
  return /* @__PURE__ */ jsx(
    ControlPanelsEditorPanel,
    {
      panels,
      commands,
      icons: iconNames,
      widgets: widgetNames,
      widgetOptions,
      commandArgs,
      layers: ids.layers,
      behaviours: ids.behaviours,
      layouts: ids.layouts,
      presets,
      onSubmit: apply,
      ...className ? { className } : {}
    }
  );
}

// src/shared/colors.ts
var COLOR_PRESETS = [
  { label: "Slate", value: "#9ca3af" },
  { label: "Red", value: "#ef4444" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Emerald", value: "#10b981" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Violet", value: "#8b5cf6" }
];

// src/editors/layers/background-layer/fields.ts
var sourceField = (name, label, role) => ({
  name,
  type: "select",
  label,
  row: name,
  options: [
    { value: "theme", label: "Theme" },
    { value: "custom", label: "Custom" }
  ],
  description: `Theme follows the palette's "${role}" role; Custom pins the colour you pick.`
});
var FILL_FIELDS = [
  {
    name: "type",
    type: "select",
    label: "Type",
    options: [
      { value: "solid", label: "Solid" },
      { value: "pattern", label: "Pattern" }
    ]
  },
  {
    name: "mode",
    type: "select",
    label: "Theme mode",
    description: "How light/dark colour variants resolve.",
    options: [
      { value: "auto", label: "Auto (follow theme)" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" }
    ]
  }
];
var BACKGROUND_COLOR_FIELD = {
  name: "backgroundColor",
  type: "color",
  label: "Background color",
  row: "backgroundColorSource",
  presetColors: [...COLOR_PRESETS],
  description: "Solid backdrop painted behind the pattern."
};
var PATTERN_COLOR_FIELD = {
  name: "color",
  type: "color",
  label: "Pattern color",
  row: "colorSource",
  presetColors: [...COLOR_PRESETS],
  description: "Dot / line / grid colour."
};
var PATTERN_FIELDS = [
  {
    name: "patternType",
    type: "select",
    label: "Pattern",
    options: [
      { value: "dots", label: "Dots" },
      { value: "grid", label: "Grid" },
      { value: "lines", label: "Lines" }
    ]
  },
  { name: "size", type: "number", label: "Size", min: 0, max: 20, step: 0.5, description: "Dot radius / line thickness, in texture pixels." },
  { name: "spacing", type: "number", label: "Spacing", min: 1, max: 100, step: 1, description: "Tile cell spacing, in texture pixels." },
  { name: "alpha", type: "number", label: "Alpha", min: 0, max: 1, step: 0.01 },
  {
    name: "followCamera",
    type: "boolean",
    label: "Follow camera",
    description: "Pattern shifts + scales with the camera when on."
  },
  {
    name: "hidePatternBelowZoom",
    type: "number",
    label: "Hide below zoom",
    min: 0,
    max: 2,
    step: 0.05,
    description: "Hide the pattern under this camera scale (0.5 = 50%). Set 0 to always show it."
  }
];
var THEME_FIELDS = [
  { name: "surfaceRole", type: "text", label: "Surface role", description: 'Palette role read for the backdrop on theme change. Default "surface".' },
  { name: "patternRole", type: "text", label: "Pattern role", description: 'Palette role read for the pattern on theme change. Default "divider".' }
];
var withGroup = (group) => (f) => ({ ...f, group });
function backgroundLayerFields(values = {}) {
  const fill = [
    ...FILL_FIELDS,
    sourceField("backgroundColorSource", "Background source", values.surfaceRole || "surface"),
    ...values.backgroundColorSource === "custom" ? [BACKGROUND_COLOR_FIELD] : []
  ];
  const pattern = [
    ...PATTERN_FIELDS,
    sourceField("colorSource", "Pattern source", values.patternRole || "divider"),
    ...values.colorSource === "custom" ? [PATTERN_COLOR_FIELD] : []
  ];
  return [
    ...fill.map(withGroup("Fill")),
    ...values.type === "pattern" ? pattern.map(withGroup("Pattern")) : [],
    ...THEME_FIELDS.map(withGroup("Theme"))
  ];
}

// src/shared/color.ts
function numberToHex(n) {
  if (n === void 0 || Number.isNaN(n)) return "#000000";
  const clamped = Math.max(0, Math.min(16777215, Math.floor(n)));
  return "#" + clamped.toString(16).padStart(6, "0");
}
function hexToNumber(hex2) {
  const stripped = hex2.startsWith("#") ? hex2.slice(1) : hex2;
  const parsed = Number.parseInt(stripped, 16);
  return Number.isNaN(parsed) ? 0 : parsed;
}

// src/editors/layers/background-layer/mapping.ts
var INHERIT = "inherit";
function colorToField(v) {
  if (v === INHERIT) return void 0;
  if (typeof v === "number") return numberToHex(v);
  if (typeof v === "string") return v;
  return void 0;
}
function colorToSource(v) {
  return v === void 0 || v === INHERIT ? "theme" : "custom";
}
function sourceToColor(source, color) {
  if (source === "theme") return INHERIT;
  if (source === "custom") return color || void 0;
  return color || void 0;
}
function optionsToForm(o = {}) {
  return {
    type: o.type,
    patternType: o.patternType,
    color: colorToField(o.color),
    colorSource: colorToSource(o.color),
    backgroundColor: colorToField(o.backgroundColor),
    backgroundColorSource: colorToSource(o.backgroundColor),
    size: o.size,
    spacing: o.spacing,
    alpha: o.alpha,
    followCamera: o.followCamera,
    hidePatternBelowZoom: o.hidePatternBelowZoom,
    mode: o.mode,
    surfaceRole: o.surfaceRole,
    patternRole: o.patternRole
  };
}
function formToOptions(f) {
  const out = {};
  if (f.type !== void 0) out.type = f.type;
  if (f.patternType !== void 0) out.patternType = f.patternType;
  const color = sourceToColor(f.colorSource, f.color);
  if (color) out.color = color;
  const backgroundColor = sourceToColor(f.backgroundColorSource, f.backgroundColor);
  if (backgroundColor) out.backgroundColor = backgroundColor;
  if (f.size !== void 0) out.size = f.size;
  if (f.spacing !== void 0) out.spacing = f.spacing;
  if (f.alpha !== void 0) out.alpha = f.alpha;
  if (f.followCamera !== void 0) out.followCamera = f.followCamera;
  if (f.hidePatternBelowZoom !== void 0) out.hidePatternBelowZoom = f.hidePatternBelowZoom;
  if (f.mode !== void 0) out.mode = f.mode;
  if (f.surfaceRole) out.surfaceRole = f.surfaceRole;
  if (f.patternRole) out.patternRole = f.patternRole;
  return out;
}

// src/editors/layers/dev-info-layer/fields.ts
var devInfoLayerFields = [
  {
    name: "corner",
    type: "select",
    label: "Corner",
    description: "Which corner the overlay anchors to.",
    options: [
      { label: "Top left", value: "top-left" },
      { label: "Top right", value: "top-right" },
      { label: "Bottom left", value: "bottom-left" },
      { label: "Bottom right", value: "bottom-right" }
    ]
  },
  {
    name: "marginX",
    type: "number",
    label: "Margin X",
    min: 0,
    step: 1,
    description: "Horizontal inset from the corner, in px. Default 10."
  },
  {
    name: "marginY",
    type: "number",
    label: "Margin Y",
    min: 0,
    step: 1,
    description: "Vertical inset from the corner, in px. Default 10."
  },
  {
    name: "fontSize",
    type: "number",
    label: "Font size",
    min: 6,
    max: 32,
    step: 1,
    description: "Overlay text size in px. Default 11."
  },
  {
    name: "opacity",
    type: "number",
    label: "Opacity",
    min: 0,
    max: 1,
    step: 0.01,
    description: "Panel opacity 0\u20131. Default 0.92."
  },
  {
    name: "backgroundColor",
    type: "text",
    label: "Background colour",
    description: "Overlay background CSS colour. Accepts rgba(). Default 'rgba(10,10,10,0.82)'."
  },
  {
    name: "textColor",
    type: "color",
    label: "Text colour",
    description: "Overlay text colour. Default '#c8d3e0'."
  },
  {
    name: "accentColor",
    type: "color",
    label: "Accent colour",
    description: "Header / accent colour. Default '#4fc3f7'."
  }
];

// src/editors/layers/dev-info-layer/mapping.ts
function optionsToForm2(o = {}) {
  const marginX = typeof o.margin === "number" ? o.margin : o.margin?.x;
  const marginY = typeof o.margin === "number" ? o.margin : o.margin?.y;
  return {
    corner: o.corner,
    marginX,
    marginY,
    fontSize: o.fontSize,
    opacity: o.opacity,
    backgroundColor: o.backgroundColor,
    textColor: o.textColor,
    accentColor: o.accentColor
  };
}
function formToOptions2(f) {
  const out = {};
  if (f.corner !== void 0) out.corner = f.corner;
  if (f.marginX !== void 0 || f.marginY !== void 0) {
    out.margin = f.marginX === f.marginY && f.marginX !== void 0 ? f.marginX : { x: f.marginX, y: f.marginY };
  }
  if (f.fontSize !== void 0) out.fontSize = f.fontSize;
  if (f.opacity !== void 0) out.opacity = f.opacity;
  if (f.backgroundColor !== void 0) out.backgroundColor = f.backgroundColor;
  if (f.textColor !== void 0) out.textColor = f.textColor;
  if (f.accentColor !== void 0) out.accentColor = f.accentColor;
  return out;
}

// src/editors/layers/minimap-layer/fields.ts
var LAYOUT_FIELDS = [
  { name: "width", type: "number", label: "Width", min: 0, step: 10, description: "Minimap width in screen px. Default 200." },
  { name: "height", type: "number", label: "Height", min: 0, step: 10, description: "Minimap height in screen px. Default 150." },
  {
    name: "position",
    type: "select",
    label: "Position",
    description: "Anchor corner inside the viewport.",
    options: [
      { value: "top-left", label: "Top-left" },
      { value: "top-right", label: "Top-right" },
      { value: "bottom-left", label: "Bottom-left" },
      { value: "bottom-right", label: "Bottom-right" }
    ]
  },
  { name: "margin", type: "number", label: "Margin", min: 0, step: 1, description: "Symmetric inset from the corner, in screen px. Default 10." },
  { name: "padding", type: "number", label: "Padding", min: 0, step: 1, description: "World-space padding around node bounds. Default 20." },
  { name: "enableDrag", type: "boolean", label: "Enable drag", description: "Dragging the minimap pans the main camera." },
  {
    name: "mode",
    type: "select",
    label: "Theme mode",
    description: "How light/dark colour variants resolve.",
    options: [
      { value: "auto", label: "Auto (follow theme)" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" }
    ]
  }
];
var CHROME_FIELDS = [
  { name: "backgroundColor", type: "color", label: "Background", presetColors: [...COLOR_PRESETS], description: "Backdrop fill. Default #1a1a2e." },
  { name: "borderColor", type: "color", label: "Border color", presetColors: [...COLOR_PRESETS], description: "Border stroke colour. Default #444444." },
  { name: "borderWidth", type: "number", label: "Border width", min: 0, step: 0.5 }
];
var VIEWPORT_FIELDS = [
  { name: "viewportFill", type: "color", label: "Viewport fill", presetColors: [...COLOR_PRESETS], description: "Viewport indicator fill. Default #4a90d9." },
  { name: "viewportStroke", type: "color", label: "Viewport stroke", presetColors: [...COLOR_PRESETS], description: "Viewport indicator stroke. Default #2a70b9." },
  { name: "viewportFillAlpha", type: "number", label: "Viewport fill alpha", min: 0, max: 1, step: 0.05 },
  { name: "viewportStrokeWidth", type: "number", label: "Viewport stroke width", min: 0, step: 0.5 }
];
var MASK_FIELDS = [
  { name: "maskEnabled", type: "boolean", label: "Enable mask", description: "Dim everything outside the viewport rectangle, spotlighting the visible region. Default on." },
  { name: "maskColor", type: "color", label: "Mask color", presetColors: [...COLOR_PRESETS], description: "Out-of-viewport overlay colour. Default #000000." },
  { name: "maskAlpha", type: "number", label: "Mask alpha", min: 0, max: 1, step: 0.05, description: "Out-of-viewport overlay alpha 0\u20131. Default 0.5." }
];
var withGroup2 = (group) => (f) => ({ ...f, group });
var miniMapLayerFields = [
  ...LAYOUT_FIELDS.map(withGroup2("Layout")),
  ...CHROME_FIELDS.map(withGroup2("Chrome")),
  ...VIEWPORT_FIELDS.map(withGroup2("Viewport")),
  ...MASK_FIELDS.map(withGroup2("Mask"))
];

// src/editors/layers/minimap-layer/mapping.ts
function colorToField2(v) {
  if (typeof v === "number") return numberToHex(v);
  return void 0;
}
function marginToField(v) {
  return typeof v === "number" ? v : void 0;
}
function optionsToForm3(o = {}) {
  return {
    width: o.width,
    height: o.height,
    backgroundColor: colorToField2(o.backgroundColor),
    borderColor: colorToField2(o.borderColor),
    borderWidth: o.borderWidth,
    viewportFill: colorToField2(o.viewportFill),
    viewportStroke: colorToField2(o.viewportStroke),
    viewportFillAlpha: o.viewportFillAlpha,
    viewportStrokeWidth: o.viewportStrokeWidth,
    // Mask is on by default (matches the engine's `MiniMapLayer` default), so an
    // unseeded editor shows it enabled rather than unchecked.
    maskEnabled: o.maskEnabled ?? true,
    maskColor: colorToField2(o.maskColor),
    maskAlpha: o.maskAlpha,
    padding: o.padding,
    enableDrag: o.enableDrag,
    position: o.position,
    mode: o.mode,
    margin: marginToField(o.margin)
  };
}
function formToOptions3(f) {
  const out = {};
  if (f.width !== void 0) out.width = f.width;
  if (f.height !== void 0) out.height = f.height;
  if (f.backgroundColor) out.backgroundColor = hexToNumber(f.backgroundColor);
  if (f.borderColor) out.borderColor = hexToNumber(f.borderColor);
  if (f.borderWidth !== void 0) out.borderWidth = f.borderWidth;
  if (f.viewportFill) out.viewportFill = hexToNumber(f.viewportFill);
  if (f.viewportStroke) out.viewportStroke = hexToNumber(f.viewportStroke);
  if (f.viewportFillAlpha !== void 0) out.viewportFillAlpha = f.viewportFillAlpha;
  if (f.viewportStrokeWidth !== void 0) out.viewportStrokeWidth = f.viewportStrokeWidth;
  if (f.maskEnabled !== void 0) out.maskEnabled = f.maskEnabled;
  if (f.maskColor) out.maskColor = hexToNumber(f.maskColor);
  if (f.maskAlpha !== void 0) out.maskAlpha = f.maskAlpha;
  if (f.padding !== void 0) out.padding = f.padding;
  if (f.enableDrag !== void 0) out.enableDrag = f.enableDrag;
  if (f.position !== void 0) out.position = f.position;
  if (f.mode !== void 0) out.mode = f.mode;
  if (f.margin !== void 0) out.margin = f.margin;
  return out;
}

// src/editors/layers/graph-legend-layer/fields.ts
var CONTENT_FIELDS = [
  { name: "title", type: "text", label: "Title", description: "Panel heading. Leave empty for none. Default 'Legend'." },
  { name: "showNodes", type: "boolean", label: "Show node types", description: "Include the node-type section." },
  { name: "showEdges", type: "boolean", label: "Show edge types", description: "Include the edge-type section." },
  { name: "nodesTitle", type: "text", label: "Node section title", description: "Heading above the node rows. Empty hides it. Default 'Nodes'." },
  { name: "edgesTitle", type: "text", label: "Edge section title", description: "Heading above the edge rows. Empty hides it. Default 'Edges'." },
  {
    name: "sort",
    type: "select",
    label: "Sort rows by",
    description: "Row ordering within each section.",
    options: [
      { value: "count-desc", label: "Count (most first)" },
      { value: "name-asc", label: "Name (A\u2013Z)" },
      { value: "insertion", label: "First appearance" }
    ]
  },
  { name: "maxRows", type: "number", label: "Max rows per section", min: 0, step: 1, description: 'Extra rows collapse into "+N more". 0 = no cap. Default 12.' },
  { name: "hideEmpty", type: "boolean", label: "Hide empty types", description: "Drop rows whose visible count is 0 (fully filtered out). Default off." }
];
var COUNT_FIELDS = [
  { name: "showCounts", type: "boolean", label: "Show counts", description: "Show how many of each type are in the canvas." },
  {
    name: "countMode",
    type: "select",
    label: "Count mode",
    description: "Which number(s) each row shows.",
    options: [
      { value: "both", label: "Visible / total" },
      { value: "visible", label: "Visible only" },
      { value: "total", label: "Total only" }
    ]
  }
];
var INTERACTION_FIELDS = [
  { name: "toggleOnClick", type: "boolean", label: "Toggle type on click", description: "Clicking a row hides/shows every element of that type; a toggled-off row renders struck through and muted. Default off." },
  { name: "hiddenTypeOpacity", type: "number", label: "Toggled-off opacity", min: 0.1, max: 1, step: 0.05, description: "Row opacity when its type is toggled off. Default 0.45." }
];
var LAYOUT_FIELDS2 = [
  {
    name: "position",
    type: "select",
    label: "Position",
    description: "Anchor corner inside the viewport.",
    options: [
      { value: "top-left", label: "Top-left" },
      { value: "top-right", label: "Top-right" },
      { value: "bottom-left", label: "Bottom-left" },
      { value: "bottom-right", label: "Bottom-right" }
    ]
  },
  { name: "marginX", type: "number", label: "Margin X", min: 0, step: 1, description: "Horizontal inset from the corner, in px. Default 10." },
  { name: "marginY", type: "number", label: "Margin Y", min: 0, step: 1, description: "Vertical inset from the corner, in px. Default 10." }
];
var CHROME_FIELDS2 = [
  { name: "fontSize", type: "number", label: "Font size", min: 6, max: 32, step: 1, description: "Row text size in px. Default 11." },
  { name: "swatchSize", type: "number", label: "Swatch size", min: 4, max: 32, step: 1, description: "Node swatch diameter in px; the edge line derives its length from it. Default 10." },
  { name: "opacity", type: "number", label: "Opacity", min: 0, max: 1, step: 0.01, description: "Panel opacity 0\u20131. Default 0.95." },
  { name: "borderRadius", type: "number", label: "Corner radius", min: 0, step: 1, description: "Panel corner radius in px. Default 6." },
  { name: "backgroundColor", type: "text", label: "Background colour", description: "Panel background CSS colour. Accepts rgba()." },
  { name: "textColor", type: "color", label: "Text colour", presetColors: [...COLOR_PRESETS], description: "Row text colour." },
  { name: "mutedColor", type: "color", label: "Muted colour", presetColors: [...COLOR_PRESETS], description: "Section headings and counts." },
  { name: "borderColor", type: "text", label: "Border colour", description: "Panel border CSS colour. Accepts rgba()." },
  { name: "fallbackColor", type: "color", label: "Fallback swatch", presetColors: [...COLOR_PRESETS], description: "Swatch colour for a type whose style resolves no colour. Default #9ca3af." },
  {
    name: "mode",
    type: "select",
    label: "Theme mode",
    description: "How light/dark colour variants resolve.",
    options: [
      { value: "auto", label: "Auto (follow theme)" },
      { value: "light", label: "Light" },
      { value: "dark", label: "Dark" }
    ]
  }
];
var withGroup3 = (group) => (f) => ({ ...f, group });
var graphLegendLayerFields = [
  ...CONTENT_FIELDS.map(withGroup3("Content")),
  ...COUNT_FIELDS.map(withGroup3("Counts")),
  ...INTERACTION_FIELDS.map(withGroup3("Interaction")),
  ...LAYOUT_FIELDS2.map(withGroup3("Layout")),
  ...CHROME_FIELDS2.map(withGroup3("Chrome"))
];

// src/editors/layers/graph-legend-layer/mapping.ts
function colorToField3(v) {
  return typeof v === "string" ? v : void 0;
}
function titleToField(v) {
  if (v === false) return "";
  return v;
}
function optionsToForm4(o = {}) {
  const marginX = typeof o.margin === "number" ? o.margin : o.margin?.x;
  const marginY = typeof o.margin === "number" ? o.margin : o.margin?.y;
  return {
    title: titleToField(o.title),
    showNodes: o.showNodes,
    showEdges: o.showEdges,
    nodesTitle: titleToField(o.nodesTitle),
    edgesTitle: titleToField(o.edgesTitle),
    showCounts: o.showCounts,
    countMode: o.countMode,
    sort: o.sort,
    maxRows: o.maxRows,
    hideEmpty: o.hideEmpty,
    fallbackColor: o.fallbackColor === void 0 ? void 0 : numberToHex(o.fallbackColor),
    toggleOnClick: o.toggleOnClick,
    hiddenTypeOpacity: o.hiddenTypeOpacity,
    position: o.position,
    marginX,
    marginY,
    fontSize: o.fontSize,
    opacity: o.opacity,
    swatchSize: o.swatchSize,
    backgroundColor: colorToField3(o.backgroundColor),
    textColor: colorToField3(o.textColor),
    mutedColor: colorToField3(o.mutedColor),
    borderColor: colorToField3(o.borderColor),
    borderRadius: o.borderRadius,
    mode: o.mode
  };
}
function formToOptions4(f) {
  const out = {};
  if (f.title !== void 0) out.title = f.title;
  if (f.showNodes !== void 0) out.showNodes = f.showNodes;
  if (f.showEdges !== void 0) out.showEdges = f.showEdges;
  if (f.nodesTitle !== void 0) out.nodesTitle = f.nodesTitle;
  if (f.edgesTitle !== void 0) out.edgesTitle = f.edgesTitle;
  if (f.showCounts !== void 0) out.showCounts = f.showCounts;
  if (f.countMode !== void 0) out.countMode = f.countMode;
  if (f.sort !== void 0) out.sort = f.sort;
  if (f.maxRows !== void 0) out.maxRows = f.maxRows;
  if (f.hideEmpty !== void 0) out.hideEmpty = f.hideEmpty;
  if (f.fallbackColor) out.fallbackColor = hexToNumber(f.fallbackColor);
  if (f.toggleOnClick !== void 0) out.toggleOnClick = f.toggleOnClick;
  if (f.hiddenTypeOpacity !== void 0) out.hiddenTypeOpacity = f.hiddenTypeOpacity;
  if (f.position !== void 0) out.position = f.position;
  if (f.marginX !== void 0 || f.marginY !== void 0) {
    out.margin = f.marginX === f.marginY && f.marginX !== void 0 ? f.marginX : { x: f.marginX, y: f.marginY };
  }
  if (f.fontSize !== void 0) out.fontSize = f.fontSize;
  if (f.opacity !== void 0) out.opacity = f.opacity;
  if (f.swatchSize !== void 0) out.swatchSize = f.swatchSize;
  if (f.backgroundColor) out.backgroundColor = f.backgroundColor;
  if (f.textColor) out.textColor = f.textColor;
  if (f.mutedColor) out.mutedColor = f.mutedColor;
  if (f.borderColor) out.borderColor = f.borderColor;
  if (f.borderRadius !== void 0) out.borderRadius = f.borderRadius;
  if (f.mode !== void 0) out.mode = f.mode;
  return out;
}

// src/editors/layers/density-contour-fill-layer/fields.ts
var PALETTE_OPTIONS = [
  { value: "blues", label: "Blues" },
  { value: "greens", label: "Greens" },
  { value: "oranges", label: "Oranges" },
  { value: "purples", label: "Purples" },
  { value: "reds", label: "Reds" },
  { value: "viridis", label: "Viridis" },
  { value: "plasma", label: "Plasma" },
  { value: "magma", label: "Magma" },
  { value: "inferno", label: "Inferno" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" }
];
var withGroup4 = (group) => (f) => ({ ...f, group });
var DENSITY_FIELDS = [
  { name: "bandwidth", type: "number", label: "Bandwidth", min: 1, max: 200, step: 1, description: "Kernel bandwidth in world units. Larger = smoother, broader blobs." },
  { name: "thresholds", type: "number", label: "Bands", min: 1, max: 60, step: 1, description: "Number of iso-bands d3-contour computes." },
  { name: "cellSize", type: "number", label: "Cell size", min: 1, max: 16, step: 1, description: "Grid cell size in world units. Must be a power of two (1, 2, 4, 8, 16)." },
  { name: "padding", type: "number", label: "Padding", min: 0, max: 200, step: 1, description: "Padding around the node bounding box before building the grid." }
];
var COLOR_FIELDS = [
  { name: "palette", type: "select", label: "Palette", options: PALETTE_OPTIONS, description: "Named colour ramp for the bands, low-density to high-density." },
  { name: "paletteRangeStart", type: "number", label: "Palette start", min: 0, max: 1, step: 0.01, description: "Ramp start fraction 0..1. Applied only when both start + end are set." },
  { name: "paletteRangeEnd", type: "number", label: "Palette end", min: 0, max: 1, step: 0.01, description: "Ramp end fraction 0..1. Applied only when both start + end are set." },
  { name: "fillOpacity", type: "number", label: "Fill opacity", min: 0, max: 1, step: 0.01, description: "Band fill alpha 0..1. Default 0.4." }
];
var LIFECYCLE_FIELDS = [
  {
    name: "recompute",
    type: "select",
    label: "Recompute",
    options: [
      { value: "auto", label: "Auto (debounced)" },
      { value: "manual", label: "Manual" }
    ],
    description: "How the overlay recomputes: on source changes (auto) or only on demand (manual)."
  },
  { name: "recomputeDebounceMs", type: "number", label: "Debounce (ms)", min: 0, max: 2e3, step: 10, description: "Debounce window for auto recomputes." }
];
var densityContourFillLayerFields = [
  ...DENSITY_FIELDS.map(withGroup4("Density")),
  ...COLOR_FIELDS.map(withGroup4("Colour")),
  ...LIFECYCLE_FIELDS.map(withGroup4("Lifecycle"))
];

// src/editors/layers/density-contour-fill-layer/mapping.ts
function optionsToForm5(o = {}) {
  return {
    bandwidth: o.bandwidth,
    thresholds: typeof o.thresholds === "number" ? o.thresholds : void 0,
    cellSize: o.cellSize,
    padding: o.padding,
    palette: o.palette,
    paletteRangeStart: o.paletteRangeStart,
    paletteRangeEnd: o.paletteRangeEnd,
    fillOpacity: o.fillOpacity,
    recompute: o.recompute,
    recomputeDebounceMs: o.recomputeDebounceMs
  };
}
function formToOptions5(f) {
  const out = {};
  if (f.bandwidth !== void 0) out.bandwidth = f.bandwidth;
  if (f.thresholds !== void 0) out.thresholds = f.thresholds;
  if (f.cellSize !== void 0) out.cellSize = f.cellSize;
  if (f.padding !== void 0) out.padding = f.padding;
  if (f.palette !== void 0) out.palette = f.palette;
  if (f.paletteRangeStart !== void 0) out.paletteRangeStart = f.paletteRangeStart;
  if (f.paletteRangeEnd !== void 0) out.paletteRangeEnd = f.paletteRangeEnd;
  if (f.fillOpacity !== void 0) out.fillOpacity = f.fillOpacity;
  if (f.recompute !== void 0) out.recompute = f.recompute;
  if (f.recomputeDebounceMs !== void 0) out.recomputeDebounceMs = f.recomputeDebounceMs;
  return out;
}

// src/editors/layers/density-contour-stroke-layer/fields.ts
var PALETTE_OPTIONS2 = [
  { value: "blues", label: "Blues" },
  { value: "greens", label: "Greens" },
  { value: "oranges", label: "Oranges" },
  { value: "purples", label: "Purples" },
  { value: "reds", label: "Reds" },
  { value: "viridis", label: "Viridis" },
  { value: "plasma", label: "Plasma" },
  { value: "magma", label: "Magma" },
  { value: "inferno", label: "Inferno" },
  { value: "warm", label: "Warm" },
  { value: "cool", label: "Cool" }
];
var withGroup5 = (group) => (f) => ({ ...f, group });
var DENSITY_FIELDS2 = [
  { name: "bandwidth", type: "number", label: "Bandwidth", min: 1, max: 200, step: 1, description: "Kernel bandwidth in world units. Larger = smoother, broader blobs." },
  { name: "thresholds", type: "number", label: "Bands", min: 1, max: 60, step: 1, description: "Number of iso-bands d3-contour computes." },
  { name: "cellSize", type: "number", label: "Cell size", min: 1, max: 16, step: 1, description: "Grid cell size in world units. Must be a power of two (1, 2, 4, 8, 16)." },
  { name: "padding", type: "number", label: "Padding", min: 0, max: 200, step: 1, description: "Padding around the node bounding box before building the grid." }
];
var strokeFields = (values) => [
  {
    name: "strokePalette",
    type: "boolean",
    label: "Palette stroke",
    description: "Colour each iso-line from the palette instead of a constant swatch."
  },
  ...values.strokePalette ? [
    { name: "palette", type: "select", label: "Palette", options: PALETTE_OPTIONS2, description: "Named colour ramp for the iso-lines, low-density to high-density." },
    { name: "paletteRangeStart", type: "number", label: "Palette start", min: 0, max: 1, step: 0.01, description: "Ramp start fraction 0..1. Applied only when both start + end are set." },
    { name: "paletteRangeEnd", type: "number", label: "Palette end", min: 0, max: 1, step: 0.01, description: "Ramp end fraction 0..1. Applied only when both start + end are set." }
  ] : [
    { name: "strokeColor", type: "color", label: "Stroke color", presetColors: [...COLOR_PRESETS], description: "Constant iso-line colour." }
  ],
  { name: "strokeWidth", type: "number", label: "Stroke width", min: 0, max: 10, step: 0.25, description: "Constant iso-line width in world units." }
];
var INDEX_FIELDS = [
  { name: "indexEvery", type: "number", label: "Index every", min: 1, max: 20, step: 1, description: 'Every Nth band is stroked as a heavy "index" contour.' },
  { name: "indexMajorWidth", type: "number", label: "Major width", min: 0, max: 10, step: 0.25, description: "Width of the index (major) contours." },
  { name: "indexMinorWidth", type: "number", label: "Minor width", min: 0, max: 10, step: 0.25, description: "Width of the in-between (minor) contours." }
];
var LIFECYCLE_FIELDS2 = [
  {
    name: "recompute",
    type: "select",
    label: "Recompute",
    options: [
      { value: "auto", label: "Auto (debounced)" },
      { value: "manual", label: "Manual" }
    ],
    description: "How the overlay recomputes: on source changes (auto) or only on demand (manual)."
  },
  { name: "recomputeDebounceMs", type: "number", label: "Debounce (ms)", min: 0, max: 2e3, step: 10, description: "Debounce window for auto recomputes." }
];
function densityContourStrokeLayerFields(values = {}) {
  return [
    ...DENSITY_FIELDS2.map(withGroup5("Density")),
    ...strokeFields(values).map(withGroup5("Stroke")),
    ...INDEX_FIELDS.map(withGroup5("Index contours")),
    ...LIFECYCLE_FIELDS2.map(withGroup5("Lifecycle"))
  ];
}

// src/editors/layers/density-contour-stroke-layer/mapping.ts
function optionsToForm6(o = {}) {
  return {
    bandwidth: o.bandwidth,
    thresholds: typeof o.thresholds === "number" ? o.thresholds : void 0,
    cellSize: o.cellSize,
    padding: o.padding,
    palette: o.palette,
    paletteRangeStart: o.paletteRangeStart,
    paletteRangeEnd: o.paletteRangeEnd,
    strokePalette: o.strokeColor !== void 0 ? o.strokeColor === "palette" : void 0,
    strokeColor: typeof o.strokeColor === "number" ? numberToHex(o.strokeColor) : void 0,
    strokeWidth: typeof o.strokeWidth === "number" ? o.strokeWidth : void 0,
    indexEvery: o.indexEvery,
    indexMajorWidth: o.indexMajorWidth,
    indexMinorWidth: o.indexMinorWidth,
    recompute: o.recompute,
    recomputeDebounceMs: o.recomputeDebounceMs
  };
}
function formToOptions6(f) {
  const out = {};
  if (f.bandwidth !== void 0) out.bandwidth = f.bandwidth;
  if (f.thresholds !== void 0) out.thresholds = f.thresholds;
  if (f.cellSize !== void 0) out.cellSize = f.cellSize;
  if (f.padding !== void 0) out.padding = f.padding;
  if (f.palette !== void 0) out.palette = f.palette;
  if (f.paletteRangeStart !== void 0) out.paletteRangeStart = f.paletteRangeStart;
  if (f.paletteRangeEnd !== void 0) out.paletteRangeEnd = f.paletteRangeEnd;
  if (f.strokePalette !== void 0) {
    if (f.strokePalette) out.strokeColor = "palette";
    else if (f.strokeColor) out.strokeColor = hexToNumber(f.strokeColor);
  } else if (f.strokeColor) {
    out.strokeColor = hexToNumber(f.strokeColor);
  }
  if (f.strokeWidth !== void 0) out.strokeWidth = f.strokeWidth;
  if (f.indexEvery !== void 0) out.indexEvery = f.indexEvery;
  if (f.indexMajorWidth !== void 0) out.indexMajorWidth = f.indexMajorWidth;
  if (f.indexMinorWidth !== void 0) out.indexMinorWidth = f.indexMinorWidth;
  if (f.recompute !== void 0) out.recompute = f.recompute;
  if (f.recomputeDebounceMs !== void 0) out.recomputeDebounceMs = f.recomputeDebounceMs;
  return out;
}

// src/editors/layers/bubble-sets-layer/fields.ts
var withGroup6 = (group) => (f) => ({ ...f, group });
var INFLUENCE_FIELDS = [
  { name: "nodeR0", type: "number", label: "Node radius (full)", min: 0, max: 200, step: 1, description: "Node-influence inner radius \u2014 full influence, world units." },
  { name: "nodeR1", type: "number", label: "Node radius (falloff)", min: 0, max: 400, step: 1, description: "Node-influence outer radius \u2014 zero influence, world units." },
  { name: "edgeR0", type: "number", label: "Edge radius (full)", min: 0, max: 200, step: 1, description: "Edge-influence inner radius, world units." },
  { name: "edgeR1", type: "number", label: "Edge radius (falloff)", min: 0, max: 400, step: 1, description: "Edge-influence outer radius, world units." },
  { name: "morphBuffer", type: "number", label: "Padding", min: 0, max: 100, step: 1, description: "Padding around the energy grid before sampling, world units." }
];
var styleFields = (values) => [
  {
    name: "smoothness",
    type: "select",
    label: "Smoothness",
    options: [
      { value: "chaikin", label: "Chaikin (organic)" },
      { value: "bspline", label: "B-spline (tight)" },
      { value: "none", label: "None (jagged)" }
    ],
    description: "Contour smoothing algorithm."
  },
  ...values.smoothness === "chaikin" ? [
    { name: "chaikinIterations", type: "number", label: "Chaikin iterations", min: 1, max: 8, step: 1, description: "Corner-cutting passes; each doubles the point count." }
  ] : [],
  { name: "styleFill", type: "color", label: "Fill color", presetColors: [...COLOR_PRESETS], description: "Default set fill colour." },
  { name: "styleFillOpacity", type: "number", label: "Fill opacity", min: 0, max: 1, step: 0.01, description: "Default set fill alpha 0..1." },
  { name: "styleStroke", type: "color", label: "Stroke color", presetColors: [...COLOR_PRESETS], description: "Default set stroke colour." },
  { name: "styleStrokeOpacity", type: "number", label: "Stroke opacity", min: 0, max: 1, step: 0.01, description: "Default set stroke alpha 0..1." },
  { name: "styleStrokeWidth", type: "number", label: "Stroke width", min: 0, max: 20, step: 0.5, description: "Default set stroke width in world units." }
];
var COMPUTE_FIELDS = [
  { name: "pixelGroup", type: "number", label: "Grid resolution", min: 1, max: 32, step: 1, description: "Grid cell size in square world units. Smaller = sharper, costlier." },
  { name: "maxRoutingIterations", type: "number", label: "Routing iterations", min: 1, max: 1e3, step: 1, description: "Max routing iterations to wrap obstacles." },
  { name: "maxMarchingIterations", type: "number", label: "Marching iterations", min: 1, max: 200, step: 1, description: "Max marching-squares refinement iterations." }
];
var LIFECYCLE_FIELDS3 = [
  {
    name: "recompute",
    type: "select",
    label: "Recompute",
    options: [
      { value: "auto", label: "Auto (debounced)" },
      { value: "manual", label: "Manual" }
    ],
    description: "How the overlay recomputes: on source changes (auto) or only on demand (manual)."
  },
  { name: "recomputeDebounceMs", type: "number", label: "Debounce (ms)", min: 0, max: 2e3, step: 10, description: "Debounce window for auto recomputes." }
];
function bubbleSetsLayerFields(values = {}) {
  return [
    ...INFLUENCE_FIELDS.map(withGroup6("Influence")),
    ...styleFields(values).map(withGroup6("Style")),
    ...COMPUTE_FIELDS.map(withGroup6("Compute")),
    ...LIFECYCLE_FIELDS3.map(withGroup6("Lifecycle"))
  ];
}

// src/editors/layers/bubble-sets-layer/mapping.ts
function optionsToForm7(o = {}) {
  const s = o.style ?? {};
  return {
    pixelGroup: o.pixelGroup,
    nodeR0: o.nodeR0,
    nodeR1: o.nodeR1,
    edgeR0: o.edgeR0,
    edgeR1: o.edgeR1,
    morphBuffer: o.morphBuffer,
    maxRoutingIterations: o.maxRoutingIterations,
    maxMarchingIterations: o.maxMarchingIterations,
    smoothness: o.smoothness,
    chaikinIterations: o.chaikinIterations,
    styleFill: typeof s.fill === "number" ? numberToHex(s.fill) : void 0,
    styleFillOpacity: s.fillOpacity,
    styleStroke: typeof s.stroke === "number" ? numberToHex(s.stroke) : void 0,
    styleStrokeOpacity: s.strokeOpacity,
    styleStrokeWidth: s.strokeWidth,
    recompute: o.recompute,
    recomputeDebounceMs: o.recomputeDebounceMs
  };
}
function formToOptions7(f) {
  const out = {};
  if (f.pixelGroup !== void 0) out.pixelGroup = f.pixelGroup;
  if (f.nodeR0 !== void 0) out.nodeR0 = f.nodeR0;
  if (f.nodeR1 !== void 0) out.nodeR1 = f.nodeR1;
  if (f.edgeR0 !== void 0) out.edgeR0 = f.edgeR0;
  if (f.edgeR1 !== void 0) out.edgeR1 = f.edgeR1;
  if (f.morphBuffer !== void 0) out.morphBuffer = f.morphBuffer;
  if (f.maxRoutingIterations !== void 0) out.maxRoutingIterations = f.maxRoutingIterations;
  if (f.maxMarchingIterations !== void 0) out.maxMarchingIterations = f.maxMarchingIterations;
  if (f.smoothness !== void 0) out.smoothness = f.smoothness;
  if (f.chaikinIterations !== void 0) out.chaikinIterations = f.chaikinIterations;
  if (f.recompute !== void 0) out.recompute = f.recompute;
  if (f.recomputeDebounceMs !== void 0) out.recomputeDebounceMs = f.recomputeDebounceMs;
  const style = {};
  if (f.styleFill) style.fill = hexToNumber(f.styleFill);
  if (f.styleFillOpacity !== void 0) style.fillOpacity = f.styleFillOpacity;
  if (f.styleStroke) style.stroke = hexToNumber(f.styleStroke);
  if (f.styleStrokeOpacity !== void 0) style.strokeOpacity = f.styleStrokeOpacity;
  if (f.styleStrokeWidth !== void 0) style.strokeWidth = f.styleStrokeWidth;
  if (Object.keys(style).length > 0) out.style = style;
  return out;
}

// src/editors/layers/map-layer/fields.ts
var withGroup7 = (group) => (f) => ({ ...f, group });
var BASEMAP_FIELDS = [
  { name: "styleUrl", type: "text", label: "Style URL", description: 'MapLibre style URL. Defaults to the OpenFreeMap "liberty" style.' }
];
var VIEW_FIELDS = [
  { name: "centerLng", type: "number", label: "Center longitude", min: -180, max: 180, step: 1e-4, description: "Initial centre longitude in degrees." },
  { name: "centerLat", type: "number", label: "Center latitude", min: -90, max: 90, step: 1e-4, description: "Initial centre latitude in degrees." },
  { name: "zoom", type: "number", label: "Zoom", min: 0, max: 22, step: 0.1, description: "Initial MapLibre zoom level (0..22)." },
  { name: "minZoom", type: "number", label: "Min zoom", min: 0, max: 22, step: 0.1, description: "Minimum allowed MapLibre zoom." },
  { name: "maxZoom", type: "number", label: "Max zoom", min: 0, max: 22, step: 0.1, description: "Maximum allowed MapLibre zoom." }
];
var INPUT_FIELDS = [
  {
    name: "passInputToMap",
    type: "boolean",
    label: "Pass input to map",
    description: "Pixi canvas is pointer-transparent so MapLibre receives pan / zoom / click. Default on."
  }
];
var mapLayerFields = [
  ...BASEMAP_FIELDS.map(withGroup7("Basemap")),
  ...VIEW_FIELDS.map(withGroup7("View")),
  ...INPUT_FIELDS.map(withGroup7("Input"))
];

// src/editors/layers/map-layer/mapping.ts
function optionsToForm8(o = {}) {
  return {
    styleUrl: o.styleUrl,
    centerLng: o.center?.[0],
    centerLat: o.center?.[1],
    zoom: o.zoom,
    minZoom: o.minZoom,
    maxZoom: o.maxZoom,
    passInputToMap: o.passInputToMap
  };
}
function formToOptions8(f) {
  const out = {};
  if (f.styleUrl) out.styleUrl = f.styleUrl;
  if (f.centerLng !== void 0 && f.centerLat !== void 0) {
    out.center = [f.centerLng, f.centerLat];
  }
  if (f.zoom !== void 0) out.zoom = f.zoom;
  if (f.minZoom !== void 0) out.minZoom = f.minZoom;
  if (f.maxZoom !== void 0) out.maxZoom = f.maxZoom;
  if (f.passInputToMap !== void 0) out.passInputToMap = f.passInputToMap;
  return out;
}

// src/editors/behaviours/drag-pan/fields.ts
var dragPanFields = [
  {
    name: "modifier",
    type: "select",
    label: "Modifier key",
    description: "Which key must be held to pan. `none` = any left-drag pans.",
    options: [
      { label: "None", value: "none" },
      { label: "Space", value: "space" },
      { label: "Shift", value: "shift" },
      { label: "Alt / Option", value: "alt" }
    ]
  },
  {
    name: "mouseButtons",
    type: "select",
    label: "Mouse buttons",
    description: "Which mouse buttons trigger a pan drag.",
    options: [
      { label: "All", value: "all" },
      { label: "Left", value: "left" },
      { label: "Right", value: "right" },
      { label: "Middle", value: "middle" }
    ]
  },
  {
    name: "decelerate",
    type: "boolean",
    label: "Decelerate",
    description: "Add momentum glide after the pointer lifts."
  },
  {
    name: "dragCursor",
    type: "text",
    label: "Drag cursor",
    description: "CSS cursor shown while panning. Default 'grabbing'."
  }
];

// src/editors/behaviours/drag-pan/mapping.ts
function optionsToForm9(o = {}) {
  return {
    modifier: o.modifier,
    mouseButtons: o.mouseButtons,
    decelerate: o.decelerate,
    dragCursor: o.dragCursor
  };
}
function formToOptions9(f) {
  const out = {};
  if (f.modifier !== void 0) out.modifier = f.modifier;
  if (f.mouseButtons !== void 0) out.mouseButtons = f.mouseButtons;
  if (f.decelerate !== void 0) out.decelerate = f.decelerate;
  if (f.dragCursor !== void 0) out.dragCursor = f.dragCursor;
  return out;
}

// src/editors/behaviours/pinch-zoom/fields.ts
var pinchZoomFields = [
  {
    name: "noDrag",
    type: "boolean",
    label: "No drag",
    description: "Pinch only zooms; suppress the implicit two-finger pan."
  },
  {
    name: "percent",
    type: "number",
    label: "Zoom speed",
    min: 0,
    max: 1,
    step: 0.01,
    description: "Zoom speed multiplier. Default 0.1 (10%)."
  }
];

// src/editors/behaviours/pinch-zoom/mapping.ts
function optionsToForm10(o = {}) {
  return {
    noDrag: o.noDrag,
    percent: o.percent
  };
}
function formToOptions10(f) {
  const out = {};
  if (f.noDrag !== void 0) out.noDrag = f.noDrag;
  if (f.percent !== void 0) out.percent = f.percent;
  return out;
}

// src/editors/behaviours/keyboard-camera/fields.ts
var keyboardCameraFields = [
  {
    name: "panStep",
    type: "number",
    label: "Pan step",
    min: 1,
    step: 1,
    description: "Pan distance per key press, in screen pixels. Default 40."
  },
  {
    name: "zoomFactor",
    type: "number",
    label: "Zoom factor",
    min: 1,
    step: 0.05,
    description: "Zoom multiplier per key press. 1.1 = 10% in/out. Default 1.1."
  }
];

// src/editors/behaviours/keyboard-camera/mapping.ts
function optionsToForm11(o = {}) {
  return {
    panStep: o.panStep,
    zoomFactor: o.zoomFactor
  };
}
function formToOptions11(f) {
  const out = {};
  if (f.panStep !== void 0) out.panStep = f.panStep;
  if (f.zoomFactor !== void 0) out.zoomFactor = f.zoomFactor;
  return out;
}

// src/editors/behaviours/keyboard-shortcuts/fields.ts
var keyboardShortcutsFields = [
  {
    name: "scope",
    type: "select",
    label: "Scope",
    options: [
      { label: "This canvas", value: "canvas" },
      { label: "Whole page", value: "document" }
    ],
    description: "This canvas: keys count after a click inside its app. Whole page: every key on the page."
  },
  {
    name: "bindingsText",
    type: "textarea",
    label: "Bindings",
    rows: 8,
    placeholder: 'mod+z \u2192 history.undo\nescape \u2192 tool.active {"value":"select"}',
    description: 'One per line: keys \u2192 command, then optional JSON args. mod = \u2318 on macOS, Ctrl elsewhere; "," separates alternative keys. Lines starting with # are ignored.'
  }
];

// src/editors/behaviours/keyboard-shortcuts/mapping.ts
var ARROW = "\u2192";
var ARROW_PATTERN = /\s*(?:→|->|=>)\s*/;
function bindingToLine(b) {
  const args = b.args === void 0 ? "" : ` ${JSON.stringify(b.args)}`;
  return `${b.keys} ${ARROW} ${b.command}${args}`;
}
function lineToBinding(line) {
  const t = line.trim();
  if (t === "" || t.startsWith("#")) return null;
  const parts = t.split(ARROW_PATTERN);
  if (parts.length < 2) return null;
  const keys = parts[0].trim();
  const rhs = parts.slice(1).join(" ").trim();
  const space = rhs.search(/\s/);
  const command = space < 0 ? rhs : rhs.slice(0, space);
  const argsText = space < 0 ? "" : rhs.slice(space).trim();
  if (!keys || !command) return null;
  if (argsText === "") return { keys, command };
  try {
    return { keys, command, args: JSON.parse(argsText) };
  } catch {
    return null;
  }
}
function optionsToForm12(o = {}) {
  return {
    scope: o.scope ?? "canvas",
    bindingsText: (o.bindings ?? []).map(bindingToLine).join("\n")
  };
}
function formToOptions12(f) {
  const out = {};
  if (f.scope !== void 0) out.scope = f.scope;
  if (f.bindingsText !== void 0) {
    out.bindings = f.bindingsText.split("\n").map(lineToBinding).filter((b) => b !== null);
  }
  return out;
}
function invalidBindingLines(text2) {
  const bad = [];
  text2.split("\n").forEach((line, i) => {
    const t = line.trim();
    if (t !== "" && !t.startsWith("#") && lineToBinding(line) === null) bad.push(i + 1);
  });
  return bad;
}

// src/editors/behaviours/wheel-zoom/fields.ts
function wheelZoomFields(values = {}) {
  return [
    {
      name: "requireCtrl",
      type: "boolean",
      label: "Require Ctrl",
      description: "Only Ctrl+scroll zooms; plain scroll falls through to the page."
    },
    {
      name: "percent",
      type: "number",
      label: "Zoom speed",
      min: 0,
      max: 1,
      step: 0.01,
      description: "Zoom fraction per wheel tick. Default 0.1 (10%)."
    },
    {
      name: "smooth",
      type: "boolean",
      label: "Smooth scroll",
      description: "Ease-out zoom instead of an instant snap."
    },
    ...values.smooth ? [
      {
        name: "smoothFrames",
        type: "number",
        label: "Ease frames",
        min: 1,
        max: 60,
        step: 1,
        description: "Frame count for the ease-out. Higher = slower glide."
      }
    ] : []
  ];
}

// src/editors/behaviours/wheel-zoom/mapping.ts
function optionsToForm13(o = {}) {
  return {
    requireCtrl: o.requireCtrl,
    percent: o.percent,
    smooth: o.smooth !== void 0 ? o.smooth !== false : void 0,
    smoothFrames: typeof o.smooth === "number" ? o.smooth : void 0
  };
}
function formToOptions13(f) {
  const out = {};
  if (f.requireCtrl !== void 0) out.requireCtrl = f.requireCtrl;
  if (f.percent !== void 0) out.percent = f.percent;
  if (f.smooth !== void 0) out.smooth = f.smooth ? f.smoothFrames ?? 8 : false;
  return out;
}

// src/editors/behaviours/drag-shape/fields.ts
var dragShapeFields = [
  {
    name: "reRouteConnectors",
    type: "boolean",
    label: "Re-route connectors",
    description: "Recompute every connector after each move. Needed for obstacle-aware routers."
  },
  {
    name: "dragCursor",
    type: "text",
    label: "Drag cursor",
    description: "CSS cursor shown while dragging a shape. Default 'grabbing'."
  }
];

// src/editors/behaviours/drag-shape/mapping.ts
function optionsToForm14(o = {}) {
  return {
    reRouteConnectors: o.reRouteConnectors,
    dragCursor: o.dragCursor
  };
}
function formToOptions14(f) {
  const out = {};
  if (f.reRouteConnectors !== void 0) out.reRouteConnectors = f.reRouteConnectors;
  if (f.dragCursor !== void 0) out.dragCursor = f.dragCursor;
  return out;
}

// src/editors/behaviours/drag-node/fields.ts
var dragNodeFields = [
  {
    name: "dragCursor",
    type: "text",
    label: "Drag cursor",
    description: 'CSS cursor applied to the canvas while dragging. Default "grabbing".'
  },
  {
    name: "groupAware",
    type: "boolean",
    label: "Group aware",
    description: "Dragging an expanded group node translates its whole subtree together."
  },
  {
    name: "pinOnRelease",
    type: "boolean",
    label: "Pin on release",
    description: "Pin dragged nodes on drop so layouts keep them where the user placed them."
  },
  {
    name: "dragSelection",
    type: "boolean",
    label: "Drag selection",
    description: "Grabbing a selected node drags the whole selection together."
  },
  {
    name: "selectionState",
    type: "text",
    label: "Selection state",
    description: 'Layer visual-state name that marks a node as selected. Default "selected".'
  },
  {
    name: "selectionBodyDrag",
    type: "boolean",
    label: "Selection body drag",
    description: "Let a press in the empty space inside the selection box grab the whole set."
  },
  {
    name: "selectionBodyPadding",
    type: "number",
    label: "Selection body padding",
    min: 0,
    step: 1,
    description: "Extra world-space padding around the selection box for body-drag hit-testing."
  }
];

// src/editors/behaviours/drag-node/mapping.ts
function optionsToForm15(o = {}) {
  return {
    dragCursor: o.dragCursor,
    groupAware: o.groupAware,
    pinOnRelease: o.pinOnRelease,
    dragSelection: o.dragSelection,
    selectionState: o.selectionState,
    selectionBodyDrag: o.selectionBodyDrag,
    selectionBodyPadding: o.selectionBodyPadding
  };
}
function formToOptions15(f) {
  const out = {};
  if (f.dragCursor !== void 0) out.dragCursor = f.dragCursor;
  if (f.groupAware !== void 0) out.groupAware = f.groupAware;
  if (f.pinOnRelease !== void 0) out.pinOnRelease = f.pinOnRelease;
  if (f.dragSelection !== void 0) out.dragSelection = f.dragSelection;
  if (f.selectionState !== void 0) out.selectionState = f.selectionState;
  if (f.selectionBodyDrag !== void 0) out.selectionBodyDrag = f.selectionBodyDrag;
  if (f.selectionBodyPadding !== void 0) out.selectionBodyPadding = f.selectionBodyPadding;
  return out;
}

// src/editors/behaviours/hover-activate/fields.ts
var hoverActivateFields = [
  {
    name: "hoverEdges",
    type: "boolean",
    label: "Hover edges",
    description: "Whether hovering directly over an edge activates it. Off = nodes only (a hovered node\u2019s connecting edges still light up via degree)."
  },
  {
    name: "excludeNodeTypes",
    type: "text",
    label: "Exclude node types",
    description: "Comma-separated node types that never become the focal hover \u2014 scenery such as group frames. Neighbour highlighting is unaffected."
  },
  {
    name: "excludeGroups",
    type: "select",
    label: "Exclude groups",
    description: 'Which group frames never become the focal hover, by what they are rather than by type. "Expanded" (the default) makes an open frame scenery and leaves a collapsed one interactive.',
    options: [
      { value: "expanded", label: "Expanded frames" },
      { value: "always", label: "Every frame" },
      { value: "never", label: "Never \u2014 frames hover" }
    ]
  },
  {
    name: "excludeEdgeTypes",
    type: "text",
    label: "Exclude edge types",
    description: 'Comma-separated edge types that never become the focal hover. Only bites when "Hover edges" is on.'
  },
  {
    name: "state",
    type: "text",
    label: "Active state",
    description: 'State name applied to the hovered element (and neighbours). Default "hovered".'
  },
  {
    name: "inactiveState",
    type: "text",
    label: "Inactive state",
    description: 'State applied to everything NOT in the active set (e.g. "dimmed"). Blank to skip.'
  },
  {
    name: "raiseActive",
    type: "boolean",
    label: "Raise active",
    description: "Lift the hovered set above its peers so unrelated data does not paint over it."
  },
  {
    name: "degree",
    type: "number",
    label: "Neighbour degree",
    min: 0,
    max: 6,
    step: 1,
    description: "N-hop neighbour radius. 0 = hovered element only; 1 = direct neighbours; N = N-hop."
  },
  {
    name: "direction",
    type: "select",
    label: "Direction",
    options: [
      { label: "Both", value: "both" },
      { label: "In", value: "in" },
      { label: "Out", value: "out" }
    ],
    description: "Edge-traversal direction used when expanding neighbours."
  },
  {
    name: "zoomThreshold",
    type: "number",
    label: "Zoom threshold",
    min: 0,
    step: 0.01,
    description: "Camera scale at/below which the zoomed-out states + scale kick in. Blank disables."
  },
  {
    name: "zoomedOutState",
    type: "text",
    label: "Zoomed-out node state",
    description: "State applied to hovered nodes below the zoom threshold. Falls back to Active state."
  },
  {
    name: "zoomedOutEdgeState",
    type: "text",
    label: "Zoomed-out edge state",
    description: "State applied to connecting edges below the zoom threshold. Falls back to Active state."
  },
  {
    name: "zoomedOutScale",
    type: "number",
    label: "Zoomed-out scale",
    min: 1,
    step: 0.1,
    description: "Gfx-transform multiplier grown on hovered nodes below the threshold. 1 disables."
  }
];

// src/editors/behaviours/hover-activate/mapping.ts
function parseTypeList(text2) {
  if (text2 === void 0) return void 0;
  const parsed = text2.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  return [...new Set(parsed)];
}
function optionsToForm16(o = {}) {
  return {
    hoverEdges: o.hoverEdges,
    excludeNodeTypes: o.excludeNodeTypes?.join(", "),
    excludeGroups: o.excludeGroups,
    excludeEdgeTypes: o.excludeEdgeTypes?.join(", "),
    state: o.state,
    inactiveState: o.inactiveState,
    raiseActive: o.raiseActive,
    degree: o.degree,
    direction: o.direction,
    zoomThreshold: o.zoomThreshold,
    zoomedOutState: o.zoomedOutState,
    zoomedOutEdgeState: o.zoomedOutEdgeState,
    zoomedOutScale: o.zoomedOutScale
  };
}
function formToOptions16(f) {
  const out = {};
  if (f.hoverEdges !== void 0) out.hoverEdges = f.hoverEdges;
  const excludeNodeTypes = parseTypeList(f.excludeNodeTypes);
  if (excludeNodeTypes !== void 0) out.excludeNodeTypes = excludeNodeTypes;
  if (f.excludeGroups !== void 0) out.excludeGroups = f.excludeGroups;
  const excludeEdgeTypes = parseTypeList(f.excludeEdgeTypes);
  if (excludeEdgeTypes !== void 0) out.excludeEdgeTypes = excludeEdgeTypes;
  if (f.state !== void 0) out.state = f.state;
  if (f.inactiveState !== void 0) out.inactiveState = f.inactiveState;
  if (f.raiseActive !== void 0) out.raiseActive = f.raiseActive;
  if (f.degree !== void 0) out.degree = f.degree;
  if (f.direction !== void 0) out.direction = f.direction;
  if (f.zoomThreshold !== void 0) out.zoomThreshold = f.zoomThreshold;
  if (f.zoomedOutState !== void 0) out.zoomedOutState = f.zoomedOutState;
  if (f.zoomedOutEdgeState !== void 0) out.zoomedOutEdgeState = f.zoomedOutEdgeState;
  if (f.zoomedOutScale !== void 0) out.zoomedOutScale = f.zoomedOutScale;
  return out;
}

// src/editors/behaviours/click-select/fields.ts
var clickSelectFields = [
  {
    name: "excludeNodeTypes",
    type: "text",
    label: "Exclude node types",
    description: "Comma-separated node types a click can never select \u2014 scenery such as group frames. A click on one leaves the selection untouched."
  },
  {
    name: "excludeGroups",
    type: "select",
    label: "Exclude groups",
    description: 'Which group frames a click can never select, by what they are rather than by type. "Expanded" (the default) makes an open frame scenery and leaves a collapsed one selectable.',
    options: [
      { value: "expanded", label: "Expanded frames" },
      { value: "always", label: "Every frame" },
      { value: "never", label: "Never \u2014 frames select" }
    ]
  },
  {
    name: "excludeEdgeTypes",
    type: "text",
    label: "Exclude edge types",
    description: "Comma-separated edge types a click can never select."
  },
  {
    name: "multiple",
    type: "boolean",
    label: "Multi-select",
    description: "A qualifying click toggles membership instead of replacing the selection."
  },
  {
    name: "trigger",
    type: "select",
    label: "Modifier gate",
    description: 'Modifier required for a click to affect the selection. "None" = every click selects.',
    options: [
      { value: "none", label: "None" },
      { value: "shift", label: "Shift" },
      { value: "control", label: "Control" },
      { value: "alt", label: "Alt" },
      { value: "meta", label: "Meta" }
    ]
  },
  {
    name: "degree",
    type: "number",
    label: "Neighbour degree",
    min: 0,
    max: 10,
    step: 1,
    description: "N-hop neighbour radius around each clicked seed. 0 = clicked element only."
  },
  {
    name: "direction",
    type: "select",
    label: "Direction",
    description: "Edge-traversal direction for neighbour expansion.",
    options: [
      { value: "both", label: "Both" },
      { value: "in", label: "Incoming" },
      { value: "out", label: "Outgoing" }
    ]
  },
  {
    name: "state",
    type: "text",
    label: "Active state",
    description: 'State name applied to selected elements. Default "selected".'
  },
  {
    name: "unselectedState",
    type: "text",
    label: "Unselected state",
    description: "State applied to every non-selected element (dimming). Empty = no dimming."
  },
  {
    name: "raiseActive",
    type: "boolean",
    label: "Raise active",
    description: "Lift the selected set above its peers so nothing paints over it."
  },
  {
    name: "clearOnBackground",
    type: "boolean",
    label: "Clear on background",
    description: "Clear the selection when clicking the empty canvas background."
  }
];

// src/editors/behaviours/click-select/mapping.ts
function parseTypeList2(text2) {
  if (text2 === void 0) return void 0;
  const parsed = text2.split(",").map((s) => s.trim()).filter((s) => s.length > 0);
  return [...new Set(parsed)];
}
function optionsToForm17(o = {}) {
  return {
    excludeNodeTypes: o.excludeNodeTypes?.join(", "),
    excludeGroups: o.excludeGroups,
    excludeEdgeTypes: o.excludeEdgeTypes?.join(", "),
    multiple: o.multiple,
    trigger: o.trigger === void 0 ? void 0 : o.trigger[0] ?? "none",
    degree: o.degree,
    direction: o.direction,
    state: o.state,
    unselectedState: o.unselectedState,
    raiseActive: o.raiseActive,
    clearOnBackground: o.clearOnBackground
  };
}
function formToOptions17(f) {
  const out = {};
  const excludeNodeTypes = parseTypeList2(f.excludeNodeTypes);
  if (excludeNodeTypes !== void 0) out.excludeNodeTypes = excludeNodeTypes;
  if (f.excludeGroups !== void 0) out.excludeGroups = f.excludeGroups;
  const excludeEdgeTypes = parseTypeList2(f.excludeEdgeTypes);
  if (excludeEdgeTypes !== void 0) out.excludeEdgeTypes = excludeEdgeTypes;
  if (f.multiple !== void 0) out.multiple = f.multiple;
  if (f.trigger !== void 0) out.trigger = f.trigger === "none" ? [] : [f.trigger];
  if (f.degree !== void 0) out.degree = f.degree;
  if (f.direction !== void 0) out.direction = f.direction;
  if (f.state !== void 0) out.state = f.state;
  if (f.unselectedState !== void 0) out.unselectedState = f.unselectedState;
  if (f.raiseActive !== void 0) out.raiseActive = f.raiseActive;
  if (f.clearOnBackground !== void 0) out.clearOnBackground = f.clearOnBackground;
  return out;
}

// src/editors/behaviours/click-inspect/fields.ts
var clickInspectFields = [
  {
    name: "clearOnBackground",
    type: "boolean",
    label: "Clear on background",
    description: "Clear the inspected element when clicking the empty canvas background."
  }
];

// src/editors/behaviours/click-inspect/mapping.ts
function optionsToForm18(o = {}) {
  return {
    clearOnBackground: o.clearOnBackground
  };
}
function formToOptions18(f) {
  const out = {};
  if (f.clearOnBackground !== void 0) out.clearOnBackground = f.clearOnBackground;
  return out;
}

// src/editors/behaviours/focus/fields.ts
var focusFields = [
  {
    name: "focusState",
    type: "text",
    label: "Focus state",
    description: 'Runtime state written on focused nodes (and the edges between them). Default "highlighted".'
  },
  {
    name: "dimState",
    type: "text",
    label: "Dim state",
    description: 'State written on everything else when the focus dims. Default "dimmed"; blank never dims.'
  },
  {
    name: "includeEdges",
    type: "boolean",
    label: "Emphasise edges",
    description: "Also emphasise edges whose two endpoints are focused."
  },
  {
    name: "frame",
    type: "boolean",
    label: "Frame on focus",
    description: 'Frame the focused nodes after every focus change. Off: only a "focus" camera intent frames.'
  },
  {
    name: "framePadding",
    type: "number",
    label: "Frame padding",
    min: 0,
    step: 4,
    description: "Screen-px margin around the framed nodes. Default 80."
  },
  {
    name: "frameDurationMs",
    type: "number",
    label: "Frame duration (ms)",
    min: 0,
    step: 50,
    description: "Length of the framing glide. 0 snaps. Default 450."
  },
  {
    name: "frameMaxZoom",
    type: "number",
    label: "Max frame zoom",
    min: 0.1,
    step: 0.1,
    description: "Never zoom in past this when framing. Default 2."
  }
];

// src/editors/behaviours/focus/mapping.ts
var KEYS = [
  "focusState",
  "dimState",
  "includeEdges",
  "frame",
  "framePadding",
  "frameDurationMs",
  "frameMaxZoom"
];
function optionsToForm19(o = {}) {
  const out = {};
  for (const key of KEYS) out[key] = o[key];
  return out;
}
function formToOptions19(f) {
  const out = {};
  for (const key of KEYS) {
    const value = f[key];
    if (value === void 0 || value === null) continue;
    if (key === "focusState" && value === "") continue;
    if (typeof value === "number" && Number.isNaN(value)) continue;
    out[key] = value;
  }
  return out;
}

// src/editors/behaviours/click-view/fields.ts
var clickViewFields = [
  {
    name: "clearOnBackground",
    type: "boolean",
    label: "Clear on background",
    description: "Clear the viewed element when clicking the empty canvas background."
  }
];

// src/editors/behaviours/click-view/mapping.ts
function optionsToForm20(o = {}) {
  return {
    clearOnBackground: o.clearOnBackground
  };
}
function formToOptions20(f) {
  const out = {};
  if (f.clearOnBackground !== void 0) out.clearOnBackground = f.clearOnBackground;
  return out;
}

// src/editors/behaviours/hover-element-preview/fields.ts
var hoverElementPreviewFields = [
  {
    name: "openDelay",
    type: "number",
    label: "Open delay (ms)",
    min: 0,
    step: 10,
    description: "Dwell before a hovered element\u2019s card shows. Default 50ms."
  },
  {
    name: "closeDelay",
    type: "number",
    label: "Close delay (ms)",
    min: 0,
    step: 10,
    description: "Grace period after the pointer leaves before the card hides. Default 50ms."
  },
  {
    name: "placement",
    type: "select",
    label: "Placement",
    options: [
      { label: "Auto", value: "auto" },
      { label: "Top", value: "top" },
      { label: "Right", value: "right" },
      { label: "Bottom", value: "bottom" },
      { label: "Left", value: "left" },
      { label: "Top-left", value: "top-left" },
      { label: "Top-right", value: "top-right" },
      { label: "Bottom-left", value: "bottom-left" },
      { label: "Bottom-right", value: "bottom-right" }
    ],
    description: 'Anchor placement hint passed to the card renderer. Default "bottom-right".'
  },
  {
    name: "interactive",
    type: "boolean",
    label: "Interactive",
    description: "Let the pointer enter the card (select text, click links) without it vanishing."
  }
];

// src/editors/behaviours/hover-element-preview/mapping.ts
function optionsToForm21(o = {}) {
  return {
    openDelay: o.openDelay,
    closeDelay: o.closeDelay,
    placement: o.placement,
    interactive: o.interactive
  };
}
function formToOptions21(f) {
  const out = {};
  if (f.openDelay !== void 0) out.openDelay = f.openDelay;
  if (f.closeDelay !== void 0) out.closeDelay = f.closeDelay;
  if (f.placement !== void 0) out.placement = f.placement;
  if (f.interactive !== void 0) out.interactive = f.interactive;
  return out;
}

// src/editors/behaviours/brush-select/fields.ts
var brushSelectFields = [
  {
    name: "enableShapes",
    type: "boolean",
    label: "Select nodes",
    group: "Selection",
    description: "Include enclosed nodes in the brush selection."
  },
  {
    name: "enableConnectors",
    type: "boolean",
    label: "Select edges",
    group: "Selection",
    description: "Include enclosed edges (both endpoints inside the rect) in the selection."
  },
  {
    name: "trigger",
    type: "select",
    label: "Modifier gate",
    group: "Selection",
    description: 'Modifier held on pointerdown to activate the brush. "None" = any left-drag.',
    options: [
      { value: "none", label: "None" },
      { value: "shift", label: "Shift" },
      { value: "control", label: "Control" },
      { value: "alt", label: "Alt" },
      { value: "meta", label: "Meta" }
    ]
  },
  {
    name: "immediately",
    type: "boolean",
    label: "Live update",
    group: "Selection",
    description: "Update the selection as the rectangle grows. Off = apply on release."
  },
  {
    name: "state",
    type: "text",
    label: "State name",
    group: "Selection",
    description: 'Visual state applied to brushed elements on the fallback path. Default "selected".'
  },
  {
    name: "clearOnBackground",
    type: "boolean",
    label: "Clear on background",
    group: "Selection",
    description: "Clear the selection on a background click (no drag)."
  },
  {
    name: "styleFill",
    type: "color",
    label: "Fill color",
    group: "Rectangle",
    presetColors: [...COLOR_PRESETS],
    description: "Rubber-band rectangle fill colour."
  },
  { name: "styleFillAlpha", type: "number", label: "Fill alpha", group: "Rectangle", min: 0, max: 1, step: 0.01 },
  {
    name: "styleStroke",
    type: "color",
    label: "Stroke color",
    group: "Rectangle",
    presetColors: [...COLOR_PRESETS],
    description: "Rectangle border colour."
  },
  { name: "styleStrokeAlpha", type: "number", label: "Stroke alpha", group: "Rectangle", min: 0, max: 1, step: 0.01 },
  { name: "styleStrokeWidth", type: "number", label: "Stroke width", group: "Rectangle", min: 0, max: 10, step: 0.5 }
];

// src/editors/behaviours/brush-select/mapping.ts
function colorToField4(v) {
  if (typeof v === "number") return numberToHex(v);
  if (typeof v === "string") return v;
  return void 0;
}
function optionsToForm22(o = {}) {
  const s = o.style ?? {};
  return {
    enableShapes: o.enableElements === void 0 ? void 0 : o.enableElements.includes("shape"),
    enableConnectors: o.enableElements === void 0 ? void 0 : o.enableElements.includes("connector"),
    trigger: o.trigger === void 0 ? void 0 : o.trigger[0] ?? "none",
    immediately: o.immediately,
    state: o.state,
    clearOnBackground: o.clearOnBackground,
    styleFill: colorToField4(s.fill),
    styleFillAlpha: s.fillAlpha,
    styleStroke: colorToField4(s.stroke),
    styleStrokeAlpha: s.strokeAlpha,
    styleStrokeWidth: s.strokeWidth
  };
}
function formToOptions22(f) {
  const out = {};
  if (f.enableShapes !== void 0 || f.enableConnectors !== void 0) {
    const els = [];
    if (f.enableShapes) els.push("shape");
    if (f.enableConnectors) els.push("connector");
    out.enableElements = els;
  }
  if (f.trigger !== void 0) out.trigger = f.trigger === "none" ? [] : [f.trigger];
  if (f.immediately !== void 0) out.immediately = f.immediately;
  if (f.state !== void 0) out.state = f.state;
  if (f.clearOnBackground !== void 0) out.clearOnBackground = f.clearOnBackground;
  const style = {};
  if (f.styleFill) style.fill = hexToNumber(f.styleFill);
  if (f.styleFillAlpha !== void 0) style.fillAlpha = f.styleFillAlpha;
  if (f.styleStroke) style.stroke = hexToNumber(f.styleStroke);
  if (f.styleStrokeAlpha !== void 0) style.strokeAlpha = f.styleStrokeAlpha;
  if (f.styleStrokeWidth !== void 0) style.strokeWidth = f.styleStrokeWidth;
  if (Object.keys(style).length > 0) out.style = style;
  return out;
}

// src/editors/behaviours/lasso-select/fields.ts
var lassoSelectFields = [
  {
    name: "enableShapes",
    type: "boolean",
    label: "Select nodes",
    group: "Selection",
    description: "Include enclosed nodes in the lasso selection."
  },
  {
    name: "enableConnectors",
    type: "boolean",
    label: "Select edges",
    group: "Selection",
    description: "Include enclosed edges (both endpoints inside the polygon) in the selection."
  },
  {
    name: "trigger",
    type: "select",
    label: "Modifier gate",
    group: "Selection",
    description: 'Modifier held on pointerdown to activate the lasso. "None" = any left-drag.',
    options: [
      { value: "none", label: "None" },
      { value: "shift", label: "Shift" },
      { value: "control", label: "Control" },
      { value: "alt", label: "Alt" },
      { value: "meta", label: "Meta" }
    ]
  },
  {
    name: "immediately",
    type: "boolean",
    label: "Live update",
    group: "Selection",
    description: "Update the selection as the polygon grows. Off = apply on release."
  },
  {
    name: "state",
    type: "text",
    label: "State name",
    group: "Selection",
    description: 'Visual state applied to lassoed elements on the fallback path. Default "selected".'
  },
  {
    name: "clearOnBackground",
    type: "boolean",
    label: "Clear on background",
    group: "Selection",
    description: "Clear the selection on a background click (no drag)."
  },
  {
    name: "styleFill",
    type: "color",
    label: "Fill color",
    group: "Polygon",
    presetColors: [...COLOR_PRESETS],
    description: "Lasso polygon fill colour."
  },
  { name: "styleFillAlpha", type: "number", label: "Fill alpha", group: "Polygon", min: 0, max: 1, step: 0.01 },
  {
    name: "styleStroke",
    type: "color",
    label: "Stroke color",
    group: "Polygon",
    presetColors: [...COLOR_PRESETS],
    description: "Polygon border colour."
  },
  { name: "styleStrokeAlpha", type: "number", label: "Stroke alpha", group: "Polygon", min: 0, max: 1, step: 0.01 },
  {
    name: "styleStrokeWidth",
    type: "number",
    label: "Stroke width",
    group: "Polygon",
    min: 0,
    max: 10,
    step: 0.5,
    description: "Border width in screen pixels (auto-divided by zoom)."
  }
];

// src/editors/behaviours/lasso-select/mapping.ts
function colorToField5(v) {
  if (typeof v === "number") return numberToHex(v);
  if (typeof v === "string") return v;
  return void 0;
}
function optionsToForm23(o = {}) {
  const s = o.style ?? {};
  return {
    enableShapes: o.enableElements === void 0 ? void 0 : o.enableElements.includes("shape"),
    enableConnectors: o.enableElements === void 0 ? void 0 : o.enableElements.includes("connector"),
    trigger: o.trigger === void 0 ? void 0 : o.trigger[0] ?? "none",
    immediately: o.immediately,
    state: o.state,
    clearOnBackground: o.clearOnBackground,
    styleFill: colorToField5(s.fill),
    styleFillAlpha: s.fillAlpha,
    styleStroke: colorToField5(s.stroke),
    styleStrokeAlpha: s.strokeAlpha,
    styleStrokeWidth: s.strokeWidth
  };
}
function formToOptions23(f) {
  const out = {};
  if (f.enableShapes !== void 0 || f.enableConnectors !== void 0) {
    const els = [];
    if (f.enableShapes) els.push("shape");
    if (f.enableConnectors) els.push("connector");
    out.enableElements = els;
  }
  if (f.trigger !== void 0) out.trigger = f.trigger === "none" ? [] : [f.trigger];
  if (f.immediately !== void 0) out.immediately = f.immediately;
  if (f.state !== void 0) out.state = f.state;
  if (f.clearOnBackground !== void 0) out.clearOnBackground = f.clearOnBackground;
  const style = {};
  if (f.styleFill) style.fill = hexToNumber(f.styleFill);
  if (f.styleFillAlpha !== void 0) style.fillAlpha = f.styleFillAlpha;
  if (f.styleStroke) style.stroke = hexToNumber(f.styleStroke);
  if (f.styleStrokeAlpha !== void 0) style.strokeAlpha = f.styleStrokeAlpha;
  if (f.styleStrokeWidth !== void 0) style.strokeWidth = f.styleStrokeWidth;
  if (Object.keys(style).length > 0) out.style = style;
  return out;
}

// src/editors/_shared/modes.ts
var MODELLER_MODES = [
  { value: "select", label: "Select" },
  { value: "add", label: "Add node" },
  { value: "connect", label: "Connect" },
  { value: "delete", label: "Delete" }
];
function modesField() {
  return {
    name: "modes",
    type: "checkbox",
    label: "Live in tools",
    description: "Only run while the modeller tool is one of these. None ticked = always.",
    options: [...MODELLER_MODES],
    orientation: "horizontal",
    colSpan: 2
  };
}
function modesToForm(modes) {
  return modes ? [...modes] : [];
}
function formToModes(values) {
  if (values === void 0) return void 0;
  return values.length > 0 ? [...values] : null;
}

// src/editors/behaviours/create-node/fields.ts
var createNodeFields = [modesField()];

// src/editors/behaviours/create-node/mapping.ts
function optionsToForm24(o = {}) {
  return { modes: modesToForm(o.modes) };
}
function formToOptions24(f) {
  const out = {};
  const modes = formToModes(f.modes);
  if (modes !== void 0) out.modes = modes ?? void 0;
  return out;
}

// src/editors/behaviours/draw-edge/fields.ts
var drawEdgeFields = [
  {
    name: "allowSelfLoop",
    type: "boolean",
    label: "Allow self-loops",
    description: "Releasing on the source node creates a loop edge instead of cancelling."
  },
  {
    name: "draftColor",
    type: "color",
    label: "Preview colour",
    description: "Stroke colour of the rubber-band preview while drawing. Default light blue."
  },
  {
    name: "draftWidth",
    type: "number",
    label: "Preview width",
    min: 0,
    step: 0.5,
    description: "Line width of the preview stroke. Default 2."
  },
  {
    name: "draftAlpha",
    type: "number",
    label: "Preview opacity",
    min: 0,
    max: 1,
    step: 0.05,
    description: "Opacity of the preview stroke. Default 0.9."
  },
  {
    name: "draftDashLength",
    type: "number",
    label: "Dash length",
    min: 0,
    step: 1,
    description: "Length of each dash in the preview. Default 6."
  },
  {
    name: "draftDashGap",
    type: "number",
    label: "Dash gap",
    min: 0,
    step: 1,
    description: "Gap between dashes in the preview. Default 4."
  },
  modesField()
];

// src/editors/behaviours/draw-edge/mapping.ts
function optionsToForm25(o = {}) {
  const d = o.draftStyle;
  return {
    allowSelfLoop: o.allowSelfLoop,
    draftColor: d?.color !== void 0 ? numberToHex(d.color) : void 0,
    draftWidth: d?.width,
    draftAlpha: d?.alpha,
    draftDashLength: d?.dash?.[0],
    draftDashGap: d?.dash?.[1],
    modes: modesToForm(o.modes)
  };
}
function formToOptions25(f) {
  const out = {};
  if (f.allowSelfLoop !== void 0) out.allowSelfLoop = f.allowSelfLoop;
  const draftStyle = {};
  if (f.draftColor !== void 0) draftStyle.color = hexToNumber(f.draftColor);
  if (f.draftWidth !== void 0) draftStyle.width = f.draftWidth;
  if (f.draftAlpha !== void 0) draftStyle.alpha = f.draftAlpha;
  if (f.draftDashLength !== void 0 || f.draftDashGap !== void 0) {
    draftStyle.dash = [f.draftDashLength ?? 6, f.draftDashGap ?? 4];
  }
  if (Object.keys(draftStyle).length > 0) out.draftStyle = draftStyle;
  const modes = formToModes(f.modes);
  if (modes !== void 0) out.modes = modes ?? void 0;
  return out;
}

// src/editors/behaviours/erase/fields.ts
var eraseFields = [
  {
    name: "target",
    type: "select",
    label: "Erase target",
    description: "Which element kinds a click removes. Erasing a node cascades its edges.",
    options: [
      { label: "Nodes and edges", value: "both" },
      { label: "Nodes only", value: "node" },
      { label: "Edges only", value: "edge" }
    ]
  },
  modesField()
];

// src/editors/behaviours/erase/mapping.ts
function optionsToForm26(o = {}) {
  return {
    target: o.target,
    modes: modesToForm(o.modes)
  };
}
function formToOptions26(f) {
  const out = {};
  if (f.target !== void 0) out.target = f.target;
  const modes = formToModes(f.modes);
  if (modes !== void 0) out.modes = modes ?? void 0;
  return out;
}

// src/editors/behaviours/node-resize/fields.ts
var nodeResizeFields = [
  {
    name: "handleRadius",
    type: "number",
    label: "Handle radius",
    min: 1,
    step: 1,
    description: "Resize-handle outer radius in px. Default 5."
  },
  {
    name: "handleFill",
    type: "color",
    label: "Handle fill",
    description: "Fill colour of the round resize handles. Default white."
  },
  {
    name: "frameColor",
    type: "color",
    label: "Frame colour",
    description: "Colour of the dashed frame border + handle outlines. Default blue."
  },
  {
    name: "dashLength",
    type: "number",
    label: "Dash length",
    min: 0,
    step: 1,
    description: "Dash segment length of the frame border in px. Default 5."
  },
  {
    name: "dashGap",
    type: "number",
    label: "Dash gap",
    min: 0,
    step: 1,
    description: "Gap between dash segments of the frame border in px. Default 4."
  },
  {
    name: "framePadding",
    type: "number",
    label: "Frame padding",
    min: 0,
    step: 1,
    description: "Gap between the host silhouette and the dashed frame. Default 4."
  },
  {
    name: "minSize",
    type: "number",
    label: "Minimum size",
    min: 1,
    step: 1,
    description: "Smallest width / height / radius allowed during a resize drag. Default 20."
  }
];

// src/editors/behaviours/node-resize/mapping.ts
function optionsToForm27(o = {}) {
  return {
    handleRadius: o.handleRadius,
    handleFill: o.handleFill !== void 0 ? numberToHex(o.handleFill) : void 0,
    frameColor: o.frameColor !== void 0 ? numberToHex(o.frameColor) : void 0,
    dashLength: o.dashArray?.[0],
    dashGap: o.dashArray?.[1],
    framePadding: o.framePadding,
    minSize: o.minSize
  };
}
function formToOptions27(f) {
  const out = {};
  if (f.handleRadius !== void 0) out.handleRadius = f.handleRadius;
  if (f.handleFill !== void 0) out.handleFill = hexToNumber(f.handleFill);
  if (f.frameColor !== void 0) out.frameColor = hexToNumber(f.frameColor);
  if (f.dashLength !== void 0 || f.dashGap !== void 0) {
    out.dashArray = [f.dashLength ?? 5, f.dashGap ?? 4];
  }
  if (f.framePadding !== void 0) out.framePadding = f.framePadding;
  if (f.minSize !== void 0) out.minSize = f.minSize;
  return out;
}

// src/editors/behaviours/collapse-expand/fields.ts
var collapseExpandFields = [
  {
    name: "doubleClickToToggle",
    type: "boolean",
    label: "Double-click to toggle",
    description: "Double-clicking a group frame opens or closes it, alongside its +/\u2212 button. A double-click that lands on a member node is left to that node."
  },
  {
    name: "relayoutOnToggle",
    type: "boolean",
    label: "Re-layout on toggle",
    description: "Re-run the active layout after a frame opens or closes, so neighbours close the gap or make room. The toggled frame stays where it is and the camera is left alone."
  },
  {
    name: "centerOnToggle",
    type: "boolean",
    label: "Centre on toggle",
    description: "Pan the camera to centre a frame after it opens or closes. Off by default \u2014 the camera stays put. Zoom is left alone."
  },
  {
    name: "centerDurationMs",
    type: "number",
    label: "Centre glide (ms)",
    description: "How long the re-centre pan glides for. 0 jumps straight to the frame. A pan or zoom during the glide cancels it.",
    min: 0,
    max: 1e3,
    step: 50
  },
  {
    name: "countBadge",
    type: "boolean",
    label: "Count badge",
    description: "Mark each collapsed frame with a small pill showing how many nodes it hides. Coloured from the theme; gone when the frame opens."
  },
  {
    name: "countBadgePlacement",
    type: "select",
    label: "Count badge placement",
    description: "Which corner or edge of the collapsed frame the count badge sits on, centred on that point.",
    options: [
      { value: "top-right", label: "Top right" },
      { value: "top-left", label: "Top left" },
      { value: "bottom-right", label: "Bottom right" },
      { value: "bottom-left", label: "Bottom left" },
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
      { value: "left", label: "Left" },
      { value: "right", label: "Right" }
    ]
  }
];

// src/editors/behaviours/collapse-expand/mapping.ts
var DEFAULT_CENTER_DURATION_MS = 300;
var DEFAULT_COUNT_BADGE_PLACEMENT = "top-right";
function optionsToForm28(o = {}) {
  return {
    doubleClickToToggle: o.doubleClickToToggle ?? true,
    centerOnToggle: o.centerOnToggle ?? false,
    centerDurationMs: o.centerDurationMs ?? DEFAULT_CENTER_DURATION_MS,
    relayoutOnToggle: o.relayoutOnToggle ?? false,
    countBadge: o.countBadge ?? false,
    countBadgePlacement: o.countBadgePlacement ?? DEFAULT_COUNT_BADGE_PLACEMENT
  };
}
function formToOptions28(f) {
  return {
    doubleClickToToggle: f.doubleClickToToggle ?? true,
    centerOnToggle: f.centerOnToggle ?? false,
    centerDurationMs: f.centerDurationMs ?? DEFAULT_CENTER_DURATION_MS,
    relayoutOnToggle: f.relayoutOnToggle ?? false,
    countBadge: f.countBadge ?? false,
    countBadgePlacement: f.countBadgePlacement ?? DEFAULT_COUNT_BADGE_PLACEMENT
  };
}

// src/editors/behaviours/color-by/fields.ts
function colorByFields(values = {}) {
  const mode = values.mode ?? "categorical";
  const scale = values.scale ?? "linear";
  const continuous = scale === "linear" || scale === "sqrt" || scale === "log";
  const shared = [
    {
      name: "mode",
      type: "select",
      label: "Mode",
      options: [
        { value: "categorical", label: "Categorical (which kind is this?)" },
        { value: "range", label: "Range (how much of this is there?)" }
      ],
      description: "Category assigns one colour per distinct value. Range maps a number onto a colour ramp."
    },
    {
      name: "nodeValueKey",
      type: "text",
      label: "Node field",
      description: "Root-relative dot path \u2014 'type' (default), 'data.riskScore', 'style.shape.kind'."
    },
    {
      name: "edgeValueKey",
      type: "text",
      label: "Edge field",
      description: "Root-relative dot path \u2014 'type' (default), 'data.errorRate'."
    },
    {
      name: "colorNodes",
      type: "boolean",
      label: "Colour nodes",
      description: "Fill each node from its field value. Default on."
    },
    {
      name: "colorEdges",
      type: "boolean",
      label: "Colour edges",
      description: "Stroke each edge from its field value. Default on."
    },
    {
      name: "fallbackColor",
      type: "color",
      label: "Fallback colour",
      description: "Colour for items whose value is missing, empty, or (in range mode) not a number. Default grey."
    }
  ];
  if (mode === "categorical") {
    return [
      ...shared,
      {
        name: "maxCategories",
        type: "number",
        label: "Max categories",
        description: 'Values beyond this many distinct ones share the fallback colour and collapse into one "other" legend row. Guards against colouring by a high-cardinality field. Default 24.'
      }
    ];
  }
  const rangeFields = [
    ...shared,
    {
      name: "scale",
      type: "select",
      label: "Scale",
      options: [
        { value: "linear", label: "Linear (continuous)" },
        { value: "sqrt", label: "Square root (continuous)" },
        { value: "log", label: "Logarithmic (continuous)" },
        { value: "quantile", label: "Quantile (equal-count bins)" },
        { value: "threshold", label: "Threshold (explicit bins)" }
      ],
      description: "How a number becomes a colour."
    }
  ];
  if (scale === "threshold") {
    return [
      ...rangeFields,
      {
        name: "nodeThresholds",
        type: "text",
        label: "Node bucket edges",
        description: 'Comma-separated, in the node field\u2019s units \u2014 "10, 50, 200" gives four buckets.'
      },
      {
        name: "edgeThresholds",
        type: "text",
        label: "Edge bucket edges",
        description: "Comma-separated, in the edge field\u2019s units."
      }
    ];
  }
  const domainFields = [
    {
      name: "nodeDomainMin",
      type: "number",
      label: "Node domain min",
      description: "Leave both bounds blank to auto-scan. \u26A0\uFE0F With auto-domain, loading a node that widens the range recolours every other node \u2014 set it explicitly for stable colours across a streaming load."
    },
    { name: "nodeDomainMax", type: "number", label: "Node domain max" },
    {
      name: "edgeDomainMin",
      type: "number",
      label: "Edge domain min",
      description: "Leave both bounds blank to auto-scan. Separate from the node domain because the two fields rarely share units."
    },
    { name: "edgeDomainMax", type: "number", label: "Edge domain max" }
  ];
  if (scale === "quantile") {
    return [
      ...rangeFields,
      {
        name: "bins",
        type: "number",
        label: "Bins",
        description: "Number of equal-count buckets. Default 5."
      },
      ...domainFields
    ];
  }
  return continuous ? [...rangeFields, ...domainFields] : rangeFields;
}

// src/editors/behaviours/color-by/mapping.ts
function parseThresholds(text2) {
  const parsed = text2.split(",").map((s) => Number(s.trim())).filter((n) => Number.isFinite(n));
  return [...new Set(parsed)].sort((a, b) => a - b);
}
function optionsToForm29(o = {}) {
  return {
    mode: o.mode,
    nodeValueKey: o.nodeValueKey,
    edgeValueKey: o.edgeValueKey,
    colorNodes: o.colorNodes,
    colorEdges: o.colorEdges,
    fallbackColor: o.fallbackColor !== void 0 ? numberToHex(o.fallbackColor) : void 0,
    maxCategories: o.maxCategories,
    scale: o.scale,
    nodeDomainMin: o.nodeDomain?.[0],
    nodeDomainMax: o.nodeDomain?.[1],
    edgeDomainMin: o.edgeDomain?.[0],
    edgeDomainMax: o.edgeDomain?.[1],
    bins: o.bins,
    nodeThresholds: o.nodeThresholds?.join(", "),
    edgeThresholds: o.edgeThresholds?.join(", ")
  };
}
function formToOptions29(f) {
  const out = {};
  if (f.mode !== void 0) out.mode = f.mode;
  if (f.nodeValueKey !== void 0 && f.nodeValueKey !== "") out.nodeValueKey = f.nodeValueKey;
  if (f.edgeValueKey !== void 0 && f.edgeValueKey !== "") out.edgeValueKey = f.edgeValueKey;
  if (f.colorNodes !== void 0) out.colorNodes = f.colorNodes;
  if (f.colorEdges !== void 0) out.colorEdges = f.colorEdges;
  if (f.fallbackColor !== void 0) out.fallbackColor = hexToNumber(f.fallbackColor);
  if (f.maxCategories !== void 0) out.maxCategories = f.maxCategories;
  if (f.scale !== void 0) out.scale = f.scale;
  if (f.nodeDomainMin !== void 0 && f.nodeDomainMax !== void 0) {
    out.nodeDomain = [f.nodeDomainMin, f.nodeDomainMax];
  }
  if (f.edgeDomainMin !== void 0 && f.edgeDomainMax !== void 0) {
    out.edgeDomain = [f.edgeDomainMin, f.edgeDomainMax];
  }
  if (f.bins !== void 0) out.bins = f.bins;
  if (f.nodeThresholds) out.nodeThresholds = parseThresholds(f.nodeThresholds);
  if (f.edgeThresholds) out.edgeThresholds = parseThresholds(f.edgeThresholds);
  return out;
}

// src/editors/behaviours/theme/fields.ts
var themeFields = [
  {
    name: "mode",
    type: "select",
    label: "Colour mode",
    description: `How the theme is chosen. "System" follows the OS setting; "Document" follows the host page's theme picker (the data-theme attribute on <html>) \u2014 family included.`,
    options: [
      { label: "System", value: "system" },
      { label: "Document", value: "document" },
      { label: "Light", value: "light" },
      { label: "Dark", value: "dark" }
    ]
  },
  {
    name: "active",
    type: "text",
    label: "Active theme",
    description: 'Name of the theme to apply (e.g. "default", "forest", "ocean").'
  },
  {
    name: "fallback",
    type: "text",
    label: "Fallback theme",
    description: 'Theme used when the active name is not found. Default "default".'
  },
  {
    name: "accentVar",
    type: "text",
    label: "Accent CSS variable",
    description: 'CSS custom property read for the accent role. Default "--color-primary".'
  }
];

// src/editors/behaviours/theme/mapping.ts
function optionsToForm30(o = {}) {
  return {
    mode: o.mode,
    active: o.active,
    fallback: o.fallback,
    accentVar: o.accentVar
  };
}
function formToOptions30(f) {
  const out = {};
  if (f.mode !== void 0) out.mode = f.mode;
  if (f.active !== void 0) out.active = f.active;
  if (f.fallback !== void 0) out.fallback = f.fallback;
  if (f.accentVar !== void 0) out.accentVar = f.accentVar;
  return out;
}

// src/editors/behaviours/fisheye/fields.ts
var MODIFIER_OPTIONS = [
  { value: "none", label: "None" },
  { value: "alt", label: "Alt" },
  { value: "shift", label: "Shift" },
  { value: "ctrl", label: "Ctrl" },
  { value: "meta", label: "Meta" }
];
var fisheyeFields = [
  {
    name: "trigger",
    type: "select",
    label: "Move lens on",
    group: "Lens",
    description: "Pointer move = follows the cursor; Click = placed by a click; Drag = placed by a click, moved by dragging it.",
    options: [
      { value: "pointermove", label: "Pointer move" },
      { value: "click", label: "Click" },
      { value: "drag", label: "Drag" }
    ]
  },
  {
    name: "radius",
    type: "number",
    label: "Radius (px)",
    group: "Lens",
    min: 0,
    step: 5,
    description: "Lens radius in screen pixels \u2014 same apparent size at any zoom. Default 120."
  },
  {
    name: "distortion",
    type: "number",
    label: "Distortion",
    group: "Lens",
    min: 0,
    step: 0.1,
    description: "How strongly the lens spreads nodes near its centre. 0 = none. Default 1.5."
  },
  {
    name: "nodeScale",
    type: "number",
    label: "Node scale",
    group: "Lens",
    min: 0.1,
    step: 0.1,
    description: "Node size multiplier at the lens centre, easing to 1 at the rim. 1 = no enlargement. Default 1.5."
  },
  {
    name: "showLabels",
    type: "boolean",
    label: "Show labels",
    group: "Lens",
    description: "Force labels visible inside the lens, even where text LOD or label collision hides them."
  },
  {
    name: "radiusWheelModifier",
    type: "select",
    label: "Radius wheel key",
    group: "Wheel",
    description: 'Hold this key and scroll inside the lens to resize it. "None" disables.',
    options: MODIFIER_OPTIONS
  },
  {
    name: "distortionWheelModifier",
    type: "select",
    label: "Distortion wheel key",
    group: "Wheel",
    description: 'Hold this key and scroll inside the lens to change the distortion. "None" disables.',
    options: MODIFIER_OPTIONS
  },
  { name: "minRadius", type: "number", label: "Min radius (px)", group: "Wheel", min: 0, step: 5 },
  {
    name: "maxRadius",
    type: "number",
    label: "Max radius (px)",
    group: "Wheel",
    min: 0,
    step: 5,
    description: "0 = half the canvas\u2019s shorter side."
  },
  { name: "minDistortion", type: "number", label: "Min distortion", group: "Wheel", min: 0, step: 0.1 },
  { name: "maxDistortion", type: "number", label: "Max distortion", group: "Wheel", min: 0, step: 0.1 },
  {
    name: "lensStrokeColor",
    type: "color",
    label: "Ring colour",
    group: "Appearance",
    presetColors: [...COLOR_PRESETS]
  },
  { name: "lensStrokeWidth", type: "number", label: "Ring width", group: "Appearance", min: 0, max: 10, step: 0.5 },
  {
    name: "lensFillColor",
    type: "color",
    label: "Fill colour",
    group: "Appearance",
    presetColors: [...COLOR_PRESETS]
  },
  { name: "lensFillAlpha", type: "number", label: "Fill alpha", group: "Appearance", min: 0, max: 1, step: 0.01 }
];

// src/editors/behaviours/fisheye/mapping.ts
function modifierToField(m) {
  if (m === void 0) return void 0;
  return m ?? "none";
}
function modifierToOption(m) {
  return m === "none" ? null : m;
}
function optionsToForm31(o = {}) {
  return {
    trigger: o.trigger,
    radius: o.radius,
    minRadius: o.minRadius,
    maxRadius: o.maxRadius === void 0 ? void 0 : o.maxRadius ?? 0,
    distortion: o.distortion,
    minDistortion: o.minDistortion,
    maxDistortion: o.maxDistortion,
    nodeScale: o.nodeScale,
    showLabels: o.showLabels,
    radiusWheelModifier: modifierToField(o.radiusWheelModifier),
    distortionWheelModifier: modifierToField(o.distortionWheelModifier),
    lensStrokeColor: o.lensStrokeColor === void 0 ? void 0 : numberToHex(o.lensStrokeColor),
    lensStrokeWidth: o.lensStrokeWidth,
    lensFillColor: o.lensFillColor === void 0 ? void 0 : numberToHex(o.lensFillColor),
    lensFillAlpha: o.lensFillAlpha
  };
}
function formToOptions31(f) {
  const out = {};
  if (f.trigger !== void 0) out.trigger = f.trigger;
  if (f.radius !== void 0) out.radius = f.radius;
  if (f.minRadius !== void 0) out.minRadius = f.minRadius;
  if (f.maxRadius !== void 0) out.maxRadius = f.maxRadius > 0 ? f.maxRadius : null;
  if (f.distortion !== void 0) out.distortion = f.distortion;
  if (f.minDistortion !== void 0) out.minDistortion = f.minDistortion;
  if (f.maxDistortion !== void 0) out.maxDistortion = f.maxDistortion;
  if (f.nodeScale !== void 0) out.nodeScale = f.nodeScale;
  if (f.showLabels !== void 0) out.showLabels = f.showLabels;
  if (f.radiusWheelModifier !== void 0) out.radiusWheelModifier = modifierToOption(f.radiusWheelModifier);
  if (f.distortionWheelModifier !== void 0) {
    out.distortionWheelModifier = modifierToOption(f.distortionWheelModifier);
  }
  if (f.lensStrokeColor) out.lensStrokeColor = hexToNumber(f.lensStrokeColor);
  if (f.lensStrokeWidth !== void 0) out.lensStrokeWidth = f.lensStrokeWidth;
  if (f.lensFillColor) out.lensFillColor = hexToNumber(f.lensFillColor);
  if (f.lensFillAlpha !== void 0) out.lensFillAlpha = f.lensFillAlpha;
  return out;
}

// src/editors/behaviours/node-centrality/fields.ts
var nodeCentralityFields = [
  {
    name: "direction",
    type: "select",
    label: "Direction",
    description: "Edges counted per node when computing degree.",
    options: [
      { value: "in", label: "In" },
      { value: "out", label: "Out" },
      { value: "both", label: "Both" }
    ]
  },
  {
    name: "minSize",
    type: "number",
    label: "Min size",
    min: 0,
    step: 1,
    description: "Output size for a node with degree 0. Default 8."
  },
  {
    name: "maxSize",
    type: "number",
    label: "Max size",
    min: 0,
    step: 1,
    description: "Output size for the max-degree node. Default 32."
  },
  {
    name: "scale",
    type: "select",
    label: "Scale",
    description: "Curve mapping normalized degree to size.",
    options: [
      { value: "linear", label: "Linear" },
      { value: "sqrt", label: "Square root" },
      { value: "log", label: "Logarithmic" }
    ]
  },
  {
    name: "weightKey",
    type: "text",
    label: "Weight field",
    description: 'Numeric edge-data field to sum for weighted degree (e.g. "weight"). Blank = raw edge count.'
  },
  {
    name: "labelScale",
    type: "number",
    label: "Label scale",
    min: 0,
    step: 0.05,
    description: "Grow the label with the node: labelFontSize = size \xD7 this (clamped). 0 = off."
  },
  {
    name: "labelMinSize",
    type: "number",
    label: "Label min size",
    min: 0,
    step: 1,
    description: "Lower clamp for the scaled label font. Default 8."
  },
  {
    name: "labelMaxSize",
    type: "number",
    label: "Label max size",
    min: 0,
    step: 1,
    description: "Upper clamp for the scaled label font. Default 40."
  }
];

// src/editors/behaviours/node-centrality/mapping.ts
function optionsToForm32(o = {}) {
  return {
    direction: o.direction,
    minSize: o.minSize,
    maxSize: o.maxSize,
    scale: o.scale,
    weightKey: o.weightKey,
    labelScale: o.labelScale,
    labelMinSize: o.labelMinSize,
    labelMaxSize: o.labelMaxSize
  };
}
function formToOptions32(f) {
  const out = {};
  if (f.direction !== void 0) out.direction = f.direction;
  if (f.minSize !== void 0) out.minSize = f.minSize;
  if (f.maxSize !== void 0) out.maxSize = f.maxSize;
  if (f.scale !== void 0) out.scale = f.scale;
  if (f.weightKey !== void 0) out.weightKey = f.weightKey;
  if (f.labelScale !== void 0) out.labelScale = f.labelScale;
  if (f.labelMinSize !== void 0) out.labelMinSize = f.labelMinSize;
  if (f.labelMaxSize !== void 0) out.labelMaxSize = f.labelMaxSize;
  return out;
}

// src/editors/behaviours/context-menu/fields.ts
var contextMenuFields = [
  {
    name: "targetNode",
    type: "boolean",
    label: "On nodes",
    description: "Fire the context-menu callback when a node is right-clicked."
  },
  {
    name: "targetEdge",
    type: "boolean",
    label: "On edges",
    description: "Fire the context-menu callback when an edge is right-clicked."
  },
  {
    name: "targetCanvas",
    type: "boolean",
    label: "On empty canvas",
    description: "Fire the context-menu callback when empty canvas is right-clicked."
  },
  {
    name: "state",
    type: "text",
    label: "Transient state",
    description: 'State name applied to the right-clicked element (e.g. "context-open"). Blank = none.'
  }
];

// src/editors/behaviours/context-menu/mapping.ts
function optionsToForm33(o = {}) {
  const t = o.targets;
  return {
    targetNode: t ? t.includes("node") : void 0,
    targetEdge: t ? t.includes("edge") : void 0,
    targetCanvas: t ? t.includes("canvas") : void 0,
    state: o.state ?? void 0
  };
}
function formToOptions33(f) {
  const out = {};
  if (f.targetNode !== void 0 || f.targetEdge !== void 0 || f.targetCanvas !== void 0) {
    const targets = [];
    if (f.targetNode) targets.push("node");
    if (f.targetEdge) targets.push("edge");
    if (f.targetCanvas) targets.push("canvas");
    out.targets = targets;
  }
  if (f.state !== void 0) out.state = f.state === "" ? null : f.state;
  return out;
}

// src/editors/behaviours/text-resolution-lod/fields.ts
var textResolutionLodFields = [
  {
    name: "baseResolution",
    type: "number",
    label: "Base resolution",
    min: 0,
    step: 0.5,
    description: "Base DPR multiplied by the active tier. Default devicePixelRatio."
  },
  {
    name: "hysteresis",
    type: "number",
    label: "Hysteresis",
    min: 0,
    step: 0.05,
    description: "Zoom margin before dropping down a tier \u2014 stops boundary flicker. Default 0.1."
  }
];

// src/editors/behaviours/text-resolution-lod/mapping.ts
function optionsToForm34(o = {}) {
  return {
    baseResolution: o.baseResolution,
    hysteresis: o.hysteresis
  };
}
function formToOptions34(f) {
  const out = {};
  if (f.baseResolution !== void 0) out.baseResolution = f.baseResolution;
  if (f.hysteresis !== void 0) out.hysteresis = f.hysteresis;
  return out;
}

// src/editors/behaviours/node-scale-lod/fields.ts
var nodeScaleLodFields = [
  {
    name: "scaleEpsilon",
    type: "number",
    label: "Scale epsilon",
    min: 0,
    step: 1e-3,
    description: "Skip apply below this relative zoom delta. Default 0.005."
  },
  {
    name: "settleMs",
    type: "number",
    label: "Settle (ms)",
    min: 0,
    step: 10,
    description: "0 = per-frame; > 0 debounces the apply after zoom silence."
  }
];

// src/editors/behaviours/node-scale-lod/mapping.ts
function optionsToForm35(o = {}) {
  return {
    scaleEpsilon: o.scaleEpsilon,
    settleMs: o.settleMs
  };
}
function formToOptions35(f) {
  const out = {};
  if (f.scaleEpsilon !== void 0) out.scaleEpsilon = f.scaleEpsilon;
  if (f.settleMs !== void 0) out.settleMs = f.settleMs;
  return out;
}

// src/editors/behaviours/edge-scale-lod/fields.ts
var edgeScaleLodFields = [
  {
    name: "scaleEpsilon",
    type: "number",
    label: "Scale epsilon",
    min: 0,
    step: 1e-3,
    description: "Skip apply below this relative zoom delta. Default 0.005."
  },
  {
    name: "settleMs",
    type: "number",
    label: "Settle (ms)",
    min: 0,
    step: 10,
    description: "0 = per-frame; > 0 debounces the apply after zoom silence. Default 80."
  }
];

// src/editors/behaviours/edge-scale-lod/mapping.ts
function optionsToForm36(o = {}) {
  return {
    scaleEpsilon: o.scaleEpsilon,
    settleMs: o.settleMs
  };
}
function formToOptions36(f) {
  const out = {};
  if (f.scaleEpsilon !== void 0) out.scaleEpsilon = f.scaleEpsilon;
  if (f.settleMs !== void 0) out.settleMs = f.settleMs;
  return out;
}

// src/editors/behaviours/parallel-edge/fields.ts
var parallelEdgeFields = [
  {
    name: "spacing",
    type: "number",
    label: "Spacing",
    min: 0,
    step: 1,
    description: "Gap between adjacent ranks in world units. Default 12."
  },
  {
    name: "basis",
    type: "select",
    label: "Basis",
    description: "How a rank is translated into a fan direction.",
    options: [
      { value: "auto", label: "Auto" },
      { value: "perpendicular", label: "Perpendicular" },
      { value: "axis-aligned", label: "Axis-aligned" }
    ]
  },
  {
    name: "anchorOffset",
    type: "boolean",
    label: "Anchor offset",
    description: "Fan port-anchored endpoints along the host face, not just waypoints."
  }
];

// src/editors/behaviours/parallel-edge/mapping.ts
function optionsToForm37(o = {}) {
  return {
    spacing: o.spacing,
    basis: o.basis,
    anchorOffset: o.anchorOffset
  };
}
function formToOptions37(f) {
  const out = {};
  if (f.spacing !== void 0) out.spacing = f.spacing;
  if (f.basis !== void 0) out.basis = f.basis;
  if (f.anchorOffset !== void 0) out.anchorOffset = f.anchorOffset;
  return out;
}

// src/editors/behaviours/entrance/fields.ts
var entranceFields = [
  {
    name: "durationMs",
    type: "number",
    label: "Fade duration",
    group: "Timing",
    min: 1,
    max: 3e3,
    step: 10,
    description: "How long each element takes to fade in, in ms. Default 320."
  },
  {
    name: "staggerMs",
    type: "number",
    label: "Stagger per item",
    group: "Timing",
    min: 0,
    max: 200,
    step: 1,
    description: "Delay added per element along the sweep axis, in ms. 0 fades everything together."
  },
  {
    name: "maxStaggerMs",
    type: "number",
    label: "Max sweep length",
    group: "Timing",
    min: 0,
    max: 5e3,
    step: 50,
    description: "Ceiling on the whole sweep, in ms. The per-item step is compressed to fit, so a large graph still arrives promptly."
  },
  {
    name: "easing",
    type: "select",
    label: "Easing",
    group: "Timing",
    description: "Named curve for each fade. Named (not a function) so the setting stays serialisable.",
    options: [
      { value: "easeOutCubic", label: "Ease out cubic" },
      { value: "easeOutQuad", label: "Ease out quad" },
      { value: "easeInOutSine", label: "Ease in-out sine" },
      { value: "easeInOutCubic", label: "Ease in-out cubic" },
      { value: "linear", label: "Linear" }
    ]
  },
  {
    name: "order",
    type: "select",
    label: "Sweep direction",
    group: "Sweep",
    description: 'Axis the entrance reads along. "None" fades the whole scene at once.',
    options: [
      { value: "x", label: "Left to right" },
      { value: "y", label: "Top to bottom" },
      { value: "none", label: "None (all together)" }
    ]
  },
  {
    name: "includeEdges",
    type: "boolean",
    label: "Fade edges",
    group: "Sweep",
    description: "Fade edges too, each behind the later of its two endpoints."
  }
];

// src/editors/behaviours/entrance/mapping.ts
function optionsToForm38(o = {}) {
  return {
    durationMs: o.durationMs,
    staggerMs: o.staggerMs,
    maxStaggerMs: o.maxStaggerMs,
    order: o.order,
    includeEdges: o.includeEdges,
    easing: o.easing
  };
}
function formToOptions38(f) {
  const out = {};
  if (f.durationMs !== void 0) out.durationMs = f.durationMs;
  if (f.staggerMs !== void 0) out.staggerMs = f.staggerMs;
  if (f.maxStaggerMs !== void 0) out.maxStaggerMs = f.maxStaggerMs;
  if (f.order !== void 0) out.order = f.order;
  if (f.includeEdges !== void 0) out.includeEdges = f.includeEdges;
  if (f.easing !== void 0) out.easing = f.easing;
  return out;
}

// src/editors/behaviours/content-lod/fields.ts
var contentLODFields = [
  {
    name: "minZoom",
    type: "number",
    label: "Min zoom",
    min: 0,
    step: 0.1,
    description: "Hide the content below this camera zoom. Blank = no lower bound."
  },
  {
    name: "maxZoom",
    type: "number",
    label: "Max zoom",
    min: 0,
    step: 0.1,
    description: "Hide the content above this camera zoom. Blank / 0 = no upper bound."
  }
];
var labelSizeFields = [
  {
    name: "sizeLabels",
    type: "boolean",
    label: "Size labels on zoom",
    description: "Off = labels keep the size their node gives them. On = the zoom growth and font bounds below apply."
  },
  {
    name: "zoomGrowth",
    type: "number",
    label: "Zoom growth",
    min: 0,
    max: 1,
    step: 0.05,
    description: "How on-screen size follows zoom: 1 = grows with the world, 0.5 = with its square root, 0 = fixed size."
  },
  {
    name: "minFontPx",
    type: "number",
    label: "Min font (px)",
    min: 0,
    step: 1,
    description: "Smallest on-screen font size \u2014 keeps zoomed-out labels readable. Blank / 0 = no floor."
  },
  {
    name: "maxFontPx",
    type: "number",
    label: "Max font (px)",
    min: 0,
    step: 1,
    description: "Largest on-screen font size \u2014 stops labels ballooning when zoomed in. Blank / 0 = no cap."
  }
];
var nodeLabelLODFields = [
  ...contentLODFields,
  {
    name: "alwaysShowTop",
    type: "number",
    label: "Always-show top (fraction)",
    min: 0,
    max: 1,
    step: 0.01,
    description: "Keep labels shown for the most central nodes even below the band \u2014 a fraction by degree (0.05 = top 5%). Relative, so it adapts across graphs. Blank / 0 = off."
  },
  ...labelSizeFields
];
var edgeLabelLODFields = [...contentLODFields, ...labelSizeFields];

// src/editors/behaviours/content-lod/mapping.ts
function positiveOrNull(v) {
  return v > 0 ? v : null;
}
function optionsToForm39(o = {}) {
  return {
    minZoom: o.minZoom,
    maxZoom: o.maxZoom ?? void 0,
    alwaysShowTop: o.alwaysShowTop
  };
}
function formToOptions39(f) {
  const out = {};
  if (f.minZoom !== void 0) out.minZoom = f.minZoom;
  if (f.maxZoom !== void 0) out.maxZoom = positiveOrNull(f.maxZoom);
  if (f.alwaysShowTop !== void 0) out.alwaysShowTop = f.alwaysShowTop;
  return out;
}
function labelLodOptionsToForm(o = {}) {
  const zoomGrowth = o.zoomGrowth ?? void 0;
  const minFontPx = o.minFontPx ?? void 0;
  const maxFontPx = o.maxFontPx ?? void 0;
  return {
    ...optionsToForm39(o),
    sizeLabels: zoomGrowth !== void 0 || minFontPx !== void 0 || maxFontPx !== void 0,
    zoomGrowth,
    minFontPx,
    maxFontPx
  };
}
function labelLodFormToOptions(f) {
  const out = formToOptions39(f);
  if (f.sizeLabels === false) {
    out.zoomGrowth = null;
    out.minFontPx = null;
    out.maxFontPx = null;
  } else if (f.sizeLabels === true) {
    out.zoomGrowth = f.zoomGrowth ?? 0;
    out.minFontPx = f.minFontPx === void 0 ? null : positiveOrNull(f.minFontPx);
    out.maxFontPx = f.maxFontPx === void 0 ? null : positiveOrNull(f.maxFontPx);
  }
  return out;
}

// src/editors/behaviours/edge-lod/fields.ts
var edgeLODFields = [
  {
    name: "minZoom",
    type: "number",
    label: "Thin below zoom",
    min: 0,
    step: 0.1,
    description: "Thin edges when the camera scale is below this. Default 0.5."
  },
  {
    name: "keepFraction",
    type: "number",
    label: "Keep fraction",
    min: 0,
    max: 1,
    step: 0.05,
    description: "Fraction of edges kept visible when thinned (0..1). Default 0.1."
  },
  {
    name: "keepBy",
    type: "select",
    label: "Keep by",
    description: "Which edges survive thinning.",
    options: [
      { value: "sample", label: "Sample (stable subset)" },
      { value: "weight", label: "Weight (highest)" },
      { value: "degree", label: "Degree (backbone)" }
    ]
  },
  {
    name: "weightKey",
    type: "text",
    label: "Weight field",
    description: "Numeric edge-data field used when Keep by = Weight."
  }
];

// src/editors/behaviours/edge-lod/mapping.ts
function optionsToForm40(o = {}) {
  return {
    minZoom: o.minZoom,
    keepFraction: o.keepFraction,
    keepBy: o.keepBy,
    weightKey: o.weightKey
  };
}
function formToOptions40(f) {
  const out = {};
  if (f.minZoom !== void 0) out.minZoom = f.minZoom;
  if (f.keepFraction !== void 0) out.keepFraction = f.keepFraction;
  if (f.keepBy !== void 0) out.keepBy = f.keepBy;
  if (f.weightKey !== void 0) out.weightKey = f.weightKey;
  return out;
}

// src/editors/behaviours/label-collision/fields.ts
var labelCollisionFields = [
  {
    name: "strategy",
    type: "select",
    label: "Strategy",
    description: "What to do with overlapping labels.",
    options: [{ value: "hide", label: "Hide" }]
  },
  {
    name: "prioritise",
    type: "select",
    label: "Prioritise by",
    description: "How labels are ranked when resolving overlaps.",
    options: [
      { value: "priority-field", label: "Priority field" },
      { value: "node-degree", label: "Node degree" }
    ]
  },
  {
    name: "flickerGuardMs",
    type: "number",
    label: "Flicker guard (ms)",
    min: 0,
    step: 10,
    description: "Minimum hold before a just-flipped label can flip back. Default 100."
  },
  {
    name: "groupNodes",
    type: "text",
    label: "Node group",
    description: 'Collision group name for node labels. Default "nodes".'
  },
  {
    name: "groupEdges",
    type: "text",
    label: "Edge group",
    description: 'Collision group name for edge labels. Default "edges".'
  }
];

// src/editors/behaviours/label-collision/mapping.ts
function optionsToForm41(o = {}) {
  return {
    strategy: o.strategy,
    prioritise: o.prioritise,
    flickerGuardMs: o.flickerGuardMs,
    groupNodes: o.groups?.nodes,
    groupEdges: o.groups?.edges
  };
}
function formToOptions41(f) {
  const out = {};
  if (f.strategy !== void 0) out.strategy = f.strategy;
  if (f.prioritise !== void 0) out.prioritise = f.prioritise;
  if (f.flickerGuardMs !== void 0) out.flickerGuardMs = f.flickerGuardMs;
  if (f.groupNodes || f.groupEdges) {
    out.groups = {};
    if (f.groupNodes) out.groups.nodes = f.groupNodes;
    if (f.groupEdges) out.groups.edges = f.groupEdges;
  }
  return out;
}

// src/editors/layouts/d3-force-layout/fields.ts
var withGroup8 = (group) => (f) => ({ ...f, group });
var SIMULATION_FIELDS = [
  {
    name: "animate",
    type: "boolean",
    label: "Animate",
    description: "Write positions every tick (live settle) vs. flush once when settled."
  },
  {
    name: "reheatAlpha",
    type: "number",
    label: "Reheat alpha",
    min: 0,
    max: 1,
    step: 0.01,
    description: "Alpha for incremental streaming adds (only with Animate off). Default 0.5."
  },
  { name: "alpha", type: "number", label: "Alpha", min: 0, max: 1, step: 0.01, description: "Initial simulation heat. d3 default 1." },
  { name: "alphaMin", type: "number", label: "Alpha min", min: 0, max: 1, step: 1e-3, description: "Stop threshold. d3 default 0.001." },
  { name: "alphaDecay", type: "number", label: "Alpha decay", min: 0, max: 1, step: 1e-3, description: "Cooling rate per tick. d3 default ~0.0228." },
  { name: "alphaTarget", type: "number", label: "Alpha target", min: 0, max: 1, step: 0.01, description: "Alpha the sim decays toward. d3 default 0." },
  { name: "velocityDecay", type: "number", label: "Velocity decay", min: 0, max: 1, step: 0.01, description: "Friction per tick. d3 default 0.4." }
];
var LINK_FIELDS = [
  { name: "linkDistance", type: "number", label: "Distance", min: 0, max: 2e3, step: 1, description: "Target distance between connected nodes." },
  { name: "linkStrength", type: "number", label: "Strength", min: 0, max: 2, step: 0.01, description: "How rigidly links hold their distance." },
  { name: "linkIterations", type: "number", label: "Iterations", min: 1, max: 20, step: 1, description: "Constraint-relaxation passes per tick." }
];
var CHARGE_FIELDS = [
  { name: "chargeStrength", type: "number", label: "Strength", min: -2e3, max: 2e3, step: 10, description: "n-body charge: negative repels, positive attracts." },
  { name: "chargeTheta", type: "number", label: "Theta", min: 0, max: 2, step: 0.1, description: "Barnes\u2013Hut accuracy threshold. d3 default 0.9." },
  { name: "chargeDistanceMin", type: "number", label: "Distance min", min: 0, max: 1e3, step: 1, description: "Minimum inter-node distance considered." },
  { name: "chargeDistanceMax", type: "number", label: "Distance max", min: 0, max: 1e5, step: 10, description: "Maximum inter-node distance considered." }
];
var CENTER_FIELDS = [
  { name: "centerX", type: "number", label: "Center X", min: -1e4, max: 1e4, step: 10, description: "Centroid target x." },
  { name: "centerY", type: "number", label: "Center Y", min: -1e4, max: 1e4, step: 10, description: "Centroid target y." },
  { name: "centerStrength", type: "number", label: "Strength", min: 0, max: 2, step: 0.01, description: "Recentring strength." }
];
var COLLIDE_FIELDS = [
  { name: "collideRadius", type: "number", label: "Radius", min: 0, max: 500, step: 1, description: "Collision radius (constant). Per-node functions are out of scope here." },
  { name: "collideStrength", type: "number", label: "Strength", min: 0, max: 1, step: 0.01, description: "Overlap-resolution strength in [0, 1]." },
  { name: "collideIterations", type: "number", label: "Iterations", min: 1, max: 20, step: 1, description: "Constraint-relaxation passes per tick." }
];
var CLUSTER_FIELDS = [
  { name: "clusterStrength", type: "number", label: "Strength", min: 0, max: 1, step: 0.01, description: "Pull `parentId` group members toward their centroid so group frames stay compact. Empty = off. Default 0.2." }
];
var SEPARATION_FIELDS = [
  { name: "separateGroups", type: "boolean", label: "Separate groups", description: "Push overlapping group frames apart (each group moves as one). Loose nodes inside another group's frame are pushed out too." },
  { name: "separateGroupsStrength", type: "number", label: "Strength", min: 0, max: 2, step: 0.05, description: "How hard overlapping frames are pushed apart. Empty = 0.8." },
  { name: "separateGroupsPadding", type: "number", label: "Gap", min: 0, max: 400, step: 4, description: "Extra space kept between frames, in world units. Empty = 24." }
];
var d3ForceLayoutFields = [
  ...SIMULATION_FIELDS.map(withGroup8("Simulation")),
  ...LINK_FIELDS.map(withGroup8("Link force")),
  ...CHARGE_FIELDS.map(withGroup8("Charge force")),
  ...CENTER_FIELDS.map(withGroup8("Center force")),
  ...COLLIDE_FIELDS.map(withGroup8("Collide force")),
  ...CLUSTER_FIELDS.map(withGroup8("Group cluster")),
  ...SEPARATION_FIELDS.map(withGroup8("Group separation"))
];

// src/editors/layouts/d3-force-layout/mapping.ts
function optionsToForm42(o = {}) {
  return {
    animate: o.animate,
    reheatAlpha: o.reheatAlpha,
    alpha: o.alpha,
    alphaMin: o.alphaMin,
    alphaDecay: o.alphaDecay,
    alphaTarget: o.alphaTarget,
    velocityDecay: o.velocityDecay,
    linkDistance: o.link?.distance,
    linkStrength: o.link?.strength,
    linkIterations: o.link?.iterations,
    chargeStrength: o.charge?.strength,
    chargeTheta: o.charge?.theta,
    chargeDistanceMin: o.charge?.distanceMin,
    chargeDistanceMax: o.charge?.distanceMax,
    centerX: o.center?.x,
    centerY: o.center?.y,
    centerStrength: o.center?.strength,
    collideRadius: typeof o.collide?.radius === "number" ? o.collide.radius : void 0,
    collideStrength: o.collide?.strength,
    collideIterations: o.collide?.iterations,
    clusterStrength: o.cluster?.strength,
    separateGroups: o.separateGroups !== void 0,
    separateGroupsStrength: o.separateGroups?.strength,
    separateGroupsPadding: o.separateGroups?.padding
  };
}
function formToOptions42(f) {
  const out = {};
  if (f.animate !== void 0) out.animate = f.animate;
  if (f.reheatAlpha !== void 0) out.reheatAlpha = f.reheatAlpha;
  if (f.alpha !== void 0) out.alpha = f.alpha;
  if (f.alphaMin !== void 0) out.alphaMin = f.alphaMin;
  if (f.alphaDecay !== void 0) out.alphaDecay = f.alphaDecay;
  if (f.alphaTarget !== void 0) out.alphaTarget = f.alphaTarget;
  if (f.velocityDecay !== void 0) out.velocityDecay = f.velocityDecay;
  if (f.linkDistance !== void 0 || f.linkStrength !== void 0 || f.linkIterations !== void 0) {
    out.link = {
      ...f.linkDistance !== void 0 ? { distance: f.linkDistance } : {},
      ...f.linkStrength !== void 0 ? { strength: f.linkStrength } : {},
      ...f.linkIterations !== void 0 ? { iterations: f.linkIterations } : {}
    };
  }
  if (f.chargeStrength !== void 0 || f.chargeTheta !== void 0 || f.chargeDistanceMin !== void 0 || f.chargeDistanceMax !== void 0) {
    out.charge = {
      ...f.chargeStrength !== void 0 ? { strength: f.chargeStrength } : {},
      ...f.chargeTheta !== void 0 ? { theta: f.chargeTheta } : {},
      ...f.chargeDistanceMin !== void 0 ? { distanceMin: f.chargeDistanceMin } : {},
      ...f.chargeDistanceMax !== void 0 ? { distanceMax: f.chargeDistanceMax } : {}
    };
  }
  if (f.centerX !== void 0 || f.centerY !== void 0 || f.centerStrength !== void 0) {
    out.center = {
      ...f.centerX !== void 0 ? { x: f.centerX } : {},
      ...f.centerY !== void 0 ? { y: f.centerY } : {},
      ...f.centerStrength !== void 0 ? { strength: f.centerStrength } : {}
    };
  }
  if (f.collideRadius !== void 0 || f.collideStrength !== void 0 || f.collideIterations !== void 0) {
    out.collide = {
      ...f.collideRadius !== void 0 ? { radius: f.collideRadius } : {},
      ...f.collideStrength !== void 0 ? { strength: f.collideStrength } : {},
      ...f.collideIterations !== void 0 ? { iterations: f.collideIterations } : {}
    };
  }
  if (f.clusterStrength !== void 0) {
    out.cluster = { strength: f.clusterStrength };
  }
  if (f.separateGroups) {
    out.separateGroups = {
      ...f.separateGroupsStrength !== void 0 ? { strength: f.separateGroupsStrength } : {},
      ...f.separateGroupsPadding !== void 0 ? { padding: f.separateGroupsPadding } : {}
    };
  }
  return out;
}

// src/editors/layouts/elk-layout/fields.ts
var withGroup9 = (group) => (f) => ({ ...f, group });
var ALGORITHM_FIELD = {
  name: "algorithm",
  type: "select",
  label: "Algorithm",
  description: "ELK layout algorithm. `layered` (Sugiyama) is the default for directed graphs.",
  options: [
    { value: "layered", label: "Layered (Sugiyama)" },
    { value: "mrtree", label: "Tree (mrtree)" },
    { value: "radial", label: "Radial" },
    { value: "force", label: "Force" },
    { value: "stress", label: "Stress" },
    { value: "disco", label: "Disconnected packing" },
    { value: "box", label: "Box packing" },
    { value: "rectpacking", label: "Rect packing" },
    { value: "random", label: "Random" },
    { value: "fixed", label: "Fixed" }
  ]
};
var DIRECTION_FIELD = {
  name: "direction",
  type: "select",
  label: "Direction",
  description: "Primary layout axis. Respected by `layered`, `mrtree`, \u2026",
  options: [
    { value: "RIGHT", label: "Right" },
    { value: "LEFT", label: "Left" },
    { value: "DOWN", label: "Down" },
    { value: "UP", label: "Up" }
  ]
};
var LAYER_SPACING_FIELD = {
  name: "layerSpacing",
  type: "number",
  label: "Layer spacing",
  min: 0,
  max: 1e3,
  step: 1,
  description: "Gap between consecutive layers (layered algorithm only)."
};
var NODE_SPACING_FIELD = {
  name: "nodeSpacing",
  type: "number",
  label: "Node spacing",
  min: 0,
  max: 1e3,
  step: 1,
  description: "Minimum gap between sibling nodes."
};
var OTHER_SPACING_FIELDS = [
  { name: "edgeNodeSpacing", type: "number", label: "Edge\u2013node spacing", min: 0, max: 1e3, step: 1, description: "Gap between an edge and a node." },
  { name: "edgeSpacing", type: "number", label: "Edge spacing", min: 0, max: 1e3, step: 1, description: "Gap between parallel edges." },
  { name: "padding", type: "number", label: "Padding", min: 0, max: 1e3, step: 1, description: "Symmetric graph-level padding." }
];
var EDGE_FIELDS = [
  {
    name: "edgeRouting",
    type: "select",
    label: "Edge routing",
    description: "Node-avoiding edge geometry written back as waypoints. `ORTHOGONAL` suits layered graphs.",
    options: [
      { value: "ORTHOGONAL", label: "Orthogonal" },
      { value: "POLYLINE", label: "Polyline" },
      { value: "SPLINES", label: "Splines" }
    ]
  }
];
var NODE_SIZE_FIELDS = [
  { name: "defaultNodeWidth", type: "number", label: "Default node width", min: 1, max: 1e3, step: 1, description: "Fallback width when a node has no resolvable shape. Default 40." },
  { name: "defaultNodeHeight", type: "number", label: "Default node height", min: 1, max: 1e3, step: 1, description: "Fallback height when a node has no resolvable shape. Default 40." }
];
var GROUP_FIELDS = [
  { name: "includeGroups", type: "boolean", label: "Nest groups", description: "Default on. Groups become nested containers with their members packed inside the frame; plain parent/child trees are unaffected." }
];
var TRANSITION_FIELDS = [
  { name: "transition", type: "boolean", label: "Animate", description: "Glide nodes to their new positions instead of snapping." },
  { name: "transitionEase", type: "text", label: "Ease", placeholder: "e.g. cubic-in-out" }
];
function elkLayoutFields(values = {}) {
  const spacing = values.algorithm === "layered" ? [NODE_SPACING_FIELD, LAYER_SPACING_FIELD, ...OTHER_SPACING_FIELDS] : [NODE_SPACING_FIELD, ...OTHER_SPACING_FIELDS];
  return [
    ...[ALGORITHM_FIELD, DIRECTION_FIELD].map(withGroup9("Algorithm")),
    ...spacing.map(withGroup9("Spacing")),
    ...EDGE_FIELDS.map(withGroup9("Edges")),
    ...NODE_SIZE_FIELDS.map(withGroup9("Node size")),
    ...GROUP_FIELDS.map(withGroup9("Groups")),
    ...TRANSITION_FIELDS.map(withGroup9("Transition"))
  ];
}

// src/editors/layouts/elk-layout/mapping.ts
function optionsToForm43(o = {}) {
  return {
    algorithm: o.algorithm,
    direction: o.direction,
    nodeSpacing: o.nodeSpacing,
    layerSpacing: o.layerSpacing,
    edgeNodeSpacing: o.edgeNodeSpacing,
    edgeSpacing: o.edgeSpacing,
    edgeRouting: o.edgeRouting,
    padding: typeof o.padding === "number" ? o.padding : void 0,
    defaultNodeWidth: o.defaultNodeSize?.width,
    defaultNodeHeight: o.defaultNodeSize?.height,
    // Defaults to on in the layout, so an untouched config must show checked —
    // `undefined` would render the toggle off and misreport what ELK will do.
    includeGroups: o.includeGroups ?? true,
    transition: o.transition,
    transitionEase: o.transitionEase
  };
}
function formToOptions43(f) {
  const out = {};
  if (f.algorithm !== void 0) out.algorithm = f.algorithm;
  if (f.direction !== void 0) out.direction = f.direction;
  if (f.nodeSpacing !== void 0) out.nodeSpacing = f.nodeSpacing;
  if (f.layerSpacing !== void 0) out.layerSpacing = f.layerSpacing;
  if (f.edgeNodeSpacing !== void 0) out.edgeNodeSpacing = f.edgeNodeSpacing;
  if (f.edgeSpacing !== void 0) out.edgeSpacing = f.edgeSpacing;
  if (f.edgeRouting !== void 0) out.edgeRouting = f.edgeRouting;
  if (f.padding !== void 0) out.padding = f.padding;
  if (f.includeGroups !== void 0) out.includeGroups = f.includeGroups;
  if (f.transition !== void 0) out.transition = f.transition;
  if (f.transitionEase) out.transitionEase = f.transitionEase;
  if (f.defaultNodeWidth !== void 0 || f.defaultNodeHeight !== void 0) {
    out.defaultNodeSize = {
      ...f.defaultNodeWidth !== void 0 ? { width: f.defaultNodeWidth } : {},
      ...f.defaultNodeHeight !== void 0 ? { height: f.defaultNodeHeight } : {}
    };
  }
  return out;
}

// src/editors/layouts/d3-hierarchy-layout/fields.ts
var withGroup10 = (group) => (f) => ({ ...f, group });
var MODE_FIELD = {
  name: "mode",
  type: "select",
  label: "Mode",
  description: "Hierarchy layout family. Default `radial-tree`.",
  options: [
    { value: "tree", label: "Tree" },
    { value: "cluster", label: "Cluster" },
    { value: "radial-tree", label: "Radial tree" },
    { value: "radial-cluster", label: "Radial cluster" },
    { value: "pack", label: "Pack" },
    { value: "sunburst", label: "Sunburst" }
  ]
};
var ROOT_FIELD = {
  name: "rootId",
  type: "text",
  label: "Root id",
  placeholder: "auto-detected",
  description: "Explicit tree root. Auto-detected (unique node with no parent) when blank."
};
var ORIENTATION_FIELD = {
  name: "orientation",
  type: "select",
  label: "Orientation",
  description: "Cartesian depth axis. Default `vertical`.",
  options: [
    { value: "vertical", label: "Vertical" },
    { value: "horizontal", label: "Horizontal" }
  ]
};
var SIZE_FIELDS = [
  { name: "sizeWidth", type: "number", label: "Size width", min: 0, max: 2e4, step: 10, description: "Cartesian layout width. Default 640 (with height)." },
  { name: "sizeHeight", type: "number", label: "Size height", min: 0, max: 2e4, step: 10, description: "Cartesian layout height. Default 480 (with width)." },
  { name: "nodeSizeX", type: "number", label: "Node size X", min: 0, max: 5e3, step: 1, description: "Per-node horizontal spacing. Mutually exclusive with Size." },
  { name: "nodeSizeY", type: "number", label: "Node size Y", min: 0, max: 5e3, step: 1, description: "Per-node vertical spacing. Mutually exclusive with Size." }
];
var RADIUS_FIELD = {
  name: "radius",
  type: "number",
  label: "Radius",
  min: 0,
  max: 1e4,
  step: 10,
  description: "Polar radius for radial modes. Default 400."
};
var PADDING_FIELD = {
  name: "padding",
  type: "number",
  label: "Padding",
  min: 0,
  max: 500,
  step: 1,
  description: "Pack-only: padding between sibling circles. Default 0."
};
var POSITION_FIELDS = [
  { name: "centerX", type: "number", label: "Center X", min: -1e4, max: 1e4, step: 10 },
  { name: "centerY", type: "number", label: "Center Y", min: -1e4, max: 1e4, step: 10 }
];
var TRANSITION_FIELDS2 = [
  { name: "transition", type: "boolean", label: "Animate", description: "Glide nodes to their new positions (ignored for pack / sunburst)." },
  { name: "transitionEase", type: "text", label: "Ease", placeholder: "e.g. cubic-in-out" }
];
var isCartesian = (mode) => mode === "tree" || mode === "cluster";
var isRadial = (mode) => mode === "radial-tree" || mode === "radial-cluster";
var GROUP_FIELDS2 = [
  {
    name: "includeGroups",
    type: "boolean",
    label: "Nest groups",
    description: "Lay each group out as its own subtree, then place the whole group as one box. Each group must contain a single subtree."
  }
];
function modeFields(mode) {
  if (isCartesian(mode)) return [ORIENTATION_FIELD, ...SIZE_FIELDS];
  if (isRadial(mode)) return [RADIUS_FIELD];
  if (mode === "pack") return [PADDING_FIELD];
  return [];
}
function d3HierarchyLayoutFields(values = {}) {
  return [
    ...[MODE_FIELD, ROOT_FIELD, ...modeFields(values.mode)].map(withGroup10("Layout")),
    ...POSITION_FIELDS.map(withGroup10("Position")),
    ...values.mode === "pack" || values.mode === "sunburst" ? [] : GROUP_FIELDS2.map(withGroup10("Groups")),
    ...TRANSITION_FIELDS2.map(withGroup10("Transition"))
  ];
}

// src/editors/layouts/d3-hierarchy-layout/mapping.ts
function optionsToForm44(o = {}) {
  return {
    mode: o.mode,
    rootId: o.rootId,
    sizeWidth: o.size?.[0],
    sizeHeight: o.size?.[1],
    nodeSizeX: o.nodeSize?.[0],
    nodeSizeY: o.nodeSize?.[1],
    radius: o.radius,
    orientation: o.orientation,
    centerX: o.center?.x,
    centerY: o.center?.y,
    padding: o.padding,
    includeGroups: o.includeGroups,
    transition: o.transition,
    transitionEase: o.transitionEase
  };
}
function formToOptions44(f) {
  const out = {};
  if (f.mode !== void 0) out.mode = f.mode;
  if (f.rootId) out.rootId = f.rootId;
  if (f.radius !== void 0) out.radius = f.radius;
  if (f.orientation !== void 0) out.orientation = f.orientation;
  if (f.padding !== void 0) out.padding = f.padding;
  if (f.includeGroups !== void 0) out.includeGroups = f.includeGroups;
  if (f.transition !== void 0) out.transition = f.transition;
  if (f.transitionEase) out.transitionEase = f.transitionEase;
  if (f.sizeWidth !== void 0 && f.sizeHeight !== void 0) {
    out.size = [f.sizeWidth, f.sizeHeight];
  }
  if (f.nodeSizeX !== void 0 && f.nodeSizeY !== void 0) {
    out.nodeSize = [f.nodeSizeX, f.nodeSizeY];
  }
  if (f.centerX !== void 0 || f.centerY !== void 0) {
    out.center = {
      ...f.centerX !== void 0 ? { x: f.centerX } : {},
      ...f.centerY !== void 0 ? { y: f.centerY } : {}
    };
  }
  return out;
}

// src/editors/layouts/d3-sankey-layout/fields.ts
var withGroup11 = (group) => (f) => ({ ...f, group });
var LAYOUT_FIELDS3 = [
  {
    name: "nodeAlign",
    type: "select",
    label: "Node align",
    description: "Column-alignment strategy. Default `justify` (sources left, sinks right).",
    options: [
      { value: "justify", label: "Justify" },
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
      { value: "center", label: "Center" }
    ]
  },
  { name: "nodeWidth", type: "number", label: "Node width", min: 1, max: 500, step: 1, description: "Column rectangle width. Default 24." },
  { name: "nodePadding", type: "number", label: "Node padding", min: 0, max: 200, step: 1, description: "Vertical gap between nodes in a column. Default 8." },
  { name: "iterations", type: "number", label: "Iterations", min: 1, max: 100, step: 1, description: "Relaxation passes. More = tighter, slower. Default 6." },
  { name: "sizeWidth", type: "number", label: "Size width", min: 0, max: 2e4, step: 10, description: "Viewport width the layout fills. Default 1000 (with height)." },
  { name: "sizeHeight", type: "number", label: "Size height", min: 0, max: 2e4, step: 10, description: "Viewport height the layout fills. Default 600 (with width)." }
];
var POSITION_FIELDS2 = [
  { name: "centerX", type: "number", label: "Center X", min: -1e4, max: 1e4, step: 10 },
  { name: "centerY", type: "number", label: "Center Y", min: -1e4, max: 1e4, step: 10 }
];
var d3SankeyLayoutFields = [
  ...LAYOUT_FIELDS3.map(withGroup11("Layout")),
  ...POSITION_FIELDS2.map(withGroup11("Position"))
];

// src/editors/layouts/d3-sankey-layout/mapping.ts
function optionsToForm45(o = {}) {
  return {
    sizeWidth: o.size?.[0],
    sizeHeight: o.size?.[1],
    nodeWidth: o.nodeWidth,
    nodePadding: o.nodePadding,
    iterations: o.iterations,
    nodeAlign: o.nodeAlign,
    centerX: o.center?.x,
    centerY: o.center?.y
  };
}
function formToOptions45(f) {
  const out = {};
  if (f.nodeWidth !== void 0) out.nodeWidth = f.nodeWidth;
  if (f.nodePadding !== void 0) out.nodePadding = f.nodePadding;
  if (f.iterations !== void 0) out.iterations = f.iterations;
  if (f.nodeAlign !== void 0) out.nodeAlign = f.nodeAlign;
  if (f.sizeWidth !== void 0 && f.sizeHeight !== void 0) {
    out.size = [f.sizeWidth, f.sizeHeight];
  }
  if (f.centerX !== void 0 || f.centerY !== void 0) {
    out.center = {
      ...f.centerX !== void 0 ? { x: f.centerX } : {},
      ...f.centerY !== void 0 ? { y: f.centerY } : {}
    };
  }
  return out;
}

// src/editors/layouts/geometric-layout/fields.ts
var MODE_FIELD2 = {
  name: "mode",
  type: "select",
  label: "Mode",
  options: [
    { value: "grid", label: "Grid" },
    { value: "snake", label: "Snake" },
    { value: "circular", label: "Circular" }
  ]
};
var GRID_FIELDS = [
  { name: "columns", type: "number", label: "Columns", min: 1, max: 200, step: 1, description: "Default \u2308\u221An\u2309 (a square-ish block)." },
  { name: "columnGap", type: "number", label: "Column gap", min: 0, max: 500, step: 1 },
  { name: "rowGap", type: "number", label: "Row gap", min: 0, max: 500, step: 1 }
];
var CIRCULAR_FIELDS = [
  { name: "radius", type: "number", label: "Radius", min: 0, max: 5e3, step: 10, description: "Default: auto from node count + spacing." },
  { name: "nodeSpacing", type: "number", label: "Node spacing", min: 1, max: 500, step: 1, description: "Arc spacing used to auto-derive radius." },
  { name: "startAngle", type: "number", label: "Start angle", min: -6.2832, max: 6.2832, step: 0.0873, description: "First node angle, in radians. Default -\u03C0/2 (12 o\u2019clock)." },
  { name: "clockwise", type: "boolean", label: "Clockwise" }
];
var POSITION_FIELDS3 = [
  { name: "centerX", type: "number", label: "Center X", min: -1e4, max: 1e4, step: 10 },
  { name: "centerY", type: "number", label: "Center Y", min: -1e4, max: 1e4, step: 10 }
];
var GROUP_FIELDS3 = [
  {
    name: "includeGroups",
    type: "boolean",
    label: "Nest groups",
    description: "Lay each group out among its own members, then place the whole group as one box."
  }
];
var TRANSITION_FIELDS3 = [
  { name: "transition", type: "boolean", label: "Animate", description: "Glide nodes to their new positions instead of snapping." },
  { name: "transitionEase", type: "text", label: "Ease", placeholder: "e.g. cubic-in-out" }
];
var withGroup12 = (group) => (f) => ({ ...f, group });
function modeFields2(mode) {
  const perMode = mode === "circular" ? CIRCULAR_FIELDS : GRID_FIELDS;
  return [MODE_FIELD2, ...perMode];
}
function geometricLayoutFields(values = {}) {
  return [
    ...modeFields2(values.mode).map(withGroup12("Layout")),
    ...POSITION_FIELDS3.map(withGroup12("Position")),
    ...GROUP_FIELDS3.map(withGroup12("Groups")),
    ...TRANSITION_FIELDS3.map(withGroup12("Transition"))
  ];
}

// src/editors/layouts/geometric-layout/mapping.ts
function optionsToForm46(o = {}) {
  return {
    mode: o.mode,
    columns: o.columns,
    columnGap: o.columnGap,
    rowGap: o.rowGap,
    radius: o.radius,
    nodeSpacing: o.nodeSpacing,
    startAngle: o.startAngle,
    clockwise: o.clockwise,
    centerX: o.center?.x,
    centerY: o.center?.y,
    includeGroups: o.includeGroups,
    transition: o.transition,
    transitionEase: o.transitionEase
  };
}
function formToOptions46(f) {
  const out = {};
  if (f.mode !== void 0) out.mode = f.mode;
  if (f.columns !== void 0) out.columns = f.columns;
  if (f.columnGap !== void 0) out.columnGap = f.columnGap;
  if (f.rowGap !== void 0) out.rowGap = f.rowGap;
  if (f.radius !== void 0) out.radius = f.radius;
  if (f.nodeSpacing !== void 0) out.nodeSpacing = f.nodeSpacing;
  if (f.startAngle !== void 0) out.startAngle = f.startAngle;
  if (f.clockwise !== void 0) out.clockwise = f.clockwise;
  if (f.includeGroups !== void 0) out.includeGroups = f.includeGroups;
  if (f.transition !== void 0) out.transition = f.transition;
  if (f.transitionEase) out.transitionEase = f.transitionEase;
  if (f.centerX !== void 0 || f.centerY !== void 0) {
    out.center = {
      ...f.centerX !== void 0 ? { x: f.centerX } : {},
      ...f.centerY !== void 0 ? { y: f.centerY } : {}
    };
  }
  return out;
}

// src/editor-panels/canvas-settings/registry.ts
var DEFAULT_CANVAS_SETTINGS_SCHEMAS = {
  // Layers
  "background-layer": { section: "layers", typeLabel: "Background Layer", fields: backgroundLayerFields, toForm: optionsToForm, toOptions: formToOptions },
  "dev-info-layer": { section: "layers", typeLabel: "Dev Info Layer", fields: devInfoLayerFields, toForm: optionsToForm2, toOptions: formToOptions2 },
  "minimap-layer": { section: "layers", typeLabel: "Mini-map Layer", fields: miniMapLayerFields, toForm: optionsToForm3, toOptions: formToOptions3 },
  "graph-legend-layer": { section: "layers", typeLabel: "Graph Legend Layer", fields: graphLegendLayerFields, toForm: optionsToForm4, toOptions: formToOptions4 },
  "density-contour-fill-layer": { section: "layers", typeLabel: "Density Contour Fill", fields: densityContourFillLayerFields, toForm: optionsToForm5, toOptions: formToOptions5 },
  "density-contour-stroke-layer": { section: "layers", typeLabel: "Density Contour Stroke", fields: densityContourStrokeLayerFields, toForm: optionsToForm6, toOptions: formToOptions6 },
  "bubble-sets-layer": { section: "layers", typeLabel: "Bubble Sets Layer", fields: bubbleSetsLayerFields, toForm: optionsToForm7, toOptions: formToOptions7 },
  "map-layer": { section: "layers", typeLabel: "Map Layer", fields: mapLayerFields, toForm: optionsToForm8, toOptions: formToOptions8 },
  // Behaviours
  "drag-pan": { section: "behaviours", typeLabel: "Drag Pan", fields: dragPanFields, toForm: optionsToForm9, toOptions: formToOptions9 },
  "pinch-zoom": { section: "behaviours", typeLabel: "Pinch Zoom", fields: pinchZoomFields, toForm: optionsToForm10, toOptions: formToOptions10 },
  "keyboard-camera": { section: "behaviours", typeLabel: "Keyboard Camera", fields: keyboardCameraFields, toForm: optionsToForm11, toOptions: formToOptions11 },
  "keyboard-shortcuts": { section: "behaviours", typeLabel: "Keyboard Shortcuts", fields: keyboardShortcutsFields, toForm: optionsToForm12, toOptions: formToOptions12 },
  "wheel-zoom": { section: "behaviours", typeLabel: "Wheel Zoom", fields: wheelZoomFields, toForm: optionsToForm13, toOptions: formToOptions13 },
  "drag-shape": { section: "behaviours", typeLabel: "Drag Shape", fields: dragShapeFields, toForm: optionsToForm14, toOptions: formToOptions14 },
  "drag-node": { section: "behaviours", typeLabel: "Drag Node", fields: dragNodeFields, toForm: optionsToForm15, toOptions: formToOptions15 },
  "hover-activate": { section: "behaviours", typeLabel: "Hover Activate", fields: hoverActivateFields, toForm: optionsToForm16, toOptions: formToOptions16 },
  "click-select": { section: "behaviours", typeLabel: "Click Select", fields: clickSelectFields, toForm: optionsToForm17, toOptions: formToOptions17 },
  "click-inspect": { section: "behaviours", typeLabel: "Click Inspect", fields: clickInspectFields, toForm: optionsToForm18, toOptions: formToOptions18 },
  focus: { section: "behaviours", typeLabel: "Focus", fields: focusFields, toForm: optionsToForm19, toOptions: formToOptions19 },
  "click-view": { section: "behaviours", typeLabel: "Click View", fields: clickViewFields, toForm: optionsToForm20, toOptions: formToOptions20 },
  "hover-element-preview": { section: "behaviours", typeLabel: "Hover Preview", fields: hoverElementPreviewFields, toForm: optionsToForm21, toOptions: formToOptions21 },
  "brush-select": { section: "behaviours", typeLabel: "Brush Select", fields: brushSelectFields, toForm: optionsToForm22, toOptions: formToOptions22 },
  "lasso-select": { section: "behaviours", typeLabel: "Lasso Select", fields: lassoSelectFields, toForm: optionsToForm23, toOptions: formToOptions23 },
  "create-node": { section: "behaviours", typeLabel: "Create Node", fields: createNodeFields, toForm: optionsToForm24, toOptions: formToOptions24 },
  "draw-edge": { section: "behaviours", typeLabel: "Draw Edge", fields: drawEdgeFields, toForm: optionsToForm25, toOptions: formToOptions25 },
  "erase": { section: "behaviours", typeLabel: "Erase", fields: eraseFields, toForm: optionsToForm26, toOptions: formToOptions26 },
  "node-resize": { section: "behaviours", typeLabel: "Node Resize", fields: nodeResizeFields, toForm: optionsToForm27, toOptions: formToOptions27 },
  "collapse-expand": { section: "behaviours", typeLabel: "Collapse / Expand", fields: collapseExpandFields, toForm: optionsToForm28, toOptions: formToOptions28 },
  "color-by": { section: "behaviours", typeLabel: "Color by", fields: colorByFields, toForm: optionsToForm29, toOptions: formToOptions29 },
  "theme": { section: "behaviours", typeLabel: "Theme", fields: themeFields, toForm: optionsToForm30, toOptions: formToOptions30 },
  "degree-size": { section: "behaviours", typeLabel: "Degree Size", fields: nodeCentralityFields, toForm: optionsToForm32, toOptions: formToOptions32 },
  "fisheye": { section: "behaviours", typeLabel: "Fisheye Lens", fields: fisheyeFields, toForm: optionsToForm31, toOptions: formToOptions31 },
  "context-menu": { section: "behaviours", typeLabel: "Context Menu", fields: contextMenuFields, toForm: optionsToForm33, toOptions: formToOptions33 },
  "label-resolution-lod": { section: "behaviours", typeLabel: "Label Resolution LOD", fields: textResolutionLodFields, toForm: optionsToForm34, toOptions: formToOptions34 },
  "node-size-lod": { section: "behaviours", typeLabel: "Node Size LOD", fields: nodeScaleLodFields, toForm: optionsToForm35, toOptions: formToOptions35 },
  "edge-size-lod": { section: "behaviours", typeLabel: "Edge Size LOD", fields: edgeScaleLodFields, toForm: optionsToForm36, toOptions: formToOptions36 },
  "node-label-lod": { section: "behaviours", typeLabel: "Node Label LOD", fields: nodeLabelLODFields, toForm: labelLodOptionsToForm, toOptions: labelLodFormToOptions },
  "edge-label-lod": { section: "behaviours", typeLabel: "Edge Label LOD", fields: edgeLabelLODFields, toForm: labelLodOptionsToForm, toOptions: labelLodFormToOptions },
  "icon-lod": { section: "behaviours", typeLabel: "Icon LOD", fields: contentLODFields, toForm: optionsToForm39, toOptions: formToOptions39 },
  "image-lod": { section: "behaviours", typeLabel: "Image LOD", fields: contentLODFields, toForm: optionsToForm39, toOptions: formToOptions39 },
  "edge-lod": { section: "behaviours", typeLabel: "Edge Thinning LOD", fields: edgeLODFields, toForm: optionsToForm40, toOptions: formToOptions40 },
  "parallel-edge": { section: "behaviours", typeLabel: "Parallel Edge", fields: parallelEdgeFields, toForm: optionsToForm37, toOptions: formToOptions37 },
  "label-collision": { section: "behaviours", typeLabel: "Label Collision", fields: labelCollisionFields, toForm: optionsToForm41, toOptions: formToOptions41 },
  "entrance": { section: "behaviours", typeLabel: "Entrance", fields: entranceFields, toForm: optionsToForm38, toOptions: formToOptions38 },
  // Layouts
  "d3-force-layout": { section: "layouts", typeLabel: "D3 Force", fields: d3ForceLayoutFields, toForm: optionsToForm42, toOptions: formToOptions42 },
  "elk-layout": { section: "layouts", typeLabel: "ELK", fields: elkLayoutFields, toForm: optionsToForm43, toOptions: formToOptions43 },
  "d3-hierarchy-layout": { section: "layouts", typeLabel: "D3 Hierarchy", fields: d3HierarchyLayoutFields, toForm: optionsToForm44, toOptions: formToOptions44 },
  "d3-sankey-layout": { section: "layouts", typeLabel: "D3 Sankey", fields: d3SankeyLayoutFields, toForm: optionsToForm45, toOptions: formToOptions45 },
  "geometric-layout": { section: "layouts", typeLabel: "Geometric", fields: geometricLayoutFields, toForm: optionsToForm46, toOptions: formToOptions46 }
};
var selectDefinition = (s) => s.definition;
function readOptions(instance) {
  const getOptions = instance.getOptions;
  if (typeof getOptions === "function") {
    const opts = getOptions.call(instance);
    if (opts && typeof opts === "object") return { ...opts };
  }
  const options = instance.options;
  if (options && typeof options === "object") return { ...options };
  return {};
}
var defaultResolveKind = (instance) => instance.kind ?? instance.constructor?.name;
var CONTROL_PANELS_LABEL = "Control panels";
var SECTIONS = [
  { id: "layers", label: "Layers" },
  { id: "behaviours", label: "Behaviours" },
  { id: "layouts", label: "Layouts" }
];
var CHEVRON_RIGHT = "[&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0";
function resolve(fields, values) {
  return typeof fields === "function" ? fields(values) : fields;
}
function instanceHaystack(instance, entry) {
  const parts = [instance.id, instance.typeLabel ?? entry?.typeLabel ?? instance.kind];
  for (const f of resolve(entry?.fields ?? [], {})) {
    parts.push(f.name, f.label ?? "", f.description ?? "", f.group ?? "");
    for (const o of f.options ?? []) parts.push(o.label, String(o.value));
  }
  return parts.join(" ").toLowerCase();
}
function deriveDefaults(fields) {
  const out = {};
  for (const f of fields) {
    if (f.defaultValue !== void 0) {
      out[f.name] = f.defaultValue;
      continue;
    }
    switch (f.type) {
      case "boolean":
      case "checkbox":
        out[f.name] = false;
        break;
      case "number":
        out[f.name] = f.min ?? 0;
        break;
      case "select":
      case "radio":
        out[f.name] = f.options?.[0]?.value ?? "";
        break;
      case "color":
        out[f.name] = f.presetColors?.[0]?.value ?? "#64748b";
        break;
      default:
        out[f.name] = "";
    }
  }
  return out;
}
function seedValues(entry, settings) {
  const base = deriveDefaults(resolve(entry.fields, {}));
  const mapped = entry.toForm(settings ?? {});
  for (const [k, v] of Object.entries(mapped)) if (v !== void 0) base[k] = v;
  return base;
}
function InstanceEditor({
  entry,
  instance,
  applyMode,
  onChange
}) {
  const initial = useMemo(() => seedValues(entry, instance.settings), [entry, instance.settings]);
  const form = useForm({ defaultValues: { opts: initial } });
  const values = form.watch("opts");
  const lastMappedRef = useRef(
    entry.toOptions(initial)
  );
  const emit = () => {
    const mapped = entry.toOptions(form.getValues("opts"));
    const last = lastMappedRef.current;
    const patch = {};
    for (const key of Object.keys(mapped)) {
      if (JSON.stringify(mapped[key]) !== JSON.stringify(last[key])) patch[key] = mapped[key];
    }
    lastMappedRef.current = mapped;
    if (Object.keys(patch).length > 0) onChange?.(patch);
  };
  const emitRef = useRef(emit);
  emitRef.current = emit;
  useEffect(() => {
    if (applyMode !== "live") return;
    const sub = form.watch((_v, { name }) => {
      if (!name) return;
      emitRef.current();
    });
    return () => sub.unsubscribe();
  }, [form, applyMode]);
  const fields = resolve(entry.fields, values ?? {}).map((f) => ({
    ...f,
    description: void 0,
    group: void 0
  }));
  if (fields.length === 0) {
    return /* @__PURE__ */ jsx("p", { className: "px-3 py-2 text-sm italic text-muted-foreground", children: "No settings for this instance." });
  }
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsx(
      SettingsPanel,
      {
        form,
        name: "opts",
        fields,
        labelPosition: "top",
        size: "sm",
        columns: 2,
        className: "border-0 bg-transparent shadow-none",
        contentClassName: "max-h-none overflow-visible p-3"
      }
    ),
    applyMode === "manual" && /* @__PURE__ */ jsx("div", { className: "flex justify-end px-3 pb-2", children: /* @__PURE__ */ jsx(Button, { size: "sm", onClick: emit, children: "Apply" }) })
  ] });
}
function CanvasSettingsEditorPanel({ canvas, className, ...rest }) {
  if (!canvas) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full items-center justify-center", className), children: /* @__PURE__ */ jsx("p", { className: "p-4 text-base text-muted-foreground", children: "Failed to load \u2014 no canvas." }) });
  }
  return /* @__PURE__ */ jsx(CanvasSettingsEditorPanelContent, { canvas, className, ...rest });
}
function CanvasSettingsEditorPanelContent({
  canvas,
  className,
  resolveKind = defaultResolveKind,
  schemas = DEFAULT_CANVAS_SETTINGS_SCHEMAS,
  applyMode = "live",
  title = "Canvas Settings",
  showControlPanels = true
}) {
  const config = useStore(canvas.store.view, selectDefinition);
  const update = useCallback((patch, action) => canvas.update(patch, action), [canvas]);
  const resolveKindRef = useRef(resolveKind);
  resolveKindRef.current = resolveKind;
  const [instances, setInstances] = useState({ layers: [], behaviours: [], layouts: [] });
  useEffect(() => {
    const map = (list) => list.map((i) => ({ id: i.id, kind: resolveKindRef.current(i), inst: i }));
    const read = () => setInstances({
      layers: map(canvas.layers.list()),
      behaviours: map(canvas.behaviours.list()),
      layouts: map(canvas.layouts.list())
    });
    read();
    const offs = [
      canvas.events.on("scene:layer:add", read),
      canvas.events.on("scene:layer:remove", read),
      canvas.events.on("scene:behaviour:register", read),
      canvas.events.on("scene:behaviour:unregister", read),
      canvas.events.on("scene:layout:add", read),
      canvas.events.on("scene:layout:remove", read)
    ];
    return () => {
      for (const off of offs) off();
    };
  }, [canvas]);
  const definition = useMemo(() => {
    const build = (list, bag, withEnabled) => list.map(({ id, kind, inst }) => {
      const stored = bag?.[id];
      return {
        id,
        kind: kind ?? inst.constructor.name,
        settings: { ...readOptions(inst), ...stored ?? {} },
        ...withEnabled ? {
          enabled: stored?.enabled ?? inst.enabled
        } : {}
      };
    });
    return {
      layers: build(instances.layers, config.layers, false),
      behaviours: build(instances.behaviours, config.behaviours, true),
      layouts: build(instances.layouts, config.layouts, false),
      activeLayoutId: config.activeLayout ?? void 0
    };
  }, [instances, config]);
  const applyChange = (section, id, patch) => update({ [section]: { [id]: patch } }, `edit:settings:${section}:${id}`);
  const applyToggle = (section, id, enabled) => update({ [section]: { [id]: { enabled } } }, `edit:settings:${section}:${id}:enabled`);
  const applyActiveLayout = (id) => update({ activeLayout: id }, "edit:settings:active-layout");
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const [openRows, setOpenRows] = useState({});
  const instancesBySection = {
    layers: definition.layers ?? [],
    behaviours: definition.behaviours ?? [],
    layouts: definition.layouts ?? []
  };
  const controlPanelsMatch = showControlPanels && (q === "" || CONTROL_PANELS_LABEL.toLowerCase().includes(q));
  const noMatches = q !== "" && !controlPanelsMatch && !SECTIONS.some(
    (s) => s.label.toLowerCase().includes(q) || instancesBySection[s.id].some(
      (inst) => instanceHaystack(inst, schemas[inst.kind]).includes(q)
    )
  );
  const renderSectionItems = (sectionId, items) => items.length === 0 ? /* @__PURE__ */ jsx("p", { className: "px-2 py-1 text-sm italic text-muted-foreground", children: "None registered" }) : (
    // One expandable instance per row, with a tree-style indentation guide line.
    /* @__PURE__ */ jsx("div", { className: "ml-2 border-l pl-2", children: /* @__PURE__ */ jsx(
      Accordion,
      {
        type: "multiple",
        value: openRows[sectionId] ?? [],
        onValueChange: (v) => setOpenRows((s) => ({ ...s, [sectionId]: v })),
        children: items.map((inst) => {
          const entry = schemas[inst.kind];
          const rowValue = `${sectionId}:${inst.id}`;
          const toggleable = sectionId !== "layouts" && inst.enabled !== void 0;
          const rowOff = toggleable && inst.enabled === false;
          const isActive = sectionId === "layouts" && inst.id === definition.activeLayoutId;
          return /* @__PURE__ */ jsxs(AccordionItem, { value: rowValue, className: "last:border-b-0", children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
              toggleable && /* @__PURE__ */ jsx(
                Switch,
                {
                  checked: inst.enabled !== false,
                  onCheckedChange: (v) => {
                    applyToggle(sectionId, inst.id, v);
                    if (!v)
                      setOpenRows((s) => ({
                        ...s,
                        [sectionId]: (s[sectionId] ?? []).filter((val) => val !== rowValue)
                      }));
                  },
                  "aria-label": `Toggle ${inst.id}`,
                  className: "ml-1 shrink-0"
                }
              ),
              /* @__PURE__ */ jsx("div", { className: "min-w-0 flex-1", children: /* @__PURE__ */ jsx(
                AccordionTrigger,
                {
                  disabled: rowOff,
                  className: cn("py-2 hover:no-underline", CHEVRON_RIGHT, rowOff && "opacity-50"),
                  children: /* @__PURE__ */ jsxs("span", { className: "flex min-w-0 items-center gap-2", children: [
                    /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: inst.id }),
                    /* @__PURE__ */ jsx("span", { className: "truncate text-sm text-muted-foreground", children: inst.typeLabel ?? entry?.typeLabel ?? inst.kind }),
                    isActive && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", children: "active" }),
                    !entry && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "px-1.5 py-0 text-[10px] opacity-60", children: "no editor" })
                  ] })
                }
              ) })
            ] }),
            /* @__PURE__ */ jsx(AccordionContent, { className: "p-0", children: /* @__PURE__ */ jsxs("div", { className: "ml-2 border-l pl-2", children: [
              sectionId === "layouts" && !isActive && /* @__PURE__ */ jsx("div", { className: "px-3 pt-2", children: /* @__PURE__ */ jsx(Button, { size: "sm", variant: "outline", onClick: () => applyActiveLayout(inst.id), children: "Make active" }) }),
              entry ? /* @__PURE__ */ jsx(
                InstanceEditor,
                {
                  entry,
                  instance: inst,
                  applyMode,
                  onChange: (patch) => applyChange(sectionId, inst.id, patch)
                }
              ) : /* @__PURE__ */ jsxs("p", { className: "px-3 py-2 text-sm italic text-muted-foreground", children: [
                "No settings editor registered for ",
                inst.kind,
                "."
              ] })
            ] }) })
          ] }, inst.id);
        })
      }
    ) })
  );
  const sections = SECTIONS.map((section) => {
    const sectionMatches = q !== "" && section.label.toLowerCase().includes(q);
    const items = instancesBySection[section.id].filter(
      (inst) => !q || sectionMatches || instanceHaystack(inst, schemas[inst.kind]).includes(q)
    );
    return { section, items };
  }).filter(({ items }) => !q || items.length > 0).map(({ section, items }) => ({
    id: section.id,
    title: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: [
      section.label,
      /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", children: instancesBySection[section.id].length })
    ] }),
    content: renderSectionItems(section.id, items)
  }));
  if (controlPanelsMatch) {
    sections.push({
      id: "controlPanels",
      title: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground", children: [
        CONTROL_PANELS_LABEL,
        /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", children: Object.keys(config.controlPanels ?? {}).length })
      ] }),
      content: /* @__PURE__ */ jsx(ControlPanelsEditor, { canvas })
    });
  }
  return (
    // `PanelStack` fills its parent's height, so the card is a full-height flex
    // column and the stack takes the remaining space under the title + search.
    /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full flex-col", className), children: /* @__PURE__ */ jsxs(CardContent, { className: "flex min-h-0 flex-1 flex-col gap-1 p-2", children: [
      title != null && /* @__PURE__ */ jsx("h2", { className: "px-1 py-1 text-base font-semibold", children: title }),
      /* @__PURE__ */ jsxs("div", { className: "relative mb-1 px-1", children: [
        /* @__PURE__ */ jsx(Search, { className: "pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: query,
            onChange: (e) => setQuery(e.target.value),
            placeholder: "Search settings\u2026",
            className: "h-8 pl-8"
          }
        )
      ] }),
      noMatches ? /* @__PURE__ */ jsxs("p", { className: "px-2 py-6 text-center text-base italic text-muted-foreground", children: [
        "No settings match \u201C",
        query.trim(),
        "\u201D."
      ] }) : (
        // Folders: Layers / Behaviours / Layouts — a resizable, collapsible stack.
        /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsx(PanelStack, { sections }) })
      )
    ] }) })
  );
}
function AdvancedSection({
  title = "Advanced settings",
  defaultOpen = false,
  children
}) {
  return /* @__PURE__ */ jsx(Accordion, { type: "single", collapsible: true, defaultValue: defaultOpen ? "advanced" : void 0, children: /* @__PURE__ */ jsxs(AccordionItem, { value: "advanced", className: "border-b-0", children: [
    /* @__PURE__ */ jsx(AccordionTrigger, { className: "py-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline", children: title }),
    /* @__PURE__ */ jsx(AccordionContent, { className: "p-0", children })
  ] }) });
}

// src/editor-panels/node-style/composite/fields.ts
var BODY_FILL_FIELD = {
  name: "fill",
  type: "color",
  label: "Card color",
  presetColors: [...COLOR_PRESETS]
};
var BODY_SIZE_FIELDS = [
  { name: "width", type: "number", label: "Width", min: 0, max: 1e3, step: 1 },
  { name: "height", type: "number", label: "Height", min: 0, max: 1e3, step: 1 },
  {
    name: "cornerRadius",
    type: "number",
    label: "Corner radius",
    min: 0,
    max: 200,
    step: 1,
    description: "Rounds the default rounded-rect body. Ignored when a Root shape is set."
  }
];
var BODY_PAINT_FIELDS = [
  { name: "fillAlpha", type: "number", label: "Fill alpha", min: 0, max: 1, step: 0.01 },
  { name: "strokeColor", type: "color", label: "Stroke color", presetColors: [...COLOR_PRESETS] },
  { name: "strokeWidth", type: "number", label: "Stroke width", min: 0, max: 50, step: 0.5 },
  { name: "strokeAlpha", type: "number", label: "Stroke alpha", min: 0, max: 1, step: 0.01 },
  {
    name: "clip",
    type: "boolean",
    label: "Clip parts to silhouette",
    description: "Edge-touching parts (accent bar, header) follow the rounded corners."
  }
];
var BODY_ADVANCED_FIELDS = [...BODY_SIZE_FIELDS, ...BODY_PAINT_FIELDS];
var BODY_FIELDS = [...BODY_SIZE_FIELDS, BODY_FILL_FIELD, ...BODY_PAINT_FIELDS];
var ROOT_KIND_FIELD = {
  name: "rootKind",
  type: "select",
  label: "Root shape",
  description: "Silhouette the card borrows. Body fill / stroke paint it.",
  options: [
    { value: "none", label: "(default rounded rect)" },
    { value: "rect", label: "Rectangle" },
    { value: "circle", label: "Circle" },
    { value: "regular-polygon", label: "Regular polygon" },
    { value: "star", label: "Star" }
  ]
};
var ROOT_GEOMETRY_BY_KIND = {
  none: [],
  rect: [
    { name: "rootWidth", type: "number", label: "Root width", min: 0, max: 1e3, step: 1 },
    { name: "rootHeight", type: "number", label: "Root height", min: 0, max: 1e3, step: 1 },
    { name: "rootCornerRadius", type: "number", label: "Root corner radius", min: 0, max: 200, step: 1 }
  ],
  circle: [{ name: "rootRadius", type: "number", label: "Root radius", min: 0, max: 500, step: 1 }],
  "regular-polygon": [
    { name: "rootSides", type: "number", label: "Sides", min: 3, max: 20, step: 1 },
    { name: "rootRadius", type: "number", label: "Root radius", min: 0, max: 500, step: 1 }
  ],
  star: [
    { name: "rootPoints", type: "number", label: "Points", min: 3, max: 20, step: 1 },
    { name: "rootInnerRadius", type: "number", label: "Inner radius", min: 0, max: 500, step: 1 },
    { name: "rootOuterRadius", type: "number", label: "Outer radius", min: 0, max: 500, step: 1 }
  ]
};
function rootFields(kind) {
  const geometry = kind ? ROOT_GEOMETRY_BY_KIND[kind] ?? [] : [];
  return [ROOT_KIND_FIELD, ...geometry];
}
var withGroup13 = (group) => (f) => ({ ...f, group });
function basicCompositeFields(_values = {}) {
  return [BODY_FILL_FIELD];
}
function advancedCompositeScalarFields(values = {}) {
  return [
    ...BODY_ADVANCED_FIELDS.map(withGroup13("Body")),
    ...rootFields(values.rootKind).map(withGroup13("Root"))
  ];
}
function compositeScalarFields(values = {}) {
  return [
    ...BODY_FIELDS.map(withGroup13("Body")),
    ...rootFields(values.rootKind).map(withGroup13("Root"))
  ];
}
var PART_KIND_FIELD = {
  name: "part",
  type: "select",
  label: "Part",
  options: [
    { value: "rect", label: "Rect" },
    { value: "circle", label: "Circle" },
    { value: "line", label: "Line" },
    { value: "label", label: "Label" },
    { value: "icon", label: "Icon" }
  ]
};
var POS_FIELDS = [
  { name: "x", type: "number", label: "X", step: 1 },
  { name: "y", type: "number", label: "Y", step: 1 }
];
var PART_FILL_FIELDS = [
  { name: "fill", type: "color", label: "Fill", presetColors: [...COLOR_PRESETS] },
  { name: "fillAlpha", type: "number", label: "Fill alpha", min: 0, max: 1, step: 0.01 }
];
var PART_STROKE_FIELDS = [
  { name: "strokeColor", type: "color", label: "Stroke", presetColors: [...COLOR_PRESETS] },
  { name: "strokeWidth", type: "number", label: "Stroke width", min: 0, max: 50, step: 0.5 },
  { name: "strokeAlpha", type: "number", label: "Stroke alpha", min: 0, max: 1, step: 0.01 }
];
var HIT_ID_FIELD = {
  name: "hitId",
  type: "text",
  label: "Hit id",
  placeholder: "(addressable sub-part)"
};
var LABEL_PART_FIELDS = [
  { name: "text", type: "text", label: "Text" },
  {
    name: "anchor",
    type: "select",
    label: "Anchor",
    options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" }
    ]
  },
  { name: "fontSize", type: "number", label: "Font size", min: 1, max: 200, step: 1 },
  { name: "fontWeight", type: "number", label: "Font weight", min: 100, max: 900, step: 100 },
  {
    name: "fontStyle",
    type: "select",
    label: "Font style",
    options: [
      { value: "normal", label: "Normal" },
      { value: "italic", label: "Italic" }
    ]
  },
  { name: "labelFill", type: "color", label: "Text color", presetColors: [...COLOR_PRESETS] },
  { name: "lineHeight", type: "number", label: "Line height", min: 0, max: 200, step: 1 },
  {
    name: "align",
    type: "select",
    label: "Align",
    options: [
      { value: "left", label: "Left" },
      { value: "center", label: "Center" },
      { value: "right", label: "Right" }
    ]
  },
  { name: "maxWidth", type: "number", label: "Max width", min: 0, max: 1e3, step: 1 },
  { name: "maxLines", type: "number", label: "Max lines", min: 1, max: 20, step: 1 },
  {
    name: "overflow",
    type: "select",
    label: "Overflow",
    options: [
      { value: "clip", label: "Clip" },
      { value: "ellipsis", label: "Ellipsis" }
    ]
  }
];
var ICON_PART_FIELDS = [
  { name: "size", type: "number", label: "Size", min: 0, max: 400, step: 1 },
  {
    name: "iconKind",
    type: "select",
    label: "Icon kind",
    options: [
      { value: "glyph", label: "Glyph (icon-font / emoji)" },
      { value: "svg-url", label: "SVG URL" }
    ]
  },
  { name: "iconChar", type: "text", label: "Glyph char", placeholder: "e.g. \u2605 or \\ue800" },
  { name: "iconUrl", type: "text", label: "SVG URL", placeholder: "https://\u2026/icon.svg" },
  { name: "iconColor", type: "color", label: "Icon color", presetColors: [...COLOR_PRESETS] },
  {
    name: "iconBackgroundFill",
    type: "color",
    label: "Chip background",
    presetColors: [...COLOR_PRESETS],
    description: "Optional coloured square behind the glyph (the type-tag look)."
  }
];
function partRowFields(kind) {
  switch (kind) {
    case "rect":
      return [
        PART_KIND_FIELD,
        ...POS_FIELDS,
        { name: "width", type: "number", label: "Width", min: 0, max: 1e3, step: 1 },
        { name: "height", type: "number", label: "Height", min: 0, max: 1e3, step: 1 },
        { name: "cornerRadius", type: "number", label: "Corner radius", min: 0, max: 200, step: 1 },
        ...PART_FILL_FIELDS,
        ...PART_STROKE_FIELDS,
        HIT_ID_FIELD
      ];
    case "circle":
      return [
        PART_KIND_FIELD,
        ...POS_FIELDS,
        { name: "radius", type: "number", label: "Radius", min: 0, max: 500, step: 1 },
        ...PART_FILL_FIELDS,
        ...PART_STROKE_FIELDS,
        HIT_ID_FIELD
      ];
    case "line":
      return [
        PART_KIND_FIELD,
        ...POS_FIELDS,
        { name: "x2", type: "number", label: "X2", step: 1 },
        { name: "y2", type: "number", label: "Y2", step: 1 },
        ...PART_STROKE_FIELDS
      ];
    case "icon":
      return [PART_KIND_FIELD, ...POS_FIELDS, ...ICON_PART_FIELDS, HIT_ID_FIELD];
    case "label":
      return [PART_KIND_FIELD, ...POS_FIELDS, ...LABEL_PART_FIELDS];
    default:
      return [PART_KIND_FIELD];
  }
}

// src/editor-panels/node-style/composite/mapping.ts
function colorToHex(v) {
  return typeof v === "number" ? numberToHex(v) : void 0;
}
function hexToColor(s) {
  return s && s.length > 0 ? hexToNumber(s) : void 0;
}
function strokeOf(color, width, alpha) {
  const c = hexToColor(color);
  if (c === void 0) return void 0;
  const out = { color: c };
  if (width !== void 0) out.width = width;
  if (alpha !== void 0) out.alpha = alpha;
  return out;
}
function rootPaint(f) {
  const out = {};
  const fill = hexToColor(f.fill);
  if (fill !== void 0) out.fill = fill;
  const stroke = strokeOf(f.strokeColor, f.strokeWidth, f.strokeAlpha);
  if (stroke) out.stroke = stroke;
  return out;
}
function rootToForm(root) {
  if (!root) return { rootKind: "none" };
  switch (root.kind) {
    case "rect":
      return {
        rootKind: "rect",
        rootWidth: root.width,
        rootHeight: root.height,
        rootCornerRadius: root.cornerRadius
      };
    case "circle":
      return { rootKind: "circle", rootRadius: root.radius };
    case "regular-polygon":
      return { rootKind: "regular-polygon", rootSides: root.sides, rootRadius: root.radius };
    case "star":
      return {
        rootKind: "star",
        rootPoints: root.points,
        rootInnerRadius: root.innerRadius,
        rootOuterRadius: root.outerRadius
      };
    default:
      return { rootKind: "none" };
  }
}
function buildRoot(f) {
  const paint = rootPaint(f);
  const origin = { x: 0, y: 0 };
  switch (f.rootKind) {
    case "rect":
      return {
        kind: "rect",
        ...origin,
        width: f.rootWidth ?? f.width ?? 160,
        height: f.rootHeight ?? f.height ?? 96,
        ...f.rootCornerRadius != null ? { cornerRadius: f.rootCornerRadius } : {},
        ...paint
      };
    case "circle":
      return { kind: "circle", ...origin, radius: f.rootRadius ?? 48, ...paint };
    case "regular-polygon":
      return {
        kind: "regular-polygon",
        ...origin,
        sides: f.rootSides ?? 6,
        radius: f.rootRadius ?? 48,
        ...paint
      };
    case "star":
      return {
        kind: "star",
        ...origin,
        points: f.rootPoints ?? 5,
        innerRadius: f.rootInnerRadius ?? 24,
        outerRadius: f.rootOuterRadius ?? 48,
        ...paint
      };
    default:
      return void 0;
  }
}
function partToRow(p) {
  switch (p.part) {
    case "rect":
      return {
        part: "rect",
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        cornerRadius: p.cornerRadius,
        fill: colorToHex(p.fill),
        fillAlpha: p.fillAlpha,
        strokeColor: colorToHex(p.stroke?.color),
        strokeWidth: p.stroke?.width,
        strokeAlpha: p.stroke?.alpha,
        hitId: p.hitId
      };
    case "circle":
      return {
        part: "circle",
        x: p.x,
        y: p.y,
        radius: p.radius,
        fill: colorToHex(p.fill),
        fillAlpha: p.fillAlpha,
        strokeColor: colorToHex(p.stroke?.color),
        strokeWidth: p.stroke?.width,
        strokeAlpha: p.stroke?.alpha,
        hitId: p.hitId
      };
    case "line":
      return {
        part: "line",
        x: p.x,
        y: p.y,
        x2: p.x2,
        y2: p.y2,
        strokeColor: colorToHex(p.stroke.color),
        strokeWidth: p.stroke.width,
        strokeAlpha: p.stroke.alpha
      };
    case "label":
      return {
        part: "label",
        x: p.x,
        y: p.y,
        text: p.text,
        anchor: p.anchor,
        fontSize: p.fontSize,
        fontWeight: typeof p.fontWeight === "number" ? p.fontWeight : void 0,
        fontStyle: p.fontStyle,
        labelFill: colorToHex(p.fill),
        lineHeight: p.lineHeight,
        align: p.align,
        maxWidth: p.maxWidth,
        maxLines: p.maxLines,
        overflow: p.overflow
      };
    case "icon":
      return {
        part: "icon",
        x: p.x,
        y: p.y,
        size: p.size,
        iconKind: p.icon.kind === "svg-url" ? "svg-url" : "glyph",
        iconChar: p.icon.kind === "glyph" ? p.icon.char : void 0,
        iconUrl: p.icon.kind === "svg-url" ? p.icon.url : void 0,
        iconColor: colorToHex(p.icon.color),
        iconBackgroundFill: colorToHex(p.background?.fill),
        hitId: p.hitId
      };
  }
}
function buildPart(r) {
  const x = r.x ?? 0;
  const y = r.y ?? 0;
  const fill = hexToColor(r.fill);
  const stroke = strokeOf(r.strokeColor, r.strokeWidth, r.strokeAlpha);
  switch (r.part) {
    case "rect":
      return {
        part: "rect",
        x,
        y,
        width: r.width ?? 40,
        height: r.height ?? 20,
        ...r.cornerRadius != null ? { cornerRadius: r.cornerRadius } : {},
        ...fill !== void 0 ? { fill } : {},
        ...r.fillAlpha != null ? { fillAlpha: r.fillAlpha } : {},
        ...stroke ? { stroke } : {},
        ...r.hitId ? { hitId: r.hitId } : {}
      };
    case "circle":
      return {
        part: "circle",
        x,
        y,
        radius: r.radius ?? 8,
        ...fill !== void 0 ? { fill } : {},
        ...r.fillAlpha != null ? { fillAlpha: r.fillAlpha } : {},
        ...stroke ? { stroke } : {},
        ...r.hitId ? { hitId: r.hitId } : {}
      };
    case "line":
      return {
        part: "line",
        x,
        y,
        x2: r.x2 ?? x,
        y2: r.y2 ?? y,
        stroke: stroke ?? { color: 0 }
      };
    case "icon":
      return {
        part: "icon",
        x,
        y,
        size: r.size ?? 16,
        icon: r.iconKind === "svg-url" ? {
          kind: "svg-url",
          url: r.iconUrl ?? "",
          ...hexToColor(r.iconColor) !== void 0 ? { color: hexToColor(r.iconColor) } : {}
        } : {
          kind: "glyph",
          char: r.iconChar ?? "",
          ...hexToColor(r.iconColor) !== void 0 ? { color: hexToColor(r.iconColor) } : {}
        },
        ...hexToColor(r.iconBackgroundFill) !== void 0 ? { background: { fill: hexToColor(r.iconBackgroundFill) } } : {},
        ...r.hitId ? { hitId: r.hitId } : {}
      };
    case "label":
    default:
      return {
        part: "label",
        x,
        y,
        text: r.text ?? "",
        ...r.anchor ? { anchor: r.anchor } : {},
        ...r.fontSize != null ? { fontSize: r.fontSize } : {},
        ...r.fontWeight != null ? { fontWeight: r.fontWeight } : {},
        ...r.fontStyle ? { fontStyle: r.fontStyle } : {},
        ...hexToColor(r.labelFill) !== void 0 ? { fill: hexToColor(r.labelFill) } : {},
        ...r.lineHeight != null ? { lineHeight: r.lineHeight } : {},
        ...r.align ? { align: r.align } : {},
        ...r.maxWidth != null ? { maxWidth: r.maxWidth } : {},
        ...r.maxLines != null ? { maxLines: r.maxLines } : {},
        ...r.overflow ? { overflow: r.overflow } : {}
      };
  }
}
function compositeToForm(option) {
  if (!option) return { composite: { rootKind: "none" }, parts: [] };
  return {
    composite: {
      width: option.width,
      height: option.height,
      cornerRadius: option.cornerRadius,
      fill: colorToHex(option.fill),
      fillAlpha: option.fillAlpha,
      strokeColor: colorToHex(option.stroke?.color),
      strokeWidth: option.stroke?.width,
      strokeAlpha: option.stroke?.alpha,
      clip: option.clip,
      ...rootToForm(option.root)
    },
    parts: (option.parts ?? []).map(partToRow)
  };
}
function formToComposite(state) {
  const f = state.composite ?? {};
  const out = {
    kind: "composite",
    width: f.width ?? 160,
    height: f.height ?? 96,
    parts: (state.parts ?? []).map(buildPart)
  };
  if (f.cornerRadius != null) out.cornerRadius = f.cornerRadius;
  const fill = hexToColor(f.fill);
  if (fill !== void 0) out.fill = fill;
  if (f.fillAlpha != null) out.fillAlpha = f.fillAlpha;
  const stroke = strokeOf(f.strokeColor, f.strokeWidth, f.strokeAlpha);
  if (stroke) out.stroke = stroke;
  if (f.clip != null) out.clip = f.clip;
  const root = buildRoot(f);
  if (root) out.root = root;
  return out;
}
function CompositeNodeStyleEditorPanel({
  defaults,
  fields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: defaults ?? compositeToForm() });
  const { control, getValues } = form;
  const { fields: partFields, append, remove } = useFieldArray({ control, name: "parts" });
  const scalarValues = useWatch({ control, name: "composite" }) ?? {};
  const partsValues = useWatch({ control, name: "parts" });
  const c = control;
  const override = typeof fields === "function" ? fields(scalarValues) : fields;
  const partsBlock = /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
    /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold", children: "Parts" }),
    partFields.map((f, i) => /* @__PURE__ */ jsxs(
      "div",
      {
        className: "flex gap-2 items-start",
        style: {
          paddingTop: i ? 8 : 0,
          borderTop: i ? "1px solid var(--border)" : void 0
        },
        children: [
          /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(
            FormField.ObjectField,
            {
              control: c,
              columns: 1,
              labelPosition: "top",
              name: `parts.${i}`,
              fields: partRowFields(partsValues?.[i]?.part)
            }
          ) }),
          /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: () => remove(i), children: "Remove" })
        ]
      },
      f.id
    )),
    /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
      Button,
      {
        type: "button",
        variant: "outline",
        onClick: () => append({ part: "label", x: 12, y: 12, text: "" }),
        children: "+ Add part"
      }
    ) })
  ] });
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-4", children: [
    override ? /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "composite", fields: override }),
      partsBlock
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        FormField.ObjectField,
        {
          control: c,
          columns: 1,
          labelPosition: "top",
          name: "composite",
          fields: basicCompositeFields(scalarValues)
        }
      ),
      /* @__PURE__ */ jsx(AdvancedSection, { children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 pt-2", children: [
        /* @__PURE__ */ jsx(
          FormField.ObjectField,
          {
            control: c,
            columns: 1,
            labelPosition: "top",
            name: "composite",
            fields: advancedCompositeScalarFields(scalarValues)
          }
        ),
        partsBlock
      ] }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues()), children: submitLabel }) })
  ] }) });
}

// src/editor-panels/node-style/simple/fields.ts
var SHAPE_KIND_FIELD = {
  name: "shapeKind",
  type: "select",
  label: "Shape",
  options: [
    { value: "circle", label: "Circle" },
    { value: "rect", label: "Rectangle" },
    { value: "regular-polygon", label: "Regular polygon" },
    { value: "star", label: "Star" }
  ]
};
var SIZE_FIELD = {
  name: "size",
  type: "number",
  label: "Size",
  min: 0,
  max: 200,
  step: 1,
  description: "Unified radius / half-extent. Overrides the shape's native size axis."
};
var GEOMETRY_BY_KIND = {
  circle: [{ name: "radius", type: "number", label: "Radius", min: 0, max: 200, step: 1 }],
  rect: [
    { name: "width", type: "number", label: "Width", min: 0, max: 400, step: 1 },
    { name: "height", type: "number", label: "Height", min: 0, max: 400, step: 1 },
    { name: "cornerRadius", type: "number", label: "Corner radius", min: 0, max: 200, step: 1 }
  ],
  "regular-polygon": [
    { name: "sides", type: "number", label: "Sides", min: 3, max: 20, step: 1 },
    { name: "radius", type: "number", label: "Radius", min: 0, max: 200, step: 1 }
  ],
  star: [
    { name: "points", type: "number", label: "Points", min: 3, max: 20, step: 1 },
    { name: "innerRadius", type: "number", label: "Inner radius", min: 0, max: 200, step: 1 },
    { name: "outerRadius", type: "number", label: "Outer radius", min: 0, max: 200, step: 1 }
  ]
};
function geometryFields(kind) {
  const geometry = kind ? GEOMETRY_BY_KIND[kind] ?? [] : [];
  return [SHAPE_KIND_FIELD, ...geometry, SIZE_FIELD];
}
var BG_FILL_FIELD = {
  name: "bgFill",
  type: "color",
  label: "Fill color",
  presetColors: [...COLOR_PRESETS],
  description: "Solid color. Use the engine API directly for stacked / image / glyph fills."
};
var BG_ALPHA_FIELD = { name: "bgAlpha", type: "number", label: "Fill alpha", min: 0, max: 1, step: 0.01 };
var BACKGROUND_FIELDS = [BG_FILL_FIELD, BG_ALPHA_FIELD];
var STROKE_FIELDS = [
  { name: "bgStrokeColor", type: "color", label: "Stroke color", presetColors: [...COLOR_PRESETS] },
  { name: "bgStrokeAlpha", type: "number", label: "Stroke alpha", min: 0, max: 1, step: 0.01 },
  { name: "bgStrokeWidth", type: "number", label: "Stroke width", min: 0, max: 50, step: 0.5 },
  {
    name: "bgStrokeAlignment",
    type: "select",
    label: "Stroke alignment",
    options: [
      { value: "inside", label: "Inside" },
      { value: "center", label: "Center" },
      { value: "outside", label: "Outside" }
    ]
  },
  {
    name: "bgStrokeDashLength",
    type: "number",
    label: "Dash length",
    min: 0,
    max: 50,
    step: 1,
    description: "Leave dash + gap at 0 for a solid stroke."
  },
  { name: "bgStrokeDashGap", type: "number", label: "Dash gap", min: 0, max: 50, step: 1 },
  {
    name: "bgStrokeCap",
    type: "select",
    label: "Cap",
    options: [
      { value: "butt", label: "Butt" },
      { value: "round", label: "Round" },
      { value: "square", label: "Square" }
    ]
  },
  {
    name: "bgStrokeJoin",
    type: "select",
    label: "Join",
    options: [
      { value: "miter", label: "Miter" },
      { value: "round", label: "Round" },
      { value: "bevel", label: "Bevel" }
    ]
  }
];
var LABEL_FIELDS = [
  { name: "labelText", type: "text", label: "Text", placeholder: "(uses node id / data field)" },
  { name: "labelColor", type: "color", label: "Color", presetColors: [...COLOR_PRESETS] },
  { name: "labelFontSize", type: "number", label: "Font size", min: 1, max: 120, step: 1 },
  { name: "labelFontWeight", type: "number", label: "Font weight", min: 100, max: 900, step: 100 },
  {
    name: "labelPlacement",
    type: "select",
    label: "Placement",
    description: "inside-* placements clip / truncate to fit the shape.",
    options: [
      { value: "center", label: "Center (anchor)" },
      { value: "top", label: "Top" },
      { value: "bottom", label: "Bottom" },
      { value: "left", label: "Left" },
      { value: "right", label: "Right" },
      { value: "top-left", label: "Top-left" },
      { value: "top-right", label: "Top-right" },
      { value: "bottom-left", label: "Bottom-left" },
      { value: "bottom-right", label: "Bottom-right" },
      { value: "inside-center", label: "Inside center (contained)" },
      { value: "inside-top", label: "Inside top" },
      { value: "inside-bottom", label: "Inside bottom" },
      { value: "inside-left", label: "Inside left" },
      { value: "inside-right", label: "Inside right" }
    ]
  },
  { name: "labelOffsetX", type: "number", label: "Offset X", min: -200, max: 200, step: 1 },
  { name: "labelOffsetY", type: "number", label: "Offset Y", min: -200, max: 200, step: 1 }
];
var withGroup14 = (group) => (f) => ({ ...f, group });
function basicNodeStyleFields(_values = {}) {
  return [SHAPE_KIND_FIELD, BG_FILL_FIELD, SIZE_FIELD];
}
function advancedNodeStyleFields(values = {}) {
  const geometry = values.shapeKind ? GEOMETRY_BY_KIND[values.shapeKind] ?? [] : [];
  return [
    ...geometry.map(withGroup14("Geometry")),
    ...[BG_ALPHA_FIELD].map(withGroup14("Background")),
    ...STROKE_FIELDS.map(withGroup14("Stroke")),
    ...LABEL_FIELDS.map(withGroup14("Label"))
  ];
}
function nodeStyleFields(values = {}) {
  return [
    ...geometryFields(values.shapeKind).map(withGroup14("Geometry")),
    ...BACKGROUND_FIELDS.map(withGroup14("Background")),
    ...STROKE_FIELDS.map(withGroup14("Stroke")),
    ...LABEL_FIELDS.map(withGroup14("Label"))
  ];
}
function SimpleNodeStyleEditorPanel({
  defaults = {},
  fields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { style: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "style" }) ?? {};
  const c = control;
  const override = typeof fields === "function" ? fields(values) : fields;
  return (
    // `@invana/forms` leaf fields read `useFormContext()`, so the whole form
    // must be on context — not just control.
    /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
      override ? /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "style", fields: override }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx(
          FormField.ObjectField,
          {
            control: c,
            columns: 1,
            labelPosition: "top",
            name: "style",
            fields: basicNodeStyleFields(values)
          }
        ),
        /* @__PURE__ */ jsx(AdvancedSection, { children: /* @__PURE__ */ jsx(
          FormField.ObjectField,
          {
            control: c,
            columns: 1,
            labelPosition: "top",
            name: "style",
            fields: advancedNodeStyleFields(values)
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("style")), children: submitLabel }) })
    ] }) })
  );
}

// src/editor-panels/node-style/simple/mapping.ts
function defaultShapeFor(kind) {
  switch (kind) {
    case "rect":
      return { kind: "rect", width: 24, height: 24 };
    case "regular-polygon":
      return { kind: "regular-polygon", sides: 6, radius: 12 };
    case "star":
      return { kind: "star", points: 5, innerRadius: 6, outerRadius: 12 };
    case "circle":
    default:
      return { kind: "circle", radius: 12 };
  }
}
function colorToHex2(v) {
  return typeof v === "number" ? numberToHex(v) : void 0;
}
function hexToColor2(s) {
  return s && s.length > 0 ? hexToNumber(s) : void 0;
}
function styleToForm(style) {
  const s = style.shape;
  const dash = style.bgStrokeDashArray;
  return {
    shapeKind: s?.kind,
    radius: s && "radius" in s ? s.radius : void 0,
    // circle, regular-polygon
    width: s && "width" in s ? s.width : void 0,
    height: s && "height" in s ? s.height : void 0,
    cornerRadius: s && "cornerRadius" in s ? s.cornerRadius : void 0,
    sides: s && "sides" in s ? s.sides : void 0,
    points: s && "points" in s ? s.points : void 0,
    innerRadius: s && "innerRadius" in s ? s.innerRadius : void 0,
    outerRadius: s && "outerRadius" in s ? s.outerRadius : void 0,
    size: style.size,
    bgFill: colorToHex2(style.bgFill),
    bgAlpha: style.bgAlpha,
    bgStrokeColor: colorToHex2(style.bgStrokeColor),
    bgStrokeAlpha: style.bgStrokeAlpha,
    bgStrokeWidth: style.bgStrokeWidth,
    bgStrokeAlignment: style.bgStrokeAlignment,
    bgStrokeDashLength: dash?.[0],
    bgStrokeDashGap: dash?.[1],
    bgStrokeCap: style.bgStrokeCap,
    bgStrokeJoin: style.bgStrokeJoin,
    labelText: style.labelText,
    labelColor: colorToHex2(style.labelColor),
    labelFontSize: style.labelFontSize,
    labelFontWeight: typeof style.labelFontWeight === "number" ? style.labelFontWeight : void 0,
    labelPlacement: style.labelPlacement,
    labelOffsetX: style.labelOffsetX,
    labelOffsetY: style.labelOffsetY
  };
}
function buildShape(f) {
  switch (f.shapeKind) {
    case "rect":
      return {
        kind: "rect",
        width: f.width ?? 24,
        height: f.height ?? 24,
        ...f.cornerRadius != null ? { cornerRadius: f.cornerRadius } : {}
      };
    case "regular-polygon":
      return { kind: "regular-polygon", sides: f.sides ?? 6, radius: f.radius ?? 12 };
    case "star":
      return {
        kind: "star",
        points: f.points ?? 5,
        innerRadius: f.innerRadius ?? 6,
        outerRadius: f.outerRadius ?? 12
      };
    case "circle":
      return { kind: "circle", radius: f.radius ?? 12 };
    default:
      return void 0;
  }
}
function formToStyle(f) {
  const out = {};
  if (f.size !== void 0) out.size = f.size;
  const bgFill = hexToColor2(f.bgFill);
  if (bgFill !== void 0) out.bgFill = bgFill;
  if (f.bgAlpha !== void 0) out.bgAlpha = f.bgAlpha;
  const bgStrokeColor = hexToColor2(f.bgStrokeColor);
  if (bgStrokeColor !== void 0) out.bgStrokeColor = bgStrokeColor;
  if (f.bgStrokeAlpha !== void 0) out.bgStrokeAlpha = f.bgStrokeAlpha;
  if (f.bgStrokeWidth !== void 0) out.bgStrokeWidth = f.bgStrokeWidth;
  if (f.bgStrokeAlignment !== void 0) out.bgStrokeAlignment = f.bgStrokeAlignment;
  if (f.bgStrokeCap !== void 0) out.bgStrokeCap = f.bgStrokeCap;
  if (f.bgStrokeJoin !== void 0) out.bgStrokeJoin = f.bgStrokeJoin;
  if (f.labelText !== void 0) out.labelText = f.labelText;
  const labelColor = hexToColor2(f.labelColor);
  if (labelColor !== void 0) out.labelColor = labelColor;
  if (f.labelFontSize !== void 0) out.labelFontSize = f.labelFontSize;
  if (f.labelFontWeight !== void 0) out.labelFontWeight = f.labelFontWeight;
  if (f.labelPlacement !== void 0) out.labelPlacement = f.labelPlacement;
  if (f.labelOffsetX !== void 0) out.labelOffsetX = f.labelOffsetX;
  if (f.labelOffsetY !== void 0) out.labelOffsetY = f.labelOffsetY;
  if (f.shapeKind) out.shape = buildShape(f);
  if (f.bgStrokeDashLength != null || f.bgStrokeDashGap != null) {
    out.bgStrokeDashArray = [f.bgStrokeDashLength ?? 0, f.bgStrokeDashGap ?? 0];
  }
  return out;
}
function NodeStyleEditorPanel(props) {
  return props.kind === "composite" ? /* @__PURE__ */ jsx(CompositeNodeStyleEditorPanel, { ...props }) : /* @__PURE__ */ jsx(SimpleNodeStyleEditorPanel, { ...props });
}

// src/editor-panels/node-style-overview/fields.ts
var nodeStyleOverviewFields = [
  {
    name: "color",
    type: "color",
    label: "Node color",
    presetColors: [...COLOR_PRESETS],
    description: "Fill for simple shapes; body + accent parts for composite cards."
  }
];
function NodeStyleOverviewEditorPanel({
  defaults = {},
  fields = nodeStyleOverviewFields,
  onSubmit,
  onChange,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { overview: defaults } });
  const { control, getValues, watch } = form;
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(values.overview ?? {}));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "overview", fields }),
    onSubmit && /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("overview")), children: submitLabel }) })
  ] }) });
}

// src/editor-panels/node-style-overview/mapping.ts
function colorToForm(color) {
  return typeof color === "number" ? { color: numberToHex(color) } : {};
}
function formToColor(f) {
  return f.color && f.color.length > 0 ? hexToNumber(f.color) : void 0;
}
function recolorNodeStyle(style, color) {
  const shape = style.shape;
  if (shape && shape.kind === "composite") {
    const card = shape;
    const parts = card.parts.map(
      (p) => (p.part === "rect" || p.part === "circle") && p.fill !== void 0 ? { ...p, fill: color } : p
    );
    return { shape: { ...card, fill: color, parts } };
  }
  return { bgFill: color };
}

// src/editor-panels/hover-preview-card/fields.ts
var CARD_SCALAR_FIELDS = [
  { name: "titleField", type: "text", label: "Title field", description: "Dotted path, e.g. data.name" },
  { name: "subtitleField", type: "text", label: "Subtitle field", description: "e.g. data.description" },
  { name: "subtitleMaxLines", type: "number", label: "Subtitle max lines", min: 1, max: 5, step: 1 },
  { name: "imageField", type: "text", label: "Avatar field", description: "e.g. data.avatar (blank = no image)" },
  {
    name: "imageShape",
    type: "select",
    label: "Avatar shape",
    options: [
      { value: "rounded", label: "Rounded" },
      { value: "circle", label: "Circle" }
    ]
  }
];
var CARD_ROW_FIELDS = [
  { name: "label", type: "text", label: "Label" },
  { name: "field", type: "text", label: "Field" },
  {
    name: "format",
    type: "select",
    label: "Format",
    options: [
      { value: "text", label: "Text" },
      { value: "percent", label: "Percent" }
    ]
  }
];

// src/editor-panels/hover-preview-card/mapping.ts
function specToForm(spec = {}) {
  return {
    card: {
      imageField: spec.image?.field ?? "",
      imageShape: spec.image?.shape ?? "rounded",
      titleField: spec.title?.field ?? "",
      subtitleField: spec.subtitle?.field ?? "",
      subtitleMaxLines: spec.subtitle?.maxLines ?? 2
    },
    rows: (spec.rows ?? []).map((r) => ({
      label: r.label,
      field: r.field,
      format: r.format ?? "text"
    }))
  };
}
function formToSpec(values) {
  const { card, rows } = values;
  const spec = {};
  if (card.titleField.trim()) spec.title = { field: card.titleField.trim() };
  if (card.subtitleField.trim()) {
    spec.subtitle = { field: card.subtitleField.trim(), maxLines: card.subtitleMaxLines };
  }
  if (card.imageField.trim()) spec.image = { field: card.imageField.trim(), shape: card.imageShape };
  const outRows = rows.filter((r) => r.label.trim() && r.field.trim()).map(
    (r) => r.format === "text" ? { label: r.label.trim(), field: r.field.trim() } : { label: r.label.trim(), field: r.field.trim(), format: r.format }
  );
  if (outRows.length > 0) spec.rows = outRows;
  return spec;
}
function HoverPreviewCardEditorPanel({
  defaults,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: specToForm(defaults) });
  const { control, getValues } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "rows" });
  const c = control;
  return (
    // `@invana/forms` leaf fields read `useFormContext()`, so the whole form
    // (not just control) must be on context.
    /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-4", children: [
      /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "card", fields: CARD_SCALAR_FIELDS }),
      /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold", children: "Rows" }),
        fields.map((f, i) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: "flex gap-2 items-start",
            style: {
              paddingTop: i ? 8 : 0,
              borderTop: i ? "1px solid var(--border)" : void 0
            },
            children: [
              /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: `rows.${i}`, fields: CARD_ROW_FIELDS }) }),
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: () => remove(i), children: "Remove" })
            ]
          },
          f.id
        )),
        /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
          Button,
          {
            type: "button",
            variant: "outline",
            onClick: () => append({ label: "", field: "", format: "text" }),
            children: "+ Add row"
          }
        ) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(formToSpec(getValues())), children: submitLabel }) })
    ] }) })
  );
}

// src/editors/field-helpers.ts
var COLOR_ROLES = [
  "surface",
  "cardBg",
  "foreground",
  "heading",
  "muted",
  "accent",
  "divider",
  "stroke",
  "selectionRing",
  "hoverRing"
];
var NO_ROLE = "__none__";
var COLOR_ROLE_OPTIONS = [
  { value: NO_ROLE, label: "(none)" },
  ...COLOR_ROLES.map((r) => ({ value: r, label: r }))
];
function roleField(name, label) {
  return { name, type: "select", label, options: COLOR_ROLE_OPTIONS };
}
function asRole(value) {
  return value && value !== NO_ROLE ? value : void 0;
}
var SLOT_BINDING_FIELDS = [
  { name: "slot", type: "text", label: "Slot" },
  { name: "path", type: "text", label: "Data field", description: "Dotted path, e.g. data.name" }
];

// src/editor-panels/node-structure/fields.ts
function bindingScalarFields(structures, stylings) {
  return [
    {
      name: "structure",
      type: "select",
      label: "Structure",
      options: structures.map((s) => ({ value: s, label: s }))
    },
    {
      name: "styling",
      type: "select",
      label: "Styling",
      options: stylings.map((s) => ({ value: s, label: s }))
    }
  ];
}

// src/editor-panels/node-structure/mapping.ts
function bindingToForm(binding) {
  return {
    binding: {
      structure: binding?.structure ?? "",
      styling: binding?.styling ?? ""
    },
    bindings: Object.entries(binding?.bindings ?? {}).map(([slot, path]) => ({ slot, path }))
  };
}
function formToBinding(values) {
  const bindings = {};
  for (const row of values.bindings ?? []) {
    const slot = (row.slot ?? "").trim();
    const path = (row.path ?? "").trim();
    if (slot && path) bindings[slot] = path;
  }
  return {
    structure: values.binding?.structure ?? "",
    styling: values.binding?.styling ?? "",
    bindings
  };
}
function NodeStructureEditorPanel({
  defaults,
  structures,
  stylings,
  onSubmit,
  onChange,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: bindingToForm(defaults) });
  const { control, getValues, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "bindings" });
  const scalarFields = useMemo(
    () => bindingScalarFields(structures, stylings),
    [structures, stylings]
  );
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(formToBinding(values)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "binding", fields: scalarFields }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold", children: "Field mapping" }),
      fields.map((f, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex gap-2 items-start",
          style: {
            paddingTop: i ? 8 : 0,
            borderTop: i ? "1px solid var(--border)" : void 0
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: `bindings.${i}`, fields: SLOT_BINDING_FIELDS }) }),
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: () => remove(i), children: "Remove" })
          ]
        },
        f.id
      )),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => append({ slot: "", path: "" }), children: "+ Add mapping" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(formToBinding(getValues())), children: submitLabel }) })
  ] }) });
}

// src/editor-panels/schema/fields.ts
var SCHEMA_TYPES = ["string", "integer", "number", "boolean", "date"];
var SCHEMA_TYPE_OPTIONS = SCHEMA_TYPES.map((t) => ({ value: t, label: t }));
var SCHEMA_META_FIELDS = [
  { name: "label", type: "text", label: "Table name", placeholder: "e.g. Dim_Customer" },
  { name: "headerColor", type: "color", label: "Header colour", presetColors: [...COLOR_PRESETS] }
];
var SCHEMA_FIELD_ROW = [
  { name: "name", type: "text", label: "Field" },
  { name: "type", type: "select", label: "Type", options: SCHEMA_TYPE_OPTIONS }
];

// src/editor-panels/schema/mapping.ts
function schemaToForm(schema) {
  return {
    meta: {
      label: schema?.label ?? "",
      headerColor: typeof schema?.headerColor === "number" ? numberToHex(schema.headerColor) : void 0
    },
    // Copy each row so edits don't mutate the caller's array; spread preserves
    // any extra keys from custom row controls.
    fields: (schema?.fields ?? []).map((f) => ({ ...f }))
  };
}
function formToSchema(values) {
  const headerHex = values.meta.headerColor;
  return {
    label: (values.meta.label ?? "").trim(),
    ...headerHex && headerHex.length > 0 ? { headerColor: hexToNumber(headerHex) } : {},
    fields: (values.fields ?? []).map((f) => ({ ...f, name: (f.name ?? "").trim(), type: f.type || "string" })).filter((f) => f.name.length > 0)
  };
}
function SchemaEditorPanel({
  defaults,
  onSubmit,
  onChange,
  submitLabel = "Apply",
  metaFields = SCHEMA_META_FIELDS,
  fieldRowFields = SCHEMA_FIELD_ROW
}) {
  const form = useForm({ defaultValues: schemaToForm(defaults) });
  const { control, getValues, watch } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: "fields" });
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(formToSchema(values)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "meta", fields: metaFields }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold", children: "Fields" }),
      fields.map((f, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex gap-2 items-start",
          style: {
            paddingTop: i ? 8 : 0,
            borderTop: i ? "1px solid var(--border)" : void 0
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 2, labelPosition: "top", name: `fields.${i}`, fields: fieldRowFields }) }),
            /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-0.5", children: [
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", disabled: i === 0, onClick: () => move(i, i - 1), "aria-label": "Move up", children: "\u2191" }),
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", disabled: i === fields.length - 1, onClick: () => move(i, i + 1), "aria-label": "Move down", children: "\u2193" }),
              /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", size: "sm", onClick: () => remove(i), "aria-label": "Remove field", children: "\u2715" })
            ] })
          ]
        },
        f.id
      )),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(Button, { type: "button", variant: "outline", onClick: () => append({ name: "", type: "string" }), children: "+ Add field" }) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(formToSchema(getValues())), children: submitLabel }) })
  ] }) });
}

// src/editor-panels/node-styling/fields.ts
var NAME_FIELD = { name: "name", type: "text", label: "Name" };
var LABEL_PLACEMENT_FIELD = {
  name: "labelPlacement",
  type: "select",
  label: "Label placement",
  options: [
    { value: "bottom", label: "Bottom" },
    { value: "center", label: "Center" },
    { value: "top", label: "Top" },
    { value: "left", label: "Left" },
    { value: "right", label: "Right" }
  ]
};
var SIMPLE_STYLING_FIELDS = [
  NAME_FIELD,
  roleField("fillRole", "Fill role"),
  roleField("strokeRole", "Stroke role"),
  { name: "strokeWidth", type: "number", label: "Stroke width", min: 0, step: 0.5 },
  { name: "fillAlpha", type: "number", label: "Fill opacity", min: 0, max: 1, step: 0.01 },
  { name: "strokeAlpha", type: "number", label: "Border opacity", min: 0, max: 1, step: 0.01 },
  roleField("labelColorRole", "Label colour role"),
  { name: "labelFontSize", type: "number", label: "Label font size", min: 1, step: 1 },
  LABEL_PLACEMENT_FIELD
];
var CARD_STYLING_FIELDS = [
  NAME_FIELD,
  roleField("bgRole", "Card background role"),
  roleField("accentRole", "Accent role")
];
var STYLING_SCALAR_FIELDS = [
  NAME_FIELD,
  roleField("fillRole", "Fill role"),
  roleField("strokeRole", "Stroke role"),
  { name: "strokeWidth", type: "number", label: "Stroke width", min: 0, step: 0.5 },
  { name: "fillAlpha", type: "number", label: "Fill opacity", min: 0, max: 1, step: 0.01 },
  { name: "strokeAlpha", type: "number", label: "Border opacity", min: 0, max: 1, step: 0.01 },
  roleField("bgRole", "Card background role"),
  roleField("accentRole", "Accent role"),
  roleField("labelColorRole", "Label colour role"),
  { name: "labelFontSize", type: "number", label: "Label font size", min: 1, step: 1 },
  LABEL_PLACEMENT_FIELD
];
var SLOT_STYLING_FIELDS = [
  { name: "slot", type: "text", label: "Slot" },
  roleField("colorRole", "Colour role"),
  { name: "fontSize", type: "number", label: "Font size", min: 1, step: 1 },
  { name: "fontWeight", type: "number", label: "Font weight", min: 100, max: 900, step: 100 },
  { name: "uppercase", type: "boolean", label: "Uppercase" }
];

// src/editor-panels/node-styling/mapping.ts
function stylingToForm(styling = { name: "" }) {
  return {
    styling: {
      name: styling.name ?? "",
      fillRole: styling.fillRole ?? NO_ROLE,
      strokeRole: styling.strokeRole ?? NO_ROLE,
      strokeWidth: styling.strokeWidth ?? 1.5,
      fillAlpha: styling.fillAlpha ?? 1,
      strokeAlpha: styling.strokeAlpha ?? 1,
      bgRole: styling.bgRole ?? NO_ROLE,
      accentRole: styling.accentRole ?? NO_ROLE,
      labelColorRole: styling.label?.colorRole ?? NO_ROLE,
      labelFontSize: styling.label?.fontSize ?? 12,
      labelPlacement: styling.label?.placement ?? "bottom"
    },
    slots: Object.entries(styling.slots ?? {}).map(([slot, s]) => ({
      slot,
      colorRole: s.colorRole ?? NO_ROLE,
      fontSize: s.fontSize ?? 13,
      fontWeight: typeof s.fontWeight === "number" ? s.fontWeight : 400,
      uppercase: s.uppercase ?? false
    }))
  };
}
function formToStyling(values, base) {
  const styling = values.styling ?? {};
  const slots = values.slots ?? [];
  const out = {
    // Fields the form cannot show, carried verbatim so a save never deletes them.
    ...base?.fill !== void 0 ? { fill: base.fill } : {},
    ...base?.stroke !== void 0 ? { stroke: base.stroke } : {},
    ...base?.bg !== void 0 ? { bg: base.bg } : {},
    ...base?.accent !== void 0 ? { accent: base.accent } : {},
    ...base?.group ? { group: base.group } : {},
    ...base?.badges ? { badges: base.badges } : {},
    name: (styling.name ?? "").trim()
  };
  if (styling.fillAlpha !== void 0 && styling.fillAlpha < 1) out.fillAlpha = styling.fillAlpha;
  if (styling.strokeAlpha !== void 0 && styling.strokeAlpha < 1) {
    out.strokeAlpha = styling.strokeAlpha;
  }
  if (asRole(styling.fillRole)) out.fillRole = asRole(styling.fillRole);
  if (asRole(styling.strokeRole)) {
    out.strokeRole = asRole(styling.strokeRole);
    out.strokeWidth = styling.strokeWidth;
  }
  if (asRole(styling.bgRole)) out.bgRole = asRole(styling.bgRole);
  if (asRole(styling.accentRole)) out.accentRole = asRole(styling.accentRole);
  const labelColorRole = asRole(styling.labelColorRole);
  if (labelColorRole || styling.labelFontSize) {
    out.label = {
      // Same carry-through as above, for the label typography the form omits.
      ...base?.label ?? {},
      ...labelColorRole ? { colorRole: labelColorRole } : {},
      fontSize: styling.labelFontSize,
      placement: styling.labelPlacement
    };
  }
  const slotEntries = slots.filter((s) => s.slot.trim()).map((s) => {
    const entry = { fontSize: s.fontSize, fontWeight: s.fontWeight };
    const role = asRole(s.colorRole);
    if (role) entry.colorRole = role;
    if (s.uppercase) entry.uppercase = true;
    return [s.slot.trim(), entry];
  });
  if (slotEntries.length > 0) out.slots = Object.fromEntries(slotEntries);
  return out;
}
function NodeStylingEditorPanel({
  defaults,
  onSubmit,
  onChange,
  variant,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: stylingToForm(defaults) });
  const { control, getValues, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: "slots" });
  const scalarFields = variant === "card" ? CARD_STYLING_FIELDS : variant === "simple" ? SIMPLE_STYLING_FIELDS : STYLING_SCALAR_FIELDS;
  const showSlots = variant !== "simple";
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(formToStyling(values, defaults)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "styling", fields: scalarFields }),
    showSlots && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-[13px] font-semibold", children: "Slot styling" }),
      fields.map((f, i) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: "flex gap-2 items-start",
          style: {
            paddingTop: i ? 8 : 0,
            borderTop: i ? "1px solid var(--border)" : void 0
          },
          children: [
            /* @__PURE__ */ jsx("div", { className: "flex-1", children: /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: `slots.${i}`, fields: SLOT_STYLING_FIELDS }) }),
            /* @__PURE__ */ jsx(Button, { type: "button", variant: "ghost", onClick: () => remove(i), children: "Remove" })
          ]
        },
        f.id
      )),
      /* @__PURE__ */ jsx("div", { children: /* @__PURE__ */ jsx(
        Button,
        {
          type: "button",
          variant: "outline",
          onClick: () => append({ slot: "", colorRole: NO_ROLE, fontSize: 13, fontWeight: 400, uppercase: false }),
          children: "+ Add slot"
        }
      ) })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(formToStyling(getValues(), defaults)), children: submitLabel }) })
  ] }) });
}
function WheelZoomEditorPanel({
  defaults = {},
  fields = wheelZoomFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function BackgroundLayerEditorPanel({
  defaults = {},
  fields = backgroundLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function GeometricLayoutEditorPanel({
  defaults = {},
  fields = geometricLayoutFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function DragPanEditorPanel({
  defaults = {},
  fields = dragPanFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function PinchZoomEditorPanel({
  defaults = {},
  fields = pinchZoomFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function KeyboardCameraEditorPanel({
  defaults = {},
  fields = keyboardCameraFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function KeyboardShortcutsEditorPanel({
  defaults = {},
  fields = keyboardShortcutsFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const [badLines, setBadLines] = useState([]);
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  const apply = () => {
    const current = getValues("options");
    const bad = invalidBindingLines(current.bindingsText ?? "");
    setBadLines(bad);
    if (bad.length === 0) onSubmit(current);
  };
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    badLines.length > 0 && /* @__PURE__ */ jsx(Alert, { variant: "destructive", children: /* @__PURE__ */ jsxs(AlertDescription, { children: [
      badLines.length === 1 ? "Line" : "Lines",
      " ",
      badLines.join(", "),
      ": expected `keys \u2192 command`, then optional JSON args."
    ] }) }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: apply, children: submitLabel }) })
  ] }) });
}
function DragShapeEditorPanel({
  defaults = {},
  fields = dragShapeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function DevInfoLayerEditorPanel({
  defaults = {},
  fields = devInfoLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ClickSelectEditorPanel({
  defaults = {},
  fields = clickSelectFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ClickInspectEditorPanel({
  defaults = {},
  fields = clickInspectFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ClickViewEditorPanel({
  defaults = {},
  fields = clickViewFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function FocusEditorPanel({
  defaults = {},
  fields = focusFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function BrushSelectEditorPanel({
  defaults = {},
  fields = brushSelectFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function EntranceEditorPanel({
  defaults = {},
  fields = entranceFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function LassoSelectEditorPanel({
  defaults = {},
  fields = lassoSelectFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function HoverActivateEditorPanel({
  defaults = {},
  fields = hoverActivateFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function HoverElementPreviewEditorPanel({
  defaults = {},
  fields = hoverElementPreviewFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function DragNodeEditorPanel({
  defaults = {},
  fields = dragNodeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function NodeResizeEditorPanel({
  defaults = {},
  fields = nodeResizeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function CollapseExpandEditorPanel({
  defaults = {},
  fields = collapseExpandFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function CreateNodeEditorPanel({
  defaults = {},
  fields = createNodeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function DrawEdgeEditorPanel({
  defaults = {},
  fields = drawEdgeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function EraseEditorPanel({
  defaults = {},
  fields = eraseFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ContextMenuEditorPanel({
  defaults = {},
  fields = contextMenuFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ColorByEditorPanel({
  defaults = {},
  fields = colorByFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ThemeEditorPanel({
  defaults = {},
  fields = themeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function FisheyeEditorPanel({
  defaults = {},
  fields = fisheyeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function NodeCentralityEditorPanel({
  defaults = {},
  fields = nodeCentralityFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ContentLODEditorPanel({
  defaults = {},
  title,
  fields = contentLODFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    title ? /* @__PURE__ */ jsx("strong", { children: title }) : null,
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 2, labelPosition: "top", name: "options", fields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function EdgeLODEditorPanel({
  defaults = {},
  fields = edgeLODFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ParallelEdgeEditorPanel({
  defaults = {},
  fields = parallelEdgeFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function TextResolutionLODEditorPanel({
  defaults = {},
  fields = textResolutionLodFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function NodeScaleLODEditorPanel({
  defaults = {},
  fields = nodeScaleLodFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function EdgeScaleLODEditorPanel({
  defaults = {},
  fields = edgeScaleLodFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function LabelCollisionEditorPanel({
  defaults = {},
  fields = labelCollisionFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function MiniMapLayerEditorPanel({
  defaults = {},
  fields = miniMapLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function GraphLegendLayerEditorPanel({
  defaults = {},
  fields = graphLegendLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function D3ForceLayoutEditorPanel({
  defaults = {},
  fields = d3ForceLayoutFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function ElkLayoutEditorPanel({
  defaults = {},
  fields = elkLayoutFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function D3HierarchyLayoutEditorPanel({
  defaults = {},
  fields = d3HierarchyLayoutFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function D3SankeyLayoutEditorPanel({
  defaults = {},
  fields = d3SankeyLayoutFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function DensityContourFillLayerEditorPanel({
  defaults = {},
  fields = densityContourFillLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({
    defaultValues: { options: defaults }
  });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function DensityContourStrokeLayerEditorPanel({
  defaults = {},
  fields = densityContourStrokeLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({
    defaultValues: { options: defaults }
  });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function BubbleSetsLayerEditorPanel({
  defaults = {},
  fields = bubbleSetsLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function MapLayerEditorPanel({
  defaults = {},
  fields = mapLayerFields,
  onSubmit,
  submitLabel = "Apply"
}) {
  const form = useForm({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const values = useWatch({ control, name: "options" });
  const resolvedFields = typeof fields === "function" ? fields(values ?? {}) : fields;
  const c = control;
  return /* @__PURE__ */ jsx(FormProvider, { ...form, children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-3 p-4", children: [
    /* @__PURE__ */ jsx(FormField.ObjectField, { control: c, columns: 1, labelPosition: "top", name: "options", fields: resolvedFields }),
    /* @__PURE__ */ jsx("div", { className: "flex justify-end", children: /* @__PURE__ */ jsx(Button, { onClick: () => onSubmit(getValues("options")), children: submitLabel }) })
  ] }) });
}
function isSafeImageSrc(s) {
  const t = s.trim();
  return /^data:image\//i.test(t) || /^https:\/\//i.test(t);
}
function PreviewRow({ label, value, mono }) {
  return /* @__PURE__ */ jsxs("div", { className: "flex justify-between gap-3 text-sm", children: [
    /* @__PURE__ */ jsx("span", { className: "shrink-0 text-muted-foreground", children: label }),
    /* @__PURE__ */ jsx("span", { className: cn("truncate text-right text-foreground", mono && "font-mono"), title: value, children: value })
  ] });
}
function NodePreviewCard({
  image,
  imageSize = 40,
  title,
  subtitle,
  tags,
  rows,
  className
}) {
  return /* @__PURE__ */ jsxs(Card, { className: cn("w-72 shadow-xl", className), children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "space-y-2", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
        image && isSafeImageSrc(image) ? /* @__PURE__ */ jsx(
          "img",
          {
            src: image,
            alt: "",
            style: { width: imageSize, height: imageSize },
            className: "shrink-0 rounded-md bg-muted object-cover",
            onError: (e) => {
              e.currentTarget.style.display = "none";
            }
          }
        ) : null,
        /* @__PURE__ */ jsxs("div", { className: "min-w-0", children: [
          /* @__PURE__ */ jsx(CardTitle, { className: "truncate text-base leading-tight", children: title }),
          subtitle ? /* @__PURE__ */ jsx("p", { className: "mt-1 line-clamp-2 text-sm text-muted-foreground", children: subtitle }) : null
        ] })
      ] }),
      tags && tags.length > 0 ? /* @__PURE__ */ jsx("div", { className: "flex flex-wrap gap-1", children: tags.map((t) => /* @__PURE__ */ jsx(Badge, { variant: "secondary", children: t }, t)) }) : null
    ] }),
    rows && rows.length > 0 ? /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Separator, {}),
      rows.map((r) => /* @__PURE__ */ jsx(PreviewRow, { ...r }, r.label))
    ] }) : null
  ] });
}
function EdgePreviewCard({ badge, title, subtitle, rows, className }) {
  return /* @__PURE__ */ jsxs(Card, { className: cn("w-72 shadow-xl", className), children: [
    /* @__PURE__ */ jsxs(CardHeader, { className: "space-y-1.5", children: [
      badge ? /* @__PURE__ */ jsx(Badge, { className: "w-fit font-mono text-[10px]", children: badge }) : null,
      /* @__PURE__ */ jsx(CardTitle, { className: "text-base", children: title }),
      subtitle ? /* @__PURE__ */ jsx("p", { className: "text-sm text-muted-foreground", children: subtitle }) : null
    ] }),
    rows && rows.length > 0 ? /* @__PURE__ */ jsxs(CardContent, { className: "space-y-2", children: [
      /* @__PURE__ */ jsx(Separator, {}),
      rows.map((r) => /* @__PURE__ */ jsx(PreviewRow, { ...r }, r.label))
    ] }) : null
  ] });
}
function CanvasFiltersViewPanel({
  canvas,
  layerId = "graph",
  focusZoom = 2,
  selectBehaviourId = "click-select"
}) {
  const layer = canvas?.layers.get(layerId) ?? void 0;
  const store = layer?.store;
  const select = selectBehaviourId != null ? canvas?.behaviours.get(selectBehaviourId) : void 0;
  const [parked, setParked] = useState(() => ({ nodes: /* @__PURE__ */ new Set(), edges: /* @__PURE__ */ new Set() }));
  useEffect(() => {
    if (!store) {
      setParked({ nodes: /* @__PURE__ */ new Set(), edges: /* @__PURE__ */ new Set() });
      return;
    }
    const reconcile = () => setParked((prev) => {
      const nodes2 = /* @__PURE__ */ new Set();
      for (const id of prev.nodes) if (store.hasNode(id)) nodes2.add(id);
      for (const id of store.hiddenNodes()) nodes2.add(id);
      const edges2 = /* @__PURE__ */ new Set();
      for (const id of prev.edges) if (store.hasEdge(id)) edges2.add(id);
      for (const id of store.hiddenEdges()) edges2.add(id);
      return { nodes: nodes2, edges: edges2 };
    });
    reconcile();
    const unsubs = [
      store.events.on("node:visibility", reconcile),
      store.events.on("edge:visibility", reconcile),
      store.events.on("node:remove", reconcile),
      store.events.on("edge:remove", reconcile)
    ];
    return () => {
      for (const off of unsubs) off();
    };
  }, [store]);
  const focusNode = (id) => {
    layer?.focusNode(id, { zoom: focusZoom, includeHidden: true });
    select?.select(id, "shape");
  };
  const focusEdge = (id) => {
    layer?.focusEdges([id], { includeHidden: true });
    select?.select(id, "connector");
  };
  const toggleNode = (id) => store?.isNodeHidden(id) ? layer?.showNode(id) : layer?.hideNode(id);
  const toggleEdge = (id) => store?.isEdgeHidden(id) ? layer?.showEdge(id) : layer?.hideEdge(id);
  const removeNodeFromHidden = (id) => {
    layer?.showNode(id);
    setParked((prev) => {
      if (!prev.nodes.has(id)) return prev;
      const nodes2 = new Set(prev.nodes);
      nodes2.delete(id);
      return { nodes: nodes2, edges: prev.edges };
    });
  };
  const removeEdgeFromHidden = (id) => {
    layer?.showEdge(id);
    setParked((prev) => {
      if (!prev.edges.has(id)) return prev;
      const edges2 = new Set(prev.edges);
      edges2.delete(id);
      return { nodes: prev.nodes, edges: edges2 };
    });
  };
  const showAll = () => layer?.showAllHidden();
  const nodes = [...parked.nodes];
  const edges = [...parked.edges];
  const empty = nodes.length === 0 && edges.length === 0;
  const anyHidden = nodes.some((id) => store?.isNodeHidden(id)) || edges.some((id) => store?.isEdgeHidden(id));
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col gap-2 overflow-y-auto p-2 text-base", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm", children: [
        nodes.length,
        " node(s) \xB7 ",
        edges.length,
        " edge(s)"
      ] }),
      /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: !anyHidden, onClick: showAll, children: "Show all" })
    ] }),
    empty ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-sm", children: "Nothing hidden \u2014 right-click an element to Hide it." }) : /* @__PURE__ */ jsxs("ul", { className: "flex flex-col gap-0.5", children: [
      nodes.map((id) => {
        const hidden = !!store?.isNodeHidden(id);
        return (
          // Row is inert — only the ⊹ (focus) / eye (toggle) / ✕ (remove) buttons act.
          /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 px-2 py-1", children: [
            /* @__PURE__ */ jsx(Circle, { className: "h-3 w-3 shrink-0 text-muted-foreground/70" }),
            /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1 truncate", children: [
              "node \xB7 ",
              id
            ] }),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => focusNode(id),
                title: `Focus & select node ${id}`,
                className: "h-6 w-6 shrink-0",
                children: /* @__PURE__ */ jsx(Crosshair, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => toggleNode(id),
                title: hidden ? `Show node ${id}` : `Hide node ${id}`,
                className: "h-6 w-6 shrink-0",
                children: hidden ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 text-muted-foreground/70" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
              }
            ),
            /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => removeNodeFromHidden(id),
                title: `Remove node ${id} from the list`,
                className: "h-6 w-6 shrink-0",
                children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
              }
            )
          ] }, `n:${id}`)
        );
      }),
      edges.map((id) => {
        const hidden = !!store?.isEdgeHidden(id);
        return /* @__PURE__ */ jsxs("li", { className: "flex items-center gap-2 px-2 py-1", children: [
          /* @__PURE__ */ jsx(ArrowRight, { className: "h-3 w-3 shrink-0 text-muted-foreground/70" }),
          /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1 truncate", children: [
            "edge \xB7 ",
            id
          ] }),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => focusEdge(id),
              title: `Focus & select edge ${id}`,
              className: "h-6 w-6 shrink-0",
              children: /* @__PURE__ */ jsx(Crosshair, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => toggleEdge(id),
              title: hidden ? `Show edge ${id}` : `Hide edge ${id}`,
              className: "h-6 w-6 shrink-0",
              children: hidden ? /* @__PURE__ */ jsx(Eye, { className: "h-3.5 w-3.5 text-muted-foreground/70" }) : /* @__PURE__ */ jsx(EyeOff, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
            }
          ),
          /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => removeEdgeFromHidden(id),
              title: `Remove edge ${id} from the list`,
              className: "h-6 w-6 shrink-0",
              children: /* @__PURE__ */ jsx(X, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
            }
          )
        ] }, `e:${id}`);
      })
    ] })
  ] });
}
var NUMERIC_OPS = ["between", "lt", "lte", "gt", "gte"];
var isNumericOp = (op) => NUMERIC_OPS.includes(op);
var OP_OPTIONS = [
  { value: "contains", label: "contains", description: "text" },
  { value: "equals", label: "equals", description: "text or number" },
  { value: "between", label: "between", description: "number range" },
  { value: "lt", label: "< less than", description: "number" },
  { value: "lte", label: "\u2264 less or equal", description: "number" },
  { value: "gt", label: "> greater than", description: "number" },
  { value: "gte", label: "\u2265 greater or equal", description: "number" }
];
var ANY_FIELD = "any";
var PROP_PREFIX = "prop:";
var isFilterActive = (f) => f.op === "between" ? f.value.trim() !== "" && (f.value2 ?? "").trim() !== "" : f.value.trim() !== "";
var asName = (v) => typeof v === "string" && v.length > 0 ? v : void 0;
var isRecord2 = (v) => typeof v === "object" && v !== null;
var labelOfNode2 = (n) => {
  const d = n.data;
  return asName(n.type) ?? (isRecord2(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) ?? asName(d.group) ?? asName(d.category) : void 0) ?? "node";
};
var labelOfEdge2 = (e) => {
  const d = e.data;
  return asName(e.type) ?? (isRecord2(d) ? asName(d.type) ?? asName(d.label) ?? asName(d.kind) : void 0) ?? "edge";
};
var displayNameOf2 = (el) => {
  const d = el.data;
  return (isRecord2(d) ? asName(d.name) ?? asName(d.title) ?? asName(d.label) : void 0) ?? el.id;
};
var hexColor = (c) => `#${(c & 16777215).toString(16).padStart(6, "0")}`;
function solidColorOf(fill) {
  if (typeof fill === "number") return fill;
  const layers = Array.isArray(fill) ? fill : fill != null ? [fill] : [];
  for (const l of layers) if (isRecord2(l) && l.kind === "solid" && typeof l.color === "number") return l.color;
  return void 0;
}
function nodeSwatchColor2(style) {
  const shape = style.shape;
  const c = solidColorOf(style.bgFill) ?? (typeof shape?.fill === "number" ? shape.fill : void 0) ?? (typeof style.bgStrokeColor === "number" ? style.bgStrokeColor : void 0);
  return c === void 0 ? void 0 : hexColor(c);
}
function testValue(value, filter) {
  const { op } = filter;
  if (op === "contains") return value.toLowerCase().includes(filter.value.trim().toLowerCase());
  if (op === "equals") return value.trim().toLowerCase() === filter.value.trim().toLowerCase();
  const n = Number(value);
  if (!Number.isFinite(n)) return false;
  const a = Number(filter.value);
  if (op === "between") {
    const b = Number(filter.value2);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    return n >= Math.min(a, b) && n <= Math.max(a, b);
  }
  if (!Number.isFinite(a)) return false;
  switch (op) {
    case "lt":
      return n < a;
    case "lte":
      return n <= a;
    case "gt":
      return n > a;
    case "gte":
      return n >= a;
    default:
      return false;
  }
}
function candidates(el, field, isNode) {
  const label = isNode ? labelOfNode2(el) : labelOfEdge2(el);
  if (field === ANY_FIELD) {
    const out = [
      { fieldLabel: "id", value: el.id },
      { fieldLabel: "label", value: label }
    ];
    if (isRecord2(el.data)) {
      for (const [k, v] of Object.entries(el.data)) if (v != null) out.push({ fieldLabel: k, value: String(v) });
    }
    return out;
  }
  if (field === "id") return [{ fieldLabel: "id", value: el.id }];
  if (field === "label") return [{ fieldLabel: "label", value: label }];
  const key = field.slice(PROP_PREFIX.length);
  const d = el.data;
  if (isRecord2(d) && key in d) {
    const v = d[key];
    return [{ fieldLabel: key, value: v == null ? "" : String(v) }];
  }
  return [];
}
function filterHit(el, filter, isNode) {
  if (!isFilterActive(filter)) return null;
  for (const c of candidates(el, filter.field, isNode)) if (testValue(c.value, filter)) return c;
  return null;
}
function highlight(text2, needles) {
  const ns = needles.map((n) => n.trim().toLowerCase()).filter(Boolean);
  if (ns.length === 0) return text2;
  const lower = text2.toLowerCase();
  const out = [];
  let i = 0;
  let k = 0;
  while (i < text2.length) {
    let at = -1;
    let len = 0;
    for (const n of ns) {
      const idx = lower.indexOf(n, i);
      if (idx !== -1 && (at === -1 || idx < at)) {
        at = idx;
        len = n.length;
      }
    }
    if (at === -1) {
      out.push(text2.slice(i));
      break;
    }
    if (at > i) out.push(text2.slice(i, at));
    out.push(
      /* @__PURE__ */ jsx("mark", { className: "bg-primary/20 text-primary rounded-[2px]", children: text2.slice(at, at + len) }, k++)
    );
    i = at + len;
  }
  return out;
}
function FindInCanvasViewPanel({
  canvas,
  layerId = "graph",
  focusZoom = 2,
  selectBehaviourId = "click-select",
  pageSize = 25
}) {
  const layer = canvas?.layers.get(layerId) ?? void 0;
  const store = layer?.store;
  const select = selectBehaviourId != null ? canvas?.behaviours.get(selectBehaviourId) : void 0;
  const [kind, setKind] = useState("all");
  const emptyFilter = () => ({ field: ANY_FIELD, op: "contains", value: "" });
  const [filter, setFilter] = useState(emptyFilter);
  const updateFilter = (patch) => setFilter((prev) => ({ ...prev, ...patch }));
  const [snapshot, setSnapshot] = useState({ nodes: [], edges: [] });
  useEffect(() => {
    if (!store) {
      setSnapshot({ nodes: [], edges: [] });
      return;
    }
    let frame2 = 0;
    const recompute = () => setSnapshot({ nodes: recordsOnly(store.nodes()), edges: recordsOnly(store.edges()) });
    const schedule = () => {
      if (frame2) return;
      frame2 = requestAnimationFrame(() => {
        frame2 = 0;
        recompute();
      });
    };
    recompute();
    const unsubs = [
      store.events.on("node:add", schedule),
      store.events.on("node:remove", schedule),
      store.events.on("node:update", schedule),
      store.events.on("edge:add", schedule),
      store.events.on("edge:remove", schedule),
      store.events.on("edge:update", schedule)
    ];
    return () => {
      if (frame2) cancelAnimationFrame(frame2);
      for (const off of unsubs) off();
    };
  }, [store]);
  const fieldOptions = useMemo(() => {
    const keys = /* @__PURE__ */ new Set();
    const collect = (els) => {
      for (const el of els) if (isRecord2(el.data)) for (const k of Object.keys(el.data)) keys.add(k);
    };
    if (kind !== "edges") collect(snapshot.nodes);
    if (kind !== "nodes") collect(snapshot.edges);
    return [
      { value: ANY_FIELD, label: "any field", description: "id, label & properties" },
      { value: "id", label: "id" },
      { value: "label", label: "label" },
      ...[...keys].sort().map((k) => ({ value: PROP_PREFIX + k, label: k, description: "property" }))
    ];
  }, [snapshot, kind]);
  const active = isFilterActive(filter);
  const needles = useMemo(
    () => active && (filter.op === "contains" || filter.op === "equals") ? [filter.value] : [],
    [active, filter.op, filter.value]
  );
  const items = useMemo(() => {
    if (!active) return [];
    const out = [];
    if (kind !== "edges") {
      for (const n of snapshot.nodes) if (filterHit(n, filter, true)) out.push({ el: n, isNode: true });
    }
    if (kind !== "nodes") {
      for (const e of snapshot.edges) if (filterHit(e, filter, false)) out.push({ el: e, isNode: false });
    }
    return out;
  }, [snapshot, filter, active, kind]);
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const [page, setPage] = useState(0);
  const searchSig = `${kind}|${filter.field} ${filter.op} ${filter.value} ${filter.value2 ?? ""}`;
  useEffect(() => setPage(0), [searchSig]);
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, safePage * pageSize + pageSize),
    [items, safePage, pageSize]
  );
  const clear = () => setFilter(emptyFilter());
  const focusNode = (id) => {
    layer?.focusNode(id, { zoom: focusZoom, includeHidden: true });
    select?.select(id, "shape");
  };
  const focusEdge = (id) => {
    layer?.focusEdges([id], { includeHidden: true });
    select?.select(id, "connector");
  };
  const renderMeta = (el, isNode) => /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground block truncate", children: [
    /* @__PURE__ */ jsx("span", { className: "opacity-70", children: "id:" }),
    " ",
    highlight(el.id, needles),
    /* @__PURE__ */ jsx("span", { className: "opacity-50", children: " \xB7 " }),
    /* @__PURE__ */ jsx("span", { className: "opacity-70", children: "label:" }),
    " ",
    highlight(isNode ? labelOfNode2(el) : labelOfEdge2(el), needles)
  ] });
  return /* @__PURE__ */ jsxs("div", { className: "flex h-full flex-col gap-3 overflow-hidden p-2 text-base", children: [
    /* @__PURE__ */ jsxs(
      ToggleGroup,
      {
        type: "single",
        value: kind,
        onValueChange: (v) => v && setKind(v),
        size: "sm",
        variant: "outline",
        className: "justify-start",
        children: [
          /* @__PURE__ */ jsx(ToggleGroupItem, { value: "all", size: "sm", children: "All" }),
          /* @__PURE__ */ jsx(ToggleGroupItem, { value: "nodes", size: "sm", children: "Nodes" }),
          /* @__PURE__ */ jsx(ToggleGroupItem, { value: "edges", size: "sm", children: "Edges" })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          RichSelect,
          {
            options: fieldOptions,
            value: filter.field,
            onChange: (v) => updateFilter({ field: v }),
            label: "Field",
            align: "start",
            triggerClassName: "min-w-0 flex-1"
          }
        ),
        /* @__PURE__ */ jsx(
          RichSelect,
          {
            options: OP_OPTIONS,
            value: filter.op,
            onChange: (v) => updateFilter({ op: v }),
            label: "Operator",
            align: "start",
            triggerClassName: "min-w-0 flex-1"
          }
        )
      ] }),
      filter.op === "between" ? /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            value: filter.value,
            onChange: (e) => updateFilter({ value: e.target.value }),
            placeholder: "min",
            inputMode: "decimal",
            className: "h-8 min-w-0 flex-1"
          }
        ),
        /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0", children: "and" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            value: filter.value2 ?? "",
            onChange: (e) => updateFilter({ value2: e.target.value }),
            placeholder: "max",
            inputMode: "decimal",
            className: "h-8 min-w-0 flex-1"
          }
        )
      ] }) : /* @__PURE__ */ jsx(
        Input,
        {
          value: filter.value,
          onChange: (e) => updateFilter({ value: e.target.value }),
          placeholder: isNumericOp(filter.op) ? "number" : "search text\u2026",
          inputMode: isNumericOp(filter.op) ? "decimal" : "text",
          className: "h-8 min-w-0 w-full"
        }
      )
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: !active ? "Type to search nodes & edges" : `${total} match${total === 1 ? "" : "es"}` }),
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", onClick: clear, disabled: !active, children: "Clear" })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: active && total === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1", children: "No matching elements." }) : /* @__PURE__ */ jsx("div", { className: "flex flex-col gap-0.5", children: pageItems.map(({ el, isNode }) => {
      const color = isNode && layer ? nodeSwatchColor2(layer.resolveNodeStyle(el)) : void 0;
      const edge = isNode ? void 0 : el;
      return (
        // Each row is a ghost Button — native hover (accent fill) plus a
        // neutral border revealed on hover (`ring-border` over the ghost's
        // transparent `ring-1`). `h-auto`/`items-start` fit the two-line
        // content; `[&_svg]:size-3` counters the button's default svg size.
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            onClick: () => isNode ? focusNode(el.id) : focusEdge(el.id),
            title: `Focus & select ${isNode ? "node" : "edge"} ${el.id}`,
            className: "h-auto w-full items-start justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal hover:ring-border [&_svg]:size-3",
            children: [
              isNode ? (
                // Body-colour swatch — hollow when the node has no
                // representable solid colour.
                /* @__PURE__ */ jsx(
                  "span",
                  {
                    className: "border-muted-foreground/40 mt-0.5 block h-3 w-3 shrink-0 rounded-full border",
                    style: color ? { backgroundColor: color } : void 0
                  }
                )
              ) : /* @__PURE__ */ jsx(ArrowRight, { className: "text-muted-foreground/70 mt-0.5 shrink-0" }),
              /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                /* @__PURE__ */ jsxs("span", { className: "block truncate font-medium", children: [
                  highlight(displayNameOf2(el), needles),
                  edge && /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground/60 ml-1 font-normal", children: [
                    edge.source,
                    " \u2192 ",
                    edge.target
                  ] })
                ] }),
                renderMeta(el, isNode)
              ] })
            ]
          },
          `${isNode ? "n" : "e"}:${el.id}`
        )
      );
    }) }) }),
    pageCount > 1 && /* @__PURE__ */ jsx(Pagination, { className: "mx-0 w-full justify-between", children: /* @__PURE__ */ jsxs(PaginationContent, { className: "w-full justify-between", children: [
      /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
        PaginationPrevious,
        {
          size: "sm",
          onClick: () => setPage((p) => Math.max(0, p - 1)),
          className: cn("cursor-pointer", safePage === 0 && "pointer-events-none opacity-40")
        }
      ) }),
      /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground px-1", children: [
        "Page ",
        safePage + 1,
        " of ",
        pageCount
      ] }) }),
      /* @__PURE__ */ jsx(PaginationItem, { children: /* @__PURE__ */ jsx(
        PaginationNext,
        {
          size: "sm",
          onClick: () => setPage((p) => Math.min(pageCount - 1, p + 1)),
          className: cn("cursor-pointer", safePage >= pageCount - 1 && "pointer-events-none opacity-40")
        }
      ) })
    ] }) })
  ] });
}
var selectSelection = (s) => s.interaction.selection;
function SelectionViewPanel({ canvas, className, ...rest }) {
  if (!canvas) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full items-center justify-center", className), children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-4 text-base", children: "Failed to load \u2014 no canvas." }) });
  }
  return /* @__PURE__ */ jsx(SelectionViewPanelContent, { canvas, className, ...rest });
}
function SelectionViewPanelContent({
  canvas,
  layerId = "graph",
  selectBehaviourId = "click-select",
  focusZoom = 2,
  className
}) {
  const layer = canvas.layers.get(layerId) ?? void 0;
  const store = layer?.store;
  const select = selectBehaviourId ? canvas.behaviours.get(selectBehaviourId) : void 0;
  const selection = useStore(canvas.store.view, selectSelection);
  const [dataRev, setDataRev] = useState(0);
  useEffect(() => {
    if (!store) return;
    let frame2 = 0;
    const schedule = () => {
      if (frame2) return;
      frame2 = requestAnimationFrame(() => {
        frame2 = 0;
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
      if (frame2) cancelAnimationFrame(frame2);
      for (const off of unsubs) off();
    };
  }, [store]);
  const { nodes, edges, unresolved } = useMemo(() => {
    const out = { nodes: [], edges: [], unresolved: [] };
    if (!store) {
      out.unresolved = [...selection];
      return out;
    }
    for (const id of selection) {
      const node = store.getNode(id);
      if (node) {
        out.nodes.push(node);
        continue;
      }
      const edge = store.getEdge(id);
      if (edge) out.edges.push(edge);
      else out.unresolved.push(id);
    }
    return out;
  }, [selection, store, dataRev]);
  const total = selection.size;
  const focusNode = useCallback(
    (id) => layer?.focusNode(id, { zoom: focusZoom, includeHidden: true }),
    [layer, focusZoom]
  );
  const focusEdge = useCallback((id) => layer?.focusEdges([id], { includeHidden: true }), [layer]);
  const deselect = useCallback((id) => select?.deselect(id), [select]);
  const clearAll = useCallback(() => select?.clearSelection(), [select]);
  const hideSelected = useCallback(() => {
    if (!layer) return;
    for (const n of nodes) layer.hideNode(n.id);
    for (const e of edges) layer.hideEdge(e.id);
    select?.clearSelection();
  }, [layer, nodes, edges, select]);
  return /* @__PURE__ */ jsxs("div", { className: cn("flex h-full flex-col gap-2 overflow-hidden p-2 text-base", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-sm", children: [
        total,
        " selected \xB7 ",
        nodes.length,
        " node(s) \xB7 ",
        edges.length,
        " edge(s)"
      ] }),
      select && /* @__PURE__ */ jsxs("div", { className: "flex shrink-0 items-center gap-1", children: [
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "ghost",
            size: "sm",
            disabled: total === 0,
            onClick: hideSelected,
            title: "Hide every selected element",
            className: "gap-1.5 [&_svg]:size-3.5",
            children: [
              /* @__PURE__ */ jsx(EyeOff, { className: "text-muted-foreground/70" }),
              "Hide"
            ]
          }
        ),
        /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: total === 0, onClick: clearAll, children: "Clear" })
      ] })
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsx("div", { className: "min-h-0 flex-1 overflow-y-auto", children: total === 0 ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-sm", children: select ? "Nothing selected \u2014 click, brush, or lasso elements on the canvas." : "Nothing selected. No ClickSelectBehaviour is registered, so this list is read-only." }) : /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
      nodes.length > 0 && /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-muted-foreground px-2 text-sm font-medium", children: [
          "Nodes (",
          nodes.length,
          ")"
        ] }),
        nodes.map((n) => {
          const color = layer ? nodeSwatchColor(layer.resolveNodeStyle(n)) : void 0;
          return /* @__PURE__ */ jsxs("div", { className: "group flex items-center gap-2 px-1", children: [
            /* @__PURE__ */ jsxs(
              Button,
              {
                variant: "ghost",
                onClick: () => focusNode(n.id),
                title: `Focus node ${n.id}`,
                className: "h-auto min-w-0 flex-1 items-start justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal hover:ring-border [&_svg]:size-3",
                children: [
                  /* @__PURE__ */ jsx(
                    "span",
                    {
                      className: "border-muted-foreground/40 mt-0.5 block h-3 w-3 shrink-0 rounded-full border",
                      style: color ? { backgroundColor: color } : void 0
                    }
                  ),
                  /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                    /* @__PURE__ */ jsx("span", { className: "block truncate font-medium", children: displayNameOf(n) }),
                    /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground block truncate", children: [
                      /* @__PURE__ */ jsx("span", { className: "opacity-70", children: "id:" }),
                      " ",
                      n.id,
                      /* @__PURE__ */ jsx("span", { className: "opacity-50", children: " \xB7 " }),
                      /* @__PURE__ */ jsx("span", { className: "opacity-70", children: "label:" }),
                      " ",
                      labelOfNode(n)
                    ] })
                  ] })
                ]
              }
            ),
            select && /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                onClick: () => deselect(n.id),
                title: `Deselect node ${n.id}`,
                className: "h-6 w-6 shrink-0",
                children: /* @__PURE__ */ jsx(X, { className: "text-muted-foreground/70 h-3.5 w-3.5" })
              }
            )
          ] }, `n:${n.id}`);
        })
      ] }),
      edges.length > 0 && /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-muted-foreground px-2 text-sm font-medium", children: [
          "Edges (",
          edges.length,
          ")"
        ] }),
        edges.map((e) => /* @__PURE__ */ jsxs("div", { className: "group flex items-center gap-2 px-1", children: [
          /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              onClick: () => focusEdge(e.id),
              title: `Focus edge ${e.id}`,
              className: "h-auto min-w-0 flex-1 items-start justify-start gap-2 rounded-md px-2 py-1.5 text-left font-normal hover:ring-border [&_svg]:size-3",
              children: [
                /* @__PURE__ */ jsx(ArrowRight, { className: "text-muted-foreground/70 mt-0.5 shrink-0" }),
                /* @__PURE__ */ jsxs("span", { className: "min-w-0 flex-1", children: [
                  /* @__PURE__ */ jsxs("span", { className: "block truncate font-medium", children: [
                    displayNameOf(e),
                    /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground/60 ml-1 font-normal", children: [
                      e.source,
                      " \u2192 ",
                      e.target
                    ] })
                  ] }),
                  /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground block truncate", children: [
                    /* @__PURE__ */ jsx("span", { className: "opacity-70", children: "id:" }),
                    " ",
                    e.id,
                    /* @__PURE__ */ jsx("span", { className: "opacity-50", children: " \xB7 " }),
                    /* @__PURE__ */ jsx("span", { className: "opacity-70", children: "label:" }),
                    " ",
                    labelOfEdge(e)
                  ] })
                ] })
              ]
            }
          ),
          select && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => deselect(e.id),
              title: `Deselect edge ${e.id}`,
              className: "h-6 w-6 shrink-0",
              children: /* @__PURE__ */ jsx(X, { className: "text-muted-foreground/70 h-3.5 w-3.5" })
            }
          )
        ] }, `e:${e.id}`))
      ] }),
      unresolved.length > 0 && /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxs("h3", { className: "text-muted-foreground px-2 text-sm font-medium", children: [
          "Not in this layer (",
          unresolved.length,
          ")"
        ] }),
        unresolved.map((id) => /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-3 py-1.5", children: [
          /* @__PURE__ */ jsx(HelpCircle, { className: "text-muted-foreground/70 h-3 w-3 shrink-0" }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground min-w-0 flex-1 truncate", children: id }),
          select && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              onClick: () => deselect(id),
              title: `Deselect ${id}`,
              className: "h-6 w-6 shrink-0",
              children: /* @__PURE__ */ jsx(X, { className: "text-muted-foreground/70 h-3.5 w-3.5" })
            }
          )
        ] }, `u:${id}`))
      ] })
    ] }) })
  ] });
}
function PlaybookViewPanel({ canvas, className, ...rest }) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === void 0 ? fromContext : canvas;
  if (!resolved) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full items-center justify-center", className), children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-4 text-base", children: "No canvas yet." }) });
  }
  return /* @__PURE__ */ jsx(PlaybookViewPanelContent, { canvas: resolved, className, ...rest });
}
function hasWork(step) {
  return step.data !== void 0 || step.settings !== void 0 || step.view !== void 0;
}
function PlaybookViewPanelContent({
  canvas,
  showSaveStep = true,
  showCopyJson = true,
  className
}) {
  const { playbook, title, steps, current, index, canNext, canPrevious, next, previous, goTo } = usePlaybook(canvas);
  const entries = useHistoryEntries(void 0, canvas);
  const unsaved = entries.length > 0 && entries[entries.length - 1].stepId === void 0;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const run = useCallback(async (move) => {
    setBusy(true);
    setError(null);
    try {
      await move();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);
  const saveStep = useCallback(() => {
    const stepTitle = draft.trim() || `Step ${steps.length + 1}`;
    const step = canvas.history.sinceLastStep(stepTitle);
    setError(null);
    if (!hasWork(step)) {
      setError("Nothing to save: the work since the last step changes nothing.");
      return;
    }
    try {
      playbook.addStep(step);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }, [canvas, playbook, draft, steps.length]);
  const copyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(playbook.toJSON(), null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      setError(`Copy failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [playbook]);
  return /* @__PURE__ */ jsxs("div", { className: cn("flex h-full flex-col gap-2 overflow-hidden p-2 text-base", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "truncate font-medium", children: title }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0 text-sm", children: steps.length === 0 ? "no steps" : `${index + 1} / ${steps.length}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-muted/40 flex flex-col gap-1 rounded-md p-2", children: [
      /* @__PURE__ */ jsx("span", { className: "font-medium", children: current ? current.title : "Start" }),
      current?.narration ? /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm leading-relaxed", children: current.narration }) : !current && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "Before the first step." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
      /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", disabled: busy || !canPrevious, onClick: () => void run(previous), children: [
        /* @__PURE__ */ jsx(ChevronLeft, { className: "size-4" }),
        " Previous"
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", disabled: busy || !canNext, onClick: () => void run(next), children: [
        "Next ",
        /* @__PURE__ */ jsx(ChevronRight, { className: "size-4" })
      ] }),
      showCopyJson && /* @__PURE__ */ jsxs(Button, { variant: "ghost", size: "sm", className: "ml-auto", onClick: () => void copyJson(), title: "Copy the playbook as JSON", children: [
        /* @__PURE__ */ jsx(Copy, { className: "size-4" }),
        " ",
        copied ? "Copied" : "JSON"
      ] })
    ] }),
    error && /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm", children: error }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsxs("ol", { className: "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto", children: [
      steps.map((step, i) => /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "ghost",
          size: "sm",
          disabled: busy,
          "aria-current": i === index ? "step" : void 0,
          onClick: () => {
            if (i !== index) void run(() => goTo(step.id));
          },
          className: cn(
            "h-auto w-full justify-start gap-2 px-2 py-1 text-left font-normal",
            i === index && ACTIVE_CLASS,
            i > index && "text-muted-foreground"
          ),
          children: [
            /* @__PURE__ */ jsx("span", { className: "w-5 shrink-0 text-right text-sm tabular-nums", children: i + 1 }),
            /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: step.title }),
            step.actor && /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "shrink-0 px-1.5 py-0 text-[10px]", children: step.actor })
          ]
        }
      ) }, step.id)),
      steps.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-muted-foreground px-2 text-sm", children: "No steps yet." })
    ] }),
    showSaveStep && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Separator, {}),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1", children: [
        /* @__PURE__ */ jsx(
          Input,
          {
            value: draft,
            onChange: (e) => setDraft(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter" && unsaved && !canNext && !busy) saveStep();
            },
            placeholder: `Step ${steps.length + 1}`,
            className: "h-8 text-sm"
          }
        ),
        /* @__PURE__ */ jsxs(
          Button,
          {
            variant: "outline",
            size: "sm",
            disabled: busy || !unsaved || canNext,
            onClick: saveStep,
            title: canNext ? "Go to the last step to save your work as a step" : "Save the work since the last step as a step",
            children: [
              /* @__PURE__ */ jsx(Plus, { className: "size-4" }),
              " Save as step"
            ]
          }
        )
      ] })
    ] })
  ] });
}
var NEXT_KEYS = /* @__PURE__ */ new Set(["ArrowRight", "PageDown"]);
var PREVIOUS_KEYS = /* @__PURE__ */ new Set(["ArrowLeft", "PageUp"]);
function PlaybookPresenterBar({ canvas, className, ...rest }) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === void 0 ? fromContext : canvas;
  if (!resolved) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex items-center justify-center p-3", className), children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-base", children: "No canvas yet." }) });
  }
  return /* @__PURE__ */ jsx(PlaybookPresenterBarContent, { canvas: resolved, className, ...rest });
}
function PlaybookPresenterBarContent({
  canvas,
  showDots = true,
  className,
  variant = "deck",
  renderTitleIcon,
  narrationIcon
}) {
  const { steps, current, index, canNext, canPrevious, next, previous, goTo } = usePlaybook(canvas);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const busyRef = useRef(false);
  const run = useCallback(async (move) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await move();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }, []);
  const onKeyDown = useCallback(
    (e) => {
      if (NEXT_KEYS.has(e.key)) {
        e.preventDefault();
        if (canNext) void run(next);
      } else if (PREVIOUS_KEYS.has(e.key)) {
        e.preventDefault();
        if (canPrevious) void run(previous);
      }
    },
    [canNext, canPrevious, next, previous, run]
  );
  const dots = /* @__PURE__ */ jsx("div", { className: "flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5", children: showDots && steps.map((step, i) => /* @__PURE__ */ jsx(
    Button,
    {
      variant: "ghost",
      size: "icon",
      disabled: busy,
      title: `${i + 1}. ${step.title}`,
      "aria-label": `Go to step ${i + 1}: ${step.title}`,
      "aria-current": i === index ? "step" : void 0,
      onClick: () => {
        if (i !== index) void run(() => goTo(step.id));
      },
      className: "size-5",
      children: /* @__PURE__ */ jsx(
        "span",
        {
          className: cn(
            "size-2 rounded-full",
            i === index ? "bg-primary" : i < index ? "bg-primary/40" : "bg-muted-foreground/30"
          )
        }
      )
    },
    step.id
  )) });
  if (variant === "compact") {
    return /* @__PURE__ */ jsxs(
      Card,
      {
        role: "group",
        "aria-label": "Playbook presenter",
        tabIndex: 0,
        onKeyDown,
        className: cn("focus-visible:ring-ring flex flex-col gap-2 p-3 outline-none focus-visible:ring-2", className),
        children: [
          current ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", "aria-live": "polite", children: [
              renderTitleIcon?.(current),
              /* @__PURE__ */ jsx("span", { className: "bg-accent rounded-sm px-2 py-1", children: current.title })
            ] }),
            current.narration && /* @__PURE__ */ jsxs("div", { className: cn("flex items-start gap-2", busy && "opacity-50"), children: [
              narrationIcon,
              /* @__PURE__ */ jsx("p", { className: "line-clamp-4 leading-relaxed", children: current.narration })
            ] })
          ] }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: steps.length === 0 ? "No steps" : "Start" }),
          error && /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm", children: error }),
          dots
        ]
      }
    );
  }
  return /* @__PURE__ */ jsxs(
    Card,
    {
      role: "group",
      "aria-label": "Playbook presenter",
      tabIndex: 0,
      onKeyDown,
      className: cn("focus-visible:ring-ring flex flex-col gap-2 p-3 outline-none focus-visible:ring-2", className),
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-start gap-3", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex min-w-0 flex-1 flex-col gap-1", "aria-live": "polite", children: [
            /* @__PURE__ */ jsx("span", { className: "font-semibold", children: current ? current.title : steps.length === 0 ? "No steps" : "Start" }),
            current?.narration && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-base leading-relaxed", children: current.narration })
          ] }),
          /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0 text-sm tabular-nums", children: steps.length === 0 ? "" : index < 0 ? `${steps.length} steps` : `Step ${index + 1} / ${steps.length}` })
        ] }),
        error && /* @__PURE__ */ jsx("p", { className: "text-destructive text-sm", children: error }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          /* @__PURE__ */ jsxs(Button, { variant: "outline", size: "sm", disabled: busy || !canPrevious, onClick: () => void run(previous), children: [
            /* @__PURE__ */ jsx(ChevronLeft, { className: "size-4" }),
            " Previous"
          ] }),
          /* @__PURE__ */ jsx("div", { className: "flex min-w-0 flex-1 flex-wrap items-center justify-center gap-0.5", children: showDots && steps.map((step, i) => /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              disabled: busy,
              title: `${i + 1}. ${step.title}`,
              "aria-label": `Go to step ${i + 1}: ${step.title}`,
              "aria-current": i === index ? "step" : void 0,
              onClick: () => {
                if (i !== index) void run(() => goTo(step.id));
              },
              className: "size-5",
              children: /* @__PURE__ */ jsx(
                "span",
                {
                  className: cn(
                    "size-2 rounded-full",
                    i === index ? "bg-primary" : i < index ? "bg-primary/40" : "bg-muted-foreground/30"
                  )
                }
              )
            },
            step.id
          )) }),
          /* @__PURE__ */ jsxs(Button, { size: "sm", disabled: busy || !canNext, onClick: () => void run(next), children: [
            "Next ",
            /* @__PURE__ */ jsx(ChevronRight, { className: "size-4" })
          ] })
        ] })
      ]
    }
  );
}
var BOARD_LAYOUT_COMMAND = "board.layoutPresets";
var W = 340;
var EDGE = 12;
function BoardLayoutPopover() {
  const canvas = useCanvas();
  const [at, setAt] = useState(null);
  const card = useLayoutPresetCards(canvas);
  const ref = useRef(null);
  const open = useRef(at);
  open.current = at;
  useEffect(
    () => canvas.commands.register(BOARD_LAYOUT_COMMAND, {
      label: "Layout\u2026",
      category: "Layout",
      isActive: () => open.current !== null,
      run: (_c, args) => {
        const p = args;
        setAt(open.current ? null : { x: p?.x ?? 48, y: p?.y ?? 48 });
      }
    }),
    [canvas]
  );
  useEffect(() => canvas.commands.invalidate(), [canvas, at]);
  useEffect(() => {
    if (!at) return;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setAt(null);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setAt(null);
    };
    window.addEventListener("pointerdown", onDown, true);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("keydown", onKey);
    };
  }, [at]);
  const [place, setPlace] = useState(null);
  useLayoutEffect(() => {
    if (!at) return setPlace(null);
    const el = ref.current;
    const host = el?.offsetParent;
    if (!el || !host) return setPlace({ left: at.x, top: at.y });
    const left = Math.max(EDGE, Math.min(at.x, host.clientWidth - W - EDGE));
    const top = Math.max(EDGE, Math.min(at.y, host.clientHeight - el.offsetHeight - EDGE));
    setPlace({ left, top, maxHeight: host.clientHeight - 2 * EDGE });
  }, [at, card.label]);
  if (!at) return null;
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref,
      className: "pointer-events-auto absolute z-[8]",
      style: {
        left: place?.left ?? at.x,
        top: place?.top ?? at.y,
        width: W,
        ...place?.maxHeight ? { maxHeight: place.maxHeight, overflowY: "auto" } : {},
        // Hidden for the one layout pass before it is placed.
        visibility: place ? "visible" : "hidden"
      },
      children: /* @__PURE__ */ jsx(
        FloatingPanel,
        {
          title: "Layout",
          ...card.label && card.label !== "Layout" ? { aside: card.label } : {},
          onClose: () => setAt(null),
          children: /* @__PURE__ */ jsx(
            LayoutPresetsViewPanel,
            {
              value: card.value,
              presets: card.presets,
              onChange: card.onChange,
              ...card.onRunAgain ? { onRunAgain: card.onRunAgain } : {}
            }
          )
        }
      )
    }
  );
}
var DISABLED_CLASS = "pointer-events-none opacity-50";
function buildItems(refs, states, labelOf2, run, opts) {
  const icons = { ...DEFAULT_CONTROL_ICONS, ...opts.icons };
  const seen = /* @__PURE__ */ new Map();
  const items = [];
  refs.forEach((ref, i) => {
    const state = states[i];
    if (!state || !state.available && !opts.showUnavailable) return;
    const n = seen.get(ref.command) ?? 0;
    seen.set(ref.command, n + 1);
    const id = ref.id ?? (n === 0 ? ref.command : `${ref.command}#${n}`);
    const icon2 = state.active ? Check : ref.icon ? icons[ref.icon] : void 0;
    const base = {
      id,
      label: labelOf2(ref),
      ...icon2 ? { icon: icon2 } : {},
      ...ref.shortcut ? { shortcut: ref.shortcut } : {}
    };
    if (state.options.length > 0) {
      const bag = ref.args && typeof ref.args === "object" ? ref.args : {};
      items.push({
        ...base,
        ...state.enabled ? {} : { className: DISABLED_CLASS },
        children: state.options.map((o) => ({
          id: `${id}:${o.value}`,
          label: o.label,
          ...o.value === state.value ? { icon: Check } : o.icon && icons[o.icon] ? { icon: icons[o.icon] } : {},
          ...state.enabled ? { onClick: () => run(ref.command, { ...bag, value: o.value }) } : { className: DISABLED_CLASS }
        }))
      });
      return;
    }
    items.push(state.enabled ? { ...base, onClick: () => run(ref.command, ref.args) } : { ...base, className: DISABLED_CLASS });
  });
  return items;
}
function readStates(canvas, refs) {
  const c = canvas.commands;
  return refs.map(({ command, args }) => ({
    available: c.has(command),
    enabled: c.isEnabled(command, args),
    active: c.isActive(command, args),
    value: c.value(command, args),
    options: c.options(command, args)
  }));
}
function commandMenuItems(canvas, refs, opts = {}) {
  const labelOf2 = (ref) => ref.label ?? canvas.commands.get(ref.command)?.label ?? ref.command;
  return buildItems(refs, readStates(canvas, refs), labelOf2, (command, args) => void canvas.commands.run(command, args), opts);
}
function useCommandMenuItems(refs, canvas, opts = {}) {
  const resolved = useResolvedCanvas(canvas);
  const { states, run } = useCommandStates(refs, resolved);
  const { icons, showUnavailable } = opts;
  return useMemo(() => {
    const labelOf2 = (ref) => ref.label ?? resolved.commands.get(ref.command)?.label ?? ref.command;
    return buildItems(refs, states, labelOf2, (command, args) => void run(command, args), {
      ...icons ? { icons } : {},
      ...showUnavailable !== void 0 ? { showUnavailable } : {}
    });
  }, [refs, states, run, resolved, icons, showUnavailable]);
}
function withAutoClose(items, close) {
  return items.map((item) => {
    const next = { ...item };
    if (item.children) next.children = withAutoClose(item.children, close);
    if (item.onClick) {
      const original = item.onClick;
      next.onClick = () => {
        original();
        close();
      };
    }
    return next;
  });
}
function GraphContextMenuRoot({
  target,
  id,
  layerId = "graph",
  enabled = true,
  zIndex,
  style,
  autoClose = true,
  state = null,
  selectTarget,
  build
}) {
  const canvas = useCanvas();
  const { menu, open, close } = useContextMenu();
  const onContextMenu = useCallback(
    (event) => {
      const base = {
        world: event.world,
        screen: event.screen,
        canvas,
        close
      };
      if (selectTarget && target !== "canvas" && typeof event.id === "string") {
        const select = canvas.behaviours.get(selectTarget);
        if (select && !select.isSelected(event.id)) select.select(event.id, target === "edge" ? "connector" : "shape");
      }
      const built = build(event, base);
      const { items, header } = Array.isArray(built) ? { items: built, header: void 0 } : built;
      if (items.length === 0) return;
      open(event.screen.x, event.screen.y, {
        items: autoClose ? withAutoClose(items, close) : items,
        ...header ? { header } : {}
      });
    },
    [canvas, build, autoClose, open, close, selectTarget, target]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      ContextMenuBehaviour,
      {
        id,
        targetLayerId: layerId,
        enabled,
        targets: [target],
        state,
        onContextMenu
      }
    ),
    menu && /* @__PURE__ */ jsx(
      ContextMenuOverlay,
      {
        x: menu.x,
        y: menu.y,
        items: menu.items.items,
        ...menu.items.header ? { header: menu.items.header } : {},
        zIndex,
        style
      }
    )
  ] });
}
function BoardContextMenus({
  layerId = "graph",
  selectBehaviourId = "click-select",
  board,
  node,
  edge,
  selection,
  icons
}) {
  const canvas = useCanvas();
  const mode = useBoardMode(canvas);
  const toItems = useCallback(
    (entries) => menuItems(canvas, entries, mode, icons),
    [canvas, mode, icons]
  );
  const buildBoard = useCallback(
    (_e, base) => board ? { items: toItems(board(base)), header: { title: "Board", sub: presetLabel(canvas) } } : [],
    [board, toItems, canvas]
  );
  const buildNode = useCallback(
    (e, base) => {
      const id = e.id;
      const select = canvas.behaviours.get(selectBehaviourId);
      const picked = select?.getSelectedShapeIds() ?? [];
      if (selection && picked.length > 1 && picked.includes(id)) {
        const edgeIds = select?.getSelectedConnectorIds() ?? [];
        return {
          items: toItems(selection({ ...base, nodeIds: picked, edgeIds })),
          header: { title: "Selection", sub: `${picked.length} nodes` }
        };
      }
      if (!node) return [];
      if (select && !select.isSelected(id)) {
        select.clearSelection();
        select.select(id, "shape");
      }
      const layer = canvas.layers.get(layerId);
      const n = layer?.store.getNode(id);
      const type = n?.type ?? "";
      const swatch = n && layer ? nodeSwatchColor(layer.resolveNodeStyle(n)) : void 0;
      const header = { title: id, sub: type, ...swatch ? { swatch } : {} };
      return { items: toItems(node({ ...base, id, type, data: e.data })), header };
    },
    [canvas, layerId, selectBehaviourId, node, selection, toItems]
  );
  const buildEdge = useCallback(
    (e, base) => {
      if (!edge) return [];
      const id = e.id;
      const ed = canvas.layers.get(layerId)?.store.getEdge(id);
      const type = ed?.type ?? "";
      const title = ed ? `${ed.source} \u2192 ${ed.target}` : id;
      return { items: toItems(edge({ ...base, id, type, data: e.data })), header: { title, sub: type } };
    },
    [canvas, layerId, edge, toItems]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    board && /* @__PURE__ */ jsx(GraphContextMenuRoot, { target: "canvas", id: "board-menu", layerId, build: buildBoard }),
    (node || selection) && /* @__PURE__ */ jsx(GraphContextMenuRoot, { target: "node", id: "board-node-menu", layerId, build: buildNode }),
    edge && /* @__PURE__ */ jsx(GraphContextMenuRoot, { target: "edge", id: "board-edge-menu", layerId, build: buildEdge })
  ] });
}
function presetLabel(canvas) {
  const id = canvas.store.view.getState().definition.layoutPreset?.id;
  if (!id) return void 0;
  return canvas.commands.options("layout.preset").find((o) => o.value === id)?.label ?? id;
}
function menuItems(canvas, entries, mode, icons) {
  const out = [];
  const ids = /* @__PURE__ */ new Map();
  const unique = (id) => {
    const seen = ids.get(id) ?? 0;
    ids.set(id, seen + 1);
    return seen === 0 ? id : `${id}#${seen}`;
  };
  let n = 0;
  for (const entry of entries) {
    if (!inBoardMode(entry.modes, mode)) continue;
    if ("separator" in entry) {
      if (out.length > 0 && !out[out.length - 1].separator) out.push({ id: `sep-${n++}`, label: "", separator: true });
      continue;
    }
    if ("command" in entry) {
      const items = commandMenuItems(canvas, [entry], icons ? { icons } : {});
      for (const item of items) out.push({ ...item, id: unique(item.id), ...entry.destructive ? { destructive: true } : {} });
      continue;
    }
    out.push({
      id: unique(entry.id),
      label: entry.label,
      ...entry.icon ? { icon: entry.icon } : {},
      ...entry.shortcut ? { shortcut: entry.shortcut } : {},
      ...entry.destructive ? { destructive: true } : {},
      ...entry.disabled ? { disabled: true } : { onClick: entry.onClick }
    });
  }
  while (out.length > 0 && out[out.length - 1].separator) out.pop();
  return out;
}

// src/toolbars/controlSpecs.ts
function joinGroups(groups) {
  const present = groups.filter((g) => g.length > 0);
  return present.flatMap((g, i) => i === 0 ? [...g] : [{ type: "divider", key: `d${i}` }, ...g]);
}
function zoomSpecs() {
  return [
    { type: "command", key: "zoom-in", command: "camera.zoomIn", icon: "zoom-in", label: "Zoom in" },
    { type: "command", key: "zoom-out", command: "camera.zoomOut", icon: "zoom-out", label: "Zoom out" }
  ];
}
function fitSpec(layerId) {
  return { type: "command", key: "fit", command: "camera.fit", args: { layerId }, icon: "maximize", label: "Fit to content" };
}
function lockSpec(behaviourIds) {
  return {
    type: "toggle",
    key: "lock",
    command: "view.lock",
    ...behaviourIds ? { args: { behaviourIds: [...behaviourIds] } } : {},
    icon: "lock-open",
    activeIcon: "lock",
    label: "Lock view",
    activeLabel: "Unlock view"
  };
}
function historySpecs() {
  return [
    { type: "command", key: "undo", command: "history.undo", icon: "undo", label: "Undo" },
    { type: "command", key: "redo", command: "history.redo", icon: "redo", label: "Redo" }
  ];
}
function eraseSpec(opts) {
  const args = {
    ...opts.layerId ? { layerId: opts.layerId } : {},
    ...opts.clickSelectId ? { clickSelectId: opts.clickSelectId } : {}
  };
  return {
    type: "command",
    key: "erase",
    command: "graph.erase",
    ...Object.keys(args).length > 0 ? { args } : {},
    icon: opts.icon,
    label: "Clear canvas",
    activeLabel: "Erase selection",
    activeText: "Selection"
  };
}
function gridSpec(opts = {}) {
  const args = {
    ...opts.layerId ? { layerId: opts.layerId } : {},
    ...opts.patternType ? { patternType: opts.patternType } : {}
  };
  return {
    type: "toggle",
    key: "grid",
    command: "background.grid",
    ...Object.keys(args).length > 0 ? { args } : {},
    icon: "grid",
    label: "Toggle grid"
  };
}
var NODE_LABELS = { simple: "Simple", table: "Table" };
var NODE_ICONS = { simple: Circle, table: Table };
var EDGE_LABELS = {
  straight: "Straight",
  orth: "Orthogonal",
  bezier: "Curved"
};
var EDGE_ICONS = {
  straight: Minus,
  orth: CornerDownRight,
  bezier: Spline
};
function assemble(groups) {
  const present = groups.filter((g) => g.length > 0);
  return present.flatMap((g, i) => i === 0 ? g : [{ type: "divider", key: `d${i}` }, ...g]);
}
function SchemaToolbar({
  nodeMode,
  onNodeModeChange,
  layout,
  onLayoutChange,
  layoutOptions,
  layoutIcons,
  edgeRouting,
  onEdgeRoutingChange,
  layerId = "graph",
  sections,
  icons,
  orientation = "horizontal",
  canvas,
  className
}) {
  const s = {
    nodes: true,
    layout: true,
    edges: true,
    fit: true,
    ...sections
  };
  const fitSpecs = useMemo(() => [fitSpec(layerId)], [layerId]);
  const fitItems = useControlItems(fitSpecs, { canvas });
  const nodeGroup = s.nodes ? [
    {
      type: "select",
      key: "schema-node-mode",
      label: "Nodes",
      value: nodeMode,
      options: NODE_LABELS,
      icons: NODE_ICONS,
      display: "segmented",
      onChange: (v) => onNodeModeChange(v)
    }
  ] : [];
  const hasLayouts = !!layoutOptions && Object.keys(layoutOptions).length > 0;
  const layoutGroup = s.layout && hasLayouts && layout !== void 0 && onLayoutChange ? [
    {
      type: "select",
      key: "schema-layout",
      label: "Layout",
      value: layout,
      options: layoutOptions,
      ...layoutIcons ? { icons: layoutIcons } : {},
      display: "segmented",
      onChange: onLayoutChange
    }
  ] : [];
  const edgeGroup = s.edges ? [
    {
      type: "select",
      key: "schema-edge-routing",
      label: "Edges",
      value: edgeRouting,
      options: EDGE_LABELS,
      icons: EDGE_ICONS,
      display: "segmented",
      onChange: (v) => onEdgeRoutingChange(v)
    }
  ] : [];
  const fitGroup = s.fit ? applyIconOverrides(fitItems, icons) : [];
  const items = assemble([nodeGroup, layoutGroup, edgeGroup, fitGroup]);
  return /* @__PURE__ */ jsx(ToolbarItems, { items, orientation, className });
}
var EMPTY = { nodeTypes: [], edgeTypes: [] };
function useDerivedSchema(canvas, { layerId = "graph", nodeTypeOf, edgeTypeOf } = {}) {
  const layer = canvas?.layers.get(layerId) ?? void 0;
  const store = layer?.store;
  const [schema, setSchema] = useState(EMPTY);
  useEffect(() => {
    if (!store) {
      setSchema(EMPTY);
      return;
    }
    let frame2 = 0;
    const recompute = () => setSchema(store.schema ?? deriveSchema(store, { nodeTypeOf, edgeTypeOf }));
    const schedule = () => {
      if (frame2) return;
      frame2 = requestAnimationFrame(() => {
        frame2 = 0;
        recompute();
      });
    };
    recompute();
    const unsubs = [
      store.events.on("node:add", schedule),
      store.events.on("node:remove", schedule),
      store.events.on("node:update", schedule),
      store.events.on("edge:add", schedule),
      store.events.on("edge:remove", schedule),
      store.events.on("edge:update", schedule),
      store.events.on("schema", schedule)
    ];
    return () => {
      if (frame2) cancelAnimationFrame(frame2);
      for (const off of unsubs) off();
    };
  }, [store, nodeTypeOf, edgeTypeOf]);
  return schema;
}
var TYPE_PALETTE = [3900150, 15680580, 16096779, 1096065, 9133302, 440020, 15485081, 15381256];
var UNSET = "rgb(1, 2, 3)";
var UNSET_NUMBER = 66051;
function typeColor(name) {
  const slot = colorSlotByString(name);
  const live = readCssColor(`var(--color-data-${slot}, ${UNSET})`);
  return live !== void 0 && live !== UNSET_NUMBER ? live : TYPE_PALETTE[slot - 1];
}
var SCHEMA_NODE_ID_PREFIX = "type:";
function simpleNodeStyle(t) {
  return {
    shape: { kind: "circle", radius: 16 },
    bgFill: typeColor(t.name),
    bgStrokeWidth: 1.5,
    labelText: `${t.name} (${t.count})`,
    labelPlacement: "bottom",
    labelOffsetY: 6,
    labelFontSize: 12
  };
}
function tableNodeStyle(t) {
  const shape = schemaTableCard({
    label: `${t.name} \xB7 ${t.count}`,
    header: typeColor(t.name),
    fields: t.properties.map((p) => ({ name: p.name, type: p.type }))
  });
  return { shape };
}
function schemaToMetaGraph(schema, { nodeMode = "simple", edgeRouting = "straight" } = {}) {
  const n = schema.nodeTypes.length;
  const radius = Math.max(180, n * 45);
  const nodes = schema.nodeTypes.map((t, i2) => {
    const angle = 2 * Math.PI * i2 / Math.max(1, n);
    return {
      id: `${SCHEMA_NODE_ID_PREFIX}${t.name}`,
      type: t.name,
      data: t,
      position: { x: Math.round(Math.cos(angle) * radius), y: Math.round(Math.sin(angle) * radius) },
      style: nodeMode === "table" ? tableNodeStyle(t) : simpleNodeStyle(t)
    };
  });
  const present = new Set(nodes.map((node) => node.id));
  const edges = [];
  let i = 0;
  for (const et of schema.edgeTypes) {
    for (const c of et.connections) {
      const source = `${SCHEMA_NODE_ID_PREFIX}${c.from}`;
      const target = `${SCHEMA_NODE_ID_PREFIX}${c.to}`;
      if (!present.has(source) || !present.has(target)) continue;
      const pathType = c.from === c.to ? "loop-curve" : edgeRouting;
      edges.push({
        id: `edge:${et.name}:${i++}`,
        source,
        target,
        type: et.name,
        data: { edgeType: et.name, connection: c },
        style: {
          labelText: et.name,
          strokeWidth: 1.5,
          labelFontSize: 10,
          shape: { pathType }
        }
      });
    }
  }
  return { nodes, edges };
}
var SCHEMA_METAGRAPH_LAYER_ID = "schema";
function SchemaLayoutRunner({
  layouts,
  layout,
  fitPadding
}) {
  useLayout(layouts, { layerId: SCHEMA_METAGRAPH_LAYER_ID, initial: layout, applyInitial: true, fitPadding });
  return null;
}
function SchemaViewPanel({
  canvas,
  schema: explicitSchema,
  layerId = "graph",
  nodeTypeOf,
  edgeTypeOf,
  layouts,
  layoutLabels,
  layoutIcons,
  defaultLayout,
  defaultNodeMode = "simple",
  defaultEdgeRouting = "straight",
  showToolbar = true,
  fitPadding = 60,
  children,
  className
}) {
  const bothPassed = canvas !== void 0 && explicitSchema !== void 0;
  useEffect(() => {
    if (bothPassed) {
      console.warn(
        "[SchemaViewPanel] Pass either `canvas` (derive/read the schema from a live canvas) or `schema` (render a provided one) \u2014 not both. `schema` takes precedence."
      );
    }
  }, [bothPassed]);
  const resolved = useDerivedSchema(canvas, { layerId, nodeTypeOf, edgeTypeOf });
  const schema = explicitSchema ?? resolved;
  const layoutKeys = layouts ? Object.keys(layouts) : [];
  const hasLayouts = layoutKeys.length > 0;
  const [nodeMode, setNodeMode] = useState(defaultNodeMode);
  const [edgeRouting, setEdgeRouting] = useState(defaultEdgeRouting);
  const [layout, setLayout] = useState(defaultLayout ?? layoutKeys[0] ?? "");
  const meta = useMemo(
    () => schemaToMetaGraph(schema, { nodeMode, edgeRouting }),
    [schema, nodeMode, edgeRouting]
  );
  const signature = useMemo(() => schemaSignature(schema), [schema]);
  if (schema.nodeTypes.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: `grid h-full w-full place-items-center p-4 ${className ?? ""}`, children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground text-sm", children: "No schema yet \u2014 load a graph to see its node & edge types." }) });
  }
  const layoutOptions = layoutLabels ?? Object.fromEntries(layoutKeys.map((k) => [k, k]));
  return /* @__PURE__ */ jsx("div", { className: `relative h-full w-full ${className ?? ""}`, children: /* @__PURE__ */ jsxs(GraphCanvas, { autoResize: true, className: "h-full w-full", children: [
    /* @__PURE__ */ jsx(BackgroundLayer, { id: "bg", type: "pattern", patternType: "grid", alpha: 0.5 }),
    /* @__PURE__ */ jsx(ThemeBehaviour, { id: "theme", mode: "document", active: "default", accent: "css-var" }),
    /* @__PURE__ */ jsx(CanvasThemeSync, {}),
    /* @__PURE__ */ jsx(GraphLayer, { id: SCHEMA_METAGRAPH_LAYER_ID, data: meta }),
    /* @__PURE__ */ jsx(WheelZoomBehaviour, { id: "wheel" }),
    /* @__PURE__ */ jsx(DragPanBehaviour, { id: "pan" }),
    /* @__PURE__ */ jsx(DragNodeBehaviour, { id: "drag-node", targetLayerId: SCHEMA_METAGRAPH_LAYER_ID }),
    /* @__PURE__ */ jsx(ParallelEdgeBehaviour, { id: "parallel-edge", targetLayerId: SCHEMA_METAGRAPH_LAYER_ID, spacing: 44 }),
    /* @__PURE__ */ jsx(TextResolutionLODBehaviour, { id: "label-lod", targetLayerId: SCHEMA_METAGRAPH_LAYER_ID }),
    /* @__PURE__ */ jsx(HoverActivateBehaviour, { id: "hover", targetLayerId: SCHEMA_METAGRAPH_LAYER_ID, state: "highlighted", degree: 1 }),
    children,
    hasLayouts && layouts ? /* @__PURE__ */ jsx(
      SchemaLayoutRunner,
      {
        layouts,
        layout,
        fitPadding
      },
      `${layout}:${nodeMode}:${edgeRouting}:${signature}`
    ) : null,
    showToolbar ? /* @__PURE__ */ jsx(ControlPanel, { id: "schema-toolbar", position: "top-left", surface: false, children: /* @__PURE__ */ jsx(
      SchemaToolbar,
      {
        nodeMode,
        onNodeModeChange: setNodeMode,
        layout: hasLayouts ? layout : void 0,
        onLayoutChange: hasLayouts ? setLayout : void 0,
        layoutOptions: hasLayouts ? layoutOptions : void 0,
        layoutIcons,
        edgeRouting,
        onEdgeRoutingChange: setEdgeRouting,
        layerId: SCHEMA_METAGRAPH_LAYER_ID
      }
    ) }) : null,
    /* @__PURE__ */ jsx(
      ControlPanel,
      {
        id: "schema-zoom",
        position: "bottom-left",
        orientation: "vertical",
        surface: false,
        items: [
          { type: "command", command: "camera.zoomIn", icon: "zoom-in", label: "Zoom in" },
          { type: "command", command: "camera.zoomOut", icon: "zoom-out", label: "Zoom out" }
        ]
      }
    ),
    /* @__PURE__ */ jsx(ControlPanels, {})
  ] }) });
}
function useApplyTypeStyling(canvas, layerId, patch, enabled) {
  const layer = canvas?.layers.get(layerId) ?? void 0;
  const before = useRef(null);
  useEffect(() => {
    if (!layer || !enabled) return;
    if (before.current?.layer !== layer) {
      const node2 = layer.nodeDefaults ?? {};
      const edge = layer.edgeDefaults ?? {};
      before.current = {
        layer,
        node: { bgFill: node2["bgFill"], size: node2["size"], labelText: node2["labelText"] },
        edge: { strokeColor: edge["strokeColor"], strokeWidth: edge["strokeWidth"] },
        owned: /* @__PURE__ */ new Set()
      };
    }
    const prior = before.current;
    const nodeTypes = patch.nodeTypes ?? {};
    const edgeTypes = patch.edgeTypes ?? {};
    const styles = (types, key) => Object.values(types).some((t) => t[key] !== void 0);
    const take = (out, scope, field, styled, resolver) => {
      const key = `${scope}.${field}`;
      if (styled) {
        out[field] = resolver;
        prior.owned.add(key);
      } else if (prior.owned.delete(key)) {
        out[field] = prior[scope][field];
      }
    };
    const anyLabelKey = Object.values(nodeTypes).some((s) => s.labelKey);
    const node = {};
    take(node, "node", "bgFill", styles(nodeTypes, "color"), (n) => {
      const color = nodeTypes[n.type]?.color;
      return color ? hexToNumber(color) : resolveField(prior.node["bgFill"], n);
    });
    take(
      node,
      "node",
      "size",
      styles(nodeTypes, "size"),
      (n) => nodeTypes[n.type]?.size ?? resolveField(prior.node["size"], n)
    );
    if (Object.keys(node).length === 0 && !anyLabelKey) {
      applyEdges();
      return;
    }
    layer.setNodeDefaults({
      ...node,
      // Only installed once some type actually picks a key — see `anyLabelKey`.
      ...anyLabelKey ? {
        labelText: (n) => {
          const key = nodeTypes[n.type]?.labelKey;
          if (!key && prior.node["labelText"] !== void 0) {
            return resolveField(prior.node["labelText"], n);
          }
          const value = readValueKey(n, key ?? "id");
          return value === void 0 || value === null ? void 0 : String(value);
        }
      } : {}
    });
    applyEdges();
    function applyEdges() {
      const edge = {};
      take(edge, "edge", "strokeColor", styles(edgeTypes, "color"), (e) => {
        const color = edgeTypes[e.type]?.color;
        return color ? hexToNumber(color) : resolveField(prior.edge["strokeColor"], e);
      });
      take(
        edge,
        "edge",
        "strokeWidth",
        styles(edgeTypes, "width"),
        (e) => edgeTypes[e.type]?.width ?? resolveField(prior.edge["strokeWidth"], e)
      );
      if (Object.keys(edge).length > 0) layer.setEdgeDefaults(edge);
    }
  }, [layer, enabled, JSON.stringify(patch)]);
}
var BAR_H = 34;
var COLORS = ["amber", "blue", "green", "red", "grey"];
var COLOR_NAME = { amber: "Amber", blue: "Blue", green: "Green", red: "Red", grey: "Grey" };
var BG = {
  amber: "bg-warning",
  blue: "bg-primary",
  green: "bg-success",
  red: "bg-destructive",
  grey: "bg-muted-foreground"
};
function AnnotationsOverlay(_props) {
  const canvas = useGraphCanvas();
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas) ?? "explore";
  const { states } = useCommandStates([{ command: "tool.active" }], canvas);
  const tool = states[0]?.value ?? "select";
  const host = useRef(null);
  const [, setFrame] = useState(0);
  const [drag, setDrag] = useState(null);
  const annotating = mode === "annotate";
  const selected = ctx.selectedId;
  const following = ctx.draft !== null || annotating && selected !== null;
  useEffect(() => {
    if (!following) return;
    let raf = null;
    const tick = () => {
      if (raf === null)
        raf = requestAnimationFrame(() => {
          raf = null;
          setFrame((f) => f + 1);
        });
    };
    const layer2 = canvas.layers.get(BOARD_IDS.graph);
    const offs = [
      canvas.events.on("input:camera:pan", tick),
      canvas.events.on("input:camera:zoom", tick),
      canvas.store.view.subscribe(tick),
      ...layer2 ? [layer2.events.on("data:changed", tick)] : []
    ];
    tick();
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      for (const off of offs) off?.();
    };
  }, [canvas, following]);
  const layer = canvas.layers.get(BOARD_IDS.graph);
  const cam = canvas.camera;
  const boxOf = (id) => {
    const n = layer?.store.getNode(id);
    const p = n ? layer.store.getPosition(id) : void 0;
    if (!n || !p) return null;
    const size = resolveNodeSize(layer, n);
    const c = cam.toScreen(p.x, p.y);
    const w = size.width * cam.scale;
    const h = size.height * cam.scale;
    return { x: c.x - w / 2, y: c.y - h / 2, w, h };
  };
  const boxOfAnnotation = (a) => {
    if (a.kind === "note" || a.kind === "value") return boxOf(annotationNodeId(a.id));
    if (a.kind === "group") {
      const f = canvas.layers.get(ANNOTATION_FRAMES_LAYER)?.frameBounds(a.id);
      if (f) {
        const c = cam.toScreen(f.x, f.y);
        return { x: c.x, y: c.y, w: f.width * cam.scale, h: f.height * cam.scale };
      }
    }
    const boxes = a.records.map((r) => boxOf(r.id)).filter((b) => b !== null);
    if (!boxes.length) return null;
    const x = Math.min(...boxes.map((b) => b.x));
    const y = Math.min(...boxes.map((b) => b.y));
    return { x, y, w: Math.max(...boxes.map((b) => b.x + b.w)) - x, h: Math.max(...boxes.map((b) => b.y + b.h)) - y };
  };
  const toolOn = annotating && ctx.actor.canWrite && (tool === "annotate" || tool === "highlight" || tool === "group");
  const catcher = useRef(null);
  useEffect(() => {
    const el = catcher.current;
    const target = canvas.renderer?.canvasElement;
    if (!el || !target) return;
    const onWheel = (e) => {
      e.preventDefault();
      target.dispatchEvent(new WheelEvent("wheel", e));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [canvas, toolOn]);
  const records = () => [...layer?.store.nodes() ?? []].filter((n) => !isAnnotationElement(n) && !n.hidden);
  const hit = (x, y) => {
    let best = null;
    for (const n of records()) {
      const b = boxOf(n.id);
      if (!b) continue;
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      const d = Math.hypot(cx - x, cy - y);
      if (d <= Math.max(b.w, b.h) / 2 + 6 && (!best || d < best.d)) best = { id: n.id, d };
    }
    if (best) return { id: best.id, kind: "node" };
    for (const e of layer?.store.edges() ?? []) {
      if (isAnnotationElement(e)) continue;
      const p = boxOf(e.source);
      const q = boxOf(e.target);
      if (p && q && segmentDistance(x, y, centre(p), centre(q)) <= 5) return { id: e.id, kind: "edge" };
    }
    return null;
  };
  const say = (text2) => canvas.showMessage(text2, 3e3);
  const local = (e) => {
    const r = host.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e) => {
    if (e.button !== 0) return;
    const p = local(e);
    e.target.setPointerCapture?.(e.pointerId);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onMove = (e) => {
    if (!drag) return;
    const p = local(e);
    setDrag({ ...drag, x1: p.x, y1: p.y });
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    const moved = Math.abs(d.x1 - d.x0) + Math.abs(d.y1 - d.y0) > 6;
    if (!moved) {
      const t = hit(d.x0, d.y0);
      if (tool === "annotate") {
        if (!t) return say("Annotations go on data. Click a node or a relationship.");
        return ctx.begin({ kind: "note", records: recordsOf(canvas, [t.id], t.kind) });
      }
      if (tool === "highlight") {
        if (!t || t.kind !== "node") return say("Click a node, or drag over several, to highlight them.");
        return ctx.begin({ kind: "highlight", records: recordsOf(canvas, [t.id], "node") });
      }
      return say("Drag around two or more records to group them.");
    }
    const area = { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
    const inside = records().filter((n) => {
      const b = boxOf(n.id);
      if (!b) return false;
      const c = centre(b);
      return c.x >= area.x && c.x <= area.x + area.w && c.y >= area.y && c.y <= area.y + area.h;
    }).map((n) => n.id);
    if (tool === "group") {
      if (inside.length < 2) return say("A group holds two or more records. Drag around them.");
      return ctx.begin({ kind: "group", records: recordsOf(canvas, inside, "node") });
    }
    if (tool === "highlight") {
      if (!inside.length) return say("Nothing to highlight there. Click a node, or drag over several.");
      return ctx.begin({ kind: "highlight", records: recordsOf(canvas, inside, "node") });
    }
    say("Annotations go on data. Click a node or a relationship.");
  };
  const draft = ctx.draft;
  const draftBox = draft ? boxOfAnnotation(draft) : null;
  const selectedA = annotating && selected && selected !== DRAFT_ID ? ctx.annotations.find((a) => a.id === selected) : void 0;
  const selectedBox = selectedA ? boxOfAnnotation(selectedA) : null;
  return /* @__PURE__ */ jsxs("div", { ref: host, className: "pointer-events-none absolute inset-0 z-[1] overflow-hidden", "aria-label": "Annotations", children: [
    drag && /* @__PURE__ */ jsx("svg", { className: "absolute inset-0 h-full w-full", "aria-hidden": "true", children: /* @__PURE__ */ jsx(
      "rect",
      {
        x: Math.min(drag.x0, drag.x1),
        y: Math.min(drag.y0, drag.y1),
        width: Math.abs(drag.x1 - drag.x0),
        height: Math.abs(drag.y1 - drag.y0),
        fill: "color-mix(in srgb, var(--color-primary) 6%, transparent)",
        stroke: "var(--color-primary)",
        strokeDasharray: "5 4"
      }
    ) }),
    draft && draftBox && (draft.kind === "note" || draft.kind === "value") && /* @__PURE__ */ jsx("div", { className: "bg-card pointer-events-auto absolute rounded-md border p-1 shadow-md", style: { left: draftBox.x, top: draftBox.y, width: Math.max(220, draftBox.w) }, children: /* @__PURE__ */ jsx(DraftEditor, { kind: draft.kind }) }),
    draft && draftBox && draft.kind === "group" && /* @__PURE__ */ jsx("div", { className: "bg-card pointer-events-auto absolute rounded-md border p-1 shadow-md", style: { left: draftBox.x, top: Math.max(4, draftBox.y - 44), width: 220 }, children: /* @__PURE__ */ jsx(GroupNameField, {}) }),
    selectedA && selectedBox && /* @__PURE__ */ jsx(
      FormatBar,
      {
        a: selectedA,
        x: selectedBox.x,
        y: Math.max(4, selectedBox.y - BAR_H - 6),
        onColor: (c) => ctx.update(selectedA.id, { color: c }),
        onDelete: () => ctx.remove(selectedA.id)
      }
    ),
    toolOn && /* @__PURE__ */ jsx(
      "div",
      {
        ref: catcher,
        className: "pointer-events-auto absolute inset-0 cursor-crosshair",
        onPointerDown: onDown,
        onPointerMove: onMove,
        onPointerUp: onUp,
        onPointerCancel: () => setDrag(null)
      }
    )
  ] });
}
function DraftEditor({ kind }) {
  const ctx = useAnnotations();
  const [text2, setText] = useState(ctx.draft?.text ?? "");
  const done = () => ctx.commit(text2);
  const key = (e) => {
    if (e.key === "Escape") ctx.cancel();
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) done();
  };
  const prompt = kind === "value" ? "What does this value say?" : "What does the data say here?";
  return /* @__PURE__ */ jsx(Textarea, { "aria-label": prompt, placeholder: prompt, rows: 3, autoFocus: true, value: text2, onChange: (e) => setText(e.target.value), onBlur: done, onKeyDown: key });
}
function GroupNameField() {
  const ctx = useAnnotations();
  const [label, setLabel] = useState(ctx.draft?.label ?? "");
  return /* @__PURE__ */ jsx(
    Input,
    {
      "aria-label": "Name the group",
      placeholder: "Name the group",
      autoFocus: true,
      value: label,
      onChange: (e) => setLabel(e.target.value),
      onBlur: () => ctx.commit("", label),
      onKeyDown: (e) => {
        if (e.key === "Enter") ctx.commit("", label);
        if (e.key === "Escape") ctx.cancel();
      }
    }
  );
}
function FormatBar({ a, x, y, onColor, onDelete }) {
  return /* @__PURE__ */ jsxs("div", { role: "toolbar", "aria-label": `Annotation by ${a.author.name}`, className: "bg-card pointer-events-auto absolute flex items-center gap-0.5 rounded-md border p-0.5 shadow-md", style: { left: x, top: y }, children: [
    a.canEdit && COLORS.map((c) => /* @__PURE__ */ jsx(Button, { size: "xs", variant: "ghost", "aria-label": COLOR_NAME[c], title: COLOR_NAME[c], "aria-pressed": a.color === c, onClick: () => onColor(c), children: /* @__PURE__ */ jsx("span", { className: cn("size-3 rounded-full", BG[c], a.color === c && "ring-foreground ring-2 ring-offset-1") }) }, c)),
    a.canDelete ? /* @__PURE__ */ jsx(Button, { size: "xs", variant: "ghost", "aria-label": "Delete", title: "Delete", className: "text-destructive", onClick: onDelete, children: /* @__PURE__ */ jsx(Trash2, { "aria-hidden": "true" }) }) : /* @__PURE__ */ jsx("span", { className: "text-muted-foreground px-1.5 text-xs whitespace-nowrap", children: a.whyNot ?? `Only ${a.author.name} can delete it` })
  ] });
}
function centre(b) {
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}
function segmentDistance(x, y, p, q) {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const L = dx * dx + dy * dy || 1;
  const t = Math.max(0, Math.min(1, ((x - p.x) * dx + (y - p.y) * dy) / L));
  return Math.hypot(x - (p.x + t * dx), y - (p.y + t * dy));
}
function fmt(v) {
  if (v === null || v === void 0 || v === "") return "\u2014";
  if (typeof v === "number") return v.toLocaleString();
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}
var GRAPH_EXPAND_COMMAND = "graph.expand";
function openBoardPanel(canvas, id) {
  if (canvas.commands.value(BOARD_PANEL_COMMAND) !== id) void canvas.commands.run(BOARD_PANEL_COMMAND, { value: id });
}
function openElementEditor(canvas, kind, id, isNew = false) {
  editElement(canvas, { kind, id }, { isNew });
  openBoardPanel(canvas, "element");
}
function newBoardElementId() {
  return `new-${globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)}`;
}
function hideType(canvas, kind, type, layerId = "graph") {
  const store = canvas.layers.get(layerId)?.store;
  if (!store) return;
  if (kind === "node") {
    for (const n of store.nodes()) if (String(n.type) === type) store.setNodeHidden(n.id, true);
  } else {
    for (const e of store.edges()) if (String(e.type) === type) store.setEdgeHidden(e.id, true);
  }
}
var withExtra = (base, extra, ctx) => {
  const more = extra?.(ctx) ?? [];
  return more.length > 0 ? [...base, { separator: true }, ...more] : base;
};
function defaultBoardMenus(options = {}) {
  const { layerId = "graph", selectBehaviourId = "click-select", focusZoom = 2, newId = newBoardElementId, extra } = options;
  const layerOf2 = (canvas) => canvas.layers.get(layerId);
  const select = (canvas) => canvas.behaviours.get(selectBehaviourId);
  const erase = { command: "graph.erase", label: "Delete", shortcut: "\u232B", destructive: true, modes: ["edit"] };
  return {
    board: (ctx) => withExtra(
      [
        {
          id: "add-here",
          label: "Add a node here",
          shortcut: "N",
          modes: ["edit"],
          onClick: () => {
            const node = {
              id: newId(),
              type: UNKNOWN_TYPE,
              position: { x: ctx.world.x, y: ctx.world.y },
              pinned: true
            };
            layerOf2(ctx.canvas)?.store.addData({ nodes: [node], edges: [] });
            openElementEditor(ctx.canvas, "node", node.id, true);
          }
        },
        { separator: true, modes: ["edit"] },
        { command: BOARD_LAYOUT_COMMAND, args: { x: ctx.screen.x, y: ctx.screen.y }, label: "Layout\u2026" },
        { command: "camera.fit", label: "Fit to screen", shortcut: "\u21E71" },
        { separator: true },
        { command: "history.undo", label: "Undo", shortcut: "\u2318Z" },
        { command: "history.redo", label: "Redo", shortcut: "\u21E7\u2318Z" },
        { separator: true },
        { command: "layer.visible", args: { id: "minimap" }, label: "Minimap" },
        { command: "layer.visible", args: { id: "background" }, label: "Background grid" },
        { command: "view.lock", label: "Lock the view" },
        { separator: true },
        { id: "export", label: "Export\u2026", shortcut: "\u21E7\u2318E", onClick: () => openBoardPanel(ctx.canvas, "export") }
      ],
      extra?.board,
      ctx
    ),
    node: (ctx) => withExtra(
      [
        { command: GRAPH_EXPAND_COMMAND, label: "Expand neighbours" },
        { id: "focus", label: "Centre on it", onClick: () => layerOf2(ctx.canvas)?.focusNode(ctx.id, { zoom: focusZoom }) },
        { separator: true },
        { id: "hide", label: "Hide", shortcut: "H", onClick: () => layerOf2(ctx.canvas)?.store.setNodeHidden(ctx.id, true) },
        { id: "hide-type", label: `Hide every ${ctx.type}`, onClick: () => hideType(ctx.canvas, "node", ctx.type, layerId) },
        { id: "style", label: `Style ${ctx.type}\u2026`, onClick: () => openBoardPanel(ctx.canvas, "styling") },
        { separator: true },
        { id: "copy-id", label: "Copy id", onClick: () => void navigator.clipboard?.writeText(ctx.id) },
        { separator: true, modes: ["edit"] },
        {
          id: "edit-element",
          label: "Edit node",
          shortcut: "\u21B5",
          modes: ["edit"],
          onClick: () => openElementEditor(ctx.canvas, "node", ctx.id)
        },
        erase
      ],
      extra?.node,
      ctx
    ),
    edge: (ctx) => withExtra(
      [
        {
          id: "select-ends",
          label: "Select its two nodes",
          onClick: () => {
            const e = layerOf2(ctx.canvas)?.store.getEdge(ctx.id);
            if (e) select(ctx.canvas)?.selectMultiple([{ id: e.source }, { id: e.target }]);
          }
        },
        { separator: true },
        { id: "hide", label: "Hide", onClick: () => layerOf2(ctx.canvas)?.store.setEdgeHidden(ctx.id, true) },
        ...ctx.type ? [{ id: "hide-type", label: `Hide every ${ctx.type}`, onClick: () => hideType(ctx.canvas, "edge", ctx.type, layerId) }] : [],
        { separator: true, modes: ["edit"] },
        {
          id: "edit-element",
          label: "Edit relationship",
          modes: ["edit"],
          onClick: () => openElementEditor(ctx.canvas, "edge", ctx.id)
        },
        erase
      ],
      extra?.edge,
      ctx
    ),
    selection: (ctx) => withExtra(
      [
        { command: GRAPH_EXPAND_COMMAND, label: "Expand all" },
        {
          id: "hide",
          label: "Hide",
          onClick: () => {
            for (const n of ctx.nodeIds) layerOf2(ctx.canvas)?.store.setNodeHidden(n, true);
          }
        },
        { id: "export", label: "Export the selection\u2026", onClick: () => openBoardPanel(ctx.canvas, "export") },
        { separator: true },
        { id: "clear", label: "Clear selection", shortcut: "Esc", onClick: () => select(ctx.canvas)?.clearSelection() },
        { separator: true, modes: ["edit"] },
        erase
      ],
      extra?.selection,
      ctx
    )
  };
}
function AnnotationsViewPanel({ canvas, className }) {
  const ctx = useAnnotations();
  const view = ctx.panel;
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-1", className), children: [
    ctx.error && /* @__PURE__ */ jsx("p", { className: "text-destructive px-1 text-xs", children: ctx.error }),
    view.kind === "list" && /* @__PURE__ */ jsx(ListView, {}),
    view.kind === "record" && canvas && /* @__PURE__ */ jsx(RecordView, { canvas, recordId: view.recordId }),
    view.kind === "detail" && canvas && /* @__PURE__ */ jsx(DetailView, { canvas, id: view.id })
  ] });
}
function AnnotationsCount() {
  const ctx = useAnnotations();
  const n = ctx.annotations.filter((a) => ctx.onBoard(a)).length;
  return n ? /* @__PURE__ */ jsxs(Fragment, { children: [
    n,
    " here"
  ] }) : null;
}
function rowProps(a) {
  return {
    kind: a.kind,
    color: a.color,
    text: a.kind === "group" ? a.label || "Group" : a.text || (a.kind === "highlight" ? a.records.map((r) => r.label || r.id).join(" \xB7 ") : ""),
    where: whereOf(a),
    author: { name: a.author.name, kind: a.author.kind, ...a.author.initials ? { initials: a.author.initials } : {}, ...a.author.tone ? { tone: a.author.tone } : {} },
    ...a.meta ? { meta: a.meta } : {},
    ...a.sessionTag ? { sessionTag: a.sessionTag } : {}
  };
}
function ListView() {
  const ctx = useAnnotations();
  const [filter, setFilter] = useState("all");
  const list = ctx.annotations.filter((a) => a.id !== DRAFT_ID && (filter === "all" || authorGroup(a, ctx.isMine) === filter));
  const here = list.filter((a) => ctx.onBoard(a));
  const elsewhere = list.filter((a) => !ctx.onBoard(a));
  const hiddenHere = ctx.annotations.filter((a) => ctx.onBoard(a) && ctx.hidden(a)).length;
  const counts = (f) => ctx.annotations.filter((a) => f === "all" || authorGroup(a, ctx.isMine) === f).length;
  const filters = [
    { value: "all", label: `All ${counts("all")}` },
    { value: "mine", label: `You ${counts("mine")}` },
    { value: "others", label: `Others ${counts("others")}` },
    ...counts("assistant") ? [{ value: "assistant", label: `Assistant ${counts("assistant")}` }] : []
  ];
  if (ctx.annotations.length === 0) {
    return /* @__PURE__ */ jsx(
      EmptyState,
      {
        icon: /* @__PURE__ */ jsx(StickyNote, { className: "size-5", "aria-hidden": "true" }),
        title: "Nothing annotated on this graph yet",
        description: ctx.actor.canWrite ? "Pick Annotate in the mode picker, then click a node or relationship to say what the data says." : ctx.actor.whyNot ?? "You can view annotations here when someone adds them."
      }
    );
  }
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    hiddenHere > 0 && /* @__PURE__ */ jsxs("div", { className: "bg-accent flex items-center gap-2 rounded-md px-2 py-1.5 text-xs", children: [
      /* @__PURE__ */ jsx(EyeOff, { className: "size-3.5", "aria-hidden": "true" }),
      /* @__PURE__ */ jsx("span", { className: "flex-1", children: ctx.view.hidden.all ? `All ${here.length} hidden on this board, for everyone who opens it` : `${hiddenHere} hidden on this board` }),
      /* @__PURE__ */ jsx(Button, { size: "xs", variant: "ghost", onClick: ctx.showAll, children: "Show" })
    ] }),
    /* @__PURE__ */ jsx(SegmentedControl, { size: "xs", options: filters, value: filter, onValueChange: (v) => setFilter(v) }),
    /* @__PURE__ */ jsxs(Eyebrow, { children: [
      "On this board \xB7 ",
      here.length
    ] }),
    here.length === 0 && /* @__PURE__ */ jsxs("p", { className: "text-muted-foreground px-1 text-xs", children: [
      "None from ",
      filter === "mine" ? "you" : filter === "all" ? "anyone" : filter,
      " on what this board has loaded."
    ] }),
    here.map((a) => {
      const off = ctx.hidden(a);
      return /* @__PURE__ */ jsx(
        AnnotationRow,
        {
          ...rowProps(a),
          selected: ctx.selectedId === a.id,
          dimmed: off,
          onSelect: () => {
            ctx.select(a.id);
            ctx.openPanel({ kind: "detail", id: a.id });
          },
          trailing: /* @__PURE__ */ jsx(Button, { size: "xs", variant: "ghost", "aria-label": off ? "Show on this board" : "Hide on this board", title: off ? "Show on this board" : "Hide on this board", onClick: () => ctx.toggleHideId(a.id), children: off ? /* @__PURE__ */ jsx(EyeOff, { "aria-hidden": "true" }) : /* @__PURE__ */ jsx(Eye, { "aria-hidden": "true" }) })
        },
        a.id
      );
    }),
    elsewhere.length > 0 && /* @__PURE__ */ jsxs(Eyebrow, { children: [
      "Elsewhere in this graph \xB7 ",
      elsewhere.length
    ] }),
    elsewhere.map((a) => /* @__PURE__ */ jsx(
      AnnotationRow,
      {
        ...rowProps(a),
        dimmed: true,
        selected: ctx.selectedId === a.id,
        onSelect: () => ctx.openPanel({ kind: "detail", id: a.id }),
        ...ctx.canLoad ? {
          trailing: /* @__PURE__ */ jsx(Button, { size: "xs", variant: "outline", onClick: () => ctx.load(a.records.map((r) => r.id)), children: "Load" })
        } : {}
      },
      a.id
    )),
    /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 pt-2 text-xs", children: "Annotations belong to the graph. Any board that loads their records shows them." })
  ] });
}
function Back() {
  const ctx = useAnnotations();
  return /* @__PURE__ */ jsxs(Button, { size: "xs", variant: "ghost", className: "self-start", onClick: () => ctx.openPanel({ kind: "list" }), children: [
    /* @__PURE__ */ jsx(ChevronLeft, { "aria-hidden": "true" }),
    "All annotations"
  ] });
}
function RecordView({ canvas, recordId }) {
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas);
  const layer = canvas.layers.get(BOARD_IDS.graph);
  const n = layer?.store.getNode(recordId);
  const e = n ? void 0 : layer?.store.getEdge(recordId);
  const kind = n ? "node" : "edge";
  const rec = n ?? e;
  const name = labelOf(layer, recordId, kind);
  const props = Object.entries(rec?.data ?? {}).filter(([, v]) => v === null || typeof v !== "object");
  const can = mode === "annotate" && ctx.actor.canWrite;
  const on = ctx.annotations.filter((a) => a.records.some((r) => r.id === recordId));
  const count2 = (k) => on.filter((a) => a.kind === "value" && a.prop === k).length;
  const records = recordsOf(canvas, [recordId], kind);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Back, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: name }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground font-mono text-xs", children: rec?.type ?? kind })
    ] }),
    !rec && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-xs", children: "This record is not on the board." }),
    can && rec && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap gap-1.5 px-1", children: [
      /* @__PURE__ */ jsxs(Button, { size: "xs", variant: "secondary", onClick: () => ctx.begin({ kind: "note", records }), children: [
        /* @__PURE__ */ jsx(StickyNote, { "aria-hidden": "true" }),
        "Annotate ",
        name
      ] }),
      kind === "node" && /* @__PURE__ */ jsxs(Button, { size: "xs", variant: "secondary", onClick: () => ctx.begin({ kind: "highlight", records }), children: [
        /* @__PURE__ */ jsx(Highlighter, { "aria-hidden": "true" }),
        "Highlight"
      ] })
    ] }),
    props.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Eyebrow, { children: "Properties" }),
      /* @__PURE__ */ jsx(PropertyList, { children: props.map(([k, v]) => /* @__PURE__ */ jsx(PropertyRow, { label: k, mono: true, children: /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1.5", children: [
        /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: fmt(v) }),
        count2(k) > 0 && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-xs", children: count2(k) }),
        can && /* @__PURE__ */ jsx(Button, { size: "xs", variant: "ghost", "aria-label": `Annotate ${k}`, title: "Annotate this value", onClick: () => ctx.begin({ kind: "value", records, prop: k, valueThen: v }), children: /* @__PURE__ */ jsx(MessageSquareText, { "aria-hidden": "true" }) })
      ] }) }, k)) })
    ] }),
    /* @__PURE__ */ jsxs(Eyebrow, { children: [
      "On ",
      name,
      " \xB7 ",
      on.length
    ] }),
    on.length === 0 && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-xs", children: can ? "Nothing on it yet. Annotate a value above, or the whole record." : "Nothing on it yet." }),
    on.map((a) => /* @__PURE__ */ jsx(AnnotationRow, { ...rowProps(a), selected: ctx.selectedId === a.id, onSelect: () => ctx.openPanel({ kind: "detail", id: a.id }) }, a.id))
  ] });
}
function DetailView({ canvas, id }) {
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas);
  const a = ctx.annotations.find((x) => x.id === id);
  const [text2, setText] = useState(a?.text ?? "");
  useEffect(() => setText(a?.text ?? ""), [a?.text]);
  if (!a) {
    return /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(Back, {}),
      /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-xs", children: "This annotation is gone." })
    ] });
  }
  const layer = canvas.layers.get(BOARD_IDS.graph);
  const editable = mode === "annotate" && a.canEdit && a.kind !== "highlight";
  const r0 = a.records[0];
  const rec = r0 ? r0.kind === "node" ? layer?.store.getNode(r0.id) : layer?.store.getEdge(r0.id) : void 0;
  const now = a.kind === "value" && a.prop && rec ? fmt(rec.data?.[a.prop]) : null;
  const then = a.valueThen === void 0 ? null : fmt(a.valueThen);
  const onBoard = ctx.onBoard(a);
  const names = a.records.map((r) => r.label || r.id);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(Back, {}),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 px-1", children: [
      /* @__PURE__ */ jsx(AuthorMark, { kind: a.author.kind, name: a.author.name, ...a.author.initials ? { initials: a.author.initials } : {}, ...a.author.tone ? { tone: a.author.tone } : {} }),
      /* @__PURE__ */ jsx("span", { className: "font-semibold", children: a.kind === "group" ? "Group" : a.kind === "highlight" ? "Highlight" : "Annotation" }),
      /* @__PURE__ */ jsxs("span", { className: "text-muted-foreground text-xs", children: [
        a.author.name,
        a.meta ? ` \xB7 ${a.meta}` : ""
      ] })
    ] }),
    editable ? /* @__PURE__ */ jsx(
      Textarea,
      {
        "aria-label": a.kind === "group" ? "Group name" : "Annotation text",
        rows: 3,
        value: a.kind === "group" ? a.label ?? "" : text2,
        onChange: (e) => a.kind === "group" ? ctx.update(a.id, { label: e.target.value }) : setText(e.target.value),
        onBlur: () => a.kind !== "group" && text2.trim() && text2 !== a.text && ctx.update(a.id, { text: text2.trim() })
      }
    ) : /* @__PURE__ */ jsx("p", { className: "px-1", children: a.kind === "group" ? a.label || "Group" : a.text }),
    /* @__PURE__ */ jsxs(PropertyList, { children: [
      /* @__PURE__ */ jsx(PropertyRow, { label: "On", mono: true, children: a.kind === "value" ? `${names[0]} \xB7 ${a.prop}` : names.slice(0, 6).join(" \xB7 ") + (names.length > 6 ? ` +${names.length - 6}` : "") }),
      a.kind === "value" && /* @__PURE__ */ jsxs(PropertyRow, { label: "Value", mono: true, children: [
        onBoard ? now : `${then} when noted`,
        onBoard && then !== null && then !== now && /* @__PURE__ */ jsxs("span", { className: "text-warning block text-xs", children: [
          "Was ",
          then,
          " when noted. The annotation keeps what it said."
        ] })
      ] }),
      /* @__PURE__ */ jsx(PropertyRow, { label: "From", children: a.author.kind === "assistant" ? `The assistant${a.meta ? ` \xB7 ${a.meta}` : ""}` : `Written by ${a.author.name}${a.meta ? `, ${a.meta}` : ""}` }),
      /* @__PURE__ */ jsx(PropertyRow, { label: "Seen in", children: a.sessionTag ? `Only the session \u201C${a.sessionTag}\u201D` : `The graph: every board and session that loads ${names.length > 2 ? "its records" : names.join(" or ")}` })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-1.5 border-t pt-2", children: [
      onBoard && /* @__PURE__ */ jsx(
        Button,
        {
          size: "xs",
          variant: "secondary",
          onClick: () => {
            ctx.select(a.id);
            if (ctx.hidden(a)) ctx.showAll();
            frame(canvas, layer, a.records.map((r) => r.id));
          },
          children: "Show on the board"
        }
      ),
      !onBoard && ctx.canLoad && /* @__PURE__ */ jsx(Button, { size: "xs", variant: "secondary", onClick: () => ctx.load(a.records.map((r) => r.id)), children: "Load its records" }),
      /* @__PURE__ */ jsx("span", { className: "flex-1" }),
      a.canDelete && /* @__PURE__ */ jsxs(Button, { size: "xs", variant: "ghost", className: "text-destructive", onClick: () => ctx.remove(a.id), children: [
        /* @__PURE__ */ jsx(Trash2, { "aria-hidden": "true" }),
        "Delete"
      ] })
    ] }),
    !a.canDelete && /* @__PURE__ */ jsx("p", { className: "text-muted-foreground px-1 text-xs", children: a.whyNot ?? `Only ${a.author.name} can delete it` })
  ] });
}
function frame(canvas, layer, ids) {
  const pts = [];
  for (const id of ids) {
    const e = layer?.store.getEdge(id);
    for (const n of e ? [e.source, e.target] : [id]) {
      const p = layer?.store.getNode(n) ? layer.store.getPosition(n) : void 0;
      if (p) pts.push(p);
    }
  }
  if (!pts.length) return;
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  canvas.camera.fitContent({ x, y, width: Math.max(...xs) - x || 1, height: Math.max(...ys) - y || 1 }, 160);
}
var UNSAVED_SAVE_COMMAND = "unsaved.save";
function ChangesViewPanel({
  canvas,
  trackerId = "unsaved-changes",
  layerId = "graph",
  saveTarget,
  saveDisabledReason,
  onSave,
  onDiscard,
  onRevert,
  className
}) {
  const { summary, tracker, discard } = useUnsavedChanges(trackerId, canvas);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(null);
  const [savedNow, setSavedNow] = useState(false);
  const [picked, setPicked] = useState(null);
  const layer = canvas.layers.get(layerId);
  const { states } = useCommandStates([{ command: UNSAVED_SAVE_COMMAND }], canvas);
  if (!tracker || !layer) {
    return /* @__PURE__ */ jsx(EmptyState, { title: "Changes are not tracked here", description: "This board keeps no record of what is unsaved." });
  }
  if (summary.count === 0) {
    return /* @__PURE__ */ jsx(
      EmptyState,
      {
        icon: /* @__PURE__ */ jsx(CircleCheck, { className: "text-success" }),
        title: "Everything is saved",
        description: savedNow ? "Saved just now." : "Nothing has changed since the last save."
      }
    );
  }
  const groups = rowsOf(summary, layer, tracker);
  const untyped = groups.flatMap(([, rows]) => rows).filter((r) => r.untyped).length;
  const canSave = !saveDisabledReason && untyped === 0 && (onSave ? true : !!states[0]?.enabled);
  const save = async () => {
    if (!canSave) return;
    setSaving(true);
    setFailed(null);
    try {
      if (onSave) {
        await onSave(tracker.changes());
        tracker.markSaved();
      } else {
        await canvas.commands.runAsync(UNSAVED_SAVE_COMMAND);
      }
      setSavedNow(true);
      setPicked(null);
    } catch (err) {
      setFailed(err instanceof Error && err.message ? err.message : "The graph didn\u2019t answer.");
    } finally {
      setSaving(false);
    }
  };
  const focus = (row) => {
    setPicked(row.key);
    if (row.kind === "node") layer.focusNode(row.id, { zoom: 1.5 });
    else layer.focusEdges([row.id]);
  };
  const foot = saveDisabledReason ? null : untyped > 0 ? `Give ${untyped === 1 ? "the new element" : `all ${untyped} new elements`} a type to save.` : saveTarget;
  return /* @__PURE__ */ jsxs("div", { className: cn("flex min-h-0 flex-col", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1.5", children: [
      failed !== null && /* @__PURE__ */ jsxs(Alert, { tone: "destructive", role: "alert", children: [
        /* @__PURE__ */ jsx(CircleAlert, {}),
        /* @__PURE__ */ jsx(AlertTitle, { children: "Couldn\u2019t save" }),
        /* @__PURE__ */ jsxs(AlertDescription, { children: [
          failed,
          " Nothing was saved; your ",
          summary.count,
          " changes are kept.",
          /* @__PURE__ */ jsx(Button, { variant: "outline", size: "sm", disabled: saving, onClick: () => void save(), children: "Try again" })
        ] })
      ] }),
      saveDisabledReason && /* @__PURE__ */ jsxs(Alert, { children: [
        /* @__PURE__ */ jsx(Lock, {}),
        /* @__PURE__ */ jsx(AlertTitle, { children: "You can change this board, not the graph" }),
        /* @__PURE__ */ jsx(AlertDescription, { children: saveDisabledReason })
      ] }),
      groups.map(([title, rows]) => /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-0.5", children: [
        /* @__PURE__ */ jsxs(Eyebrow, { children: [
          title,
          " ",
          rows.length
        ] }),
        /* @__PURE__ */ jsx(DiffList, { children: rows.map((row) => /* @__PURE__ */ jsxs(
          DiffRow,
          {
            op: row.op,
            marker: "chip",
            ...row.type ? { kind: row.type } : {},
            description: describe(row),
            selected: picked === row.key,
            ...row.op === "remove" ? {} : { onActivate: () => focus(row), activateTitle: "Show it on the board" },
            actions: saving ? void 0 : /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon-sm",
                "aria-label": `Revert ${row.name}`,
                title: "Revert this change",
                onClick: () => {
                  if (picked === row.key) setPicked(null);
                  if (onRevert) onRevert(row.kind, row.id);
                  else tracker.revert(row.kind, row.id);
                },
                children: /* @__PURE__ */ jsx(RotateCcw, {})
              }
            ),
            className: cn(saving && "opacity-60"),
            children: [
              /* @__PURE__ */ jsx(
                "span",
                {
                  "aria-hidden": "true",
                  className: cn("size-2 shrink-0", row.kind === "node" ? "rounded-full" : "rounded-[2px]", !row.swatch && "bg-muted-foreground"),
                  style: row.swatch ? { background: row.swatch } : void 0
                }
              ),
              /* @__PURE__ */ jsx("span", { className: cn("truncate", row.op === "remove" && "line-through"), children: row.name })
            ]
          },
          row.key
        )) })
      ] }, title))
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "border-border flex shrink-0 flex-col gap-2 border-t p-2.5", children: [
      foot && /* @__PURE__ */ jsx("span", { className: cn("text-xs", untyped > 0 ? "text-warning" : "text-muted-foreground"), children: foot }),
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-end gap-1.5", children: [
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            size: "sm",
            disabled: saving,
            onClick: () => {
              setPicked(null);
              setFailed(null);
              setSavedNow(false);
              if (onDiscard) onDiscard();
              else discard();
            },
            children: "Discard all"
          }
        ),
        /* @__PURE__ */ jsxs(Button, { size: "sm", disabled: saving || !canSave, onClick: () => void save(), children: [
          saving && /* @__PURE__ */ jsx(Spinner, {}),
          saving ? "Saving\u2026" : failed !== null ? "Try again" : `Save ${summary.count} ${summary.count === 1 ? "change" : "changes"}`
        ] })
      ] })
    ] })
  ] });
}
function describe(row) {
  if (row.diff) {
    return /* @__PURE__ */ jsxs("span", { className: "flex items-center gap-1 font-mono", children: [
      /* @__PURE__ */ jsx("span", { children: row.diff.field }),
      /* @__PURE__ */ jsx("span", { className: "line-through", children: row.diff.from }),
      /* @__PURE__ */ jsx("span", { children: "\u2192" }),
      /* @__PURE__ */ jsx("span", { className: "text-foreground font-semibold", children: row.diff.to })
    ] });
  }
  if (row.untyped) return /* @__PURE__ */ jsx("span", { className: "text-warning", children: "Needs a type" });
  return row.note;
}
function ChangesCount({ canvas, trackerId = "unsaved-changes" }) {
  const { count: count2 } = useUnsavedChanges(trackerId, canvas);
  return count2 ? /* @__PURE__ */ jsxs("span", { className: "text-warning", children: [
    count2,
    " unsaved"
  ] }) : null;
}
function rowsOf(s, layer, tracker) {
  const store = layer.store;
  const nodeName = (id) => {
    const n = store.getNode(id) ?? s.nodes.deleted.find((d) => d.id === id);
    return n ? displayNameOf(n) : id;
  };
  const nodeRow = (n, op) => {
    const swatch = op === "remove" ? void 0 : nodeSwatchColor(layer.resolveNodeStyle(n));
    return { key: "n:" + n.id, kind: "node", id: n.id, op, name: displayNameOf(n), type: labelOfNode(n), ...swatch ? { swatch } : {} };
  };
  const edgeRow = (e, op) => ({
    key: "e:" + e.id,
    kind: "edge",
    id: e.id,
    op,
    name: `${nodeName(e.source)} \u2192 ${nodeName(e.target)}`,
    type: labelOfEdge(e)
  });
  const withDiff = (row, current) => {
    const diff = firstDiff(tracker.before(row.kind, row.id), current);
    return diff ? { ...row, diff } : row;
  };
  const nodes = (ids) => ids.flatMap((id) => store.getNode(id) ? [store.getNode(id)] : []);
  const edges = (ids) => ids.flatMap((id) => store.getEdge(id) ? [store.getEdge(id)] : []);
  const deletedNodes = new Set(s.nodes.deleted.map((n) => n.id));
  const deletedEdges = s.edges.deleted;
  const isNew = (row, type) => typeof type === "string" && type.trim() !== "" && type !== NO_TYPE ? { ...row, note: `New ${row.type}` } : { ...row, type: "", untyped: true };
  const plural = (n, one) => `${n} ${one}${n === 1 ? "" : "s"}`;
  const added = [
    ...nodes(s.nodes.new).map((n) => isNew(nodeRow(n, "add"), n.type)),
    ...edges(s.edges.new).map((e) => isNew(edgeRow(e, "add"), e.type))
  ];
  const edited = [
    ...nodes(s.nodes.edited).map((n) => withDiff(nodeRow(n, "change"), n)),
    ...edges(s.edges.edited).map((e) => withDiff(edgeRow(e, "change"), e))
  ];
  const deleted = [
    ...s.nodes.deleted.map((n) => {
      const along = deletedEdges.filter((e) => e.source === n.id || e.target === n.id).length;
      const row = nodeRow(n, "remove");
      return along ? { ...row, note: `Deleted with ${plural(along, "relationship")}` } : row;
    }),
    ...deletedEdges.map((e) => {
      const gone = [e.source, e.target].find((id) => deletedNodes.has(id));
      const row = edgeRow(e, "remove");
      return gone ? { ...row, note: `Deleted with ${nodeName(gone)}` } : row;
    })
  ];
  return [["Added", added], ["Edited", edited], ["Deleted", deleted]].filter(([, rows]) => rows.length > 0);
}
function firstDiff(before, current) {
  if (!before || !current) return void 0;
  for (const [field, was] of Object.entries(before)) {
    const now = current[field];
    if (field === "data" && (isRecord(was) || isRecord(now))) {
      const a = isRecord(was) ? was : {};
      const b = isRecord(now) ? now : {};
      for (const k of /* @__PURE__ */ new Set([...Object.keys(a), ...Object.keys(b)])) {
        if (text(a[k]) !== text(b[k])) return { field: k, from: text(a[k]), to: text(b[k]) };
      }
      continue;
    }
    if (field === "style" && isRecord(was) && isRecord(now) && text(was.labelText) !== text(now.labelText)) {
      return { field: "label", from: text(was.labelText), to: text(now.labelText) };
    }
    if (text(was) !== text(now)) return { field, from: text(was), to: text(now) };
  }
  return void 0;
}
function text(v) {
  if (v === void 0 || v === null || v === "") return "\u2014";
  return typeof v === "string" ? v : JSON.stringify(v);
}
var IMAGE_DEFAULT = { format: "png", area: "content", background: "canvas", scale: 2, aspectRatio: 0 };
var AREAS = [
  { value: "viewport", label: "In view" },
  { value: "content", label: "Whole board" }
];
var FORMATS = [
  { value: "png", label: "PNG" },
  { value: "svg", label: "SVG" }
];
function exportGraphData(layer, nodeIds) {
  const nodeSet = nodeIds ? new Set(nodeIds) : null;
  const nodes = [];
  for (const n of layer.store.nodes()) {
    if (n.hidden || isAnnotationElement(n) || nodeSet && !nodeSet.has(n.id)) continue;
    nodes.push({ id: n.id, type: n.type, ...n.data !== void 0 ? { data: n.data } : {}, ...n.position ? { position: n.position } : {} });
  }
  const kept = new Set(nodes.map((n) => n.id));
  const edges = [];
  for (const e of layer.store.edges()) {
    if (e.hidden || !kept.has(e.source) || !kept.has(e.target)) continue;
    edges.push({ id: e.id, source: e.source, target: e.target, type: e.type ?? "", ...e.data !== void 0 ? { data: e.data } : {} });
  }
  return { nodes, edges };
}
function saveJson(data, filename) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function ExportViewPanel({
  canvas,
  layerId = "graph",
  clickSelectId = "click-select",
  filename = "board",
  dataFilename = "exported-data.json",
  defaultKind = "image",
  className
}) {
  const [kind, setKind] = useState(defaultKind);
  const [image, setImage] = useState(IMAGE_DEFAULT);
  const [scope, setScope] = useState("board");
  const { download } = useCanvasImageExport(canvas);
  const selection = useSelection({ clickSelectId }, canvas);
  const layer = canvas.layers.get(layerId);
  const hasSelection = selection.selectedNodeIds.length > 0;
  const picked = scope === "selection" && hasSelection ? "selection" : "board";
  const data = layer ? exportGraphData(layer, picked === "selection" ? selection.selectedNodeIds : void 0) : { nodes: [], edges: [] };
  return /* @__PURE__ */ jsxs("div", { className: cn("flex flex-col gap-3 p-2", className), children: [
    /* @__PURE__ */ jsx(
      SegmentedControl,
      {
        size: "sm",
        "aria-label": "What to export",
        value: kind,
        onValueChange: (v) => setKind(v),
        options: [
          { value: "image", label: "Image" },
          { value: "data", label: "Data" }
        ]
      }
    ),
    kind === "image" ? /* @__PURE__ */ jsx(
      ExportImagePanel,
      {
        title: null,
        value: image,
        onChange: (patch) => setImage((v) => ({ ...v, ...patch })),
        onSave: () => void download({
          format: image.format,
          area: image.area,
          background: image.background,
          scale: image.scale,
          filename: `${filename}-${image.area === "viewport" ? "view" : "board"}`
        }),
        areas: AREAS,
        formats: FORMATS,
        saveIcon: ImageDown,
        saveLabel: "Export image"
      }
    ) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx(
        SegmentedControl,
        {
          size: "sm",
          "aria-label": "Which elements",
          value: picked,
          onValueChange: (v) => setScope(v),
          options: [
            { value: "board", label: "Whole board" },
            { value: "selection", label: "Selection", disabled: !hasSelection }
          ]
        }
      ),
      /* @__PURE__ */ jsxs(PropertyList, { children: [
        /* @__PURE__ */ jsx(PropertyRow, { label: "Nodes", children: data.nodes.length.toLocaleString() }),
        /* @__PURE__ */ jsx(PropertyRow, { label: "Edges", children: data.edges.length.toLocaleString() }),
        /* @__PURE__ */ jsx(PropertyRow, { label: "File", children: dataFilename })
      ] }),
      /* @__PURE__ */ jsxs(Button, { size: "sm", onClick: () => saveJson(data, dataFilename), disabled: data.nodes.length === 0, children: [
        /* @__PURE__ */ jsx(Download, {}),
        " Export data"
      ] })
    ] })
  ] });
}
function HistoryToolbar({
  icons,
  orientation = "horizontal",
  showRedraw = true,
  layerId,
  canvas,
  className
}) {
  const specs = [
    ...historySpecs(),
    ...showRedraw ? [{ type: "command", key: "redraw", command: "graph.redraw", ...layerId ? { args: { layerId } } : {}, icon: "refresh", label: "Redraw" }] : []
  ];
  const items = useControlItems(specs, { canvas });
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(items, icons), orientation, className });
}
function HistoryViewPanel({ canvas, className, ...rest }) {
  const fromContext = useContext(CanvasContext);
  const resolved = canvas === void 0 ? fromContext : canvas;
  if (!resolved) {
    return /* @__PURE__ */ jsx(Card, { className: cn("flex h-full w-full items-center justify-center", className), children: /* @__PURE__ */ jsx("p", { className: "text-muted-foreground p-4 text-base", children: "No canvas yet." }) });
  }
  return /* @__PURE__ */ jsx(HistoryViewPanelContent, { canvas: resolved, className, ...rest });
}
function count(n, noun, plural = `${noun}s`) {
  return `${n} ${n === 1 ? noun : plural}`;
}
function summariseDelta(delta) {
  const out = [];
  const addedNodes = delta.added?.nodes?.length ?? 0;
  const addedEdges = delta.added?.edges?.length ?? 0;
  const removedNodes = delta.removed?.nodeIds?.length ?? 0;
  const removedEdges = delta.removed?.edgeIds?.length ?? 0;
  const updated = (delta.updated?.nodes?.length ?? 0) + (delta.updated?.edges?.length ?? 0);
  const hidden = (delta.hidden?.nodeIds?.length ?? 0) + (delta.hidden?.edgeIds?.length ?? 0);
  const shown = (delta.shown?.nodeIds?.length ?? 0) + (delta.shown?.edgeIds?.length ?? 0);
  const pinned = delta.pinned?.length ?? 0;
  if (addedNodes) out.push(`+${count(addedNodes, "node")}`);
  if (addedEdges) out.push(`+${count(addedEdges, "edge")}`);
  if (removedNodes) out.push(`\u2212${count(removedNodes, "node")}`);
  if (removedEdges) out.push(`\u2212${count(removedEdges, "edge")}`);
  if (updated) out.push(`${updated} updated`);
  if (hidden) out.push(`${hidden} hidden`);
  if (shown) out.push(`${shown} shown`);
  if (pinned) out.push(`${pinned} pinned`);
  return out;
}
function age(at, now) {
  const s = Math.max(0, Math.round((now - at) / 1e3));
  if (s < 5) return "now";
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  return `${Math.floor(s / 3600)}h`;
}
function HistoryViewPanelContent({ canvas, showUndoRedo = true, className }) {
  const [actor, setActor] = useState(void 0);
  const all = useHistoryEntries(void 0, canvas);
  const actors = useMemo(() => [...new Set(all.map((e) => e.actor))].sort(), [all]);
  const active = actor !== void 0 && actors.includes(actor) ? actor : void 0;
  const shown = useMemo(
    () => (active === void 0 ? all : all.filter((e) => e.actor === active)).slice().reverse(),
    [all, active]
  );
  const [now, setNow] = useState(() => performance.now());
  useEffect(() => {
    setNow(performance.now());
    const timer = setInterval(() => setNow(performance.now()), 15e3);
    return () => clearInterval(timer);
  }, [all]);
  return /* @__PURE__ */ jsxs("div", { className: cn("flex h-full flex-col gap-2 overflow-hidden p-2 text-base", className), children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-sm whitespace-nowrap", children: count(all.length, "entry", "entries") }),
      showUndoRedo && /* @__PURE__ */ jsx(HistoryToolbar, { canvas, showRedraw: false })
    ] }),
    actors.length > 1 && /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
      /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: cn("h-6 px-2 text-sm", active === void 0 && ACTIVE_CLASS), onClick: () => setActor(void 0), children: "All" }),
      actors.map((a) => /* @__PURE__ */ jsx(
        Button,
        {
          variant: "ghost",
          size: "sm",
          className: cn("h-6 px-2 text-sm", active === a && ACTIVE_CLASS),
          onClick: () => setActor(a),
          children: a
        },
        a
      ))
    ] }),
    /* @__PURE__ */ jsx(Separator, {}),
    /* @__PURE__ */ jsxs("ol", { className: "flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto", children: [
      shown.map((entry) => /* @__PURE__ */ jsx(HistoryRow, { entry, canvas, now }, entry.id)),
      shown.length === 0 && /* @__PURE__ */ jsx("li", { className: "text-muted-foreground px-2 text-sm", children: "Nothing recorded yet." })
    ] })
  ] });
}
function HistoryRow({ entry, canvas, now }) {
  const data = canvas.history.entryData(entry).flatMap((d) => summariseDelta(d.delta));
  let action;
  for (const part of entry.parts) if (part.kind === "view" && part.action) action ??= part.action;
  const label = entry.title ?? action ?? (data.length > 0 ? "Data change" : "Change");
  const stepIndex = entry.stepId ? canvas.playbook.steps.findIndex((s) => s.id === entry.stepId) : -1;
  const step = stepIndex >= 0 ? canvas.playbook.steps[stepIndex] : void 0;
  return /* @__PURE__ */ jsxs("li", { className: "hover:bg-muted flex flex-col gap-0.5 rounded-md px-2 py-1", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
      /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", children: label }),
      /* @__PURE__ */ jsx("span", { className: "text-muted-foreground shrink-0 text-[10px] tabular-nums", children: age(entry.at, now) })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "flex flex-wrap items-center gap-1", children: [
      /* @__PURE__ */ jsx(Badge, { variant: "outline", className: "px-1.5 py-0 text-[10px]", children: entry.actor }),
      entry.stepId && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", title: step?.title ?? entry.stepId, children: step ? `step ${stepIndex + 1}` : "step" }),
      entry.coalesced && /* @__PURE__ */ jsx(Badge, { variant: "secondary", className: "px-1.5 py-0 text-[10px]", children: "streamed" }),
      data.length > 0 && /* @__PURE__ */ jsx("span", { className: "text-muted-foreground text-[11px]", children: data.join(" \xB7 ") })
    ] })
  ] });
}

// src/view-panels/styling/utils.ts
var LABEL_DEFAULT = "__default__";
function defaultTypeColor(name) {
  return numberToHex(typeColor(name));
}
function labelKeyOptions(properties) {
  return [
    { value: "id", label: "id" },
    { value: "type", label: "type" },
    ...properties.map((p) => ({ value: `data.${p.name}`, label: `property.${p.name}` }))
  ];
}
function ColorControl({
  color,
  label,
  presets,
  onPick
}) {
  return /* @__PURE__ */ jsxs(Popover, { children: [
    /* @__PURE__ */ jsx(PopoverTrigger, { asChild: true, children: /* @__PURE__ */ jsx(
      Button,
      {
        variant: "outline",
        size: "icon",
        "aria-label": `${label} colour`,
        title: `${label} colour`,
        className: "h-6 w-8 shrink-0 p-0",
        children: /* @__PURE__ */ jsx("span", { className: "h-4 w-6 rounded-sm", style: { backgroundColor: color } })
      }
    ) }),
    /* @__PURE__ */ jsx(PopoverContent, { className: "w-auto p-2", align: "end", children: /* @__PURE__ */ jsx(ColorSwatches, { value: color, onChange: onPick, presetColors: presets }) })
  ] });
}
function StylingViewPanel({
  canvas: explicit,
  layerId = "graph",
  value,
  onChange,
  presetColors,
  sizeRange = [4, 64],
  widthRange = [0.5, 12],
  apply = true,
  emptyText = "Load some data, then style its node & edge types here.",
  className
}) {
  const contextCanvas = useContext(GraphCanvasContext);
  const canvas = explicit ?? contextCanvas;
  const schema = useDerivedSchema(canvas, { layerId });
  useApplyTypeStyling(canvas, layerId, value, apply);
  const presets = presetColors ?? [...COLOR_PRESETS];
  const setNode = (type, patch) => {
    const nodeTypes = { ...value.nodeTypes ?? {} };
    nodeTypes[type] = { ...nodeTypes[type], ...patch };
    onChange({ ...value, nodeTypes });
  };
  const setEdge = (type, patch) => {
    const edgeTypes = { ...value.edgeTypes ?? {} };
    edgeTypes[type] = { ...edgeTypes[type], ...patch };
    onChange({ ...value, edgeTypes });
  };
  const resetNode = (type) => {
    const nodeTypes = { ...value.nodeTypes ?? {} };
    delete nodeTypes[type];
    onChange({ ...value, nodeTypes });
  };
  const resetEdge = (type) => {
    const edgeTypes = { ...value.edgeTypes ?? {} };
    delete edgeTypes[type];
    onChange({ ...value, edgeTypes });
  };
  const empty = schema.nodeTypes.length === 0 && schema.edgeTypes.length === 0;
  return /* @__PURE__ */ jsx("div", { className: cn("flex h-full min-h-0 flex-col text-base", className), children: /* @__PURE__ */ jsx(ScrollArea, { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-2", children: [
    empty && /* @__PURE__ */ jsx("p", { className: "px-1 text-sm text-muted-foreground", children: emptyText }),
    schema.nodeTypes.length > 0 && /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("p", { className: "px-1 text-sm font-medium uppercase tracking-wide text-muted-foreground", children: "Node types" }),
      schema.nodeTypes.map((t) => {
        const style = value.nodeTypes?.[t.name] ?? {};
        const styled = Object.keys(style).length > 0;
        return /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-1.5 rounded-md border border-border p-2", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", title: t.name, children: t.name }),
            /* @__PURE__ */ jsx("span", { className: "shrink-0 text-sm tabular-nums text-muted-foreground", children: t.count }),
            styled && /* @__PURE__ */ jsx(
              Button,
              {
                variant: "ghost",
                size: "icon",
                className: "h-6 w-6 shrink-0",
                title: `Reset ${t.name} to the default styling`,
                "aria-label": `Reset ${t.name} to the default styling`,
                onClick: () => resetNode(t.name),
                children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
              }
            ),
            /* @__PURE__ */ jsx(
              ColorControl,
              {
                color: style.color ?? defaultTypeColor(t.name),
                label: t.name,
                presets,
                onPick: (color) => setNode(t.name, { color })
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
            /* @__PURE__ */ jsxs(
              Select,
              {
                value: style.labelKey ?? LABEL_DEFAULT,
                onValueChange: (next) => setNode(t.name, {
                  labelKey: next === LABEL_DEFAULT ? void 0 : next
                }),
                children: [
                  /* @__PURE__ */ jsx(SelectTrigger, { triggerSize: "sm", className: "min-w-0 flex-1", "aria-label": `${t.name} label key`, children: /* @__PURE__ */ jsx(SelectValue, { placeholder: "default" }) }),
                  /* @__PURE__ */ jsxs(SelectContent, { children: [
                    /* @__PURE__ */ jsx(SelectItem, { value: LABEL_DEFAULT, children: "default" }),
                    labelKeyOptions(t.properties).map((o) => /* @__PURE__ */ jsx(SelectItem, { value: o.value, children: o.label }, o.value))
                  ] })
                ]
              }
            ),
            /* @__PURE__ */ jsx(
              Input,
              {
                inputSize: "sm",
                type: "number",
                min: sizeRange[0],
                max: sizeRange[1],
                placeholder: "size",
                "aria-label": `${t.name} size`,
                className: "w-16 shrink-0",
                value: style.size ?? "",
                onChange: (e) => setNode(t.name, {
                  size: e.target.value ? Number(e.target.value) : void 0
                })
              }
            )
          ] })
        ] }, t.name);
      })
    ] }),
    schema.edgeTypes.length > 0 && /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-2", children: [
      /* @__PURE__ */ jsx("p", { className: "px-1 text-sm font-medium uppercase tracking-wide text-muted-foreground", children: "Edge types" }),
      schema.edgeTypes.map((t) => {
        const style = value.edgeTypes?.[t.name] ?? {};
        const styled = Object.keys(style).length > 0;
        return /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2 rounded-md border border-border p-2", children: [
          /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate font-mono text-sm", title: t.name, children: t.name }),
          /* @__PURE__ */ jsx("span", { className: "shrink-0 text-sm tabular-nums text-muted-foreground", children: t.count }),
          styled && /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-6 w-6 shrink-0",
              title: `Reset ${t.name} to the default styling`,
              "aria-label": `Reset ${t.name} to the default styling`,
              onClick: () => resetEdge(t.name),
              children: /* @__PURE__ */ jsx(RotateCcw, { className: "h-3.5 w-3.5 text-muted-foreground/70" })
            }
          ),
          /* @__PURE__ */ jsx(
            Input,
            {
              inputSize: "sm",
              type: "number",
              min: widthRange[0],
              max: widthRange[1],
              step: 0.5,
              placeholder: "width",
              "aria-label": `${t.name} width`,
              className: "w-16 shrink-0",
              value: style.width ?? "",
              onChange: (e) => setEdge(t.name, {
                width: e.target.value ? Number(e.target.value) : void 0
              })
            }
          ),
          /* @__PURE__ */ jsx(
            ColorControl,
            {
              color: style.color ?? defaultTypeColor(t.name),
              label: t.name,
              presets,
              onPick: (color) => setEdge(t.name, { color })
            }
          )
        ] }, t.name);
      })
    ] })
  ] }) }) });
}
function defaultBoardPanels(options) {
  const { styling, onStylingChange, legend, element, changes } = options;
  return [
    {
      id: "legend",
      title: "Legend",
      icon: "legend",
      render: (c) => /* @__PURE__ */ jsx(LegendViewPanel, { className: "p-2", ...legend, canvas: c })
    },
    {
      id: "styling",
      title: "Styling",
      icon: "palette",
      actions: /* @__PURE__ */ jsx(
        ControlItems,
        {
          items: [
            {
              type: "toggle",
              command: "behaviour.toggle",
              args: { id: BOARD_IDS.sizeByConnections },
              icon: "size-by-connections",
              label: "Size by connections"
            }
          ]
        }
      ),
      // The board paints the styling; the panel only edits it.
      render: (c) => /* @__PURE__ */ jsx(StylingViewPanel, { canvas: c, apply: false, value: styling, onChange: onStylingChange })
    },
    {
      id: "history",
      title: "Canvas history",
      icon: "history",
      actions: /* @__PURE__ */ jsx(ControlItems, { items: HISTORY_CONTROL_ITEMS }),
      render: (c) => /* @__PURE__ */ jsx(HistoryViewPanel, { canvas: c, showUndoRedo: false })
    },
    {
      id: "element",
      title: "Element",
      icon: "properties",
      modes: ["explore", "edit"],
      render: (c) => /* @__PURE__ */ jsx(BoardElementPanel, { canvas: c, ...element })
    },
    {
      id: "annotations",
      title: "Annotations",
      icon: "annotations",
      count: /* @__PURE__ */ jsx(AnnotationsCount, {}),
      render: (c) => /* @__PURE__ */ jsx(AnnotationsViewPanel, { className: "p-2", canvas: c })
    },
    {
      id: "changes",
      title: "Changes",
      icon: "changes",
      modes: ["edit"],
      alsoWhen: UNSAVED_COUNT_COMMAND,
      badge: UNSAVED_COUNT_COMMAND,
      count: /* @__PURE__ */ jsx(ChangesCount, {}),
      render: (c) => /* @__PURE__ */ jsx(ChangesViewPanel, { ...changes, canvas: c })
    },
    {
      id: "export",
      title: "Export",
      icon: "download",
      separatorBefore: true,
      render: (c) => /* @__PURE__ */ jsx(ExportViewPanel, { ...options.export, canvas: c })
    }
  ];
}
function BoardElementPanel({
  canvas,
  editable,
  ...rest
}) {
  const mode = useBoardMode(canvas);
  return /* @__PURE__ */ jsx(ElementViewPanel, { canvas, editable: editable ?? mode === "edit", ...rest });
}
var EDGE_STATES = {
  hovered: { ...DEFAULT_EDGE_STATES.hovered, strokeAlpha: 1 },
  selected: { ...DEFAULT_EDGE_STATES.selected, strokeAlpha: 1 },
  highlighted: { ...DEFAULT_EDGE_STATES.highlighted, strokeAlpha: 1 }
};
var defaultColor = (type) => typeColor(type);
var THEME_CONFIG = {
  behaviours: { theme: { enabled: true, mode: "document", active: "default", accent: "css-var" } }
};
function GraphBoard({
  data,
  config,
  preference,
  className,
  colorForType,
  styling: stylingProp,
  onStylingChange,
  theme = true,
  sizeByConnections = false,
  hoverDegree = 1,
  modes = BOARD_MODES,
  menus,
  panelOptions,
  panels,
  defaultPanel = "legend",
  panelWidth = 320,
  onExpand,
  playbook,
  annotations,
  onAnnotationCreate,
  onAnnotationUpdate,
  onAnnotationDelete,
  onLoadRecords,
  annotationView,
  onAnnotationViewChange,
  annotationActor,
  narrationIcon,
  policies,
  onReady,
  onViewTargetChange,
  onLayoutStart,
  onLayoutEnd,
  onSlowLayout,
  slowLayoutMs = 400,
  children
}) {
  const [canvas, setCanvas] = useState(null);
  const ready = useCallback(
    (c) => {
      setCanvas(c);
      c?.setLayoutPresets(BOARD_LAYOUT_PRESETS);
      onReady?.(c);
    },
    [onReady]
  );
  const colorRef = useRef(colorForType ?? defaultColor);
  colorRef.current = colorForType ?? defaultColor;
  const merged = useMemo(
    () => deepMerge(
      deepMerge(boardConfig((type, kind) => colorRef.current(type, kind)), theme ? THEME_CONFIG : {}),
      config ?? {}
    ),
    [config, theme]
  );
  const [ownStyling, setOwnStyling] = useState({});
  const styling = stylingProp ?? ownStyling;
  const setStyling = onStylingChange ?? setOwnStyling;
  useApplyTypeStyling(canvas, BOARD_IDS.graph, styling, true);
  const edgeCount = data.edges.length;
  useEffect(() => {
    canvas?.layers.get(BOARD_IDS.graph)?.setEdgeDefaults({ strokeAlpha: edgeAlphaForCount(edgeCount) });
  }, [canvas, edgeCount]);
  const menuProps = useMemo(() => defaultBoardMenus(menus ? { extra: menus } : {}), [menus]);
  const canAnnotate = annotationActor?.canWrite !== false;
  const whyNot = annotationActor?.whyNot;
  const boardModes = useMemo(
    () => modes.map(
      (m) => m.id === "annotate" && !canAnnotate ? { ...m, disabled: true, description: whyNot ?? "You can view annotations \u2014 ask an admin to annotate" } : m
    ),
    [modes, canAnnotate, whyNot]
  );
  const rail = useMemo(() => {
    const defaults = defaultBoardPanels({ ...panelOptions, styling, onStylingChange: setStyling });
    return panels ? panels(defaults) : defaults;
  }, [panelOptions, styling, setStyling, panels]);
  const widgets = useMemo(
    () => ({
      presenter: ({ canvas: c }) => /* @__PURE__ */ jsx(
        PlaybookPresenterBar,
        {
          canvas: c,
          variant: "compact",
          className: "w-[540px] shadow-lg",
          ...narrationIcon ? { narrationIcon } : {}
        }
      )
    }),
    [narrationIcon]
  );
  return /* @__PURE__ */ jsx(
    GraphCanvas,
    {
      autoResize: true,
      ...preference ? { preference } : {},
      config: merged,
      className: className ?? "h-full w-full",
      children: /* @__PURE__ */ jsxs(
        AnnotationsProvider,
        {
          ...annotations ? { annotations } : {},
          ...onAnnotationCreate ? { onCreate: onAnnotationCreate } : {},
          ...onAnnotationUpdate ? { onUpdate: onAnnotationUpdate } : {},
          ...onAnnotationDelete ? { onDelete: onAnnotationDelete } : {},
          ...onLoadRecords ? { onLoadRecords } : {},
          ...annotationView ? { view: annotationView } : {},
          ...onAnnotationViewChange ? { onViewChange: onAnnotationViewChange } : {},
          ...annotationActor ? { actor: annotationActor } : {},
          children: [
            theme && /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(ThemeBehaviour, { id: "theme" }),
              /* @__PURE__ */ jsx(CanvasThemeSync, { source: theme === "tokens" ? "tokens" : "library" })
            ] }),
            /* @__PURE__ */ jsx(BackgroundLayer, { id: BOARD_IDS.background }),
            /* @__PURE__ */ jsx(GraphLayer, { id: BOARD_IDS.graph, data, edge: { state: EDGE_STATES } }),
            /* @__PURE__ */ jsx(D3ForceLayout, { id: BOARD_IDS.layout, targetLayerId: BOARD_IDS.graph }),
            /* @__PURE__ */ jsx(ElkLayout, { id: BOARD_IDS.elk, targetLayerId: BOARD_IDS.graph }),
            /* @__PURE__ */ jsx(
              NodeCentralityBehaviour,
              {
                id: BOARD_IDS.sizeByConnections,
                targetLayerId: BOARD_IDS.graph,
                enabled: sizeByConnections,
                minSize: BOARD_CENTRALITY.minSize,
                maxSize: BOARD_CENTRALITY.maxSize
              }
            ),
            /* @__PURE__ */ jsx(
              EdgeLODBehaviour,
              {
                id: BOARD_IDS.edgeThin,
                targetLayerId: BOARD_IDS.graph,
                enabled: thinsEdges(edgeCount),
                minZoom: EDGE_DENSITY.thinBelowZoom,
                keepFraction: EDGE_DENSITY.thinKeep,
                keepBy: "sample"
              }
            ),
            /* @__PURE__ */ jsx(DragPanBehaviour, { id: "pan" }),
            /* @__PURE__ */ jsx(DragNodeBehaviour, { id: "drag-node", targetLayerId: BOARD_IDS.graph, modes: NOT_HAND }),
            /* @__PURE__ */ jsx(WheelZoomBehaviour, { id: "wheel" }),
            /* @__PURE__ */ jsx(PinchZoomBehaviour, { id: "pinch" }),
            /* @__PURE__ */ jsx(HoverActivateBehaviour, { id: "hover", targetLayerId: BOARD_IDS.graph, degree: hoverDegree, state: "highlighted" }),
            /* @__PURE__ */ jsx(ClickSelectBehaviour, { id: BOARD_IDS.clickSelect, targetLayerId: BOARD_IDS.graph, multiple: true }),
            /* @__PURE__ */ jsx(BrushSelectBehaviour, { id: "brush-select", targetLayerId: BOARD_IDS.graph, modes: NOT_HAND }),
            /* @__PURE__ */ jsx(LassoSelectBehaviour, { id: "lasso-select", targetLayerId: BOARD_IDS.graph, modes: NOT_HAND }),
            /* @__PURE__ */ jsx(ClickViewBehaviour, { id: "click-view", targetLayerId: BOARD_IDS.graph }),
            /* @__PURE__ */ jsx(TextResolutionLODBehaviour, { id: "label-lod", targetLayerId: BOARD_IDS.graph }),
            /* @__PURE__ */ jsx(BoardModes, { modes: boardModes, escapeTo: "explore" }),
            /* @__PURE__ */ jsx(BoardToolKeys, {}),
            /* @__PURE__ */ jsx(ClickInspectBehaviour, { id: BOARD_IDS.clickInspect, targetLayerId: BOARD_IDS.graph }),
            /* @__PURE__ */ jsx(EditTools, {}),
            /* @__PURE__ */ jsx(UnsavedChangesBehaviour, {}),
            /* @__PURE__ */ jsx(UnsavedGhostLayer, {}),
            /* @__PURE__ */ jsx(BoardToolKeys, { mode: "annotate", keys: ANNOTATE_TOOL_KEYS, hold: null }),
            /* @__PURE__ */ jsx(BoardToolKeys, { mode: WORK_MODES, keys: NO_KEYS, hold: SPACE_HAND }),
            /* @__PURE__ */ jsx(HandCursor, {}),
            /* @__PURE__ */ jsx(AnnotationsProjection, {}),
            /* @__PURE__ */ jsx(AnnotationsOverlay, { panelWidth }),
            /* @__PURE__ */ jsx(
              MiniMapLayer,
              {
                id: BOARD_IDS.minimap,
                backgroundLayerId: BOARD_IDS.background,
                position: "bottom-left",
                width: BOARD_DOCK.width,
                height: BOARD_DOCK.minimapHeight,
                margin: { x: BOARD_EDGE, y: BOARD_EDGE + BOARD_DOCK.barHeight }
              }
            ),
            /* @__PURE__ */ jsx(
              ControlPanel,
              {
                id: "row",
                position: "top-left",
                offset: BOARD_EDGE,
                surface: "hairline",
                modes: [...WORK_MODES],
                items: [...BOARD_ROW_ITEMS]
              }
            ),
            /* @__PURE__ */ jsx(
              ControlPanel,
              {
                id: "row-view",
                position: "top-left",
                offset: BOARD_EDGE,
                surface: "hairline",
                modes: [...VIEW_MODES],
                fade: "idle",
                items: [...BOARD_VIEW_ROW_ITEMS]
              }
            ),
            /* @__PURE__ */ jsx(
              ControlPanel,
              {
                id: "dock",
                position: "bottom-left",
                offset: BOARD_EDGE,
                width: BOARD_DOCK.width,
                surface: "hairline",
                modes: [...WORK_MODES],
                items: [...BOARD_DOCK_ITEMS]
              }
            ),
            /* @__PURE__ */ jsx(
              ControlPanel,
              {
                id: "presenter",
                position: "bottom",
                offset: BOARD_EDGE,
                surface: false,
                modes: ["present"],
                items: [{ type: "widget", widget: "presenter" }]
              }
            ),
            /* @__PURE__ */ jsx(BoardContextMenus, { ...menuProps }),
            /* @__PURE__ */ jsx(BoardLayoutPopover, {}),
            /* @__PURE__ */ jsx(
              BoardPanels,
              {
                panels: rail,
                defaultOpen: defaultPanel,
                offset: BOARD_EDGE,
                width: panelWidth,
                modes: [...WORK_MODES]
              }
            ),
            /* @__PURE__ */ jsx(BoardPolicies, { ...policies ?? {}, onExpand, playbook }),
            /* @__PURE__ */ jsx(
              LayoutProgress,
              {
                onLayoutStart,
                onLayoutEnd,
                onSlowLayout,
                slowLayoutMs
              }
            ),
            onViewTargetChange && /* @__PURE__ */ jsx(ViewTarget, { onChange: onViewTargetChange }),
            children,
            /* @__PURE__ */ jsx(ControlPanels, { widgets }),
            /* @__PURE__ */ jsx(BoardReady, { onReady: ready })
          ]
        }
      )
    },
    preference
  );
}
function BoardReady({ onReady }) {
  const canvas = useGraphCanvas();
  useEffect(() => {
    onReady(canvas);
    return () => onReady(null);
  }, [canvas, onReady]);
  return null;
}
function EditTools() {
  const canvas = useGraphCanvas();
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx(
      CreateNodeBehaviour,
      {
        id: "create-node",
        targetLayerId: BOARD_IDS.graph,
        modes: ["add"],
        createNode: (at) => ({
          id: newBoardElementId(),
          type: UNKNOWN_TYPE,
          position: { x: at.x, y: at.y },
          pinned: true
        }),
        onNodeCreate: (n) => openElementEditor(canvas, "node", n.id, true)
      }
    ),
    /* @__PURE__ */ jsx(
      DrawEdgeBehaviour,
      {
        id: "draw-edge",
        targetLayerId: BOARD_IDS.graph,
        modes: ["connect"],
        createEdge: (source, target) => ({
          id: newBoardElementId(),
          type: UNKNOWN_TYPE,
          source,
          target
        }),
        onEdgeCreate: (e) => openElementEditor(canvas, "edge", e.id, true)
      }
    )
  ] });
}
function BoardPolicies({
  openElementOnInspect = true,
  unsavedGuard = true,
  modeTidy = true,
  onExpand,
  playbook
}) {
  const canvas = useGraphCanvas();
  const mode = useBoardMode(canvas);
  useUnsavedGuard({ enabled: unsavedGuard }, canvas);
  const expandRef = useRef(onExpand);
  expandRef.current = onExpand;
  const canExpand = onExpand !== void 0;
  useEffect(() => {
    const pickedRecords = (c) => {
      const store = c.layers.get(BOARD_IDS.graph)?.store;
      return selectedElementIds(c, BOARD_IDS.clickSelect).nodeIds.filter((id) => !isAnnotationElement(store?.getNode(id)));
    };
    const offs = [
      ...canExpand ? [
        canvas.commands.register(GRAPH_EXPAND_COMMAND, {
          label: "Expand neighbours",
          isEnabled: (c) => pickedRecords(c).length > 0,
          run: (c) => expandRef.current?.(pickedRecords(c), c)
        })
      ] : []
    ];
    canvas.behaviours.get("drag-node")?.setModes?.(["select", "add", "delete"]);
    return () => {
      for (const off of offs) off?.();
    };
  }, [canvas, canExpand]);
  useEffect(() => {
    if (!openElementOnInspect) return;
    return canvas.behaviours.get(BOARD_IDS.clickInspect)?.events.on("inspect:change", (t) => {
      if (t === null) return;
      const layer = canvas.layers.get(BOARD_IDS.graph);
      const el = t.kind === "edge" ? layer?.store.getEdge(t.id) : layer?.store.getNode(t.id);
      if (isAnnotationElement(el)) return;
      openBoardPanel(canvas, "element");
    });
  }, [canvas, openElementOnInspect]);
  useEffect(() => {
    if (playbook) void canvas.playbook.load(playbook);
  }, [canvas, playbook]);
  useEffect(() => {
    if (!modeTidy || !mode) return;
    tidyForMode(canvas, mode);
  }, [canvas, mode, modeTidy]);
  return null;
}
var NOT_HAND = [`!${HAND_TOOL}`];
var NO_KEYS = {};
var SPACE_HAND = { key: " ", tool: HAND_TOOL };
function HandCursor() {
  const canvas = useGraphCanvas();
  const { states } = useCommandStates(TOOL_REFS, canvas);
  const panning = states[0]?.value === HAND_TOOL;
  useEffect(() => {
    const el = canvas.renderer?.canvasElement;
    if (!el || !panning) return;
    const before = el.style.cursor;
    el.style.cursor = "grab";
    return () => {
      el.style.cursor = before;
    };
  }, [canvas, panning]);
  return null;
}
var TOOL_REFS = [{ command: "tool.active" }];
function tidyForMode(canvas, mode) {
  if (mode !== "edit") void canvas.commands.run("tool.active", { value: "select" });
  canvas.layers.get(BOARD_IDS.minimap)?.setVisible(WORK_MODES.includes(mode));
  if (mode === "present" && canvas.playbook.index < 0 && canvas.playbook.steps.length > 0) void canvas.playbook.next();
}
function LayoutProgress({
  onLayoutStart,
  onLayoutEnd,
  onSlowLayout,
  slowLayoutMs
}) {
  const canvas = useGraphCanvas();
  const nodeCount = useRef(0);
  const timer = useRef(null);
  const dismiss = useRef(null);
  const userStopped = useRef(false);
  const clearSlow = useCallback(() => {
    if (timer.current !== null) clearTimeout(timer.current);
    timer.current = null;
    dismiss.current?.();
    dismiss.current = null;
  }, []);
  useEffect(() => clearSlow, [clearSlow]);
  useCanvasEvent("layout:run:start", (e) => {
    if (e.id !== BOARD_IDS.layout) return;
    const n = e.nodeCount ?? 0;
    nodeCount.current = n;
    userStopped.current = false;
    canvas.showMessage(`Laying out ${n} nodes\u2026`);
    onLayoutStart?.({ nodeCount: n });
    clearSlow();
    if (!onSlowLayout) return;
    timer.current = setTimeout(() => {
      timer.current = null;
      dismiss.current = onSlowLayout({
        nodeCount: n,
        cancel: () => {
          userStopped.current = true;
          canvas.stopLayout();
        }
      }) ?? null;
    }, slowLayoutMs);
  });
  useCanvasEvent("layout:run:progress", (e) => {
    if (e.id !== BOARD_IDS.layout) return;
    canvas.showMessage(`Laying out ${nodeCount.current} nodes \xB7 ${e.done} / ${e.total}`);
  });
  useCanvasEvent("layout:run:end", (e) => {
    if (e.id !== BOARD_IDS.layout) return;
    clearSlow();
    onLayoutEnd?.({ nodeCount: nodeCount.current, reason: e.reason ?? "stopped" });
    if (e.reason === "settled") canvas.showMessage("Graph ready", 3e3);
    else if (userStopped.current) canvas.showMessage("Layout cancelled \u2014 nodes drawn where they were", 4e3);
  });
  return null;
}
function ViewTarget({ onChange }) {
  const ctx = useViewContext();
  const id = ctx?.id ?? null;
  useEffect(() => onChange(id), [id, onChange]);
  return null;
}
function useSidePanels(panels, options = {}) {
  const { defaultOpenId = null, section } = options;
  const [openId, setOpen] = useState(defaultOpenId);
  const toggle = (id) => setOpen((cur) => cur === id ? null : id);
  const items = panels.map((p) => ({
    type: "toggle",
    key: p.id,
    icon: p.icon,
    ...p.activeIcon ? { activeIcon: p.activeIcon } : {},
    label: `${p.label}: hidden`,
    activeLabel: p.activeLabel ?? `${p.label}: shown`,
    active: openId === p.id,
    onToggle: () => toggle(p.id)
  }));
  const active = panels.find((p) => p.id === openId);
  const region = active ? {
    content: (ctx) => active.render(ctx.canvas),
    defaultSize: active.defaultSize ?? section?.defaultSize ?? "360px",
    minSize: active.minSize ?? section?.minSize,
    maxSize: active.maxSize ?? section?.maxSize,
    collapsible: active.collapsible ?? section?.collapsible ?? true
  } : void 0;
  return { openId, open: setOpen, toggle, items, region };
}
function CanvasControlsToolbar({
  icons,
  orientation = "vertical",
  fitLayerId = "graph",
  showZoom = true,
  showFit = true,
  locked,
  onToggleLock,
  canvas,
  children,
  className
}) {
  const specs = [...showZoom ? zoomSpecs() : [], ...showFit ? [fitSpec(fitLayerId)] : []];
  const items = [...useControlItems(specs, { canvas })];
  if (locked !== void 0 && onToggleLock) {
    items.push({
      type: "toggle",
      key: "lock",
      icon: LockOpen,
      activeIcon: Lock,
      label: "Lock view",
      activeLabel: "Unlock view",
      active: locked,
      onToggle: onToggleLock
    });
  }
  if (children) {
    items.push({ type: "custom", key: "children", render: () => children });
  }
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(items, icons), orientation, className });
}
function GraphToolbar({
  layout,
  layoutOptions,
  onLayoutChange,
  selectMode,
  selectModeOptions,
  onSelectModeChange,
  edgeTypeLayerId = "graph",
  edgeTypes,
  edgeTypeLabels,
  edgeTypeIcons,
  clearLayerId = "graph",
  clearIcon,
  canvas,
  className
}) {
  const edgeItems = useStyleEditorSection({
    ...edgeTypeLayerId != null ? { layerId: edgeTypeLayerId } : {},
    ...edgeTypes ? { types: edgeTypes } : {},
    ...edgeTypeLabels ? { labels: edgeTypeLabels } : {},
    ...edgeTypeIcons ? { icons: edgeTypeIcons } : {},
    canvas
  });
  const { remove, hasSelection } = useClipboard({}, canvas);
  const { clear } = useClearGraph(clearLayerId, canvas);
  const items = [
    { type: "select", key: "layout", label: "Layout", value: layout, options: layoutOptions, onChange: onLayoutChange },
    { type: "select", key: "select-mode", label: "Select", value: selectMode, options: selectModeOptions, onChange: onSelectModeChange },
    ...edgeTypeLayerId != null ? edgeItems : [],
    {
      type: "button",
      key: "erase",
      icon: clearIcon,
      label: hasSelection ? "Erase selection" : "Clear canvas",
      ...hasSelection ? { text: "Selection" } : {},
      onClick: hasSelection ? remove : () => clear()
    }
  ];
  return /* @__PURE__ */ jsx(ToolbarItems, { items, orientation: "horizontal", className });
}
var DEFAULT_LAYOUTS = {
  "d3-force": () => new D3ForceLayout$1({
    charge: { strength: -160 },
    link: { distance: 56 },
    collide: { radius: 14 },
    animate: false
  })
};
var DEFAULT_LAYOUT_LABEL = { "d3-force": "Force (d3)" };
var NoIcon = () => null;
function useLayoutItems(props, segmented) {
  const layerId = props.layerId ?? "graph";
  const layouts = props.layouts ?? DEFAULT_LAYOUTS;
  const layoutLabel = props.layoutLabel ?? DEFAULT_LAYOUT_LABEL;
  const lay = useLayout(layouts, {
    layerId,
    labels: layoutLabel,
    initial: Object.keys(layouts)[0],
    applyInitial: props.applyInitialLayout ?? false
  });
  const items = [];
  if (Object.keys(lay.layoutOptions).length > 0) {
    items.push({
      type: "select",
      key: "layout",
      label: "Layout",
      value: lay.layout,
      options: lay.layoutOptions,
      ...segmented ? { display: "segmented" } : {},
      disabled: false,
      onChange: (value) => {
        if (value) lay.applyLayout(value);
      }
    });
  }
  const running = lay.isRunning;
  const runLabel = running ? "Stop layout" : "Run layout";
  const runIcon = DEFAULT_CONTROL_ICONS[running ? "stop" : "play"];
  items.push({
    type: "button",
    key: "run-layout",
    icon: runIcon ?? NoIcon,
    label: runLabel,
    ...runIcon ? {} : { text: runLabel },
    disabled: false,
    onClick: () => running ? lay.stopLayout() : lay.applyLayout(lay.layout)
  });
  return items;
}
function selectSpecs(segmented) {
  return [{ type: "choice", key: "select-mode", command: "select.mode", label: "Select", ...segmented ? { display: "segmented" } : {} }];
}
function styleSpecs(layerId) {
  return [{ type: "choice", key: "edge-type", command: "graph.edgeType", args: { layerId }, label: "Edge" }];
}
function useBar(specs, layout, props) {
  const canvas = useGraphCanvas();
  const items = useControlItems(specs, { canvas });
  const withLayout = layout.length > 0 ? [...items, ...items.length > 0 ? [{ type: "divider", key: "d-layout" }] : [], ...layout] : items;
  const extra = typeof props.extraItems === "function" ? props.extraItems(canvas) : props.extraItems ?? [];
  const all = extra.length > 0 ? [...withLayout, ...withLayout.length > 0 ? [{ type: "divider", key: "d-extra" }] : [], ...extra] : withLayout;
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(all, props.icons), orientation: props.orientation ?? "horizontal", className: props.className });
}
function GraphControlsToolbarLite(props) {
  const layerId = props.layerId ?? "graph";
  const s = {
    layout: true,
    selectMode: true,
    view: true,
    grid: true,
    ...props.sections
  };
  const layout = useLayoutItems(props, false);
  const specs = joinGroups([
    s.selectMode ? selectSpecs(false) : [],
    s.view ? [fitSpec(layerId), lockSpec()] : [],
    s.grid ? [gridSpec()] : []
  ]);
  return useBar(specs, s.layout ? layout : [], props);
}
function GraphControlsToolbarFullBody(props) {
  const layerId = props.layerId ?? "graph";
  const s = {
    history: true,
    layout: true,
    selectMode: true,
    style: true,
    edit: true,
    view: true,
    grid: true,
    ...props.sections
  };
  const layout = useLayoutItems(props, true);
  const specs = joinGroups([
    s.history ? historySpecs() : [],
    s.selectMode ? selectSpecs(true) : [],
    s.style ? styleSpecs(layerId) : [],
    s.edit ? [eraseSpec({ icon: "eraser", layerId })] : [],
    s.view ? [fitSpec(layerId), lockSpec()] : [],
    s.grid ? [gridSpec()] : []
  ]);
  return useBar(specs, s.layout ? layout : [], props);
}
function GraphControlsToolbar(props) {
  const layerId = props.layerId ?? "graph";
  return /* @__PURE__ */ jsx(GraphClipboardProvider, { layerId, children: /* @__PURE__ */ jsx(GraphControlsToolbarFullBody, { ...props }) });
}
function EditToolbar({
  icons,
  orientation = "horizontal",
  showClear = true,
  clickSelectId,
  layerId,
  canvas,
  className
}) {
  const selection = clickSelectId ? { clickSelectId } : void 0;
  const specs = [
    { type: "command", key: "cut", command: "clipboard.cut", ...selection ? { args: selection } : {}, icon: "scissors", label: "Cut" },
    { type: "command", key: "copy", command: "clipboard.copy", ...selection ? { args: selection } : {}, icon: "copy", label: "Copy" },
    { type: "command", key: "paste", command: "clipboard.paste", ...selection ? { args: selection } : {}, icon: "clipboard-paste", label: "Paste" },
    ...showClear ? [eraseSpec({ icon: "eraser", ...layerId ? { layerId } : {}, ...clickSelectId ? { clickSelectId } : {} })] : []
  ];
  const items = useControlItems(specs, { canvas });
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(items, icons), orientation, className });
}
function ViewToolbar({
  icons,
  orientation = "vertical",
  showLock = true,
  layerId = "graph",
  lockBehaviourIds,
  canvas,
  className
}) {
  const specs = [...zoomSpecs(), fitSpec(layerId), ...showLock ? [lockSpec(lockBehaviourIds)] : []];
  const items = useControlItems(specs, { canvas });
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(items, icons), orientation, className });
}
function GridToolbar({
  icons,
  orientation = "horizontal",
  backgroundLayerId,
  patternType,
  canvas,
  className
}) {
  const specs = [gridSpec({ ...backgroundLayerId ? { layerId: backgroundLayerId } : {}, ...patternType ? { patternType } : {} })];
  const items = useControlItems(specs, { canvas });
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(items, icons), orientation, className });
}
function GraphLayoutToolbar({
  layouts,
  selectModeBehaviourIds,
  layoutLabels,
  selectModeLabels,
  selectModeIcons,
  initialLayout,
  initialSelectMode,
  onSelectModeChange,
  layerId,
  canvas,
  className
}) {
  const layoutItems = useLayoutsSection({
    layouts,
    ...layoutLabels ? { labels: layoutLabels } : {},
    ...initialLayout ? { initial: initialLayout } : {},
    ...layerId ? { layerId } : {},
    canvas
  });
  const { mode, modeOptions, setMode } = useSelectMode(
    selectModeBehaviourIds,
    { ...initialSelectMode ? { initial: initialSelectMode } : {}, ...selectModeLabels ? { labels: selectModeLabels } : {} },
    canvas
  );
  useEffect(() => {
    onSelectModeChange?.(mode);
  }, [mode, onSelectModeChange]);
  const items = [
    ...layoutItems,
    { type: "divider", key: "layout-sep" },
    { type: "select", key: "select-mode", label: "Select", value: mode, options: modeOptions, icons: selectModeIcons, onChange: setMode }
  ];
  return /* @__PURE__ */ jsx(ToolbarItems, { items, orientation: "horizontal", className });
}
var DEFAULT_TOOLS = ["select", "add", "connect", "delete"];
var DEFAULT_LABELS = {
  select: "Select",
  add: "Add node",
  connect: "Connect",
  delete: "Delete"
};
var TOOL_ICONS = {
  select: "pointer",
  add: "plus",
  connect: "spline",
  delete: "eraser"
};
function ModellerToolbar({
  icons,
  tools = DEFAULT_TOOLS,
  labels,
  nodeKinds,
  nodeKindIcons,
  showHistory = true,
  showClear = true,
  layerId = "graph",
  orientation = "horizontal",
  canvas,
  className
}) {
  const { tool } = useTool();
  const kindIcons = useMemo(
    () => nodeKindIcons ? Object.fromEntries(Object.entries(nodeKindIcons).map(([k, Icon]) => [`kind:${k}`, Icon])) : void 0,
    [nodeKindIcons]
  );
  const toolSpecs = tools.map((t) => ({
    type: "toggle",
    key: t,
    command: "tool.active",
    args: { value: t },
    icon: TOOL_ICONS[t],
    label: labels?.[t] ?? DEFAULT_LABELS[t]
  }));
  if (tool === "add" && nodeKinds && Object.keys(nodeKinds).length > 0) {
    toolSpecs.push({
      type: "choice",
      key: "node-kind",
      command: "tool.nodeKind",
      label: "Shape",
      options: Object.entries(nodeKinds).map(([value, label]) => ({
        value,
        label,
        ...nodeKindIcons?.[value] ? { icon: `kind:${value}` } : {}
      }))
    });
  }
  const specs = joinGroups([
    toolSpecs,
    showHistory ? historySpecs() : [],
    showClear ? [eraseSpec({ icon: "trash", layerId })] : []
  ]);
  const items = useControlItems(specs, { canvas, ...kindIcons ? { icons: kindIcons } : {} }).map((it) => it.key === "node-kind" && it.type === "select" ? { ...it, triggerLabelOnly: false } : it);
  return /* @__PURE__ */ jsx(ToolbarItems, { items: applyIconOverrides(items, icons), orientation, className });
}
function ClearCanvasToolbar({
  targetLayerId = "graph",
  label = "Clear canvas",
  triggerText,
  triggerIcon: TriggerIcon = Trash2,
  tooltipSide = "bottom",
  canvas,
  className
}) {
  const { clear } = useClearGraph(targetLayerId, canvas);
  return /* @__PURE__ */ jsx(Tooltipped, { label, side: tooltipSide, children: /* @__PURE__ */ jsxs(
    Button,
    {
      variant: "ghost",
      size: triggerText ? "sm" : "icon",
      "aria-label": label,
      onClick: clear,
      className,
      children: [
        /* @__PURE__ */ jsx(TriggerIcon, { size: 16 }),
        triggerText
      ]
    }
  ) });
}
function toCssColor(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return `#${(value & 16777215).toString(16).padStart(6, "0")}`;
  }
  if (typeof value === "string" && value.trim()) return value;
  return void 0;
}
function dockCardClassName(side = "right") {
  return cn(
    "absolute inset-y-0 z-[5] w-80 max-w-none overflow-y-auto rounded-none bg-popover/85 backdrop-blur-md",
    side === "left" ? "left-0" : "right-0"
  );
}
function NodeDetailView({
  ctx,
  title = "Node",
  showId = true,
  renderers,
  hints,
  className,
  style
}) {
  const rows = [];
  if (showId) rows.push({ label: "ID", value: ctx.id });
  if (ctx.type) rows.push({ label: "Type", value: ctx.type });
  const titleColor = ctx.node ? toCssColor(ctx.layer.resolveNodeStyle(ctx.node).bgFill) : void 0;
  return (
    // Key by element id so per-element expand/collapse state resets on switch.
    /* @__PURE__ */ jsx(
      DetailCard,
      {
        title: ctx.label || title,
        ...titleColor ? { titleColor } : {},
        rows,
        ...className !== void 0 ? { className } : {},
        ...style !== void 0 ? { style } : {},
        children: /* @__PURE__ */ jsx(
          PropertyDetailView,
          {
            data: ctx.data,
            ...renderers ? { renderers } : {},
            ...hints ? { hints } : {}
          }
        )
      },
      ctx.id
    )
  );
}
function resolveEndpoint(ctx, id) {
  if (!id) return void 0;
  const node = ctx.store.getNode(id);
  if (!node) return { id };
  const style = ctx.layer.resolveNodeStyle(node);
  const label = style.labelText ?? "";
  const type = node.type;
  const color = toCssColor(style.bgFill);
  return {
    id,
    ...label ? { label } : {},
    ...type ? { type } : {},
    ...color ? { color } : {}
  };
}
function EdgeDetailView({
  ctx,
  title = "Edge",
  showId = true,
  directed = true,
  renderers,
  hints,
  className,
  style
}) {
  const rows = [];
  if (showId) rows.push({ label: "ID", value: ctx.id });
  if (ctx.type) rows.push({ label: "Type", value: ctx.type });
  const source = resolveEndpoint(ctx, ctx.source);
  const target = resolveEndpoint(ctx, ctx.target);
  const titleColor = ctx.edge ? toCssColor(ctx.layer.resolveEdgeStyle(ctx.edge).strokeColor) : void 0;
  return /* @__PURE__ */ jsxs(
    DetailCard,
    {
      title: ctx.label || title,
      ...titleColor ? { titleColor } : {},
      rows,
      ...className !== void 0 ? { className } : {},
      ...style !== void 0 ? { style } : {},
      children: [
        source && target && /* @__PURE__ */ jsx(EdgeEndpoints, { source, target, directed }),
        /* @__PURE__ */ jsx(
          PropertyDetailView,
          {
            data: ctx.data,
            ...renderers ? { renderers } : {},
            ...hints ? { hints } : {}
          }
        )
      ]
    },
    ctx.id
  );
}
function ThemeToggle({ ctx }) {
  return /* @__PURE__ */ jsx(
    ToolbarItems,
    {
      orientation: "horizontal",
      items: [
        {
          type: "toggle",
          key: "theme",
          icon: Sun,
          activeIcon: Moon,
          label: "Switch to dark theme",
          activeLabel: "Switch to light theme",
          active: ctx.themeKind === "dark",
          onToggle: ctx.toggleTheme
        }
      ]
    }
  );
}
var layerOf = (c, id) => c?.layers?.[id] ?? {};
function detailConfig(base, template, data, { layerId = "graph", wildcard = "*", structures: builders = {} } = {}) {
  const own = { ...layerOf(base, layerId).nodeTypes, ...layerOf(template, layerId).nodeTypes };
  const binding = own[wildcard];
  if (!binding) return template;
  const prefix = binding.structure.endsWith(":*") ? binding.structure.slice(0, -2) : null;
  const build = prefix !== null ? builders[prefix] : void 0;
  const nodeTypes = {};
  const structures = {};
  for (const node of data.nodes) {
    const type = node.type;
    if (!type || type === wildcard || nodeTypes[type] || own[type]) continue;
    if (prefix === null) {
      nodeTypes[type] = binding;
      continue;
    }
    const name = `${prefix}:${type}`;
    if (build) structures[name] = build(name, node);
    nodeTypes[type] = { ...binding, structure: name };
  }
  return deepMerge(template, {
    layers: { [layerId]: { nodeStructureTemplates: structures, nodeTypes } }
  });
}
function useDetailTemplates({
  canvas,
  config,
  detail,
  data,
  layout,
  fitPadding = 60,
  fitMaxZoom,
  initial,
  ...opts
}) {
  const [level2, setLevel] = useState(initial ?? detail.initial);
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const [initialConfig] = useState(
    () => deepMerge(config, detailConfig(config, detail.templates[level2], data, opts))
  );
  useEffect(() => {
    if (!canvas || data.nodes.length === 0) return;
    canvas.stopLayout();
    canvas.update({ ...detailConfig(config, detail.templates[level2], data, optsRef.current), activeLayout: layout });
    void canvas.runLayout(layout, {
      fitCamera: { padding: fitPadding, ...fitMaxZoom !== void 0 ? { maxZoom: fitMaxZoom } : {} }
    });
  }, [canvas, config, detail, level2, data, layout, fitPadding, fitMaxZoom]);
  return { level: level2, setLevel, initialConfig };
}

// src/board/schema/presets.ts
var SCHEMA_FRAME_TYPE = "schema.frame";
var SCHEMA_FRAME_EMPTY_TYPE = "schema.frame.empty";
var SCHEMA_WILDCARD = "*";
var SCHEMA_LAYER = "graph";
var HUE = { bind: "data.hue", categorical: true };
var frameLabel = { fontSize: 13, fontWeight: 700, colorRole: "heading", placement: "inside-center" };
var frameStyling = (name) => ({
  name,
  fillRole: "muted",
  fillLookup: HUE,
  fillAlpha: 0.1,
  strokeRole: "stroke",
  strokeLookup: HUE,
  strokeAlpha: 0.6,
  strokeWidth: 1.5,
  label: frameLabel
});
var frameGroup = (padding) => ({ autoFit: true, padding, headerHeight: 28, tabSkew: 12, showToggle: false });
var SCHEMA_BOARD_CONFIG = {
  activeLayout: "elk",
  fitOnLoad: false,
  layers: {
    background: { type: "pattern", patternType: "dots", size: 1.5, spacing: 24, alpha: 0.7 },
    [SCHEMA_LAYER]: {
      nodeStructureTemplates: {
        frame: {
          name: "frame",
          kind: "simple",
          shape: { kind: "tabbed-rect", width: 220, height: 80, tabWidth: 120, tabHeight: 28, cornerRadius: 10 },
          slots: { label: true }
        },
        labelDot: {
          name: "labelDot",
          kind: "freeform",
          width: 60,
          height: 60,
          frame: { kind: "ellipse" },
          bgRole: "cardBg",
          strokeLookup: HUE,
          strokeWidth: 3,
          elements: [
            { id: "icon", type: "icon", x: 16, y: 16, size: 28, bind: "data.icon", colorLookup: HUE, strokeWidth: 2 },
            {
              id: "name",
              type: "text",
              x: 30,
              y: 54,
              bind: "data.label",
              anchor: "center",
              fontSize: 12,
              fontWeight: 600,
              colorRole: "heading",
              maxWidth: 140
            }
          ]
        },
        labelCard: {
          name: "labelCard",
          kind: "freeform",
          width: 264,
          height: 116,
          cornerRadius: 10,
          bgRole: "cardBg",
          strokeRole: "stroke",
          strokeWidth: 1,
          elements: [
            { id: "tile", type: "rect", x: 14, y: 14, width: 36, height: 36, cornerRadius: 8, fillLookup: HUE, fillAlpha: 0.16 },
            { id: "icon", type: "icon", x: 22, y: 22, size: 20, bind: "data.icon", colorLookup: HUE, strokeWidth: 2 },
            { id: "name", type: "text", x: 60, y: 0, bind: "data.label", fontSize: 15, fontWeight: 700, colorRole: "heading", maxWidth: 190 },
            {
              id: "frame",
              type: "text",
              x: 60,
              y: 26,
              bind: "data.frame",
              requires: "data.frame",
              fontSize: 10,
              fontWeight: 600,
              uppercase: true,
              colorLookup: HUE,
              maxWidth: 190
            },
            {
              id: "description",
              type: "text",
              x: 14,
              y: 51,
              bind: "data.description",
              fontSize: 11,
              colorRole: "foreground",
              maxWidth: 236,
              maxLines: 2,
              lineHeight: 15
            },
            {
              id: "footer",
              type: "text",
              x: 14,
              y: 87,
              text: "{data.propertyCount} properties \xB7 key {data.identity}",
              requires: "data.identity",
              fontSize: 10,
              colorRole: "muted",
              maxWidth: 176
            },
            {
              id: "badge-chip",
              type: "rect",
              x: 186,
              y: 93,
              width: 64,
              height: 17,
              cornerRadius: 8,
              fill: 14753096,
              fillAlpha: 0.14,
              requires: "data.badge"
            },
            {
              id: "badge-text",
              type: "text",
              x: 218,
              y: 88,
              bind: "data.badge",
              requires: "data.badge",
              anchor: "center",
              fontSize: 9,
              fontWeight: 700,
              color: 14753096
            }
          ]
        }
      },
      nodeStylingTemplates: {
        frame: { ...frameStyling("frame"), group: frameGroup(30) },
        frameEmpty: frameStyling("frameEmpty"),
        label: { name: "label" }
      },
      nodeTypes: {
        [SCHEMA_FRAME_TYPE]: { structure: "frame", styling: "frame", bindings: { label: "data.name" } },
        [SCHEMA_FRAME_EMPTY_TYPE]: { structure: "frame", styling: "frameEmpty", bindings: { label: "data.name" } },
        [SCHEMA_WILDCARD]: { structure: "labelCard", styling: "label", bindings: {} }
      },
      edge: { style: { strokeWidth: 1.5, strokeAlpha: 0.85, arrowTargetShape: "triangle", arrowTargetSize: 6 } }
    }
  },
  layouts: {
    elk: {
      algorithm: "layered",
      direction: "RIGHT",
      padding: 40,
      defaultNodeSize: { width: 264, height: 116 },
      nodeSpacing: 90,
      layerSpacing: 200
    }
  },
  behaviours: {
    hover: { enabled: true, state: "highlighted", degree: 1, direction: "both" },
    pan: { enabled: true },
    wheel: { enabled: true },
    "drag-node": { enabled: true },
    "click-select": { enabled: true, multiple: true },
    "collapse-expand": { enabled: true, relayoutOnToggle: true, countBadge: true },
    "label-resolution": { enabled: true },
    "text-lod": { enabled: true, minZoom: 0.3 },
    theme: { enabled: true, mode: "system", active: "default", accent: "css-var" }
  }
};
var level = (structure, padding, size, nodeSpacing, layerSpacing) => ({
  layers: {
    [SCHEMA_LAYER]: {
      // A styling template is replaced whole on update, so a level carries all of it.
      nodeStylingTemplates: { frame: { ...frameStyling("frame"), group: frameGroup(padding) } },
      nodeTypes: { [SCHEMA_WILDCARD]: { structure, styling: "label", bindings: {} } }
    }
  },
  layouts: { elk: { defaultNodeSize: size, nodeSpacing, layerSpacing } }
});
var SCHEMA_DETAIL = {
  templates: {
    high: level("labelDot", 28, { width: 60, height: 84 }, 80, 120),
    medium: level("labelCard", 30, { width: 264, height: 116 }, 90, 200),
    low: level("schema:*", 32, { width: 300, height: 240 }, 110, 240)
  },
  options: { high: "High \u2014 circles", medium: "Medium \u2014 cards", low: "Low \u2014 schema cards" },
  initial: "medium"
};
var isSchemaType = (d) => !!d && typeof d === "object" && Array.isArray(d.properties);
function renderSchemaNode(node) {
  const d = node.data;
  if (!isSchemaType(d)) return null;
  const rows = d.properties.map((p) => ({
    label: p.name,
    value: [p.type, p.identity ? "key" : "", ...p.tags ?? []].filter(Boolean).join(" \xB7 "),
    mono: true
  }));
  return /* @__PURE__ */ jsx(
    NodePreviewCard,
    {
      title: d.label,
      subtitle: d.description || void 0,
      tags: d.frame ? [d.frame] : void 0,
      rows
    }
  );
}
function renderSchemaEdge(edge) {
  const d = edge.data ?? {};
  return /* @__PURE__ */ jsx(
    EdgePreviewCard,
    {
      badge: edge.type,
      title: d.title ?? `${edge.source} \u2192 ${edge.target}`,
      subtitle: d.description || void 0,
      rows: d.rows ?? []
    }
  );
}
var LAYOUT = "elk";
var CONNECT_PANEL = "connect";
var defaultSchemaCard = (d) => d.frame ? { subtitle: "{data.frame}" } : {};
var sameSelection = (a, b) => a?.kind === b?.kind && a?.id === b?.id;
function useStableValue(value) {
  const signature = JSON.stringify(value);
  const ref = useRef({ signature, value });
  if (ref.current.signature !== signature) ref.current = { signature, value };
  return ref.current.value;
}
function useShiftHeld(on) {
  const [shift, setShift] = useState(false);
  useEffect(() => {
    if (!on) return;
    const down = (e) => e.key === "Shift" && setShift(true);
    const up = (e) => e.key === "Shift" && setShift(false);
    const blur = () => setShift(false);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, [on]);
  return shift;
}
function SchemaBoard({
  data: dataProp,
  config = SCHEMA_BOARD_CONFIG,
  detail = SCHEMA_DETAIL,
  initialDetail,
  schemaCard = defaultSchemaCard,
  title,
  message,
  selected = null,
  onSelect,
  connect,
  renderNode = renderSchemaNode,
  renderEdge = renderSchemaEdge,
  theme = true,
  preference,
  dockSection,
  headerClassName,
  height,
  onReady: onReadyProp,
  children
}) {
  const data = useStableValue(dataProp);
  const [canvas, setCanvas] = useState(null);
  const [connectTool, setConnectTool] = useState(false);
  const shift = useShiftHeld(!!connect);
  const connecting = !!connect && (connectTool || shift);
  const connectRef = useRef(connect);
  connectRef.current = connect;
  const schemaCardRef = useRef(schemaCard);
  schemaCardRef.current = schemaCard;
  const structures = useMemo(
    () => ({
      schema: (name, node) => schemaCardStructure(name, node.data, schemaCardRef.current(node.data))
    }),
    []
  );
  const { level: level2, setLevel, initialConfig } = useDetailTemplates({
    canvas,
    config,
    detail,
    data,
    layout: LAYOUT,
    layerId: SCHEMA_LAYER,
    wildcard: SCHEMA_WILDCARD,
    structures,
    ...initialDetail !== void 0 ? { initial: initialDetail } : {}
  });
  const dock = useSidePanels(
    [
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        render: (c) => /* @__PURE__ */ jsx(CanvasSettingsEditorPanel, { canvas: c, className: "border-0 bg-transparent shadow-none" })
      },
      ...connect ? [
        {
          id: CONNECT_PANEL,
          icon: Link2,
          label: connect.panelLabel,
          // Opened by an accepted drag only — its toggle stays out of the header.
          render: () => connectRef.current?.panel ?? null
        }
      ] : []
    ],
    dockSection ? { section: dockSection } : void 0
  );
  const hasPanel = !!connect?.panel;
  const { open: openDock, openId } = dock;
  const hadPanel = useRef(false);
  const openIdRef = useRef(openId);
  openIdRef.current = openId;
  useEffect(() => {
    if (hasPanel) openDock(CONNECT_PANEL);
    else if (hadPanel.current && openIdRef.current === CONNECT_PANEL) openDock(null);
    hadPanel.current = hasPanel;
  }, [hasPanel, openDock]);
  const wasOpen = useRef(false);
  useEffect(() => {
    const isOpen = openId === CONNECT_PANEL;
    if (wasOpen.current && !isOpen) connectRef.current?.onClosePanel();
    wasOpen.current = isOpen;
  }, [openId]);
  const canvasRef = useRef(canvas);
  canvasRef.current = canvas;
  const createEdge = useCallback((source, target) => {
    const refusal = connectRef.current?.onConnect(source, target) ?? null;
    if (refusal) canvasRef.current?.showMessage(refusal);
    return null;
  }, []);
  const onReady = useCallback(
    (c) => {
      setCanvas(c);
      if (message) c?.showMessage(message);
      onReadyProp?.(c);
    },
    [message, onReadyProp]
  );
  useEffect(() => {
    const drag = canvas?.behaviours.get("drag-node");
    if (!drag) return;
    if (connecting) drag.disable();
    else drag.enable();
  }, [canvas, connecting]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    const select = canvas?.behaviours.get("click-select");
    if (!select) return;
    return select.events.on("selection:change", (snapshot) => {
      const [node] = snapshot.shapeIds;
      const [edge] = snapshot.connectorIds;
      const next = snapshot.shapeIds.length + snapshot.connectorIds.length !== 1 ? null : node ? { kind: "node", id: node } : { kind: "edge", id: edge };
      if (!sameSelection(next, selectedRef.current)) selectRef.current?.(next);
    });
  }, [canvas]);
  useEffect(() => {
    const select = canvas?.behaviours.get("click-select");
    if (!select) return;
    if (!selected) select.clearSelection();
    else select.select(selected.id, selected.kind === "node" ? "shape" : "connector");
  }, [canvas, selected]);
  const levels = Object.keys(detail.options);
  return /* @__PURE__ */ jsxs(
    GraphCanvasApp,
    {
      data,
      config: initialConfig,
      onReady,
      bundle: false,
      ...preference !== void 0 ? { preference, instanceKey: preference } : {},
      ...height !== void 0 ? { height } : {},
      header: {
        ...headerClassName ? { className: headerClassName } : {},
        ...title ? { title } : { left: null },
        center: /* @__PURE__ */ jsx(
          GraphControlsToolbar,
          {
            sections: { layout: false },
            ...connect ? {
              extraItems: [
                {
                  key: "connect",
                  type: "toggle",
                  icon: Link2,
                  label: connect.label,
                  active: connecting,
                  onToggle: () => setConnectTool((on) => !on)
                }
              ]
            } : {}
          }
        ),
        right: () => /* @__PURE__ */ jsx(
          ToolbarItems,
          {
            orientation: "horizontal",
            items: [
              ...levels.length > 1 ? [
                {
                  type: "select",
                  key: "detail",
                  label: "Detail",
                  value: level2,
                  options: detail.options,
                  onChange: (v) => setLevel(v)
                }
              ] : [],
              ...dock.items.filter((item) => item.key !== CONNECT_PANEL)
            ]
          }
        )
      },
      footer: { left: /* @__PURE__ */ jsx(GraphStatusBar, {}), right: /* @__PURE__ */ jsx(CanvasMessageBar, {}) },
      right: dock.region,
      children: [
        /* @__PURE__ */ jsx(BackgroundLayer, { id: "background" }),
        /* @__PURE__ */ jsx(GraphLayer, { id: SCHEMA_LAYER, data }),
        theme !== false ? /* @__PURE__ */ jsx(ThemeBehaviour, { id: "theme" }) : null,
        theme === "tokens" ? /* @__PURE__ */ jsx(CanvasThemeSync, { source: "tokens" }) : theme ? /* @__PURE__ */ jsx(CanvasThemeSync, {}) : null,
        /* @__PURE__ */ jsx(DragPanBehaviour, { id: "pan" }),
        /* @__PURE__ */ jsx(WheelZoomBehaviour, { id: "wheel" }),
        /* @__PURE__ */ jsx(DragNodeBehaviour, { id: "drag-node", targetLayerId: SCHEMA_LAYER, enabled: !connecting }),
        connect ? /* @__PURE__ */ jsx(DrawEdgeBehaviour, { id: "draw-edge", targetLayerId: SCHEMA_LAYER, enabled: connecting, createEdge }) : null,
        /* @__PURE__ */ jsx(HoverActivateBehaviour, { id: "hover", targetLayerId: SCHEMA_LAYER }),
        /* @__PURE__ */ jsx(ClickSelectBehaviour, { id: "click-select", targetLayerId: SCHEMA_LAYER }),
        /* @__PURE__ */ jsx(ElkLayout, { id: LAYOUT, targetLayerId: SCHEMA_LAYER, fitPadding: 60 }),
        /* @__PURE__ */ jsx(CollapseExpandBehaviour, { id: "collapse-expand", targetLayerId: SCHEMA_LAYER, enabled: true }),
        /* @__PURE__ */ jsx(TextResolutionLODBehaviour, { id: "label-resolution", targetLayerId: SCHEMA_LAYER }),
        /* @__PURE__ */ jsx(NodeLabelLODBehaviour, { id: "text-lod", targetLayerId: SCHEMA_LAYER }),
        /* @__PURE__ */ jsx(HoverElementPreviewBehaviour, { targetLayerId: SCHEMA_LAYER, renderNode, renderEdge }),
        children
      ]
    }
  );
}

// src/board/dag/presets.ts
var DAG_LAYER = "graph";
var DAG_LAYOUT = "elk";
var DAG_TONES = {
  muted: 6581107,
  queued: 6581107,
  info: 2861914,
  running: 2861914,
  success: 1096065,
  warning: 16096779,
  error: 15680580
};
var NODE_RADIUS = 13;
var LABEL_COLOUR = 9542049;
var EDGE_COLOUR = 6581107;
var STROKE = 1579547;
var nodeData = (n) => n.data ?? {};
var edgeData = (e) => e.data ?? {};
function dagNodeStyle(tones) {
  const fill = (n) => tones[nodeData(n).tone ?? "muted"] ?? tones.muted ?? EDGE_COLOUR;
  return {
    shape: { kind: "circle", radius: NODE_RADIUS },
    bgFill: fill,
    bgAlpha: (n) => nodeData(n).disabled ? 0.25 : 1,
    bgStrokeWidth: 2,
    bgStrokeColor: (n) => nodeData(n).disabled ? fill(n) : STROKE,
    bgStrokeDashArray: (n) => nodeData(n).disabled ? [3, 3] : [0, 0],
    labelText: (n) => String(nodeData(n).text ?? n.id),
    labelColor: LABEL_COLOUR,
    labelFontSize: 12,
    labelPlacement: "bottom",
    labelOffsetY: 5,
    labelLineHeight: 14
  };
}
function dagEdgeStyle(tones) {
  const colour = (e) => edgeData(e).highlight ? tones.info ?? EDGE_COLOUR : EDGE_COLOUR;
  return {
    strokeColor: colour,
    strokeWidth: (e) => edgeData(e).highlight ? 2.5 : 1.5,
    strokeDashArray: (e) => edgeData(e).dashed ? [4, 3] : [0, 0],
    arrowTargetShape: "triangle",
    arrowTargetSize: 7,
    arrowTargetColor: colour,
    labelText: (e) => String(edgeData(e).label ?? ""),
    labelColor: LABEL_COLOUR,
    labelFontSize: 10,
    // A dashed edge often runs past the node between its ends; its label sits on the other side.
    labelOffsetY: (e) => edgeData(e).dashed ? 9 : -9
  };
}
var DAG_BOARD_CONFIG = {
  activeLayout: DAG_LAYOUT,
  fitOnLoad: false,
  layers: {
    background: { type: "pattern", patternType: "dots", alpha: 0.4 }
  },
  layouts: {
    [DAG_LAYOUT]: { algorithm: "layered", direction: "RIGHT", nodeSpacing: 76, layerSpacing: 150 }
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    "drag-node": { enabled: true },
    "click-select": { enabled: true },
    "label-resolution": { enabled: true }
  }
};
var hex = (n) => `#${n.toString(16).padStart(6, "0")}`;
function swatchKind({ swatch, dashed }) {
  if (swatch === "node") return dashed ? "ring" : "dot";
  return dashed ? "dashed" : "line";
}
function DagLegend({ legend, tones = DAG_TONES, error, note, className }) {
  const copy = note ?? legend?.note;
  return /* @__PURE__ */ jsx(
    "div",
    {
      className: cn(
        "pointer-events-none max-w-2xl rounded-sm border bg-card/90 px-2 py-1.5 backdrop-blur",
        error ? "border-destructive/50" : "border-border",
        className
      ),
      children: error ? /* @__PURE__ */ jsx("span", { className: "text-destructive", children: error }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        legend?.keys.length ? /* @__PURE__ */ jsx(Legend, { className: "mb-1 text-muted-foreground", children: legend.keys.map((key) => /* @__PURE__ */ jsx(
          LegendItem,
          {
            kind: swatchKind(key),
            color: key.swatch === "node" ? hex(tones[key.tone ?? "muted"] ?? tones.muted ?? 6581107) : "var(--muted-foreground)",
            label: key.label
          },
          key.label
        )) }) : null,
        copy ? /* @__PURE__ */ jsx("span", { className: "text-muted-foreground", children: copy }) : null
      ] })
    }
  );
}
var COLUMN_GAP = 190;
var ROW_GAP = 90;
var FIT = { padding: 70, maxZoom: 1 };
var NO_DETAIL = {
  templates: { only: {} },
  options: { only: "" },
  initial: "only"
};
var sameSelection2 = (a, b) => a?.kind === b?.kind && a?.id === b?.id;
function useStableValue2(value) {
  const signature = JSON.stringify(value);
  const ref = useRef({ signature, value });
  if (ref.current.signature !== signature) ref.current = { signature, value };
  return ref.current.value;
}
function seedColumns(data) {
  const rows = /* @__PURE__ */ new Map();
  return {
    ...data,
    nodes: data.nodes.map((node) => {
      const column = node.data?.column;
      if (node.position || typeof column !== "number") return node;
      const row = rows.get(column) ?? 0;
      rows.set(column, row + 1);
      return {
        ...node,
        position: { x: column * COLUMN_GAP, y: row * ROW_GAP }
      };
    })
  };
}
function LayeredDagBoard({
  data: dataProp,
  config,
  detail,
  initialDetail,
  tones = DAG_TONES,
  legend,
  error,
  emptyHint = "Nothing to draw yet.",
  chrome = "app",
  layout = "layered",
  title,
  message,
  selected = null,
  onSelect,
  connect,
  renderNode,
  renderEdge,
  theme = true,
  dockSection,
  headerClassName,
  height,
  onReady: onReadyProp,
  children
}) {
  const stable = useStableValue2(dataProp);
  const data = useMemo(() => seedColumns(stable), [stable]);
  const [canvas, setCanvas] = useState(null);
  const ownConfig = config === void 0;
  const boardConfig2 = config ?? DAG_BOARD_CONFIG;
  const levels = detail ?? NO_DETAIL;
  const tonesKey = JSON.stringify(tones);
  const nodeStyle = useMemo(() => ownConfig ? dagNodeStyle(tones) : void 0, [ownConfig, tonesKey]);
  const edgeStyle = useMemo(() => ownConfig ? dagEdgeStyle(tones) : void 0, [ownConfig, tonesKey]);
  const [connectTool, setConnectTool] = useState(false);
  const connecting = !!connect && connectTool;
  const connectRef = useRef(connect);
  connectRef.current = connect;
  const [refusal, setRefusal] = useState(null);
  const { level: level2, setLevel, initialConfig } = useDetailTemplates({
    canvas: layout === "layered" ? canvas : null,
    config: boardConfig2,
    detail: levels,
    data,
    layout: DAG_LAYOUT,
    layerId: DAG_LAYER,
    fitPadding: FIT.padding,
    fitMaxZoom: FIT.maxZoom,
    ...initialDetail !== void 0 ? { initial: initialDetail } : {}
  });
  useEffect(() => {
    if (!canvas || layout !== "fixed" || data.nodes.length === 0) return;
    const id = requestAnimationFrame(() => canvas.fitView(FIT.padding, FIT.maxZoom));
    return () => cancelAnimationFrame(id);
  }, [canvas, layout, data]);
  const frame2 = useRef(null);
  const handedOver = useRef(false);
  useEffect(() => {
    const el = canvas?.renderer?.canvasElement ?? frame2.current;
    if (!canvas || !el || typeof ResizeObserver === "undefined") return;
    let size = null;
    let raf = null;
    const observer = new ResizeObserver(([entry]) => {
      const box = entry?.contentRect;
      if (!box) return;
      const next = { w: Math.round(box.width), h: Math.round(box.height) };
      const changed = size !== null && (size.w !== next.w || size.h !== next.h);
      size = next;
      if (!changed || handedOver.current || raf !== null) return;
      if (canvas.store.view.getState().runtime.layout.running) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        canvas.fitView(FIT.padding, FIT.maxZoom);
      });
    });
    observer.observe(el);
    const offStart = canvas.events.on("layout:run:start", () => {
      handedOver.current = false;
    });
    const offEnd = canvas.events.on("layout:run:end", ({ reason }) => {
      if (reason !== "settled" || handedOver.current) return;
      requestAnimationFrame(() => canvas.fitView(FIT.padding, FIT.maxZoom));
    });
    return () => {
      observer.disconnect();
      offStart();
      offEnd();
      if (raf !== null) cancelAnimationFrame(raf);
    };
  }, [canvas]);
  const handOver = useCallback(() => {
    handedOver.current = true;
  }, []);
  const dock = useSidePanels(
    [
      {
        id: "settings",
        icon: Settings,
        label: "Settings",
        render: (c) => /* @__PURE__ */ jsx(CanvasSettingsEditorPanel, { canvas: c, className: "border-0 bg-transparent shadow-none" })
      }
    ],
    dockSection ? { section: dockSection } : void 0
  );
  const canvasRef = useRef(canvas);
  canvasRef.current = canvas;
  const createEdge = useCallback(
    (source, target) => {
      const said = connectRef.current?.onConnect(source, target) ?? null;
      if (chrome === "app") {
        if (said) canvasRef.current?.showMessage(said);
      } else setRefusal(said);
      return null;
    },
    [chrome]
  );
  const onReady = useCallback(
    (c) => {
      setCanvas(c);
      if (message) c?.showMessage(message);
      onReadyProp?.(c);
    },
    [message, onReadyProp]
  );
  useEffect(() => {
    const drag = canvas?.behaviours.get("drag-node");
    if (!drag) return;
    if (connecting) drag.disable();
    else drag.enable();
  }, [canvas, connecting]);
  const selectRef = useRef(onSelect);
  selectRef.current = onSelect;
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  useEffect(() => {
    const select = canvas?.behaviours.get("click-select");
    if (!select) return;
    return select.events.on("selection:change", (snapshot) => {
      const [node] = snapshot.shapeIds;
      const [edge] = snapshot.connectorIds;
      const next = snapshot.shapeIds.length + snapshot.connectorIds.length !== 1 ? null : node ? { kind: "node", id: node } : { kind: "edge", id: edge };
      if (!sameSelection2(next, selectedRef.current)) selectRef.current?.(next);
    });
  }, [canvas]);
  useEffect(() => {
    const select = canvas?.behaviours.get("click-select");
    if (!select) return;
    if (!selected) select.clearSelection();
    else select.select(selected.id, selected.kind === "node" ? "shape" : "connector");
  }, [canvas, selected]);
  if (data.nodes.length === 0) {
    return /* @__PURE__ */ jsx("div", { className: "flex h-full w-full items-center justify-center p-6 text-center text-muted-foreground", children: emptyHint });
  }
  const panel = chrome === "panel";
  const mountConfig = layout === "fixed" ? {
    ...initialConfig,
    activeLayout: void 0
  } : initialConfig;
  const levelKeys = Object.keys(levels.options);
  const connectItem = connect ? [
    {
      key: "connect",
      type: "toggle",
      icon: Spline,
      label: connect.label,
      active: connecting,
      onToggle: () => setConnectTool((on) => !on)
    }
  ] : [];
  return /* @__PURE__ */ jsx(
    "div",
    {
      ref: frame2,
      className: height === void 0 ? "h-full w-full" : "w-full",
      onPointerDownCapture: handOver,
      onWheelCapture: handOver,
      children: /* @__PURE__ */ jsxs(
        GraphCanvasApp,
        {
          data,
          config: mountConfig,
          onReady,
          bundle: false,
          showHeader: !panel,
          ...height !== void 0 ? { height } : {},
          ...panel ? {} : {
            header: {
              ...headerClassName ? { className: headerClassName } : {},
              ...title ? { title } : { left: null },
              center: /* @__PURE__ */ jsx(
                GraphControlsToolbar,
                {
                  sections: {
                    layout: false,
                    history: false,
                    style: false,
                    edit: false,
                    grid: false
                  },
                  extraItems: connectItem
                }
              ),
              right: () => /* @__PURE__ */ jsx(
                ToolbarItems,
                {
                  orientation: "horizontal",
                  items: [
                    ...levelKeys.length > 1 ? [
                      {
                        type: "select",
                        key: "detail",
                        label: "Detail",
                        value: level2,
                        options: levels.options,
                        onChange: (v) => setLevel(v)
                      }
                    ] : [],
                    ...dock.items
                  ]
                }
              )
            },
            footer: { left: /* @__PURE__ */ jsx(GraphStatusBar, {}), right: /* @__PURE__ */ jsx(CanvasMessageBar, {}) },
            right: dock.region
          },
          children: [
            /* @__PURE__ */ jsx(BackgroundLayer, { id: "background" }),
            /* @__PURE__ */ jsx(
              GraphLayer,
              {
                id: DAG_LAYER,
                data,
                ...nodeStyle ? { node: { style: nodeStyle } } : {},
                ...edgeStyle ? { edge: { style: edgeStyle } } : {}
              }
            ),
            theme !== false ? /* @__PURE__ */ jsx(ThemeBehaviour, { id: "theme" }) : null,
            theme === "tokens" ? /* @__PURE__ */ jsx(CanvasThemeSync, { source: "tokens" }) : theme ? /* @__PURE__ */ jsx(CanvasThemeSync, {}) : null,
            /* @__PURE__ */ jsx(DragPanBehaviour, { id: "pan" }),
            /* @__PURE__ */ jsx(WheelZoomBehaviour, { id: "wheel" }),
            /* @__PURE__ */ jsx(DragNodeBehaviour, { id: "drag-node", targetLayerId: DAG_LAYER, enabled: !connecting }),
            connect ? /* @__PURE__ */ jsx(DrawEdgeBehaviour, { id: "draw-edge", targetLayerId: DAG_LAYER, enabled: connecting, createEdge }) : null,
            /* @__PURE__ */ jsx(HoverActivateBehaviour, { id: "hover", targetLayerId: DAG_LAYER }),
            /* @__PURE__ */ jsx(ClickSelectBehaviour, { id: "click-select", targetLayerId: DAG_LAYER }),
            /* @__PURE__ */ jsx(ElkLayout, { id: DAG_LAYOUT, targetLayerId: DAG_LAYER, fitPadding: null }),
            /* @__PURE__ */ jsx(TextResolutionLODBehaviour, { id: "label-resolution", targetLayerId: DAG_LAYER }),
            /* @__PURE__ */ jsx(NodeLabelLODBehaviour, { id: "text-lod", targetLayerId: DAG_LAYER }),
            renderNode || renderEdge ? /* @__PURE__ */ jsx(
              HoverElementPreviewBehaviour,
              {
                targetLayerId: DAG_LAYER,
                ...renderNode ? { renderNode } : {},
                ...renderEdge ? { renderEdge } : {}
              }
            ) : null,
            panel && connect ? /* @__PURE__ */ jsx("div", { className: "absolute left-2 top-2 rounded-sm border bg-card/90 p-0.5 backdrop-blur", children: /* @__PURE__ */ jsx(
              ToolbarItems,
              {
                orientation: "horizontal",
                items: [
                  {
                    key: "select",
                    type: "toggle",
                    icon: MousePointer2,
                    label: "Select / move",
                    active: !connecting,
                    onToggle: () => setConnectTool(false)
                  },
                  ...connectItem
                ]
              }
            ) }) : null,
            panel && (legend || error || refusal) ? /* @__PURE__ */ jsx(
              DagLegend,
              {
                className: "absolute bottom-2 left-2 right-2",
                legend,
                tones,
                error: error ?? refusal,
                note: connecting ? connect?.hint : void 0
              }
            ) : null,
            children
          ]
        }
      )
    }
  );
}
var DEFAULT_MESSAGES = {
  captured: "Captured \u2014 the new snapshot is at the top of the timeline",
  captureFailed: "Could not capture this canvas",
  restored: (label) => `Loaded "${label}" onto the canvas`,
  restoreMissingState: (label) => `"${label}" has no saved state to load`,
  restoreIncompatible: (label) => `"${label}" was saved by a newer version and cannot be loaded`,
  saveFailed: "Could not save that change \u2014 it has been undone",
  deleteFailed: "Could not delete that snapshot \u2014 it has been restored"
};
var DAY_MS = 864e5;
var RENAME_INPUT_CLASS = "h-6 min-w-0 flex-1 rounded border border-border bg-background px-1.5 text-base text-foreground outline-none focus:border-primary disabled:opacity-60";
function captureThumbnail(canvas, format, area, maxSize) {
  try {
    if (format === "svg") {
      const svg = canvas.exportSVGString({ area, background: "canvas", aspectRatio: 16 / 9 });
      return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    }
    return canvas.exportDataURL({ format: "png", area, background: "canvas", maxSize });
  } catch {
    return void 0;
  }
}
function summarise(state) {
  let nodes = 0;
  let edges = 0;
  for (const value of Object.values(state.data ?? {})) {
    const d = value;
    if (Array.isArray(d?.nodes)) nodes += d.nodes.length;
    if (Array.isArray(d?.edges)) edges += d.edges.length;
  }
  if (nodes === 0 && edges === 0) return void 0;
  return `${nodes} nodes \xB7 ${edges} edges`;
}
function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
function dayHeading(date, now, locale) {
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days > 1 && days < 7) return date.toLocaleDateString(locale, { weekday: "long" });
  return date.toLocaleDateString(locale, {
    day: "numeric",
    month: "short",
    ...date.getFullYear() === now.getFullYear() ? {} : { year: "numeric" }
  });
}
function groupByDay(snapshots, now, locale) {
  const dated = snapshots.map((v) => ({ ...v, date: new Date(v.capturedAt) })).filter((v) => !Number.isNaN(v.date.getTime())).sort((a, b) => b.date.getTime() - a.date.getTime());
  const groups = [];
  for (const v of dated) {
    const key = String(startOfDay(v.date));
    const last = groups[groups.length - 1];
    if (last?.key === key) last.snapshots.push(v);
    else groups.push({ key, heading: dayHeading(v.date, now, locale), snapshots: [v] });
  }
  return groups;
}
function SnapshotRow({
  snapshot,
  date,
  thumbnail,
  isActive,
  restoreHint,
  isRestoring,
  untitledLabel,
  locale,
  onRestore,
  onRename,
  isRenaming,
  onDelete,
  deleteArmed,
  onArmDelete,
  onDisarmDelete
}) {
  const title = snapshot.label || untitledLabel;
  const time = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  const [draft, setDraft] = useState(null);
  const beginEdit = () => setDraft(snapshot.label ?? "");
  const commit = () => {
    if (draft === null) return;
    const next = draft.trim();
    setDraft(null);
    if (next !== (snapshot.label ?? "")) onRename?.(next);
  };
  const onFieldKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setDraft(null);
    }
  };
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: cn(
        "group flex flex-col gap-1.5 rounded-md border border-border p-2",
        isActive && "border-primary/60 bg-primary/5"
      ),
      children: [
        /* @__PURE__ */ jsx(Tooltipped, { label: restoreHint, side: "left", children: /* @__PURE__ */ jsx(
          Button,
          {
            variant: "ghost",
            className: cn(
              "h-auto w-full overflow-hidden rounded border border-border p-0",
              // Ring colour is scoped to the hover/focus states, never set at rest:
              // a bare `ring-primary/40` paints every row the moment anything gives
              // the button a ring width, which reads as "every snapshot is active".
              "ring-0 transition-shadow hover:ring-2 hover:ring-primary/40",
              "focus-visible:ring-2 focus-visible:ring-primary/40"
            ),
            disabled: isRestoring,
            "aria-label": `${restoreHint}: ${title}`,
            onClick: onRestore,
            children: thumbnail
          }
        ) }),
        /* @__PURE__ */ jsxs("div", { className: "flex items-center gap-2", children: [
          draft !== null ? /* @__PURE__ */ jsx(
            "input",
            {
              className: RENAME_INPUT_CLASS,
              value: draft,
              autoFocus: true,
              disabled: isRenaming,
              "aria-label": "Rename snapshot",
              placeholder: untitledLabel,
              onChange: (e) => setDraft(e.target.value),
              onKeyDown: onFieldKeyDown,
              onBlur: commit
            }
          ) : onRename ? /* @__PURE__ */ jsxs(
            Button,
            {
              variant: "ghost",
              className: "h-auto min-w-0 flex-1 justify-start gap-1.5 px-1 py-0 text-base font-normal",
              title: `${title} \u2014 click to rename`,
              onClick: beginEdit,
              children: [
                /* @__PURE__ */ jsx("span", { className: "min-w-0 truncate", children: title }),
                /* @__PURE__ */ jsx(Pencil, { className: "h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-60" })
              ]
            }
          ) : /* @__PURE__ */ jsx("span", { className: "min-w-0 flex-1 truncate", title, children: title }),
          /* @__PURE__ */ jsx("span", { className: "shrink-0 text-sm tabular-nums text-muted-foreground", title: date.toLocaleString(locale), children: time }),
          onDelete && (deleteArmed ? (
            // Armed: the second click deletes. An inline confirm rather than a
            // dialog — a docked panel should not open a modal, and one stray
            // click must not destroy a capture.
            /* @__PURE__ */ jsxs("span", { className: "flex shrink-0 items-center gap-1", children: [
              /* @__PURE__ */ jsx(
                Button,
                {
                  variant: "ghost",
                  size: "sm",
                  className: "h-6 px-1.5 text-sm text-destructive",
                  onClick: onDelete,
                  children: "Delete"
                }
              ),
              /* @__PURE__ */ jsx(Button, { variant: "ghost", size: "sm", className: "h-6 px-1.5 text-sm", onClick: onDisarmDelete, children: "Cancel" })
            ] })
          ) : /* @__PURE__ */ jsx(Tooltipped, { label: "Delete snapshot", side: "left", children: /* @__PURE__ */ jsx(
            Button,
            {
              variant: "ghost",
              size: "icon",
              className: "h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-70 focus-visible:opacity-100",
              "aria-label": `Delete ${title}`,
              onClick: onArmDelete,
              children: /* @__PURE__ */ jsx(Trash2, { className: "h-3.5 w-3.5" })
            }
          ) }))
        ] }),
        (snapshot.summary || snapshot.by) && /* @__PURE__ */ jsxs("p", { className: "text-sm text-muted-foreground", children: [
          snapshot.summary,
          snapshot.summary && snapshot.by ? " \xB7 " : "",
          snapshot.by
        ] })
      ]
    }
  );
}
function CanvasSnapshotsViewPanel({
  canvas,
  initialSnapshots,
  snapshots: controlledSnapshots,
  onCreateSnapshot,
  onUpdateSnapshot,
  onDeleteSnapshot,
  onRestoreSnapshot,
  restoreHint = "Click to load this snapshot onto the canvas",
  activeSnapshotId,
  showCapture = true,
  captureLabel = "Take snapshot",
  captureHint = "Captures the whole canvas \u2014 what's selected and highlighted, where every element sits, and your current viewport.",
  captureDefaultLabel = "Manual capture",
  thumbnailFormat = "png",
  thumbnailMaxSize = 800,
  captureArea = "viewport",
  allowDelete = true,
  allowRename = true,
  isLoading = false,
  emptyText = "No saved snapshots yet. Each capture lands here, so you can go back to it.",
  untitledLabel = "Canvas snapshot",
  messages,
  renderThumbnail,
  locale,
  className
}) {
  const say = useMemo(() => ({ ...DEFAULT_MESSAGES, ...messages }), [messages]);
  const [ownSnapshots, setOwnSnapshots] = useState(initialSnapshots ?? []);
  const isControlled = controlledSnapshots !== void 0;
  const snapshots = isControlled ? controlledSnapshots : ownSnapshots;
  const [ownActiveId, setOwnActiveId] = useState(null);
  const activeId = activeSnapshotId !== void 0 ? activeSnapshotId : ownActiveId;
  const [isCapturing, setCapturing] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);
  const applyLocally = useCallback(
    (fn) => {
      if (!isControlled) setOwnSnapshots(fn);
    },
    [isControlled]
  );
  const capture = useCallback(async () => {
    if (!canvas || isCapturing) return;
    setCapturing(true);
    const id = `snap-${Date.now()}`;
    try {
      const state = canvas.exportState();
      const row = {
        id,
        capturedAt: /* @__PURE__ */ new Date(),
        label: captureDefaultLabel,
        summary: summarise(state),
        thumbnail: captureThumbnail(canvas, thumbnailFormat, captureArea, thumbnailMaxSize),
        state
      };
      applyLocally((prev) => [row, ...prev]);
      setOwnActiveId(id);
      canvas.showMessage(say.captured);
      await onCreateSnapshot?.(row);
    } catch {
      applyLocally((prev) => prev.filter((v) => v.id !== id));
      canvas.showMessage(say.captureFailed);
    } finally {
      setCapturing(false);
    }
  }, [
    canvas,
    isCapturing,
    captureDefaultLabel,
    thumbnailFormat,
    captureArea,
    thumbnailMaxSize,
    applyLocally,
    say,
    onCreateSnapshot
  ]);
  const restore = useCallback(
    (row) => {
      if (!canvas) return;
      const label = row.label || untitledLabel;
      if (!row.state) {
        canvas.showMessage(say.restoreMissingState(label));
        return;
      }
      try {
        canvas.importState(row.state);
      } catch {
        canvas.showMessage(say.restoreIncompatible(label));
        return;
      }
      setOwnActiveId(row.id);
      canvas.showMessage(say.restored(label));
      onRestoreSnapshot?.(row);
    },
    [canvas, untitledLabel, say, onRestoreSnapshot]
  );
  const rename = useCallback(
    async (row, label) => {
      const next = { ...row, label: label || void 0 };
      applyLocally((prev) => prev.map((v) => v.id === row.id ? next : v));
      setBusyId(row.id);
      try {
        await onUpdateSnapshot?.(next, { label });
      } catch {
        applyLocally((prev) => prev.map((v) => v.id === row.id ? row : v));
        canvas?.showMessage(say.saveFailed);
      } finally {
        setBusyId(null);
      }
    },
    [applyLocally, onUpdateSnapshot, canvas, say]
  );
  const remove = useCallback(
    async (row) => {
      setPendingDeleteId(null);
      applyLocally((prev) => prev.filter((v) => v.id !== row.id));
      setBusyId(row.id);
      try {
        await onDeleteSnapshot?.(row.id);
      } catch {
        applyLocally((prev) => [row, ...prev.filter((v) => v.id !== row.id)]);
        canvas?.showMessage(say.deleteFailed);
      } finally {
        setBusyId(null);
      }
    },
    [applyLocally, onDeleteSnapshot, canvas, say]
  );
  const groups = useMemo(() => groupByDay(snapshots, /* @__PURE__ */ new Date(), locale), [snapshots, locale]);
  const empty = !isLoading && groups.length === 0;
  return /* @__PURE__ */ jsxs("div", { className: cn("flex h-full min-h-0 flex-col text-base", className), children: [
    showCapture && /* @__PURE__ */ jsxs("div", { className: "border-b border-border p-2", children: [
      /* @__PURE__ */ jsxs(
        Button,
        {
          variant: "outline",
          size: "sm",
          className: "h-8 w-full gap-1.5 text-sm",
          disabled: isCapturing || !canvas,
          onClick: () => void capture(),
          children: [
            /* @__PURE__ */ jsx(Camera, { className: "h-3.5 w-3.5" }),
            captureLabel
          ]
        }
      ),
      captureHint && /* @__PURE__ */ jsx("p", { className: "mt-1.5 text-sm leading-snug text-muted-foreground", children: captureHint })
    ] }),
    /* @__PURE__ */ jsx(ScrollArea, { className: "min-h-0 flex-1", children: /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-4 p-2", children: [
      isLoading && /* @__PURE__ */ jsxs("div", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx(Skeleton, { className: "h-20 w-full" }),
        /* @__PURE__ */ jsx(Skeleton, { className: "h-20 w-full" })
      ] }),
      empty && /* @__PURE__ */ jsx("p", { className: "px-1 text-sm text-muted-foreground", children: emptyText }),
      groups.map((group) => /* @__PURE__ */ jsxs("section", { className: "flex flex-col gap-2", children: [
        /* @__PURE__ */ jsx("p", { className: "px-1 text-sm font-medium uppercase tracking-wide text-muted-foreground", children: group.heading }),
        group.snapshots.map((v) => {
          const slot = renderThumbnail?.(v);
          const thumbnail = slot ? /* @__PURE__ */ jsx("div", { className: "aspect-video w-full overflow-hidden", children: slot }) : v.thumbnail ? /* @__PURE__ */ jsx("img", { src: v.thumbnail, alt: "", loading: "lazy", className: "aspect-video w-full object-cover" }) : v.hasThumbnail ? /* @__PURE__ */ jsx(Skeleton, { className: "aspect-video w-full" }) : /* @__PURE__ */ jsx("div", { className: "flex aspect-video w-full items-center justify-center bg-muted/40", children: /* @__PURE__ */ jsx(ImageOff, { className: "h-4 w-4 text-muted-foreground" }) });
          return /* @__PURE__ */ jsx(
            SnapshotRow,
            {
              snapshot: v,
              date: v.date,
              thumbnail,
              isActive: v.id === activeId,
              restoreHint,
              isRestoring: !canvas || busyId === v.id,
              untitledLabel,
              locale,
              onRestore: () => restore(v),
              onRename: allowRename ? (label) => void rename(v, label) : void 0,
              isRenaming: busyId === v.id,
              onDelete: allowDelete ? () => void remove(v) : void 0,
              deleteArmed: pendingDeleteId === v.id,
              onArmDelete: allowDelete ? () => setPendingDeleteId(v.id) : void 0,
              onDisarmDelete: () => setPendingDeleteId(null)
            },
            v.id
          );
        })
      ] }, group.key))
    ] }) })
  ] });
}
function GraphNodeContextMenu({
  items,
  id = "node-context-menu",
  ...common
}) {
  const build = useCallback(
    (event, base) => items({ ...base, id: event.id, data: event.data }),
    [items]
  );
  return /* @__PURE__ */ jsx(GraphContextMenuRoot, { target: "node", id, build, ...common });
}
function GraphEdgeContextMenu({
  items,
  id = "edge-context-menu",
  ...common
}) {
  const build = useCallback(
    (event, base) => items({ ...base, id: event.id, data: event.data }),
    [items]
  );
  return /* @__PURE__ */ jsx(GraphContextMenuRoot, { target: "edge", id, build, ...common });
}
function GraphContextMenu({
  nodes = true,
  edges = true,
  selectBehaviourId = "click-select",
  focusZoom = 2,
  nodeItems,
  edgeItems,
  layerId = "graph",
  ...common
}) {
  const buildNode = useCallback(
    (ctx) => {
      const layer = ctx.canvas.layers.get(layerId);
      const select = selectBehaviourId != null ? ctx.canvas.behaviours.get(selectBehaviourId) : void 0;
      const hidden = layer?.isNodeHidden(ctx.id) ?? false;
      const defaults = [
        {
          id: "focus",
          label: "Focus",
          icon: Crosshair,
          onClick: () => layer?.focusNode(ctx.id, { zoom: focusZoom })
        },
        ...select ? [
          {
            id: "select",
            label: "Select",
            icon: MousePointer2,
            onClick: () => select.select(ctx.id, "shape")
          }
        ] : [],
        hidden ? { id: "toggle-hidden", label: "Show", icon: Eye, onClick: () => layer?.showNode(ctx.id) } : { id: "toggle-hidden", label: "Hide", icon: EyeOff, onClick: () => layer?.hideNode(ctx.id) }
      ];
      return nodeItems ? nodeItems(ctx, defaults) : defaults;
    },
    [layerId, selectBehaviourId, focusZoom, nodeItems]
  );
  const buildEdge = useCallback(
    (ctx) => {
      const layer = ctx.canvas.layers.get(layerId);
      const select = selectBehaviourId != null ? ctx.canvas.behaviours.get(selectBehaviourId) : void 0;
      const hidden = layer?.isEdgeHidden(ctx.id) ?? false;
      const defaults = [
        {
          id: "focus",
          label: "Focus",
          icon: Crosshair,
          onClick: () => layer?.focusEdges([ctx.id])
        },
        ...select ? [
          {
            id: "select",
            label: "Select",
            icon: MousePointer2,
            onClick: () => select.select(ctx.id, "connector")
          }
        ] : [],
        hidden ? { id: "toggle-hidden", label: "Show", icon: Eye, onClick: () => layer?.showEdge(ctx.id) } : { id: "toggle-hidden", label: "Hide", icon: EyeOff, onClick: () => layer?.hideEdge(ctx.id) }
      ];
      return edgeItems ? edgeItems(ctx, defaults) : defaults;
    },
    [layerId, selectBehaviourId, focusZoom, edgeItems]
  );
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    nodes ? /* @__PURE__ */ jsx(GraphNodeContextMenu, { items: buildNode, layerId, ...common }) : null,
    edges ? /* @__PURE__ */ jsx(GraphEdgeContextMenu, { items: buildEdge, layerId, ...common }) : null
  ] });
}
function GraphBackgroundContextMenu({
  items,
  id = "background-context-menu",
  ...common
}) {
  const build = useCallback(
    (_event, base) => items(base),
    [items]
  );
  return /* @__PURE__ */ jsx(GraphContextMenuRoot, { target: "canvas", id, build, ...common });
}
function runsBare(args) {
  return !Object.values(args ?? {}).some((s) => s.pick || s.required);
}
var COMMAND_CLASS = "[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5";
var MAC_KEYS = {
  mod: "\u2318",
  meta: "\u2318",
  ctrl: "\u2303",
  alt: "\u2325",
  shift: "\u21E7",
  escape: "Esc",
  backspace: "\u232B",
  delete: "\u2326",
  enter: "\u21A9",
  space: "Space"
};
var PC_KEYS = {
  mod: "Ctrl",
  meta: "Win",
  ctrl: "Ctrl",
  alt: "Alt",
  shift: "Shift",
  escape: "Esc",
  backspace: "Backspace",
  delete: "Del",
  enter: "Enter",
  space: "Space"
};
function keyHint(keys) {
  const mac = typeof navigator !== "undefined" && /mac|iphone|ipad/i.test(navigator.platform ?? "");
  const names = mac ? MAC_KEYS : PC_KEYS;
  const alts = keys.split(",").map((k) => k.trim().toLowerCase()).filter(Boolean);
  const alt = mac && alts[0] === "delete" && alts.includes("backspace") ? "backspace" : alts[0] ?? "";
  const parts = alt.split("+").filter(Boolean);
  const order = ["ctrl", "alt", "shift", "mod", "meta"];
  const mods = parts.filter((p) => order.includes(p)).sort((a, b) => order.indexOf(a) - order.indexOf(b));
  const rest = parts.filter((p) => !order.includes(p));
  const label = (p) => names[p] ?? (p.length === 1 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1));
  return [...mods, ...rest].map(label).join(mac ? "" : "+");
}
function rank(entry, query) {
  const label = entry.label.toLowerCase();
  if (label === query) return 6;
  if (label.startsWith(query)) return 5;
  if (label.split(/[\s:/-]+/).some((w) => w.startsWith(query))) return 4;
  if (label.includes(query)) return 3;
  if (entry.keywords.some((k) => k.toLowerCase().includes(query))) return 2;
  let i = 0;
  for (const ch of label) if (ch === query[i]) i++;
  return i === query.length ? 1 : 0;
}
function CommandPalette({
  variant = "dialog",
  open = false,
  onOpenChange,
  commands,
  shortcuts,
  placeholder = "Type a command\u2026",
  canvas
}) {
  const inline = variant === "inline";
  const resolved = useResolvedCanvas(canvas);
  const subscribe = useCallback((onChange) => resolved.commands.subscribe(onChange), [resolved]);
  const getVersion = useCallback(() => resolved.commands.version, [resolved]);
  const version = useSyncExternalStore(subscribe, getVersion, getVersion);
  const entries = useMemo(() => {
    if (!inline && !open) return [];
    const only = commands ? new Set(commands) : null;
    const out = [];
    for (const name of resolved.commands.list()) {
      if (name.includes("#") || only && !only.has(name)) continue;
      const cmd = resolved.commands.get(name);
      if (!cmd) continue;
      const label = cmd.label ?? name;
      const group = cmd.category ?? "Other";
      const keywords = [name, ...cmd.keywords ?? []];
      const pick2 = Object.entries(cmd.args ?? {}).find(([, s]) => s.pick)?.[0];
      if (pick2) {
        for (const o of resolved.commands.options(name)) {
          out.push({ key: `${name}:${o.value}`, command: name, args: { [pick2]: o.value }, label: `${label}: ${o.label}`, group, keywords });
        }
      } else if (runsBare(cmd.args)) {
        out.push({ key: name, command: name, label, group, keywords });
      }
    }
    return out;
  }, [inline, open, version, commands, resolved]);
  const { states, run } = useCommandStates(entries, resolved);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(void 0);
  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const scored = entries.map((e, i) => ({ i, score: q ? rank(e, q) : 1 })).filter((r) => r.score > 0).sort((a, b) => b.score - a.score || a.i - b.i);
    const byGroup = /* @__PURE__ */ new Map();
    for (const { i } of scored) byGroup.set(entries[i].group, [...byGroup.get(entries[i].group) ?? [], i]);
    return [...byGroup.entries()];
  }, [entries, query]);
  const current = useMemo(() => {
    const shown = groups.flatMap(([, indexes]) => indexes).filter((i) => states[i]?.enabled);
    const keys = shown.map((i) => entries[i].key);
    return selected !== void 0 && keys.includes(selected) ? selected : keys[0] ?? "";
  }, [groups, states, entries, selected]);
  const onQuery = useCallback((q) => {
    setQuery(q);
    setSelected(void 0);
  }, []);
  const pick = useCallback(
    (e) => {
      run(e.command, e.args);
      onQuery("");
      if (!inline) onOpenChange?.(false);
    },
    [run, onQuery, inline, onOpenChange]
  );
  const hints = useMemo(() => {
    const m = /* @__PURE__ */ new Map();
    for (const s of shortcuts ?? []) {
      const k = s.args === void 0 ? s.command : `${s.command}:${JSON.stringify(s.args)}`;
      if (!m.has(k)) m.set(k, keyHint(s.keys));
    }
    return m;
  }, [shortcuts]);
  const list = /* @__PURE__ */ jsxs(Command, { shouldFilter: false, value: current, onValueChange: setSelected, className: cn(COMMAND_CLASS, inline && "bg-transparent"), children: [
    /* @__PURE__ */ jsx(CommandInput, { placeholder, value: query, onValueChange: onQuery }),
    /* @__PURE__ */ jsxs(CommandList, { className: inline ? "max-h-none flex-1" : void 0, children: [
      /* @__PURE__ */ jsx(CommandEmpty, { children: "No matching command." }),
      groups.map(([group, indexes]) => /* @__PURE__ */ jsx(CommandGroup, { heading: group, children: indexes.map((i) => {
        const e = entries[i];
        const hint = hints.get(e.args === void 0 ? e.command : `${e.command}:${JSON.stringify(e.args)}`);
        return /* @__PURE__ */ jsxs(CommandItem, { value: e.key, disabled: !states[i]?.enabled, onSelect: () => pick(e), children: [
          e.label,
          hint && /* @__PURE__ */ jsx(CommandShortcut, { children: hint })
        ] }, e.key);
      }) }, group))
    ] })
  ] });
  if (inline) return list;
  return /* @__PURE__ */ jsx(
    Dialog,
    {
      open,
      onOpenChange: (o) => {
        if (!o) onQuery("");
        onOpenChange?.(o);
      },
      children: /* @__PURE__ */ jsxs(DialogContent, { className: "overflow-hidden p-0", "aria-describedby": void 0, children: [
        /* @__PURE__ */ jsx(DialogTitle, { className: "sr-only", children: "Command palette" }),
        list
      ] })
    }
  );
}

export { AnnotationsCount, AnnotationsOverlay, AnnotationsViewPanel, BACKGROUND_FIELDS, BOARD_LAYOUT_COMMAND, BackgroundLayerEditorPanel, BoardContextMenus, BoardLayoutPopover, BrushSelectEditorPanel, BubbleSetsLayerEditorPanel, CARD_ROW_FIELDS, CARD_SCALAR_FIELDS, CARD_STYLING_FIELDS, COLOR_PRESETS, COLOR_ROLES, COLOR_ROLE_OPTIONS, CanvasControlsToolbar, CanvasFiltersViewPanel, CanvasSettingsEditorPanel, CanvasSnapshotsViewPanel, ChangesCount, ChangesViewPanel, ClearCanvasToolbar, ClickInspectEditorPanel, ClickSelectEditorPanel, ClickViewEditorPanel, CollapseExpandEditorPanel, ColorByEditorPanel, CommandPalette, CompositeNodeStyleEditorPanel, ContentLODEditorPanel, ContextMenuEditorPanel, ControlPanelsEditor, ControlPanelsEditorPanel, CreateNodeEditorPanel, D3ForceLayoutEditorPanel, D3HierarchyLayoutEditorPanel, D3SankeyLayoutEditorPanel, DAG_BOARD_CONFIG, DAG_LAYER, DAG_LAYOUT, DAG_TONES, DEFAULT_CANVAS_SETTINGS_SCHEMAS, DEFAULT_CONTROL_PRESETS, DagLegend, DensityContourFillLayerEditorPanel, DensityContourStrokeLayerEditorPanel, DevInfoLayerEditorPanel, DragNodeEditorPanel, DragPanEditorPanel, DragShapeEditorPanel, DrawEdgeEditorPanel, EdgeDetailView, EdgeLODEditorPanel, ContentLODEditorPanel as EdgeLabelLODEditorPanel, EdgePreviewCard, EdgeScaleLODEditorPanel, EditToolbar, ElkLayoutEditorPanel, EntranceEditorPanel, EraseEditorPanel, ExportViewPanel, FindInCanvasViewPanel, FisheyeEditorPanel, FocusEditorPanel, GRAPH_EXPAND_COMMAND, GeometricLayoutEditorPanel, GraphBackgroundContextMenu, GraphBoard, GraphContextMenu, GraphControlsToolbar, GraphControlsToolbarLite, GraphEdgeContextMenu, GraphLayoutToolbar, GraphLegendLayerEditorPanel, GraphNodeContextMenu, GraphToolbar, GridToolbar, HistoryToolbar, HistoryViewPanel, HoverActivateEditorPanel, HoverElementPreviewEditorPanel, HoverPreviewCardEditorPanel, ContentLODEditorPanel as IconLODEditorPanel, ContentLODEditorPanel as ImageLODEditorPanel, KeyboardCameraEditorPanel, KeyboardShortcutsEditorPanel, LABEL_FIELDS, LabelCollisionEditorPanel, LassoSelectEditorPanel, LayeredDagBoard, MapLayerEditorPanel, MiniMapLayerEditorPanel, ModellerToolbar, NO_ROLE, NodeCentralityEditorPanel, NodeDetailView, ContentLODEditorPanel as NodeLabelLODEditorPanel, NodePreviewCard, NodeResizeEditorPanel, NodeScaleLODEditorPanel, NodeStructureEditorPanel, NodeStyleEditorPanel, NodeStyleOverviewEditorPanel, NodeStylingEditorPanel, ParallelEdgeEditorPanel, PinchZoomEditorPanel, PlaybookPresenterBar, PlaybookViewPanel, SCHEMA_BOARD_CONFIG, SCHEMA_DETAIL, SCHEMA_FIELD_ROW, SCHEMA_FRAME_EMPTY_TYPE, SCHEMA_FRAME_TYPE, SCHEMA_LAYER, SCHEMA_METAGRAPH_LAYER_ID, SCHEMA_META_FIELDS, SCHEMA_TYPES, SCHEMA_TYPE_OPTIONS, SCHEMA_WILDCARD, SIMPLE_STYLING_FIELDS, SLOT_BINDING_FIELDS, SLOT_STYLING_FIELDS, STROKE_FIELDS, STYLING_SCALAR_FIELDS, SchemaBoard, SchemaEditorPanel, SchemaToolbar, SchemaViewPanel, SelectionViewPanel, SimpleNodeStyleEditorPanel, StylingViewPanel, TextResolutionLODEditorPanel, ThemeEditorPanel, ThemeToggle, UNSAVED_SAVE_COMMAND, ViewToolbar, WheelZoomEditorPanel, advancedCompositeScalarFields, advancedNodeStyleFields, asRole, backgroundLayerFields, formToOptions as backgroundLayerFormToOptions, optionsToForm as backgroundLayerOptionsToForm, basicCompositeFields, basicNodeStyleFields, bindingScalarFields, bindingToForm, bindingToLine, menuItems as boardMenuItems, brushSelectFields, formToOptions22 as brushSelectFormToOptions, optionsToForm22 as brushSelectOptionsToForm, bubbleSetsLayerFields, formToOptions7 as bubbleSetsLayerFormToOptions, optionsToForm7 as bubbleSetsLayerOptionsToForm, clickInspectFields, formToOptions18 as clickInspectFormToOptions, optionsToForm18 as clickInspectOptionsToForm, clickSelectFields, formToOptions17 as clickSelectFormToOptions, optionsToForm17 as clickSelectOptionsToForm, clickViewFields, formToOptions20 as clickViewFormToOptions, optionsToForm20 as clickViewOptionsToForm, collapseExpandFields, formToOptions28 as collapseExpandFormToOptions, optionsToForm28 as collapseExpandOptionsToForm, colorByFields, formToOptions29 as colorByFormToOptions, optionsToForm29 as colorByOptionsToForm, colorToForm, commandMenuItems, compositeScalarFields, compositeToForm, contentLODFields, formToOptions39 as contentLODFormToOptions, optionsToForm39 as contentLODOptionsToForm, contextMenuFields, formToOptions33 as contextMenuFormToOptions, optionsToForm33 as contextMenuOptionsToForm, createNodeFields, formToOptions24 as createNodeFormToOptions, optionsToForm24 as createNodeOptionsToForm, d3ForceLayoutFields, formToOptions42 as d3ForceLayoutFormToOptions, optionsToForm42 as d3ForceLayoutOptionsToForm, d3HierarchyLayoutFields, formToOptions44 as d3HierarchyLayoutFormToOptions, optionsToForm44 as d3HierarchyLayoutOptionsToForm, d3SankeyLayoutFields, formToOptions45 as d3SankeyLayoutFormToOptions, optionsToForm45 as d3SankeyLayoutOptionsToForm, dagEdgeStyle, dagNodeStyle, defaultBoardMenus, defaultBoardPanels, defaultShapeFor, densityContourFillLayerFields, formToOptions5 as densityContourFillLayerFormToOptions, optionsToForm5 as densityContourFillLayerOptionsToForm, densityContourStrokeLayerFields, formToOptions6 as densityContourStrokeLayerFormToOptions, optionsToForm6 as densityContourStrokeLayerOptionsToForm, detailConfig, devInfoLayerFields, formToOptions2 as devInfoLayerFormToOptions, optionsToForm2 as devInfoLayerOptionsToForm, dockCardClassName, dragNodeFields, formToOptions15 as dragNodeFormToOptions, optionsToForm15 as dragNodeOptionsToForm, dragPanFields, formToOptions9 as dragPanFormToOptions, optionsToForm9 as dragPanOptionsToForm, dragShapeFields, formToOptions14 as dragShapeFormToOptions, optionsToForm14 as dragShapeOptionsToForm, drawEdgeFields, formToOptions25 as drawEdgeFormToOptions, optionsToForm25 as drawEdgeOptionsToForm, edgeLODFields, formToOptions40 as edgeLODFormToOptions, optionsToForm40 as edgeLODOptionsToForm, edgeLabelLODFields, edgeScaleLodFields, formToOptions36 as edgeScaleLodFormToOptions, optionsToForm36 as edgeScaleLodOptionsToForm, elkLayoutFields, formToOptions43 as elkLayoutFormToOptions, optionsToForm43 as elkLayoutOptionsToForm, entranceFields, formToOptions38 as entranceFormToOptions, optionsToForm38 as entranceOptionsToForm, eraseFields, formToOptions26 as eraseFormToOptions, optionsToForm26 as eraseOptionsToForm, exportGraphData, fisheyeFields, formToOptions31 as fisheyeFormToOptions, optionsToForm31 as fisheyeOptionsToForm, focusFields, formToOptions19 as focusFormToOptions, optionsToForm19 as focusOptionsToForm, formToBinding, formToColor, formToComposite, formToPanel, formToSchema, formToSpec, formToStyle, formToStyling, geometricLayoutFields, formToOptions46 as geometricLayoutFormToOptions, optionsToForm46 as geometricLayoutOptionsToForm, geometryFields, graphLegendLayerFields, formToOptions4 as graphLegendLayerFormToOptions, optionsToForm4 as graphLegendLayerOptionsToForm, hexToNumber, hideType, hoverActivateFields, formToOptions16 as hoverActivateFormToOptions, optionsToForm16 as hoverActivateOptionsToForm, hoverElementPreviewFields, formToOptions21 as hoverElementPreviewFormToOptions, optionsToForm21 as hoverElementPreviewOptionsToForm, keyboardCameraFields, formToOptions11 as keyboardCameraFormToOptions, optionsToForm11 as keyboardCameraOptionsToForm, keyboardShortcutsFields, formToOptions12 as keyboardShortcutsFormToOptions, optionsToForm12 as keyboardShortcutsOptionsToForm, labelCollisionFields, formToOptions41 as labelCollisionFormToOptions, optionsToForm41 as labelCollisionOptionsToForm, labelLodFormToOptions as labelLODFormToOptions, labelLodOptionsToForm as labelLODOptionsToForm, lassoSelectFields, formToOptions23 as lassoSelectFormToOptions, optionsToForm23 as lassoSelectOptionsToForm, lineToBinding, mapLayerFields, formToOptions8 as mapLayerFormToOptions, optionsToForm8 as mapLayerOptionsToForm, miniMapLayerFields, formToOptions3 as miniMapLayerFormToOptions, optionsToForm3 as miniMapLayerOptionsToForm, modeFields2 as modeFields, newBoardElementId, nodeCentralityFields, formToOptions32 as nodeCentralityFormToOptions, optionsToForm32 as nodeCentralityOptionsToForm, nodeLabelLODFields, nodeResizeFields, formToOptions27 as nodeResizeFormToOptions, optionsToForm27 as nodeResizeOptionsToForm, nodeScaleLodFields, formToOptions35 as nodeScaleLodFormToOptions, optionsToForm35 as nodeScaleLodOptionsToForm, nodeStyleFields, nodeStyleOverviewFields, numberToHex, openBoardPanel, openElementEditor, panelToForm, parallelEdgeFields, formToOptions37 as parallelEdgeFormToOptions, optionsToForm37 as parallelEdgeOptionsToForm, partRowFields, pinchZoomFields, formToOptions10 as pinchZoomFormToOptions, optionsToForm10 as pinchZoomOptionsToForm, recolorNodeStyle, renderSchemaEdge, renderSchemaNode, roleField, rootFields, schemaToForm, schemaToMetaGraph, specToForm, styleToForm, stylingToForm, textResolutionLodFields, formToOptions34 as textResolutionLodFormToOptions, optionsToForm34 as textResolutionLodOptionsToForm, themeFields, formToOptions30 as themeFormToOptions, optionsToForm30 as themeOptionsToForm, typeColor, useCommandMenuItems, useDerivedSchema, useDetailTemplates, useSidePanels, wheelZoomFields, formToOptions13 as wheelZoomFormToOptions, optionsToForm13 as wheelZoomOptionsToForm };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map