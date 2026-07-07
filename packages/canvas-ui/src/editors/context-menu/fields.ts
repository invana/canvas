import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the ContextMenuBehaviour editor. The engine's
 * `targets` array is exposed as three boolean toggles (one per target kind); the
 * `state` name renders as a text input. Field `name`s match
 * {@link import('./types').ContextMenuFields} 1:1 so the `options.<name>` paths
 * line up with `mapping.ts`.
 */
export const contextMenuFields: FieldConfig[] = [
  {
    name: 'targetNode',
    type: 'boolean',
    label: 'On nodes',
    description: 'Fire the context-menu callback when a node is right-clicked.',
  },
  {
    name: 'targetEdge',
    type: 'boolean',
    label: 'On edges',
    description: 'Fire the context-menu callback when an edge is right-clicked.',
  },
  {
    name: 'targetCanvas',
    type: 'boolean',
    label: 'On empty canvas',
    description: 'Fire the context-menu callback when empty canvas is right-clicked.',
  },
  {
    name: 'state',
    type: 'text',
    label: 'Transient state',
    description: 'State name applied to the right-clicked element (e.g. "context-open"). Blank = none.',
  },
];
