# ThemedBackgroundPlugin

Wraps a `BackgroundPlugin` with a list of named themes and a light/dark/auto mode. Each theme bundles both a `light` and `dark` variant — the plugin's mode picks which one renders.

> **Package:** `@invana/canvas`

## Installation

```ts
import { ThemedBackgroundPlugin } from '@invana/canvas';

const bg = new ThemedBackgroundPlugin({
  themes: [
    {
      id: 'default',
      label: 'Default',
      light: { type: 'pattern', patternType: 'dots', backgroundColor: '#f5f5f5', color: '#aaa' },
      dark:  { type: 'pattern', patternType: 'dots', backgroundColor: '#1a1a2e', color: '#595959' },
    },
  ],
  mode: 'auto',
});

await canvas.plugins.register(bg);
```

## Options

| Option | Type | Default | Description |
|---|---|---|---|
| `themes` | `ThemedBackgroundTheme[]` | — | **Required.** List of named themes. Each must define both `light` and `dark` variants. |
| `defaultTheme` | `string` | `themes[0].id` | Id of the theme to activate on startup. |
| `mode` | `'auto' \| 'light' \| 'dark'` | `'auto'` | `'auto'` follows `prefers-color-scheme`; `'light'` / `'dark'` pin explicitly. |
| `key` | `string` | `'themed-background'` | Plugin id override — set when registering multiple instances. |

### `ThemedBackgroundTheme`

| Property | Type | Description |
|---|---|---|
| `id` | `string` | Stable identifier — referenced by `setTheme(id)` and `defaultTheme`. |
| `label` | `string?` | Optional human-readable label for UI components. |
| `light` | `BackgroundOptions` | Style applied when the resolved kind is `'light'`. |
| `dark` | `BackgroundOptions` | Style applied when the resolved kind is `'dark'`. |

`BackgroundOptions` accepts the same fields as [`BackgroundPlugin`](./background.md#options).

## API

### `setTheme(id)`

Switch to a different theme. Mode is preserved. Throws when the id is unknown. Emits `'themed-background:theme-switched'`.

```ts
bg.setTheme('ocean');
```

### `setMode(mode)`

Pin to `'light'` or `'dark'`, or restore `'auto'` system-following. Emits `'themed-background:mode-updated'`.

```ts
bg.setMode('dark');
bg.setMode('auto');
```

### `getActiveTheme()`

Returns the full `ThemedBackgroundTheme` object for the current theme.

### `getMode()`

Returns the current mode string (`'auto'`, `'light'`, or `'dark'`).

### `getResolvedKind()`

Returns the concrete variant currently being rendered (`'light'` or `'dark'`).

### `getThemes()`

Returns a read-only snapshot of the configured theme list.

## Events

Events are emitted on the shared `canvas.events` bus.

| Event | Payload | Fired when |
|---|---|---|
| `'themed-background:theme-switched'` | `ThemedBackgroundThemeSwitchedEvent` | Theme changes (including initial registration). |
| `'themed-background:mode-updated'` | `ThemedBackgroundModeUpdatedEvent` | Mode changes (manually or when the system preference flips while in `'auto'`). |
| `'background:updated'` | — | Inner `BackgroundPlugin` re-renders (fired independently on every resolved-options push). |

```ts
canvas.events.on('themed-background:theme-switched', (e) => {
  console.log('theme:', e.theme.id, 'kind:', e.resolvedKind, 'source:', e.source);
});

canvas.events.on('themed-background:mode-updated', (e) => {
  console.log('mode:', e.mode, 'was:', e.previousMode, 'kind:', e.resolvedKind);
});
```

## Multiple instances

Use `key` to register several themed backgrounds simultaneously:

```ts
await canvas.plugins.register(new ThemedBackgroundPlugin({ themes: [...], key: 'bg-main' }));
await canvas.plugins.register(new ThemedBackgroundPlugin({ themes: [...], key: 'bg-overlay' }));
```

## Example: multiple themes with a theme switcher

```ts
const bg = new ThemedBackgroundPlugin({
  themes: [
    {
      id: 'default',
      label: 'Default',
      light: { type: 'pattern', patternType: 'dots', backgroundColor: '#f5f5f5', color: '#bbb', spacing: 28 },
      dark:  { type: 'pattern', patternType: 'dots', backgroundColor: '#1a1a2e', color: '#595959', spacing: 28 },
    },
    {
      id: 'ocean',
      label: 'Ocean',
      light: { type: 'pattern', patternType: 'grid', backgroundColor: '#e8f4f8', color: '#a0c4d8', spacing: 36 },
      dark:  { type: 'pattern', patternType: 'grid', backgroundColor: '#0d2137', color: '#1a4b6e', spacing: 36 },
    },
  ],
  defaultTheme: 'default',
  mode: 'auto',
});

await canvas.plugins.register(bg);

// later — user picks a theme
bg.setTheme('ocean');

// later — force dark mode
bg.setMode('dark');
```
