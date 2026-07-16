// CanvasPagesTabbedView — a tab strip over a set of "pages" (boards), styled like
// a Bootstrap `nav-tabs` folder-tab bar. The active tab exposes a **dropdown of
// developer-supplied actions** (rename / duplicate / remove / …) via a caret,
// instead of a fixed set of inline icons — the consumer decides what a page can
// do by passing `pageMenuItems`.
//
// Presentational + engine-agnostic (a `views/` component): it renders tabs and
// page content and reports intent through callbacks (`onSelect` / `onAdd`, plus
// each menu item's `onSelect(pageId)`). It owns no page state — the consumer
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

import {
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@invana/ui';
import { ChevronDown, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type {
  CSSProperties,
  ElementType,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from 'react';

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

export interface CanvasPagesTabbedViewProps {
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
  /** Accessible label for the active tab's dropdown trigger. */
  menuLabel?: string;
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
}

// The active tab's actions dropdown. The caret trigger is a `role="button"` span
// (not a real `<button>`) so it can nest inside the tab's own `role="tab"` button
// without invalid interactive nesting — same pattern as the Layers panel. The
// menu content is portaled out of the tab, so only the caret lives in the button.
function PageMenu({
  pageId,
  items,
  label,
}: {
  pageId: string;
  items: CanvasPageMenuItem[];
  label: string;
}) {
  // Keep a click on the caret from bubbling to the tab's `onSelect` (the caret
  // only shows on the active tab, so this is belt-and-braces).
  const stop = (e: ReactMouseEvent) => e.stopPropagation();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          role="button"
          tabIndex={0}
          aria-label={label}
          title={label}
          onClick={stop}
          className="grid h-4 w-4 shrink-0 place-items-center rounded text-current/70 hover:bg-accent hover:text-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {items.map((item) => {
          const Icon = item.icon;
          const disabled =
            typeof item.disabled === 'function' ? item.disabled(pageId) : item.disabled;
          return (
            <div key={item.id}>
              {item.separatorBefore ? <DropdownMenuSeparator /> : null}
              <DropdownMenuItem
                disabled={disabled}
                onSelect={() => item.onSelect(pageId)}
                className={cn(
                  item.destructive && 'text-destructive focus:text-destructive',
                )}
              >
                {Icon ? <Icon className="mr-2 h-4 w-4" /> : null}
                {item.label}
              </DropdownMenuItem>
            </div>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// One tab — a Bootstrap `nav-tabs` folder tab rendered as a plain `role="tab"`
// button so it can host the active tab's dropdown caret. Not built on
// `@invana/ui`'s `Tabs`, because Radix `TabsContent` unmounts inactive panels —
// incompatible with `keepMounted`, and its trigger can't host nested controls.
function Tab({
  page,
  active,
  onSelect,
  menuItems,
  menuLabel,
}: {
  page: CanvasPage;
  active: boolean;
  onSelect: () => void;
  menuItems?: CanvasPageMenuItem[];
  menuLabel: string;
}) {
  const Icon = page.icon;
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      disabled={page.disabled}
      onClick={onSelect}
      className={cn(
        // `shrink-0` so tabs keep their intrinsic width and the strip scrolls
        // horizontally when they overflow, rather than compressing.
        'group inline-flex h-full shrink-0 items-center gap-1.5 rounded-none px-3 py-2 text-sm transition-colors',
        'text-muted-foreground hover:text-foreground disabled:pointer-events-none disabled:opacity-50',
        // Bootstrap `nav-tabs` active tab: boxed on top / left / right with an
        // *open bottom* (`border-b-0`) so it merges into the content panel below.
        // The strip's own `border-b` is the nav's bottom line; `mb-[-1px]` drops
        // the active tab 1px so its open bottom punches through that line (the
        // classic folder-tab notch). Rounded top corners + primary text/border.
        active && 'mb-[-1px] rounded-t-md border border-b-0 border-primary text-primary',
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0" /> : null}
      <span className="max-w-[16ch] truncate">{page.title}</span>
      {active && menuItems && menuItems.length > 0 ? (
        <PageMenu pageId={page.id} items={menuItems} label={menuLabel} />
      ) : null}
    </button>
  );
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
 * header for `keepMounted` semantics.
 */
export function CanvasPagesTabbedView({
  pages,
  activeId,
  onSelect,
  onAdd,
  pagerPosition = 'end',
  headerActions,
  pageMenuItems,
  addLabel = 'New page',
  menuLabel = 'Page options',
  keepMounted = true,
  className,
  headerClassName,
  bodyClassName,
}: CanvasPagesTabbedViewProps) {
  const activePage = pages.find((p) => p.id === activeId);
  const activeIndex = pages.findIndex((p) => p.id === activeId);

  // The horizontally-scrolling tabs container — held in a ref so the pager and
  // the active-tab-follows effect can scroll it.
  const stripRef = useRef<HTMLDivElement>(null);

  // Keep the active tab in view whenever the selection changes (via the pager or
  // an external `activeId` change), so an off-screen tab scrolls into sight.
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>('[aria-selected="true"]');
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId]);

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
          are pinned to the far right, right of the pager. Tabs scroll between. */}
      <div className={cn('flex h-[30px] shrink-0 items-stretch border-b', headerClassName)}>
        {pagerPosition === 'start' ? pager : null}

        {/* Scrollable tabs. Scrollbar hidden (the pager drives navigation); tabs
            are `shrink-0`, so the row scrolls rather than compressing. */}
        <div
          ref={stripRef}
          role="tablist"
          className="flex min-w-0 flex-1 items-stretch overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {pages.map((page) => (
            <Tab
              key={page.id}
              page={page}
              active={page.id === activeId}
              onSelect={() => onSelect(page.id)}
              menuItems={pageMenuItems}
              menuLabel={menuLabel}
            />
          ))}
        </div>

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
              const style: CSSProperties = {
                position: 'absolute',
                inset: 0,
                visibility: active ? 'visible' : 'hidden',
                pointerEvents: active ? 'auto' : 'none',
                zIndex: active ? 1 : 0,
              };
              return (
                <div key={page.id} role="tabpanel" aria-hidden={!active} style={style}>
                  {page.content}
                </div>
              );
            })
          : activePage && (
              <div role="tabpanel" className="absolute inset-0">
                {activePage.content}
              </div>
            )}
      </div>
    </div>
  );
}
