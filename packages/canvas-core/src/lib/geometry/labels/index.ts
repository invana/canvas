/**
 * Label sizing maths — how big a label is drawn on screen across camera zoom.
 *
 * Pure numbers in, a scale out; the backend applies it to whatever draws the
 * label. Engine-side for the same reason as badge placement: a second backend
 * must get the same answer without re-deriving it.
 */

export { resolveLabelScale } from './labelScale';
