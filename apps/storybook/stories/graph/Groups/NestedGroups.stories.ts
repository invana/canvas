import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  CollapseExpandBehaviour,
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  ThemeBehaviour,
  type GraphEdge,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Groups/NestedGroups' };
export default meta;
type Story = StoryObj;

/**
 * Outer rectangular group containing an inner rectangular group plus a
 * loose third node. Two levels of `parentId` — `node1`/`node2` point at
 * `inner`, which points at `outer`. The deepest-first dirty-flush ensures
 * the inner frame's bounds are up to date before the outer auto-fits
 * around them, so dragging `node1` outward correctly grows both frames
 * in one pass.
 *
 */
export const NestedGroupsStory: Story = {
  name: 'NestedGroups',
  render: () => createContainer({ id: 'graph-nested-groups' }),

  play: async ({ canvasElement }) => {
    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'outer',
        position: { x: 0, y: 0 },
        style: {
          // Small declared base — autoFit grows the frame around children
          // while expanded; on collapse the small base is reused so the
          // super-node reads as node-sized.
          shape: { kind: 'rect', width: 90, height: 70, cornerRadius: 10 },
          // No frame colour: an unset `bgFill` / `bgStrokeColor` resolves from
          // the theme (`cardBg` / `divider`) and re-resolves on every switch.
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 28 }
        }
      },
      { type: 'node',
        id: 'inner',
        parentId: 'outer',
        position: { x: 0, y: -60 },
        style: {
          shape: { kind: 'rect', width: 70, height: 50, cornerRadius: 8 },
          // Nesting depth as a weight of the themed fill: both frames resolve
          // to `cardBg`, and `bgAlpha` is outside the role map so it survives
          // every publish and reads in both light and dark.
          bgAlpha: 0.55,
          bgStrokeWidth: 1,
          group: { autoFit: true, padding: 18 }
        }
      },
      { type: 'node',
        id: 'node1',
        parentId: 'inner',
        position: { x: -55, y: -60 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node1',
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6
        }
      },
      { type: 'node',
        id: 'node2',
        parentId: 'inner',
        position: { x: 55, y: -60 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node2',
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6
        }
      },
      { type: 'node',
        id: 'node3',
        parentId: 'outer',
        position: { x: -60, y: 90 },
        style: {
          shape: { kind: 'circle', radius: 18 },
          bgFill: 0x3b82f6,
          labelText: 'node3',
          labelFontSize: 12,
          labelPlacement: 'bottom',
          labelOffsetY: 6
        }
      },
    ];

    const edges: GraphEdge[] = [];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-nested-groups')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges } } });
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
    canvas.behaviours.register(
      new CollapseExpandBehaviour({ id: 'collapse-expand', targetLayerId: 'graph' }),
    );

    const canvasOptions = {
      behaviours: {
        // Named-palette mode: no `targetLayerId`, no `light`/`dark` shorthand,
        // so the whole canvas recolours — frame, labels, edges and backdrop —
        // and follows the toolbar's *family* as well as its light/dark kind.
        theme: { enabled: true, mode: 'document' },
        pan: { enabled: true },
        zoom: { enabled: true },
        drag: { enabled: true },
        'collapse-expand': { enabled: true }
      }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 100);

  }
};
