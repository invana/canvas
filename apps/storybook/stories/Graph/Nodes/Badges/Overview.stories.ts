import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Badges/Overview' };
export default meta;
type Story = StoryObj;

/**
 * Graph-level node badges (`NodeStyle.badges`). A badge is rendered as a
 * full-fidelity shape: any registered `NodeShapeOptions` kind as the plate,
 * optional `icon` content, optional short `labelText`, plus nested
 * `decorations` (glow / ring / pulse-ring / …) and `effects` (`shake`,
 * `breathing`) that compose exactly the way they would on a node body.
 *
 * Five hosts, one per surface area:
 *
 * 1. **Plain dot** — minimal red circle pinned to the top-right (notification).
 * 2. **Count chip** — rounded-rect with `labelText: "3"` (typical badge).
 * 3. **Icon badge** — circular plate with a glyph inset (kind: 'glyph').
 * 4. **Decorated badge** — circular plate carrying a `glow` decoration.
 * 5. **Animated badge** — circular plate carrying a `breathing` effect.
 *
 * The lil-gui panel flips each badge's `placement` so you can see the
 * eight-anchor system at work without rebuilding the graph.
 */
export const Badges: Story = {
  render: () => createContainer({ id: 'graph-nodes-badges' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'plain',
        position: { x: -300, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 30 },
          bgFill: 0x60a5fa,
          labelText: 'Plain dot',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
          badges: [
            {
              id: 'dot',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'circle', radius: 7 },
              fill: 0xef4444,
              strokeColor: 0xffffff,
              strokeWidth: 2,
            },
          ],
        },
      },
      {
        id: 'count',
        position: { x: -150, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 30 },
          bgFill: 0x34d399,
          labelText: 'Count chip',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
          badges: [
            {
              id: 'count',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'rect', width: 22, height: 18, cornerRadius: 9 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              labelText: '3',
              labelColor: 0xffffff,
              labelFontSize: 12,
            },
          ],
        },
      },
      {
        id: 'icon',
        position: { x: 0, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 30 },
          bgFill: 0xf59e0b,
          labelText: 'Icon badge',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
          badges: [
            {
              id: 'verified',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'circle', radius: 11 },
              fill: 0x1d4ed8,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              icon: {
                kind: 'glyph',
                char: '✓',
                fontFamily: 'sans-serif',
                fontWeight: 700,
                color: 0xffffff,
                sizeRatio: 0.7,
              },
            },
          ],
        },
      },
      {
        id: 'decorated',
        position: { x: 150, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 30 },
          bgFill: 0xa78bfa,
          labelText: 'With glow',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
          badges: [
            {
              id: 'hot',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'circle', radius: 9 },
              fill: 0xf97316,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              decorations: [
                {
                  kind: 'glow',
                  color: 0xf97316,
                  strokeWidth: 12,
                  layers: 6,
                  innerAlpha: 0.6,
                },
              ],
            },
          ],
        },
      },
      {
        id: 'animated',
        position: { x: 300, y: 0 },
        style: {
          shape: { kind: 'circle', radius: 30 },
          bgFill: 0xf472b6,
          labelText: 'Breathing',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
          badges: [
            {
              id: 'pulse',
              placement: 'top-right',
              origin: 'center',
              shape: { kind: 'circle', radius: 9 },
              fill: 0xdc2626,
              strokeColor: 0xffffff,
              strokeWidth: 1.5,
              effects: {
                breathing: { amplitude: 0.35, frequencyHz: 1.2 },
              },
            },
          ],
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nodes-badges')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            labelColor: 0x0f172a,
            labelFontSize: 12,
            labelFontWeight: 500,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });

    canvas.camera.fitContent(graph.getBounds(), 80);

    const placements = [
      'top-right', 'top-left', 'bottom-right', 'bottom-left',
      'top', 'bottom', 'left', 'right',
    ] as const;
    const origins = ['center', 'mirror'] as const;

    const settings = {
      placement: 'top-right' as typeof placements[number],
      origin: 'center' as typeof origins[number],
    };

    const apply = (): void => {
      // Re-emit each node's badges with the live placement / origin choice.
      // `GraphStore.updateNode` replaces `style` wholesale, so the prior
      // style is spread to preserve every unpatched field.
      for (const node of nodes) {
        const badge = node.style!.badges![0]!;
        graph.store.updateNode(node.id, {
          style: {
            ...node.style!,
            badges: [
              {
                ...badge,
                placement: settings.placement,
                origin: settings.origin === 'center' ? 'center' : undefined,
              },
            ],
          },
        });
      }
    };

    const gui = new GUI({ title: 'Node Badges' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'placement', placements as unknown as string[]).onChange(apply);
    gui
      .add(settings, 'origin', origins as unknown as string[])
      .name('origin (center = half-overhang, mirror = outside)')
      .onChange(apply);
    gui
      .add(
        { fit: () => canvas.camera.fitContent(graph.getBounds(), 80) },
        'fit',
      )
      .name('Fit to content');
  },
};
