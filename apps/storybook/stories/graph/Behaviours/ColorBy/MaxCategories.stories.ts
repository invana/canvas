/**
 * **Category — the cardinality cap**
 *
 * `maxCategories` guards against colouring by a high-cardinality field. Les
 * Misérables has 11 communities; capping at **4** gives the first four a colour
 * and collapses the remaining seven into the fallback grey.
 *
 * The point is that the truncation becomes **visible** — `getLegend()` emits a
 * single `other (7)` row, and the panel below reports the same counts — rather
 * than silently cycling the palette until unrelated values share a colour, which
 * is what unbounded assignment does.
 *
 * To see the failure it exists to prevent: set `nodeValueKey` to `id` and drag
 * the cap to 30. Every one of the 77 characters is now its own "category",
 * sharing 12 palette colours between them, and the picture means nothing.
 *
 * Set the cap to `Infinity` in code to disable it.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/MaxCategories' };
export default meta;
type Story = StoryObj;

export const MaxCategoriesStory: Story = {
  name: 'MaxCategories',
  render: () => createContainer({ id: 'colour-by-cap' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-cap')!;

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
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
      nodeValueKey: 'data.group',
      colorEdges: false,
      maxCategories: 4,
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
    const settings = { maxCategories: o.maxCategories, nodeValueKey: o.nodeValueKey };
    const derived = { assigned: '', other: '' };
    const refresh = (): void => {
      const legend = colorBy.getLegend().nodes;
      derived.assigned = String(colorBy.getColorMap().size);
      // `other` is absent from the legend when nothing was capped — which is how
      // you tell "the cap is inactive" from "the cap collapsed zero values".
      derived.other =
        legend?.kind === 'categories' && legend.other
          ? `${legend.other.count} collapsed`
          : 'none capped';
    };
    const apply = (): void => {
      colorBy.setOptions(settings);
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'maxCategories', 1, 30, 1).onChange(apply);
    gui.add(settings, 'nodeValueKey').name('nodeValueKey (try id)').onFinishChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'assigned').name('categories assigned').listen().disable();
    out.add(derived, 'other').name('other (overflow)').listen().disable();
  },
};
