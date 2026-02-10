# State & Styling Architecture Analysis

## Current Architecture (Invana Canvas)

### Overview
Our current approach uses **direct state properties with style overrides**:

```typescript
interface NodeStyle {
  // Base styles
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  
  // State-specific overrides
  selectedFill?: string;
  selectedStroke?: string;
  selectedStrokeWidth?: number;
  hoverFill?: string;
  hoverStroke?: string;
}

// Usage
node._selected = true;  // Boolean flag
node._hovered = true;   // Boolean flag

// Style resolution
getActiveStyle() {
  if (this._selected) {
    fill = base.selectedFill ?? fill;
    stroke = base.selectedStroke ?? stroke;
  } else if (this._hovered) {
    fill = base.hoverFill ?? fill;
    stroke = base.hoverStroke ?? stroke;
  }
}
```

### Strengths
✅ **Simple and Direct**
- Easy to understand and implement
- Minimal abstraction - direct property access
- Type-safe with TypeScript interfaces

✅ **Performance**
- No extra lookups or map operations
- Direct property access is fast
- Style merging happens only when needed

✅ **Compile-time Safety**
- TypeScript catches missing properties
- Autocomplete works perfectly
- Clear API surface

✅ **Predictable**
- Clear precedence: selected > hovered > base
- No hidden behavior or magic

### Weaknesses
❌ **Limited Extensibility**
- Hard-coded states (selected, hovered)
- Adding new states requires code changes
- Can't dynamically add custom states

❌ **Style Duplication**
- Each state needs explicit style properties
- No style inheritance or composition
- Verbose for complex styling

❌ **State Priority Hard-coded**
- Priority is if-else logic
- Can't change precedence dynamically
- Multiple simultaneous states not well handled

❌ **Per-Property Overrides**
- Need to specify each property separately
- Can't apply a "style set" to a state
- Becomes verbose with many properties

---

## Architecture

### Overview

**state-based styling system with style mappings**:

```typescript
// Define styles per state
graph.node({
  style: {
    // Base state (default)
    fill: '#1890ff',
    stroke: '#ffffff',
    lineWidth: 2,
  },
  state: {
    // State name -> style object
    selected: {
      fill: '#ff4d4f',
      stroke: '#ffffff',
      lineWidth: 3,
      shadowColor: '#ff4d4f',
      shadowBlur: 10,
    },
    hover: {
      fill: '#40a9ff',
      opacity: 0.8,
    },
    inactive: {
      opacity: 0.3,
    },
    // Custom states
    highlighted: {
      stroke: '#52c41a',
      lineWidth: 4,
    },
    disabled: {
      fill: '#d9d9d9',
      opacity: 0.5,
    },
  },
});

// Apply states dynamically
graph.setItemState(node, 'selected', true);
graph.setItemState(node, 'highlighted', true);
graph.clearItemStates(node, ['selected', 'highlighted']);
```

### Strengths
✅ **Highly Extensible**
- Define unlimited custom states
- Add states without code changes
- Perfect for domain-specific states (loading, error, etc.)

✅ **Style Composition**
- Multiple states can be active simultaneously
- Styles are merged in priority order
- Clean separation of concerns

✅ **Declarative**
- All states defined upfront
- Easy to understand state capabilities
- Self-documenting API

✅ **Flexible Priority**
- Can configure state precedence
- Dynamic priority based on context
- Better handling of complex scenarios

✅ **Reusable State Definitions**
- Define once, apply anywhere
- Share state configs across elements
- Theme-friendly

### Weaknesses
❌ **More Complex**
- Extra abstraction layer
- State management overhead
- Steeper learning curve

❌ **Runtime Lookups**
- Map/object lookups for state styles
- Potential performance overhead
- More memory usage

❌ **Less Type-Safe**
- Custom state names are strings
- Can't catch typos at compile time
- Requires runtime validation

❌ **Debugging Complexity**
- Harder to trace which style applies
- State merge order can be confusing
- More "magic" behavior

---

## Risk Mitigation Strategies

### 1. Minimize Complexity

**Strategy: Keep API surface minimal and progressive**

```typescript
// Simple cases remain simple (no learning curve)
node.selected = true;
node.hovered = true;

// Advanced features are opt-in (pay for what you use)
node.setState('loading', true); // Only when needed
```

**Implementation:**
- Default behavior requires zero config
- Built-in states use simple boolean properties
- Custom states are optional feature
- Document common patterns clearly

**Metrics:**
- Most users never need custom states
- Advanced users can learn incrementally
- API remains discoverable through TypeScript autocomplete

### 2. Optimize Performance

**Strategy: Cache computed styles and minimize lookups**

```typescript
class NodeShapeBase {
  private _activeStates = new Set<string>(['default']);
  private _cachedStyle: ShapeStyle | null = null;
  private _styleDirty = true;
  
  protected getActiveStyle(): ShapeStyle {
    // Early return for simple cases (no custom states)
    if (this._activeStates.size === 1 && this._activeStates.has('default')) {
      return this._nodeStyle; // Direct access, zero overhead
    }
    
    // Cache computed style
    if (!this._styleDirty && this._cachedStyle) {
      return this._cachedStyle;
    }
    
    // Compute only when needed
    const result = this.computeActiveStyle();
    this._cachedStyle = result;
    this._styleDirty = false;
    return result;
  }
  
  setState(name: string, active: boolean): void {
    const changed = active 
      ? !this._activeStates.has(name)
      : this._activeStates.has(name);
    
    if (!changed) return; // Skip if no change
    
    if (active) this._activeStates.add(name);
    else this._activeStates.delete(name);
    
    this._styleDirty = true; // Invalidate cache
    this.markDirty();
    this.update();
  }
  
  private computeActiveStyle(): ShapeStyle {
    // Optimized: Use array instead of Set for iteration (faster)
    // Optimized: Pre-allocate result object
    // Optimized: Batch property assignments
    // ... implementation
  }
}
```

**Optimizations:**
- ✅ Style caching (compute once, reuse)
- ✅ Early returns for common cases
- ✅ Change detection (skip updates if unchanged)
- ✅ Use Set for O(1) lookups
- ✅ Batch property assignments
- ✅ Lazy computation

**Benchmarks to target:**
- Simple case (no custom states): < 1% overhead
- Complex case (3-5 states): < 5% overhead
- Memory per node: < 200 bytes extra

### 3. Improve Type Safety

**Strategy: Use TypeScript features for better DX**

```typescript
// Approach A: Predefined state constants (recommended)
export const NodeStates = {
  SELECTED: 'selected',
  HOVERED: 'hovered',
  LOADING: 'loading',
  ERROR: 'error',
  HIGHLIGHTED: 'highlighted',
  DISABLED: 'disabled',
  ACTIVE: 'active',
} as const;

export type NodeStateName = typeof NodeStates[keyof typeof NodeStates];

// Type-safe usage
node.setState(NodeStates.LOADING, true); // Autocomplete + type checking
node.setState('loadign', true); // ❌ TypeScript error!

// Approach B: Literal union types
type KnownStates = 'selected' | 'hovered' | 'loading' | 'error' | 'highlighted';

interface NodeStyle {
  states?: {
    [K in KnownStates]?: Partial<BaseNodeStyle>;
  } & {
    [key: string]: Partial<BaseNodeStyle>; // Allow custom
  };
}

// Approach C: Branded types for runtime validation
type StateName = string & { __brand: 'StateName' };

const createStateName = (name: string): StateName => {
  if (!name || !/^[a-z][a-zA-Z0-9]*$/.test(name)) {
    throw new Error(`Invalid state name: ${name}`);
  }
  return name as StateName;
};

// Approach D: Dev mode validation
class NodeShapeBase {
  private static knownStates = new Set([
    'selected', 'hovered', 'loading', 'error', 
    'highlighted', 'disabled', 'active'
  ]);
  
  setState(name: string, active: boolean): void {
    // Development warning for potential typos
    if (process.env.NODE_ENV === 'development') {
      if (!NodeShapeBase.knownStates.has(name) && !this._nodeStyle.states?.[name]) {
        console.warn(
          `Unknown state "${name}". Did you mean: ${this.suggestState(name)}?`
        );
      }
    }
    
    // ... actual implementation
  }
  
  private suggestState(name: string): string {
    // Simple Levenshtein distance for suggestions
    const similar = Array.from(NodeShapeBase.knownStates)
      .map(s => ({ state: s, distance: this.levenshtein(name, s) }))
      .filter(x => x.distance <= 2)
      .sort((a, b) => a.distance - b.distance);
    
    return similar.length > 0 ? similar[0].state : 'none';
  }
}
```

**Type Safety Measures:**
- ✅ Export state name constants
- ✅ Use TypeScript literal unions for known states
- ✅ Dev-mode validation with helpful warnings
- ✅ Typo detection with suggestions
- ✅ JSDoc with examples for IDE hints
- ✅ Runtime validation in debug builds

### 4. Enhance Debuggability

**Strategy: Add introspection and clear error messages**

```typescript
class NodeShapeBase {
  // Debug helper: Get style resolution trace
  getStyleTrace(): StyleTrace {
    const trace: StyleTrace = {
      base: { ...this._nodeStyle },
      activeStates: Array.from(this._activeStates),
      appliedStates: [],
      finalStyle: {},
    };
    
    const priority = this._nodeStyle.statePriority ?? ['default', 'hovered', 'selected'];
    
    for (const stateName of priority) {
      if (this._activeStates.has(stateName)) {
        const stateStyle = this.getStateStyle(stateName);
        if (stateStyle) {
          trace.appliedStates.push({
            name: stateName,
            priority: priority.indexOf(stateName),
            style: stateStyle,
            source: this.getStateSource(stateName),
          });
        }
      }
    }
    
    trace.finalStyle = this.getActiveStyle();
    return trace;
  }
  
  // Debug helper: Explain why a style property has a value
  explainProperty(prop: keyof ShapeStyle): PropertyExplanation {
    const trace = this.getStyleTrace();
    const value = trace.finalStyle[prop];
    
    // Find which state set this property
    for (let i = trace.appliedStates.length - 1; i >= 0; i--) {
      const state = trace.appliedStates[i];
      if (state.style[prop] !== undefined) {
        return {
          property: prop,
          value,
          source: state.name,
          priority: state.priority,
          overrides: trace.appliedStates
            .slice(0, i)
            .filter(s => s.style[prop] !== undefined)
            .map(s => ({ state: s.name, value: s.style[prop] })),
        };
      }
    }
    
    return { property: prop, value, source: 'base', priority: -1 };
  }
  
  // Enhanced logging
  setState(name: string, active: boolean): void {
    const changed = active 
      ? !this._activeStates.has(name)
      : this._activeStates.has(name);
    
    if (!changed) return;
    
    // Debug logging
    if (this._debug) {
      console.log(`[Node ${this.id}] State change:`, {
        state: name,
        action: active ? 'activate' : 'deactivate',
        before: Array.from(this._activeStates),
        after: active 
          ? [...this._activeStates, name]
          : Array.from(this._activeStates).filter(s => s !== name),
      });
    }
    
    if (active) this._activeStates.add(name);
    else this._activeStates.delete(name);
    
    this._styleDirty = true;
    this.markDirty();
    this.update();
  }
}

// Usage examples
if (process.env.NODE_ENV === 'development') {
  // Debug state application
  console.log(node.getStyleTrace());
  
  // Explain specific property
  console.log(node.explainProperty('fill'));
  // Output: { property: 'fill', value: '#ff0000', source: 'error', 
  //           priority: 3, overrides: [{ state: 'hovered', value: '#40a9ff' }] }
}

// Browser DevTools integration
if (typeof window !== 'undefined') {
  (window as any).__CANVAS_DEBUG__ = {
    getNode: (id: string) => canvas.getNode(id),
    traceStyle: (nodeId: string) => canvas.getNode(nodeId)?.getStyleTrace(),
    explain: (nodeId: string, prop: string) => 
      canvas.getNode(nodeId)?.explainProperty(prop),
  };
}
```

**Debugging Tools:**
- ✅ Style resolution trace
- ✅ Property source explanation
- ✅ State change logging (dev mode)
- ✅ Browser DevTools helpers
- ✅ Visual state inspector (Storybook addon)
- ✅ Performance profiler

### 5. Documentation & DX

**Strategy: Comprehensive docs and examples**

```typescript
/**
 * Set a custom state on the node.
 * 
 * States allow you to apply different styles based on the node's condition.
 * Multiple states can be active simultaneously and are merged in priority order.
 * 
 * @example
 * // Simple usage
 * node.setState('loading', true);
 * 
 * @example
 * // With custom state styles
 * node.style = {
 *   fill: '#1890ff',
 *   states: {
 *     loading: { opacity: 0.5 },
 *     error: { stroke: '#ff0000' },
 *   }
 * };
 * node.setState('loading', true);
 * 
 * @example
 * // Multiple states
 * node.setState('highlighted', true);
 * node.setState('loading', true);
 * // Both states are active and merged
 * 
 * @param name - State name (use NodeStates constants for type safety)
 * @param active - Whether to activate or deactivate the state
 * 
 * @see {@link NodeStates} for predefined state names
 * @see {@link getState} to check if a state is active
 * @see {@link clearStates} to remove states
 */
setState(name: string, active: boolean): void {
  // implementation
}
```

**Documentation Strategy:**
- ✅ JSDoc with examples on every method
- ✅ Storybook stories for each pattern
- ✅ Migration guide from current system
- ✅ Performance best practices guide
- ✅ Common patterns cookbook
- ✅ Interactive playground

### Summary: Risk vs Mitigation

| Risk | Severity | Mitigation | Residual Risk |
|------|----------|------------|---------------|
| **Complexity** | Medium | Progressive API, simple defaults | Low |
| **Performance** | Medium | Caching, early returns, optimization | Very Low |
| **Type Safety** | Medium | Constants, validation, dev warnings | Low |
| **Debugging** | Medium | Trace tools, introspection, logging | Low |

**Implementation Checklist:**
- [ ] Style caching system
- [ ] State name constants export
- [ ] Dev mode validation
- [ ] Debug trace methods
- [ ] Performance benchmarks
- [ ] Documentation with examples
- [ ] Storybook stories
- [ ] Migration guide

---

 
---

## Recommendations

### Option 1: Hybrid Approach (Recommended)
Combine the best of both worlds:

```typescript
interface NodeStyle {
  // Base styles
  fill?: string;
  stroke?: string;
  
  // Built-in state overrides (type-safe, fast)
  selected?: Partial<NodeStyle>;
  hovered?: Partial<NodeStyle>;
  
  // Custom state overrides (extensible)
  states?: {
    [stateName: string]: Partial<NodeStyle>;
  };
}

class Node {
  private _states = new Set<string>(['default']);
  
  // Type-safe built-in states
  set selected(value: boolean) {
    if (value) this._states.add('selected');
    else this._states.delete('selected');
    this.updateStyle();
  }
  
  // Extensible custom states
  setState(name: string, value: boolean) {
    if (value) this._states.add(name);
    else this._states.delete(name);
    this.updateStyle();
  }
  
  private updateStyle() {
    const base = this._nodeStyle;
    let style = { ...base };
    
    // Apply built-in states (type-safe)
    if (this._states.has('selected') && base.selected) {
      style = { ...style, ...base.selected };
    }
    if (this._states.has('hovered') && base.hovered) {
      style = { ...style, ...base.hovered };
    }
    
    // Apply custom states (extensible)
    if (base.states) {
      for (const state of this._states) {
        if (base.states[state]) {
          style = { ...style, ...base.states[state] };
        }
      }
    }
    
    return style;
  }
}

// Usage
node.style = {
  fill: '#1890ff',
  stroke: '#fff',
  // Type-safe built-in states
  selected: {
    fill: '#ff4d4f',
    strokeWidth: 3,
  },
  hovered: {
    fill: '#40a9ff',
  },
  // Custom states
  states: {
    loading: {
      opacity: 0.6,
      // Add animated border
    },
    error: {
      stroke: '#ff0000',
      strokeWidth: 2,
    },
    highlighted: {
      stroke: '#52c41a',
      strokeWidth: 4,
    },
  },
};

// Type-safe access
node.selected = true;
node.hovered = true;

// Custom states
node.setState('loading', true);
node.setState('error', false);
```

**Benefits:**
- ✅ Keep type-safe built-in states (selected, hovered)
- ✅ Add extensible custom states
- ✅ Maintain performance for common cases
- ✅ Better style composition
- ✅ Backward compatible

### Option 2: Full G6-Style (More Breaking)
Complete state-based system:

```typescript
class Node {
  private _states = new Map<string, boolean>();
  private _stateStyles: Record<string, Partial<NodeStyle>>;
  private _statePriority = ['default', 'hovered', 'selected', 'custom'];
  
  setState(name: string, value: boolean, priority?: number) {
    this._states.set(name, value);
    if (priority !== undefined) {
      this.setStatePriority(name, priority);
    }
    this.updateStyle();
  }
  
  getState(name: string): boolean {
    return this._states.get(name) ?? false;
  }
  
  clearStates(names?: string[]) {
    if (names) {
      names.forEach(n => this._states.delete(n));
    } else {
      this._states.clear();
    }
    this.updateStyle();
  }
}
```

**Benefits:**
- ✅ Maximum flexibility
- ✅ Clean architecture
- ❌ Breaking change
- ❌ More complex

### Option 3: Keep Current + Small Enhancements
Minimal changes to current system:

```typescript
interface NodeStyle {
  // Current properties
  fill?: string;
  selectedFill?: string;
  hoverFill?: string;
  
  // Add state composability
  additionalStates?: {
    [key: string]: Partial<NodeStyle>;
  };
}

// Keep current API
node.selected = true;
node.hovered = true;

// Add for custom needs
node.applyStateStyle('loading', true);
```

**Benefits:**
- ✅ Minimal breaking changes
- ✅ Adds extensibility
- ✅ Simple migration
- ❌ Less elegant

---

## Recommended Path Forward

**Phase 1: Enhance Current System (v1.x)**
1. Keep current selected/hovered as-is
2. Add `states` property for custom states
3. Add `setState()` method
4. Maintain backward compatibility

**Phase 2: Hybrid System (v2.0)**
1. Refactor internal state management
2. Make selected/hovered use state system internally
3. Add state priority configuration
4. Improve style composition

**Phase 3: Full State System (v3.0 - if needed)**
1. Deprecate per-property overrides
2. Full state-based styling
3. Advanced features (state transitions, animations)

---

## Implementation Priority

### High Priority (Should Do)
1. ✅ Add `states` property for custom states
2. ✅ Add `setState(name, value)` method
3. ✅ Add `getState(name)` method
4. ✅ Add `clearStates(names?)` method

### Medium Priority (Nice to Have)
1. State priority configuration
2. State style inheritance
3. Multiple state composition rules
4. State change events/hooks

### Low Priority (Future)
1. State transitions/animations
2. State groups/presets
3. State history/undo
4. Complex state logic

---

## Code Example: Hybrid Implementation

```typescript
// Type definitions
interface BaseNodeStyle {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  // ... other style properties
}

interface NodeStyle extends BaseNodeStyle {
  // Built-in states (type-safe, backward compatible)
  selected?: Partial<BaseNodeStyle>;
  hovered?: Partial<BaseNodeStyle>;
  
  // Custom states (extensible)
  states?: {
    [stateName: string]: Partial<BaseNodeStyle>;
  };
  
  // State configuration
  statePriority?: string[];
}

// Implementation
class NodeShapeBase {
  private _activeStates = new Set<string>(['default']);
  private _nodeStyle: NodeStyle = {};
  
  // Backward compatible properties
  get selected(): boolean {
    return this._activeStates.has('selected');
  }
  
  set selected(value: boolean) {
    this.setState('selected', value);
  }
  
  get hovered(): boolean {
    return this._activeStates.has('hovered');
  }
  
  set hovered(value: boolean) {
    this.setState('hovered', value);
  }
  
  // New extensible API
  setState(name: string, active: boolean): void {
    if (active) {
      this._activeStates.add(name);
    } else {
      this._activeStates.delete(name);
    }
    this.markDirty();
    this.update();
  }
  
  getState(name: string): boolean {
    return this._activeStates.has(name);
  }
  
  clearStates(names?: string[]): void {
    if (names) {
      names.forEach(n => this._activeStates.delete(n));
    } else {
      this._activeStates.clear();
      this._activeStates.add('default');
    }
    this.markDirty();
    this.update();
  }
  
  getActiveStates(): string[] {
    return Array.from(this._activeStates);
  }
  
  // Enhanced style resolution
  protected getActiveStyle(): ShapeStyle {
    const base = this._nodeStyle;
    const result: ShapeStyle = {
      fill: base.fill,
      stroke: base.stroke,
      strokeWidth: base.strokeWidth,
      opacity: base.opacity,
      // ... copy base properties
    };
    
    // Define priority order (default -> hovered -> selected -> custom)
    const priority = base.statePriority ?? ['default', 'hovered', 'selected'];
    
    // Apply states in priority order
    for (const stateName of priority) {
      if (!this._activeStates.has(stateName)) continue;
      
      let stateStyle: Partial<BaseNodeStyle> | undefined;
      
      // Check built-in states
      if (stateName === 'selected' && base.selected) {
        stateStyle = base.selected;
      } else if (stateName === 'hovered' && base.hovered) {
        stateStyle = base.hovered;
      } else if (base.states?.[stateName]) {
        stateStyle = base.states[stateName];
      }
      
      // Merge state styles
      if (stateStyle) {
        Object.assign(result, stateStyle);
      }
    }
    
    // Apply any custom states not in priority list
    if (base.states) {
      for (const stateName of this._activeStates) {
        if (!priority.includes(stateName) && base.states[stateName]) {
          Object.assign(result, base.states[stateName]);
        }
      }
    }
    
    return result;
  }
}

// Usage examples
const node = new NodeShapeBase({
  data: { id: 'n1', x: 0, y: 0, shape: 'circle', size: 50 },
  style: {
    // Base style
    fill: '#1890ff',
    stroke: '#ffffff',
    strokeWidth: 2,
    
    // Built-in states (backward compatible)
    selected: {
      stroke: '#ff4d4f',
      strokeWidth: 4,
    },
    hovered: {
      fill: '#40a9ff',
      opacity: 0.9,
    },
    
    // Custom states (new feature)
    states: {
      loading: {
        opacity: 0.5,
        // Could trigger spinner animation
      },
      error: {
        stroke: '#ff0000',
        strokeWidth: 3,
      },
      highlighted: {
        stroke: '#52c41a',
        strokeWidth: 5,
      },
      disabled: {
        opacity: 0.3,
        fill: '#d9d9d9',
      },
      active: {
        stroke: '#faad14',
        strokeWidth: 3,
      },
    },
    
    // Optional: custom priority
    statePriority: ['default', 'disabled', 'loading', 'hovered', 'selected', 'highlighted'],
  },
});

// Backward compatible API
node.selected = true;
node.hovered = true;

// New extensible API
node.setState('loading', true);
node.setState('error', false);
node.setState('highlighted', true);

// Query states
if (node.getState('loading')) {
  console.log('Node is loading');
}

// Clear specific states
node.clearStates(['loading', 'error']);

// Get all active states
console.log(node.getActiveStates()); // ['default', 'selected', 'highlighted']
```

---

## Conclusion

**Recommendation: Implement Hybrid Approach**

The hybrid approach gives us:
1. **Backward compatibility** - Existing code continues to work
2. **Type safety** - Built-in states remain type-safe
3. **Extensibility** - Custom states for advanced use cases
4. **Performance** - Minimal overhead for common cases
5. **Progressive enhancement** - Can evolve further in future versions

This balances the simplicity of our current system with the flexibility of G6's approach, without requiring breaking changes or sacrificing performance.
