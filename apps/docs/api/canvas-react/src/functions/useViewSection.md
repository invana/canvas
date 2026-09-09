# Function: useViewSection()

> **useViewSection**(`options?`): `ToolbarItem`[]

**View** toolbar section — zoom in / zoom out / fit-to-content / lock-view
ToolbarItems built off [useZoom](useZoom.md) + [useFitContent](useFitContent.md) +
[useLock](useLock.md). Set `showZoom: false` to omit the two zoom buttons (fit stays);
the lock is a toggle whose icon flips unlocked↔locked (set `showLock: false` to
omit it); locking disables pan + node drag by default while leaving zoom
available. Icons are baked in.

## Parameters

### options?

[`UseViewSectionOptions`](../interfaces/UseViewSectionOptions.md) = `{}`

## Returns

`ToolbarItem`[]
