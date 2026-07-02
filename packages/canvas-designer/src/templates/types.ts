import type { CardElement } from '@invana/graph';

/** The element kinds the designer can place. */
export type ElementType = CardElement['type'];

/**
 * Flat react-hook-form state for the **selected element**'s properties. Only the
 * fields relevant to the element's `type` are rendered (see `elementFields`);
 * `x` / `y` are driven by dragging on the canvas, not by this form. Roles/binds
 * carry sentinels (`NO_ROLE` / `NO_BIND`) since Radix selects forbid `''`.
 */
export interface ElementFormState {
  // text
  bind: string;
  text: string;
  fontSize: number;
  fontWeight: number;
  colorRole: string;
  uppercase: boolean;
  maxWidth: number;
  // rect
  width: number;
  height: number;
  cornerRadius: number;
  fillRole: string;
  // circle
  radius: number;
  // line
  x2: number;
  y2: number;
  strokeWidth: number;
  // image
  size: number;
  shape: string;
}

/** react-hook-form state for the card-level properties. */
export interface CardFormState {
  name: string;
  width: number;
  height: number;
  cornerRadius: number;
  bgRole: string;
}
