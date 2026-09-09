# Variable: HistoryContext

> `const` **HistoryContext**: `Context`\<`GraphHistory`\>

Holds the `GraphHistory` constructed by a `<GraphHistoryProvider>` for all
descendant hooks (`useHistory`) and self-wiring buttons (Undo/Redo/Redraw).
`null` until the provider's effect has built the instance, or when no provider
is present — consumers must guard.
