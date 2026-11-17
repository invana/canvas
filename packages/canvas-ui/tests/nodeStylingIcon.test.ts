/**
 * The node-styling editor's icon round trip — `rfc:feat-2026-11-17-marker-icons-and-zoom-labels-are-not-config`
 * rows T1 / E1.
 *
 * `formToStyling` rebuilds a template from the fields the form models, so any
 * field it does not model is deleted on every save unless it is carried from
 * `base`. A template icon added without this would vanish the first time anyone
 * touched a colour. These tests pin the carry-through.
 */
import { describe, expect, it } from 'vitest';
import type { NodeStylingTemplate } from '@invana/graph';

import { formToStyling, stylingToForm } from '../src/editor-panels/node-styling/mapping';

const roundTrip = (t: NodeStylingTemplate, edit?: (f: ReturnType<typeof stylingToForm>) => void): NodeStylingTemplate => {
  const form = stylingToForm(t);
  edit?.(form);
  return formToStyling(form, t);
};

describe('icon — nothing the form cannot show is deleted on save', () => {
  it('carries a glyph / svg / svg-url icon through verbatim', () => {
    for (const icon of [
      { kind: 'glyph', char: 'X', fontFamily: 'FA', color: 0xffffff },
      { kind: 'svg', pathD: 'M0 0L1 1', strokeWidth: 3 },
      { kind: 'svg-url', url: 'https://example.test/a.svg', rotation: 1 }
    ] as const) {
      expect(roundTrip({ name: 's', fillRole: 'accent', icon }).icon).toEqual(icon);
    }
  });

  it('keeps every field of a named icon the form does not edit', () => {
    const icon = { kind: 'named', name: 'waves', color: 0xffffff, alpha: 0.9, anchor: 'top-right', strokeWidth: 3, rotation: 0.5 } as const;
    expect(roundTrip({ name: 's', icon }).icon).toEqual(icon);
  });

  it('carries no icon when there was none (control: unchanged output)', () => {
    expect(roundTrip({ name: 's', fillRole: 'accent' })).not.toHaveProperty('icon');
  });
});

describe('icon — what the form edits', () => {
  it('shows the name, size and rotation binding of a named icon', () => {
    const form = stylingToForm({
      name: 's',
      icon: { kind: 'named', name: 'waves', sizeRatio: 0.8, rotationBind: 'data.course', rotationUnit: 'rad', rotationOffset: 0.2 }
    });
    expect(form.styling).toMatchObject({
      iconName: 'waves',
      iconSizeRatio: 0.8,
      iconRotationBind: 'data.course',
      iconRotationUnit: 'rad',
      iconRotationOffset: 0.2
    });
  });

  it('shows the defaults for a template with no icon', () => {
    expect(stylingToForm({ name: 's' }).styling).toMatchObject({
      iconName: '',
      iconSizeRatio: 0.6,
      iconRotationBind: '',
      iconRotationUnit: 'deg',
      iconRotationOffset: 0
    });
  });

  it('adds a named icon from a name alone, leaving defaults out', () => {
    const out = roundTrip({ name: 's' }, (f) => {
      f.styling.iconName = 'waves';
    });
    expect(out.icon).toEqual({ kind: 'named', name: 'waves' });
  });

  it('writes a rotation binding, omitting a degrees unit and a zero offset (the defaults)', () => {
    const out = roundTrip({ name: 's', icon: { kind: 'named', name: 'ship' } }, (f) => {
      f.styling.iconRotationBind = ' data.course ';
    });
    expect(out.icon).toEqual({ kind: 'named', name: 'ship', rotationBind: 'data.course' });
  });

  it('writes a non-default unit, offset and size', () => {
    const out = roundTrip({ name: 's', icon: { kind: 'named', name: 'ship' } }, (f) => {
      f.styling.iconRotationBind = 'data.h';
      f.styling.iconRotationUnit = 'rad';
      f.styling.iconRotationOffset = -1.5;
      f.styling.iconSizeRatio = 0.9;
    });
    expect(out.icon).toEqual({ kind: 'named', name: 'ship', sizeRatio: 0.9, rotationBind: 'data.h', rotationUnit: 'rad', rotationOffset: -1.5 });
  });

  it('drops a stale binding when the bind path is cleared', () => {
    const out = roundTrip({ name: 's', icon: { kind: 'named', name: 'ship', rotationBind: 'data.course', rotationOffset: 5 } }, (f) => {
      f.styling.iconRotationBind = '';
    });
    expect(out.icon).toEqual({ kind: 'named', name: 'ship' });
  });

  it('removes a named icon when its name is cleared', () => {
    const out = roundTrip({ name: 's', icon: { kind: 'named', name: 'ship', color: 0xffffff } }, (f) => {
      f.styling.iconName = '';
    });
    expect(out).not.toHaveProperty('icon');
  });

  it('does not overwrite a glyph icon with a typed name (the form does not edit other kinds)', () => {
    const glyph = { kind: 'glyph', char: 'X' } as const;
    const out = roundTrip({ name: 's', icon: glyph }, (f) => {
      f.styling.iconName = 'waves';
    });
    expect(out.icon).toEqual(glyph);
  });
});
