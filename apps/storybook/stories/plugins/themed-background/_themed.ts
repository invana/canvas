/**
 * Shared theme presets for ThemedBackgroundPlugin stories.
 *
 * Each entry bundles a light + dark variant for the background plus matching
 * `GraphDataPlugin` styles so the canvas reads as one visual identity in
 * either kind.
 */
import { Canvas, ThemedBackgroundPlugin, type ThemedBackgroundTheme } from '@invana/canvas';
import { GraphDataPlugin, type IGraphStyles, type INodeData, type IEdgeData } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { generateRandomTree } from '@invana/plugin-example-datasets';

Canvas.registerPlugin('themed-background', ThemedBackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);
Canvas.registerPlugin('layout-d3-force', D3ForceLayoutPlugin);

const PATTERN_DEFAULTS = {
  type: 'pattern' as const,
  patternType: 'dots' as const,
  size: 1.5,
  spacing: 30,
  alpha: 0.6,
};

export const THEMED_BACKGROUNDS: ThemedBackgroundTheme[] = [
  {
    id: 'minimal',
    label: 'Minimal',
    light: { ...PATTERN_DEFAULTS, color: '#b0b0b0', backgroundColor: '#fafafa' },
    dark:  { ...PATTERN_DEFAULTS, color: '#595959', backgroundColor: '#212121' },
  },
  {
    id: 'paper',
    label: 'Paper',
    light: { ...PATTERN_DEFAULTS, color: '#d4c9a8', backgroundColor: '#f3eed1' },
    dark:  { ...PATTERN_DEFAULTS, color: '#6b5b3a', backgroundColor: '#2a241a' },
  },
  {
    id: 'blueprint',
    label: 'Blueprint',
    light: { ...PATTERN_DEFAULTS, patternType: 'grid', color: '#7da0d4', backgroundColor: '#dbe6f5', spacing: 25 },
    dark:  { ...PATTERN_DEFAULTS, patternType: 'grid', color: '#5273a5', backgroundColor: '#0b2f66', spacing: 25 },
  },
];

export const STYLES_BY_KIND: Record<'light' | 'dark', IGraphStyles> = {
  light: {
    node: { fill: '#5cd43e', stroke: '#333333', strokeWidth: 2 },
    edge: { stroke: '#666666', strokeWidth: 2 },
  },
  dark: {
    node: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
    edge: { stroke: '#58a6ff', strokeWidth: 2 },
  },
};

/** Tree-shaped graph (nodes + edges) wired for GraphDataPlugin consumption. */
export const buildTreeGraphData = (numNodes = 80): { nodes: INodeData[]; edges: IEdgeData[] } => {
  const raw = generateRandomTree(numNodes);
  const nodes: INodeData[] = raw.nodes.map(n => ({
    id:          String(n.index),
    label:       String(n.index),
    shape:       'circle' as const,
    size:        24,
    interactive: true,
    draggable:   true,
  }));
  const edges: IEdgeData[] = raw.edges.map((e, i) => ({
    id:       `e-${i}`,
    source:   String(e.source),
    target:   String(e.target),
    pathType: 'straight' as const,
  }));
  return { nodes, edges };
};
