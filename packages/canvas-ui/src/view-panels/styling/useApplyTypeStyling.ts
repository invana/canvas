// useApplyTypeStyling — paint a {@link TypeStylingPatch} onto a live `GraphLayer`.
//
// **As template field resolvers, not a per-node loop.** `GraphLayer`'s node/edge
// templates accept `Resolvable` fields — a value *or* a function of the record
// (`layer/types.ts` documents `labelText: (n) => n.data.name`). Writing the patch
// as three closures keyed by `type` means:
//
//   - one `setNodeDefaults` call per edit instead of an update per node, and
//   - **nodes that arrive later are styled on arrival** — a bulk load, a stream,
//     an expand — with no re-apply wiring and no subscription of our own.
//
// This is exactly how `ColorByBehaviour` writes `bgFill` / `strokeColor`, so the
// two compose predictably: whichever writes the template last wins.
//
// An unstyled type's resolver returns `undefined`, which the layer *drops*
// (`GraphLayer.ts:3119` skips undefined resolver results), leaving the field to
// whatever else provides it — the theme, a per-type binding, a per-node style.
// That's the difference between "this type has no override" and "this type is
// forced to a default", and it's why the resolvers are total rather than guarded.
//
// Installing a resolver *replaces* the template field it lands on, so a type the
// patch doesn't style falls back to that field's value from before the hook
// first wrote it — the host's template (a neutral fill, a colour-by), not the
// theme's default. And a field is only taken over once the patch styles it for
// some type: merely opening the panel changes nothing.

import { useEffect, useRef } from 'react';
import type { EdgeStyle, GraphCanvas, GraphEdge, GraphLayer, GraphNode, NodeStyle } from '@invana/graph';
import { readValueKey, resolveField } from '@invana/graph';

import { hexToNumber } from '../../shared/color';
import type { TypeStylingPatch } from './types';

/**
 * Apply `patch` to `canvas`'s `layerId` layer, re-applying whenever the patch or
 * the target changes. No-op while the canvas/layer is unavailable or `enabled`
 * is false.
 *
 * **Not reverted on unmount or on `enabled` going false.** The styling is a
 * property of the visualisation, not of the panel being open — closing the panel
 * shouldn't repaint the graph. To clear a type, reset it in the patch (the
 * panel's ↺), which re-applies with that type falling back to the template's
 * value from before the hook first wrote it.
 */
export function useApplyTypeStyling(
  canvas: GraphCanvas | null | undefined,
  layerId: string,
  patch: TypeStylingPatch,
  enabled: boolean,
): void {
  const layer = canvas?.layers.get<GraphLayer>(layerId) ?? undefined;
  // The template fields as they were before this hook first wrote them, per layer.
  const before = useRef<{
    layer: GraphLayer;
    node: Record<string, unknown>;
    edge: Record<string, unknown>;
    /** The fields this hook has taken over, `node.bgFill` · `edge.strokeWidth` …. */
    owned: Set<string>;
  } | null>(null);

  useEffect(() => {
    if (!layer || !enabled) return;
    if (before.current?.layer !== layer) {
      const node = (layer.nodeDefaults ?? {}) as Record<string, unknown>;
      const edge = (layer.edgeDefaults ?? {}) as Record<string, unknown>;
      before.current = {
        layer,
        node: { bgFill: node['bgFill'], size: node['size'], labelText: node['labelText'] },
        edge: { strokeColor: edge['strokeColor'], strokeWidth: edge['strokeWidth'] },
        owned: new Set(),
      };
    }
    const prior = before.current;
    const nodeTypes = patch.nodeTypes ?? {};
    const edgeTypes = patch.edgeTypes ?? {};
    const styles = (types: Record<string, object>, key: string): boolean =>
      Object.values(types).some((t) => (t as Record<string, unknown>)[key] !== undefined);
    // Install `resolver` on `field` while the patch styles it; hand a field the
    // patch no longer styles back to its value from before.
    const take = (
      out: Record<string, unknown>,
      scope: 'node' | 'edge',
      field: string,
      styled: boolean,
      resolver: unknown,
    ): void => {
      const key = `${scope}.${field}`;
      if (styled) {
        out[field] = resolver;
        prior.owned.add(key);
      } else if (prior.owned.delete(key)) {
        out[field] = prior[scope][field];
      }
    };
    // Installing a `labelText` resolver *replaces* whatever the layer template
    // held, so don't install one until the patch actually has a label key to
    // honour — otherwise merely opening the panel would wipe a canvas's
    // configured labels. Once installed, a type without a key keeps the
    // template's label, and `'id'` when the template had none.
    const anyLabelKey = Object.values(nodeTypes).some((s) => s.labelKey);

    // `as unknown as` matching `ColorByBehaviour`: the setter's parameter is the
    // flat `Partial<NodeStyle>`, though it stores a `ResolvableNodeStyle`, so a
    // resolver isn't expressible through the public type.
    const node: Record<string, unknown> = {};
    take(node, 'node', 'bgFill', styles(nodeTypes, 'color'), (n: GraphNode) => {
      const color = nodeTypes[n.type]?.color;
      return color ? hexToNumber(color) : resolveField(prior.node['bgFill'] as never, n);
    });
    take(node, 'node', 'size', styles(nodeTypes, 'size'), (n: GraphNode) =>
      nodeTypes[n.type]?.size ?? resolveField(prior.node['size'] as never, n),
    );
    if (Object.keys(node).length === 0 && !anyLabelKey) {
      applyEdges();
      return;
    }
    layer.setNodeDefaults({
      ...node,
      // Only installed once some type actually picks a key — see `anyLabelKey`.
      ...(anyLabelKey
        ? {
            labelText: (n: GraphNode) => {
              const key = nodeTypes[n.type]?.labelKey;
              // "Label: default" for a type that hasn't chosen a key is the
              // template's label; a node's identity when there is none.
              if (!key && prior.node['labelText'] !== undefined) {
                return resolveField(prior.node['labelText'] as never, n);
              }
              const value = readValueKey(n, key ?? 'id');
              return value === undefined || value === null ? undefined : String(value);
            },
          }
        : {}),
    } as unknown as Partial<NodeStyle>);

    applyEdges();

    function applyEdges(): void {
      const edge: Record<string, unknown> = {};
      take(edge, 'edge', 'strokeColor', styles(edgeTypes, 'color'), (e: GraphEdge) => {
        const color = edgeTypes[e.type]?.color;
        return color ? hexToNumber(color) : resolveField(prior.edge['strokeColor'] as never, e);
      });
      take(edge, 'edge', 'strokeWidth', styles(edgeTypes, 'width'), (e: GraphEdge) =>
        edgeTypes[e.type]?.width ?? resolveField(prior.edge['strokeWidth'] as never, e),
      );
      if (Object.keys(edge).length > 0) layer!.setEdgeDefaults(edge as unknown as Partial<EdgeStyle>);
    }
    // `patch` is a fresh object on most host renders, and `setNodeDefaults`
    // re-renders every node — so key the effect on the patch's *content*. The
    // patch is small, flat JSON by design, which is what makes this cheap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, enabled, JSON.stringify(patch)]);
}
