import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { elkLayoutFields } from './fields';
import type { ElkLayoutFields, ElkLayoutFormState } from './types';

export interface ElkLayoutEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Seed it from a
   * layout's options with the exported `optionsToForm`. Remount (via `key`)
   * to reload.
   */
  defaults?: ElkLayoutFields;
  /**
   * The form schema. Either a static `FieldConfig[]` or a function of the
   * current values (the default form varies `layerSpacing` with the selected
   * `algorithm`). Defaults to {@link elkLayoutFields}.
   */
  fields?: FieldConfig[] | ((values: ElkLayoutFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back to an options patch with
   * `formToOptions` and apply it however you like (`layout.setOptions`, a layout
   * re-run, an undo stack, …). The component does none of that.
   */
  onSubmit: (values: ElkLayoutFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `ElkLayout`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `ElkLayoutOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
export function ElkLayoutEditor({
  defaults = {},
  fields = elkLayoutFields,
  onSubmit,
  submitLabel = 'Apply',
}: ElkLayoutEditorProps) {
  const form = useForm<ElkLayoutFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function (drives
  // the `layerSpacing` input off the watched `algorithm`).
  const values = useWatch({ control, name: 'options' }) as ElkLayoutFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

  // Widen at the boundary — RHF's typed Control isn't assignable to ObjectField's
  // `Control<any>` (the field-name union is contravariant).
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <FormField.ObjectField control={c} columns={1} name="options" fields={resolvedFields} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(getValues('options'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
