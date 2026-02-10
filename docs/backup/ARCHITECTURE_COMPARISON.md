# Architecture Comparison: invana-studio-mvp vs Current

## Core Architectural Differences

### 1. **Rendering Pattern**

**invana-studio-mvp (Stateless Renderers):**
```typescript
// Renderer is stateless, operates on data
class BezierEdgeRenderer extends BaseEdgeRenderer {
  render(edge: RenderEdge, source: RenderNode, target: RenderNode, graphics, ctx) {
    // Calculate control point first
    const controlPoint = this.calculateControlPoint(source, target, edge);
    
    // Then calculate WHERE edge should EXIT/ENTER nodes
    // Direction: source -> control point
    const sourceAngle = atan2(controlPoint.y - source.y, controlPoint.x - source.x);
    const start = getEdgeEndpointByAngle(source, sourceAngle, 0);
    
    // Direction: control point -> target
    const targetAngle = atan2(target.y - controlPoint.y, target.x - controlPoint.x);
    const end = getEdgeEndpointByAngle(target, targetAngle + PI, targetOffset);
    
    // Draw curve: start -> controlPoint -> end
  }
}
```

**Our Architecture (Stateful Containers):**
```typescript
// Edge IS a Container, stores state
class BezierEdge extends RendererEdgeBase {
  render() {
    // Uses pre-calculated boundary points from data
    const { source, target, sourceCenter, targetCenter } = this._data;
    
    // Calculate control point based on CENTERS (not boundaries!)
    const controlPoint = this.calculateControlPoint(sourceCenter, targetCenter);
    
    // Draw curve: source (boundary) -> controlPoint -> target (boundary)
  }
  
  // Called once during edge creation/update
  calculateBoundaryPoints(sourceNode, targetNode, sourceCenter, targetCenter, offset) {
    // Uses straight line direction (WRONG for bezier!)
    source = sourceNode.getBoundaryPoint(targetCenter, offset);
    target = targetNode.getBoundaryPoint(sourceCenter, offset);
  }
}
```

### 2. **The Critical Issue: Bezier Edge Direction**

**The Problem:**
- Your bezier edges calculate control points AFTER boundaries are set
- But boundaries are calculated using straight-line direction (center to center)
- This means edges exit/enter nodes at the wrong angle

**invana-studio-mvp Solution:**
```typescript
// BezierEdgeRenderer.ts
render(edge, source, target) {
  // 1. Calculate control point FIRST
  const dx = target.x - source.x;
  const dy = target.y - source.y;
  const vectorNormInverse = { x: -dy / length, y: dx / length };
  const cpX = midpoint.x + vectorNormInverse.x * curveOffset;
  const cpY = midpoint.y + vectorNormInverse.y * curveOffset;
  
  // 2. Use control point to determine edge direction
  const sourceAngle = atan2(cpY - source.y, cpX - source.x);
  const start = this.getEdgeEndpointByAngle(source, sourceAngle, 0);
  
  const targetAngle = atan2(target.y - cpY, target.x - cpX);
  const end = this.getEdgeEndpointByAngle(target, targetAngle + PI, offset);
  
  // 3. Draw with correct entry/exit points
  graphics.moveTo(start.x - source.x, start.y - source.y);
  graphics.quadraticCurveTo(
    cpX - source.x, cpY - source.y,
    end.x - source.x, end.y - source.y
  );
}
```

**Your Current Approach:**
```typescript
// Renderer.ts - calculates boundaries BEFORE control points
const adjustedPoints = edge.calculateBoundaryPoints(
  sourceNode, targetNode, sourceCenter, targetCenter, offset
);

// EdgeData created with boundaries
const edgeData = {
  source: adjustedPoints.source,  // Wrong angle for bezier!
  target: adjustedPoints.target,  // Wrong angle for bezier!
  sourceCenter, targetCenter
};

// BezierEdge.ts - calculates control point AFTER
drawPath(source, target, style) {
  // Control point calculated from CENTERS
  const controlPoint = calculateControlPoint(sourceCenter, targetCenter);
  // But draws from source/target boundaries (calculated with wrong angle!)
  graphics.quadraticCurveTo(controlPoint.x, controlPoint.y, target.x, target.y);
}
```

## 🔧 Refactoring Suggestions (Without Breaking Styling)

### Option 1: **Renderer Pattern (Major Refactor, Most Flexible)**

```typescript
// Keep your styling system, add renderer layer
interface EdgeRenderer {
  render(
    edge: RendererEdge,
    sourceNode: RendererNodeBase,
    targetNode: RendererNodeBase,
    graphics: Graphics,
    style: EdgeStyle
  ): void;
}

class BezierEdgeRenderer implements EdgeRenderer {
  render(edge, sourceNode, targetNode, graphics, style) {
    // Calculate control point
    const cp = this.calculateControlPoint(sourceNode, targetNode, edge);
    
    // Get boundaries based on control point direction
    const sourceAngle = atan2(cp.y - sourceNode.y, cp.x - sourceNode.x);
    const start = sourceNode.getBoundaryPointByAngle(sourceAngle, 0);
    
    const targetAngle = atan2(targetNode.y - cp.y, targetNode.x - cp.x);
    const end = targetNode.getBoundaryPointByAngle(targetAngle + PI, 2);
    
    // Draw with correct styling
    graphics.moveTo(start.x, start.y);
    graphics.quadraticCurveTo(cp.x, cp.y, end.x, end.y);
  }
}

// BezierEdge becomes thin wrapper
class BezierEdge extends RendererEdgeBase {
  private renderer = new BezierEdgeRenderer();
  
  protected drawPath(source, target, style) {
    // Delegate to renderer
    this.renderer.render(this._data, sourceNode, targetNode, this._pathGraphics, style);
  }
}
```

### Option 2: **Fix Boundary Calculation for Curved Edges (Minimal Change)**

```typescript
// Add method to nodes for angle-based intersection
abstract class RendererNodeBase {
  getBoundaryPoint(targetPoint: Point, offset?: number): Point;
  
  // Add this
  getBoundaryPointByAngle(angle: number, offset: number = 0): Point {
    // Most shapes can use simple angle calculation
    const radius = this.getRadiusAtAngle(angle) + offset;
    return {
      x: this.x + cos(angle) * radius,
      y: this.y + sin(angle) * radius
    };
  }
  
  protected abstract getRadiusAtAngle(angle: number): number;
}

// BezierEdge overrides calculateBoundaryPoints
class BezierEdge extends RendererEdgeBase {
  public calculateBoundaryPoints(sourceNode, targetNode, sourceCenter, targetCenter, offset) {
    // Calculate control point FIRST
    const cp = this.calculateControlPoint(sourceCenter, targetCenter);
    
    // Use control point for correct direction
    const sourceAngle = atan2(cp.y - sourceCenter.y, cp.x - sourceCenter.x);
    const source = sourceNode.getBoundaryPointByAngle(sourceAngle, offset);
    
    const targetAngle = atan2(targetCenter.y - cp.y, targetCenter.x - cp.x);
    const target = targetNode.getBoundaryPointByAngle(targetAngle + PI, offset);
    
    return { source, target };
  }
}
```

### Option 3: **Lazy Boundary Calculation (Recommended for MVP)**

```typescript
// Don't pre-calculate boundaries in Renderer
// Calculate them during rendering when we know the curve geometry

class Renderer {
  addEdge(input: CanvasEdge) {
    // Store ONLY centers, not boundaries
    const edgeData: RendererEdge = {
      id,
      sourceCenter: sourcePoint,
      targetCenter: targetPoint,
      x: sourcePoint.x,
      y: sourcePoint.y,
      // NO source/target boundary points here!
    };
    
    const edge = new BezierEdge({ data: edgeData, ... });
  }
}

class BezierEdge {
  protected drawPath(source, target, style) {
    // Calculate everything during render
    const { sourceCenter, targetCenter } = this._data;
    
    // Get nodes from renderer
    const sourceNode = this.getSourceNode();
    const targetNode = this.getTargetNode();
    
    // Calculate control point
    const cp = this.calculateControlPoint(sourceCenter, targetCenter);
    
    // Calculate boundaries with correct angles
    const sourceAngle = atan2(cp.y - sourceCenter.y, cp.x - sourceCenter.x);
    const start = sourceNode.getBoundaryPointByAngle(sourceAngle, 0);
    
    const targetAngle = atan2(targetCenter.y - cp.y, targetCenter.x - cp.x);
    const end = targetNode.getBoundaryPointByAngle(targetAngle + PI, 2);
    
    // Draw
    graphics.moveTo(start.x - sourceCenter.x, start.y - sourceCenter.y);
    graphics.quadraticCurveTo(
      cp.x - sourceCenter.x, cp.y - sourceCenter.y,
      end.x - sourceCenter.x, end.y - sourceCenter.y
    );
  }
}
```

## 🎯 Recommended Approach

**Option 2 + 3 Hybrid:**

1. **Add `getBoundaryPointByAngle()` to all nodes** - Quick to implement, each shape already has the logic
2. **Override `calculateBoundaryPoints()` in BezierEdge** - Let bezier calculate control point first
3. **Keep your styling system unchanged** - It's already better
4. **Add node references to edges** - Store `sourceNodeRef` and `targetNodeRef` so edges can query current node state

This preserves your styling architecture while fixing the geometric calculation order.

## 📝 Implementation Priority

1. **Immediate Fix (1 hour):**
   - Add `getBoundaryPointByAngle()` to RendererNodeBase
   - Override `calculateBoundaryPoints()` in BezierEdge
   - Test with screenshot scenario

2. **Short-term (1 day):**
   - Add node references to edges
   - Implement lazy boundary calculation
   - Add arrow back-distance calculation

3. **Long-term (1 week):**
   - Consider renderer pattern for complex edge types
   - Add orthogonal edge support
   - Implement edge bundling

## 🔍 Key Insight

**Their architecture separates:**
- **What to draw** (RenderEdge data)
- **How to draw it** (EdgeRenderer logic)
- **Where to draw it** (Intersection utilities)

**Your architecture combines:**
- **What + How** (RendererEdgeBase is both data and logic)
- **Where** (Each node calculates its own boundary)

Both work, but **for curved edges**, you need to know the curve geometry BEFORE calculating boundaries. Their separation makes this easier. Your current approach calculates boundaries too early (in Renderer.addEdge) before the edge knows its curve.

**Fix:** Either calculate boundaries lazily (during render) OR let each edge type override boundary calculation.
