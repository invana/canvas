import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type BadgeOrigin,
  type NodeBadge,
  type NodeData,
  type NodeDecorationSpec,
} from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Badges/Playground' };
export default meta;
type Story = StoryObj;

type NamedPlacement =
  | 'top-left' | 'top' | 'top-right'
  | 'left' | 'right'
  | 'bottom-left' | 'bottom' | 'bottom-right';

type OriginChoice = 'default (mirror)' | BadgeOrigin;
type DecorationChoice = 'none' | 'glow' | 'ring' | 'marching-ants' | 'pulse-ring';
type EffectChoice = 'none' | 'shake' | 'breathing';

/**
 * Every {@link NodeBadge} option live-wired to a lil-gui knob. Two hosts
 * share one configured badge so changes apply to both instances in
 * parallel — the second host proves the spec is reusable / data-driven,
 * not glued to a specific node id.
 *
 * Shape is fixed to `circle` (per the brief — focus on the option surface,
 * not the shape catalogue; see `Shapes` for the shape-kind matrix).
 * Everything else is in scope:
 *
 * - `placement` (8 named anchors)
 * - `origin` (`'default (mirror)'` / `'center'` / 8 named badge-corner points)
 * - paint: `fill`, `alpha`, `strokeColor`, `strokeWidth`, `radius`
 * - content: `icon` (a checkmark glyph toggle), `labelText` + label paint
 * - geometry: `offsetX`, `offsetY`, `zIndex`
 * - composition: `decoration` (4 kinds) and `effect` (2 kinds)
 */
export const Playground: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges-playground' }),

  play: async ({ canvasElement }) => {
    const placements: NamedPlacement[] = [
      'top-left', 'top', 'top-right',
      'left', 'right',
      'bottom-left', 'bottom', 'bottom-right',
    ];
    const origins: OriginChoice[] = [
      'default (mirror)', 'center',
      'top-left', 'top', 'top-right',
      'left', 'right',
      'bottom-left', 'bottom', 'bottom-right',
    ];
    const decorations: DecorationChoice[] = ['none', 'glow', 'ring', 'marching-ants', 'pulse-ring'];
    const effects: EffectChoice[] = ['none', 'shake', 'breathing'];

    const s = {
      placement: 'top-right' as NamedPlacement,
      origin: 'center' as OriginChoice,
      radius: 11,
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
      decoration: 'none' as DecorationChoice,
      effect: 'none' as EffectChoice,
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

    const buildBadge = (): NodeBadge => ({
      id: 'demo',
      placement: s.placement,
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
      ...(buildDecoration(s.decoration) ? { decorations: buildDecoration(s.decoration)! } : {}),
      ...(buildEffects(s.effect) ? { effects: buildEffects(s.effect)! } : {}),
    });

    const baseStyle = (label: string) => ({
      shape: { kind: 'circle' as const, radius: 36 },
      bgFill: 0x60a5fa,
      bgStrokeColor: 0xffffff,
      bgStrokeWidth: 1,
      labelText: label,
      labelColor: 0xffffff,
      labelFontSize: 11,
      labelPlacement: 'center' as const,
    });

    const nodes: NodeData[] = [
      { id: 'host-a', position: { x: -120, y: 0 }, style: { ...baseStyle('host-a'), badges: [buildBadge()] } },
      { id: 'host-b', position: { x:  120, y: 0 }, style: { ...baseStyle('host-b'), badges: [buildBadge()] } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-nodes-badges-playground',
    )!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({ id: 'graph', options: {} });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 120);

    const apply = (): void => {
      const badge = buildBadge();
      for (const n of nodes) {
        graph.store.updateNode(n.id, { style: { ...baseStyle(n.id), badges: [badge] } });
      }
    };

    const gui = new GUI({ title: 'Node Badge Playground' });
    onStoryTeardown(() => gui.destroy());

    const anchor = gui.addFolder('Anchor');
    anchor.add(s, 'placement', placements as unknown as string[]).onChange(apply);
    anchor.add(s, 'origin', origins as unknown as string[]).onChange(apply);
    anchor.add(s, 'offsetX', -40, 40, 1).onChange(apply);
    anchor.add(s, 'offsetY', -40, 40, 1).onChange(apply);
    anchor.add(s, 'zIndex', -5, 5, 1).onChange(apply);

    const paint = gui.addFolder('Paint');
    paint.add(s, 'radius', 4, 24, 0.5).onChange(apply);
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
