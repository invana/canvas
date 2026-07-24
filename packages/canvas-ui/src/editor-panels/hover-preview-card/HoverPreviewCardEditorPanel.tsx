import { FormField } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useFieldArray,
  useForm,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import type { HoverElementPreviewCardSpec } from '@invana/graph';

import { CARD_ROW_FIELDS, CARD_SCALAR_FIELDS } from './fields';
import { formToSpec, specToForm } from './mapping';
import type { CardSpecFields } from './types';

export interface HoverPreviewCardEditorPanelProps {
  /**
   * Initial card spec, loaded once on mount. Remount (via `key`) to reload.
   * Seed it from a per-type entry of `HoverElementPreviewBehaviour`'s `cards`
   * (e.g. `cards.nodes.person`).
   */
  defaults?: HoverElementPreviewCardSpec;
  /**
   * Called with the produced spec when the user applies. The consumer stores it
   * back into `cards.nodes[type]` / `cards.edges[type]` (display settings) and
   * feeds it to the behaviour. The editor itself holds no engine reference.
   */
  onSubmit: (spec: HoverElementPreviewCardSpec) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic editor for **one** `HoverElementPreviewCardSpec`
 * — the per-type card definition (which field is the avatar / title / subtitle,
 * and a list of property rows). Produces pure JSON, so a host builds a per-type
 * `cards` config by composing one editor per node/edge type.
 *
 * Mirrors `NodeStyleEditorPanel`: owns a react-hook-form, renders the scalar controls
 * via the `@invana/forms` generator (`ObjectField`), the rows via a
 * `useFieldArray`, and hands `formToSpec(values)` to `onSubmit`. No `Canvas`,
 * no engine, no commit.
 */
export function HoverPreviewCardEditorPanel({
  defaults,
  onSubmit,
  submitLabel = 'Apply',
}: HoverPreviewCardEditorPanelProps) {
  const form = useForm<CardSpecFields>({ defaultValues: specToForm(defaults) });
  const { control, getValues } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'rows' });

  // RHF's typed `Control<CardSpecFields>` isn't assignable to ObjectField's
  // `Control<FieldValues>` (field-name union is contravariant). Widen here; the
  // typed `control` above still drives `useFieldArray`.
  const c = control as unknown as Control<FieldValues>;

  return (
    // `@invana/forms` leaf fields read `useFormContext()`, so the whole form
    // (not just control) must be on context.
    <FormProvider {...form}>
      <div className="flex flex-col gap-4 p-4">
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="card" fields={CARD_SCALAR_FIELDS} />

        <div className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold">Rows</span>
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
                <FormField.ObjectField control={c} columns={1} labelPosition="top" name={`rows.${i}`} fields={CARD_ROW_FIELDS} />
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
              onClick={() => append({ label: '', field: '', format: 'text' })}
            >
              + Add row
            </Button>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={() => onSubmit(formToSpec(getValues()))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
