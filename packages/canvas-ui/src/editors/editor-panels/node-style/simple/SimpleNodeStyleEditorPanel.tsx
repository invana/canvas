import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { AdvancedSection } from '../../../_shared/AdvancedSection';
import { advancedNodeStyleFields, basicNodeStyleFields } from './fields';
import type { NodeStyleFields, NodeStyleFormState } from './types';

export interface SimpleNodeStyleEditorPanelProps {
  /**
   * Initial field values, loaded into the form once on mount. Same shape the
   * form produces (see {@link NodeStyleFields}); seed it from an engine style
   * with the exported `styleToForm`. Remount (via `key`) to reload.
   */
  defaults?: NodeStyleFields;
  /**
   * Optional schema **override**. Either a static `FieldConfig[]` or a function
   * of the current values (the function form lets fields react to other fields).
   * When supplied, it replaces the built-in layout with a single flat
   * `ObjectField`. When **omitted** (the default), the editor renders its
   * two-tier layout: a Basics tier (shape / fill / size) plus a collapsed
   * "Advanced settings" disclosure holding the rest.
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
 * Self-contained, engine-agnostic style form for a **simple** node — the flat
 * `NodeStyle` surface (Geometry / Background / Stroke / Label). Rendered by
 * `NodeStyleEditorPanel` when `kind === 'simple'`; usable standalone too.
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
export function SimpleNodeStyleEditorPanel({
  defaults = {},
  fields,
  onSubmit,
  submitLabel = 'Apply',
}: SimpleNodeStyleEditorPanelProps) {
  const form = useForm<NodeStyleFormState>({ defaultValues: { style: defaults } });
  const { control, getValues } = form;

  // Recompute fields from the live values — the per-kind geometry numerics (in
  // the advanced tier) key off the watched `shapeKind` (in the basics tier).
  const values = (useWatch({ control, name: 'style' }) as NodeStyleFields | undefined) ?? {};

  // RHF 7.76's `Control<NodeStyleFormState>` isn't assignable to `ObjectField`'s
  // `Control<any>` (the field-name union is contravariant). Widen at the boundary.
  const c = control as unknown as Control<FieldValues>;

  // Custom schema override → single flat form. Default → two-tier basics +
  // collapsed advanced. Both `ObjectField`s share the `style` namespace but
  // render disjoint field-name sets, so no leaf registers twice.
  const override = typeof fields === 'function' ? fields(values) : fields;

  return (
    // `@invana/forms` leaf fields read `useFormContext()`, so the whole form
    // must be on context — not just control.
    <FormProvider {...form}>
      <div className="flex flex-col gap-3 p-4">
        {override ? (
          <FormField.ObjectField control={c} columns={1} labelPosition="top" name="style" fields={override} />
        ) : (
          <>
            <FormField.ObjectField
              control={c}
              columns={1}
              labelPosition="top"
              name="style"
              fields={basicNodeStyleFields(values)}
            />
            <AdvancedSection>
              <FormField.ObjectField
                control={c}
                columns={1}
                labelPosition="top"
                name="style"
                fields={advancedNodeStyleFields(values)}
              />
            </AdvancedSection>
          </>
        )}
        <div className="flex justify-end">
          <Button onClick={() => onSubmit(getValues('style'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
