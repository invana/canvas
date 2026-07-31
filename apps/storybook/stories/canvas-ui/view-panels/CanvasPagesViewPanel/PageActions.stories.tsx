/**
 * **Per-page actions dropdown.** The active tab shows a caret that opens a menu of
 * consumer-supplied `pageMenuItems` — here **Rename**, **Duplicate**, and
 * **Remove**. The view knows none of those verbs: it just renders the list and
 * calls each item's `onSelect(pageId)`. Styling flags (`destructive`,
 * `separatorBefore`) and a `disabled` predicate live on the item — "Remove" is
 * destructive, separated, and disabled while a single page remains.
 *
 * All the rename / duplicate / remove *logic* is in this story (the consumer),
 * not in the component.
 */

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  CanvasPagesViewPanel,
  type CanvasPage,
  type CanvasPageMenuItem,
} from '@invana/canvas-ui';
import { Copy, Pencil, Trash2 } from 'lucide-react';
import { ThemeProvider } from '@invana/themes';
import { DemoBoard, DemoFrame, hueFor } from './canvas-pages-demo';

const meta: Meta = { title: 'canvas-ui/view-panels/CanvasPagesViewPanel/PageActions' };
export default meta;
type Story = StoryObj;

interface Item {
  id: string;
  title: string;
  hue: number;
}

function PageActionsDemo() {
  const nextId = useRef(3);
  const [items, setItems] = useState<Item[]>([
    { id: '0', title: 'Alpha', hue: hueFor(0) },
    { id: '1', title: 'Beta', hue: hueFor(1) },
    { id: '2', title: 'Gamma', hue: hueFor(2) },
  ]);
  const [activeId, setActiveId] = useState('0');

  const rename = (id: string): void => {
    setItems((xs) =>
      xs.map((x) => {
        if (x.id !== id) return x;
        const next = window.prompt('Rename page', x.title);
        return next && next.trim() ? { ...x, title: next.trim() } : x;
      }),
    );
  };

  const duplicate = (id: string): void => {
    const src = items.find((x) => x.id === id);
    if (!src) return;
    const newId = String(nextId.current++);
    setItems((xs) => {
      const at = xs.findIndex((x) => x.id === id);
      const copy: Item = { id: newId, title: `${src.title} copy`, hue: hueFor(Number(newId)) };
      return [...xs.slice(0, at + 1), copy, ...xs.slice(at + 1)];
    });
    setActiveId(newId);
  };

  const remove = (id: string): void => {
    setItems((xs) => {
      if (xs.length <= 1) return xs;
      const next = xs.filter((x) => x.id !== id);
      if (id === activeId) setActiveId(next[next.length - 1]!.id);
      return next;
    });
  };

  const pages: CanvasPage[] = items.map((x) => ({
    id: x.id,
    title: x.title,
    content: <DemoBoard title={x.title} hue={x.hue} />,
  }));

  const pageMenuItems: CanvasPageMenuItem[] = [
    { id: 'rename', label: 'Rename', icon: Pencil, onSelect: rename },
    { id: 'duplicate', label: 'Duplicate', icon: Copy, onSelect: duplicate },
    {
      id: 'remove',
      label: 'Remove',
      icon: Trash2,
      destructive: true,
      separatorBefore: true,
      disabled: items.length <= 1,
      onSelect: remove,
    },
  ];

  return (
    <ThemeProvider>
      <DemoFrame>
        <CanvasPagesViewPanel
          pages={pages}
          activeId={activeId}
          onSelect={setActiveId}
          pageMenuItems={pageMenuItems}
        />
      </DemoFrame>
    </ThemeProvider>
  );
}

export const PageActionsStory: Story = {
  name: 'PageActions', render: () => <PageActionsDemo /> };
