import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  Canvas,
  DragPanBehaviour,
  ThemedBackgroundLayer,
  WheelZoomBehaviour,
} from '@invana/canvas';
import type { ThemedBackgroundMode } from '@invana/canvas';
import { GraphLayer, type GraphNode } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer } from '../../div-util';

const meta: Meta = { title: 'Graph/Layer/WithThemedBackground' };
export default meta;
type Story = StoryObj;

export const WithThemedBackground: Story = {
  render: () => createContainer({ id: 'graph-themed-bg' }),

  play: async ({ canvasElement }) => {
    // Eleven hues, one per Les Mis "group" id (0–10). Picked for legibility
    // against both light and dark backgrounds.
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    const N = lesMiserables.nodes.length;
    const R = 260;
    const nodes: GraphNode[] = lesMiserables.nodes.map((n, i) => {
      const theta = (i / N) * Math.PI * 2;
      return {
        id: n.id,
        position: { x: Math.cos(theta) * R, y: Math.sin(theta) * R },
        data: {
          group: n.data.group,
          fill: groupColors[n.data.group % groupColors.length],
          size: 18,
          stroke: 0xffffff,
          strokeWidth: 1,
        },
      };
    });

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-themed-bg')!;
    const canvas = new Canvas();
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    // ── Themed background first so it sits behind the graph ──────────────
    const themed = new ThemedBackgroundLayer({
      id: 'bg',
      options: {
        mode: 'auto',
        defaultTheme: 'graph-paper',
        themes: [
          {
            id: 'graph-paper',
            label: 'Graph paper',
            light: {
              type: 'pattern',
              patternType: 'grid',
              backgroundColor: '#f8fafc',
              color: '#cbd5e1',
              size: 1,
              spacing: 30,
              alpha: 0.8,
              followCamera: true,
            },
            dark: {
              type: 'pattern',
              patternType: 'grid',
              backgroundColor: '#0f172a',
              color: '#334155',
              size: 1,
              spacing: 30,
              alpha: 0.9,
              followCamera: true,
            },
          },
          {
            id: 'dots',
            label: 'Dot field',
            light: {
              type: 'pattern',
              patternType: 'dots',
              backgroundColor: '#f1f5f9',
              color: '#94a3b8',
              size: 1.5,
              spacing: 24,
              alpha: 0.85,
              followCamera: true,
            },
            dark: {
              type: 'pattern',
              patternType: 'dots',
              backgroundColor: '#020617',
              color: '#475569',
              size: 1.5,
              spacing: 24,
              alpha: 0.9,
              followCamera: true,
            },
          },
          {
            id: 'flat',
            label: 'Flat',
            light: { type: 'solid', backgroundColor: '#ffffff' },
            dark: { type: 'solid', backgroundColor: '#0a0a0a' },
          },
        ],
      },
    });
    canvas.layers.add(themed);

    // Edge stroke needs to follow the theme so it reads on both light and
    // dark backgrounds. We set per-edge `data.stroke` at load time and
    // re-setData when the theme flips.
    const lightEdge = 0xcbd5e1;
    const darkEdge = 0x475569;

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edgeDefaults: { strokeWidth: 1, arrow: false },
      },
    });
    canvas.layers.add(graph);

    const reloadGraphForTheme = (): void => {
      const edgeColor = themed.getResolvedKind() === 'dark' ? darkEdge : lightEdge;
      const themedEdges = lesMiserables.edges.map((e) => ({
        ...e,
        data: { ...e.data, stroke: edgeColor },
      }));
      graph.setData({ nodes, edges: themedEdges });
    };

    // Initial load + react to theme / mode changes.
    reloadGraphForTheme();
    themed.events.on('theme:switched', () => reloadGraphForTheme());
    themed.events.on('mode:updated', () => reloadGraphForTheme());

    canvas.camera.fitContent(graph.getBounds(), 80);

    // GUI: theme + mode at the top, then every BackgroundLayer option as a
    // live override. Switching theme / mode resets the variant (clearing
    // overrides) — we re-sync the GUI to the resolved variant after each.
    const toCssColor = (c: number | string): string =>
      typeof c === 'number' ? `#${c.toString(16).padStart(6, '0')}` : c;

    const initial = themed.getOptions();
    const settings = {
      theme: themed.getActiveTheme().id,
      mode: themed.getMode(),
      type: initial.type,
      patternType: initial.patternType,
      backgroundColor: toCssColor(initial.backgroundColor),
      color: toCssColor(initial.color),
      size: initial.size,
      spacing: initial.spacing,
      alpha: initial.alpha,
      followCamera: initial.followCamera,
    };

    const pushOverrides = (): void => {
      themed.setOptions({
        type: settings.type,
        patternType: settings.patternType,
        backgroundColor: settings.backgroundColor,
        color: settings.color,
        size: settings.size,
        spacing: settings.spacing,
        alpha: settings.alpha,
        followCamera: settings.followCamera,
      });
    };

    const gui = new GUI({ title: 'Themed background' });
    gui
      .add(
        settings,
        'theme',
        themed.getThemes().map((t) => t.id),
      )
      .onChange((id: string) => themed.setTheme(id));
    gui
      .add(settings, 'mode', ['auto', 'light', 'dark'])
      .onChange((m: ThemedBackgroundMode) => themed.setMode(m));
    const styleFolder = gui.addFolder('Style');
    styleFolder.add(settings, 'type', ['solid', 'pattern']).onChange(pushOverrides);
    styleFolder
      .add(settings, 'patternType', ['dots', 'grid', 'lines'])
      .onChange(pushOverrides);
    styleFolder.addColor(settings, 'backgroundColor').onChange(pushOverrides);
    styleFolder.addColor(settings, 'color').onChange(pushOverrides);
    styleFolder.add(settings, 'size', 0.5, 8, 0.5).onChange(pushOverrides);
    styleFolder.add(settings, 'spacing', 10, 80, 2).onChange(pushOverrides);
    styleFolder.add(settings, 'alpha', 0, 1, 0.05).onChange(pushOverrides);
    styleFolder.add(settings, 'followCamera').onChange(pushOverrides);

    // Re-sync the GUI to whatever the (just-applied) variant looks like.
    const syncStyleFromLayer = (): void => {
      const o = themed.getOptions();
      settings.type = o.type;
      settings.patternType = o.patternType;
      settings.backgroundColor = toCssColor(o.backgroundColor);
      settings.color = toCssColor(o.color);
      settings.size = o.size;
      settings.spacing = o.spacing;
      settings.alpha = o.alpha;
      settings.followCamera = o.followCamera;
      styleFolder.controllersRecursive().forEach((c) => c.updateDisplay());
    };
    themed.events.on('theme:switched', syncStyleFromLayer);
    themed.events.on('mode:updated', syncStyleFromLayer);
  },
};
