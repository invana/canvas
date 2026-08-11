/**
 * **Category — an unresolved path, and why grey is the right answer**
 *
 * **This story renders every node grey, on purpose.**
 *
 * `nodeValueKey` points at `data.nosuchfield`, which no record has. The path
 * resolves to `undefined` on every node, so every node takes `fallbackColor`.
 *
 * That's the designed behaviour for a mis-typed or absent path, and the reasoning
 * is worth stating: a uniform grey graph is a **loud symptom**. The alternative —
 * silently coercing, or falling back to some other field — would produce a
 * plausible-looking picture built on nothing. `getLegend()` tells the same story,
 * returning a `categories` section with no entries.
 *
 * Fix it live from the panel: set `nodeValueKey` to `data.group` (or `type` —
 * these characters are typed `'character'`) and the graph comes back.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/MissingField' };
export default meta;
type Story = StoryObj;

export const MissingFieldStory: Story = {
  name: 'MissingField',
  render: () => createContainer({ id: 'colour-by-missing' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-missing')!;

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }),
    );
    canvas.layouts.add(new D3ForceLayout({ id: 'force', targetLayerId: 'graph' }));

    // An obviously-absent path. Les Mis characters *do* carry a `type` now
    // (`'character'`), so the old demonstration — leaving `nodeValueKey` at its
    // `'type'` default — would colour every node one colour instead of grey.
    const colorBy = new ColorByBehaviour({
      id: 'color',
      targetLayerId: 'graph',
      enabled: true,
      nodeValueKey: 'data.nosuchfield',
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
      nodeValueKey: o.nodeValueKey,
      fallbackColor: `#${o.fallbackColor.toString(16).padStart(6, '0')}`
    };
    const derived = { assigned: '', legend: '' };
    const refresh = (): void => {
      // Zero, because nothing ever resolved to a value worth assigning a colour.
      derived.assigned = String(colorBy.getColorMap().size);
      derived.legend = colorBy.getLegend().nodes?.kind ?? '— (nodes not coloured)';
    };
    const apply = (): void => {
      colorBy.setOptions({
        nodeValueKey: settings.nodeValueKey,
        fallbackColor: Number.parseInt(settings.fallbackColor.replace('#', ''), 16)
      });
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'nodeValueKey').name('nodeValueKey (try data.group)').onFinishChange(apply);
    gui.addColor(settings, 'fallbackColor').onChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'assigned').name('categories assigned').listen().disable();
    out.add(derived, 'legend').name('legend section kind').listen().disable();
  }
};
