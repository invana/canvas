/**
 * **canvas-store Playground** — a headless test harness for `@invana/canvas-store`.
 * No drawing: the left column fires `store.actions.*`; the right column prints the
 * live `view` state, the `data` (layer 'graph'), and the event stream
 * (`state:change` / `data:flush` / `data:intent`). Purely to exercise the kernel.
 */

import { useEffect, useReducer, useRef, useState, type ReactNode } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from '@invana/ui';
import {
  createCanvasStore,
  createHistory,
  type CanvasEvent,
  type CanvasStore,
  type History,
  type LayerFlush,
} from '@invana/canvas-store';

const meta: Meta = { title: 'canvas-store/Playground' };
export default meta;
type Story = StoryObj;

// ── helpers (kept simple) ─────────────────────────────────────────────────────
const rand = (): number => Math.round(Math.random() * 400);
const pick = <T,>(arr: readonly T[]): T | undefined => arr[Math.floor(Math.random() * arr.length)];

// ── collapsible JSON tree (expand/collapse nested objects & arrays) ───────────
function Primitive({ value }: { value: unknown }): ReactNode {
  if (value === null) return <span className="text-muted-foreground">null</span>;
  if (typeof value === 'string') return <span className="text-emerald-600 dark:text-emerald-400">&quot;{value}&quot;</span>;
  if (typeof value === 'number') return <span className="text-amber-600 dark:text-amber-400">{value}</span>;
  if (typeof value === 'boolean') return <span className="text-violet-600 dark:text-violet-400">{String(value)}</span>;
  return <span>{String(value)}</span>;
}

function JsonNode({ k, value, depth }: { k?: string; value: unknown; depth: number }): ReactNode {
  const resolved = value instanceof Set ? [...value] : value;
  const isObject = resolved !== null && typeof resolved === 'object';
  const [open, setOpen] = useState(depth < 2); // top two levels expanded by default
  const label = k !== undefined ? (
    <>
      <span className="text-sky-700 dark:text-sky-300">{k}</span>
      <span className="text-muted-foreground">:&nbsp;</span>
    </>
  ) : null;

  if (!isObject) {
    return (
      <div className="flex" style={{ paddingLeft: depth * 12 + 12 }}>
        {label}
        <Primitive value={resolved} />
      </div>
    );
  }

  const isArray = Array.isArray(resolved);
  const entries: Array<[string, unknown]> = isArray
    ? (resolved as unknown[]).map((item, i) => [String(i), item])
    : Object.entries(resolved as Record<string, unknown>);
  const summary = isArray ? `Array(${entries.length})` : `{ ${entries.length} }`;

  return (
    <div>
      <div
        className="flex cursor-pointer select-none items-center rounded hover:bg-muted/50"
        style={{ paddingLeft: depth * 12 }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="inline-block w-3 text-muted-foreground">{open ? '▾' : '▸'}</span>
        {label}
        <span className="text-muted-foreground">{open ? (isArray ? '[' : '{') : summary}</span>
      </div>
      {open ? (
        <>
          {entries.map(([ck, cv]) => (
            <JsonNode key={ck} k={ck} value={cv} depth={depth + 1} />
          ))}
          <div className="text-muted-foreground" style={{ paddingLeft: depth * 12 + 12 }}>{isArray ? ']' : '}'}</div>
        </>
      ) : null}
    </div>
  );
}

function JsonTree({ value }: { value: unknown }): ReactNode {
  return (
    <div className="font-mono text-[11px] leading-relaxed">
      <JsonNode value={value} depth={0} />
    </div>
  );
}

/** Concise tail summary of a bus event (works for coarse + granular taxonomy types). */
function eventSummary(e: CanvasEvent): string {
  const p = e.payload as Record<string, unknown> | undefined;
  if (!p) return '';
  if (p.delta && typeof p.delta === 'object') {
    // data:flush — per-frame delta
    const d = p.delta as LayerFlush;
    const n = d.nodes;
    return `${String(p.layerId ?? '')}  n+${n.added.length}/c${n.changed.length}/m${n.moved.length}/r${n.removed.length} · e+${d.edges.added.length} g+${d.groups.added.length} a+${d.annotations.added.length}`;
  }
  if (Array.isArray(p.ids)) {
    // data:<subject>:<action> — granular data event
    return `${String(p.layerId ?? '')} [${(p.ids as string[]).join(', ')}]`;
  }
  if (Array.isArray(p.changedPaths)) {
    // state:change / view:<subject>:<action> — view mutation
    return `[${(p.changedPaths as string[]).join(', ')}]`;
  }
  // fallback — compact payload (scene / input / layout / canvas events)
  return Object.entries(p)
    .map(([k, val]) => `${k}=${typeof val === 'object' && val !== null ? JSON.stringify(val) : String(val)}`)
    .join(' · ');
}

/** Colour an event by its taxonomy domain (`<domain>:…`). */
function eventColor(type: string): string {
  switch (type.split(':')[0]) {
    case 'data':
      return 'text-amber-600 dark:text-amber-400';
    case 'view':
    case 'state':
      return 'text-sky-600 dark:text-sky-400';
    case 'input':
      return 'text-violet-600 dark:text-violet-400';
    case 'scene':
      return 'text-teal-600 dark:text-teal-400';
    case 'layout':
      return 'text-pink-600 dark:text-pink-400';
    default:
      return 'text-muted-foreground';
  }
}

/** One event row — click to expand its full envelope (source · timestamp · payload). */
function EventRow({ e }: { e: CanvasEvent }): ReactNode {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/40">
      <div
        className="flex cursor-pointer select-none items-center gap-2 py-0.5 hover:bg-muted/40"
        onClick={() => setOpen((o) => !o)}
      >
        <span className="inline-block w-3 text-muted-foreground">{open ? '▾' : '▸'}</span>
        <span className={`shrink-0 font-semibold ${eventColor(e.type)}`}>{e.type}</span>
        <span className="truncate text-muted-foreground">{eventSummary(e)}</span>
      </div>
      {open ? (
        <div className="pb-1 pl-5">
          <JsonTree value={{ source: e.source, timestamp: e.timestamp, payload: e.payload }} />
        </div>
      ) : null}
    </div>
  );
}

// ── small UI atoms (design-kit) ───────────────────────────────────────────────
function Section({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="grid grid-cols-2 gap-1">{children}</div>
    </div>
  );
}
function Btn({ onClick, children }: { onClick: () => void; children: ReactNode }): ReactNode {
  return (
    <Button variant="outline" size="sm" className="h-7 justify-start px-2 text-xs font-normal" onClick={onClick}>
      {children}
    </Button>
  );
}

// ── the playground ────────────────────────────────────────────────────────────
function Playground(): ReactNode {
  const ref = useRef<{ store: CanvasStore; history: History; seq: number } | null>(null);
  if (!ref.current) {
    const store = createCanvasStore();
    // seed a tiny graph so edges / groups work immediately (they connect existing nodes)
    store.layer('graph').setData({ nodes: [{ id: 'n0' }, { id: 'n1' }, { id: 'n2' }] });
    store.layer('graph').flush();
    ref.current = { store, history: createHistory(store.view), seq: 3 };
  }
  const { store, history } = ref.current;
  const a = store.actions;
  const graph = store.layer('graph');

  const [, rerender] = useReducer((x: number) => x + 1, 0);
  const [log, setLog] = useState<CanvasEvent[]>([]);

  // ONE subscription — every kernel update lands here (view + data + intent).
  useEffect(() => {
    return store.events.tap((e) => {
      rerender();
      setLog((l) => [e, ...l].slice(0, 60));
    });
  }, [store]);

  const nextId = (): string => `n${ref.current!.seq++}`;
  const ids = (): string[] => graph.nodes().map((n) => n.id);

  const view = store.view.getState();
  const radius =
    ((view.definition.layers['graph']?.style as { node?: { radius?: number } } | undefined)?.node?.radius) ?? 6;

  return (
    <div className="flex h-screen bg-background font-sans text-sm text-foreground">
      {/* LEFT — action buttons */}
      <div className="w-72 shrink-0 space-y-3 overflow-auto border-r border-border p-3">
        <Section title="data — nodes / edges / groups / notes">
          <Btn onClick={() => { const id = nextId(); a.node.add('graph', { id, x: rand(), y: rand(), label: id }); }}>add node</Btn>
          <Btn onClick={() => { const [s, t] = [pick(ids()), pick(ids())]; if (s && t) a.edge.add('graph', { id: `e${ref.current!.seq++}`, source: s, target: t }); }}>add edge</Btn>
          <Btn onClick={() => { const m = ids().slice(0, 3); if (m.length) a.group.add('graph', { id: `g${ref.current!.seq++}`, memberIds: m }); }}>add group</Btn>
          <Btn onClick={() => a.annotation.add('graph', { id: `note${ref.current!.seq++}`, kind: 'text', text: 'hello' })}>add note</Btn>
          <Btn onClick={() => { const id = pick(ids()); if (id) a.node.moveTo('graph', id, rand(), rand()); }}>move node</Btn>
          <Btn onClick={() => { const id = pick(ids()); if (id) a.node.remove('graph', id); }}>remove node</Btn>
        </Section>

        <Section title="layout (data positions)">
          <Btn onClick={() => a.positions.apply('graph', graph.nodes().map((n) => ({ id: n.id, x: rand(), y: rand() })))}>run layout</Btn>
          <Btn onClick={() => a.layouts.set('force', { charge: -160 })}>set force</Btn>
          <Btn onClick={() => a.layouts.tune('force', { charge: -300 })}>tune charge</Btn>
          <Btn onClick={() => a.layouts.run('force')}>run force</Btn>
        </Section>

        <Section title="view — layers">
          <Btn onClick={() => a.layers.setStyle('graph', { node: { radius: radius + 2 } })}>node radius +2</Btn>
          <Btn onClick={() => a.layers.setVisible('graph', !(view.definition.layers['graph']?.visible ?? true))}>toggle visible</Btn>
        </Section>

        <Section title="view — behaviours">
          <Btn onClick={() => a.behaviours.add('hover', { degree: 1 })}>add hover</Btn>
          <Btn onClick={() => a.behaviours.enable('hover')}>enable hover</Btn>
          <Btn onClick={() => a.behaviours.disable('hover')}>disable hover</Btn>
          <Btn onClick={() => a.behaviours.update('hover', { degree: 2 })}>degree = 2</Btn>
        </Section>

        <Section title="camera">
          <Btn onClick={() => a.camera.zoom(1.2)}>zoom in</Btn>
          <Btn onClick={() => a.camera.zoom(0.8)}>zoom out</Btn>
          <Btn onClick={() => a.camera.pan(20, 0)}>pan →</Btn>
          <Btn onClick={() => a.camera.reset()}>reset</Btn>
        </Section>

        <Section title="selection / hover">
          <Btn onClick={() => { const id = pick(ids()); if (id) a.selection.set([id]); }}>select node</Btn>
          <Btn onClick={() => { const id = pick(ids()); if (id) a.selection.toggle(id); }}>toggle</Btn>
          <Btn onClick={() => a.selection.clear()}>clear</Btn>
          <Btn onClick={() => { const id = pick(ids()); if (id) a.hover.set(id); }}>hover node</Btn>
        </Section>

        <Section title="templates / history">
          <Btn onClick={() => a.templates.create({ id: `t${ref.current!.seq++}`, label: 'Card' })}>new template</Btn>
          <Btn onClick={() => a.theme.set({ mode: view.definition.theme['mode'] === 'dark' ? 'light' : 'dark' })}>toggle theme</Btn>
          <Btn onClick={() => history.undo()}>undo</Btn>
          <Btn onClick={() => history.redo()}>redo</Btn>
        </Section>

        <Section title="engine reports (scene / input / layout)">
          <Btn onClick={() => store.events.emit('scene:layer:add', { id: 'graph' })}>scene:layer:add</Btn>
          <Btn onClick={() => store.events.emit('scene:behaviour:enable', { id: 'hover' })}>scene:behaviour:enable</Btn>
          <Btn onClick={() => { const id = pick(ids()); if (id) store.events.emit('input:node:click', { layerId: 'graph', id, x: rand(), y: rand() }); }}>input:node:click</Btn>
          <Btn onClick={() => { const id = pick(ids()); store.events.emit('input:node:hover', { layerId: 'graph', id: id ?? null }); }}>input:node:hover</Btn>
          <Btn onClick={() => store.events.emit('input:background:contextmenu', { x: rand(), y: rand() })}>input:bg:contextmenu</Btn>
          <Btn onClick={() => store.events.emit('layout:run:start', { id: 'force', layerId: 'graph' })}>layout:run:start</Btn>
          <Btn onClick={() => store.events.emit('layout:run:end', { id: 'force', layerId: 'graph' })}>layout:run:end</Btn>
          <Btn onClick={() => store.events.emit('canvas:renderer:ready', { backend: 'webgpu' })}>canvas:renderer:ready</Btn>
        </Section>
      </div>

      {/* MIDDLE — view (top row) over data (bottom row), each with a heading */}
      <div className="flex min-h-0 min-w-0 flex-col" style={{ flex: '1 1 0' }}>
        <div className="flex min-h-0 flex-1 flex-col border-b border-border">
          <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            view (reactive)
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <JsonTree value={view} />
          </div>
        </div>
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 border-b border-border bg-muted/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            data · layer &quot;graph&quot;
          </div>
          <div className="min-h-0 flex-1 overflow-auto p-3">
            <JsonTree
              value={{
                counts: graph.counts,
                nodes: graph.nodes(),
                edges: graph.edges(),
                groups: graph.groups(),
                annotations: graph.annotations(),
              }}
            />
          </div>
        </div>
      </div>

      {/* RIGHT — events column (flex ratio → relative to the middle's width; tweak the first number) */}
      <div className="flex min-h-0 min-w-0 flex-col border-l border-border" style={{ flex: '1.5 1 0' }}>
        <div className="flex shrink-0 items-center border-b border-border bg-muted/30 px-3 py-1">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">events ({log.length})</span>
          {log.length > 0 ? (
            <Button variant="ghost" size="sm" className="ml-auto h-6 px-2 text-xs text-muted-foreground" onClick={() => setLog([])}>
              clear
            </Button>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 overflow-auto p-2 font-mono text-[11px]">
          {log.length === 0 ? <div className="text-muted-foreground">click an action to see events…</div> : null}
          {log.map((e, i) => (
            <EventRow key={`${e.timestamp}-${i}`} e={e} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Playground_: Story = { name: 'Playground', render: () => <Playground /> };
