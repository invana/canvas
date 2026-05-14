/**
 * Port of Observable [`@d3/density-contours`](https://observablehq.com/@d3/density-contours).
 *
 * Renders d3-contour density estimates over the classic Old Faithful geyser
 * dataset (272 `(waiting, eruptions)` measurements). The contour overlay
 * paints **stroked iso-lines coloured by the blues ramp** — no fill — to
 * match Observable's signature look. The scatter points themselves are
 * carried by a `GraphLayer` with tiny circular nodes and no edges; the
 * density layer reads positions from that graph via `graphLayerId`.
 *
 * Differences from the sibling `DensityOverGraph` story: that one is a
 * filled-band overlay over a force-directed Les Misérables graph, this one
 * is a stroke-only scatter contour with literal positions and no layout.
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
import { GraphLayer } from '@invana/graph';
import {
  DENSITY_CONTOUR_PALETTE_NAMES,
  DensityContourLayer,
  type DensityContourPaletteName,
} from '@invana/graph-layer-d3-contour';
import { oldFaithful } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/d3-contour/OldFaithfulDensity' };
export default meta;
type Story = StoryObj;

export const OldFaithfulDensity: Story = {
  render: () => createContainer({ id: 'graph-density-old-faithful' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>(
      '#graph-density-old-faithful',
    )!;

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

    // GraphLayer carries the 272 scatter points as tiny circles, no edges.
    // Positions come straight from the dataset (eruptions vs waiting), so no
    // layout is needed — we never run a `Layout.apply()` here.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        nodeDefaults: {
          shape: 'circle',
          size: 2,
          fill: 0x0b3d91,
          stroke: 0xffffff,
          strokeWidth: 0.1,
          alpha: 0.95,
        },
      },
    });
    canvas.layers.add(graph);

    // Stroke-only contour overlay — the Observable look. `strokeColor:
    // 'palette'` tells the layer to colour each iso-line through the palette
    // chain (here: the `blues` ramp), and `fillOpacity: 0` keeps the bands
    // unfilled so the underlying dots stay readable.
    const contour = new DensityContourLayer({
      id: 'density',
      zIndex: -1,
      options: {
        graphLayerId: 'graph',
        // Bandwidth is in world units. The two Old Faithful clusters sit
        // ~50 units apart; anything close to that merges them into a single
        // oval. Keep the kernel small enough to preserve the bimodal
        // "dumbbell" signature.
        bandwidth: 12,
        thresholds: 10,
        // `cellSize` is the marching-squares grid step in world units. d3
        // requires a power of two (1, 2, 4, 8, 16). Our world spans only ~50
        // × ~70 units here so the default of 4 leaves the rings visibly
        // polygonal — drop to 1 for a much smoother trace (50 × 70 grid is
        // still cheap to compute on this dataset).
        cellSize: 1,
        padding: 30,
        palette: 'blues',
        fillOpacity: 0,
        strokeWidth: 0.1,
        strokeColor: 'palette',
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

    graph.setData(oldFaithful);
    // Single fit after the data is loaded — no simulation to wait for.
    canvas.camera.fitContent(graph.getBounds(), 100);
    contour.recompute();

    const settings = {
      visible: true,
      palette: 'blues' as DensityContourPaletteName,
      bandwidth: 4,
      thresholds: 10,
      cellSize: 1,
      strokeWidth: 0.5,
      fillOpacity: 0,
    };

    const gui = new GUI({ title: 'DensityContourLayer — Old Faithful' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'visible').name('Show contour').onChange((v: boolean) => {
      contour.visible = v;
    });

    const rebuild = (): void => {
      const o = contour.options as unknown as Record<string, unknown>;
      o.palette = settings.palette;
      o.bandwidth = settings.bandwidth;
      o.thresholds = settings.thresholds;
      o.cellSize = settings.cellSize;
      o.strokeWidth = settings.strokeWidth;
      o.fillOpacity = settings.fillOpacity;
      // Always palette-driven stroke for this story — flip via the dat.gui
      // `strokeWidth` slider to 0 to hide the contour lines entirely.
      o.strokeColor = 'palette';
      contour.recompute();
    };

    gui
      .add(settings, 'palette', [...DENSITY_CONTOUR_PALETTE_NAMES])
      .name('Palette')
      .onChange(rebuild);

    const contourFolder = gui.addFolder('Contour');
    contourFolder.add(settings, 'bandwidth', 0.5, 30, 0.5).onChange(rebuild);
    contourFolder.add(settings, 'thresholds', 3, 40, 1).onChange(rebuild);
    // d3-contour rejects non-power-of-two `cellSize`, so expose only the
    // valid options. Smaller = smoother rings, quadratically more compute.
    contourFolder
      .add(settings, 'cellSize', [1, 2, 4, 8, 16])
      .onChange(rebuild);
    contourFolder.add(settings, 'strokeWidth', 0, 4, 0.1).onChange(rebuild);
    contourFolder.add(settings, 'fillOpacity', 0, 1, 0.01).onChange(rebuild);

    gui.add({ recompute: () => contour.recompute() }, 'recompute').name('Recompute now');
    gui
      .add(
        { fit: () => canvas.camera.fitContent(graph.getBounds(), 100) },
        'fit',
      )
      .name('Fit to content');
  },
};
