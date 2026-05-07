# Type Alias: AnimatedDecorationCtor\<TOpts\>

> **AnimatedDecorationCtor**\<`TOpts`\> = (`slot`, `g`, `opts`) => [`AnimatedDecoration`](../interfaces/AnimatedDecoration.md)

Defined in: [packages/canvas/src/renderers/draw/types.ts:197](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/types.ts#L197)

Animated decoration constructor. The decoration owns animation state
(phase, elapsed) and a `tick` method. The renderer hands it both the slot
Container (so the decoration can animate transforms cheaply — e.g.
rotating a pre-stamped dashed ring) and a Graphics for emit calls.
Decorations never create their own Container or Graphics.

## Type Parameters

### TOpts

`TOpts`

## Parameters

### slot

`Container`

### g

[`Graphics`](../../../interfaces/Graphics.md)

### opts

`TOpts`

## Returns

[`AnimatedDecoration`](../interfaces/AnimatedDecoration.md)
