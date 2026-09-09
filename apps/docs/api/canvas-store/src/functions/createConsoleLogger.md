# Function: createConsoleLogger()

> **createConsoleLogger**(`sink?`): [`Logger`](../interfaces/Logger.md)

A dep-free reference [Logger](../interfaces/Logger.md) that routes to the matching `console` method.

## Parameters

### sink?

`Pick`\<`Console`, `"debug"` \| `"info"` \| `"warn"` \| `"error"`\> = `console`

## Returns

[`Logger`](../interfaces/Logger.md)
