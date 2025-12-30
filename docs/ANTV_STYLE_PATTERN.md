# AntV G6 Style Pattern in Invana Canvas

This document shows how to achieve AntV G6's function-based styling pattern in Invana Canvas.

## AntV G6 Pattern

In AntV G6, you can use functions in the style configuration:

```typescript
// AntV G6 style
const graph = new Graph({
  container: 'container',
  data,
  node: {
    type: 'star',
    style: {
      size: 40,
      labelText: (d) => d.id,
      iconFontFamily: 'iconfont',
      iconText: '\ue602',
      halo: (d) => (d.id === 'halo' ? true : false),
      badges: (d) =>
        d.id === 'badges'
          ? [
              { text: 'A', placement: 'right-top' },
              { text: 'Important', placement: 'right' }
            ]
          : [],
      ports: (d) =>
        d.id === 'ports'
          ? [{ placement: 'left' }, { placement: 'right' }]
          : []
    }
  }
});
```

## Invana Canvas Equivalent

In Invana Canvas, achieve the same result by applying conditional logic while mapping your data:

```typescript
// Invana Canvas - function-based styling pattern
const nodes: CanvasNodeData = rawData.map(d => ({
  id: d.id,
  x: d.x,
  y: d.y,
  label: d.id,  // labelText: (d) => d.id
  
  // Conditional values based on data
  badges: d.id === 'badges' ? [
    { text: 'A', placement: 'right-top' },
    { text: 'Important', placement: 'right' }
  ] : undefined,
  
  style: {
    size: 40,
    // halo: (d) => d.id === 'halo' ? true : false
    halo: d.id === 'halo',
  }
}));

const canvas = new Canvas({
  container,
  data: { nodes, edges: [] }
});
```

## Complete Real-World Example

### Scenario: Service Dashboard with Conditional Styling

```typescript
// Raw data from your API/database
const services = [
  { id: 'auth', name: 'Auth', type: 'service', status: 'online', cpu: 45, memory: 60 },
  { id: 'api', name: 'API', type: 'service', status: 'online', cpu: 85, memory: 75 },
  { id: 'db', name: 'DB', type: 'database', status: 'warning', cpu: 70, memory: 88 },
  { id: 'cache', name: 'Cache', type: 'cache', status: 'online', cpu: 30, memory: 40 },
];

// Map data with conditional styling (AntV-style)
const nodes: CanvasNodeData = services.map(d => ({
  id: d.id,
  x: Math.random() * 500,
  y: Math.random() * 500,
  label: d.name,
  
  // Conditional shape: (d) => d.type === 'database' ? 'rect' : 'circle'
  shape: d.type === 'database' ? 'rect' : 
         d.type === 'cache' ? 'diamond' : 'circle',
  
  // Conditional size
  size: d.type === 'database' ? 60 : 40,
  
  style: {
    // fill: (d) => d.status === 'online' ? 'green' : 'red'
    fill: d.status === 'online' ? '#52c41a' :
          d.status === 'warning' ? '#faad14' :
          d.status === 'error' ? '#ff4d4f' : '#d9d9d9',
    
    stroke: d.status === 'online' ? '#389e0d' :
            d.status === 'warning' ? '#d48806' :
            d.status === 'error' ? '#cf1322' : '#8c8c8c',
    
    // strokeWidth: (d) => d.cpu > 70 ? 4 : 2
    strokeWidth: d.cpu > 70 ? 4 : 2,
    
    // strokeStyle: (d) => d.cpu > 90 ? 'dotted' : 'solid'
    strokeStyle: d.cpu > 90 ? 'dotted' : 
                 d.cpu > 70 ? 'dashed' : 'solid',
    
    // halo: (d) => d.status === 'error' || d.cpu > 80
    halo: d.status === 'error' || d.cpu > 80,
    haloStroke: d.status === 'error' ? '#ff4d4f' : '#faad14',
    
    // fillAlpha: (d) => d.status === 'offline' ? 0.3 : 1
    fillAlpha: d.status === 'offline' ? 0.3 : 1,
  },
  
  // badges: (d) => d.cpu > 80 ? [{ text: 'CPU' }] : []
  badges: (() => {
    const badges: Array<{ text: string; placement: string }> = [];
    if (d.cpu > 80) badges.push({ text: 'CPU', placement: 'left-top' });
    if (d.memory > 80) badges.push({ text: 'MEM', placement: 'right-top' });
    if (d.status === 'error') badges.push({ text: '⚠', placement: 'right' });
    return badges.length > 0 ? badges : undefined;
  })(),
}));

const canvas = new Canvas({
  container,
  data: { nodes, edges: [] }
});
```

## Pattern Comparison Table

| AntV G6 | Invana Canvas |
|---------|---------------|
| `style: { fill: (d) => d.color }` | `style: { fill: d.color }` (in map) |
| `style: { size: (d) => d.size }` | `size: d.size` (in map) |
| `style: { halo: (d) => d.important }` | `style: { halo: d.important }` (in map) |
| `style: { badges: (d) => [...] }` | `badges: d.condition ? [...] : undefined` |

## Key Principles

1. **Map Your Data**: Use `.map()` to transform raw data into node configurations
2. **Inline Conditionals**: Use ternary operators or logical expressions for simple conditions
3. **Helper Functions**: Extract complex logic into separate functions
4. **Spread Operators**: Combine multiple style objects using spread syntax

## Advanced Patterns

### Pattern 1: Category-Based Styling

```typescript
const categoryStyles = {
  user: { fill: '#1890ff', stroke: '#0050b3', shape: 'circle' as const },
  server: { fill: '#52c41a', stroke: '#389e0d', shape: 'hexagon' as const },
  database: { fill: '#ff4d4f', stroke: '#cf1322', shape: 'rect' as const },
};

const nodes = data.map(d => ({
  id: d.id,
  x: d.x,
  y: d.y,
  label: d.name,
  shape: categoryStyles[d.category]?.shape || 'circle',
  style: categoryStyles[d.category] || { fill: '#d9d9d9', stroke: '#8c8c8c' },
}));
```

### Pattern 2: Multi-Condition Styling

```typescript
const getNodeColor = (node: RawNode) => {
  if (node.status === 'critical') return { fill: '#ff4d4f', stroke: '#cf1322' };
  if (node.cpu > 90 || node.memory > 90) return { fill: '#fa8c16', stroke: '#d46b08' };
  if (node.status === 'warning') return { fill: '#faad14', stroke: '#d48806' };
  return { fill: '#52c41a', stroke: '#389e0d' };
};

const nodes = data.map(d => ({
  id: d.id,
  x: d.x,
  y: d.y,
  label: d.name,
  style: {
    ...getNodeColor(d),
    strokeWidth: d.important ? 4 : 2,
    halo: d.alert,
  },
}));
```

### Pattern 3: Computed Properties

```typescript
const nodes = data.map(d => {
  // Compute derived values
  const isHighPriority = d.priority > 0.8;
  const hasWarning = d.cpu > 70 || d.memory > 70;
  const isCritical = d.status === 'error' || d.cpu > 90;
  
  return {
    id: d.id,
    x: d.x,
    y: d.y,
    label: d.name,
    size: 30 + (d.priority * 30),  // Size based on priority
    style: {
      fill: isCritical ? '#ff4d4f' : 
            hasWarning ? '#faad14' : '#52c41a',
      stroke: isCritical ? '#cf1322' : 
              hasWarning ? '#d48806' : '#389e0d',
      strokeWidth: isHighPriority ? 4 : 2,
      strokeStyle: isCritical ? 'dotted' : 
                   hasWarning ? 'dashed' : 'solid',
      halo: isHighPriority || isCritical,
    },
    badges: (() => {
      const badges = [];
      if (isHighPriority) badges.push({ text: 'P1', placement: 'left-top' });
      if (hasWarning) badges.push({ text: '⚠', placement: 'right-top' });
      return badges.length > 0 ? badges : undefined;
    })(),
  };
});
```

## Tips for AntV Developers

1. **Think "Map, Don't Configure"**: Instead of passing functions to config, map your data first
2. **Use TypeScript**: Get full autocomplete for all style properties
3. **Extract Complex Logic**: Use helper functions for readability
4. **Leverage Spread**: Combine multiple style objects easily
5. **IIFE for Complex Calculations**: Use `(() => {...})()` for complex badge/property logic

## Performance Notes

- ✅ **Efficient**: Styling is computed once during data mapping
- ✅ **Type-Safe**: Full TypeScript support with proper types
- ✅ **Flexible**: Supports any conditional logic you need
- ✅ **Maintainable**: Easy to test and refactor helper functions

## See Also

- [NODE_STYLING_GUIDE.md](NODE_STYLING_GUIDE.md) - Complete styling reference
- [Storybook Examples](../apps/storybook/stories/canvas/styling/nodes/) - Live examples
