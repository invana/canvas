# Interface: DrawEdgeOptions

The serialisable subset of `DrawEdgeBehaviourOptions` this editor produces.
The `createEdge` / `onEdgeCreate` **callbacks** and the base
`targetLayerId` / `enabled` / `shortcuts` are out of scope. `draftStyle` (the
rubber-band preview stroke) keeps its nested structure here; the flat form
splits it into prefixed scalars — see [DrawEdgeFields](DrawEdgeFields.md). `draftStyle.color`
is an engine `0xRRGGBB` **number** (default `0x60a5fa`).

## Properties

### allowSelfLoop?

> `optional` **allowSelfLoop?**: `boolean`

***

### draftStyle?

> `optional` **draftStyle?**: `object`

#### alpha?

> `optional` **alpha?**: `number`

#### color?

> `optional` **color?**: `number`

Preview stroke colour as an engine `0xRRGGBB` number.

#### dash?

> `optional` **dash?**: \[`number`, `number`\]

`[dash, gap]` dash pattern.

#### width?

> `optional` **width?**: `number`
