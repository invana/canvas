import { describe, expect, it } from 'vitest';
import {
  MOTION_DEFAULTS,
  SIGNAL_DEFAULTS,
  lerpCourse,
  pushFix,
  sampleTrack,
  shortestArc,
  signalState,
  type Fix,
} from '../../src/behaviours/tracking/motion';

const fix = (t: number, x: number, y: number, extra: Partial<Fix> = {}): Fix => ({ id: 'a', t, x, y, ...extra });
const OPTS = { renderDelayMs: 1000, maxExtrapolateMs: 10_000 };

describe('shortestArc / lerpCourse', () => {
  it('goes the short way across north', () => {
    expect(shortestArc(359, 1)).toBe(2);
    expect(shortestArc(1, 359)).toBe(-2);
    expect(lerpCourse(350, 10, 0.5)).toBeCloseTo(0, 9);
    expect(lerpCourse(10, 350, 0.25)).toBeCloseTo(5, 9);
  });
  it('reports exactly opposite headings as +180', () => {
    expect(shortestArc(0, 180)).toBe(180);
  });
});

describe('sampleTrack', () => {
  it('returns null for no fixes', () => {
    expect(sampleTrack([], 0, OPTS)).toBeNull();
  });

  it('interpolates at now − renderDelay between two fixes', () => {
    const fixes = [fix(0, 0, 0, { course: 359 }), fix(1000, 10, 20, { course: 1 })];
    // renderTime = 1500 − 1000 = 500 → halfway.
    const s = sampleTrack(fixes, 1500, OPTS)!;
    expect(s.mode).toBe('interpolated');
    expect(s.x).toBeCloseTo(5, 9);
    expect(s.y).toBeCloseTo(10, 9);
    expect(s.course).toBeCloseTo(0, 9);
  });

  it('picks the right pair among several fixes', () => {
    const fixes = [fix(0, 0, 0), fix(1000, 10, 0), fix(2000, 10, 10)];
    const s = sampleTrack(fixes, 2500, OPTS)!; // renderTime 1500 → between fixes 1 and 2
    expect(s.x).toBeCloseTo(10, 9);
    expect(s.y).toBeCloseTo(5, 9);
  });

  it('holds at the oldest fix before it', () => {
    const s = sampleTrack([fix(5000, 3, 4)], 5500, OPTS)!; // renderTime 4500 < 5000
    expect(s).toMatchObject({ x: 3, y: 4, mode: 'held' });
  });

  it('dead-reckons from speed and course for exactly the elapsed time', () => {
    // North (0°) is up = −y; 2 units/s for 3 s.
    const s = sampleTrack([fix(0, 100, 100, { course: 0, speed: 2 })], 4000, OPTS)!; // renderTime 3000
    expect(s.mode).toBe('extrapolated');
    expect(s.x).toBeCloseTo(100, 9);
    expect(s.y).toBeCloseTo(94, 9);
    // East (90°) is +x.
    const e = sampleTrack([fix(0, 0, 0, { course: 90, speed: 1 })], 3000, OPTS)!; // 2 s
    expect(e.x).toBeCloseTo(2, 9);
    expect(e.y).toBeCloseTo(0, 9);
  });

  it('caps dead reckoning at maxExtrapolateMs, then holds there', () => {
    const f = [fix(0, 0, 0, { course: 90, speed: 1 })];
    const capped = sampleTrack(f, 1000 + 10_000, OPTS)!; // renderTime 10 000 = cap
    const later = sampleTrack(f, 1000 + 500_000, OPTS)!;
    expect(capped.x).toBeCloseTo(10, 9);
    expect(later.x).toBeCloseTo(10, 9);
  });

  it('never guesses without speed or without course', () => {
    expect(sampleTrack([fix(0, 1, 1, { course: 90 })], 9000, OPTS)!.mode).toBe('held');
    expect(sampleTrack([fix(0, 1, 1, { speed: 5 })], 9000, OPTS)!.mode).toBe('held');
    expect(sampleTrack([fix(0, 1, 1, { course: 90, speed: 0 })], 9000, OPTS)!.mode).toBe('held');
  });

  it('exposes sane defaults', () => {
    expect(MOTION_DEFAULTS.renderDelayMs).toBe(1500);
  });
});

describe('pushFix', () => {
  it('drops out-of-order, equal-time and non-finite fixes', () => {
    const list: Fix[] = [];
    expect(pushFix(list, fix(100, 0, 0), 100, 5000)).toBe(true);
    expect(pushFix(list, fix(100, 1, 1), 100, 5000)).toBe(false);
    expect(pushFix(list, fix(50, 1, 1), 100, 5000)).toBe(false);
    expect(pushFix(list, fix(200, Number.NaN, 1), 200, 5000)).toBe(false);
    expect(list).toHaveLength(1);
  });

  it('trims what can no longer be sampled, keeping the bracket', () => {
    const list: Fix[] = [];
    for (let t = 0; t <= 10_000; t += 1000) pushFix(list, fix(t, t, 0), t, 3000);
    // cutoff = 10 000 − 3000 = 7000 → keep the fix at 7000 and everything after it.
    expect(list[0]!.t).toBe(7000);
    expect(list[list.length - 1]!.t).toBe(10_000);
    // The bracket for renderTime 7500 is still present.
    expect(sampleTrack(list, 7500 + 1000, { ...OPTS, renderDelayMs: 1000 })!.mode).toBe('interpolated');
  });
});

describe('signalState', () => {
  const o = { ...SIGNAL_DEFAULTS, staleAfterMs: 20_000, lostAfterMs: 90_000, stoppedBelowSpeed: 0.1, stoppedAfterMs: 30_000 };
  it('walks moving → stale → lost by fix age', () => {
    expect(signalState(1000, undefined, 1000 + 19_000, o)).toBe('moving');
    expect(signalState(1000, undefined, 1000 + 21_000, o)).toBe('stale');
    expect(signalState(1000, undefined, 1000 + 91_000, o)).toBe('lost');
  });
  it('needs the dwell before stopped, and only with a threshold', () => {
    expect(signalState(40_000, 20_000, 41_000, o)).toBe('moving'); // slow 20 s < 30 s
    expect(signalState(60_000, 20_000, 61_000, o)).toBe('stopped'); // slow 40 s
    expect(signalState(60_000, 20_000, 61_000, { ...o, stoppedBelowSpeed: undefined })).toBe('moving');
  });
  it('stale outranks stopped', () => {
    expect(signalState(60_000, 20_000, 60_000 + 25_000, o)).toBe('stale');
  });
});
