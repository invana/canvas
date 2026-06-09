/**
 * Hierarchical Sugiyama layout via ELK's `layered` algorithm — the
 * canonical "directed acyclic graph drawn as ranks" picture. Nodes are
 * assigned to layers along the flow direction and edges route across
 * layers with crossing minimisation.
 *
 * The GUI exposes the ELK knobs that have the largest visual effect:
 * algorithm choice, flow direction, and the four spacing properties.
 * Toggle between `layered`, `mrtree`, `radial`, `force`, and `stress` to
 * compare ELK's catalogue on the same fixed DAG.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import {
  ElkLayout,
  type ElkAlgorithmName,
  type ElkDirection,
} from '@invana/graph-layout-elkjs';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { SystemThemeBehaviour } from '../../../system-theme';

const meta: Meta = { title: 'canvas/graph-layouts/elkjs/Layered' };
export default meta;
type Story = StoryObj;

export const Layered: Story = {
  render: () => createContainer({ id: 'graph-elk-layered' }),

  play: async ({ canvasElement }) => {
    // ── Data — a small build-pipeline DAG ────────────────────────────────
    // Hand-written so the structure reads clearly: a fan-out from "source",
    // four parallel build legs, two test legs that merge, then a release.
    const nodes: GraphNode[] = [
      { id: 'source',  style: { labelText: 'source',  bgFill: 0x0ea5e9 } },
      { id: 'lint',    style: { labelText: 'lint',    bgFill: 0x6366f1 } },
      { id: 'types',   style: { labelText: 'types',   bgFill: 0x6366f1 } },
      { id: 'build',   style: { labelText: 'build',   bgFill: 0x6366f1 } },
      { id: 'docs',    style: { labelText: 'docs',    bgFill: 0x6366f1 } },
      { id: 'unit',    style: { labelText: 'unit',    bgFill: 0xa855f7 } },
      { id: 'e2e',     style: { labelText: 'e2e',     bgFill: 0xa855f7 } },
      { id: 'bundle',  style: { labelText: 'bundle',  bgFill: 0xec4899 } },
      { id: 'release', style: { labelText: 'release', bgFill: 0xf43f5e } },
    ];
    const edges: GraphEdge[] = [
      { id: 's-lint',     source: 'source', target: 'lint' },
      { id: 's-types',    source: 'source', target: 'types' },
      { id: 's-build',    source: 'source', target: 'build' },
      { id: 's-docs',     source: 'source', target: 'docs' },
      { id: 'lint-unit',  source: 'lint',   target: 'unit' },
      { id: 'types-unit', source: 'types',  target: 'unit' },
      { id: 'build-unit', source: 'build',  target: 'unit' },
      { id: 'build-e2e',  source: 'build',  target: 'e2e' },
      { id: 'unit-bundle', source: 'unit',  target: 'bundle' },
      { id: 'e2e-bundle',  source: 'e2e',   target: 'bundle' },
      { id: 'docs-release',   source: 'docs',   target: 'release' },
      { id: 'bundle-release', source: 'bundle', target: 'release' },
    ];

    // ── Add everything, then init() last ─────────────────────────────────
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-elk-layered')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges } },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', targetLayerId: 'bg' }));

    // ElkLayout's constructor takes only its own ELK options (no id /
    // targetLayerId pass-through), so it registers under the default id
    // 'layout'. The config + activeLayout below key off that id.
    const elkLayout = new ElkLayout();
    canvas.layouts.add(elkLayout);

    const canvasOptions = {
      layers: {
        bg: {
          type: 'pattern',
          patternType: 'dots',
          backgroundColor: '#0f172a',
          color: '#475569',
          size: 1.5,
          spacing: 24,
          alpha: 0.85,
        },
        graph: {
          node: {
            style: {
              shape: { kind: 'rect', width: 90, height: 36, cornerRadius: 6 },
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 1.5,
              labelColor: 0xffffff,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelPlacement: 'center',
            },
          },
          edge: {
            style: {
              strokeColor: 0x64748b,
              strokeWidth: 1.4,
              arrowTargetShape: 'triangle',
            },
          },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
          dark: { backgroundColor: '#0f172a', color: '#475569' },
        },
      },
      layouts: {
        layout: {
          algorithm: 'layered' as ElkAlgorithmName,
          direction: 'RIGHT' as ElkDirection,
          nodeSpacing: 30,
          layerSpacing: 80,
          edgeNodeSpacing: 20,
          edgeSpacing: 15,
          padding: 30,
        },
      },
      activeLayout: 'layout',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    // initData loads on mount and the active 'elk' layout auto-runs against it.

    // Fit once ELK settles each run.
    onStoryTeardown(
      elkLayout.events.on('end', ({ reason }) => {
        if (reason === 'completed') canvas.camera.fitContent(graph.getBounds(), 80);
      }),
    );

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'ElkLayout — Layered' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => elkLayout.stop());

    // Each edit pushes the whole elk param bag back through update(), which
    // re-runs the layout against the current graph.
    const applyLayout = (): void =>
      canvas.update({ layouts: { layout: canvasOptions.layouts.layout } });

    gui
      .add(canvasOptions.layouts.layout, 'algorithm', [
        'layered',
        'mrtree',
        'radial',
        'force',
        'stress',
        'box',
        'rectpacking',
        'random',
      ])
      .name('algorithm')
      .onChange(applyLayout);
    gui
      .add(canvasOptions.layouts.layout, 'direction', ['UP', 'DOWN', 'LEFT', 'RIGHT'])
      .name('direction')
      .onChange(applyLayout);

    const spacing = gui.addFolder('Spacing');
    spacing.add(canvasOptions.layouts.layout, 'nodeSpacing', 0, 120, 1).onFinishChange(applyLayout);
    spacing.add(canvasOptions.layouts.layout, 'layerSpacing', 0, 240, 1).onFinishChange(applyLayout);
    spacing.add(canvasOptions.layouts.layout, 'edgeNodeSpacing', 0, 80, 1).onFinishChange(applyLayout);
    spacing.add(canvasOptions.layouts.layout, 'edgeSpacing', 0, 60, 1).onFinishChange(applyLayout);
    spacing.add(canvasOptions.layouts.layout, 'padding', 0, 120, 1).onFinishChange(applyLayout);

    gui.add({ apply: applyLayout }, 'apply').name('Apply (re-run)');
    gui.add({ stop: () => elkLayout.stop() }, 'stop').name('Stop');
    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
