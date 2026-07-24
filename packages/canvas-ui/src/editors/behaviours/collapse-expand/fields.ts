import type { FieldConfig } from '@invana/forms';

/**
 * `@invana/forms` field schema for the CollapseExpandBehaviour editor.
 *
 * **Empty** — `CollapseExpandBehaviourOptions` carries only the base fields
 * (`id` / `targetLayerId` / `enabled` / `shortcuts`), none of which are editable
 * visualisation state. The editor is shipped for symmetry (rule 12); add
 * `FieldConfig` entries here if the behaviour gains serialisable options.
 */
export const collapseExpandFields: FieldConfig[] = [];
