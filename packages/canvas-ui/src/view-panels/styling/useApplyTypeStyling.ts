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

import { useEffect } from 'react';
import type { EdgeStyle, GraphCanvas, GraphEdge, GraphLayer, GraphNode, NodeStyle } from '@invana/graph';
import { readValueKey } from '@invana/graph';

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
 * panel's ↺), which re-applies with that type's resolvers returning `undefined`.
 */
export function useApplyTypeStyling(
  canvas: GraphCanvas | null | undefined,
  layerId: string,
  patch: TypeStylingPatch,
  enabled: boolean,
): void {
  const layer = canvas?.layers.get<GraphLayer>(layerId) ?? undefined;

  useEffect(() => {
    if (!layer || !enabled) return;
    const nodeTypes = patch.nodeTypes ?? {};
    const edgeTypes = patch.edgeTypes ?? {};
    // Installing a `labelText` resolver *replaces* whatever the layer template
    // held, so don't install one until the patch actually has a label key to
    // honour — otherwise merely opening the panel would wipe a canvas's
    // configured labels. Once installed, a type without a key falls back to
    // `'id'` rather than to nothing.
    const anyLabelKey = Object.values(nodeTypes).some((s) => s.labelKey);

    // `as unknown as` matching `ColorByBehaviour`: the setter's parameter is the
    // flat `Partial<NodeStyle>`, though it stores a `ResolvableNodeStyle`, so a
    // resolver isn't expressible through the public type. Returning `undefined`
    // isn't either — but it's the documented runtime behaviour (see the header).
    layer.setNodeDefaults({
      bgFill: (n: GraphNode) => {
        const color = nodeTypes[n.type]?.color;
        return color ? hexToNumber(color) : undefined;
      },
      size: (n: GraphNode) => nodeTypes[n.type]?.size,
      // Only installed once some type actually picks a key — see `anyLabelKey`.
      ...(anyLabelKey
        ? {
            labelText: (n: GraphNode) => {
              // `'id'` is what "Label: default" means for a type that hasn't
              // chosen one: a node's identity is the label every graph can show.
              const value = readValueKey(n, nodeTypes[n.type]?.labelKey ?? 'id');
              return value === undefined || value === null ? undefined : String(value);
            },
          }
        : {}),
    } as unknown as Partial<NodeStyle>);

    layer.setEdgeDefaults({
      strokeColor: (e: GraphEdge) => {
        const color = edgeTypes[e.type]?.color;
        return color ? hexToNumber(color) : undefined;
      },
      strokeWidth: (e: GraphEdge) => edgeTypes[e.type]?.width,
    } as unknown as Partial<EdgeStyle>);
    // `patch` is a fresh object on most host renders, and `setNodeDefaults`
    // re-renders every node — so key the effect on the patch's *content*. The
    // patch is small, flat JSON by design, which is what makes this cheap.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layer, enabled, JSON.stringify(patch)]);
}
