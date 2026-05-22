import type { Meta, StoryObj } from '@storybook/react-vite';
import { Canvas, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import { GraphLayer, type EdgeData, type EdgeShapeOptions, type NodeData } from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../../div-util';

const meta: Meta = { title: 'canvas/graph/Edges/Stroke/Variants' };
export default meta;
type Story = StoryObj;

/**
 * Static showcase grid: every built-in `pathType` (rows) × every common
 * stroke dash variant (columns). Reads top-to-bottom for routers and
 * left-to-right for stroke pattern, so the eye can compare e.g. how a
 * dotted `manhattan` reads vs a dotted `bezier` without touching any
 * controls.
 *
 * Columns demonstrate that `EdgeStyle.strokeDashArray = [on, off]` plus
 * `strokeCap` cover the conventional "solid / dotted / dashed" spectrum:
 *
 *   - solid       → `[0, 0]`              (no dash period)
 *   - dotted      → `[1, 4]` + `round`    (round-capped tight pips)
 *   - short-dash  → `[4, 4]`
 *   - dashed      → `[10, 6]`
 *   - long-dash   → `[18, 8]`
 *
 * Rows cover every built-in `pathType`: `straight`, `bezier`,
 * `bump-radial`, `smooth`, `rounded`, `orth`, `manhattan`.
 */
export const Variants: Story = {
  render: () => createContainer({ id: 'graph-edges-stroke-variants' }),

  play: async ({ canvasElement }) => {
    // Cell geometry. Columns step 220px, rows step 110px. Each edge
    // travels 160px horizontally and 50px vertically — the vertical
    // delta gives the orth-family routers something to bridge, otherwise
    // they collapse to a flat line.
    const COL_PITCH = 220;
    const ROW_PITCH = 110;
    const EDGE_DX = 160;
    const EDGE_DY = 50;
    const HEADER_Y = -70;

    // Column variants. Tuple = [name, dashArray, strokeCap]. The
    // `[0, 0]` solid variant is read by the renderer as "no dash
    // period" — the same idiom used in Interactive.
    const VARIANTS: ReadonlyArray<{
      name: string;
      dashArray: readonly [number, number];
      cap: 'butt' | 'round' | 'square';
    }> = [
      { name: 'solid',      dashArray: [0, 0],   cap: 'butt'  },
      { name: 'dotted',     dashArray: [1, 4],   cap: 'round' },
      { name: 'short-dash', dashArray: [4, 4],   cap: 'butt'  },
      { name: 'dashed',     dashArray: [10, 6],  cap: 'butt'  },
      { name: 'long-dash',  dashArray: [18, 8],  cap: 'butt'  },
    ];

    // Row pathTypes. For routers that take a `pathStyleOpts` payload
    // (bezier, bump-radial) carry the structural opts here so each cell
    // produces the same intra-cell curve regardless of column.
    const PATH_TYPES: ReadonlyArray<{
      name: string;
      shapeFor: (srcX: number, srcY: number) => EdgeShapeOptions;
    }> = [
      { name: 'straight',
        shapeFor: () => ({ pathType: 'straight' }) },
      { name: 'bezier',
        shapeFor: () => ({ pathType: 'bezier', pathStyleOpts: { axis: 'h', tension: 0.6 } }) },
      { name: 'bump-radial',
        // Origin sits 800px left of the cell so r0 ≈ 800, r1 ≈ 962:
        // ratio ~1.2 gives visible curvature without dominating the cell.
        shapeFor: (srcX, srcY) => ({
          pathType: 'bump-radial',
          pathStyleOpts: { origin: { x: srcX - 800, y: srcY } },
        }) },
      { name: 'smooth',
        shapeFor: () => ({ pathType: 'smooth' }) },
      { name: 'rounded',
        shapeFor: () => ({ pathType: 'rounded' }) },
      { name: 'orth',
        shapeFor: () => ({ pathType: 'orth' }) },
      { name: 'manhattan',
        shapeFor: () => ({ pathType: 'manhattan' }) },
    ];

    const nodes: NodeData[] = [];
    const edges: EdgeData[] = [];

    // Column header nodes: invisible-ish anchors that carry the variant
    // label above. Tiny radius + bg matched to background so only the
    // label reads.
    for (let c = 0; c < VARIANTS.length; c++) {
      const v = VARIANTS[c]!;
      nodes.push({
        id: `header-${c}`,
        position: { x: c * COL_PITCH + EDGE_DX / 2, y: HEADER_Y },
        style: {
          shape: { kind: 'circle', radius: 0.5 },
          bgFill: 0xffffff,
          bgStrokeWidth: 0,
          labelText: v.name,
          labelPlacement: 'top',
          labelFontSize: 12,
          labelFontWeight: 700,
          labelColor: 0x0f172a,
          labelOffsetY: 0,
        },
      });
    }

    // Source + target node per cell. Row label lives on column-0
    // sources only (placement: 'left'); other sources are unlabelled.
    for (let r = 0; r < PATH_TYPES.length; r++) {
      const row = PATH_TYPES[r]!;
      const rowY = r * ROW_PITCH;

      for (let c = 0; c < VARIANTS.length; c++) {
        const variant = VARIANTS[c]!;
        const srcX = c * COL_PITCH;
        const srcY = rowY;
        const tgtX = srcX + EDGE_DX;
        const tgtY = rowY + EDGE_DY;
        const cell = `${row.name}-${variant.name}`;

        nodes.push({
          id: `src-${cell}`,
          position: { x: srcX, y: srcY },
          style: c === 0 ? { labelText: row.name } : {},
        });
        nodes.push({
          id: `tgt-${cell}`,
          position: { x: tgtX, y: tgtY },
        });

        edges.push({
          id: `edge-${cell}`,
          source: `src-${cell}`,
          target: `tgt-${cell}`,
          style: {
            shape: row.shapeFor(srcX, srcY),
            strokeDashArray: variant.dashArray,
            strokeCap: variant.cap,
          },
        });
      }
    }

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-edges-stroke-variants')!;
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
            shape: { kind: 'circle', radius: 7 },
            bgFill: 0xe5e7eb,
            bgStrokeColor: 0x9ca3af,
            bgStrokeWidth: 1,
            labelFontSize: 11,
            labelFontWeight: 600,
            labelColor: 0x475569,
            labelPlacement: 'left',
            labelOffsetX: -6,
          },
        },
        edge: {
          style: {
            strokeColor: 0x1d4ed8,
            strokeAlpha: 1,
            strokeWidth: 2,
            strokeAlignment: 'center',
            strokeJoin: 'round',
            arrowTargetShape: 'triangle',
          },
        },
      },
    });
    canvas.layers.add(graph);
    graph.setData({ nodes, edges });
    canvas.camera.fitContent(graph.getBounds(), 80);
  },
};
