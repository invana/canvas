# Type Alias: EventMap

> **EventMap** = `Record`\<`string`, `unknown`\>

A string-keyed event map (`{ eventType: payload }`) — the conventional generic
bound for scoped [EventEmitter](../classes/EventEmitter.md)s (layer / behaviour / domain-store event
channels). `EventEmitter`/`SourceEmitter` accept any `object`; this is the
portable shape most maps use.
