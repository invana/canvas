import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelStyle } from '@invana/canvas';
import { GraphLayer, type NodeData, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'Graph/Nodes/Label/HtmlRichText' };
export default meta;
type Story = StoryObj;

/**
 * The `'html-text'` content kind on `labelStyle.content` renders mixed-
 * style runs in one label. Pixi `HTMLText` parses the `html` string and
 * applies per-tag styles from `tagStyles` (custom tag names allowed —
 * `<role>`, `<ver>`, `<hl>`, anything).
 *
 * `'html-text'` is heavier than `'text'` (each instance rasterises HTML
 * to a canvas), so reserve it for tens to a couple of hundred labels.
 * For graph-wide use, stick to the plain-text kind.
 */
export const HtmlRichText: Story = {
  render: () => createContainer({ id: 'graph-label-html-rich-text' }),

  play: async ({ canvasElement }) => {
    const nodes: NodeData[] = [
      {
        id: 'n',
        position: { x: 0, y: 0 },
        style: {
          labelStyle: {
            content: {
              kind: 'html-text',
              html: '<role>API</role> <name>users-service</name> <ver>v2.4.1</ver>',
              defaultFontFamily: 'sans-serif',
              defaultFontSize: 12,
              defaultFill: '#454545',
              width: 220,
              tagStyles: {
                role: { fontSize: 10, fill: '#10b981', fontWeight: 700 },
                name: { fontSize: 13, fill: '#454545', fontWeight: 600 },
                ver:  { fontSize: 10, fill: '#64748b', fontWeight: 400 },
              },
            },
            background: { fill: 0xecfdf5, stroke: 0x10b981, strokeWidth: 1, radius: 6, padding: [6, 10] },
            placement: 'bottom',
            offset: { y: 10 },
          },
        },
      },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-html-rich-text')!;
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
            bgFill: 0x10b981,
            bgStrokeColor: 0x047857,
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges: [] });
    canvas.camera.fitContent(graph.getBounds(), 240);

    const settings = {
      role: 'API',
      name: 'users-service',
      ver: 'v2.4.1',
      roleColor: '#10b981',
      nameColor: '#454545',
      verColor: '#64748b',
    };
    const apply = (): void => {
      const prev = (graph.store.getNode('n')?.style as NodeStyle | undefined) ?? {};
      const prevLs = prev.labelStyle;
      if (!prevLs || prevLs.content.kind !== 'html-text') return;
      const nextLs: ShapeLabelStyle = {
        ...prevLs,
        content: {
          ...prevLs.content,
          html: `<role>${settings.role}</role> <name>${settings.name}</name> <ver>${settings.ver}</ver>`,
          tagStyles: {
            role: { fontSize: 10, fill: settings.roleColor, fontWeight: 700 },
            name: { fontSize: 13, fill: settings.nameColor, fontWeight: 600 },
            ver:  { fontSize: 10, fill: settings.verColor,  fontWeight: 400 },
          },
        },
      };
      graph.store.updateNode('n', { style: { ...prev, labelStyle: nextLs } });
    };
    const gui = new GUI({ title: 'HTML rich text' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'role').onChange(apply);
    gui.add(settings, 'name').onChange(apply);
    gui.add(settings, 'ver').onChange(apply);
    gui.addColor(settings, 'roleColor').onChange(apply);
    gui.addColor(settings, 'nameColor').onChange(apply);
    gui.addColor(settings, 'verColor').onChange(apply);
  },
};
