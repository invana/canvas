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

import { formToOptions as geoToOptions, optionsToForm as geoToForm } from '../src/editors/layers/geo-features-layer/mapping';

describe('geo features layer editor mapping', () => {
  it('round-trips kind defaults, labels and the unconfirmed rule', () => {
    const opts = {
      defaults: { polygon: { stroke: 0xdc2626, strokeWidthPx: 3, fillOpacity: 0.2 }, point: { pointRadiusPx: 9 } },
      labelKey: 'title',
      labelFontPx: 14,
      labelColor: 0x111827,
      labelBackground: false,
      labelMinZoom: 128,
      unconfirmed: { below: 0.4, alpha: 0.5 },
      hitTolerancePx: 8,
    };
    expect(geoToOptions(geoToForm(opts))).toEqual(opts);
    expect(geoToOptions({})).toEqual({});
  });

  it('accepts a hex string colour from a patch and resolves the registry kind', () => {
    expect(geoToForm({ defaults: { polygon: { stroke: '#2563eb' } } }).polygonStroke).toBe('#2563eb');
    expect(DEFAULT_CANVAS_SETTINGS_SCHEMAS['geo-features-layer']?.section).toBe('layers');
  });
});

import { formToOptions as drawToOptions, optionsToForm as drawToForm } from '../src/editors/behaviours/draw-geo-feature/mapping';
import { formToOptions as measureToOptions, optionsToForm as measureToForm } from '../src/editors/behaviours/measure/mapping';
import { formToOptions as queryToOptions, optionsToForm as queryToForm } from '../src/editors/behaviours/area-query/mapping';

describe('geo tool editor mappings', () => {
  it('draw: tool, author and id prefix round-trip; none is null; an empty author is dropped', () => {
    const opts = { tool: 'polygon' as const, author: 'analyst-3', idPrefix: 'zone-' };
    expect(drawToOptions(drawToForm(opts))).toEqual(opts);
    expect(drawToOptions({ tool: 'none' })).toEqual({ tool: null });
    expect(drawToForm({ tool: null }).tool).toBe('none');
    expect(drawToOptions({ author: '' })).toEqual({});
    expect(drawToOptions({})).toEqual({});
  });

  it('measure: tool round-trips; none is null', () => {
    expect(measureToOptions(measureToForm({ tool: 'area' }))).toEqual({ tool: 'area' });
    expect(measureToOptions({ tool: 'none' })).toEqual({ tool: null });
    expect(measureToForm({ tool: null }).tool).toBe('none');
    expect(measureToOptions({})).toEqual({});
  });

  it('area query: autoQuery and withinKm round-trip, only what is set', () => {
    expect(queryToOptions(queryToForm({ autoQuery: true, withinKm: 5 }))).toEqual({ autoQuery: true, withinKm: 5 });
    expect(queryToOptions({})).toEqual({});
    expect(queryToOptions({ autoQuery: false })).toEqual({ autoQuery: false });
  });

  it('all three kinds resolve in the settings registry', () => {
    for (const kind of ['draw-geo-feature', 'measure', 'area-query']) {
      expect(DEFAULT_CANVAS_SETTINGS_SCHEMAS[kind]?.section).toBe('behaviours');
    }
  });
});
