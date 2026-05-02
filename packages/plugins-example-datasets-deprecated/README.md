# @invana/example-datasets

Example graph datasets for @invana/canvas-deprecated visualizations.

## Features

- 📊 **Les Misérables** - Character co-occurrence network (77 nodes, 254 edges)
- 🎨 Ready-to-use with canvas-core GraphDataPlugin
- 📝 TypeScript support with full type definitions

## Installation

```bash
pnpm add @invana/example-datasets
```

## Usage

### Les Misérables Dataset

```typescript
import { vec2 } from '@invana/canvas-deprecated-utils';

const a = vec2.create(10, 20);
const b = vec2.create(30, 40);

const sum = vec2.add(a, b);           // { x: 40, y: 60 }
const distance = vec2.distance(a, b); // 28.28...
const normalized = vec2.normalize(a); // unit vector
const midpoint = vec2.midpoint(a, b); // { x: 20, y: 30 }
```

### Math Utilities

```typescript
import { math } from '@invana/canvas-deprecated-utils';

math.clamp(15, 0, 10);         // 10
math.lerp(0, 100, 0.5);        // 50
math.degToRad(180);            // 3.14159...
math.smoothStep(0, 1, 0.5);    // 0.5 (smoothed)
math.random(10, 20);           // random between 10-20
```

### Color Utilities

```typescript
import { color } from '@invana/canvas-deprecated-utils';

color.hexToRgb('#ff0000');     // { r: 255, g: 0, b: 0 }
color.rgbToHex(255, 0, 0);     // '#ff0000'
color.lighten('#333333', 20);  // lighter color
color.darken('#cccccc', 20);   // darker color
color.mix('#ff0000', '#0000ff', 0.5); // purple
color.contrastText('#000000'); // '#ffffff'
color.fromString('user-type'); // consistent color from string
color.palette('#ff0000', 5);   // 5 analogous colors
```

## API

### vec2

- `create(x, y)` - Create vector
- `add(a, b)` - Add vectors
- `subtract(a, b)` - Subtract vectors
- `multiply(v, scalar)` - Scale vector
- `dot(a, b)` - Dot product
- `cross(a, b)` - Cross product (2D returns scalar)
- `length(v)` - Vector magnitude
- `normalize(v)` - Unit vector
- `distance(a, b)` - Distance between points
- `angle(v)` - Angle of vector
- `rotate(v, angle)` - Rotate vector
- `lerp(a, b, t)` - Interpolate vectors
- `perpendicular(v)` - Perpendicular vector

### math

- `clamp(value, min, max)` - Clamp value
- `lerp(a, b, t)` - Linear interpolation
- `inverseLerp(a, b, value)` - Inverse lerp
- `remap(value, inMin, inMax, outMin, outMax)` - Remap value
- `degToRad(degrees)` - Degrees to radians
- `radToDeg(radians)` - Radians to degrees
- `smoothStep(edge0, edge1, x)` - Smooth step
- `random(min, max)` - Random float
- `randomInt(min, max)` - Random integer

### color

- `hexToRgb(hex)` - Parse hex to RGB
- `rgbToHex(r, g, b)` - RGB to hex
- `rgbToHsl(r, g, b)` - RGB to HSL
- `hslToRgb(h, s, l)` - HSL to RGB
- `lighten(hex, amount)` - Lighten color
- `darken(hex, amount)` - Darken color
- `mix(hex1, hex2, amount)` - Mix colors
- `luminance(hex)` - Get luminance (0-1)
- `isDark(hex)` - Check if dark
- `contrastText(hex)` - Get contrasting text color
- `contrastRatio(hex1, hex2)` - WCAG contrast ratio
- `toRgba(hex, alpha)` - To RGBA string
- `fromString(str)` - Generate color from string
- `palette(baseHex, count)` - Generate palette

## License

MIT
