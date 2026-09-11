// CanvasPagesViewPanel — a tab strip over a set of "pages" (boards), styled like
// a Bootstrap `nav-tabs` folder-tab bar. The active tab exposes a **dropdown of
// developer-supplied actions** (rename / duplicate / remove / …) via a caret,
// instead of a fixed set of inline icons — the consumer decides what a page can
// do by passing `pageMenuItems`.
//
// The strip itself is `@invana/ui`'s `NavItems` in its `folder` variant, with
// `selectionMode="tabs"` and `menuTrigger="caret"` — the same renderer that
// draws the kit's nav rails and `TabbedPanel`'s header. The folder look moved
// into the kit's variant table unchanged, so this renders as it always did and
// gains what the hand-rolled strip never had: roving-tabindex keyboard
// navigation and `…` overflow folding instead of a sideways scroll.
//
// Presentational + engine-agnostic (a `view-panels/` component): it renders tabs
// and page content and reports intent through callbacks (`onSelect` / `onAdd`,
// plus each menu item's `onSelect(pageId)`). It owns no page state — the consumer
// holds the page list and the active id and re-renders on change. The classic use
// is one `<GraphCanvasApp>` per page, but nothing here knows that — `content` is
// any `ReactNode`.
//
// State retention across tab switches is opt-in via `keepMounted` (default on):
// every page stays mounted and inactive ones are hidden (absolutely stacked,
// full-size, `visibility: hidden`), so switching a tab is pure visibility and a
// canvas keeps its camera / layout / selection. With `keepMounted={false}` only
// the active page is mounted (inactive pages unmount — cheaper, but their state
// is torn down).

import { cn, NavItems } from '@invana/ui';
import type { NavItemConfig, NavMenuItem } from '@invana/ui';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useId, useMemo } from 'react';
import type { CSSProperties, ElementType, ReactNode } from 'react';

/** One page in the strip — its tab label plus the content shown when active. */
export interface CanvasPage {
  /** Stable identity — the key for mounting and the value passed to callbacks. */
  id: string;
  /** Tab label. */
  title: string;
  /** What renders in the body when this page is active (or, with
   *  `keepMounted`, stays mounted-but-hidden while another page is active). */
  content: ReactNode;
  /** Optional leading icon in the tab. */
  icon?: ElementType;
  /** Disable selecting this tab. */
  disabled?: boolean;
  /** Extra classes for *this* tab button (win over the built-ins via
   *  tailwind-merge) — e.g. a per-page accent. */
  tabClassName?: string;
  /** Inline styles for *this* tab button — e.g. a custom brand colour. */
  tabStyle?: CSSProperties;
}

/**
 * One entry in the active tab's actions dropdown. The consumer supplies the list
 * (`pageMenuItems`); each item's `onSelect` is invoked with the id of the page
 * whose menu is open. This is how a host declares what a page can do — rename,
 * duplicate, remove, export, … — without the view knowing any of those verbs.
 */
export interface CanvasPageMenuItem {
  /** Stable key for the row. */
  id: string;
  /** Row label. */
  label: string;
  /** Optional leading icon. */
  icon?: ElementType;
  /** Invoked with the active page's id when the row is chosen. */
  onSelect: (pageId: string) => void;
  /** Render with destructive (danger) styling — e.g. "Remove". */
  destructive?: boolean;
  /** Disable the row — a boolean, or a predicate on the page id (e.g. disable
   *  "Remove" on the last remaining page). */
  disabled?: boolean | ((pageId: string) => boolean);
  /** Draw a separator immediately *before* this row (to group actions). */
  separatorBefore?: boolean;
}

/**
 * An extra icon button for the header's right-pinned control cluster (next to the
 * pager / `+`) — e.g. settings, about, help. Strip-level, not per-page: its
 * `onSelect` takes no page id. The consumer supplies the list via `headerActions`.
 */
export interface CanvasHeaderAction {
  /** Stable key for the button. */
  id: string;
  /** Accessible label / tooltip. */
  label: string;
  /** Icon component. */
  icon: ElementType;
  /** Click handler. */
  onClick: () => void;
  /** Optional disabled state. */
  disabled?: boolean;
}

export interface CanvasPagesViewPanelProps {
  /** The pages, in tab order. */
  pages: CanvasPage[];
  /** Id of the active page. */
  activeId: string;
  /** Select a page (tab click). */
  onSelect: (id: string) => void;
  /** Show a `+` (in the pager cluster) that requests a new page. Omit to hide it. */
  onAdd?: () => void;
  /** Which end of the strip the pager cluster (prev / next / `+`) docks at —
   *  `'start'` (left of the tabs) or `'end'` (right of the tabs). Default `'end'`. */
  pagerPosition?: 'start' | 'end';
  /** Extra icon buttons pinned to the far right of the strip (right of the pager)
   *  — e.g. settings, about. Optional. */
  headerActions?: CanvasHeaderAction[];
  /** Actions offered on the **active** tab via a caret dropdown. Omit (or pass an
   *  empty list) to hide the caret entirely. */
  pageMenuItems?: CanvasPageMenuItem[];
  /** Tooltip / aria label for the add button. */
  addLabel?: string;
  /**
   * Accessible label for the active tab's dropdown trigger.
   *
   * @deprecated The strip now renders through `NavItems`, which labels a caret
   * `"<page title> menu"` so the label names the page it acts on. Kept so
   * existing call sites keep compiling; it no longer reaches the DOM.
   */
  menuLabel?: string;
  /** Fold tabs that don't fit into a `…` menu at the end of the strip, instead of
   *  scrolling the strip horizontally. Default `true` — the pager still steps
   *  through every page, folded or not. */
  overflow?: boolean;
  /** Accessible label / tooltip for the overflow (`…`) trigger. */
  overflowLabel?: string;
  /** Keep every page mounted and hide the inactive ones (default `true`), so a
   *  page's state (e.g. a canvas's camera / layout) survives tab switches. Set
   *  `false` to mount only the active page. */
  keepMounted?: boolean;
  /** Extra classes on the root column. */
  className?: string;
  /** Extra classes on the header (tab strip). */
  headerClassName?: string;
  /** Extra classes on the body. */
  bodyClassName?: string;
  /** Extra classes applied to *every* tab button (win over the built-ins via
   *  tailwind-merge). Per-page `CanvasPage.tabClassName` layers on top of this. */
  tabClassName?: string;
  /** Extra classes applied to the **active** tab only — override the default
   *  folder-tab look (e.g. a different accent colour). */
  activeTabClassName?: string;
}

// A header icon button — the shared chrome for the pager (prev / next / +) and
// for consumer `headerActions`, so they all render identically.
function HeaderIconButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: ElementType;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className="grid h-full w-8 shrink-0 place-items-center rounded-none text-muted-foreground hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

// The pager cluster — previous / next tab + the `+` add button — as one unit that
// can dock at either end of the strip (`position`), with its divider on the side
// that faces the tabs. Renders nothing when there's neither a pager nor `onAdd`.
function PagerControls({
  position,
  hasPager,
  canPrev,
  canNext,
  onPrev,
  onNext,
  onAdd,
  addLabel,
}: {
  position: 'start' | 'end';
  hasPager: boolean;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  onAdd?: () => void;
  addLabel: string;
}) {
  if (!hasPager && !onAdd) return null;
  return (
    <div className={cn('flex shrink-0 items-stretch', position === 'start' ? 'border-r' : 'border-l')}>
      {hasPager ? (
        <>
          <HeaderIconButton icon={ChevronLeft} label="Previous tab" onClick={onPrev} disabled={!canPrev} />
          <HeaderIconButton icon={ChevronRight} label="Next tab" onClick={onNext} disabled={!canNext} />
        </>
      ) : null}
      {onAdd ? <HeaderIconButton icon={Plus} label={addLabel} onClick={onAdd} /> : null}
    </div>
  );
}

/**
 * A Bootstrap-style tab strip over independent pages. The active tab carries a
 * caret dropdown of consumer-supplied {@link CanvasPageMenuItem}s (rename /
 * duplicate / remove / …). Presentational and engine-agnostic — the consumer owns
 * the page list + active id and applies the reported intents. See the module
 * header for `keepMounted` and strip-renderer notes.
 */
export function CanvasPagesViewPanel({
  pages,
  activeId,
  onSelect,
  onAdd,
  pagerPosition = 'end',
  headerActions,
  pageMenuItems,
  addLabel = 'New page',
  overflow = true,
  overflowLabel = 'More pages',
  keepMounted = true,
  className,
  headerClassName,
  bodyClassName,
  tabClassName,
  activeTabClassName,
}: CanvasPagesViewPanelProps) {
  const activePage = pages.find((p) => p.id === activeId);
  const activeIndex = pages.findIndex((p) => p.id === activeId);

  // Stable prefix for the `aria-controls` ↔ `role="tabpanel"` pairing.
  const uid = useId();
  const panelId = (pageId: string): string => `${uid}-page-${pageId}`;

  // Pages → nav items. The caret menu hangs off the **active** tab only (as it
  // always has), so an inactive tab stays a plain tab; `menuTrigger="caret"`
  // keeps the tab body selecting while only the chevron opens the menu.
  const items = useMemo<NavItemConfig[]>(
    () =>
      pages.map((page) => {
        const active = page.id === activeId;
        const menuItems: NavMenuItem[] | undefined =
          active && pageMenuItems && pageMenuItems.length > 0
            ? pageMenuItems.map((item) => ({
                id: item.id,
                label: item.label,
                icon: item.icon,
                destructive: item.destructive,
                separatorBefore: item.separatorBefore,
                disabled:
                  typeof item.disabled === 'function' ? item.disabled(page.id) : item.disabled,
                onSelect: () => item.onSelect(page.id),
              }))
            : undefined;
        return {
          key: page.id,
          name: page.title,
          label: page.title,
          labelClassName: 'max-w-[16ch] truncate',
          icon: page.icon,
          disabled: page.disabled,
          style: page.tabStyle,
          menuItems,
          menuTrigger: 'caret',
          // Ordered so consumer overrides win via tailwind-merge, exactly as the
          // hand-rolled tab did: the strip's own text treatment, then view-level
          // classes (every tab), then per-page, then the active-only view class.
          // `text-muted-foreground` is conditional so the variant's active
          // `text-primary` isn't overridden by it.
          className: cn(
            'shrink-0 text-sm',
            !active && 'text-muted-foreground',
            tabClassName,
            page.tabClassName,
            active && activeTabClassName,
          ),
        };
      }),
    [pages, activeId, pageMenuItems, tabClassName, activeTabClassName],
  );

  // Pager — step the selection to the previous / next tab (disabled at the ends).
  const hasPager = pages.length > 1;
  const goPrev = (): void => {
    if (activeIndex > 0) onSelect(pages[activeIndex - 1]!.id);
  };
  const goNext = (): void => {
    if (activeIndex >= 0 && activeIndex < pages.length - 1) onSelect(pages[activeIndex + 1]!.id);
  };

  const pager = (
    <PagerControls
      position={pagerPosition}
      hasPager={hasPager}
      canPrev={activeIndex > 0}
      canNext={activeIndex >= 0 && activeIndex < pages.length - 1}
      onPrev={goPrev}
      onNext={goNext}
      onAdd={onAdd}
      addLabel={addLabel}
    />
  );

  return (
    <div className={cn('flex h-full min-h-0 flex-col bg-card text-card-foreground', className)}>
      {/* Tab strip — a 30px bordered nav; its `border-b` is the nav bottom line.
          The pager cluster docks at `pagerPosition` (start / end); `headerActions`
          are pinned to the far right, right of the pager. The tabs take the rest
          and fold into a `…` menu when they don't fit. */}
      <div className={cn('flex h-[30px] shrink-0 items-stretch border-b', headerClassName)}>
        {pagerPosition === 'start' ? pager : null}

        {/* `min-w-0` is load-bearing: it's the bounded width the strip measures
            against, without which it reports that everything fits, forever.
            `gap-0` because folder tabs sit flush, unlike a nav rail's chips. */}
        <NavItems
          items={items}
          variant="folder"
          selectionMode="tabs"
          activeKey={activeId}
          onActiveChange={onSelect}
          panelId={panelId}
          overflow={overflow}
          overflowLabel={overflowLabel}
          iconClassName="h-3.5 w-3.5 shrink-0"
          className="min-w-0 flex-1 gap-0"
        />

        {pagerPosition === 'end' ? pager : null}

        {/* Consumer actions (settings / about / …), pinned to the far right. */}
        {headerActions && headerActions.length > 0 ? (
          <div className="flex shrink-0 items-stretch border-l">
            {headerActions.map((action) => (
              <HeaderIconButton
                key={action.id}
                icon={action.icon}
                label={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Body. keepMounted → all pages stacked, inactive hidden (state kept). */}
      <div className={cn('relative min-h-0 flex-1', bodyClassName)}>
        {keepMounted
          ? pages.map((page) => {
              const active = page.id === activeId;
              // Static box lives on `className`; the active-driven visibility /
              // interactivity / stacking stay inline (runtime state).
              const style: CSSProperties = {
                visibility: active ? 'visible' : 'hidden',
                pointerEvents: active ? 'auto' : 'none',
                zIndex: active ? 1 : 0,
              };
              return (
                <div
                  key={page.id}
                  id={panelId(page.id)}
                  role="tabpanel"
                  aria-hidden={!active}
                  className="absolute inset-0"
                  style={style}
                >
                  {page.content}
                </div>
              );
            })
          : activePage && (
              <div id={panelId(activePage.id)} role="tabpanel" className="absolute inset-0">
                {activePage.content}
              </div>
            )}
      </div>
    </div>
  );
}
