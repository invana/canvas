# PinchZoomBehaviour

Two-finger pinch-to-zoom via the pixi-viewport `pinch` plugin.

Designed for touch screens and trackpads. Works alongside [`WheelZoomBehaviour`](./wheel-zoom), which handles trackpad pinch-as-scroll separately via its `trackpadPinch` flag; this behaviour handles native touch pinch events.

Set `noDrag: true` to make pinch only zoom (not also pan) — useful when you have a separate `DragPanBehaviour` and want to avoid conflicts.

## Options

```ts
interface PinchZoomBehaviourOptions extends BehaviourOptions {
  noDrag?: boolean;  // suppress the implicit pan during pinch, default false
  percent?: number;  // zoom multiplier, default 0.1
}
```

## Usage

```ts
import { PinchZoomBehaviour } from '@invana/canvas';

const pinch = new PinchZoomBehaviour({
  id: 'pinch-zoom',
  noDrag: true,
});

canvas.behaviours.add(pinch);
pinch.enable();
```

See [Behaviours overview](./).
