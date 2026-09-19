import { describe, expect, it } from 'vitest';

import type { CompositePart } from '@invana/canvas';

import { eventCard } from '../../../src/nodes/composite/eventCard';
import { idCard } from '../../../src/nodes/composite/idCard';
import { organisationCard, OrganisationCard } from '../../../src/nodes/composite/organisationCard';
import { productCard, ProductCard } from '../../../src/nodes/composite/productCard';
import { schemaTableCard } from '../../../src/nodes/composite/schemaTableCard';
import { chip, metaRow } from '../../../src/nodes/composite/shared';
import { statCard } from '../../../src/nodes/composite/statCard';
import { taskCard } from '../../../src/nodes/composite/taskCard';
import { userCard } from '../../../src/nodes/composite/userCard';
import type { CompositeShapeOption } from '../../../src/layer/types';

/**
 * Geometry invariants for the built-in composite node types. These are the
 * checks a story would catch by eye — a part escaping the card box, a zero-area
 * frame, an optional field leaving a gap — expressed so they fail in CI.
 */

/** The axis-aligned box a part occupies, in card-local coordinates. */
function bounds(p: CompositePart): { x1: number; y1: number; x2: number; y2: number } {
  switch (p.part) {
    case 'rect':
      return { x1: p.x, y1: p.y, x2: p.x + p.width, y2: p.y + p.height };
    case 'circle':
      return { x1: p.x - p.radius, y1: p.y - p.radius, x2: p.x + p.radius, y2: p.y + p.radius };
    case 'line':
      return { x1: Math.min(p.x, p.x2), y1: Math.min(p.y, p.y2), x2: Math.max(p.x, p.x2), y2: Math.max(p.y, p.y2) };
    case 'icon':
      return { x1: p.x, y1: p.y, x2: p.x + p.size, y2: p.y + p.size };
    case 'label':
      // Labels are measured by the renderer; only the anchor point is knowable here.
      return { x1: p.x, y1: p.y, x2: p.x, y2: p.y };
  }
}

/** Every geometric part lies inside the card box (labels: their anchor point). */
function expectPartsInsideFrame(card: CompositeShapeOption): void {
  for (const p of card.parts ?? []) {
    const b = bounds(p);
    expect(b.x1).toBeGreaterThanOrEqual(0);
    expect(b.y1).toBeGreaterThanOrEqual(0);
    expect(b.x2).toBeLessThanOrEqual(card.width);
    expect(b.y2).toBeLessThanOrEqual(card.height);
  }
}

/** Count the label parts whose text matches. */
function labelsWith(card: CompositeShapeOption, text: string): number {
  return (card.parts ?? []).filter((p) => p.part === 'label' && p.text === text).length;
}

/** The stock media-band height, asserted against rather than re-derived. */
const PRODUCT_MEDIA_HEIGHT = new ProductCard().spec.mediaHeight;

const FULL: Record<string, () => CompositeShapeOption> = {
  idCard: () => idCard({ name: 'Ada Lovelace', title: 'Principal Analyst', idNumber: 'ID 4471-2290', org: 'Analytical Engine Co', initials: 'AL', validUntil: 'Valid until 2027-01-31', status: 'active', accent: 0x6366f1 }),
  organisationCard: () => organisationCard({ name: 'CERN', kind: 'Research', monogram: 'C', location: 'Geneva, CH', headcount: '2,600 staff', founded: 'est. 1954', accent: 0x0ea5e9 }),
  productCard: () => productCard({ title: 'Mechanical Keyboard, 87-key', price: '$149.00', icon: 'lucide/keyboard', rating: 4.6, reviews: 128, stock: 'low', tags: [{ label: 'Wireless', color: 0x22c55e }], accent: 0xf59e0b }),
  eventCard: () => eventCard({ title: 'Graph Rendering Deep Dive', day: '14', month: 'SEP', time: '18:00 – 20:00', venue: 'Hall B, Bengaluru', attendees: '128 going', accent: 0xa855f7 }),
  userCard: () => userCard({ name: 'Grace Hopper', role: 'Rear Admiral', initials: 'GH', avatar: 0x3b82f6, status: 'online', email: 'grace@navy.mil', phone: '+1 555 0100' }),
  statCard: () => statCard({ label: 'Active nodes', value: '12,480', delta: '+8.2%', trend: 'up', icon: 'lucide/activity', accent: 0x22c55e }),
  taskCard: () => taskCard({ title: 'Split the renderer package', priority: 'high', tags: [{ label: 'infra', color: 0x3b82f6 }], assignee: { initials: 'RM', color: 0xf43f5e }, due: 'Sep 30' }),
  schemaTableCard: () => schemaTableCard({ label: 'users', icon: 'lucide/users', fields: [{ name: 'id', type: 'uuid' }, { name: 'created_at', type: 'timestamp' }] }),
};

describe('composite node types — frame', () => {
  for (const [name, build] of Object.entries(FULL)) {
    it(`${name} returns a positive-area box`, () => {
      const card = build();
      expect(card.kind).toBe('composite');
      expect(card.width).toBeGreaterThan(0);
      expect(card.height).toBeGreaterThan(0);
    });

    it(`${name} keeps every part inside its box`, () => {
      expectPartsInsideFrame(build());
    });
  }
});

describe('composite node types — optional fields leave no gap', () => {
  it('organisationCard shrinks when every meta field is absent', () => {
    const full = organisationCard({ name: 'CERN', monogram: 'C', location: 'Geneva, CH', headcount: '2,600 staff', founded: 'est. 1954', accent: 0x0ea5e9 });
    const bare = organisationCard({ name: 'CERN', monogram: 'C', accent: 0x0ea5e9 });
    expect(bare.height).toBeLessThan(full.height);
    expectPartsInsideFrame(bare);
  });

  it('organisationCard grows by exactly one row height per meta field', () => {
    const one = organisationCard({ name: 'CERN', location: 'Geneva, CH', accent: 0x0ea5e9 });
    const two = organisationCard({ name: 'CERN', location: 'Geneva, CH', headcount: '2,600 staff', accent: 0x0ea5e9 });
    expect(two.height - one.height).toBe(new OrganisationCard().spec.metaRowHeight);
  });

  it('eventCard shrinks when time, venue and attendees are absent', () => {
    const full = eventCard({ title: 'Deep Dive', day: '14', month: 'SEP', time: '18:00', venue: 'Hall B', attendees: '128 going', accent: 0xa855f7 });
    const bare = eventCard({ title: 'Deep Dive', day: '14', month: 'SEP', accent: 0xa855f7 });
    expect(bare.height).toBeLessThan(full.height);
    expectPartsInsideFrame(bare);
  });

  it('productCard drops the chip row when there is no stock or tag', () => {
    const tagged = productCard({ title: 'Keyboard', price: '$149.00', stock: 'in', accent: 0xf59e0b });
    const bare = productCard({ title: 'Keyboard', price: '$149.00', accent: 0xf59e0b });
    expect(tagged.height - bare.height).toBe(new ProductCard().spec.tagRowHeight);
    expectPartsInsideFrame(bare);
  });

  it('idCard omits the status pill and validity note when unset', () => {
    const bare = idCard({ name: 'Ada Lovelace', idNumber: 'ID 4471-2290', accent: 0x6366f1 });
    expect(labelsWith(bare, 'Active')).toBe(0);
    expectPartsInsideFrame(bare);
  });
});

describe('composite node types — spec drives geometry', () => {
  it('a wider spec widens the box and the parts follow', () => {
    const wide = new ProductCard({ width: 320 }).build({ title: 'Keyboard', price: '$149.00', icon: 'lucide/keyboard', accent: 0xf59e0b });
    expect(wide.width).toBe(320);
    expectPartsInsideFrame(wide);
  });

  it('hiding the media band shortens the card', () => {
    const data = { title: 'Keyboard', price: '$149.00', accent: 0xf59e0b } as const;
    const withBand = new ProductCard().build(data);
    const without = new ProductCard({ mediaHeight: 0 }).build(data);
    expect(without.height).toBe(withBand.height - PRODUCT_MEDIA_HEIGHT);
  });
});

describe('composite node types — wrapped labels align left', () => {
  // The renderer defaults an unset `align` to 'center'
  // (packages/renderer-pixijs/src/primitives/paint/labelContent.ts), which only
  // shows on a label that actually wraps. Every multi-line label must therefore
  // say `align: 'left'` out loud, or a two-line title silently centres.
  for (const [name, build] of Object.entries(FULL)) {
    it(`${name} declares align on every wrapping label`, () => {
      const wrapped = (build().parts ?? []).filter(
        (p) => p.part === 'label' && (p.maxLines ?? 1) > 1,
      );
      for (const p of wrapped) {
        expect(p.part === 'label' && p.align).toBe('left');
      }
    });
  }
});

describe('composite node types — box-centred text uses vAnchor', () => {
  // A label centred in a box (pill, table row, avatar disc) must say
  // `vAnchor: 'middle'` and put `y` on the box's centre line. The old idiom —
  // pre-offsetting y by (boxHeight - fontSize) / 2 — underestimates the line
  // box (ascent + descent + line gap) and lands the text low.
  // See docs/rfcs/fix/2026-09-19-composite-label-text-cannot-be-vertically-centred.md
  it('chip centres its label on the pill middle line', () => {
    const parts: CompositePart[] = [];
    const w = chip(parts, { x: 10, y: 100, text: 'In stock', color: 0x22c55e });
    expect(w).toBeGreaterThan(0);
    const rect = parts.find((p) => p.part === 'rect');
    const label = parts.find((p) => p.part === 'label');
    expect(rect?.part === 'rect' && rect.height).toBe(18);
    expect(label?.part === 'label' && label.vAnchor).toBe('middle');
    // Centre line of an 18px pill at y=100 — not 100 + (18 - fontSize) / 2.
    expect(label?.part === 'label' && label.y).toBe(109);
  });

  it('metaRow centres its text on the icon box middle line', () => {
    const parts: CompositePart[] = [];
    metaRow(parts, { x: 0, y: 40, width: 200, icon: 'lucide/map-pin', text: 'Geneva, CH', iconColor: 0x94a3b8, textColor: 0xcbd5e1 });
    const label = parts.find((p) => p.part === 'label');
    expect(label?.part === 'label' && label.vAnchor).toBe('middle');
    expect(label?.part === 'label' && label.y).toBe(47); // 40 + 14/2
  });

  it('no card pre-offsets a centred label by fontSize', () => {
    // Every anchor:'center' label is centring in a box, so it must pair with
    // vAnchor:'middle' — a horizontally centred label sitting at a box top is
    // the signature of the old guess.
    for (const [name, build] of Object.entries(FULL)) {
      const centred = (build().parts ?? []).filter((p) => p.part === 'label' && p.anchor === 'center');
      for (const p of centred) {
        expect(p.part === 'label' && p.vAnchor, `${name}: a centred label without vAnchor`).toBe('middle');
      }
    }
  });
});

describe('composite node types — chip corner radius', () => {
  /** The rounded rect a chip draws, found by its height. */
  const chipRect = (card: CompositeShapeOption, height = 18) =>
    (card.parts ?? []).find(
      (p): p is Extract<CompositePart, { part: 'rect' }> => p.part === 'rect' && p.height === height,
    );

  it('chip defaults to a full pill', () => {
    const parts: CompositePart[] = [];
    chip(parts, { x: 0, y: 0, text: 'In stock', color: 0x22c55e });
    const rect = parts.find((p) => p.part === 'rect');
    expect(rect?.part === 'rect' && rect.cornerRadius).toBe(9); // height 18 / 2
  });

  it('chip honours an explicit cornerRadius', () => {
    const parts: CompositePart[] = [];
    chip(parts, { x: 0, y: 0, text: 'In stock', color: 0x22c55e, cornerRadius: 3 });
    const rect = parts.find((p) => p.part === 'rect');
    expect(rect?.part === 'rect' && rect.cornerRadius).toBe(3);
  });

  it('a card spec restyles its chips without subclassing', () => {
    const data = { title: 'Keyboard', price: '$149.00', stock: 'in', accent: 0xf59e0b } as const;
    const squared = new ProductCard({ chipRadius: 3 }).build(data);
    expect(chipRect(squared)?.cornerRadius).toBe(3);
    // …and the stock default is still a pill.
    expect(chipRect(productCard(data))?.cornerRadius).toBe(9);
  });
});
