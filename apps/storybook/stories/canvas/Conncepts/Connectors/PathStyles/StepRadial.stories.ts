import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  Canvas, DragPanBehaviour, DragShapeBehaviour, WheelZoomBehaviour,
  WorldLayer, PrimitivesRenderer, arrowMarkerSpec,
} from '@invana/canvas';
import type { CanvasContext } from '@invana/canvas';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/Concepts/Connectors/PathStyles/StepRadial' };
export default meta;
type Story = StoryObj;

/**
 * The `step-radial` pathStyle draws a two-segment **radial elbow** — a
 * constant-radius arc at the source's distance from the polar origin
 * (sweeping to the target's angle), followed by a straight radial line out
 * to the target. Matches d3's `linkStep` helper used in the canonical
 * Tree of Life example.
 *
 * Pair with `router: 'straight'` and `anchor: 'center'` so the arc launches
 * from the true centre angle. The polar origin is tweakable below — drag
 * the shapes to see how angles / radii are recomputed against the configured
 * centre.
 */
export const StepRadial: Story = {
  render: () => createContainer({ id: 'cvs-prim-pathstyle-step-radial' }),

  play: async ({ canvasElement }) => {
    class RenderLayer extends WorldLayer {
      renderer!: PrimitivesRenderer;
      protected createState() { return {}; }
      protected onMount(ctx: CanvasContext) {
        this.renderer = new PrimitivesRenderer({ container: this.container, camera: ctx.camera });
      }
      hitTest() { return null; }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#cvs-prim-pathstyle-step-radial')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const layer = new RenderLayer({ id: 'pathstyle-step-radial', options: {} });
    canvas.layers.add(layer);

    canvas.behaviours.register(new DragShapeBehaviour({
      id: 'drag-shape',
      enabled: true,
      renderer: layer.renderer,
    }));

    const settings = {
      // pathStyle (step-radial)
      originX: 0,
      originY: 0,
      // anchor — `center` is the radial-correct default
      sourceAnchor: 'center' as 'center' | 'boundary' | 'perpendicular',
      targetAnchor: 'center' as 'center' | 'boundary' | 'perpendicular',
      sourcePadding: 0,
      targetPadding: 0,
      // stroke
      strokeColor: 0x111827,
      strokeWidth: 2,
      // marker
      showSourceMarker: false,
      showTargetMarker: false,
      markerLengthScale: 4,
      markerWidthScale: 3,
    };

    // Default placement mimics a tree-of-life parent → leaf edge: source
    // (parent) on an inner radius, target (leaf) much further out at a small
    // angular offset. Short arc at the inner radius, long radial spoke out
    // to the leaf — the characteristic "elbow" reads at first glance.
    const SRC_R = 180;
    const SRC_ANGLE = (10 * Math.PI) / 180; // 10°
    const TGT_R = 420;
    const TGT_ANGLE = (35 * Math.PI) / 180; // 35°
    layer.renderer.addShape('a', {
      kind: 'circle', x: SRC_R * Math.cos(SRC_ANGLE), y: SRC_R * Math.sin(SRC_ANGLE), radius: 14,
      fill: { kind: 'solid', color: 0x4f9cf9 },
      stroke: { color: 0x1e40af, width: 2 },
    });
    layer.renderer.addShape('b', {
      kind: 'circle', x: TGT_R * Math.cos(TGT_ANGLE), y: TGT_R * Math.sin(TGT_ANGLE), radius: 14,
      fill: { kind: 'solid', color: 0x10b981 },
      stroke: { color: 0x047857, width: 2 },
    });
    // Origin marker — visualises the polar centre the pathStyle measures
    // angles / radii against. Updated in `draw` so it tracks the gui.
    layer.renderer.addShape('origin', {
      kind: 'circle', x: 0, y: 0, radius: 4,
      fill: { kind: 'solid', color: 0xef4444 },
    });

    const draw = (): void => {
      layer.renderer.updateShape('origin', { x: settings.originX, y: settings.originY });
      if (layer.renderer.hasConnector('curve')) layer.renderer.removeConnector('curve');
      layer.renderer.addConnector('curve', {
        kind: 'connector',
        router: 'straight',
        pathStyle: 'step-radial',
        pathStyleOpts: { origin: { x: settings.originX, y: settings.originY } },
        source: { kind: 'shape', shapeId: 'a', anchor: settings.sourceAnchor, padding: settings.sourcePadding },
        target: { kind: 'shape', shapeId: 'b', anchor: settings.targetAnchor, padding: settings.targetPadding },
        stroke: { color: settings.strokeColor, width: settings.strokeWidth },
        sourceMarker: settings.showSourceMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined,
        targetMarker: settings.showTargetMarker
          ? arrowMarkerSpec({ lengthScale: settings.markerLengthScale, widthScale: settings.markerWidthScale, fill: settings.strokeColor })
          : undefined,
      });
    };

    draw();
    canvas.camera.fitContent(layer.getBounds(), 100);

    const gui = new GUI({ title: 'step-radial pathStyle' });
    onStoryTeardown(() => gui.destroy());

    const pathStyleFolder = gui.addFolder('pathStyle (step-radial)');
    pathStyleFolder.add(settings, 'originX', -400, 400, 1).name('origin.x').onChange(draw);
    pathStyleFolder.add(settings, 'originY', -400, 400, 1).name('origin.y').onChange(draw);

    const anchorFolder = gui.addFolder('anchor').close();
    anchorFolder.add(settings, 'sourceAnchor', ['center', 'boundary', 'perpendicular']).name('source').onChange(draw);
    anchorFolder.add(settings, 'targetAnchor', ['center', 'boundary', 'perpendicular']).name('target').onChange(draw);
    anchorFolder.add(settings, 'sourcePadding', -20, 60, 1).name('source.padding').onChange(draw);
    anchorFolder.add(settings, 'targetPadding', -20, 60, 1).name('target.padding').onChange(draw);

    const strokeFolder = gui.addFolder('stroke').close();
    strokeFolder.addColor(settings, 'strokeColor').onChange(draw);
    strokeFolder.add(settings, 'strokeWidth', 0.5, 10, 0.5).onChange(draw);

    const markerFolder = gui.addFolder('marker').close();
    markerFolder.add(settings, 'showSourceMarker').onChange(draw);
    markerFolder.add(settings, 'showTargetMarker').onChange(draw);
    markerFolder.add(settings, 'markerLengthScale', 0, 12, 0.5).onChange(draw);
    markerFolder.add(settings, 'markerWidthScale', 0, 10, 0.5).onChange(draw);
  },
};
