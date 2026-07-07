import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { brushSelectFields } from './fields';
import type { BrushSelectFields, BrushSelectFormState } from './types';

export interface BrushSelectEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Seed it from a
   * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
   * to reload.
   */
  defaults?: BrushSelectFields;
  /**
   * The form schema. Either a static `FieldConfig[]` or a function of the
   * current values. Defaults to {@link brushSelectFields}.
   */
  fields?: FieldConfig[] | ((values: BrushSelectFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back to an options patch with
   * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
   * undo stack, …). The component does none of that.
   */
  onSubmit: (values: BrushSelectFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `BrushSelectBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `BrushSelectBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
export function BrushSelectEditor({
  defaults = {},
  fields = brushSelectFields,
  onSubmit,
  submitLabel = 'Apply',
}: BrushSelectEditorProps) {
  const form = useForm<BrushSelectFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function.
  const values = useWatch({ control, name: 'options' }) as BrushSelectFields | undefined;
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
