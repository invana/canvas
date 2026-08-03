import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { colorByFields } from './fields';
import type { ColorByFields, ColorByFormState } from './types';

export interface ColorByEditorPanelProps {
  /**
   * Initial field values, loaded into the form once on mount. Seed it from a
   * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
   * to reload.
   */
  defaults?: ColorByFields;
  /**
   * The form schema. Either a static `FieldConfig[]` or a function of the
   * current values. Defaults to {@link colorByFields}, which **is** a function
   * of the values — the mode / scale selection drives which fields render.
   */
  fields?: FieldConfig[] | ((values: ColorByFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back to an options patch with
   * `formToOptions` and apply it however you like (`behaviour.setOptions`, an
   * undo stack, …). The component does none of that.
   */
  onSubmit: (values: ColorByFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `ColorByBehaviour`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ColorByBehaviourOptions ⇄
 * form-fields` mapping (`optionsToForm` / `formToOptions`) is the consumer's
 * plug-in.
 *
 * The default schema is **mode-driven**: switching Mode between Categorical and
 * Range, or changing Scale, swaps the field set live off a `useWatch`. Values
 * for the mode you aren't on are kept in form state rather than cleared, which
 * mirrors the behaviour's own "options outside their mode are ignored, not
 * errors" rule — so toggling back and forth doesn't destroy your settings.
 */
export function ColorByEditorPanel({
  defaults = {},
  fields = colorByFields,
  onSubmit,
  submitLabel = 'Apply',
}: ColorByEditorPanelProps) {
  const form = useForm<ColorByFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function — this is
  // what makes the mode / scale switch swap the visible field set.
  const values = useWatch({ control, name: 'options' }) as ColorByFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

  // Widen at the boundary — RHF's typed Control isn't assignable to ObjectField's
  // `Control<any>` (the field-name union is contravariant).
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-3 p-4">
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="options" fields={resolvedFields} />
        <div className="flex justify-end">
          <Button onClick={() => onSubmit(getValues('options'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
