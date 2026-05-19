/**
 * Shared test helper — constructs the minimum scene graph our tests need:
 *   stage > world (Viewport)
 *
 * `ScreenLayer.mount` attaches its root container directly to `stage` (no
 * "screen" wrapper container in this design). Production wires the same
 * graph in `Canvas._wireScene`.
 *
 * The `events` field on `Viewport` is a stub here — fine because no
 * camera-input plugin (drag, wheel, ...) is registered in tests. Production
 * code passes `app.renderer.events`.
 */

import { Container, type EventSystem } from 'pixi.js';
import { Viewport } from 'pixi-viewport';

export interface TestScene {
  stage: Container;
  world: Viewport;
}

export function makeTestScene(screenWidth = 800, screenHeight = 600): TestScene {
  const stage = new Container();

  const events = {
    domElement:
      typeof document !== 'undefined'
        ? document.createElement('canvas')
        : ({} as HTMLCanvasElement),
  } as unknown as EventSystem;

  const world = new Viewport({ events, screenWidth, screenHeight, noTicker: true });
  world.label = 'world';

  stage.addChild(world);

  return { stage, world };
}
