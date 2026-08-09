/**
 * **Category — colour by a nested field**
 *
 * The everyday case: one distinct colour per distinct value, handed out from the
 * palette in order of first appearance and remembered, so a value keeps its
 * colour as data arrives.
 *
 * `'data.group'` is a **root-relative dot path**, which is the whole addressing
 * model — the same option that reads `'type'` reaches arbitrarily deep into the
 * payload. This is the case that needed a *function* before
 * (`nodeLabel: (n) => n.data.group`), and a function can never be persisted to
 * `view.definition` or edited in a settings panel. A string path can, which is
 * why it's the primary form and `nodeValueBy` is only the escape hatch for
 * values that must be **computed**.
 *
 * Les Misérables' 11 communities are the closest thing this dataset has to an
 * entity kind — see `MissingField` for what happens when you ask for `type`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/ByCommunity' };
export default meta;
type Story = StoryObj;

export const ByCommunityStory: Story = {
  name: 'ByCommunity',
  render: () => createContainer({ id: 'colour-by-community' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-community')!;

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // `lesMiserables` is already engine-shaped — 77 characters carrying
    // `data.group` (0–10), 254 co-occurrence edges carrying `data.value`.
    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }),
    );
    canvas.layouts.add(new D3ForceLayout({ id: 'force', targetLayerId: 'graph' }));

    // Registered last so it wins the template fields it writes. The layer sets no
    // `bgFill` — this behaviour owns that channel.
    const colorBy = new ColorByBehaviour({
      id: 'color',
      targetLayerId: 'graph',
      enabled: true,
      nodeValueKey: 'data.group',
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
        // The dataset's own recommended force settings — Les Mis is a genuinely
        // dense 77-character social graph and needs this much charge to open up.
        layouts: {
          force: { charge: { strength: -220 }, link: { distance: 40 }, collide: { radius: 11 } }
        },
        activeLayout: 'force',
        fitOnLoad: true
      }
    });

    // Seeded from `getResolvedOptions()`, not from the options passed above — so
    // it reports the defaults this story never mentions (`mode`, `fallbackColor`,
    // `maxCategories`, `edgeValueKey`). The base `getOptions()` would show none.
    const o = colorBy.getResolvedOptions();
    const settings = {
      nodeValueKey: o.nodeValueKey,
      colorNodes: o.colorNodes,
      colorEdges: o.colorEdges,
      mode: o.mode,
      maxCategories: o.maxCategories
    };
    const derived = { assigned: '', legend: '' };
    const refresh = (): void => {
      derived.assigned = String(colorBy.getColorMap().size);
      derived.legend = colorBy.getLegend().nodes?.kind ?? '— (nodes not coloured)';
    };
    const apply = (): void => {
      colorBy.setOptions(settings);
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'mode', ['categorical', 'range']).onChange(apply);
    // Try 'type' (Les Mis has none → all grey) or 'id' (77 distinct values).
    gui.add(settings, 'nodeValueKey').name('nodeValueKey (dot path)').onFinishChange(apply);
    gui.add(settings, 'colorNodes').onChange(apply);
    gui.add(settings, 'colorEdges').onChange(apply);
    gui.add(settings, 'maxCategories', 1, 30, 1).onChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'assigned').name('categories assigned').listen().disable();
    out.add(derived, 'legend').name('legend section kind').listen().disable();
  }
};
