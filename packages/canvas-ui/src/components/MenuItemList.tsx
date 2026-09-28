import { MenuItem, cn, type MenuItem as MenuItemSpec } from '@invana/ui';

export interface MenuItemListProps {
  /** Menu tree to render (leaves carry their own `onClick`). */
  items: readonly MenuItemSpec[];
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
export function MenuItemList({ items, className }: MenuItemListProps) {
  return (
    <nav className={cn('w-[220px] !py-0 border bg-card text-card-foreground shadow-sm', className)} role="menubar">
      <ul className="space-y-0.5 p-0" role="menu">
        {items.map((item) => (
          <MenuItem key={item.id} {...item} className={cn('px-3 py-1.5', item.className)} />
        ))}
      </ul>
    </nav>
  );
}
