import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, ThemeBehaviour, type GraphNode } from '@invana/graph';
import { iconSetFromLucide } from '@invana/canvas-ui';
import { Building2, Castle, Droplets, Flame, Landmark, Library, Mountain, Waves } from 'lucide-react';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Icon/Named' };
export default meta;
type Story = StoryObj;

/**
 * **Icons by name** — a per-type icon that lives in config, not code.
 *
 * A styling template carries `icon: { kind: 'named', name: 'lake', … }`; the layer's
 * `iconSet` maps each name to SVG markup. Both are plain JSON, so a saved
 * visualisation reproduces its icons with **no network call** — nothing is fetched,
 * nothing is registered in code. Seven node types here, one template each.
 *
 * Where the markup comes from is the app's choice. Six icons are built from Lucide
 * components with `iconSetFromLucide` (rendered once, up front); `compass` is a
 * literal SVG string, to show it is just data.
 *
 * Try it:
 * - **Icon size** rewrites every template's `sizeRatio` (a styling template edit).
 * - **Swap lake icon** replaces one entry of `iconSet` with `canvas.update` — the
 *   set merges live and every lake redraws.
 * - **Unknown name** points the `museum` type at a name the set doesn't have: the
 *   node falls back to a plain disc and the console warns once.
 */
export const NamedStory: Story = {
  name: 'Named',
  render: () => createContainer({ id: 'graph-nodes-icon-named' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-icon-named')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const nodes: GraphNode[] = [
      { type: 'city', id: 'hyderabad', position: { x: -360, y: 0 }, data: { name: 'Hyderabad' } },
      { type: 'temple', id: 'birla', position: { x: -240, y: 0 }, data: { name: 'Birla Mandir' } },
      { type: 'fort', id: 'golconda', position: { x: -120, y: 0 }, data: { name: 'Golconda Fort' } },
      { type: 'monument', id: 'charminar', position: { x: 0, y: 0 }, data: { name: 'Charminar' } },
      { type: 'lake', id: 'hussain-sagar', position: { x: 120, y: 0 }, data: { name: 'Hussain Sagar' } },
      { type: 'hill', id: 'ananthagiri', position: { x: 240, y: 0 }, data: { name: 'Ananthagiri' } },
      { type: 'museum', id: 'salar-jung', position: { x: 360, y: 0 }, data: { name: 'Salar Jung' } },
      { type: 'compass', id: 'north', position: { x: 0, y: 130 }, data: { name: 'literal SVG' } }
    ];

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    // Six icons from Lucide, rendered to SVG markup once. `compass` is plain data.
    const iconSet = {
      ...iconSetFromLucide({ city: Building2, temple: Flame, fort: Castle, monument: Landmark, lake: Waves, hill: Mountain }),
      compass:
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="m16.24 7.76-2.12 6.36-6.36 2.12 2.12-6.36z"/></svg>'
    };
    // Held aside so the GUI can swap one entry back and forth.
    const alternates = iconSetFromLucide({ waves: Waves, droplets: Droplets, library: Library });

    const settings = { iconSize: 0.6, swapLake: false, unknownName: false };

    const names = ['city', 'temple', 'fort', 'monument', 'lake', 'hill', 'museum', 'compass'] as const;
    const fills: Record<(typeof names)[number], number> = {
      city: 0x334155, temple: 0xea580c, fort: 0x92400e, monument: 0x7c3aed,
      lake: 0x0284c7, hill: 0x16a34a, museum: 0xdb2777, compass: 0x0f766e
    };
    // One styling template per type; `sizeRatio` is the only knob the GUI moves.
    const stylings = (): Record<string, unknown> =>
      Object.fromEntries(
        names.map((n) => [
          n,
          {
            name: n,
            fill: fills[n],
            stroke: 0xffffff,
            strokeWidth: 1.5,
            // `museum` has no entry in the set — the "Unknown name" switch points it at one that exists or not.
            icon: {
              kind: 'named',
              name: n === 'museum' && settings.unknownName ? 'does-not-exist' : n === 'museum' ? 'library' : n,
              color: 0xffffff,
              sizeRatio: settings.iconSize
            },
            label: { fontSize: 12, placement: 'bottom', offsetY: 6 }
          }
        ])
      );

    const canvasOptions = {
      layers: {
        graph: {
          iconSet: { ...iconSet, library: alternates.library },
          nodeStructureTemplates: {
            marker: { name: 'marker', kind: 'simple', shape: { kind: 'circle', radius: 26 }, slots: { label: true, icon: true } }
          },
          nodeStylingTemplates: stylings(),
          nodeTypes: {
            city: { structure: 'marker', styling: 'city', bindings: { label: 'data.name' } },
            temple: { structure: 'marker', styling: 'temple', bindings: { label: 'data.name' } },
            fort: { structure: 'marker', styling: 'fort', bindings: { label: 'data.name' } },
            monument: { structure: 'marker', styling: 'monument', bindings: { label: 'data.name' } },
            lake: { structure: 'marker', styling: 'lake', bindings: { label: 'data.name' } },
            hill: { structure: 'marker', styling: 'hill', bindings: { label: 'data.name' } },
            museum: { structure: 'marker', styling: 'museum', bindings: { label: 'data.name' } },
            compass: { structure: 'marker', styling: 'compass', bindings: { label: 'data.name' } }
          }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        theme: { enabled: true, mode: 'document' }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 120);

    // ─── lil-gui ───────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'Named icons' });
    onStoryTeardown(() => gui.destroy());

    const restyle = (): void => {
      canvas.update({ layers: { graph: { nodeStylingTemplates: stylings() } } });
    };
    gui.add(settings, 'iconSize', 0.3, 0.9, 0.05).name('Icon size').onChange(restyle);
    gui.add(settings, 'swapLake').name('Swap lake icon').onChange((v: boolean) => {
      // Merges into the layer's iconSet — only `lake` changes.
      canvas.update({ layers: { graph: { iconSet: { lake: v ? alternates.droplets! : alternates.waves! } } } });
    });
    gui.add(settings, 'unknownName').name('Unknown name (museum)').onChange(restyle);
  }
};
