import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphLayer,
  type CanonicalStateName,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Types/Rectangle' };
export default meta;
type Story = StoryObj;

/**
 * Catalogue story for the **rectangle** node shape (`shape.kind: 'rect'`).
 *
 * Draws a 3×3 grid of rect nodes — one cell per standard appearance:
 * the resting `default` plus the eight canonical interaction states auto-
 * registered by `GraphLayer` (`hover`, `selected`, `active`, `highlighted`,
 * `dimmed`, `disabled`, `error`, `focused`). State is supplied data-driven
 * via the `states` field on each `NodeData`.
 */
export const Rectangle: Story = {
  render: () => createContainer({ id: 'graph-node-types-rectangle' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-rectangle')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    // 3×3 grid. Cell pitch 240 × 180. Origin at (0, 0).
    const nodes: NodeData<TileData>[] = [
      { id: 'n-default',     position: { x: -240, y: -180 }, data: { state: 'default'     } },
      { id: 'n-hover',       position: { x:    0, y: -180 }, data: { state: 'hover'       }, states: ['hover']       },
      { id: 'n-selected',    position: { x:  240, y: -180 }, data: { state: 'selected'    }, states: ['selected']    },
      { id: 'n-active',      position: { x: -240, y:    0 }, data: { state: 'active'      }, states: ['active']      },
      { id: 'n-highlighted', position: { x:    0, y:    0 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { id: 'n-focused',     position: { x:  240, y:    0 }, data: { state: 'focused'     }, states: ['focused']     },
      { id: 'n-dimmed',      position: { x: -240, y:  180 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { id: 'n-disabled',    position: { x:    0, y:  180 }, data: { state: 'disabled'    }, states: ['disabled']    },
      { id: 'n-error',       position: { x:  240, y:  180 }, data: { state: 'error'       }, states: ['error']       },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        // Opt out of the canonical state palette so every state's look in
        // this story is fully described inline below.
        useDefaultStateConfigs: false,
        node: {
          style: {
            shape: { kind: 'rect', width: 140, height: 64, cornerRadius: 10 },
            bgFill: 0x3b82f6,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 0,
            bgStrokeAlignment: 'outside',
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? '',
            labelColor: 0xffffff,
            labelFontSize: 13,
            labelFontWeight: 600,
            labelPlacement: 'center',
          },
          // Layer-level overlay catalogue — fields here win over `style`
          // when the corresponding state is in `node.states[]`.
          state: {
            // Detached translucent ring sitting outside the body — a real
            // `ring` decoration rather than a thick stroke, so it composes
            // with other decorations (e.g. `selected`'s ring) without
            // trampling them.
            hover: {
              decorations: [
                {
                  kind: 'ring',
                  id: 'hover-ring',
                  color: 0xbfdbfe,
                  width: 6,
                  gap: 3,
                  alpha: 0.75,
                },
              ],
            },
            // Same idea, wider band — “focal” feel.
            active: {
              decorations: [
                {
                  kind: 'ring',
                  id: 'active-ring',
                  color: 0xbfdbfe,
                  width: 10,
                  gap: 2,
                  alpha: 0.65,
                },
              ],
            },
            // Thick black ring (sticky click-selection).
            selected: {
              decorations: [
                {
                  kind: 'ring',
                  id: 'select-ring',
                  color: 0x000000,
                  width: 4,
                  gap: 2,
                  alpha: 1,
                },
              ],
              labelFontWeight: 700,
            },
            // Same black ring + bolder label.
            highlighted: {
              decorations: [
                {
                  kind: 'ring',
                  id: 'highlight-ring',
                  color: 0x000000,
                  width: 4,
                  gap: 2,
                  alpha: 1,
                },
              ],
              labelFontWeight: 800,
            },
            // Blue keyboard-focus ring.
            focused: {
              decorations: [
                {
                  kind: 'ring',
                  id: 'focus-ring',
                  color: 0x60a5fa,
                  width: 3,
                  gap: 2,
                  alpha: 1,
                },
              ],
            },
            // Washed-out (the "inactive" tile in the design).
            dimmed: {
              bgAlpha: 0.35,
              labelAlpha: 0.45,
            },
            // Gray + low alpha, non-interactive.
            disabled: {
              bgFill: 0xcbd5e1,
              bgAlpha: 0.7,
              labelColor: 0x64748b,
            },
            // Red ring (validation / invalid).
            error: {
              decorations: [
                {
                  kind: 'ring',
                  id: 'error-ring',
                  color: 0xef4444,
                  width: 4,
                  gap: 2,
                  alpha: 1,
                },
              ],
            },
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
