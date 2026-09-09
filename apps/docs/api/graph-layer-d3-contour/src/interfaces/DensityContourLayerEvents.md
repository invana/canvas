# Interface: DensityContourLayerEvents

A string-keyed event map (`{ eventType: payload }`) — the conventional generic
bound for scoped [EventEmitter](../../../canvas/src/classes/EventEmitter.md)s (layer / behaviour / domain-store event
channels). `EventEmitter`/`SourceEmitter` accept any `object`; this is the
portable shape most maps use.

## Extends

- [`EventMap`](../../../canvas/src/type-aliases/EventMap.md)

## Indexable

> \[`key`: `string`\]: `unknown`

## Properties

### recompute

> **recompute**: `object`

Fired after each recompute completes, before paint.

#### durationMs

> **durationMs**: `number`

#### points

> **points**: `number`

#### thresholds

> **thresholds**: `number`
