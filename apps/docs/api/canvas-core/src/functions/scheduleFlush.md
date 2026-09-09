# Function: scheduleFlush()

> **scheduleFlush**(`mode`, `cb`): () => `void`

Arm a deferred flush per `mode`, returning a **cancel** function (a no-op once the
callback has run or for modes that can't be cancelled). `'manual'` arms nothing.

## Parameters

### mode

[`FlushMode`](../type-aliases/FlushMode.md)

### cb

() => `void`

## Returns

() => `void`
