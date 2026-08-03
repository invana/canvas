/**
 * **Range — a log scale for a long-tailed magnitude**
 *
 * Same field and domain as `RangeContinuous`, one option different — and that is
 * the comparison worth making.
 *
 * `data.scenes` is heavily long-tailed: the median character shares 12 scenes,
 * Valjean shares 158. On a `'linear'` scale almost the entire cast sits at the
 * pale end and the gradient is spent on two or three protagonists. `scale: 'log'`
 * spends the ramp where the data actually is, and the supporting cast becomes
 * distinguishable. Switch `scale` in the panel to watch it collapse and recover.
 *
 * `'sqrt'` is the gentler middle option. The three continuous scales match
 * `NodeCentralityBehaviour`'s deliberately — the same curve names mean the same
 * thing across behaviours.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/RangeLogScale' };
export default meta;
type Story = StoryObj;

export const RangeLogScaleStory: Story = {
  name: 'RangeLogScale',
  render: () => createContainer({ id: 'colour-by-log' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-log')!;

    // `scenes` — weighted degree, derived here rather than shipped in the
    // dataset. Long-tailed by nature: 1 … 158, median 12.
    const scenes = new Map<string, number>();
    for (const e of lesMiserables.edges) {
      for (const id of [e.source, e.target]) {
        scenes.set(id, (scenes.get(id) ?? 0) + e.data.value);
      }
    }
    const nodes = lesMiserables.nodes.map((n) => ({
      id: n.id,
      type: `group-${n.data.group}`,
      data: { group: n.data.group, scenes: scenes.get(n.id) ?? 0 },
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
      scale: 'log',
      nodeValueKey: 'data.scenes',
      nodeDomain: [1, 158],
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
    const settings = { scale: o.scale, nodeValueKey: o.nodeValueKey };
    const derived = { domain: '', median: '' };
    // The median is the honest summary of what a linear scale wastes: it sits at
    // 12 of 158, i.e. the first 8% of the ramp.
    const sorted = [...scenes.values()].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)] ?? 0;
    const refresh = (): void => {
      const d = colorBy.getDomains().nodes.domain;
      derived.domain = `${d[0]} … ${d[1]}`;
      derived.median = `${median} of ${d[1]} (${Math.round((median / d[1]) * 100)}% of range)`;
    };
    const apply = (): void => {
      colorBy.setOptions(settings);
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'scale', ['linear', 'sqrt', 'log']).onChange(apply);
    gui.add(settings, 'nodeValueKey').name('nodeValueKey (dot path)').onFinishChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'domain').name('node domain in use').listen().disable();
    out.add(derived, 'median').name('median sits at').listen().disable();
  },
};
