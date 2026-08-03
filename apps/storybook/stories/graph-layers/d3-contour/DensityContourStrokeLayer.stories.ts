/**
 * `DensityContourStrokeLayer` over a force-directed Les Misérables graph.
 *
 * Defaults reproduce Observable's
 * [`@d3/density-contours`](https://observablehq.com/@d3/density-contours):
 * steelblue iso-lines with the topographic "index contour" pattern — every
 * 5th band stroked at 1 unit, the rest at 0.25. The companion
 * `DensityContourFillLayer` story is the filled sibling — compose both
 * (same `graphLayerId`, different `zIndex`) for fill + outline.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DevInfoLayer,
  DragPanBehaviour,
  LayersPanelLayer,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { DragNodeBehaviour, GraphCanvas, GraphLayer, type GraphNode, ThemeBehaviour } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import {
  DENSITY_CONTOUR_PALETTE_NAMES,
  DensityContourStrokeLayer,
  type DensityContourPaletteName,
} from '@invana/graph-layer-d3-contour';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const meta: Meta = { title: 'graph-layers/d3-contour/DensityContourStrokeLayer' };
export default meta;
type Story = StoryObj;

export const DensityContourStrokeLayer_Story: Story = {
  name: 'DensityContourStrokeLayer',
  render: () => createContainer({ id: 'graph-density-stroke-lesmis' }),

  play: async ({ canvasElement }) => {
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    type LesMisNodeData = { group: number };
    const nodes: GraphNode<LesMisNodeData>[] = lesMiserables.nodes.map((n) => ({ type: `group-${n.data.group}`,
      id: n.id,
      data: { group: n.data.group },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-density-stroke-lesmis')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Background pattern, concrete colours; OS dark-mode swaps them via the
    // ThemeBehaviour below.
    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
    canvas.layers.add(new DevInfoLayer({ id: 'dev-info', corner: 'bottom-left' }));

    // The `bgFill` resolver depends on per-node group, so it stays in the
    // constructor; the literal node/edge style moves to config.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: lesMiserables.edges },
        node: {
          style: {
            bgFill: (n: GraphNode) =>
              groupColors[(n.data as LesMisNodeData).group % groupColors.length]!,
          },
        },
      },
    });
    canvas.layers.add(graph);

    // Stroke overlay — Observable defaults out of the box. `strokeColor` is
    // a single steelblue constant; the heavy/light pattern comes from the
    // `indexEvery` / `indexMajorWidth` / `indexMinorWidth` sugar (every
    // 5th band heavy at 1 unit, the rest hair-thin at 0.25). With 20
    // thresholds you get the classic topo-map cadence: 4 thin lines
    // between every pair of heavies. The cross-layer `graphLayerId` stays
    // in the constructor; literal params move to config.
    const contour = new DensityContourStrokeLayer({
      id: 'density',
      zIndex: -1,
      options: { graphLayerId: 'graph' },
    });
    canvas.layers.add(contour);

    canvas.layers.add(new LayersPanelLayer({ id: 'layers-panel' }));

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', targetLayerId: 'graph' }));
    canvas.behaviours.register(new ThemeBehaviour({ id: 'theme', targetLayerId: 'bg' }));

    const forceLayout = new D3ForceLayout({ id: 'force', targetLayerId: 'graph' });
    canvas.layouts.add(forceLayout);

    const canvasOptions = {
      layers: {
        bg: {
          type: 'pattern',
          patternType: 'dots',
          backgroundColor: '#0f172a',
          color: '#475569',
          size: 1.5,
          spacing: 24,
          alpha: 0.85,
        },
        graph: {
          node: { style: { shape: { kind: 'circle', radius: 5 } } },
          edge: { style: { strokeColor: 0xcbd5e1, strokeWidth: 0.5 } },
        },
        density: {
          bandwidth: 30,
          thresholds: 20,
          cellSize: 4,
          padding: 80,
          strokeColor: 0x4682b4,
          indexEvery: 5,
          indexMajorWidth: 1,
          indexMinorWidth: 0.25,
        },
        'layers-panel': {
          corner: 'top-left',
          enabled: true,
          fontSize: 11,
          opacity: 0.92,
          backgroundColor: 'rgba(10,10,10,0.82)',
          textColor: '#c8d3e0',
          accentColor: '#4fc3f7',
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        theme: {
          enabled: true,
          mode: 'system',
          light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
          dark: { backgroundColor: '#0f172a', color: '#475569' },
        },
      },
      layouts: { force: { link: {}, charge: {}, center: { x: 0, y: 0 } } },
      activeLayout: 'force',
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Settle-fit + contour recompute once the force simulation ends.
    onStoryTeardown(
      forceLayout.events.on('end', () => {
        canvas.camera.fitContent(graph.getBounds(), 100);
        contour.recompute();
      }),
    );

    canvas.camera.fitContent(graph.getBounds(), 100);

    // Stroke colour has two forms:
    //  - 'constant' : single 0xRRGGBB for every band (Observable default)
    //  - 'palette'  : per-band, tinted through a named palette
    type StrokeMode = 'constant' | 'palette';

    const settings = {
      visible: true,
      strokeMode: 'constant' as StrokeMode,
      strokeColorConst: 0x4682b4,
      palette: 'blues' as DensityContourPaletteName,
      indexEvery: 5,
      indexMajorWidth: 1,
      indexMinorWidth: 0.25,
      bandwidth: 30,
      thresholds: 20,
      cellSize: 4,
    };

    const gui = new GUI({ title: 'DensityContourStrokeLayer' });
    onStoryTeardown(() => gui.destroy());

    gui.add(settings, 'visible').name('Show contour').onChange((v: boolean) => {
      contour.visible = v;
    });

    const rebuildContour = (): void => {
      const o = contour.options as unknown as Record<string, unknown>;
      o.bandwidth = settings.bandwidth;
      o.thresholds = settings.thresholds;
      o.cellSize = settings.cellSize;
      o.indexEvery = settings.indexEvery;
      o.indexMajorWidth = settings.indexMajorWidth;
      o.indexMinorWidth = settings.indexMinorWidth;

      if (settings.strokeMode === 'constant') {
        o.strokeColor = settings.strokeColorConst;
        o.palette = undefined;
      } else {
        o.strokeColor = 'palette';
        o.palette = settings.palette;
      }

      contour.recompute();
    };

    const colorFolder = gui.addFolder('Stroke colour');
    const strokeColorCtl = colorFolder
      .addColor(settings, 'strokeColorConst')
      .name('Constant colour')
      .onChange(rebuildContour);
    const paletteCtl = colorFolder
      .add(settings, 'palette', [...DENSITY_CONTOUR_PALETTE_NAMES])
      .name('Named palette')
      .onChange(rebuildContour);

    const syncColorControls = (): void => {
      strokeColorCtl.show(settings.strokeMode === 'constant');
      paletteCtl.show(settings.strokeMode === 'palette');
    };

    colorFolder
      .add(settings, 'strokeMode', ['constant', 'palette'] satisfies StrokeMode[])
      .name('Mode')
      .onChange(() => {
        syncColorControls();
        rebuildContour();
      });

    syncColorControls();

    // Index-contour sliders — the topographic heavy/light pattern. With
    // `indexEvery: 5`, bands 0, 5, 10, 15… get `indexMajorWidth` and the
    // rest get `indexMinorWidth`. Set `indexMinorWidth: 0` to hide the
    // intermediate lines entirely and keep only the index contours.
    const indexFolder = gui.addFolder('Index contours');
    indexFolder.add(settings, 'indexEvery', 2, 10, 1).onChange(rebuildContour);
    indexFolder.add(settings, 'indexMajorWidth', 0.1, 3, 0.05).onChange(rebuildContour);
    indexFolder.add(settings, 'indexMinorWidth', 0, 1, 0.05).onChange(rebuildContour);

    const contourFolder = gui.addFolder('Contour');
    contourFolder.add(settings, 'bandwidth', 5, 100, 1).onChange(rebuildContour);
    contourFolder.add(settings, 'thresholds', 5, 40, 1).onChange(rebuildContour);
    contourFolder.add(settings, 'cellSize', [1, 2, 4, 8, 16]).onChange(rebuildContour);

    gui.add({ recompute: () => contour.recompute() }, 'recompute').name('Recompute now');
    gui.add(
      { fit: () => canvas.camera.fitContent(graph.getBounds(), 100) },
      'fit',
    ).name('Fit to content');
  },
};
