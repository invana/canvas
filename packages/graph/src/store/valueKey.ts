/**
 * **Root-relative dot-path addressing** over a stored graph record — the one
 * resolver behind every `*ValueKey` / `*Key` option in the package.
 *
 * A string path rather than an accessor function because it **survives
 * serialisation**: it can live in `view.definition`, be edited in a settings
 * panel, persisted on a canvas record, and synced to a collaborator. Accessor
 * functions (`ColorByBehaviourOptions.nodeValueBy`) remain the escape hatch for
 * values that must be *computed* rather than addressed.
 *
 * Paths are relative to the **record root**, not to `data`, so they reach the
 * root fields and the payload alike:
 *
 * | Path | Resolves to |
 * |---|---|
 * | `'id'` | `node.id` |
 * | `'type'` | `node.type` |
 * | `'parentId'` | `node.parentId` |
 * | `'data.name'` | `node.data.name` |
 * | `'data.meta.tier'` | `node.data.meta.tier` |
 * | `'style.shape.kind'` | the shape kind |
 *
 * That's what distinguishes a node's root `type` from a `type` **key inside
 * `data`** — both occur in the wild (`defaultNodeTypeOf` reads `data.type` as a
 * fallback), and a bare property name cannot tell them apart.
 */

/**
 * Walk a root-relative dot path over `root`, returning `undefined` on any
 * missing segment (never throwing). Pure and synchronous.
 *
 * @param root - The record to address — a `GraphNode`, `GraphEdge`, or any object.
 * @param path - Dot path, e.g. `'id'`, `'type'`, `'data.meta.tier'`.
 * @returns The addressed value, or `undefined` if any segment is absent.
 *
 * @example
 * ```ts
 * readValueKey(node, 'type');        // → 'Person'
 * readValueKey(node, 'data.name');   // → 'Ada'
 * readValueKey(node, 'data.absent'); // → undefined
 * ```
 */
export function readValueKey(root: unknown, path: string): unknown {
  let cur: unknown = root;
  for (const seg of path.split('.')) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = (cur as Record<string, unknown>)[seg];
  }
  return cur;
}
