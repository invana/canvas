import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type BadgeOrigin,
  type EdgeBadge,
  type EdgeData,
  type NodeBadge,
  type NodeData,
  type NodeDecorationSpec,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Badges/Playground' };
export default meta;
type Story = StoryObj;

type OriginChoice = 'default (mirror)' | BadgeOrigin;
type NamedEdgePlacement = 'start' | 'middle' | 'end' | 'raw-t';
type DecorationChoice = 'none' | 'glow' | 'ring' | 'marching-ants' | 'pulse-ring';
type EffectChoice = 'none' | 'shake' | 'breathing';
type PathTypeChoice = 'straight' | 'bezier' | 'orth';

/**
 * Every {@link EdgeBadge} option live-wired to a lil-gui knob. Two nodes
 * connected by one edge — the edge carries a single configured badge that
 * updates on every panel change. Drag the target node to swing the path
 * through different orientations (especially relevant for `autoRotate` /
 * `keepUpright`).
 *
 * Shape is fixed to `circle` (see `Shapes` for the shape-kind matrix).
 * Everything else is in scope:
 *
 * - `placement` (`'start'` / `'middle'` / `'end'` + raw `t` slider)
 * - `origin` (`'default (mirror)'` / `'center'` / 8 named badge-corner points)
 * - paint: `fill`, `alpha`, `strokeColor`, `strokeWidth`, `radius`
 * - content: `icon` (checkmark glyph), `labelText` + label paint
 * - geometry: `offsetX`, `offsetY`, `zIndex`
 * - path-only: `pathOffset` (along tangent), `autoRotate`, `keepUpright`
 * - composition: `decoration` (4 kinds), `effect` (2 kinds)
 *
 * Also exposes `edge.pathType` so you can see badge anchoring against
 * different routers without leaving the playground.
 */
export const Playground: Story = {
  render: () => createContainer({ id: 'graph-edges-badges-playground' }),

  play: async ({ canvasElement }) => {
    const edgePlacements: NamedEdgePlacement[] = ['start', 'middle', 'end', 'raw-t'];
    const origins: OriginChoice[] = [
      'default (mirror)', 'center',
      'top-left', 'top', 'top-right',
      'left', 'right',
      'bottom-left', 'bottom', 'bottom-right',
    ];
    const decorations: DecorationChoice[] = ['none', 'glow', 'ring', 'marching-ants', 'pulse-ring'];
    const effects: EffectChoice[] = ['none', 'shake', 'breathing'];
    const pathTypes: PathTypeChoice[] = ['straight', 'bezier', 'orth'];

    const s = {
      placement: 'middle' as NamedEdgePlacement,
      rawT: 0.5,
      origin: 'center' as OriginChoice,
      radius: 12,
      fill: 0xdc2626,
      alpha: 1,
      strokeColor: 0xffffff,
      strokeWidth: 2,
      showIcon: false,
      labelText: '',
      labelColor: 0xffffff,
      labelFontSize: 11,
      offsetX: 0,
      offsetY: 0,
      zIndex: 0,
      pathOffset: 0,
      autoRotate: false,
      keepUpright: true,
      decoration: 'none' as DecorationChoice,
      effect: 'none' as EffectChoice,
      pathType: 'straight' as PathTypeChoice,
    };

    const buildDecoration = (kind: DecorationChoice): readonly NodeDecorationSpec[] | undefined => {
      switch (kind) {
        case 'none':           return undefined;
        case 'glow':           return [{ kind: 'glow', color: 0xf97316, strokeWidth: 12, layers: 6, innerAlpha: 0.6 }];
        case 'ring':           return [{ kind: 'ring', color: 0xfacc15, width: 2, gap: 3 }];
        case 'marching-ants':  return [{ kind: 'marching-ants', color: 0x0f172a, strokeWidth: 1.5, dashLength: 4, gapLength: 3, speedPxPerSec: 18 }];
        case 'pulse-ring':     return [{ kind: 'pulse-ring', color: 0xdc2626, periodMs: 1200, maxRadius: 22 }];
      }
    };
    const buildEffects = (kind: EffectChoice): NodeBadge['effects'] | undefined => {
      switch (kind) {
        case 'none':       return undefined;
        case 'shake':      return { shake: { amplitude: 1.5, frequencyHz: 8 } };
        case 'breathing':  return { breathing: { amplitude: 0.25, frequencyHz: 1.2 } };
      }
    };

    const buildBadge = (): EdgeBadge => ({
      id: 'demo',
      placement: s.placement === 'raw-t' ? s.rawT : s.placement,
      ...(s.origin !== 'default (mirror)' ? { origin: s.origin as BadgeOrigin } : {}),
      shape: { kind: 'circle', radius: s.radius },
      fill: s.fill,
      alpha: s.alpha,
      strokeColor: s.strokeColor,
      strokeWidth: s.strokeWidth,
      ...(s.showIcon
        ? {
            icon: {
              kind: 'glyph' as const,
              char: '✓',
              fontFamily: 'sans-serif',
              fontWeight: 700,
              color: 0xffffff,
              sizeRatio: 0.7,
            },
          }
        : {}),
      ...(s.labelText !== ''
        ? { labelText: s.labelText, labelColor: s.labelColor, labelFontSize: s.labelFontSize }
        : {}),
      offsetX: s.offsetX,
      offsetY: s.offsetY,
      zIndex: s.zIndex,
      pathOffset: s.pathOffset,
      autoRotate: s.autoRotate,
      keepUpright: s.keepUpright,
      ...(buildDecoration(s.decoration) ? { decorations: buildDecoration(s.decoration)! } : {}),
      ...(buildEffects(s.effect) ? { effects: buildEffects(s.effect)! } : {}),
    });

    const buildEdge = (): EdgeData => ({
      id: 'e',
      source: 'src',
      target: 'tgt',
      style: {
        shape: { pathType: s.pathType },
        badges: [buildBadge()],
      },
    });

    const nodes: NodeData[] = [
      {
        id: 'src',
        position: { x: -240, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x60a5fa,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: 'source',
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'left',
          labelOffsetX: -10,
        },
      },
      {
        id: 'tgt',
        position: { x: 240, y: 80 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x34d399,
          bgStrokeColor: 0xffffff,
          bgStrokeWidth: 1,
          labelText: 'target (draggable)',
          labelColor: 0x0f172a,
          labelFontSize: 11,
          labelPlacement: 'right',
          labelOffsetX: 10,
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-edges-badges-playground',
    )!;

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: [buildEdge()] } },
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));

    const canvasOptions = {
      layers: {
        graph: { edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 1.5, arrowTargetShape: 'triangle' } } },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true }, 'drag-node': { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 100);

    const apply = (): void => {
      graph.store.updateEdge('e', { style: buildEdge().style });
    };

    const gui = new GUI({ title: 'Edge Badge Playground' });
    onStoryTeardown(() => gui.destroy());

    const anchor = gui.addFolder('Anchor');
    anchor.add(s, 'placement', edgePlacements as unknown as string[]).onChange(apply);
    anchor.add(s, 'rawT', 0, 1, 0.01).name('rawT (placement=raw-t)').onChange(apply);
    anchor.add(s, 'origin', origins as unknown as string[]).onChange(apply);
    anchor.add(s, 'offsetX', -40, 40, 1).onChange(apply);
    anchor.add(s, 'offsetY', -40, 40, 1).onChange(apply);
    anchor.add(s, 'zIndex', -5, 5, 1).onChange(apply);

    const path = gui.addFolder('Path');
    path.add(s, 'pathType', pathTypes as unknown as string[]).onChange(apply);
    path.add(s, 'pathOffset', -120, 120, 1).onChange(apply);
    path.add(s, 'autoRotate').onChange(apply);
    path.add(s, 'keepUpright').onChange(apply);

    const paint = gui.addFolder('Paint');
    paint.add(s, 'radius', 4, 28, 0.5).onChange(apply);
    paint.addColor(s, 'fill').onChange(apply);
    paint.add(s, 'alpha', 0, 1, 0.05).onChange(apply);
    paint.addColor(s, 'strokeColor').onChange(apply);
    paint.add(s, 'strokeWidth', 0, 6, 0.5).onChange(apply);

    const content = gui.addFolder('Content');
    content.add(s, 'showIcon').name('icon (checkmark)').onChange(apply);
    content.add(s, 'labelText').onChange(apply);
    content.addColor(s, 'labelColor').onChange(apply);
    content.add(s, 'labelFontSize', 6, 24, 1).onChange(apply);

    const composition = gui.addFolder('Composition');
    composition.add(s, 'decoration', decorations as unknown as string[]).onChange(apply);
    composition.add(s, 'effect', effects as unknown as string[]).onChange(apply);
  },
};
