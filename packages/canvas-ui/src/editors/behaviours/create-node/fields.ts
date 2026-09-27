import type { FieldConfig } from '@invana/forms';

import { modesField } from '../../_shared/modes';

/**
 * `@invana/forms` field schema for the CreateNodeBehaviour editor. Only the base
 * `modes` gate — `CreateNodeBehaviour`'s own options are the `createNode` /
 * `onNodeCreate` callbacks, which aren't serialisable.
 */
export const createNodeFields: FieldConfig[] = [modesField()];
