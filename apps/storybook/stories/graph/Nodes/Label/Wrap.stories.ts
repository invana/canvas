import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelStyle } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/Wrap' };
export default meta;
type Story = StoryObj;

/**
 * `wrap` controls word-wrap and truncation — `maxWidth`, `maxLines`,
 * `wordWrap`, `overflow: 'clip' | 'ellipsis'`. Wrap config has no flat
 * field on `NodeStyle`, so the `labelStyle` escape hatch is used here.
 *
 * Row of six shapes; the wrap controls fan out to every label so the
 * same wrap settings apply across every silhouette.
 */
export const Wrap: Story = {
  render: () => createContainer({ id: 'graph-label-wrap' }),

  play: async ({ canvasElement }) => {
    const LONG = 'A long descriptive label that wraps onto multiple lines and is eventually truncated with an ellipsis';

    const nodes: GraphNode[] = [
      { type: 'node',
        id: 'circle',
        position: { x: -280, y: -150 },
        style: {
          shape: { kind: 'circle', radius: 24 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 }
          }
        }
      },
      { type: 'node',
        id: 'rect',
        position: { x: 0, y: -150 },
        style: {
          shape: { kind: 'rect', width: 56, height: 40, cornerRadius: 8 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 }
          }
        }
      },
      { type: 'node',
        id: 'arc',
        position: { x: 280, y: -150 },
        style: {
          shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 }
          }
        }
      },
      { type: 'node',
        id: 'regular-polygon',
        position: { x: -280, y: 150 },
        style: {
          shape: { kind: 'regular-polygon', sides: 5, radius: 26 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 }
          }
        }
      },
      { type: 'node',
        id: 'star',
        position: { x: 0, y: 150 },
        style: {
          shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 }
          }
        }
      },
      { type: 'node',
        id: 'polygon',
        position: { x: 280, y: 150 },
        style: {
          shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] },
          labelStyle: {
            content: { kind: 'text', text: LONG, fontSize: 13, fontWeight: 500, fill: 0x454545 },
            wrap: { maxWidth: 160, maxLines: 3, wordWrap: true, overflow: 'ellipsis' },
            background: { fill: 0xffffff, stroke: 0xcbd5e1, strokeWidth: 1, radius: 4, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 8 }
          }
        }
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-wrap')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: { node: { style: { bgFill: 0x4f9cf9, bgStrokeColor: 0x1d4ed8 } } }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
    const settings = {
      text: LONG,
      maxWidth: 160,
      maxLines: 3,
      wordWrap: true,
      overflow: 'ellipsis' as 'clip' | 'ellipsis'
    };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        const prevLs = prev.labelStyle;
        if (!prevLs || prevLs.content.kind !== 'text') continue;
        const nextLs: ShapeLabelStyle = {
          ...prevLs,
          content: { ...prevLs.content, text: settings.text },
          wrap: {
            maxWidth: settings.maxWidth,
            maxLines: settings.maxLines,
            wordWrap: settings.wordWrap,
            overflow: settings.overflow
          }
        };
        graph.store.updateNode(id, { style: { ...prev, labelStyle: nextLs } });
      }
    };
    const gui = new GUI({ title: 'Wrap' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'text').onChange(apply);
    gui.add(settings, 'maxWidth', 40, 360, 10).onChange(apply);
    gui.add(settings, 'maxLines', 1, 6, 1).onChange(apply);
    gui.add(settings, 'wordWrap').onChange(apply);
    gui.add(settings, 'overflow', ['clip', 'ellipsis']).onChange(apply);
  }
};
