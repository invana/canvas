# Interface: HoverElementPreviewCardsByType

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:154](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L154)

Per-type card specs — a different card layout keyed by element `type`, all
serializable so a UI can define them (and round-trip via display settings).
The behaviour picks `nodes[type]` / `edges[type]` for the hovered element,
falling back to the behaviour's single `card` spec when a type has no entry.

## Example

```ts
{
  nodes: {
    person:  { image: { field: 'data.avatar' }, title: { field: 'data.name' } },
    company: { title: { field: 'data.name' }, subtitle: { field: 'data.industry' } },
  },
  edges: { INFLUENCED: { title: { field: 'type' } } },
}
```

## Properties

### edges?

> `optional` **edges?**: `Record`\<`string`, [`HoverElementPreviewCardSpec`](HoverElementPreviewCardSpec.md)\>

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:158](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L158)

Card spec per edge `type`.

***

### nodes?

> `optional` **nodes?**: `Record`\<`string`, [`HoverElementPreviewCardSpec`](HoverElementPreviewCardSpec.md)\>

Defined in: [graph/src/behaviours/HoverElementPreviewBehaviour.ts:156](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/graph/src/behaviours/HoverElementPreviewBehaviour.ts#L156)

Card spec per node `type`.
