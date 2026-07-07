import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { backgroundLayerFields } from './fields';
import type { BackgroundLayerFields, BackgroundLayerFormState } from './types';

export interface BackgroundLayerEditorProps {
  /**
   * Initial field values, loaded once on mount. Seed from a layer's options
   * with the exported `optionsToForm`. Remount (via `key`) to reload.
   */
  defaults?: BackgroundLayerFields;
  /**
   * The form schema — a static `FieldConfig[]` or a function of the current
   * values (the default hides the Pattern section for a solid fill). Defaults to
   * {@link backgroundLayerFields}.
   */
  fields?: FieldConfig[] | ((values: BackgroundLayerFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back with `formToOptions` and
   * apply via `layer.setOptions` (or wherever). The component does none of that.
   */
  onSubmit: (values: BackgroundLayerFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `BackgroundLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
export function BackgroundLayerEditor({
  defaults = {},
  fields = backgroundLayerFields,
  onSubmit,
  submitLabel = 'Apply',
}: BackgroundLayerEditorProps) {
  const form = useForm<BackgroundLayerFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function (drives
  // the Pattern section off the watched `type`).
  const values = useWatch({ control, name: 'options' }) as BackgroundLayerFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

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
