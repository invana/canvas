/**
 * The board's presets — its modes, rows, dock and config — as data.
 *
 * `GraphBoard` composes them; a host that builds its own board from the
 * pieces (`BoardModes`, `ControlPanel`, `BoardPanels`, …) reuses them so the
 * two read the same. Everything here is serialisable except the resolvers in
 * {@link boardConfig}, which are what a config may carry.
 *
 * | Region | Preset |
 * |---|---|
 * | modes | {@link BOARD_MODES} — Explore · Edit · Annotate work; Focus · Present view |
 * | top-left, working | {@link BOARD_ROW_ITEMS} — the picker, Select ▾, Edit's and Annotate's tools, undo · redo · redraw |
 * | top-left, viewing | {@link BOARD_VIEW_ROW_ITEMS} — the picker; in Present, the stepper |
 * | bottom-left | {@link BOARD_DOCK_ITEMS} under the minimap — zoom, fit, lock |
 */

import type { CanvasConfig, ControlItemSpec } from '@invana/canvas';
import type { BoardModeSpec } from '@invana/canvas-react';
import {
  DEFAULT_LAYOUT_PRESETS,
  type GraphEdge,
  type GraphNode,
  readableLabel,
  remapLayoutPresets,
} from '@invana/graph';

/** Explore · Edit · Annotate are work modes; Focus and Present are view modes. */
export const BOARD_MODES: readonly BoardModeSpec[] = [
  { id: 'explore', label: 'Explore', icon: 'compass', description: 'Look, ask and expand' },
  { id: 'edit', label: 'Edit', icon: 'pencil', description: 'Add, change and delete data' },
  { id: 'annotate', label: 'Annotate', icon: 'sticky-note', description: 'Notes and shapes over the graph' },
  {
    id: 'focus',
    label: 'Focus',
    icon: 'scan-eye',
    description: 'Just the graph — no tools',
    group: 'view',
    shortcut: { key: '\\', mod: true },
  },
  { id: 'present', label: 'Present', icon: 'presentation', description: 'Walk through the answers', group: 'view' },
];
/** The modes with tools: the rail, the row and the dock show in these. */
export const WORK_MODES: readonly string[] = ['explore', 'edit', 'annotate'];
/** The modes that yield the board to the drawing. */
export const VIEW_MODES: readonly string[] = ['focus', 'present'];

/** The board's edge margin and its view dock: the minimap over a bar, one width. */
export const BOARD_EDGE = 12;
export const BOARD_DOCK = { width: 200, minimapHeight: 116, barHeight: 32 } as const;

/** Ids the board registers its pieces under — config and commands key on them. */
export const BOARD_IDS = {
  graph: 'graph',
  background: 'background',
  layout: 'board-force',
  elk: 'elk',
  minimap: 'minimap',
  sizeByConnections: 'size-by-connections',
  edgeThin: 'edge-thin',
  clickSelect: 'click-select',
  clickInspect: 'click-inspect',
} as const;

/** The command Annotate's tools run — registered disabled by `GraphBoard`. */
export const ANNOTATE_TOOL_COMMAND = 'annotate.tool';

/** Annotate's tools — drawn so the mode reads whole; disabled until a layer draws them. */
export const ANNOTATE_TOOLS: readonly ControlItemSpec[] = (
  [
    ['note', 'sticky-note', 'Note (S)'],
    ['shape', 'shape', 'Shape (R)'],
    ['arrow', 'arrow', 'Arrow (A)'],
    ['text', 'text', 'Text (T)'],
    ['highlight', 'highlight', 'Highlight (H)'],
  ] as const
).map(([key, icon, label]) => ({
  type: 'command' as const,
  key,
  command: ANNOTATE_TOOL_COMMAND,
  icon,
  label: `${label} — not built yet`,
  modes: ['annotate'],
}));

/** The row while working: the picker, then the mode's tools. */
export const BOARD_ROW_ITEMS: readonly ControlItemSpec[] = [
  { type: 'widget', widget: 'board-mode' },
  { type: 'divider' },
  {
    type: 'choice',
    key: 'select-mode',
    command: 'select.mode',
    label: 'Select',
    display: 'dropdown',
    options: [
      { value: 'click', label: 'Select', icon: 'pointer' },
      { value: 'lasso', label: 'Lasso select', icon: 'lasso' },
      { value: 'brush', label: 'Box select', icon: 'select-box' },
    ],
  },
  { type: 'divider', modes: ['edit', 'annotate'] },
  { type: 'toggle', key: 'add', command: 'tool.active', args: { value: 'add' }, icon: 'node-add', label: 'Add node (N)', modes: ['edit'] },
  { type: 'toggle', key: 'connect', command: 'tool.active', args: { value: 'connect' }, icon: 'connect', label: 'Connect (C)', modes: ['edit'] },
  ...ANNOTATE_TOOLS,
  { type: 'divider', modes: ['edit', 'annotate'] },
  { type: 'command', key: 'undo', command: 'history.undo', icon: 'undo', label: 'Undo (⌘Z)', modes: ['edit', 'annotate'] },
  { type: 'command', key: 'redo', command: 'history.redo', icon: 'redo', label: 'Redo (⇧⌘Z)', modes: ['edit', 'annotate'] },
  { type: 'command', key: 'redraw', command: 'graph.redraw', icon: 'refresh', label: 'Redraw', modes: ['edit', 'annotate'] },
];

/** The row while viewing: the picker alone (Focus), or with the stepper (Present). */
export const BOARD_VIEW_ROW_ITEMS: readonly ControlItemSpec[] = [
  { type: 'widget', widget: 'board-mode' },
  { type: 'divider', modes: ['present'] },
  { type: 'widget', widget: 'playbook-stepper', modes: ['present'] },
];

/** The view dock's bar, under the minimap. */
export const BOARD_DOCK_ITEMS: readonly ControlItemSpec[] = [
  { type: 'widget', widget: 'zoom-field' },
  { type: 'command', key: 'fit', command: 'camera.fit', icon: 'fit', label: 'Fit to screen (⇧1)' },
  {
    type: 'toggle',
    key: 'lock',
    command: 'view.lock',
    icon: 'lock-open',
    activeIcon: 'lock',
    label: 'Lock the view',
    activeLabel: 'Unlock the view',
  },
];

/** Network · Tree · Flow · Radial — Network on the board's own force layout. */
export const BOARD_LAYOUT_PRESETS = remapLayoutPresets(DEFAULT_LAYOUT_PRESETS, {
  network: BOARD_IDS.layout,
});

/** A node's drawn radius when nothing sizes it, and the clear space kept round it for its label. */
const NODE_RADIUS = 8;
const NODE_GAP = 22;

/** Size by connections: a leaf at the default size, the best-connected node at 28. */
export const BOARD_CENTRALITY = { minSize: NODE_RADIUS, maxSize: 28 } as const;

/**
 * The board's config — keyed by {@link BOARD_IDS}, deep-merged under a host's.
 *
 * The force is tuned for hub-and-spoke results linked into a larger graph:
 * `charge.distanceMax` caps repulsion to a local radius so distant clusters are
 * not shoved to opposite corners; `collide.radius` is each node's drawn size
 * plus room for its label, so a hub sized by its connections keeps clear
 * space; `alphaDecay` / `alphaMin` give ~150 ticks, enough to pull ~1,000 nodes
 * apart. `animate: false` solves off-screen and draws once, settled.
 *
 * Colour, label and edge colour are resolvers over `colorFor` — the host's type
 * palette — and {@link readableLabel}; the Styling panel's per-type choices sit
 * over them.
 */
export function boardConfig(colorFor: (type: string, kind: 'node' | 'edge') => number | undefined): CanvasConfig {
  const edgeColor = (e: GraphEdge) => colorFor(String(e.type ?? ''), 'edge');
  return {
    activeLayout: BOARD_IDS.layout,
    layers: {
      [BOARD_IDS.background]: { type: 'pattern', patternType: 'dots', alpha: 0.5 },
      [BOARD_IDS.graph]: {
        node: {
          style: {
            shape: { kind: 'circle', radius: NODE_RADIUS },
            bgStrokeWidth: 1.5,
            labelFontSize: 11,
            labelPlacement: 'bottom',
            labelOffsetY: 4,
            bgFill: (n: GraphNode) => colorFor(String(n.type ?? ''), 'node'),
            labelText: (n: GraphNode) => readableLabel(n),
          },
        },
        edge: {
          style: {
            strokeWidth: 1,
            arrowTargetShape: 'none',
            strokeColor: edgeColor,
            arrowTargetColor: edgeColor,
          },
        },
      },
    },
    layouts: {
      [BOARD_IDS.layout]: {
        animate: false,
        charge: { strength: -600, distanceMax: 600 },
        link: { distance: 150 },
        center: { x: 0, y: 0 },
        collide: {
          radius: (node: GraphNode) => ((node.style as { size?: number } | undefined)?.size ?? NODE_RADIUS) + NODE_GAP,
          iterations: 2,
        },
        alphaDecay: 0.035,
        alphaMin: 0.005,
        velocityDecay: 0.5,
      },
    },
    behaviours: {
      pan: { enabled: true },
      'drag-node': { enabled: true },
      wheel: { enabled: true },
      pinch: { enabled: true },
      hover: { enabled: true },
      [BOARD_IDS.clickSelect]: { enabled: true },
      'brush-select': { enabled: false },
      'lasso-select': { enabled: false },
      'click-view': { enabled: true },
      'label-lod': { enabled: true },
    },
  } as CanvasConfig;
}
