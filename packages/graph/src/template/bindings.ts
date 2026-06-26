/**
 * Resolve a dotted data path (`'data.name'`, `'type'`, `'data.profile.title'`)
 * against a graph node, for slot → value binding. Returns `undefined` for a
 * missing path; the caller decides the fallback (usually an empty string).
 */

import type { GraphNode } from '../store/types';

/** Read a dotted path off a node. The path is rooted at the node object, so
 * `'type'` reads `node.type` and `'data.name'` reads `node.data.name`. */
export function resolvePath(node: GraphNode, path: string): unknown {
  if (!path) return undefined;
  let cur: unknown = node;
  for (const key of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[key];
  }
  return cur;
}

/** Resolve a path to a display string (`''` when missing/nullish). */
export function resolveText(node: GraphNode, path: string | undefined): string {
  if (!path) return '';
  const v = resolvePath(node, path);
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
}
