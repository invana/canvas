/**
 * **Overflow → horizontal scroll + pager.** With many tabs the strip scrolls
 * horizontally (scrollbar hidden) instead of overflowing its box, and the
 * right-pinned **prev / next** pager steps the selection — the active tab always
 * scrolls into view. The `+` adds a page (via `onAdd`) and activates it. The pager
 * and `+` stay pinned however many tabs there are.
 *
 * Start with a dozen tabs so they overflow immediately; use ◀ / ▶ to walk them.
 */

import { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasPagesTabbedView, type CanvasPage } from '@invana/canvas-ui';
import { DemoFrame, DemoPanel, hueFor } from './canvas-pages-demo';

const meta: Meta = { title: 'canvas-ui/views/CanvasPagesTabbedView/ScrollableWithPager' };
export default meta;
type Story = StoryObj;

interface Item {
  id: string;
  title: string;
}

function ScrollableDemo() {
  const nextId = useRef(12);
  const [items, setItems] = useState<Item[]>(
    Array.from({ length: 12 }, (_, i) => ({ id: String(i), title: `Page ${i + 1}` })),
  );
  const [activeId, setActiveId] = useState('0');

  const add = (): void => {
    const id = String(nextId.current++);
    setItems((xs) => [...xs, { id, title: `Page ${xs.length + 1}` }]);
    setActiveId(id);
  };

  const pages: CanvasPage[] = items.map((x) => ({
    id: x.id,
    title: x.title,
    content: <DemoPanel title={x.title} hue={hueFor(Number(x.id))} />,
  }));

  return (
    <DemoFrame>
      <CanvasPagesTabbedView pages={pages} activeId={activeId} onSelect={setActiveId} onAdd={add} addLabel="New page" />
    </DemoFrame>
  );
}

export const ScrollableWithPager: Story = {
  name: 'ScrollableWithPager',
  render: () => <ScrollableDemo />,
};
