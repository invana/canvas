import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Badge,
  cn,
} from '@invana/ui';

import { useCanvas } from '../CanvasContext';
import { useGraphCanvasUpdate } from '../hooks/useGraphCanvasUpdate';

/**
 * The three config sections a {@link CanvasSettingsBrowser} browses — mirroring
 * the id-keyed compartments of `CanvasConfig` (`layers` / `behaviours` /
 * `layouts`). A patch for an instance is applied under its section:
 * `canvas.update({ [section]: { [id]: patch } })`.
 */
export type SettingsSection = 'layers' | 'behaviours' | 'layouts';

/**
 * What a {@link SettingsEditorDescriptor.render} receives for one live instance:
 * its id + section, the current options seeded off the instance, and an
 * {@link SettingsEditorContext.apply | apply} callback that pushes a serialisable
 * options patch to the running canvas.
 */
export interface SettingsEditorContext {
  /** The live engine instance (a `Layer` / `Behaviour` / `Layout`). */
  instance: unknown;
  /** The instance's registry id — the key its config lives under. */
  id: string;
  /** Which `CanvasConfig` section a patch applies under. */
  section: SettingsSection;
  /**
   * Current options read off the instance (via {@link SettingsEditorDescriptor.read}
   * when given, else the instance's `getOptions()`, else `{}`). Seed the editor's
   * form from this.
   */
  options: Record<string, unknown>;
  /**
   * Push a serialisable options patch to the live canvas —
   * `canvas.update({ [section]: { [id]: patch } })` → the matching instance's
   * `setOptions`. The editor's `onSubmit` maps its form back to options and calls
   * this.
   */
  apply: (patch: Record<string, unknown>) => void;
}

/**
 * Binds a class of engine instance to the UI that edits it. The browser matches
 * each live instance against every descriptor for its section and renders the
 * first {@link SettingsEditorDescriptor.match | match}'s editor; unmatched
 * instances get a "no editor" placeholder.
 *
 * Descriptors are **injected by the consumer** — the browser lives in
 * `@invana/canvas-react` (which can't depend on the editor package
 * `@invana/canvas-ui`), so the host supplies `render` closing over whichever
 * editor + options↔form mapping it wants. Match by class reference
 * (`(i) => i instanceof BackgroundLayer`) so it survives minified builds.
 */
export interface SettingsEditorDescriptor {
  /** Which section's instances this descriptor can edit. */
  section: SettingsSection;
  /** `true` if this descriptor handles the given live instance. */
  match: (instance: unknown) => boolean;
  /**
   * Human label for the instance's kind (e.g. `'Background Layer'`). Falls back
   * to the instance's constructor name.
   */
  typeLabel?: string;
  /**
   * Read the instance's current options to seed the editor. Defaults to the
   * instance's `getOptions()` when present, else `{}`.
   */
  read?: (instance: unknown) => Record<string, unknown>;
  /** Render the editor UI for one instance. */
  render: (ctx: SettingsEditorContext) => ReactNode;
}

export interface CanvasSettingsBrowserProps {
  /**
   * Editor descriptors, matched against the live instances. An instance with no
   * matching descriptor renders a muted "no editor" placeholder row (so the
   * browser still lists the full bundle honestly). Default `[]`.
   */
  registry?: SettingsEditorDescriptor[];
  /**
   * Which sections to show, in order. Default
   * `['layers', 'behaviours', 'layouts']`.
   */
  sections?: SettingsSection[];
  /**
   * Id of the active layout (badged in the Layouts group). Optional — pass the
   * `activeLayout` from your `CanvasConfig` if you want the marker.
   */
  activeLayoutId?: string;
  className?: string;
}

/** A live instance flattened into a browsable row. */
interface Row {
  section: SettingsSection;
  id: string;
  typeName: string;
  instance: unknown;
  /** Present for behaviours — drives the on/off badge. */
  enabled?: boolean;
  descriptor?: SettingsEditorDescriptor;
}

const SECTION_LABEL: Record<SettingsSection, string> = {
  layers: 'Layers',
  behaviours: 'Behaviours',
  layouts: 'Layouts',
};

const DEFAULT_SECTIONS: SettingsSection[] = ['layers', 'behaviours', 'layouts'];

/** Best-effort read of an instance's current options for seeding an editor. */
function readOptions(
  instance: unknown,
  descriptor: SettingsEditorDescriptor | undefined,
): Record<string, unknown> {
  if (descriptor?.read) return descriptor.read(instance);
  const getOptions = (instance as { getOptions?: () => unknown }).getOptions;
  if (typeof getOptions === 'function') {
    const opts = getOptions.call(instance);
    if (opts && typeof opts === 'object') return { ...(opts as Record<string, unknown>) };
  }
  // Some layers expose a public `options` field instead of a getter.
  const options = (instance as { options?: unknown }).options;
  if (options && typeof options === 'object') return { ...(options as Record<string, unknown>) };
  return {};
}

/**
 * `CanvasSettingsBrowser` — a **file-browser-style settings panel** for a live
 * canvas. Introspects the engine's three registries (`canvas.layers` /
 * `behaviours` / `layouts`), lists every registered instance grouped by kind in
 * a nested accordion, and expands each row **in place** to its settings editor.
 * Editing applies live through `canvas.update` → the instance's `setOptions`.
 *
 * The editors themselves are **injected** via {@link CanvasSettingsBrowserProps.registry}
 * (this package can't import `@invana/canvas-ui`), so the same shell drives the
 * building studio and Storybook alike. Instances with no matching descriptor are
 * still listed, with a "no editor" placeholder — the browser reflects the whole
 * bundle, not just the editable slice.
 *
 * Must be rendered inside a `<Canvas>` (it reads the engine from context).
 */
export function CanvasSettingsBrowser({
  registry = [],
  sections = DEFAULT_SECTIONS,
  activeLayoutId,
  className,
}: CanvasSettingsBrowserProps) {
  const canvas = useCanvas();
  const update = useGraphCanvasUpdate();

  // Introspect the registries after mount. The browser is typically a later
  // child of <Canvas> than the bundle it inspects, so their registration
  // effects have already run; re-reading in an effect (rather than during
  // render) guarantees we see a fully-populated registry.
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    const collect: Row[] = [];
    for (const section of sections) {
      const instances =
        section === 'layers'
          ? canvas.layers.list()
          : section === 'behaviours'
            ? canvas.behaviours.list()
            : canvas.layouts.list();
      for (const instance of instances) {
        const id = (instance as { id: string }).id;
        const descriptor = registry.find((d) => d.section === section && d.match(instance));
        collect.push({
          section,
          id,
          typeName: descriptor?.typeLabel ?? (instance as object).constructor.name,
          instance,
          enabled:
            section === 'behaviours'
              ? (instance as { enabled?: boolean }).enabled
              : undefined,
          descriptor,
        });
      }
    }
    setRows(collect);
  }, [canvas, registry, sections]);

  const rowsBySection = useMemo(() => {
    const map = new Map<SettingsSection, Row[]>();
    for (const section of sections) map.set(section, []);
    for (const row of rows) map.get(row.section)?.push(row);
    return map;
  }, [rows, sections]);

  return (
    <div className={cn('flex flex-col gap-1 p-2 text-sm', className)}>
      <Accordion type="multiple" defaultValue={sections}>
        {sections.map((section) => {
          const sectionRows = rowsBySection.get(section) ?? [];
          return (
            <AccordionItem key={section} value={section} className="border-b-0">
              <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline">
                <span className="flex items-center gap-2">
                  {SECTION_LABEL[section]}
                  <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                    {sectionRows.length}
                  </Badge>
                </span>
              </AccordionTrigger>
              <AccordionContent className="pb-1 pl-1">
                {sectionRows.length === 0 ? (
                  <p className="px-2 py-1 text-xs italic text-muted-foreground">None registered</p>
                ) : (
                  <Accordion type="multiple">
                    {sectionRows.map((row) => (
                      <AccordionItem key={row.id} value={`${section}:${row.id}`}>
                        <AccordionTrigger className="py-2 hover:no-underline">
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="truncate font-medium">{row.id}</span>
                            <span className="truncate text-xs text-muted-foreground">
                              {row.typeName}
                            </span>
                            {row.enabled !== undefined && (
                              <Badge
                                variant={row.enabled ? 'default' : 'outline'}
                                className="px-1.5 py-0 text-[10px]"
                              >
                                {row.enabled ? 'on' : 'off'}
                              </Badge>
                            )}
                            {section === 'layouts' && row.id === activeLayoutId && (
                              <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                                active
                              </Badge>
                            )}
                            {!row.descriptor && (
                              <Badge variant="outline" className="px-1.5 py-0 text-[10px] opacity-60">
                                no editor
                              </Badge>
                            )}
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          {row.descriptor ? (
                            row.descriptor.render({
                              instance: row.instance,
                              id: row.id,
                              section,
                              options: readOptions(row.instance, row.descriptor),
                              apply: (patch) => update({ [section]: { [row.id]: patch } }),
                            })
                          ) : (
                            <p className="px-3 py-2 text-xs italic text-muted-foreground">
                              No settings editor registered for {row.typeName}.
                            </p>
                          )}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
