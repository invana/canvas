import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvas } from '@invana/graph';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  ShapeBase,
  type BaseShapeSpec,
  type Rect,
  type ShapeHostInfo
} from '@invana/canvas/primitives';
import {
  GraphLayer,
  type CanonicalStateName,
  type CustomShapeOption,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/CustomShape/Medium' };
export default meta;
type Story = StoryObj;

/**
 * **Medium cross** — `CrossShape` registered at runtime under
 * `kind: 'cross'` with `arm: 50, thickness: 18`. Shown across the
 * resting `default` plus the five canonical interaction states
 * (`hovered`, `selected`, `highlighted`, `dimmed`, `disabled`).
 */
export const Medium: Story = {
  render: () => createContainer({ id: 'graph-node-types-custom-medium' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-custom-medium')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

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
            alpha: spec.stroke.alpha ?? 1
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

    const crossShape: CustomShapeOption = { kind: 'cross', arm: 50, thickness: 18 } as CustomShapeOption;

    interface TileData {
      readonly state: 'default' | CanonicalStateName;
    }

    const nodes: GraphNode<TileData>[] = [
      { type: 'node', id: 'n-default',     position: { x: -200, y: -90 }, data: { state: 'default'     } },
      { type: 'node', id: 'n-hover',       position: { x:    0, y: -90 }, data: { state: 'hovered'     }, states: ['hovered']     },
      { type: 'node', id: 'n-selected',    position: { x:  200, y: -90 }, data: { state: 'selected'    }, states: ['selected']    },
      { type: 'node', id: 'n-highlighted', position: { x: -200, y:  90 }, data: { state: 'highlighted' }, states: ['highlighted'] },
      { type: 'node', id: 'n-dimmed',      position: { x:    0, y:  90 }, data: { state: 'dimmed'      }, states: ['dimmed']      },
      { type: 'node', id: 'n-disabled',    position: { x:  200, y:  90 }, data: { state: 'disabled'    }, states: ['disabled']    },
    ];

    // Resolver (`labelText`) and initData stay in the constructor; the
    // literal style fields move to `canvasOptions.layers.graph`.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            labelText: (n: GraphNode) => (n.data as TileData | undefined)?.state ?? ''
          }
        }
      }
    });
    canvas.layers.add(graph);
    graph.getRenderer()?.registerShape('cross', CrossShape);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: crossShape,
              bgFill: 0x3b82f6,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 0,
              bgStrokeAlignment: 'outside',
              labelColor: 0x0f172a,
              labelFontSize: 12,
              labelFontWeight: 600,
              labelPlacement: 'bottom',
              labelOffsetY: 14
            }
          }
        }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
