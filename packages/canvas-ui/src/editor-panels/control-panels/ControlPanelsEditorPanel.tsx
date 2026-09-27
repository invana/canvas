import { useMemo, useState } from 'react';
import type { ControlItemSpec, ControlPanelSpec } from '@invana/canvas';
import { FormField } from '@invana/forms';
import { Alert, AlertDescription, Badge, Button, cn } from '@invana/ui';
import { Plus, Trash2 } from 'lucide-react';
import { FormProvider, useForm, useWatch, type Control, type FieldValues } from 'react-hook-form';

import { ACTIVE_CLASS } from '../../components/styles';
import { ControlItemsField } from './ControlItemsField';
import { controlPanelFields, type ControlItemChoices } from './fields';
import { formToPanel, itemToForm, newPanelSpec, panelToForm } from './mapping';
import type { ControlPanelFormError, ControlPanelFormState } from './types';

export interface ControlPanelsEditorPanelProps extends ControlItemChoices {
  /** The panels to edit, keyed by id (`definition.controlPanels`). */
  panels: Readonly<Record<string, ControlPanelSpec>>;
  /**
   * Named item lists the "Insert preset" picker appends from — typically the
   * `*_CONTROL_ITEMS` presets. Omit to hide the picker.
   */
  presets?: Readonly<Record<string, readonly ControlItemSpec[]>>;
  /**
   * Called with a `controlPanels` patch: a spec replaces that panel whole,
   * `null` removes it. Fired by Apply (the edited panel), New panel and Remove.
   */
  onSubmit: (patch: Record<string, ControlPanelSpec | null>) => void;
  /** Submit button label. Default `'Apply'`. */
  submitLabel?: string;
  className?: string;
}

/** The first `panel-N` id not in `ids`. */
function nextPanelId(ids: readonly string[]): string {
  let n = ids.length + 1;
  while (ids.includes(`panel-${n}`)) n++;
  return `panel-${n}`;
}

/** The form for one panel — remounted (by `key`) when the selection changes. */
function ControlPanelForm({
  spec,
  choices,
  presets,
  submitLabel,
  onApply,
}: {
  spec: ControlPanelSpec;
  choices: ControlItemChoices;
  presets?: Readonly<Record<string, readonly ControlItemSpec[]>>;
  submitLabel: string;
  onApply: (spec: ControlPanelSpec) => void;
}) {
  const form = useForm<ControlPanelFormState>({ defaultValues: panelToForm(spec) });
  const { control, getValues, setValue } = form;
  const positionMode = useWatch({ control, name: 'panel.positionMode' });
  const [errors, setErrors] = useState<ControlPanelFormError[]>([]);

  // The preset picker is its own tiny form: its value isn't part of the panel.
  const presetForm = useForm<{ pick: { preset: string } }>({
    defaultValues: { pick: { preset: Object.keys(presets ?? {})[0] ?? '' } },
  });
  const presetFields = useMemo(
    () => [
      {
        name: 'preset',
        type: 'select' as const,
        label: 'Insert preset',
        options: Object.keys(presets ?? {}).map((k) => ({ label: k, value: k })),
      },
    ],
    [presets],
  );

  const insertPreset = () => {
    const items = presets?.[presetForm.getValues('pick.preset')];
    if (!items) return;
    setValue('items', [...getValues('items'), ...items.map(itemToForm)], { shouldDirty: true });
  };

  const apply = () => {
    const { spec: next, errors: found } = formToPanel(getValues());
    setErrors(found);
    if (found.length === 0) onApply(next);
  };

  // RHF's typed `Control` isn't assignable to ObjectField's `Control<FieldValues>`.
  const c = control as unknown as Control<FieldValues>;

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-4">
        <FormField.ObjectField control={c} columns={2} labelPosition="top" name="panel" fields={controlPanelFields(positionMode)} />

        <ControlItemsField control={control} choices={choices} />

        {presets && Object.keys(presets).length > 0 && (
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <FormField.ObjectField
                control={presetForm.control as unknown as Control<FieldValues>}
                columns={1}
                labelPosition="top"
                name="pick"
                fields={presetFields}
              />
            </div>
            <Button type="button" variant="outline" size="sm" onClick={insertPreset}>
              Insert
            </Button>
          </div>
        )}

        {errors.length > 0 && (
          <Alert variant="destructive">
            <AlertDescription>
              {errors.map((e) => (
                <div key={`${e.item}-${e.field}`}>
                  {e.item === null ? 'Panel' : `Item ${e.item + 1}`} · {e.field}: {e.message}
                </div>
              ))}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button type="button" onClick={apply}>
            {submitLabel}
          </Button>
        </div>
      </div>
    </FormProvider>
  );
}

/**
 * Controlled editor for a canvas's **control panels** (`definition.controlPanels`):
 * pick a panel, edit its position / flow / chrome and its items, then Apply.
 * New panel and Remove act immediately. Pure form — no engine: the pickers are
 * fed the registered names by props, and every change comes back through
 * `onSubmit` as a `controlPanels` patch for the host to apply
 * (`canvas.update({ controlPanels: patch })`). `ControlPanelsEditor` is the
 * connected wrapper that does exactly that.
 *
 * Item args and static options are edited as JSON; a parse error is listed
 * and nothing is submitted. Slot items (runtime React content) are shown but
 * not editable, and survive every round-trip; so do command / icon / widget
 * names this canvas doesn't register.
 */
export function ControlPanelsEditorPanel({
  panels,
  commands,
  icons,
  widgets,
  presets,
  onSubmit,
  submitLabel = 'Apply',
  className,
}: ControlPanelsEditorPanelProps) {
  const ids = Object.keys(panels);
  const [picked, setPicked] = useState<string | null>(null);
  const selected = picked !== null && picked in panels ? picked : (ids[0] ?? null);
  const choices = useMemo<ControlItemChoices>(
    () => ({
      // `name#…` commands are private to one mounted component — not for saving.
      commands: commands.filter((n) => !n.includes('#')).sort(),
      icons: [...icons].sort(),
      widgets: [...widgets].sort(),
    }),
    [commands, icons, widgets],
  );

  const addPanel = () => {
    const id = nextPanelId(ids);
    onSubmit({ [id]: newPanelSpec() });
    setPicked(id);
  };

  return (
    <div className={cn('flex flex-col gap-4 p-4', className)}>
      <div className="flex flex-wrap items-center gap-1">
        {ids.map((id) => (
          <Button
            key={id}
            type="button"
            variant="ghost"
            size="sm"
            className={cn(id === selected && ACTIVE_CLASS)}
            onClick={() => setPicked(id)}
          >
            {id}
            {panels[id]!.visible === false && (
              <Badge variant="outline" className="ml-1 px-1 py-0 text-[10px]">
                hidden
              </Badge>
            )}
          </Button>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addPanel}>
          <Plus className="size-4" /> New panel
        </Button>
      </div>

      {selected === null ? (
        <p className="text-sm italic text-muted-foreground">No control panels on this canvas.</p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">{selected}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => onSubmit({ [selected]: null })} aria-label="Remove panel">
              <Trash2 className="size-4" /> Remove
            </Button>
          </div>
          <ControlPanelForm
            // Remount per panel, and when the stored spec changes underneath.
            key={`${selected}:${JSON.stringify(panels[selected])}`}
            spec={panels[selected]!}
            choices={choices}
            {...(presets ? { presets } : {})}
            submitLabel={submitLabel}
            onApply={(spec) => onSubmit({ [selected]: spec })}
          />
        </>
      )}
    </div>
  );
}
