import { useState } from 'react';
import { FormField, type FieldConfig } from '@invana/forms';
import { Alert, AlertDescription, Button } from '@invana/ui';
import { FormProvider, useForm, useWatch, type Control, type FieldValues } from 'react-hook-form';

import { keyboardShortcutsFields } from './fields';
import { invalidBindingLines } from './mapping';
import type { KeyboardShortcutsFields, KeyboardShortcutsFormState } from './types';

export interface KeyboardShortcutsEditorPanelProps {
  /** Initial field values, loaded once on mount — seed with `optionsToForm`. Remount (via `key`) to reload. */
  defaults?: KeyboardShortcutsFields;
  /** The form schema, static or a function of the values. Default {@link keyboardShortcutsFields}. */
  fields?: FieldConfig[] | ((values: KeyboardShortcutsFields) => FieldConfig[]);
  /** Called with the values on submit; map back with `formToOptions`. */
  onSubmit: (values: KeyboardShortcutsFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for `KeyboardShortcutsBehaviour`:
 * the scope and the bindings, one per line (`keys → command {args}`). A line that
 * doesn't parse is reported and nothing is submitted. Holds no engine reference
 * — `optionsToForm` / `formToOptions` are the consumer's bridge.
 */
export function KeyboardShortcutsEditorPanel({
  defaults = {},
  fields = keyboardShortcutsFields,
  onSubmit,
  submitLabel = 'Apply',
}: KeyboardShortcutsEditorPanelProps) {
  const form = useForm<KeyboardShortcutsFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;
  const [badLines, setBadLines] = useState<number[]>([]);

  const values = useWatch({ control, name: 'options' }) as KeyboardShortcutsFields | undefined;
  const resolvedFields = typeof fields === 'function' ? fields(values ?? {}) : fields;
  const c = control as unknown as Control<FieldValues>;

  const apply = () => {
    const current = getValues('options');
    const bad = invalidBindingLines(current.bindingsText ?? '');
    setBadLines(bad);
    if (bad.length === 0) onSubmit(current);
  };

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-3 p-4">
        <FormField.ObjectField control={c} columns={1} labelPosition="top" name="options" fields={resolvedFields} />
        {badLines.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              {badLines.length === 1 ? 'Line' : 'Lines'} {badLines.join(', ')}: expected `keys → command`, then optional JSON args.
            </AlertDescription>
          </Alert>
        )}
        <div className="flex justify-end">
          <Button onClick={apply}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
