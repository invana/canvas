/**
 * **Card Designer Studio** — end-users build their own node card, no developer
 * round-trip, on a multi-type social graph (a ~100-node mocked Twitter feed:
 * `User` · `Tweet` · `Comment` · `Hashtag` · `Retweet`, with `POSTED` /
 * `REPLY_TO` / `TAGGED` / `MENTIONS` / `RETWEETED` / `FOLLOWS` edges).
 *
 * The graph is a batteries-included {@link GraphCanvasApp}; the bottom panel is
 * the free-form {@link NodeCardDesigner} editing the **Tweet** card. Drag
 * elements, bind text to data fields, colour by theme role — every edit
 * live-registers the card as the `Tweet` type's structure template, so the real
 * tweet nodes adopt it instantly. Switch themes (header) and every designed card
 * recolours from the palette; the design never changes.
 *
 * Per-type templates: `Tweet` + `User` render as composite cards, the rest as
 * simple labelled circles. All are `FreeformStructure` / built-in templates in
 * `config.layers.graph` — pure JSON, no per-type code.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp } from '@invana/canvas-react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  RichSelect,
} from '@invana/ui';
import { ThemeProvider } from '@invana/themes';
import { NodeCardDesigner } from '@invana/canvas-designer';
import { twitterActivity } from '@invana/graph-datasets';
import {
  BUILT_IN_THEMES,
  type FreeformStructure,
  type GraphCanvas,
  type GraphData,
  type NodeStructureRegistry,
  type NodeTypeRegistry,
} from '@invana/graph';

const meta: Meta = { title: 'canvas-designer/Card Designer Studio' };
export default meta;
type Story = StoryObj;

// ─── Data — map the property-graph dataset onto GraphData (label→type) ──────
const DATA: GraphData = {
  nodes: twitterActivity.nodes.map((n) => ({ id: n.id, type: n.label, data: n.properties })),
  edges: twitterActivity.edges.map((e) => ({ id: e.id, source: e.source, target: e.target, type: e.label })),
};

// Fields the designer offers for binding the Tweet card.
const TWEET_FIELDS = [
  { key: 'data.author', label: 'Author' },
  { key: 'data.handle', label: 'Handle' },
  { key: 'data.time', label: 'Time' },
  { key: 'data.text', label: 'Text' },
  { key: 'data.stats', label: 'Stats (♥ ↻ 💬)' },
  { key: 'data.likes', label: 'Likes' },
  { key: 'data.retweets', label: 'Retweets' },
  { key: 'data.replies', label: 'Replies' },
  { key: 'type', label: 'Type' },
];

// The starter Tweet card the user tweaks.
const STARTER_TWEET: FreeformStructure = {
  name: 'tweetCard',
  kind: 'freeform',
  width: 280,
  height: 162,
  cornerRadius: 12,
  bgRole: 'cardBg',
  elements: [
    { id: 'avatar', type: 'image', x: 16, y: 16, size: 40, shape: 'circle', bind: 'data.avatar' },
    { id: 'author', type: 'text', x: 66, y: 16, bind: 'data.author', fontSize: 16, fontWeight: 700, colorRole: 'heading', maxWidth: 150 },
    { id: 'handle', type: 'text', x: 66, y: 39, bind: 'data.handle', fontSize: 12, colorRole: 'muted' },
    { id: 'time', type: 'text', x: 264, y: 18, bind: 'data.time', anchor: 'right', fontSize: 11, colorRole: 'muted' },
    { id: 'text', type: 'text', x: 16, y: 68, bind: 'data.text', fontSize: 14, colorRole: 'foreground', maxWidth: 248, maxLines: 3 },
    { id: 'div', type: 'line', x: 16, y: 132, x2: 264, y2: 132, colorRole: 'divider', strokeWidth: 1 },
    { id: 'stats', type: 'text', x: 16, y: 140, bind: 'data.stats', fontSize: 13, fontWeight: 600, colorRole: 'accent' },
  ],
};

// A fixed User card (not edited here, just to show a second card type).
const USER_CARD: FreeformStructure = {
  name: 'userCard',
  kind: 'freeform',
  width: 210,
  height: 92,
  cornerRadius: 10,
  bgRole: 'cardBg',
  elements: [
    { id: 'avatar', type: 'image', x: 14, y: 14, size: 40, shape: 'circle', bind: 'data.avatar' },
    { id: 'name', type: 'text', x: 62, y: 14, bind: 'data.name', fontSize: 15, fontWeight: 700, colorRole: 'heading', maxWidth: 134 },
    { id: 'handle', type: 'text', x: 62, y: 36, bind: 'data.handle', fontSize: 12, colorRole: 'accent' },
    { id: 'bio', type: 'text', x: 14, y: 62, bind: 'data.bio', fontSize: 11, colorRole: 'muted', maxWidth: 182 },
  ],
};

const STRUCTURES: NodeStructureRegistry = { tweetCard: STARTER_TWEET, userCard: USER_CARD };
const NODE_TYPES: NodeTypeRegistry = {
  Tweet: { structure: 'tweetCard', styling: '', bindings: {} },
  User: { structure: 'userCard', styling: '', bindings: {} },
  Comment: { structure: 'circle', styling: 'circle', bindings: { label: 'data.author' } },
  Hashtag: { structure: 'circle', styling: 'circle', bindings: { label: 'data.label' } },
  Retweet: { structure: 'circle', styling: 'circle', bindings: { label: 'data.label' } },
};

const THEMES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'];
const MODES = ['light', 'dark'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CONFIG = {
  behaviours: {
    // Card backgrounds come from the template — turn off colour-by-type.
    color: { enabled: false },
    // Hover's `dimmed` state drops non-hovered cards to 25% alpha (their text
    // looks like it vanishes), so turn it off for a card-heavy graph.
    hover: { enabled: false },
  },
  layers: {
    graph: { nodeStructureTemplates: STRUCTURES, nodeTypes: NODE_TYPES },
  },
  layouts: {
    'graph-force': { charge: { strength: -2600 }, link: { distance: 230 }, collide: { radius: 120 }, animate: false },
  },
};

function CardDesignerStudio() {
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const [active, setActive] = useState('default');
  const [mode, setMode] = useState<(typeof MODES)[number]>('dark');
  const [open, setOpen] = useState(false);
  // Last applied design — so reopening the modal resumes where you left off
  // (kept in a ref so live edits don't re-render the page / canvas app).
  const lastTpl = useRef<FreeformStructure>(STARTER_TWEET);

  // Role → hex palette for the active theme/mode, for the designer preview.
  const palette = useMemo(() => {
    const theme = BUILT_IN_THEMES[active] ?? BUILT_IN_THEMES.default!;
    const { categorical: _c, ...roles } = mode === 'dark' ? theme.dark : theme.light;
    return roles as Record<string, number>;
  }, [active, mode]);

  // Push the initial theme once ready (parent effect runs after the app's own
  // ThemeTemplateSync, so our pick wins and stays while the host theme is fixed).
  useEffect(() => {
    canvas?.update({ behaviours: { theme: { active, mode } } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas]);

  const setTheme = (name: string) => {
    setActive(name);
    canvas?.update({ behaviours: { theme: { active: name } } });
  };
  const setThemeMode = (m: (typeof MODES)[number]) => {
    setMode(m);
    canvas?.update({ behaviours: { theme: { mode: m } } });
  };

  // Live: re-register the designed Tweet card + keep the Tweet type pointed at it.
  const applyTemplate = useCallback(
    (tpl: FreeformStructure) => {
      const pinned: FreeformStructure = { ...tpl, name: 'tweetCard' };
      lastTpl.current = pinned;
      canvas?.update({
        layers: {
          graph: {
            nodeStructureTemplates: { tweetCard: pinned },
            nodeTypes: { Tweet: { structure: 'tweetCard', styling: '', bindings: {} } },
          },
        },
      });
    },
    [canvas],
  );

  const themeControls = (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <RichSelect
        label="Theme"
        align="end"
        value={active}
        onChange={(v) => setTheme(v as string)}
        options={THEMES.map((t) => ({ value: t, label: cap(t) }))}
      />
      <RichSelect
        label="Mode"
        align="end"
        value={mode}
        onChange={(v) => setThemeMode(v as (typeof MODES)[number])}
        options={MODES.map((m) => ({ value: m, label: cap(m) }))}
      />
    </div>
  );

  return (
    <ThemeProvider>
      {/* Full-bleed canvas; the designer opens in a wide modal so it gets the
          whole width for its layers · preview · properties panels. */}
      <div style={pageStyle}>
        <GraphCanvasApp
          data={DATA}
          config={CONFIG}
          onReady={setCanvas}
          header={{
            title: 'Twitter feed',
            right: (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {themeControls}
                <Button onClick={() => setOpen(true)}>Design Tweet card</Button>
              </div>
            ),
          }}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent style={dialogContentStyle}>
            <DialogHeader>
              <DialogTitle>Designer Studio · Tweet card</DialogTitle>
            </DialogHeader>
            <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
              <NodeCardDesigner
                defaults={lastTpl.current}
                dataFields={TWEET_FIELDS}
                palette={palette}
                onChange={applyTemplate}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </ThemeProvider>
  );
}

export const CardDesignerStudioStory: Story = {
  name: 'Card Designer Studio',
  render: () => <CardDesignerStudio />,
};

// ─── Layout — full-bleed canvas + a wide designer modal ─────────────────────
const pageStyle: CSSProperties = {
  position: 'relative',
  height: '100vh',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  background: 'var(--background, #fff)',
  color: 'var(--foreground, #111)',
};
const dialogContentStyle: CSSProperties = {
  width: '96vw',
  maxWidth: '96vw',
  height: '90vh',
  display: 'flex',
  flexDirection: 'column',
};
