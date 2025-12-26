/**
 * Scene module - Graph data store and scene management
 */

export { SceneGraph } from './SceneGraph';
export type { SceneGraphEventType, SceneGraphEventCallback } from './SceneGraph';

export { QueryEngine } from './QueryEngine';
export type { QueryFilter, QueryResult } from './QueryEngine';

export { Relationships } from './Relationships';
export type { RelationshipInfo, PathResult } from './Relationships';

export { SpatialIndex } from './SpatialIndex';
export type { Bounds, SpatialIndexOptions } from './SpatialIndex';
