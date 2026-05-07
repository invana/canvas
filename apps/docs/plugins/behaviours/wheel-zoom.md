# WheelZoomBehaviour

Scroll-wheel zooming via the pixi-viewport `wheel` plugin.

By default any scroll wheel event zooms. Set `requireCtrl: true` to restrict to Ctrl+scroll — that frees plain scroll for page scrolling, which matters for accessibility when the canvas is inline on a scrollable page.

`trackpadPinch: true` is enabled internally so two-finger trackpad pinches zoom instead of scroll. Pair with [`PinchZoomBehaviour`](./pinch-zoom) for touch devices.

## Options

```ts
interface WheelZoomBehaviourOptions extends BehaviourOptions {
  requireCtrl?: boolean;     // default false — gate zoom behind Ctrl
  percent?: number;          // zoom per tick, default 0.1 (10%)
  smooth?: false | number;   // smoothing frames, false = instant snap (default)
}
```

## Usage

```ts
import { WheelZoomBehaviour } from '@invana/canvas';

const wheel = new WheelZoomBehaviour({
  id: 'wheel-zoom',
  requireCtrl: true,
  smooth: 8,
});

canvas.behaviours.add(wheel);
wheel.enable();
```

See [Behaviours overview](./).
