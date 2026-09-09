# Interface: DefinitionSerializable

The structural contract a layer / behaviour / layout implements to contribute
its **serialisable configuration** (styling template, options, params) to the
snapshot's `definition`.

Needed because a declarative (React) canvas passes options to **constructors**,
not through `canvas.update()`, so the reactive `store.view.definition` is
empty. Each instance can instead expose its own JSON-safe config slice here;
[exportCanvasState](../functions/exportCanvasState.md) overlays it onto `definition.{layers,behaviours,layouts}`
keyed by the instance id. Duck-typed like [DataSerializableLayer](DataSerializableLayer.md) so the
engine stays free of domain deps.

The returned object must be JSON-safe — function-valued style resolvers (e.g.
`labelText: (n) => …`) cannot serialise and should be dropped (implementations
use [jsonSafe](../functions/jsonSafe.md)). Import re-applies the slice through `setOptions`, whose
shallow merge preserves any live resolver a serialised template omitted.

## Methods

### serializeDefinition()

> **serializeDefinition**(): `Record`\<`string`, `unknown`\>

Return this instance's JSON-safe config slice, or `undefined` to contribute nothing.

#### Returns

`Record`\<`string`, `unknown`\>
