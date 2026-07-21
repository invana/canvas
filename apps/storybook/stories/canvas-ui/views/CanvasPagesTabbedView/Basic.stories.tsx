/**
 * `<CanvasPagesTabbedView>` from `@invana/canvas-ui` — the baseline: a Bootstrap
 * `nav-tabs` strip over independent pages. Click a tab to switch; the active tab
 * is the boxed folder tab (border on top / left / right, open bottom).
 *
 * **State retention (`keepMounted`, on by default).** Each page body here is a
 * *stateful* input. Type into one, switch to another tab, then switch back — the
 * text is still there, because inactive pages stay mounted (hidden), not
 * destroyed. That's the whole point for a canvas-per-page: camera / layout /
 * selection survive tab switches.
 *
 * Presentational + engine-agnostic: this story uses plain `<div>` / `<input>`
 * content — no engine anywhere.
 */

import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasPagesTabbedView, type CanvasPage } from '@invana/canvas-ui';
import { DemoFrame, EditablePanel, hueFor } from './canvas-pages-demo';

const meta: Meta = { title: 'canvas-ui/views/CanvasPagesTabbedView/Basic' };
export default meta;
type Story = StoryObj;

function BasicDemo() {
  const titles = ['Overview', 'Details', 'Notes'];
  const pages: CanvasPage[] = titles.map((title, i) => ({
    id: String(i),
    title,
    content: <EditablePanel title={title} hue={hueFor(i)} />,
  }));
  const [activeId, setActiveId] = useState('0');

  return (
    <DemoFrame>
      <CanvasPagesTabbedView pages={pages} activeId={activeId} onSelect={setActiveId} />
    </DemoFrame>
  );
}

export const Basic: Story = { name: 'Basic', render: () => <BasicDemo /> };
