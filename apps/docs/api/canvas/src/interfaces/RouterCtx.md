# Interface: RouterCtx

Defined in: [canvas/src/primitives/types.ts:86](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L86)

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

Defined in: [canvas/src/primitives/types.ts:87](https://github.com/invana/canvas/blob/ee4faae6c3fc997ca94ad6a644b0fbd178a59b99/packages/canvas/src/primitives/types.ts#L87)
