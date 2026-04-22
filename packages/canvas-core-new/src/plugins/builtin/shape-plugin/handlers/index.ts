// ── handlers/index.ts ─────────────────────────────────────────────────────────
// Builds and exports the default AnimationRegistry pre-loaded with all
// built-in animation handlers. External code registers custom handlers here:
//
//   import { defaultRegistry } from '@invana/canvas-core-new';
//   defaultRegistry.register(myHandler);

import { AnimationRegistry } from '../AnimationRegistry.js';
import { breatheHandler } from './breatheHandler.js';
import { colorCycleHandler } from './colorCycleHandler.js';
import { fadeInHandler } from './fadeInHandler.js';
import { pulseHandler } from './pulseHandler.js';
import { marchingAntsHandler } from './marchingAntsHandler.js';
import { dashedFlowHandler } from './dashedFlowHandler.js';
import { borderGlowHandler } from './borderGlowHandler.js';

export { breatheHandler } from './breatheHandler.js';
export { colorCycleHandler } from './colorCycleHandler.js';
export { fadeInHandler } from './fadeInHandler.js';
export { pulseHandler } from './pulseHandler.js';
export { marchingAntsHandler } from './marchingAntsHandler.js';
export { dashedFlowHandler } from './dashedFlowHandler.js';
export { borderGlowHandler } from './borderGlowHandler.js';

export type { BreatheOptions } from './breatheHandler.js';
export type { ColorCycleOptions } from './colorCycleHandler.js';
export type { FadeInOptions } from './fadeInHandler.js';
export type { PulseOptions } from './pulseHandler.js';
export type { MarchingAntsOptions } from './marchingAntsHandler.js';
export type { DashedFlowOptions } from './dashedFlowHandler.js';
export type { BorderGlowOptions } from './borderGlowHandler.js';

/**
 * Default {@link AnimationRegistry} instance pre-loaded with all built-in handlers.
 *
 * @remarks
 * Pass this registry to {@link AnimationTicker} (the default) or create a new
 * `AnimationRegistry` and populate it for isolated use cases.
 *
 * Register custom animations globally:
 * ```ts
 * import { defaultRegistry } from '@invana/canvas-core-new';
 * defaultRegistry.register(myCustomHandler);
 * ```
 */
export const defaultRegistry = new AnimationRegistry()
  .register(breatheHandler)
  .register(colorCycleHandler)
  .register(fadeInHandler)
  .register(pulseHandler)
  .register(marchingAntsHandler)
  .register(dashedFlowHandler)
  .register(borderGlowHandler);
