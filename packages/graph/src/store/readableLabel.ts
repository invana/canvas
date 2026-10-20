import type { GraphNode } from './types';

/**
 * The data keys tried, in order, for a node's readable label. A graph database
 * hands back opaque internal ids (`4:24a7…:1555`) that overlap into an
 * unreadable blob, so a human-friendly property wins over the id.
 */
export const READABLE_LABEL_KEYS: readonly string[] = ['name', 'title', 'label', 'code', 'desc', 'description'];

/**
 * Whether an id reads as a name — `Valjean`, `LHR`, `order-17` — rather than a
 * database's internal handle: an element id (`4:24a7…:1555`), a UUID, a bare
 * number, anything long.
 */
export function isReadableId(id: string): boolean {
  if (id.length > 32 || /^\d+$/.test(id)) return false;
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)) return false;
  return /^[\p{L}\p{N} _.'-]+$/u.test(id);
}

/**
 * A node's readable label: the first non-empty `data` value among `keys`;
 * else its id when the id reads as a name ({@link isReadableId}); else its
 * type; else its id. The fallback a board draws when no label key is set for
 * the node's type.
 *
 * @example
 * ```ts
 * readableLabel({ id: '4:a:1', type: 'Airline', data: { name: 'Qantas' } }); // 'Qantas'
 * readableLabel({ id: 'Valjean', type: 'character' });                       // 'Valjean'
 * readableLabel({ id: '4:a:2', type: 'Airline' });                           // 'Airline'
 * ```
 */
export function readableLabel(node: GraphNode, keys: readonly string[] = READABLE_LABEL_KEYS): string {
  const data = (node.data ?? {}) as Record<string, unknown>;
  for (const key of keys) {
    const v = data[key];
    if (v != null && v !== '') return String(v);
  }
  const id = String(node.id);
  if (isReadableId(id)) return id;
  if (node.type) return String(node.type);
  return id;
}
