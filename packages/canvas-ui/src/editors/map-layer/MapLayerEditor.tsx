import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { mapLayerFields } from './fields';
import type { MapLayerFields, MapLayerFormState } from './types';

export interface MapLayerEditorProps {
  /**
   * Initial field values, loaded once on mount. Seed from a layer's options
   * with the exported `optionsToForm`. Remount (via `key`) to reload.
   */
  defaults?: MapLayerFields;
  /**
   * The form schema — a static `FieldConfig[]` or a function of the current
   * values. Defaults to {@link mapLayerFields}.
   */
  fields?: FieldConfig[] | ((values: MapLayerFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back with `formToOptions` and
   * apply via `layer.setOptions` (or wherever). The component does none of that.
   */
  onSubmit: (values: MapLayerFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `MapLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the grouped
 * schema (each `group` an accordion section) with `@invana/forms`, and hands
 * the current values to `onSubmit`. Holds no engine reference and does no
 * commit — `optionsToForm` / `formToOptions` are the consumer's plug-in.
 */
export function MapLayerEditor({
  defaults = {},
  fields = mapLayerFields,
  onSubmit,
  submitLabel = 'Apply',
}: MapLayerEditorProps) {
  const form = useForm<MapLayerFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function.
  const values = useWatch({ control, name: 'options' }) as MapLayerFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <FormField.ObjectField control={c} name="options" fields={resolvedFields} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(getValues('options'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
