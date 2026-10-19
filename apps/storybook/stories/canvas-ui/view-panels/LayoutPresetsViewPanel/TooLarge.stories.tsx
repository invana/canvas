/**
 * **A board too large for the ELK presets.** The host sets each preset's
 * `maxNodes` — here 50 on the three ELK presets, so the 77-node Les Misérables
 * board stands in for a 24,477-node one. Tree ↓, Flow → and Radial are dimmed,
 * and each card's tooltip gives the cap and the board's count:
 * *Draws up to 50 nodes · this board has 77*. Network still runs.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import type { GraphCanvas } from '@invana/graph';
import { ControlPanel, ElkLayout } from '@invana/canvas-react';
import { GraphCanvasApp, graphCanvasAppLayoutPresets } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';

const meta: Meta = { title: 'canvas-ui/view-panels/LayoutPresetsViewPanel/TooLarge' };
export default meta;
type Story = StoryObj;

const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

/** The bundle's presets, with the ELK ones capped at 50 nodes. */
const CAPPED = graphCanvasAppLayoutPresets.map((p) => (p.layoutId === 'elk' ? { ...p, maxNodes: 50 } : p));

function TooLarge() {
  const onReady = useCallback((canvas: GraphCanvas | null) => canvas?.setLayoutPresets(CAPPED), []);
  return (
    <GraphCanvasApp data={lesMiserables} showHeader={false} config={CONFIG} onReady={onReady}>
      <ElkLayout id="elk" targetLayerId="graph" />
      <ControlPanel id="layout" position="top-left" offset={12} items={[{ type: 'widget', widget: 'layout-presets' }]} />
    </GraphCanvasApp>
  );
}

export const TooLargeStory: Story = { name: 'TooLarge', render: () => <TooLarge /> };
