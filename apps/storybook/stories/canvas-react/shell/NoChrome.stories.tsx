/**
 * The generic {@link StoryCanvasShell} core composed **directly**, with no header
 * or footer content — `footer={false}` empties the footer bar, no `header` slots
 * are passed, and `devInfo={false}` drops the built-in dev-overlay toggle (the one
 * piece of header chrome every story otherwise carries). What's left is the bare
 * shell: the lifted `CanvasContext` wiring plus a full, interactive canvas
 * (background, graph, force layout, pan / zoom / drag / hover / select, minimap),
 * with the surrounding chrome stripped to empty bars.
 *
 * (`AppLayoutBase` always renders its 40px header / 25px footer rails, so they
 * stay as thin empty borders rather than disappearing — this is "no chrome
 * *content*", the minimal a shell-hosted story can be.) Contrast with
 * `BareCanvas`, which reaches the same end through the `<StoryGraphApp>` preset's
 * `show*` flags; this story shows the core it's built on.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  ClickSelectBehaviour,
  ColorByLabelBehaviour,
  D3ForceLayout,
  DragNodeBehaviour,
  DragPanBehaviour,
  GraphLayer,
  HoverActivateBehaviour,
  MiniMapLayer,
  WheelZoomBehaviour,
} from '@invana/canvas-react';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';

import {
  ACTIVE_LAYOUT_ID,
  APP_OPTIONS,
  AutoLayoutBridge,
  FORCE_OPTS,
  PALETTE,
  StoryCanvasShell,
  SystemTheme,
} from '../_shared';

const meta: Meta = { title: 'canvas-react/shell/NoChrome' };
export default meta;
type Story = StoryObj;

export const NoChrome: Story = {
  render: () => {
    const data: GraphData = {
      nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
      edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
    };

    return (
      <StoryCanvasShell
        config={APP_OPTIONS}
        // No header slots, no built-in dev-overlay toggle, empty footer bar.
        devInfo={false}
        footer={false}
      >
        <BackgroundLayer id="background" />
        <GraphLayer id="graph" data={data} />

        {/* Colour nodes by category (defaults the label to `node.type`). */}
        <ColorByLabelBehaviour targetLayerId="graph" palette={PALETTE} colorEdges={false} />

        {/* Active layout + the bridge that runs it once data is seeded. */}
        <D3ForceLayout id={ACTIVE_LAYOUT_ID} targetLayerId="graph" options={FORCE_OPTS} />
        <AutoLayoutBridge data={data} />

        {/* Follow the OS colour scheme even without a theme toggle in the header. */}
        <SystemTheme />

        {/* Interaction — the canvas stays fully alive; only the chrome is gone. */}
        <DragPanBehaviour id="pan" />
        <WheelZoomBehaviour id="wheel" />
        <DragNodeBehaviour id="drag-node" targetLayerId="graph" />
        <HoverActivateBehaviour id="hover" targetLayerId="graph" state="highlighted" degree={1} />
        <ClickSelectBehaviour id="click-select" targetLayerId="graph" multiple />

        <MiniMapLayer id="minimap" graphLayerId="graph" backgroundLayerId="background" />
      </StoryCanvasShell>
    );
  },
};
