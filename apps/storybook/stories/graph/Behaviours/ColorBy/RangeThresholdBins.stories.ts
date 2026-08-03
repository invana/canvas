/**
 * **Range — explicit threshold bins**
 *
 * Sometimes the buckets are an editorial decision, not a statistical one:
 * walk-on (under 3 co-stars), minor (3–9), supporting (10–19), principal (20+).
 * `scale: 'threshold'` takes those edges literally, in the field's own units.
 *
 * Three edges give four buckets. The ramp is sampled once per bucket rather than
 * interpolated per value, so the result reads as discrete bands — and
 * `getLegend()` returns `kind: 'bins'` with each band's `from` / `to`, so a legend
 * can state the rule rather than showing a meaningless gradient. The panel prints
 * those bands back.
 *
 * `scale: 'quantile'` is the sibling for when you want equal-*count* buckets
 * derived from the data instead of edges you chose — switch to it in the panel
 * and the band boundaries move to wherever the data actually divides evenly.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/RangeThresholdBins' };
export default meta;
type Story = StoryObj;

export const RangeThresholdBinsStory: Story = {
  name: 'RangeThresholdBins',
  render: () => createContainer({ id: 'colour-by-threshold' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-threshold')!;

    // `degree` — how many other characters this one shares a scene with.
    // **Derived here, not in the dataset.** Runs 1 … 36, median 6.
    const degree = new Map<string, number>();
    for (const e of lesMiserables.edges) {
      for (const id of [e.source, e.target]) degree.set(id, (degree.get(id) ?? 0) + 1);
    }
    const nodes = lesMiserables.nodes.map((n) => ({
      id: n.id,
      type: `group-${n.data.group}`,
      data: { group: n.data.group, degree: degree.get(n.id) ?? 0 },
    }));

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(
      new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: lesMiserables.edges } } }),
    );
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }),
    );
    canvas.layouts.add(new D3ForceLayout({ id: 'force', targetLayerId: 'graph' }));

    const colorBy = new ColorByBehaviour({
      id: 'color',
      targetLayerId: 'graph',
      enabled: true,
      mode: 'range',
      scale: 'threshold',
      nodeValueKey: 'data.degree',
      nodeThresholds: [3, 10, 20],
      colorEdges: false,
    });
    canvas.behaviours.register(colorBy);

    await canvas.init({
      container,
      autoResize: true,
      config: {
        layers: {
          graph: {
            node: {
              style: {
                shape: { kind: 'circle', radius: 7 },
                bgStrokeColor: 0xffffff,
                bgStrokeWidth: 1.5,
                showLabel: false,
              },
            },
            edge: {
              style: {
                strokeColor: 0xcbd5e1,
                strokeWidth: 1,
                strokeAlpha: 0.5,
                arrowTargetShape: 'none',
              },
            },
          },
        },
        layouts: {
          force: { charge: { strength: -220 }, link: { distance: 40 }, collide: { radius: 11 } },
        },
        activeLayout: 'force',
        fitOnLoad: true,
      },
    });

    const o = colorBy.getResolvedOptions();
    const settings = {
      scale: o.scale,
      thresholds: (o.nodeThresholds ?? []).join(', '),
      bins: o.bins,
    };
    const derived = { bands: '', count: '' };
    const refresh = (): void => {
      const legend = colorBy.getLegend().nodes;
      if (legend?.kind === 'bins') {
        derived.bands = legend.bins.map((b) => `${b.from}–${b.to}`).join('  ');
        derived.count = String(legend.bins.length);
      } else {
        derived.bands = '— (not a binned scale)';
        derived.count = '—';
      }
    };
    const apply = (): void => {
      colorBy.setOptions({
        scale: settings.scale,
        // Sorted + de-duplicated by the behaviour on resolve, so free-form input
        // is safe here.
        nodeThresholds: settings.thresholds
          .split(',')
          .map((t) => Number(t.trim()))
          .filter((n) => Number.isFinite(n)),
        bins: settings.bins,
      });
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'scale', ['threshold', 'quantile', 'linear']).onChange(apply);
    gui.add(settings, 'thresholds').name('nodeThresholds (csv)').onFinishChange(apply);
    gui.add(settings, 'bins', 2, 12, 1).name('bins (quantile only)').onChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'count').name('buckets').listen().disable();
    out.add(derived, 'bands').name('bands').listen().disable();
  },
};
