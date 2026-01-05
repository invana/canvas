# G6-Style Plugin Pattern

This document describes the AntV G6-inspired plugin configuration pattern implemented in Invana Canvas.

## Overview

Plugins can be configured using a declarative object-based pattern similar to AntV G6. Each plugin instance can be identified by a unique `key` and updated dynamically without recreating the entire canvas.

## Configuration

### Initial Setup

Plugins are configured in the `plugins` array when creating the canvas:

```typescript
const canvas = new Canvas({
  container,
  width: 800,
  height: 600,
  behavior: 'default',
  plugins: [
    {
      type: 'background',           // Plugin type (registered name)
      key: 'my-background',         // Unique key for this instance
      backgroundColor: '#f0f2f5',   // Plugin-specific options
      patternType: 'grid',
      spacing: 25
    }
  ]
});
```

### Plugin Config Structure

```typescript
interface PluginConfigWithOptions {
  type: string;      // Plugin type (e.g., 'background', 'minimap')
  key?: string;      // Unique identifier for updates (optional but recommended)
  [key: string]: any; // Plugin-specific options
}
```

## Updating Plugins

### Method 1: Direct Update with `updatePlugin()`

Update a single plugin by its key:

```typescript
canvas.updatePlugin({
  key: 'my-background',
  backgroundColor: '#e6f7ff',  // New background color
  patternType: 'dots'           // Change pattern type
});
```

### Method 2: Batch Update with `setOptions()`

Update multiple aspects of the canvas, including plugins:

```typescript
canvas.setOptions({
  styles: {
    node: { fill: '#58a6ff' },
    edge: { stroke: '#666' }
  },
  plugins: [
    {
      key: 'my-background',
      backgroundColor: '#e6f7ff'
    }
  ]
});
```

## How It Works

1. **Plugin Registration**: When a plugin is configured with a `key`, Canvas stores the key alongside the plugin in a single map

2. **Plugin Storage**: Canvas maintains plugin metadata in one structure:
   ```typescript
   _plugins: Map<string, { plugin: CanvasPlugin; userKey?: string }>
   ```

3. **Update Mechanism**: The `updatePlugin()` method:
   - Iterates through plugins to find one with matching key (O(n) lookup)
   - Finds appropriate update methods on the plugin
   - Calls plugin-specific setters (e.g., `setBackground()` for BackgroundPlugin)
   - Falls back to generic `updateOptions()` or `setOptions()` if available

4. **PluginRegistry**: The registry's `create()` method returns metadata:
   ```typescript
   {
     plugin: CanvasPlugin,  // The plugin instance
     key: string | undefined,  // User-provided key
     options: Record<string, any>  // Extracted options
   }
   ```

## Example: Theme Switching

Here's a complete example demonstrating dynamic theme switching:

```typescript
// Theme configurations
const themes = {
  blueprint: {
    styles: {
      node: { fill: '#58a6ff', stroke: '#fff' },
      edge: { stroke: '#58a6ff' }
    },
    background: {
      type: 'pattern',
      patternType: 'grid',
      backgroundColor: '#0b2f66',
      color: '#b3e7ff',
      spacing: 25
    }
  },
  light: {
    styles: {
      node: { fill: '#5cd43e', stroke: '#333' },
      edge: { stroke: '#666' }
    },
    background: {
      type: 'pattern',
      patternType: 'dots',
      backgroundColor: '#fafafa',
      color: '#b0b0b0',
      spacing: 30
    }
  }
};

// Initial setup
const canvas = new Canvas({
  container,
  plugins: [
    {
      type: 'background',
      key: 'theme-bg',
      ...themes.blueprint.background
    }
  ]
});

// Switch theme
function switchTheme(themeName) {
  const theme = themes[themeName];
  canvas.setOptions({
    styles: theme.styles,
    plugins: [
      {
        key: 'theme-bg',
        ...theme.background
      }
    ]
  });
}
```

## Benefits

1. **Declarative Configuration**: Plugin setup is clean and serializable
2. **Dynamic Updates**: Change plugin options without canvas recreation
3. **Type Safety**: TypeScript provides autocomplete for plugin options
4. **Familiar Pattern**: Follows established conventions from AntV G6
5. **Flexible**: Supports both simple string IDs and complex object configs

## Supported Plugins

Currently implemented with G6-style pattern:
- **BackgroundPlugin**: `type: 'background'`
  - Options: `backgroundColor`, `patternType`, `color`, `spacing`, `lineWidth`, etc.

Future plugins will follow the same pattern.

## Implementation Details

### Core Components

1. **Canvas._plugins**: Map storing plugin metadata including optional user keys
   ```typescript
   Map<string, { plugin: CanvasPlugin; userKey?: string }>
   ```
2. **Canvas.updatePlugin()**: Method to update plugin by key
3. **Canvas.getPluginByKey()**: Helper to retrieve plugin by user key (iterates through map)
4. **PluginRegistry.create()**: Returns `{plugin, key, options}`
5. **Canvas.initializePlugins()**: Stores user keys in plugin metadata during initialization

### Plugin Update Flow

```
setOptions({plugins: [...]})
  ↓
For each plugin config with a key:
  ↓
updatePlugin({key, ...options})
  ↓
getPluginByKey(key) → finds plugin instance
  ↓
Calls plugin update methods:
  - updateOptions() if available
  - setOptions() if available
  - setXXX() methods for specific properties
```

## Best Practices

1. **Always provide a key** for plugins you plan to update
2. **Use descriptive keys** like `'main-background'` or `'toolbar-minimap'`
3. **Keep options flat** when possible for easier updates
4. **Batch updates** using `setOptions()` for multiple changes
5. **Avoid recreating canvas** - use `updatePlugin()` instead

## Reference

This pattern is inspired by AntV G6's plugin system:
- [G6 Plugin Documentation](https://g6.antv.antgroup.com/en/manual/plugin/background)
- [G6 Background Plugin Example](https://g6.antv.antgroup.com/en/examples/plugin/background)
