import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { bubbleSetsLayerFields } from './fields';
import type { BubbleSetsLayerFields, BubbleSetsLayerFormState } from './types';

export interface BubbleSetsLayerEditorProps {
  /**
   * Initial field values, loaded once on mount. Seed from a layer's options
   * with the exported `optionsToForm`. Remount (via `key`) to reload.
   */
  defaults?: BubbleSetsLayerFields;
  /**
   * The form schema — a static `FieldConfig[]` or a function of the current
   * values (the default hides `chaikinIterations` unless Chaikin smoothing is
   * selected). Defaults to {@link bubbleSetsLayerFields}.
   */
  fields?: FieldConfig[] | ((values: BubbleSetsLayerFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back with `formToOptions` and
   * apply via `layer.setOptions` (or wherever). The component does none of that.
   */
  onSubmit: (values: BubbleSetsLayerFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `BubbleSetsLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
export function BubbleSetsLayerEditor({
  defaults = {},
  fields = bubbleSetsLayerFields,
  onSubmit,
  submitLabel = 'Apply',
}: BubbleSetsLayerEditorProps) {
  const form = useForm<BubbleSetsLayerFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function (drives
  // the `chaikinIterations` input off the watched `smoothness`).
  const values = useWatch({ control, name: 'options' }) as BubbleSetsLayerFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

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
