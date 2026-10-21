/**
 * The schema board's presets — the config `<SchemaBoard>` mounts on and its
 * three Detail levels. They name no schema and no type: every type binds
 * through the `*` node type, a frame washes in its record's `data.hue`, and a
 * type's card, dot and icon wear its own `data.hue` — slots of the theme's
 * categorical ramp, so the whole board follows the theme.
 *
 * | Level | A type is drawn as | Structure |
 * |---|---|---|
 * | `high` | an icon circle ringed in its hue | `labelDot` |
 * | `medium` | a card: icon, name, frame, description, key, badge | `labelCard` |
 * | `low` | its schema card, one row per property | `schema:<type>` from `schemaCardStructure` |
 */

import type { CanvasConfig } from '@invana/canvas';
import type { DetailTemplates } from './detailTemplates';

/** `node.type` of a frame — a group holding its types through `parentId`. */
export const SCHEMA_FRAME_TYPE = 'schema.frame';
/**
 * `node.type` of a frame with no types drawn — a sized frame, not a group,
 * because ELK sizes a group from its members and reserves nothing for none.
 */
export const SCHEMA_FRAME_EMPTY_TYPE = 'schema.frame.empty';
/** The node type every type without a binding of its own takes. */
export const SCHEMA_WILDCARD = '*';
/** The layer id the board draws on. */
export const SCHEMA_LAYER = 'graph';

/** The Detail levels {@link SCHEMA_DETAIL} ships. */
export type SchemaDetailLevel = 'high' | 'medium' | 'low';

const HUE = { bind: 'data.hue', categorical: true } as const;

const frameLabel = { fontSize: 13, fontWeight: 700, colorRole: 'heading', placement: 'inside-center' } as const;
const frameStyling = (name: string) => ({
  name,
  fillRole: 'muted',
  fillLookup: HUE,
  fillAlpha: 0.1,
  strokeRole: 'stroke',
  strokeLookup: HUE,
  strokeAlpha: 0.6,
  strokeWidth: 1.5,
  label: frameLabel,
});
const frameGroup = (padding: number) => ({ autoFit: true, padding, headerHeight: 28, tabSkew: 12, showToggle: false });

/** The config `<SchemaBoard>` mounts on, Detail `medium` merged in by the board. */
export const SCHEMA_BOARD_CONFIG = {
  activeLayout: 'elk',
  fitOnLoad: false,
  layers: {
    background: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.7 },
    [SCHEMA_LAYER]: {
      nodeStructureTemplates: {
        frame: {
          name: 'frame',
          kind: 'simple',
          shape: { kind: 'tabbed-rect', width: 220, height: 80, tabWidth: 120, tabHeight: 28, cornerRadius: 10 },
          slots: { label: true },
        },
        labelDot: {
          name: 'labelDot',
          kind: 'freeform',
          width: 60,
          height: 60,
          frame: { kind: 'ellipse' },
          bgRole: 'cardBg',
          strokeLookup: HUE,
          strokeWidth: 3,
          elements: [
            { id: 'icon', type: 'icon', x: 16, y: 16, size: 28, bind: 'data.icon', colorLookup: HUE, strokeWidth: 2 },
            {
              id: 'name',
              type: 'text',
              x: 30,
              y: 54,
              bind: 'data.label',
              anchor: 'center',
              fontSize: 12,
              fontWeight: 600,
              colorRole: 'heading',
              maxWidth: 140,
            },
          ],
        },
        labelCard: {
          name: 'labelCard',
          kind: 'freeform',
          width: 264,
          height: 116,
          cornerRadius: 10,
          bgRole: 'cardBg',
          strokeRole: 'stroke',
          strokeWidth: 1,
          elements: [
            { id: 'tile', type: 'rect', x: 14, y: 14, width: 36, height: 36, cornerRadius: 8, fillLookup: HUE, fillAlpha: 0.16 },
            { id: 'icon', type: 'icon', x: 22, y: 22, size: 20, bind: 'data.icon', colorLookup: HUE, strokeWidth: 2 },
            { id: 'name', type: 'text', x: 60, y: 0, bind: 'data.label', fontSize: 15, fontWeight: 700, colorRole: 'heading', maxWidth: 190 },
            {
              id: 'frame',
              type: 'text',
              x: 60,
              y: 26,
              bind: 'data.frame',
              requires: 'data.frame',
              fontSize: 10,
              fontWeight: 600,
              uppercase: true,
              colorLookup: HUE,
              maxWidth: 190,
            },
            {
              id: 'description',
              type: 'text',
              x: 14,
              y: 51,
              bind: 'data.description',
              fontSize: 11,
              colorRole: 'foreground',
              maxWidth: 236,
              maxLines: 2,
              lineHeight: 15,
            },
            {
              id: 'footer',
              type: 'text',
              x: 14,
              y: 87,
              text: '{data.propertyCount} properties · key {data.identity}',
              requires: 'data.identity',
              fontSize: 10,
              colorRole: 'muted',
              maxWidth: 176,
            },
            {
              id: 'badge-chip',
              type: 'rect',
              x: 186,
              y: 93,
              width: 64,
              height: 17,
              cornerRadius: 8,
              fill: 0xe11d48,
              fillAlpha: 0.14,
              requires: 'data.badge',
            },
            {
              id: 'badge-text',
              type: 'text',
              x: 218,
              y: 88,
              bind: 'data.badge',
              requires: 'data.badge',
              anchor: 'center',
              fontSize: 9,
              fontWeight: 700,
              color: 0xe11d48,
            },
          ],
        },
      },
      nodeStylingTemplates: {
        frame: { ...frameStyling('frame'), group: frameGroup(30) },
        frameEmpty: frameStyling('frameEmpty'),
        label: { name: 'label' },
      },
      nodeTypes: {
        [SCHEMA_FRAME_TYPE]: { structure: 'frame', styling: 'frame', bindings: { label: 'data.name' } },
        [SCHEMA_FRAME_EMPTY_TYPE]: { structure: 'frame', styling: 'frameEmpty', bindings: { label: 'data.name' } },
        [SCHEMA_WILDCARD]: { structure: 'labelCard', styling: 'label', bindings: {} },
      },
      edge: { style: { strokeWidth: 1.5, strokeAlpha: 0.85, arrowTargetShape: 'triangle', arrowTargetSize: 6 } },
    },
  },
  layouts: {
    elk: {
      algorithm: 'layered',
      direction: 'RIGHT',
      padding: 40,
      defaultNodeSize: { width: 264, height: 116 },
      nodeSpacing: 90,
      layerSpacing: 200,
    },
  },
  behaviours: {
    hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
    pan: { enabled: true },
    wheel: { enabled: true },
    'drag-node': { enabled: true },
    'click-select': { enabled: true, multiple: true },
    'collapse-expand': { enabled: true, relayoutOnToggle: true, countBadge: true },
    'label-resolution': { enabled: true },
    'text-lod': { enabled: true, minZoom: 0.3 },
    theme: { enabled: true, mode: 'system', active: 'default', accent: 'css-var' },
  },
} as unknown as CanvasConfig;

/** One level's patch: the frame padding and ELK spacing its node size needs, and the type structure. */
const level = (
  structure: string,
  padding: number,
  size: { width: number; height: number },
  nodeSpacing: number,
  layerSpacing: number,
): Partial<CanvasConfig> =>
  ({
    layers: {
      [SCHEMA_LAYER]: {
        // A styling template is replaced whole on update, so a level carries all of it.
        nodeStylingTemplates: { frame: { ...frameStyling('frame'), group: frameGroup(padding) } },
        nodeTypes: { [SCHEMA_WILDCARD]: { structure, styling: 'label', bindings: {} } },
      },
    },
    layouts: { elk: { defaultNodeSize: size, nodeSpacing, layerSpacing } },
  }) as unknown as Partial<CanvasConfig>;

/** The three Detail levels — circles, cards, schema cards. */
export const SCHEMA_DETAIL: DetailTemplates<SchemaDetailLevel> = {
  templates: {
    high: level('labelDot', 28, { width: 60, height: 84 }, 80, 120),
    medium: level('labelCard', 30, { width: 264, height: 116 }, 90, 200),
    low: level('schema:*', 32, { width: 300, height: 240 }, 110, 240),
  },
  options: { high: 'High — circles', medium: 'Medium — cards', low: 'Low — schema cards' },
  initial: 'medium',
};
