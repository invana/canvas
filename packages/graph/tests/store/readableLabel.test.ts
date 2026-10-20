import { describe, expect, it } from 'vitest';
import { readableLabel } from '../../src/store/readableLabel';

describe('readableLabel', () => {
  it('prefers a named property, then a readable id, then the type', () => {
    expect(readableLabel({ id: '4:a:1', type: 'Airline', data: { name: 'Qantas' } })).toBe('Qantas');
    expect(readableLabel({ id: 'Valjean', type: 'character' })).toBe('Valjean');
    expect(readableLabel({ id: '4:24a7c0:1555', type: 'Airline' })).toBe('Airline');
    expect(readableLabel({ id: '1555', type: 'Airline' })).toBe('Airline');
  });
});
