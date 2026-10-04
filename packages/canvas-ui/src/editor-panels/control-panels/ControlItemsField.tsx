import { FormField } from '@invana/forms';
import { Badge, Button } from '@invana/ui';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useFieldArray, useWatch, type Control, type FieldValues } from 'react-hook-form';

import { controlItemFields, iconField, type ControlItemChoices } from './fields';
import { emptyItemFields } from './mapping';
import { NO_ICON, type ChoiceOptionFields, type ControlItemFields, type ControlPanelFormState } from './types';

export interface ControlItemsFieldProps {
  control: Control<ControlPanelFormState>;
  /** The live command / icon / widget names the row pickers offer. */
  choices: ControlItemChoices;
}

/**
 * A choice item's static `options` as rows (`value` · `label` · `icon`). No rows
 * = the command's own options. Rows with an empty value are dropped on Apply.
 */
function ChoiceOptionsField({
  index,
  control,
  icons,
}: {
  index: number;
  control: Control<ControlPanelFormState>;
  icons: readonly string[];
}) {
  const { fields, append, remove, move } = useFieldArray({ control, name: `items.${index}.choiceOptions` });
  const rows = useWatch({ control, name: `items.${index}.choiceOptions` }) as ChoiceOptionFields[] | undefined;
  const c = control as unknown as Control<FieldValues>;

  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-medium">Options</span>
      {fields.length === 0 && <p className="text-sm italic text-muted-foreground">None — the command’s own options.</p>}
      {fields.map((f, i) => (
        <div key={f.id} className="flex items-start gap-1">
          <div className="flex-1">
            <FormField.ObjectField
              control={c}
              columns={3}
              labelPosition="top"
              name={`items.${index}.choiceOptions.${i}`}
              fields={[
                { name: 'value', type: 'text', label: 'Value' },
                { name: 'label', type: 'text', label: 'Label', placeholder: 'the value' },
                iconField('icon', 'Icon', icons, rows?.[i]?.icon ?? NO_ICON),
              ]}
            />
          </div>
          <div className="flex gap-0.5 pt-5">
            <Button type="button" variant="ghost" size="sm" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label="Move option up">
              <ArrowUp className="size-4" />
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)} aria-label="Remove option">
              <X className="size-4" />
            </Button>
          </div>
        </div>
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ value: '', label: '', icon: NO_ICON })}>
          + Add option
        </Button>
      </div>
    </div>
  );
}

/** One item row: its kind-dependent fields plus move / remove. */
function ControlItemRow({
  index,
  count,
  control,
  choices,
  onMove,
  onRemove,
}: {
  index: number;
  count: number;
  control: Control<ControlPanelFormState>;
  choices: ControlItemChoices;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
}) {
  const row = useWatch({ control, name: `items.${index}` }) as ControlItemFields | undefined;
  if (!row) return null;
  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <div className="flex items-start gap-2 border-t border-border pt-2 first:border-t-0 first:pt-0">
      <div className="flex flex-1 flex-col gap-1">
        {row.type === 'slot' && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">slot</Badge>
            <span>{row.slot} — runtime content from a {'<ControlPanel>'}; kept as is</span>
          </div>
        )}
        <FormField.ObjectField
          control={c}
          columns={2}
          labelPosition="top"
          name={`items.${index}`}
          fields={controlItemFields(row, choices)}
        />
        {row.type === 'choice' && <ChoiceOptionsField index={index} control={control} icons={choices.icons} />}
      </div>
      <div className="flex flex-col gap-0.5">
        <Button type="button" variant="ghost" size="sm" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label="Move up">
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={index === count - 1}
          onClick={() => onMove(index, index + 1)}
          aria-label="Move down"
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => onRemove(index)} aria-label="Remove item">
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
}

/**
 * The `items` list of one control panel: add / remove / reorder rows, each
 * showing the fields for its kind. Hand-written over `useFieldArray` because
 * `@invana/forms` has no array field type (the `SchemaEditorPanel` precedent).
 */
export function ControlItemsField({ control, choices }: ControlItemsFieldProps) {
  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });

  return (
    <div className="flex flex-col gap-2">
      <span className="text-base font-semibold">Items</span>
      {fields.length === 0 && <p className="text-sm italic text-muted-foreground">No items yet.</p>}
      {fields.map((f, i) => (
        <ControlItemRow
          key={f.id}
          index={i}
          count={fields.length}
          control={control}
          choices={choices}
          onMove={move}
          onRemove={remove}
        />
      ))}
      <div>
        <Button type="button" variant="outline" size="sm" onClick={() => append(emptyItemFields('command'))}>
          + Add item
        </Button>
      </div>
    </div>
  );
}
