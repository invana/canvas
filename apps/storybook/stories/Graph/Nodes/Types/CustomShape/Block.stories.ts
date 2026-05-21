import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ShapeBase,
  type BaseShapeSpec,
  type Rect,
  type ShapeHostInfo,
} from '@invana/canvas/primitives';
import {
  GraphLayer,
  type CanonicalStateName,
  type CustomShapeOption,
  type GraphNode,
  type NodeData,
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Types/CustomShape/Block' };
export default meta;
type Story = StoryObj;

/**
 * **Block cross** — `CrossShape` registered at runtime under
 * `kind: 'cross'` with `arm: 50, thickness: 38`. At this thickness the
 * arms nearly fill the bounding box; the silhouette reads as a chunky
 * plus / Swiss-flag glyph. Shown across the resting `default` plus the
 * five canonical interaction states (`hovered`, `selected`,
 * `highlighted`, `dimmed`, `disabled`).
 */
export const Block: Story = {
  render: () => createContainer({ id: 'graph-node-types-custom-block' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-custom-block')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    interface GfxLike {
      moveTo(x: number, y: number): void;
      lineTo(x: number, y: number): void;
      closePath(): void;
      fill(opts: { color: number; alpha?: number }): void;
      stroke(opts: { color: number; width: number; alpha?: number }): void;
    }

    interface CrossSpec extends BaseShapeSpec {
      readonly kind: 'cross';
      readonly arm: number;
      readonly thickness: number;
    }

    class CrossShape extends ShapeBase<CrossSpec> {
      static readonly kind = 'cross';

      constructor(spec: CrossSpec, host: ShapeHostInfo) {
        super(host);
        this.draw(spec);
      }

      protected drawGeometry(g: GfxLike, spec: CrossSpec): void {
        const verts = crossVertices(spec.arm, spec.thickness);
        const first = verts[0]!;
        g.moveTo(first.x, first.y);
        for (let i = 1; i < verts.length; i++) {
          const v = verts[i]!;
          g.lineTo(v.x, v.y);
        }
        g.closePath();

        const fillColor = typeof spec.fill === 'number' ? spec.fill : 0xffffff;
        g.fill({ color: fillColor, alpha: spec.alpha ?? 1 });

        const sw = spec.stroke?.width ?? 0;
        if (spec.stroke && sw > 0) {
          g.stroke({
            color: spec.stroke.color,
            width: sw,
            alpha: spec.stroke.alpha ?? 1,
          });
        }
      }

      bounds(): Rect {
        return CrossShape.boundsOf(this.spec);
      }

      static boundsOf(spec: Omit<CrossSpec, 'x' | 'y'>): Rect {
        return { x: -spec.arm, y: -spec.arm, width: spec.arm * 2, height: spec.arm * 2 };
      }

      static scaleSpec(spec: Omit<CrossSpec, 'x' | 'y'>, factor: number): Partial<CrossSpec> {
        return { arm: spec.arm * factor, thickness: spec.thickness * factor };
      }
    }

    function crossVertices(arm: number, t: number): { x: number; y: number }[] {
      return [
        { x: -t,   y: -arm }, { x:  t,   y: -arm },
        { x:  t,   y: -t   }, { x:  arm, y: -t   },
        { x:  arm, y:  t   }, { x:  t,   y:  t   },
        { x:  t,   y:  arm }, { x: -t,   y:  arm },
        { x: -t,   y:  t   }, { x: -arm, y:  t   },
        { x: -arm, y: -t   }, { x: -t,   y: -t   },
      ];
    }

    const crossShape: CustomShapeOption = { kind: 'cross', arm: 50, thickness: 38 } as CustomShapeOption;

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    const nodes: NodeData<TileData>[] = [
      { id: 'n-default',     position: { x: -200, y: -90 }, data: { state: 'default'     } },
      { id: 'n-hover',       position: { x:    0, y: -90 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { id: 'n-selected',    position: { x:  200, y: -90 }, data: { state: 'selected'    }, states: ['selected']    },
      { id: 'n-highlighted', position: { x: -200, y:  90 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { id: 'n-dimmed',      position: { x:    0, y:  90 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { id: 'n-disabled',    position: { x:  200, y:  90 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: crossShape,
            bgFill: 0x3b82f6,
            bgStrokeColor: 0xffffff,
            bgStrokeWidth: 0,
            bgStrokeAlignment: 'outside',
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? '',
            labelColor: 0x0f172a,
            labelFontSize: 12,
            labelFontWeight: 600,
            labelPlacement: 'bottom',
            labelOffsetY: 14,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.getRenderer()?.registerShape('cross', CrossShape);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
