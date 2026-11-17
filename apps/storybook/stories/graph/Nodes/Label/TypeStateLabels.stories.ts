import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, ZoomStateBehaviour, type GraphNode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/TypeStateLabels' };
export default meta;
type Story = StoryObj;

/**
 * **Zoom-tier label text, per type, as config.**
 *
 * `ZoomStateBehaviour` puts a runtime state (`detail`) on every node once the camera
 * is past `minZoom`. What that state *changes* is the style catalogue's job — and a
 * layer-level overlay is shared by every type. A node type can instead carry its own
 * per-state label template:
 *
 * ```json
 * "vessel": {
 *   "structure": "marker", "styling": "vessel", "bindings": { "label": "data.name" },
 *   "states": { "detail": { "label": "{data.name}\n{data.flag} · {data.cargo}" } }
 * }
 * ```
 *
 * `{data.field}` is filled from each record, so a **vessel** grows to its flag and
 * cargo and a **port** to its country and berths — from the same behaviour, with no
 * text written on any node. Zoom out and both fall back to the bare name (the base
 * `label` binding).
 *
 * It opens on the short labels; **zoom in** (mouse wheel) past the threshold to see
 * the detail tier. **Zoom state** switches the behaviour off (labels stay short at
 * any zoom); **Zoom threshold** moves where the detail tier starts.
 */
export const TypeStateLabelsStory: Story = {
  name: 'TypeStateLabels',
  render: () => createContainer({ id: 'graph-nodes-label-type-state-labels' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-label-type-state-labels')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const nodes: GraphNode[] = [
      { type: 'vessel', id: 'alpha', position: { x: -240, y: -40 }, data: { name: 'MV Alpha', flag: 'India', cargo: 'grain' } },
      { type: 'vessel', id: 'bravo', position: { x: 0, y: 70 }, data: { name: 'MV Bravo', flag: 'Singapore', cargo: 'crude oil' } },
      { type: 'vessel', id: 'charlie', position: { x: 240, y: -50 }, data: { name: 'MV Charlie', flag: 'Panama', cargo: 'containers' } },
      { type: 'port', id: 'kakinada', position: { x: -120, y: -170 }, data: { name: 'Kakinada', country: 'India', berths: 12 } },
      { type: 'port', id: 'vizag', position: { x: 130, y: -190 }, data: { name: 'Visakhapatnam', country: 'India', berths: 27 } }
    ];

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new ZoomStateBehaviour({ id: 'detail', targetLayerId: 'graph', state: 'detail' }));

    // The fitted view is ~2.3×; the detail tier starts just past it, so the story opens on the short labels.
    const settings = { enabled: true, minZoom: 3 };

    const canvasOptions = {
      layers: {
        graph: {
          nodeStructureTemplates: {
            vesselDot: { name: 'vesselDot', kind: 'simple', shape: { kind: 'circle', radius: 14 }, slots: { label: true } },
            portSquare: { name: 'portSquare', kind: 'simple', shape: { kind: 'rect', width: 26, height: 26, cornerRadius: 5 }, slots: { label: true } }
          },
          nodeStylingTemplates: {
            vessel: { name: 'vessel', fill: 0x0284c7, label: { fontSize: 12, placement: 'bottom', offsetY: 6, align: 'center' } },
            port: { name: 'port', fill: 0x7c3aed, label: { fontSize: 12, placement: 'bottom', offsetY: 6, align: 'center' } }
          },
          nodeTypes: {
            vessel: {
              structure: 'vesselDot',
              styling: 'vessel',
              bindings: { label: 'data.name' },
              states: { detail: { label: '{data.name}\n{data.flag} · {data.cargo}' } }
            },
            port: {
              structure: 'portSquare',
              styling: 'port',
              bindings: { label: 'data.name' },
              states: { detail: { label: '{data.name}\n{data.country} · {data.berths} berths' } }
            }
          }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' },
        detail: { enabled: settings.enabled, minZoom: settings.minZoom }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 100);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Per-type state labels' });
    onStoryTeardown(() => gui.destroy());
    const apply = (): void => {
      canvas.update({ behaviours: { detail: { enabled: settings.enabled, minZoom: settings.minZoom } } });
    };
    gui.add(settings, 'enabled').name('Zoom state').onChange(apply);
    gui.add(settings, 'minZoom', 0.2, 8, 0.1).name('Zoom threshold').onChange(apply);
  }
};
