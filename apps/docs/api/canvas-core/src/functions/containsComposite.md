# Function: containsComposite()

> **containsComposite**(`spec`, `localX`, `localY`, `pad?`): `boolean`

A composite is its **root silhouette** (centred in the card box) plus every
geometric part painted on top of it. Parts are included because they are
painted into the same `Graphics` the backend hit-tests today: a part that
pokes outside the root — an accent bar on an unclipped card — is clickable,
and stays clickable here.

`label` parts are excluded: they are mounted as text children, not painted
into the body, so they never contributed a hit region.

## Parameters

### spec

[`CompositeSpec`](../interfaces/CompositeSpec.md)

### localX

`number`

### localY

`number`

### pad?

`number` = `0`

## Returns

`boolean`
