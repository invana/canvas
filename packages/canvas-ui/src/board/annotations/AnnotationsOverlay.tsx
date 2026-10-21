/**
 * `AnnotationsOverlay` — the board's annotations, drawn over the graph.
 *
 * A DOM layer over the canvas host, in screen space. Every frame the camera
 * moves or a layout moves the nodes, it re-projects each annotated record with
 * `camera.toScreen` and lays the cards out again ({@link placeCards}):
 *
 * | Kind | Drawn as |
 * |---|---|
 * | note · value | the kit's `AnnotationCard` beside its record, a dashed leader to it |
 * | highlight | a ring on each node, the relationships among them marked |
 * | group | a labelled frame around its nodes; dashed with *3 of 7* when only some are loaded |
 * | badges | a count on each annotated record, when the board shows annotations as badges |
 *
 * In Annotate it also takes the pointer for the mode's tools — *Annotate* on a
 * node or relationship, *Highlight* by click or drag, *Group* by a drag around
 * two or more nodes — and draws the format bar over the selected annotation.
 * Outside Annotate nothing here takes the pointer but a badge.
 */

import { useBoardMode, useCommandStates, useGraphCanvas } from '@invana/canvas-react';
import { Input, Textarea } from '@invana/forms';
import type { GraphLayer } from '@invana/graph';
import { AnnotationCard, type AnnotationColor, Button, cn } from '@invana/ui';
import { Trash2 } from 'lucide-react';
import { type KeyboardEvent, type PointerEvent, type ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react';

import { BOARD_PANEL_COMMAND } from '../BoardPanels';
import { BOARD_DOCK, BOARD_EDGE, BOARD_IDS } from '../presets';
import { DRAFT_ID, labelOf, recordsOf, useAnnotations } from './AnnotationsProvider';
import { type CardBox, estimateCardHeight, placeCards, type Point, type Rect } from './layout';
import { ANNOTATION_TOKEN, type BoardAnnotation } from './types';

const CARD_W = 196;
const BAR_H = 34;
const COLORS: AnnotationColor[] = ['amber', 'blue', 'green', 'red', 'grey'];
const COLOR_NAME: Record<AnnotationColor, string> = { amber: 'Amber', blue: 'Blue', green: 'Green', red: 'Red', grey: 'Grey' };
const BG: Record<AnnotationColor, string> = {
  amber: 'bg-warning',
  blue: 'bg-primary',
  green: 'bg-success',
  red: 'bg-destructive',
  grey: 'bg-muted-foreground',
};

export interface AnnotationsOverlayProps {
  /** The rail panel's width — its space is kept clear of cards while it is open. */
  panelWidth?: number;
}

interface Projected {
  x: number;
  y: number;
  r: number;
}

export function AnnotationsOverlay({ panelWidth = 320 }: AnnotationsOverlayProps) {
  const canvas = useGraphCanvas();
  const ctx = useAnnotations();
  const mode = useBoardMode(canvas) ?? 'explore';
  const { states } = useCommandStates([{ command: 'tool.active' }, { command: BOARD_PANEL_COMMAND }], canvas);
  const tool = states[0]?.value ?? 'select';
  const panelOpen = !!states[1]?.value;
  const host = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [, setFrame] = useState(0);
  const [drag, setDrag] = useState<{ x0: number; y0: number; x1: number; y1: number } | null>(null);

  // Follow the camera and the layout, a frame at a time.
  useEffect(() => {
    let raf: number | null = null;
    const tick = () => {
      if (raf === null) raf = requestAnimationFrame(() => {
        raf = null;
        setFrame((f) => f + 1);
      });
    };
    const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
    const offs = [
      canvas.events.on('input:camera:pan', tick),
      canvas.events.on('input:camera:zoom', tick),
      canvas.store.view.subscribe(tick),
      ...(layer
        ? [
            layer.events.on('positions:updated', tick),
            layer.events.on('data:changed', tick),
            layer.store.events.on('node:visibility', tick),
            layer.store.events.on('edge:visibility', tick),
          ]
        : []),
    ];
    return () => {
      if (raf !== null) cancelAnimationFrame(raf);
      for (const off of offs) off?.();
    };
  }, [canvas]);
  useLayoutEffect(() => {
    const el = host.current?.parentElement;
    if (!el) return;
    const read = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layer = canvas.layers.get<GraphLayer>(BOARD_IDS.graph);
  const cam = canvas.camera;
  const drawing = mode !== 'focus';
  const annotating = mode === 'annotate';
  const density = annotating ? 'full' : ctx.view.density;

  // ── where each record is on screen ─────────────────────────────────────────
  const node = (id: string): Projected | null => {
    const n = layer?.store.getNode(id);
    if (!n || n.hidden || layer!.hiddenTypes.node.includes(n.type)) return null;
    const p = layer!.store.getPosition(id);
    if (!p) return null;
    const s = cam.toScreen(p.x, p.y);
    return { x: s.x, y: s.y, r: ((n.boundingBox?.width ?? 16) / 2) * cam.scale };
  };
  const edge = (id: string): Projected | null => {
    const e = layer?.store.getEdge(id);
    if (!e || e.hidden || layer!.hiddenTypes.edge.includes(e.type)) return null;
    const a = node(e.source);
    const b = node(e.target);
    return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, r: 3 } : null;
  };
  const at = (r: { id: string; kind: 'node' | 'edge' }) => (r.kind === 'node' ? node(r.id) : edge(r.id));

  const all: BoardAnnotation[] = ctx.draft ? [...ctx.annotations, ctx.draft] : [...ctx.annotations];
  const shown = drawing ? all.filter((a) => a.id === DRAFT_ID || (ctx.onBoard(a) && !ctx.hidden(a))) : [];

  // ── what to draw ───────────────────────────────────────────────────────────
  const frames: { a: BoardAnnotation; rect: Rect; partial: string | null }[] = [];
  const rings: { a: BoardAnnotation; pts: Projected[]; lines: [Projected, Projected][] }[] = [];
  const cards: { a: BoardAnnotation; anchor: Projected }[] = [];
  const badges = new Map<string, { at: Projected; n: number; label: string }>();
  for (const a of shown) {
    if (a.kind === 'group' || a.kind === 'highlight') {
      const pts = a.records.map((r) => [r.id, node(r.id)] as const).filter((x): x is readonly [string, Projected] => x[1] !== null);
      if (!pts.length) continue;
      if (a.kind === 'group') {
        const pad = 26;
        const xs = pts.map(([, p]) => p.x);
        const ys = pts.map(([, p]) => p.y);
        const rect = { x: Math.min(...xs) - pad, y: Math.min(...ys) - pad, w: Math.max(...xs) - Math.min(...xs) + pad * 2, h: Math.max(...ys) - Math.min(...ys) + pad * 2 };
        frames.push({ a, rect, partial: pts.length < a.records.length ? `${pts.length} of ${a.records.length} on this board` : null });
      } else {
        const ids = new Set(pts.map(([id]) => id));
        const lines: [Projected, Projected][] = [];
        for (const e of layer?.store.edges() ?? []) {
          if (ids.has(e.source) && ids.has(e.target)) {
            const p = node(e.source);
            const q = node(e.target);
            if (p && q) lines.push([p, q]);
          }
        }
        rings.push({ a, pts: pts.map(([, p]) => p), lines });
      }
      continue;
    }
    const anchor = a.records[0] ? at(a.records[0]) : null;
    if (!anchor) continue;
    if (density === 'badges' && a.id !== DRAFT_ID) {
      const key = a.records[0]!.id;
      const b = badges.get(key) ?? { at: anchor, n: 0, label: a.records[0]!.label || labelOf(layer, key, a.records[0]!.kind) };
      b.n += 1;
      badges.set(key, b);
    } else cards.push({ a, anchor });
  }

  // ── the layout: cards clear of each other, labels and chrome ──────────────
  const { w: W, h: H } = size;
  const chrome: Rect[] = [
    { x: 0, y: 0, w: 480, h: BOARD_EDGE + 40 },
    { x: W - BOARD_EDGE - 40, y: 0, w: BOARD_EDGE + 40, h: 280 },
  ];
  if (panelOpen && mode !== 'present' && mode !== 'focus') chrome.push({ x: W - BOARD_EDGE - 32 - 6 - panelWidth - 8, y: 0, w: panelWidth + 60, h: H });
  if (mode === 'present') chrome.push({ x: W / 2 - 300, y: H - 190, w: 600, h: 190 });
  else chrome.push({ x: 0, y: H - (BOARD_DOCK.minimapHeight + BOARD_DOCK.barHeight + BOARD_EDGE * 2 + 8), w: BOARD_DOCK.width + BOARD_EDGE * 2, h: H });
  for (const f of frames) chrome.push({ x: f.rect.x, y: f.rect.y - 22, w: 180, h: 22 });
  const value = (a: BoardAnnotation) => {
    if (a.kind !== 'value' || !a.prop || !a.records[0]) return null;
    const r = a.records[0];
    const rec = r.kind === 'node' ? layer?.store.getNode(r.id) : layer?.store.getEdge(r.id);
    const now = (rec?.data as Record<string, unknown> | undefined)?.[a.prop];
    return { prop: a.prop, now: fmt(now), then: a.valueThen === undefined ? undefined : fmt(a.valueThen) };
  };
  const selected = ctx.selectedId;
  const barFor = annotating && selected !== null && selected !== DRAFT_ID ? selected : null;
  const boxes: CardBox[] = cards
    .map(({ a, anchor }) => {
      const v = value(a);
      const h = estimateCardHeight(a.text, { value: !!v, changed: !!v && v.then !== undefined && v.then !== v.now, editing: a.id === DRAFT_ID });
      return { id: a.id, x: anchor.x + anchor.r + 16, y: anchor.y - h - 12, w: CARD_W, h, ...(a.id === barFor ? { reserveTop: BAR_H + 8 } : {}) };
    })
    // The selected one, and the one being written, keep their spot first.
    .sort((p, q) => rank(q.id) - rank(p.id));
  function rank(id: string) {
    return id === DRAFT_ID ? 2 : id === selected ? 1 : 0;
  }
  const dots: Point[] = [];
  for (const n of layer?.store.nodes() ?? []) {
    const p = node(n.id);
    if (p) dots.push(p);
  }
  const place = W > 0 ? placeCards(boxes, chrome, dots, { w: W, h: H }) : new Map<string, Point>();
  const heightOf = new Map(boxes.map((b) => [b.id, b.h]));

  // ── the tools ─────────────────────────────────────────────────────────────
  const toolOn = annotating && ctx.actor.canWrite && (tool === 'annotate' || tool === 'highlight' || tool === 'group');
  const hit = (x: number, y: number): { id: string; kind: 'node' | 'edge' } | null => {
    let best: { id: string; d: number } | null = null;
    for (const n of layer?.store.nodes() ?? []) {
      const p = node(n.id);
      if (!p) continue;
      const d = Math.hypot(p.x - x, p.y - y);
      if (d <= Math.max(p.r, 6) + 6 && (!best || d < best.d)) best = { id: n.id, d };
    }
    if (best) return { id: best.id, kind: 'node' };
    for (const e of layer?.store.edges() ?? []) {
      const p = node(e.source);
      const q = node(e.target);
      if (p && q && segmentDistance(x, y, p, q) <= 5) return { id: e.id, kind: 'edge' };
    }
    return null;
  };
  const say = (text: string) => canvas.showMessage(text, 3000);
  const local = (e: PointerEvent) => {
    const r = host.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const p = local(e);
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    setDrag({ x0: p.x, y0: p.y, x1: p.x, y1: p.y });
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const p = local(e);
    setDrag({ ...drag, x1: p.x, y1: p.y });
  };
  const onUp = () => {
    if (!drag) return;
    const d = drag;
    setDrag(null);
    const moved = Math.abs(d.x1 - d.x0) + Math.abs(d.y1 - d.y0) > 6;
    if (!moved) {
      const t = hit(d.x0, d.y0);
      if (tool === 'annotate') {
        if (!t) return say('Annotations go on data. Click a node or a relationship.');
        return ctx.begin({ kind: 'note', records: recordsOf(canvas, [t.id], t.kind) });
      }
      if (tool === 'highlight') {
        if (!t || t.kind !== 'node') return say('Click a node, or drag over several, to highlight them.');
        return ctx.begin({ kind: 'highlight', records: recordsOf(canvas, [t.id], 'node') });
      }
      return say('Drag around two or more records to group them.');
    }
    const box = { x: Math.min(d.x0, d.x1), y: Math.min(d.y0, d.y1), w: Math.abs(d.x1 - d.x0), h: Math.abs(d.y1 - d.y0) };
    const inside: string[] = [];
    for (const n of layer?.store.nodes() ?? []) {
      const p = node(n.id);
      if (p && p.x >= box.x && p.x <= box.x + box.w && p.y >= box.y && p.y <= box.y + box.h) inside.push(n.id);
    }
    if (tool === 'group') {
      if (inside.length < 2) return say('A group holds two or more records. Drag around them.');
      return ctx.begin({ kind: 'group', records: recordsOf(canvas, inside, 'node') });
    }
    if (tool === 'highlight') {
      if (!inside.length) return say('Nothing to highlight there. Click a node, or drag over several.');
      return ctx.begin({ kind: 'highlight', records: recordsOf(canvas, inside, 'node') });
    }
    say('Annotations go on data. Click a node or a relationship.');
  };

  const pick = (a: BoardAnnotation) => {
    if (!annotating || a.id === DRAFT_ID) return;
    ctx.select(a.id);
    ctx.openPanel({ kind: 'detail', id: a.id });
  };
  const pointer = annotating && !toolOn ? 'pointer-events-auto' : 'pointer-events-none';
  const selectedA = barFor ? shown.find((a) => a.id === barFor) : undefined;
  const barAt = selectedA ? barPosition(selectedA, place, frames, rings) : null;

  return (
    <div ref={host} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" aria-label="Annotations">
      <svg className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {frames.map(({ a, rect, partial }) => (
          <rect
            key={a.id}
            x={rect.x}
            y={rect.y}
            width={rect.w}
            height={rect.h}
            rx={6}
            fill={`color-mix(in srgb, ${ANNOTATION_TOKEN[a.color]} 6%, transparent)`}
            stroke={ANNOTATION_TOKEN[a.color]}
            strokeWidth={a.id === selected ? 2 : 1.5}
            strokeDasharray={partial ? '5 4' : undefined}
            opacity={density === 'badges' ? 0.5 : 1}
          />
        ))}
        {rings.map(({ a, pts, lines }) => (
          <g key={a.id} opacity={density === 'badges' ? 0.5 : 1}>
            {lines.map(([p, q], i) => (
              <line key={i} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={ANNOTATION_TOKEN[a.color]} strokeOpacity={0.45} strokeWidth={8} strokeLinecap="round" />
            ))}
            {pts.map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r={Math.max(p.r, 6) + 7} fill={`color-mix(in srgb, ${ANNOTATION_TOKEN[a.color]} 20%, transparent)`} stroke={ANNOTATION_TOKEN[a.color]} strokeWidth={a.id === selected ? 3 : 2} />
            ))}
          </g>
        ))}
        {cards.map(({ a, anchor }) => {
          const p = place.get(a.id);
          if (!p) return null;
          const h = heightOf.get(a.id) ?? 60;
          const cx = clamp(anchor.x, p.x, p.x + CARD_W);
          const cy = clamp(anchor.y, p.y, p.y + h);
          return (
            <g key={a.id}>
              <line x1={anchor.x} y1={anchor.y} x2={cx} y2={cy} stroke={ANNOTATION_TOKEN[a.color]} strokeWidth={1.2} strokeDasharray="3 3" />
              <circle cx={anchor.x} cy={anchor.y} r={anchor.r + 3} fill="none" stroke={ANNOTATION_TOKEN[a.color]} strokeWidth={1.5} />
            </g>
          );
        })}
        {drag && (
          <rect
            x={Math.min(drag.x0, drag.x1)}
            y={Math.min(drag.y0, drag.y1)}
            width={Math.abs(drag.x1 - drag.x0)}
            height={Math.abs(drag.y1 - drag.y0)}
            fill="color-mix(in srgb, var(--color-primary) 6%, transparent)"
            stroke="var(--color-primary)"
            strokeDasharray="5 4"
          />
        )}
      </svg>

      {frames.map(({ a, rect, partial }) => (
        <GroupLabel key={a.id} a={a} x={rect.x} y={rect.y} sub={partial ?? `${a.records.length} records`} pointer={pointer} onPick={() => pick(a)} />
      ))}

      {cards.map(({ a }) => {
        const p = place.get(a.id);
        if (!p) return null;
        const v = value(a);
        return (
          <div key={a.id} className={cn('absolute', pointer)} style={{ left: p.x, top: p.y }} onClick={() => pick(a)}>
            <AnnotationCard
              text={a.text}
              color={a.color}
              {...(v ? { value: v } : {})}
              author={{ name: a.author.name, kind: a.author.kind, ...(a.author.initials ? { initials: a.author.initials } : {}), ...(a.author.tone ? { tone: a.author.tone } : {}) }}
              {...(a.meta ? { meta: a.meta } : {})}
              {...(a.sessionTag ? { sessionTag: a.sessionTag } : {})}
              selected={a.id === selected && annotating}
              {...(a.id === DRAFT_ID ? { editor: <DraftEditor kind={a.kind} /> } : {})}
            />
          </div>
        );
      })}

      {[...badges.entries()].map(([id, b]) => (
        <Button
          key={id}
          size="xs"
          variant="secondary"
          className="pointer-events-auto absolute h-4 min-w-4 rounded-full px-1"
          style={{ left: b.at.x + b.at.r - 4, top: b.at.y - b.at.r - 14 }}
          aria-label={`${b.n} annotation${b.n > 1 ? 's' : ''} on ${b.label}`}
          title={`${b.n} annotation${b.n > 1 ? 's' : ''} on ${b.label}`}
          onClick={() => ctx.openPanel({ kind: 'record', recordId: id })}
        >
          {b.n}
        </Button>
      ))}

      {selectedA && barAt && (
        <FormatBar a={selectedA} x={barAt.x} y={barAt.y} onColor={(c) => ctx.update(selectedA.id, { color: c })} onDelete={() => ctx.remove(selectedA.id)} />
      )}

      {toolOn && (
        <div
          className="pointer-events-auto absolute inset-0 cursor-crosshair"
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={() => setDrag(null)}
        />
      )}
    </div>
  );
}

/** The text of the one being written: Enter with ⌘ or leaving it saves, Esc drops it. */
function DraftEditor({ kind }: { kind: BoardAnnotation['kind'] }) {
  const ctx = useAnnotations();
  const [text, setText] = useState(ctx.draft?.text ?? '');
  const done = () => ctx.commit(text);
  const key = (e: KeyboardEvent) => {
    if (e.key === 'Escape') ctx.cancel();
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) done();
  };
  return (
    <Textarea
      aria-label={kind === 'value' ? 'What does this value say?' : 'What does the data say here?'}
      placeholder={kind === 'value' ? 'What does this value say?' : 'What does the data say here?'}
      rows={3}
      autoFocus
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={done}
      onKeyDown={key}
    />
  );
}

/** A group's name tab, over its frame's top-left corner — an input while it is first named. */
function GroupLabel({ a, x, y, sub, pointer, onPick }: { a: BoardAnnotation; x: number; y: number; sub: string; pointer: string; onPick: () => void }) {
  const ctx = useAnnotations();
  const [label, setLabel] = useState(a.label ?? '');
  const draft = a.id === DRAFT_ID;
  return (
    <div
      className={cn('bg-card text-foreground absolute flex -translate-y-full items-center gap-1.5 rounded-t-sm border border-b-0 px-1.5 text-xs font-semibold whitespace-nowrap', draft ? 'pointer-events-auto' : pointer)}
      style={{ left: x, top: y + 1, borderColor: ANNOTATION_TOKEN[a.color] }}
      onClick={onPick}
    >
      {draft ? (
        <Input
          aria-label="Name the group"
          placeholder="Name the group"
          autoFocus
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          onBlur={() => ctx.commit('', label)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') ctx.commit('', label);
            if (e.key === 'Escape') ctx.cancel();
          }}
        />
      ) : (
        a.label || 'Group'
      )}
      <span className="text-muted-foreground font-normal">{sub}</span>
    </div>
  );
}

/** Over the selected annotation: its colour, then delete — or why not. */
function FormatBar({ a, x, y, onColor, onDelete }: { a: BoardAnnotation; x: number; y: number; onColor: (c: AnnotationColor) => void; onDelete: () => void }): ReactNode {
  return (
    <div role="toolbar" aria-label={`Annotation by ${a.author.name}`} className="bg-card pointer-events-auto absolute flex items-center gap-0.5 rounded-md border p-0.5 shadow-md" style={{ left: x, top: y }}>
      {a.canEdit &&
        COLORS.map((c) => (
          <Button key={c} size="xs" variant="ghost" aria-label={COLOR_NAME[c]} title={COLOR_NAME[c]} aria-pressed={a.color === c} onClick={() => onColor(c)}>
            <span className={cn('size-3 rounded-full', BG[c], a.color === c && 'ring-foreground ring-2 ring-offset-1')} />
          </Button>
        ))}
      {a.canDelete ? (
        <Button size="xs" variant="ghost" aria-label="Delete" title="Delete" className="text-destructive" onClick={onDelete}>
          <Trash2 aria-hidden="true" />
        </Button>
      ) : (
        <span className="text-muted-foreground px-1.5 text-xs whitespace-nowrap">{a.whyNot ?? `Only ${a.author.name} can delete it`}</span>
      )}
    </div>
  );
}

function barPosition(
  a: BoardAnnotation,
  place: Map<string, Point>,
  frames: { a: BoardAnnotation; rect: Rect }[],
  rings: { a: BoardAnnotation; pts: Projected[] }[],
): Point | null {
  const p = place.get(a.id);
  if (p) return { x: p.x - 6, y: p.y - BAR_H - 6 };
  const f = frames.find((x) => x.a.id === a.id);
  if (f) return { x: f.rect.x, y: Math.max(8, f.rect.y - 22 - BAR_H - 6) };
  const r = rings.find((x) => x.a.id === a.id);
  if (r && r.pts.length) return { x: Math.min(...r.pts.map((q) => q.x)) - 20, y: Math.max(8, Math.min(...r.pts.map((q) => q.y)) - 30 - BAR_H) };
  return null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function segmentDistance(x: number, y: number, p: Point, q: Point): number {
  const dx = q.x - p.x;
  const dy = q.y - p.y;
  const L = dx * dx + dy * dy || 1;
  const t = clamp(((x - p.x) * dx + (y - p.y) * dy) / L, 0, 1);
  return Math.hypot(x - (p.x + t * dx), y - (p.y + t * dy));
}

/** A record's value as the card prints it. */
export function fmt(v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString();
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

