# Function: useViewSection()

> **useViewSection**(`options?`): [`ToolbarItem`](../type-aliases/ToolbarItem.md)[]

Defined in: [canvas-react/src/hooks/useViewSection.ts:27](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/hooks/useViewSection.ts#L27)

**View** toolbar section — zoom in / zoom out / fit-to-content / lock-view
[ToolbarItem](../type-aliases/ToolbarItem.md)s built off [useZoom](useZoom.md) + [useFitContent](useFitContent.md) +
[useLock](useLock.md). The lock is a toggle whose icon flips unlocked↔locked
(set `showLock: false` to omit it); locking disables pan + node drag by default
while leaving zoom available. Icons are baked in.

## Parameters

### options?

[`UseViewSectionOptions`](../interfaces/UseViewSectionOptions.md) = `{}`

## Returns

[`ToolbarItem`](../type-aliases/ToolbarItem.md)[]
