/**
 * The DAG board's presets — the config `<LayeredDagBoard>` mounts on and the
 * tone styles it draws with when a host brings no config of its own.
 *
 * | Element | Drawn from | As |
 * |---|---|---|
 * | node | `data.tone` · `data.disabled` · `data.text` | a dot in its tone's colour, the text below; disabled is hollow, faded and dashed |
 * | edge | `data.highlight` · `data.dashed` · `data.label` | a line with an arrow; a highlight in the `info` tone, a dashed one on the far side of its label |
 *
 * Tones are colours, not theme roles, on purpose: "green means it served"
 * should not turn blue under another theme.
 */

import type { CanvasConfig } from '@invana/canvas';
import type { GraphEdge, GraphNode, ResolvableEdgeStyle, ResolvableNodeStyle } from '@invana/graph';

/** The layer id the board draws on. */
export const DAG_LAYER = 'graph';
/** The layout id the board runs. */
export const DAG_LAYOUT = 'elk';

/** A tone's colour, by name. */
export type DagTones = Readonly<Record<string, number>>;

/** The status tones the board ships. */
export const DAG_TONES: DagTones = {
  muted: 0x646b73,
  queued: 0x646b73,
  info: 0x2bab5a,
  running: 0x2bab5a,
  success: 0x10b981,
  warning: 0xf59e0b,
  error: 0xef4444,
};

/** What a node's `data` holds on the default config. */
export interface DagNodeData {
  /** The label under the dot; a `\n` starts its second line. */
  text: string;
  /** A key of the board's tones. Default `muted`. */
  tone?: string;
  /** Drawn hollow, faded and dashed — a step that is not allowed. */
  disabled?: boolean;
  /** The column the node is seeded in before any layout. */
  column?: number;
}

/** What an edge's `data` holds on the default config. */
export interface DagEdgeData {
  label?: string;
  /** Dashed — something other than plain order. */
  dashed?: boolean;
  /** The one thing drawn in the `info` tone — a critical path. */
  highlight?: boolean;
}

const NODE_RADIUS = 13;
const LABEL_COLOUR = 0x9199a1;
const EDGE_COLOUR = 0x646b73;
const STROKE = 0x181a1b;

const nodeData = (n: GraphNode) => (n.data ?? {}) as unknown as DagNodeData;
const edgeData = (e: GraphEdge) => (e.data ?? {}) as unknown as DagEdgeData;

/** The node style the default config draws with, in `tones`. */
export function dagNodeStyle(tones: DagTones): ResolvableNodeStyle<GraphNode> {
  const fill = (n: GraphNode) => tones[nodeData(n).tone ?? 'muted'] ?? tones.muted ?? EDGE_COLOUR;
  return {
    shape: { kind: 'circle', radius: NODE_RADIUS },
    bgFill: fill,
    bgAlpha: (n: GraphNode) => (nodeData(n).disabled ? 0.25 : 1),
    bgStrokeWidth: 2,
    bgStrokeColor: (n: GraphNode) => (nodeData(n).disabled ? fill(n) : STROKE),
    bgStrokeDashArray: (n: GraphNode) => (nodeData(n).disabled ? ([3, 3] as const) : ([0, 0] as const)),
    labelText: (n: GraphNode) => String(nodeData(n).text ?? n.id),
    labelColor: LABEL_COLOUR,
    labelFontSize: 12,
    labelPlacement: 'bottom',
    labelOffsetY: 5,
    labelLineHeight: 14,
  };
}

/** The edge style the default config draws with, in `tones`. */
export function dagEdgeStyle(tones: DagTones): ResolvableEdgeStyle<GraphEdge> {
  const colour = (e: GraphEdge) => (edgeData(e).highlight ? (tones.info ?? EDGE_COLOUR) : EDGE_COLOUR);
  return {
    strokeColor: colour,
    strokeWidth: (e: GraphEdge) => (edgeData(e).highlight ? 2.5 : 1.5),
    strokeDashArray: (e: GraphEdge) => (edgeData(e).dashed ? ([4, 3] as const) : ([0, 0] as const)),
    arrowTargetShape: 'triangle',
    arrowTargetSize: 7,
    arrowTargetColor: colour,
    labelText: (e: GraphEdge) => String(edgeData(e).label ?? ''),
    labelColor: LABEL_COLOUR,
    labelFontSize: 10,
    // A dashed edge often runs past the node between its ends; its label sits on the other side.
    labelOffsetY: (e: GraphEdge) => (edgeData(e).dashed ? 9 : -9),
  };
}

/** The config `<LayeredDagBoard>` mounts on: ELK layered, left to right, spaced for a two-line label. */
export const DAG_BOARD_CONFIG = {
  activeLayout: DAG_LAYOUT,
  fitOnLoad: false,
  layers: {
    background: { type: 'pattern', patternType: 'dots', alpha: 0.4 },
  },
  layouts: {
    [DAG_LAYOUT]: { algorithm: 'layered', direction: 'RIGHT', nodeSpacing: 76, layerSpacing: 150 },
  },
  behaviours: {
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    'click-select': { enabled: true },
    'label-resolution': { enabled: true },
  },
} as unknown as CanvasConfig;
