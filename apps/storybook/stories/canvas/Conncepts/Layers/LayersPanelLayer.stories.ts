import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas,
  DevInfoLayer,
  DragPanBehaviour,
  LayersPanelLayer,
  WheelZoomBehaviour,
  WorldLayer,
  type IElementRenderer
} from '@invana/canvas';
import type { LayersPanelCorner } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Layers/LayersPanelLayer' };
export default meta;
type Story = StoryObj;

export const LayersPanelLayerStory: Story = {
  name: 'LayersPanelLayer',
  render: () => createContainer({ id: 'cvs-layers-panel-layer' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: IElementRenderer;
      protected createState() {
        return {};
      }
      protected onMount() {
        this.renderer = this.surface.primitives;
      }
      hitTest() {
        return null;
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-layers-panel-layer')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    // Three pre-populated content layers so the panel has rows on first load.
    const shapes = new RenderLayer({ id: 'shapes', options: {} });
    canvas.layers.add(shapes);
    shapes.renderer.addShape('demo-circle', {
      kind: 'circle',
      x: 0,
      y: 0,
      radius: 60,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1d4ed8, width: 2 }
    });
    shapes.renderer.addShape('demo-rect', {
      kind: 'rect',
      x: 140,
      y: -40,
      width: 120,
      height: 80,
      fill: { kind: 'solid', color: 0x10b981, alpha: 0.9 },
      stroke: { color: 0x047857, width: 2 }
    });

    const accents = new RenderLayer({ id: 'accents', options: {} });
    canvas.layers.add(accents);
    accents.renderer.addShape('accent-circle', {
      kind: 'circle',
      x: -140,
      y: 40,
      radius: 45,
      fill: { kind: 'solid', color: 0xf59e0b, alpha: 0.9 },
      stroke: { color: 0xb45309, width: 2 }
    });

    const annotations = new RenderLayer({ id: 'annotations', options: {} });
    canvas.layers.add(annotations);
    annotations.renderer.addShape('annotation-rect', {
      kind: 'rect',
      x: -40,
      y: 110,
      width: 200,
      height: 40,
      fill: { kind: 'solid', color: 0xa855f7, alpha: 0.4 },
      stroke: { color: 0x7e22ce, width: 1 }
    });

    const devInfo = new DevInfoLayer({ corner: 'bottom-left' });
    canvas.layers.add(devInfo);

    const panel = new LayersPanelLayer({
      corner: 'top-left',
      enabled: true,
      fontSize: 11,
      opacity: 0.92,
      backgroundColor: 'rgba(10,10,10,0.82)',
      textColor: '#c8d3e0',
      accentColor: '#4fc3f7',
      hideIds: []
    });
    canvas.layers.add(panel);

    canvas.camera.fitContent(shapes.getBounds(), 100);

    // ── lil-gui: every public option from LayersPanelLayerOptions ───────────
    const settings = {
      enabled: true,
      corner: 'top-left' as LayersPanelCorner,
      fontSize: 11,
      opacity: 0.92,
      backgroundColor: '#0a0a0a',
      textColor: '#c8d3e0',
      accentColor: '#4fc3f7'
    };

    // hideIds is exposed as a checkbox per pre-known layer id. Flipping a
    // toggle rebuilds the array and pushes it to the panel.
    const hideToggles: Record<string, boolean> = {
      shapes: false,
      accents: false,
      annotations: false,
      'dev-info': false
    };
    const applyHideIds = () => {
      const ids = Object.keys(hideToggles).filter((k) => hideToggles[k]);
      panel.setOptions({ hideIds: ids });
    };

    const gui = new GUI({ title: 'LayersPanelLayer' });
    onStoryTeardown(() => gui.destroy());

    const fGeneral = gui.addFolder('General');
    fGeneral.add(settings, 'enabled').onChange((v: boolean) => panel.setEnabled(v));
    fGeneral
      .add(settings, 'corner', ['top-left', 'top-right', 'bottom-left', 'bottom-right'])
      .onChange((v: LayersPanelCorner) => panel.setOptions({ corner: v }));

    const fAppearance = gui.addFolder('Appearance');
    fAppearance
      .add(settings, 'fontSize', 9, 18, 1)
      .onChange((v: number) => panel.setOptions({ fontSize: v }));
    fAppearance
      .add(settings, 'opacity', 0.2, 1, 0.01)
      .onChange((v: number) => panel.setOptions({ opacity: v }));
    fAppearance
      .addColor(settings, 'backgroundColor')
      .onChange((v: string) => panel.setOptions({ backgroundColor: v }));
    fAppearance
      .addColor(settings, 'textColor')
      .onChange((v: string) => panel.setOptions({ textColor: v }));
    fAppearance
      .addColor(settings, 'accentColor')
      .onChange((v: string) => panel.setOptions({ accentColor: v }));

    const fHide = gui.addFolder('hideIds (hide rows in panel)');
    for (const id of Object.keys(hideToggles)) {
      fHide.add(hideToggles, id).onChange(applyHideIds);
    }

    // Demo-layer add/remove so the user can watch rows appear/disappear
    // driven by `'scene:layer:add'` / `'scene:layer:remove'`.
    let demoCounter = 0;
    const demoLayers: string[] = [];
    const actions = {
      addDemoLayer: () => {
        demoCounter += 1;
        const id = `demo-layer-${demoCounter}`;
        canvas.layers.add(new RenderLayer({ id, options: {} }));
        demoLayers.push(id);
      },
      removeDemoLayer: () => {
        const id = demoLayers.pop();
        if (id) canvas.layers.remove(id);
      }
    };
    const fDemo = gui.addFolder('Demo layers');
    fDemo.add(actions, 'addDemoLayer').name('+ add demo layer');
    fDemo.add(actions, 'removeDemoLayer').name('− remove demo layer');
  }
};
