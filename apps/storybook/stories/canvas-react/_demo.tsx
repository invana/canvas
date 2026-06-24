/**
 * Small shared bits for the `<GraphCanvasApp>` stories — just data + a couple of
 * composable chrome pieces, so each story stays focused on what it demonstrates.
 * (Not the old `StoryGraphApp` / `StoryCanvasShell` presets — those are gone.)
 */

import { type ReactNode } from 'react';
import {
  ClickViewBehaviour,
  type GraphCanvasAppControlContext,
  PropertyViewerPanel,
  ToolbarItems,
  type ViewContext,
} from '@invana/canvas-react';
import type { GraphData } from '@invana/graph';
import { lesMiserables } from '@invana/graph-datasets';
import { Moon, Sun } from 'lucide-react';

/**
 * Les Misérables with graph-DB-style `type` labels (`Character` / `APPEARS_WITH`)
 * so the inspector's Type row has something to show.
 */
export function lesMisData(): GraphData {
  return {
    nodes: lesMiserables.nodes.map((n) => ({ ...n, type: 'Character' })),
    edges: lesMiserables.edges.map((e) => ({ ...e, type: 'APPEARS_WITH' })),
  };
}

/** The app's light/dark toggle, built from the control context — drop in `header.right`. */
export function ThemeToggle({ ctx }: { ctx: GraphCanvasAppControlContext }): ReactNode {
  return (
    <ToolbarItems
      orientation="horizontal"
      items={[
        {
          type: 'toggle',
          key: 'theme',
          icon: Sun,
          activeIcon: Moon,
          label: 'Switch to dark theme',
          activeLabel: 'Switch to light theme',
          active: ctx.themeKind === 'dark',
          onToggle: ctx.toggleTheme,
        },
      ]}
    />
  );
}

/** Click-to-open read-only property inspector — drop in as a `<GraphCanvasApp>` child. */
export function Inspector(): ReactNode {
  return (
    <ClickViewBehaviour
      id="click-view"
      targetLayerId="graph"
      panel={(ctx: ViewContext) => <PropertyViewerPanel ctx={ctx} position="top-right" fullHeight />}
    />
  );
}
