/**
 * Shared bits for the built-in composite **card** node types — colours + a
 * couple of helpers reused across `schemaTableCard` / `userCard` / `statCard` /
 * `taskCard`. These builders produce a {@link CompositeShapeOption} from data;
 * consumers wire them via a per-node `shape` resolver:
 *
 * ```ts
 * new GraphLayer({ options: { node: { style: {
 *   shape: (n) => userCard(n.data as UserCardData),
 *   bgStrokeWidth: 0,
 * }}}})
 * ```
 *
 * Colours are dark-theme defaults baked in (matching the story look); the card
 * body / stroke can be overridden per builder, and data-driven accents come
 * from the data. Theme-role colouring is a later enhancement.
 */

/** iconify CDN URL for an icon id like `lucide/users` (used by the `icon` parts). */
export const iconifyUrl = (id: string): string => `https://api.iconify.design/${id}.svg`;

/** Default card body fill (slate-900). */
export const CARD_BG = 0x0f172a;
/** Default card border (slate-700). */
export const CARD_STROKE = 0x334155;
