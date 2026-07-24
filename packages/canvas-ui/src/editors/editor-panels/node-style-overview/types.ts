/**
 * The one field the {@link NodeStyleOverviewEditorPanel} renders — a single colour
 * (`#rrggbb`, the swatch encoding). Deliberately minimal: the "overview" editor
 * only recolours a node, working for both simple shapes and composite cards.
 * `colorToForm` / `formToColor` (`mapping.ts`) round-trip it against the engine's
 * `0xRRGGBB`.
 */
export interface NodeStyleOverviewFields {
  /** Node colour (`#rrggbb`). */
  color?: string;
}

/**
 * react-hook-form state shape. `<ObjectField name="overview" …>` registers the
 * colour leaf at `overview.color`.
 */
export interface NodeStyleOverviewFormState {
  overview: NodeStyleOverviewFields;
}
