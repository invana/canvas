/**
 * End-to-end smoke validation of `@invana/canvas` kernel + lifecycle.
 *
 * Exercises: Canvas → world (Viewport) + stage → Camera → LayerRegistry +
 * BehaviourRegistry → WorldLayer subclass + Behaviour subclass through
 * mount / state mutation / dirty mark / flush / events / tick.
 *
 * Uses `Canvas.initWithRenderer` with a `HeadlessRenderer`, so the whole engine
 * pipeline is exercised with no drawing library at all.
 */

import { describe, expect, it, vi } from 'vitest';
import { HeadlessRenderer } from '../../src/renderer/HeadlessRenderer';
import { Canvas } from '../../src/engine/Canvas';
import { WorldLayer } from '../../src/layers/WorldLayer';
import { Behaviour } from '../../src/behaviours/Behaviour';
import type { CanvasContext } from '../../src/context/CanvasContext';
import type { DirtySnapshot } from '@invana/canvas-store';

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

    expect(canvas.isInitialised).toBe(true);
    expect(canvas.events).toBeDefined();
    expect(canvas.renderer).toBeDefined();
    expect(canvas.camera).toBeDefined();
    expect(canvas.layers).toBeDefined();
    expect(canvas.behaviours).toBeDefined();
    expect(canvas.context.events).toBe(canvas.events);

    expect(canvas.context.camera).toBe(canvas.camera);
    expect(canvas.context.layers).toBe(canvas.layers);
    expect(canvas.context.behaviours).toBe(canvas.behaviours);
  });

  it('renderer:initialised reports the backend that actually mounted', () => {
    const canvas = new Canvas();
    const handler = vi.fn();
    canvas.events.on('canvas:renderer:ready', handler);
    const renderer = new HeadlessRenderer();
    canvas.initWithRenderer(renderer, 800, 600);
    // The payload is the renderer's own answer, not a hardcoded literal — which
    // is what lets a consumer degrade on `capabilities` rather than on a guess.
    expect(handler).toHaveBeenCalledWith({
      backend: renderer.backend,
      capabilities: { ...renderer.capabilities },
    });
  });

  it('add a Layer; mount fires; events flow through tap', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

    const tapHandler = vi.fn();
    canvas.events.tap(tapHandler);

    const graph = new TestGraphLayer({
      id: 'graph-1',
      options: { initialNodes: ['n-1', 'n-2'] },
    });
    canvas.layers.add(graph);

    // The kernel bus tap sees the raw event `type` with the source carried
    // separately on the envelope (no composite `<kind>:<id>:<event>` type).
    const layerAdded = tapHandler.mock.calls.find((c) => c[0].type === 'scene:layer:add');
    expect(layerAdded).toBeDefined();
    expect(layerAdded![0].payload).toEqual({ id: 'graph-1' });

    // A layer's own SourceEmitter forwards onto the tap with its layer source.
    graph.events.emit('node:click', { id: 'n-42' });
    const nodeClick = tapHandler.mock.calls.find(
      (c) => c[0].type === 'node:click' && c[0].source?.id === 'graph-1',
    );
    expect(nodeClick).toBeDefined();
    expect(nodeClick![0].payload).toEqual({ id: 'n-42' });
  });

  it('Behaviour registered + enabled → reacts to layer events', () => {
    const canvas = new Canvas({ id: 'main' });
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

    const tapHandler = vi.fn();
    canvas.events.tap(tapHandler);

    canvas.camera.setZoom(2);

    const zoomEnv = tapHandler.mock.calls.find(
      (c) => c[0].type.endsWith('input:camera:zoom'),
    );
    expect(zoomEnv).toBeDefined();
    expect(zoomEnv![0].payload.scale).toBe(2);
  });

  it('destroy() unmounts layers + tears everything down', () => {
    const canvas = new Canvas();
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);

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
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
    expect(() => canvas.initWithRenderer(new HeadlessRenderer(), 100, 100)).toThrow(
      /already initialised/,
    );
  });

  it('Layer.state mutations work end-to-end (zustand+immer with Set)', () => {
    const canvas = new Canvas();
    canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
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
