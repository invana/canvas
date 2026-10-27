import { useCallback, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Circle, Frame, Square, StickyNote, Type } from 'lucide-react';
import { Behaviour, KeyboardShortcutsBehaviour, type BehaviourOptions, type CanvasConfig, type CanvasContext, type PathSpec } from '@invana/canvas';
import {
  ClickInspectBehaviour,
  CreateNodeBehaviour,
  DrawEdgeBehaviour,
  EraseBehaviour,
  NodeResizeBehaviour,
  type GraphCanvas,
  type GraphData,
  type GraphLayer,
  type NodeStyle
} from '@invana/graph';
import { CanvasMessageBar, ElementViewPanel, GraphCanvasApp, GraphStatusBar, editElement } from '@invana/canvas-ui';

const meta: Meta = {
  title: 'canvas-demos/tools/Whiteboard',
  parameters: { layout: 'fullscreen' }
};
export default meta;
type Story = StoryObj;

/**
 * **A Miro-style whiteboard, built only from what ships today.** A sprint retro:
 * a frame holding three columns of sticky notes, free text, shapes, curved
 * connectors and a pen. Nothing in a package was changed for this story.
 *
 * Same recipe as `DiagramEditor`: `data` + `config` + `onReady`. The note colour
 * is **data** (`data.color`, read by a `fillLookup`), so the panel's *Edit* can
 * recolour a note by changing its `color` property. The sticky picker in the
 * header is `tool.nodeKind` — each colour is a kind.
 *
 * | Do | Tool / key |
 * |---|---|
 * | click an item or the frame: its handles appear and the right panel opens on its editor | Select · `V` |
 * | move (also while Add is in hand) · select many with box or lasso | Select · `V` |
 * | pan | Hand · `H`, or hold Space |
 * | drop a sticky / text / shape / frame on empty canvas | Add · `N` (pick the kind in the header) |
 * | draw a connector between two items | Connect · `C` |
 * | freehand ink | Pen · `P` |
 * | delete by clicking | Erase · `E` |
 * | change a note's text or colour | click it: the panel opens on the form (`color`: yellow · pink · blue · green). *Apply* saves (one undo step) |
 * | undo / redo · copy / paste · delete | `⌘Z` / `⇧⌘Z` · `⌘C` / `⌘V` · `⌫` |
 *
 * ### ⚠️ Story-only workaround: the pen (G8)
 *
 * The engine has no ink tool, so `onReady` defines a **`PenBehaviour` inside
 * this story**: it draws the stroke as a transient renderer `path` shape while
 * you drag, then saves it as a node of type `ink` whose shape is that `path`. It
 * is one undoable step, it can be selected, dragged and erased, and it saves with
 * the board. It is a sketch of what an engine `InkBehaviour` would do, not one:
 * there's no pressure, smoothing or highlighter, the stroke colour comes from the
 * theme, and you can't select it by its box. Don't copy it into a package as is.
 *
 * ### ⚠️ Gaps found: the engine has no answer for these yet
 *
 * | # | Miro has | What happens here |
 * |---|---|---|
 * | G2 | double-click a sticky and type | text is edited in the right panel's form. There's no in-place editor. **This is the biggest gap for a whiteboard** |
 * | G9 | stickies wrap their text and shrink it to fit | a sticky is a rect node with one line of label. Long text overflows the note (the template's label has no wrap / max width) |
 * | G9 | free text is its own element | text is a node with a transparent shape. It can be connected and selected like any shape |
 * | G1 | drag a sticky off a stack | arm Add, pick a colour, click |
 * | G5 | bring to front / send to back | no z-order command |
 * | G6 | rotate | no rotate gesture |
 * | G10 | a connector with a loose end | Connect needs an item at both ends |
 * | G11 | drop items into a frame, move them with it | a click inside the frame hits the frame, so Add places nothing there. Items keep the `parentId` they were authored with |
 * | G15 | multiplayer cursors · comments on the board | the kernel is Yjs-ready but collaboration isn't built. Annotations attach to records, not to a spot on the board |
 * | G16 | per-item colour picker | only stickies recolour (through their data). Shapes and text follow the theme |
 * | G17 | resize any item | handles show on the selected item only (a `selected` overlay makes it `resizable`), but `NodeResizeBehaviour` only resizes rects and circles — ink strokes get no handles |
 * | G21 | a frame resizable only while selected | `group.userResizable` can't go in a `selected` overlay (it would make every selected item a container), so `onReady` flips it on the selected frame in code |
 * | G22 | Shift-click to add to the selection | click-select either replaces or toggles; it has no "plain replaces, Shift adds". Box / lasso select many |
 * | G23 | undo steps over edits only | every click records a `view:selection:set` history entry, so ⌘Z first walks back through selections before it reaches the last edit |
 * | G19 | — | the gesture check warns that `create` / `erase` / `click-inspect` all claim `pointer+click`, though their `modes` never overlap. It ignores modes |
 * | G20 | one anchor for every shape | a rect's `position` is its top-left corner, a circle / diamond / polygon's its centre. A row of mixed shapes needs two y's |
 * | G18 | a custom tool | `tool.active` takes `pen`, but warns: its `value` is a closed enum (`select` · `add` · `connect` · `delete`) |
 *
 * ### 🐞 Defects found while building it (worked around here, need a fix)
 *
 * | # | Where | What |
 * |---|---|---|
 * | D1 | `ElementViewPanel` | its prop is `canvas: Canvas \| null`, but it throws (`useEntityEditor` → *Canvas hooks need a <Canvas> ancestor*) while `null`. The story renders it only once `ctx.canvas` is set |
 * | D2 | `GraphLayer.resolveTypeBinding` | a `nodeTypes` entry with no `structure` silently drops its **whole** styling, `group` included. A lane / frame / ink type therefore names a structure it doesn't need |
 * | D3 | template compiler | `fillAlpha` applies only when the styling names a fill, so a transparent shape shows the bundle's grey `bgFill`. The story adds `fillRole: 'surface'` just so `fillAlpha: 0` takes |
 * | D4 | this story's `config` | it's cast `as unknown as CanvasConfig` like the reference story, which hid a missing required `bindings` until it crashed at runtime. Template registries could be typed in `CanvasConfig` |
 */

/**
 * A retro board: one frame, three columns of notes. Positions are authored.
 * ⚠️ A rect's (sticky, text, frame) position is its **top-left** corner, a
 * circle's or a stroke's its **centre** (finding G20).
 */
const data: GraphData = {
  nodes: [
    { id: 'retro', type: 'frame', position: { x: 50, y: 30 }, style: { labelText: 'Retro · Sprint 42' } },

    { id: 'h-well', type: 'text', parentId: 'retro', position: { x: 90, y: 74 }, style: { labelText: 'Went well' } },
    { id: 'h-improve', type: 'text', parentId: 'retro', position: { x: 310, y: 74 }, style: { labelText: 'To improve' } },
    { id: 'h-actions', type: 'text', parentId: 'retro', position: { x: 530, y: 74 }, style: { labelText: 'Actions' } },

    { id: 's1', type: 'sticky', parentId: 'retro', position: { x: 105, y: 135 }, data: { color: 'green' }, style: { labelText: 'Shipped on time' } },
    { id: 's2', type: 'sticky', parentId: 'retro', position: { x: 105, y: 295 }, data: { color: 'green' }, style: { labelText: 'Pairing helped' } },
    { id: 's3', type: 'sticky', parentId: 'retro', position: { x: 325, y: 135 }, data: { color: 'pink' }, style: { labelText: 'Flaky CI' } },
    { id: 's4', type: 'sticky', parentId: 'retro', position: { x: 325, y: 295 }, data: { color: 'pink' }, style: { labelText: 'Late reviews' } },
    { id: 's5', type: 'sticky', parentId: 'retro', position: { x: 545, y: 135 }, data: { color: 'yellow' }, style: { labelText: 'Quarantine tests' } },
    { id: 's6', type: 'sticky', parentId: 'retro', position: { x: 545, y: 295 }, data: { color: 'blue' }, style: { labelText: 'Review SLA: 1 day' } },

    { id: 'idea', type: 'circle', position: { x: 960, y: 200 }, style: { labelText: 'Idea' } },
    { id: 'owner', type: 'rect', position: { x: 895, y: 325 }, style: { labelText: 'Owner: Sam' } },

    // A stroke saved by the pen: a `path` shape, centre-relative points.
    {
      id: 'ink-seed',
      type: 'ink',
      position: { x: 400, y: 112 },
      style: { shape: { kind: 'path', points: [{ x: -60, y: 0 }, { x: -20, y: 4 }, { x: 20, y: -2 }, { x: 60, y: 3 }] } }
    }
  ],
  edges: [
    { id: 'c1', type: 'link', source: 's3', target: 's5' },
    { id: 'c2', type: 'link', source: 's4', target: 's6' },
    { id: 'c3', type: 'link', source: 's6', target: 'owner' },
    { id: 'c4', type: 'link', source: 'idea', target: 'owner' }
  ]
};

/** What the footer says while each tool is in hand. */
const HINTS: Record<string, string> = {
  select: 'Click an item to edit it and show its handles · drag to move · box or lasso to select many',
  hand: 'Drag to pan',
  add: 'Pick a sticky colour or a shape in the header, then click empty canvas · Esc to stop',
  connect: 'Drag from one item to another to connect them · Esc to stop',
  pen: 'Draw with the pointer · each stroke is one undo step · Esc to stop',
  delete: 'Click an item, a stroke or a connector to delete it · Esc to stop'
};

/** Default text for what the Add tool drops, by kind. */
const NEW_TEXT: Record<string, string> = { sticky: 'New note', text: 'Text', rect: 'Shape', circle: 'Shape', frame: 'Frame' };

/** The whole canvas config, deep-merged by `GraphCanvasApp` over its bundle defaults. */
const config = {
  fitOnLoad: true,
  activeLayout: '',
  layers: {
    background: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.8 },
    graph: {
      nodeStructureTemplates: {
        sticky: { name: 'sticky', kind: 'simple', shape: { kind: 'rect', width: 150, height: 130, cornerRadius: 3 }, slots: { label: true } },
        text: { name: 'text', kind: 'simple', shape: { kind: 'rect', width: 180, height: 32 }, slots: { label: true } },
        rect: { name: 'rect', kind: 'simple', shape: { kind: 'rect', width: 130, height: 70, cornerRadius: 10 }, slots: { label: true } },
        circle: { name: 'circle', kind: 'simple', shape: { kind: 'circle', radius: 46 }, slots: { label: true } },
        // A type binding without a structure drops its whole styling (`group`
        // included), so frame and ink name one. A stroke's own `style.shape`
        // outranks the placeholder path here.
        frame: { name: 'frame', kind: 'simple', shape: { kind: 'rect', width: 700, height: 480 }, slots: { label: true } },
        ink: { name: 'ink', kind: 'simple', shape: { kind: 'path', points: [{ x: 0, y: 0 }, { x: 1, y: 0 }] }, slots: { label: false } }
      },
      nodeStylingTemplates: {
        // A note's paper is a literal colour, so its ink is too — a themed label
        // would turn light on yellow paper in dark mode.
        sticky: {
          name: 'sticky',
          fillLookup: { bind: 'data.color', map: { yellow: 0xfde68a, pink: 0xfbcfe8, blue: 0xbfdbfe, green: 0xbbf7d0 }, fallback: 0xfde68a },
          strokeAlpha: 0,
          label: { placement: 'center', fontSize: 14, color: 0x1f2937 }
        },
        text: { name: 'text', fillRole: 'surface', fillAlpha: 0, strokeAlpha: 0, label: { placement: 'center', fontSize: 20, fontWeight: 700, colorRole: 'heading' } },
        shape: { name: 'shape', fillRole: 'cardBg', strokeRole: 'accent', strokeWidth: 2, label: { placement: 'center', fontSize: 13, colorRole: 'foreground' } },
        ink: { name: 'ink', strokeRole: 'foreground', strokeWidth: 3 },
        frame: {
          name: 'frame',
          // The title sits above the frame, like Miro's. (`top-left` hangs outside the
          // corner, so it would end left of the frame.)
          label: { placement: 'top', fontSize: 13, fontWeight: 600, colorRole: 'heading' },
          group: { autoFit: false, width: 700, height: 480, userResizable: false, behindChildren: true, headerHeight: 32, showToggle: false }
        }
      },
      nodeTypes: {
        sticky: { structure: 'sticky', styling: 'sticky', bindings: {} },
        text: { structure: 'text', styling: 'text', bindings: {} },
        rect: { structure: 'rect', styling: 'shape', bindings: {} },
        circle: { structure: 'circle', styling: 'shape', bindings: {} },
        ink: { structure: 'ink', styling: 'ink', bindings: {} },
        frame: { structure: 'frame', styling: 'frame', bindings: {} }
      },
      node: {
        style: { labelOffsetY: 0 },
        // Only the selected shape is resizable, so only it shows handles. A
        // consumer `state.selected` replaces the default one, so the frame is
        // the selection mark. (A lane / frame's switch is `group.userResizable`,
        // flipped per selected container in `onReady`.)
        state: { selected: { resizable: true } }
      },
      edge: { style: { shape: { pathType: 'bezier' }, strokeWidth: 2, arrowTargetShape: 'triangle', arrowTargetSize: 8 } }
    }
  },
  behaviours: {
    color: { enabled: false },
    hover: { enabled: false },
    // Panning must not steal the pen's drag.
    pan: { enabled: true, modes: ['!pen'] },
    // Drag in Select and Add, so a shape just placed can be nudged; Connect /
    // Erase / Pen start on the same press, so drag is off there.
    'drag-node': { enabled: true, modes: ['select', 'add'] },
    // An open frame is scenery by default; here a frame is content you click to
    // select, rename and resize. A click replaces the selection (box / lasso
    // select many); there is no Shift-click-to-add (G22).
    'click-select': { enabled: true, multiple: false, excludeGroups: 'never', modes: ['select'] },
    'brush-select': { modes: ['select'] },
    'lasso-select': { modes: ['select'] },
    'click-inspect': { enabled: true, modes: ['select'] },
    resize: { enabled: true, modes: ['select'] },
    create: { enabled: true, modes: ['add'] },
    connect: { enabled: true, modes: ['connect'] },
    erase: { enabled: true, modes: ['delete'] },
    pen: { enabled: true, modes: ['pen'] },
    keys: {
      enabled: true,
      bindings: [
        { keys: 'mod+z', command: 'history.undo' },
        { keys: 'mod+shift+z, mod+y', command: 'history.redo' },
        { keys: 'mod+x', command: 'clipboard.cut' },
        { keys: 'mod+c', command: 'clipboard.copy' },
        { keys: 'mod+v', command: 'clipboard.paste' },
        { keys: 'delete, backspace', command: 'clipboard.delete' },
        { keys: 'escape', command: 'tool.active', args: { value: 'select' } },
        { keys: 'v', command: 'tool.active', args: { value: 'select' } },
        { keys: 'h', command: 'tool.active', args: { value: 'hand' } },
        { keys: 'n', command: 'tool.active', args: { value: 'add' } },
        { keys: 'c', command: 'tool.active', args: { value: 'connect' } },
        { keys: 'p', command: 'tool.active', args: { value: 'pen' } },
        { keys: 'e', command: 'tool.active', args: { value: 'delete' } }
      ]
    }
  },
  controlPanels: {
    tools: {
      kind: 'control-panel',
      placement: 'header-center',
      items: [
        { type: 'widget', key: 'pointer', widget: 'pointer-tools' },
        { type: 'divider' },
        { type: 'toggle', key: 'add', command: 'tool.active', args: { value: 'add' }, icon: 'sticky-note', label: 'Add (N)' },
        {
          type: 'choice',
          key: 'kind',
          command: 'tool.nodeKind',
          label: 'Add',
          options: [
            { value: 'sticky-yellow', label: 'Sticky · yellow', icon: 'wb-sticky' },
            { value: 'sticky-pink', label: 'Sticky · pink', icon: 'wb-sticky' },
            { value: 'sticky-blue', label: 'Sticky · blue', icon: 'wb-sticky' },
            { value: 'sticky-green', label: 'Sticky · green', icon: 'wb-sticky' },
            { value: 'text', label: 'Text', icon: 'wb-text' },
            { value: 'rect', label: 'Rectangle', icon: 'wb-rect' },
            { value: 'circle', label: 'Circle', icon: 'wb-circle' },
            { value: 'frame', label: 'Frame', icon: 'wb-frame' }
          ]
        },
        { type: 'toggle', key: 'connect', command: 'tool.active', args: { value: 'connect' }, icon: 'connect', label: 'Connect (C)' },
        { type: 'toggle', key: 'pen', command: 'tool.active', args: { value: 'pen' }, icon: 'pencil', label: 'Pen (P)' },
        { type: 'toggle', key: 'erase', command: 'tool.active', args: { value: 'delete' }, icon: 'eraser', label: 'Erase (E)' },
        { type: 'divider' },
        { type: 'command', key: 'undo', command: 'history.undo', icon: 'undo', label: 'Undo' },
        { type: 'command', key: 'redo', command: 'history.redo', icon: 'redo', label: 'Redo' }
      ]
    },
    file: {
      kind: 'control-panel',
      placement: 'header-right',
      items: [
        { type: 'widget', key: 'export-image', widget: 'export-image', options: { filename: 'board', formats: ['png', 'svg'] } },
        { type: 'widget', key: 'export-state', widget: 'export-state', options: { filename: 'board' } },
        { type: 'toggle', key: 'theme', command: 'theme.toggle', icon: 'moon', activeIcon: 'sun', label: 'Switch to dark theme', activeLabel: 'Switch to light theme' }
      ]
    },
    view: {
      kind: 'control-panel',
      position: 'bottom-right',
      items: [
        { type: 'command', key: 'zoom-out', command: 'camera.zoomOut', icon: 'zoom-out', label: 'Zoom out' },
        { type: 'widget', key: 'zoom', widget: 'zoom-readout' },
        { type: 'command', key: 'zoom-in', command: 'camera.zoomIn', icon: 'zoom-in', label: 'Zoom in' },
        { type: 'command', key: 'fit', command: 'camera.fit', icon: 'maximize', label: 'Fit to content' },
        { type: 'divider' },
        { type: 'widget', key: 'minimap', widget: 'minimap-toggle', options: { defaultOn: false } }
      ]
    }
  }
} as unknown as CanvasConfig;

export const WhiteboardStory: Story = {
  name: 'Whiteboard',
  render: function WhiteboardRender() {
    const offs = useRef<Array<() => void>>([]);
    const [picked, setPicked] = useState(false);

    const onReady = useCallback((canvas: GraphCanvas | null) => {
      for (const off of offs.current.splice(0)) off();
      if (!canvas) return;

      /**
       * ⚠️ STORY-ONLY WORKAROUND for gap G8 (no ink tool in the engine) — see the
       * docblock. Drag to draw: a transient `path` shape follows the pointer, and
       * on release the stroke is saved as one `ink` node (one undo step).
       */
      class PenBehaviour extends Behaviour<BehaviourOptions> {
        override readonly kind = 'story-pen';
        private el: HTMLCanvasElement | null = null;
        private points: { x: number; y: number }[] = [];
        private drawing = false;

        protected override onRegister(ctx: CanvasContext): void {
          this.el = ctx.canvasElement ?? null;
          this.el?.addEventListener('pointerdown', this.onDown);
        }

        protected override onDestroy(): void {
          this.end(false);
          this.el?.removeEventListener('pointerdown', this.onDown);
          this.el = null;
        }

        protected override onDisable(): void {
          this.end(false);
        }

        private get layer(): GraphLayer | undefined {
          return this.ctx?.layers.get<GraphLayer>(this.targetLayerId!);
        }

        private toWorld(e: PointerEvent): { x: number; y: number } {
          const r = this.el!.getBoundingClientRect();
          return this.ctx!.camera.toWorld(e.clientX - r.left, e.clientY - r.top);
        }

        private readonly onDown = (e: PointerEvent): void => {
          if (!this.isEnabled || e.button !== 0 || !this.layer?.getRenderer() || !this.claimGesture()) return;
          this.drawing = true;
          this.points = [this.toWorld(e)];
          const theme = this.ctx!.theme.current();
          this.layer.getRenderer()!.addShape('story-pen-draft', {
            kind: 'path',
            x: 0,
            y: 0,
            points: this.points,
            stroke: { color: theme?.palette.foreground ?? 0x111827, width: 3 },
            zIndex: 10_000
          });
          window.addEventListener('pointermove', this.onMove);
          window.addEventListener('pointerup', this.onUp);
          window.addEventListener('pointercancel', this.onCancel);
        };

        private readonly onMove = (e: PointerEvent): void => {
          if (!this.drawing) return;
          const p = this.toWorld(e);
          const last = this.points[this.points.length - 1]!;
          if (Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
          this.points = [...this.points, p];
          this.layer?.getRenderer()?.updateShape<PathSpec>('story-pen-draft', { points: this.points });
        };

        private readonly onUp = (): void => this.end(true);
        private readonly onCancel = (): void => this.end(false);

        private end(save: boolean): void {
          if (!this.drawing) return;
          this.drawing = false;
          window.removeEventListener('pointermove', this.onMove);
          window.removeEventListener('pointerup', this.onUp);
          window.removeEventListener('pointercancel', this.onCancel);
          const renderer = this.layer?.getRenderer();
          if (renderer?.hasShape('story-pen-draft')) renderer.removeShape('story-pen-draft');
          this.releaseGesture();
          const pts = this.points;
          this.points = [];
          if (!save || pts.length < 2 || !this.layer) return;
          // A node is centre-positioned and a path's points are centre-relative.
          const xs = pts.map((p) => p.x);
          const ys = pts.map((p) => p.y);
          const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
          const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
          this.layer.store.addNode({
            id: `ink-${Date.now().toString(36)}`,
            type: 'ink',
            position: { x: cx, y: cy },
            style: { shape: { kind: 'path', points: pts.map((p) => ({ x: p.x - cx, y: p.y - cy })) } }
          });
        }
      }

      canvas.behaviours.register(new ClickInspectBehaviour({ id: 'click-inspect', targetLayerId: 'graph' }));
      canvas.behaviours.register(new NodeResizeBehaviour({ id: 'resize', targetLayerId: 'graph' }));
      canvas.behaviours.register(
        new CreateNodeBehaviour({
          id: 'create',
          targetLayerId: 'graph',
          // `sticky-<colour>` drops a sticky with that colour in its data; the
          // other kinds are node types as they are.
          createNode: (world) => {
            const kind = canvas.store.view.getState().interaction.viewModeArgs.nodeKind ?? 'sticky-yellow';
            const [type, color] = kind.startsWith('sticky-') ? ['sticky', kind.slice('sticky-'.length)] : [kind, undefined];
            return {
              id: `${type}-${Date.now().toString(36)}`,
              type,
              position: world,
              ...(color ? { data: { color } } : {}),
              style: { labelText: NEW_TEXT[type] ?? 'Item' }
            };
          },
          onNodeCreate: (node) => editElement(canvas, { kind: 'node', id: node.id })
        })
      );
      canvas.behaviours.register(
        new DrawEdgeBehaviour({
          id: 'connect',
          targetLayerId: 'graph',
          createEdge: (source, target) => (source === target ? null : { id: `link-${Date.now().toString(36)}`, type: 'link', source, target })
        })
      );
      canvas.behaviours.register(new EraseBehaviour({ id: 'erase', targetLayerId: 'graph' }));
      canvas.behaviours.register(new PenBehaviour({ id: 'pen', targetLayerId: 'graph' }));
      canvas.behaviours.register(new KeyboardShortcutsBehaviour({ id: 'keys' }));
      // Config only reaches instances registered when it is applied, so re-apply it for these.
      const b = config.behaviours!;
      canvas.update({
        behaviours: {
          'click-inspect': b['click-inspect']!,
          resize: b.resize!,
          create: b.create!,
          connect: b.connect!,
          erase: b.erase!,
          pen: b.pen!,
          keys: b.keys!
        }
      });
      // Handles on the selected containers only. A lane / frame is resized
      // through `group.userResizable`, and a `selected` overlay carrying
      // `group` would turn every selected shape into a container — so it is
      // flipped here, unrecorded, so a selection is never an undo step.
      const graph = canvas.layers.get<GraphLayer>('graph')!;
      const setContainerHandles = (ids: Iterable<string>, on: boolean): void => {
        for (const id of ids) {
          const node = graph.store.getNode(id);
          const group = node ? graph.resolveNodeStyle(node).group : undefined;
          if (!node || !group || (group.userResizable ?? false) === on) continue;
          graph.store.internal.updateNode(id, { style: { ...(node.style as NodeStyle | undefined), group: { ...group, userResizable: on } } });
        }
      };

      // A click opens the element straight in its editor, and the right panel
      // is there only while something is picked.
      const inspect = canvas.behaviours.get<ClickInspectBehaviour>('click-inspect')!;
      let editing: string | null = null;
      offs.current.push(
        inspect.events.on('inspect:change', (target) => {
          setPicked(target !== null);
          const key = target ? `${target.kind}:${target.id}` : null;
          // `editElement` re-targets the inspector, which emits again.
          if (key === editing) return;
          editing = key;
          if (target) editElement(canvas, target);
        })
      );

      canvas.store.actions.viewMode.setArgs({ nodeKind: 'sticky-yellow' });

      canvas.showMessage(HINTS.select!);
      offs.current.push(
        canvas.store.view.subscribe((s, prev) => {
          if (s.interaction.viewMode !== prev.interaction.viewMode) canvas.showMessage(HINTS[s.interaction.viewMode] ?? '');
          const now = s.interaction.selection;
          const was = prev.interaction.selection;
          if (now !== was) {
            setContainerHandles([...was].filter((id) => !now.has(id)), false);
            setContainerHandles(now, true);
          }
        })
      );
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{ title: 'Whiteboard' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        controlPanels={{ icons: { 'wb-sticky': StickyNote, 'wb-text': Type, 'wb-rect': Square, 'wb-circle': Circle, 'wb-frame': Frame } }}
        right={
          picked
            ? {
                // `ElementViewPanel` throws on a null canvas despite its `Canvas | null`
                // prop (a defect this story found), so wait for the engine.
                content: (ctx) =>
                  ctx.canvas ? <ElementViewPanel canvas={ctx.canvas} editable nodeTitle="Item" edgeTitle="Connector" className="h-full" /> : null,
                defaultSize: 24,
                collapsible: true
              }
            : undefined
        }
      />
    );
  }
};
