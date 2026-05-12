# Interface: RouterCtx

Defined in: [packages/canvas/src/primitives/types.ts:86](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L86)

Read-only scene context handed to routers that need awareness of other
shapes — primarily for obstacle-avoidance routing (`manhattan` and
friends). Simple geometric routers (`straight`, `orth`) ignore it.

`obstacles` are world-space `Rect`s the router should not cross. Each
obstacle may also expose `containsInflated` for pixel-accurate silhouette
testing (e.g. circles route around their tangent, not their AABB).
The renderer auto-collects these from `shapeInstances` (excluding the
source/target shapes); callers can override or opt out via
`routerOpts.obstacles`.

## Properties

### obstacles

> `readonly` **obstacles**: readonly [`Obstacle`](Obstacle.md)[]

Defined in: [packages/canvas/src/primitives/types.ts:87](https://github.com/invana/canvas/blob/8bae293c3b3776c3f462615b5b8e9132190d7ae2/packages/canvas/src/primitives/types.ts#L87)
