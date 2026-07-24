import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  Button,
  Card,
  CardContent,
  PanelStack,
  type PanelStackSection,
  cn,
} from '@invana/ui';
import { Input, SettingsPanel, Switch, type FieldConfig } from '@invana/forms';
import { useForm } from 'react-hook-form';
import { Search } from 'lucide-react';

import {
  DEFAULT_CANVAS_SETTINGS_SCHEMAS,
  type SettingsSchemaEntry,
} from './registry';
import type {
  CanvasSettingsDefinition,
  CanvasSettingsInstance,
  SettingsSection,
} from './types';

export interface CanvasSettingsEditorPanelProps {
  /**
   * The canvas settings to browse + edit — every registered layer / behaviour /
   * layout with its `kind` + current engine-shaped `settings`.
   */
  definition: CanvasSettingsDefinition;
  /**
   * The schema registry (`kind` → fields + mappers). Defaults to
   * {@link DEFAULT_CANVAS_SETTINGS_SCHEMAS} — the full built-in coverage. Pass a
   * superset to register custom kinds, or a subset to narrow it.
   */
  schemas?: Record<string, SettingsSchemaEntry>;
  /**
   * `'live'` (default) applies every field edit immediately via {@link onChange};
   * `'manual'` batches edits behind a per-row **Apply** button.
   */
  applyMode?: 'live' | 'manual';
  /** Panel heading. Default `'Canvas Settings'`. */
  title?: ReactNode;
  /**
   * An instance's settings changed. `patch` is an **engine-shaped** options patch
   * (mapped from the form via the registry entry's `toOptions`) — apply it with
   * `canvas.update({ [section]: { [id]: patch } })`.
   */
  onChange?: (section: SettingsSection, id: string, patch: Record<string, unknown>) => void;
  /** A layer / behaviour row's enable toggle flipped. */
  onToggle?: (section: SettingsSection, id: string, enabled: boolean) => void;
  /** A layout row was made active. */
  onActiveLayoutChange?: (id: string) => void;
  /** Extra classes merged onto the outer `Card`. */
  className?: string;
}

/** The sections rendered, in order. */
const SECTIONS: { id: SettingsSection; label: string }[] = [
  { id: 'layers', label: 'Layers' },
  { id: 'behaviours', label: 'Behaviours' },
  { id: 'layouts', label: 'Layouts' },
];

/**
 * VS Code tree-style disclosure chevron: point right (▸) when collapsed, rotate
 * down (⌄) when open. Merges through `AccordionTrigger`'s `cn`, so the trailing
 * `rotate-0` overrides the component's default open state.
 */
const CHEVRON_RIGHT = '[&>svg]:-rotate-90 [&[data-state=open]>svg]:rotate-0';

/** Resolve a (possibly value-dependent) field schema against the current values. */
function resolve(
  fields: FieldConfig[] | ((v: Record<string, unknown>) => FieldConfig[]),
  values: Record<string, unknown>,
): FieldConfig[] {
  return typeof fields === 'function' ? fields(values) : fields;
}

/**
 * Lowercased searchable text for one instance: its id + type label plus every
 * field's name / label / description / group / option labels — so a query like
 * "re-route connectors" surfaces the `drag-shape` behaviour that owns it.
 */
function instanceHaystack(instance: CanvasSettingsInstance, entry?: SettingsSchemaEntry): string {
  const parts = [instance.id, instance.typeLabel ?? entry?.typeLabel ?? instance.kind];
  for (const f of resolve(entry?.fields ?? [], {})) {
    parts.push(f.name, f.label ?? '', f.description ?? '', f.group ?? '');
    for (const o of f.options ?? []) parts.push(o.label, String(o.value));
  }
  return parts.join(' ').toLowerCase();
}

/**
 * Reasonable per-field defaults derived from the schema, so every control renders
 * as a controlled input even when the instance omits that setting.
 */
function deriveDefaults(fields: FieldConfig[]): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.defaultValue !== undefined) {
      out[f.name] = f.defaultValue;
      continue;
    }
    switch (f.type) {
      case 'boolean':
      case 'checkbox':
        out[f.name] = false;
        break;
      case 'number':
        out[f.name] = f.min ?? 0;
        break;
      case 'select':
      case 'radio':
        out[f.name] = f.options?.[0]?.value ?? '';
        break;
      case 'color':
        out[f.name] = f.presetColors?.[0]?.value ?? '#64748b';
        break;
      default:
        out[f.name] = '';
    }
  }
  return out;
}

/** Seed the form: schema-derived defaults, overlaid with the mapped instance settings. */
function seedValues(entry: SettingsSchemaEntry, settings?: Record<string, unknown>): Record<string, unknown> {
  const base = deriveDefaults(resolve(entry.fields, {}));
  const mapped = entry.toForm(settings ?? {}) as Record<string, unknown>;
  for (const [k, v] of Object.entries(mapped)) if (v !== undefined) base[k] = v;
  return base;
}

/**
 * The expanded row content: one instance's schema as a chrome-flattened
 * `SettingsPanel` rendered inline. In `'live'` mode every edit maps back through
 * the registry entry's `toOptions` and calls `onChange` immediately; in
 * `'manual'` mode edits batch behind an Apply button.
 *
 * Change handling maps the **whole** form (not the single changed field) via
 * `toOptions` — the mappers fold compound fields (`styleFill → style.fill`, two
 * booleans → `enableElements[]`), so a per-field patch would be wrong.
 */
function InstanceEditor({
  entry,
  instance,
  applyMode,
  onChange,
}: {
  entry: SettingsSchemaEntry;
  instance: CanvasSettingsInstance;
  applyMode: 'live' | 'manual';
  onChange?: (patch: Record<string, unknown>) => void;
}) {
  const initial = useMemo(() => seedValues(entry, instance.settings), [entry, instance.settings]);
  const form = useForm({ defaultValues: { opts: initial } });
  const values = form.watch('opts');

  // Baseline of the last-emitted engine options. We emit only the keys that
  // actually changed since then, so fields the user never touched (seeded to
  // schema defaults — numbers default to `min`, i.e. 0) don't clobber the
  // engine's own defaults. `toOptions` still maps the WHOLE form each time, so
  // compound outputs (nested `style` objects, `enableElements` arrays) stay
  // correct; we diff top-level keys against the last mapping.
  const lastMappedRef = useRef<Record<string, unknown>>(
    entry.toOptions(initial) as Record<string, unknown>,
  );
  const emit = () => {
    const mapped = entry.toOptions(form.getValues('opts')) as Record<string, unknown>;
    const last = lastMappedRef.current;
    const patch: Record<string, unknown> = {};
    for (const key of Object.keys(mapped)) {
      if (JSON.stringify(mapped[key]) !== JSON.stringify(last[key])) patch[key] = mapped[key];
    }
    lastMappedRef.current = mapped;
    if (Object.keys(patch).length > 0) onChange?.(patch);
  };

  // Live mode: map + emit on every field change. A ref keeps the subscription
  // stable while always calling the latest callback.
  const emitRef = useRef(emit);
  emitRef.current = emit;
  useEffect(() => {
    if (applyMode !== 'live') return;
    const sub = form.watch((_v, { name }) => {
      if (!name) return; // skip whole-form (non-field) resets
      emitRef.current();
    });
    return () => sub.unsubscribe();
  }, [form, applyMode]);

  // Flat form: drop per-field `description` + `group` so `ObjectField` renders
  // every field inline (2-col) rather than in collapsible sub-accordions.
  const fields = resolve(entry.fields, (values ?? {}) as Record<string, unknown>).map((f) => ({
    ...f,
    description: undefined,
    group: undefined,
  }));

  if (fields.length === 0) {
    return (
      <p className="px-3 py-2 text-xs italic text-muted-foreground">
        No settings for this instance.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <SettingsPanel
        form={form}
        name="opts"
        fields={fields}
        labelPosition="top"
        size="sm"
        columns={2}
        className="border-0 bg-transparent shadow-none"
        contentClassName="max-h-none overflow-visible p-3"
      />
      {applyMode === 'manual' && (
        <div className="flex justify-end px-3 pb-2">
          <Button size="sm" onClick={emit}>
            Apply
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * `CanvasSettingsEditorPanel` — a **file-browser-style settings panel** for a whole
 * canvas definition. The three sections (Layers / Behaviours / Layouts) are a
 * `PanelStack` — the VS-Code "view container": collapsible, resizable panels
 * whose headers stay visible. Each section's body lists its instances (files);
 * expanding a row reveals a schema-driven `SettingsPanel` **in place**. Edits are
 * handed back as engine-shaped patches via
 * {@link CanvasSettingsEditorPanelProps.onChange | onChange} for the host to apply
 * (typically live through `canvas.update(...)`).
 *
 * **Sizing:** the `PanelStack` fills its parent's height, so mount this in a
 * sized container (a fixed-height sidebar, a flex/grid track, `h-full`) — not one
 * that sizes to its content.
 *
 * Engine-agnostic: the schema + engine⇄form mapping for each `kind` comes from
 * the injected {@link CanvasSettingsEditorPanelProps.schemas | schemas} registry
 * (default {@link DEFAULT_CANVAS_SETTINGS_SCHEMAS}); the panel never imports the
 * engine. Instances whose `kind` isn't in the registry are still listed with a
 * "no editor" placeholder, so the panel reflects the whole definition honestly.
 */
export function CanvasSettingsEditorPanel({
  definition,
  schemas = DEFAULT_CANVAS_SETTINGS_SCHEMAS,
  applyMode = 'live',
  title = 'Canvas Settings',
  onChange,
  onToggle,
  onActiveLayoutChange,
  className,
}: CanvasSettingsEditorPanelProps) {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();

  // Which instance rows are open, per section — controlled so a row can be
  // force-collapsed when its instance is toggled off.
  const [openRows, setOpenRows] = useState<Record<string, string[]>>({});

  const instancesBySection = useMemo(() => {
    const map: Record<SettingsSection, CanvasSettingsInstance[]> = {
      layers: definition.layers ?? [],
      behaviours: definition.behaviours ?? [],
      layouts: definition.layouts ?? [],
    };
    return map;
  }, [definition]);

  const noMatches =
    q !== '' &&
    !SECTIONS.some(
      (s) =>
        s.label.toLowerCase().includes(q) ||
        instancesBySection[s.id].some((inst) =>
          instanceHaystack(inst, schemas[inst.kind]).includes(q),
        ),
    );

  // The file-browser body for one section — the list of instances, each an
  // expandable row (VS Code explorer files under a folder). Rendered as a
  // `PanelStack` section's `content` below.
  const renderSectionItems = (sectionId: SettingsSection, items: CanvasSettingsInstance[]): ReactNode =>
    items.length === 0 ? (
      <p className="px-2 py-1 text-xs italic text-muted-foreground">None registered</p>
    ) : (
      // One expandable instance per row, with a tree-style indentation guide line.
      <div className="ml-2 border-l pl-2">
        <Accordion
          type="multiple"
          value={openRows[sectionId] ?? []}
          onValueChange={(v) => setOpenRows((s) => ({ ...s, [sectionId]: v }))}
        >
          {items.map((inst) => {
            const entry = schemas[inst.kind];
            const rowValue = `${sectionId}:${inst.id}`;
            // Layers + behaviours toggle on/off; layouts use "active".
            const toggleable = sectionId !== 'layouts' && inst.enabled !== undefined;
            const rowOff = toggleable && inst.enabled === false;
            const isActive = sectionId === 'layouts' && inst.id === definition.activeLayoutId;

            return (
              <AccordionItem key={inst.id} value={rowValue} className="last:border-b-0">
                <div className="flex items-center gap-2">
                  {toggleable && (
                    <Switch
                      checked={inst.enabled !== false}
                      onCheckedChange={(v) => {
                        onToggle?.(sectionId, inst.id, v);
                        if (!v)
                          setOpenRows((s) => ({
                            ...s,
                            [sectionId]: (s[sectionId] ?? []).filter((val) => val !== rowValue),
                          }));
                      }}
                      aria-label={`Toggle ${inst.id}`}
                      className="ml-1 shrink-0"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <AccordionTrigger
                      disabled={rowOff}
                      className={cn('py-2 hover:no-underline', CHEVRON_RIGHT, rowOff && 'opacity-50')}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate font-medium">{inst.id}</span>
                        <span className="truncate text-xs text-muted-foreground">
                          {inst.typeLabel ?? entry?.typeLabel ?? inst.kind}
                        </span>
                        {isActive && (
                          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                            active
                          </Badge>
                        )}
                        {!entry && (
                          <Badge variant="outline" className="px-1.5 py-0 text-[10px] opacity-60">
                            no editor
                          </Badge>
                        )}
                      </span>
                    </AccordionTrigger>
                  </div>
                </div>
                <AccordionContent className="p-0">
                  <div className="ml-2 border-l pl-2">
                    {/* Layouts: offer activation for the non-active ones. */}
                    {sectionId === 'layouts' && !isActive && onActiveLayoutChange && (
                      <div className="px-3 pt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onActiveLayoutChange(inst.id)}
                        >
                          Make active
                        </Button>
                      </div>
                    )}
                    {entry ? (
                      <InstanceEditor
                        entry={entry}
                        instance={inst}
                        applyMode={applyMode}
                        onChange={(patch) => onChange?.(sectionId, inst.id, patch)}
                      />
                    ) : (
                      <p className="px-3 py-2 text-xs italic text-muted-foreground">
                        No settings editor registered for {inst.kind}.
                      </p>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
    );

  // Map the three folders → `PanelStack` sections. Each is a collapsible,
  // resizable panel in the VS-Code "view container" stack; its body is the
  // file-browser list. A search query that hides every instance in a section
  // drops that section from the stack.
  const sections: PanelStackSection[] = SECTIONS.map((section) => {
    const sectionMatches = q !== '' && section.label.toLowerCase().includes(q);
    const items = instancesBySection[section.id].filter(
      (inst) => !q || sectionMatches || instanceHaystack(inst, schemas[inst.kind]).includes(q),
    );
    return { section, items };
  })
    .filter(({ items }) => !q || items.length > 0)
    .map(({ section, items }) => ({
      id: section.id,
      title: (
        <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {section.label}
          <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
            {instancesBySection[section.id].length}
          </Badge>
        </span>
      ),
      content: renderSectionItems(section.id, items),
    }));

  return (
    // `PanelStack` fills its parent's height, so the card is a full-height flex
    // column and the stack takes the remaining space under the title + search.
    <Card className={cn('flex h-full w-full flex-col', className)}>
      <CardContent className="flex min-h-0 flex-1 flex-col gap-1 p-2">
        {title != null && <h2 className="px-1 py-1 text-base font-semibold">{title}</h2>}

        <div className="relative mb-1 px-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search settings…"
            className="h-8 pl-8"
          />
        </div>

        {noMatches ? (
          <p className="px-2 py-6 text-center text-sm italic text-muted-foreground">
            No settings match “{query.trim()}”.
          </p>
        ) : (
          // Folders: Layers / Behaviours / Layouts — a resizable, collapsible stack.
          <div className="min-h-0 flex-1">
            <PanelStack sections={sections} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
