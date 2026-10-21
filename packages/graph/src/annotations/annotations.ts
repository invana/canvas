/**
 * **Annotations drawn in the graph** — the reserved vocabulary a board uses to
 * put what people noted on its records *into* the graph, so layouts place the
 * cards, the theme colours them and an export carries them.
 *
 * | Element | Type | What it is |
 * |---|---|---|
 * | card | {@link ANNOTATION_NODE_TYPE} · {@link ANNOTATION_VALUE_TYPE} | a note, or a value with its line, beside its record |
 * | count | {@link ANNOTATION_COUNT_TYPE} | a record's annotations as one pill, when the board shows badges |
 * | link | {@link ANNOTATION_EDGE_TYPE} | the dashed line from a card to its record |
 *
 * A group annotation is not an element: it is a frame a `GroupFramesLayer`
 * paints round its records.
 *
 * They are presentation, never data: {@link isAnnotationElement} is the one
 * guard every reader of "all nodes" uses — edit ops, the unsaved tracker,
 * legends, counts, export — and they are written as {@link ANNOTATION_ACTOR},
 * which the unsaved tracker counts as saved. {@link ANNOTATION_TYPES} is the
 * list a layer's `exportSkipTypes` takes, so a saved state never carries them.
 *
 * {@link annotationTemplates} is the structure / styling / binding set a layer
 * takes (`layer.setOptions(annotationTemplates(colors))`), drawn in the colours
 * the host resolves from its theme — call it again on a theme change.
 */

import type { FreeformStructure, NodeStructureRegistry, NodeStylingRegistry, NodeTypeRegistry, ValueLookup, TemplateColor } from '../template/types';

/** A note, drawn as a card beside its record. */
export const ANNOTATION_NODE_TYPE = 'annotation';
/** A value annotation — a card with the value's line. */
export const ANNOTATION_VALUE_TYPE = 'annotation.value';
/** A record's annotations as one count pill. */
export const ANNOTATION_COUNT_TYPE = 'annotation.count';
/** The dashed link from a card to its record. */
export const ANNOTATION_EDGE_TYPE = 'annotates';
/** The actor annotation elements are written as — counted as saved. */
export const ANNOTATION_ACTOR = 'annotations';

/** An annotation's colour, by name. */
export type AnnotationColorName = 'amber' | 'blue' | 'green' | 'red' | 'grey';

/** Every node and edge type an annotation is drawn as. */
export const ANNOTATION_TYPES: readonly string[] = [ANNOTATION_NODE_TYPE, ANNOTATION_VALUE_TYPE, ANNOTATION_COUNT_TYPE, ANNOTATION_EDGE_TYPE];

/** True for a node or edge the board drew for an annotation — never a record. */
export function isAnnotationElement(el: { type?: string | undefined } | undefined | null): boolean {
  const t = el?.type;
  return t === ANNOTATION_NODE_TYPE || t === ANNOTATION_VALUE_TYPE || t === ANNOTATION_COUNT_TYPE || t === ANNOTATION_EDGE_TYPE;
}

/** The records among `elements` — every annotation element left out. */
export function recordsOnly<T extends { type?: string | undefined }>(elements: Iterable<T>): T[] {
  const out: T[] = [];
  for (const el of elements) if (!isAnnotationElement(el)) out.push(el);
  return out;
}

/**
 * What a card node's `data` holds. The board writes it from the annotation;
 * nothing here is the record's.
 */
export interface AnnotationCardData {
  text: string;
  color: AnnotationColorName;
  /** The author's name and initials. */
  author: string;
  initials: string;
  /** Beside the author — `2 Oct`, `Answer 1`. */
  meta?: string;
  /** A value annotation's line — `on_time 64% · was 71%`. */
  valueLine?: string;
}


/** The card's width; its height is {@link ANNOTATION_CARD_HEIGHT} or, with a value line, {@link ANNOTATION_VALUE_CARD_HEIGHT}. */
export const ANNOTATION_CARD_WIDTH = 224;
export const ANNOTATION_CARD_HEIGHT = 92;
export const ANNOTATION_VALUE_CARD_HEIGHT = 112;

function card(name: string, withValue: boolean, COLOR: ValueLookup<TemplateColor>): FreeformStructure {
  const height = withValue ? ANNOTATION_VALUE_CARD_HEIGHT : ANNOTATION_CARD_HEIGHT;
  // Freeform text `y` is the line box's top less its leading — these keep the lines inside the card.
  const bodyY = withValue ? 32 : 14;
  return {
    name,
    kind: 'freeform',
    width: ANNOTATION_CARD_WIDTH,
    height,
    cornerRadius: 6,
    bgRole: 'cardBg',
    strokeLookup: COLOR,
    strokeWidth: 1,
    elements: [
      { id: 'strip', type: 'rect', x: 0, y: 0, width: 4, height, fillLookup: COLOR },
      { id: 'disc', type: 'rect', x: 12, y: 8, width: 18, height: 18, cornerRadius: 9, fillLookup: COLOR, fillAlpha: 0.2 },
      { id: 'initials', type: 'text', x: 21, y: 1, bind: 'data.initials', anchor: 'center', fontSize: 8, fontWeight: 700, colorLookup: COLOR },
      { id: 'author', type: 'text', x: 36, y: -2, bind: 'data.author', fontSize: 11, fontWeight: 600, colorRole: 'heading', maxWidth: 110 },
      { id: 'meta', type: 'text', x: ANNOTATION_CARD_WIDTH - 10, y: -1, bind: 'data.meta', requires: 'data.meta', anchor: 'right', fontSize: 10, colorRole: 'muted', maxWidth: 70 },
      ...(withValue
        ? [
            {
              id: 'value',
              type: 'text' as const,
              x: 12,
              y: 12,
              bind: 'data.valueLine',
              fontSize: 11,
              fontWeight: 600,
              colorLookup: COLOR,
              maxWidth: ANNOTATION_CARD_WIDTH - 24,
            },
          ]
        : []),
      {
        id: 'text',
        type: 'text',
        x: 12,
        y: bodyY,
        bind: 'data.text',
        fontSize: 12,
        colorRole: 'foreground',
        maxWidth: ANNOTATION_CARD_WIDTH - 24,
        maxLines: 3,
        lineHeight: 16,
      },
    ],
  };
}

/** A record's annotations as one pill: `3`. */
const countPill = (COLOR: ValueLookup<TemplateColor>): FreeformStructure => ({
  name: 'annotation.count',
  kind: 'freeform',
  width: 28,
  height: 20,
  cornerRadius: 10,
  bgRole: 'cardBg',
  strokeLookup: COLOR,
  strokeWidth: 1.5,
  elements: [{ id: 'count', type: 'text', x: 14, y: -6, bind: 'data.count', anchor: 'center', fontSize: 11, fontWeight: 700, colorLookup: COLOR }],
});

/**
 * The templates a layer takes to draw annotation elements, in `colors` — merge
 * them with `layer.setOptions(annotationTemplates(colors))`.
 */
export function annotationTemplates(colors: Readonly<Record<AnnotationColorName, number>>): {
  nodeStructureTemplates: NodeStructureRegistry;
  nodeStylingTemplates: NodeStylingRegistry;
  nodeTypes: NodeTypeRegistry;
} {
  const COLOR: ValueLookup<TemplateColor> = { bind: 'data.color', map: { ...colors }, fallback: colors.grey };
  return {
    nodeStructureTemplates: {
      'annotation.card': card('annotation.card', false, COLOR),
      'annotation.valueCard': card('annotation.valueCard', true, COLOR),
      'annotation.count': countPill(COLOR),
    },
    nodeStylingTemplates: {
      'annotation.plain': { name: 'annotation.plain' },
    },
    nodeTypes: {
      [ANNOTATION_NODE_TYPE]: { structure: 'annotation.card', styling: 'annotation.plain', bindings: {} },
      [ANNOTATION_VALUE_TYPE]: { structure: 'annotation.valueCard', styling: 'annotation.plain', bindings: {} },
      [ANNOTATION_COUNT_TYPE]: { structure: 'annotation.count', styling: 'annotation.plain', bindings: {} },
    },
  };
}
