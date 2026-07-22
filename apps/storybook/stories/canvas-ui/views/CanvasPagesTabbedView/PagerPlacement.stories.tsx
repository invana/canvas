/**
 * **Pager placement — `pagerPosition`.** The prev / next / `+` cluster is one unit
 * that docks at either end of the strip: `'start'` (left of the tabs) or `'end'`
 * (right of the tabs, the default). This story stacks both so the difference is
 * visible at a glance; the divider always faces the tabs.
 *
 * (`headerActions`, when present, stay pinned to the far right regardless — see the
 * HeaderActions story.)
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasPagesTabbedView, type CanvasPage } from '@invana/canvas-ui';
import { ThemeProvider } from '@invana/themes';
import { DemoBoard, DemoFrame, hueFor } from './canvas-pages-demo';

const meta: Meta = { title: 'canvas-ui/views/CanvasPagesTabbedView/PagerPlacement' };
export default meta;
type Story = StoryObj;

function Strip({ position }: { position: 'start' | 'end' }) {
  const titles = ['One', 'Two', 'Three', 'Four'];
  const pages: CanvasPage[] = titles.map((title, i) => ({
    id: String(i),
    title,
    content: <DemoBoard title={`${title} — pager at ${position}`} hue={hueFor(i)} />,
  }));
  const [activeId, setActiveId] = useState('0');
  return (
    <DemoFrame>
      <CanvasPagesTabbedView
        pages={pages}
        activeId={activeId}
        onSelect={setActiveId}
        onAdd={() => undefined}
        pagerPosition={position}
        // Two strips × four boards each: mount only the active board per strip so
        // the two visible pages don't spin up eight live engines / GPU contexts.
        keepMounted={false}
      />
    </DemoFrame>
  );
}

function PagerPlacementDemo() {
  return (
    <ThemeProvider>
      <div className="flex flex-col gap-6">
        <div>
          <div className="mb-2 text-sm font-medium text-muted-foreground">pagerPosition=&quot;start&quot;</div>
          <Strip position="start" />
        </div>
        <div>
          <div className="mb-2 text-sm font-medium text-muted-foreground">pagerPosition=&quot;end&quot; (default)</div>
          <Strip position="end" />
        </div>
      </div>
    </ThemeProvider>
  );
}

export const PagerPlacement: Story = {
  name: 'PagerPlacement',
  render: () => <PagerPlacementDemo />,
};
