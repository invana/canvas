/**
 * `<GraphCanvasApp>` with a **command palette** docked in the `right` region and
 * an **Edit menu** in the header — both read the canvas's command registry, so
 * neither lists anything by hand:
 *
 *   - **`<CommandPalette variant="inline">`** — the searchable list rendered in
 *     place (`variant="dialog"`, the default, is the modal form). Every command
 *     that runs bare is a row, grouped by `category`; a pick-one command
 *     (`tool.active`, `layout.activate`, …) is one row per option. Typing ranks
 *     rows by label and Enter runs the best enabled one. Rows are disabled while
 *     their command can't run, and show the key hints of `shortcuts`.
 *   - **Edit menu** — `commandMenuItems(canvas, refs)`, read each time it opens,
 *     drawn by `MenuItemList`: Cut / Copy / Delete enable once you click a node,
 *     Paste once something is copied, Undo after a drag; the Tool submenu checks
 *     the active tool. Disabled items are dimmed.
 *   - **`<KeyboardShortcutsBehaviour bindings={DEFAULT_SHORTCUTS}>`** — the same
 *     commands on the usual editor keys (undo / redo, cut / copy / paste, delete,
 *     Escape → select tool).
 */

import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DEFAULT_SHORTCUTS } from '@invana/canvas';
import { KeyboardShortcutsBehaviour } from '@invana/canvas-react';
import { CommandPalette, GraphCanvasApp, MenuItemList, commandMenuItems, type CommandMenuRef } from '@invana/canvas-ui';
import type { GraphCanvas } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, type MenuItem } from '@invana/ui';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/CommandPalette' };
export default meta;
type Story = StoryObj;

export const CommandPaletteStory: Story = {
  name: 'CommandPalette',
  render: () => {
    const [editItems, setEditItems] = useState<MenuItem[] | null>(null);

    // The Edit menu's entries — read from the commands each time it opens.
    const toggleEditMenu = useCallback((canvas: GraphCanvas, open: boolean) => {
      const refs: CommandMenuRef[] = [
        { command: 'history.undo', icon: 'undo', shortcut: '⌘Z' },
        { command: 'history.redo', icon: 'redo', shortcut: '⇧⌘Z' },
        { command: 'clipboard.cut', icon: 'scissors', shortcut: '⌘X' },
        { command: 'clipboard.copy', icon: 'copy', shortcut: '⌘C' },
        { command: 'clipboard.paste', icon: 'clipboard-paste', shortcut: '⌘V' },
        { command: 'clipboard.delete', icon: 'trash', shortcut: '⌫' },
        { command: 'tool.active', label: 'Tool' },
      ];
      setEditItems(open ? commandMenuItems(canvas, refs) : null);
    }, []);

    return (
      <GraphCanvasApp
        data={lesMiserables}
        header={{
          title: 'Command palette',
          right: ({ canvas }) =>
            canvas ? (
              <DropdownMenu open={editItems !== null} onOpenChange={(open) => toggleEditMenu(canvas, open)}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">Edit</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="p-0">
                  {/* A leaf's onClick runs its command; close the menu after it. */}
                  <div onClick={() => setEditItems(null)}>
                    <MenuItemList items={editItems ?? []} />
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null,
        }}
        // The palette docked on the right — the region's render-fn is handed the
        // live engine (`null` until every layer / behaviour has registered).
        right={{
          content: ({ canvas }) =>
            canvas ? <CommandPalette variant="inline" shortcuts={DEFAULT_SHORTCUTS} canvas={canvas} /> : null,
          defaultSize: '320px',
          maxSize: '420px',
        }}
      >
        <KeyboardShortcutsBehaviour bindings={DEFAULT_SHORTCUTS} />
      </GraphCanvasApp>
    );
  },
};
