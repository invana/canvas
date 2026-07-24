import { useEffect, useMemo } from 'react';
import { FormField } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useFieldArray,
  useForm,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import type { NodeTypeBinding } from '@invana/graph';

import { SLOT_BINDING_FIELDS } from '../../editors/field-helpers';
import { bindingScalarFields } from './fields';
import { bindingToForm, formToBinding } from './mapping';
import type { NodeStructureFormState } from './types';

export interface NodeStructureEditorPanelProps {
  /**
   * Initial binding, loaded once on mount. Remount (via `key`) to reload. Seed
   * from a `GraphLayerOptions.nodeTypes` entry.
   */
  defaults?: NodeTypeBinding;
  /** Registered structure-template names to offer in the Structure picker. */
  structures: string[];
  /** Registered styling-template names to offer in the Styling picker. */
  stylings: string[];
  /**
   * Called with the produced binding on Apply. The consumer stores it back into
   * `nodeTypes[type]` and pushes it via
   * `canvas.update({ layers: { graph: { nodeTypes } } })`.
   */
  onSubmit: (binding: NodeTypeBinding) => void;
  /**
   * Optional **live** callback — fired on every form change with the mapped
   * binding, for instant-preview hosts. Independent of {@link onSubmit}.
   * Memoise it to avoid re-subscribing each render.
   */
  onChange?: (binding: NodeTypeBinding) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic editor for **one** `NodeTypeBinding` — the
 * per-type wiring: which structure + styling template, plus the slot → data
 * field map (the {@link SLOT_BINDING_FIELDS} `SlotBindingField` rows). Produces
 * pure JSON; no `Canvas`, no engine, no commit. The structure/styling pickers
 * are populated from the host's registered template names.
 */
export function NodeStructureEditorPanel({
  defaults,
  structures,
  stylings,
  onSubmit,
  onChange,
  submitLabel = 'Apply',
}: NodeStructureEditorPanelProps) {
  const form = useForm<NodeStructureFormState>({ defaultValues: bindingToForm(defaults) });
  const { control, getValues, watch } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'bindings' });

  const scalarFields = useMemo(
    () => bindingScalarFields(structures, stylings),
    [structures, stylings],
  );

  // Live preview: re-map + emit on every change when `onChange` is supplied.
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange(formToBinding(values as NodeStructureFormState)));
    return () => sub.unsubscribe();
  }, [watch, onChange]);

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-4 p-4">
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="binding" fields={scalarFields} />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">Field mapping</span>
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
                <FormField.ObjectField control={c} columns={1} labelPosition="top" name={`bindings.${i}`} fields={SLOT_BINDING_FIELDS} />
              </div>
              <Button type="button" variant="ghost" onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          ))}
          <div>
            <Button type="button" variant="outline" onClick={() => append({ slot: '', path: '' })}>
              + Add mapping
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onSubmit(formToBinding(getValues()))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
