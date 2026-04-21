// shape-plugin/index.ts — internal barrel
export { ShapeObject } from './ShapeObject.js';
export { ShapePool } from './ShapePool.js';
export { CameraTracker } from './CameraTracker.js';
export type { CameraBounds } from './CameraTracker.js';
export { SceneContainer } from './SceneContainer.js';
export { HaloPool } from './HaloPool.js';
export { TextureRegistry } from './TextureRegistry.js';
export { AnimationTicker } from './AnimationTicker.js';
export { LODController, RenderDetail } from './LODController.js';
export type { LODThresholds } from './LODController.js';

// Re-export all spec types so consumers only need one import path
export * from './spec/index.js';
