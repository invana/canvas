import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { densityContourStrokeLayerFields } from './fields';
import type {
  DensityContourStrokeLayerFields,
  DensityContourStrokeLayerFormState,
} from './types';

export interface DensityContourStrokeLayerEditorProps {
  /**
   * Initial field values, loaded once on mount. Seed from a layer's options
   * with the exported `optionsToForm`. Remount (via `key`) to reload.
   */
  defaults?: DensityContourStrokeLayerFields;
  /**
   * The form schema — a static `FieldConfig[]` or a function of the current
   * values (the default swaps the palette / swatch inputs on the
   * `strokePalette` toggle). Defaults to {@link densityContourStrokeLayerFields}.
   */
  fields?:
    | FieldConfig[]
    | ((values: DensityContourStrokeLayerFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back with `formToOptions` and
   * apply via `layer.setOptions` (or wherever). The component does none of that.
   */
  onSubmit: (values: DensityContourStrokeLayerFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `DensityContourStrokeLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
export function DensityContourStrokeLayerEditor({
  defaults = {},
  fields = densityContourStrokeLayerFields,
  onSubmit,
  submitLabel = 'Apply',
}: DensityContourStrokeLayerEditorProps) {
  const form = useForm<DensityContourStrokeLayerFormState>({
    defaultValues: { options: defaults },
  });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function (drives
  // the palette / swatch swap off the watched `strokePalette` toggle).
  const values = useWatch({ control, name: 'options' }) as
    | DensityContourStrokeLayerFields
    | undefined;
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
