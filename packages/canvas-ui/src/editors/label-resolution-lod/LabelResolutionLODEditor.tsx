import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { labelResolutionLodFields } from './fields';
import type { LabelResolutionLODFields, LabelResolutionLODFormState } from './types';

export interface LabelResolutionLODEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Seed it from a
   * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
   * to reload.
   */
  defaults?: LabelResolutionLODFields;
  /**
   * The form schema. Either a static `FieldConfig[]` or a function of the
   * current values. Defaults to {@link labelResolutionLodFields}.
   */
  fields?: FieldConfig[] | ((values: LabelResolutionLODFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back to an options patch with
   * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
   * undo stack, …). The component does none of that.
   */
  onSubmit: (values: LabelResolutionLODFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `LabelResolutionLODBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `LabelResolutionLODBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
export function LabelResolutionLODEditor({
  defaults = {},
  fields = labelResolutionLodFields,
  onSubmit,
  submitLabel = 'Apply',
}: LabelResolutionLODEditorProps) {
  const form = useForm<LabelResolutionLODFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function.
  const values = useWatch({ control, name: 'options' }) as LabelResolutionLODFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

  // Widen at the boundary — RHF's typed Control isn't assignable to ObjectField's
  // `Control<any>` (the field-name union is contravariant).
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="options" fields={resolvedFields} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(getValues('options'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
