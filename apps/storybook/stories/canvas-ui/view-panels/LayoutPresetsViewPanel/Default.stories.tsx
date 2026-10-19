/**
 * **Layout presets.** The layout button sits top-left, in a saved
 * `<ControlPanel>` that names the `layout-presets` widget. Its glyph is the
 * active preset. Click it and the popover is a **`<LayoutPresetsViewPanel>`**:
 * four cards (Network · Tree ↓ · Flow → · Radial), then the active preset's
 * options. *Reset to …* appears once an option differs from the preset's
 * default.
 *
 * The widget runs the `layout.preset` command, which is
 * `GraphCanvas.applyLayoutPreset`: one write sets the layout, its options
 * (Direction, Spacing, Root / Centre) and the edge type, and runs the layout
 * once — one undo step. Network runs on the app's force (`graph-force`); the
 * three ELK presets run on the one `ElkLayout` registered below as `elk`. The
 * board opens on Network through `config.layoutPreset`. *Run again* solves a
 * force layout from scratch.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig } from '@invana/canvas';
import { ControlPanel, ElkLayout } from '@invana/canvas-react';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/view-panels/LayoutPresetsViewPanel/Default' };
export default meta;
type Story = StoryObj;

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

export const DefaultStory: Story = {
  name: 'Default',
  render: () => (
    <GraphCanvasApp data={lesMiserables} showHeader={false} config={CONFIG}>
      <ElkLayout id="elk" targetLayerId="graph" />
      <ControlPanel id="layout" position="top-left" offset={12} items={[{ type: 'widget', widget: 'layout-presets' }]} />
    </GraphCanvasApp>
  )
};
