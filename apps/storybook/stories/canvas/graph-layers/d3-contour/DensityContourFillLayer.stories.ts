/**
 * `DensityContourFillLayer` over a force-directed Les Misérables graph.
 *
 * The fill layer paints filled iso-bands beneath the nodes and edges,
 * coloured through one of three palette forms: a named ramp, a two-colour
 * range, or a continuous function `(t) => 0xRRGGBB`. The companion
 * `DensityContourStrokeLayer` story is the outline-only sibling — compose
 * both (same `graphLayerId`, different `zIndex`) for fill + outline.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  Canvas,
  DevInfoLayer,
  DragPanBehaviour,
  LayersPanelLayer,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { DragNodeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import {
  DENSITY_CONTOUR_PALETTE_NAMES,
  DensityContourFillLayer,
  type DensityContourPaletteName,
} from '@invana/graph-layer-d3-contour';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'canvas/graph-layers/d3-contour/DensityContourFillLayer' };
export default meta;
type Story = StoryObj;

export const DensityContourFillLayer_Story: Story = {
  name: 'DensityContourFillLayer',
  render: () => createContainer({ id: 'graph-density-fill-lesmis' }),

  play: async ({ canvasElement }) => {
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    type LesMisNodeData = { group: number };
    const nodes: GraphNode<LesMisNodeData>[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: { group: n.data.group },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-density-fill-lesmis')!;
    const canvas = new Canvas();
    onStoryTeardown(() => canvas.destroy());
    await canvas.init({ container, autoResize: true });

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan', enabled: true }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom', enabled: true }));

    canvas.layers.add(
      new BackgroundLayer({
        id: 'bg',
        options: {
          type: 'pattern',
          patternType: 'dots',
          mode: 'auto',
          backgroundColor: { light: '#f8fafc', dark: '#0f172a' },
          color: { light: '#94a3b8', dark: '#475569' },
          size: 1.5,
          spacing: 24,
          alpha: 0.85,
        },
      }),
    );
    canvas.layers.add(new DevInfoLayer({ id: 'dev-info', corner: 'bottom-left', enabled: true }));

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        node: {
          style: {
            shape: { kind: 'circle', radius: 5 },
            bgFill: (n: GraphNode) =>
              groupColors[(n.data as LesMisNodeData).group % groupColors.length]!,
          },
        },
        edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } },
      },
    });
    canvas.layers.add(graph);

    // Fill overlay — added AFTER graph but at a lower zIndex so the nodes
    // and edges paint on top. The layer subscribes to `data:changed` and
    // recomputes automatically as the force simulation settles.
    const contour = new DensityContourFillLayer({
      id: 'density',
      zIndex: -1,
      options: {
        graphLayerId: 'graph',
        bandwidth: 30,
        thresholds: 10,
        cellSize: 4,
        fillOpacity: 0.45,
        padding: 80,
        palette: 'viridis',
      },
    });
    canvas.layers.add(contour);

    canvas.layers.add(
      new LayersPanelLayer({
        corner: 'top-left',
        enabled: true,
        fontSize: 11,
        opacity: 0.92,
        backgroundColor: 'rgba(10,10,10,0.82)',
        textColor: '#c8d3e0',
        accentColor: '#4fc3f7',
      }),
    );

    graph.setData({ nodes, edges: lesMiserables.edges });

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    const layout = new D3ForceLayout({
      link: {},
      charge: {},
      center: { x: 0, y: 0 },
    });
    onStoryTeardown(() => layout.stop());

    layout.events.on('end', () => {
      canvas.camera.fitContent(graph.getBounds(), 100);
      contour.recompute();
    });

    void layout.apply(graph);

    // Three palette modes the layer accepts:
    //  - 'palette'  : named built-in (or an array of stops)
    //  - 'range'    : two-colour gradient via paletteRangeStart/End
    //  - 'function' : continuous (t in [0,1]) => 0xRRGGBB callback
    type PaletteMode = 'palette' | 'range' | 'function';
    type FnPreset = 'hueSweep' | 'rainbow' | 'grayscale';

    const PALETTE_FNS: Record<FnPreset, (t: number) => number> = {
      hueSweep: (t) => hslToHex(220 - t * 180, 0.7, 0.5),
      rainbow: (t) => hslToHex(t * 360, 0.85, 0.55),
      grayscale: (t) => {
        const v = Math.round(240 * (1 - t)) + 8;
        return (v << 16) | (v << 8) | v;
      },
    };

    const settings = {
      visible: true,
      mode: 'palette' as PaletteMode,
      palette: 'viridis' as DensityContourPaletteName,
      rangeStart: 0xfff5f0,
      rangeEnd: 0x67000d,
      fnPreset: 'hueSweep' as FnPreset,
      bandwidth: 30,
      thresholds: 10,
      cellSize: 4,
      fillOpacity: 0.45,
    };

    const gui = new GUI({ title: 'DensityContourFillLayer' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'visible').name('Show contour').onChange((v: boolean) => {
      contour.visible = v;
    });

    const rebuildContour = (): void => {
      const o = contour.options as unknown as Record<string, unknown>;
      o.bandwidth = settings.bandwidth;
      o.thresholds = settings.thresholds;
      o.cellSize = settings.cellSize;
      o.fillOpacity = settings.fillOpacity;

      // Reset all palette forms; set only the one matching the active mode.
      o.palette = undefined;
      o.paletteRangeStart = undefined;
      o.paletteRangeEnd = undefined;
      o.paletteFn = undefined;

      if (settings.mode === 'palette') {
        o.palette = settings.palette;
      } else if (settings.mode === 'range') {
        o.paletteRangeStart = settings.rangeStart;
        o.paletteRangeEnd = settings.rangeEnd;
      } else {
        o.paletteFn = PALETTE_FNS[settings.fnPreset];
      }

      contour.recompute();
    };

    const colorFolder = gui.addFolder('Colour');

    const paletteCtl = colorFolder
      .add(settings, 'palette', [...DENSITY_CONTOUR_PALETTE_NAMES])
      .name('Named palette')
      .onChange(rebuildContour);
    const rangeStartCtl = colorFolder
      .addColor(settings, 'rangeStart')
      .name('Range start')
      .onChange(rebuildContour);
    const rangeEndCtl = colorFolder
      .addColor(settings, 'rangeEnd')
      .name('Range end')
      .onChange(rebuildContour);
    const fnPresetCtl = colorFolder
      .add(settings, 'fnPreset', Object.keys(PALETTE_FNS) as FnPreset[])
      .name('Function preset')
      .onChange(rebuildContour);

    const syncModeControls = (): void => {
      paletteCtl.show(settings.mode === 'palette');
      rangeStartCtl.show(settings.mode === 'range');
      rangeEndCtl.show(settings.mode === 'range');
      fnPresetCtl.show(settings.mode === 'function');
    };

    colorFolder
      .add(settings, 'mode', ['palette', 'range', 'function'] satisfies PaletteMode[])
      .name('Mode')
      .onChange(() => {
        syncModeControls();
        rebuildContour();
      });

    syncModeControls();

    const contourFolder = gui.addFolder('Contour');
    contourFolder.add(settings, 'bandwidth', 5, 100, 1).onChange(rebuildContour);
    contourFolder.add(settings, 'thresholds', 3, 30, 1).onChange(rebuildContour);
    contourFolder.add(settings, 'cellSize', [1, 2, 4, 8, 16]).onChange(rebuildContour);
    contourFolder.add(settings, 'fillOpacity', 0, 1, 0.01).onChange(rebuildContour);

    gui.add({ recompute: () => contour.recompute() }, 'recompute').name('Recompute now');
    gui.add(
      { fit: () => canvas.camera.fitContent(graph.getBounds(), 100) },
      'fit',
    ).name('Fit to content');

    /** Minimal HSL → 0xRRGGBB used by the function-mode presets. */
    function hslToHex(h: number, s: number, l: number): number {
      const hh = ((h % 360) + 360) % 360;
      const c = (1 - Math.abs(2 * l - 1)) * s;
      const x = c * (1 - Math.abs(((hh / 60) % 2) - 1));
      const m = l - c / 2;
      let r1 = 0,
        g1 = 0,
        b1 = 0;
      if (hh < 60) [r1, g1, b1] = [c, x, 0];
      else if (hh < 120) [r1, g1, b1] = [x, c, 0];
      else if (hh < 180) [r1, g1, b1] = [0, c, x];
      else if (hh < 240) [r1, g1, b1] = [0, x, c];
      else if (hh < 300) [r1, g1, b1] = [x, 0, c];
      else [r1, g1, b1] = [c, 0, x];
      const r = Math.round((r1 + m) * 255);
      const g = Math.round((g1 + m) * 255);
      const b = Math.round((b1 + m) * 255);
      return (r << 16) | (g << 8) | b;
    }
  },
};
