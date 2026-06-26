import { useMemo } from 'react';
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

import { SLOT_BINDING_FIELDS } from '../field-helpers';
import { bindingScalarFields } from './fields';
import { bindingToForm, formToBinding } from './mapping';
import type { NodeStructureFormState } from './types';

export interface NodeStructureEditorProps {
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
export function NodeStructureEditor({
  defaults,
  structures,
  stylings,
  onSubmit,
  submitLabel = 'Apply',
}: NodeStructureEditorProps) {
  const form = useForm<NodeStructureFormState>({ defaultValues: bindingToForm(defaults) });
  const { control, getValues } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'bindings' });

  const scalarFields = useMemo(
    () => bindingScalarFields(structures, stylings),
    [structures, stylings],
  );

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
        <FormField.ObjectField control={c} name="binding" fields={scalarFields} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600 }}>Field mapping</span>
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
                <FormField.ObjectField control={c} name={`bindings.${i}`} fields={SLOT_BINDING_FIELDS} />
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

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(formToBinding(getValues()))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
