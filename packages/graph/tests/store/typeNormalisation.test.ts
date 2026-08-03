/**
 * `type` normalisation — the runtime net.
 *
 * `GraphNode.type` / `GraphEdge.type` are **required**, so in normal use the
 * compiler is what guarantees every record has one. These tests cover the paths
 * that bypass the compiler entirely and therefore still need the store's
 * `|| UNKNOWN_TYPE` default:
 *
 *   - `importData` of a snapshot written before the field was required
 *   - JSON parsed at runtime — a feed, a fixture, a `fetch`
 *   - `updateNode(id, patch)`, where `Partial<GraphNode>` makes `type` optional
 *
 * Records here are cast, deliberately: that is precisely what arriving-at-runtime
 * data looks like to TypeScript, and typing them properly would test nothing.
 */
import { describe, expect, it } from 'vitest';

import { GraphStore, UNKNOWN_TYPE } from '../../src/store';
import type { GraphEdge, GraphNode } from '../../src/store';

/** An untyped record, as parsed JSON or an old snapshot would deliver it. */
const untypedNode = (id: string): GraphNode => ({ id }) as GraphNode;
const untypedEdge = (id: string, source: string, target: string): GraphEdge =>
  ({ id, source, target }) as GraphEdge;

describe('type normalisation — the runtime net', () => {
  it('defaults a missing node/edge type to UNKNOWN_TYPE', () => {
    const s = new GraphStore();
    s.addNode(untypedNode('a'));
    s.addNode(untypedNode('b'));
    s.addEdge(untypedEdge('e', 'a', 'b'));
    expect(s.getNode('a')!.type).toBe(UNKNOWN_TYPE);
    expect(s.getEdge('e')!.type).toBe(UNKNOWN_TYPE);
  });

  it('normalises empty string too — `||`, not `??`', () => {
    const s = new GraphStore();
    s.addNode({ id: 'a', type: '' });
    s.addNode({ id: 'b', type: '' });
    s.addEdge({ id: 'e', type: '', source: 'a', target: 'b' });
    expect(s.getNode('a')!.type).toBe(UNKNOWN_TYPE);
    expect(s.getEdge('e')!.type).toBe(UNKNOWN_TYPE);
  });

  it('preserves a real type', () => {
    const s = new GraphStore();
    s.addNode({ id: 'a', type: 'person' });
    expect(s.getNode('a')!.type).toBe('person');
  });

  it('applies the same rule on update — clearing a type yields the sentinel', () => {
    const s = new GraphStore();
    s.addNode({ id: 'a', type: 'person' });
    s.updateNode('a', { type: '' });
    expect(s.getNode('a')!.type).toBe(UNKNOWN_TYPE);
    s.updateNode('a', { type: undefined });
    expect(s.getNode('a')!.type).toBe(UNKNOWN_TYPE);
  });

  it('normalises through bulk + upsert paths', () => {
    const s = new GraphStore();
    s.addNodesBulk([untypedNode('a'), untypedNode('b')]);
    s.addEdgesBulk([untypedEdge('e', 'a', 'b')]);
    s.upsertNode(untypedNode('c'));
    expect([...s.nodes()].every((n) => typeof n.type === 'string')).toBe(true);
    expect([...s.edges()].every((e) => typeof e.type === 'string')).toBe(true);
    expect(s.getNode('c')!.type).toBe(UNKNOWN_TYPE);
  });

  it('normalises an edge parked awaiting a missing endpoint', () => {
    const s = new GraphStore({ unknownEndpoint: 'buffer' });
    s.addEdge(untypedEdge('e', 'a', 'b'));
    s.addNode(untypedNode('a'));
    s.addNode(untypedNode('b'));
    expect(s.getEdge('e')!.type).toBe(UNKNOWN_TYPE);
  });
});
