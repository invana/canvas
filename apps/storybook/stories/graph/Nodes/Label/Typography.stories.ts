import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/Typography' };
export default meta;
type Story = StoryObj;

/**
 * Font controls applied to every built-in shape kind — `labelFontSize`,
 * `labelFontWeight`, `labelFontStyle`, `labelFontFamily`, `labelColor`,
 * `labelAlpha`, `labelLetterSpacing`, `labelLineHeight`.
 *
 * Row of six shapes: circle, rect, arc, regular-polygon, star, polygon.
 * The GUI knobs fan out to every label in the row, so each tweak is
 * exercised against every silhouette at once.
 */
export const Typography: Story = {
  render: () => createContainer({ id: 'graph-label-typography' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      // 3-col × 2-row grid so wide labels (multi-line / wrapped) don't collide.
      { id: 'circle',          position: { x: -280, y: -150 }, style: { shape: { kind: 'circle', radius: 24 },                                          labelText: 'circle\ntwo lines',          labelPlacement: 'bottom', labelOffsetY: 8 } },
      { id: 'rect',            position: { x: 0,    y: -150 }, style: { shape: { kind: 'rect', width: 56, height: 40, cornerRadius: 8 },                labelText: 'rect\ntwo lines',            labelPlacement: 'bottom', labelOffsetY: 8 } },
      { id: 'arc',             position: { x: 280,  y: -150 }, style: { shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 }, labelText: 'arc\ntwo lines', labelPlacement: 'bottom', labelOffsetY: 8 } },
      { id: 'regular-polygon', position: { x: -280, y: 150  }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 26 },                       labelText: 'pentagon\ntwo lines',        labelPlacement: 'bottom', labelOffsetY: 8 } },
      { id: 'star',            position: { x: 0,    y: 150  }, style: { shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },           labelText: 'star\ntwo lines',            labelPlacement: 'bottom', labelOffsetY: 8 } },
      { id: 'polygon',         position: { x: 280,  y: 150  }, style: { shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] }, labelText: 'polygon\ntwo lines', labelPlacement: 'bottom', labelOffsetY: 8 } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-typography')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: [] } } });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              bgFill: 0x4f9cf9,
              bgStrokeColor: 0x1d4ed8,
              bgStrokeWidth: 1,
            },
          },
        },
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
    const settings = {
      fontFamily: 'sans-serif',
      fontSize: 14,
      fontWeight: 600 as 400 | 500 | 600 | 700 | 900,
      fontStyle: 'normal' as 'normal' | 'italic',
      color: 0x454545,
      alpha: 1,
      letterSpacing: 0,
      lineHeight: 18,
    };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        graph.store.updateNode(id, {
          style: {
            ...prev,
            labelFontFamily: settings.fontFamily,
            labelFontSize: settings.fontSize,
            labelFontWeight: settings.fontWeight,
            labelFontStyle: settings.fontStyle,
            labelColor: settings.color,
            labelAlpha: settings.alpha,
            labelLetterSpacing: settings.letterSpacing,
            labelLineHeight: settings.lineHeight,
          },
        });
      }
    };
    const gui = new GUI({ title: 'Typography' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'fontFamily', ['sans-serif', 'serif', 'monospace', 'system-ui']).onChange(apply);
    gui.add(settings, 'fontSize', 8, 32, 1).onChange(apply);
    gui.add(settings, 'fontWeight', { regular: 400, medium: 500, semibold: 600, bold: 700, black: 900 }).onChange(apply);
    gui.add(settings, 'fontStyle', ['normal', 'italic']).onChange(apply);
    gui.addColor(settings, 'color').onChange(apply);
    gui.add(settings, 'alpha', 0, 1, 0.05).onChange(apply);
    gui.add(settings, 'letterSpacing', -2, 8, 0.5).onChange(apply);
    gui.add(settings, 'lineHeight', 12, 36, 1).onChange(apply);
  },
};
