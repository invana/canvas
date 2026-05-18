import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/Typography' };
export default meta;
type Story = StoryObj;

/**
 * Font controls on a single label — `labelFontSize`, `labelFontWeight`,
 * `labelFontStyle`, `labelFontFamily`, `labelColor`, `labelAlpha`,
 * `labelLetterSpacing`, `labelLineHeight`.
 *
 * One node, one label. Sweep the GUI knobs to see each field's effect in
 * isolation. `labelLineHeight` is exercised together with a hardcoded
 * two-line `labelText` via `\n`.
 */
export const Typography: Story = {
  render: () => createContainer({ id: 'graph-label-typography' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'n',
        position: { x: 0, y: 0 },
        style: {
          labelText: 'Typography\nsample',
          labelPlacement: 'bottom',
          labelOffsetY: 8,
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-typography')!;
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
            shape: { kind: 'circle', radius: 22 },
            bgFill: 0x4f9cf9,
            bgStrokeColor: 0x1d4ed8,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 240);

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
      const prev = (graph.store.getNode('n')?.style as NodeStyle | undefined) ?? {};
      graph.store.updateNode('n', {
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
