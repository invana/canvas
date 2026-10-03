/**
 * `FisheyeBehaviour` drives display-only overrides — never the store.
 *
 * Headless: no DOM, so the lens is placed with `setFocus`, and `requestAnimationFrame`
 * is absent, so each update runs synchronously. Assertions read the overrides the
 * headless renderer recorded.
 *
 * See `rfc:feat-2026-10-03-dense-regions-cannot-be-inspected-in-place` rows F6–F8.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { Canvas, HeadlessElementRenderer, HeadlessRenderer } from '@invana/canvas';
import { GraphLayer } from '../../src/layer/GraphLayer';
import { FisheyeBehaviour } from '../../src/behaviours/FisheyeBehaviour';

/** Same environment gaps the other layer tests fill. */
beforeAll(() => {
  const g = globalThis as Record<string, unknown>;
  function FakeCtx2D(): void {}
  FakeCtx2D.prototype.letterSpacing = '';
  g['CanvasRenderingContext2D'] = FakeCtx2D;
  const element = (): unknown => ({
    style: {},
    addEventListener: () => {},
    removeEventListener: () => {},
    getBoundingClientRect: () => ({ x: 0, y: 0, width: 800, height: 600, top: 0, left: 0 }),
    getContext: () => ({
      font: '',
      measureText: (t: string) => ({
        width: t.length * 7,
        actualBoundingBoxAscent: 8,
        actualBoundingBoxDescent: 2,
        fontBoundingBoxAscent: 10,
        fontBoundingBoxDescent: 3,
      }),
    }),
  });
  g['document'] ??= { createElement: element };
});

const DATA = {
  nodes: [
    { id: 'centre', type: 'thing', position: { x: 0, y: 0 } },
    { id: 'near', type: 'thing', position: { x: 30, y: 0 } },
    { id: 'west', type: 'thing', position: { x: -60, y: 0 } },
    { id: 'far', type: 'thing', position: { x: 500, y: 0 } },
  ],
  edges: [{ id: 'e1', type: 'rel', source: 'near', target: 'far' }],
};

function mount(): { canvas: Canvas; layer: GraphLayer; renderer: HeadlessElementRenderer; lens: FisheyeBehaviour } {
  const canvas = new Canvas();
  canvas.initWithRenderer(new HeadlessRenderer(), 800, 600);
  const layer = new GraphLayer({ id: 'graph', options: {} });
  canvas.layers.add(layer);
  canvas.layers.mountAll();
  layer.setData(DATA);
  layer.store.flush();
  layer.flush();
  const lens = new FisheyeBehaviour({
    id: 'fisheye',
    targetLayerId: 'graph',
    enabled: true,
    radius: 100,
    distortion: 1.5,
    nodeScale: 2,
  });
  canvas.behaviours.register(lens);
  const renderer = layer.getRenderer() as HeadlessElementRenderer;
  return { canvas, layer, renderer, lens };
}

/** Put the lens over the world origin, whatever the camera transform. */
function focusOrigin(canvas: Canvas, lens: FisheyeBehaviour): void {
  lens.setFocus(canvas.camera.toScreen(0, 0));
}

describe('FisheyeBehaviour', () => {
  it('overrides exactly the nodes inside the lens', () => {
    const { canvas, renderer, lens } = mount();
    focusOrigin(canvas, lens);
    expect([...renderer.displayOverrides.keys()].sort()).toEqual(['centre', 'near', 'west']);
  });

  it('enlarges the focus fully, pushes neighbours outward and forces labels', () => {
    const { canvas, renderer, lens } = mount();
    focusOrigin(canvas, lens);
    const scale = canvas.camera.scale;
    const centre = renderer.displayOverrides.get('centre')!;
    expect(centre.dx).toBeCloseTo(0, 9);
    expect(centre.scale).toBeCloseTo(2, 9);
    expect(centre.showText).toBe(true);
    // Radius is in screen px, so the world-space push depends on zoom — only its sign is fixed.
    expect(renderer.displayOverrides.get('near')!.dx! * scale).toBeGreaterThan(0);
    expect(renderer.displayOverrides.get('west')!.dx!).toBeLessThan(0);
  });

  it('never writes the store — logical positions are untouched', () => {
    const { canvas, layer, lens } = mount();
    focusOrigin(canvas, lens);
    expect(layer.store.getPosition('near')).toEqual({ x: 30, y: 0 });
    expect(layer.store.getPosition('west')).toEqual({ x: -60, y: 0 });
  });

  it('clears every override when the lens is removed or the behaviour disabled', () => {
    const { canvas, renderer, lens } = mount();
    focusOrigin(canvas, lens);
    lens.setFocus(null);
    expect(renderer.displayOverrides.size).toBe(0);

    focusOrigin(canvas, lens);
    expect(renderer.displayOverrides.size).toBe(3);
    lens.disable();
    expect(renderer.displayOverrides.size).toBe(0);
  });

  it('steps aside while another behaviour owns the gesture', () => {
    const { canvas, renderer, lens } = mount();
    focusOrigin(canvas, lens);
    const release = canvas.gestures.claim('drag-node');
    expect(release).not.toBeNull();
    expect(renderer.displayOverrides.size).toBe(0);
    release!();
    expect(renderer.displayOverrides.size).toBe(3);
  });

  it('applies live option changes (labels off, no distortion)', () => {
    const { canvas, renderer, lens } = mount();
    focusOrigin(canvas, lens);
    lens.setOptions({ showLabels: false, distortion: 0 });
    const near = renderer.displayOverrides.get('near')!;
    expect(near.showText).toBe(false);
    expect(near.dx).toBeCloseTo(0, 9);
    expect(lens.getOptions().distortion).toBe(0);
  });

  it('clamps radius and distortion into their bounds', () => {
    const { lens } = mount();
    lens.setOptions({ radius: 5, distortion: 99 });
    expect(lens.options.radius).toBe(20);
    expect(lens.options.distortion).toBe(5);
  });
});
