# Interface: TelemetryEvent

One observable state mutation — OTel-agnostic; the app maps it to spans/metrics.

## Properties

### action

> **action**: `string`

Named action from `update(patch, action)`, or `'update'`.

***

### changedPaths

> **changedPaths**: `string`[]

Top-level keys the patch touched — bounded cardinality (span/metric-safe).

***

### durationMs?

> `optional` **durationMs?**: `number`

Wall-clock ms the update took (produce + commit), when the store reports it.

***

### patches

> **patches**: `Patch`[]

The minimal forward delta (the patch *is* the diff — no deep-diff cost).

***

### ts

> **ts**: `number`

Timestamp (ms).
