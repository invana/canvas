/**
 * Density-contour overlay over a force-directed Les Misérables graph.
 *
 * Demonstrates {@link DensityContourLayer} as a *toggleable* overlay on top
 * of a `GraphLayer`. The contour layer reads node positions from the graph
 * (by `graphLayerId`) and renders d3-contour density bands beneath the
 * nodes / edges. lil-gui exposes `bandwidth`, `thresholds`, `cellSize`,
 * `fillOpacity`, plus a `visible` toggle that swaps the overlay on / off
 * without touching the graph data.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
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
  DensityContourLayer,
  type DensityContourPaletteName,
} from '@invana/graph-layer-d3-contour';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/d3-contour/LesMiserables' };
export default meta;
type Story = StoryObj;

export const LesMiserables: Story = {
  render: () => createContainer({ id: 'graph-density-les-miserables' }),

  play: async ({ canvasElement }) => {
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    const nodes: GraphNode[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: {
        group: n.data.group,
        fill: groupColors[n.data.group % groupColors.length],
        size: 10,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-density-les-miserables')!;
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
        edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 0.5, arrow: true },
      },
    });
    canvas.layers.add(graph);

    // Contour overlay — added AFTER graph in the layer list but placed at a
    // lower zIndex so the graph nodes/edges paint on top of the density
    // bands. The layer subscribes to `graph.events('data:changed')` so it
    // automatically tracks the force-directed simulation as it settles.
    const contour = new DensityContourLayer({
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

    // Layers panel — gives a live view of every layer in the canvas
    // (background, graph, density, dev-info, the panel itself), with a
    // visibility toggle per layer. Sits on top so it's never occluded.
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

    // Fit after the simulation settles so the density blobs land nicely in
    // the viewport. The contour layer recomputes on `data:changed` so its
    // bands track the final positions automatically.
    layout.events.on('end', () => {
      canvas.camera.fitContent(graph.getBounds(), 100);
      contour.recompute();
    });

    void layout.apply(graph);

    // Three palette modes the layer accepts:
    //  - 'palette' : named built-in (or array of stops)
    //  - 'range'   : two-colour gradient via paletteRangeStart/End
    //  - 'function': continuous (t in [0,1]) => 0xRRGGBB callback
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

    // Style preset — snaps `fillOpacity` and `strokeWidth` to sensible
    // values for each of the three canonical looks. The underlying sliders
    // stay editable below for fine-tuning.
    type StylePreset = 'fill' | 'stroke' | 'both';
    // Two stroke colour forms, mirroring the fill `mode` selector:
    //  - 'palette'  : every iso-line tinted through the active palette chain
    //  - 'constant' : single `0xRRGGBB` colour for all bands
    type StrokeMode = 'palette' | 'constant';

    const settings = {
      visible: true,
      style: 'fill' as StylePreset,
      mode: 'palette' as PaletteMode,
      palette: 'viridis' as DensityContourPaletteName,
      rangeStart: 0xfff5f0,
      rangeEnd: 0x67000d,
      fnPreset: 'hueSweep' as FnPreset,
      bandwidth: 30,
      thresholds: 10,
      cellSize: 4,
      fillOpacity: 0.45,
      strokeWidth: 0,
      strokeMode: 'palette' as StrokeMode,
      strokeColorConst: 0x1f2937,
    };

    const gui = new GUI({ title: 'DensityContourLayer' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'visible').name('Show contour').onChange((v: boolean) => {
      contour.visible = v;
    });

    // Style preset — snaps the fill/stroke sliders to canonical looks.
    // `fill`   : today's filled-band overlay (no outline)
    // `stroke` : Observable-style stroke-only iso-lines (no fill)
    // `both`   : faint fill with overlaid lines
    gui
      .add(settings, 'style', ['fill', 'stroke', 'both'] satisfies StylePreset[])
      .name('Style')
      .onChange((v: StylePreset) => {
        if (v === 'fill') {
          settings.fillOpacity = 0.45;
          settings.strokeWidth = 0;
        } else if (v === 'stroke') {
          settings.fillOpacity = 0;
          settings.strokeWidth = 0.6;
        } else {
          settings.fillOpacity = 0.35;
          settings.strokeWidth = 0.4;
        }
        gui.controllersRecursive().forEach((c) => c.updateDisplay());
        rebuildContour();
      });

    const rebuildContour = (): void => {
      // The layer reads options live via `this.options`. We clear the
      // unused palette fields so the resolution order picks up only the
      // form that matches the current `mode` selector.
      const o = contour.options as unknown as Record<string, unknown>;
      o.bandwidth = settings.bandwidth;
      o.thresholds = settings.thresholds;
      o.cellSize = settings.cellSize;
      o.fillOpacity = settings.fillOpacity;
      o.strokeWidth = settings.strokeWidth;
      o.strokeColor =
        settings.strokeMode === 'palette' ? 'palette' : settings.strokeColorConst;

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

    // Controllers per mode — captured so we can show only the one matching
    // the active mode, keeping the GUI honest about which form actually
    // drives the layer.
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

    // Add the mode selector at the top of the folder so the visible
    // controls below it always reflect the active choice.
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
    contourFolder.add(settings, 'cellSize', 1, 16, 1).onChange(rebuildContour);
    contourFolder.add(settings, 'fillOpacity', 0, 1, 0.01).onChange(rebuildContour);

    // Stroke folder — iso-line outline. `strokeWidth: 0` hides the lines
    // entirely; `strokeMode: 'palette'` tints each line through the active
    // fill palette chain (the Observable density-contour look).
    const strokeFolder = gui.addFolder('Stroke');
    strokeFolder.add(settings, 'strokeWidth', 0, 4, 0.1).onChange(rebuildContour);
    strokeFolder
      .add(settings, 'strokeMode', ['palette', 'constant'] satisfies StrokeMode[])
      .name('Stroke mode')
      .onChange(() => {
        strokeColorConstCtl.show(settings.strokeMode === 'constant');
        rebuildContour();
      });
    const strokeColorConstCtl = strokeFolder
      .addColor(settings, 'strokeColorConst')
      .name('Stroke colour')
      .onChange(rebuildContour);
    strokeColorConstCtl.show(settings.strokeMode === 'constant');

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
