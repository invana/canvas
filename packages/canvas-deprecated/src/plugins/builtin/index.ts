export { BackgroundPlugin } from './BackgroundPlugin.js';
export type { BackgroundOptions, BackgroundType, PatternType } from './BackgroundPlugin.js';
export { BackgroundUpdatedEvent } from './BackgroundEvents.js';

export { ThemedBackgroundPlugin } from './ThemedBackgroundPlugin.js';
export type {
  ThemedBackgroundOptions,
  ThemedBackgroundTheme,
  ThemedBackgroundMode,
  ThemedBackgroundKind,
} from './ThemedBackgroundPlugin.js';
export {
  ThemedBackgroundThemeSwitchedEvent,
  ThemedBackgroundModeUpdatedEvent,
} from './ThemedBackgroundEvents.js';
export type { ThemeSwitchSource, ModeUpdateSource } from './ThemedBackgroundEvents.js';

export { DrawingPlugin } from './DrawingPlugin.js';
export type { DrawStyle, PathStyle, BezierPoint, DashStyle, OrthogonalStyle, OrthogonalParams, ArrowStyle, ArrowParams, ArrowType, EffectStyle, CircleGlowParams, RectGlowParams, RippleParams } from './DrawingPlugin.js';
export { DevInfoPlugin } from './DevInfoPlugin.js';
export type { DevInfoPluginOptions, DevInfoCorner } from './DevInfoPlugin.js';
