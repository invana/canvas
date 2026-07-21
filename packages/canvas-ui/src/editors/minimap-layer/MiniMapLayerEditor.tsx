import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { miniMapLayerFields } from './fields';
import type { MiniMapLayerFields, MiniMapLayerFormState } from './types';

export interface MiniMapLayerEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Seed it from a
   * layer's options with the exported `optionsToForm`. Remount (via `key`) to
   * reload.
   */
  defaults?: MiniMapLayerFields;
  /**
   * The form schema. Either a static `FieldConfig[]` or a function of the
   * current values. Defaults to {@link miniMapLayerFields}.
   */
  fields?: FieldConfig[] | ((values: MiniMapLayerFields) => FieldConfig[]);
  /**
   * Called with the current values on submit. Map back to an options patch with
   * `formToOptions` and apply it however you like (`layer.setOptions`, an undo
   * stack, …). The component does none of that.
   */
  onSubmit: (values: MiniMapLayerFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `MiniMapLayer`.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. It holds no
 * engine reference and does no commit — the `MiniMapLayerOptions ⇄ form-fields`
 * mapping (`optionsToForm` / `formToOptions`) is the consumer's plug-in.
 */
export function MiniMapLayerEditor({
  defaults = {},
  fields = miniMapLayerFields,
  onSubmit,
  submitLabel = 'Apply',
}: MiniMapLayerEditorProps) {
  const form = useForm<MiniMapLayerFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function.
  const values = useWatch({ control, name: 'options' }) as MiniMapLayerFields | undefined;
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
