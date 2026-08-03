/**
 * **Category — pin known values to specific colours**
 *
 * Sometimes a value's colour is not arbitrary. Without `valueColors`, each
 * community takes whatever palette slot is next **in order of first
 * appearance** — which depends on data arrival order, so it can differ between
 * loads and between two views of the same graph.
 *
 * Here the three largest Les Mis communities are pinned; the remaining eight fall
 * through to the palette as usual. Pinned values are also never counted against
 * `maxCategories`, so raising or lowering the cap can never demote an explicit
 * choice — drag the cap down to 1 in the panel and the three pins survive.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { ColorByBehaviour, DragNodeBehaviour, GraphCanvas, GraphLayer } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';

import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Behaviours/ColorBy/PinnedColors' };
export default meta;
type Story = StoryObj;

export const PinnedColorsStory: Story = {
  name: 'PinnedColors',
  render: () => createContainer({ id: 'colour-by-pinned' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#colour-by-pinned')!;

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new GraphLayer({ id: 'graph', options: { initData: lesMiserables } }));
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph', enabled: true }),
    );
    canvas.layouts.add(new D3ForceLayout({ id: 'force', targetLayerId: 'graph' }));

    // Keys are compared as strings, so a numeric `data.group` pins as '1' / '2' / '8'.
    const colorBy = new ColorByBehaviour({
      id: 'color',
      targetLayerId: 'graph',
      enabled: true,
      nodeValueKey: 'data.group',
      colorEdges: false,
      valueColors: { 1: 0x22c55e, 2: 0xef4444, 8: 0x8b5cf6 },
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
      group1: `#${(o.valueColors['1'] ?? 0x22c55e).toString(16).padStart(6, '0')}`,
      group2: `#${(o.valueColors['2'] ?? 0xef4444).toString(16).padStart(6, '0')}`,
      group8: `#${(o.valueColors['8'] ?? 0x8b5cf6).toString(16).padStart(6, '0')}`,
      maxCategories: o.maxCategories,
    };
    const derived = { assigned: '', pinned: '' };
    const refresh = (): void => {
      // `getColorMap()` holds only palette-assigned values — pins live in options,
      // which is why the two counts differ.
      derived.assigned = String(colorBy.getColorMap().size);
      derived.pinned = String(Object.keys(colorBy.getResolvedOptions().valueColors).length);
    };
    const hex = (s: string): number => Number.parseInt(s.replace('#', ''), 16);
    const apply = (): void => {
      colorBy.setOptions({
        valueColors: { 1: hex(settings.group1), 2: hex(settings.group2), 8: hex(settings.group8) },
        maxCategories: settings.maxCategories,
      });
      refresh();
    };
    refresh();

    const gui = new GUI({ title: 'ColorBy — settings in use' });
    onStoryTeardown(() => gui.destroy());
    const pins = gui.addFolder('valueColors (pinned)');
    pins.addColor(settings, 'group1').name("group '1'").onChange(apply);
    pins.addColor(settings, 'group2').name("group '2'").onChange(apply);
    pins.addColor(settings, 'group8').name("group '8'").onChange(apply);
    gui.add(settings, 'maxCategories', 1, 30, 1).name('maxCategories (pins ignore it)').onChange(apply);
    const out = gui.addFolder('derived (read-only)');
    out.add(derived, 'assigned').name('palette-assigned').listen().disable();
    out.add(derived, 'pinned').name('pinned values').listen().disable();
  },
};
