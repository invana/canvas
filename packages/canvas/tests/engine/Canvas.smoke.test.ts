/**
 * End-to-end smoke validation of `@invana/canvas` kernel + lifecycle.
 *
 * Exercises: Canvas → world (Viewport) + stage → Camera → LayerRegistry +
 * BehaviourRegistry → WorldLayer subclass + Behaviour subclass through
 * mount / state mutation / dirty mark / flush / events / tick.
 *
 * Uses `Canvas.initWithStage` (headless path) so we don't need a real GPU.
 */

import { describe, expect, it, vi } from 'vitest';
import { Container } from 'pixi.js';
import { Canvas } from '../../src/engine/Canvas';
import { WorldLayer } from '../../src/layers/WorldLayer';
import { Behaviour } from '../../src/behaviours/Behaviour';
import type { CanvasContext } from '../../src/context/CanvasContext';
import type { DirtySnapshot } from '../../src/state/DirtyBatcher';

// ─── Test types ───────────────────────────────────────────────────────────

type GraphState = {
  hoveredId: string | null;
  selectedIds: Set<string>;
};

type GraphEvents = {
  'node:click': { id: string };
  'node:hover': { id: string | null };
};

type GraphDirty = 'shape' | 'halo';

class TestGraphLayer extends WorldLayer<
  { initialNodes: string[] },
  GraphState,
  GraphEvents,
  GraphDirty
> {
  appliedSnapshots: DirtySnapshot<GraphDirty>[] = [];

  protected createState(): GraphState {
    return { hoveredId: null, selectedIds: new Set() };
  }

  protected override applyDirty(snap: DirtySnapshot<GraphDirty>): void {
    this.appliedSnapshots.push(snap);
  }

  hoverNode(id: string | null): void {
    this.state.setState((s) => {
      s.hoveredId = id;
    });
    if (id) this.dirty.mark('halo', id);
  }

  selectNode(id: string): void {
    this.state.setState((s) => {
      s.selectedIds.add(id);
    });
    this.dirty.mark('halo', id);
    this.events.emit('node:click', { id });
  }

  hitTest(_worldX: number, _worldY: number) {
    return null;
  }
}

class TestSelectBehaviour extends Behaviour {
  selectedFromBehaviour: string[] = [];

  constructor(opts: { id: string; targetLayerId: string; enabled?: boolean }) {
    super({ ...opts, shortcuts: ['click'] });
  }

  protected onRegister(ctx: CanvasContext): void {
    const layer = ctx.layers.get<TestGraphLayer>(this.targetLayerId!);
    if (!layer) throw new Error(`layer "${this.targetLayerId}" not found`);
    layer.events.on('node:click', ({ id }) => {
      if (!this.enabled) return;
      this.selectedFromBehaviour.push(id);
    });
  }
}

// ─── Smoke ─────────────────────────────────────────────────────────────────

describe('Canvas — end-to-end smoke', () => {
  it('initWithStage wires the full context surface', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithStage(new Container(), 800, 600);

    expect(canvas.isInitialised).toBe(true);
    expect(canvas.events).toBeDefined();
    expect(canvas.world).toBeDefined();
    expect(canvas.stage).toBeDefined();
    expect(canvas.camera).toBeDefined();
    expect(canvas.layers).toBeDefined();
    expect(canvas.behaviours).toBeDefined();
    expect(canvas.context.events).toBe(canvas.events);
    expect(canvas.context.world).toBe(canvas.world);
    expect(canvas.context.stage).toBe(canvas.stage);
    expect(canvas.context.camera).toBe(canvas.camera);
    expect(canvas.context.layers).toBe(canvas.layers);
    expect(canvas.context.behaviours).toBe(canvas.behaviours);
  });

  it('renderer:initialised fires on init', () => {
    const canvas = new Canvas();
    const handler = vi.fn();
    canvas.events.on('renderer:initialised', handler);
    canvas.initWithStage(new Container(), 800, 600);
    expect(handler).toHaveBeenCalledWith({
      backend: 'canvas',
      capabilities: { headless: true },
    });
  });

  it('add a Layer; mount fires; events flow through tap', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithStage(new Container(), 800, 600);

    const tapHandler = vi.fn();
    canvas.events.tap(tapHandler);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: ['n-1', 'n-2'] },
    });
    canvas.layers.add(graph);

    // tap should have seen 'layer:added' (canvas-source envelope)
    const layerAdded = tapHandler.mock.calls.find(
      (c) => c[0].type === 'canvas:main:layer:added',
    );
    expect(layerAdded).toBeDefined();
    expect(layerAdded![0].payload).toEqual({ id: 'graph-1' });

    // Layer's events forward as 'layer:graph-1:*' envelopes.
    graph.events.emit('node:click', { id: 'n-42' });
    const nodeClick = tapHandler.mock.calls.find(
      (c) => c[0].type === 'layer:graph-1:node:click',
    );
    expect(nodeClick).toBeDefined();
    expect(nodeClick![0].payload).toEqual({ id: 'n-42' });
  });

  it('Behaviour registered + enabled → reacts to layer events', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithStage(new Container(), 800, 600);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: ['n-1', 'n-2'] },
    });
    canvas.layers.add(graph);

    const select = new TestSelectBehaviour({
      id: 'select',
      targetLayerId: 'graph-1',
      enabled: true,
    });
    canvas.behaviours.register(select);

    // Trigger the layer event the behaviour subscribes to.
    graph.selectNode('n-1');
    graph.selectNode('n-2');
    expect(select.selectedFromBehaviour).toEqual(['n-1', 'n-2']);
  });

  it('disabled Behaviour ignores events; re-enabling resumes', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithStage(new Container(), 800, 600);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: [] },
    });
    canvas.layers.add(graph);

    const select = new TestSelectBehaviour({
      id: 'select',
      targetLayerId: 'graph-1',
      // default enabled: false
    });
    canvas.behaviours.register(select);

    graph.selectNode('n-1');
    expect(select.selectedFromBehaviour).toHaveLength(0);

    canvas.behaviours.setEnabled('select', true);
    graph.selectNode('n-2');
    expect(select.selectedFromBehaviour).toEqual(['n-2']);
  });

  it('tickOnce flushes dirty layers via applyDirty()', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithStage(new Container(), 800, 600);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: [] },
    });
    canvas.layers.add(graph);

    graph.hoverNode('n-1');
    graph.hoverNode('n-2');

    expect(graph.appliedSnapshots).toHaveLength(0); // nothing flushed yet
    canvas.tickOnce(16);
    expect(graph.appliedSnapshots).toHaveLength(1);

    const snap = graph.appliedSnapshots[0]!;
    expect([...snap.buckets.get('halo')!].sort()).toEqual(['n-1', 'n-2']);
  });

  it('invisible layers skip flush', () => {
    const canvas = new Canvas();
    canvas.initWithStage(new Container(), 800, 600);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: [] },
    });
    canvas.layers.add(graph);

    graph.visible = false;
    graph.hoverNode('n-1');
    canvas.tickOnce();
    expect(graph.appliedSnapshots).toHaveLength(0);

    graph.visible = true;
    canvas.tickOnce();
    expect(graph.appliedSnapshots).toHaveLength(1);
  });

  it('z-order tick walks layers low → high', () => {
    const canvas = new Canvas();
    canvas.initWithStage(new Container(), 800, 600);

    const a = new TestGraphLayer({
      id: 'a',
      options: { initialNodes: [] },
      zIndex: 30,
    });
    const b = new TestGraphLayer({
      id: 'b',
      options: { initialNodes: [] },
      zIndex: 10,
    });
    const c = new TestGraphLayer({
      id: 'c',
      options: { initialNodes: [] },
      zIndex: 20,
    });

    canvas.layers.add(a);
    canvas.layers.add(b);
    canvas.layers.add(c);

    expect(canvas.layers.byZOrder().map((l) => l.id)).toEqual(['b', 'c', 'a']);
  });

  it('camera changes emit on the bus + tap', () => {
    const canvas = new Canvas();
    canvas.initWithStage(new Container(), 800, 600);

    const tapHandler = vi.fn();
    canvas.events.tap(tapHandler);

    canvas.camera.setZoom(2);

    const zoomEnv = tapHandler.mock.calls.find(
      (c) => c[0].type.endsWith('camera:zoom'),
    );
    expect(zoomEnv).toBeDefined();
    expect(zoomEnv![0].payload.scale).toBe(2);
  });

  it('destroy() unmounts layers + tears everything down', () => {
    const canvas = new Canvas();
    canvas.initWithStage(new Container(), 800, 600);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: [] },
    });
    canvas.layers.add(graph);

    canvas.destroy();
    expect(canvas.isInitialised).toBe(false);
    expect(graph.mounted).toBe(false);
  });

  it('cannot init twice', () => {
    const canvas = new Canvas();
    canvas.initWithStage(new Container(), 800, 600);
    expect(() => canvas.initWithStage(new Container(), 100, 100)).toThrow(
      /already initialised/,
    );
  });

  it('Layer.state mutations work end-to-end (zustand+immer with Set)', () => {
    const canvas = new Canvas();
    canvas.initWithStage(new Container(), 800, 600);
    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: [] },
    });
    canvas.layers.add(graph);

    graph.selectNode('n-1');
    graph.selectNode('n-2');
    expect([...graph.state.getState().selectedIds]).toEqual(['n-1', 'n-2']);
  });
});
