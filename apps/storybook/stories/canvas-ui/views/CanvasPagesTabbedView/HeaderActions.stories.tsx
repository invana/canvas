/**
 * **Strip-level header actions.** `headerActions` adds extra icon buttons pinned
 * to the far right of the strip (right of the pager / `+`) — here **Settings** and
 * **About**. These are strip-level, not per-page (their `onClick` takes no page
 * id), so they're the place for global actions distinct from the active tab's
 * per-page `pageMenuItems` dropdown.
 */

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasPagesTabbedView,
  type CanvasHeaderAction,
  type CanvasPage,
} from '@invana/canvas-ui';
import { Info, Settings } from 'lucide-react';
import { ThemeProvider } from '@invana/themes';
import { DemoBoard, DemoFrame, hueFor } from './canvas-pages-demo';

const meta: Meta = { title: 'canvas-ui/views/CanvasPagesTabbedView/HeaderActions' };
export default meta;
type Story = StoryObj;

interface Item {
  id: string;
  title: string;
}

function HeaderActionsDemo() {
  const nextId = useRef(3);
  const [items, setItems] = useState<Item[]>([
    { id: '0', title: 'Dashboard' },
    { id: '1', title: 'Reports' },
    { id: '2', title: 'Settings' },
  ]);
  const [activeId, setActiveId] = useState('0');

  const add = (): void => {
    const id = String(nextId.current++);
    setItems((xs) => [...xs, { id, title: `Page ${xs.length + 1}` }]);
    setActiveId(id);
  };

  const pages: CanvasPage[] = items.map((x) => ({
    id: x.id,
    title: x.title,
    content: <DemoBoard title={x.title} hue={hueFor(Number(x.id))} />,
  }));

  const headerActions: CanvasHeaderAction[] = [
    { id: 'settings', label: 'Settings', icon: Settings, onClick: () => window.alert('Settings') },
    { id: 'about', label: 'About', icon: Info, onClick: () => window.alert('CanvasPagesTabbedView demo') },
  ];

  return (
    <ThemeProvider>
      <DemoFrame>
        <CanvasPagesTabbedView
          pages={pages}
          activeId={activeId}
          onSelect={setActiveId}
          onAdd={add}
          headerActions={headerActions}
        />
      </DemoFrame>
    </ThemeProvider>
  );
}

export const HeaderActions: Story = { name: 'HeaderActions', render: () => <HeaderActionsDemo /> };
