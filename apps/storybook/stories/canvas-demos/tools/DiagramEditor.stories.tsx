import { useCallback, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Database, Diamond, Frame, RectangleHorizontal, Square, Type } from 'lucide-react';
import { KeyboardShortcutsBehaviour, type CanvasConfig } from '@invana/canvas';
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
  title: 'canvas-demos/tools/DiagramEditor',
  parameters: { layout: 'fullscreen' }
};
export default meta;
type Story = StoryObj;

/**
 * **A draw.io-style diagram editor, built only from what ships today.** A
 * flowchart in two swimlanes: pick a shape, click to place it, drag node → node
 * to connect, resize, relabel in the right panel, undo, export. Nothing in a
 * package was changed for this story. Where the engine has no answer, the gap
 * is listed below rather than patched over in the story.
 *
 * The story is `data` + `config` + `onReady`, like every `canvas-demos/` story:
 *
 * - **Shapes are node types.** `tool.nodeKind` *is* the shape palette: its value
 *   becomes the new node's `type`, and `nodeTypes` maps each type to a
 *   structure (silhouette) and a styling (themed roles). So the palette, the
 *   look and a saved diagram are all JSON.
 * - **Tools are interaction modes.** Each drawing behaviour carries `modes`, so
 *   `tool.active` (the header toggles, the keys, Esc) turns exactly one on.
 * - **All chrome is saved control panels** (`config.controlPanels`): the tool
 *   row and file actions in the header, zoom + minimap over the canvas.
 *
 * | Do | Tool / key |
 * |---|---|
 * | click a shape or lane: its handles appear and the right panel opens on its editor | Select · `V` |
 * | move (also while Add is in hand) · select many with box or lasso | Select · `V` |
 * | pan anywhere, on a shape too | Hand · `H`, or hold Space |
 * | place the picked shape on empty canvas | Add · `A` (then the shape picker) |
 * | drag from one shape to another for an arrow | Connect · `C` |
 * | click a shape or an arrow to delete it | Erase · `E` |
 * | edit label + properties | click it: the panel opens on the form. *Apply* saves (one undo step) |
 * | undo / redo · cut / copy / paste · delete | `⌘Z` / `⇧⌘Z` · `⌘X` / `⌘C` / `⌘V` · `⌫` |
 * | orthogonal / curved / straight arrows (whole diagram) | the *Edges* picker |
 * | PNG / SVG / JSON | the header's export buttons |
 *
 * ### ⚠️ Gaps found: the engine has no answer for these yet
 *
 * | # | draw.io has | What happens here |
 * |---|---|---|
 * | G1 | drag a shape from a palette onto the canvas | arm Add, pick a shape, click. There is no drag-and-drop source |
 * | G2 | double-click a shape to type its text | text is edited in the right panel's form. There is no in-place text editor |
 * | G3 | snap to grid · smart alignment guides | the grid is drawn only. Drags and resizes land on any coordinate |
 * | G4 | align / distribute a selection | no command. Arrange by hand |
 * | G5 | bring to front / send to back | no z-order command on a node |
 * | G6 | rotate handle | specs carry `rotation`, but no gesture writes it |
 * | G7 | connection ports · draggable waypoints | arrows attach to a shape's outline and the router picks the bends. They can't be pinned to a side or re-routed by hand |
 * | G10 | an arrow with a loose end | Connect needs a shape at both ends |
 * | G11 | drop a shape *into* a swimlane | a click inside a lane hits the lane, so Add places nothing there. Shapes dragged out of a lane keep its `parentId`. Containment is fixed by the data |
 * | G13 | per-arrow routing / style | *Edges* switches routing for the whole layer. The panel edits an arrow's text and properties, not its style |
 * | G14 | per-shape fill / stroke picker | colour comes from the theme roles of the shape's type. The panel has no style editor |
 * | G17 | resize any shape | handles show on the selected shape only (a `selected` overlay makes it `resizable`), but `NodeResizeBehaviour` only resizes rects and circles — the decision diamond and the data parallelogram get no handles |
 * | G21 | a container resizable only while selected | `group.userResizable` can't go in a `selected` overlay (it would make every selected shape a container), so `onReady` flips it on the selected lane in code |
 * | G22 | Shift-click to add to the selection | click-select either replaces or toggles; it has no "plain replaces, Shift adds". Box / lasso select many |
 * | G23 | undo steps over edits only | every click records a `view:selection:set` history entry, so ⌘Z first walks back through selections before it reaches the last edit |
 * | G19 | — | the gesture check warns that `create` / `erase` / `click-inspect` all claim `pointer+click`, though their `modes` never overlap. It ignores modes |
 * | G20 | one anchor for every shape | a rect's `position` is its top-left corner, a circle / diamond / polygon's its centre. A row of mixed shapes needs two y's |
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
 * The flowchart: order fulfilment across two lanes. Positions are authored.
 * ⚠️ A rect's position is its **top-left** corner, while a diamond's or a
 * polygon's is its **centre** (finding G20) — so a row of mixed shapes is
 * authored at two different y's to line up.
 */
const data: GraphData = {
  nodes: [
    { id: 'lane-sales', type: 'lane', position: { x: 0, y: 10 }, style: { labelText: 'Sales' } },
    { id: 'lane-warehouse', type: 'lane', position: { x: 0, y: 210 }, style: { labelText: 'Warehouse' } },

    { id: 'start', type: 'terminator', parentId: 'lane-sales', position: { x: 30, y: 88 }, style: { labelText: 'Order placed' } },
    { id: 'receive', type: 'process', parentId: 'lane-sales', position: { x: 190, y: 82 }, style: { labelText: 'Confirm order' } },
    { id: 'in-stock', type: 'decision', parentId: 'lane-sales', position: { x: 420, y: 110 }, style: { labelText: 'In stock?' } },
    { id: 'notify', type: 'process', parentId: 'lane-sales', position: { x: 560, y: 82 }, style: { labelText: 'Notify backorder' } },
    { id: 'end-sales', type: 'terminator', parentId: 'lane-sales', position: { x: 740, y: 88 }, style: { labelText: 'Done' } },

    { id: 'pick', type: 'process', parentId: 'lane-warehouse', position: { x: 360, y: 282 }, style: { labelText: 'Pick & pack' } },
    { id: 'label', type: 'data', parentId: 'lane-warehouse', position: { x: 620, y: 310 }, style: { labelText: 'Shipping label' } },
    { id: 'end-warehouse', type: 'terminator', parentId: 'lane-warehouse', position: { x: 740, y: 288 }, style: { labelText: 'Shipped' } },

    { id: 'note', type: 'text', position: { x: 320, y: 436 }, style: { labelText: 'Click below the lanes with Add to place a shape' } }
  ],
  edges: [
    { id: 'e1', type: 'flow', source: 'start', target: 'receive' },
    { id: 'e2', type: 'flow', source: 'receive', target: 'in-stock' },
    { id: 'e3', type: 'flow', source: 'in-stock', target: 'notify', style: { labelText: 'no' } },
    { id: 'e4', type: 'flow', source: 'notify', target: 'end-sales' },
    { id: 'e5', type: 'flow', source: 'in-stock', target: 'pick', style: { labelText: 'yes' } },
    { id: 'e6', type: 'flow', source: 'pick', target: 'label' },
    { id: 'e7', type: 'flow', source: 'label', target: 'end-warehouse' }
  ]
};

/** The shape palette — `tool.nodeKind` value → picker label. Also the node `type`s. */
const SHAPES: Record<string, string> = {
  process: 'Process',
  decision: 'Decision',
  terminator: 'Start / end',
  data: 'Data',
  text: 'Text',
  lane: 'Swimlane'
};

/** What the footer says while each tool is in hand. */
const HINTS: Record<string, string> = {
  select: 'Click a shape to edit it and show its handles · drag to move · box or lasso to select many',
  hand: 'Drag to pan',
  add: 'Pick a shape in the header, then click empty canvas to place it · drag a shape to nudge it · Esc to stop',
  connect: 'Drag from one shape to another to draw an arrow · Esc to stop',
  delete: 'Click a shape (and its arrows) or an arrow to delete it · Esc to stop'
};

/** The whole canvas config, deep-merged by `GraphCanvasApp` over its bundle defaults. */
const config = {
  fitOnLoad: true,
  // Positions are authored: no layout may move a shape.
  activeLayout: '',
  layers: {
    background: { type: 'pattern', patternType: 'grid', alpha: 0.6 },
    graph: {
      nodeStructureTemplates: {
        process: { name: 'process', kind: 'simple', shape: { kind: 'rect', width: 120, height: 56, cornerRadius: 6 }, slots: { label: true } },
        decision: { name: 'decision', kind: 'simple', shape: { kind: 'regular-polygon', sides: 4, radius: 46 }, slots: { label: true } },
        terminator: { name: 'terminator', kind: 'simple', shape: { kind: 'rect', width: 120, height: 44, cornerRadius: 22 }, slots: { label: true } },
        data: {
          name: 'data',
          kind: 'simple',
          shape: { kind: 'polygon', vertices: [{ x: -50, y: -26 }, { x: 70, y: -26 }, { x: 50, y: 26 }, { x: -70, y: 26 }] },
          slots: { label: true }
        },
        text: { name: 'text', kind: 'simple', shape: { kind: 'rect', width: 260, height: 28 }, slots: { label: true } },
        // A type binding without a structure drops its whole styling (`group`
        // included), so the lane names one even though the frame sizes itself.
        lane: { name: 'lane', kind: 'simple', shape: { kind: 'rect', width: 900, height: 180 }, slots: { label: true } }
      },
      nodeStylingTemplates: {
        shape: { name: 'shape', fillRole: 'cardBg', strokeRole: 'stroke', strokeWidth: 1.5, label: { placement: 'center', fontSize: 13, colorRole: 'foreground' } },
        decision: { name: 'decision', fillRole: 'cardBg', strokeRole: 'accent', strokeWidth: 2, label: { placement: 'center', fontSize: 12, colorRole: 'foreground' } },
        text: { name: 'text', fillRole: 'surface', fillAlpha: 0, strokeAlpha: 0, label: { placement: 'center', fontSize: 13, colorRole: 'muted' } },
        lane: {
          name: 'lane',
          label: { placement: 'inside-top-left', fontSize: 12, fontWeight: 600, colorRole: 'heading' },
          group: { autoFit: false, width: 900, height: 180, userResizable: false, behindChildren: true, headerHeight: 28, showToggle: false }
        }
      },
      nodeTypes: {
        process: { structure: 'process', styling: 'shape', bindings: {} },
        decision: { structure: 'decision', styling: 'decision', bindings: {} },
        terminator: { structure: 'terminator', styling: 'shape', bindings: {} },
        data: { structure: 'data', styling: 'shape', bindings: {} },
        text: { structure: 'text', styling: 'text', bindings: {} },
        lane: { structure: 'lane', styling: 'lane', bindings: {} }
      },
      node: {
        style: { labelOffsetY: 0 },
        // Only the selected shape is resizable, so only it shows handles. A
        // consumer `state.selected` replaces the default one, so the frame is
        // the selection mark. (A lane / frame's switch is `group.userResizable`,
        // flipped per selected container in `onReady`.)
        state: { selected: { resizable: true } }
      },
      edge: {
        style: {
          shape: { pathType: 'orth' },
          strokeWidth: 1.5,
          arrowTargetShape: 'triangle',
          arrowTargetSize: 8,
          labelFontSize: 11,
          labelBackgroundFill: 0xffffff,
          labelBackgroundAlpha: 0.85,
          labelBackgroundPadding: 3,
          labelAutoRotate: false
        }
      }
    }
  },
  behaviours: {
    // Shapes are coloured by their type's styling; nothing may recolour them.
    color: { enabled: false },
    hover: { enabled: false },
    // The Select tool's gestures.
    // Drag in Select and Add, so a shape just placed can be nudged; Connect /
    // Erase / Pen start on the same press, so drag is off there.
    'drag-node': { enabled: true, modes: ['select', 'add'] },
    // An open frame is scenery by default; here a lane is content you click to
    // select, rename and resize. A click replaces the selection (box / lasso
    // select many); there is no Shift-click-to-add (G22).
    'click-select': { enabled: true, multiple: false, excludeGroups: 'never', modes: ['select'] },
    'brush-select': { modes: ['select'] },
    'lasso-select': { modes: ['select'] },
    'click-inspect': { enabled: true, modes: ['select'] },
    resize: { enabled: true, modes: ['select'] },
    // One behaviour per drawing tool.
    create: { enabled: true, modes: ['add'] },
    connect: { enabled: true, modes: ['connect'] },
    erase: { enabled: true, modes: ['delete'] },
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
        { keys: 'a', command: 'tool.active', args: { value: 'add' } },
        { keys: 'c', command: 'tool.active', args: { value: 'connect' } },
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
        { type: 'toggle', key: 'add', command: 'tool.active', args: { value: 'add' }, icon: 'node-add', label: 'Add shape (A)' },
        {
          type: 'choice',
          key: 'shape',
          command: 'tool.nodeKind',
          label: 'Shape',
          display: 'segmented',
          options: [
            { value: 'process', label: 'Process', icon: 'fc-process' },
            { value: 'decision', label: 'Decision', icon: 'fc-decision' },
            { value: 'terminator', label: 'Start / end', icon: 'fc-terminator' },
            { value: 'data', label: 'Data', icon: 'fc-data' },
            { value: 'text', label: 'Text', icon: 'fc-text' },
            { value: 'lane', label: 'Swimlane', icon: 'fc-lane' }
          ]
        },
        { type: 'toggle', key: 'connect', command: 'tool.active', args: { value: 'connect' }, icon: 'connect', label: 'Connect (C)' },
        { type: 'toggle', key: 'erase', command: 'tool.active', args: { value: 'delete' }, icon: 'eraser', label: 'Erase (E)' },
        { type: 'divider' },
        { type: 'choice', key: 'edges', command: 'graph.edgeType', label: 'Edges', args: { types: ['orth', 'rounded', 'bezier', 'straight'] } },
        { type: 'divider' },
        { type: 'command', key: 'undo', command: 'history.undo', icon: 'undo', label: 'Undo' },
        { type: 'command', key: 'redo', command: 'history.redo', icon: 'redo', label: 'Redo' },
        { type: 'command', key: 'copy', command: 'clipboard.copy', icon: 'copy', label: 'Copy' },
        { type: 'command', key: 'paste', command: 'clipboard.paste', icon: 'clipboard-paste', label: 'Paste' },
        { type: 'command', key: 'delete', command: 'clipboard.delete', icon: 'trash', label: 'Delete selection' }
      ]
    },
    file: {
      kind: 'control-panel',
      placement: 'header-right',
      items: [
        { type: 'toggle', key: 'grid', command: 'background.grid', icon: 'grid', label: 'Toggle grid' },
        { type: 'widget', key: 'export-image', widget: 'export-image', options: { filename: 'diagram', formats: ['png', 'svg'] } },
        { type: 'widget', key: 'export-state', widget: 'export-state', options: { filename: 'diagram' } },
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
        { type: 'widget', key: 'minimap', widget: 'minimap-toggle', options: { defaultOn: true } }
      ]
    }
  }
} as unknown as CanvasConfig;

export const DiagramEditorStory: Story = {
  name: 'DiagramEditor',
  render: function DiagramEditorRender() {
    const offs = useRef<Array<() => void>>([]);
    const [picked, setPicked] = useState(false);

    // The bundle has no drawing tools, no click-inspect and no key bindings, so
    // register them by id; every setting they read comes from `config`.
    const onReady = useCallback((canvas: GraphCanvas | null) => {
      for (const off of offs.current.splice(0)) off();
      if (!canvas) return;

      canvas.behaviours.register(new ClickInspectBehaviour({ id: 'click-inspect', targetLayerId: 'graph' }));
      canvas.behaviours.register(new NodeResizeBehaviour({ id: 'resize', targetLayerId: 'graph' }));
      canvas.behaviours.register(
        new CreateNodeBehaviour({
          id: 'create',
          targetLayerId: 'graph',
          // The picked shape is the new node's type; its look comes from `nodeTypes`.
          createNode: (world) => {
            const type = canvas.store.view.getState().interaction.viewModeArgs.nodeKind ?? 'process';
            return { id: `${type}-${Date.now().toString(36)}`, type, position: world, style: { labelText: SHAPES[type] ?? 'Shape' } };
          },
          onNodeCreate: (node) => editElement(canvas, { kind: 'node', id: node.id })
        })
      );
      canvas.behaviours.register(
        new DrawEdgeBehaviour({
          id: 'connect',
          targetLayerId: 'graph',
          createEdge: (source, target) => (source === target ? null : { id: `flow-${Date.now().toString(36)}`, type: 'flow', source, target })
        })
      );
      canvas.behaviours.register(new EraseBehaviour({ id: 'erase', targetLayerId: 'graph' }));
      canvas.behaviours.register(new KeyboardShortcutsBehaviour({ id: 'keys' }));
      // Config only reaches instances registered when it is applied, so re-apply it for these.
      const b = config.behaviours!;
      canvas.update({
        behaviours: { 'click-inspect': b['click-inspect']!, resize: b.resize!, create: b.create!, connect: b.connect!, erase: b.erase!, keys: b.keys! }
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

      canvas.store.actions.viewMode.setArgs({ nodeKind: 'process' });

      // The footer tells you what the tool in hand does.
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
        header={{ title: 'Diagram' }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        controlPanels={{
          icons: {
            'fc-process': Square,
            'fc-decision': Diamond,
            'fc-terminator': RectangleHorizontal,
            'fc-data': Database,
            'fc-text': Type,
            'fc-lane': Frame
          }
        }}
        right={
          picked
            ? {
                // `ElementViewPanel` throws on a null canvas despite its `Canvas | null`
                // prop (a defect this story found), so wait for the engine.
                content: (ctx) =>
                  ctx.canvas ? <ElementViewPanel canvas={ctx.canvas} editable nodeTitle="Shape" edgeTitle="Arrow" className="h-full" /> : null,
                defaultSize: 24,
                collapsible: true
              }
            : undefined
        }
      />
    );
  }
};

