/**
 * **Closable pages.** A page marked `closable` carries an inline `×` on its tab —
 * active or not — in place of the caret menu, and the `×` calls the view's
 * `onClose(pageId)`. Here the canvases keep their Rename / Close menu, and the
 * run dashboards, which have nothing to rename, close straight from the tab.
 *
 * The close *logic* is in this story (the consumer), not in the component.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BoardPagesViewPanel,
  type BoardPage,
  type BoardPageMenuItem
} from '@invana/canvas-ui';
import { Pencil, X } from 'lucide-react';
import { DemoBoard, DemoFrame, hueFor } from './board-pages-demo';

const meta: Meta = { title: 'canvas-ui/view-panels/BoardPagesViewPanel/ClosablePages' };
export default meta;
type Story = StoryObj;

interface Item {
  id: string;
  title: string;
  hue: number;
  closable: boolean;
}

function ClosablePagesDemo() {
  const [items, setItems] = useState<Item[]>([
    { id: '0', title: 'Canvas 1', hue: hueFor(0), closable: false },
    { id: '1', title: 'Run #41', hue: hueFor(1), closable: true },
    { id: '2', title: 'Run #42', hue: hueFor(2), closable: true },
  ]);
  const [activeId, setActiveId] = useState('1');

  const close = (id: string): void => {
    setItems((xs) => {
      if (xs.length <= 1) return xs;
      const next = xs.filter((x) => x.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1]!.id);
      return next;
    });
  };

  const pages: BoardPage[] = items.map((x) => ({
    id: x.id,
    title: x.title,
    closable: x.closable,
    content: <DemoBoard title={x.title} hue={x.hue} />
  }));

  const pageMenuItems: BoardPageMenuItem[] = [
    { id: 'rename', label: 'Rename', icon: Pencil, onSelect: () => undefined },
    {
      id: 'close',
      label: 'Close',
      icon: X,
      destructive: true,
      separatorBefore: true,
      disabled: items.length <= 1,
      onSelect: close
    },
  ];

  return (
    <DemoFrame>
      <BoardPagesViewPanel
        pages={pages}
        activeId={activeId}
        onSelect={setActiveId}
        pageMenuItems={pageMenuItems}
        onClose={close}
      />
    </DemoFrame>
  );
}

export const ClosablePagesStory: Story = {
  name: 'ClosablePages', render: () => <ClosablePagesDemo /> };
