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

import type { Meta, StoryObj } from '@storybook/react-vite';
import { BackgroundLayer, DragPanBehaviour, WheelZoomBehaviour } from '@invana/canvas';
import {
  DragNodeBehaviour,
  GraphCanvas,
  GraphLayer,
  type GraphEdge,
  type GraphNode,
} from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../../../div-util';
import { SystemThemeBehaviour } from '../../../system-theme';

const POINTER_ID = '__pointer__';

interface NodeData {
  /** Visual + collision radius. The pointer node ignores this and uses
   *  `settings.pointerRadius` live, so collide-and-flee responds to the GUI. */
  radius: number;
  kind: 'circle' | 'pointer';
}

const meta: Meta = { title: 'canvas/graph-layouts/d3-force/CollisionDetection' };
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
    // so there are no edges. Radii are sampled uniformly in [min, max]; the
    // colour mapping (warm small → cool large) lives in the layer-level
    // `bgFill` resolver below. The last node is a pinned "pointer" that
    // the cursor drives at runtime.
    const lerpChannel = (a: number, b: number, t: number): number =>
      Math.round(a + (b - a) * t);

    const buildGraphData = (): { nodes: GraphNode<NodeData>[]; edges: GraphEdge[] } => {
      const count = Math.max(1, Math.floor(settings.nodeCount));
      const minR = Math.min(settings.minRadius, settings.maxRadius);
      const maxR = Math.max(settings.minRadius, settings.maxRadius);

      const nodes: GraphNode<NodeData>[] = [];
      for (let i = 0; i < count; i++) {
        const r = minR + Math.random() * (maxR - minR);
        nodes.push({
          id: String(i),
          // No explicit `position` — the layout leaves x/y undefined so
          // d3-force phyllotaxis-scatters all nodes from the origin at
          // a small radius. `forceCollide` then explodes them out to the
          // natural packing density, with `forceX`/`forceY` holding the
          // cluster centred. This matches the Observable original.
          data: { radius: r, kind: 'circle' },
        });
      }

      // Pointer node — pinned (sim won't move it), large radius so collide
      // sweeps neighbours aside. Off-screen until the first pointermove.
      nodes.push({
        id: POINTER_ID,
        position: { x: 1e6, y: 1e6 },
        pinned: true,
        data: { radius: settings.pointerRadius, kind: 'pointer' },
      });

      return { nodes, edges: [] };
    };

    // ── Canvas setup ─────────────────────────────────────────────────────
    // Register everything by id first; `init()` (last) mounts it all,
    // applies `canvasOptions`, enables behaviours, and auto-runs the active
    // layout against the graph's `initData`.
    const container =
      canvasElement.querySelector<HTMLDivElement>('#graph-d3-collision')!;
    const canvas = new GraphCanvas();
    onStoryTeardown(() => canvas.destroy());

    canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));

    // Node template carries resolver functions (`shape`, `bgFill`, `bgAlpha`
    // all depend on per-node radius / kind and live GUI state) → it stays in
    // the constructor. The literal edge style goes to config. `initData` is
    // the layer's content.
    const graph = new GraphLayer({
      id: 'graph',
      options: {
        initData: buildGraphData(),
        node: {
          style: {
            // Pointer follows `settings.pointerRadius` live; circles take
            // the radius sampled at build time.
            shape: (n: GraphNode) => {
              const d = n.data as NodeData;
              return {
                kind: 'circle',
                radius: d.kind === 'pointer' ? settings.pointerRadius : d.radius,
              };
            },
            // Pointer is white; circles map their radius to a warm→cool hue
            // against the current [min, max] window so size and colour
            // read together as the sliders change.
            bgFill: (n: GraphNode) => {
              const d = n.data as NodeData;
              if (d.kind === 'pointer') return 0xffffff;
              const minR = Math.min(settings.minRadius, settings.maxRadius);
              const maxR = Math.max(settings.minRadius, settings.maxRadius);
              const t = maxR === minR ? 0 : (d.radius - minR) / (maxR - minR);
              const fillR = lerpChannel(0xf5, 0x63, t) & 0xff;
              const fillG = lerpChannel(0x9e, 0x60, t) & 0xff;
              const fillB = lerpChannel(0x0b, 0xf1, t) & 0xff;
              return (fillR << 16) | (fillG << 8) | fillB;
            },
            bgAlpha: (n: GraphNode) => {
              const d = n.data as NodeData;
              if (d.kind === 'pointer') return settings.pointerVisible ? 0.15 : 0;
              return 1;
            },
          },
        },
      },
    });
    canvas.layers.add(graph);

    canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
    canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
    canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph' }));
    canvas.behaviours.register(new SystemThemeBehaviour({ id: 'system-theme', layerId: 'bg' }));

    // Collide `radius` is a per-node resolver, but it rides on the layout's
    // own param bag (applied via `setOptions`), so it can live in config
    // with the rest of the force params.
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
          edge: { style: { strokeColor: 0x94a3b8, strokeWidth: 0.8, arrowTargetShape: 'none' } },
        },
      },
      behaviours: {
        pan: { enabled: true },
        zoom: { enabled: true },
        'drag-node': { enabled: true },
        'system-theme': {
          enabled: true,
          light: { backgroundColor: '#f8fafc', color: '#94a3b8' },
          dark: { backgroundColor: '#0f172a', color: '#475569' },
        },
      },
      layouts: {
        force: {
          alpha: settings.alpha,
          alphaMin: settings.alphaMin,
          alphaDecay: settings.alphaDecay,
          velocityDecay: settings.velocityDecay,
          x: { x: 0, strength: settings.xStrength },
          y: { y: 0, strength: settings.yStrength },
          collide: {
            // Per-node radius — circles use their stored radius; the pointer
            // node tracks the GUI slider live so collide-and-flee responds.
            radius: (n: GraphNode) => {
              const d = n.data as NodeData | undefined;
              if (!d) return settings.collidePadding;
              const r = d.kind === 'pointer' ? settings.pointerRadius : d.radius;
              return r + settings.collidePadding;
            },
            padding: settings.collidePadding,
            strength: settings.collideStrength,
            iterations: settings.collideIterations,
          },
        },
      },
      activeLayout: 'force',
    };

    await canvas.init({ container, autoResize: true, config: canvasOptions });

    // Rebuild the cloud with the current node-count / radius window, then
    // push it as fresh data — the topology change auto-reruns the active
    // layout. Bound to the "Apply" button below.
    const rebuild = (): void => {
      graph.setData(buildGraphData());
    };

    // Push the current force params live; the layout re-heats on
    // `setOptions`. Bound to the simulation / force sliders. Mirror the
    // collide padding into `settings` first so the per-node `radius`
    // resolver (which closes over `settings`) sees the new value too.
    const pushLayout = (): void => {
      settings.collidePadding = canvasOptions.layouts.force.collide.padding;
      canvas.update({ layouts: { force: canvasOptions.layouts.force } });
    };

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
    // GUI binds to `canvasOptions.layouts.force` (the config is the source
    // of truth). Sim / force edits push live via `pushLayout` on
    // `onFinishChange` so the sim re-heats once per drag.
    const gui = new GUI({ title: 'D3ForceLayout — CollisionDetection' });
    onStoryTeardown(() => gui.destroy());
    onStoryTeardown(() => forceLayout.stop());

    const force = canvasOptions.layouts.force;

    const data = gui.addFolder('Nodes');
    data.add(settings, 'nodeCount', 10, 1000, 10);
    data.add(settings, 'minRadius', 1, 40, 1);
    data.add(settings, 'maxRadius', 1, 80, 1);

    const sim = gui.addFolder('Simulation');
    sim.add(force, 'alpha', 0, 1, 0.01).onFinishChange(pushLayout);
    sim.add(force, 'alphaMin', 0.0001, 0.1, 0.0001).onFinishChange(pushLayout);
    sim.add(force, 'alphaDecay', 0.001, 0.1, 0.001).onFinishChange(pushLayout);
    sim.add(force, 'velocityDecay', 0, 1, 0.01).onFinishChange(pushLayout);

    const anchor = gui.addFolder('forceX / forceY');
    anchor.add(force.x, 'strength', 0, 1, 0.005).name('x.strength').onFinishChange(pushLayout);
    anchor.add(force.y, 'strength', 0, 1, 0.005).name('y.strength').onFinishChange(pushLayout);

    const collide = gui.addFolder('forceCollide');
    collide.add(force.collide, 'padding', 0, 20, 0.5).name('padding').onFinishChange(pushLayout);
    collide.add(force.collide, 'strength', 0, 1, 0.01).name('strength').onFinishChange(pushLayout);
    collide
      .add(force.collide, 'iterations', 1, 10, 1)
      .name('iterations')
      .onFinishChange(pushLayout);

    const pointer = gui.addFolder('Pointer');
    pointer.add(settings, 'pointerEnabled').name('enabled');
    pointer.add(settings, 'pointerRadius', 5, 200, 1).name('radius');
    pointer.add(settings, 'pointerVisible').name('show overlay');

    gui.add({ apply: () => rebuild() }, 'apply').name('Apply (rebuild + run)');
    gui.add({ stop: () => forceLayout.stop() }, 'stop').name('Stop');
    gui
      .add({ fit: () => canvas.camera.fitContent(graph.getBounds(), 80) }, 'fit')
      .name('Fit to content');
  },
};
