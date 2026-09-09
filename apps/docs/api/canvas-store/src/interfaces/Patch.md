# Interface: Patch

A single change operation — structurally identical to immer's `Patch`, but
declared here so the port contract has **zero dependencies, even at the type
level**. The store engine (`@invana/canvas-store`) produces immer patches;
they satisfy this shape verbatim, and this shape satisfies immer's
`applyPatches` input. Do not add fields immer doesn't emit.

## Properties

### op

> **op**: `"replace"` \| `"add"` \| `"remove"`

***

### path

> **path**: (`string` \| `number`)[]

***

### value?

> `optional` **value?**: `unknown`
