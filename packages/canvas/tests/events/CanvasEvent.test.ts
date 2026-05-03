import { describe, expect, it } from 'vitest';
import {
  makeCanvasEvent,
  makeEventType,
  isExcludedFromTap,
  DEFAULT_TAP_EXCLUDE,
} from '../../src/events/CanvasEvent';

describe('makeEventType', () => {
  it('joins source kind, source id, and event name with colons', () => {
    expect(makeEventType({ kind: 'layer', id: 'graph-1' }, 'node:click')).toBe(
      'layer:graph-1:node:click',
    );
  });
});

describe('makeCanvasEvent', () => {
  it('produces a well-formed envelope', () => {
    const env = makeCanvasEvent({ kind: 'canvas', id: 'main' }, 'camera:zoom', {
      scale: 2,
    });
    expect(env.type).toBe('canvas:main:camera:zoom');
    expect(env.payload).toEqual({ scale: 2 });
    expect(env.source).toEqual({ kind: 'canvas', id: 'main' });
    expect(typeof env.timestamp).toBe('number');
    expect(env.timestamp).toBeGreaterThanOrEqual(0);
  });
});

describe('isExcludedFromTap', () => {
  it('matches default exclude list as suffix', () => {
    expect(isExcludedFromTap('layer:graph-1:shape:pointermove')).toBe(true);
    expect(isExcludedFromTap('canvas:main:render:tick')).toBe(true);
  });

  it('does NOT exclude unrelated events', () => {
    expect(isExcludedFromTap('layer:graph-1:node:click')).toBe(false);
    expect(isExcludedFromTap('canvas:main:camera:zoom')).toBe(false);
  });

  it('honours a custom exclude list', () => {
    expect(isExcludedFromTap('canvas:main:camera:zoom', ['camera:zoom'])).toBe(true);
    expect(
      isExcludedFromTap('layer:graph-1:shape:pointermove', ['camera:zoom']),
    ).toBe(false);
  });

  it('empty exclude list passes everything through', () => {
    expect(isExcludedFromTap('canvas:main:camera:zoom', [])).toBe(false);
    expect(isExcludedFromTap('canvas:main:render:tick', [])).toBe(false);
  });

  it('default exclude list contains the documented high-frequency events', () => {
    expect(DEFAULT_TAP_EXCLUDE).toContain('pointermove');
    expect(DEFAULT_TAP_EXCLUDE).toContain('render:tick');
    expect(DEFAULT_TAP_EXCLUDE).toContain('shape:pointermove');
    expect(DEFAULT_TAP_EXCLUDE).toContain('connector:pointermove');
    expect(DEFAULT_TAP_EXCLUDE).toContain('state:dirty-flush');
  });
});
