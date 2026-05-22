import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/concepts/Connectors/Anchors/EdgePort' };
export default meta;
type Story = StoryObj;

/**
 * The `edge-port` anchor attaches the endpoint to a specific point on a
 * named face of the shape's bounding box. The face is picked by
 * `opts.side` (`'left' | 'right' | 'top' | 'bottom'`); the displacement
 * along that face is `opts.offset` (vertical for L/R faces, horizontal for
 * T/B). Outward tangent = face normal, so orth-style routers keep working.
 *
 * Use this when many connectors share a node but each must attach at a
 * specific location (Sankey ribbons stacking on a rect's right face, ER
 * tables with per-row ports, BPMN sequence flows, …). Drag the rects in
 * the gui or with the mouse to see the ports follow.
 */
export const EdgePort: Story = {
  render: () => createContainer({ id: 'cvs-prim-anchor-edge-port' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-anchor-edge-port')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'anchor-edge-port', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer,
    }));

    const settings = {
      // three ports on the source's right face, three on the target's left
      offsetTop: -40,
      offsetMid: 0,
      offsetBot: 40,
      strokeColor: 0x6366f1,
      strokeWidth: 14,
      strokeAlpha: 0.55,
    };

    layer.renderer.addShape('source', {
      kind: 'rect', x: -240, y: -60, width: 30, height: 120,
      fill: { kind: 'solid', color: 0x1f2937 },
    });
    layer.renderer.addShape('target', {
      kind: 'rect', x: 210, y: -60, width: 30, height: 120,
      fill: { kind: 'solid', color: 0x1f2937 },
    });

    const draw = (): void => {
      for (const id of ['l-top', 'l-mid', 'l-bot']) {
        if (layer.renderer.hasConnector(id)) layer.renderer.removeConnector(id);
      }
      const make = (id: string, offset: number): void => {
        layer.renderer.addConnector(id, {
          kind: 'connector',
          router: 'straight',
          pathStyle: 'bump-horizontal',
          source: {
            kind: 'shape',
            shapeId: 'source',
            anchor: { name: 'edge-port', opts: { side: 'right', offset } },
          },
          target: {
            kind: 'shape',
            shapeId: 'target',
            anchor: { name: 'edge-port', opts: { side: 'left', offset } },
          },
          stroke: { color: settings.strokeColor, width: settings.strokeWidth },
          alpha: settings.strokeAlpha,
          targetMarker: arrowMarkerSpec({ lengthScale: 4, widthScale: 3, fill: settings.strokeColor }),
        });
      };
      make('l-top', settings.offsetTop);
      make('l-mid', settings.offsetMid);
      make('l-bot', settings.offsetBot);
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'edge-port' });
    onStoryTeardown(() => gui.destroy());

    const offsetsFolder = gui.addFolder('port offsets');
    offsetsFolder.add(settings, 'offsetTop', -60, 60, 1).onChange(draw);
    offsetsFolder.add(settings, 'offsetMid', -60, 60, 1).onChange(draw);
    offsetsFolder.add(settings, 'offsetBot', -60, 60, 1).onChange(draw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeAlpha', 0, 1, 0.01).onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 1, 40, 1).onChange(draw);
  },
};
