# DragPanBehaviour

Pointer-drag panning via the pixi-viewport `drag` plugin.

An optional `modifier` key restricts the gesture so plain drag stays free for other behaviours (lasso, rubber-band select, etc.):

- `'none'` (default) — any left-button drag pans
- `'space'` — Space + drag (Figma / Sketch style)
- `'shift'` — Shift + drag
- `'alt'` — Alt/Option + drag

A decelerate plugin is added alongside by default, giving momentum after the pointer lifts. Disable with `decelerate: false`.

## Options

```ts
interface DragPanBehaviourOptions extends BehaviourOptions {
  modifier?: 'none' | 'space' | 'shift' | 'alt';   // default 'none'
  mouseButtons?: 'all' | 'left' | 'right' | 'middle'; // default 'left'
  decelerate?: boolean;                            // default true
}
```

## Usage

```ts
import { DragPanBehaviour } from '@invana/canvas';

const drag = new DragPanBehaviour({
  id: 'drag-pan',
  modifier: 'space',
});

canvas.behaviours.add(drag);
drag.enable();
```

See [Behaviours overview](./).
