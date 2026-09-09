# Function: createLogBridge()

> **createLogBridge**(`bus`, `logger`, `opts?`): () => `void`

Bridge the event **tap** stream to structured logs. Each lifecycle-worthy
[CanvasEvent](../../../canvas/src/interfaces/CanvasEvent.md) at or above `opts.level` (default `'info'`) becomes a
[LogRecord](../interfaces/LogRecord.md) named by its `type`. High-frequency types are always
dropped. Honours `exclude` / `sampleRate` and returns an unsubscribe.

## Parameters

### bus

[`CanvasEventBus`](../../../canvas/src/classes/CanvasEventBus.md)

### logger

[`Logger`](../interfaces/Logger.md)

### opts?

[`TapOptions`](../../../canvas/src/interfaces/TapOptions.md) & `object` = `{}`

## Returns

() => `void`
