# Type Alias: PathCommand

> **PathCommand** = \{ `kind`: `"moveTo"`; `x`: `number`; `y`: `number`; \} \| \{ `kind`: `"lineTo"`; `x`: `number`; `y`: `number`; \} \| \{ `cpx`: `number`; `cpy`: `number`; `kind`: `"quadTo"`; `x`: `number`; `y`: `number`; \} \| \{ `cp1x`: `number`; `cp1y`: `number`; `cp2x`: `number`; `cp2y`: `number`; `kind`: `"cubicTo"`; `x`: `number`; `y`: `number`; \} \| \{ `kind`: `"close"`; \}

Defined in: [packages/canvas/src/renderers/draw/shapes/path.ts:16](https://github.com/invana/canvas/blob/99e83f9a80ef97289345e9761df2ad8404cdedc7/packages/canvas/src/renderers/draw/shapes/path.ts#L16)
