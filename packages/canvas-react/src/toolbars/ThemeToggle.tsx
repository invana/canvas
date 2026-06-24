import { Moon, Sun } from 'lucide-react';

import { ToolbarItems } from '../components';
import type { GraphCanvasAppControlContext } from '../apps/GraphCanvasApp';

export interface ThemeToggleProps {
  /** The app control context — supplies `themeKind` + `toggleTheme`. */
  ctx: GraphCanvasAppControlContext;
}

/**
 * Light/dark toggle for `<GraphCanvasApp>`, built from its control context — a
 * sun/moon `<ToolbarItems>` button. Drop it in a `header.right` slot:
 *
 * ```tsx
 * header={{ right: (ctx) => <ThemeToggle ctx={ctx} /> }}
 * ```
 */
export function ThemeToggle({ ctx }: ThemeToggleProps) {
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
