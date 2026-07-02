import { describe, expect, it } from 'vitest';

import { createCanvasStore, defaultCanvasView } from '../../src/index';

/** The expanded view shape — scene slice, runtime slice, focus + transientPins. */
describe('CanvasView — full compartment shape', () => {
  it('defaultCanvasView seeds the new slices', () => {
    const v = defaultCanvasView();
    expect(v.definition.canvas).toEqual({ zoom: { min: 0.01, max: 100 } });
    expect(v.interaction.focus).toBeNull();
    expect([...v.interaction.transientPins]).toEqual([]);
    expect(v.runtime).toEqual({
      layout: { running: false, activeId: null, animate: false, progress: null },
      message: null,
    });
  });

  it('scene + layout-status + focus + transientPins + message actions drive state', () => {
    const store = createCanvasStore();
    const a = store.actions;

    a.scene.setBackground(0x101010);
    a.scene.setZoomLimits(0.5, 4);
    a.layoutStatus.begin('force', true);
    a.layoutStatus.progress(0.4);
    a.focus.set(['a', 'b'], true);
    a.transientPins.add(['n1', 'n2']);
    a.transientPins.remove(['n1']);
    a.message.show('Running layout…');

    const s = store.view.getState();
    expect(s.definition.canvas).toEqual({ zoom: { min: 0.5, max: 4 }, backgroundColor: 0x101010 });
    expect(s.runtime.layout).toEqual({ running: true, activeId: 'force', animate: true, progress: 0.4 });
    expect(s.interaction.focus).toEqual({ ids: new Set(['a', 'b']), dim: true });
    expect([...s.interaction.transientPins]).toEqual(['n2']);
    expect(s.runtime.message).toBe('Running layout…');

    a.layoutStatus.end();
    a.focus.clear();
    a.message.clear();
    const s2 = store.view.getState();
    expect(s2.runtime.layout.running).toBe(false);
    expect(s2.runtime.layout.progress).toBeNull();
    expect(s2.interaction.focus).toBeNull();
    expect(s2.runtime.message).toBeNull();
  });

  it('new view commands carry their taxonomy action labels', () => {
    const store = createCanvasStore();
    const seen: string[] = [];
    store.events.on('state:change', (e) => seen.push(e.action ?? ''));

    store.actions.scene.set({ defaultViewMode: 'draw' });
    store.actions.layoutStatus.begin('elk');
    store.actions.focus.set(['x']);
    store.actions.transientPins.add(['p']);
    store.actions.message.show('hi');

    expect(seen).toEqual([
      'view:scene:set',
      'view:layout:status:begin',
      'view:focus:set',
      'view:transientPins:add',
      'view:message:show',
    ]);
  });
});
