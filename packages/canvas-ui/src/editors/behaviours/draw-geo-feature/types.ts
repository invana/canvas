/**
 * Types for the DrawGeoFeatureBehaviour editor. Engine-agnostic: a serialisable
 * patch applied with `setOptions`. Keep it in sync with
 * `DrawGeoFeatureBehaviourOptions`; `mapLayerId` and `featuresLayerId` are wiring
 * and are not edited here.
 */

export type DrawTool = 'polygon' | 'line' | 'circle';

export interface DrawGeoFeatureOptions {
  /** What to draw now; `null` for nothing. */
  tool?: DrawTool | null;
  /** Written to each drawn feature's `author`. */
  author?: string;
  /** Prefix of generated feature ids. */
  idPrefix?: string;
}

export interface DrawGeoFeatureFields {
  /** `none` for no tool. */
  tool?: DrawTool | 'none';
  author?: string;
  idPrefix?: string;
}

export interface DrawGeoFeatureFormState {
  options: DrawGeoFeatureFields;
}
