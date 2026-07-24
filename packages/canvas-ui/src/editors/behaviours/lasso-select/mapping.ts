import { hexToNumber, numberToHex } from '../../../shared/color';
import type { LassoSelectFields, LassoSelectOptions, LassoSelectStyleOptions } from './types';

/**
 * Resolve a colour seed value to the hex string the swatch shows. The engine
 * stores lasso colours as `0xRRGGBB` numbers; a stray CSS string passes
 * through; anything else round-trips as `undefined`.
 */
function colorToField(v: unknown): string | undefined {
  if (typeof v === 'number') return numberToHex(v);
  if (typeof v === 'string') return v;
  return undefined;
}

/**
 * Map a `LassoSelectBehaviourOptions`-shaped patch to the flat
 * {@link LassoSelectFields} the `@invana/forms` generator renders. The
 * `enableElements` array becomes two booleans; the `trigger` array collapses to
 * a single select; the nested `style` group is flattened; colours are
 * normalised to hex strings.
 */
export function optionsToForm(o: LassoSelectOptions = {}): LassoSelectFields {
  const s = o.style ?? {};
  return {
    enableShapes: o.enableElements === undefined ? undefined : o.enableElements.includes('shape'),
    enableConnectors:
      o.enableElements === undefined ? undefined : o.enableElements.includes('connector'),
    trigger: o.trigger === undefined ? undefined : (o.trigger[0] ?? 'none'),
    immediately: o.immediately,
    state: o.state,
    clearOnBackground: o.clearOnBackground,
    styleFill: colorToField(s.fill),
    styleFillAlpha: s.fillAlpha,
    styleStroke: colorToField(s.stroke),
    styleStrokeAlpha: s.strokeAlpha,
    styleStrokeWidth: s.strokeWidth,
  };
}

/**
 * Inverse of {@link optionsToForm}: fold the flat fields back to a serialisable
 * {@link LassoSelectOptions} patch. Only fields the form set are included (no
 * `undefined` keys), so the result is safe to spread over the behaviour's
 * current options on `setOptions`. `enableElements` and the `style` group are
 * reassembled only when a member is set; colour strings become `0xRRGGBB`
 * numbers.
 */
export function formToOptions(f: LassoSelectFields): LassoSelectOptions {
  const out: LassoSelectOptions = {};

  if (f.enableShapes !== undefined || f.enableConnectors !== undefined) {
    const els: ('shape' | 'connector')[] = [];
    if (f.enableShapes) els.push('shape');
    if (f.enableConnectors) els.push('connector');
    out.enableElements = els;
  }
  if (f.trigger !== undefined) out.trigger = f.trigger === 'none' ? [] : [f.trigger];
  if (f.immediately !== undefined) out.immediately = f.immediately;
  if (f.state !== undefined) out.state = f.state;
  if (f.clearOnBackground !== undefined) out.clearOnBackground = f.clearOnBackground;

  const style: LassoSelectStyleOptions = {};
  if (f.styleFill) style.fill = hexToNumber(f.styleFill);
  if (f.styleFillAlpha !== undefined) style.fillAlpha = f.styleFillAlpha;
  if (f.styleStroke) style.stroke = hexToNumber(f.styleStroke);
  if (f.styleStrokeAlpha !== undefined) style.strokeAlpha = f.styleStrokeAlpha;
  if (f.styleStrokeWidth !== undefined) style.strokeWidth = f.styleStrokeWidth;
  if (Object.keys(style).length > 0) out.style = style;

  return out;
}
