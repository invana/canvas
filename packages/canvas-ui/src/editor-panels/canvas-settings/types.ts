// Public types for `CanvasSettingsEditorPanel` — the JSON shape it edits and the
// callbacks it emits. The panel is engine-agnostic: it takes a serialisable
// definition of the visualisation's layers / behaviours / layouts + their
// settings, and hands edits back as engine-shaped patches for the host to apply
// (live via `canvas.update(...)`, or however it likes).

/**
 * The three id-keyed config sections, mirroring `CanvasConfig`
 * (`layers` / `behaviours` / `layouts`). A patch for an instance applies under
 * its section: `canvas.update({ [section]: { [id]: patch } })`.
 */
export type SettingsSection = 'layers' | 'behaviours' | 'layouts';

/**
 * One editable instance in the definition — a registered Layer / Behaviour /
 * Layout. `kind` keys into the schema registry to resolve its form; `settings`
 * are the instance's current **engine-shaped** options (the panel maps them to
 * flat form values internally via the registry entry's `toForm`).
 */
export interface CanvasSettingsInstance {
  /** The instance's registry id — the key its config lives under. */
  id: string;
  /** Registry key (e.g. `'background-layer'`); resolves the field schema + mappers. */
  kind: string;
  /** Overrides the registry's display label for this instance. */
  typeLabel?: string;
  /**
   * Enable state for layers / behaviours — drives the row's toggle. `undefined`
   * (the norm for layouts) hides the toggle.
   */
  enabled?: boolean;
  /** The instance's current options, in the engine's shape (pre-mapping). */
  settings?: Record<string, unknown>;
}

/**
 * The full canvas settings definition the panel browses — every registered
 * instance grouped by section, plus the active layout id (badged in the Layouts
 * group).
 */
export interface CanvasSettingsDefinition {
  layers?: CanvasSettingsInstance[];
  behaviours?: CanvasSettingsInstance[];
  layouts?: CanvasSettingsInstance[];
  /** Id of the active layout — badged `active` in the Layouts group. */
  activeLayoutId?: string;
}
