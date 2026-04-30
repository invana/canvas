/**
 * Edge Stroke Styles
 *
 * All six built-in edge path types rendered between node pairs, with a lil-gui
 * panel to tweak stroke properties in real time via GraphDataPlugin.setStyles.
 *
 * Controls:
 *   - Stroke colour
 *   - Stroke width
 *   - Stroke alpha
 *   - Stroke cap (butt / round / square)
 *   - Stroke join (miter / round / bevel)
 *   - Stroke alignment (0 = inner … 1 = outer)
 *   - Stroke miter limit
 *
 * API used:
 *   GraphDataPlugin.setStyles({ edge: { … } })
 */
import type { Meta, StoryObj } from '@storybook/html-vite';
import GUI from 'lil-gui';
import { Canvas, BackgroundPlugin } from '@invana/canvas';
import { GraphDataPlugin, type IEdgeData, type INodeData } from '@invana/plugins-graph-data';
import { createContainer } from '../../../../src/div-utils.js';

Canvas.registerPlugin('background', BackgroundPlugin);
Canvas.registerPlugin('graph-data', GraphDataPlugin);

const meta: Meta = { title: 'Canvas/Edges/Styling/Stroke' };
export default meta;
type Story = StoryObj;

const COL_GAP = 340;
const ROW_GAP = 130;

interface RowDef {
  id:       string;
  pathType: string;
  label:    string;
  color:    string;
  dy?:      number;
  router?:  string;
}

const ROWS: RowDef[] = [
  { id: 'straight',   pathType: 'straight',   label: 'straight',             color: '#4fc3f7' },
  { id: 'bezier',     pathType: 'bezier',     label: 'bezier',               color: '#81c784' },
  { id: 'orthogonal', pathType: 'orthogonal', label: 'orthogonal',           color: '#ffb74d', dy: 60 },
  { id: 'quadratic',  pathType: 'quadratic',  label: 'quadratic',            color: '#f06292' },
  { id: 'rounded',    pathType: 'rounded',    label: 'rounded + orth router', color: '#ce93d8', dy: 60, router: 'orth' },
  { id: 'smooth',     pathType: 'smooth',     label: 'smooth (Catmull-Rom)', color: '#4dd0e1' },
];

const startY = -((ROWS.length - 1) * ROW_GAP) / 2;

const nodes: INodeData[] = [];
const edges: IEdgeData[] = [];

ROWS.forEach((row, i) => {
  const rowY = startY + i * ROW_GAP;
  const dy   = row.dy ?? 0;
  const lx   = -COL_GAP / 2;
  const rx   =  COL_GAP / 2;

  nodes.push({ id: `${row.id}-l`, x: lx,  y: rowY,      shape: 'circle', size: 40 });
  nodes.push({ id: `${row.id}-r`, x: rx,  y: rowY + dy, shape: 'circle', size: 40 });

  const edge: IEdgeData = {
    id:        `${row.id}-edge`,
    source:    `${row.id}-l`,
    target:    `${row.id}-r`,
    pathType:  row.pathType as IEdgeData['pathType'],
    label:     row.label,
    endMarker: { type: 'triangle', size: 11 },
    style:     { stroke: row.color, strokeWidth: 3 },
  };
  if (row.router) edge.router = row.router as IEdgeData['router'];
  edges.push(edge);
});

export const EdgeStroke: Story = {
  name: 'Stroke',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const params = {
      stroke:           '#f97316',
      strokeWidth:      3,
      strokeAlpha:      1,
      strokeCap:        'round' as 'butt' | 'round' | 'square',
      strokeJoin:       'miter' as 'miter' | 'round' | 'bevel',
      strokeAlignment:  0.5,
      strokeMiterLimit: 10,
    };

    const canvas = new Canvas({
      container,
      backgroundColor: '#0f172a',
      plugins: [
        {
          plugin: 'background',
          key: 'bg',
          options: {
            type: 'pattern',
            patternType: 'grid',
            color: '#1e293b',
            backgroundColor: '#0f172a',
            size: 1,
            spacing: 40,
          },
        },
        {
          plugin: 'graph-data',
          key: 'graph',
          options: {
            fitOnRender: true,
            fitPadding: 80,
            data: { nodes, edges },
            styles: {
              node: { fill: '#1e293b', stroke: '#475569', strokeWidth: 1.5 },
              edge: { ...params}
            },
          },
        },
      ],
    });
    await canvas.init();

    const graph = canvas.plugins.get<GraphDataPlugin>('graph')!;
    const applyStyles = () => graph.setStyles({ edge: { ...params } });

    // ── lil-gui panel ───────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Edge Stroke Styles', container });
    gui.domElement.style.cssText = 'position:absolute;top:10px;right:10px;z-index:100;width:220px;';

    gui.addColor(params, 'stroke').name('Stroke colour').onChange(applyStyles);
    gui.add(params, 'strokeWidth', 0, 10, 0.5).name('Stroke width').onChange(applyStyles);
    gui.add(params, 'strokeAlpha', 0, 1, 0.05).name('Stroke alpha').onChange(applyStyles);
    gui.add(params, 'strokeCap',  ['butt', 'round', 'square']).name('Stroke cap').onChange(applyStyles);
    gui.add(params, 'strokeJoin', ['miter', 'round', 'bevel']).name('Stroke join').onChange(applyStyles);
    gui.add(params, 'strokeAlignment', 0, 1, 0.05).name('Stroke alignment').onChange(applyStyles);
    gui.add(params, 'strokeMiterLimit', 0, 30, 1).name('Stroke miter limit').onChange(applyStyles);

    gui.add({
      reset: () => {
        params.stroke           = '#f97316';
        params.strokeWidth      = 3;
        params.strokeAlpha      = 1;
        params.strokeCap        = 'round';
        params.strokeJoin       = 'miter';
        params.strokeAlignment  = 0.5;
        params.strokeMiterLimit = 10;
        gui.controllers.forEach(c => c.updateDisplay());
        applyStyles();
      },
    }, 'reset').name('Reset');
  },
};
