/**
 * Built-in node structure + styling templates. Consumers can supply their own
 * via `GraphLayerOptions.nodeStructureTemplates` / `nodeStylingTemplates`; these
 * are merged under any same-named overrides so a graph has sensible defaults.
 *
 * Simple structures cover the six shape kinds (each a full label surface); the
 * one built-in card is `idCard` (type tag · divider · avatar + title/subtitle).
 */

import type {
  NodeStructureRegistry,
  NodeStylingRegistry,
  SimpleStructure,
  CardStructure,
} from './types';

const circle: SimpleStructure = {
  name: 'circle',
  kind: 'simple',
  shape: { kind: 'circle', radius: 10 },
  slots: { label: true },
};

const rect: SimpleStructure = {
  name: 'rect',
  kind: 'simple',
  shape: { kind: 'rect', width: 28, height: 28, cornerRadius: 4 },
  slots: { label: true },
};

const arc: SimpleStructure = {
  name: 'arc',
  kind: 'simple',
  shape: { kind: 'arc', innerR: 6, outerR: 12, startAngle: 0, endAngle: Math.PI * 1.5 },
  slots: { label: true },
};

const regularPolygon: SimpleStructure = {
  name: 'regular-polygon',
  kind: 'simple',
  shape: { kind: 'regular-polygon', sides: 6, radius: 12 },
  slots: { label: true },
};

const star: SimpleStructure = {
  name: 'star',
  kind: 'simple',
  shape: { kind: 'star', points: 5, innerRadius: 5, outerRadius: 12 },
  slots: { label: true },
};

const polygon: SimpleStructure = {
  name: 'polygon',
  kind: 'simple',
  shape: {
    kind: 'polygon',
    vertices: [
      { x: 0, y: -12 },
      { x: 12, y: 0 },
      { x: 0, y: 12 },
      { x: -12, y: 0 },
    ],
  },
  slots: { label: true },
};

/** Identity card: a type tag, a divider, then an avatar beside title + subtitle. */
const idCard: CardStructure = {
  name: 'idCard',
  kind: 'card',
  width: 220,
  height: 96,
  rows: [
    { slots: [{ slot: 'type', kind: 'tag' }] },
    { divider: true },
    {
      slots: [
        { slot: 'avatar', kind: 'image', shape: 'circle', size: 40 },
        { stack: [{ slot: 'title', kind: 'text' }, { slot: 'subtitle', kind: 'text' }] },
      ],
    },
  ],
};

/** All built-in structures, keyed by name. */
export const BUILT_IN_STRUCTURES: NodeStructureRegistry = {
  circle,
  rect,
  arc,
  'regular-polygon': regularPolygon,
  star,
  polygon,
  idCard,
};

/** Built-in stylings paired with the built-in structures (theme-role based). */
export const BUILT_IN_STYLINGS: NodeStylingRegistry = {
  circle: {
    name: 'circle',
    fillRole: 'accent',
    strokeRole: 'stroke',
    label: { colorRole: 'foreground', fontSize: 12, placement: 'bottom' },
  },
  idCard: {
    name: 'idCard',
    bgRole: 'cardBg',
    accentRole: 'accent',
    slots: {
      type: { colorRole: 'muted', fontSize: 10, fontWeight: 600, uppercase: true },
      title: { colorRole: 'heading', fontSize: 15, fontWeight: 700 },
      subtitle: { colorRole: 'muted', fontSize: 12 },
      divider: { colorRole: 'divider' },
    },
  },
};
