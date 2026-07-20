import { useEffect } from 'react';
import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import {
  FormProvider,
  useForm,
  type Control,
  type FieldValues,
} from 'react-hook-form';

import { nodeStyleOverviewFields } from './fields';
import type { NodeStyleOverviewFields, NodeStyleOverviewFormState } from './types';

export interface NodeStyleOverviewEditorProps {
  /**
   * Initial field values, loaded once on mount. Seed from an engine colour with
   * the exported `colorToForm`. Remount (via `key`) to reload.
   */
  defaults?: NodeStyleOverviewFields;
  /**
   * The form schema. Defaults to the single-colour {@link nodeStyleOverviewFields}.
   */
  fields?: FieldConfig[];
  /**
   * Optional Apply handler. When provided, an Apply button is rendered that
   * calls this with the current values; map back with `formToColor` and turn it
   * into a style patch with `recolorNodeStyle`. **Omit it for pure live editing**
   * — with only {@link onChange} set, no button renders and every pick applies
   * immediately. The component does no commit either way.
   */
  onSubmit?: (values: NodeStyleOverviewFields) => void;
  /**
   * **Live** callback — fired on every change with the current values. This is
   * the primary path for the overview editor (recolour on each pick). Memoise it
   * to avoid re-subscribing each render.
   */
  onChange?: (values: NodeStyleOverviewFields) => void;
  /** Submit button label (only shown when {@link onSubmit} is set). Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic **overview** editor — a single colour control
 * that recolours a node. Deliberately minimal: it only edits a colour, and the
 * paired `recolorNodeStyle` mapper turns that colour into the right patch for a
 * simple shape (`bgFill`) or a composite card (body + accent parts). No `Canvas`,
 * no engine, no commit — just produces the colour value.
 */
export function NodeStyleOverviewEditor({
  defaults = {},
  fields = nodeStyleOverviewFields,
  onSubmit,
  onChange,
  submitLabel = 'Apply',
}: NodeStyleOverviewEditorProps) {
  const form = useForm<NodeStyleOverviewFormState>({ defaultValues: { overview: defaults } });
  const { control, getValues, watch } = form;

  // Live preview: emit the current colour on every change when `onChange` is set.
  useEffect(() => {
    if (!onChange) return;
    const sub = watch((values) => onChange((values as NodeStyleOverviewFormState).overview ?? {}));
    return () => sub.unsubscribe();
  }, [watch, onChange]);

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="overview" fields={fields} />
        {onSubmit && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={() => onSubmit(getValues('overview'))}>{submitLabel}</Button>
          </div>
        )}
      </div>
    </FormProvider>
  );
}
