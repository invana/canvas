import type { Meta, StoryObj } from '@storybook/react-vite';
import { DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  GraphCanvas,
  GraphLayer,
  type CanonicalStateName,
  type CompositeShapeOption,
  type GraphNode
} from '@invana/graph';
import { createContainer, onStoryTeardown } from '../../../div-util';

const meta: Meta = { title: 'graph/Nodes/Types/Folder' };
export default meta;
type Story = StoryObj;

/**
 * Catalogue story for a **folder** node — a macOS Finder-style two-tone
 * folder with its name centred below it.
 *
 * Draws a 3×2 grid, one folder per standard appearance: the resting
 * `default` plus the five canonical interaction states (`hovered`,
 * `selected`, `highlighted`, `dimmed`, `disabled`). State is supplied
 * data-driven via the `states` field on each `GraphNode`; the label is the
 * folder's `name`.
 */
export const FolderStory: Story = {
  name: 'Folder',
  render: () => createContainer({ id: 'graph-node-types-folder' }),

  play: async ({ canvasElement }) => {
    const container = canvasElement.querySelector<HTMLDivElement>('#graph-node-types-folder')!;

    /** Back panel + tab — the darker blue behind the front flap. */
    const FOLDER_BACK = 0x4aa8e8;
    /** Front flap — the lighter blue that carries most of the silhouette. */
    const FOLDER_FRONT = 0x74c4f4;
    /** Hairline highlight along the front flap's top edge. */
    const FOLDER_SHINE = 0xa8dcfa;

    /** Overall folder width. */
    const WIDTH = 96;
    /** Overall folder height, tab included — the composite's box. */
    const HEIGHT = 82;
    /** Fillet on the body's three outer corners. */
    const RADIUS = 8;
    /** Fillet on the tab's two top corners. */
    const TAB_RADIUS = 5;
    /** Fillet on the concave shoulder where the tab's slant meets the body. */
    const SHOULDER_RADIUS = 3;
    /** Tab width at its base. */
    const TAB_WIDTH = 40;
    /** Horizontal run of the tab's slanted right edge. */
    const TAB_SKEW = 6;
    /** How far the tab rises above the body. */
    const TAB_RISE = 10;
    /** How far the front flap sits below the body's top edge. */
    const FRONT_DROP = 10;
    /** Arc samples per rounded corner. */
    const FILLET_STEPS = 6;

    interface Pt {
      readonly x: number;
      readonly y: number;
    }

    /**
     * Round each corner of a closed polygon by replacing the vertex with a sampled
     * circular arc tangent to both adjoining edges. Works for convex and concave
     * corners alike; each radius is clamped so a fillet never eats more than half
     * of either adjoining edge. `PolygonSpec` has no corner-radius field, so the
     * rounding has to live in the vertices themselves.
     */
    function filletPolygon(corners: readonly { readonly p: Pt; readonly r: number }[]): Pt[] {
      const out: Pt[] = [];
      const n = corners.length;
      for (let i = 0; i < n; i++) {
        const { p, r } = corners[i]!;
        const a = corners[(i + n - 1) % n]!.p;
        const b = corners[(i + 1) % n]!.p;
        const la = Math.hypot(a.x - p.x, a.y - p.y);
        const lb = Math.hypot(b.x - p.x, b.y - p.y);
        const u1 = { x: (a.x - p.x) / la, y: (a.y - p.y) / la };
        const u2 = { x: (b.x - p.x) / lb, y: (b.y - p.y) / lb };
        const theta = Math.acos(Math.max(-1, Math.min(1, u1.x * u2.x + u1.y * u2.y)));
        if (r <= 0 || theta < 1e-3 || Math.PI - theta < 1e-3) {
          out.push(p);
          continue;
        }
        // Tangent distance from the vertex, clamped to half of each edge.
        const d = Math.min(r / Math.tan(theta / 2), la / 2, lb / 2);
        const rr = d * Math.tan(theta / 2);
        const bl = Math.hypot(u1.x + u2.x, u1.y + u2.y);
        const h = rr / Math.sin(theta / 2);
        const c = { x: p.x + ((u1.x + u2.x) / bl) * h, y: p.y + ((u1.y + u2.y) / bl) * h };
        const t1 = { x: p.x + u1.x * d, y: p.y + u1.y * d };
        const t2 = { x: p.x + u2.x * d, y: p.y + u2.y * d };
        const a1 = Math.atan2(t1.y - c.y, t1.x - c.x);
        let sweep = Math.atan2(t2.y - c.y, t2.x - c.x) - a1;
        if (sweep > Math.PI) sweep -= 2 * Math.PI;
        if (sweep < -Math.PI) sweep += 2 * Math.PI;
        for (let s = 0; s <= FILLET_STEPS; s++) {
          const ang = a1 + (sweep * s) / FILLET_STEPS;
          out.push({ x: c.x + Math.cos(ang) * rr, y: c.y + Math.sin(ang) * rr });
        }
      }
      return out;
    }

    /**
     * The whole folder silhouette — tab and body as **one** closed outline, in the
     * composite box's top-left coordinates, then shifted centre-relative (the
     * `PolygonSpec` convention). Clockwise from the tab's top-left.
     */
    const FOLDER_OUTLINE: Pt[] = filletPolygon([
      { p: { x: 0, y: 0 }, r: TAB_RADIUS },
      { p: { x: TAB_WIDTH - TAB_SKEW, y: 0 }, r: TAB_RADIUS },
      { p: { x: TAB_WIDTH, y: TAB_RISE }, r: SHOULDER_RADIUS },
      { p: { x: WIDTH, y: TAB_RISE }, r: RADIUS },
      { p: { x: WIDTH, y: HEIGHT }, r: RADIUS },
      { p: { x: 0, y: HEIGHT }, r: RADIUS }
    ]).map((v) => ({ x: v.x - WIDTH / 2, y: v.y - HEIGHT / 2 }));

    /** Top of the front flap, in box coordinates. */
    const FRONT_TOP = TAB_RISE + FRONT_DROP;

    /**
     * A macOS-style two-tone folder, composed from the `composite` shape kind:
     *
     * - **root** — a `polygon` tracing the **entire** folder (tab + body) with
     *   filleted corners, painted as the darker back panel. Because the tab is
     *   part of the root, hover rings, halos and highlight outlines wrap the whole
     *   silhouette, and hit-testing includes the tab.
     * - **front flap** — a lighter rounded `rect` part dropped `FRONT_DROP` px
     *   below the body's top, sharing the root's bottom corners.
     * - **shine** — a hairline along the front flap's top edge.
     *
     * Known limit: parts are painted independently of the root, so under
     * `dimmed` the flap and back panel blend slightly where they overlap, and
     * `disabled` greys the root but not the flap.
     */
    const folderShape: CompositeShapeOption = {
      kind: 'composite',
      width: WIDTH,
      height: HEIGHT,
      root: { kind: 'polygon', x: 0, y: 0, fill: FOLDER_BACK, vertices: FOLDER_OUTLINE },
      parts: [
        { part: 'rect', x: 0, y: FRONT_TOP, width: WIDTH, height: HEIGHT - FRONT_TOP, cornerRadius: RADIUS, fill: FOLDER_FRONT },
        { part: 'line', x: RADIUS, y: FRONT_TOP + 0.5, x2: WIDTH - RADIUS, y2: FRONT_TOP + 0.5, stroke: { color: FOLDER_SHINE, width: 1 } }
      ]
    };

    interface FolderData {
      readonly name: string;
      readonly state: 'default' | CanonicalStateName;
    }

    // 3×2 grid. Cell pitch 200 × 180. Origin at (0, 0).
    const nodes: GraphNode<FolderData>[] = [
      { type: 'node', id: 'f-documents',    position: { x: -200, y: -90 }, data: { name: 'Documents',    state: 'default'     } },
      { type: 'node', id: 'f-downloads',    position: { x:    0, y: -90 }, data: { name: 'Downloads',    state: 'hovered'     }, states: ['hovered']     },
      { type: 'node', id: 'f-desktop',      position: { x:  200, y: -90 }, data: { name: 'Desktop',      state: 'selected'    }, states: ['selected']    },
      { type: 'node', id: 'f-pictures',     position: { x: -200, y:  90 }, data: { name: 'Pictures',     state: 'highlighted' }, states: ['highlighted'] },
      { type: 'node', id: 'f-music',        position: { x:    0, y:  90 }, data: { name: 'Music',        state: 'dimmed'      }, states: ['dimmed']      },
      { type: 'node', id: 'f-applications', position: { x:  200, y:  90 }, data: { name: 'Applications', state: 'disabled'    }, states: ['disabled']    },
    ];

    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    // Resolver fields (labelText) stay in the constructor; literal style
    // moves into canvasOptions and shallow-merges at init.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: { nodes, edges: [] },
        node: {
          style: {
            labelText: (n: GraphNode) => (n.data as FolderData | undefined)?.name ?? ''
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
              shape: folderShape,
              bgStrokeWidth: 0,
              labelColor: 0x0f172a,
              labelFontSize: 12,
              labelFontWeight: 500,
              labelPlacement: 'bottom',
              labelOffsetY: 10
            }
          }
        }
      },
      behaviours: { pan: { enabled: true }, zoom: { enabled: true } }
    };
    await canvas.init({ container, autoResize: true, config: canvasOptions });
    canvas.camera.fitContent(graph.getBounds(), 80);
  }
};
