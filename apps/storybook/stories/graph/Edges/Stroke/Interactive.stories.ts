import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphCanvas, GraphLayer, type GraphEdge, type GraphNode } from '@invana/graph';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Edges/Stroke/Interactive' };
export default meta;
type Story = StoryObj;

/**
 * Path-stroke options on `EdgeStyle` — `strokeColor`, `strokeAlpha`,
 * `strokeWidth`, `strokeAlignment` (`inside` / `center` / `outside`),
 * `strokeDashArray` (`[on, off]`), `strokeDashOffset`, `strokeCap`, and
 * `strokeJoin`.
 *
 * One row per built-in `pathType` — `straight`, `bezier`, `bump-radial`,
 * `smooth`, `rounded`, `orth`, `manhattan` — so each tweak is exercised
 * against every router/path-style combo. The lil-gui knobs all fan out to
 * every edge via field-level resolvers on the layer template — the
 * per-edge data only carries `{ id, source, target, style: { shape } }`
 * plus the row label on the source node.
 *
 * The stroke channels are resolver functions, so they stay in the layer
 * constructor `options.edge.style`; the literal node template + the
 * `arrowTargetShape` literal live in `canvasOptions.layers.graph`.
 *
 * Set both `dash on` and `dash off` to 0 to disable dashing (solid line).
 */
export const Interactive: Story = {
  render: () => createContainer({ id: 'graph-edges-stroke-interactive' }),

  play: async ({ canvasElement }) => {
    // 7 rows. Sources on the left tagged with the pathType as a label so
    // viewers can read off which row is which; targets unlabelled. Row
    // pitch 110, target.y = source.y + 60 so the orth-family routers have
    // a vertical delta to bridge (otherwise they collapse to a flat line).
    const nodes: GraphNode[] = [
      { type: 'node', id: 'straight-src',    position: { x: -240, y: -330 }, style: { labelText: 'straight' } },
      { type: 'node', id: 'bezier-src',      position: { x: -240, y: -220 }, style: { labelText: 'bezier' } },
      { type: 'node', id: 'bump-radial-src', position: { x: -240, y: -110 }, style: { labelText: 'bump-radial' } },
      { type: 'node', id: 'smooth-src',      position: { x: -240, y:    0 }, style: { labelText: 'smooth' } },
      { type: 'node', id: 'rounded-src',     position: { x: -240, y:  110 }, style: { labelText: 'rounded' } },
      { type: 'node', id: 'orth-src',        position: { x: -240, y:  220 }, style: { labelText: 'orth' } },
      { type: 'node', id: 'manhattan-src',   position: { x: -240, y:  330 }, style: { labelText: 'manhattan' } },
      { type: 'node', id: 'straight-tgt',    position: { x:  240, y: -270 } },
      { type: 'node', id: 'bezier-tgt',      position: { x:  240, y: -160 } },
      { type: 'node', id: 'bump-radial-tgt', position: { x:  240, y:  -50 } },
      { type: 'node', id: 'smooth-tgt',      position: { x:  240, y:   60 } },
      { type: 'node', id: 'rounded-tgt',     position: { x:  240, y:  170 } },
      { type: 'node', id: 'orth-tgt',        position: { x:  240, y:  280 } },
      { type: 'node', id: 'manhattan-tgt',   position: { x:  240, y:  390 } },
    ];

    // Per-edge style carries only the structural `shape.pathType` (and
    // pathStyleOpts where the path style needs them). Everything else —
    // stroke channels — flows from the layer-template resolvers below.
    const edges: GraphEdge[] = [
      { type: 'edge', id: 'straight',    source: 'straight-src',    target: 'straight-tgt',
        style: { shape: { pathType: 'straight' } } },
      { type: 'edge', id: 'bezier',      source: 'bezier-src',      target: 'bezier-tgt',
        style: { shape: { pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } } } },
      { type: 'edge', id: 'bump-radial', source: 'bump-radial-src', target: 'bump-radial-tgt',
        // Polar origin sits well off to the left so the two endpoints land
        // on the same general angular ray but at clearly different radii —
        // r0 ≈ 376, r1 ≈ 842. With `origin: (0, 0)` (the bump-radial
        // default) and this grid layout, r0 ≈ r1 and the curve collapses
        // visually to a near-straight line — bump-radial really wants a
        // genuine radial layout to read correctly.
        style: { shape: { pathType: 'bump-radial', pathStyleOpts: { origin: { x: -600, y: 0 } } } } },
      { type: 'edge', id: 'smooth',      source: 'smooth-src',      target: 'smooth-tgt',
        style: { shape: { pathType: 'smooth' } } },
      { type: 'edge', id: 'rounded',     source: 'rounded-src',     target: 'rounded-tgt',
        style: { shape: { pathType: 'rounded' } } },
      { type: 'edge', id: 'orth',        source: 'orth-src',        target: 'orth-tgt',
        style: { shape: { pathType: 'orth' } } },
      { type: 'edge', id: 'manhattan',   source: 'manhattan-src',   target: 'manhattan-tgt',
        style: { shape: { pathType: 'manhattan' } } },
    ];

    // Closed over by the resolvers below. Mutated by lil-gui handlers.
    const settings = {
      strokeColor: 0x1d4ed8,
      strokeAlpha: 1,
      strokeWidth: 2,
      strokeAlignment: 'center' as 'inside' | 'center' | 'outside',
      dashOn: 0,
      dashOff: 0,
      dashOffset: 0,
      strokeCap: 'butt' as 'butt' | 'round' | 'square',
      strokeJoin: 'miter' as 'miter' | 'round' | 'bevel'
    };

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edges-stroke-interactive')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges },
        // Stroke channels are resolver functions, so they stay here in the
        // constructor — only the literal `arrowTargetShape` moves to config.
        edge: {
          style: {
            strokeColor:        () => settings.strokeColor,
            strokeAlpha:        () => settings.strokeAlpha,
            strokeWidth:        () => settings.strokeWidth,
            strokeAlignment:    () => settings.strokeAlignment,
            // The Resolvable form requires a non-undefined return, so the
            // tuple is always set. Both endpoints at 0 reads as a solid
            // stroke (no dash period). Bump either > 0 to dash.
            strokeDashArray:    () => [settings.dashOn, settings.dashOff] as const,
            strokeDashOffset:   () => settings.dashOffset,
            strokeCap:          () => settings.strokeCap,
            strokeJoin:         () => settings.strokeJoin
          }
        }
      }
    });
    canvas.layers.add(graph);
    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));

    const canvasOptions = {
      layers: {
        graph: {
          node: {
            style: {
              shape: { kind: 'circle', radius: 9 },
              bgFill: 0xe5e7eb,
              bgStrokeColor: 0x9ca3af,
              bgStrokeWidth: 1,
              labelFontSize: 11,
              labelFontWeight: 600,
              labelColor: 0x475569,
              labelPlacement: 'left',
              labelOffsetX: -6
            }
          },
          edge: { style: { arrowTargetShape: 'triangle' } }
        }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);

    // Trigger re-resolve on every edge so resolvers pick up the mutated
    // `settings` and re-emit the spec to the renderer. Pass each edge's
    // existing `style` back so the structural `shape.pathType` is preserved
    // — `updateEdge` replaces `style` wholesale.
    const rerenderAll = (): void => {
      for (const edge of graph.store.edges()) {
        graph.store.updateEdge(edge.id, { style: edge.style });
      }
    };

    const gui = new GUI({ title: 'Edge stroke' });
    onStoryTeardown(() => gui.destroy());

    const s = gui.addFolder('stroke');
    s.addColor(settings, 'strokeColor').name('color').onChange(rerenderAll);
    s.add(settings, 'strokeAlpha', 0, 1, 0.05).name('alpha').onChange(rerenderAll);
    s.add(settings, 'strokeWidth', 0, 16, 0.5).name('width').onChange(rerenderAll);
    s.add(settings, 'strokeAlignment', ['inside', 'center', 'outside']).name('alignment').onChange(rerenderAll);
    s.add(settings, 'strokeCap', ['butt', 'round', 'square']).name('cap').onChange(rerenderAll);
    s.add(settings, 'strokeJoin', ['miter', 'round', 'bevel']).name('join').onChange(rerenderAll);

    const d = gui.addFolder('dash');
    d.add(settings, 'dashOn', 0, 40, 1).name('on (0 = solid)').onChange(rerenderAll);
    d.add(settings, 'dashOff', 0, 40, 1).name('off (0 = solid)').onChange(rerenderAll);
    d.add(settings, 'dashOffset', 0, 40, 1).name('offset').onChange(rerenderAll);
  }
};
