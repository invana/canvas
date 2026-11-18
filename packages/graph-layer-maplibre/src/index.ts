// @invana/graph-layer-maplibre — public API surface

export { MapLayer, BLANK_STYLE, OPENFREEMAP_STYLES } from './MapLayer';
export { computeTint } from './basemapTint';
export type { TintLayer, TintOp, TintTheme } from './basemapTint';
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
export type { GeoFeatureOp, GeoFeaturesLayerEvents, GeoFeaturesLayerOptions } from './features/GeoFeaturesLayer';
export { AreaQueryBehaviour } from './tools/AreaQueryBehaviour';
export type { AreaQuery, AreaQueryBehaviourOptions } from './tools/AreaQueryBehaviour';
export { DrawGeoFeatureBehaviour } from './tools/DrawGeoFeatureBehaviour';
export type { DrawGeoFeatureBehaviourOptions, DrawTool } from './tools/DrawGeoFeatureBehaviour';
export { MeasureBehaviour, areaReadout, distanceReadout } from './tools/MeasureBehaviour';
export type { MeasureBehaviourOptions, MeasureTool } from './tools/MeasureBehaviour';
export { PointerCollector } from './tools/PointerCollector';
export type { CollectedShape, ShapeKind } from './tools/PointerCollector';
export {
  destinationPoint,
  distanceToPolylineKm,
  distanceToSegmentKm,
  haversineKm,
  initialBearing,
  polylineLengthKm,
  sphericalPolygonAreaKm2,
  sphericalRingAreaKm2,
} from './geo/geodesy';
export { downloadGeoJSON } from './features/export';
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
