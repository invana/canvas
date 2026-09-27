import { FormField } from '@invana/forms';
import { Badge, Button } from '@invana/ui';
import { ArrowDown, ArrowUp, X } from 'lucide-react';
import { useFieldArray, useWatch, type Control, type FieldValues } from 'react-hook-form';

import { controlItemFields, type ControlItemChoices } from './fields';
import { emptyItemFields } from './mapping';
import type { ControlItemFields, ControlPanelFormState } from './types';

export interface ControlItemsFieldProps {
  control: Control<ControlPanelFormState>;
  /** The live command / icon / widget names the row pickers offer. */
  choices: ControlItemChoices;
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
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
      <span className="text-sm font-semibold">Items</span>
      {fields.length === 0 && <p className="text-xs italic text-muted-foreground">No items yet.</p>}
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
