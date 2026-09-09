# Variable: DEFAULT\_NODE\_STATES

> `const` **DEFAULT\_NODE\_STATES**: `Readonly`\<`Record`\<[`CanonicalStateName`](../type-aliases/CanonicalStateName.md), [`NodeStyle`](../interfaces/NodeStyle.md)\>\>

Canonical node-state overlays auto-merged into every `GraphLayer`'s
`options.node.state` catalogue on construction (unless
`GraphLayerOptions.useDefaultStates: false`). Consumer-supplied
`options.node.state[name]` entries override individual fields per the
normal merge precedence; this map provides the resting visual identity
of each canonical state so a layer that touches no state code still
gets a sensible hover / select / error ring out of the box.

All values are flat NodeStyle fields — extending or overriding is the
same shape as any other layer-template state overlay. Decorations are
intentionally not declared here so consumers compose them additively
(e.g. a ring decoration on hover) without colliding with the canonical
stroke treatment below.
