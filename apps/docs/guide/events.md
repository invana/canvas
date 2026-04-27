# Events

All internal subsystems and plugins communicate through a single shared `EventBus` exposed as `canvas.events`. No raw PixiJS events are exposed to consumers.

## Usage

```ts
// Subscribe
const off = canvas.events.on('canvas:clicked', (event) => {
  console.log('clicked at', event.worldX, event.worldY);
});

// Unsubscribe
off();

// Emit (plugins do this internally — rarely needed from user code)
canvas.events.emit('canvas:clicked', new CanvasClickedEvent(fields));
```

## Canvas events

These fire on pointer interactions with the canvas background (not a shape):

| Event | Fires when |
|---|---|
| `canvas:pointerdown` | Pointer pressed on the canvas background |
| `canvas:pointermove` | Pointer moved over the canvas |
| `canvas:pointerup` | Pointer released |
| `canvas:clicked` | Click lands on the canvas background |
| `canvas:dblclicked` | Double-click lands on the canvas background |
| `canvas:contextmenu` | Right-click on the canvas background |

All canvas pointer events carry `worldX`, `worldY` (world-space coordinates) and `screenX`, `screenY` (screen-space coordinates).

## Camera events

| Event | Payload fields | Fires when |
|---|---|---|
| `camera:pan` | `x`, `y` | Camera position changes |
| `camera:zoom` | `scale`, `center` | Zoom level changes |
| `camera:fit` | `bounds` | `fitTo()` completes |
| `camera:reset` | — | `reset()` is called |
| `camera:animate-start` | `targetScale`, `targetX`, `targetY` | Animated transition begins |

## Layer events

| Event | Payload fields | Fires when |
|---|---|---|
| `layer:visibility-changed` | `layerId`, `visible` | `showLayer` / `hideLayer` called |

## Plugin lifecycle events

| Event | Payload fields | Fires when |
|---|---|---|
| `plugin:registered` | `pluginId` | Plugin successfully registered |
| `plugin:destroyed` | `pluginId` | Plugin unregistered and destroyed |
| `plugin:enabled` | `pluginId` | `setEnabled(id, true)` called |
| `plugin:disabled` | `pluginId` | `setEnabled(id, false)` called |

## Element events

Fired by `ElementPlugin`. All carry `elementId`, `elementType` (`'solid'` or `'connector'`), and pointer fields:

| Event | Fires when |
|---|---|
| `element:click` | Element clicked |
| `element:dblclick` | Element double-clicked |
| `element:contextmenu` | Right-click on element |
| `element:pointerover` | Pointer enters element |
| `element:pointerout` | Pointer leaves element |
| `element:pointermove` | Pointer moves over element |
| `element:pointerdown` | Pointer pressed on element |
| `element:pointerup` | Pointer released on element |
| `element:dragstart` | Drag begins on a draggable element |
| `element:dragmove` | Element is being dragged |
| `element:dragend` | Drag ends |
| `element:state-change` | Element state changed |
| `element:added` | Element added to the plugin |
| `element:removed` | Element removed from the plugin |

## Extending the event map

Downstream packages can add their own events via TypeScript module augmentation — no casting needed:

```ts
declare module '@invana/canvas' {
  interface CanvasEventMap {
    'graph:node:click': MyNodeClickEvent;
  }
}

// Now fully typed
canvas.events.on('graph:node:click', (event) => {
  // event is MyNodeClickEvent
});
```
