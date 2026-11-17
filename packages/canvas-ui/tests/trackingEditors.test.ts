import { describe, expect, it } from 'vitest';

import { formToOptions as trackingToOptions, optionsToForm as trackingToForm } from '../src/editors/behaviours/tracking/mapping';
import { formToOptions as trailsToOptions, optionsToForm as trailsToForm } from '../src/editors/layers/trails-layer/mapping';
import { DEFAULT_CANVAS_SETTINGS_SCHEMAS } from '../src/editor-panels/canvas-settings/registry';

describe('tracking editor mapping', () => {
  it('round-trips the settings and drops unset fields', () => {
    const opts = { renderDelayMs: 2000, staleAfterMs: 20_000, courseKey: 'heading', follow: { targetId: 'v7' } };
    expect(trackingToOptions(trackingToForm(opts))).toEqual(opts);
    expect(trackingToOptions({})).toEqual({});
  });

  it('maps an empty heading key to null and an empty follow id to no follow', () => {
    expect(trackingToOptions({ courseKey: '' })).toEqual({ courseKey: null });
    expect(trackingToForm({ courseKey: null }).courseKey).toBe('');
    expect(trackingToOptions({ followTargetId: '' })).toEqual({ follow: { targetId: null } });
  });
});

describe('trails layer editor mapping', () => {
  it('round-trips ids, colour and lists', () => {
    const opts = { ids: ['a', 'b'], maxPoints: 12, color: 0xea580c, fullTrackIds: ['a'], strokeWidthPx: 3 };
    expect(trailsToOptions(trailsToForm(opts))).toEqual(opts);
  });

  it('reads "all" case-insensitively and trims id lists', () => {
    expect(trailsToOptions({ ids: ' ALL ' })).toEqual({ ids: 'all' });
    expect(trailsToOptions({ ids: ' a , b ,, c' })).toEqual({ ids: ['a', 'b', 'c'] });
  });
});

describe('settings registry', () => {
  it('resolves both kinds, so CanvasSettingsEditorPanel can edit them', () => {
    expect(DEFAULT_CANVAS_SETTINGS_SCHEMAS['tracking']?.section).toBe('behaviours');
    expect(DEFAULT_CANVAS_SETTINGS_SCHEMAS['trails-layer']?.section).toBe('layers');
  });
});
