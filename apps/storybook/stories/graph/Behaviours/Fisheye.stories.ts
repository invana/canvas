/**
 * **Fisheye lens** — read a dense region in place without zooming away from it.
 *
 * The flare class tree (~250 nodes) runs under a live force layout. At this
 * zoom `TextLODBehaviour` hides every label, so the overview is unreadable dots.
 * Move the pointer over the graph: nodes under the lens are pushed apart,
 * enlarged toward its centre and **labelled**, while everything outside keeps
 * its place — the region stays connected to its surroundings.
 *
 * What the panel lets you check:
 *
 *   - **Display-only.** The force layout keeps ticking under the lens and the
 *     lens doesn't jitter; nothing is written to the store, so undo history and
 *     layout positions never see it. Edges stay glued to the *drawn* nodes.
 *   - **Clicks land on what you see.** Hover and drag a magnified node — it is
 *     picked where it is drawn. While the drag runs the lens steps aside (the
 *     node drag owns the gesture) and comes back on release.
 *   - **Labels beat text LOD only inside the lens.** Turn the lens off and the
 *     labels are hidden again; zoom in past the band and they all show, as
 *     without a lens.
 *   - **Wheel adjust.** Hold **Alt** and scroll inside the lens to resize it, or
 *     **Shift** to change the distortion; a plain scroll still zooms the camera.
 *     The panel's radius / distortion follow along.
 *   - **Trigger.** `click` places the lens and leaves it; `drag` places it with a
 *     click and moves it by dragging from inside.
 *
 * See `docs/rfcs/feat/2026-10-03-dense-regions-cannot-be-inspected-in-place.md`.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ColorByBehaviour,
  DragNodeBehaviour,
  FisheyeBehaviour,
  GraphCanvas,
  GraphLayer,
  HoverActivateBehaviour,
  TextLODBehaviour,
  ThemeBehaviour
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { flareAsGraph } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Behaviours/Fisheye' };
export default meta;
type Story = StoryObj;

export const FisheyeStory: Story = {
  name: 'Fisheye',
  render: () => createContainer({ id: 'graph-fisheye' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-fisheye')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    // Data is content — it rides on the layer via `options.initData`.
    const graph = new GraphLayer({ id: 'graph', options: { initData: flareAsGraph() } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new HoverActivateBehaviour({ id: 'hover', targetLayerId: 'graph' }));
    canvas.behaviours.register(new TextLODBehaviour({ id: 'text-lod', targetLayerId: 'graph' }));
    // Cluster colour = the class's top-level flare package (`data.group`).
    canvas.behaviours.register(new ColorByBehaviour({ id: 'color', targetLayerId: 'graph' }));
    // Kept so the panel can read back what Alt/Shift+wheel changed in the canvas.
    const fisheye = new FisheyeBehaviour({ id: 'fisheye', targetLayerId: 'graph' });
    canvas.behaviours.register(fisheye);
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));

    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);
    onStoryTeardown(() => forceLayout.stop());

    const canvasOptions = {
      layers: {
        bg: {},
        graph: {
          // Both flare node types (`package`, `class`) are small dots labelled by
          // their name — a type binding, so the label stays data, not a resolver.
          nodeStructureTemplates: {
            dot: { name: 'dot', kind: 'simple', shape: { kind: 'circle', radius: 5 }, slots: { label: true } }
          },
          nodeStylingTemplates: {
            dot: { name: 'dot', strokeRole: 'stroke', label: { colorRole: 'foreground', fontSize: 10, placement: 'bottom' } }
          },
          nodeTypes: {
            package: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } },
            class: { structure: 'dot', styling: 'dot', bindings: { label: 'data.name' } }
          },
          edge: { style: { strokeWidth: 0.75, arrowTargetShape: 'none' } }
        }
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        hover: { enabled: true },
        color: { enabled: true, nodeValueKey: 'data.group', colorEdges: false },
        // Labels only from 1.8× up — the overview is dots until the lens passes.
        'text-lod': { enabled: true, minZoom: 1.8 },
        // Every option from FisheyeBehaviourOptions exposed here.
        fisheye: {
          enabled: true,
          trigger: 'pointermove',
          radius: 140,
          minRadius: 20,
          maxRadius: null as number | null,
          distortion: 2,
          minDistortion: 0,
          maxDistortion: 5,
          nodeScale: 1.8,
          showLabels: true,
          radiusWheelModifier: 'alt' as string | null,
          distortionWheelModifier: 'shift' as string | null,
          lensStrokeColor: 0x64748b,
          lensStrokeWidth: 2,
          lensFillColor: 0x94a3b8,
          lensFillAlpha: 0.08
        },
        theme: { enabled: true, mode: 'document' }
      },
      layouts: {
        force: { link: { distance: 26 }, charge: { strength: -30 }, center: { x: 0, y: 0 } }
      },
      activeLayout: 'force'
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    const lens = canvasOptions.behaviours.fisheye;
    const push = (patch: Record<string, unknown>): void => canvas.update({ behaviours: { fisheye: patch } });
    const textLod = canvasOptions.behaviours['text-lod'];

    const gui = new GUI({ title: 'Fisheye' });
    onStoryTeardown(() => gui.destroy());
    gui.add(lens, 'enabled').name('lens on').onChange((v: boolean) => push({ enabled: v }));
    gui.add(lens, 'trigger', ['pointermove', 'click', 'drag']).onChange((v: string) => push({ trigger: v }));
    // Radius and distortion also change from the canvas (Alt/Shift + scroll), so
    // these two read the behaviour's live options back and `listen()` for them.
    const live = {
      get radius(): number { return fisheye.options.radius; },
      set radius(v: number) { lens.radius = v; push({ radius: v }); },
      get distortion(): number { return fisheye.options.distortion; },
      set distortion(v: number) { lens.distortion = v; push({ distortion: v }); }
    };
    gui.add(live, 'radius', 20, 400, 1).name('radius (px)').listen();
    gui.add(live, 'distortion', 0, 5, 0.1).listen();
    gui.add(lens, 'nodeScale', 1, 4, 0.1).name('node scale').onChange((v: number) => push({ nodeScale: v }));
    gui.add(lens, 'showLabels').name('labels in lens').onChange((v: boolean) => push({ showLabels: v }));

    const modifiers = { None: null, Alt: 'alt', Shift: 'shift', Ctrl: 'ctrl', Meta: 'meta' };
    const wheel = gui.addFolder('Wheel adjust').close();
    wheel.add(lens, 'radiusWheelModifier', modifiers).name('radius key')
      .onChange((v: string | null) => push({ radiusWheelModifier: v }));
    wheel.add(lens, 'distortionWheelModifier', modifiers).name('distortion key')
      .onChange((v: string | null) => push({ distortionWheelModifier: v }));
    wheel.add(lens, 'minRadius', 0, 200, 5).name('min radius').onChange((v: number) => push({ minRadius: v }));
    const bounds = {
      get maxRadius(): number { return lens.maxRadius ?? 0; },
      set maxRadius(v: number) { lens.maxRadius = v > 0 ? v : null; push({ maxRadius: lens.maxRadius }); }
    };
    wheel.add(bounds, 'maxRadius', 0, 600, 10).name('max radius (0 = auto)');
    wheel.add(lens, 'minDistortion', 0, 5, 0.1).name('min distortion').onChange((v: number) => push({ minDistortion: v }));
    wheel.add(lens, 'maxDistortion', 0, 10, 0.1).name('max distortion').onChange((v: number) => push({ maxDistortion: v }));

    const ring = gui.addFolder('Lens ring').close();
    ring.addColor(lens, 'lensStrokeColor').name('ring colour').onChange((v: number) => push({ lensStrokeColor: v }));
    ring.add(lens, 'lensStrokeWidth', 0, 8, 0.5).name('ring width').onChange((v: number) => push({ lensStrokeWidth: v }));
    ring.addColor(lens, 'lensFillColor').name('fill colour').onChange((v: number) => push({ lensFillColor: v }));
    ring.add(lens, 'lensFillAlpha', 0, 1, 0.01).name('fill alpha').onChange((v: number) => push({ lensFillAlpha: v }));

    gui.add(textLod, 'enabled').name('text LOD')
      .onChange((v: boolean) => canvas.update({ behaviours: { 'text-lod': { enabled: v } } }));
    gui.add({ fit: () => canvas.fitView(60) }, 'fit').name('Fit to content');
  }
};
