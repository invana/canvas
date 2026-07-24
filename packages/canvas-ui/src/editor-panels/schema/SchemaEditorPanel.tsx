import { useEffect } from 'react';
import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import { FormProvider, useFieldArray, useForm, type Control, type FieldValues } from 'react-hook-form';

import { SCHEMA_FIELD_ROW, SCHEMA_META_FIELDS } from './fields';
import { formToSchema, schemaToForm } from './mapping';
import type { NodeSchema, SchemaEditorFormState } from './types';

export interface SchemaEditorPanelProps {
  /** Initial schema, loaded once on mount. Remount (via `key`) to reload. */
  defaults?: NodeSchema;
  /**
   * Called with the edited schema on Apply. The consumer applies it however it
   * likes — e.g. write it back to a graph node's `data` and redraw.
   */
  onSubmit: (schema: NodeSchema) => void;
  /**
   * Optional **live** callback — fired on every change with the mapped schema,
   * for instant-preview hosts. Memoise it to avoid re-subscribing each render.
   */
  onChange?: (schema: NodeSchema) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
  /**
   * Override the **meta** controls (title + header colour). Defaults to the
   * exported {@link SCHEMA_META_FIELDS} — pass your own `FieldConfig[]` to
   * relabel / reorder / restyle, or add controls. Extra values you introduce
   * won't round-trip unless they map onto `NodeSchema` (`label` / `headerColor`).
   */
  metaFields?: FieldConfig[];
  /**
   * Override the **per-field row** controls (name + type). Defaults to the
   * exported {@link SCHEMA_FIELD_ROW}. Add controls (e.g. `nullable`,
   * `description`, a restricted `type` select) and they round-trip verbatim —
   * unknown keys on each field are preserved through {@link NodeSchema}.
   */
  fieldRowFields?: FieldConfig[];
}

/**
 * Self-contained, engine-agnostic editor for one {@link NodeSchema} — a titled
 * list of typed fields (the ER / table-card shape). Edit the title + header
 * colour, add / remove / reorder fields, and set each field's data type; on
 * Apply it emits a pure-JSON `NodeSchema`. No `Canvas`, no engine, no commit —
 * the consumer wires `onSubmit` to its own apply path.
 *
 * The form schema is data-driven: {@link SchemaEditorPanelProps.metaFields} /
 * {@link SchemaEditorPanelProps.fieldRowFields} default to the exported
 * `SCHEMA_META_FIELDS` / `SCHEMA_FIELD_ROW` and can be overridden for full
 * control over which controls each section renders.
 */
export function SchemaEditorPanel({
  defaults,
  onSubmit,
  onChange,
  submitLabel = 'Apply',
  metaFields = SCHEMA_META_FIELDS,
  fieldRowFields = SCHEMA_FIELD_ROW,
}: SchemaEditorPanelProps) {
  const form = useForm<SchemaEditorFormState>({ defaultValues: schemaToForm(defaults) });
  const { control, getValues, watch } = form;
  const { fields, append, remove, move } = useFieldArray({ control, name: 'fields' });

  // Live preview: re-map + emit on every change when `onChange` is supplied.
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(formToSchema(values as SchemaEditorFormState)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-4 p-4">
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="meta" fields={metaFields} />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">Fields</span>
          {fields.map((f, i) => (
            <div
              key={f.id}
              className="flex gap-2 items-start"
              style={{
                paddingTop: i ? 8 : 0,
                borderTop: i ? '1px solid var(--border)' : undefined,
              }}
            >
              <div className="flex-1">
                <FormField.ObjectField control={c} columns={2} labelPosition="top" name={`fields.${i}`} fields={fieldRowFields} />
              </div>
              <div className="flex flex-col gap-0.5">
                <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move up">
                  ↑
                </Button>
                <Button type="button" variant="ghost" size="sm" disabled={i === fields.length - 1} onClick={() => move(i, i + 1)} aria-label="Move down">
                  ↓
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label="Remove field">
                  ✕
                </Button>
              </div>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" onClick={() => append({ name: '', type: 'string' })}>
              + Add field
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onSubmit(formToSchema(getValues()))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
