import { useEffect } from 'react';
import { FormField } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useFieldArray,
  useForm,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import type { NodeStylingTemplate } from '@invana/graph';

import { NO_ROLE } from '../field-helpers';
import {
  CARD_STYLING_FIELDS,
  SIMPLE_STYLING_FIELDS,
  SLOT_STYLING_FIELDS,
  STYLING_SCALAR_FIELDS,
} from './fields';
import { formToStyling, stylingToForm } from './mapping';
import type { NodeStylingFormState } from './types';

export interface NodeStylingEditorProps {
  /**
   * Initial styling template, loaded once on mount. Remount (via `key`) to
   * reload. Seed it from a `GraphLayerOptions.nodeStylingTemplates` entry.
   */
  defaults?: NodeStylingTemplate;
  /**
   * Called with the produced template on Apply. The consumer stores it back
   * into `nodeStylingTemplates[name]` and pushes it via
   * `canvas.update({ layers: { graph: { nodeStylingTemplates } } })`.
   */
  onSubmit: (styling: NodeStylingTemplate) => void;
  /**
   * Optional **live** callback — fired on every form change with the mapped
   * template, for instant-preview hosts. Independent of {@link onSubmit} (which
   * still fires on Apply). Memoise it to avoid re-subscribing each render.
   */
  onChange?: (styling: NodeStylingTemplate) => void;
  /**
   * Which structure kind this styling targets — picks the relevant control
   * subset so every field affects the canvas. `'card'` shows bg / accent +
   * per-slot styling; `'simple'` shows fill / stroke / label (no slots). Omit to
   * show the full set (standalone use).
   */
  variant?: 'simple' | 'card';
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic editor for **one** `NodeStylingTemplate` —
 * the per-type styling layer (which {@link ColorRole} each slot/label uses +
 * typography). Produces pure JSON; no `Canvas`, no engine, no commit. Mirrors
 * `NodeStyleEditor` / `HoverPreviewCardEditor`: a react-hook-form, the scalar
 * controls via `ObjectField`, the per-slot stylings via a `useFieldArray`.
 */
export function NodeStylingEditor({
  defaults,
  onSubmit,
  onChange,
  variant,
  submitLabel = 'Apply',
}: NodeStylingEditorProps) {
  const form = useForm<NodeStylingFormState>({ defaultValues: stylingToForm(defaults) });
  const { control, getValues, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'slots' });

  const scalarFields =
    variant === 'card'
      ? CARD_STYLING_FIELDS
      : variant === 'simple'
        ? SIMPLE_STYLING_FIELDS
        : STYLING_SCALAR_FIELDS;
  // Slots only exist on card structures.
  const showSlots = variant !== 'simple';

  // Live preview: re-map + emit on every change when `onChange` is supplied.
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(formToStyling(values as NodeStylingFormState)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="styling" fields={scalarFields} />

        {showSlots && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Slot styling</span>
          {fields.map((f, i) => (
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
                <FormField.ObjectField control={c} columns={1} labelPosition="top" name={`slots.${i}`} fields={SLOT_STYLING_FIELDS} />
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
              onClick={() =>
                append({ slot: '', colorRole: NO_ROLE, fontSize: 13, fontWeight: 400, uppercase: false })
              }
            >
              + Add slot
            </Button>
          </div>
        </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(formToStyling(getValues()))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
