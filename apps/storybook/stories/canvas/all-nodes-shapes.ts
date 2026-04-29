/**
 * All Node Shapes
 *
 * Exports `allNodeShapes` — low-level BaseShapeSpec entries, and
 * `allNodeShapeData` — INodeData entries for use with GraphDataPlugin.
 *
 * Grid layout: COLS columns, each cell spaced CELL_SIZE apart.
 * Shape types: circle, rect, ellipse, diamond, hexagon, polygon (triangle),
 *              polygon (pentagon), star
 */

import type { BaseShapeSpec } from '@invana/plugins-shapes';
import type { INodeData } from '@invana/plugins-graph-data';

// ── Grid settings ─────────────────────────────────────────────────────────────
const COLS      = 4;
const CELL_SIZE = 140;   // world-space distance between cell centres
const RADIUS    = 40;    // common radius for all shapes

/** Compute world-space (x, y) for the nth cell in the grid. */
function pos(n: number): { x: number; y: number } {
  const col = n % COLS;
  const row = Math.floor(n / COLS);
  return {
    x: (col - (COLS - 1) / 2) * CELL_SIZE,
    y: (row - 0.5) * CELL_SIZE,
  };
}

// ── Shared defaults ───────────────────────────────────────────────────────────
const DEFAULT_STYLE = {
  fill: '#3fcbeb',
  stroke: '#ffffff',
  strokeWidth: 2,
};

const STATE_STYLES = {
  hovered:  { strokeWidth: 3.5, fillAlpha: 0.9 },
  selected: { strokeWidth: 4, stroke: '#ffffff' },
};

// ── Shape definitions ─────────────────────────────────────────────────────────
export const allNodeShapes: Array<{ type: string; spec: BaseShapeSpec }> = [
  {
    type: 'circle',
    spec: {
      id: 'shape-circle',
      ...pos(0),
      radius: RADIUS,
      label: 'Circle',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number },
  },
  {
    type: 'ellipse',
    spec: {
      id: 'shape-ellipse',
      ...pos(1),
      radiusX: RADIUS * 1.4,
      radiusY: RADIUS * 0.7,
      label: 'Ellipse',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radiusX: number; radiusY: number },
  },
  {
    type: 'rect',
    spec: {
      id: 'shape-rect',
      x: pos(2).x - RADIUS,
      y: pos(2).y - RADIUS * 0.7,
      width: RADIUS * 2,
      height: RADIUS * 1.4,
      cornerRadius: 0,
      label: 'Rect',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { width: number; height: number; cornerRadius: number },
  },
  {
    type: 'rect',
    spec: {
      id: 'shape-rounded-rect',
      x: pos(3).x - RADIUS,
      y: pos(3).y - RADIUS * 0.7,
      width: RADIUS * 2,
      height: RADIUS * 1.4,
      cornerRadius: 14,
      label: 'Rounded Rect',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { width: number; height: number; cornerRadius: number },
  },
  {
    type: 'diamond',
    spec: {
      id: 'shape-diamond',
      ...pos(4),
      radius: RADIUS,
      label: 'Diamond',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number },
  },
  {
    type: 'hexagon',
    spec: {
      id: 'shape-hexagon',
      ...pos(5),
      radius: RADIUS,
      label: 'Hexagon',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number },
  },
  {
    type: 'polygon',
    spec: {
      id: 'shape-triangle',
      ...pos(6),
      radius: RADIUS,
      sides: 3,
      label: 'Triangle',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number; sides: number },
  },
  {
    type: 'polygon',
    spec: {
      id: 'shape-pentagon',
      ...pos(7),
      radius: RADIUS,
      sides: 5,
      label: 'Pentagon',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number; sides: number },
  },
  {
    type: 'star',
    spec: {
      id: 'shape-star5',
      ...pos(8),
      radius: RADIUS,
      points: 5,
      label: 'Star (5pt)',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number; points: number },
  },
  {
    type: 'star',
    spec: {
      id: 'shape-star6',
      ...pos(9),
      radius: RADIUS,
      points: 6,
      label: 'Star (6pt)',
      style: DEFAULT_STYLE,
      states: STATE_STYLES,
      interactive: true,
    } as BaseShapeSpec & { radius: number; points: number },
  },
];

// ── INodeData variant for GraphDataPlugin ─────────────────────────────────────
export const allNodeShapeData: INodeData[] = [
  { id: 'shape-circle',       ...pos(0), shape: 'circle',  size: RADIUS * 2,   label: 'Circle'       },
  { id: 'shape-ellipse',      ...pos(1), shape: 'ellipse', size: RADIUS * 2,   label: 'Ellipse'      },
  { id: 'shape-rect',         ...pos(2), shape: 'rect',    size: RADIUS * 2,   label: 'Rect'         },
  { id: 'shape-rounded-rect', ...pos(3), shape: 'rect',    size: RADIUS * 2,   label: 'Rounded Rect' },
  { id: 'shape-diamond',      ...pos(4), shape: 'diamond', size: RADIUS * 2,   label: 'Diamond'      },
  { id: 'shape-hexagon',      ...pos(5), shape: 'hexagon', size: RADIUS * 2,   label: 'Hexagon'      },
  { id: 'shape-triangle',     ...pos(6), shape: 'polygon', size: RADIUS * 2,   label: 'Triangle'     },
  { id: 'shape-pentagon',     ...pos(7), shape: 'polygon', size: RADIUS * 2,   label: 'Pentagon'     },
  { id: 'shape-star5',        ...pos(8), shape: 'star',    size: RADIUS * 2,   label: 'Star (5pt)'   },
  { id: 'shape-star6',        ...pos(9), shape: 'star',    size: RADIUS * 2,   label: 'Star (6pt)'   },
];
