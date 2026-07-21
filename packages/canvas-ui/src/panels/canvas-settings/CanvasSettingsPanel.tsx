import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CanvasContext, useCanvas, useGraphCanvasOptions } from '@invana/canvas-react';

import {
  CanvasSettingsEditor,
  type CanvasSettingsDefinition,
  type CanvasSettingsInstance,
  type SettingsSection,
} from '../../editors/canvas-settings';

/**
 * Best-effort read of a live instance's current options, for seeding the panel.
 * Generic — **no engine imports**: prefers `getOptions()`, falls back to
 * `.options`, else `{}`.
 */
function readOptions(instance: unknown): Record<string, unknown> {
  const getOptions = (instance as { getOptions?: () => unknown }).getOptions;
  if (typeof getOptions === 'function') {
    const opts = getOptions.call(instance);
    if (opts && typeof opts === 'object') return { ...(opts as Record<string, unknown>) };
  }
  const options = (instance as { options?: unknown }).options;
  if (options && typeof options === 'object') return { ...(options as Record<string, unknown>) };
  return {};
}

/**
 * Default `kind` resolver: an instance's own stable `kind` field (every engine
 * Behaviour/Layer/Layout exposes one, matching this package's settings-editor
 * registry key), falling back to the constructor name.
 *
 * The `kind` field is minification-safe, so this default is production-safe for
 * all built-in surfaces. The `constructor.name` fallback only ever applies to a
 * custom class that hasn't set `kind` (unreliable when minified — give such a
 * class a `kind`, or pass an explicit `resolveKind`). Resolution stays here (not
 * an `instanceof` map) so this UI kit imports no engine classes.
 */
const defaultResolveKind = (instance: unknown): string | undefined =>
  (instance as { kind?: string }).kind ??
  (instance as { constructor?: { name?: string } }).constructor?.name;

export interface CanvasSettingsPanelProps {
  /** Extra classes for the editor (e.g. to flatten card chrome in a docked region). */
  className?: string;
  /**
   * Map a live layer/behaviour/layout instance to its `CanvasSettingsEditor`
   * registry `kind`. Defaults to `instance.kind ?? constructor.name`; pass a
   * class-based (`instanceof`) resolver for minified builds.
   */
  resolveKind?: (instance: unknown) => string | undefined;
}

type Introspected = { id: string; kind?: string; inst: unknown };

/**
 * Store-connected canvas settings panel — **zero config**. Drop it anywhere
 * inside a `<Canvas>` / `<GraphCanvas>` / `GraphCanvasApp` subtree and it binds to
 * that canvas via context (multi-canvas safe), reads the live definition, and
 * applies every edit through `@invana/canvas-store`. The packaged form of the
 * introspection ↔ {@link CanvasSettingsEditor} bridge, so consumers never
 * hand-wire one.
 *
 * - reads `store.view.definition` **reactively** via `useGraphCanvasOptions`, so
 *   it re-renders on any config change from anywhere (this panel, other UI, or
 *   the engine);
 * - writes edits / toggles / layout picks via that hook's `update` →
 *   `canvas.update(...)`.
 *
 * The instance **list** (id + `kind`) is introspected from the live registries
 * once per canvas — the store is domain-free (no class/kind), so `kind` is
 * resolved from each instance (see {@link CanvasSettingsPanelProps.resolveKind}).
 */
export function CanvasSettingsPanel(props: CanvasSettingsPanelProps) {
  // Null-safe gate: `useCanvas()` (in the inner body) throws on a null context,
  // and some hosts mount panel content **before** the engine is ready — notably
  // `GraphCanvasApp`'s lifted `right` region, whose `CanvasContext` is null until
  // the ready-bridge publishes the engine. Hold until it's non-null, so the panel
  // is genuinely drop-anywhere (consumer writes nothing).
  const canvas = useContext(CanvasContext);
  if (!canvas) return null;
  return <CanvasSettingsPanelInner {...props} />;
}

function CanvasSettingsPanelInner({
  className,
  resolveKind = defaultResolveKind,
}: CanvasSettingsPanelProps) {
  const canvas = useCanvas();
  const [options, update] = useGraphCanvasOptions();

  // Keep the resolver in a ref so an inline `resolveKind` prop doesn't re-run the
  // introspection effect every render.
  const resolveKindRef = useRef(resolveKind);
  resolveKindRef.current = resolveKind;

  const [instances, setInstances] = useState<{
    layers: Introspected[];
    behaviours: Introspected[];
    layouts: Introspected[];
  }>({ layers: [], behaviours: [], layouts: [] });

  useEffect(() => {
    const map = (list: readonly { id: string }[]): Introspected[] =>
      list.map((i) => ({ id: i.id, kind: resolveKindRef.current(i), inst: i as unknown }));
    setInstances({
      layers: map(canvas.layers.list()),
      behaviours: map(canvas.behaviours.list()),
      layouts: map(canvas.layouts.list()),
    });
  }, [canvas]);

  // Merge the stable instance list with the reactive store definition: the
  // instance's full options as a base, the store's serialisable slice on top;
  // `enabled` reads from the store, falling back to the live instance.
  const definition: CanvasSettingsDefinition = useMemo(() => {
    const build = (
      list: Introspected[],
      bag: Record<string, Record<string, unknown>> | undefined,
      withEnabled: boolean,
    ): CanvasSettingsInstance[] =>
      list.map(({ id, kind, inst }) => {
        const stored = bag?.[id];
        return {
          id,
          kind: kind ?? (inst as object).constructor.name,
          settings: { ...readOptions(inst), ...(stored ?? {}) },
          ...(withEnabled
            ? {
                enabled:
                  (stored as { enabled?: boolean } | undefined)?.enabled ??
                  (inst as { enabled?: boolean }).enabled,
              }
            : {}),
        };
      });

    return {
      layers: build(instances.layers, options.layers, false),
      behaviours: build(instances.behaviours, options.behaviours, true),
      layouts: build(instances.layouts, options.layouts, false),
      activeLayoutId: options.activeLayout ?? undefined,
    };
  }, [instances, options]);

  return (
    <CanvasSettingsEditor
      definition={definition}
      className={className}
      onChange={(section: SettingsSection, id, patch) => update({ [section]: { [id]: patch } })}
      onToggle={(section: SettingsSection, id, enabled) => update({ [section]: { [id]: { enabled } } })}
      onActiveLayoutChange={(id) => update({ activeLayout: id })}
    />
  );
}
