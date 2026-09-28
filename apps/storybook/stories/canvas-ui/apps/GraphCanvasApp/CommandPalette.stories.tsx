/**
 * `<GraphCanvasApp>` with a **command palette** and an **Edit menu** — both read
 * the canvas's command registry, so neither lists anything by hand:
 *
 *   - **`<CommandPalette>`** — open it with the header's *Commands* button or
 *     **⌘K / Ctrl+K**. Every command that runs bare is a row (grouped by
 *     `category`); a pick-one command (`tool.active`, `layout.activate`, …) is
 *     one row per option. Rows are disabled while their command can't run, and
 *     show the key hints of the bindings passed as `shortcuts`.
 *   - **Edit menu** — `commandMenuItems(canvas, refs)`, read each time it opens:
 *     Cut / Copy / Delete enable once you click a node, Paste once something is
 *     copied, Undo after a drag; the Tool submenu checks the active tool.
 *   - **`<KeyboardShortcutsBehaviour bindings={DEFAULT_SHORTCUTS}>`** — the same
 *     commands on the usual editor keys (undo / redo, cut / copy / paste, delete,
 *     Escape → select tool).
 */

import { useCallback, useEffect, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { DEFAULT_SHORTCUTS } from '@invana/canvas';
import { KeyboardShortcutsBehaviour } from '@invana/canvas-react';
import { CommandPalette, GraphCanvasApp, commandMenuItems, type CommandMenuRef } from '@invana/canvas-ui';
import type { GraphCanvas } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, NestedMenu, type MenuItem } from '@invana/ui';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/CommandPalette' };
export default meta;
type Story = StoryObj;

export const CommandPaletteStory: Story = {
  name: 'CommandPalette',
  render: () => {
    const [paletteOpen, setPaletteOpen] = useState(false);
    const [editItems, setEditItems] = useState<MenuItem[] | null>(null);

    // ⌘K / Ctrl+K toggles the palette. The palette is controlled, so the host
    // owns that key — `KeyboardShortcutsBehaviour` binds commands, not UI state.
    useEffect(() => {
      const onKey = (ev: KeyboardEvent) => {
        if ((ev.metaKey || ev.ctrlKey) && ev.key.toLowerCase() === 'k') {
          ev.preventDefault();
          setPaletteOpen((o) => !o);
        }
      };
      window.addEventListener('keydown', onKey);
      return () => window.removeEventListener('keydown', onKey);
    }, []);

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
              <div className="flex items-center gap-2">
                <DropdownMenu open={editItems !== null} onOpenChange={(open) => toggleEditMenu(canvas, open)}>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">Edit</Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="p-0">
                    {/* A leaf's onClick runs its command; close the menu after it. */}
                    <div onClick={() => setEditItems(null)}>
                      <NestedMenu menuItems={editItems ?? []} />
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="sm" onClick={() => setPaletteOpen(true)}>
                  Commands ⌘K
                </Button>
                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} shortcuts={DEFAULT_SHORTCUTS} canvas={canvas} />
              </div>
            ) : null,
        }}
      >
        <KeyboardShortcutsBehaviour bindings={[...DEFAULT_SHORTCUTS]} />
      </GraphCanvasApp>
    );
  },
};
