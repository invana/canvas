# Canvas Background Styling

This document explains how to add and customize background styling for your canvas visualizations.

## Overview

The canvas now supports rich background styling options including:

- **Solid colors** - Simple color fills
- **Gradients** - Linear and radial gradients with multiple color stops
- **Patterns** - Dots, grid, cross, and diagonal line patterns (similar to React Flow)

## Quick Start

### Basic Usage

```typescript
import { Canvas } from '@invana/canvas-core';

const canvas = new Canvas({
  container: document.getElementById('app'),
  width: 800,
  height: 600,
  // Set background style in options
  backgroundStyle: {
    type: 'solid',
    color: '#f5f5f5'
  },
  data: { nodes: [...], edges: [...] }
});

await canvas.init();
canvas.render();
```

### Dynamic Background Changes

```typescript
// Change background at runtime
canvas.setBackground({
  type: 'pattern',
  patternType: 'dots',
  color: '#cccccc',
  backgroundColor: '#ffffff',
  size: 2,
  spacing: 20
});
```

## Background Types

### 1. Solid Color

Simple solid color backgrounds.

```typescript
{
  type: 'solid',
  color: '#f5f5f5',  // Hex color string or number
  alpha: 1.0          // Optional: opacity (0-1)
}
```

**Examples:**
```typescript
// Light background
canvas.setBackground({ type: 'solid', color: '#ffffff' });

// Dark background
canvas.setBackground({ type: 'solid', color: '#1a1a2e' });

// Semi-transparent
canvas.setBackground({ type: 'solid', color: '#f5f5f5', alpha: 0.8 });
```

### 2. Linear Gradient

Gradients that transition colors in a linear direction.

```typescript
{
  type: 'gradient',
  gradientType: 'linear',
  colors: [
    { color: '#667eea', offset: 0 },
    { color: '#764ba2', offset: 1 }
  ],
  angle: 90,          // Optional: angle in degrees (0=right, 90=down)
  alpha: 1.0          // Optional: opacity
}
```

**Examples:**
```typescript
// Horizontal gradient
canvas.setBackground({
  type: 'gradient',
  gradientType: 'linear',
  angle: 0,
  colors: [
    { color: '#667eea', offset: 0 },
    { color: '#764ba2', offset: 1 }
  ]
});

// Vertical gradient
canvas.setBackground({
  type: 'gradient',
  gradientType: 'linear',
  angle: 90,
  colors: [
    { color: '#f093fb', offset: 0 },
    { color: '#f5576c', offset: 1 }
  ]
});

// Multi-color sunset gradient
canvas.setBackground({
  type: 'gradient',
  gradientType: 'linear',
  angle: 90,
  colors: [
    { color: '#ff6b6b', offset: 0 },
    { color: '#feca57', offset: 0.5 },
    { color: '#ff9ff3', offset: 1 }
  ]
});
```

### 3. Radial Gradient

Gradients that radiate from a center point.

```typescript
{
  type: 'gradient',
  gradientType: 'radial',
  colors: [
    { color: '#ffffff', offset: 0 },
    { color: '#667eea', offset: 1 }
  ],
  center: { x: 400, y: 300 },  // Optional: center point
  radius: 500,                  // Optional: gradient radius
  alpha: 1.0                    // Optional: opacity
}
```

**Examples:**
```typescript
// Center spotlight
canvas.setBackground({
  type: 'gradient',
  gradientType: 'radial',
  colors: [
    { color: '#ffffff', offset: 0 },
    { color: '#667eea', offset: 1 }
  ]
});

// Cosmic gradient
canvas.setBackground({
  type: 'gradient',
  gradientType: 'radial',
  colors: [
    { color: '#8e2de2', offset: 0 },
    { color: '#4a00e0', offset: 0.5 },
    { color: '#000428', offset: 1 }
  ]
});
```

### 4. Dot Pattern

Regular grid of dots (similar to React Flow).

```typescript
{
  type: 'pattern',
  patternType: 'dots',
  color: '#cccccc',           // Dot color
  backgroundColor: '#ffffff',  // Background color
  size: 2,                    // Dot radius
  spacing: 20,                // Space between dots
  alpha: 1.0                  // Optional: dot opacity
}
```

**Examples:**
```typescript
// React Flow style dots
canvas.setBackground({
  type: 'pattern',
  patternType: 'dots',
  color: '#81818a',
  backgroundColor: '#ffffff',
  size: 1,
  spacing: 20,
  alpha: 0.4
});

// Large dots
canvas.setBackground({
  type: 'pattern',
  patternType: 'dots',
  color: '#666666',
  backgroundColor: '#f0f0f0',
  size: 5,
  spacing: 30
});
```

### 5. Grid Pattern

Grid lines forming squares.

```typescript
{
  type: 'pattern',
  patternType: 'grid',
  color: '#e0e0e0',           // Grid line color
  backgroundColor: '#ffffff',  // Background color
  spacing: 20,                // Grid cell size
  lineWidth: 1,               // Line thickness
  alpha: 1.0                  // Optional: line opacity
}
```

**Examples:**
```typescript
// Fine grid
canvas.setBackground({
  type: 'pattern',
  patternType: 'grid',
  color: '#e8e8e8',
  backgroundColor: '#ffffff',
  spacing: 10,
  lineWidth: 0.5
});

// Blueprint style
canvas.setBackground({
  type: 'pattern',
  patternType: 'grid',
  color: '#4a90e2',
  backgroundColor: '#001f3f',
  spacing: 20,
  lineWidth: 1,
  alpha: 0.5
});
```

### 6. Cross Pattern

Plus-sign markers at regular intervals.

```typescript
{
  type: 'pattern',
  patternType: 'cross',
  color: '#cccccc',           // Cross color
  backgroundColor: '#ffffff',  // Background color
  size: 5,                    // Cross arm length
  spacing: 25,                // Space between crosses
  lineWidth: 1,               // Line thickness
  alpha: 1.0                  // Optional: opacity
}
```

**Examples:**
```typescript
// Standard cross pattern
canvas.setBackground({
  type: 'pattern',
  patternType: 'cross',
  color: '#cccccc',
  backgroundColor: '#ffffff',
  size: 5,
  spacing: 25,
  lineWidth: 1
});

// Colored crosses
canvas.setBackground({
  type: 'pattern',
  patternType: 'cross',
  color: '#4a90e2',
  backgroundColor: '#e3f2fd',
  size: 5,
  spacing: 25,
  lineWidth: 1.5
});
```

### 7. Lines Pattern

Diagonal parallel lines.

```typescript
{
  type: 'pattern',
  patternType: 'lines',
  color: '#e0e0e0',           // Line color
  backgroundColor: '#ffffff',  // Background color
  spacing: 10,                // Space between lines
  lineWidth: 1,               // Line thickness
  alpha: 1.0                  // Optional: opacity
}
```

**Examples:**
```typescript
// Fine diagonal lines
canvas.setBackground({
  type: 'pattern',
  patternType: 'lines',
  color: '#e8e8e8',
  backgroundColor: '#ffffff',
  spacing: 5,
  lineWidth: 0.5
});

// Bold colored lines
canvas.setBackground({
  type: 'pattern',
  patternType: 'lines',
  color: '#9b59b6',
  backgroundColor: '#f3e5f5',
  spacing: 12,
  lineWidth: 1.5
});
```

## API Reference

### Canvas Options

```typescript
interface CanvasOptions {
  // ... other options
  backgroundStyle?: BackgroundStyle;
}
```

### Canvas Methods

```typescript
// Set background style
canvas.setBackground(style: BackgroundStyle): void

// Clear custom background (restore solid color)
canvas.clearBackground(): void

// Legacy method (still supported)
canvas.setBackgroundColor(color: string): void
```

### Type Definitions

```typescript
type BackgroundStyle = 
  | SolidBackground 
  | GradientBackground 
  | PatternBackground;

interface SolidBackground {
  type: 'solid';
  color: string | number;
  alpha?: number;
}

interface GradientBackground {
  type: 'gradient';
  gradientType: 'linear' | 'radial';
  colors: Array<{ color: string | number; offset: number }>;
  // Linear specific
  angle?: number;
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  // Radial specific
  center?: { x: number; y: number };
  radius?: number;
  alpha?: number;
}

interface PatternBackground {
  type: 'pattern';
  patternType: 'dots' | 'grid' | 'cross' | 'lines';
  color: string | number;
  backgroundColor?: string | number;
  size?: number;
  spacing?: number;
  lineWidth?: number;
  alpha?: number;
  backgroundAlpha?: number;
}
```

## Real-World Examples

### React Flow Style

```typescript
canvas.setBackground({
  type: 'pattern',
  patternType: 'dots',
  color: '#81818a',
  backgroundColor: '#ffffff',
  size: 1,
  spacing: 20,
  alpha: 0.4
});
```

### Blueprint/Engineering Style

```typescript
canvas.setBackground({
  type: 'pattern',
  patternType: 'grid',
  color: '#2a9fd6',
  backgroundColor: '#0d1117',
  spacing: 25,
  lineWidth: 0.5,
  alpha: 0.8
});
```

### Minimal Light Theme

```typescript
canvas.setBackground({
  type: 'pattern',
  patternType: 'dots',
  color: '#e0e0e0',
  backgroundColor: '#fafafa',
  size: 1.5,
  spacing: 30,
  alpha: 0.6
});
```

### Vibrant Gradient

```typescript
canvas.setBackground({
  type: 'gradient',
  gradientType: 'linear',
  angle: 45,
  colors: [
    { color: '#4facfe', offset: 0 },
    { color: '#00f2fe', offset: 1 }
  ]
});
```

## Performance Considerations

- **Patterns** are rendered as vector graphics and scale well with zoom
- **Gradients** use multiple drawing steps for smooth color transitions
- All backgrounds are cached and only re-rendered on:
  - Background style changes
  - Canvas resize
  - Manual updates

## Browser Compatibility

All background styles work with:
- ✅ WebGPU (modern browsers)
- ✅ WebGL2 (fallback)
- ✅ All PixiJS v8 supported browsers

## Tips & Best Practices

1. **Color Contrast**: Ensure sufficient contrast between background and graph elements
2. **Pattern Density**: Adjust `spacing` to avoid visual clutter
3. **Alpha Values**: Use semi-transparent patterns for subtle effects
4. **Dark Mode**: Provide appropriate background styles for both light and dark themes
5. **Performance**: For large canvases, prefer simpler patterns (dots, grid) over complex gradients

## Storybook Examples

View live examples in Storybook:
- `Background/Styling/Solid Color`
- `Background/Styling/Linear Gradients`
- `Background/Styling/Radial Gradients`
- `Background/Styling/Dot Pattern`
- `Background/Styling/Grid Pattern`
- `Background/Styling/Cross Pattern`
- `Background/Styling/Lines Pattern`
- `Background/Styling/React Flow Style`
- `Background/Styling/Blueprint Style`

Run: `pnpm run dev` and navigate to the "Background" section.
