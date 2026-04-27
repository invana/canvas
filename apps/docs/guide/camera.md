# Camera

The camera controls pan, zoom, and viewport fit. It is exposed as `canvas.camera` and implements the `CameraAPI` interface. The backing implementation wraps `pixi-viewport` — no PixiJS types are exposed to consumers.

## Accessing the camera

```ts
const { camera } = canvas;

console.log(camera.x, camera.y, camera.scale);
```

## Readable state

| Property | Type | Description |
|---|---|---|
| `camera.x` | `number` | World-space X of the camera's top-left corner |
| `camera.y` | `number` | World-space Y of the camera's top-left corner |
| `camera.scale` | `number` | Current zoom — `1.0` = 100%, `2.0` = 200% in |
| `camera.getBounds()` | `Bounds` | World-space bounding box currently visible |

## Pan

```ts
// Relative pan — shift by delta pixels
camera.pan(100, -50);

// Absolute pan — center the viewport on world-space (x, y)
camera.panTo(0, 0);
```

## Zoom

```ts
// Relative zoom — multiply current scale
camera.zoom(1.2);   // zoom in 20%
camera.zoom(0.8);   // zoom out 20%

// Absolute zoom — set exact scale, optionally around a screen-space point
camera.zoomTo(1.5);
camera.zoomTo(2.0, { x: 400, y: 300 }); // zoom centered on screen point
```

## Fit to bounds

```ts
// Fit the viewport to a world-space bounding box with 50px padding
camera.fitTo({ x: -200, y: -150, width: 400, height: 300 }, 50);
```

Plugins that manage collections of shapes (e.g. `ShapePlugin`, `ElementPlugin`) have a `fit()` helper that computes the bounding box for you and delegates to `camera.fitTo`.

## Reset

```ts
// Return to origin at scale 1.0
camera.reset();
```

## Animated transitions

```ts
camera.animate({
  x: 100,        // target world-space X
  y: 200,        // target world-space Y
  scale: 1.5,    // target zoom
  duration: 500, // milliseconds (default: 300)
  ease: 'easeInOut', // easing function (default: 'easeInOut')
});
```

All fields in `CameraAnimationOptions` are optional — omit any axis or scale to keep it unchanged.

## Coordinate conversion

```ts
// Screen → world
const world = camera.toWorld(mouseX, mouseY);

// World → screen
const screen = camera.toScreen(shapeX, shapeY);
```

## Camera events

Subscribe via `canvas.events`:

| Event | Payload | Fires when |
|---|---|---|
| `camera:pan` | `{ x, y }` | Camera position changes |
| `camera:zoom` | `{ scale, center }` | Zoom level changes |
| `camera:fit` | `{ bounds }` | `fitTo()` completes |
| `camera:reset` | — | `reset()` is called |
| `camera:animate-start` | `{ targetScale, targetX, targetY }` | Animated transition begins |

```ts
canvas.events.on('camera:zoom', ({ scale }) => {
  console.log('zoom level:', scale);
});
```

## Pan lock

`ElementPlugin` calls `camera.lockPan()` / `camera.unlockPan()` automatically during element drags so the viewport does not pan simultaneously. You can call these manually if needed.

## Resize

When the canvas container changes size, the camera's internal screen dimensions are updated automatically (via `autoResize`, which is enabled by default). This keeps methods like `fitTo()`, `getBounds()`, and zoom clamp calculations accurate after a resize.

If you have disabled `autoResize` and are calling `canvas.resize()` manually, the camera is still updated on every `canvas.resize()` call — no separate camera resize call is needed.
