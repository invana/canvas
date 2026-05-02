// graphics-utils/labels — internal label primitive.
//
// `Label` itself is internal (engine-only — see graphics-utils rule in
// packages/canvas/CLAUDE.md).  Style types are re-exported publicly via
// packages/canvas/src/index.ts so plugin authors can declare label specs.

export { Label } from './Label.js';
export type { LabelAnchor, LabelPlacement } from './Label.js';
export type {
  LabelStyle,
  LabelBackgroundStyle,
  LabelPadding,
  LabelRenderer,
} from './types.js';
