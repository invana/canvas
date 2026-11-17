import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, type GraphNode } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Navigation2 } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Icon/Rotated' };
export default meta;
type Story = StoryObj;

/**
 * **An icon that follows a heading** — the marker for a vessel, a rider, a plane.
 *
 * The styling template binds the icon's rotation to a record field:
 *
 * ```json
 * "icon": { "kind": "named", "name": "ship", "rotationBind": "data.course" }
 * ```
 *
 * `data.course` is a compass course in **degrees, 0 = north, clockwise** — what AIS
 * and GPS report. The icon is drawn pointing up; the engine turns it about its own
 * centre. Only the **icon** turns: the disc and the label stay put (the label would
 * orbit if the whole shape rotated, which is why heading is an icon property).
 *
 * Eight vessels sit at 0°, 45° … 315°. The ninth, bottom right, is a control: its
 * record has no `course`, so it draws unrotated.
 *
 * Try it:
 * - **Turn all +15°** writes a new `data.course` on every vessel — the icons
 *   follow, and none is rebuilt (rotation is not part of an icon's identity).
 * - **Rotation offset** is added to the bound value, in the unit below — for an
 *   icon drawn pointing somewhere other than up.
 * - **Unit** reads `data.course` as degrees or radians.
 */
export const RotatedStory: Story = {
  name: 'Rotated',
  render: () => createContainer({ id: 'graph-nodes-icon-rotated' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-icon-rotated')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const nodes: GraphNode[] = [
      { type: 'vessel', id: 'v0', position: { x: 0, y: -190 }, data: { name: '000°', course: 0 } },
      { type: 'vessel', id: 'v45', position: { x: 134, y: -134 }, data: { name: '045°', course: 45 } },
      { type: 'vessel', id: 'v90', position: { x: 190, y: 0 }, data: { name: '090°', course: 90 } },
      { type: 'vessel', id: 'v135', position: { x: 134, y: 134 }, data: { name: '135°', course: 135 } },
      { type: 'vessel', id: 'v180', position: { x: 0, y: 190 }, data: { name: '180°', course: 180 } },
      { type: 'vessel', id: 'v225', position: { x: -134, y: 134 }, data: { name: '225°', course: 225 } },
      { type: 'vessel', id: 'v270', position: { x: -190, y: 0 }, data: { name: '270°', course: 270 } },
      { type: 'vessel', id: 'v315', position: { x: -134, y: -134 }, data: { name: '315°', course: 315 } },
      { type: 'vessel', id: 'control', position: { x: 340, y: 190 }, data: { name: 'no course' } }
    ];

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    const settings = { offset: 0, unit: 'deg' as 'deg' | 'rad' };

    // The rotation fields are the only ones the GUI moves; the template is rebuilt whole.
    const styling = (): Record<string, unknown> => ({
      vessel: {
        name: 'vessel',
        fill: 0x0284c7,
        stroke: 0xffffff,
        strokeWidth: 2,
        icon: {
          kind: 'named',
          name: 'ship',
          color: 0xffffff,
          sizeRatio: 0.65,
          rotationBind: 'data.course',
          rotationUnit: settings.unit,
          rotationOffset: settings.offset
        },
        label: { fontSize: 12, placement: 'bottom', offsetY: 8 }
      }
    });

    const canvasOptions = {
      layers: {
        graph: {
          iconSet: iconSetFromLucide({ ship: Navigation2 }),
          nodeStructureTemplates: {
            marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 28 }, slots: { label: true, icon: true } }
          },
          nodeStylingTemplates: styling(),
          nodeTypes: { vessel: { structure: 'marker', styling: 'vessel', bindings: { label: 'data.name' } } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 110);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Rotated icons' });
    onStoryTeardown(() => gui.destroy());

    const restyle = (): void => {
      canvas.update({ layers: { graph: { nodeStylingTemplates: styling() } } });
    };
    gui.add(settings, 'unit', ['deg', 'rad']).name('Unit of data.course').onChange(restyle);
    gui.add(settings, 'offset', -180, 180, 1).name('Rotation offset').onChange(restyle);
    gui
      .add(
        {
          turn: () => {
            // A heading update is a data write: the icon turns, nothing is rebuilt.
            const step = settings.unit === 'deg' ? 15 : (15 * Math.PI) / 180;
            for (const n of graph.store.nodes()) {
              const course = (n.data as { course?: number } | undefined)?.course;
              if (course !== undefined) graph.store.updateNode(n.id, { data: { ...(n.data as object), course: course + step } });
            }
          }
        },
        'turn'
      )
      .name('Turn all +15°');
  }
};
