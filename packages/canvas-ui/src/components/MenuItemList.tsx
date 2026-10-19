import { MenuItem, cn, type MenuItem as MenuItemSpec } from '@invana/ui';

/** What a menu is for, drawn above its rows — `LHR · airport` with the type's colour. */
export interface MenuHeader {
  /** The target — a node's name, `Board`, `Selection`. */
  title: string;
  /** Beside it, muted — the type, a count. */
  sub?: string;
  /** A colour dot before the title — the node type's swatch. */
  swatch?: string;
}

export interface MenuItemListProps {
  /** Menu tree to render (leaves carry their own `onClick`). */
  items: readonly MenuItemSpec[];
  /** What the menu is for, above its rows. */
  header?: MenuHeader;
  /** Extra classes on the `<nav>`. */
  className?: string;
}

/**
 * A menu tree of `@invana/ui` `MenuItem`s — `NestedMenu`'s markup, except each
 * top-level item's own `className` is **kept**. `NestedMenu` replaces it with its
 * padding, which drops the dimmed class `commandMenuItems` puts on a disabled
 * command, so a disabled item there looks clickable. Nested items already keep
 * theirs.
 */
export function MenuItemList({ items, header, className }: MenuItemListProps) {
  return (
    <nav className={cn('w-[220px] !py-0 border bg-card text-card-foreground shadow-sm', className)} role="menubar">
      {header && (
        <div className="text-muted-foreground flex items-center gap-1.5 px-3 pt-2 pb-1 text-xs">
          {header.swatch && (
            // The swatch is the type's drawn colour — a runtime value.
            <span className="size-2 shrink-0 rounded-full" style={{ background: header.swatch }} />
          )}
          <span className="text-foreground truncate font-semibold">{header.title}</span>
          {header.sub && <span className="truncate font-mono">{header.sub}</span>}
        </div>
      )}
      <ul className="space-y-0.5 p-0" role="menu">
        {items.map((item) => (
          <MenuItem key={item.id} {...item} className={cn('px-3 py-1.5', item.className)} />
        ))}
      </ul>
    </nav>
  );
}
