import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useFieldArray,
  useForm,
  useWatch,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import { AdvancedSection } from '../../../editors/_shared/AdvancedSection';
import { advancedCompositeScalarFields, basicCompositeFields, partRowFields } from './fields';
import { compositeToForm } from './mapping';
import type { CompositeFormState, CompositeScalarFields } from './types';

export interface CompositeNodeStyleEditorPanelProps {
  /**
   * Initial field values, loaded into the form once on mount. Same shape the
   * form produces ({@link CompositeFormState}); seed it from a
   * `CompositeShapeOption` with the exported `compositeToForm`. Remount (via
   * `key`) to reload. Mirrors the simple editor's `defaults` contract.
   */
  defaults?: CompositeFormState;
  /**
   * Optional **body + root** scalar schema **override**. A static `FieldConfig[]`
   * or a function of the current scalar values. When supplied, it replaces the
   * built-in layout with a single flat scalar `ObjectField`. When **omitted**
   * (the default), the editor renders its two-tier layout: a Basics tier (the
   * body fill colour) plus a collapsed "Advanced settings" disclosure holding the
   * rest of the body/root fields and the parts list. (The per-part controls are
   * always the built-in dynamic {@link partRowFields}.)
   */
  fields?: FieldConfig[] | ((values: CompositeScalarFields) => FieldConfig[]);
  /**
   * Called with the current values when the user submits. Map back to a
   * `CompositeShapeOption` with `formToComposite` and apply it wherever — e.g.
   * `store.updateNode(id, { style: { shape: formToComposite(values) } })`. The
   * component itself does no commit.
   */
  onSubmit: (values: CompositeFormState) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic editor for a **composite / card** node — the
 * full `CompositeShapeOption` spec: the body (size / fill / stroke / clip), an
 * optional root silhouette, and the ordered `parts[]` list (rect / circle /
 * line / label / icon) as `useFieldArray` rows whose controls switch on each
 * row's `part` kind. Produces pure form values; no `Canvas`, no engine, no
 * commit. Rendered by `NodeStyleEditorPanel` when `kind === 'composite'`; usable
 * standalone.
 *
 * The `CompositeShapeOption` ⇄ form mapping (`compositeToForm` / `formToComposite`)
 * is the consumer's plug-in, used in `defaults` and inside `onSubmit` — the same
 * contract as the simple editor's `styleToForm` / `formToStyle`.
 */
export function CompositeNodeStyleEditorPanel({
  defaults,
  fields,
  onSubmit,
  submitLabel = 'Apply',
}: CompositeNodeStyleEditorPanelProps) {
  const form = useForm<CompositeFormState>({ defaultValues: defaults ?? compositeToForm() });
  const { control, getValues } = form;
  const { fields: partFields, append, remove } = useFieldArray({ control, name: 'parts' });

  // Recompute the body/root schema from live values (drives the Root numerics
  // off the watched `rootKind`), and read each row's kind for its part schema.
  const scalarValues = (useWatch({ control, name: 'composite' }) as CompositeScalarFields | undefined) ?? {};
  const partsValues = useWatch({ control, name: 'parts' }) as CompositeFormState['parts'] | undefined;

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  // Custom scalar-schema override → single flat scalar form. Default → two-tier
  // basics + collapsed advanced. Both scalar `ObjectField`s share the `composite`
  // namespace but render disjoint field-name sets, so no leaf registers twice.
  const override = typeof fields === 'function' ? fields(scalarValues) : fields;

  // The ordered parts list (Add / Remove) — always advanced content.
  const partsBlock = (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-semibold">Parts</span>
      {partFields.map((f, i) => (
        <div
          key={f.id}
          className="flex gap-2 items-start"
          style={{
            paddingTop: i ? 8 : 0,
            borderTop: i ? '1px solid var(--border)' : undefined,
          }}
        >
          <div className="flex-1">
            <FormField.ObjectField
              control={c}
              columns={1}
              labelPosition="top"
              name={`parts.${i}`}
              fields={partRowFields(partsValues?.[i]?.part)}
            />
          </div>
          <Button type="button" variant="ghost" onClick={() => remove(i)}>
            Remove
          </Button>
        </div>
      ))}
      <div>
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ part: 'label', x: 12, y: 12, text: '' })}
        >
          + Add part
        </Button>
      </div>
    </div>
  );

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-4 p-4">
        {override ? (
          <>
            <FormField.ObjectField control={c} columns={1} labelPosition="top" name="composite" fields={override} />
            {partsBlock}
          </>
        ) : (
          <>
            <FormField.ObjectField
              control={c}
              columns={1}
              labelPosition="top"
              name="composite"
              fields={basicCompositeFields(scalarValues)}
            />
            <AdvancedSection>
              <div className="flex flex-col gap-4 pt-2">
                <FormField.ObjectField
                  control={c}
                  columns={1}
                  labelPosition="top"
                  name="composite"
                  fields={advancedCompositeScalarFields(scalarValues)}
                />
                {partsBlock}
              </div>
            </AdvancedSection>
          </>
        )}

        <div className="flex justify-end">
          <Button onClick={() => onSubmit(getValues())}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
