# Variable: ClipboardContext

> `const` **ClipboardContext**: `Context`\<`GraphClipboard`\>

Defined in: [canvas-react/src/ClipboardContext.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/ClipboardContext.ts#L10)

Holds the `GraphClipboard` constructed by a `<GraphClipboardProvider>` for all
descendant hooks (`useClipboard`) and self-wiring buttons (Cut/Copy/Paste/
Delete). `null` until the provider's effect has built the instance, or when no
provider is present — consumers must guard.
