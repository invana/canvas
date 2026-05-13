import type { Meta, StoryObj } from '@storybook/html-vite';
import {
  BackgroundLayer,
  Canvas,
  DragPanBehaviour,
  WheelZoomBehaviour,
} from '@invana/canvas';
import { DragNodeBehaviour, GraphLayer, type GraphNode } from '@invana/graph';
import { D3ForceLayout } from '@invana/graph-layout-d3-force';
import { lesMiserables } from '@invana/graph-datasets';
import GUI from 'lil-gui';
import { createContainer, onStoryTeardown } from '../div-util';

const meta: Meta = { title: 'graph-layouts-force-d3/LesMiserables' };
export default meta;
type Story = StoryObj;

export const LesMiserables: Story = {
  render: () => createContainer({ id: 'graph-d3-force' }),

  play: async ({ canvasElement }) => {
    // Eleven distinct hues, one per Les Mis "group" id (0–10).
    const groupColors = [
      0x9ca3af, 0xef4444, 0xf59e0b, 0xeab308, 0x10b981, 0x06b6d4,
      0x3b82f6, 0x8b5cf6, 0xec4899, 0x14b8a6, 0xa3e635,
    ];

    // Map the dataset into GraphNodes with group-derived fill colour. We
    // leave `position` unset so the layout chooses an initial scatter.
    const nodes: GraphNode[] = lesMiserables.nodes.map((n) => ({
      id: n.id,
      data: {
        group: n.data.group,
        fill: groupColors[n.data.group % groupColors.length],
        size: 18,
      },
    }));

    const container = canvasElement.querySelector<HTMLDivElement>('#graph-d3-force')!;
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
        edgeDefaults: { stroke: 0xcbd5e1, strokeWidth: 1, arrow: false },
      },
    });
    canvas.layers.add(graph);

    graph.setData({ nodes, edges: lesMiserables.edges });

    // Drag a node: store.setPosition fires, layout respects the now-pinned
    // node so released nodes stay where you drop them.
    canvas.behaviours.register(
      new DragNodeBehaviour({ id: 'drag-node', layerId: 'graph', enabled: true }),
    );

    // Initial fit — pre-allocate a generous view based on the expected
    // d3-force spread (~`linkDistance * √N` cluster radius, padded), so the
    // simulation stays visible end-to-end without any per-tick re-centering.
    // The user can pan / zoom freely afterwards, or hit "Fit" to retighten.
    // const N = graph.store.nodeCount();
    // const reach = Math.max(300, 50 * Math.sqrt(Math.max(1, N)) * 1.5);
    // canvas.camera.fitContent(
    //   { x: -reach, y: -reach, width: reach * 2, height: reach * 2 },
    //   80,
    // );

    const settings = {
      charge: -120,
      linkDistance: 50,
      linkStrength: 0.5,
      centered: true,
      centerX: 0,
      centerY: 0,
      collideEnabled: true,
      collide: 14,
      alpha: 1,
      alphaMin: 0.001,
      alphaDecay: 0.0228,
      velocityDecay: 0.4,
      syncTicks: false,
      // Off by default — auto-fitting every tick fights user pan/zoom and
      // visually freezes the camera during the simulation. Opt in when you
      // actually want the camera to chase the spreading cluster.
      autoFitCamera: false,
    };

    let layout: D3ForceLayout = buildLayout();

    function buildLayout(): D3ForceLayout {
      return new D3ForceLayout({
        charge: settings.charge,
        linkDistance: settings.linkDistance,
        linkStrength: settings.linkStrength,
        center: settings.centered ? { x: settings.centerX, y: settings.centerY } : null,
        collide: settings.collideEnabled ? settings.collide : false,
        alpha: settings.alpha,
        alphaMin: settings.alphaMin,
        alphaDecay: settings.alphaDecay,
        velocityDecay: settings.velocityDecay,
        syncTicks: settings.syncTicks,
        // One-time fit when the simulation kicks off, so the user sees the
        // whole cluster from the start without continuous per-tick re-fitting.
        onStart: () => canvas.camera.fitContent(graph.getBounds(), 80),
        // Per-tick fit only when the user explicitly opts in via the GUI.
        onTick: () => {
          if (settings.autoFitCamera) canvas.camera.fitContent(graph.getBounds(), 80);
        },
        // Always retighten to the settled layout — the cluster's final bounds
        // are usually larger than the initial onStart fit, so without this
        // the user is left looking at a cropped view at settle time.
        onEnd: () => canvas.camera.fitContent(graph.getBounds(), 80),
      });
    }

    const reapply = (): void => {
      layout.stop();
      layout = buildLayout();
      void layout.apply(graph);
    };

    // Animated apply — resolves when alpha settles. We don't await; the
    // user can pan / zoom while the simulation runs.
    void layout.apply(graph);

    const gui = new GUI({ title: 'D3ForceLayout' });
    onStoryTeardown(() => gui.destroy());

    const forces = gui.addFolder('Forces');
    forces.add(settings, 'charge', -2000, 200, 10);
    forces.add(settings, 'linkDistance', 5, 400, 1);
    forces.add(settings, 'linkStrength', 0, 1, 0.01);

    const center = gui.addFolder('Center');
    center.add(settings, 'centered');
    center.add(settings, 'centerX', -2000, 2000, 10);
    center.add(settings, 'centerY', -2000, 2000, 10);

    const collide = gui.addFolder('Collide');
    collide.add(settings, 'collideEnabled');
    collide.add(settings, 'collide', 0, 200, 1);

    const sim = gui.addFolder('Simulation');
    sim.add(settings, 'alpha', 0, 1, 0.01);
    sim.add(settings, 'alphaMin', 0.0001, 0.1, 0.0001);
    sim.add(settings, 'alphaDecay', 0.001, 0.2, 0.001);
    sim.add(settings, 'velocityDecay', 0, 1, 0.01);
    sim.add(settings, 'syncTicks');
    sim.add(settings, 'autoFitCamera').name('autoFitCamera (per-tick fit)');

    const actions = {
      apply: () => reapply(),
      reheat: () => layout.reheat(0.5),
      stop: () => layout.stop(),
      fit: () => canvas.camera.fitContent(graph.getBounds(), 80),
    };
    gui.add(actions, 'apply').name('Apply (rebuild + run)');
    gui.add(actions, 'reheat').name('Reheat (alpha=0.5)');
    gui.add(actions, 'stop').name('Stop');
    gui.add(actions, 'fit').name('Fit to content');
  },
};
