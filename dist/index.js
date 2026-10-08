// src/contracts/SpecProjector.ts
var SpecProjector = class {
  constructor(specs, target, options = {}) {
    this.specs = specs;
    this.target = target;
    this.options = options;
    this.off = specs.onFlush((delta) => this.applyFlush(delta));
  }
  projectedThisFlush = /* @__PURE__ */ new Set();
  off;
  /**
   * Mount / update `id` from the store **now**, and mark it handled so the next
   * flush skips it.
   */
  project(id) {
    this.projectedThisFlush.add(id);
    this.apply(id);
  }
  /** Remove whatever the renderer holds for `id`, whichever kind it is. */
  unproject(id) {
    const t = this.target;
    if (t.getShapeKind(id) !== void 0) t.removeShape(id);
    else if (t.hasConnector(id)) t.removeConnector(id);
  }
  /** Drop the flush subscription. */
  destroy() {
    this.off();
    this.projectedThisFlush.clear();
  }
  applyFlush(delta) {
    for (const id of delta.added) if (!this.projectedThisFlush.has(id)) this.apply(id);
    for (const id of delta.changed) if (!this.projectedThisFlush.has(id)) this.apply(id);
    for (const id of delta.removed) this.unproject(id);
    this.projectedThisFlush.clear();
  }
  apply(id) {
    const spec = this.specs.get(id);
    if (!spec) return;
    const t = this.target;
    if (t.shapeKinds.has(spec.kind)) {
      const shapeSpec = spec;
      const currentKind = t.getShapeKind(id);
      if (currentKind === void 0) {
        t.addShape(id, shapeSpec);
      } else if (currentKind === shapeSpec.kind) {
        t.updateShape(id, shapeSpec);
      } else {
        t.removeShape(id);
        this.options.onKindChange?.(id);
        t.addShape(id, shapeSpec);
      }
      return;
    }
    const connectorSpec = spec;
    if (t.hasConnector(id)) t.updateConnector(id, connectorSpec);
    else t.addConnector(id, connectorSpec);
  }
};

// src/state/events/EventEmitter.ts
var EventEmitter = class {
  map = /* @__PURE__ */ new Map();
  /** Subscribe; returns an unsubscribe. */
  on(type, listener) {
    let set = this.map.get(type);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.map.set(type, set);
    }
    set.add(listener);
    return () => this.off(type, listener);
  }
  /** Subscribe for a single emission. */
  once(type, listener) {
    const off = this.on(type, (payload) => {
      off();
      listener(payload);
    });
    return off;
  }
  /** Unsubscribe a listener. */
  off(type, listener) {
    this.map.get(type)?.delete(listener);
  }
  /** Emit to all listeners of `type` (snapshot, so handlers may unsubscribe). */
  emit(type, payload) {
    const set = this.map.get(type);
    if (!set) return;
    for (const l of [...set]) l(payload);
  }
  removeAllListeners() {
    this.map.clear();
  }
  listenerCount(type) {
    return this.map.get(type)?.size ?? 0;
  }
};

// src/state/events/SourceEmitter.ts
var SourceEmitter = class extends EventEmitter {
  constructor(source) {
    super();
    this.source = source;
  }
  bus = null;
  /** Connect (or disconnect with `null`/`undefined`) this emitter's stream to a bus tap. */
  setBus(bus) {
    this.bus = bus ?? null;
  }
  emit(type, payload) {
    super.emit(type, payload);
    this.bus?.publish(type, payload, this.source);
  }
};

// src/state/data/DirtyBatcher.ts
var DirtyBatcher = class {
  active = makeFrame();
  buffer = makeFrame();
  _dirty = false;
  /** Mark a single id dirty in a bucket. O(1); bucket Sets are created lazily + reused. */
  mark(bucket, id) {
    let set = this.active.buckets.get(bucket);
    if (!set) {
      set = /* @__PURE__ */ new Set();
      this.active.buckets.set(bucket, set);
    }
    set.add(id);
    this._dirty = true;
  }
  /** Flag a whole bucket for rebuild (theme change, LOD swap, wholesale replace). */
  markAll(bucket) {
    this.active.rebuildAll.add(bucket);
    this._dirty = true;
  }
  /** Cheap check the tick uses to decide whether to call {@link flush}. */
  hasPending() {
    return this._dirty;
  }
  /**
   * Swap buffers and return the previous frame's snapshot. The returned Sets are
   * still owned by the batcher — **do not retain references past the flush call**;
   * the next `flush()` reuses and clears them.
   */
  flush() {
    const outgoing = this.active;
    this.active = this.buffer;
    this.buffer = outgoing;
    this._dirty = false;
    for (const set of this.active.buckets.values()) set.clear();
    this.active.rebuildAll.clear();
    return outgoing;
  }
  /** Drop both buffers. Call on unmount; usable again afterwards. */
  reset() {
    for (const set of this.active.buckets.values()) set.clear();
    for (const set of this.buffer.buckets.values()) set.clear();
    this.active.rebuildAll.clear();
    this.buffer.rebuildAll.clear();
    this._dirty = false;
  }
  /** Number of dirty ids in a bucket (0 if never touched). Debug. */
  bucketSize(bucket) {
    return this.active.buckets.get(bucket)?.size ?? 0;
  }
  /** True iff the bucket is flagged for rebuild this frame. Debug. */
  isRebuildAll(bucket) {
    return this.active.rebuildAll.has(bucket);
  }
};
function makeFrame() {
  return {
    buckets: /* @__PURE__ */ new Map(),
    rebuildAll: /* @__PURE__ */ new Set()
  };
}

// src/abstracts/Layer.ts
var Layer = class {
  id;
  /**
   * Stable **class kind** — a minification-safe discriminator matching the
   * `@invana/canvas-ui` settings-editor registry key (e.g. `'background-layer'`,
   * `'minimap-layer'`). Distinct from {@link id} (the per-instance key): all
   * `BackgroundLayer` instances share `kind: 'background-layer'`. Concrete layers
   * set it as a class field; left `undefined` on any that haven't, so consumers
   * fall back (e.g. to the class name). Lets domain-free tooling resolve an
   * instance's editor without an `instanceof` ladder.
   */
  kind;
  options;
  events;
  dirty;
  /**
   * Backing field for {@link state}. Created on **first mount** via
   * `ctx.createStateStore` (the engine injects the reactive-store factory — this
   * package is dependency-free and cannot construct one), then kept for the
   * layer's lifetime: a remount reuses the same store, preserving state.
   */
  _state;
  /**
   * UI / interaction state (`ReactiveStore<TState>`). Because it is built
   * through the injected kernel factory, every write emits patches and history /
   * telemetry / a future CRDT backend all observe it.
   *
   * **Available from `mount()` onward** — accessing it before the first mount
   * throws. (`createState()` is also called at first mount, so it may safely
   * read subclass fields initialised in the subclass constructor.)
   */
  get state() {
    if (!this._state) {
      throw new Error(
        `Layer "${this.id}": state is unavailable before the first mount() \u2014 it is created via ctx.createStateStore when the layer mounts.`
      );
    }
    return this._state;
  }
  /** Backing field for the `visible` accessor. */
  _visible = true;
  hittable;
  zIndex;
  cullable;
  /**
   * Whether this layer renders. Setting `false` hides the layer's pixi
   * container (via `onVisibleChange`, overridden by `WorldLayer` /
   * `ScreenLayer`) and the Canvas tick skips its flush.
   */
  get visible() {
    return this._visible;
  }
  set visible(value) {
    if (this._visible === value) return;
    this._visible = value;
    this.onVisibleChange(value);
  }
  /**
   * Toggle whole-layer visibility, repaint, and announce it. Unlike assigning
   * `visible` (which only hides the pixi container via {@link onVisibleChange}),
   * this also forces a {@link redraw} and emits `scene:layer:visibilitychange`
   * on the canvas bus so dependent layers (minimap) and the render loop react
   * automatically. No-op if the value is unchanged.
   */
  setVisible(visible) {
    if (this._visible === visible) return;
    this.visible = visible;
    if (visible) this.redraw();
    this.ctx?.events.emit("scene:layer:visibilitychange", { id: this.id, visible });
  }
  /** Set by `mount(ctx)`; cleared by `unmount()`. */
  ctx;
  /** True between `mount` and `unmount`. */
  get mounted() {
    return this.ctx !== void 0;
  }
  constructor(opts) {
    this.id = opts.id;
    this.options = opts.options;
    this._visible = opts.visible ?? true;
    this.hittable = opts.hittable ?? true;
    this.zIndex = opts.zIndex ?? 0;
    this.cullable = opts.cullable ?? true;
    this.events = new SourceEmitter({ kind: "layer", id: this.id });
    this.dirty = new DirtyBatcher();
  }
  // ─── Lifecycle ───────────────────────────────────────────────────────────
  mount(ctx) {
    if (this.ctx !== void 0) {
      throw new Error(`Layer "${this.id}" already mounted`);
    }
    this.ctx = ctx;
    this._state ??= ctx.createStateStore(this.createState());
    this.events.setBus(ctx.events);
    this.onMount(ctx);
  }
  unmount() {
    if (this.ctx === void 0) return;
    const ctx = this.ctx;
    this.onUnmount(ctx);
    this.events.setBus(null);
    this.dirty.reset();
    this.ctx = void 0;
  }
  /** Convenience accessor; throws when called pre-mount. */
  get context() {
    if (!this.ctx) {
      throw new Error(`Layer "${this.id}" is not mounted`);
    }
    return this.ctx;
  }
  // ─── Per-tick flush ──────────────────────────────────────────────────────
  /** Whether `flush()` has work to do this frame. */
  hasPending() {
    return this.dirty.hasPending();
  }
  /**
   * Called by Canvas tick when `hasPending()` is true. Swaps the dirty
   * snapshot, hands it to `applyDirty`. Subclasses normally don't override.
   */
  flush() {
    if (!this.dirty.hasPending()) return;
    const snap = this.dirty.flush();
    this.applyDirty(snap);
  }
  /**
   * Force a full repaint of this layer from its current state, bypassing the
   * per-frame dirty path. Base implementation is a no-op — only layers that
   * mount a renderer override it (e.g. `GraphLayer.redraw` re-renders every
   * node and edge). Driven by {@link Canvas.redraw}; reach for it after an
   * external change that sidestepped the normal mutate-and-flush path (theme
   * swap, palette change) or to recover from a suspected render desync.
   */
  redraw() {
  }
  /**
   * Translate a dirty snapshot into renderer / pixi commands.
   * Default: no-op. Override when the layer batches work via `dirty.mark(...)`.
   */
  applyDirty(_snap) {
  }
  /** Domain-specific mount setup (subscribe to peers, attach renderer, etc.). */
  onMount(_ctx) {
  }
  /** Domain-specific unmount teardown. */
  onUnmount(_ctx) {
  }
  /**
   * Called whenever `visible` changes (setter only — not on initial
   * construction). Subclasses override to keep their pixi container's
   * `.visible` in sync. Default: no-op.
   */
  onVisibleChange(_value) {
  }
};

// src/abstracts/Behaviour.ts
var Behaviour = class {
  id;
  targetLayerId;
  shortcuts;
  /**
   * Stable **class kind** — a minification-safe discriminator matching the
   * `@invana/canvas-ui` settings-editor registry key (e.g. `'drag-pan'`,
   * `'wheel-zoom'`). Distinct from {@link id} (the per-instance key): all
   * `DragPanBehaviour` instances share `kind: 'drag-pan'`. Concrete behaviours
   * set it as a class field; left `undefined` on any that haven't, so consumers
   * fall back (e.g. to the class name). Lets domain-free tooling resolve an
   * instance's editor without an `instanceof` ladder.
   */
  kind;
  /**
   * `'layer'` if `targetLayerId` is set, otherwise `'canvas'`. Set automatically
   * from the constructor — subclasses don't need to re-declare.
   */
  scope;
  /**
   * Whether the behaviour is **live**: the developer's flag ({@link enabled})
   * *and* the current interaction mode being one of {@link BehaviourOptions.modes}.
   * Subclasses gate their handlers on this (or {@link isEnabled}); only the base
   * writes it.
   */
  _enabled;
  ctx;
  /** The developer's enable flag — what {@link enabled} reports and snapshots capture. */
  _wanted;
  /** `false` while the canvas's mode is outside {@link BehaviourOptions.modes}. */
  _inMode = true;
  /** Releases the `viewMode` subscription, or `null` when not watching. */
  _modeUnsub = null;
  /**
   * The construction options, merged in-place by {@link setOptions}. Named
   * `_options` (not `options`) so subclasses that expose a bespoke
   * `get options()` snapshot don't collide with it. Subclasses read their live
   * config from here (or from fields re-synced in {@link onOptionsChanged}).
   */
  _options;
  /**
   * Release function for this behaviour's live gesture claim, or `null` when it
   * holds none. Held privately (not `protected`) so the only way to end a claim
   * is {@link releaseGesture} — which nulls the field *before* invoking it, so a
   * double release can't happen even under re-entrancy.
   */
  _gestureRelease = null;
  constructor(opts) {
    this.id = opts.id;
    this.targetLayerId = opts.targetLayerId;
    this.scope = opts.targetLayerId !== void 0 ? "layer" : "canvas";
    this.shortcuts = opts.shortcuts;
    this._wanted = opts.enabled ?? false;
    this._enabled = this._wanted;
    this._options = opts;
  }
  /** The developer's enable flag. A behaviour suspended by its `modes` still reports `true`. */
  get enabled() {
    return this._wanted;
  }
  get isRegistered() {
    return this.ctx !== void 0;
  }
  /** Called by `BehaviourRegistry.register(behaviour)`. Subscribes to inputs. */
  register(ctx) {
    if (this.ctx !== void 0) {
      throw new Error(`Behaviour "${this.id}" already registered`);
    }
    this.ctx = ctx;
    this.onRegister(ctx);
    this.watchMode();
    this._enabled = this._wanted && this._inMode;
    if (this._enabled) this.onEnable();
  }
  /** Called by `BehaviourRegistry.unregister(id)`. Drops subscriptions. */
  destroy() {
    if (this.ctx === void 0) return;
    const ctx = this.ctx;
    this._enabled = false;
    this._wanted = false;
    this.unwatchMode();
    this.onDestroy(ctx);
    this.releaseGesture();
    this.ctx = void 0;
  }
  enable() {
    if (this._wanted) return;
    this._wanted = true;
    this.syncLive();
  }
  disable() {
    if (!this._wanted) return;
    this._wanted = false;
    this.syncLive();
  }
  /**
   * Bring {@link _enabled} in line with `_wanted && _inMode`, running the
   * matching hook on a change. The single place a behaviour goes live or idle.
   */
  syncLive() {
    const live = this._wanted && this._inMode;
    if (live === this._enabled) return;
    this._enabled = live;
    if (live) {
      this.onEnable();
    } else {
      this.onDisable();
      this.releaseGesture();
    }
  }
  /** Is `mode` one this behaviour is live in? */
  matchesMode(mode) {
    const modes = this._options.modes;
    return modes === void 0 || modes.includes(mode);
  }
  /**
   * Follow `view.interaction.viewMode` while registered and `modes` is set;
   * otherwise stop following and count as in-mode. Idempotent — `setOptions`
   * calls it again when `modes` changes.
   */
  watchMode() {
    const ctx = this.ctx;
    if (ctx === void 0 || this._options.modes === void 0) {
      this.unwatchMode();
      this._inMode = true;
      return;
    }
    const view = ctx.store.view;
    this._inMode = this.matchesMode(view.getState().interaction.viewMode);
    if (this._modeUnsub !== null) return;
    this._modeUnsub = view.subscribe((state, prev) => {
      if (state.interaction.viewMode === prev.interaction.viewMode) return;
      this._inMode = this.matchesMode(state.interaction.viewMode);
      this.syncLive();
    });
  }
  unwatchMode() {
    this._modeUnsub?.();
    this._modeUnsub = null;
  }
  /**
   * Merge a serialisable options patch and apply it live. Reflects an `enabled`
   * change by enabling/disabling, then calls {@link onOptionsChanged} so the
   * subclass can apply the rest (re-sync cached fields, re-arm a viewport
   * plugin, recompute). This is the seam the engine's
   * `canvas.update({ behaviours: { [id]: patch } })` path invokes — so a settings
   * editor can retune any behaviour without remounting it.
   *
   * Subclasses with bespoke apply logic (e.g. clearing selection state on a
   * mode change) override this and should call `super.setOptions(changes)` first
   * to keep `_options` — and thus {@link getOptions} — coherent.
   */
  setOptions(changes) {
    this._options = { ...this._options, ...changes };
    if ("modes" in changes) this.setModes(changes.modes);
    if (changes.enabled !== void 0) this.applyEnabled(changes.enabled);
    this.onOptionsChanged(changes);
  }
  /**
   * Apply an `enabled` option. While this instance is the one mounted under its
   * id, the toggle goes through the registry so `scene:behaviour:enable` /
   * `disable` and the gesture-conflict warning fire — calling {@link enable}
   * directly would leave the registry's own `setEnabled` (the engine's
   * `canvas.update` path) a silent no-op. Unmounted, or superseded by a newer
   * instance under the same id, it toggles itself directly.
   */
  applyEnabled(enabled) {
    const registry = this.ctx?.behaviours;
    if (registry && registry.get(this.id) === this) {
      registry.setEnabled(this.id, enabled);
    } else if (enabled) {
      this.enable();
    } else {
      this.disable();
    }
  }
  /**
   * Replace {@link BehaviourOptions.modes} and re-evaluate liveness against the
   * current interaction mode. `undefined` = live in every mode.
   */
  setModes(modes) {
    this._options = { ...this._options, modes };
    this.watchMode();
    this.syncLive();
  }
  /**
   * Merge `changes` into the options {@link getOptions} returns — and nothing
   * else: no enable / disable, no mode re-wiring, no {@link onOptionsChanged}.
   *
   * For subclasses that override {@link setOptions} with their own apply logic
   * and don't call `super`: call this first so `getOptions()` (a settings
   * editor's seed, the engine's undo baseline) stays current. Prefer it to
   * `super.setOptions` there: the engine routes `enabled` / `modes` through
   * the registry itself, and the base's direct `enable()` would pre-empt the
   * registry's `scene:behaviour:enable` event.
   */
  recordOptions(changes) {
    this._options = { ...this._options, ...changes };
  }
  /** Snapshot of the current (merged) options — seeds a settings editor. */
  getOptions() {
    return this._options;
  }
  /**
   * Contribute this behaviour's serialisable config to a canvas-state snapshot
   * (the engine's `DefinitionSerializable` contract). The base implementation
   * captures the explicit `enabled` flag (rule 7). Subclasses with additional
   * JSON-serialisable options should override and spread `super.serializeDefinition()`.
   */
  serializeDefinition() {
    const modes = this._options.modes;
    return modes === void 0 ? { enabled: this._wanted } : { enabled: this._wanted, modes: [...modes] };
  }
  /** Cleanup on destroy. Default no-op. */
  onDestroy(_ctx) {
  }
  /** Hook fired when the developer enables the behaviour. */
  onEnable() {
  }
  /** Hook fired on disable. */
  onDisable() {
  }
  /**
   * Hook fired after {@link setOptions} merges a patch (and after any `enabled`
   * toggle is applied). Default no-op. Override to apply an option change live:
   * a behaviour whose effect is wired in {@link onEnable} (a pixi-viewport
   * plugin, a DOM listener) re-arms here; one that caches option values in
   * fields re-syncs them from `this._options` here. `changes` is the raw patch;
   * `this._options` already holds the merged result.
   */
  onOptionsChanged(_changes) {
  }
  /**
   * Convenience `if (!enabled) return;` for use inside event handlers
   * (without rebinding `this` cost). `false` while suspended by `modes`.
   */
  get isEnabled() {
    return this._enabled;
  }
  // ─── Gesture arbitration ─────────────────────────────────────────────────
  /**
   * Take exclusive ownership of the pointer gesture for the duration of a drag
   * (`ctx.gestures`, see `input/GestureArbiter.ts`). Returns `false` when
   * another behaviour already owns it — the caller must then **not** start its
   * gesture, because two behaviours steering the same pointer is exactly what
   * the arbiter exists to prevent.
   *
   * Claiming also suspends camera panning: `DragPanBehaviour` watches the
   * arbiter and yields while anybody else owns the gesture. That replaces the
   * old `camera.viewport.plugins.pause('drag')` reach-through, which put a
   * `pixi-viewport` internal in the hands of domain behaviours.
   *
   * Pair every successful claim with {@link releaseGesture} on **every** exit
   * path — pointerup, pointercancel, abort. `disable()` and `destroy()` release
   * automatically as a backstop.
   */
  claimGesture(opts) {
    const gestures = this.ctx?.gestures;
    if (!gestures) return false;
    const release = gestures.claim(this.id, opts);
    if (release === null) return false;
    this._gestureRelease = release;
    return true;
  }
  /**
   * End this behaviour's gesture claim. Safe to call any number of times and
   * when no claim is held — the arbiter identifies claims by token, so a stale
   * release can never evict a later owner.
   */
  releaseGesture() {
    const release = this._gestureRelease;
    this._gestureRelease = null;
    release?.();
  }
  /** Does this behaviour currently hold the gesture? */
  get hasGestureClaim() {
    return this._gestureRelease !== null;
  }
  /**
   * Re-run {@link onDisable} then {@link onEnable} when the behaviour is live, so
   * an option change wired at enable-time (a pixi-viewport plugin, a listener
   * bound with the old config) picks up `this._options`. No-op when disabled or
   * unregistered (the next {@link onEnable} will read the fresh options anyway).
   * The idiomatic body of an {@link onOptionsChanged} override for such
   * behaviours.
   */
  reArm() {
    if (this._enabled && this.ctx !== void 0) {
      this.onDisable();
      this.onEnable();
    }
  }
};

// src/abstracts/Layout.ts
var Layout = class {
  /** Stable id (registry / config key). */
  id;
  /** The layer this layout targets, if declared at construction. */
  targetLayerId;
  /**
   * Stable **class kind** — a minification-safe discriminator matching the
   * `@invana/canvas-ui` settings-editor registry key (e.g. `'d3-force-layout'`,
   * `'elk-layout'`). Distinct from {@link id} (the per-instance key): all
   * `D3ForceLayout` instances share `kind: 'd3-force-layout'`. Concrete layouts
   * set it as a class field; left `undefined` on any that haven't, so consumers
   * fall back (e.g. to the class name). Lets domain-free tooling resolve an
   * instance's editor without an `instanceof` ladder.
   */
  kind;
  /**
   * Lifecycle event bus. See class docs for the event vocabulary.
   * Subclasses with richer telemetry can declare their own typed
   * emitter on top (`override readonly events = new EventEmitter<MyEvents>()`).
   */
  events = new EventEmitter();
  /**
   * Options of the run in flight, or of the last one once it has ended.
   * Implementations record them at the top of {@link apply}, so an `end`
   * listener can tell what kind of run just finished — e.g. a fitter skipping
   * a {@link LayoutRunOptions.preserveCamera} run.
   */
  runOptions = {};
  /**
   * How data-triggered re-runs behave while this layout is active (throttle,
   * keep the camera). Mutable: the wiring reads it on every data change.
   */
  onData;
  constructor(opts = {}) {
    this.id = opts.id ?? "layout";
    this.targetLayerId = opts.targetLayerId;
    this.onData = { ...opts.onData ?? {} };
  }
  /**
   * Live-reconfigure. Called by `Canvas.update({ layouts: { id: patch } })`.
   * Default no-op; iterative layouts (e.g. `D3ForceLayout`) override to merge
   * the patch and re-heat a running simulation.
   */
  setOptions(_patch) {
  }
  /**
   * Contribute this layout's serialisable config to a canvas-state snapshot (the
   * engine's `DefinitionSerializable` contract). The base captures the wiring
   * `targetLayerId`; iterative layouts holding tunable params (e.g. force
   * strengths) should override and spread `super.serializeDefinition()` with a
   * JSON-safe copy of those params.
   */
  serializeDefinition() {
    const out = {};
    if (this.targetLayerId !== void 0) out.targetLayerId = this.targetLayerId;
    if (Object.keys(this.onData).length > 0) out.onData = { ...this.onData };
    return Object.keys(out).length > 0 ? out : void 0;
  }
};

// src/abstracts/GestureArbiter.ts
var DefaultGestureArbiter = class {
  active = null;
  listeners = /* @__PURE__ */ new Set();
  get owner() {
    return this.active?.owner ?? null;
  }
  claim(owner, opts) {
    const priority = opts?.priority ?? 0;
    const current = this.active;
    const sameOwner = current?.owner === owner;
    if (current && !sameOwner && priority <= current.priority) return null;
    const token = Symbol(owner);
    this.active = { owner, priority, token, onRevoke: opts?.onRevoke };
    if (current && !sameOwner) current.onRevoke?.();
    if (!sameOwner) this.emit();
    return () => this.release(token);
  }
  onOwnerChange(listener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
  /**
   * Drop the claim identified by `token`. A stale token — from a released or
   * pre-empted claim — is ignored, which is what makes double-release safe.
   */
  release(token) {
    if (this.active?.token !== token) return;
    this.active = null;
    this.emit();
  }
  /** Snapshot before iterating: a listener may unsubscribe from inside itself. */
  emit() {
    const owner = this.owner;
    for (const listener of [...this.listeners]) listener(owner);
  }
};

// src/state/port/select.ts
function defaultEqual(a, b) {
  return Object.is(a, b);
}
function shallowEqual(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== "object" || a === null || typeof b !== "object" || b === null) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  for (const k of ak) {
    if (!Object.is(a[k], b[k])) return false;
  }
  return true;
}
function select(store, selector, isEqual = defaultEqual) {
  return {
    get: () => selector(store.getState()),
    subscribe: (onChange) => {
      let current = selector(store.getState());
      return store.subscribe((state) => {
        const next = selector(state);
        if (!isEqual(current, next)) {
          current = next;
          onChange();
        }
      });
    }
  };
}

// src/lib/animation/easings.ts
var linear = (t) => t;
var easeInOutSine = (t) => -(Math.cos(Math.PI * t) - 1) / 2;
var easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
var easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
var easeOutQuad = (t) => 1 - (1 - t) * (1 - t);
var EASINGS = {
  linear,
  easeInOutSine,
  easeOutCubic,
  easeInOutCubic,
  easeOutQuad
};
var EASING_NAMES = Object.keys(EASINGS);
function resolveEasing(name, fallback = easeOutCubic) {
  return name && EASINGS[name] || fallback;
}

// src/lib/animation/Tween.ts
var Tween = class {
  opts;
  easing;
  maxRepeat;
  elapsed = 0;
  cycle = 0;
  _value;
  _done = false;
  constructor(opts) {
    this.opts = opts;
    this.easing = opts.easing ?? linear;
    this.maxRepeat = opts.repeat === "forever" ? Number.POSITIVE_INFINITY : opts.repeat ?? 0;
    this._value = opts.from;
  }
  get value() {
    return this._value;
  }
  get done() {
    return this._done;
  }
  /**
   * Advance by `dt` milliseconds. Returns `false` when the tween has finished
   * its final cycle; callers should remove finished tweens from their tick
   * set. Returns `true` while still running (including indefinitely for
   * `repeat: 'forever'`).
   */
  tick(dt) {
    if (this._done) return false;
    this.elapsed += dt;
    const { duration, from, to, onUpdate, onComplete } = this.opts;
    const yoyo = this.opts.yoyo ?? false;
    while (this.elapsed >= duration && this.cycle < this.maxRepeat) {
      this.elapsed -= duration;
      this.cycle += 1;
    }
    if (this.cycle >= this.maxRepeat && this.elapsed >= duration) {
      const reversed2 = yoyo && this.maxRepeat % 2 === 1;
      this._value = reversed2 ? from : to;
      this._done = true;
      onUpdate?.(this._value);
      onComplete?.();
      return false;
    }
    const t = this.elapsed / duration;
    const eased = this.easing(t);
    const reversed = yoyo && this.cycle % 2 === 1;
    this._value = reversed ? to + (from - to) * eased : from + (to - from) * eased;
    onUpdate?.(this._value);
    return true;
  }
  /** Restart from `from`. Clears `done`. */
  reset() {
    this.elapsed = 0;
    this.cycle = 0;
    this._done = false;
    this._value = this.opts.from;
  }
};

// src/abstracts/Camera.ts
var Camera = class {
  /**
   * The renderer's viewport, behind the pixi-free binding seam. **Private** —
   * nothing outside this class reaches the backend, which is what lets P6 move
   * the realisation into `@invana/renderer-pixijs` without a public break.
   */
  binding;
  bus;
  _screenWidth;
  _screenHeight;
  _minScale;
  _maxScale;
  /** Kernel store (optional) — the home of the abstract `interaction.camera` transform. */
  store;
  /** Re-entrancy guard so binding↔store sync never ping-pongs. */
  _syncing = false;
  /** Unsubscribe for the `interaction.camera` slice subscription. */
  _offStoreCam;
  /** Unsubscribe for the binding's backend-driven transform reports. */
  _offBindingChange;
  /** Whether drag-panning is currently yielded to another gesture owner. */
  _dragSuspended = false;
  /**
   * In-flight {@link animateTo} tween, or `null`. Holds the endpoints and the
   * eased progress; {@link tick} advances it and writes the interpolated
   * transform through {@link binding} directly, bypassing the public mutators
   * so it cannot cancel itself.
   */
  _fitTween = null;
  constructor(opts) {
    this.binding = opts.binding;
    this.bus = opts.bus;
    this.store = opts.store;
    this._screenWidth = opts.screenWidth;
    this._screenHeight = opts.screenHeight;
    this._minScale = opts.minScale ?? 0.01;
    this._maxScale = opts.maxScale ?? 100;
    this.binding.setTransform({
      x: opts.initialX ?? 0,
      y: opts.initialY ?? 0,
      zoom: this.clampScale(opts.initialScale ?? 1)
    });
    this._offBindingChange = this.binding.onTransformChange((kind) => {
      this.cancelAnimation();
      const t = this.binding.getTransform();
      if (kind === "zoom") {
        this.bus?.emit("input:camera:zoom", {
          scale: t.zoom,
          centerX: this._screenWidth / 2,
          centerY: this._screenHeight / 2
        });
      }
      this.bus?.emit("input:camera:pan", { x: t.x, y: t.y });
      this.pushToStore();
    });
    if (this.store) {
      this.pushToStore();
      const cameraSlice = select(this.store.view, (s) => s.interaction.camera);
      this._offStoreCam = cameraSlice.subscribe(() => this.applyFromStore());
    }
  }
  /**
   * Push the current transform into `store.view.interaction.camera`. Called from
   * every camera mutation (gesture + programmatic). No-op when the store already
   * matches or a store→binding apply is in flight.
   */
  pushToStore() {
    if (!this.store || this._syncing) return;
    const { x, y, zoom } = this.binding.getTransform();
    const cur = this.store.view.getState().interaction.camera;
    if (cur.x === x && cur.y === y && cur.zoom === zoom) return;
    this._syncing = true;
    try {
      this.store.actions.camera.set({ x, y, zoom });
    } finally {
      this._syncing = false;
    }
  }
  /**
   * Apply `store.view.interaction.camera` onto the binding — realises an external
   * `actions.camera.*` write. No-op when the binding already matches or a
   * binding→store push is in flight.
   */
  applyFromStore() {
    if (!this.store || this._syncing) return;
    const c = this.store.view.getState().interaction.camera;
    const cur = this.binding.getTransform();
    if (cur.x === c.x && cur.y === c.y && cur.zoom === c.zoom) return;
    this._syncing = true;
    try {
      this.binding.setTransform({ x: c.x, y: c.y, zoom: this.clampScale(c.zoom) });
    } finally {
      this._syncing = false;
    }
  }
  // ─── Read accessors ──────────────────────────────────────────────────────
  /** Current uniform scale. */
  get scale() {
    return this.binding.getTransform().zoom;
  }
  /** Current world-container x in screen pixels. (Where world (0,0) sits.) */
  get x() {
    return this.binding.getTransform().x;
  }
  get y() {
    return this.binding.getTransform().y;
  }
  get screenWidth() {
    return this._screenWidth;
  }
  get screenHeight() {
    return this._screenHeight;
  }
  // ─── Mutators ────────────────────────────────────────────────────────────
  /**
   * Set absolute world-container offset. `(x, y)` is where world (0,0) lives
   * in screen pixels. Most consumers want `pan(dx, dy)` instead.
   */
  setPosition(x, y) {
    this.cancelAnimation();
    const cur = this.binding.getTransform();
    if (x === cur.x && y === cur.y) return;
    this.binding.setTransform({ x, y, zoom: cur.zoom });
    this.bus?.emit("input:camera:pan", { x, y });
    this.pushToStore();
  }
  /** Pan by `(dx, dy)` screen pixels. */
  pan(dx, dy) {
    if (dx === 0 && dy === 0) return;
    this.setPosition(this.x + dx, this.y + dy);
  }
  /**
   * Write an absolute `{ x, y, zoom }` transform in one step — the seam for a
   * layer mirroring an **external** camera authority (a MapLibre basemap, a
   * remote collaborator's viewport, a replayed session).
   *
   * Unlike `setZoom` + `setPosition`, this re-anchors nothing: the transform
   * lands exactly as given, because the external authority has already solved
   * for it and any re-anchoring here would desync the two views. `zoom` is
   * emitted only when it actually changed — most mirrored gestures are pan-only
   * and the `input:camera:zoom` listeners are O(N) over their tracked elements.
   *
   * @param t      The transform to apply.
   * @param opts.clamp  Apply the camera's min/max zoom clamp. Default `true`.
   *   Pass `false` when mirroring an authority with its own scale range — a web
   *   mercator basemap runs to `2 ** 22`, far past the camera's default ceiling
   *   of 100, and clamping would silently peg the canvas away from the map.
   */
  setTransform(t, opts) {
    this.cancelAnimation();
    const zoom = opts?.clamp === false ? t.zoom : this.clampScale(t.zoom);
    const cur = this.binding.getTransform();
    const zoomChanged = zoom !== cur.zoom;
    if (!zoomChanged && t.x === cur.x && t.y === cur.y) return;
    this.binding.setTransform({ x: t.x, y: t.y, zoom });
    if (zoomChanged) {
      this.bus?.emit("input:camera:zoom", {
        scale: zoom,
        centerX: this._screenWidth / 2,
        centerY: this._screenHeight / 2
      });
    }
    this.bus?.emit("input:camera:pan", { x: t.x, y: t.y });
    this.pushToStore();
  }
  /**
   * Set absolute scale, anchored at the viewport centre. The world point at
   * the centre stays put. For zoom-around-an-arbitrary-point semantics use
   * `zoomAt`.
   */
  setZoom(scale) {
    this.cancelAnimation();
    const next = this.clampScale(scale);
    if (next === this.scale) return;
    this.binding.zoomToCentre(next);
    this.bus?.emit("input:camera:zoom", {
      scale: next,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2
    });
    this.bus?.emit("input:camera:pan", { x: this.x, y: this.y });
    this.pushToStore();
  }
  /**
   * Multiply scale by `factor`, holding the world point under the screen
   * cursor `(centerX, centerY)` in place. Default centre = viewport centre.
   *
   * Bindings offer only centre-anchored zoom, so the arbitrary-anchor math is
   * done here: project the anchor to world, change scale, then translate so the
   * same world point lands at the same screen point.
   */
  zoomAt(factor, centerX = this._screenWidth / 2, centerY = this._screenHeight / 2) {
    this.cancelAnimation();
    const before = this.toWorld(centerX, centerY);
    const nextScale = this.clampScale(this.scale * factor);
    if (nextScale === this.scale) return;
    this.binding.setTransform({
      x: centerX - before.x * nextScale,
      y: centerY - before.y * nextScale,
      zoom: nextScale
    });
    this.bus?.emit("input:camera:zoom", { scale: nextScale, centerX, centerY });
    this.bus?.emit("input:camera:pan", { x: this.x, y: this.y });
    this.pushToStore();
  }
  /**
   * Fit a world-space rectangle into the viewport. Scales so the whole rect
   * is visible (limited by the smaller axis), centres it. `padding` is in
   * screen pixels around the rect.
   */
  fitContent(worldRect, padding = 24) {
    this.cancelAnimation();
    if (!worldRect) return;
    const availW = Math.max(1, this._screenWidth - padding * 2);
    const availH = Math.max(1, this._screenHeight - padding * 2);
    const scaleX = availW / Math.max(1, worldRect.width);
    const scaleY = availH / Math.max(1, worldRect.height);
    const next = this.clampScale(Math.min(scaleX, scaleY));
    const cx = worldRect.x + worldRect.width / 2;
    const cy = worldRect.y + worldRect.height / 2;
    const tx = this._screenWidth / 2 - cx * next;
    const ty = this._screenHeight / 2 - cy * next;
    this.binding.setTransform({ x: tx, y: ty, zoom: next });
    this.bus?.emit("input:camera:zoom", {
      scale: next,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2
    });
    this.bus?.emit("input:camera:pan", { x: tx, y: ty });
    this.pushToStore();
  }
  /**
   * Centre the viewport on a world-space point — pan so `(worldX, worldY)`
   * maps to the screen centre, keeping the current zoom. The pan-only
   * counterpart to {@link fitContent}: use it for "focus" / "go to" actions
   * that should locate a target without rescaling the view.
   *
   * By default the pan is applied at once. Pass a positive `durationMs` to
   * glide there instead — the move then runs through {@link animateTo}, so it
   * follows the same rules: eased, and cancelled by any other camera write.
   *
   * @param durationMs Length of the glide. Absent or `<= 0` pans immediately.
   * @param easing     Named curve for the glide; defaults to `'easeOutCubic'`.
   * @param onDone     Called once the camera is on target (immediately when
   *                   not gliding; never when a glide is cancelled).
   */
  centerOn(worldX, worldY, { durationMs = 0, easing, onDone } = {}) {
    const scale = this.scale;
    const tx = this._screenWidth / 2 - worldX * scale;
    const ty = this._screenHeight / 2 - worldY * scale;
    if (durationMs > 0) {
      this.animateTo(
        { x: tx, y: ty, zoom: scale },
        { durationMs, ...easing ? { easing } : {}, ...onDone ? { onDone } : {} }
      );
      return;
    }
    this.cancelAnimation();
    this.binding.setTransform({ x: tx, y: ty, zoom: scale });
    this.bus?.emit("input:camera:pan", { x: tx, y: ty });
    this.pushToStore();
    onDone?.();
  }
  /** Update on viewport resize. Forwarded so the binding's own math stays correct. */
  resize(screenWidth, screenHeight) {
    this._screenWidth = screenWidth;
    this._screenHeight = screenHeight;
    this.binding.resize(screenWidth, screenHeight);
  }
  // ─── Projection ──────────────────────────────────────────────────────────
  /** Screen → world. */
  toWorld(screenX, screenY) {
    return this.binding.toWorld(screenX, screenY);
  }
  /** World → screen. */
  toScreen(worldX, worldY) {
    return this.binding.toScreen(worldX, worldY);
  }
  /**
   * The world-space rectangle currently visible. Used by viewport culling
   * (per `decorations-plan.md` §11.6) and minimap layers.
   */
  getVisibleBounds() {
    return this.binding.getVisibleBounds();
  }
  // ─── Input configuration ─────────────────────────────────────────────────
  /**
   * Configure the camera's own pan / zoom inputs. This is the seam camera-input
   * behaviours use instead of naming a backend plugin: the options are described
   * semantically (`percent`, `modifier`) and the realisation lives in the
   * binding, so `DragPanBehaviour` / `WheelZoomBehaviour` / `PinchZoomBehaviour`
   * survive the renderer swap unchanged.
   *
   * Patch semantics — an omitted key is left alone, `null` removes that input:
   *
   * ```ts
   * camera.configureInput({ wheel: { percent: 0.2, modifier: 'control' } });
   * camera.configureInput({ wheel: null });   // wheel zoom off, pinch untouched
   * ```
   *
   * Re-configuring an already-installed input replaces it, because the
   * underlying inputs read their config only at install time.
   */
  configureInput(config) {
    if (config.drag !== void 0) this._dragSuspended = false;
    this.binding.configureInput(config);
  }
  /**
   * Suspend / restore drag-panning without tearing the input down. This is how
   * gesture arbitration yields the camera: while another behaviour owns the
   * pointer (a node drag, a lasso, a resize) panning is suspended, and it
   * resumes when that gesture releases.
   *
   * Momentum is deliberately left running, so an in-flight glide finishes as it
   * always has. Edge-triggered — restoring resets the underlying input, so a
   * repeated call in the same state is a no-op.
   */
  setDragSuspended(suspended) {
    if (suspended === this._dragSuspended) return;
    this._dragSuspended = suspended;
    this.binding.setDragSuspended(suspended);
  }
  /**
   * Subscribe to the start of a drag-pan gesture — fired once the pointer has
   * actually moved enough to pan. `DragPanBehaviour` uses it as the cursor
   * fallback for the `space` modifier, which can't be read off a pointer event.
   *
   * @returns an unsubscribe function.
   */
  onDragStart(fn) {
    return this.binding.onDragStart(fn);
  }
  // ─── Internal ────────────────────────────────────────────────────────────
  /**
   * Ease the camera to an absolute transform over `durationMs`, instead of
   * snapping to it.
   *
   * The animated counterpart of {@link setTransform}, and the mechanism behind
   * `CanvasConfig.fitAnimation`: the first auto-fit of a canvas can glide into
   * frame rather than cutting. `x`, `y` and `zoom` are interpolated together on
   * one eased curve, so the move reads as a single gesture.
   *
   * **Any other camera write cancels it.** A user who pans or zooms mid-glide
   * owns the camera from that moment — an animation that fought back would be
   * the `fitOnResize` mistake in a different costume (`D7`). The tween is also
   * dropped, not finished, so `onDone` does not fire.
   *
   * Requires {@link tick} to be called each frame, which `Canvas.tickOnce` does.
   *
   * @param to         Target transform. `zoom` is clamped like any other write.
   * @param durationMs Length of the glide. `<= 0` applies `to` immediately.
   * @param easing     Named curve; defaults to `'easeOutCubic'`.
   * @param onDone     Called once the glide completes naturally.
   */
  animateTo(to, { durationMs = 400, easing, onDone } = {}) {
    const target = { x: to.x, y: to.y, zoom: this.clampScale(to.zoom) };
    if (durationMs <= 0) {
      this.setTransform(target);
      onDone?.();
      return;
    }
    this._fitTween = null;
    const from = this.binding.getTransform();
    this._fitTween = {
      from: { x: from.x, y: from.y, zoom: from.zoom },
      to: target,
      tween: new Tween({ from: 0, to: 1, duration: durationMs, easing: resolveEasing(easing) }),
      ...onDone ? { onDone } : {}
    };
  }
  /**
   * Drop an in-flight {@link animateTo} without finishing it. Called by every
   * public transform mutator, so whoever writes last owns the camera.
   */
  cancelAnimation() {
    this._fitTween = null;
  }
  /** Whether an {@link animateTo} glide is currently running. */
  get isAnimating() {
    return this._fitTween !== null;
  }
  /**
   * Advance time-based input animation (momentum, snap). Called by
   * `Canvas.tickOnce()` every frame — the engine owns the only clock (G3).
   * No-op until a camera-input behaviour enables an input that animates.
   */
  tick(dt) {
    this.binding.tick(dt);
    this.advanceAnimation(dt);
  }
  /**
   * Step an {@link animateTo} glide. Writes through {@link binding} rather than
   * the public mutators — those cancel the tween, which would end the glide on
   * its own first frame.
   */
  advanceAnimation(dt) {
    const anim = this._fitTween;
    if (!anim) return;
    const running = anim.tween.tick(dt);
    const t = anim.tween.value;
    const x = anim.from.x + (anim.to.x - anim.from.x) * t;
    const y = anim.from.y + (anim.to.y - anim.from.y) * t;
    const zoom = anim.from.zoom + (anim.to.zoom - anim.from.zoom) * t;
    this.binding.setTransform({ x, y, zoom });
    this.bus?.emit("input:camera:zoom", {
      scale: zoom,
      centerX: this._screenWidth / 2,
      centerY: this._screenHeight / 2
    });
    this.bus?.emit("input:camera:pan", { x, y });
    this.pushToStore();
    if (running) return;
    this._fitTween = null;
    this.setTransform(anim.to);
    anim.onDone?.();
  }
  /** Tear down subscriptions. Called by `Canvas.destroy`. */
  dispose() {
    this._offStoreCam?.();
    this._offStoreCam = void 0;
    this._offBindingChange?.();
    this._offBindingChange = void 0;
  }
  clampScale(scale) {
    if (scale < this._minScale) return this._minScale;
    if (scale > this._maxScale) return this._maxScale;
    return scale;
  }
};

// src/abstracts/registries/LayerRegistry.ts
var LayerRegistry = class {
  layers = /* @__PURE__ */ new Map();
  getContext;
  bus;
  /** Cached z-sorted view; invalidated on add/remove/setZIndex. */
  zOrderCache = null;
  constructor(opts) {
    this.getContext = opts.getContext;
    this.bus = opts.bus;
  }
  /** Number of registered layers. */
  get size() {
    return this.layers.size;
  }
  /**
   * Add a Layer to the canvas. Mounts immediately if the Canvas is initialised;
   * otherwise the layer waits for `mountAll()` (called by `Canvas.init`). Fires
   * `layer:added`. Throws if `id` is already registered.
   */
  add(layer) {
    if (this.layers.has(layer.id)) {
      throw new Error(`LayerRegistry: layer "${layer.id}" already registered`);
    }
    this.layers.set(layer.id, layer);
    this.zOrderCache = null;
    const ctx = this.getContext();
    if (ctx) layer.mount(ctx);
    this.bus.emit("scene:layer:add", { id: layer.id });
  }
  /** Mount every not-yet-mounted layer. Called by `Canvas.init` once the context exists. */
  mountAll() {
    const ctx = this.getContext();
    if (!ctx) return;
    for (const layer of this.layers.values()) {
      if (!layer.mounted) layer.mount(ctx);
    }
  }
  /**
   * Remove a Layer. Calls `layer.unmount()` and fires `layer:removed`.
   * No-op if `id` isn't registered.
   */
  remove(id) {
    const layer = this.layers.get(id);
    if (!layer) return;
    this.layers.delete(id);
    this.zOrderCache = null;
    layer.unmount();
    this.bus.emit("scene:layer:remove", { id });
  }
  /** Typed get by id. Returns `undefined` if not found. */
  get(id) {
    return this.layers.get(id);
  }
  has(id) {
    return this.layers.has(id);
  }
  /** Snapshot of all layers in insertion order. */
  list() {
    return Array.from(this.layers.values());
  }
  /**
   * Iterate layers in z-order (low → high). The Canvas tick walks layers in
   * z-order to flush dirty work; rendering order is then determined by
   * pixi's child order (handled by `SurfaceManager.setWorldLayerZ`).
   *
   * The result is cached and reused until `add` / `remove` / `setZIndex` invalidates.
   */
  byZOrder() {
    if (this.zOrderCache !== null) return this.zOrderCache;
    const arr = Array.from(this.layers.values());
    arr.sort((a, b) => a.zIndex - b.zIndex);
    this.zOrderCache = arr;
    return arr;
  }
  /**
   * Update a layer's `zIndex` and propagate to surfaces. Invalidates the
   * z-order cache. No-op if the layer isn't registered.
   */
  setZIndex(id, zIndex) {
    const layer = this.layers.get(id);
    if (!layer) return;
    layer.zIndex = zIndex;
    this.zOrderCache = null;
  }
  /**
   * Tear down every registered layer. Called on Canvas destroy.
   * Iteration is over a snapshot so unmount-triggered side effects don't
   * corrupt the loop.
   */
  clear() {
    for (const id of [...this.layers.keys()]) this.remove(id);
  }
};

// src/abstracts/registries/BehaviourRegistry.ts
var BehaviourRegistry = class {
  behaviours = /* @__PURE__ */ new Map();
  getContext;
  bus;
  constructor(opts) {
    this.getContext = opts.getContext;
    this.bus = opts.bus;
  }
  get size() {
    return this.behaviours.size;
  }
  /**
   * Register a Behaviour. Wires it (`behaviour.register(ctx)` + events) now if
   * the Canvas is initialised; otherwise it's stored and wired later by
   * `registerAll()` (called by `Canvas.init`). Throws on duplicate id.
   *
   * When wiring throws (the behaviour rejects its context — a missing target
   * layer, a second instance of a one-per-layer kind), the entry is removed
   * before the error propagates, so a rejected behaviour never shows up in
   * {@link list} and its id stays free.
   */
  register(behaviour) {
    if (this.behaviours.has(behaviour.id)) {
      throw new Error(`BehaviourRegistry: behaviour "${behaviour.id}" already registered`);
    }
    this.behaviours.set(behaviour.id, behaviour);
    const ctx = this.getContext();
    if (!ctx) return;
    try {
      this.wire(behaviour, ctx);
    } catch (err) {
      this.behaviours.delete(behaviour.id);
      throw err;
    }
  }
  /** Wire every not-yet-registered behaviour. Called by `Canvas.init` (after layers mount). */
  registerAll() {
    const ctx = this.getContext();
    if (!ctx) return;
    for (const behaviour of [...this.behaviours.values()]) {
      if (behaviour.isRegistered) continue;
      try {
        this.wire(behaviour, ctx);
      } catch (err) {
        this.behaviours.delete(behaviour.id);
        throw err;
      }
    }
  }
  /** `behaviour.register(ctx)` + the registered/enabled events. */
  wire(behaviour, ctx) {
    behaviour.register(ctx);
    this.bus.emit("scene:behaviour:register", { id: behaviour.id });
    if (behaviour.enabled) {
      this.bus.emit("scene:behaviour:enable", { id: behaviour.id });
      this.warnOnShortcutConflict(behaviour);
    }
  }
  /**
   * Remove a behaviour. Calls `destroy()`, then fires
   * `'scene:behaviour:unregister'` (after `'scene:behaviour:disable'` when it
   * was enabled). No-op if not registered.
   */
  unregister(id) {
    const b = this.behaviours.get(id);
    if (!b) return;
    if (b.enabled) {
      b.disable();
      this.bus.emit("scene:behaviour:disable", { id });
    }
    this.behaviours.delete(id);
    b.destroy();
    this.bus.emit("scene:behaviour:unregister", { id });
  }
  /** Enable / disable a behaviour. Fires the corresponding bus event. */
  setEnabled(id, enabled) {
    const b = this.behaviours.get(id);
    if (!b) return;
    if (b.enabled === enabled) return;
    if (enabled) {
      b.enable();
      this.bus.emit("scene:behaviour:enable", { id });
      this.warnOnShortcutConflict(b);
    } else {
      b.disable();
      this.bus.emit("scene:behaviour:disable", { id });
    }
  }
  get(id) {
    return this.behaviours.get(id);
  }
  has(id) {
    return this.behaviours.has(id);
  }
  list() {
    return Array.from(this.behaviours.values());
  }
  /** Tear down all behaviours. Called on Canvas destroy. */
  clear() {
    for (const id of [...this.behaviours.keys()]) this.unregister(id);
  }
  // ─── Conflict detection ──────────────────────────────────────────────────
  warnOnShortcutConflict(b) {
    if (!b.shortcuts || b.shortcuts.length === 0) return;
    for (const peer of this.behaviours.values()) {
      if (peer === b) continue;
      if (!peer.enabled || !peer.shortcuts) continue;
      for (const gesture of b.shortcuts) {
        if (peer.shortcuts.includes(gesture)) {
          console.warn(
            `[canvas] Behaviour "${b.id}" claims gesture "${gesture}" already used by enabled behaviour "${peer.id}". Disable one before enabling the other.`
          );
        }
      }
    }
  }
};

// src/abstracts/registries/LayoutRegistry.ts
var LayoutRegistry = class {
  layouts = /* @__PURE__ */ new Map();
  bus;
  constructor(opts) {
    this.bus = opts.bus;
  }
  get size() {
    return this.layouts.size;
  }
  /** Register a layout. Fires `layout:added`. Throws on duplicate id. */
  add(layout) {
    if (this.layouts.has(layout.id)) {
      throw new Error(`LayoutRegistry: layout "${layout.id}" already registered`);
    }
    this.layouts.set(layout.id, layout);
    this.bus.emit("scene:layout:add", { id: layout.id });
  }
  /** Remove a layout, stopping it first if it exposes `stop()`. Fires `layout:removed`. */
  remove(id) {
    const layout = this.layouts.get(id);
    if (!layout) return;
    layout.stop?.();
    this.layouts.delete(id);
    this.bus.emit("scene:layout:remove", { id });
  }
  get(id) {
    return this.layouts.get(id);
  }
  has(id) {
    return this.layouts.has(id);
  }
  list() {
    return Array.from(this.layouts.values());
  }
  /** Stop + drop every layout. Called on Canvas destroy. */
  clear() {
    for (const layout of this.layouts.values()) layout.stop?.();
    this.layouts.clear();
  }
};

// src/abstracts/registries/CommandRegistry.ts
function isDevBuild() {
  try {
    return process.env.NODE_ENV !== "production";
  } catch {
    return false;
  }
}
function argProblem(spec, value) {
  switch (spec.kind) {
    case "string":
    case "layer":
    case "behaviour":
    case "layout":
      return typeof value === "string" ? null : `expected a string (${spec.kind}), got ${describe(value)}`;
    case "number": {
      if (typeof value === "number" && Number.isFinite(value)) return null;
      if (spec.pick && typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) return null;
      return `expected a finite number, got ${describe(value)}`;
    }
    case "boolean":
      return typeof value === "boolean" ? null : `expected a boolean, got ${describe(value)}`;
    case "enum": {
      const allowed = (spec.options ?? []).map((o) => o.value);
      return typeof value === "string" && allowed.includes(value) ? null : `expected one of ${allowed.map((v) => JSON.stringify(v)).join(", ")}, got ${describe(value)}`;
    }
    case "strings":
      return Array.isArray(value) && value.every((v) => typeof v === "string") ? null : `expected an array of strings, got ${describe(value)}`;
    case "json":
      return null;
  }
}
function describe(value) {
  if (Array.isArray(value)) return "an array";
  if (value === null) return "null";
  return typeof value === "string" ? JSON.stringify(value) : typeof value;
}
var CommandRegistry = class {
  /** Per name, the registrations oldest → newest; the last one is live. */
  stacks = /* @__PURE__ */ new Map();
  listeners = /* @__PURE__ */ new Set();
  /** Bumped on every {@link subscribe} signal — see {@link version}. */
  _version = 0;
  getContext;
  validateArgs;
  /** `command|key|problem` already warned about, so a bound button doesn't flood the console. */
  warned = /* @__PURE__ */ new Set();
  constructor(opts) {
    this.getContext = opts.getContext;
    this.validateArgs = opts.validateArgs ?? isDevBuild();
  }
  /**
   * Register `name`, overriding any existing registration. Returns a disposer
   * that removes **this** registration only: if it is live, the one underneath
   * becomes live again; if it was already overridden, the override stays.
   */
  register(name, command) {
    const entry = { command };
    const stack = this.stacks.get(name) ?? [];
    stack.push(entry);
    this.stacks.set(name, stack);
    this.notify();
    return () => {
      const current = this.stacks.get(name);
      const i = current?.indexOf(entry) ?? -1;
      if (!current || i < 0) return;
      current.splice(i, 1);
      if (current.length === 0) this.stacks.delete(name);
      this.notify();
    };
  }
  /** Remove every registration of `name`. No-op when absent. */
  unregister(name) {
    if (this.stacks.delete(name)) this.notify();
  }
  has(name) {
    return this.stacks.has(name);
  }
  /** The live (most recent) registration of `name`. */
  get(name) {
    const stack = this.stacks.get(name);
    return stack?.[stack.length - 1]?.command;
  }
  /** Registered command names, in first-registration order. */
  list() {
    return [...this.stacks.keys()];
  }
  /**
   * Run `name` with `args`. Returns `false` (and does nothing) when the command
   * is missing or disabled. With `validateArgs` on, first warns about any
   * described key whose value doesn't fit its descriptor — the run proceeds
   * regardless.
   */
  run(name, args) {
    const cmd = this.get(name);
    if (!cmd) return false;
    if (this.validateArgs && cmd.args) this.checkArgs(name, cmd.args, args);
    const ctx = this.getContext();
    if (cmd.isEnabled && !cmd.isEnabled(ctx, args)) return false;
    void cmd.run(ctx, args);
    return true;
  }
  /**
   * {@link run}, awaiting the command's work: resolves once the promise a
   * command's `run` returned settles (`layout.run` resolves when the layout
   * run ends). Resolves `false` — without running anything — when the command
   * is missing or disabled; a synchronous command resolves `true` at once. A
   * playbook step's `do` verbs go through here, so each finishes before the
   * next starts.
   */
  async runAsync(name, args) {
    const cmd = this.get(name);
    if (!cmd) return false;
    if (this.validateArgs && cmd.args) this.checkArgs(name, cmd.args, args);
    const ctx = this.getContext();
    if (cmd.isEnabled && !cmd.isEnabled(ctx, args)) return false;
    await cmd.run(ctx, args);
    return true;
  }
  /** `isActive` of `name`; `false` when missing or not a toggle. */
  isActive(name, args) {
    const cmd = this.get(name);
    return cmd?.isActive ? cmd.isActive(this.getContext(), args) : false;
  }
  /** `isEnabled` of `name`; `false` when missing, `true` when it declares no check. */
  isEnabled(name, args) {
    const cmd = this.get(name);
    if (!cmd) return false;
    return cmd.isEnabled ? cmd.isEnabled(this.getContext(), args) : true;
  }
  /** `value` of a pick-one command; `null` when missing or not a picker. */
  value(name, args) {
    const cmd = this.get(name);
    return cmd?.value ? cmd.value(this.getContext(), args) : null;
  }
  /** `options` of a pick-one command; `[]` when missing or it declares none. */
  options(name, args) {
    const cmd = this.get(name);
    return cmd?.options ? cmd.options(this.getContext(), args) : [];
  }
  /**
   * Tell subscribers that command state changed **outside** the view store (a
   * history stack, a clipboard buffer, a layer's edge defaults, a registry), so
   * a bound control re-reads `isEnabled` / `isActive` / `value` / `options`.
   *
   * Call it from the state's **owner** — a bridge from the owner's own change
   * signal, set up once (the engine bridges the registries, layer visibility and
   * `canvas.history`; `GraphCanvas` its layers' edge templates; a provider its
   * own history / clipboard) — never from the write sites, where another
   * writer would forget it. A command whose state lives in the view store
   * needs none.
   */
  invalidate() {
    this.notify();
  }
  /**
   * A counter bumped on every {@link subscribe} signal (register, unregister,
   * dispose, {@link invalidate}, {@link clear}) — and only then. Use it as a
   * `useSyncExternalStore` snapshot when a UI must re-read *everything* on a
   * signal: a snapshot derived from `list()` stays equal when only a command's
   * `options` / state changed, and React would skip the re-render.
   */
  get version() {
    return this._version;
  }
  /** Hear every register / unregister / {@link invalidate}. Returns an unsubscribe. */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /** Drop every command and listener. */
  clear() {
    this.stacks.clear();
    this.notify();
    this.listeners.clear();
  }
  /** Warn (once each) about `args` values that don't fit `specs`. */
  checkArgs(name, specs, args) {
    if (args === void 0 || args === null) return;
    if (typeof args !== "object" || Array.isArray(args)) {
      this.warn(name, "", `args should be an object, got ${describe(args)}`);
      return;
    }
    for (const [key, spec] of Object.entries(specs)) {
      const value = args[key];
      if (value === void 0) continue;
      const problem = argProblem(spec, value);
      if (problem) this.warn(name, key, problem);
    }
  }
  warn(name, key, problem) {
    const id = `${name}|${key}|${problem}`;
    if (this.warned.has(id)) return;
    this.warned.add(id);
    console.warn(`[canvas] command "${name}"${key ? ` arg "${key}"` : ""}: ${problem}`);
  }
  notify() {
    this._version++;
    for (const l of [...this.listeners]) l();
  }
};

// src/specs/geometry.ts
function connectorGeometryKey(spec) {
  const { stroke: _stroke, ...geometry } = spec;
  return JSON.stringify(geometry);
}

// src/specs/style.ts
function hasSilhouetteFill(fill) {
  if (fill === void 0) return false;
  if (typeof fill === "number") return true;
  const layers = Array.isArray(fill) ? fill : [fill];
  return layers.some((l) => l.kind === "solid" || l.kind === "image");
}

// src/specs/shapeGeometry/polygonMath.ts
function polygonBounds(vertices) {
  if (vertices.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = vertices[0].x;
  let maxX = minX;
  let minY = vertices[0].y;
  let maxY = minY;
  for (let i = 1; i < vertices.length; i++) {
    const v = vertices[i];
    if (v.x < minX) minX = v.x;
    else if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    else if (v.y > maxY) maxY = v.y;
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function pointInPolygon(localX, localY, vertices) {
  const n2 = vertices.length;
  if (n2 < 3) return false;
  let inside = false;
  for (let i = 0, j = n2 - 1; i < n2; j = i++) {
    const vi = vertices[i];
    const vj = vertices[j];
    const intersects = vi.y > localY !== vj.y > localY && localX < (vj.x - vi.x) * (localY - vi.y) / (vj.y - vi.y) + vi.x;
    if (intersects) inside = !inside;
  }
  return inside;
}
function distanceToSegmentSq(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = lenSq === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = x1 + t * dx - px;
  const ey = y1 + t * dy - py;
  return ex * ex + ey * ey;
}
function distanceToOutlineSq(x, y, vertices, closed = true) {
  const n2 = vertices.length;
  if (n2 === 0) return Infinity;
  if (n2 === 1) {
    const v = vertices[0];
    return (x - v.x) * (x - v.x) + (y - v.y) * (y - v.y);
  }
  const edges = closed ? n2 : n2 - 1;
  let best = Infinity;
  for (let i = 0; i < edges; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n2];
    const d = distanceToSegmentSq(x, y, a.x, a.y, b.x, b.y);
    if (d < best) best = d;
  }
  return best;
}
function polygonContainsInflated(x, y, vertices, pad = 0, closed = true) {
  const inside = closed && pointInPolygon(x, y, vertices);
  if (pad === 0) return inside;
  const nearOutline = distanceToOutlineSq(x, y, vertices, closed) <= pad * pad;
  return pad > 0 ? inside || nearOutline : inside && !nearOutline;
}
function offsetPolygon(vertices, distance) {
  const n2 = vertices.length;
  if (n2 < 3 || distance === 0) return vertices.map((v) => ({ x: v.x, y: v.y }));
  const ccw = signedArea(vertices) > 0;
  const out = new Array(n2);
  for (let i = 0; i < n2; i++) {
    const prev = vertices[(i + n2 - 1) % n2];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n2];
    const e1 = unitNormal(prev, curr, ccw);
    const e2 = unitNormal(curr, next, ccw);
    const bx = e1.x + e2.x;
    const by = e1.y + e2.y;
    const dot = e1.x * e2.x + e1.y * e2.y;
    const denom = 1 + dot;
    if (Math.abs(denom) < 1e-6) {
      out[i] = { x: curr.x + e1.x * distance, y: curr.y + e1.y * distance };
    } else {
      const k = distance / denom;
      out[i] = { x: curr.x + bx * k, y: curr.y + by * k };
    }
  }
  return out;
}
function regularPolygonVertices(sides, radius, rotationRad) {
  const n2 = Math.max(3, Math.floor(sides));
  const out = new Array(n2);
  const base = -Math.PI / 2 + rotationRad;
  const step = Math.PI * 2 / n2;
  for (let i = 0; i < n2; i++) {
    const a = base + i * step;
    out[i] = { x: Math.cos(a) * radius, y: Math.sin(a) * radius };
  }
  return out;
}
function starVertices(points, innerRadius, outerRadius, rotationRad) {
  const p = Math.max(3, Math.floor(points));
  const total = p * 2;
  const out = new Array(total);
  const base = -Math.PI / 2 + rotationRad;
  const step = Math.PI / p;
  for (let i = 0; i < total; i++) {
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    const a = base + i * step;
    out[i] = { x: Math.cos(a) * r, y: Math.sin(a) * r };
  }
  return out;
}
function rayPolygonIntersection(localFromCenter, vertices) {
  const n2 = vertices.length;
  if (n2 < 2) return null;
  const dx = localFromCenter.x;
  const dy = localFromCenter.y;
  if (dx === 0 && dy === 0) return null;
  let bestT = -Infinity;
  let hit = null;
  for (let i = 0, j = n2 - 1; i < n2; j = i++) {
    const a = vertices[j];
    const b = vertices[i];
    const ex = b.x - a.x;
    const ey = b.y - a.y;
    const denom = dx * -ey - dy * -ex;
    if (denom === 0) continue;
    const t = (a.x * -ey - a.y * -ex) / denom;
    const u = (dx * a.y - dy * a.x) / denom;
    if (t >= 0 && u >= 0 && u <= 1 && t > bestT) {
      bestT = t;
      hit = { x: dx * t, y: dy * t };
    }
  }
  return hit;
}
function roundedPolygonOutline(corners) {
  const n2 = corners.length;
  if (n2 < 3) return corners.map((c) => ({ x: c.x, y: c.y }));
  const out = [];
  for (let i = 0; i < n2; i++) {
    const p = corners[i];
    const prev = corners[(i + n2 - 1) % n2];
    const next = corners[(i + 1) % n2];
    const v1x = prev.x - p.x;
    const v1y = prev.y - p.y;
    const v2x = next.x - p.x;
    const v2y = next.y - p.y;
    const l1 = Math.hypot(v1x, v1y);
    const l2 = Math.hypot(v2x, v2y);
    if (p.r <= 0 || l1 < 1e-9 || l2 < 1e-9) {
      out.push({ x: p.x, y: p.y });
      continue;
    }
    const u1x = v1x / l1;
    const u1y = v1y / l1;
    const u2x = v2x / l2;
    const u2y = v2y / l2;
    const cosT = Math.max(-1, Math.min(1, u1x * u2x + u1y * u2y));
    const theta = Math.acos(cosT);
    if (theta < 1e-6 || Math.PI - theta < 1e-6) {
      out.push({ x: p.x, y: p.y });
      continue;
    }
    const half = theta / 2;
    const tangent = Math.min(p.r / Math.tan(half), l1 / 2, l2 / 2);
    const radius = tangent * Math.tan(half);
    if (radius < 1e-6) {
      out.push({ x: p.x, y: p.y });
      continue;
    }
    let bx = u1x + u2x;
    let by = u1y + u2y;
    const bl = Math.hypot(bx, by);
    if (bl < 1e-9) {
      out.push({ x: p.x, y: p.y });
      continue;
    }
    bx /= bl;
    by /= bl;
    const cx = p.x + bx * (radius / Math.sin(half));
    const cy = p.y + by * (radius / Math.sin(half));
    const a1 = Math.atan2(p.y + u1y * tangent - cy, p.x + u1x * tangent - cx);
    const a2 = Math.atan2(p.y + u2y * tangent - cy, p.x + u2x * tangent - cx);
    let delta = a2 - a1;
    while (delta > Math.PI) delta -= 2 * Math.PI;
    while (delta < -Math.PI) delta += 2 * Math.PI;
    const steps = Math.max(2, Math.ceil(Math.abs(delta) * radius / 2));
    for (let s = 0; s <= steps; s++) {
      const a = a1 + delta * (s / steps);
      out.push({ x: cx + Math.cos(a) * radius, y: cy + Math.sin(a) * radius });
    }
  }
  return out;
}
function signedArea(vertices) {
  let sum = 0;
  const n2 = vertices.length;
  for (let i = 0, j = n2 - 1; i < n2; j = i++) {
    const a = vertices[j];
    const b = vertices[i];
    sum += (b.x - a.x) * (b.y + a.y);
  }
  return -sum * 0.5;
}
function unitNormal(a, b, ccw) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = Math.hypot(dx, dy) || 1;
  return ccw ? { x: -dy / len2, y: dx / len2 } : { x: dy / len2, y: -dx / len2 };
}

// src/specs/shapeGeometry/tabbedRect.ts
function tabbedRectTabWidth(spec) {
  const declared = spec.tabWidth ?? spec.width;
  return spec.height <= 0 ? declared : Math.min(declared, spec.width);
}
function tabbedRectBounds(spec) {
  if (spec.height <= 0) {
    return { x: 0, y: 0, width: tabbedRectTabWidth(spec), height: spec.tabHeight };
  }
  return { x: 0, y: 0, width: spec.width, height: spec.tabHeight + spec.height };
}
function collapsedTabbedRect(_spec) {
  return { height: 0 };
}
function fitTabbedRectToContent(spec, content) {
  if (spec.tabWidth !== void 0) return {};
  const pad = spec.tabPadding ?? 10;
  const slantSides = (spec.tabAlign ?? "left") === "center" ? 2 : 1;
  const fitted = content.width + 2 * pad + (spec.tabSkew ?? 0) * slantSides;
  return { tabWidth: spec.height <= 0 ? fitted : Math.min(spec.width, fitted) };
}
function scaleTabbedRect(spec, factor) {
  return {
    width: spec.width * factor,
    height: spec.height * factor,
    tabHeight: spec.tabHeight * factor,
    ...spec.tabWidth !== void 0 ? { tabWidth: spec.tabWidth * factor } : {},
    ...spec.tabPadding !== void 0 ? { tabPadding: spec.tabPadding * factor } : {},
    ...spec.cornerRadius !== void 0 ? { cornerRadius: spec.cornerRadius * factor } : {},
    ...spec.tabCornerRadius !== void 0 ? { tabCornerRadius: spec.tabCornerRadius * factor } : {},
    ...spec.tabOffset !== void 0 ? { tabOffset: spec.tabOffset * factor } : {},
    ...spec.tabSkew !== void 0 ? { tabSkew: spec.tabSkew * factor } : {}
  };
}
function tabbedRectOutline(spec, inset = 0) {
  const geo = tabbedRectGeometry(spec, inset);
  if (!geo) return [];
  const { left, right, bottom, tabTop, shoulder, tabLeft, tabRight } = geo;
  const r = Math.max(0, (spec.cornerRadius ?? 0) - inset);
  const tr = Math.max(0, (spec.tabCornerRadius ?? spec.cornerRadius ?? 0) - inset);
  const corners = [];
  corners.push({ x: geo.tabTopLeft, y: tabTop, r: tr });
  corners.push({ x: geo.tabTopRight, y: tabTop, r: tr });
  if (geo.bodyless) {
    corners.push({ x: tabRight, y: bottom, r });
    corners.push({ x: tabLeft, y: bottom, r });
    return roundedPolygonOutline(corners);
  }
  if (geo.flushRight) {
    corners.push({ x: right, y: shoulder, r });
  } else {
    corners.push({ x: tabRight, y: shoulder, r: 0 });
    corners.push({ x: right, y: shoulder, r });
  }
  corners.push({ x: right, y: bottom, r });
  corners.push({ x: left, y: bottom, r });
  if (!geo.flushLeft) {
    corners.push({ x: left, y: shoulder, r });
    corners.push({ x: tabLeft, y: shoulder, r: 0 });
  }
  return roundedPolygonOutline(corners);
}
function tabbedRectFoldLine(spec, inset = 0) {
  if (spec.tabDivider === false) return void 0;
  const geo = tabbedRectGeometry(spec, inset);
  if (!geo || geo.bodyless) return void 0;
  return [
    { x: geo.tabLeft, y: geo.shoulder },
    { x: geo.tabRight, y: geo.shoulder }
  ];
}
function tabbedRectTabBox(spec, inset = 0) {
  const geo = tabbedRectGeometry(spec, inset);
  if (!geo) return void 0;
  return {
    x: geo.tabTopLeft,
    y: geo.tabTop,
    width: Math.max(0, geo.tabTopRight - geo.tabTopLeft),
    height: geo.shoulder - geo.tabTop
  };
}
function tabbedRectGeometry(spec, inset) {
  if (spec.height <= 0) return bodylessGeometryOf(spec, inset);
  const totalH = spec.tabHeight + spec.height;
  const left = inset;
  const right = spec.width - inset;
  const bottom = totalH - inset;
  const tabTop = inset;
  const shoulder = spec.tabHeight + inset;
  if (right <= left || bottom <= shoulder) return null;
  const x0 = tabXOf(spec);
  const tabLeft = Math.max(left, x0 + inset);
  const tabRight = Math.min(right, x0 + tabbedRectTabWidth(spec) - inset);
  if (tabRight <= tabLeft) return null;
  const align = spec.tabAlign ?? "left";
  const flushLeft = tabLeft - left < 1e-6;
  const flushRight = right - tabRight < 1e-6;
  const slantLeft = (align === "right" || align === "center") && !flushLeft;
  const slantRight = (align === "left" || align === "center") && !flushRight;
  const sides = (slantLeft ? 1 : 0) + (slantRight ? 1 : 0);
  const skew = sides === 0 ? 0 : Math.max(0, Math.min(spec.tabSkew ?? 0, (tabRight - tabLeft) / (2 * sides)));
  return {
    left,
    right,
    bottom,
    tabTop,
    shoulder,
    tabLeft,
    tabRight,
    tabTopLeft: tabLeft + (slantLeft ? skew : 0),
    tabTopRight: tabRight - (slantRight ? skew : 0),
    flushLeft,
    flushRight,
    bodyless: false
  };
}
function bodylessGeometryOf(spec, inset) {
  const tabTop = inset;
  const base = spec.tabHeight - inset;
  const tabLeft = inset;
  const tabRight = tabbedRectTabWidth(spec) - inset;
  if (base <= tabTop || tabRight <= tabLeft) return null;
  const align = spec.tabAlign ?? "left";
  const slantLeft = align === "right" || align === "center";
  const slantRight = align === "left" || align === "center";
  const sides = (slantLeft ? 1 : 0) + (slantRight ? 1 : 0);
  const skew = sides === 0 ? 0 : Math.max(0, Math.min(spec.tabSkew ?? 0, (tabRight - tabLeft) / (2 * sides)));
  return {
    left: tabLeft,
    right: tabRight,
    bottom: base,
    tabTop,
    // No fold to sit on: the shoulder *is* the outline's bottom edge, which
    // keeps the label box (tabTop → shoulder) spanning the whole tab.
    shoulder: base,
    tabLeft,
    tabRight,
    tabTopLeft: tabLeft + (slantLeft ? skew : 0),
    tabTopRight: tabRight - (slantRight ? skew : 0),
    flushLeft: true,
    flushRight: true,
    bodyless: true
  };
}
function tabXOf(spec) {
  if (spec.height <= 0) return 0;
  const tabW = tabbedRectTabWidth(spec);
  const offset = spec.tabOffset ?? 0;
  switch (spec.tabAlign ?? "left") {
    case "center":
      return (spec.width - tabW) / 2;
    case "right":
      return Math.max(0, spec.width - tabW - offset);
    default:
      return Math.min(offset, Math.max(0, spec.width - tabW));
  }
}

// src/specs/shapeGeometry/bounds.ts
var TAU = Math.PI * 2;
function boundsOfCircle(spec) {
  const r = spec.radius;
  return { x: -r, y: -r, width: r * 2, height: r * 2 };
}
function scaleCircle(spec, factor) {
  return { radius: spec.radius * factor };
}
function boundsOfEllipse(spec) {
  return {
    x: -spec.radiusX,
    y: -spec.radiusY,
    width: spec.radiusX * 2,
    height: spec.radiusY * 2
  };
}
function scaleEllipse(spec, factor) {
  return { radiusX: spec.radiusX * factor, radiusY: spec.radiusY * factor };
}
function boundsOfRect(spec) {
  return { x: 0, y: 0, width: spec.width, height: spec.height };
}
function scaleRect(spec, factor) {
  return {
    width: spec.width * factor,
    height: spec.height * factor,
    ...spec.cornerRadius !== void 0 ? { cornerRadius: spec.cornerRadius * factor } : {}
  };
}
function boundsOfPolygon(spec) {
  return polygonBounds(spec.vertices);
}
function scalePolygon(spec, factor) {
  return { vertices: spec.vertices.map((v) => ({ x: v.x * factor, y: v.y * factor })) };
}
function verticesOfRegularPolygon(spec) {
  return regularPolygonVertices(spec.sides, spec.radius, spec.rotation ?? 0);
}
function boundsOfRegularPolygon(spec) {
  return polygonBounds(verticesOfRegularPolygon(spec));
}
function scaleRegularPolygon(spec, factor) {
  return { radius: spec.radius * factor };
}
function verticesOfStar(spec) {
  return starVertices(spec.points, spec.innerRadius, spec.outerRadius, spec.rotation ?? 0);
}
function boundsOfStar(spec) {
  return polygonBounds(verticesOfStar(spec));
}
function scaleStar(spec, factor) {
  return {
    innerRadius: spec.innerRadius * factor,
    outerRadius: spec.outerRadius * factor
  };
}
function boundsOfArc(spec) {
  const { innerR, outerR, startAngle: a0, endAngle: a1 } = spec;
  if (a1 <= a0 || outerR <= 0) return { x: 0, y: 0, width: 0, height: 0 };
  const corners = [
    { x: Math.cos(a0) * innerR, y: Math.sin(a0) * innerR },
    { x: Math.cos(a0) * outerR, y: Math.sin(a0) * outerR },
    { x: Math.cos(a1) * innerR, y: Math.sin(a1) * innerR },
    { x: Math.cos(a1) * outerR, y: Math.sin(a1) * outerR }
  ];
  const sweep = a1 - a0;
  for (const k of [0, 1, 2, 3]) {
    const cardinal = k * Math.PI / 2;
    let n2 = Math.ceil((a0 - cardinal) / TAU);
    if (cardinal + n2 * TAU < a0) n2++;
    const angle = cardinal + n2 * TAU;
    if (angle <= a1 || sweep >= TAU) {
      corners.push({ x: Math.cos(angle) * outerR, y: Math.sin(angle) * outerR });
    }
  }
  return polygonBounds(corners);
}
function scaleArc(spec, factor) {
  return { innerR: spec.innerR * factor, outerR: spec.outerR * factor };
}
function boundsOfPath(spec) {
  return polygonBounds(spec.points);
}
function scalePath(spec, factor) {
  return { points: spec.points.map((p) => ({ x: p.x * factor, y: p.y * factor })) };
}
function boundsOfComposite(spec) {
  return { x: 0, y: 0, width: spec.width, height: spec.height };
}
function resolveCompositeRoot(spec) {
  if (spec.root) return spec.root;
  return {
    kind: "rect",
    x: 0,
    y: 0,
    width: spec.width,
    height: spec.height,
    ...spec.cornerRadius !== void 0 ? { cornerRadius: spec.cornerRadius } : {},
    ...spec.fill !== void 0 ? { fill: spec.fill } : {},
    ...spec.stroke !== void 0 ? { stroke: spec.stroke } : {}
  };
}
function boundsOfCompositeRoot(root) {
  switch (root.kind) {
    case "circle":
      return boundsOfCircle(root);
    case "ellipse":
      return boundsOfEllipse(root);
    case "polygon":
      return boundsOfPolygon(root);
    case "regular-polygon":
      return boundsOfRegularPolygon(root);
    case "star":
      return boundsOfStar(root);
    case "arc":
      return boundsOfArc(root);
    default:
      return boundsOfRect(root);
  }
}
function compositeRootOffset(spec) {
  const b = boundsOfCompositeRoot(resolveCompositeRoot(spec));
  return {
    x: spec.width / 2 - (b.x + b.width / 2),
    y: spec.height / 2 - (b.y + b.height / 2)
  };
}

// src/specs/shapeGeometry/contains.ts
var TAU2 = Math.PI * 2;
function strokeBandOf(stroke) {
  const width = stroke?.width ?? (stroke ? 1 : 0);
  if (!stroke || width <= 0) return { outer: 0, inner: 0 };
  const alignment = stroke.alignment === "inside" ? 1 : stroke.alignment === "outside" ? 0 : 0.5;
  const outer = (1 - alignment) * width;
  return { outer, inner: width - outer };
}
function containsCircle(spec, localX, localY, pad = 0) {
  const r = spec.radius + pad;
  if (r <= 0) return false;
  return localX * localX + localY * localY <= r * r;
}
function containsEllipse(spec, localX, localY, pad = 0) {
  const rx = spec.radiusX + pad;
  const ry = spec.radiusY + pad;
  if (rx <= 0 || ry <= 0) return false;
  const nx = localX / rx;
  const ny = localY / ry;
  return nx * nx + ny * ny <= 1;
}
function containsRect(spec, localX, localY, pad = 0) {
  const w = spec.width + pad * 2;
  const h = spec.height + pad * 2;
  if (w <= 0 || h <= 0) return false;
  const left = -pad;
  const top = -pad;
  if (localX < left || localX > left + w || localY < top || localY > top + h) return false;
  const r = Math.min(Math.max(0, (spec.cornerRadius ?? 0) + pad), w / 2, h / 2);
  if (r <= 0) return true;
  const cx = clamp(localX, left + r, left + w - r);
  const cy = clamp(localY, top + r, top + h - r);
  const dx = localX - cx;
  const dy = localY - cy;
  return dx * dx + dy * dy <= r * r;
}
function containsPolygon(spec, localX, localY, pad = 0) {
  return polygonContainsInflated(localX, localY, spec.vertices, pad);
}
function containsRegularPolygon(spec, localX, localY, pad = 0) {
  return polygonContainsInflated(localX, localY, verticesOfRegularPolygon(spec), pad);
}
function containsStar(spec, localX, localY, pad = 0) {
  return polygonContainsInflated(localX, localY, verticesOfStar(spec), pad);
}
function containsTabbedRect(spec, localX, localY, pad = 0) {
  return polygonContainsInflated(localX, localY, tabbedRectOutline(spec, 0), pad);
}
function containsPath(spec, localX, localY, pad = 0) {
  const closed = spec.closed === true || spec.smooth === true;
  return polygonContainsInflated(localX, localY, spec.points, pad, closed);
}
function containsArc(spec, localX, localY, pad = 0) {
  const { startAngle: a0, endAngle: a1 } = spec;
  const innerR = Math.max(0, spec.innerR - pad);
  const outerR = spec.outerR + pad;
  if (a1 <= a0 || outerR <= 0) return false;
  const rSq = localX * localX + localY * localY;
  const inRadial = rSq >= innerR * innerR && rSq <= outerR * outerR;
  const inSweep = a1 - a0 >= TAU2 || angleWithin(Math.atan2(localY, localX), a0, a1);
  if (inSweep && inRadial) {
    if (pad >= 0) return true;
    return distanceToRadialEdgesSq(spec, localX, localY) > pad * pad;
  }
  if (pad <= 0 || a1 - a0 >= TAU2) return false;
  return distanceToRadialEdgesSq(spec, localX, localY) <= pad * pad;
}
function containsComposite(spec, localX, localY, pad = 0) {
  const off = compositeRootOffset(spec);
  const root = resolveCompositeRoot(spec);
  if (containsRootSpec(root, localX - off.x, localY - off.y, pad)) return true;
  for (const p of spec.parts) {
    if (p.part === "rect") {
      if (p.fill === void 0 && !p.stroke) continue;
      const box = {
        width: p.width,
        height: p.height,
        ...p.cornerRadius !== void 0 ? { cornerRadius: p.cornerRadius } : {}
      };
      const half = partHalfStroke(p.stroke);
      if (withHollowRule(
        (q) => containsRect(box, localX - p.x, localY - p.y, q),
        p.fill !== void 0,
        pad + half,
        half
      )) {
        return true;
      }
    } else if (p.part === "circle") {
      if (p.fill === void 0 && !p.stroke) continue;
      const disc = { radius: p.radius };
      const half = partHalfStroke(p.stroke);
      if (withHollowRule(
        (q) => containsCircle(disc, localX - p.x, localY - p.y, q),
        p.fill !== void 0,
        pad + half,
        half
      )) {
        return true;
      }
    } else if (p.part === "line") {
      const tol = pad + partHalfStroke(p.stroke);
      if (tol > 0 && distanceToSegmentSq(localX, localY, p.x, p.y, p.x2, p.y2) <= tol * tol) {
        return true;
      }
    } else if (p.part === "icon" && p.background) {
      const chip = {
        width: p.size,
        height: p.size,
        ...p.background.cornerRadius !== void 0 ? { cornerRadius: p.background.cornerRadius } : {}
      };
      if (containsRect(chip, localX - p.x, localY - p.y, pad)) return true;
    }
  }
  return false;
}
function containsSpec(spec, localX, localY, strokeTolerance) {
  const fn = CONTAINS[spec.kind];
  if (!fn) return void 0;
  if (spec.kind === "composite") return fn(spec, localX, localY, strokeTolerance ?? 0);
  const band = strokeTolerance !== void 0 ? { outer: strokeTolerance, inner: strokeTolerance } : strokeBandOf(spec.stroke);
  return withHollowRule(
    (pad) => fn(spec, localX, localY, pad),
    hasSilhouetteFill(spec.fill),
    band.outer,
    band.inner
  );
}
var CONTAINS = {
  circle: containsCircle,
  ellipse: containsEllipse,
  rect: containsRect,
  "tabbed-rect": containsTabbedRect,
  polygon: containsPolygon,
  "regular-polygon": containsRegularPolygon,
  star: containsStar,
  arc: containsArc,
  path: containsPath,
  composite: containsComposite
};
function containsRootSpec(root, x, y, pad) {
  const band = strokeBandOf(root.stroke);
  const test = (p) => {
    switch (root.kind) {
      case "circle":
        return containsCircle(root, x, y, p);
      case "ellipse":
        return containsEllipse(root, x, y, p);
      case "polygon":
        return containsPolygon(root, x, y, p);
      case "regular-polygon":
        return containsRegularPolygon(root, x, y, p);
      case "star":
        return containsStar(root, x, y, p);
      case "arc":
        return containsArc(root, x, y, p);
      default:
        return containsRect(root, x, y, p);
    }
  };
  return withHollowRule(test, hasSilhouetteFill(root.fill), pad + band.outer, band.inner);
}
function withHollowRule(test, filled, outer, inner) {
  if (filled) return test(outer);
  if (outer <= 0 && inner <= 0) return false;
  return test(outer) && !test(-inner);
}
function partHalfStroke(stroke) {
  if (!stroke) return 0;
  return Math.max(0, stroke.width ?? 1) / 2;
}
function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}
function angleWithin(theta, a0, a1) {
  let n2 = Math.ceil((a0 - theta) / TAU2);
  if (theta + n2 * TAU2 < a0) n2++;
  const t = theta + n2 * TAU2;
  return t >= a0 && t <= a1;
}
function distanceToRadialEdgesSq(spec, x, y) {
  const edge = (a) => {
    const c = Math.cos(a);
    const s = Math.sin(a);
    return distanceToSegmentSq(
      x,
      y,
      c * spec.innerR,
      s * spec.innerR,
      c * spec.outerR,
      s * spec.outerR
    );
  };
  return Math.min(edge(spec.startAngle), edge(spec.endAngle));
}

// src/specs/shapeGeometry/index.ts
function boundsOfSpec(spec) {
  switch (spec.kind) {
    case "circle":
      return boundsOfCircle(spec);
    case "ellipse":
      return boundsOfEllipse(spec);
    case "rect":
      return boundsOfRect(spec);
    case "tabbed-rect":
      return tabbedRectBounds(spec);
    case "polygon":
      return boundsOfPolygon(spec);
    case "regular-polygon":
      return boundsOfRegularPolygon(spec);
    case "star":
      return boundsOfStar(spec);
    case "arc":
      return boundsOfArc(spec);
    case "path":
      return boundsOfPath(spec);
    case "composite":
      return boundsOfComposite(spec);
    default:
      return void 0;
  }
}
function scaleSpec(spec, factor) {
  switch (spec.kind) {
    case "circle":
      return scaleCircle(spec, factor);
    case "ellipse":
      return scaleEllipse(spec, factor);
    case "rect":
      return scaleRect(spec, factor);
    case "tabbed-rect":
      return scaleTabbedRect(spec, factor);
    case "polygon":
      return scalePolygon(spec, factor);
    case "regular-polygon":
      return scaleRegularPolygon(spec, factor);
    case "star":
      return scaleStar(spec, factor);
    case "arc":
      return scaleArc(spec, factor);
    case "path":
      return scalePath(spec, factor);
    default:
      return void 0;
  }
}
function collapsedSpec(spec) {
  return spec.kind === "tabbed-rect" ? collapsedTabbedRect() : void 0;
}
function fitSpecToContent(spec, content) {
  return spec.kind === "tabbed-rect" ? fitTabbedRectToContent(spec, content) : void 0;
}

// src/state/data/flush.ts
var raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame : void 0;
var caf = typeof cancelAnimationFrame === "function" ? cancelAnimationFrame : void 0;
function scheduleFlush(mode, cb) {
  if (mode === "manual") return () => {
  };
  if (mode === "frame" && raf && caf) {
    const handle = raf(() => cb());
    return () => caf(handle);
  }
  let cancelled = false;
  queueMicrotask(() => {
    if (!cancelled) cb();
  });
  return () => {
    cancelled = true;
  };
}

// src/specs/SpecStore.ts
var SpecStore = class {
  specs = /* @__PURE__ */ new Map();
  added = /* @__PURE__ */ new Set();
  changed = /* @__PURE__ */ new Set();
  removed = /* @__PURE__ */ new Set();
  listeners = /* @__PURE__ */ new Set();
  version = 0;
  scheduled = false;
  flushMode = "microtask";
  cancel;
  // ── Reads ──────────────────────────────────────────────────────────────────
  get(id) {
    return this.specs.get(id);
  }
  has(id) {
    return this.specs.has(id);
  }
  get size() {
    return this.specs.size;
  }
  ids() {
    return this.specs.keys();
  }
  entries() {
    return this.specs.entries();
  }
  // ── Writes ─────────────────────────────────────────────────────────────────
  /** Publish (or replace) the spec for `id`. */
  set(id, spec) {
    const existed = this.specs.has(id);
    this.specs.set(id, spec);
    if (existed) {
      this.removed.delete(id);
      if (!this.added.has(id)) this.changed.add(id);
    } else {
      this.added.add(id);
      this.removed.delete(id);
    }
    this.schedule();
  }
  /**
   * Shallow-merge `partial` over the stored spec. Returns `false` when `id` is
   * unknown, so a caller can fall back to {@link set} with a full spec.
   */
  patch(id, partial) {
    const current = this.specs.get(id);
    if (!current) return false;
    this.specs.set(id, { ...current, ...partial });
    if (!this.added.has(id)) this.changed.add(id);
    this.schedule();
    return true;
  }
  delete(id) {
    if (!this.specs.delete(id)) return;
    this.changed.delete(id);
    if (!this.added.delete(id)) this.removed.add(id);
    this.schedule();
  }
  /** Drop every spec. Emits one flush listing all ids as removed. */
  clear() {
    for (const id of this.specs.keys()) {
      if (!this.added.delete(id)) this.removed.add(id);
    }
    this.specs.clear();
    this.changed.clear();
    this.schedule();
  }
  // ── Flush ──────────────────────────────────────────────────────────────────
  onFlush(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /**
   * Choose **when** a coalesced flush fires. `'manual'` disarms auto-flush so the
   * engine's single rAF drives it — which is how the renderer stays on one clock.
   */
  setFlushMode(mode) {
    this.flushMode = mode;
    if (mode === "manual" && this.scheduled) {
      this.cancel?.();
      this.scheduled = false;
    }
  }
  /** Emit the pending delta, if any. Safe to call when nothing is dirty. */
  flush() {
    this.scheduled = false;
    if (this.added.size === 0 && this.changed.size === 0 && this.removed.size === 0) return;
    const event = {
      added: [...this.added],
      changed: [...this.changed],
      removed: [...this.removed],
      version: ++this.version
    };
    this.added.clear();
    this.changed.clear();
    this.removed.clear();
    for (const listener of this.listeners) listener(event);
  }
  schedule() {
    if (this.scheduled || this.flushMode === "manual") return;
    this.scheduled = true;
    this.cancel = scheduleFlush(this.flushMode, () => this.flush());
  }
};

// src/headless/HeadlessCameraBinding.ts
var HeadlessCameraBinding = class {
  t = { x: 0, y: 0, zoom: 1 };
  screenWidth;
  screenHeight;
  changeListeners = /* @__PURE__ */ new Set();
  dragStartListeners = /* @__PURE__ */ new Set();
  /** Every `configureInput` patch received, in order — for asserting input wiring. */
  inputConfigs = [];
  /** Latest `setDragSuspended` value. */
  dragSuspended = false;
  /** Accumulated `tick` time, to prove the engine drives the clock. */
  tickedMs = 0;
  constructor(screenWidth = 800, screenHeight = 600) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }
  getTransform() {
    return { ...this.t };
  }
  setTransform(t) {
    this.t = { ...t };
  }
  zoomToCentre(zoom) {
    const cx = this.screenWidth / 2;
    const cy = this.screenHeight / 2;
    const world = this.toWorld(cx, cy);
    this.t = { x: cx - world.x * zoom, y: cy - world.y * zoom, zoom };
  }
  resize(screenWidth, screenHeight) {
    this.screenWidth = screenWidth;
    this.screenHeight = screenHeight;
  }
  toWorld(screenX, screenY) {
    return { x: (screenX - this.t.x) / this.t.zoom, y: (screenY - this.t.y) / this.t.zoom };
  }
  toScreen(worldX, worldY) {
    return { x: worldX * this.t.zoom + this.t.x, y: worldY * this.t.zoom + this.t.y };
  }
  getVisibleBounds() {
    const tl = this.toWorld(0, 0);
    const br = this.toWorld(this.screenWidth, this.screenHeight);
    return { x: tl.x, y: tl.y, width: br.x - tl.x, height: br.y - tl.y };
  }
  configureInput(config) {
    this.inputConfigs.push(config);
  }
  setDragSuspended(suspended) {
    this.dragSuspended = suspended;
  }
  onTransformChange(fn) {
    this.changeListeners.add(fn);
    return () => this.changeListeners.delete(fn);
  }
  onDragStart(fn) {
    this.dragStartListeners.add(fn);
    return () => this.dragStartListeners.delete(fn);
  }
  tick(dtMs) {
    this.tickedMs += dtMs;
  }
  // ─── Test-only drivers ───────────────────────────────────────────────────
  /** Simulate a backend-driven transform change (wheel, drag, momentum). */
  emitTransformChange(t, kind) {
    this.t = { ...t };
    for (const fn of this.changeListeners) fn(kind);
  }
  /** Simulate the backend reporting the start of a drag-pan. */
  emitDragStart() {
    for (const fn of this.dragStartListeners) fn();
  }
};

// src/headless/HeadlessRenderer.ts
function noopOverlay() {
  const self = {
    clear: () => self,
    moveTo: () => self,
    lineTo: () => self,
    quadraticCurveTo: () => self,
    closePath: () => self,
    rect: () => self,
    roundRect: () => self,
    ellipse: () => self,
    poly: () => self,
    fill: () => self,
    stroke: () => self,
    setVisible: () => self,
    setZIndex: () => self,
    setPosition: () => self,
    destroy: () => {
    }
  };
  return self;
}
var HeadlessElementRenderer = class {
  events = new EventEmitter();
  shapes = /* @__PURE__ */ new Map();
  connectors = /* @__PURE__ */ new Set();
  shapeKinds = /* @__PURE__ */ new Set([
    "circle",
    "ellipse",
    "rect",
    "tabbed-rect",
    "polygon",
    "regular-polygon",
    "star",
    "arc",
    "path",
    "composite"
  ]);
  registerShape(kind) {
    this.shapeKinds.add(kind);
  }
  getShapeKind(id) {
    return this.shapes.get(id)?.kind;
  }
  hasShape(id) {
    return this.shapes.has(id);
  }
  hasConnector(id) {
    return this.connectors.has(id);
  }
  addShape(id, spec) {
    this.shapes.set(id, { kind: spec.kind, x: spec.x ?? 0, y: spec.y ?? 0 });
  }
  updateShape(id, patch) {
    const cur = this.shapes.get(id);
    if (cur) this.shapes.set(id, { ...cur, ...patch });
  }
  removeShape(id) {
    this.shapes.delete(id);
  }
  addConnector(id) {
    this.connectors.add(id);
  }
  updateConnector() {
  }
  removeConnector(id) {
    this.connectors.delete(id);
  }
  moveShape(id, x, y) {
    const cur = this.shapes.get(id);
    if (cur) this.shapes.set(id, { ...cur, x, y });
  }
  getShapePosition(id) {
    const s = this.shapes.get(id);
    return s ? { x: s.x, y: s.y } : null;
  }
  /**
   * Display overrides by shape id — recorded so a test can assert what a
   * behaviour asked to draw. Nothing is drawn, and positions stay logical.
   */
  displayOverrides = /* @__PURE__ */ new Map();
  setShapeDisplayOverride(id, override) {
    if (!this.shapes.has(id)) return;
    if (override === null) this.displayOverrides.delete(id);
    else this.displayOverrides.set(id, override);
  }
  clearShapeDisplayOverrides() {
    this.displayOverrides.clear();
  }
  /**
   * Ids whose text the LOD channel has hidden (`setShapeTextVisible` /
   * `setConnectorTextVisible` with `false`) — recorded so a behaviour test can
   * assert what a text LOD asked for.
   */
  textHidden = /* @__PURE__ */ new Set();
  setShapeTextVisible(id, visible) {
    if (visible) this.textHidden.delete(id);
    else this.textHidden.add(id);
  }
  setConnectorTextVisible(id, visible) {
    if (visible) this.textHidden.delete(id);
    else this.textHidden.add(id);
  }
  isTextVisible(id) {
    if (!this.shapes.has(id) && !this.connectors.has(id)) return false;
    return !this.textHidden.has(id);
  }
  /** The label-size policy last pushed per target — recorded for assertions. */
  labelSizePolicies = {
    shape: null,
    connector: null
  };
  setLabelSizePolicy(target, policy) {
    this.labelSizePolicies[target] = policy;
  }
  // Everything below is a no-op or a null answer: these are the calls a layer
  // makes for pixels, and there are none here.
  scaleShape() {
  }
  setConnectorStroke() {
  }
  scaleConnectorStroke() {
  }
  setRaised() {
  }
  setShapeIconVisible() {
  }
  setShapeImageVisible() {
  }
  setLabelsResolution() {
  }
  setVisibleSet() {
  }
  cull() {
  }
  uncull() {
  }
  setDecoration() {
  }
  setEffect() {
  }
  getDecoration() {
    return void 0;
  }
  setDecorationVisible() {
  }
  getDecorationWorldBounds() {
    return null;
  }
  setBadge() {
  }
  removeBadge() {
  }
  getShapeWorldBounds() {
    return null;
  }
  getShapeCenter() {
    return null;
  }
  getConnectorPolyline() {
    return null;
  }
  connectorGeometryUnchanged() {
    return false;
  }
  /**
   * Pure geometry, answered for real: the kernel's spec-geometry covers every
   * built-in kind, so a headless canvas measures node footprints exactly like
   * a drawing backend would (`GraphLayer.boundsOfNode`, minimap estimates,
   * ELK size queries — and `getBounds()`'s store-derived fit box — all work
   * with no GPU). `undefined` only for unregistered third-party kinds.
   */
  boundsOfSpec(spec) {
    return boundsOfSpec(spec);
  }
  scaleShapeSpec() {
    return void 0;
  }
  collapsedShapeSpec() {
    return void 0;
  }
  fitShapeSpecToContent() {
    return void 0;
  }
  measureLabel() {
    return null;
  }
  hitTest() {
    return null;
  }
  setHitTestEnabled() {
  }
  reindexScaledShapeHits() {
  }
  reanchorAllConnectors() {
  }
  reRouteAllConnectors() {
  }
  tickAnimations() {
  }
  toSVG() {
    return "";
  }
  destroy() {
    this.shapes.clear();
    this.connectors.clear();
  }
};
var HeadlessSurface = class {
  constructor(id, space) {
    this.id = id;
    this.space = space;
  }
  primitives = new HeadlessElementRenderer();
  /** Last backdrop pushed — lets a background test assert without pixels. */
  backdrop = null;
  visible = true;
  /** Last alpha pushed — lets an entrance test assert without pixels. */
  alpha = 1;
  zIndex = 0;
  destroyed = false;
  overlay() {
    return noopOverlay();
  }
  setBackdrop(backdrop) {
    this.backdrop = backdrop;
  }
  setVisible(visible) {
    this.visible = visible;
  }
  setAlpha(alpha) {
    this.alpha = alpha;
  }
  setZIndex(z) {
    this.zIndex = z;
  }
  destroy() {
    this.destroyed = true;
    this.primitives.destroy();
  }
};
var HeadlessRenderer = class {
  backend = "canvas";
  canvasElement = null;
  /** Every surface handed out, by layer id — for asserting layer lifecycle. */
  surfaces = /* @__PURE__ */ new Map();
  binding = new HeadlessCameraBinding();
  camera;
  destroyed = false;
  /** Every `tick(dt)` the engine drove, in order. */
  frames = [];
  get capabilities() {
    return {
      effects: "none",
      textMode: "native",
      rasterExport: false,
      depth: false,
      specKinds: []
    };
  }
  mount() {
  }
  createSurface(space, id) {
    const s = new HeadlessSurface(id, space);
    this.surfaces.set(id, s);
    return s;
  }
  createOverlay() {
    return noopOverlay();
  }
  createCameraBinding() {
    return this.binding;
  }
  attachCamera(camera) {
    this.camera = camera;
  }
  worldContentBounds() {
    return null;
  }
  resize() {
  }
  /** Records the frames the engine drove, so a test can assert the clock ran. */
  tick(dtMs) {
    this.frames.push(dtMs);
  }
  destroy() {
    this.destroyed = true;
  }
};

// src/lib/geometry/connectors/anchors/center.ts
var centerAnchor = (endpoint, _fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`centerAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  return { x: ref.center.x, y: ref.center.y };
};

// src/lib/geometry/connectors/anchors/boundary.ts
var boundaryAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`boundaryAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  const localFromCenter = {
    x: fromPoint.x - ref.center.x,
    y: fromPoint.y - ref.center.y
  };
  const localPoint = ref.boundaryIntersect?.(localFromCenter) ?? { x: 0, y: 0 };
  const x = ref.center.x + localPoint.x;
  const y = ref.center.y + localPoint.y;
  const len2 = Math.hypot(localPoint.x, localPoint.y);
  const tangent = len2 === 0 ? { x: 1, y: 0 } : { x: localPoint.x / len2, y: localPoint.y / len2 };
  return { x, y, tangent };
};

// src/lib/geometry/connectors/anchors/perpendicular.ts
var perpendicularAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`perpendicularAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  const dx = fromPoint.x - ref.center.x;
  const dy = fromPoint.y - ref.center.y;
  const halfW = ref.bounds.width / 2;
  const halfH = ref.bounds.height / 2;
  if (dx === 0 && dy === 0) {
    return {
      x: ref.center.x + halfW,
      y: ref.center.y,
      tangent: { x: 1, y: 0 }
    };
  }
  const rx = halfW > 0 ? Math.abs(dx) / halfW : Infinity;
  const ry = halfH > 0 ? Math.abs(dy) / halfH : Infinity;
  if (rx >= ry) {
    const sx = dx >= 0 ? halfW : -halfW;
    return {
      x: ref.center.x + sx,
      y: ref.center.y,
      tangent: { x: dx >= 0 ? 1 : -1, y: 0 }
    };
  }
  const sy = dy >= 0 ? halfH : -halfH;
  return {
    x: ref.center.x,
    y: ref.center.y + sy,
    tangent: { x: 0, y: dy >= 0 ? 1 : -1 }
  };
};

// src/lib/geometry/connectors/anchors/edgePort.ts
var edgePortAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`edgePortAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  const opts = endpoint.opts;
  const offset = opts?.offset ?? 0;
  const halfW = ref.bounds.width / 2;
  const halfH = ref.bounds.height / 2;
  const requestedSide = opts?.side ?? "auto";
  const side = requestedSide === "auto" ? resolveAutoSide(fromPoint, ref.center) : requestedSide;
  switch (side) {
    case "left":
      return {
        x: ref.center.x - halfW,
        y: ref.center.y + offset,
        tangent: { x: -1, y: 0 }
      };
    case "right":
      return {
        x: ref.center.x + halfW,
        y: ref.center.y + offset,
        tangent: { x: 1, y: 0 }
      };
    case "top":
      return {
        x: ref.center.x + offset,
        y: ref.center.y - halfH,
        tangent: { x: 0, y: -1 }
      };
    case "bottom":
      return {
        x: ref.center.x + offset,
        y: ref.center.y + halfH,
        tangent: { x: 0, y: 1 }
      };
  }
};
function resolveAutoSide(fromPoint, center) {
  const dx = fromPoint.x - center.x;
  const dy = fromPoint.y - center.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "bottom" : "top";
}

// src/lib/geometry/connectors/anchors/silhouettePort.ts
var silhouettePortAnchor = (endpoint, fromPoint, ctx) => {
  const ref = ctx.getShape(endpoint.shapeId);
  if (!ref) {
    throw new Error(`silhouettePortAnchor: unknown shape "${endpoint.shapeId}"`);
  }
  const opts = endpoint.opts;
  const offset = opts?.offset ?? 0;
  const halfW = ref.bounds.width / 2;
  const halfH = ref.bounds.height / 2;
  const requestedSide = opts?.side ?? "auto";
  const side = requestedSide === "auto" ? resolveAutoSide2(fromPoint, ref.center) : requestedSide;
  let localTarget;
  switch (side) {
    case "left":
      localTarget = { x: -halfW, y: offset };
      break;
    case "right":
      localTarget = { x: halfW, y: offset };
      break;
    case "top":
      localTarget = { x: offset, y: -halfH };
      break;
    case "bottom":
      localTarget = { x: offset, y: halfH };
      break;
  }
  const exit = ref.boundaryIntersect?.(localTarget) ?? localTarget;
  const x = ref.center.x + exit.x;
  const y = ref.center.y + exit.y;
  const len2 = Math.hypot(exit.x, exit.y);
  const tangent = len2 === 0 ? { x: 1, y: 0 } : { x: exit.x / len2, y: exit.y / len2 };
  return { x, y, tangent };
};
function resolveAutoSide2(fromPoint, center) {
  const dx = fromPoint.x - center.x;
  const dy = fromPoint.y - center.y;
  if (Math.abs(dx) >= Math.abs(dy)) return dx >= 0 ? "right" : "left";
  return dy >= 0 ? "bottom" : "top";
}

// src/lib/geometry/connectors/routers/straight.ts
var straightRouter = (source, target, waypoints) => {
  if (!waypoints || waypoints.length === 0) {
    return [
      { x: source.x, y: source.y },
      { x: target.x, y: target.y }
    ];
  }
  return [
    { x: source.x, y: source.y },
    ...waypoints.map((p) => ({ x: p.x, y: p.y })),
    { x: target.x, y: target.y }
  ];
};

// src/lib/geometry/connectors/routers/orth.ts
var orthRouter = (source, target, waypoints) => {
  const hasWaypoints = waypoints !== void 0 && waypoints.length > 0;
  if (!hasWaypoints && source.tangent && target.tangent && source.x !== target.x && source.y !== target.y) {
    const srcH = Math.abs(source.tangent.x) > Math.abs(source.tangent.y);
    const tgtH = Math.abs(target.tangent.x) > Math.abs(target.tangent.y);
    if (srcH && tgtH) {
      const midX = (source.x + target.x) / 2;
      return [
        { x: source.x, y: source.y },
        { x: midX, y: source.y },
        { x: midX, y: target.y },
        { x: target.x, y: target.y }
      ];
    }
    if (!srcH && !tgtH) {
      const midY = (source.y + target.y) / 2;
      return [
        { x: source.x, y: source.y },
        { x: source.x, y: midY },
        { x: target.x, y: midY },
        { x: target.x, y: target.y }
      ];
    }
  }
  const points = hasWaypoints ? [source, ...waypoints, target] : [source, target];
  const out = [{ x: source.x, y: source.y }];
  let prevDir = null;
  for (let i = 0; i < points.length - 1; i++) {
    const P = points[i];
    const Q = points[i + 1];
    const isFirst = i === 0;
    const isLast = i === points.length - 2;
    if (P.x === Q.x) {
      out.push({ x: Q.x, y: Q.y });
      prevDir = "V";
      continue;
    }
    if (P.y === Q.y) {
      out.push({ x: Q.x, y: Q.y });
      prevDir = "H";
      continue;
    }
    const goHFirst = pickHFirst({
      source: isFirst ? source : null,
      target: isLast ? target : null,
      prevDir,
      P,
      Q
    });
    const bend = goHFirst ? { x: Q.x, y: P.y } : { x: P.x, y: Q.y };
    out.push(bend);
    out.push({ x: Q.x, y: Q.y });
    prevDir = goHFirst ? "V" : "H";
  }
  return out;
};
function pickHFirst({ source, target, prevDir, P, Q }) {
  if (source?.tangent) {
    return Math.abs(source.tangent.x) >= Math.abs(source.tangent.y);
  }
  if (target?.tangent) {
    return Math.abs(target.tangent.y) >= Math.abs(target.tangent.x);
  }
  if (prevDir === "H") return false;
  if (prevDir === "V") return true;
  return Math.abs(Q.x - P.x) >= Math.abs(Q.y - P.y);
}

// src/lib/geometry/connectors/routers/_obstacleGrid.ts
var DEFAULT_GRID_STEP = 16;
var DEFAULT_MARGIN = 64;
var DEFAULT_INFLATE = 4;
var DEFAULT_MAX_CELLS = 4e4;
function buildObstacleGrid(opts) {
  const requestedStep = opts.gridStep ?? DEFAULT_GRID_STEP;
  const margin = opts.margin ?? DEFAULT_MARGIN;
  const inflate = opts.inflate ?? DEFAULT_INFLATE;
  const maxCells = opts.maxCells ?? DEFAULT_MAX_CELLS;
  if (requestedStep <= 0) return null;
  const seedMinX = Math.min(opts.source.x, opts.target.x) - margin;
  const seedMaxX = Math.max(opts.source.x, opts.target.x) + margin;
  const seedMinY = Math.min(opts.source.y, opts.target.y) - margin;
  const seedMaxY = Math.max(opts.source.y, opts.target.y) + margin;
  let minX = seedMinX;
  let maxX = seedMaxX;
  let minY = seedMinY;
  let maxY = seedMaxY;
  for (const r of opts.obstacles) {
    const r1x = r.x + r.width;
    const r1y = r.y + r.height;
    if (r.x > seedMaxX || r1x < seedMinX || r.y > seedMaxY || r1y < seedMinY) continue;
    if (r.x < minX) minX = r.x;
    if (r.y < minY) minY = r.y;
    if (r1x > maxX) maxX = r1x;
    if (r1y > maxY) maxY = r1y;
  }
  const spanX = maxX - minX;
  const spanY = maxY - minY;
  const fitStep = Math.sqrt(Math.max(spanX, 1) * Math.max(spanY, 1) / maxCells);
  const gridStep = fitStep > requestedStep ? fitStep : requestedStep;
  const width = Math.max(1, Math.ceil(spanX / gridStep));
  const height = Math.max(1, Math.ceil(spanY / gridStep));
  const cells = new Uint8Array(width * height);
  const originX = minX + gridStep / 2;
  const originY = minY + gridStep / 2;
  for (const r of opts.obstacles) {
    const ix0 = r.x - inflate;
    const iy0 = r.y - inflate;
    const ix1 = r.x + r.width + inflate;
    const iy1 = r.y + r.height + inflate;
    const cMinX = Math.max(0, Math.floor((ix0 - originX) / gridStep));
    const cMaxX = Math.min(width - 1, Math.ceil((ix1 - originX) / gridStep));
    const cMinY = Math.max(0, Math.floor((iy0 - originY) / gridStep));
    const cMaxY = Math.min(height - 1, Math.ceil((iy1 - originY) / gridStep));
    const silhouette = r.containsInflated;
    for (let cy = cMinY; cy <= cMaxY; cy++) {
      for (let cx = cMinX; cx <= cMaxX; cx++) {
        const wx = originX + cx * gridStep;
        const wy = originY + cy * gridStep;
        if (wx < ix0 || wx > ix1 || wy < iy0 || wy > iy1) continue;
        if (silhouette && !silhouette(wx, wy, inflate)) continue;
        cells[cy * width + cx] = 1;
      }
    }
  }
  return { width, height, originX, originY, cellSize: gridStep, cells };
}
function worldToCell(grid, p) {
  return {
    cx: Math.round((p.x - grid.originX) / grid.cellSize),
    cy: Math.round((p.y - grid.originY) / grid.cellSize)
  };
}
function cellToWorld(grid, cx, cy) {
  return {
    x: grid.originX + cx * grid.cellSize,
    y: grid.originY + cy * grid.cellSize
  };
}
function isFreeCell(grid, cx, cy) {
  if (cx < 0 || cy < 0 || cx >= grid.width || cy >= grid.height) return false;
  return grid.cells[cy * grid.width + cx] === 0;
}

// src/lib/geometry/connectors/routers/_aStar.ts
var SQRT2 = Math.SQRT2;
var DIRS_4 = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1]
];
var DIRS_8 = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, SQRT2],
  [1, -1, SQRT2],
  [-1, 1, SQRT2],
  [-1, -1, SQRT2]
];
function aStar(grid, start, goal, opts) {
  const startSnapped = snapToFree(grid, start);
  const goalSnapped = snapToFree(grid, goal);
  if (!startSnapped || !goalSnapped) return null;
  const w = grid.width;
  const startIdx = startSnapped.cy * w + startSnapped.cx;
  const goalIdx = goalSnapped.cy * w + goalSnapped.cx;
  if (startIdx === goalIdx) return [startSnapped];
  const dirs = opts.connectivity === 4 ? DIRS_4 : DIRS_8;
  const heuristic = opts.connectivity === 4 ? manhattanH : octileH;
  const gScore = /* @__PURE__ */ new Map();
  const cameFrom = /* @__PURE__ */ new Map();
  const closed = /* @__PURE__ */ new Set();
  gScore.set(startIdx, 0);
  const open = new MinHeap();
  open.push(startIdx, heuristic(startSnapped, goalSnapped));
  while (open.size > 0) {
    const cur = open.pop();
    if (closed.has(cur)) continue;
    closed.add(cur);
    if (cur === goalIdx) return reconstruct(cameFrom, cur, w);
    const cx = cur % w;
    const cy = Math.floor(cur / w);
    const curG = gScore.get(cur);
    for (const [dx, dy, cost] of dirs) {
      const ncx = cx + dx;
      const ncy = cy + dy;
      if (!isFreeCell(grid, ncx, ncy)) continue;
      if (dx !== 0 && dy !== 0) {
        if (!isFreeCell(grid, cx + dx, cy)) continue;
        if (!isFreeCell(grid, cx, cy + dy)) continue;
      }
      const nIdx = ncy * w + ncx;
      if (closed.has(nIdx)) continue;
      const tentativeG = curG + cost;
      const prevG = gScore.get(nIdx) ?? Infinity;
      if (tentativeG < prevG) {
        gScore.set(nIdx, tentativeG);
        cameFrom.set(nIdx, cur);
        const f = tentativeG + heuristic({ cx: ncx, cy: ncy }, goalSnapped);
        open.push(nIdx, f);
      }
    }
  }
  return null;
}
function simplifyCellPath(cells) {
  if (cells.length <= 2) return cells.slice();
  const out = [cells[0]];
  for (let i = 1; i < cells.length - 1; i++) {
    const prev = cells[i - 1];
    const cur = cells[i];
    const next = cells[i + 1];
    const dx1 = sign(cur.cx - prev.cx);
    const dy1 = sign(cur.cy - prev.cy);
    const dx2 = sign(next.cx - cur.cx);
    const dy2 = sign(next.cy - cur.cy);
    if (dx1 !== dx2 || dy1 !== dy2) out.push(cur);
  }
  out.push(cells[cells.length - 1]);
  return out;
}
function sign(n2) {
  return n2 > 0 ? 1 : n2 < 0 ? -1 : 0;
}
function manhattanH(a, b) {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);
}
function octileH(a, b) {
  const dx = Math.abs(a.cx - b.cx);
  const dy = Math.abs(a.cy - b.cy);
  return dx + dy + (SQRT2 - 2) * Math.min(dx, dy);
}
function snapToFree(grid, c) {
  if (isFreeCell(grid, c.cx, c.cy)) return c;
  for (let r = 1; r <= 8; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
        if (isFreeCell(grid, c.cx + dx, c.cy + dy)) {
          return { cx: c.cx + dx, cy: c.cy + dy };
        }
      }
    }
  }
  return null;
}
function reconstruct(cameFrom, end, w) {
  const out = [];
  let cur = end;
  while (cur !== void 0) {
    out.push({ cx: cur % w, cy: Math.floor(cur / w) });
    cur = cameFrom.get(cur);
  }
  return out.reverse();
}
var MinHeap = class {
  p = [];
  v = [];
  get size() {
    return this.p.length;
  }
  push(value, priority) {
    this.p.push(priority);
    this.v.push(value);
    this.bubbleUp(this.p.length - 1);
  }
  pop() {
    if (this.p.length === 0) return void 0;
    const top = this.v[0];
    const lastP = this.p.pop();
    const lastV = this.v.pop();
    if (this.p.length > 0) {
      this.p[0] = lastP;
      this.v[0] = lastV;
      this.bubbleDown(0);
    }
    return top;
  }
  bubbleUp(i) {
    while (i > 0) {
      const parent = i - 1 >> 1;
      if (this.p[i] < this.p[parent]) {
        this.swap(i, parent);
        i = parent;
      } else break;
    }
  }
  bubbleDown(i) {
    const n2 = this.p.length;
    while (true) {
      const left = i * 2 + 1;
      const right = i * 2 + 2;
      let smallest = i;
      if (left < n2 && this.p[left] < this.p[smallest]) smallest = left;
      if (right < n2 && this.p[right] < this.p[smallest]) smallest = right;
      if (smallest === i) break;
      this.swap(i, smallest);
      i = smallest;
    }
  }
  swap(a, b) {
    const pa = this.p[a];
    const va = this.v[a];
    this.p[a] = this.p[b];
    this.v[a] = this.v[b];
    this.p[b] = pa;
    this.v[b] = va;
  }
};

// src/lib/geometry/connectors/routers/manhattan.ts
var DEFAULT_INFLATE2 = 4;
var DEFAULT_STUB_LENGTH = 24;
var manhattanRouter = (source, target, waypoints, opts, ctx) => {
  const obstacles = ctx?.obstacles ?? [];
  const simple = orthRouter(source, target, waypoints);
  if (obstacles.length === 0) return simple;
  const o = opts;
  const inflate = o?.inflate ?? DEFAULT_INFLATE2;
  if (!polylineCrossesObstacles(simple, obstacles, inflate)) {
    return simple;
  }
  const stubLength = o?.stubLength ?? DEFAULT_STUB_LENGTH;
  const sourceStub = source.tangent && stubLength > 0 ? { x: source.x + source.tangent.x * stubLength, y: source.y + source.tangent.y * stubLength } : { x: source.x, y: source.y };
  const targetStub = target.tangent && stubLength > 0 ? { x: target.x + target.tangent.x * stubLength, y: target.y + target.tangent.y * stubLength } : { x: target.x, y: target.y };
  const grid = buildObstacleGrid({
    source: sourceStub,
    target: targetStub,
    obstacles,
    gridStep: o?.gridStep,
    margin: o?.margin,
    inflate: o?.inflate,
    maxCells: o?.maxCells
  });
  if (!grid) {
    if (typeof console !== "undefined") {
      console.warn("manhattanRouter: obstacle grid exceeded maxCells; falling back to orth.");
    }
    return simple;
  }
  const startCell = worldToCell(grid, sourceStub);
  const goalCell = worldToCell(grid, targetStub);
  const cells = aStar(grid, startCell, goalCell, { connectivity: 4 });
  if (!cells) {
    if (typeof console !== "undefined") {
      console.warn("manhattanRouter: A* found no path through obstacles; falling back to orth.");
    }
    return simple;
  }
  const simplified = simplifyCellPath(cells);
  const middle = [{ x: sourceStub.x, y: sourceStub.y }];
  for (let i = 1; i < simplified.length - 1; i++) {
    const c = simplified[i];
    middle.push(cellToWorld(grid, c.cx, c.cy));
  }
  middle.push({ x: targetStub.x, y: targetStub.y });
  const simplifiedMiddle = simplifyOrthPolylineAroundObstacles(middle, obstacles, inflate);
  const out = [{ x: source.x, y: source.y }];
  for (const p of simplifiedMiddle) {
    const last = out[out.length - 1];
    if (p.x === last.x && p.y === last.y) continue;
    out.push(p);
  }
  const tEnd = { x: target.x, y: target.y };
  const lastOut = out[out.length - 1];
  if (lastOut.x !== tEnd.x || lastOut.y !== tEnd.y) out.push(tEnd);
  return out;
};
function polylineCrossesObstacles(polyline, obstacles, inflate) {
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    for (const r of obstacles) {
      if (segmentCrossesRect(a, b, r, inflate)) return true;
    }
  }
  return false;
}
function segmentCrossesRect(a, b, r, inflate) {
  const x0 = r.x - inflate;
  const y0 = r.y - inflate;
  const x1 = r.x + r.width + inflate;
  const y1 = r.y + r.height + inflate;
  if (a.y === b.y) {
    if (a.y < y0 || a.y > y1) return false;
    const segMinX = a.x < b.x ? a.x : b.x;
    const segMaxX = a.x < b.x ? b.x : a.x;
    if (segMaxX < x0 || segMinX > x1) return false;
    return segmentHitsSilhouette(a, b, r, inflate);
  }
  if (a.x === b.x) {
    if (a.x < x0 || a.x > x1) return false;
    const segMinY = a.y < b.y ? a.y : b.y;
    const segMaxY = a.y < b.y ? b.y : a.y;
    if (segMaxY < y0 || segMinY > y1) return false;
    return segmentHitsSilhouette(a, b, r, inflate);
  }
  return true;
}
function segmentHitsSilhouette(a, b, obstacle, inflate) {
  const test = obstacle.containsInflated;
  if (!test) return true;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = Math.abs(dx) + Math.abs(dy);
  const step = Math.max(inflate / 2, 2);
  const samples = Math.min(64, Math.max(2, Math.ceil(len2 / step)));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const wx = a.x + dx * t;
    const wy = a.y + dy * t;
    if (test(wx, wy, inflate)) return true;
  }
  return false;
}
function simplifyOrthPolylineAroundObstacles(points, obstacles, inflate) {
  if (points.length <= 2) return points.slice();
  const out = [points[0]];
  let i = 0;
  while (i < points.length - 1) {
    let bestJ = i + 1;
    let bestBend = null;
    for (let j = i + 2; j < points.length; j++) {
      const conn = findClearOrthConnection(points[i], points[j], obstacles, inflate);
      if (conn === void 0) break;
      bestJ = j;
      bestBend = conn;
    }
    if (bestBend !== null) {
      const last = out[out.length - 1];
      if (bestBend.x !== last.x || bestBend.y !== last.y) out.push(bestBend);
    }
    out.push(points[bestJ]);
    i = bestJ;
  }
  return out;
}
function findClearOrthConnection(a, b, obstacles, inflate) {
  if (a.x === b.x || a.y === b.y) {
    return segmentCrosses(a, b, obstacles, inflate) ? void 0 : null;
  }
  const bendH = { x: b.x, y: a.y };
  const hClear = !segmentCrosses(a, bendH, obstacles, inflate) && !segmentCrosses(bendH, b, obstacles, inflate);
  if (hClear) return bendH;
  const bendV = { x: a.x, y: b.y };
  const vClear = !segmentCrosses(a, bendV, obstacles, inflate) && !segmentCrosses(bendV, b, obstacles, inflate);
  if (vClear) return bendV;
  return void 0;
}
function segmentCrosses(a, b, obstacles, inflate) {
  for (const r of obstacles) {
    if (segmentCrossesRect(a, b, r, inflate)) return true;
  }
  return false;
}

// src/lib/geometry/connectors/routers/metro.ts
var DEFAULT_INFLATE3 = 4;
var metroRouter = (source, target, waypoints, opts, ctx) => {
  const simple = simpleMetroPolyline(source, target, waypoints);
  const obstacles = ctx?.obstacles ?? [];
  if (obstacles.length === 0) return simple;
  const o = opts;
  const inflate = o?.inflate ?? DEFAULT_INFLATE3;
  if (!polylineCrossesAnyObstacle(simple, obstacles, inflate)) {
    return simple;
  }
  const grid = buildObstacleGrid({
    source,
    target,
    obstacles,
    gridStep: o?.gridStep,
    margin: o?.margin,
    inflate: o?.inflate,
    maxCells: o?.maxCells
  });
  if (!grid) {
    if (typeof console !== "undefined") {
      console.warn("metroRouter: obstacle grid exceeded maxCells; falling back to simple metro.");
    }
    return simple;
  }
  const startCell = worldToCell(grid, source);
  const goalCell = worldToCell(grid, target);
  const cells = aStar(grid, startCell, goalCell, { connectivity: 8 });
  if (!cells) {
    if (typeof console !== "undefined") {
      console.warn("metroRouter: A* found no path through obstacles; falling back to simple metro.");
    }
    return simple;
  }
  const simplified = simplifyCellPath(cells);
  const out = [{ x: source.x, y: source.y }];
  for (let i = 1; i < simplified.length - 1; i++) {
    const c = simplified[i];
    out.push(cellToWorld(grid, c.cx, c.cy));
  }
  out.push({ x: target.x, y: target.y });
  return out;
};
function simpleMetroPolyline(source, target, waypoints) {
  const points = waypoints && waypoints.length > 0 ? [source, ...waypoints, target] : [source, target];
  const out = [{ x: source.x, y: source.y }];
  for (let i = 0; i < points.length - 1; i++) {
    const P = points[i];
    const Q = points[i + 1];
    const dx = Q.x - P.x;
    const dy = Q.y - P.y;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    if (adx === 0 || ady === 0 || adx === ady) {
      out.push({ x: Q.x, y: Q.y });
      continue;
    }
    if (adx > ady) {
      const bend = { x: P.x + Math.sign(dx) * (adx - ady), y: P.y };
      out.push(bend);
      out.push({ x: Q.x, y: Q.y });
    } else {
      const bend = { x: P.x, y: P.y + Math.sign(dy) * (ady - adx) };
      out.push(bend);
      out.push({ x: Q.x, y: Q.y });
    }
  }
  return out;
}
function polylineCrossesAnyObstacle(polyline, obstacles, inflate) {
  for (let i = 0; i < polyline.length - 1; i++) {
    const a = polyline[i];
    const b = polyline[i + 1];
    for (const r of obstacles) {
      if (segmentCrossesObstacle(a, b, r, inflate)) return true;
    }
  }
  return false;
}
function segmentCrossesObstacle(a, b, r, inflate) {
  const x0 = r.x - inflate;
  const y0 = r.y - inflate;
  const x1 = r.x + r.width + inflate;
  const y1 = r.y + r.height + inflate;
  const segMinX = a.x < b.x ? a.x : b.x;
  const segMaxX = a.x < b.x ? b.x : a.x;
  const segMinY = a.y < b.y ? a.y : b.y;
  const segMaxY = a.y < b.y ? b.y : a.y;
  if (segMaxX < x0 || segMinX > x1 || segMaxY < y0 || segMinY > y1) return false;
  if ((a.x === b.x || a.y === b.y) && !r.containsInflated) return true;
  const test = r.containsInflated;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = Math.hypot(dx, dy);
  const step = Math.max(inflate / 2, 2);
  const samples = Math.min(64, Math.max(2, Math.ceil(len2 / step)));
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const wx = a.x + dx * t;
    const wy = a.y + dy * t;
    if (test) {
      if (test(wx, wy, inflate)) return true;
    } else {
      if (wx >= x0 && wx <= x1 && wy >= y0 && wy <= y1) return true;
    }
  }
  return false;
}

// src/lib/geometry/connectors/routers/er.ts
var DEFAULT_STUB_LENGTH2 = 16;
var erRouter = (source, target, waypoints, opts) => {
  const stubLen = opts?.stubLength ?? DEFAULT_STUB_LENGTH2;
  const out = [{ x: source.x, y: source.y }];
  let cur = { x: source.x, y: source.y };
  if (source.tangent) {
    cur = offsetAlong(source, source.tangent, stubLen);
    out.push(cur);
  }
  let end = { x: target.x, y: target.y };
  let preEnd = null;
  if (target.tangent) {
    preEnd = offsetAlong(target, target.tangent, stubLen);
  }
  if (waypoints && waypoints.length > 0) {
    for (const w of waypoints) {
      bridgeOrthogonal(out, cur, { x: w.x, y: w.y }, prevAxis(out));
      cur = { x: w.x, y: w.y };
    }
  }
  const bridgeTarget = preEnd ?? end;
  bridgeOrthogonal(out, cur, bridgeTarget, prevAxis(out));
  if (preEnd) out.push(end);
  return out;
};
function offsetAlong(p, t, dist) {
  return { x: p.x + t.x * dist, y: p.y + t.y * dist };
}
function bridgeOrthogonal(out, from, to, prevAxisDir) {
  if (from.x === to.x || from.y === to.y) {
    if (from.x !== to.x || from.y !== to.y) out.push({ x: to.x, y: to.y });
    return;
  }
  const goHFirst = prevAxisDir === "H" ? false : prevAxisDir === "V" ? true : Math.abs(to.x - from.x) >= Math.abs(to.y - from.y);
  const bend = goHFirst ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  out.push(bend);
  out.push({ x: to.x, y: to.y });
}
function prevAxis(out) {
  if (out.length < 2) return null;
  const a = out[out.length - 2];
  const b = out[out.length - 1];
  if (a.x === b.x && a.y !== b.y) return "V";
  if (a.y === b.y && a.x !== b.x) return "H";
  return null;
}

// src/lib/geometry/connectors/routers/oneSide.ts
var DEFAULT_SIDE = "right";
var DEFAULT_PAD = 30;
var oneSideRouter = (source, target, _waypoints, opts) => {
  const o = opts;
  const side = o?.side ?? DEFAULT_SIDE;
  const pad = o?.padLength ?? DEFAULT_PAD;
  const isHorizontal = side === "left" || side === "right";
  const exit = isHorizontal ? { x: source.x + (side === "right" ? pad : -pad), y: source.y } : { x: source.x, y: source.y + (side === "bottom" ? pad : -pad) };
  const midBend = isHorizontal ? { x: exit.x, y: target.y } : { x: target.x, y: exit.y };
  const out = [{ x: source.x, y: source.y }, exit];
  if (midBend.x !== exit.x || midBend.y !== exit.y) out.push(midBend);
  if (midBend.x !== target.x || midBend.y !== target.y) out.push({ x: target.x, y: target.y });
  else if (out[out.length - 1].x !== target.x || out[out.length - 1].y !== target.y) {
    out.push({ x: target.x, y: target.y });
  }
  return out;
};

// src/lib/geometry/connectors/pathStyles/normal.ts
var normalPathStyle = (polyline) => {
  if (polyline.length < 2) return [];
  const out = [{ kind: "M", x: polyline[0].x, y: polyline[0].y }];
  for (let i = 1; i < polyline.length; i++) {
    out.push({ kind: "L", x: polyline[i].x, y: polyline[i].y });
  }
  return out;
};

// src/lib/geometry/connectors/pathStyles/rounded.ts
var DEFAULT_RADIUS = 8;
var roundedPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const radius = opts?.radius ?? DEFAULT_RADIUS;
  const out = [{ kind: "M", x: polyline[0].x, y: polyline[0].y }];
  if (polyline.length === 2) {
    out.push({ kind: "L", x: polyline[1].x, y: polyline[1].y });
    return out;
  }
  for (let i = 1; i < polyline.length - 1; i++) {
    const a = polyline[i - 1];
    const b = polyline[i];
    const c = polyline[i + 1];
    const ab = sub(b, a);
    const bc = sub(c, b);
    const lenAB = len(ab);
    const lenBC = len(bc);
    if (lenAB === 0 || lenBC === 0) {
      out.push({ kind: "L", x: b.x, y: b.y });
      continue;
    }
    const t = Math.min(radius, lenAB / 2, lenBC / 2);
    if (t <= 0) {
      out.push({ kind: "L", x: b.x, y: b.y });
      continue;
    }
    const p1 = { x: b.x - ab.x / lenAB * t, y: b.y - ab.y / lenAB * t };
    const p2 = { x: b.x + bc.x / lenBC * t, y: b.y + bc.y / lenBC * t };
    out.push({ kind: "L", x: p1.x, y: p1.y });
    out.push({ kind: "Q", cx: b.x, cy: b.y, x: p2.x, y: p2.y });
  }
  const last = polyline[polyline.length - 1];
  out.push({ kind: "L", x: last.x, y: last.y });
  return out;
};
function sub(a, b) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function len(v) {
  return Math.hypot(v.x, v.y);
}

// src/lib/geometry/connectors/pathStyles/bezier.ts
var DEFAULT_TENSION = 0.5;
var bezierPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const o = opts;
  const tension = o?.tension ?? DEFAULT_TENSION;
  const axisOpt = o?.axis ?? "auto";
  const s = polyline[0];
  const t = polyline[polyline.length - 1];
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const axis = axisOpt === "auto" ? Math.abs(dx) >= Math.abs(dy) ? "h" : "v" : axisOpt;
  const c1 = axis === "h" ? { x: s.x + dx * tension, y: s.y } : { x: s.x, y: s.y + dy * tension };
  const c2 = axis === "h" ? { x: t.x - dx * tension, y: t.y } : { x: t.x, y: t.y - dy * tension };
  const out = [
    { kind: "M", x: s.x, y: s.y },
    { kind: "C", c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, x: t.x, y: t.y }
  ];
  return out;
};

// src/lib/geometry/connectors/pathStyles/quadratic.ts
var DEFAULT_OFFSET = 30;
var DEFAULT_POSITION = 0.5;
var quadraticPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const o = opts;
  const offset = o?.curveOffset ?? DEFAULT_OFFSET;
  const position = o?.curvePosition ?? DEFAULT_POSITION;
  const s = polyline[0];
  const t = polyline[polyline.length - 1];
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const len2 = Math.hypot(dx, dy);
  if (len2 === 0) {
    return [{ kind: "M", x: s.x, y: s.y }];
  }
  const ax = s.x + dx * position;
  const ay = s.y + dy * position;
  const px = dy / len2;
  const py = -dx / len2;
  const cx = ax + px * offset;
  const cy = ay + py * offset;
  const out = [
    { kind: "M", x: s.x, y: s.y },
    { kind: "Q", cx, cy, x: t.x, y: t.y }
  ];
  return out;
};

// src/lib/geometry/connectors/pathStyles/bumpRadial.ts
var bumpRadialPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const origin = opts?.origin ?? { x: 0, y: 0 };
  const s = polyline[0];
  const t = polyline[polyline.length - 1];
  const sxRel = s.x - origin.x;
  const syRel = s.y - origin.y;
  const txRel = t.x - origin.x;
  const tyRel = t.y - origin.y;
  const r0 = Math.hypot(sxRel, syRel);
  const r1 = Math.hypot(txRel, tyRel);
  if (r0 === 0 || r1 === 0) {
    return [
      { kind: "M", x: s.x, y: s.y },
      { kind: "L", x: t.x, y: t.y }
    ];
  }
  const a0 = Math.atan2(syRel, sxRel);
  const a1 = Math.atan2(tyRel, txRel);
  const rMid = (r0 + r1) / 2;
  const c1x = origin.x + rMid * Math.cos(a0);
  const c1y = origin.y + rMid * Math.sin(a0);
  const c2x = origin.x + rMid * Math.cos(a1);
  const c2y = origin.y + rMid * Math.sin(a1);
  const out = [
    { kind: "M", x: s.x, y: s.y },
    { kind: "C", c1x, c1y, c2x, c2y, x: t.x, y: t.y }
  ];
  return out;
};

// src/lib/geometry/connectors/pathStyles/bumpHorizontal.ts
var bumpHorizontalPathStyle = (polyline, _opts, endpoints) => {
  if (polyline.length < 2) return [];
  const s = polyline[0];
  const t = polyline[polyline.length - 1];
  const handle = Math.abs(t.x - s.x) / 2;
  const sTan = endpoints?.source.tangent;
  const tTan = endpoints?.target.tangent;
  const c1x = sTan ? s.x + sTan.x * handle : (s.x + t.x) / 2;
  const c1y = sTan ? s.y + sTan.y * handle : s.y;
  const c2x = tTan ? t.x + tTan.x * handle : (s.x + t.x) / 2;
  const c2y = tTan ? t.y + tTan.y * handle : t.y;
  const out = [
    { kind: "M", x: s.x, y: s.y },
    { kind: "C", c1x, c1y, c2x, c2y, x: t.x, y: t.y }
  ];
  return out;
};

// src/lib/geometry/connectors/pathStyles/smooth.ts
var DEFAULT_TENSION2 = 1;
var smoothPathStyle = (polyline, opts) => {
  const n2 = polyline.length;
  if (n2 < 2) return [];
  const tension = opts?.tension ?? DEFAULT_TENSION2;
  const k = tension / 6;
  const out = [{ kind: "M", x: polyline[0].x, y: polyline[0].y }];
  for (let i = 0; i < n2 - 1; i++) {
    const p0 = polyline[i - 1] ?? polyline[i];
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const p3 = polyline[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) * k, y: p1.y + (p2.y - p0.y) * k };
    const c2 = { x: p2.x - (p3.x - p1.x) * k, y: p2.y - (p3.y - p1.y) * k };
    out.push({ kind: "C", c1x: c1.x, c1y: c1.y, c2x: c2.x, c2y: c2.y, x: p2.x, y: p2.y });
  }
  return out;
};

// src/lib/geometry/connectors/pathStyles/stepRadial.ts
var stepRadialPathStyle = (polyline, opts) => {
  if (polyline.length < 2) return [];
  const origin = opts?.origin ?? { x: 0, y: 0 };
  const s = polyline[0];
  const t = polyline[polyline.length - 1];
  const sxRel = s.x - origin.x;
  const syRel = s.y - origin.y;
  const txRel = t.x - origin.x;
  const tyRel = t.y - origin.y;
  const r0 = Math.hypot(sxRel, syRel);
  if (r0 === 0) {
    return [
      { kind: "M", x: s.x, y: s.y },
      { kind: "L", x: t.x, y: t.y }
    ];
  }
  const a0 = Math.atan2(syRel, sxRel);
  const a1 = Math.atan2(tyRel, txRel);
  let delta = a1 - a0;
  while (delta > Math.PI) delta -= 2 * Math.PI;
  while (delta < -Math.PI) delta += 2 * Math.PI;
  const arcEndX = origin.x + r0 * Math.cos(a1);
  const arcEndY = origin.y + r0 * Math.sin(a1);
  const out = [{ kind: "M", x: s.x, y: s.y }];
  if (Math.abs(delta) > 1e-9) {
    const numSegments = Math.max(1, Math.ceil(Math.abs(delta) / (Math.PI / 2)));
    const segAngle = delta / numSegments;
    const k = 4 / 3 * Math.tan(segAngle / 4) * r0;
    let theta = a0;
    let px = origin.x + r0 * Math.cos(theta);
    let py = origin.y + r0 * Math.sin(theta);
    for (let i = 0; i < numSegments; i++) {
      const nextTheta = theta + segAngle;
      const nx = origin.x + r0 * Math.cos(nextTheta);
      const ny = origin.y + r0 * Math.sin(nextTheta);
      const c1x = px + k * -Math.sin(theta);
      const c1y = py + k * Math.cos(theta);
      const c2x = nx - k * -Math.sin(nextTheta);
      const c2y = ny - k * Math.cos(nextTheta);
      out.push({ kind: "C", c1x, c1y, c2x, c2y, x: nx, y: ny });
      theta = nextTheta;
      px = nx;
      py = ny;
    }
  } else {
    out.push({ kind: "L", x: arcEndX, y: arcEndY });
  }
  out.push({ kind: "L", x: t.x, y: t.y });
  return out;
};

// src/lib/geometry/connectors/pathStyles/bundle.ts
var DEFAULT_BETA = 0.85;
var bundlePathStyle = (polyline, opts) => {
  const n2 = polyline.length;
  if (n2 < 2) return [];
  const p0 = polyline[0];
  const pn = polyline[n2 - 1];
  if (n2 === 2) {
    return [
      { kind: "M", x: p0.x, y: p0.y },
      { kind: "L", x: pn.x, y: pn.y }
    ];
  }
  const beta = clamp01(opts?.beta ?? DEFAULT_BETA);
  const dx = pn.x - p0.x;
  const dy = pn.y - p0.y;
  const inv = 1 / (n2 - 1);
  const bx = new Array(n2);
  const by = new Array(n2);
  for (let i = 0; i < n2; i++) {
    const t = i * inv;
    const pi = polyline[i];
    bx[i] = beta * pi.x + (1 - beta) * (p0.x + t * dx);
    by[i] = beta * pi.y + (1 - beta) * (p0.y + t * dy);
  }
  const out = [];
  out.push({ kind: "M", x: bx[0], y: by[0] });
  out.push({
    kind: "L",
    x: (5 * bx[0] + bx[1]) / 6,
    y: (5 * by[0] + by[1]) / 6
  });
  for (let i = 2; i < n2; i++) {
    const x0 = bx[i - 2];
    const y0 = by[i - 2];
    const x1 = bx[i - 1];
    const y1 = by[i - 1];
    const x = bx[i];
    const y = by[i];
    out.push({
      kind: "C",
      c1x: (2 * x0 + x1) / 3,
      c1y: (2 * y0 + y1) / 3,
      c2x: (x0 + 2 * x1) / 3,
      c2y: (y0 + 2 * y1) / 3,
      x: (x0 + 4 * x1 + x) / 6,
      y: (y0 + 4 * y1 + y) / 6
    });
  }
  const xN1 = bx[n2 - 2];
  const yN1 = by[n2 - 2];
  const xN = bx[n2 - 1];
  const yN = by[n2 - 1];
  out.push({
    kind: "C",
    c1x: (2 * xN1 + xN) / 3,
    c1y: (2 * yN1 + yN) / 3,
    c2x: (xN1 + 2 * xN) / 3,
    c2y: (yN1 + 2 * yN) / 3,
    x: (xN1 + 5 * xN) / 6,
    y: (yN1 + 5 * yN) / 6
  });
  out.push({ kind: "L", x: xN, y: yN });
  return out;
};
function clamp01(v) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// src/lib/geometry/connectors/pathStyles/loopPolyline.ts
var DEFAULT_SIDE2 = "top";
var DEFAULT_BASE_OFFSET = 28;
var DEFAULT_STUB_LENGTH3 = 30;
var DEFAULT_GAP = 30;
var CORNER_SIDES = /* @__PURE__ */ new Set([
  "top-right",
  "bottom-right",
  "bottom-left",
  "top-left"
]);
function sideToAngle(side) {
  if (typeof side === "number") return side;
  switch (side) {
    case "top":
      return -Math.PI / 2;
    case "top-right":
      return -Math.PI / 4;
    case "right":
      return 0;
    case "bottom-right":
      return Math.PI / 4;
    case "bottom":
      return Math.PI / 2;
    case "bottom-left":
      return 3 * Math.PI / 4;
    case "left":
      return Math.PI;
    case "top-left":
      return -3 * Math.PI / 4;
  }
}
function cornerSigns(side) {
  switch (side) {
    case "top-right":
      return { sx: 1, sy: -1 };
    case "bottom-right":
      return { sx: 1, sy: 1 };
    case "bottom-left":
      return { sx: -1, sy: 1 };
    case "top-left":
      return { sx: -1, sy: -1 };
  }
}
var loopPolylinePathStyle = (polyline, opts) => {
  if (polyline.length < 1) return [];
  const o = opts;
  const side = o?.side ?? DEFAULT_SIDE2;
  const baseOffset = o?.baseOffset ?? DEFAULT_BASE_OFFSET;
  const stubLength = o?.stubLength ?? DEFAULT_STUB_LENGTH3;
  const gap = o?.gap ?? DEFAULT_GAP;
  const p = polyline[0];
  if (typeof side === "string" && CORNER_SIDES.has(side)) {
    const { sx: sx2, sy: sy2 } = cornerSigns(side);
    const offX = o?.baseOffsetX ?? baseOffset;
    const offY = o?.baseOffsetY ?? baseOffset;
    const cornerX = p.x + sx2 * offX;
    const cornerY = p.y + sy2 * offY;
    const ax = cornerX - sx2 * gap;
    const ay = cornerY;
    const bx = cornerX;
    const by = cornerY - sy2 * gap;
    const ox = cornerX + sx2 * stubLength;
    const oy = cornerY + sy2 * stubLength;
    return [
      { kind: "M", x: ax, y: ay },
      { kind: "L", x: ax, y: oy },
      { kind: "L", x: ox, y: oy },
      { kind: "L", x: ox, y: by },
      { kind: "L", x: bx, y: by }
    ];
  }
  const angle = sideToAngle(side);
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const px = -uy;
  const py = ux;
  const mx = p.x + ux * baseOffset;
  const my = p.y + uy * baseOffset;
  const halfG = gap / 2;
  const sx = mx - px * halfG;
  const sy = my - py * halfG;
  const ex = mx + px * halfG;
  const ey = my + py * halfG;
  const c1x = sx + ux * stubLength;
  const c1y = sy + uy * stubLength;
  const c2x = ex + ux * stubLength;
  const c2y = ey + uy * stubLength;
  return [
    { kind: "M", x: sx, y: sy },
    { kind: "L", x: c1x, y: c1y },
    { kind: "L", x: c2x, y: c2y },
    { kind: "L", x: ex, y: ey }
  ];
};

// src/lib/geometry/connectors/pathStyles/loopCurve.ts
var DEFAULT_ANGLE = -Math.PI / 2;
var DEFAULT_BASE_OFFSET2 = 28;
var DEFAULT_RADIUS2 = 40;
var DEFAULT_WIDTH = 12;
var COINCIDENT_EPS = 0.5;
var LOOP_CURVE_PRESETS = {
  balloon: { baseOffset: 2, radius: 22, width: 6, bulge: 26 },
  teardrop: { baseOffset: 2, radius: 34, width: 4, bulge: 8 },
  ring: { baseOffset: 2, radius: 20, width: 10, bulge: 20 },
  hairpin: { baseOffset: 2, radius: 28, width: 8, bulge: 4 }
};
function sideToAngle2(side) {
  switch (side) {
    case "top":
      return -Math.PI / 2;
    case "top-right":
      return -Math.PI / 4;
    case "right":
      return 0;
    case "bottom-right":
      return Math.PI / 4;
    case "bottom":
      return Math.PI / 2;
    case "bottom-left":
      return 3 * Math.PI / 4;
    case "left":
      return Math.PI;
    case "top-left":
      return -3 * Math.PI / 4;
  }
}
var loopCurvePathStyle = (polyline, opts) => {
  if (polyline.length < 1) return [];
  const o = opts;
  const angle = o?.side !== void 0 ? sideToAngle2(o.side) : o?.angle ?? DEFAULT_ANGLE;
  const radius = o?.radius ?? DEFAULT_RADIUS2;
  const bulge = o?.bulge ?? radius;
  const ux = Math.cos(angle);
  const uy = Math.sin(angle);
  const start = polyline[0];
  const end = polyline[polyline.length - 1] ?? start;
  const chordDx = end.x - start.x;
  const chordDy = end.y - start.y;
  const chordLen = Math.hypot(chordDx, chordDy);
  let sx;
  let sy;
  let ex;
  let ey;
  if (chordLen > COINCIDENT_EPS) {
    sx = start.x;
    sy = start.y;
    ex = end.x;
    ey = end.y;
  } else {
    const baseOffset = o?.baseOffset ?? DEFAULT_BASE_OFFSET2;
    const width = o?.width ?? DEFAULT_WIDTH;
    const pivotDx = o?.pivotOffset?.dx ?? 0;
    const pivotDy = o?.pivotOffset?.dy ?? 0;
    const mx = start.x + pivotDx + ux * baseOffset;
    const my = start.y + pivotDy + uy * baseOffset;
    const px = -uy;
    const py = ux;
    const halfW = width / 2;
    sx = mx - px * halfW;
    sy = my - py * halfW;
    ex = mx + px * halfW;
    ey = my + py * halfW;
  }
  const midx = (sx + ex) / 2;
  const midy = (sy + ey) / 2;
  const tipx = midx + ux * radius;
  const tipy = midy + uy * radius;
  let cdx;
  let cdy;
  const realChordLen = Math.hypot(ex - sx, ey - sy);
  if (realChordLen > COINCIDENT_EPS) {
    cdx = (ex - sx) / realChordLen;
    cdy = (ey - sy) / realChordLen;
  } else {
    cdx = -uy;
    cdy = ux;
  }
  const c1x = tipx - cdx * bulge;
  const c1y = tipy - cdy * bulge;
  const c2x = tipx + cdx * bulge;
  const c2y = tipy + cdy * bulge;
  const out = [
    { kind: "M", x: sx, y: sy },
    { kind: "C", c1x, c1y, c2x, c2y, x: ex, y: ey }
  ];
  return out;
};

// src/lib/geometry/connectors/pathSampling.ts
var QUAD_STEPS = 12;
var CUBIC_STEPS = 16;
function samplePath(path) {
  const out = [];
  if (path.length === 0) return out;
  let cx = 0;
  let cy = 0;
  for (const cmd of path) {
    switch (cmd.kind) {
      case "M":
        out.push({ x: cmd.x, y: cmd.y });
        cx = cmd.x;
        cy = cmd.y;
        break;
      case "L":
        out.push({ x: cmd.x, y: cmd.y });
        cx = cmd.x;
        cy = cmd.y;
        break;
      case "Q":
        for (let i = 1; i <= QUAD_STEPS; i++) {
          const t = i / QUAD_STEPS;
          const mt = 1 - t;
          out.push({
            x: mt * mt * cx + 2 * mt * t * cmd.cx + t * t * cmd.x,
            y: mt * mt * cy + 2 * mt * t * cmd.cy + t * t * cmd.y
          });
        }
        cx = cmd.x;
        cy = cmd.y;
        break;
      case "C":
        for (let i = 1; i <= CUBIC_STEPS; i++) {
          const t = i / CUBIC_STEPS;
          const mt = 1 - t;
          out.push({
            x: mt * mt * mt * cx + 3 * mt * mt * t * cmd.c1x + 3 * mt * t * t * cmd.c2x + t * t * t * cmd.x,
            y: mt * mt * mt * cy + 3 * mt * mt * t * cmd.c1y + 3 * mt * t * t * cmd.c2y + t * t * t * cmd.y
          });
        }
        cx = cmd.x;
        cy = cmd.y;
        break;
    }
  }
  return out;
}
function tangentAt(path, t) {
  if (path.length < 2) return { x: 1, y: 0 };
  if (t <= 0) return tangentAtStart(path);
  if (t >= 1) return tangentAtEnd(path);
  const samples = samplePath(path);
  if (samples.length < 2) return { x: 1, y: 0 };
  const idx = Math.min(samples.length - 2, Math.floor(t * (samples.length - 1)));
  const a = samples[idx];
  const b = samples[idx + 1];
  return normalize(b.x - a.x, b.y - a.y);
}
function samplePathAt(path, t) {
  const samples = samplePath(path);
  if (samples.length === 0) return { point: { x: 0, y: 0 }, tangent: { x: 1, y: 0 } };
  if (samples.length === 1) return { point: samples[0], tangent: { x: 1, y: 0 } };
  let total = 0;
  const cum = new Array(samples.length);
  cum[0] = 0;
  for (let i = 1; i < samples.length; i++) {
    const a2 = samples[i - 1];
    const b2 = samples[i];
    total += Math.hypot(b2.x - a2.x, b2.y - a2.y);
    cum[i] = total;
  }
  if (total <= 0) {
    return { point: samples[0], tangent: { x: 1, y: 0 } };
  }
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const target = clamped * total;
  let lo = 0;
  let hi = samples.length - 1;
  while (lo < hi - 1) {
    const mid = lo + hi >>> 1;
    if (cum[mid] <= target) lo = mid;
    else hi = mid;
  }
  const a = samples[lo];
  const b = samples[lo + 1];
  const segLen = cum[lo + 1] - cum[lo];
  const u = segLen > 0 ? (target - cum[lo]) / segLen : 0;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return {
    point: { x: a.x + dx * u, y: a.y + dy * u },
    tangent: normalize(dx, dy)
  };
}
function pathBounds(path) {
  if (path.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const visit = (x, y) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const cmd of path) {
    switch (cmd.kind) {
      case "M":
      case "L":
        visit(cmd.x, cmd.y);
        break;
      case "Q":
        visit(cmd.cx, cmd.cy);
        visit(cmd.x, cmd.y);
        break;
      case "C":
        visit(cmd.c1x, cmd.c1y);
        visit(cmd.c2x, cmd.c2y);
        visit(cmd.x, cmd.y);
        break;
    }
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}
function trimPathEnds(path, startInset, endInset) {
  if (path.length < 2) return path;
  if (startInset <= 0 && endInset <= 0) return path;
  let result = path.slice();
  if (endInset > 0) {
    result = trimPathEnd(result, endInset);
    if (result.length < 2) return result;
  }
  if (startInset > 0) {
    result = trimPathStart(result, startInset);
  }
  return result;
}
var TRIM_QUAD_STEPS = 24;
var TRIM_CUBIC_STEPS = 32;
function trimPathEnd(path, remaining) {
  let work = path.slice();
  while (work.length >= 2 && remaining > 0) {
    const tail = work[work.length - 1];
    const prev = anchorBefore(work, work.length - 1);
    const segLen = segmentLength(prev, tail);
    if (segLen <= 0) {
      work.pop();
      continue;
    }
    if (remaining >= segLen) {
      remaining -= segLen;
      work.pop();
      continue;
    }
    const keepLen = segLen - remaining;
    work[work.length - 1] = clipSegmentEnd(prev, tail, keepLen);
    remaining = 0;
  }
  return work;
}
function trimPathStart(path, remaining) {
  if (path.length < 2) return path;
  const first = path[0];
  if (!first || first.kind !== "M") return path;
  let cursor = { x: first.x, y: first.y };
  let i = 1;
  while (i < path.length && remaining > 0) {
    const seg = path[i];
    const segLen = segmentLength(cursor, seg);
    if (segLen <= 0) {
      cursor = endpointOf(seg, cursor);
      i++;
      continue;
    }
    if (remaining >= segLen) {
      remaining -= segLen;
      cursor = endpointOf(seg, cursor);
      i++;
      continue;
    }
    const split = clipSegmentStart(cursor, seg, remaining);
    const head = [{ kind: "M", x: split.start.x, y: split.start.y }, split.tail];
    return head.concat(path.slice(i + 1));
  }
  return [{ kind: "M", x: cursor.x, y: cursor.y }];
}
function clipSegmentEnd(start, seg, keepLen) {
  switch (seg.kind) {
    case "L": {
      const dx = seg.x - start.x;
      const dy = seg.y - start.y;
      const len2 = Math.hypot(dx, dy);
      if (len2 === 0) return seg;
      const u = keepLen / len2;
      return { kind: "L", x: start.x + dx * u, y: start.y + dy * u };
    }
    case "Q": {
      const t = quadParamAtArcLength(start, seg, keepLen);
      const split = subdivideQuad(start, seg, t);
      return { kind: "Q", cx: split.head.cx, cy: split.head.cy, x: split.head.x, y: split.head.y };
    }
    case "C": {
      const t = cubicParamAtArcLength(start, seg, keepLen);
      const split = subdivideCubic(start, seg, t);
      return {
        kind: "C",
        c1x: split.head.c1x,
        c1y: split.head.c1y,
        c2x: split.head.c2x,
        c2y: split.head.c2y,
        x: split.head.x,
        y: split.head.y
      };
    }
    case "M":
      return seg;
  }
}
function clipSegmentStart(start, seg, dropLen) {
  switch (seg.kind) {
    case "L": {
      const dx = seg.x - start.x;
      const dy = seg.y - start.y;
      const len2 = Math.hypot(dx, dy);
      if (len2 === 0) return { start, tail: seg };
      const u = dropLen / len2;
      const splitPoint = { x: start.x + dx * u, y: start.y + dy * u };
      return { start: splitPoint, tail: { kind: "L", x: seg.x, y: seg.y } };
    }
    case "Q": {
      const t = quadParamAtArcLength(start, seg, dropLen);
      const split = subdivideQuad(start, seg, t);
      return {
        start: { x: split.head.x, y: split.head.y },
        tail: { kind: "Q", cx: split.tail.cx, cy: split.tail.cy, x: split.tail.x, y: split.tail.y }
      };
    }
    case "C": {
      const t = cubicParamAtArcLength(start, seg, dropLen);
      const split = subdivideCubic(start, seg, t);
      return {
        start: { x: split.head.x, y: split.head.y },
        tail: {
          kind: "C",
          c1x: split.tail.c1x,
          c1y: split.tail.c1y,
          c2x: split.tail.c2x,
          c2y: split.tail.c2y,
          x: split.tail.x,
          y: split.tail.y
        }
      };
    }
    case "M":
      return { start, tail: seg };
  }
}
function segmentLength(start, seg) {
  switch (seg.kind) {
    case "L":
      return Math.hypot(seg.x - start.x, seg.y - start.y);
    case "Q": {
      let total = 0;
      let px = start.x, py = start.y;
      for (let i = 1; i <= TRIM_QUAD_STEPS; i++) {
        const t = i / TRIM_QUAD_STEPS;
        const mt = 1 - t;
        const x = mt * mt * start.x + 2 * mt * t * seg.cx + t * t * seg.x;
        const y = mt * mt * start.y + 2 * mt * t * seg.cy + t * t * seg.y;
        total += Math.hypot(x - px, y - py);
        px = x;
        py = y;
      }
      return total;
    }
    case "C": {
      let total = 0;
      let px = start.x, py = start.y;
      for (let i = 1; i <= TRIM_CUBIC_STEPS; i++) {
        const t = i / TRIM_CUBIC_STEPS;
        const mt = 1 - t;
        const x = mt * mt * mt * start.x + 3 * mt * mt * t * seg.c1x + 3 * mt * t * t * seg.c2x + t * t * t * seg.x;
        const y = mt * mt * mt * start.y + 3 * mt * mt * t * seg.c1y + 3 * mt * t * t * seg.c2y + t * t * t * seg.y;
        total += Math.hypot(x - px, y - py);
        px = x;
        py = y;
      }
      return total;
    }
    case "M":
      return 0;
  }
}
function endpointOf(seg, fallback) {
  if (seg.kind === "M" || seg.kind === "L" || seg.kind === "Q" || seg.kind === "C") {
    return { x: seg.x, y: seg.y };
  }
  return fallback;
}
function quadParamAtArcLength(start, seg, targetLen) {
  let prevX = start.x, prevY = start.y;
  let acc = 0;
  for (let i = 1; i <= TRIM_QUAD_STEPS; i++) {
    const t = i / TRIM_QUAD_STEPS;
    const mt = 1 - t;
    const x = mt * mt * start.x + 2 * mt * t * seg.cx + t * t * seg.x;
    const y = mt * mt * start.y + 2 * mt * t * seg.cy + t * t * seg.y;
    const step = Math.hypot(x - prevX, y - prevY);
    if (acc + step >= targetLen) {
      const frac = step === 0 ? 0 : (targetLen - acc) / step;
      const tPrev = (i - 1) / TRIM_QUAD_STEPS;
      return tPrev + (t - tPrev) * frac;
    }
    acc += step;
    prevX = x;
    prevY = y;
  }
  return 1;
}
function cubicParamAtArcLength(start, seg, targetLen) {
  let prevX = start.x, prevY = start.y;
  let acc = 0;
  for (let i = 1; i <= TRIM_CUBIC_STEPS; i++) {
    const t = i / TRIM_CUBIC_STEPS;
    const mt = 1 - t;
    const x = mt * mt * mt * start.x + 3 * mt * mt * t * seg.c1x + 3 * mt * t * t * seg.c2x + t * t * t * seg.x;
    const y = mt * mt * mt * start.y + 3 * mt * mt * t * seg.c1y + 3 * mt * t * t * seg.c2y + t * t * t * seg.y;
    const step = Math.hypot(x - prevX, y - prevY);
    if (acc + step >= targetLen) {
      const frac = step === 0 ? 0 : (targetLen - acc) / step;
      const tPrev = (i - 1) / TRIM_CUBIC_STEPS;
      return tPrev + (t - tPrev) * frac;
    }
    acc += step;
    prevX = x;
    prevY = y;
  }
  return 1;
}
function subdivideQuad(start, seg, t) {
  const p0 = start, p1 = { x: seg.cx, y: seg.cy }, p2 = { x: seg.x, y: seg.y };
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const m = lerp(a, b, t);
  return {
    head: { cx: a.x, cy: a.y, x: m.x, y: m.y },
    tail: { cx: b.x, cy: b.y, x: p2.x, y: p2.y }
  };
}
function subdivideCubic(start, seg, t) {
  const p0 = start;
  const p1 = { x: seg.c1x, y: seg.c1y };
  const p2 = { x: seg.c2x, y: seg.c2y };
  const p3 = { x: seg.x, y: seg.y };
  const a = lerp(p0, p1, t);
  const b = lerp(p1, p2, t);
  const c = lerp(p2, p3, t);
  const d = lerp(a, b, t);
  const e = lerp(b, c, t);
  const m = lerp(d, e, t);
  return {
    head: { c1x: a.x, c1y: a.y, c2x: d.x, c2y: d.y, x: m.x, y: m.y },
    tail: { c1x: e.x, c1y: e.y, c2x: c.x, c2y: c.y, x: p3.x, y: p3.y }
  };
}
function lerp(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}
function tangentAtStart(path) {
  const m = path[0];
  if (!m || m.kind !== "M") return { x: 1, y: 0 };
  const next = path[1];
  if (!next) return { x: 1, y: 0 };
  switch (next.kind) {
    case "L": {
      const to = distinctAnchorAfter(path, 1, m);
      return normalize(to.x - m.x, to.y - m.y);
    }
    case "Q":
      return normalize(next.cx - m.x, next.cy - m.y);
    case "C":
      return normalize(next.c1x - m.x, next.c1y - m.y);
    default:
      return { x: 1, y: 0 };
  }
}
function tangentAtEnd(path) {
  const last = path[path.length - 1];
  if (!last) return { x: 1, y: 0 };
  const prevAnchor = anchorBefore(path, path.length - 1);
  switch (last.kind) {
    case "M":
      return { x: 1, y: 0 };
    case "L": {
      const from = distinctAnchorBefore(path, path.length - 1, last);
      return normalize(last.x - from.x, last.y - from.y);
    }
    case "Q": {
      const dx = last.x - last.cx;
      const dy = last.y - last.cy;
      const chordDx = last.x - prevAnchor.x;
      const chordDy = last.y - prevAnchor.y;
      if (isDegenerateLeg(dx, dy, chordDx, chordDy)) {
        return normalize(chordDx, chordDy);
      }
      return normalize(dx, dy);
    }
    case "C": {
      const dx = last.x - last.c2x;
      const dy = last.y - last.c2y;
      const c1dx = last.x - last.c1x;
      const c1dy = last.y - last.c1y;
      if (isDegenerateLeg(dx, dy, c1dx, c1dy)) {
        if (c1dx !== 0 || c1dy !== 0) return normalize(c1dx, c1dy);
        return normalize(last.x - prevAnchor.x, last.y - prevAnchor.y);
      }
      return normalize(dx, dy);
    }
  }
}
function isDegenerateLeg(legDx, legDy, refDx, refDy) {
  const legSq = legDx * legDx + legDy * legDy;
  const refSq = refDx * refDx + refDy * refDy;
  return refSq > 0 && legSq * 1e4 < refSq;
}
function anchorBefore(path, idx) {
  let x = 0, y = 0;
  for (let i = 0; i < idx; i++) {
    const c = path[i];
    if (c.kind === "M" || c.kind === "L" || c.kind === "Q" || c.kind === "C") {
      x = c.x;
      y = c.y;
    }
  }
  return { x, y };
}
function distinctAnchorBefore(path, idx, to) {
  for (let i = idx - 1; i >= 0; i--) {
    const c = path[i];
    if (c.kind !== "M" && c.kind !== "L" && c.kind !== "Q" && c.kind !== "C") continue;
    if (c.x !== to.x || c.y !== to.y) return { x: c.x, y: c.y };
  }
  return anchorBefore(path, idx);
}
function distinctAnchorAfter(path, idx, from) {
  for (let i = idx; i < path.length; i++) {
    const c = path[i];
    if (c.kind !== "M" && c.kind !== "L" && c.kind !== "Q" && c.kind !== "C") continue;
    if (c.x !== from.x || c.y !== from.y) return { x: c.x, y: c.y };
  }
  return from;
}
function normalize(dx, dy) {
  const len2 = Math.hypot(dx, dy);
  if (len2 === 0) return { x: 1, y: 0 };
  return { x: dx / len2, y: dy / len2 };
}
function distanceToPolylineSq(poly, px, py) {
  if (poly.length < 2) return Infinity;
  let best = Infinity;
  for (let i = 0; i < poly.length - 1; i++) {
    const a = poly[i];
    const b = poly[i + 1];
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const lenSq = dx * dx + dy * dy;
    let t = lenSq === 0 ? 0 : ((px - a.x) * dx + (py - a.y) * dy) / lenSq;
    if (t < 0) t = 0;
    else if (t > 1) t = 1;
    const cx = a.x + dx * t;
    const cy = a.y + dy * t;
    const ex = px - cx;
    const ey = py - cy;
    const d = ex * ex + ey * ey;
    if (d < best) best = d;
  }
  return best;
}

// src/lib/geometry/badges/placement.ts
function placementToHostAnchor(hostBounds, placement) {
  if (typeof placement === "object") {
    return { x: placement.x, y: placement.y };
  }
  return namedPlacementToAnchor(hostBounds, placement);
}
function namedPlacementToAnchor(bounds, placement) {
  const { x, y, width: w, height: h } = bounds;
  switch (placement) {
    case "top":
      return { x: x + w / 2, y };
    case "bottom":
      return { x: x + w / 2, y: y + h };
    case "left":
      return { x, y: y + h / 2 };
    case "right":
      return { x: x + w, y: y + h / 2 };
    case "top-left":
      return { x, y };
    case "top-right":
      return { x: x + w, y };
    case "bottom-left":
      return { x, y: y + h };
    case "bottom-right":
      return { x: x + w, y: y + h };
  }
}
function originToBadgeLocal(badgeLocalBounds, placement, origin) {
  if (origin === "center" || origin === void 0 && typeof placement === "object") {
    return {
      x: badgeLocalBounds.x + badgeLocalBounds.width / 2,
      y: badgeLocalBounds.y + badgeLocalBounds.height / 2
    };
  }
  const point = origin ?? mirrorPlacement(placement);
  return namedPlacementToAnchor(badgeLocalBounds, point);
}
function mirrorPlacement(p) {
  switch (p) {
    case "top":
      return "bottom";
    case "bottom":
      return "top";
    case "left":
      return "right";
    case "right":
      return "left";
    case "top-left":
      return "bottom-right";
    case "top-right":
      return "bottom-left";
    case "bottom-left":
      return "top-right";
    case "bottom-right":
      return "top-left";
  }
}
function resolveBadgePosition(hostWorldBounds, badgeLocalBounds, options) {
  const placement = options.placement;
  const anchor = placementToHostAnchor(hostWorldBounds, placement);
  const originLocal = originToBadgeLocal(
    badgeLocalBounds,
    placement,
    options.origin
  );
  return {
    x: anchor.x + (options.offsetX ?? 0) - originLocal.x,
    y: anchor.y + (options.offsetY ?? 0) - originLocal.y
  };
}

// src/lib/geometry/badges/connectorPlacement.ts
function resolveConnectorT(placement) {
  if (typeof placement === "number") {
    if (placement <= 0) return 0;
    if (placement >= 1) return 1;
    return placement;
  }
  switch (placement) {
    case "start":
      return 0;
    case "middle":
      return 0.5;
    case "end":
      return 1;
  }
}
var DEFAULT_ENDPOINT_BADGE_GAP_PX = 8;
function resolveConnectorBadgePosition(path, badgeLocalBounds, options, clearance = { source: 0, target: 0 }) {
  const placement = options.placement;
  const t = resolveConnectorT(placement);
  const sample = samplePathAt(path, t);
  let baseX = sample.point.x;
  let baseY = sample.point.y;
  if (placement === "start" || placement === "end") {
    const halfTangentExtent = Math.abs(sample.tangent.x) * (badgeLocalBounds.width / 2) + Math.abs(sample.tangent.y) * (badgeLocalBounds.height / 2);
    const extra = placement === "start" ? clearance.source : clearance.target;
    const dir = placement === "start" ? 1 : -1;
    const totalShift = (halfTangentExtent + extra) * dir;
    baseX += sample.tangent.x * totalShift;
    baseY += sample.tangent.y * totalShift;
  }
  const pathOffset = options.pathOffset ?? 0;
  if (pathOffset !== 0) {
    baseX += sample.tangent.x * pathOffset;
    baseY += sample.tangent.y * pathOffset;
  }
  let rotation = 0;
  if (options.autoRotate === true) {
    let theta = Math.atan2(sample.tangent.y, sample.tangent.x);
    if (options.keepUpright !== false) {
      if (theta > Math.PI / 2) theta -= Math.PI;
      else if (theta < -Math.PI / 2) theta += Math.PI;
    }
    rotation = theta;
  }
  const originLocal = originToBadgeLocal(
    badgeLocalBounds,
    "top",
    options.origin ?? "center"
  );
  const offsetX = options.offsetX ?? 0;
  const offsetY = options.offsetY ?? 0;
  let rotatedOffsetX = offsetX;
  let rotatedOffsetY = offsetY;
  if (rotation !== 0 && (offsetX !== 0 || offsetY !== 0)) {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    rotatedOffsetX = offsetX * cos - offsetY * sin;
    rotatedOffsetY = offsetX * sin + offsetY * cos;
  }
  return {
    x: baseX + rotatedOffsetX - originLocal.x,
    y: baseY + rotatedOffsetY - originLocal.y,
    rotation
  };
}

// src/lib/geometry/labels/labelScale.ts
function resolveLabelScale(fontSize, zoom, hostScale, policy, contained = false) {
  if (policy === null) return 1;
  if (!(fontSize > 0) || !(zoom > 0) || !(hostScale > 0)) return 1;
  const natural = fontSize * zoom * hostScale;
  let target = policy.zoomGrowth === void 0 ? natural : fontSize * Math.pow(zoom, clampUnit(policy.zoomGrowth));
  if (policy.minFontPx !== void 0 && target < policy.minFontPx) target = policy.minFontPx;
  if (policy.maxFontPx !== void 0 && target > policy.maxFontPx) target = policy.maxFontPx;
  const scale = target / natural;
  return contained && scale > 1 ? 1 : scale;
}
function clampUnit(v) {
  if (!Number.isFinite(v)) return 1;
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

// src/lib/animation/animatePositions.ts
var DEFAULT_POSITION_TRANSITION_MS = 500;
function animatePositions(opts) {
  const { from, to, duration, easing = easeOutCubic, onFrame, onComplete } = opts;
  if (from.length !== to.length) {
    throw new Error(
      `animatePositions: from.length=${from.length} must equal to.length=${to.length}`
    );
  }
  const n2 = from.length;
  let done = false;
  let cancelled = false;
  let rafId = null;
  let last = 0;
  const finish = () => {
    done = true;
    onFrame(to, 1);
    onComplete?.();
  };
  const raf2 = typeof requestAnimationFrame === "function" ? requestAnimationFrame : null;
  if (!raf2 || duration <= 0 || n2 === 0) {
    finish();
    return { cancel() {
    }, get done() {
      return done;
    } };
  }
  const buffer = new Float32Array(n2);
  const tween = new Tween({ from: 0, to: 1, duration, easing });
  const step = (now) => {
    if (cancelled) return;
    const dt = last === 0 ? 0 : now - last;
    last = now;
    const alive = tween.tick(dt);
    if (!alive) {
      finish();
      return;
    }
    const t = tween.value;
    for (let i = 0; i < n2; i++) buffer[i] = from[i] + (to[i] - from[i]) * t;
    onFrame(buffer, t);
    rafId = raf2(step);
  };
  rafId = raf2(step);
  return {
    cancel() {
      if (done) return;
      cancelled = true;
      done = true;
      if (rafId !== null && typeof cancelAnimationFrame === "function") cancelAnimationFrame(rafId);
    },
    get done() {
      return done;
    }
  };
}

// src/lib/svg/markup.ts
function n(v) {
  return Number.isInteger(v) ? String(v) : v.toFixed(3).replace(/\.?0+$/, "");
}
function esc(s) {
  return s.replace(
    /[&<>"']/g,
    (c) => c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : c === '"' ? "&quot;" : "&#39;"
  );
}
function attrs(map) {
  return Object.entries(map).filter(([, v]) => v !== void 0 && v !== "").map(([k, v]) => `${k}="${typeof v === "number" ? n(v) : v}"`).join(" ");
}
function pointsAttr(pts) {
  return pts.map((p) => `${n(p.x)},${n(p.y)}`).join(" ");
}
function hexToCss(n2) {
  return `#${(n2 & 16777215).toString(16).padStart(6, "0")}`;
}

// src/lib/svg/pathToSvgD.ts
function pathToSvgD(path) {
  const out = [];
  for (const c of path) {
    if (c.kind === "M") out.push(`M ${n(c.x)} ${n(c.y)}`);
    else if (c.kind === "L") out.push(`L ${n(c.x)} ${n(c.y)}`);
    else if (c.kind === "Q") out.push(`Q ${n(c.cx)} ${n(c.cy)} ${n(c.x)} ${n(c.y)}`);
    else out.push(`C ${n(c.c1x)} ${n(c.c1y)} ${n(c.c2x)} ${n(c.c2y)} ${n(c.x)} ${n(c.y)}`);
  }
  return out.join(" ");
}

// src/lib/svg/paint.ts
function fillPaint(fill) {
  if (fill === void 0) return { fill: "none" };
  if (typeof fill === "number") return { fill: hexToCss(fill) };
  const layers = Array.isArray(fill) ? fill : [fill];
  for (const layer of layers) {
    if (layer.kind === "solid") {
      return { fill: hexToCss(layer.color), "fill-opacity": layer.alpha ?? void 0 };
    }
  }
  return { fill: "none" };
}
function strokePaint(stroke, widthScale = 1) {
  if (!stroke) return {};
  const width = (stroke.width ?? 1) * widthScale;
  return {
    stroke: hexToCss(stroke.color),
    "stroke-width": width,
    "stroke-opacity": stroke.alpha ?? void 0,
    "stroke-linecap": stroke.cap,
    "stroke-linejoin": stroke.join,
    "stroke-dasharray": stroke.dashArray ? `${n(stroke.dashArray[0])} ${n(stroke.dashArray[1])}` : void 0,
    "stroke-dashoffset": stroke.dashOffset
  };
}
function textContent(style) {
  const content = style?.content;
  return content?.kind === "text" ? content : void 0;
}

// src/lib/svg/shapeSpecToSvg.ts
function regularPolygonPoints(cx, cy, sides, radius, rotation = 0) {
  const pts = [];
  const step = Math.PI * 2 / Math.max(3, sides);
  const start = -Math.PI / 2 - rotation;
  for (let i = 0; i < sides; i++) {
    const a = start + i * step;
    pts.push({ x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) });
  }
  return pts;
}
function starPoints(cx, cy, points, innerR, outerR, rotation = 0) {
  const pts = [];
  const step = Math.PI / Math.max(2, points);
  const start = -Math.PI / 2 - rotation;
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = start + i * step;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}
function wrapTransform(spec, inner) {
  const rot = spec.rotation ?? 0;
  const hasAlpha = spec.alpha !== void 0 && spec.alpha !== 1;
  if (!rot && !hasAlpha) return inner;
  const t = rot ? `transform="rotate(${n(rot * 180 / Math.PI)} ${n(spec.x)} ${n(spec.y)})"` : "";
  const o = hasAlpha ? `opacity="${n(spec.alpha)}"` : "";
  return `<g ${[t, o].filter(Boolean).join(" ")}>${inner}</g>`;
}
function shapeSpecToSvg(spec, labelStyle) {
  if (spec.visible === false) return "";
  const paint = { ...fillPaint(spec.fill), ...strokePaint(spec.stroke) };
  let body = "";
  switch (spec.kind) {
    case "circle": {
      const s = spec;
      body = `<circle ${attrs({ cx: s.x, cy: s.y, r: s.radius, ...paint })}/>`;
      break;
    }
    case "ellipse": {
      const s = spec;
      body = `<ellipse ${attrs({ cx: s.x, cy: s.y, rx: s.radiusX, ry: s.radiusY, ...paint })}/>`;
      break;
    }
    case "rect": {
      const s = spec;
      body = `<rect ${attrs({ x: s.x, y: s.y, width: s.width, height: s.height, rx: s.cornerRadius || void 0, ...paint })}/>`;
      break;
    }
    case "tabbed-rect": {
      const s = spec;
      const pts = tabbedRectOutline(s).map((v) => ({ x: v.x + s.x, y: v.y + s.y }));
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      const fold = tabbedRectFoldLine(s);
      if (fold && s.stroke) {
        body += `<line ${attrs({
          x1: fold[0].x + s.x,
          y1: fold[0].y + s.y,
          x2: fold[1].x + s.x,
          y2: fold[1].y + s.y,
          ...strokePaint(s.stroke),
          fill: "none"
        })}/>`;
      }
      break;
    }
    case "polygon": {
      const s = spec;
      const pts = s.vertices.map((v) => ({ x: v.x + s.x, y: v.y + s.y }));
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      break;
    }
    case "regular-polygon": {
      const s = spec;
      const pts = regularPolygonPoints(s.x, s.y, s.sides, s.radius, s.rotation ?? 0);
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      break;
    }
    case "star": {
      const s = spec;
      const pts = starPoints(s.x, s.y, s.points, s.innerRadius, s.outerRadius, s.rotation ?? 0);
      body = `<polygon ${attrs({ points: pointsAttr(pts), ...paint })}/>`;
      break;
    }
    case "arc": {
      body = `<path ${attrs({ d: arcToSvgD(spec), "fill-rule": "evenodd", ...paint })}/>`;
      break;
    }
    case "composite": {
      body = compositeToSvg(spec);
      break;
    }
    default:
      return "";
  }
  return wrapTransform(spec, body + labelToSvg(spec, labelStyle));
}
function arcToSvgD(s) {
  const { x: cx, y: cy, innerR, outerR, startAngle: a0, endAngle: a1 } = s;
  const full = Math.abs(a1 - a0) >= Math.PI * 2 - 1e-6;
  const pt = (r, a) => ({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  if (full) {
    const ring = (r) => `M ${n(cx - r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 1 ${n(cx + r)} ${n(cy)} A ${n(r)} ${n(r)} 0 1 1 ${n(cx - r)} ${n(cy)} Z`;
    return innerR > 0 ? `${ring(outerR)} ${ring(innerR)}` : ring(outerR);
  }
  const large = Math.abs(a1 - a0) > Math.PI ? 1 : 0;
  const os = pt(outerR, a0);
  const oe = pt(outerR, a1);
  if (innerR <= 0) {
    return `M ${n(cx)} ${n(cy)} L ${n(os.x)} ${n(os.y)} A ${n(outerR)} ${n(outerR)} 0 ${large} 1 ${n(oe.x)} ${n(oe.y)} Z`;
  }
  const ie = pt(innerR, a1);
  const is = pt(innerR, a0);
  return `M ${n(os.x)} ${n(os.y)} A ${n(outerR)} ${n(outerR)} 0 ${large} 1 ${n(oe.x)} ${n(oe.y)} L ${n(ie.x)} ${n(ie.y)} A ${n(innerR)} ${n(innerR)} 0 ${large} 0 ${n(is.x)} ${n(is.y)} Z`;
}
function compositeToSvg(s) {
  const els = [];
  const paint = { ...fillPaint(s.fill), ...strokePaint(s.stroke) };
  if (s.root) {
    const centred = { ...s.root, x: s.width / 2, y: s.height / 2 };
    if (s.root.kind === "rect") {
      const r = s.root;
      centred.x = (s.width - r.width) / 2;
      centred.y = (s.height - r.height) / 2;
    }
    els.push(shapeSpecToSvg(centred));
  } else {
    els.push(`<rect ${attrs({ x: 0, y: 0, width: s.width, height: s.height, rx: s.cornerRadius || void 0, ...paint })}/>`);
  }
  for (const part of s.parts) els.push(partToSvg(part));
  return `<g ${attrs({ transform: `translate(${n(s.x)} ${n(s.y)})` })}>${els.join("")}</g>`;
}
function partToSvg(part) {
  switch (part.part) {
    case "rect":
      return `<rect ${attrs({
        x: part.x,
        y: part.y,
        width: part.width,
        height: part.height,
        rx: part.cornerRadius || void 0,
        fill: part.fill !== void 0 ? hexToCss(part.fill) : "none",
        "fill-opacity": part.fillAlpha,
        ...part.stroke ? { stroke: hexToCss(part.stroke.color), "stroke-width": part.stroke.width ?? 1, "stroke-opacity": part.stroke.alpha } : {}
      })}/>`;
    case "circle":
      return `<circle ${attrs({
        cx: part.x,
        cy: part.y,
        r: part.radius,
        fill: part.fill !== void 0 ? hexToCss(part.fill) : "none",
        "fill-opacity": part.fillAlpha,
        ...part.stroke ? { stroke: hexToCss(part.stroke.color), "stroke-width": part.stroke.width ?? 1, "stroke-opacity": part.stroke.alpha } : {}
      })}/>`;
    case "line":
      return `<line ${attrs({
        x1: part.x,
        y1: part.y,
        x2: part.x2,
        y2: part.y2,
        stroke: hexToCss(part.stroke.color),
        "stroke-width": part.stroke.width ?? 1,
        "stroke-opacity": part.stroke.alpha
      })}/>`;
    case "label": {
      const anchor = part.anchor === "center" ? "middle" : part.anchor === "right" ? "end" : "start";
      return `<text ${attrs({
        x: part.x,
        y: part.y,
        "font-size": part.fontSize ?? 12,
        "font-weight": part.fontWeight,
        "font-style": part.fontStyle,
        "text-anchor": anchor,
        "dominant-baseline": "hanging",
        fill: part.fill !== void 0 ? hexToCss(part.fill) : "#111827"
      })}>${esc(part.text)}</text>`;
    }
    default:
      return "";
  }
}
function labelToSvg(spec, style) {
  const content = textContent(style);
  if (!content) return "";
  const s = style;
  const placement = s.placement ?? "bottom";
  const r = spec.radius ?? spec.outerRadius ?? (spec.height ?? 24) / 2;
  let dy = 0;
  if (placement.includes("bottom")) dy = r + (content.fontSize ?? 12);
  else if (placement.includes("top")) dy = -(r + 4);
  const ox = s.offset?.x ?? 0;
  const oy = s.offset?.y ?? 0;
  return `<text ${attrs({
    x: spec.x + ox,
    y: spec.y + dy + oy,
    "font-size": content.fontSize ?? 12,
    "font-family": content.fontFamily ?? "sans-serif",
    "font-weight": content.fontWeight,
    "font-style": content.fontStyle,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: content.fill !== void 0 ? hexToCss(content.fill) : "#111827",
    opacity: content.alpha
  })}>${esc(content.text)}</text>`;
}

// src/lib/svg/connectorToSvg.ts
function connectorToSvg(spec, path, strokeWidthScale = 1, labelStyle) {
  if (spec.visible === false || path.length === 0) return "";
  const paint = strokePaint(spec.stroke, strokeWidthScale);
  const width = (spec.stroke?.width ?? 1) * strokeWidthScale;
  const els = [`<path ${attrs({ d: pathToSvgD(path), fill: "none", ...paint })}/>`];
  const color = spec.stroke ? hexToCss(spec.stroke.color) : "#000000";
  if (spec.targetMarker) els.push(arrowMarker(path, "target", width, color));
  if (spec.sourceMarker) els.push(arrowMarker(path, "source", width, color));
  const label = connectorLabelToSvg(path, labelStyle);
  const alpha = spec.alpha !== void 0 && spec.alpha !== 1 ? ` opacity="${n(spec.alpha)}"` : "";
  return `<g${alpha}>${els.join("")}${label}</g>`;
}
function arrowMarker(path, end, strokeWidth, color) {
  const pts = pathPoints(path);
  if (pts.length < 2) return "";
  const tip = end === "target" ? pts[pts.length - 1] : pts[0];
  const prev = end === "target" ? pts[pts.length - 2] : pts[1];
  const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
  const len2 = Math.max(6, strokeWidth * 4);
  const half = Math.max(3, strokeWidth * 2);
  const back = { x: tip.x - len2 * Math.cos(ang), y: tip.y - len2 * Math.sin(ang) };
  const nx = Math.cos(ang + Math.PI / 2);
  const ny = Math.sin(ang + Math.PI / 2);
  const p1 = { x: back.x + half * nx, y: back.y + half * ny };
  const p2 = { x: back.x - half * nx, y: back.y - half * ny };
  return `<polygon ${attrs({ points: pointsAttr([tip, p1, p2]), fill: color })}/>`;
}
function pathPoints(path) {
  return path.filter((c) => c.kind !== void 0).map((c) => ({ x: c.x, y: c.y }));
}
function connectorLabelToSvg(path, style) {
  const content = textContent(style);
  if (!content) return "";
  const pts = pathPoints(path);
  if (pts.length === 0) return "";
  const mid = pts[Math.floor(pts.length / 2)];
  const s = style;
  return `<text ${attrs({
    x: mid.x + (s.offset?.x ?? 0),
    y: mid.y + (s.offset?.y ?? 0),
    "font-size": content.fontSize ?? 12,
    "font-family": content.fontFamily ?? "sans-serif",
    "text-anchor": "middle",
    "dominant-baseline": "middle",
    fill: content.fill !== void 0 ? hexToCss(content.fill) : "#111827"
  })}>${esc(content.text)}</text>`;
}

// src/state/view/CanvasView.ts
function defaultCanvasView() {
  return {
    definition: {
      canvas: { zoom: { min: 0.01, max: 100 } },
      layers: {},
      behaviours: {},
      layouts: {},
      activeLayout: null,
      templates: [],
      theme: {},
      controlPanels: {}
    },
    interaction: {
      selection: /* @__PURE__ */ new Set(),
      hover: null,
      states: {},
      raised: {},
      camera: { x: 0, y: 0, zoom: 1 },
      focus: null,
      inspect: null,
      cameraIntent: null,
      transientPins: /* @__PURE__ */ new Set(),
      viewMode: "select",
      viewModeArgs: {}
    },
    runtime: {
      layout: { running: false, activeId: null, animate: false, progress: null },
      message: null
    }
  };
}

// src/state/view/createActions.ts
function createActions(view, layer, events) {
  const v = (action, recipe) => view.update(recipe, action);
  const mergeInto = (bag, patch) => ({ ...bag ?? {}, ...patch });
  const di = (type, layerId, ids) => events.publish(type, { action: type, layerId, ids }, { kind: "data", id: layerId });
  return {
    // ── DATA (proxy to the layer's bulk store + an intent record) ─────────────
    node: {
      add: (l, n2) => {
        layer(l).addNode(n2);
        di("data:node:add", l, [n2.id]);
      },
      update: (l, id, patch) => {
        layer(l).updateNode(id, patch);
        di("data:node:update", l, [id]);
      },
      remove: (l, id) => {
        layer(l).removeNode(id);
        di("data:node:remove", l, [id]);
      },
      moveTo: (l, id, x, y) => {
        layer(l).updateNode(id, { x, y });
        di("data:node:move", l, [id]);
      }
    },
    edge: {
      add: (l, e) => {
        layer(l).addEdge(e);
        di("data:edge:add", l, [e.id]);
      },
      update: (l, id, patch) => {
        layer(l).updateEdge(id, patch);
        di("data:edge:update", l, [id]);
      },
      remove: (l, id) => {
        layer(l).removeEdge(id);
        di("data:edge:remove", l, [id]);
      }
    },
    group: {
      add: (l, g) => {
        layer(l).addGroup(g);
        di("data:group:add", l, [g.id]);
      },
      update: (l, id, patch) => {
        layer(l).updateGroup(id, patch);
        di("data:group:update", l, [id]);
      },
      remove: (l, id) => {
        layer(l).removeGroup(id);
        di("data:group:remove", l, [id]);
      }
    },
    annotation: {
      add: (l, a) => {
        layer(l).addAnnotation(a);
        di("data:annotation:add", l, [a.id]);
      },
      update: (l, id, patch) => {
        layer(l).updateAnnotation(id, patch);
        di("data:annotation:update", l, [id]);
      },
      remove: (l, id) => {
        layer(l).removeAnnotation(id);
        di("data:annotation:remove", l, [id]);
      }
    },
    /** Bulk layout output → node positions (transform-only re-render). */
    positions: {
      apply: (l, positions) => {
        const arr = [...positions];
        layer(l).applyPositions(arr);
        di("data:position:apply", l, arr.map((p) => p.id));
      }
    },
    // ── VIEW · layers ─────────────────────────────────────────────────────────
    layers: {
      add: (id, opts) => v("view:layer:add", (s) => void (s.definition.layers[id] = opts)),
      update: (id, patch) => v("view:layer:update", (s) => void (s.definition.layers[id] = mergeInto(s.definition.layers[id], patch))),
      setStyle: (id, style) => v("view:layer:setStyle", (s) => void (s.definition.layers[id] = mergeInto(s.definition.layers[id], { style }))),
      setVisible: (id, visible) => v("view:layer:setVisible", (s) => void (s.definition.layers[id] = mergeInto(s.definition.layers[id], { visible }))),
      remove: (id) => v("view:layer:remove", (s) => void delete s.definition.layers[id])
    },
    // ── VIEW · behaviours ─────────────────────────────────────────────────────
    behaviours: {
      add: (id, opts) => v("view:behaviour:add", (s) => void (s.definition.behaviours[id] = opts)),
      update: (id, patch) => v("view:behaviour:update", (s) => void (s.definition.behaviours[id] = mergeInto(s.definition.behaviours[id], patch))),
      enable: (id) => v("view:behaviour:enable", (s) => void (s.definition.behaviours[id] = mergeInto(s.definition.behaviours[id], { enabled: true }))),
      disable: (id) => v("view:behaviour:disable", (s) => void (s.definition.behaviours[id] = mergeInto(s.definition.behaviours[id], { enabled: false }))),
      remove: (id) => v("view:behaviour:remove", (s) => void delete s.definition.behaviours[id])
    },
    // ── VIEW · layouts ────────────────────────────────────────────────────────
    layouts: {
      set: (id, opts) => v("view:layout:set", (s) => void (s.definition.layouts[id] = opts)),
      tune: (id, patch) => v("view:layout:tune", (s) => void (s.definition.layouts[id] = mergeInto(s.definition.layouts[id], patch))),
      run: (id) => v("view:layout:run", (s) => void (s.definition.activeLayout = id)),
      remove: (id) => v("view:layout:remove", (s) => {
        delete s.definition.layouts[id];
        if (s.definition.activeLayout === id) s.definition.activeLayout = null;
      })
    },
    // ── VIEW · camera (interaction; abstract transform) ───────────────────────
    camera: {
      set: (c) => v("view:camera:set", (s) => void (s.interaction.camera = { ...s.interaction.camera, ...c })),
      pan: (dx, dy) => v("view:camera:pan", (s) => {
        s.interaction.camera = {
          ...s.interaction.camera,
          x: s.interaction.camera.x + dx,
          y: s.interaction.camera.y + dy
        };
      }),
      zoom: (factor) => v("view:camera:zoom", (s) => void (s.interaction.camera = { ...s.interaction.camera, zoom: s.interaction.camera.zoom * factor })),
      zoomTo: (zoom) => v("view:camera:zoomTo", (s) => void (s.interaction.camera = { ...s.interaction.camera, zoom })),
      reset: () => v("view:camera:reset", (s) => void (s.interaction.camera = { x: 0, y: 0, zoom: 1 }))
    },
    // ── VIEW · selection / hover (interaction) ────────────────────────────────
    selection: {
      set: (ids) => v("view:selection:set", (s) => void (s.interaction.selection = new Set(ids))),
      add: (ids) => v("view:selection:add", (s) => void (s.interaction.selection = /* @__PURE__ */ new Set([...s.interaction.selection, ...ids]))),
      toggle: (id) => v("view:selection:toggle", (s) => {
        const next = new Set(s.interaction.selection);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        s.interaction.selection = next;
      }),
      clear: () => v("view:selection:clear", (s) => void (s.interaction.selection = /* @__PURE__ */ new Set()))
    },
    hover: {
      set: (id) => v("view:hover:set", (s) => void (s.interaction.hover = id)),
      clear: () => v("view:hover:clear", (s) => void (s.interaction.hover = null))
    },
    /**
     * Paint-order lift, per source. `source` is the id of whatever is asking
     * (a behaviour id) — each owns its own set, so a hover lift and a selection
     * lift coexist and either can be dropped without disturbing the other.
     * The renderer projects the union; see `CanvasView.interaction.raised`.
     */
    raise: {
      set: (source, ids) => v("view:raise:set", (s) => void (s.interaction.raised = { ...s.interaction.raised, [source]: new Set(ids) })),
      clear: (source) => v("view:raise:clear", (s) => {
        if (!(source in s.interaction.raised)) return;
        const next = { ...s.interaction.raised };
        delete next[source];
        s.interaction.raised = next;
      })
    },
    // ── VIEW · interaction mode (the modeller "tool") ─────────────────────────
    viewMode: {
      /**
       * Switch the active mode. `args`, when given, **replaces** the mode's
       * parameters; omit it to keep the current ones (a tool's node kind
       * survives a trip through Select).
       */
      set: (mode, args) => v("view:viewMode:set", (s) => {
        s.interaction.viewMode = mode;
        if (args !== void 0) s.interaction.viewModeArgs = { ...args };
      }),
      /** Shallow-merge `patch` into the mode parameters. */
      setArgs: (patch) => v("view:viewMode:setArgs", (s) => void (s.interaction.viewModeArgs = { ...s.interaction.viewModeArgs, ...patch }))
    },
    // ── VIEW · templates (e.g. node templates) ────────────────────────────────
    templates: {
      create: (template) => v("view:template:create", (s) => void (s.definition.templates = [...s.definition.templates, template])),
      update: (id, patch) => v("view:template:update", (s) => {
        s.definition.templates = s.definition.templates.map(
          (t) => t.id === id ? { ...t, ...patch } : t
        );
      }),
      remove: (id) => v("view:template:remove", (s) => void (s.definition.templates = s.definition.templates.filter((t) => t.id !== id)))
    },
    // ── VIEW · control panels (floating chrome over the canvas) ───────────────
    controlPanels: {
      /** Add (or replace) the panel `id`. */
      add: (id, spec) => v("view:controlPanel:add", (s) => void (s.definition.controlPanels[id] = spec)),
      /** Shallow-merge `patch` into panel `id` (`items` replaces). No-op when absent. */
      update: (id, patch) => v("view:controlPanel:update", (s) => {
        const cur = s.definition.controlPanels[id];
        if (cur) s.definition.controlPanels[id] = { ...cur, ...patch };
      }),
      show: (id) => v("view:controlPanel:show", (s) => {
        const cur = s.definition.controlPanels[id];
        if (cur) s.definition.controlPanels[id] = { ...cur, visible: true };
      }),
      hide: (id) => v("view:controlPanel:hide", (s) => {
        const cur = s.definition.controlPanels[id];
        if (cur) s.definition.controlPanels[id] = { ...cur, visible: false };
      }),
      remove: (id) => v("view:controlPanel:remove", (s) => void delete s.definition.controlPanels[id])
    },
    // ── VIEW · theme ──────────────────────────────────────────────────────────
    theme: {
      set: (patch) => v("view:theme:set", (s) => void (s.definition.theme = { ...s.definition.theme, ...patch }))
    },
    // ── VIEW · scene (canvas-level definition) ────────────────────────────────
    scene: {
      set: (patch) => v("view:scene:set", (s) => void (s.definition.canvas = { ...s.definition.canvas, ...patch })),
      setBackground: (backgroundColor) => v("view:scene:setBackground", (s) => void (s.definition.canvas = { ...s.definition.canvas, backgroundColor })),
      setZoomLimits: (min, max) => v("view:scene:setZoomLimits", (s) => void (s.definition.canvas = { ...s.definition.canvas, zoom: { min, max } }))
    },
    // ── RUNTIME · layout run status (observable, NOT synced) ───────────────────
    layoutStatus: {
      begin: (id, animate = false) => v("view:layout:status:begin", (s) => void (s.runtime.layout = { running: true, activeId: id, animate, progress: animate ? 0 : null })),
      progress: (progress) => v("view:layout:status:progress", (s) => void (s.runtime.layout = { ...s.runtime.layout, progress })),
      end: () => v("view:layout:status:end", (s) => void (s.runtime.layout = { ...s.runtime.layout, running: false, progress: null }))
    },
    // ── RUNTIME · transient overlay message ───────────────────────────────────
    message: {
      show: (text) => v("view:message:show", (s) => void (s.runtime.message = text)),
      clear: () => v("view:message:clear", (s) => void (s.runtime.message = null))
    },
    // ── VIEW · focus (highlight-neighbourhood; O(1) set + mode — §7.1B) ────────
    focus: {
      set: (ids, dim = true) => v("view:focus:set", (s) => void (s.interaction.focus = { ids: new Set(ids), dim })),
      clear: () => v("view:focus:clear", (s) => void (s.interaction.focus = null))
    },
    // ── VIEW · inspect (whose properties are open) ────────────────────────────
    inspect: {
      set: (id) => v("view:inspect:set", (s) => void (s.interaction.inspect = id)),
      clear: () => v("view:inspect:clear", (s) => void (s.interaction.inspect = null))
    },
    // ── VIEW · camera intent (frame the focus / the visible / everything) ─────
    cameraIntent: {
      /** Ask for a framing; the owner performs it once the canvas settles. */
      request: (intent) => v(
        "view:cameraIntent:request",
        (s) => void (s.interaction.cameraIntent = { intent, seq: (s.interaction.cameraIntent?.seq ?? 0) + 1 })
      )
    },
    // ── VIEW · transient pins (drag/resize gesture locks; NOT data `pinned`) ───
    transientPins: {
      add: (ids) => v("view:transientPins:add", (s) => void (s.interaction.transientPins = /* @__PURE__ */ new Set([...s.interaction.transientPins, ...ids]))),
      remove: (ids) => v("view:transientPins:remove", (s) => {
        const next = new Set(s.interaction.transientPins);
        for (const id of ids) next.delete(id);
        s.interaction.transientPins = next;
      }),
      clear: () => v("view:transientPins:clear", (s) => void (s.interaction.transientPins = /* @__PURE__ */ new Set()))
    }
  };
}

// src/state/events/CanvasEvent.ts
var CANVAS_SOURCE = { kind: "canvas", id: "canvas" };

// src/state/events/CanvasEventBus.ts
var CanvasEventBus = class {
  emitter = new EventEmitter();
  taps = /* @__PURE__ */ new Set();
  now;
  rand;
  constructor(opts) {
    this.now = opts?.now ?? (() => Date.now());
    this.rand = opts?.random ?? (() => Math.random());
  }
  /** Subscribe to a typed global event. Returns an unsubscribe fn (or use {@link off}). */
  on(type, listener) {
    return this.emitter.on(type, listener);
  }
  /** Remove a previously-registered typed listener (the {@link on} handler by reference). */
  off(type, listener) {
    this.emitter.off(type, listener);
  }
  /** Emit a typed global event — reaches typed listeners and the tap channel. */
  emit(type, payload, source = CANVAS_SOURCE) {
    this.emitter.emit(type, payload);
    this.toTaps(type, payload, source);
  }
  /**
   * Forward a **scoped / foreign** event (not in {@link CanvasGlobalEvents}) to the
   * tap channel only — used by {@link SourceEmitter} so a store/layer/behaviour's
   * own events reach the canvas tap without being global-bus types.
   */
  publish(type, payload, source) {
    this.toTaps(type, payload, source);
  }
  toTaps(type, payload, source) {
    if (this.taps.size === 0) return;
    const event = { type, timestamp: this.now(), source, payload };
    for (const { fn, opts } of [...this.taps]) {
      if (opts.exclude?.includes(type)) continue;
      if (opts.sampleRate !== void 0 && this.rand() > opts.sampleRate) continue;
      fn(event);
    }
  }
  /** Subscribe to the whole event stream (structured envelopes). */
  tap(fn, opts = {}) {
    const entry = { fn, opts };
    this.taps.add(entry);
    return () => this.taps.delete(entry);
  }
  clearTaps() {
    this.taps.clear();
  }
  removeAllListeners() {
    this.emitter.removeAllListeners();
    this.taps.clear();
  }
};

// src/state/theme/CanvasThemeState.ts
var CanvasThemeState = class {
  constructor(bus) {
    this.bus = bus;
  }
  _current = null;
  current() {
    return this._current;
  }
  set(theme) {
    this._current = theme;
    this.bus.emit("theme:change", theme, { kind: "store", id: "theme" });
  }
};

// src/state/theme/types.ts
var INHERIT = "inherit";
function isInherit(value) {
  return value === INHERIT;
}
function resolveThemed(value, palette, roles, fallback) {
  if (!isInherit(value)) return value;
  if (palette) {
    for (const role of typeof roles === "string" ? [roles] : roles) {
      const resolved = palette[role];
      if (resolved !== void 0) return resolved;
    }
  }
  return fallback;
}

// src/state/data/ColumnStore.ts
var TYPED_ARRAY_CTOR = {
  i8: Int8Array,
  u8: Uint8Array,
  i16: Int16Array,
  u16: Uint16Array,
  i32: Int32Array,
  u32: Uint32Array,
  f32: Float32Array,
  f64: Float64Array
};
var ColumnStore = class {
  schema;
  columnNames;
  maxCapacity;
  /** id → slot. The only object-keyed lookup on the hot path. */
  idIndex = /* @__PURE__ */ new Map();
  /** slot → id. Filled slots have a string; recycled holes have `undefined`. */
  idReverse = [];
  /** Stack of recycled slots. `add()` pops from here before extending. */
  freeSlots = [];
  /** TypedArray per column. Replaced on grow (new buffer with copied data). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns;
  /** Current capacity (length of each TypedArray). */
  _capacity;
  /** High-water mark — largest slot index ever assigned + 1. Not necessarily filled. */
  _highWater = 0;
  /** Mutation version. Increments on any add/remove/set or `touch()`. */
  _version = 0;
  constructor(schema, opts = {}) {
    this.schema = schema;
    this.columnNames = Object.keys(schema);
    this._capacity = Math.max(1, opts.initialCapacity ?? 256);
    this.maxCapacity = opts.maxCapacity ?? 16777216;
    this.columns = {};
    for (const name of this.columnNames) {
      const Ctor = TYPED_ARRAY_CTOR[schema[name]];
      this.columns[name] = new Ctor(this._capacity);
    }
  }
  // ─── Read accessors ─────────────────────────────────────────────────────
  /** Number of items currently stored. */
  get size() {
    return this.idIndex.size;
  }
  /** Current allocated capacity. Grows automatically when filled. */
  get capacity() {
    return this._capacity;
  }
  /** Mutation counter — bumps on any change. Subscribers diff this. */
  get version() {
    return this._version;
  }
  /** True iff `id` has been added. */
  has(id) {
    return this.idIndex.has(id);
  }
  /** Returns the slot for `id`, or `undefined`. Useful for the renderer fast path. */
  slot(id) {
    return this.idIndex.get(id);
  }
  /** Returns the id at `slot`, or `undefined` if the slot is free. */
  idAt(slot) {
    return this.idReverse[slot];
  }
  /**
   * Direct access to a column's TypedArray. **Holds a stable reference until the
   * column is grown** (then the buffer is replaced). Use {@link version} to detect
   * grow events. Renderer/layout fast path: cache `column(name)` + `slot(id)` once
   * per frame and write directly, then call {@link touch}.
   */
  column(name) {
    return this.columns[name];
  }
  /** Read a single value. ~50 ns: Map.get + TypedArray read. */
  get(id, name) {
    const slot = this.idIndex.get(id);
    if (slot === void 0) return void 0;
    return this.columns[name][slot];
  }
  /** Materialise a full row by id. Allocates an object — avoid in hot loops. */
  row(id) {
    const slot = this.idIndex.get(id);
    if (slot === void 0) return void 0;
    const out = {};
    for (const name of this.columnNames) {
      out[name] = this.columns[name][slot];
    }
    return out;
  }
  // ─── Mutation ───────────────────────────────────────────────────────────
  /** Add a new item. Throws if `id` already exists. Reuses a recycled slot when available. */
  add(id, row) {
    if (this.idIndex.has(id)) {
      throw new Error(`ColumnStore: id "${id}" already exists`);
    }
    const slot = this.allocSlot();
    this.idIndex.set(id, slot);
    this.idReverse[slot] = id;
    for (const name of this.columnNames) {
      this.columns[name][slot] = row[name];
    }
    this._version++;
    return slot;
  }
  /** Bulk add. Grows once if needed (cheaper than N individual grows). Throws on duplicate id. */
  addBulk(items) {
    if (items.length === 0) return;
    const projected = this.idIndex.size + items.length;
    if (projected > this._capacity) this.grow(projected);
    for (const { id, row } of items) {
      if (this.idIndex.has(id)) {
        throw new Error(`ColumnStore.addBulk: id "${id}" already exists`);
      }
      const slot = this.allocSlot();
      this.idIndex.set(id, slot);
      this.idReverse[slot] = id;
      for (const name of this.columnNames) {
        this.columns[name][slot] = row[name];
      }
    }
    this._version++;
  }
  /** Set a single field. ~50 ns. No-op if id doesn't exist. */
  set(id, name, value) {
    const slot = this.idIndex.get(id);
    if (slot === void 0) return;
    this.columns[name][slot] = value;
    this._version++;
  }
  /** Update multiple fields of one item in one call (one version bump). */
  update(id, partial) {
    const slot = this.idIndex.get(id);
    if (slot === void 0) return;
    for (const name of this.columnNames) {
      if (name in partial) {
        this.columns[name][slot] = partial[name];
      }
    }
    this._version++;
  }
  /** Remove an item. Recycles the slot. No-op if id doesn't exist. */
  remove(id) {
    const slot = this.idIndex.get(id);
    if (slot === void 0) return;
    this.idIndex.delete(id);
    this.idReverse[slot] = void 0;
    this.freeSlots.push(slot);
    this._version++;
  }
  /** Bulk remove. */
  removeBulk(ids) {
    for (const id of ids) {
      const slot = this.idIndex.get(id);
      if (slot === void 0) continue;
      this.idIndex.delete(id);
      this.idReverse[slot] = void 0;
      this.freeSlots.push(slot);
    }
    this._version++;
  }
  /**
   * Mark the store as mutated without an API change — call after batches of
   * fast-path writes via `column(...)[slot] = ...` so version-driven subscribers
   * re-read.
   */
  touch() {
    this._version++;
  }
  /** Drop all items + recycled slots. Keeps capacity (no shrink). */
  clear() {
    this.idIndex.clear();
    this.idReverse.length = 0;
    this.freeSlots.length = 0;
    this._highWater = 0;
    this._version++;
  }
  // ─── Iteration ──────────────────────────────────────────────────────────
  /** Iterate (id, slot) for currently-live ids. O(size) — does not walk holes. */
  forEach(cb) {
    for (const [id, slot] of this.idIndex) cb(id, slot);
  }
  /** Iterator over live ids only. */
  ids() {
    return this.idIndex.keys();
  }
  // ─── Internals ──────────────────────────────────────────────────────────
  allocSlot() {
    const recycled = this.freeSlots.pop();
    if (recycled !== void 0) return recycled;
    if (this._highWater >= this._capacity) this.grow(this._capacity * 2);
    return this._highWater++;
  }
  /** Grow each column to at least `target` (doubling past it). */
  grow(target) {
    let next = this._capacity;
    while (next < target) next *= 2;
    if (next > this.maxCapacity) {
      throw new Error(`ColumnStore: requested capacity ${target} exceeds max ${this.maxCapacity}`);
    }
    for (const name of this.columnNames) {
      const Ctor = TYPED_ARRAY_CTOR[this.schema[name]];
      const grown = new Ctor(next);
      grown.set(this.columns[name]);
      this.columns[name] = grown;
    }
    this._capacity = next;
  }
};

// src/state/data/LayerData.ts
var POS_SCHEMA = { x: "f32", y: "f32", flags: "u8" };
var NODE_FLAG = {
  HAS_POSITION: 1,
  PINNED: 2,
  DISABLED: 4,
  HIDDEN: 8
};
var newDirty = () => ({ added: /* @__PURE__ */ new Set(), changed: /* @__PURE__ */ new Set(), removed: /* @__PURE__ */ new Set() });
var drain = (d) => ({
  added: [...d.added],
  changed: [...d.changed],
  removed: [...d.removed]
});
var clearDirty = (d) => {
  d.added.clear();
  d.changed.clear();
  d.removed.clear();
};
var LayerData = class {
  /** COLD lane — node records WITHOUT `x`/`y` (positions live in {@link _pos}). */
  _nodes = /* @__PURE__ */ new Map();
  /** HOT lane — typed-array `x`/`y`/`flags` columns, keyed by node id. */
  _pos = new ColumnStore(POS_SCHEMA);
  _edges = /* @__PURE__ */ new Map();
  _groups = /* @__PURE__ */ new Map();
  _annotations = /* @__PURE__ */ new Map();
  dNodes = newDirty();
  dMoved = /* @__PURE__ */ new Set();
  // position-only node changes
  _movedAll = false;
  // set by touchPositions() — every node moved (direct-column fast path)
  dEdges = newDirty();
  dGroups = newDirty();
  dAnnotations = newDirty();
  listeners = /* @__PURE__ */ new Set();
  version = 0;
  scheduled = false;
  flushMode = "microtask";
  cancel;
  // ── stream / query status (small, human-rate; observable) ──────────────────
  _status = "idle";
  _intents = [];
  statusListeners = /* @__PURE__ */ new Set();
  // ── subscribe ─────────────────────────────────────────────────────────────
  /** Subscribe to coalesced `flush` deltas. Returns an unsubscribe. */
  on(event, listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
  /** {@link DataSource} contract — alias for `on('flush', …)`. */
  onFlush(listener) {
    return this.on("flush", listener);
  }
  /**
   * Choose **when** a flush fires ({@link FlushMode}). `'manual'` disarms any pending
   * auto-flush so only an explicit {@link flush} emits — used when the engine drives
   * every layer's data from one rAF loop.
   */
  setFlushMode(mode) {
    this.flushMode = mode;
    if (mode === "manual" && this.scheduled) {
      this.cancel?.();
      this.scheduled = false;
    }
  }
  // ── reads ─────────────────────────────────────────────────────────────────
  /** Read a node, **stitching** its cold record with its hot `x`/`y` (when set). */
  node(id) {
    const cold = this._nodes.get(id);
    if (!cold) return void 0;
    const slot = this._pos.slot(id);
    if (slot === void 0) return cold;
    const flags = this._pos.column("flags")[slot] ?? 0;
    if ((flags & NODE_FLAG.HAS_POSITION) === 0) return cold;
    return { ...cold, x: this._pos.column("x")[slot], y: this._pos.column("y")[slot] };
  }
  edge(id) {
    return this._edges.get(id);
  }
  group(id) {
    return this._groups.get(id);
  }
  annotation(id) {
    return this._annotations.get(id);
  }
  nodes() {
    return [...this._nodes.keys()].map((id) => this.node(id));
  }
  edges() {
    return [...this._edges.values()];
  }
  groups() {
    return [...this._groups.values()];
  }
  annotations() {
    return [...this._annotations.values()];
  }
  get counts() {
    return {
      nodes: this._nodes.size,
      edges: this._edges.size,
      groups: this._groups.size,
      annotations: this._annotations.size
    };
  }
  // ── hot-lane fast path (layout / renderer) ─────────────────────────────────
  /**
   * Direct access to the typed-array position columns. Hold the ref + a slot once
   * and write in place (~10 ns/slot), then call {@link touchPositions} to emit one
   * coalesced moved flush. `positions.slot(id)` maps id → column index.
   */
  get positions() {
    return this._pos;
  }
  /**
   * Bulk-apply layout output from an **interleaved** `[x0,y0,x1,y1,…]` buffer —
   * the layout fast path. Skips ids that aren't present; marks each `moved`.
   */
  setPositionsBulk(ids, xy) {
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!this._nodes.has(id)) continue;
      this.writePos(id, xy[i * 2], xy[i * 2 + 1], false);
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    }
    this.schedule();
  }
  /**
   * After writing position slots directly via {@link positions}, call this to bump
   * the version and emit **one** flush that marks every node `moved` (the per-tick
   * force-sim path — "everything moved", transform-only).
   */
  touchPositions() {
    this._pos.touch();
    this._movedAll = true;
    this.schedule();
  }
  /** Read a node's `flags` byte, or `undefined`. */
  nodeFlags(id) {
    return this._pos.get(id, "flags");
  }
  /** Toggle a {@link NODE_FLAG} bit (e.g. pinned/disabled) — marks the node `changed`. */
  setNodeFlag(id, flag, on) {
    const cur = this._pos.get(id, "flags");
    if (cur === void 0) return;
    const next = on ? cur | flag : cur & ~flag;
    if (next === cur) return;
    this._pos.set(id, "flags", next);
    if (!this.dNodes.added.has(id)) this.dNodes.changed.add(id);
    this.schedule();
  }
  // ── stream / query status ──────────────────────────────────────────────────
  /** Current ingestion lifecycle status. */
  get status() {
    return this._status;
  }
  /** Set the ingestion status; notifies {@link onStatus} listeners on change. */
  setStatus(status) {
    if (status === this._status) return;
    this._status = status;
    for (const l of [...this.statusListeners]) l(status);
  }
  /** Subscribe to status changes. Returns an unsubscribe. */
  onStatus(listener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }
  /** The data-mutation audit trail (one entry per named action). */
  intents() {
    return this._intents;
  }
  /** Record a named data intent (audit / collab). */
  logIntent(action, ids, ts = Date.now()) {
    this._intents.push({ action, ids, ts });
  }
  // ── bulk ──────────────────────────────────────────────────────────────────
  /** Replace the whole graph — diffs each collection into the next flush. */
  setData(input) {
    if (input.nodes) this.replaceNodes(input.nodes);
    if (input.edges) this.replaceKind(this._edges, this.dEdges, input.edges);
    if (input.groups) this.replaceKind(this._groups, this.dGroups, input.groups);
    if (input.annotations) this.replaceKind(this._annotations, this.dAnnotations, input.annotations);
    this.schedule();
  }
  /** Bulk-apply layout output (positions) → marks nodes `moved` (transform-only). */
  applyPositions(positions) {
    for (const { id, x, y } of positions) {
      if (!this._nodes.has(id)) continue;
      this.writePos(id, x, y, false);
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    }
    this.schedule();
  }
  // ── nodes ─────────────────────────────────────────────────────────────────
  addNode(n2) {
    this.upsertNode(n2);
    this.schedule();
  }
  updateNode(id, patch) {
    if (!this._nodes.has(id)) return;
    const keys = Object.keys(patch);
    const positionOnly = keys.length > 0 && keys.every((k) => k === "x" || k === "y");
    if ("x" in patch || "y" in patch) {
      this.writePos(id, patch.x, patch.y, false);
    }
    const { x: _x, y: _y, ...rest } = patch;
    if (Object.keys(rest).length > 0) {
      const cur = this._nodes.get(id);
      this._nodes.set(id, { ...cur, ...rest });
    }
    if (positionOnly) {
      if (!this.dNodes.added.has(id) && !this.dNodes.changed.has(id)) this.dMoved.add(id);
    } else {
      if (!this.dNodes.added.has(id)) this.dNodes.changed.add(id);
      this.dMoved.delete(id);
    }
    this.schedule();
  }
  removeNode(id) {
    if (!this._nodes.has(id)) return;
    this._nodes.delete(id);
    this._pos.remove(id);
    this.dNodes.changed.delete(id);
    this.dMoved.delete(id);
    if (this.dNodes.added.delete(id)) {
      this.schedule();
      return;
    }
    this.dNodes.removed.add(id);
    this.schedule();
  }
  // ── edges ─────────────────────────────────────────────────────────────────
  addEdge(e) {
    this.upsert(this._edges, this.dEdges, e);
    this.schedule();
  }
  updateEdge(id, patch) {
    if (this.patchRecord(this._edges, this.dEdges, id, patch)) this.schedule();
  }
  removeEdge(id) {
    this.removeFrom(this._edges, this.dEdges, id);
    this.schedule();
  }
  // ── groups ────────────────────────────────────────────────────────────────
  addGroup(g) {
    this.upsert(this._groups, this.dGroups, g);
    this.schedule();
  }
  updateGroup(id, patch) {
    if (this.patchRecord(this._groups, this.dGroups, id, patch)) this.schedule();
  }
  removeGroup(id) {
    this.removeFrom(this._groups, this.dGroups, id);
    this.schedule();
  }
  // ── annotations ───────────────────────────────────────────────────────────
  addAnnotation(a) {
    this.upsert(this._annotations, this.dAnnotations, a);
    this.schedule();
  }
  updateAnnotation(id, patch) {
    if (this.patchRecord(this._annotations, this.dAnnotations, id, patch)) this.schedule();
  }
  removeAnnotation(id) {
    this.removeFrom(this._annotations, this.dAnnotations, id);
    this.schedule();
  }
  // ── flush ─────────────────────────────────────────────────────────────────
  /** Emit the pending delta now (the engine calls this once per frame). */
  flush() {
    this.scheduled = false;
    const movedAll = this._movedAll;
    this._movedAll = false;
    const hasMoved = movedAll ? this._nodes.size > 0 : this.dMoved.size > 0;
    const empty = this.isClean(this.dNodes) && !hasMoved && this.isClean(this.dEdges) && this.isClean(this.dGroups) && this.isClean(this.dAnnotations);
    if (empty) return;
    const moved = movedAll ? [] : [...this.dMoved];
    const event = {
      nodes: { ...drain(this.dNodes), moved, movedAll },
      edges: drain(this.dEdges),
      groups: drain(this.dGroups),
      annotations: drain(this.dAnnotations),
      version: ++this.version
    };
    clearDirty(this.dNodes);
    this.dMoved.clear();
    clearDirty(this.dEdges);
    clearDirty(this.dGroups);
    clearDirty(this.dAnnotations);
    for (const l of [...this.listeners]) l(event);
  }
  // ── internals ─────────────────────────────────────────────────────────────
  schedule() {
    if (this.scheduled || this.flushMode === "manual") return;
    this.scheduled = true;
    this.cancel = scheduleFlush(this.flushMode, () => this.flush());
  }
  isClean(d) {
    return d.added.size === 0 && d.changed.size === 0 && d.removed.size === 0;
  }
  /** Insert/replace a node: cold record (minus x/y) + hot position columns. */
  upsertNode(n2) {
    const { x, y, ...rest } = n2;
    const existed = this._nodes.has(n2.id);
    this._nodes.set(n2.id, rest);
    this.writePos(n2.id, x, y, true);
    if (existed) {
      this.dNodes.removed.delete(n2.id);
      if (!this.dNodes.added.has(n2.id)) this.dNodes.changed.add(n2.id);
    } else {
      this.dNodes.added.add(n2.id);
      this.dNodes.removed.delete(n2.id);
    }
  }
  /**
   * Write a node's position into the hot column. `replace` (used on full upsert)
   * clears the `HAS_POSITION` bit when no `x`/`y` is supplied; otherwise a partial
   * update keeps the existing coordinate for an omitted axis.
   */
  writePos(id, x, y, replace) {
    const has = x !== void 0 || y !== void 0;
    if (this._pos.has(id)) {
      if (has) {
        const cx = x ?? this._pos.get(id, "x") ?? 0;
        const cy = y ?? this._pos.get(id, "y") ?? 0;
        const flags = (this._pos.get(id, "flags") ?? 0) | NODE_FLAG.HAS_POSITION;
        this._pos.update(id, { x: cx, y: cy, flags });
      } else if (replace) {
        const flags = (this._pos.get(id, "flags") ?? 0) & ~NODE_FLAG.HAS_POSITION;
        this._pos.update(id, { x: 0, y: 0, flags });
      }
    } else {
      this._pos.add(id, { x: x ?? 0, y: y ?? 0, flags: has ? NODE_FLAG.HAS_POSITION : 0 });
    }
  }
  replaceNodes(next) {
    const nextIds = new Set(next.map((r) => r.id));
    for (const id of [...this._nodes.keys()]) {
      if (!nextIds.has(id)) this.removeNode(id);
    }
    for (const r of next) this.upsertNode(r);
  }
  upsert(map, dirty, record) {
    const existed = map.has(record.id);
    map.set(record.id, record);
    if (existed) {
      dirty.removed.delete(record.id);
      if (!dirty.added.has(record.id)) dirty.changed.add(record.id);
    } else {
      dirty.added.add(record.id);
      dirty.removed.delete(record.id);
    }
  }
  patchRecord(map, dirty, id, patch) {
    const cur = map.get(id);
    if (!cur) return false;
    map.set(id, { ...cur, ...patch });
    if (!dirty.added.has(id)) dirty.changed.add(id);
    return true;
  }
  removeFrom(map, dirty, id) {
    if (!map.has(id)) return false;
    map.delete(id);
    dirty.changed.delete(id);
    if (dirty.added.delete(id)) return true;
    dirty.removed.add(id);
    return true;
  }
  replaceKind(map, dirty, next) {
    const nextIds = new Set(next.map((r) => r.id));
    for (const id of [...map.keys()]) {
      if (!nextIds.has(id)) this.removeFrom(map, dirty, id);
    }
    for (const r of next) this.upsert(map, dirty, r);
  }
};

export { Behaviour, BehaviourRegistry, CANVAS_SOURCE, Camera, CanvasEventBus, CanvasThemeState, ColumnStore, CommandRegistry, DEFAULT_ENDPOINT_BADGE_GAP_PX, DEFAULT_POSITION_TRANSITION_MS, DefaultGestureArbiter, DirtyBatcher, EASING_NAMES, EventEmitter, HeadlessCameraBinding, HeadlessElementRenderer, HeadlessRenderer, HeadlessSurface, INHERIT, LOOP_CURVE_PRESETS, Layer, LayerData, LayerRegistry, Layout, LayoutRegistry, NODE_FLAG, SourceEmitter, SpecProjector, SpecStore, Tween, animatePositions, attrs, bezierPathStyle, boundaryAnchor, boundsOfArc, boundsOfCircle, boundsOfComposite, boundsOfCompositeRoot, boundsOfEllipse, boundsOfPath, boundsOfPolygon, boundsOfRect, boundsOfRegularPolygon, boundsOfSpec, boundsOfStar, bumpHorizontalPathStyle, bumpRadialPathStyle, bundlePathStyle, centerAnchor, collapsedSpec, collapsedTabbedRect, compositeRootOffset, connectorGeometryKey, connectorToSvg, containsArc, containsCircle, containsComposite, containsEllipse, containsPath, containsPolygon, containsRect, containsRegularPolygon, containsSpec, containsStar, containsTabbedRect, createActions, defaultCanvasView, defaultEqual, distanceToOutlineSq, distanceToPolylineSq, distanceToSegmentSq, easeInOutCubic, easeInOutSine, easeOutCubic, easeOutQuad, edgePortAnchor, erRouter, esc, fillPaint, fitSpecToContent, fitTabbedRectToContent, hasSilhouetteFill, hexToCss, isInherit, linear, loopCurvePathStyle, loopPolylinePathStyle, manhattanRouter, metroRouter, normalPathStyle, offsetPolygon, oneSideRouter, originToBadgeLocal, orthRouter, pathBounds, pathToSvgD, perpendicularAnchor, pointInPolygon, pointsAttr, polygonBounds, polygonContainsInflated, quadraticPathStyle, rayPolygonIntersection, regularPolygonVertices, resolveBadgePosition, resolveCompositeRoot, resolveConnectorBadgePosition, resolveEasing, resolveLabelScale, resolveThemed, roundedPathStyle, roundedPolygonOutline, samplePath, samplePathAt, scaleArc, scaleCircle, scaleEllipse, scalePath, scalePolygon, scaleRect, scaleRegularPolygon, scaleSpec, scaleStar, scaleTabbedRect, scheduleFlush, select, shallowEqual, shapeSpecToSvg, silhouettePortAnchor, smoothPathStyle, starVertices, stepRadialPathStyle, straightRouter, strokeBandOf, strokePaint, n as svgNum, tabbedRectBounds, tabbedRectFoldLine, tabbedRectGeometry, tabbedRectOutline, tabbedRectTabBox, tabbedRectTabWidth, tangentAt, textContent, trimPathEnds, verticesOfRegularPolygon, verticesOfStar };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map