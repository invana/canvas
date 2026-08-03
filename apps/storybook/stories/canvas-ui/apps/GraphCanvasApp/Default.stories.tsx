/**
 * `<GraphCanvasApp>` at its simplest — **the one-liner**. Hand it `data` and the
 * batteries-included bundle does the rest: a themed background, the graph layer,
 * force layout (auto-run via `config.activeLayout`), colour-by-type, and the full
 * camera / hover / select behaviour set — all under an `AppLayoutV2` shell showing
 * just the default header brand. No footer, no side regions, no `config`.
 *
 * This is the floor of the spectrum — everything past `data` is optional. Contrast
 * with `NoChrome` (header stripped too), `SideRegions` (right + bottom panels), and
 * `FullFeatured` (every slot filled).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/Default' };
export default meta;
type Story = StoryObj;

// Les Misérables ships no `type` — in a graph DB every node/edge carries a label
// (its "type"). Map each node's community `group` to its type so the bundle's
// default colour-by-type gives one colour per community; edges are `APPEARS_WITH`.
const DATA = lesMiserables;

export const Default: Story = {
  render: () => (
    // A real consumer mounts the app under its own <ThemeProvider> — the app reads
    // light/dark from it via useTheme() (and throws without one).
    <ThemeProvider>
      <GraphCanvasApp data={DATA} />
    </ThemeProvider>
  ),
};
