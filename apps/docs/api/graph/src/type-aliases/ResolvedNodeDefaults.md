# Type Alias: ResolvedNodeDefaults

> **ResolvedNodeDefaults** = `Required`\<`Pick`\<[`ResolvableNodeRenderHints`](ResolvableNodeRenderHints.md), `"shape"` \| `"size"` \| `"cornerRadius"` \| `"fill"` \| `"stroke"` \| `"strokeWidth"` \| `"alpha"`\>\> & `Pick`\<[`ResolvableNodeRenderHints`](ResolvableNodeRenderHints.md), `"label"` \| `"height"` \| `"innerR"` \| `"outerR"` \| `"startAngle"` \| `"endAngle"`\>

Defined in: [graph/src/layer/GraphLayer.ts:67](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/graph/src/layer/GraphLayer.ts#L67)

Shape of the per-layer node defaults after merging the caller's
`nodeDefaults` onto the factory `DEFAULT_NODE_HINTS`. The always-present
fields (covered by the factory defaults) are non-optional resolvers;
the rest stay optional.
