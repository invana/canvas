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
import { compositeScalarFields, partRowFields } from './fields';
import { compositeToForm } from './mapping';
import type { CompositeFormState, CompositeScalarFields } from './types';

export interface CompositeNodeStyleEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Same shape the
   * form produces ({@link CompositeFormState}); seed it from a
   * `CompositeShapeOption` with the exported `compositeToForm`. Remount (via
   * `key`) to reload. Mirrors the simple editor's `defaults` contract.
   */
  defaults?: CompositeFormState;
  /**
   * The **body + root** scalar schema. A static `FieldConfig[]` or a function of
   * the current scalar values — the function form varies the Root geometry with
   * `rootKind`. Defaults to the built-in grouped {@link compositeScalarFields}.
   * (The per-part controls are always the built-in dynamic {@link partRowFields}.)
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
 * commit. Rendered by `NodeStyleEditor` when `kind === 'composite'`; usable
 * standalone.
 *
 * The `CompositeShapeOption` ⇄ form mapping (`compositeToForm` / `formToComposite`)
 * is the consumer's plug-in, used in `defaults` and inside `onSubmit` — the same
 * contract as the simple editor's `styleToForm` / `formToStyle`.
 */
export function CompositeNodeStyleEditor({
  defaults,
  fields = compositeScalarFields,
  onSubmit,
  submitLabel = 'Apply',
}: CompositeNodeStyleEditorProps) {
  const form = useForm<CompositeFormState>({ defaultValues: defaults ?? compositeToForm() });
  const { control, getValues } = form;
  const { fields: partFields, append, remove } = useFieldArray({ control, name: 'parts' });

  // Recompute the body/root schema from live values (drives the Root numerics
  // off the watched `rootKind`), and read each row's kind for its part schema.
  const scalarValues = useWatch({ control, name: 'composite' }) as CompositeScalarFields | undefined;
  const resolvedScalarFields =
    typeof fields === 'function' ? fields(scalarValues ?? {}) : fields;
  const partsValues = useWatch({ control, name: 'parts' }) as CompositeFormState['parts'] | undefined;

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="composite" fields={resolvedScalarFields} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Parts</span>
          {partFields.map((f, i) => (
            <div
              key={f.id}
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
                paddingTop: i ? 8 : 0,
                borderTop: i ? '1px solid var(--border)' : undefined,
              }}
            >
              <div style={{ flex: 1 }}>
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(getValues())}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
