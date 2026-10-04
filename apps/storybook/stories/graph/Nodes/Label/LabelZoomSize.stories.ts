import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  EdgeLabelLODBehaviour,
  GraphCanvas,
  GraphLayer,
  LabelCollisionBehaviour,
  NodeLabelLODBehaviour,
  NodeScaleLODBehaviour,
  ThemeBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/LabelZoomSize' };
export default meta;
type Story = StoryObj;

/**
 * Node and edge labels each get their own zoom LOD — **when** they show (a zoom
 * band) and **how big** they read on screen — tuned separately.
 *
 * - **Node labels** (`NodeLabelLODBehaviour`) start at `minFontPx 9` / `maxFontPx 16`:
 *   zoom into a cluster and the names stop ballooning; zoom out and they stay
 *   readable instead of shrinking to specks.
 * - **Edge labels** (`EdgeLabelLODBehaviour`) appear from zoom `1.2` and then hold a
 *   fixed on-screen size (`zoomGrowth 0`).
 * - **Label collision** on top: with labels that grow slower than the graph,
 *   zooming in spreads them apart, so more labels survive the overlap pass.
 * - **Node size LOD** (off by default) pins node bodies to a constant screen
 *   size; turn it on to see label sizing compose with it.
 *
 * Every GUI change goes through `canvas.update({ behaviours: … })` — the same
 * path the settings editor uses. A size field at `0` means "unset".
 *
 * See `docs/rfcs/feat/2026-10-04-labels-balloon-on-zoom-and-edge-labels-have-no-lod.md`.
 */
export const LabelZoomSizeStory: Story = {
  name: 'LabelZoomSize',
  render: () => createContainer({ id: 'graph-label-zoom-size' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node', id: 'eng',      position: { x: -260, y: -40 }, style: { shape: { kind: 'circle', radius: 20 }, labelText: 'Engineering' } },
      { type: 'node', id: 'ada',      position: { x: -340, y: -120 }, style: { labelText: 'Ada Lovelace · Staff Engineer' } },
      { type: 'node', id: 'alan',     position: { x: -180, y: -120 }, style: { labelText: 'Alan Turing · Principal Engineer' } },
      { type: 'node', id: 'grace',    position: { x: -350, y: 40 },   style: { labelText: 'Grace Hopper · Compiler Lead' } },
      { type: 'node', id: 'linus',    position: { x: -170, y: 40 },   style: { labelText: 'Linus Torvalds · Kernel Engineer' } },
      { type: 'node', id: 'design',   position: { x: 260, y: -40 },  style: { shape: { kind: 'circle', radius: 20 }, labelText: 'Design' } },
      { type: 'node', id: 'dieter',   position: { x: 180, y: -120 }, style: { labelText: 'Dieter Rams · Industrial Design' } },
      { type: 'node', id: 'susan',    position: { x: 340, y: -120 }, style: { labelText: 'Susan Kare · Icon Designer' } },
      { type: 'node', id: 'paula',    position: { x: 170, y: 40 },   style: { labelText: 'Paula Scher · Brand Identity' } },
      { type: 'node', id: 'massimo',  position: { x: 350, y: 40 },   style: { labelText: 'Massimo Vignelli · Wayfinding' } },
      { type: 'node', id: 'ops',      position: { x: 0, y: 200 },    style: { shape: { kind: 'circle', radius: 20 }, labelText: 'Operations' } },
      { type: 'node', id: 'margaret', position: { x: -90, y: 280 },  style: { labelText: 'Margaret Hamilton · Reliability' } },
      { type: 'node', id: 'werner',   position: { x: 90, y: 280 },   style: { labelText: 'Werner Vogels · Infrastructure' } },
      { type: 'node', id: 'radia',    position: { x: -100, y: 130 }, style: { labelText: 'Radia Perlman · Networking' } },
      { type: 'node', id: 'vint',     position: { x: 100, y: 130 },  style: { labelText: 'Vint Cerf · Protocols' } }
    ];
    const edges: GraphEdge[] = [
      { type: 'edge', id: 'eng-ada',         source: 'eng',    target: 'ada',      style: { labelText: 'leads' } },
      { type: 'edge', id: 'eng-alan',        source: 'eng',    target: 'alan',     style: { labelText: 'leads' } },
      { type: 'edge', id: 'eng-grace',       source: 'eng',    target: 'grace',    style: { labelText: 'mentors' } },
      { type: 'edge', id: 'eng-linus',       source: 'eng',    target: 'linus',    style: { labelText: 'mentors' } },
      { type: 'edge', id: 'design-dieter',   source: 'design', target: 'dieter',   style: { labelText: 'leads' } },
      { type: 'edge', id: 'design-susan',    source: 'design', target: 'susan',    style: { labelText: 'leads' } },
      { type: 'edge', id: 'design-paula',    source: 'design', target: 'paula',    style: { labelText: 'mentors' } },
      { type: 'edge', id: 'design-massimo',  source: 'design', target: 'massimo',  style: { labelText: 'mentors' } },
      { type: 'edge', id: 'ops-margaret',    source: 'ops',    target: 'margaret', style: { labelText: 'on call' } },
      { type: 'edge', id: 'ops-werner',      source: 'ops',    target: 'werner',   style: { labelText: 'on call' } },
      { type: 'edge', id: 'ops-radia',       source: 'ops',    target: 'radia',    style: { labelText: 'escalates to' } },
      { type: 'edge', id: 'ops-vint',        source: 'ops',    target: 'vint',     style: { labelText: 'escalates to' } },
      { type: 'edge', id: 'eng-design',      source: 'eng',    target: 'design',   style: { labelText: 'pairs with' } },
      { type: 'edge', id: 'eng-ops',         source: 'eng',    target: 'ops',      style: { labelText: 'ships to' } },
      { type: 'edge', id: 'design-ops',      source: 'design', target: 'ops',      style: { labelText: 'reviews' } }
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-zoom-size')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new NodeLabelLODBehaviour({ id: 'node-labels', targetLayerId: 'graph' }));
    canvas.behaviours.register(new EdgeLabelLODBehaviour({ id: 'edge-labels', targetLayerId: 'graph' }));
    canvas.behaviours.register(new LabelCollisionBehaviour({ id: 'label-collision', targetLayerId: 'graph' }));
    canvas.behaviours.register(
      new NodeScaleLODBehaviour({ id: 'node-size', layers: [{ targetLayerId: 'graph', preserveRelativeSize: true }] })
    );

    const settings = {
      nodeEnabled: true,
      nodeMinZoom: 0,
      nodeAlwaysShowTop: 0,
      nodeGrowthOn: false,
      nodeGrowth: 0.5,
      nodeMinFontPx: 9,
      nodeMaxFontPx: 16,
      edgeEnabled: true,
      edgeMinZoom: 1.2,
      edgeGrowthOn: true,
      edgeGrowth: 0,
      edgeMinFontPx: 0,
      edgeMaxFontPx: 0,
      collision: true,
      nodeSizeLOD: false
    };

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 12 },
              // Fill is outside the theme's role map — the one colour authored here.
              bgFill: 0x4f9cf9,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelPlacement: 'bottom',
              labelOffsetY: 4
            }
          },
          edge: { style: { labelFontSize: 10 } }
        }
      },
      behaviours: {
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true },
        'node-labels': { enabled: settings.nodeEnabled, minFontPx: settings.nodeMinFontPx, maxFontPx: settings.nodeMaxFontPx },
        'edge-labels': { enabled: settings.edgeEnabled, minZoom: settings.edgeMinZoom, zoomGrowth: settings.edgeGrowth },
        'label-collision': { enabled: settings.collision, prioritise: 'node-degree' },
        'node-size': { enabled: settings.nodeSizeLOD }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    // `0` in a size field means "unset" — the behaviour leaves that bound alone.
    const orUnset = (v: number): number | undefined => (v > 0 ? v : undefined);
    const apply = (): void => {
      canvas.update({
        behaviours: {
          'node-labels': {
            enabled: settings.nodeEnabled,
            minZoom: orUnset(settings.nodeMinZoom),
            alwaysShowTop: settings.nodeAlwaysShowTop,
            zoomGrowth: settings.nodeGrowthOn ? settings.nodeGrowth : undefined,
            minFontPx: orUnset(settings.nodeMinFontPx),
            maxFontPx: orUnset(settings.nodeMaxFontPx)
          },
          'edge-labels': {
            enabled: settings.edgeEnabled,
            minZoom: orUnset(settings.edgeMinZoom),
            zoomGrowth: settings.edgeGrowthOn ? settings.edgeGrowth : undefined,
            minFontPx: orUnset(settings.edgeMinFontPx),
            maxFontPx: orUnset(settings.edgeMaxFontPx)
          },
          'label-collision': { enabled: settings.collision },
          'node-size': { enabled: settings.nodeSizeLOD }
        }
      });
    };

    const zoomReadout = { value: Number(canvas.camera.scale.toFixed(3)) };
    const gui = new GUI({ title: 'Label zoom LOD' });
    onStoryTeardown(() => gui.destroy());
    const liveZoom = gui.add(zoomReadout, 'value').name('current zoom').listen().disable();
    onStoryTeardown(
      canvas.events.on('input:camera:zoom', () => {
        zoomReadout.value = Number(canvas.camera.scale.toFixed(3));
        liveZoom.updateDisplay();
      })
    );

    const nodeFolder = gui.addFolder('Node labels');
    nodeFolder.add(settings, 'nodeEnabled').name('enabled').onChange(apply);
    nodeFolder.add(settings, 'nodeMinZoom', 0, 3, 0.05).name('show from zoom (0 = always)').onChange(apply);
    nodeFolder.add(settings, 'nodeAlwaysShowTop', 0, 1, 0.05).name('always show top (fraction)').onChange(apply);
    nodeFolder.add(settings, 'nodeGrowthOn').name('set zoom growth').onChange(apply);
    nodeFolder.add(settings, 'nodeGrowth', 0, 1, 0.05).name('zoom growth').onChange(apply);
    nodeFolder.add(settings, 'nodeMinFontPx', 0, 30, 1).name('min font px (0 = off)').onChange(apply);
    nodeFolder.add(settings, 'nodeMaxFontPx', 0, 60, 1).name('max font px (0 = off)').onChange(apply);

    const edgeFolder = gui.addFolder('Edge labels');
    edgeFolder.add(settings, 'edgeEnabled').name('enabled').onChange(apply);
    edgeFolder.add(settings, 'edgeMinZoom', 0, 3, 0.05).name('show from zoom (0 = always)').onChange(apply);
    edgeFolder.add(settings, 'edgeGrowthOn').name('set zoom growth').onChange(apply);
    edgeFolder.add(settings, 'edgeGrowth', 0, 1, 0.05).name('zoom growth').onChange(apply);
    edgeFolder.add(settings, 'edgeMinFontPx', 0, 30, 1).name('min font px (0 = off)').onChange(apply);
    edgeFolder.add(settings, 'edgeMaxFontPx', 0, 60, 1).name('max font px (0 = off)').onChange(apply);

    const interplay = gui.addFolder('Interplay');
    interplay.add(settings, 'collision').name('label collision').onChange(apply);
    interplay.add(settings, 'nodeSizeLOD').name('node size LOD').onChange(apply);
  }
};
