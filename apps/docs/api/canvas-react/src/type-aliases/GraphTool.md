# Type Alias: GraphTool

> **GraphTool** = `"select"` \| `"add"` \| `"connect"` \| `"delete"`

The active modelling tool. `'select'` is the neutral pointer (drag / select);
`'add'` drops nodes; `'connect'` draws edges; `'delete'` erases on click.
A string-literal union, but consumers may treat it opaquely — the
ModellerToolbar only renders the tools it's told to.
