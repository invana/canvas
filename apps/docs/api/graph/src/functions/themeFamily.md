# Function: themeFamily()

> **themeFamily**(`themeId`): `string`

Defined in: graph/src/theme/family.ts:13

Map a host app theme id (`@invana/themes`) onto a canvas [Theme](../interfaces/Theme.md) family
name. The app theme and the canvas theme are linked only by a loose name
match — strip the light/dark mode token from either end and what's left is
the family (`'forest'`, `'ocean'`, `'default'`).

## Parameters

### themeId

`string`

## Returns

`string`

## Example

```ts
themeFamily('default-dark') // 'default'
themeFamily('dark-forest')  // 'forest'
themeFamily('ocean-light')  // 'ocean'
themeFamily(undefined)      // 'default'
```
