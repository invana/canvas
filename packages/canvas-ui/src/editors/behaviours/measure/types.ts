/**
 * Types for the MeasureBehaviour editor. A serialisable patch applied with
 * `setOptions`; the two layer ids are wiring and are not edited here.
 */

export type MeasureTool = 'distance' | 'area';

export interface MeasureOptions {
  /** What to measure now; `null` for nothing. */
  tool?: MeasureTool | null;
}

export interface MeasureFields {
  /** `none` for no tool. */
  tool?: MeasureTool | 'none';
}

export interface MeasureFormState {
  options: MeasureFields;
}
