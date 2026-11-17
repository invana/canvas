import { describe, expect, it } from 'vitest';

import { BubbleSetsLayer } from '../src/BubbleSetsLayer';

/** An unmounted layer: `setOptions` must work before mount (config lands as layers are added). */
const make = (): BubbleSetsLayer =>
  new BubbleSetsLayer({
    id: 'bs',
    options: { graphLayerId: 'graph', sets: [{ id: 'a', members: ['n1'] }], pixelGroup: 4 },
  });

describe('BubbleSetsLayer.setOptions', () => {
  it('merges algorithm fields over the current options', () => {
    const layer = make();
    layer.setOptions({ pixelGroup: 0.002, nodeR0: 0.006 });
    expect(layer.options.pixelGroup).toBe(0.002);
    expect(layer.options.nodeR0).toBe(0.006);
  });

  it('replaces the set list when `sets` is given, and keeps it when absent', () => {
    const layer = make();
    layer.setOptions({ sets: [{ id: 'b', members: ['n2'] }] });
    expect(layer.getSets().map((s) => s.id)).toEqual(['b']);
    layer.setOptions({ pixelGroup: 1 });
    expect(layer.getSets().map((s) => s.id)).toEqual(['b']);
  });

  it('does not retarget the layer: graphLayerId is identity', () => {
    const layer = make();
    layer.setOptions({ graphLayerId: 'other' });
    expect(layer.options.graphLayerId).toBe('graph');
  });
});
