import type { CardElement, FreeformStructure } from '@invana/graph';

import { asRole, NO_ROLE, numberToHex } from '@invana/canvas-ui';
import { NO_BIND } from './fields';
import type { CardFormState, ElementFormState, ElementType } from './types';

// ─── Card-level ────────────────────────────────────────────────────────────

export function cardToForm(tpl: FreeformStructure): CardFormState {
  return {
    name: tpl.name ?? '',
    width: tpl.width,
    height: tpl.height,
    cornerRadius: tpl.cornerRadius ?? 10,
    bgRole: tpl.bgRole ?? NO_ROLE,
  };
}

/** Apply card-form edits onto a template (keeps elements). */
export function applyFormToCard(tpl: FreeformStructure, v: CardFormState): FreeformStructure {
  const next: FreeformStructure = {
    ...tpl,
    name: (v.name ?? '').trim() || tpl.name,
    width: v.width || tpl.width,
    height: v.height || tpl.height,
    cornerRadius: v.cornerRadius,
  };
  const role = asRole(v.bgRole);
  if (role) next.bgRole = role;
  else delete next.bgRole;
  return next;
}

// ─── Element-level ──────────────────────────────────────────────────────────

export function elementToForm(el: CardElement): ElementFormState {
  const base: ElementFormState = {
    bind: '',
    text: '',
    fontSize: 13,
    fontWeight: 400,
    colorRole: NO_ROLE,
    uppercase: false,
    maxWidth: 0,
    width: 40,
    height: 24,
    cornerRadius: 0,
    fillRole: NO_ROLE,
    radius: 16,
    x2: 0,
    y2: 0,
    strokeWidth: 1,
    size: 40,
    shape: 'circle',
  };
  switch (el.type) {
    case 'text':
      return {
        ...base,
        bind: el.bind ?? '',
        text: el.text ?? '',
        fontSize: el.fontSize ?? 13,
        fontWeight: typeof el.fontWeight === 'number' ? el.fontWeight : 400,
        colorRole: el.colorRole ?? NO_ROLE,
        uppercase: el.uppercase ?? false,
        maxWidth: el.maxWidth ?? 0,
      };
    case 'rect':
      return {
        ...base,
        width: el.width,
        height: el.height,
        cornerRadius: el.cornerRadius ?? 0,
        fillRole: el.fillRole ?? NO_ROLE,
      };
    case 'circle':
      return { ...base, radius: el.radius, fillRole: el.fillRole ?? NO_ROLE };
    case 'line':
      return {
        ...base,
        x2: el.x2,
        y2: el.y2,
        strokeWidth: el.strokeWidth ?? 1,
        colorRole: el.colorRole ?? NO_ROLE,
      };
    case 'image':
      return { ...base, bind: el.bind ?? '', size: el.size, shape: el.shape ?? 'circle' };
    default:
      return base;
  }
}

/** Merge element-form edits back onto an element (preserves id + position). */
export function applyFormToElement(el: CardElement, v: ElementFormState): CardElement {
  const bound = v.bind?.trim();
  const bind = bound && bound !== NO_BIND ? bound : undefined;
  switch (el.type) {
    case 'text':
      return {
        ...el,
        bind,
        text: v.text,
        fontSize: v.fontSize,
        fontWeight: v.fontWeight,
        uppercase: v.uppercase,
        maxWidth: v.maxWidth > 0 ? v.maxWidth : undefined,
        colorRole: asRole(v.colorRole),
      };
    case 'rect':
      return {
        ...el,
        width: v.width,
        height: v.height,
        cornerRadius: v.cornerRadius || undefined,
        fillRole: asRole(v.fillRole),
      };
    case 'circle':
      return { ...el, radius: v.radius, fillRole: asRole(v.fillRole) };
    case 'line':
      return { ...el, x2: v.x2, y2: v.y2, strokeWidth: v.strokeWidth, colorRole: asRole(v.colorRole) };
    case 'image':
      return { ...el, bind, size: v.size, shape: v.shape === 'rounded' ? 'rounded' : 'circle' };
    default:
      return el;
  }
}

// ─── Preview helpers ───────────────────────────────────────────────────────

/** Resolve a role/fixed colour pair to a CSS hex for the design canvas. */
export function previewColor(
  role: string | undefined,
  direct: number | undefined,
  palette: Record<string, number>,
  fallback: number,
): string {
  if (role && palette[role] !== undefined) return numberToHex(palette[role]!);
  if (typeof direct === 'number') return numberToHex(direct);
  return numberToHex(fallback);
}

// ─── Serialisation (save / load) ────────────────────────────────────────────

/** Pretty-print a template for download. */
export function templateToJson(tpl: FreeformStructure): string {
  return JSON.stringify(tpl, null, 2);
}

/** Parse + minimally validate a saved template. Returns `null` on bad input. */
export function parseTemplate(text: string): FreeformStructure | null {
  try {
    const o = JSON.parse(text) as Partial<FreeformStructure>;
    if (o && o.kind === 'freeform' && typeof o.width === 'number' && Array.isArray(o.elements)) {
      return o as FreeformStructure;
    }
  } catch {
    /* fall through */
  }
  return null;
}

/** A short human label for an element, shown in the layers list. */
export function elementLabel(el: CardElement): string {
  if (el.label) return el.label;
  if (el.type === 'text') return el.bind ? `text · {${el.bind}}` : `text · "${el.text ?? ''}"`;
  if (el.type === 'image') return el.bind ? `image · {${el.bind}}` : 'image';
  return el.type;
}

/** A fresh element of the requested kind, placed near the card's top-left. */
export function newElement(type: ElementType, id: string): CardElement {
  switch (type) {
    case 'text':
      return { id, type: 'text', x: 16, y: 16, text: 'Text', fontSize: 14, fontWeight: 400, colorRole: 'foreground' };
    case 'rect':
      return { id, type: 'rect', x: 16, y: 16, width: 60, height: 24, fillRole: 'accent' };
    case 'circle':
      return { id, type: 'circle', x: 30, y: 30, radius: 16, fillRole: 'accent' };
    case 'line':
      return { id, type: 'line', x: 16, y: 40, x2: 160, y2: 40, colorRole: 'divider', strokeWidth: 1 };
    case 'image':
      return { id, type: 'image', x: 16, y: 16, size: 40, shape: 'circle' };
    default:
      return { id, type: 'text', x: 16, y: 16, text: 'Text' };
  }
}
