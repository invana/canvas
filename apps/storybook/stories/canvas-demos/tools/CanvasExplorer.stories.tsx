/**
 * **Canvas Explorer — the Invana Explorer board, end to end.** Every piece of
 * chrome in its one place (GC21–GC24, WT3 · WT4), composed from saved
 * `<ControlPanel>`s, canvas-ui widgets and view panels:
 *
 * | Where | What |
 * |---|---|
 * | top-left | one light row (hairline surface, small controls): Layers · Styling · Canvas history │ Select · Lasso select · Box select │ Expand neighbours · Layout · Size by connections │ Legend · Minimap │ Zoom in · Zoom out · Fit to screen · Full screen · Lock the view │ Undo · Redo │ Export image │ Present │ ‹ — which folds the row to the select modes, the view controls and *Show the tools* |
 * | under it | the legend, toggled from the row — or the Layers / Styling / History card, one at a time, over it |
 * | bottom-left | the minimap, nothing beside it |
 * | bottom-centre | the walkthrough presenter, only while presenting |
 * | footer, right | zoom and the world point at the viewport centre; a click copies it |
 *
 * The board opens on Valjean and the characters who share a scene with him.
 * **Expand** pulls the selected node's neighbours in from the rest of Les
 * Misérables — the stand-in for the engine's expansion run — and the active
 * layout preset re-draws around them. **Layout** is the preset popover:
 * Network · Tree ↓ · Flow → · Radial and their options. **Present** walks the
 * board's playbook: the row collapses to `◀ n/N ▶ ✕` and the presenter shows
 * the question and the message.
 *
 * Not drawn here: the row folding into `⋯` when it is wider than the board
 * (GC21) — the control panel can't measure its overflow yet — and the chat on
 * the right edge, which is Studio's.
 */

import type { Meta, StoryObj } from '@storybook/react-vite';
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import type { CanvasConfig } from '@invana/canvas';
import { selectedElementIds, type GraphCanvas, type GraphData, type GraphLayer } from '@invana/graph';
import { ControlPanel, ElkLayout, MiniMapLayer, NodeCentralityBehaviour } from '@invana/canvas-react';
import {
  GraphCanvasApp,
  HISTORY_CONTROL_ITEMS,
  HistoryViewPanel,
  LayersViewPanel,
  PanelContent,
  PlaybookPresentButton,
  PlaybookPresenterBar,
  PlaybookStepper,
  StylingViewPanel,
  type ControlWidget,
  type ToolbarIcon,
  type TypeStylingPatch
} from '@invana/canvas-ui';
import { lesMiserables } from '@invana/graph-datasets';
import { CircleDot, History, List, Map as MapIcon, Network, Palette, Sparkles } from 'lucide-react';

const meta: Meta = { title: 'canvas-demos/tools/CanvasExplorer' };
export default meta;
type Story = StoryObj;

/** The board's edge margin, and the gap between pieces of chrome. */
const EDGE = 12;
/** Where the legend and the form cards start: under the toolbar row. */
const UNDER_ROW = 51;
/** The minimap, bottom-left (GC23's 184 × 128). */
const MINIMAP_W = 184;
const MINIMAP_H = 128;
/** The app's footer rail under the board. */
const FOOTER_H = 25;
/** A form card ends above the minimap: persistent chrome never shares its place (GC24). */
const CARD_MAX_H = `calc(100vh - ${UNDER_ROW + MINIMAP_H + 2 * EDGE + FOOTER_H}px)`;

/** Valjean and everyone who shares a scene with him — what the first answer drew. */
function firstAnswer(): GraphData {
  const ids = new Set(['Valjean']);
  for (const e of lesMiserables.edges) {
    if (e.source === 'Valjean') ids.add(e.target);
    if (e.target === 'Valjean') ids.add(e.source);
  }
  return {
    nodes: lesMiserables.nodes.filter((n) => ids.has(n.id)),
    edges: lesMiserables.edges.filter((e) => ids.has(e.source) && ids.has(e.target))
  };
}

/** The board opens on the Network preset. */
const CONFIG: CanvasConfig = { layoutPreset: { id: 'network' } };

const PLAYBOOK = {
  version: 1 as const,
  title: 'Who holds Les Misérables together?',
  source: 'graph',
  steps: [
    {
      id: 'cast',
      title: 'Who shares a scene with Valjean?',
      narration: '36 characters do — more than with anyone else in the novel.',
      view: { camera: 'all' as const }
    },
    {
      id: 'hub',
      title: 'Who holds the story together?',
      narration: 'Valjean, with Javert, Fantine, Cosette and Marius at the centre of his scenes.',
      view: {
        select: ['Valjean'],
        focus: { ids: ['Valjean', 'Javert', 'Fantine', 'Cosette', 'Marius'] },
        camera: 'focus' as const
      }
    }
  ]
};

/** Icons the row names that the kit's registry doesn't carry. */
const ICONS: Record<string, ToolbarIcon> = {
  palette: Palette as ComponentType,
  history: History as ComponentType,
  legend: List as ComponentType,
  minimap: MapIcon as ComponentType,
  'expand-neighbours': Network as ComponentType,
  'size-by-connections': CircleDot as ComponentType
} as Record<string, ToolbarIcon>;

type Card = 'layers' | 'styling' | 'history';
const CARD_TITLES: Record<Card, string> = {
  layers: 'Layers',
  styling: 'Styling',
  history: 'History'
};

export const CanvasExplorerStory: Story = {
  name: 'CanvasExplorer',
  render: () => <Explorer />
};

function Explorer() {
  const data = useMemo(firstAnswer, []);
  const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
  const [card, setCard] = useState<Card | null>(null);
  const [legend, setLegend] = useState(true);
  const [presenting, setPresenting] = useState(false);
  const [styling, setStyling] = useState<TypeStylingPatch>({});

  // The board's own commands — what its row buttons run. State lives here; the
  // commands read it through a ref and are re-read whenever it changes.
  const state = useRef({ card, legend });
  state.current = { card, legend };
  useEffect(() => canvas?.commands.invalidate(), [canvas, card, legend]);

  const onReady = useCallback((c: GraphCanvas | null) => {
    setCanvas(c);
    if (!c) return;
    void c.playbook.load(PLAYBOOK);
    c.commands.register('explorer.card', {
      label: 'Card',
      isActive: (_c, args) => state.current.card === (args as { value: Card }).value,
      run: (_c, args) => {
        const value = (args as { value: Card }).value;
        setCard((open) => (open === value ? null : value));
      }
    });
    c.commands.register('explorer.legend', {
      label: 'Legend',
      isActive: () => state.current.legend,
      run: () => setLegend((on) => !on)
    });
    c.commands.register('explorer.expand', {
      label: 'Expand',
      isEnabled: (cv) => selectedElementIds(cv, 'click-select').nodeIds.length > 0,
      run: (cv) => expandSelection(cv as GraphCanvas)
    });
  }, []);

  const widgets = useMemo<Record<string, ControlWidget>>(
    () => ({
      present: ({ canvas: c }) => <PlaybookPresentButton canvas={c} onPresent={() => setPresenting(true)} />,
      stepper: ({ canvas: c }) => <PlaybookStepper canvas={c} onClose={() => setPresenting(false)} />,
      presenter: ({ canvas: c }) => (
        <PlaybookPresenterBar
          canvas={c}
          variant="compact"
          className="w-[540px] shadow-lg"
          narrationIcon={
            <span className="bg-primary/15 text-primary inline-flex size-5 shrink-0 items-center justify-center rounded-full">
              <Sparkles className="size-3" />
            </span>
          }
        />
      ),
      card: ({ canvas: c }) =>
        card ? (
          <PanelContent header={CARD_TITLES[card]} onClose={() => setCard(null)} width={320} style={{ maxHeight: CARD_MAX_H }}>
            {card === 'layers' && <LayersViewPanel canvas={c as GraphCanvas} />}
            {card === 'styling' && <StylingViewPanel canvas={c as GraphCanvas} value={styling} onChange={setStyling} />}
            {card === 'history' && <HistoryViewPanel canvas={c} />}
          </PanelContent>
        ) : null
    }),
    [card, styling]
  );

  return (
    <GraphCanvasApp data={data} showHeader={false} config={CONFIG} onReady={onReady} controlPanels={{ icons: ICONS, widgets }}>
      <ElkLayout id="elk" targetLayerId="graph" />
      <NodeCentralityBehaviour id="size-by-connections" enabled={false} />
      <MiniMapLayer
        backgroundLayerId="background"
        position="bottom-left"
        width={MINIMAP_W}
        height={MINIMAP_H}
        margin={{ x: EDGE, y: EDGE }}
      />

      <ControlPanel
        id="tools"
        position="top-left"
        offset={EDGE}
        surface="hairline"
        // Tools off (GC21): the row folds to the three select modes and *Show the tools*.
        {...(presenting
          ? {}
          : { collapsible: { keep: ['select-mode', 'zoom-in', 'zoom-out', 'fit', 'fullscreen', 'lock'], hides: ['legend', 'card'] } })}
        items={
          presenting
            ? [{ type: 'widget', widget: 'stepper' }]
            : [
                {
                  type: 'toggle',
                  key: 'layers',
                  command: 'explorer.card',
                  args: { value: 'layers' },
                  icon: 'layers',
                  label: 'Layers'
                },
                {
                  type: 'toggle',
                  key: 'styling',
                  command: 'explorer.card',
                  args: { value: 'styling' },
                  icon: 'palette',
                  label: 'Styling'
                },
                {
                  type: 'toggle',
                  key: 'history',
                  command: 'explorer.card',
                  args: { value: 'history' },
                  icon: 'history',
                  label: 'Canvas history'
                },
                { type: 'divider' },
                {
                  type: 'choice',
                  key: 'select-mode',
                  command: 'select.mode',
                  label: 'Select',
                  display: 'segmented',
                  options: [
                    { value: 'click', label: 'Select', icon: 'pointer' },
                    { value: 'lasso', label: 'Lasso select', icon: 'lasso' },
                    { value: 'brush', label: 'Box select', icon: 'select-box' }
                  ]
                },
                { type: 'divider' },
                {
                  type: 'command',
                  key: 'expand',
                  command: 'explorer.expand',
                  icon: 'expand-neighbours',
                  label: 'Expand neighbours'
                },
                { type: 'widget', widget: 'layout-presets' },
                {
                  type: 'toggle',
                  key: 'size-by',
                  command: 'behaviour.toggle',
                  args: { id: 'size-by-connections' },
                  icon: 'size-by-connections',
                  label: 'Size by connections'
                },
                { type: 'divider' },
                {
                  type: 'toggle',
                  key: 'legend',
                  command: 'explorer.legend',
                  icon: 'legend',
                  label: 'Legend'
                },
                // The minimap is the `minimap` layer — the same one the Layers card shows —
                // so it stays in its dock while the row collapses to the stepper.
                { type: 'toggle', key: 'minimap', command: 'layer.visible', args: { id: 'minimap' }, icon: 'minimap', label: 'Minimap' },
                { type: 'divider' },
                // The view controls live in the row — no separate zoom bar.
                { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
                { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
                { type: 'command', key: 'fit', command: 'camera.fit', icon: 'fit', label: 'Fit to screen' },
                { type: 'widget', key: 'fullscreen', widget: 'fullscreen' },
                {
                  type: 'toggle',
                  key: 'lock',
                  command: 'view.lock',
                  icon: 'lock-open',
                  activeIcon: 'lock',
                  label: 'Lock the view',
                  activeLabel: 'Unlock the view'
                },
                { type: 'divider' },
                ...HISTORY_CONTROL_ITEMS,
                { type: 'divider' },
                {
                  type: 'widget',
                  widget: 'export-image',
                  options: { filename: 'explorer', label: 'Export image', icon: 'image' }
                },
                { type: 'divider' },
                { type: 'widget', widget: 'present' }
              ]
        }
      />

      <ControlPanel
        id="legend"
        position="top-left"
        offset={{ x: EDGE, y: UNDER_ROW }}
        surface={false}
        visible={legend && card === null && !presenting}
        items={[{ type: 'widget', widget: 'graph-legend' }]}
      />
      <ControlPanel
        id="card"
        position="top-left"
        offset={{ x: EDGE, y: UNDER_ROW }}
        surface={false}
        visible={card !== null && !presenting}
        items={[{ type: 'widget', widget: 'card' }]}
      />

      <ControlPanel id="readout" placement="footer-right" items={[{ type: 'widget', widget: 'view-readout' }]} />

      <ControlPanel
        id="presenter"
        position="bottom"
        offset={EDGE}
        surface={false}
        visible={presenting}
        items={[{ type: 'widget', widget: 'presenter' }]}
      />
    </GraphCanvasApp>
  );
}

/**
 * Add every neighbour of the selected nodes from the full Les Misérables graph,
 * with the edges that join them to what is drawn — added, never replacing. The
 * active layout preset re-draws on the new nodes; the selection stays.
 */
function expandSelection(canvas: GraphCanvas): void {
  const layer = canvas.layers.get<GraphLayer>('graph');
  if (!layer) return;
  const picked = new Set(selectedElementIds(canvas, 'click-select').nodeIds);
  const drawn = new Set([...layer.store.nodes()].map((n) => n.id));
  const added = new Set<string>();
  for (const e of lesMiserables.edges) {
    if (picked.has(e.source) && !drawn.has(e.target)) added.add(e.target);
    if (picked.has(e.target) && !drawn.has(e.source)) added.add(e.source);
  }
  const after = new Set([...drawn, ...added]);
  const drawnEdges = new Set([...layer.store.edges()].map((e) => e.id));
  layer.store.addData({
    nodes: lesMiserables.nodes.filter((n) => added.has(n.id)),
    edges: lesMiserables.edges.filter((e) => !drawnEdges.has(e.id) && after.has(e.source) && after.has(e.target))
  });
}
