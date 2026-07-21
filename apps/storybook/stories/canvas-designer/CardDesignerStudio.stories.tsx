/**
 * **Card Designer Studio** — end-users build their own node cards, no developer
 * round-trip, on a multi-type social graph (a ~99-node mocked Twitter feed:
 * `User` · `Tweet` · `Comment` · `Hashtag` · `Retweet`, with `POSTED` /
 * `REPLY_TO` / `TAGGED` / `MENTIONS` / `RETWEETED` / `FOLLOWS` edges). Every
 * node type renders as its own composite card.
 *
 * The full-bleed graph is a {@link GraphCanvasApp}. The **Templates** button
 * opens a modal listing the node types (live thumbnails via `NodeTemplateList`);
 * clicking **Edit** opens the single-template `NodeCardDesigner` for that type.
 * Edits live-register the type's structure template, so its nodes adopt the new
 * card instantly. Theme + mode (header `RichSelect`s) recolour every card.
 */

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { GraphCanvasApp } from '@invana/canvas-ui';
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  RichSelect,
} from '@invana/ui';
import { ThemeProvider } from '@invana/themes';
import { NodeCardDesigner, NodeTemplateList } from '@invana/canvas-designer';
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

// Fields offered for binding, per node type.
const FIELDS: Record<string, { key: string; label: string }[]> = {
  Tweet: [
    { key: 'data.author', label: 'Author' },
    { key: 'data.handle', label: 'Handle' },
    { key: 'data.time', label: 'Time' },
    { key: 'data.text', label: 'Text' },
    { key: 'data.stats', label: 'Stats (♥ ↻ 💬)' },
    { key: 'data.likes', label: 'Likes' },
    { key: 'data.retweets', label: 'Retweets' },
    { key: 'data.replies', label: 'Replies' },
    { key: 'type', label: 'Type' },
  ],
  User: [
    { key: 'data.name', label: 'Name' },
    { key: 'data.handle', label: 'Handle' },
    { key: 'data.avatar', label: 'Avatar' },
    { key: 'data.followers', label: 'Followers' },
    { key: 'data.bio', label: 'Bio' },
    { key: 'type', label: 'Type' },
  ],
  Comment: [
    { key: 'data.author', label: 'Author' },
    { key: 'data.handle', label: 'Handle' },
    { key: 'data.time', label: 'Time' },
    { key: 'data.text', label: 'Text' },
    { key: 'type', label: 'Type' },
  ],
  Hashtag: [
    { key: 'data.tag', label: 'Tag' },
    { key: 'data.label', label: 'Label (#tag)' },
    { key: 'data.uses', label: 'Uses' },
    { key: 'type', label: 'Type' },
  ],
  Retweet: [
    { key: 'data.by', label: 'By' },
    { key: 'data.label', label: 'Label' },
    { key: 'data.time', label: 'Time' },
    { key: 'type', label: 'Type' },
  ],
};

// ─── Card templates — one per node type ─────────────────────────────────────
const TWEET_CARD: FreeformStructure = {
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
const COMMENT_CARD: FreeformStructure = {
  name: 'commentCard',
  kind: 'freeform',
  width: 220,
  height: 84,
  cornerRadius: 10,
  bgRole: 'cardBg',
  elements: [
    { id: 'bar', type: 'rect', x: 0, y: 0, width: 4, height: 84, fillRole: 'accent' },
    { id: 'author', type: 'text', x: 14, y: 12, bind: 'data.author', fontSize: 13, fontWeight: 700, colorRole: 'heading', maxWidth: 130 },
    { id: 'time', type: 'text', x: 206, y: 13, bind: 'data.time', anchor: 'right', fontSize: 10, colorRole: 'muted' },
    { id: 'text', type: 'text', x: 14, y: 36, bind: 'data.text', fontSize: 12, colorRole: 'foreground', maxWidth: 192, maxLines: 2 },
  ],
};
const HASHTAG_CARD: FreeformStructure = {
  name: 'hashtagCard',
  kind: 'freeform',
  width: 160,
  height: 56,
  cornerRadius: 28,
  bgRole: 'cardBg',
  elements: [
    { id: 'tag', type: 'text', x: 18, y: 11, bind: 'data.label', fontSize: 17, fontWeight: 700, colorRole: 'accent', maxWidth: 124 },
    { id: 'uses', type: 'text', x: 18, y: 34, bind: 'data.uses', fontSize: 10, colorRole: 'muted' },
  ],
};
const RETWEET_CARD: FreeformStructure = {
  name: 'retweetCard',
  kind: 'freeform',
  width: 200,
  height: 60,
  cornerRadius: 10,
  bgRole: 'cardBg',
  elements: [
    { id: 'label', type: 'text', x: 14, y: 12, bind: 'data.label', fontSize: 13, fontWeight: 600, colorRole: 'muted', maxWidth: 172 },
    { id: 'time', type: 'text', x: 14, y: 34, bind: 'data.time', fontSize: 10, colorRole: 'muted' },
  ],
};

const TYPE_ORDER = ['Tweet', 'User', 'Comment', 'Hashtag', 'Retweet'];
const STRUCT_NAME: Record<string, string> = {
  Tweet: 'tweetCard',
  User: 'userCard',
  Comment: 'commentCard',
  Hashtag: 'hashtagCard',
  Retweet: 'retweetCard',
};
const INITIAL_TEMPLATES: Record<string, FreeformStructure> = {
  Tweet: TWEET_CARD,
  User: USER_CARD,
  Comment: COMMENT_CARD,
  Hashtag: HASHTAG_CARD,
  Retweet: RETWEET_CARD,
};
// A representative node per type, for the template thumbnails (read by dotted
// path, so the concrete node shape is widened to a record).
const SAMPLES: Record<string, Record<string, unknown> | undefined> = Object.fromEntries(
  TYPE_ORDER.map((t) => [t, DATA.nodes.find((n) => n.type === t) as Record<string, unknown> | undefined]),
);

const STRUCTURES: NodeStructureRegistry = {
  tweetCard: TWEET_CARD,
  userCard: USER_CARD,
  commentCard: COMMENT_CARD,
  hashtagCard: HASHTAG_CARD,
  retweetCard: RETWEET_CARD,
};
const NODE_TYPES: NodeTypeRegistry = Object.fromEntries(
  TYPE_ORDER.map((t) => [t, { structure: STRUCT_NAME[t]!, styling: '', bindings: {} }]),
);

const THEMES = ['default', 'forest', 'ocean', 'gold', 'rose', 'minimal'];
const MODES = ['light', 'dark'] as const;
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const CONFIG = {
  behaviours: {
    // Card backgrounds come from the template; hover's dim hides card text.
    color: { enabled: false },
    hover: { enabled: false },
  },
  layers: { graph: { nodeStructureTemplates: STRUCTURES, nodeTypes: NODE_TYPES } },
  layouts: {
    'graph-force': { charge: { strength: -3200 }, link: { distance: 260 }, collide: { radius: 150 }, animate: false },
  },
};

function CardDesignerStudio() {
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const [active, setActive] = useState('default');
  const [mode, setMode] = useState<(typeof MODES)[number]>('dark');
  const [open, setOpen] = useState(false);
  const [editingType, setEditingType] = useState<string | null>(null);
  // Live templates per type (ref so live edits don't re-render the canvas app).
  const templates = useRef<Record<string, FreeformStructure>>(INITIAL_TEMPLATES);

  const palette = useMemo(() => {
    const theme = BUILT_IN_THEMES[active] ?? BUILT_IN_THEMES.default!;
    const { categorical: _c, ...roles } = mode === 'dark' ? theme.dark : theme.light;
    return roles as Record<string, number>;
  }, [active, mode]);

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

  // Live: re-register the edited type's card + keep the type pointed at it.
  const applyTemplate = useCallback(
    (type: string, tpl: FreeformStructure) => {
      const name = STRUCT_NAME[type]!;
      const pinned: FreeformStructure = { ...tpl, name };
      templates.current = { ...templates.current, [type]: pinned };
      canvas?.update({
        layers: {
          graph: {
            nodeStructureTemplates: { [name]: pinned },
            nodeTypes: { [type]: { structure: name, styling: '', bindings: {} } },
          },
        },
      });
    },
    [canvas],
  );

  const openTemplates = () => {
    setEditingType(null);
    setOpen(true);
  };

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
                <Button onClick={openTemplates}>Templates</Button>
              </div>
            ),
          }}
        />

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent style={dialogContentStyle}>
            <DialogHeader>
              <DialogTitle>{editingType ? `Edit ${editingType} card` : 'Node templates'}</DialogTitle>
            </DialogHeader>

            {editingType ? (
              <div style={editorWrapStyle}>
                <div style={{ padding: '4px 0' }}>
                  <Button variant="ghost" onClick={() => setEditingType(null)}>
                    ← All templates
                  </Button>
                </div>
                <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                  <NodeCardDesigner
                    key={editingType}
                    defaults={templates.current[editingType]}
                    dataFields={FIELDS[editingType] ?? []}
                    palette={palette}
                    onChange={(tpl) => applyTemplate(editingType, tpl)}
                  />
                </div>
              </div>
            ) : (
              <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
                <NodeTemplateList
                  items={TYPE_ORDER.map((t) => ({ type: t, template: templates.current[t]!, sample: SAMPLES[t] }))}
                  palette={palette}
                  onEdit={(t) => setEditingType(t)}
                />
              </div>
            )}
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

// ─── Layout ──────────────────────────────────────────────────────────────────
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
const editorWrapStyle: CSSProperties = { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 };
