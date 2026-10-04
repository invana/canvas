/**
 * `zoomAboveHost` — the camera zoom a label's per-style zoom band compares
 * against (`labelMinZoom` / `labelMaxZoom`).
 *
 * The band used to read the product of scales up from the **label** itself. A
 * label hides by detaching from its host, after which it has no parent and the
 * product is `1` — so a `maxZoom < 1` label never came back and a `minZoom = 1`
 * label flipped every frame (T1/T2 in
 * `docs/rfcs/feat/2026-10-04-labels-balloon-on-zoom-and-edge-labels-have-no-lod.md`).
 * Under a node-size LOD the host's `1/zoom` also cancelled the camera. Reading
 * from above the host fixes both.
 */

import { describe, expect, it } from 'vitest';
import { Container } from 'pixi.js';

import { zoomAboveHost } from '../../src/primitives/paint/labelContent';

/** stage → viewport (camera zoom) → layer → host (node gfx) → label. */
function scene(zoom: number, hostScale = 1) {
  const stage = new Container();
  const viewport = stage.addChild(new Container());
  viewport.scale.set(zoom);
  const layer = viewport.addChild(new Container());
  const host = layer.addChild(new Container());
  host.scale.set(hostScale);
  const label = host.addChild(new Container());
  return { viewport, host, label };
}

describe('zoomAboveHost', () => {
  it('reads the camera zoom', () => {
    expect(zoomAboveHost(scene(0.5).host)).toBeCloseTo(0.5);
    expect(zoomAboveHost(scene(3).host)).toBeCloseTo(3);
  });

  it('ignores the host’s own scale (a node-size LOD drawing it at 1/zoom)', () => {
    expect(zoomAboveHost(scene(4, 1 / 4).host)).toBeCloseTo(4);
  });

  it('is unaffected by the label being detached from its host', () => {
    const { host, label } = scene(0.5);
    host.removeChild(label);
    expect(label.parent).toBeNull();
    expect(zoomAboveHost(host)).toBeCloseTo(0.5);
  });

  it('follows the camera after the label is detached', () => {
    const { viewport, host, label } = scene(1.9);
    host.removeChild(label);
    viewport.scale.set(0.5);
    expect(zoomAboveHost(host)).toBeCloseTo(0.5);
  });

  it('is 1 for no host or a host not in a scene', () => {
    expect(zoomAboveHost(null)).toBe(1);
    expect(zoomAboveHost(new Container())).toBe(1);
  });
});
