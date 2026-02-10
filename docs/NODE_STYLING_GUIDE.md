# Node Styling Guide

This guide shows how to customize node styling in Invana Canvas, similar to   flexible styling approach.

## Overview

Invana Canvas provides three levels of styling control:

1. **Individual Node Styling** - Style each node separately (highest priority)
2. **Global Styles** - Apply styles to all nodes with state-based overrides
3. **Conditional Styling** - Dynamically style nodes based on properties (id, shape, type, etc.)

## 1. Individual Node Styling

Style each node individually using the `style` property. This is similar to   per-node styling approach.

```typescript
const nodes: CanvasNodeData = [
  { 
    id: 'n1', 
    x: 100, 
    y: 100, 
    shape: 'circle', 
    size: 40, 
    label: 'Blue Node',
    style: { 
      fill: '#4a90d9',           // Fill color
      stroke: '#2d5f8a',         // Border color
      strokeWidth: 3,            // Border width
      fillAlpha: 0.9,            // Fill opacity
      strokeStyle: 'solid'       // 'solid' | 'dashed' | 'dotted'
    }
  },
  { 
    id: 'n2', 
    x: 300, 
    y: 100, 
    shape: 'rect', 
    width: 80, 
    height: 60, 
    label: 'Red Node',
    style: { 
      fill: '#ff6b6b',
      stroke: '#cc5555',
      strokeWidth: 2,
      strokeStyle: 'dashed',     // Dashed border
      halo: true,                // Enable halo effect
      haloStroke: '#ff6b6b',
      haloStrokeWidth: 15
    }
  }
];

const canvas = new Canvas({
  container,
  data: { nodes, edges: [] }
});
```

### Available Style Properties

```typescript
interface NodeStyle {
  // Fill
  fill?: string | number;          // Color: '#4a90d9' or 0x4a90d9
  fillAlpha?: number;              // 0-1 opacity
  
  // Stroke/Border
  stroke?: string | number;        // Border color
  strokeWidth?: number;            // Border width in pixels
  strokeAlpha?: number;            // Border opacity 0-1
  strokeStyle?: 'solid' | 'dashed' | 'dotted';
  strokeDashPattern?: number[];    // Custom dash: [10, 5]
  strokeAlignment?: number;        // 0=outside, 0.5=center, 1=inside
  strokeCap?: 'butt' | 'round' | 'square';
  
  // Halo Effect
  halo?: boolean;                  // Enable halo glow
  haloStroke?: string | number;    // Halo color
  haloStrokeWidth?: number;        // Halo thickness
  haloStrokeOpacity?: number;      // Halo opacity
  
  // States (optional per-node states)
  states?: {
    selected?: Partial<NodeStyle>;
    active?: Partial<NodeStyle>;
    highlighted?: Partial<NodeStyle>;
    [customState: string]: Partial<NodeStyle>;
  }
}
```

## 2. Conditional Styling Based on Node Properties

Dynamically style nodes based on their properties (id, shape, type, etc.):

```typescript
// Helper function to determine style based on node properties
const getNodeStyle = (id: string, shape: string, type?: string) => {
  // Style by ID pattern
  if (id.startsWith('user-')) {
    return { fill: '#1890ff', stroke: '#0050b3', strokeWidth: 3 };
  }
  
  // Style by type
  if (type === 'server') {
    return { fill: '#52c41a', stroke: '#389e0d', strokeWidth: 3 };
  }
  if (type === 'database') {
    return { fill: '#ff4d4f', stroke: '#cf1322', strokeWidth: 3 };
  }
  
  // Style by shape
  switch (shape) {
    case 'circle':
      return { fill: '#9254de', stroke: '#722ed1', strokeWidth: 2 };
    case 'rect':
      return { fill: '#fa8c16', stroke: '#d46b08', strokeWidth: 2 };
    default:
      return { fill: '#d9d9d9', stroke: '#8c8c8c', strokeWidth: 2 };
  }
};

// Apply conditional styling
const nodes: CanvasNodeData = [
  { 
    id: 'user-1', 
    x: 100, 
    y: 100, 
    shape: 'circle',
    type: 'user',
    style: getNodeStyle('user-1', 'circle', 'user')
  },
  { 
    id: 'server-1', 
    x: 300, 
    y: 100, 
    shape: 'rect',
    type: 'server',
    style: getNodeStyle('server-1', 'rect', 'server')
  }
];
```

### Approach B: Function-Based Styling While Iterating (. Style)

This approach is most similar to ., where you apply styles using inline functions/conditions while mapping through your data:

```typescript
// Raw data (from API, database, etc.)
const rawData = [
  { id: 'user-1', name: 'Alice', type: 'user', importance: 0.9 },
  { id: 'server-1', name: 'API Server', type: 'server', importance: 0.95 },
  { id: 'db-1', name: 'Database', type: 'database', importance: 0.85 },
];

// Apply styles conditionally while mapping  
const nodes: CanvasNodeData = rawData.map(d => ({
  id: d.id,
  x: Math.random() * 400,
  y: Math.random() * 400,
  label: d.name,
  
  // Conditional shape based on data
  shape: d.type === 'database' ? 'rect' : 
         d.type === 'server' ? 'hexagon' : 'circle',
  
  // Size based on importance
  size: 30 + (d.importance * 20),
  
  // Inline conditional styling 
  style: {
    // Fill color: (d) => d.type === 'user' ? 'blue' : 'red'
    fill: d.type === 'user' ? '#1890ff' :
          d.type === 'server' ? '#52c41a' :
          d.type === 'database' ? '#ff4d4f' : '#d9d9d9',
    
    // Stroke color (darker version)
    stroke: d.type === 'user' ? '#0050b3' :
            d.type === 'server' ? '#389e0d' :
            d.type === 'database' ? '#cf1322' : '#8c8c8c',
    
    // Conditional stroke width
    strokeWidth: d.importance > 0.8 ? 4 : 2,
    
    // Enable halo for important nodes
    halo: d.importance > 0.8,
    haloStroke: d.type === 'user' ? '#1890ff' : '#52c41a',
    
    // Conditional border style
    strokeStyle: d.id.includes('cache') ? 'dashed' : 'solid',
  },
  
  // Conditional badges: (d) => d.importance > 0.85 ? [...] : []
  badges: d.importance > 0.85 ? [
    { text: '!', placement: 'right-top' }
  ] : undefined,
}));

const canvas = new Canvas({
  container,
  data: { nodes, edges: [] }
});
```

### Approach C: Complex Logic with Multiple Helper Functions

For complex scenarios, extract your logic into multiple helper functions:

```typescript
// Helper functions for different styling aspects
const getStatusColor = (status: string) => ({
  online: { fill: '#52c41a', stroke: '#389e0d' },
  warning: { fill: '#faad14', stroke: '#d48806' },
  error: { fill: '#ff4d4f', stroke: '#cf1322' },
  offline: { fill: '#d9d9d9', stroke: '#8c8c8c' },
}[status] || { fill: '#d9d9d9', stroke: '#8c8c8c' });

const getCpuStyle = (cpu: number) => {
  if (cpu > 90) return { strokeStyle: 'dotted' as const, strokeWidth: 4 };
  if (cpu > 70) return { strokeStyle: 'dashed' as const, strokeWidth: 3 };
  return { strokeStyle: 'solid' as const, strokeWidth: 2 };
};

const shouldShowHalo = (service: { status: string; cpu: number; memory: number }) => 
  service.status === 'error' || service.cpu > 80 || service.memory > 80;

const getBadges = (service: { cpu: number; memory: number; status: string }) => {
  const badges: Array<{ text: string; placement: string }> = [];
  if (service.cpu > 80) badges.push({ text: 'CPU', placement: 'left-top' });
  if (service.memory > 80) badges.push({ text: 'MEM', placement: 'right-top' });
  if (service.status === 'error') badges.push({ text: '⚠', placement: 'right' });
  return badges.length > 0 ? badges : undefined;
};

// Apply all logic while mapping
const nodes = services.map(service => {
  const statusColors = getStatusColor(service.status);
  const cpuStyles = getCpuStyle(service.cpu);
  
  return {
    id: service.id,
    x: service.x,
    y: service.y,
    shape: 'rect',
    label: service.name,
    style: {
      ...statusColors,      // Spread status-based colors
      ...cpuStyles,         // Spread CPU-based styles
      fillAlpha: service.status === 'offline' ? 0.4 : 0.95,
      halo: shouldShowHalo(service),
      haloStroke: statusColors.fill,
    },
    badges: getBadges(service),
  };
});
```

## 3. Global Styles with State-Based Overrides

Define global styles in `CanvasOptions` that apply to all nodes, with state-specific overrides:

```typescript
const options: CanvasOptions = {
  container,
  data: { nodes, edges: [] },
  
  // Global styles applied to ALL nodes
  styles: {
    node: {
      // Base/default appearance
      fill: 0x27c554,
      stroke: '#525252',
      strokeWidth: 3,
      fillAlpha: 1,
      
      // State-based styling (applied when states are active)
      states: {
        selected: {
          fill: 0x1890ff,        // Blue when selected
          stroke: '#0050b3',
          strokeWidth: 5,
          halo: true,
          haloStroke: '#1890ff',
        },
        active: {
          strokeWidth: 4,        // Thicker border when active/hovered
          strokeAlpha: 0.8,
        },
        highlighted: {
          fill: 0xffa940,        // Orange when highlighted
          stroke: '#d46b08',
        },
        // Custom states
        loading: {
          fill: 0x8c8c8c,        // Gray when loading
          fillAlpha: 0.6
        },
        error: {
          fill: 0xff4d4f,        // Red when error
          stroke: '#cf1322',
          strokeWidth: 3,
        }
      }
    }
  }
};

const canvas = new Canvas(options);
await canvas.init();

// Control states programmatically
const node = canvas.getNode('n1');
node.setState('selected', true);     // Activate selected state
node.setState('loading', true);       // Activate custom loading state
node.setState('selected', false);     // Deactivate selected state
```

### Built-in States

- `default` - Base appearance
- `selected` - When node is selected
- `active` - When node is hovered/active
- `highlighted` - When node is highlighted
- `disabled` - When node is disabled
- `muted` - When node is de-emphasized
- `dragging` - When node is being dragged

You can also define **custom states** (e.g., `loading`, `error`, `warning`) as shown above.

## 4. Mixed Approach - Global + Individual Overrides

Combine global styling with per-node customization for maximum flexibility:

```typescript
const nodes: CanvasNodeData = [
  { 
    id: 'n1', 
    x: 100, 
    y: 100, 
    shape: 'circle',
    label: 'Uses Global Style'
    // No style property - uses global styles
  },
  { 
    id: 'n2', 
    x: 300, 
    y: 100, 
    shape: 'rect',
    label: 'Custom Fill Only',
    style: { 
      fill: '#ff6b6b'  // Override only the fill, inherit rest from global
    }
  },
  { 
    id: 'n3', 
    x: 500, 
    y: 100, 
    shape: 'hexagon',
    label: 'Fully Custom',
    style: { 
      fill: '#9b59b6',
      stroke: '#7d478f',
      strokeWidth: 4,
      halo: true,
      // Override everything
    }
  }
];

const options: CanvasOptions = {
  container,
  data: { nodes, edges: [] },
  styles: {
    node: {
      fill: 0x1890ff,      // Global default
      stroke: '#0050b3',
      strokeWidth: 2,
      states: {
        selected: {
          strokeWidth: 5,
          halo: true
        }
      }
    }
  }
};
```

## Priority Order

Styles are applied in this priority order (highest to lowest):

1. **Individual node `style` property** (highest priority)
2. **Global `styles.node` in CanvasOptions**
3. **Built-in defaults** (lowest priority)

Individual node styles override global styles, which override defaults.

## Common Patterns

### Category-Based Coloring

```typescript
const categoryColors = {
  person: { fill: '#1890ff', stroke: '#0050b3' },
  place: { fill: '#52c41a', stroke: '#389e0d' },
  thing: { fill: '#fa8c16', stroke: '#d46b08' }
};

const nodes = data.map(item => ({
  id: item.id,
  x: item.x,
  y: item.y,
  shape: 'circle',
  label: item.name,
  style: categoryColors[item.category]
}));
```

### Importance-Based Sizing & Styling

```typescript
const getStyleByImportance = (importance: number) => {
  if (importance > 0.8) {
    return { fill: '#ff4d4f', strokeWidth: 4, halo: true };
  } else if (importance > 0.5) {
    return { fill: '#fa8c16', strokeWidth: 3 };
  } else {
    return { fill: '#d9d9d9', strokeWidth: 2 };
  }
};

const nodes = data.map(item => ({
  id: item.id,
  x: item.x,
  y: item.y,
  shape: 'circle',
  size: 30 + item.importance * 20,  // Size based on importance
  label: item.name,
  style: getStyleByImportance(item.importance)
}));
```

### State Indicators

```typescript
const nodes: CanvasNodeData = [
  {
    id: 'server-1',
    x: 100,
    y: 100,
    shape: 'rect',
    label: 'Server 1',
    style: {
      fill: server.isOnline ? '#52c41a' : '#ff4d4f',  // Green if online, red if offline
      stroke: server.isOnline ? '#389e0d' : '#cf1322',
      strokeWidth: server.hasWarning ? 4 : 2  // Thicker border if warning
    }
  }
];
```

## Advanced: Custom Fill Patterns

```typescript
const node = {
  id: 'n1',
  x: 100,
  y: 100,
  shape: 'circle',
  style: {
    // Gradient fill
    fill: {
      type: 'gradient',
      gradient: {
        type: 'linear',
        stops: [
          { offset: 0, color: '#1890ff' },
          { offset: 1, color: '#096dd9' }
        ]
      }
    },
    stroke: '#0050b3',
    strokeWidth: 2
  }
};
```

## Tips

1. **Performance**: For large graphs (1000+ nodes), prefer global styles over individual styling
2. **Consistency**: Use global styles for base appearance, individual styles for exceptions
3. **States**: Use state-based styling for interactive feedback (hover, select, etc.)
4. **Colors**: Use hex strings for colors with alpha (`#4a90d9`), or hex numbers for solid colors (`0x4a90d9`)
5. **Conditional Logic**: Extract styling logic into helper functions for maintainability

## See Also

- [State Management Documentation](STATE_STYLING_ARCHITECTURE.md)
- [Centralized Defaults](CENTRALIZED_DEFAULTS_IMPLEMENTATION.md)
- [Examples in Storybook](../apps/storybook/stories/canvas/styling/nodes/)
