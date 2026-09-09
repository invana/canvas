# Variable: canvasDataflow

> `const` **canvasDataflow**: `object`

The engine's type / instance dataflow — **data only**.

No `settings`, deliberately, and no card templates: this dataset describes
*what the symbols are*, not how to draw them. A consumer supplies the look —
see `usecases/by-casestudies/code-explainability`, which owns the card
structures, stylings and layout config for it.

(This is the one dataset in the package without a `settings` half. Every other
one ships a recommended look because the look is inseparable from the data —
a Sankey needs a Sankey layout. Here the graph is just a DAG of symbols, and
the interesting looks are the consumer's business.)

## Type Declaration

### edges

> **edges**: `GraphEdge` & `object`[]

### nodes

> **nodes**: `GraphNode` & `object`[]
