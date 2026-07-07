import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { nodeStyleFields } from './fields';
import type { NodeStyleFields, NodeStyleFormState } from './types';

export interface NodeStyleEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Same shape the
   * form produces (see {@link NodeStyleFields}); seed it from an engine style
   * with the exported `styleToForm`. Remount (via `key`) to reload.
   */
  defaults?: NodeStyleFields;
  /**
   * The form schema. Either a static `FieldConfig[]` or a function of the
   * current values — the function form lets fields react to other fields (the
   * built-in default varies the geometry inputs with `shapeKind`). Defaults to
   * the built-in grouped NodeStyle field set ({@link nodeStyleFields}).
   */
  fields?: FieldConfig[] | ((values: NodeStyleFields) => FieldConfig[]);
  /**
   * Called with the current values when the user submits. This is where the
   * consumer puts its logic — map back to a style with `formToStyle` and apply
   * it wherever (a node, many nodes, an undo stack, …). The component itself
   * does none of that.
   */
  onSubmit: (values: NodeStyleFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic style form.
 *
 * Takes `defaults` + `fields`, owns a react-hook-form instance, renders the
 * schema with `@invana/forms` (each field `group` becomes an accordion
 * section), and on submit hands the current values to `onSubmit`. It knows
 * nothing about `Canvas`, layers, or how a style is stored — it just loads the
 * defaults and tracks the user's edits in the shape the `fields` define.
 *
 * The NodeStyle ⇄ form-fields mapping (`styleToForm` / `formToStyle`) is the
 * consumer's plug-in, used in `defaults` and inside `onSubmit`.
 */
export function NodeStyleEditor({
  defaults = {},
  fields = nodeStyleFields,
  onSubmit,
  submitLabel = 'Apply',
}: NodeStyleEditorProps) {
  const form = useForm<NodeStyleFormState>({ defaultValues: { style: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values when `fields` is a function (drives
  // the geometry tab's per-kind numerics off the watched `shapeKind`).
  const values = useWatch({ control, name: 'style' }) as NodeStyleFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;

  // RHF 7.76's `Control<NodeStyleFormState>` isn't assignable to `ObjectField`'s
  // `Control<any>` (the field-name union is contravariant). Widen at the boundary.
  const c = control as unknown as Control<FieldValues>;

  return (
    // `@invana/forms` leaf fields read `useFormContext()`, so the whole form
    // must be on context — not just control.
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <FormField.ObjectField control={c} columns={1} name="style" fields={resolvedFields} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(getValues('style'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
