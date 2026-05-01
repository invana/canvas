/**
 * Shared theme presets and renderer for background theming stories.
 *
 * Each preset bundles a `BackgroundPlugin` configuration with matching
 * `GraphDataPlugin` styles so the canvas reads as one visual identity.
 *
 * Graph data: random tree from `generateRandomTree`, laid out with
 * `D3ForceLayoutPlugin`.
 */
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, type IGraphStyles, type INodeData, type IEdgeData } from '@invana/plugins-graph-data';
import { D3ForceLayoutPlugin } from '@invana/plugin-layouts-d3-force';
import { generateRandomTree } from '@invana/plugin-example-datasets';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);
Canvas.registerPlugin('layout-d3-force', D3ForceLayoutPlugin);

export type Theme = {
  name: string;
  canvasBackground: string;
  background: Record<string, unknown>;
  styles: IGraphStyles;
};

export const THEMES = {
  blueprint: {
    name: 'Blueprint',
    canvasBackground: '#0b2f66',
    background: {
      type: 'pattern',
      patternType: 'grid',
      color: '#5273a5',
      backgroundColor: '#0b2f66',
      size: 1,
      spacing: 25,
      alpha: 0.8,
      followCamera: true,
    },
    styles: {
      node: { fill: '#58a6ff', stroke: '#ffffff', strokeWidth: 2 },
      edge: { stroke: '#58a6ff', strokeWidth: 2 },
    },
  },
  light: {
    name: 'Minimal Light',
    canvasBackground: '#fafafa',
    background: {
      type: 'pattern',
      patternType: 'dots',
      color: '#b0b0b0',
      backgroundColor: '#fafafa',
      size: 1.5,
      spacing: 30,
      alpha: 0.6,
    },
    styles: {
      node: { fill: '#5cd43e', stroke: '#333333', strokeWidth: 2 },
      edge: { stroke: '#666666', strokeWidth: 2 },
    },
  },
  dark: {
    name: 'Dark',
    canvasBackground: '#212121',
    background: {
      type: 'pattern',
      patternType: 'dots',
      color: '#595959',
      backgroundColor: '#212121',
      size: 1.5,
      spacing: 30,
      alpha: 0.6,
    },
    styles: {
      node: { fill: '#3fcbeb', stroke: '#ffffff', strokeWidth: 2 },
      edge: { stroke: '#58a6ff', strokeWidth: 2 },
    },
  },
} satisfies Record<string, Theme>;

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

/**
 * Render a static, single-theme canvas into the standard story container with
 * a random tree dataset positioned by D3 force layout.
 */
export const renderThemedTree = async (theme: Theme): Promise<void> => {
  const container = document.getElementById('canvas-example');
  if (!container) return;

  const canvas = new Canvas({
    container,
    backgroundColor: theme.canvasBackground,
    plugins: [
      { plugin: 'background', key: 'bg', options: theme.background },
      {
        plugin: 'graph-data',
        key: 'graph-data',
        options: { styles: theme.styles },
      },
      {
        plugin: 'layout-d3-force',
        options: { charge: -250, linkDistance: 60, animate: true },
      },
    ],
  });
  await canvas.init();

  const graph = canvas.plugins.get<GraphDataPlugin>('graph-data')!;
  const layout = canvas.plugins.get<D3ForceLayoutPlugin>('layout-d3-force')!;

  graph.setData(buildTreeGraphData());
  await layout.start();

  setTimeout(() => graph.fitContent(60), 1500);
};
