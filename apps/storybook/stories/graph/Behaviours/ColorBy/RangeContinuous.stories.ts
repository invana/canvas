/**
 * **Range — a continuous ramp over an explicit domain**
 *
 * `mode: 'range'` reads a field as a **magnitude** and interpolates along a
 * colour ramp, rather than treating each distinct number as its own category.
 *
 * That distinction is the reason the mode exists. `data.scenes` — derived below —
 * runs 1–158. In `'categorical'` mode, 87 and 88 shared scenes are two unrelated
 * values and get two unrelated colours. Here they are adjacent points on one
 * scale, and Valjean's centrality is legible at a glance. Flip `mode` in the
 * panel to see the difference.
 *
 * The domain is set explicitly. Clear it (set max = min) and the behaviour
 * auto-scans the field across the layer — convenient, but a node arriving later
 * that widens the range **recolours every other node**, so pin it for stable
 * colours across a streaming load. The panel's read-out marks which is in play.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/RangeContinuous' };
export default meta;
type Story = StoryObj;

export const RangeContinuousStory: Story = {
  name: 'RangeContinuous',
  render: () => createContainer({ id: 'colour-by-range' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-range')!;

    // `scenes` — weighted degree: the summed `value` of every incident edge, i.e.
    // total shared-scene count. **Derived here, not in the dataset**: Les Mis
    // carries no node magnitude and range mode needs one. Runs 1–158, median 12.
    const scenes = new Map<string, number>();
    for (const e of lesMiserables.edges) {
      for (const id of [e.source, e.target]) {
        scenes.set(id, (scenes.get(id) ?? 0) + e.data.value);
      }
    }
    const nodes = lesMiserables.nodes.map((n) => ({
      id: n.id,
      type: `group-${n.data.group}`,
      data: { group: n.data.group, scenes: scenes.get(n.id) ?? 0 }
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
      nodeValueKey: 'data.scenes',
      nodeDomain: [1, 158],
      colorEdges: false
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
                showLabel: false
              }
            },
            edge: {
              style: {
                strokeColor: 0xcbd5e1,
                strokeWidth: 1,
                strokeAlpha: 0.5,
                arrowTargetShape: 'none'
              }
            }
          }
        },
        layouts: {
          force: { charge: { strength: -220 }, link: { distance: 40 }, collide: { radius: 11 } }
        },
        activeLayout: 'force',
        fitOnLoad: true
      }
    });

    const o = colorBy.getResolvedOptions();
    const settings = {
      mode: o.mode,
      scale: o.scale,
      domainMin: o.nodeDomain?.[0] ?? 1,
      domainMax: o.nodeDomain?.[1] ?? 158
    };
    const derived = { domain: '', legend: '' };
    const refresh = (): void => {
      const resolved = colorBy.getResolvedOptions();
      const d = colorBy.getDomains().nodes.domain;
      // When `nodeDomain` is unset the *option* is undefined while the domain in
      // use is whatever the last auto-scan found — that gap is what surprises
      // people, so the read-out names which one is in play.
      derived.domain = `${d[0]} … ${d[1]}${resolved.nodeDomain ? ' (explicit)' : ' (auto)'}`;
      derived.legend = colorBy.getLegend().nodes?.kind ?? '— (nodes not coloured)';
    };
    const apply = (): void => {
      colorBy.setOptions({
        mode: settings.mode,
        scale: settings.scale,
        // Equal bounds is how this panel expresses "no explicit domain".
        nodeDomain:
          settings.domainMin === settings.domainMax
            ? undefined
            : [settings.domainMin, settings.domainMax]
      });
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'mode', ['categorical', 'range']).onChange(apply);
    gui.add(settings, 'scale', ['linear', 'sqrt', 'log']).onChange(apply);
    gui.add(settings, 'domainMin').onFinishChange(apply);
    gui.add(settings, 'domainMax').name('domainMax (= min → auto)').onFinishChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'domain').name('node domain in use').listen().disable();
    out.add(derived, 'legend').name('legend section kind').listen().disable();
  }
};
