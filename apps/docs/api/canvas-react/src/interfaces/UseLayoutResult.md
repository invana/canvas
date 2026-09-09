# Interface: UseLayoutResult

## Properties

### applyLayout

> **applyLayout**: (`key`) => `void`

Apply the layout registered under `key`, then fit the view.

#### Parameters

##### key

`string`

#### Returns

`void`

***

### isRunning

> **isRunning**: `boolean`

True while **any** layout is running on the canvas — this hook's own
`applyLayout` call *or* an engine-driven run (notably the initial
`config.activeLayout` load run, still settling). Read from the reactive
`runtime.layout.running` state OR the local `apply` promise, so a run/stop
control stays consistent with what the engine is actually doing.

***

### layout

> **layout**: `string`

Currently-applied layout key.

***

### layoutOptions

> **layoutOptions**: `Record`\<`string`, `string`\>

Key → label map for a picker.

***

### stopLayout

> **stopLayout**: () => `void`

Cancel the in-flight layout run (calls the active instance's `stop()`, if it
has one) and clear [isRunning](#isrunning). No-op when nothing is running. For an
animated d3-force this halts the live simulation where it stands; for a
one-shot layout without `stop()` it just clears the running flag.

#### Returns

`void`
