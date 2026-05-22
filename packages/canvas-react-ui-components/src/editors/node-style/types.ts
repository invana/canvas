import type { NodeStyle } from '@invana/graph';

/**
 * v1 form value type. Subset of {@link NodeStyle} covering the 80% fields
 * exposed in the four-tab editor. Stored as a partial — undefined fields
 * mean "inherit from layer template / engine default".
 *
 * Why a local alias instead of `Partial<NodeStyle>` directly:
 * - `NodeStyle.bgFill` is `ShapeFill` (number | layer | layer[]). The v1
 *   editor only edits the solid-color form, so we narrow to `number`.
 * - Keeps the form's editable surface explicit — adding a field here is
 *   the signal to surface a new control.
 */
export interface NodeStyleFormValue {
  // Geometry
  shape?: NodeStyle['shape'];
  size?: number;

  // Background
  bgFill?: number;
  bgAlpha?: number;

  // Stroke
  bgStrokeColor?: number;
  bgStrokeAlpha?: number;
  bgStrokeWidth?: number;
  bgStrokeAlignment?: NonNullable<NodeStyle['bgStrokeAlignment']>;
  bgStrokeDashArray?: NonNullable<NodeStyle['bgStrokeDashArray']>;
  bgStrokeCap?: NonNullable<NodeStyle['bgStrokeCap']>;
  bgStrokeJoin?: NonNullable<NodeStyle['bgStrokeJoin']>;

  // Label
  labelText?: string;
  labelColor?: number;
  labelFontSize?: number;
  labelFontWeight?: number;
  labelPlacement?: NonNullable<NodeStyle['labelPlacement']>;
  labelOffsetX?: number;
  labelOffsetY?: number;
}

export type NodeStyleSectionId = 'geometry' | 'background' | 'stroke' | 'label';

export const NODE_STYLE_SECTIONS: readonly {
  id: NodeStyleSectionId;
  label: string;
}[] = [
  { id: 'geometry', label: 'Geometry' },
  { id: 'background', label: 'Background' },
  { id: 'stroke', label: 'Stroke' },
  { id: 'label', label: 'Label' },
];
