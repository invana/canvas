/**
 * Types for the AreaQueryBehaviour editor. A serialisable patch applied with
 * `setOptions`; the layer ids and `clickSelectId` are wiring and are not edited here.
 */

export interface AreaQueryOptions {
  /** Re-select whenever a feature is added or changed. */
  autoQuery?: boolean;
  /** The distance, km, `autoQuery` widens "inside" by. */
  withinKm?: number;
}

export interface AreaQueryFields {
  autoQuery?: boolean;
  withinKm?: number;
}

export interface AreaQueryFormState {
  options: AreaQueryFields;
}
