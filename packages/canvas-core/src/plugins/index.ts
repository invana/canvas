/**
 * Plugins module - Plugin system for extending canvas functionality
 */

export type { CanvasPlugin, LayerGroupConfig, PluginRegistrationOptions, PluginConfig, PluginConfigWithOptions, BehaviorPreset } from './types';
export { PluginRegistry, BEHAVIOR_PRESETS, type PluginConstructor } from './registry';

// Core plugins
export { GroupsPlugin } from './GroupsPlugin';
export type { GroupConfig } from './GroupsPlugin';
export { BackgroundPlugin } from './BackgroundPlugin';

// Interaction plugins
export { DragElementPlugin } from './DragElementPlugin';
export type { DragElementOptions } from './DragElementPlugin';

export { DragCanvasPlugin } from './DragCanvasPlugin';
export type { DragCanvasOptions } from './DragCanvasPlugin';

export { ZoomControlPlugin } from './ZoomControlPlugin';
export type { ZoomControlOptions } from './ZoomControlPlugin';

export { ClickSelectPlugin } from './ClickSelectPlugin';
export type { ClickSelectOptions, SelectableElement } from './ClickSelectPlugin';

export { HoverActivatePlugin } from './HoverActivatePlugin';
export type { HoverActivateOptions, HoverableElement } from './HoverActivatePlugin';

export { FocusElementPlugin } from './FocusElementPlugin';
export type { FocusElementOptions, FocusableElement } from './FocusElementPlugin';

export { MiniMapPlugin } from './MiniMapPlugin';
export type { MiniMapOptions } from './MiniMapPlugin';
