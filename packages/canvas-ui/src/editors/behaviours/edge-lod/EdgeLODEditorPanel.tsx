import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import { FormProvider, useForm, type Control, type FieldValues } from 'react-hook-form';

import { edgeLODFields } from './fields';
import type { EdgeLODFields, EdgeLODFormState } from './types';

export interface EdgeLODEditorPanelProps {
  /** Initial field values (seed with `optionsToForm`). Remount via `key` to reload. */
  defaults?: EdgeLODFields;
  /** The form schema. Defaults to {@link edgeLODFields}. */
  fields?: FieldConfig[];
  /** Called with the current values on submit; map back with `formToOptions`. */
  onSubmit: (values: EdgeLODFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `EdgeLODBehaviour` (thin
 * edges below a zoom threshold). Owns a react-hook-form instance seeded by
 * `defaults`, renders the schema, and hands values to `onSubmit`. No engine
 * reference, no commit — the `options ⇄ form-fields` mapping is the consumer's.
 */
export function EdgeLODEditorPanel({
  defaults = {},
  fields = edgeLODFields,
  onSubmit,
  submitLabel = 'Apply',
}: EdgeLODEditorPanelProps) {
  const form = useForm<EdgeLODFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-3 p-4">
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="options" fields={fields} />
        <div className="flex justify-end">
          <Button onClick={() => onSubmit(getValues('options'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
