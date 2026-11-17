// @invana/graph-layer-maplibre — public API surface

export { MapLayer, BLANK_STYLE } from './MapLayer';
export { GeoPositionBehaviour } from './GeoPositionBehaviour';
export type { GeoPositionBehaviourOptions } from './GeoPositionBehaviour';
export type {
  LngLat,
  MapCameraDriver,
  MapLayerEvents,
  MapLayerOptions,
  MapLayerState,
  WorldPoint,
} from './types';

export { WORLD_SIZE, projectLngLat, unprojectWorld } from './mercator';
export { lngLatFix, lngLatFixes, worldUnitsPerMetre } from './tracking';
export type { LngLatFix, WorldFix } from './tracking';

export { greatCircleSamples } from './greatCircle';
export type { LngLatTuple } from './greatCircle';

export { GeoFeaturesLayer, GEO_FEATURES_LAYER_DEFAULTS } from './features/GeoFeaturesLayer';
export type { GeoFeaturesLayerEvents, GeoFeaturesLayerOptions } from './features/GeoFeaturesLayer';
export { parseReliability, provenanceProblems } from './features/provenance';
export type { Reliability } from './features/provenance';
export type { UnconfirmedRule } from './features/style';
export type {
  GeoFeature,
  GeoFeatureCollection,
  GeoFeatureProperties,
  GeoFeatureStyle,
  GeoGeometry,
  LineStringGeometry,
  MultiLineStringGeometry,
  MultiPolygonGeometry,
  PointGeometry,
  PolygonGeometry,
  Position,
} from './features/types';
