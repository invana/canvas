import { FormField, type FieldConfig } from '@invana/forms';
import { Button } from '@invana/ui';
import { FormProvider, useForm, type Control, type FieldValues } from 'react-hook-form';

import { contentLODFields } from './fields';
import type { ContentLODFields, ContentLODFormState } from './types';

export interface ContentLODEditorProps {
  /**
   * Initial field values, loaded into the form once on mount. Seed it from a
   * behaviour's options with the exported `optionsToForm`. Remount (via `key`)
   * to reload.
   */
  defaults?: ContentLODFields;
  /** Optional heading (e.g. `'Text'`, `'Icon'`, `'Image'`) shown above the band. */
  title?: string;
  /** The form schema. Defaults to {@link contentLODFields}. */
  fields?: FieldConfig[];
  /**
   * Called with the current values on submit. Map back to an options patch with
   * `formToOptions` and apply it however you like (`behaviour.setOptions`, …).
   */
  onSubmit: (values: ContentLODFields) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
}

/**
 * Self-contained, engine-agnostic settings form for a content-LOD behaviour —
 * a single `{ minZoom, maxZoom }` zoom band. One editor serves `TextLODBehaviour`,
 * `IconLODBehaviour`, and `ImageLODBehaviour` (identical option shapes); the
 * optional `title` distinguishes them in the UI.
 *
 * Owns a react-hook-form instance seeded by `defaults`, renders the schema with
 * `@invana/forms`, and hands the current values to `onSubmit`. No engine
 * reference, no commit — the `options ⇄ form-fields` mapping (`optionsToForm` /
 * `formToOptions`) is the consumer's plug-in.
 */
export function ContentLODEditor({
  defaults = {},
  title,
  fields = contentLODFields,
  onSubmit,
  submitLabel = 'Apply',
}: ContentLODEditorProps) {
  const form = useForm<ContentLODFormState>({ defaultValues: { options: defaults } });
  const { control, getValues } = form;

  // Widen at the boundary — RHF's typed Control isn't assignable to ObjectField's
  // `Control<any>` (the field-name union is contravariant).
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: 16 }}>
        {title ? <strong>{title}</strong> : null}
        <FormField.ObjectField control={c} columns={2} labelPosition="top" name="options" fields={fields} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => onSubmit(getValues('options'))}>{submitLabel}</Button>
        </div>
      </div>
    </FormProvider>
  );
}
