# Interface: CanvasEvent\<P\>

A structured event envelope as seen on the **tap** channel: the type, a
timestamp, the source instance, and the payload. One tap subscriber reading
these reconstructs the whole loop (input → state change → render) for telemetry
and collaboration.

## Type Parameters

### P

`P` = `unknown`

## Properties

### payload

> **payload**: `P`

***

### source

> **source**: [`EventSource`](EventSource.md)

***

### timestamp

> **timestamp**: `number`

***

### type

> **type**: `string`
