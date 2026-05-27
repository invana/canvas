/**
 * Right-click context menu in the declarative React surface.
 *
 * `<ContextMenuBehaviour>` is headless — it fires `onContextMenu` with the
 * right-clicked target (node / edge / canvas) plus its screen position. This
 * story feeds that into design-kit's `<NestedMenu>` (`@invana/ui`), rendered as
 * an absolutely-positioned overlay over the `<Canvas>`. The menu contents (and
 * the nested submenus) differ per target type.
 *
 * No `play` / `onStoryTeardown` — this is a React tree; `<Canvas>`'s effect
 * cleanup tears the engine down on unmount.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useEffect, useState } from 'react';
import {
  Canvas,
  ContextMenuBehaviour,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { ContextMenuEvent, GraphData } from '@invana/graph';
import { NestedMenu, type MenuItem } from '@invana/ui';

const meta: Meta = { title: 'canvas-react/behaviours/ContextMenu' };
export default meta;
type Story = StoryObj;

const DATA: GraphData = {
  nodes: [
    { id: 'a', position: { x: -160, y: -80 }, data: { label: 'Alpha' }, style: { labelText: 'Alpha' } },
    { id: 'b', position: { x: 0, y: -120 }, data: { label: 'Beta' }, style: { labelText: 'Beta' } },
    { id: 'c', position: { x: 160, y: -60 }, data: { label: 'Gamma' }, style: { labelText: 'Gamma' } },
    { id: 'd', position: { x: -120, y: 90 }, data: { label: 'Delta' }, style: { labelText: 'Delta' } },
    { id: 'e', position: { x: 60, y: 120 }, data: { label: 'Epsilon' }, style: { labelText: 'Epsilon' } },
  ],
  edges: [
    { id: 'a-b', source: 'a', target: 'b' },
    { id: 'b-c', source: 'b', target: 'c' },
    { id: 'a-d', source: 'a', target: 'd' },
    { id: 'd-e', source: 'd', target: 'e' },
    { id: 'b-e', source: 'b', target: 'e' },
  ],
};

/** Per-target menus. `act` wires each leaf to log + close the menu. */
function buildItems(e: ContextMenuEvent, act: (label: string) => () => void): MenuItem[] {
  if (e.targetType === 'node') {
    return [
      { id: 'pin', label: `Pin "${e.id}"`, shortcut: '⌘P', onClick: act(`pin ${e.id}`) },
      {
        id: 'expand',
        label: 'Expand',
        children: [
          { id: 'expand-1', label: 'Neighbours (1 hop)', onClick: act(`expand ${e.id} ×1`) },
          { id: 'expand-2', label: 'Neighbours (2 hops)', onClick: act(`expand ${e.id} ×2`) },
        ],
      },
      {
        id: 'style',
        label: 'Style',
        children: [
          { id: 'highlight', label: 'Highlight', onClick: act(`highlight ${e.id}`) },
          { id: 'dim', label: 'Dim', onClick: act(`dim ${e.id}`) },
        ],
      },
      { id: 'delete', label: 'Delete node', shortcut: '⌫', onClick: act(`delete node ${e.id}`) },
    ];
  }
  if (e.targetType === 'edge') {
    return [
      { id: 'reverse', label: 'Reverse edge', onClick: act(`reverse ${e.id}`) },
      {
        id: 'style',
        label: 'Style',
        children: [
          { id: 'highlight', label: 'Highlight', onClick: act(`highlight ${e.id}`) },
          { id: 'dim', label: 'Dim', onClick: act(`dim ${e.id}`) },
        ],
      },
      { id: 'delete', label: 'Delete edge', shortcut: '⌫', onClick: act(`delete edge ${e.id}`) },
    ];
  }
  return [
    { id: 'add', label: 'Add node here', shortcut: '⌘N', onClick: act('add node') },
    {
      id: 'layout',
      label: 'Layout',
      children: [
        { id: 'force', label: 'Force-directed', onClick: act('layout force') },
        { id: 'fit', label: 'Fit to content', onClick: act('fit content') },
      ],
    },
    { id: 'select-all', label: 'Select all', shortcut: '⌘A', onClick: act('select all') },
  ];
}

interface MenuState {
  x: number;
  y: number;
  items: MenuItem[];
}

function ContextMenuDemo() {
  const [menu, setMenu] = useState<MenuState | null>(null);
  const close = useCallback(() => setMenu(null), []);

  // Dismiss on any outside pointer-down or Escape. Listeners attach only while
  // the menu is open; the opening right-click's pointerdown already fired
  // before this effect runs, so it won't self-close.
  useEffect(() => {
    if (!menu) return;
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === 'Escape') close();
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [menu, close]);

  const onContextMenu = useCallback(
    (e: ContextMenuEvent): void => {
      const act = (label: string) => (): void => {
        // eslint-disable-next-line no-console
        console.log('[context-menu]', label);
        close();
      };
      setMenu({ x: e.screen.x, y: e.screen.y, items: buildItems(e, act) });
    },
    [close],
  );

  return (
    <div style={{ position: 'relative', width: '100%', height: '100vh' }}>
      <Canvas autoResize>
        <DragPanBehaviour />
        <WheelZoomBehaviour />
        <GraphLayer
          id="graph"
          data={DATA}
          node={{
            style: {
              shape: { kind: 'circle', radius: 22 },
              bgFill: 0x3b82f6,
              bgStrokeColor: 0xffffff,
              bgStrokeWidth: 2,
              labelColor: 0xf8fafc,
              labelFontSize: 12,
              labelPlacement: 'center',
            },
          }}
          edge={{ style: { strokeColor: 0xcbd5e1, strokeWidth: 2, arrowTargetShape: 'none' } }}
        />
        <DragNodeBehaviour layerId="graph" />
        <ContextMenuBehaviour layerId="graph" onContextMenu={onContextMenu} />
      </Canvas>

      {menu && (
        <div
          style={{ position: 'absolute', left: menu.x, top: menu.y, zIndex: 1000 }}
          // Keep clicks inside the menu from bubbling to the window dismiss
          // handler; leaf `onClick`s close the menu explicitly.
          onPointerDown={(ev) => ev.stopPropagation()}
          onContextMenu={(ev) => ev.preventDefault()}
        >
          <NestedMenu menuItems={menu.items} />
        </div>
      )}
    </div>
  );
}

export const ContextMenu: Story = {
  render: () => <ContextMenuDemo />,
};
