# Type Alias: CanonicalStateName

> **CanonicalStateName** = `"hovered"` \| `"selected"` \| `"highlighted"` \| `"dimmed"` \| `"disabled"`

Defined in: [graph/src/layer/types.ts:196](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/layer/types.ts#L196)

/**
 * Canonical interaction-state names with sensible defaults baked into the
 * GraphLayer's resolver. State styling lives on the layer-level
 * [NodeOption.state](../interfaces/NodeOption.md#state) / per-node [NodeData.state](../interfaces/NodeData.md#state) catalogue —
 * `default` is intentionally absent (it's the absence of any active state,
 * not a state itself).
 *
 * The state-config map is open-keyed: consumers can declare additional
 * named states (e.g. `'pinned'`, `'flagged'`, `'error'`, `'focused'`)
 * directly on `options.node.state` / `node.state` with the same shape —
 * they compose via the same merge rules. The canonical set below is
 * deliberately small; reach for it only when the named driver applies.
 *
 * ### Driver → state map
 *
 * Each canonical state has a distinct *driver* (what causes the state to
 * be written) and *lifetime* (when it clears). The visual treatments
 * overlap (most are stroke rings of various colours), but the semantics
 * do not — a single node can carry several states simultaneously (e.g.
 * `selected + hover`) and a behaviour should only write the states it
 * owns.
 *
 * | State         | Driver                                    | Lifetime                          | Cardinality       |
 * | ------------- | ----------------------------------------- | --------------------------------- | ----------------- |
 * | `hovered`     | Mouse / touch pointer-over                | Transient — clears on pointer-out | ≤ 1 per layer     |
 * | `selected`    | Click / lasso / brush — user's chosen set | Sticky until explicitly cleared   | 0–N per layer     |
 * | `highlighted` | 1-hop neighbours of the hovered / selected | Transient — clears with the driver | 0–N per layer    |
 * | `dimmed`      | Complement of the focal-emphasis set      | Transient — clears with the driver | 0–N per layer    |
 * | `disabled`    | Data flag — "not interactive"             | Sticky — owned by the data feed   | 0–N per layer     |
 *
 * ### Sticky chosen set — `selected`
 *
 * `selected` is the click / lasso / brush state — what the user *chose*.
 * Persists until explicitly deselected. **Multi-select doesn't need its
 * own state**: it's just the same `selected` state applied to every
 * member of `selectedIds: Set<string>`. One node selected → one ring;
 * ten nodes selected → ten rings.
 *
 * `selected` can co-exist with `hovered` — clicking a node doesn't stop
 * it from being hovered.
 *
 * ### Focal-emphasis flow — `highlighted` + `dimmed`
 *
 * Written together by a focal-emphasis behaviour (typically driven by
 * hover or selection). When the user hovers / selects a node:
 * - its 1-hop neighbours go `highlighted` — *supporting cast*,
 * - everyone else goes `dimmed` — *pushed back so the focal set pops*.
 *
 * Both clear together when emphasis ends. Drop the pair if the product
 * never needs the "fade everyone except the focal subgraph" interaction.
 *
 * ### Data-driven — `disabled`
 *
 * Sticky and owned by the data feed (not by an interaction behaviour).
 * `disabled` is "this node isn't interactive — don't let the user pick
 * it". Visually overlaps `dimmed` but they're semantically distinct:
 * - `dimmed` says *"you're focusing elsewhere"* (transient, behaviour).
 * - `disabled` says *"you can't interact with me"* (sticky, data).
 * Conflating them would couple interaction code to data code — keep them
 * separate even if the visual treatment is similar.
