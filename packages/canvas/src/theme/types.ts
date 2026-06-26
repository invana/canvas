/**
 * Theme signal — the engine-level, **graph-agnostic** shape of a resolved theme.
 *
 * The canvas engine knows nothing about *named palettes*, *roles*, or
 * light/dark *registries* — that vocabulary lives in domain packages
 * (`@invana/graph` ships the `ColorRole` → hex `Theme`s and the
 * `ThemeBehaviour` that publishes them). All the engine holds is the
 * **resolved** result: a flat `role → number` palette plus the active
 * `kind`/`name`, carried on {@link CanvasContext.theme} and broadcast on the
 * `'theme:change'` event.
 *
 * Theme-aware layers ({@link BackgroundLayer}, `MiniMapLayer`, graph's
 * `GraphLayer`) subscribe to `'theme:change'` and recolour themselves from the
 * palette; everything stays pure-numeric by the time it reaches the renderer.
 */

/**
 * A theme resolved down to concrete numbers — the only theme shape the engine
 * understands. Plain-JSON (numbers + strings) so it passes the bus's dev-time
 * serialisability check.
 */
export interface ResolvedTheme {
  /** Whether this is the light or dark variant of the active theme. */
  readonly kind: 'light' | 'dark';
  /** Active theme name (`'default'` | `'forest'` | … — opaque to the engine). */
  readonly name: string;
  /**
   * Role → colour map. Keys are **string role names** (the engine stays
   * graph-agnostic — it never enumerates the role vocabulary). Layers read the
   * roles they care about (e.g. `'surface'`, `'divider'`) and ignore the rest.
   */
  readonly palette: Readonly<Record<string, number>>;
  /** Optional fill-by-category ramp (e.g. for colour-by-type behaviours). */
  readonly categorical?: readonly number[];
}

/**
 * The theme channel on {@link CanvasContext}. A **single publisher** (the
 * domain `ThemeBehaviour`) calls {@link set}; every theme-aware layer reads
 * {@link current} and/or subscribes to the `'theme:change'` event. The engine
 * itself never resolves light/dark — it only relays what the publisher sets.
 */
export interface ThemeState {
  /** The currently-published resolved theme, or `null` before any is set. */
  current(): ResolvedTheme | null;
  /** Store a resolved theme and broadcast `'theme:change'` on the bus. */
  set(theme: ResolvedTheme): void;
}
