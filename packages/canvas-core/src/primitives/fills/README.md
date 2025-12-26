# Fill Primitives

Reusable fill functions for nodes and edges in the canvas system.

## Overview

The fill system provides low-level primitives that can be used directly by nodes and edges to create sophisticated fill effects:

- **Solid colors** - Basic color fills
- **Linear gradients** - Directional color transitions
- **Radial gradients** - Circular color transitions
- **Images** - Textured fills with multiple fit modes
- **Patterns** - Repeating texture fills

## Architecture

### High-Level API (Shapes)
```typescript
// Used by shape drawing functions
import { applyShapeFill } from '@aspect-ui/canvas-core/primitives/fills';

// Automatically handles fill from ShapeStyle
applyShapeFill(graphics, style, bounds);
```

### Low-Level Primitives (Nodes & Edges)

#### Gradient Primitives

```typescript
import {
  createLinearGradient,
  createRadialGradient,
  createLineGradient,
  createPointGradient,
} from '@aspect-ui/canvas-core/primitives/fills';

// Linear gradient for a node
const gradient = createLinearGradient(
  {
    type: 'linear',
    x0: 0, y0: 0,
    x1: 1, y1: 1,
    stops: [
      { offset: 0, color: '#FF0000' },
      { offset: 1, color: '#0000FF' }
    ]
  },
  { x: 0, y: 0, width: 100, height: 100 }
);

graphics.fill({ fill: gradient });
```

#### Edge Gradients

```typescript
// Gradient along an edge from source to target
const edgeGradient = createLineGradient(
  sourceNode.x, sourceNode.y,
  targetNode.x, targetNode.y,
  [
    { offset: 0, color: '#FF0000' },
    { offset: 1, color: '#0000FF' }
  ]
);

graphics.stroke({ fill: edgeGradient, width: 2 });
```

#### Image Primitives

```typescript
import {
  loadImageTexture,
  applyImageFillPrimitive,
  calculateImageMatrix,
} from '@aspect-ui/canvas-core/primitives/fills';

// Pre-load texture
const texture = await loadImageTexture('https://example.com/image.png');

// Apply to node with cover fit mode
applyImageFillPrimitive(graphics, texture, bounds, {
  fit: 'cover',
  alignX: 0.5,
  alignY: 0.5,
  alpha: 1,
  tint: 0xFFFFFF
});
```

## Usage Examples

### Node with Linear Gradient

```typescript
import { createLinearGradient } from '@aspect-ui/canvas-core/primitives/fills';

class CustomNode extends NodeShapeBase {
  protected render(): void {
    const bounds = this.getShapeBounds();
    
    // Create gradient
    const gradient = createLinearGradient(
      {
        type: 'linear',
        x0: 0, y0: 0,
        x1: 1, y1: 1,
        stops: [
          { offset: 0, color: '#4CAF50' },
          { offset: 1, color: '#2196F3' }
        ]
      },
      bounds
    );
    
    // Draw shape with gradient
    this._graphics.circle(0, 0, this._data.size ?? 30);
    this._graphics.fill({ fill: gradient });
  }
}
```

### Edge with Gradient

```typescript
import { createLineGradient } from '@aspect-ui/canvas-core/primitives/fills';

class GradientEdge extends EdgeShapeBase {
  protected drawPath(source: Point, target: Point, style: EdgeStyle): void {
    // Create gradient along the edge
    const gradient = createLineGradient(
      source.x, source.y,
      target.x, target.y,
      [
        { offset: 0, color: style.stroke },
        { offset: 0.5, color: '#FFFFFF' },
        { offset: 1, color: style.stroke }
      ]
    );
    
    // Draw line with gradient
    this._graphics.moveTo(source.x, source.y);
    this._graphics.lineTo(target.x, target.y);
    this._graphics.stroke({ fill: gradient, width: style.strokeWidth });
  }
}
```

### Node with Image Fill

```typescript
import { loadImageTexture, applyImageFillPrimitive } from '@aspect-ui/canvas-core/primitives/fills';

class AvatarNode extends NodeShapeBase {
  private texture?: Texture;
  
  async loadAvatar(url: string) {
    this.texture = await loadImageTexture(url);
    this.update();
  }
  
  protected render(): void {
    const bounds = this.getShapeBounds();
    
    // Draw circle
    this._graphics.circle(0, 0, this._data.size ?? 30);
    
    if (this.texture) {
      // Apply image fill
      applyImageFillPrimitive(this._graphics, this.texture, bounds, {
        fit: 'cover',
        alignX: 0.5,
        alignY: 0.5
      });
    } else {
      // Fallback color
      this._graphics.fill({ color: '#cccccc' });
    }
  }
}
```

### Node with Radial Gradient

```typescript
import { createRadialGradient } from '@aspect-ui/canvas-core/primitives/fills';

class GlowNode extends NodeShapeBase {
  protected render(): void {
    const bounds = this.getShapeBounds();
    
    // Create radial gradient from center
    const gradient = createRadialGradient(
      {
        type: 'radial',
        x: 0.5, y: 0.5, radius: 0.5,
        stops: [
          { offset: 0, color: '#FFFFFF' },
          { offset: 0.7, color: '#4CAF50' },
          { offset: 1, color: '#1B5E20' }
        ]
      },
      bounds
    );
    
    // Draw shape with glow effect
    this._graphics.circle(0, 0, this._data.size ?? 30);
    this._graphics.fill({ fill: gradient });
  }
}
```

## API Reference

### Gradient Functions

#### `createLinearGradient(fill, bounds)`
Creates a linear gradient from relative coordinates (0-1) to absolute pixel coordinates.

**Parameters:**
- `fill: LinearGradientFill` - Gradient configuration
- `bounds: FillBounds` - Shape bounds for coordinate conversion

**Returns:** `FillGradient`

#### `createRadialGradient(fill, bounds)`
Creates a radial gradient from relative coordinates (0-1) to absolute pixel coordinates.

**Parameters:**
- `fill: RadialGradientFill` - Gradient configuration
- `bounds: FillBounds` - Shape bounds for coordinate conversion

**Returns:** `FillGradient`

#### `createLineGradient(startX, startY, endX, endY, stops)`
Creates a linear gradient along a line segment (useful for edges).

**Parameters:**
- `startX: number` - Start point X
- `startY: number` - Start point Y
- `endX: number` - End point X
- `endY: number` - End point Y
- `stops: ColorStop[]` - Color stops

**Returns:** `FillGradient`

#### `createPointGradient(centerX, centerY, radius, stops)`
Creates a radial gradient at a specific point.

**Parameters:**
- `centerX: number` - Center X coordinate
- `centerY: number` - Center Y coordinate
- `radius: number` - Gradient radius
- `stops: ColorStop[]` - Color stops

**Returns:** `FillGradient`

### Image Functions

#### `loadImageTexture(url)`
Loads an image texture from a URL.

**Parameters:**
- `url: string` - Image URL

**Returns:** `Promise<Texture>`

#### `applyImageFillPrimitive(graphics, texture, bounds, options)`
Applies an image fill to graphics with various fit modes.

**Parameters:**
- `graphics: Graphics` - PixiJS Graphics object
- `texture: Texture` - Pre-loaded texture
- `bounds: FillBounds` - Shape bounds
- `options: object` - Fill options
  - `fit?: 'fill' | 'contain' | 'cover' | 'none'` - Fit mode (default: 'cover')
  - `alignX?: number` - Horizontal alignment 0-1 (default: 0.5)
  - `alignY?: number` - Vertical alignment 0-1 (default: 0.5)
  - `alpha?: number` - Alpha transparency (default: 1)
  - `tint?: number` - Color tint (default: 0xFFFFFF)

#### `calculateImageMatrix(texture, bounds, fit, alignX, alignY)`
Calculates image transformation matrix for different fit modes.

**Parameters:**
- `texture: Texture` - Image texture
- `bounds: FillBounds` - Target bounds
- `fit: string` - Fit mode
- `alignX: number` - Horizontal alignment
- `alignY: number` - Vertical alignment

**Returns:** `{ scaleX, scaleY, offsetX, offsetY }`

## Type Definitions

```typescript
interface ColorStop {
  offset: number;  // 0-1
  color: string | number;
}

interface FillBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface LinearGradientFill {
  type: 'linear';
  x0: number;  // 0-1 relative
  y0: number;  // 0-1 relative
  x1: number;  // 0-1 relative
  y1: number;  // 0-1 relative
  stops: ColorStop[];
  alpha?: number;
}

interface RadialGradientFill {
  type: 'radial';
  x: number;     // 0-1 relative
  y: number;     // 0-1 relative
  radius: number; // 0-1 relative
  stops: ColorStop[];
  alpha?: number;
}
```

## Notes for Edges

- Edges typically use **stroke** gradients, not fill gradients
- Use `createLineGradient()` for gradients along edges
- Images and patterns are not commonly used for edges
- Focus on linear gradients for directional flow visualization

## Performance Tips

- Pre-load textures before rendering
- Cache FillGradient objects when possible
- Use solid colors for static nodes
- Reserve gradients/images for important visual elements
