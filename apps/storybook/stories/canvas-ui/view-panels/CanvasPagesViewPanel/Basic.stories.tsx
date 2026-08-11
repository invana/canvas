/**
 * `<CanvasPagesViewPanel>` from `@invana/canvas-ui` — the baseline: a Bootstrap
 * `nav-tabs` strip over independent pages. Click a tab to switch; the active tab
 * is the boxed folder tab (border on top / left / right, open bottom).
 *
 * **State retention (`keepMounted`, on by default).** Each page body here is its
 * own `<GraphCanvasApp>` board. Pan / zoom one, switch to another tab, then switch
 * back — the camera is exactly where you left it, because inactive pages stay
 * mounted (hidden), not destroyed. That's the whole point for a canvas-per-page:
 * camera / layout / selection survive tab switches.
 *
 * Real-world content: one independent graph app per page (the CanvasBoards
 * pattern), under a single host `<ThemeProvider>`.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasPagesViewPanel, type CanvasPage } from '@invana/canvas-ui';
import { ThemeProvider } from '@invana/themes';
import { DemoBoard, DemoFrame, hueFor } from './canvas-pages-demo';

const meta: Meta = { title: 'canvas-ui/view-panels/CanvasPagesViewPanel/Basic' };
export default meta;
type Story = StoryObj;

function BasicDemo() {
  const titles = ['Overview', 'Details', 'Notes'];
  const pages: CanvasPage[] = titles.map((title, i) => ({
    id: String(i),
    title,
    content: <DemoBoard title={title} hue={hueFor(i)} />
  }));
  const [activeId, setActiveId] = useState('0');

  return (
    <ThemeProvider>
      <DemoFrame>
        <CanvasPagesViewPanel pages={pages} activeId={activeId} onSelect={setActiveId} />
      </DemoFrame>
    </ThemeProvider>
  );
}

export const Basic: Story = { name: 'Basic', render: () => <BasicDemo /> };
