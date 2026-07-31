import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  DragNodeBehaviour,
  GraphLayer,
  ThemeBehaviour,
  BUILT_IN_THEMES,
  type GraphNode,
  type ThemeMode,
} from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph/Layer/WithThemedBackground' };
export default meta;
type Story = StoryObj;

export const WithThemedBackgroundStory: Story = {
  name: 'WithThemedBackground',
  render: () => createContainer({ id: 'graph-themed-bg' }),

  play: async ({ canvasElement }) => {
    // Eleven hues, one per Les Mis "group" id (0–10). Picked for legibility
    // against both light and dark backgrounds.
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4, 0x3b82f6, 0x8b5cf6, 0xec4899,
      0x14b8a6, 0xa3e635,
    ];

    const N = lesMiserables.nodes.length;
    const R = 260;
    const nodes: GraphNode[] = lesMiserables.nodes.map((n, i) => {
      const theta = (i / N) * Math.PI * 2;
      return {
        id: n.id,
        position: { x: Math.cos(theta) * R, y: Math.sin(theta) * R },
        data: { group: n.data.group },
        style: {
          shape: { kind: 'circle', radius: 9 },
          bgFill: groupColors[n.data.group % groupColors.length],
          bgStrokeWidth: 1,
        },
      };
    });

    // ── Add everything, then init() last ─────────────────────────────────
    // A plain BackgroundLayer + GraphLayer over the engine theme signal: the
    // `ThemeBehaviour` publishes a named palette and every theme-aware layer
    // recolours itself — the background from `surface`/`divider`, the graph's
    // node borders + edge strokes from the palette roles. No per-theme reload.
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-themed-bg')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: { type: 'pattern', patternType: 'grid', size: 1, spacing: 30, alpha: 0.8 },
      }),
    );

    const graph = new GraphLayer({ id: 'graph', options: { initData: { nodes, edges: lesMiserables.edges } } });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    const theme = new ThemeBehaviour({ id: 'theme', enabled: true });
    canvas.behaviours.register(theme);

    const canvasOptions = {
      layers: {
        graph: { edge: { style: { strokeWidth: 1, arrowTargetShape: 'none' } } },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
      },
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    canvas.camera.fitContent(graph.getBounds(), 80);

    const settings = { theme: 'default', mode: 'system' as ThemeMode };
    const gui = new GUI({ title: 'Theme' });
    onStoryTeardown(() => gui.destroy());
    gui
      .add(settings, 'theme', Object.keys(BUILT_IN_THEMES))
      .onChange((id: string) => theme.setTheme(id));
    gui.add(settings, 'mode', ['system', 'light', 'dark']).onChange((m: ThemeMode) => theme.setMode(m));
  },
};
