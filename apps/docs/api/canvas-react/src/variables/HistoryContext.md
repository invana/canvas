# Variable: HistoryContext

> `const` **HistoryContext**: `Context`\<`GraphHistory`\>

Defined in: [canvas-react/src/HistoryContext.ts:10](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas-react/src/HistoryContext.ts#L10)

Holds the `GraphHistory` constructed by a `<GraphHistoryProvider>` for all
descendant hooks (`useHistory`) and self-wiring buttons (Undo/Redo/Redraw).
`null` until the provider's effect has built the instance, or when no provider
is present — consumers must guard.
