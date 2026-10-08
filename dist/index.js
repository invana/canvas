import { boundsOfSpec, containsSpec, defaultCanvasView, CanvasEventBus, CanvasThemeState, createActions, LayerData, SpecStore } from '@invana/canvas-core';
export { CANVAS_SOURCE, CanvasEventBus, CanvasThemeState, ColumnStore, DirtyBatcher, EventEmitter, INHERIT, LayerData, NODE_FLAG, SourceEmitter, createActions, defaultCanvasView, defaultEqual, isInherit, resolveThemed, scheduleFlush, select, shallowEqual } from '@invana/canvas-core';
export * from '@invana/canvas-core/specs';
import { enableMapSet, enablePatches, produceWithPatches, applyPatches } from 'immer';
import { createStore } from 'zustand/vanilla';
import RBush from 'rbush';

// src/index.ts
enableMapSet();
enablePatches();
function isPlainObject(v) {
  if (typeof v !== "object" || v === null || Array.isArray(v)) return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}
var FORBIDDEN_MERGE_KEYS = /* @__PURE__ */ new Set(["__proto__", "constructor", "prototype"]);
function applyDeepPartial(draft, patch) {
  for (const [k, v] of Object.entries(patch)) {
    if (FORBIDDEN_MERGE_KEYS.has(k)) continue;
    const cur = draft[k];
    if (isPlainObject(v) && isPlainObject(cur)) applyDeepPartial(cur, v);
    else draft[k] = v;
  }
}
function computeChange(state, update) {
  const recipe = typeof update === "function" ? update : (draft) => {
    applyDeepPartial(draft, update);
  };
  const [next, patches, inverse] = produceWithPatches(state, (draft) => {
    recipe(draft);
  });
  return { next, patches, inverse };
}
function changedPaths(patches) {
  const seen = /* @__PURE__ */ new Set();
  for (const p of patches) {
    const head = p.path[0];
    if (head !== void 0) seen.add(String(head));
  }
  return [...seen];
}

// src/port/store-core.ts
var clock = () => typeof performance !== "undefined" ? performance.now() : Date.now();
function createStoreFromCell(cell) {
  const changeListeners = /* @__PURE__ */ new Set();
  let batching = false;
  let working = cell.get();
  let batchStart = working;
  let batchPatches = [];
  let batchInverse = [];
  function getState() {
    return batching ? working : cell.get();
  }
  function emitChange(change) {
    for (const l of changeListeners) l(change);
  }
  function update(u, action) {
    const prev = getState();
    const t0 = clock();
    const { next, patches, inverse } = computeChange(prev, u);
    if (next === prev) return;
    if (batching) {
      working = next;
      batchPatches.push(...patches);
      batchInverse.unshift(...inverse);
    } else {
      cell.set(next);
      emitChange({ state: next, prev, action, patches, inverse, durationMs: clock() - t0 });
    }
  }
  function batch(run, action) {
    if (batching) {
      run();
      return;
    }
    batching = true;
    batchStart = cell.get();
    working = batchStart;
    batchPatches = [];
    batchInverse = [];
    const t0 = clock();
    try {
      run();
    } finally {
      batching = false;
      if (working !== batchStart && batchPatches.length > 0) {
        cell.set(working);
        emitChange({
          state: working,
          prev: batchStart,
          action,
          patches: batchPatches,
          inverse: batchInverse,
          durationMs: clock() - t0
        });
      }
    }
  }
  return {
    getState,
    update,
    subscribe: (listener) => cell.subscribe(listener),
    subscribeChanges: (listener) => {
      changeListeners.add(listener);
      return () => changeListeners.delete(listener);
    },
    batch
  };
}
function createReactiveStore(initial) {
  const z = createStore(() => initial);
  const cell = {
    get: () => z.getState(),
    // `replace: true` — we hand zustand the whole next state (produced by immer).
    set: (next) => z.setState(next, true),
    subscribe: (listener) => z.subscribe(listener)
  };
  return createStoreFromCell(cell);
}

// src/port/createMemoryStore.ts
function createMemoryStore(initial) {
  let state = initial;
  const listeners = /* @__PURE__ */ new Set();
  const cell = {
    get: () => state,
    set: (next) => {
      const prev = state;
      state = next;
      for (const l of listeners) l(next, prev);
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
  return createStoreFromCell(cell);
}
var defaultNow = () => typeof performance !== "undefined" && typeof performance.now === "function" ? performance.now() : Date.now();
function isUndoable(entry) {
  return !entry.coalesced && entry.parts.some((p) => p.kind === "data" || p.undoable);
}
function stepInfo(entry) {
  if (!entry) return void 0;
  const view = entry.parts.find((p) => p.kind === "view");
  return {
    ...view?.action !== void 0 ? { action: view.action } : {},
    ...entry.title !== void 0 ? { title: entry.title } : {},
    actor: entry.actor,
    at: entry.at
  };
}
function createOperationLog(opts = {}) {
  const now = opts.now ?? defaultNow;
  const sessionActor = opts.actor ?? (() => "user");
  const classify = opts.classify ?? (() => "undoable");
  const mergeWithinMs = opts.mergeWithinMs ?? 0;
  const view = opts.view;
  const entries = [];
  let cursor = 0;
  const branches = [];
  const reverted = /* @__PURE__ */ new WeakMap();
  const sources = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  const entryListeners = /* @__PURE__ */ new Set();
  let open = null;
  let stream = null;
  let replaying = false;
  let seq = 0;
  const notify = () => {
    for (const l of [...listeners]) l();
  };
  const newEntry = (actor, meta = {}) => ({
    id: `e${++seq}`,
    at: now(),
    actor,
    ...meta.title !== void 0 ? { title: meta.title } : {},
    ...meta.stepId !== void 0 ? { stepId: meta.stepId } : {},
    parts: []
  });
  function pushPart(entry, part) {
    const last = entry.parts[entry.parts.length - 1];
    if (part.kind === "data" && last?.kind === "data" && last.sourceId === part.sourceId) {
      last.ops.push(...part.ops);
      return;
    }
    entry.parts.push(part);
  }
  function append(entry) {
    stream = null;
    if (isUndoable(entry)) {
      if (cursor < entries.length) branches.push(entries.splice(cursor));
      entries.push(entry);
      cursor = entries.length;
    } else {
      entries.splice(cursor, 0, entry);
      cursor++;
    }
    for (const l of [...entryListeners]) l(entry);
    notify();
  }
  function record(parts, actor) {
    if (parts.length === 0) return;
    if (open) {
      for (const part of parts) pushPart(open, part);
      return;
    }
    const entry = newEntry(actor);
    for (const part of parts) pushPart(entry, part);
    append(entry);
  }
  function recordStreamed(sourceId, ops, actor) {
    const compact = (list) => sources.get(sourceId)?.compact?.(list) ?? list;
    const top = stream;
    if (top && top.actor === actor && cursor === entries.length && entries[cursor - 1] === top) {
      const part = top.parts.find((p) => p.kind === "data" && p.sourceId === sourceId);
      if (part) part.ops = compact([...part.ops, ...ops]);
      else top.parts.push({ kind: "data", sourceId, ops: compact([...ops]) });
      top.parts = top.parts.filter((p) => p.kind !== "data" || p.ops.length > 0);
      if (top.parts.length === 0) {
        entries.pop();
        cursor--;
        stream = null;
      } else top.at = now();
      notify();
      return;
    }
    const merged = compact([...ops]);
    if (merged.length === 0) return;
    const entry = newEntry(actor);
    entry.coalesced = true;
    entry.parts.push({ kind: "data", sourceId, ops: merged });
    append(entry);
    stream = entry;
  }
  function tryMerge(part, actor) {
    if (mergeWithinMs <= 0 || open || !part.undoable || part.action === void 0) return false;
    if (cursor !== entries.length) return false;
    const top = entries[cursor - 1];
    if (!top || top.actor !== actor || top.stepId !== void 0 || top.parts.length !== 1) return false;
    const prev = top.parts[0];
    if (prev.kind !== "view" || !prev.undoable || prev.action !== part.action) return false;
    const at = now();
    if (at - top.at > mergeWithinMs) return false;
    prev.patches = [...prev.patches, ...part.patches];
    prev.inverse = [...part.inverse, ...prev.inverse];
    top.at = at;
    notify();
    return true;
  }
  const offView = view?.subscribeChanges((change) => {
    if (replaying) return;
    const split = (list) => {
      const out = { undoable: [], record: [] };
      for (const p of list) {
        const mode = classify(p, change);
        if (mode !== "skip") out[mode].push(p);
      }
      return out;
    };
    const fwd = split(change.patches);
    const inv = split(change.inverse);
    const parts = [];
    const action = change.action;
    for (const mode of ["undoable", "record"]) {
      if (fwd[mode].length === 0 && inv[mode].length === 0) continue;
      parts.push({
        kind: "view",
        ...action !== void 0 ? { action } : {},
        patches: fwd[mode],
        inverse: inv[mode],
        undoable: mode === "undoable"
      });
    }
    if (parts.length === 0) return;
    const actor = sessionActor();
    if (parts.length === 1 && tryMerge(parts[0], actor)) return;
    record(parts, actor);
  });
  function run(entry, direction, scope) {
    const parts = direction === "back" ? [...entry.parts].reverse() : entry.parts;
    replaying = true;
    try {
      for (const part of parts) {
        if (part.kind === "view") {
          if (scope === "undoable" && !part.undoable) continue;
          if (!view) continue;
          const patches = direction === "back" ? part.inverse : part.patches;
          view.update((draft) => {
            applyPatches(draft, patches);
          }, `${direction === "back" ? "undo" : "redo"}:${part.action ?? "update"}`);
        } else {
          sources.get(part.sourceId)?.applyOps(part.ops, direction);
        }
      }
    } finally {
      replaying = false;
    }
  }
  function revertEntry(entry, scope) {
    run(entry, "back", scope);
    reverted.set(entry, scope);
  }
  function reapplyEntry(entry) {
    run(entry, "forward", reverted.get(entry) ?? "all");
    reverted.delete(entry);
  }
  function undoIndex() {
    let i = cursor - 1;
    while (i >= 0 && !isUndoable(entries[i])) i--;
    return i;
  }
  const indexOf = (id) => entries.findIndex((e) => e.id === id);
  return {
    registerSource(adapter) {
      sources.set(adapter.sourceId, adapter);
      return () => {
        if (sources.get(adapter.sourceId) === adapter) sources.delete(adapter.sourceId);
      };
    },
    source: (sourceId) => sources.get(sourceId),
    status(entryId) {
      const i = indexOf(entryId);
      if (i < 0) return "unknown";
      return i < cursor ? "applied" : "pending";
    },
    recordData(sourceId, ops, actor, recordOpts) {
      if (replaying || ops.length === 0) return;
      const who = actor ?? sessionActor();
      if (recordOpts?.coalesce && !open) {
        recordStreamed(sourceId, ops, who);
        return;
      }
      const part = { kind: "data", sourceId, ops: [...ops] };
      record([part], who);
    },
    tagStep(entryIds, meta) {
      const ids = new Set(entryIds);
      let changed = false;
      for (const entry of entries.slice(0, cursor)) {
        if (!ids.has(entry.id)) continue;
        entry.stepId = meta.stepId;
        if (meta.title !== void 0 && entry.title === void 0) entry.title = meta.title;
        changed = true;
      }
      if (changed) notify();
    },
    group(meta, fn) {
      if (open) {
        if (open.title === void 0 && meta.title !== void 0) open.title = meta.title;
        if (open.stepId === void 0 && meta.stepId !== void 0) open.stepId = meta.stepId;
        return fn();
      }
      const entry = newEntry(meta.actor ?? sessionActor(), meta);
      open = entry;
      let result;
      try {
        result = fn();
      } catch (err) {
        open = null;
        if (entry.parts.length > 0) run(entry, "back", "all");
        throw err;
      }
      open = null;
      if (entry.parts.length > 0) {
        entry.at = now();
        append(entry);
      }
      return result;
    },
    get replaying() {
      return replaying;
    },
    undo() {
      if (open) return;
      stream = null;
      const i = undoIndex();
      if (i < 0) return;
      const entry = entries[i];
      revertEntry(entry, "undoable");
      entries.splice(i, 1);
      entries.splice(cursor - 1, 0, entry);
      cursor--;
      notify();
    },
    redo() {
      if (open || cursor >= entries.length) return;
      stream = null;
      const entry = entries[cursor];
      reapplyEntry(entry);
      cursor++;
      entry.at = now();
      notify();
    },
    canUndo: () => undoIndex() >= 0,
    canRedo: () => cursor < entries.length,
    peekUndo: () => stepInfo(entries[undoIndex()]),
    peekRedo: () => stepInfo(entries[cursor]),
    revertTo(entryId) {
      stream = null;
      const target = entryId === null ? 0 : indexOf(entryId) + 1;
      if (entryId !== null && target === 0) return;
      if (cursor <= target) return;
      while (cursor > target) revertEntry(entries[--cursor], "all");
      notify();
    },
    replayTo(entryId) {
      stream = null;
      const target = indexOf(entryId) + 1;
      if (target <= cursor) return;
      while (cursor < target) reapplyEntry(entries[cursor++]);
      notify();
    },
    atLatest: () => cursor === entries.length,
    entries(filter) {
      const applied = entries.slice(0, cursor);
      if (!filter || filter.actor === void 0 && filter.stepId === void 0) return applied;
      return applied.filter(
        (e) => (filter.actor === void 0 || e.actor === filter.actor) && (filter.stepId === void 0 || e.stepId === filter.stepId)
      );
    },
    onEntry(listener) {
      entryListeners.add(listener);
      return () => entryListeners.delete(listener);
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    clear() {
      stream = null;
      if (entries.length === 0 && branches.length === 0) return;
      entries.length = 0;
      branches.length = 0;
      cursor = 0;
      notify();
    },
    dispose() {
      offView?.();
      listeners.clear();
      entryListeners.clear();
    }
  };
}

// src/log/stepLinks.ts
var stepLinks = /* @__PURE__ */ new WeakMap();

// src/log/historyView.ts
function isEmptyDelta(delta) {
  const sizes = [
    delta.added?.nodes?.length,
    delta.added?.edges?.length,
    delta.updated?.nodes?.length,
    delta.updated?.edges?.length,
    delta.removed?.nodeIds?.length,
    delta.removed?.edgeIds?.length,
    delta.hidden?.nodeIds?.length,
    delta.hidden?.edgeIds?.length,
    delta.shown?.nodeIds?.length,
    delta.shown?.edgeIds?.length,
    delta.pinned?.length
  ];
  return sizes.every((n) => !n);
}
function historyView(log, opts = {}) {
  function sinceLastStep(title) {
    const applied = log.entries();
    let start = applied.length;
    while (start > 0 && applied[start - 1].stepId === void 0) start--;
    const covered = applied.slice(start);
    const before = start > 0 ? applied[start - 1].id : null;
    const step = {
      id: `since-${covered.length > 0 ? covered[covered.length - 1].id : before ?? "start"}`,
      title
    };
    if (covered.length === 0) return step;
    const opsBySource = /* @__PURE__ */ new Map();
    const viewParts = [];
    for (const entry of covered) {
      for (const part of entry.parts) {
        if (part.kind === "view") viewParts.push(part);
        else {
          const list = opsBySource.get(part.sourceId) ?? [];
          list.push(...part.ops);
          opsBySource.set(part.sourceId, list);
        }
      }
    }
    for (const [sourceId, ops] of opsBySource) {
      const delta = log.source(sourceId)?.toDelta?.(ops);
      if (!delta || isEmptyDelta(delta)) continue;
      step.source = sourceId;
      step.data = delta;
      break;
    }
    if (viewParts.length > 0 && opts.describeView) {
      const { settings, view } = opts.describeView(viewParts);
      if (settings !== void 0) step.settings = settings;
      if (view !== void 0 && Object.keys(view).length > 0) step.view = view;
    }
    stepLinks.set(step, { log, before, entryIds: covered.map((e) => e.id) });
    return step;
  }
  function entryData(entry) {
    const opsBySource = /* @__PURE__ */ new Map();
    for (const part of entry.parts) {
      if (part.kind !== "data") continue;
      const list = opsBySource.get(part.sourceId) ?? [];
      list.push(...part.ops);
      opsBySource.set(part.sourceId, list);
    }
    const out = [];
    for (const [sourceId, ops] of opsBySource) {
      const delta = log.source(sourceId)?.toDelta?.(ops);
      if (delta && !isEmptyDelta(delta)) out.push({ sourceId, delta });
    }
    return out;
  }
  return {
    undo: () => log.undo(),
    redo: () => log.redo(),
    canUndo: () => log.canUndo(),
    canRedo: () => log.canRedo(),
    peekUndo: () => log.peekUndo(),
    peekRedo: () => log.peekRedo(),
    entries: (filter) => log.entries(filter),
    onEntry: (listener) => log.onEntry(listener),
    atLatest: () => log.atLatest(),
    sinceLastStep,
    entryData,
    subscribe: (listener) => log.subscribe(listener),
    clear: () => log.clear(),
    dispose: () => log.dispose()
  };
}

// src/log/createPlaybook.ts
var PlaybookStepError = class extends Error {
  constructor(stepId, problems) {
    super(`Playbook step "${stepId}" is invalid: ${problems.join("; ")}`);
    this.stepId = stepId;
    this.problems = problems;
    this.name = "PlaybookStepError";
  }
};
function createPlaybook(log, env, opts = {}) {
  let title = opts.doc?.title ?? "Playbook";
  let source = opts.doc?.source;
  let steps = [];
  let index = -1;
  const played = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  let queue = Promise.resolve();
  const notify = () => {
    for (const l of [...listeners]) l();
  };
  const newestApplied = () => {
    const applied = log.entries();
    return applied.length > 0 ? applied[applied.length - 1].id : null;
  };
  const append = (spec) => {
    if (typeof spec.id !== "string" || spec.id === "") throw new Error("Playbook.addStep: a step needs an id");
    if (steps.some((s) => s.id === spec.id)) throw new Error(`Playbook.addStep: duplicate step id "${spec.id}"`);
    steps.push(spec);
  };
  if (opts.doc) for (const s of opts.doc.steps) append(s);
  const enqueue = (fn) => {
    const run = queue.then(fn);
    queue = run.catch(() => void 0);
    return run;
  };
  async function runVerbs(step) {
    for (const verb of step.do ?? []) await env.runCommand(verb.command, verb.args);
  }
  async function forward(i) {
    const step = steps[i];
    const record = played.get(step.id);
    const replayable = record !== void 0 && (record.last === null || log.status(record.last) === "pending");
    if (replayable) {
      if (record.last !== null) log.replayTo(record.last);
    } else {
      const src = step.source ?? source;
      const problems = env.validate(step, src);
      if (problems.length > 0) throw new PlaybookStepError(step.id, problems);
      const before = newestApplied();
      log.group(
        {
          title: step.title,
          actor: step.actor ?? env.actor(),
          stepId: step.id
        },
        () => env.apply(step, src)
      );
      const after = newestApplied();
      played.set(step.id, { before, last: after !== before ? after : null });
    }
    index = i;
    notify();
    await runVerbs(step);
    await env.whenSettled();
  }
  async function back() {
    const step = steps[index];
    const record = played.get(step.id);
    if (record && record.last !== null) log.revertTo(record.before);
    index--;
    notify();
    await env.whenSettled();
  }
  return {
    get steps() {
      return steps;
    },
    get current() {
      return index >= 0 ? steps[index] : void 0;
    },
    get index() {
      return index;
    },
    get title() {
      return title;
    },
    addStep(spec) {
      const atEnd = index === steps.length - 1;
      append(spec);
      const link = stepLinks.get(spec);
      if (link && atEnd && link.log === log && newestApplied() === link.entryIds[link.entryIds.length - 1] && link.entryIds.every((id) => log.status(id) === "applied")) {
        log.tagStep(link.entryIds, { stepId: spec.id, title: spec.title });
        played.set(spec.id, { before: link.before, last: link.entryIds[link.entryIds.length - 1] });
        index = steps.length - 1;
      }
      notify();
      return spec.id;
    },
    next: () => enqueue(async () => {
      if (index + 1 < steps.length) await forward(index + 1);
    }),
    previous: () => enqueue(async () => {
      if (index >= 0) await back();
    }),
    goTo: (stepId) => enqueue(async () => {
      const target = steps.findIndex((s) => s.id === stepId);
      if (target < 0) throw new Error(`Playbook.goTo: no step "${stepId}"`);
      while (index > target) await back();
      while (index < target) await forward(index + 1);
    }),
    toJSON() {
      return {
        version: 1,
        title,
        ...source !== void 0 ? { source } : {},
        steps: steps.map((s) => ({ ...s }))
      };
    },
    load: (doc) => enqueue(async () => {
      if (doc.version !== 1) throw new Error(`Playbook.load: unsupported version ${String(doc.version)}`);
      title = doc.title;
      source = doc.source;
      steps = [];
      played.clear();
      index = -1;
      for (const s of doc.steps) append(s);
      notify();
    }),
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    }
  };
}
function toEntry(id, kind, zIndex, rect) {
  return {
    id,
    kind,
    zIndex,
    minX: rect.x,
    minY: rect.y,
    maxX: rect.x + rect.width,
    maxY: rect.y + rect.height
  };
}
function dedupeById(raw) {
  if (raw.length <= 1) return raw;
  const seen = /* @__PURE__ */ new Set();
  const out = [];
  for (const e of raw) {
    if (seen.has(e.id)) continue;
    seen.add(e.id);
    out.push(e);
  }
  return out;
}
var HitIndex = class {
  tree = new RBush();
  /** id → its indexed box(es). Shapes hold one; connectors may hold several. */
  entries = /* @__PURE__ */ new Map();
  /**
   * Index `id` under one bbox (shapes) or several (connector segment boxes).
   * Replaces any existing boxes for the id.
   */
  insert(id, kind, rect, zIndex) {
    this.remove(id);
    const rects = Array.isArray(rect) ? rect : [rect];
    if (rects.length === 0) return;
    const list = [];
    for (const r of rects) {
      const entry = toEntry(id, kind, zIndex, r);
      this.tree.insert(entry);
      list.push(entry);
    }
    this.entries.set(id, list);
  }
  /** Update the bbox(es) + zIndex for an existing entry. No-op if unknown. */
  update(id, rect, zIndex) {
    const prev = this.entries.get(id);
    if (!prev || prev.length === 0) return;
    this.insert(id, prev[0].kind, rect, zIndex);
  }
  remove(id) {
    const prev = this.entries.get(id);
    if (!prev) return;
    for (const e of prev) this.tree.remove(e);
    this.entries.delete(id);
  }
  /** True if an entry with this id is currently indexed. Lets callers choose
   * between an immediate insert (new id) and a deferred bulk bbox refresh
   * (existing id) — see `PrimitivesRenderer`'s moved-hit deferral. */
  has(id) {
    return this.entries.has(id);
  }
  /**
   * Query candidates whose bbox intersects a `padWorld`-padded box around
   * `(x, y)`. With `padWorld = 0` (default), this matches the classic
   * "point in bbox" search.
   *
   * The pad exists for the renderer's **screen-pixel hit floor**:
   * `PrimitivesRenderer.hitTest` passes `MIN_HIT_PX / camera.scale` so a
   * shape whose bbox is smaller than the floor (e.g. a node collapsed to
   * sub-pixel size at low zoom) is still in the candidate set. The
   * subsequent `containsWithFloor` / precise check applies the same floor
   * in local coords. Without this pad, rbush would prune the tiny shape
   * before the floor could rescue it.
   *
   * Caller is responsible for the precise per-shape hit-test if the bbox
   * isn't the final answer (e.g. a circle inside its bbox).
   */
  query(x, y, padWorld = 0) {
    return dedupeById(
      this.tree.search({
        minX: x - padWorld,
        minY: y - padWorld,
        maxX: x + padWorld,
        maxY: y + padWorld
      })
    );
  }
  /**
   * All entries whose bbox intersects `rect` (world coords). Powers viewport
   * culling — query the camera's visible bounds to get the on-screen working
   * set. Conservative for loose bboxes (e.g. connectors): may over-return, never
   * under-returns, so nothing on-screen is missed.
   */
  searchRect(rect) {
    return dedupeById(
      this.tree.search({
        minX: rect.x,
        minY: rect.y,
        maxX: rect.x + rect.width,
        maxY: rect.y + rect.height
      })
    );
  }
  clear() {
    this.tree.clear();
    this.entries.clear();
  }
  /**
   * Bulk replace bboxes for many existing entries in one O(N log N) pass.
   *
   * Per-id `update(...)` does `remove + insert`, and rbush's `remove(item)`
   * is a linear tree walk — so updating thousands of entries one at a time
   * is O(N²). When a behaviour like `NodeScaleLODBehaviour` rescales every
   * node on each camera-zoom frame, the per-id path floors fps even at
   * modest graph sizes.
   *
   * This path replaces the cached box list for each touched id in the map,
   * then rebuilds the tree once via `clear + load` over the flattened entries.
   * Bulk-loading is `O(N log N)` total — for 3k entries, ~10× faster than the
   * per-id variant. Each id's kind + zIndex are carried over from its prior
   * boxes (an id that changed box *count* — e.g. a re-routed connector whose
   * segment split changed — is handled since we rebuild its list wholesale).
   *
   * Use when many entries change in the same logical tick (zoom settle,
   * bulk position update). For single-shape edits, prefer {@link update}.
   */
  bulkUpdateBoxes(updates) {
    let touched = false;
    for (const u of updates) {
      const prev = this.entries.get(u.id);
      if (!prev || prev.length === 0) continue;
      const { kind, zIndex } = prev[0];
      this.entries.set(
        u.id,
        u.rects.map((r) => toEntry(u.id, kind, zIndex, r))
      );
      touched = true;
    }
    if (!touched) return;
    this.tree.clear();
    const all = [];
    for (const list of this.entries.values()) all.push(...list);
    this.tree.load(all);
  }
  /** Number of indexed ids (not boxes — a multi-box connector counts once). */
  get size() {
    return this.entries.size;
  }
};
var CONNECTOR_HIT_MAX_BOXES = 8;
var CONNECTOR_HIT_SPLIT_LEN = 80;
var CONNECTOR_HIT_SLOP = 4;
function distanceToPolylineSq(poly, px, py) {
  if (poly.length === 0) return Infinity;
  if (poly.length === 1) {
    const p = poly[0];
    return (px - p.x) * (px - p.x) + (py - p.y) * (py - p.y);
  }
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const vx = b.x - a.x;
    const vy = b.y - a.y;
    const lenSq = vx * vx + vy * vy;
    let t = lenSq === 0 ? 0 : ((px - a.x) * vx + (py - a.y) * vy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const dx = px - (a.x + t * vx);
    const dy = py - (a.y + t * vy);
    const d = dx * dx + dy * dy;
    if (d < best) best = d;
  }
  return best;
}
function polylineHitRect(poly, strokeWidth) {
  const pad = strokeWidth / 2 + CONNECTOR_HIT_SLOP;
  if (poly.length === 0) return { x: -pad, y: -pad, width: pad * 2, height: pad * 2 };
  let minX = poly[0].x;
  let minY = poly[0].y;
  let maxX = minX;
  let maxY = minY;
  for (const p of poly) {
    if (p.x < minX) minX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.x > maxX) maxX = p.x;
    if (p.y > maxY) maxY = p.y;
  }
  return { x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 };
}
function connectorHitBoxes(poly, strokeWidth) {
  const pad = strokeWidth / 2 + CONNECTOR_HIT_SLOP;
  if (poly.length < 2) return [polylineHitRect(poly, strokeWidth)];
  let total = 0;
  const segLen = [];
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const l = Math.hypot(b.x - a.x, b.y - a.y);
    segLen.push(l);
    total += l;
  }
  const n = Math.min(CONNECTOR_HIT_MAX_BOXES, Math.max(1, Math.ceil(total / CONNECTOR_HIT_SPLIT_LEN)));
  if (n <= 1 || total === 0) return [polylineHitRect(poly, strokeWidth)];
  const step = total / n;
  const rects = [];
  let boundary = step;
  let acc = 0;
  let minX = poly[0].x;
  let minY = poly[0].y;
  let maxX = minX;
  let maxY = minY;
  const expand = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  const flush = () => {
    rects.push({ x: minX - pad, y: minY - pad, width: maxX - minX + pad * 2, height: maxY - minY + pad * 2 });
  };
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const l = segLen[i];
    while (l > 0 && rects.length < n - 1 && boundary <= acc + l + 1e-9) {
      const t = (boundary - acc) / l;
      const cx = a.x + (b.x - a.x) * t;
      const cy = a.y + (b.y - a.y) * t;
      expand(cx, cy);
      flush();
      minX = maxX = cx;
      minY = maxY = cy;
      boundary += step;
    }
    expand(b.x, b.y);
    acc += l;
  }
  flush();
  return rects;
}
var PickingIndex = class {
  index = new HitIndex();
  source;
  camera;
  hitFloorPx;
  hoverHysteresisPx;
  hoverNodeIncidencePx;
  /**
   * Shapes whose indexed bbox is stale after a position-only move, awaiting a
   * bulk reflush. Per-move `remove + insert` is O(N) in rbush, so a full
   * layout sweep would be O(N²); deferring makes it one rebuild, and only when
   * a query actually needs accurate bounds.
   */
  movedShapes = /* @__PURE__ */ new Set();
  /** The connector analog of {@link movedShapes} — stale after a re-route. */
  movedConnectors = /* @__PURE__ */ new Set();
  _enabled = true;
  constructor(opts) {
    this.source = opts.source;
    this.camera = opts.camera;
    this.hitFloorPx = opts.hitFloorPx ?? 0;
    this.hoverHysteresisPx = opts.hoverHysteresisPx ?? 0;
    this.hoverNodeIncidencePx = opts.hoverNodeIncidencePx ?? 0;
  }
  /**
   * Enable / disable all picking. When disabled, {@link hitTest} and
   * {@link pickHover} return `null` regardless of what's under the cursor — the
   * owning layer flips this so a hidden layer's elements aren't clickable.
   */
  setEnabled(enabled) {
    this._enabled = enabled;
  }
  get enabled() {
    return this._enabled;
  }
  // ─── Indexing ────────────────────────────────────────────────────────────
  /** Index (or re-index) a shape from its current record. */
  insertShape(id, zIndex) {
    const rect = this.shapeWorldBounds(id);
    if (!rect) return;
    this.index.insert(id, "shape", rect, zIndex);
    this.movedShapes.delete(id);
  }
  /** Index (or re-index) a connector as its segment boxes. */
  insertConnector(id, zIndex) {
    const rec = this.source.connectorRecord(id);
    if (!rec) return;
    this.index.insert(id, "connector", connectorHitBoxes(rec.polyline, strokeWidthOf(rec.spec)), zIndex);
    this.movedConnectors.delete(id);
  }
  remove(id) {
    this.index.remove(id);
    this.movedShapes.delete(id);
    this.movedConnectors.delete(id);
  }
  has(id) {
    return this.index.has(id);
  }
  clear() {
    this.index.clear();
    this.movedShapes.clear();
    this.movedConnectors.clear();
  }
  /** Record that a shape moved; its bbox is refreshed on the next flush. */
  markShapeMoved(id) {
    this.movedShapes.add(id);
  }
  /** Record that a connector re-routed; its boxes are refreshed on the next flush. */
  markConnectorMoved(id) {
    this.movedConnectors.add(id);
  }
  /**
   * Bulk re-index shape bboxes eagerly — pairs with a scale gesture that
   * intentionally skipped per-call hit updates. Omitting `ids` touches every
   * shape. Either way the tree is rebuilt once rather than N × remove+insert.
   */
  reindexShapes(ids) {
    const updates = [];
    for (const id of ids ?? this.source.shapeIds()) {
      const rect = this.shapeWorldBounds(id);
      if (rect) updates.push({ id, rects: [rect] });
    }
    this.index.bulkUpdateBoxes(updates);
  }
  /**
   * Flush deferred bbox updates from moved shapes and re-routed connectors in a
   * SINGLE rbush rebuild. Called lazily from the query methods the first time
   * accurate bounds matter, so a layout settle with no pointer interaction pays
   * nothing — and when it does pay, it's one O(N log N) rebuild.
   */
  flushMoved() {
    if (this.movedShapes.size === 0 && this.movedConnectors.size === 0) return;
    const updates = [];
    for (const id of this.movedShapes) {
      const rect = this.shapeWorldBounds(id);
      if (rect) updates.push({ id, rects: [rect] });
    }
    for (const id of this.movedConnectors) {
      const rec = this.source.connectorRecord(id);
      if (rec && rec.polyline.length >= 2) {
        updates.push({ id, rects: connectorHitBoxes(rec.polyline, strokeWidthOf(rec.spec)) });
      }
    }
    this.movedShapes.clear();
    this.movedConnectors.clear();
    this.index.bulkUpdateBoxes(updates);
  }
  // ─── Geometry ────────────────────────────────────────────────────────────
  /**
   * World-space AABB of a shape — spec geometry, scaled by the renderer's
   * visual multiplier and offset to the spec's origin. `null` when the id is
   * unknown or its kind has no geometry the engine can compute and no fallback.
   */
  shapeWorldBounds(id) {
    const rec = this.source.shapeRecord(id);
    if (!rec) return null;
    const local = boundsOfSpec(rec.spec) ?? rec.localBounds?.();
    if (!local) return null;
    const s = rec.scale;
    return {
      x: rec.spec.x + local.x * s,
      y: rec.spec.y + local.y * s,
      width: local.width * s,
      height: local.height * s
    };
  }
  /** Ids whose indexed boxes intersect `rect`. Elements not indexed are absent. */
  visibleIds(rect) {
    const visible = /* @__PURE__ */ new Set();
    for (const e of this.index.searchRect(rect)) visible.add(e.id);
    return visible;
  }
  // ─── Queries ─────────────────────────────────────────────────────────────
  /**
   * Topmost element at a world point, or `null`.
   *
   * Two bands, in priority order:
   *
   *   1. **Exact hit** — the cursor is genuinely inside the silhouette (or
   *      within the connector's stroke tolerance). Ranked by `zIndex`, then
   *      shape-over-connector, then closest origin.
   *   2. **Floor fallback** — if NO exact hit, the closest candidate whose
   *      origin sits within `hitFloorPx` screen pixels of the cursor. Lets tiny
   *      pinpoints stay hoverable in sparse regions without widening hit areas
   *      in dense ones.
   *
   * @param exclude ids to skip — e.g. a transient drag preview sitting under
   *   the cursor that would otherwise mask the real target.
   */
  hitTest(worldX, worldY, exclude) {
    if (!this._enabled) return null;
    this.flushMoved();
    const floorWorld = this.hitFloorWorld();
    const candidates = this.index.query(worldX, worldY, floorWorld);
    if (candidates.length === 0) return null;
    let bestExact = null;
    let bestFloor = null;
    const floorSq = floorWorld * floorWorld;
    for (const c of candidates) {
      if (exclude?.has(c.id)) continue;
      const res = this.geometricHit(c.kind, c.id, worldX, worldY);
      if (!res) continue;
      if (res.exact) {
        if (beats(c.kind, c.zIndex, res.distSq, bestExact)) {
          bestExact = { kind: c.kind, id: c.id, distSq: res.distSq, zIndex: c.zIndex };
        }
      } else if (res.distSq <= floorSq) {
        if (bestFloor === null || res.distSq < bestFloor.distSq) {
          bestFloor = { kind: c.kind, id: c.id, distSq: res.distSq };
        }
      }
    }
    const winner = bestExact ?? bestFloor;
    return winner ? { kind: winner.kind, id: winner.id } : null;
  }
  /**
   * Hover-specific pick: {@link hitTest}'s winner, refined by two hover-only
   * heuristics that make tracing an edge out of a dense bundle reliable.
   * **Click / drag picking deliberately stays on the raw {@link hitTest}** — a
   * press must resolve exactly what is under the cursor, with no memory of the
   * last hover.
   *
   * - **Node-incidence bias (J).** When the raw winner is a connector but the
   *   cursor also sits within `hoverNodeIncidencePx` of a shape's centre, an
   *   edge *incident to that shape* (an endpoint at the node) is preferred over
   *   an unrelated edge merely passing through. Incident edges fan out and
   *   separate near their shared endpoint — where you aim. The test is purely
   *   geometric (endpoint ≈ node centre), so this stays domain-free; it never
   *   inspects graph adjacency.
   * - **Hysteresis (I).** `currentHover` of the *same kind* is kept unless the
   *   new winner is closer by more than `hoverHysteresisPx` — and only while the
   *   old target is still genuinely under the cursor — so sub-pixel jitter
   *   between two near-equidistant edges doesn't flicker the highlight.
   *
   * Falls back to identical behaviour to {@link hitTest} when both margins are
   * `0` or nothing nearby qualifies.
   *
   * @param currentHover what the caller currently shows as hovered — the
   *   hysteresis anchor. Kept as a parameter rather than state so the index
   *   owns no interaction bookkeeping.
   */
  pickHover(worldX, worldY, currentHover) {
    if (!this._enabled) return null;
    this.flushMoved();
    const floorWorld = this.hitFloorWorld();
    const incidenceWorld = this.hoverIncidenceWorld();
    const candidates = this.index.query(worldX, worldY, Math.max(floorWorld, incidenceWorld));
    if (candidates.length === 0) return null;
    const floorSq = floorWorld * floorWorld;
    const incidenceSq = incidenceWorld * incidenceWorld;
    let bestExact = null;
    let bestFloor = null;
    const nearbyCentres = [];
    const exactConnectors = [];
    for (const c of candidates) {
      if (c.kind === "shape") {
        const rec = this.source.shapeRecord(c.id);
        if (!rec) continue;
        const dx = worldX - rec.spec.x;
        const dy = worldY - rec.spec.y;
        const distSq = dx * dx + dy * dy;
        if (distSq <= incidenceSq) nearbyCentres.push({ x: rec.spec.x, y: rec.spec.y });
        const s = rec.scale || 1;
        if (this.shapeContainsLocal(rec, dx / s, dy / s)) {
          if (beats("shape", c.zIndex, distSq, bestExact)) {
            bestExact = { kind: "shape", id: c.id, distSq, zIndex: c.zIndex };
          }
        } else if (distSq <= floorSq && (bestFloor === null || distSq < bestFloor.distSq)) {
          bestFloor = { kind: "shape", id: c.id, distSq };
        }
      } else {
        const rec = this.source.connectorRecord(c.id);
        if (!rec) continue;
        const poly = rec.polyline;
        const distSq = distanceToPolylineSq(poly, worldX, worldY);
        if (distSq <= connectorToleranceSq(rec.spec) && poly.length >= 2) {
          const a = poly[0];
          const b = poly[poly.length - 1];
          exactConnectors.push({ id: c.id, distSq, ax: a.x, ay: a.y, bx: b.x, by: b.y });
          if (beats("connector", c.zIndex, distSq, bestExact)) {
            bestExact = { kind: "connector", id: c.id, distSq, zIndex: c.zIndex };
          }
        } else if (distSq <= floorSq && (bestFloor === null || distSq < bestFloor.distSq)) {
          bestFloor = { kind: "connector", id: c.id, distSq };
        }
      }
    }
    const base = bestExact ?? bestFloor;
    if (!base) return null;
    let win = {
      kind: base.kind,
      id: base.id,
      distSq: base.distSq
    };
    if (win.kind === "connector" && nearbyCentres.length > 0 && exactConnectors.length > 0) {
      const isIncident = (e) => nearbyCentres.some(
        (n) => (e.ax - n.x) * (e.ax - n.x) + (e.ay - n.y) * (e.ay - n.y) <= incidenceSq || (e.bx - n.x) * (e.bx - n.x) + (e.by - n.y) * (e.by - n.y) <= incidenceSq
      );
      const winnerIncident = exactConnectors.some((e) => e.id === win.id && isIncident(e));
      if (!winnerIncident) {
        let bestInc = null;
        for (const e of exactConnectors) {
          if (isIncident(e) && (bestInc === null || e.distSq < bestInc.distSq)) {
            bestInc = { id: e.id, distSq: e.distSq };
          }
        }
        if (bestInc) win = { kind: "connector", id: bestInc.id, distSq: bestInc.distSq };
      }
    }
    const cur = currentHover;
    if (cur && cur.kind === win.kind && cur.id !== win.id) {
      const curHit = this.geometricHit(cur.kind, cur.id, worldX, worldY);
      if (curHit && (curHit.exact || curHit.distSq <= floorSq)) {
        const margin = this.hoverHysteresisWorld();
        if (Math.sqrt(win.distSq) + margin >= Math.sqrt(curHit.distSq)) {
          return { kind: cur.kind, id: cur.id };
        }
      }
    }
    return { kind: win.kind, id: win.id };
  }
  // ─── Narrow phase ────────────────────────────────────────────────────────
  /**
   * Geometric test returning *both* whether the cursor exactly contains the
   * element AND the squared distance to the shape's origin (or the connector's
   * nearest polyline point) — used together by the two-band ranking.
   */
  geometricHit(kind, id, worldX, worldY) {
    if (kind === "shape") {
      const rec2 = this.source.shapeRecord(id);
      if (!rec2) return null;
      const dx = worldX - rec2.spec.x;
      const dy = worldY - rec2.spec.y;
      const distSq2 = dx * dx + dy * dy;
      const s = rec2.scale || 1;
      return { exact: this.shapeContainsLocal(rec2, dx / s, dy / s), distSq: distSq2 };
    }
    const rec = this.source.connectorRecord(id);
    if (!rec) return null;
    const distSq = distanceToPolylineSq(rec.polyline, worldX, worldY);
    return { exact: distSq <= connectorToleranceSq(rec.spec), distSq };
  }
  /**
   * Narrow-phase containment for one shape, in its **local** frame.
   *
   * Answered from the **spec** — pure geometry, no display object consulted —
   * so picking is identical across backends and works with no GPU. A spec kind
   * the engine has no geometry for is necessarily a `registerShape` custom
   * kind; those fall back to the record's own silhouette test, the only thing
   * that knows their shape.
   */
  shapeContainsLocal(rec, localX, localY) {
    const exact = containsSpec(rec.spec, localX, localY);
    if (exact !== void 0) return exact;
    return rec.containsLocal?.(localX, localY) ?? false;
  }
  /** `hitFloorPx` translated into world units at the current camera scale. */
  hitFloorWorld() {
    return this.hitFloorPx / Math.max(this.camera.scale, 1e-6);
  }
  /** `hoverHysteresisPx` in world units at the current camera scale. */
  hoverHysteresisWorld() {
    return this.hoverHysteresisPx / Math.max(this.camera.scale, 1e-6);
  }
  /** `hoverNodeIncidencePx` in world units at the current camera scale. */
  hoverIncidenceWorld() {
    return this.hoverNodeIncidencePx / Math.max(this.camera.scale, 1e-6);
  }
};
function strokeWidthOf(spec) {
  return spec.stroke?.width ?? 1;
}
function connectorToleranceSq(spec) {
  const r = strokeWidthOf(spec) / 2 + CONNECTOR_HIT_SLOP;
  return r * r;
}
function beats(kind, zIndex, distSq, best) {
  if (best === null) return true;
  if (zIndex !== best.zIndex) return zIndex > best.zIndex;
  const kindRank = kind === "shape" ? 1 : 0;
  const bestKindRank = best.kind === "shape" ? 1 : 0;
  if (kindRank !== bestKindRank) return kindRank > bestKindRank;
  return distSq < best.distSq;
}

// src/telemetry/withTelemetry.ts
var NoopSink = { emit: () => {
} };
function withTelemetry(store, sink, now = () => Date.now()) {
  return store.subscribeChanges((change) => {
    sink.emit({
      action: change.action ?? "update",
      changedPaths: changedPaths(change.patches),
      patches: change.patches,
      ts: now(),
      ...change.durationMs !== void 0 ? { durationMs: change.durationMs } : {}
    });
  });
}

// src/telemetry/tracing.ts
function createTracingSink(tracer, opts = {}) {
  const prefix = opts.prefix ?? "";
  return {
    emit(e) {
      const attributes = {
        "canvas.changed_paths": e.changedPaths.join(","),
        "canvas.patch_count": e.patches.length
      };
      if (e.durationMs !== void 0) attributes["canvas.duration_ms"] = e.durationMs;
      tracer.startSpan(prefix + e.action, { attributes }).end();
    }
  };
}
function tapAttributes(ev) {
  const attrs = {
    "canvas.source.kind": ev.source.kind,
    "canvas.source.id": ev.source.id
  };
  const p = ev.payload;
  if (!p || typeof p !== "object") return attrs;
  if (typeof p.action === "string") attrs["canvas.action"] = p.action;
  if (typeof p.layerId === "string") attrs["canvas.layer_id"] = p.layerId;
  if (typeof p.id === "string") attrs["canvas.id"] = p.id;
  if (typeof p.durationMs === "number") attrs["canvas.duration_ms"] = p.durationMs;
  if (Array.isArray(p.changedPaths)) attrs["canvas.changed_paths"] = p.changedPaths.join(",");
  if (Array.isArray(p.ids)) attrs["canvas.ids_count"] = p.ids.length;
  const delta = p.delta;
  if (delta && typeof delta === "object" && delta.nodes) {
    attrs["canvas.flush.version"] = delta.version;
    attrs["canvas.flush.nodes_added"] = delta.nodes.added.length;
    attrs["canvas.flush.nodes_changed"] = delta.nodes.changed.length;
    attrs["canvas.flush.nodes_moved"] = delta.nodes.movedAll ? -1 : delta.nodes.moved.length;
    attrs["canvas.flush.nodes_removed"] = delta.nodes.removed.length;
    attrs["canvas.flush.edges_added"] = delta.edges.added.length;
    attrs["canvas.flush.groups_added"] = delta.groups.added.length;
    attrs["canvas.flush.annotations_added"] = delta.annotations.added.length;
  }
  return attrs;
}
function createTapTracer(bus, tracer, opts = {}) {
  const { prefix = "", ...tap } = opts;
  return bus.tap((ev) => {
    tracer.startSpan(prefix + ev.type, { attributes: tapAttributes(ev) }).end();
  }, tap);
}
function setArgAttributes(span, args) {
  args.forEach((arg, i) => {
    if (arg === null || arg === void 0) return;
    const t = typeof arg;
    if (t === "string" || t === "number" || t === "boolean") {
      span.setAttribute(`canvas.arg.${i}`, arg);
    } else if (Array.isArray(arg)) {
      span.setAttribute(`canvas.arg.${i}.count`, arg.length);
    } else if (t === "object") {
      const id = arg.id;
      if (typeof id === "string") span.setAttribute(`canvas.arg.${i}.id`, id);
    }
  });
}
function traceActions(actions, tracer, opts = {}) {
  const prefix = opts.prefix ?? "action:";
  const wrap = (node, path) => {
    const out = {};
    for (const [key, value] of Object.entries(node)) {
      const name = path ? `${path}.${key}` : key;
      if (typeof value === "function") {
        const method = value;
        out[key] = (...args) => {
          const invoke = (span) => {
            setArgAttributes(span, args);
            try {
              return method(...args);
            } finally {
              span.end();
            }
          };
          return tracer.startActiveSpan ? tracer.startActiveSpan(prefix + name, invoke) : invoke(tracer.startSpan(prefix + name));
        };
      } else if (value !== null && typeof value === "object") {
        out[key] = wrap(value, name);
      } else {
        out[key] = value;
      }
    }
    return out;
  };
  return wrap(actions, "");
}
function createConsoleTracer(log = (n, a) => console.debug(`span ${n}`, a)) {
  const tracer = {
    startSpan(name, options) {
      const attrs = { ...options?.attributes ?? {} };
      return {
        setAttribute(k, v) {
          attrs[k] = v;
        },
        end() {
          log(name, attrs);
        }
      };
    },
    startActiveSpan(name, fn) {
      return fn(tracer.startSpan(name));
    }
  };
  return tracer;
}
function createCollectorTracer(now = () => typeof performance !== "undefined" ? performance.now() : Date.now()) {
  const spans = [];
  const tracer = {
    startSpan(name, options) {
      const attributes = { ...options?.attributes ?? {} };
      return {
        setAttribute(k, v) {
          attributes[k] = v;
        },
        end() {
          spans.push({ name, attributes, endedAt: now() });
        }
      };
    },
    startActiveSpan(name, fn) {
      return fn(tracer.startSpan(name));
    }
  };
  return { tracer, spans };
}

// src/telemetry/metrics.ts
function createFrameMetrics(bus, meter, opts = {}) {
  const p = opts.prefix ?? "canvas.";
  const duration = meter.createHistogram(`${p}frame.duration`, {
    description: "Inter-frame period (wall clock)",
    unit: "ms"
  });
  const cpu = meter.createHistogram(`${p}frame.cpu`, {
    description: "Engine CPU cost per frame (camera + data flush + layers)",
    unit: "ms"
  });
  const phase = meter.createHistogram(`${p}frame.phase`, {
    description: "Per-phase CPU cost per frame",
    unit: "ms"
  });
  const count = meter.createCounter(`${p}frame.count`, {
    description: "Rendered frames",
    unit: "{frame}"
  });
  const dropped = meter.createCounter(`${p}frame.dropped`, {
    description: "Long (jank) frames over the threshold",
    unit: "{frame}"
  });
  return bus.on("render:loop:tick", (t) => {
    const at = { interaction: t.interaction };
    duration.record(t.dt, at);
    cpu.record(t.cpuMs, at);
    phase.record(t.phases.camera, { interaction: t.interaction, phase: "camera" });
    phase.record(t.phases.dataFlush, { interaction: t.interaction, phase: "dataFlush" });
    phase.record(t.phases.layers, { interaction: t.interaction, phase: "layers" });
    count.add(1, at);
    if (t.longFrame) dropped.add(1, at);
  });
}
function createInteractionTracer(bus, tracer, opts = {}) {
  const prefix = opts.prefix ?? "canvas.interaction.";
  let activeKind = "idle";
  let span;
  let startTs = 0;
  let frames = 0;
  let minFps = Infinity;
  let maxDt = 0;
  let baselineFps = 0;
  let lastIdleFps = 0;
  const closeSpan = (endTs) => {
    if (!span) return;
    span.setAttribute("canvas.interaction.kind", activeKind);
    span.setAttribute("canvas.frames", frames);
    span.setAttribute("canvas.fps.baseline", Math.round(baselineFps));
    const min = minFps === Infinity ? 0 : Math.round(minFps);
    span.setAttribute("canvas.fps.min", min);
    span.setAttribute("canvas.fps.drop", Math.max(0, Math.round(baselineFps) - min));
    span.setAttribute("canvas.frame.max_ms", Math.round(maxDt * 100) / 100);
    span.setAttribute("canvas.duration_ms", Math.round((endTs - startTs) * 100) / 100);
    span.end();
    span = void 0;
  };
  const openSpan = (kind, ts) => {
    startTs = ts;
    frames = 0;
    minFps = Infinity;
    maxDt = 0;
    baselineFps = lastIdleFps;
    span = tracer.startSpan(prefix + kind);
  };
  return bus.on("render:loop:tick", (t) => {
    if (t.interaction !== activeKind) {
      if (span) closeSpan(t.ts);
      if (t.interaction !== "idle") openSpan(t.interaction, t.ts);
      activeKind = t.interaction;
    }
    if (t.interaction === "idle") {
      lastIdleFps = t.fps;
      return;
    }
    frames += 1;
    if (t.fps < minFps) minFps = t.fps;
    if (t.dt > maxDt) maxDt = t.dt;
  });
}
function createConsoleMeter(log = (n, v, a) => console.debug(`metric ${n}=${v}`, a)) {
  return {
    createHistogram(name) {
      return { record: (value, attributes = {}) => log(name, value, attributes) };
    },
    createCounter(name) {
      return { add: (value, attributes = {}) => log(name, value, attributes) };
    }
  };
}
function createHttpMeter(endpoint, opts = {}) {
  const batchMs = opts.batchMs ?? 1e3;
  const maxBatch = opts.maxBatch ?? 600;
  const post = typeof fetch === "function" ? (records) => {
    void fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(records)
    }).catch(() => {
    });
  } : () => {
  };
  let buffer = [];
  let scheduled = false;
  const flush = () => {
    scheduled = false;
    if (buffer.length === 0) return;
    const batch = buffer;
    buffer = [];
    post(batch);
  };
  const schedule = () => {
    if (scheduled || typeof setTimeout !== "function") return;
    scheduled = true;
    setTimeout(flush, batchMs);
  };
  const push = (name, value, attrs) => {
    buffer.push({ name, value, attrs });
    if (buffer.length >= maxBatch) flush();
    else schedule();
  };
  return {
    createHistogram(name) {
      return { record: (value, attributes = {}) => push(name, value, attributes) };
    },
    createCounter(name) {
      return { add: (value, attributes = {}) => push(name, value, attributes) };
    }
  };
}

// src/telemetry/logging.ts
var LEVEL_RANK = { debug: 10, info: 20, warn: 30, error: 40 };
var LEVEL_BY_TYPE = {
  "canvas:renderer:fallback": "error",
  "tap:dropped": "warn",
  "canvas:renderer:ready": "info",
  "scene:layer:add": "info",
  "scene:layer:remove": "info",
  "scene:layer:visibilitychange": "info",
  "scene:behaviour:register": "info",
  "scene:behaviour:unregister": "info",
  "scene:behaviour:enable": "info",
  "scene:behaviour:disable": "info",
  "scene:layout:add": "info",
  "scene:layout:remove": "info",
  "layout:run:start": "info",
  "layout:run:end": "info",
  "theme:change": "info"
};
var NEVER_LOG = /* @__PURE__ */ new Set([
  "render:loop:tick",
  "data:flush",
  "specs:flush",
  "layout:run:tick"
]);
function logAttributes(ev) {
  const attrs = {
    "canvas.source.kind": ev.source.kind,
    "canvas.source.id": ev.source.id
  };
  const p = ev.payload;
  if (p && typeof p === "object") {
    if (typeof p.id === "string") attrs["canvas.id"] = p.id;
    if (typeof p.layerId === "string") attrs["canvas.layer_id"] = p.layerId;
    if (typeof p.action === "string") attrs["canvas.action"] = p.action;
    if (typeof p.reason === "string") attrs["canvas.reason"] = p.reason;
    if (typeof p.visible === "boolean") attrs["canvas.visible"] = p.visible;
  }
  return attrs;
}
function createLogBridge(bus, logger, opts = {}) {
  const { level = "info", now, ...tap } = opts;
  const threshold = LEVEL_RANK[level];
  const clock2 = now ?? (() => typeof performance !== "undefined" ? performance.now() : Date.now());
  return bus.tap((ev) => {
    if (NEVER_LOG.has(ev.type)) return;
    const evLevel = LEVEL_BY_TYPE[ev.type] ?? "debug";
    if (LEVEL_RANK[evLevel] < threshold) return;
    logger.log({ level: evLevel, message: ev.type, attributes: logAttributes(ev), ts: clock2() });
  }, tap);
}
function createConsoleLogger(sink = console) {
  return {
    log(r) {
      const fn = r.level === "debug" ? sink.debug : r.level === "info" ? sink.info : r.level === "warn" ? sink.warn : sink.error;
      fn(`[canvas] ${r.message}`, r.attributes ?? {});
    }
  };
}
function createCollectorLogger() {
  const records = [];
  return { logger: { log: (r) => records.push(r) }, records };
}

// src/telemetry/config.ts
function wireTelemetry(target, config) {
  const { view, events } = target;
  const offs = [];
  if (config.sink) offs.push(withTelemetry(view, config.sink));
  if (config.traces) {
    const t = config.traces === true ? {} : config.traces;
    const tracer = t.tracer ?? createConsoleTracer();
    offs.push(withTelemetry(view, createTracingSink(tracer)));
    const tap = t.tap ?? {};
    const exclude = tap.exclude ? [...tap.exclude, "render:loop:tick"] : ["render:loop:tick"];
    offs.push(createTapTracer(events, tracer, { ...tap, exclude }));
    offs.push(createInteractionTracer(events, tracer));
  }
  if (config.metrics) {
    const m = config.metrics === true ? {} : config.metrics;
    const meter = m.meter ?? createConsoleMeter();
    offs.push(createFrameMetrics(events, meter));
  }
  if (config.logging) {
    const l = config.logging === true ? {} : typeof config.logging === "string" ? { level: config.logging } : config.logging;
    const logger = l.logger ?? createConsoleLogger();
    offs.push(createLogBridge(events, logger, { level: l.level ?? "info" }));
  }
  return () => {
    for (const off of offs) off();
    offs.length = 0;
  };
}
var OBSERVERS_KEY = /* @__PURE__ */ Symbol.for("@invana/canvas-store:storeObservers");
var globalSlot = globalThis;
var storeObservers = globalSlot[OBSERVERS_KEY] ??= /* @__PURE__ */ new Set();
function onCanvasStoreCreated(observer) {
  storeObservers.add(observer);
  return () => storeObservers.delete(observer);
}
function createCanvasStore(opts = {}) {
  const view = opts.backend === "memory" ? createMemoryStore(defaultCanvasView()) : createReactiveStore(defaultCanvasView());
  const events = new CanvasEventBus();
  const theme = new CanvasThemeState(events);
  view.subscribeChanges((change) => {
    const paths = changedPaths(change.patches);
    const payload = {
      action: change.action,
      changedPaths: paths,
      ...change.durationMs !== void 0 ? { durationMs: change.durationMs } : {}
    };
    events.emit("state:change", payload, { kind: "store", id: "view" });
    if (change.action && change.action.includes(":")) {
      events.publish(change.action, payload, { kind: "store", id: "view" });
    }
  });
  if (opts.telemetry) wireTelemetry({ view, events }, opts.telemetry);
  const data = {};
  const unbridge = {};
  function bridge(id, src) {
    unbridge[id]?.();
    unbridge[id] = src.onFlush(
      (delta) => events.emit("data:flush", { layerId: id, delta }, { kind: "data", id })
    );
  }
  function setSource(id, src) {
    data[id] = src;
    bridge(id, src);
  }
  function source(id) {
    return data[id];
  }
  function layer(id) {
    const existing = data[id];
    if (!existing) {
      const ld = new LayerData();
      setSource(id, ld);
      return ld;
    }
    if (!(existing instanceof LayerData)) {
      throw new Error(
        `CanvasStore.layer('${id}'): a custom DataSource is registered (via setSource) \u2014 use store.source('${id}') / store.data['${id}'].`
      );
    }
    return existing;
  }
  const specs = {};
  function specsFor(id) {
    const existing = specs[id];
    if (existing) return existing;
    const created = new SpecStore();
    specs[id] = created;
    created.onFlush(
      (delta) => events.emit("specs:flush", { layerId: id, delta }, { kind: "data", id })
    );
    return created;
  }
  const actions = createActions(view, layer, events);
  const store = {
    view,
    data,
    specs,
    events,
    theme,
    setSource,
    source,
    layer,
    specsFor,
    actions
  };
  for (const observe of storeObservers) observe(store);
  return store;
}

export { HitIndex, NoopSink, PickingIndex, PlaybookStepError, applyDeepPartial, changedPaths, computeChange, connectorHitBoxes, createCanvasStore, createCollectorLogger, createCollectorTracer, createConsoleLogger, createConsoleMeter, createConsoleTracer, createFrameMetrics, createHttpMeter, createInteractionTracer, createLogBridge, createMemoryStore, createOperationLog, createPlaybook, createReactiveStore, createStoreFromCell, createTapTracer, createTracingSink, historyView, onCanvasStoreCreated, tapAttributes, traceActions, wireTelemetry, withTelemetry };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map