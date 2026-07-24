import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the DragShapeBehaviour editor. Field `name`s
 * match the keys of `DragShapeFields` 1:1 so the generator's `options.<name>`
 * paths line up with `mapping.ts`. The `renderer` handle and `filter` predicate
 * are not surfaced here (non-serialisable).
 */
export const dragShapeFields: FieldConfig[] = [
  {
    name: 'reRouteConnectors',
    type: 'boolean',
    label: 'Re-route connectors',
    description: 'Recompute every connector after each move. Needed for obstacle-aware routers.',
  },
  {
    name: 'dragCursor',
    type: 'text',
    label: 'Drag cursor',
    description: "CSS cursor shown while dragging a shape. Default 'grabbing'.",
  },
];
