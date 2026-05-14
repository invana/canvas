/**
 * Force-directed collision detection — mirrors
 * https://observablehq.com/@d3/collision-detection/2.
 *
 * A flock of disconnected circles with variable radii. Three forces only:
 *   - `forceX` / `forceY` gently anchor the cloud at the origin.
 *   - `forceCollide` keeps the circles from overlapping, sized per-node
 *     from `node.data.size`.
 *
 * A pinned "pointer" node tracks the cursor in world-space; because it
 * participates in `forceCollide` with a much larger radius, the other
 * nodes flee out of its way and reveal the same crescent / wake the
 * Observable original shows.
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../div-util';

const POINTER_ID = '__pointer__';

interface NodeData {
  fill: number;
  size: number;
  alpha?: number;
}

const meta: Meta = { title: 'graph-layouts/d3-force/CollisionDetection' };
export default meta;
type Story = StoryObj;

export const CollisionDetection: Story = {
  render: () => createContainer({ id: 'graph-d3-collision' }),

  play: async ({ canvasElement }) => {
    // ── Settings ─────────────────────────────────────────────────────────
    const settings = {
      nodeCount: 200,
      minRadius: 4,
      maxRadius: 18,

      // Simulation parameters — match the Observable original
      // (https://observablehq.com/@d3/collision-detection/2): low
      // velocityDecay + very gentle xy anchor so the cluster stays loose
      // enough for forceCollide to actually untangle it.
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.0228,
      velocityDecay: 0.2,

      // forceX / forceY — a tiny pull is all that's needed; anything
      // stronger crushes the cluster against the origin and leaves small
      // circles trapped inside larger ones.
      xStrength: 0.002,
      yStrength: 0.002,

      // forceCollide
      collidePadding: 1,
      collideStrength: 1,
      collideIterations: 3,

      // Pointer follower
      pointerEnabled: true,
      pointerRadius: 60,
      pointerVisible: false,
    };

    // ── Data ─────────────────────────────────────────────────────────────
    // Disconnected nodes — `forceCollide` is the whole point of this demo,
    // so there are no edges. Radii are sampled uniformly in [min, max] and
    // mapped to a warm→cool hue so size and colour read together. The last
    // node is a pinned "pointer" that the cursor drives at runtime.
    const lerpChannel = (a: number, b: number, t: number): number =>
      Math.round(a + (b - a) * t);

    const buildGraphData = (): { nodes: GraphNode<NodeData>[]; edges: GraphEdge[] } => {
      const count = Math.max(1, Math.floor(settings.nodeCount));
      const minR = Math.min(settings.minRadius, settings.maxRadius);
      const maxR = Math.max(settings.minRadius, settings.maxRadius);

      const nodes: GraphNode<NodeData>[] = [];
      for (let i = 0; i < count; i++) {
        const r = minR + Math.random() * (maxR - minR);
        const t = maxR === minR ? 0 : (r - minR) / (maxR - minR);
        // Warm (small, amber) → cool (large, indigo).
        const fillR = lerpChannel(0xf5, 0x63, t) & 0xff;
        const fillG = lerpChannel(0x9e, 0x60, t) & 0xff;
        const fillB = lerpChannel(0x0b, 0xf1, t) & 0xff;
        nodes.push({
          id: String(i),
          // No explicit `position` — the layout leaves x/y undefined so
          // d3-force phyllotaxis-scatters all nodes from the origin at
          // a small radius. `forceCollide` then explodes them out to the
          // natural packing density, with `forceX`/`forceY` holding the
          // cluster centred. This matches the Observable original.
          data: { fill: (fillR << 16) | (fillG << 8) | fillB, size: r * 2 },
        });
      }

      // Pointer node — pinned (sim won't move it), large radius so collide
      // sweeps neighbours aside. Off-screen until the first pointermove.
      nodes.push({
        id: POINTER_ID,
        position: { x: 1e6, y: 1e6 },
        pinned: true,
        data: {
          fill: 0xffffff,
          size: settings.pointerRadius * 2,
          alpha: settings.pointerVisible ? 0.15 : 0,
        },
      });

      return { nodes, edges: [] };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    const container =
      canvasElement.querySelector<HTMLDivElement>('#graph-d3-collision')!;
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

    const graph = new GraphLayer({
      id: 'graph',
      options: {
        edgeDefaults: { stroke: 0x94a3b8, strokeWidth: 0.8, arrow: false },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    let layout: D3ForceLayout | null = null;

    const buildLayout = (): D3ForceLayout => {
      return new D3ForceLayout({
        alpha: settings.alpha,
        alphaMin: settings.alphaMin,
        alphaDecay: settings.alphaDecay,
        velocityDecay: settings.velocityDecay,
        x: { x: 0, strength: settings.xStrength },
        y: { y: 0, strength: settings.yStrength },
        collide: {
          // Per-node radius — circles use their visual radius (`size / 2`)
          // plus padding, and the pointer node uses its own large radius.
          radius: (n) => {
            const size = (n.data as NodeData | undefined)?.size ?? 0;
            return size / 2 + settings.collidePadding;
          },
          strength: settings.collideStrength,
          iterations: settings.collideIterations,
        },
      });
    };

    const run = (): void => {
      layout?.stop();
      graph.setData(buildGraphData());
      layout = buildLayout();
      void layout.apply(graph);
    };

    run();

    // ── Pointer follower ─────────────────────────────────────────────────
    // Convert screen coords to world coords via the camera, then write the
    // pointer node's position; the layout mirrors that onto the sim's
    // `fx/fy` (because the node is pinned) and reheats so neighbours
    // respond in the next tick.
    const onPointerMove = (event: PointerEvent): void => {
      if (!settings.pointerEnabled) return;
      const rect = container.getBoundingClientRect();
      const screenX = event.clientX - rect.left;
      const screenY = event.clientY - rect.top;
      const world = canvas.camera.toWorld(screenX, screenY);
      graph.store.setPosition(POINTER_ID, { x: world.x, y: world.y });
    };
    const onPointerLeave = (): void => {
      // Park the pointer far off-screen so it stops pushing nodes when the
      // cursor leaves the canvas.
      graph.store.setPosition(POINTER_ID, { x: 1e6, y: 1e6 });
    };
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('pointerleave', onPointerLeave);
    onStoryTeardown(() => container.removeEventListener('pointermove', onPointerMove));
    onStoryTeardown(() => container.removeEventListener('pointerleave', onPointerLeave));

    // ── GUI ──────────────────────────────────────────────────────────────
    const gui = new GUI({ title: 'D3ForceLayout — CollisionDetection' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => layout?.stop());

    const data = gui.addFolder('Nodes');
    data.add(settings, 'nodeCount', 10, 1000, 10);
    data.add(settings, 'minRadius', 1, 40, 1);
    data.add(settings, 'maxRadius', 1, 80, 1);

    const sim = gui.addFolder('Simulation');
    sim.add(settings, 'alpha', 0, 1, 0.01);
    sim.add(settings, 'alphaMin', 0.0001, 0.1, 0.0001);
    sim.add(settings, 'alphaDecay', 0.001, 0.1, 0.001);
    sim.add(settings, 'velocityDecay', 0, 1, 0.01);

    const anchor = gui.addFolder('forceX / forceY');
    anchor.add(settings, 'xStrength', 0, 1, 0.005).name('x.strength');
    anchor.add(settings, 'yStrength', 0, 1, 0.005).name('y.strength');

    const collide = gui.addFolder('forceCollide');
    collide.add(settings, 'collidePadding', 0, 20, 0.5).name('padding');
    collide.add(settings, 'collideStrength', 0, 1, 0.01).name('strength');
    collide.add(settings, 'collideIterations', 1, 10, 1).name('iterations');

    const pointer = gui.addFolder('Pointer');
    pointer.add(settings, 'pointerEnabled').name('enabled');
    pointer.add(settings, 'pointerRadius', 5, 200, 1).name('radius');
    pointer.add(settings, 'pointerVisible').name('show overlay');

    gui.add({ apply: () => run() }, 'apply').name('Apply (rebuild + run)');
    gui.add({ stop: () => layout?.stop() }, 'stop').name('Stop');
    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
