# Type Alias: CanonicalStateName

> **CanonicalStateName** = `"hover"` \| `"selected"` \| `"active"` \| `"highlighted"` \| `"dimmed"` \| `"disabled"` \| `"error"` \| `"focused"`

Defined in: [graph/src/layer/types.ts:269](https://github.com/invana/canvas/blob/6bb086f78a3fc3d8475fe9fda4e47cf5a277b9ff/packages/graph/src/layer/types.ts#L269)

Canonical interaction-state names that `GraphLayer` registers a default
config for on every layer (unless `useDefaultStateConfigs: false`).

`'default'` is intentionally absent — it's the *absence* of any active
state, not a state itself. Consumers can register additional named
states (e.g. `'pinned'`, `'flagged'`) via `setNodeStateConfig` —
the state-config map is open-keyed.
