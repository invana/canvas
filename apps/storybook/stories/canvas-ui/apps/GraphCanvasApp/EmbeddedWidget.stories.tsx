/**
 * `<GraphCanvasApp>` as a **bounded, embeddable widget** — not the full viewport.
 * The shell fills its parent by default, but pass `width` / `height` (or `style`)
 * and it becomes a self-contained card you can drop into a page, dashboard, doc,
 * or report beside other content. `AppLayoutV2` is `h-screen` by default; the app
 * forces `h-full` inside its **own sized, theme-scoped root**, so the *same*
 * component works full-page **and** embedded — nothing leaks outside its box.
 *
 * Here it's a 760×440 card sitting in the middle of ordinary article content, with
 * the default header brand + a compact footer status bar. Everything (canvas,
 * chrome, theme) is scoped to the card.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { CanvasControlsToolbar, CanvasMessageBar, GraphCanvasApp, GraphStatusBar } from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { ThemeProvider } from '@invana/themes';

const meta: Meta = { title: 'canvas-ui/apps/GraphCanvasApp/EmbeddedWidget' };
export default meta;
type Story = StoryObj;

// Community `group` → node `type` so the default colour-by-type reads by community.
const DATA = lesMiserables;

export const EmbeddedWidgetStory: Story = {
  name: 'EmbeddedWidget',
  render: () => (
    // A real consumer mounts the app under its own <ThemeProvider>. Here the page
    // itself is theme-scoped so the surrounding article + the widget share tokens.
    <ThemeProvider>
      <div className="theme-default-light light bg-background text-foreground" style={{ minHeight: '100vh' }}>
        {/* An ordinary article column — the widget is embedded mid-flow. */}
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px' }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>
            Character co-appearances in Les Misérables
          </h1>
          <p style={{ opacity: 0.75, lineHeight: 1.6, marginBottom: 28 }}>
            The network below links characters who appear together in the same chapter. It is a{' '}
            <code>&lt;GraphCanvasApp&gt;</code> sized to a fixed <code>760×440</code> card — the same
            component you would run full-page, just bounded. Pan, zoom, hover and select all work
            inside the card; nothing spills into the article around it.
          </p>

          {/* The bounded widget. `width`/`height` size the app root; a border +
              shadow make it read as an embedded card rather than a full-bleed app. */}
          <GraphCanvasApp
            data={DATA}
            width={760}
            height={440}
            style={{
              borderRadius: 12,
              border: '1px solid var(--border, #e2e8f0)',
              boxShadow: '0 10px 30px -12px rgba(15,23,42,0.35)',
              overflow: 'hidden'
            }}
            header={{ title: 'Les Misérables' }}
            footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
            onReady={(c) => c?.showMessage('An embedded, bounded widget — try panning inside it')}
          >
            {/* The self-wiring canvas controls overlay (React Flow's <Controls>):
                zoom +/- and a fit-to-content button, pinned bottom-left. */}
            <CanvasControlsToolbar position="bottom-left" />
          </GraphCanvasApp>

          <p style={{ opacity: 0.75, lineHeight: 1.6, marginTop: 28 }}>
            Because the app scopes its own theme to that root, you can embed several on one page,
            each independent, without any of them reaching for <code>document</code> or the viewport.
          </p>
        </div>
      </div>
    </ThemeProvider>
  )
};
