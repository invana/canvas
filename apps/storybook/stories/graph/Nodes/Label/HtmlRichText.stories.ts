import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import type { ShapeLabelStyle } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphNode, type NodeStyle } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Label/HtmlRichText' };
export default meta;
type Story = StoryObj;

/**
 * The `'html-text'` content kind on `labelStyle.content` renders mixed-
 * style runs in one label. Pixi `HTMLText` parses the `html` string and
 * applies per-tag styles from `tagStyles` (custom tag names allowed —
 * `<role>`, `<ver>`, `<hl>`, anything).
 *
 * Row of six shapes; the same rich label is fanned out to every one.
 * `'html-text'` is heavier than `'text'` (each instance rasterises HTML
 * to a canvas), so reserve it for tens to a couple of hundred labels —
 * not for graph-wide use.
 */
export const HtmlRichTextStory: Story = {
  name: 'HtmlRichText',
  render: () => createContainer({ id: 'graph-label-html-rich-text' }),

  play: async ({ canvasElement }) => {
    const INITIAL_HTML = '<role>API</role> <name>users-service</name> <ver>v2.4.1</ver>';
    const baseLabelStyle: ShapeLabelStyle = {
      content: {
        kind: 'html-text',
        html: INITIAL_HTML,
        defaultFontFamily: 'sans-serif',
        defaultFontSize: 12,
        defaultFill: '#454545',
        width: 220,
        tagStyles: {
          role: { fontSize: 10, fill: '#10b981', fontWeight: 700 },
          name: { fontSize: 13, fill: '#454545', fontWeight: 600 },
          ver:  { fontSize: 10, fill: '#64748b', fontWeight: 400 }
        }
      },
      background: { fill: 0xecfdf5, stroke: 0x10b981, strokeWidth: 1, radius: 6, padding: [6, 10] },
      placement: 'bottom',
      offset: { y: 10 }
    };

    const nodes: GraphNode[] = [
      // 3-col × 2-row grid so rich-text pill labels (width 220) don't overlap.
      { type: 'node', id: 'circle',          position: { x: -320, y: -150 }, style: { shape: { kind: 'circle', radius: 24 },                                                                  labelStyle: baseLabelStyle } },
      { type: 'node', id: 'rect',            position: { x: 0,    y: -150 }, style: { shape: { kind: 'rect', width: 80, height: 50, cornerRadius: 10 },                                       labelStyle: baseLabelStyle } },
      { type: 'node', id: 'arc',             position: { x: 320,  y: -150 }, style: { shape: { kind: 'arc', innerR: 10, outerR: 26, startAngle: -Math.PI / 2, endAngle: Math.PI / 2 },        labelStyle: baseLabelStyle } },
      { type: 'node', id: 'regular-polygon', position: { x: -320, y: 150  }, style: { shape: { kind: 'regular-polygon', sides: 5, radius: 26 },                                               labelStyle: baseLabelStyle } },
      { type: 'node', id: 'star',            position: { x: 0,    y: 150  }, style: { shape: { kind: 'star', points: 5, outerRadius: 28, innerRadius: 12 },                                   labelStyle: baseLabelStyle } },
      { type: 'node', id: 'polygon',         position: { x: 320,  y: 150  }, style: { shape: { kind: 'polygon', vertices: [ { x: 24, y: 0 }, { x: 12, y: -21 }, { x: -12, y: -21 }, { x: -24, y: 0 }, { x: -12, y: 21 }, { x: 12, y: 21 } ] }, labelStyle: baseLabelStyle } },
    ];

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-label-html-rich-text')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: { initData: { nodes, edges: [] } }
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: { node: { style: { bgFill: 0x10b981, bgStrokeColor: 0x047857 } } }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    const ALL_IDS = ['circle', 'rect', 'arc', 'regular-polygon', 'star', 'polygon'];
    const settings = {
      role: 'API',
      name: 'users-service',
      ver: 'v2.4.1',
      roleColor: '#10b981',
      nameColor: '#454545',
      verColor: '#64748b'
    };
    const apply = (): void => {
      for (const id of ALL_IDS) {
        const prev = (graph.store.getNode(id)?.style as NodeStyle | undefined) ?? {};
        const prevLs = prev.labelStyle;
        if (!prevLs || prevLs.content.kind !== 'html-text') continue;
        const nextLs: ShapeLabelStyle = {
          ...prevLs,
          content: {
            ...prevLs.content,
            html: `<role>${settings.role}</role> <name>${settings.name}</name> <ver>${settings.ver}</ver>`,
            tagStyles: {
              role: { fontSize: 10, fill: settings.roleColor, fontWeight: 700 },
              name: { fontSize: 13, fill: settings.nameColor, fontWeight: 600 },
              ver:  { fontSize: 10, fill: settings.verColor,  fontWeight: 400 }
            }
          }
        };
        graph.store.updateNode(id, { style: { ...prev, labelStyle: nextLs } });
      }
    };
    const gui = new GUI({ title: 'HTML rich text' });
    onStoryTeardown(() => gui.destroy());
    gui.add(settings, 'role').onChange(apply);
    gui.add(settings, 'name').onChange(apply);
    gui.add(settings, 'ver').onChange(apply);
    gui.addColor(settings, 'roleColor').onChange(apply);
    gui.addColor(settings, 'nameColor').onChange(apply);
    gui.addColor(settings, 'verColor').onChange(apply);
  }
};
