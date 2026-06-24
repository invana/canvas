/**
 * `<GraphCanvasApp>` with **no header or footer** — `showHeader={false}` and no
 * `footer` bag, so neither rail renders. What's left is the full interactive
 * canvas (the bundle: background · graph · force · pan / zoom / drag / hover /
 * select) with **no minimap** either. Omit a region and it's simply gone — no
 * empty rails.
 *
 * Colour-by-category is composed explicitly here: the bundle's default `color`
 * behaviour keys on `node.type`, but the raw Les Misérables nodes carry no
 * `type`, so it's disabled via `config` and replaced with an explicit
 * `<ColorByLabelBehaviour>` keyed on each node's community `group` (1–11) — the
 * dataset's real categories — giving distinct per-community colours.
 *
 * The minimal end of the spectrum; contrast with `FullFeatured` (everything on)
 * and `OverlayBlur` / `OverlayTransparent` (full chrome, floating).
 */

import type { Meta, StoryObj } from '@storybook/react-vite';

import { ColorByLabelBehaviour, GraphCanvasApp } from '@invana/canvas-react';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-react/graph-canvas-app/NoChrome' };
export default meta;
type Story = StoryObj;

export const NoChrome: Story = {
  render: () => (
    // A real consumer mounts the app under its own <ThemeProvider> — the app
    // reads light/dark from it via useTheme() (and throws without one).
    <ThemeProvider>
      <GraphCanvasApp
        data={lesMiserables}
        showHeader={false}
        // Turn off the bundle's type-based colouring (one type → one colour here).
        config={{ behaviours: { color: { enabled: false } } }}
      >
        {/* Colour each node by its Les Mis community group instead of its type. */}
        <ColorByLabelBehaviour
          targetLayerId="graph"
          colorEdges={false}
          nodeLabel={(n) => String((n.data as { group?: number } | undefined)?.group ?? '')}
        />
      </GraphCanvasApp>
    </ThemeProvider>
  ),
};
