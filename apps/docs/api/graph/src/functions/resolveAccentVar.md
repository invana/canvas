# Function: resolveAccentVar()

> **resolveAccentVar**(`varName?`): `number`

Defined in: graph/src/theme/accent.ts:42

Read a CSS custom property (default `--color-primary`) off the document root
and parse it to a number. SSR-safe (`undefined` when there's no `document`).

## Parameters

### varName?

`string` = `'--color-primary'`

## Returns

`number`
