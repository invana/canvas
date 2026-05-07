# KeyboardCameraInputBehaviour

Arrow-key panning, plus `+` / `-` / `0` for zoom in / out / reset. Listens on `document` while enabled.

Default keymap:

| Action | Keys |
|---|---|
| Pan up | `ArrowUp` |
| Pan down | `ArrowDown` |
| Pan left | `ArrowLeft` |
| Pan right | `ArrowRight` |
| Zoom in | `+` `=` `NumpadAdd` |
| Zoom out | `-` `NumpadSubtract` |
| Reset zoom | `0` `Numpad0` |

`keymap` accepts a partial override that's merged onto the defaults — only override the groups you care about.

## Options

```ts
interface KeyboardCameraInputBehaviourOptions extends BehaviourOptions {
  panStep?: number;   // px per press, default 40
  zoomFactor?: number; // multiplier per press, default 1.1
  keymap?: Partial<KeyboardCameraKeymap>;
}

interface KeyboardCameraKeymap {
  panUp: string[];
  panDown: string[];
  panLeft: string[];
  panRight: string[];
  zoomIn: string[];
  zoomOut: string[];
  resetZoom: string[];
}
```

## Usage

```ts
import { KeyboardCameraInputBehaviour } from '@invana/canvas';

const kbd = new KeyboardCameraInputBehaviour({
  id: 'kbd-camera',
  panStep: 60,
  keymap: { resetZoom: ['Home'] },
});

canvas.behaviours.add(kbd);
kbd.enable();
```

See [Behaviours overview](./).
