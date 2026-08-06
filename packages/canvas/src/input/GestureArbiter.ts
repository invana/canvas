/**
 * `GestureArbiter` — who owns the pointer right now.
 *
 * Architecture: see `docs/renderer-split-design.md` §9 (P5).
 *
 * **Why this exists.** Before P5, a behaviour that needed the camera to stop
 * panning during its own gesture reached for `camera.viewport.plugins.pause('drag')`
 * — sixteen calls across six behaviours, every one of them poking at a
 * `pixi-viewport` internal from domain code. The thing they actually wanted was
 * never a camera API: it was *exclusivity*. A node drag, a lasso, a brush, a
 * resize and an edge draw are all mutually exclusive pointer gestures, and the
 * camera pan is simply the lowest-priority one of them.
 *
 * So the arbiter models the real invariant — **at most one owner at a time** —
 * and the camera becomes a subscriber like anything else: `DragPanBehaviour`
 * yields while {@link GestureArbiter.owner} names somebody else. That inverts
 * the old direction (others suspending the camera) into the camera suspending
 * itself, which is what lets the pixi-viewport handle move into the renderer
 * package in P6 without dragging six domain behaviours along with it.
 *
 * **Leak safety is the whole design.** A claim that is never released freezes
 * every gesture *and* the camera, which is worse than the failure it replaces.
 * Three properties defend against that:
 *
 * 1. **Release is token-identified.** The function returned by
 *    {@link GestureArbiter.claim} only clears *that* claim. Calling it twice is a
 *    no-op, and calling a stale one can never evict a later owner.
 * 2. **A re-claim by the current owner always succeeds.** A behaviour that
 *    leaks its own claim can never deadlock *itself* out of its next gesture —
 *    the old token is simply invalidated.
 * 3. **`Behaviour` releases on `disable()` and `destroy()`** regardless of what
 *    the subclass did (see `Behaviour.claimGesture`), so unmount and mid-gesture
 *    teardown can't strand a claim.
 */

/** Options for a single {@link GestureArbiter.claim}. */
export interface GestureClaimOptions {
  /**
   * Higher wins. A claim is refused when another owner holds the gesture at an
   * equal or higher priority; a strictly higher priority **pre-empts** the
   * current owner (whose {@link GestureClaimOptions.onRevoke} fires and whose
   * release function goes inert). Default `0` — every built-in behaviour claims
   * at the default, so no pre-emption happens unless a consumer asks for it.
   */
  priority?: number;

  /**
   * Called when this claim is pre-empted by a higher-priority owner. The seam
   * a long-running gesture uses to abort cleanly instead of continuing to move
   * things while somebody else drives the pointer. Not called on a normal
   * release, nor when the same owner re-claims.
   */
  onRevoke?: () => void;
}

/**
 * Arbitrates exclusive ownership of the pointer gesture. Reached as
 * `ctx.gestures`; provided per-`Canvas`.
 */
export interface GestureArbiter {
  /**
   * Try to take the gesture for `owner` (by convention the behaviour's `id`).
   * Returns a **release** function on success, or `null` when another owner
   * already holds it at an equal-or-higher priority — in which case the caller
   * should not start its gesture.
   *
   * Release is idempotent and identity-checked: calling it after the claim has
   * already ended (or been pre-empted) does nothing, so it can never clear
   * somebody else's claim.
   */
  claim(owner: string, opts?: GestureClaimOptions): (() => void) | null;

  /** The current owner id, or `null` when the gesture is free. */
  readonly owner: string | null;

  /**
   * Subscribe to ownership changes — the hook `DragPanBehaviour` uses to
   * suspend and restore camera panning. Fires with the new owner (`null` when
   * released). Returns an unsubscribe function.
   */
  onOwnerChange(listener: (owner: string | null) => void): () => void;
}

/** The live claim, plus the token that authorises releasing it. */
interface ActiveClaim {
  readonly owner: string;
  readonly priority: number;
  /** Identity of this specific claim — what makes release non-transferable. */
  readonly token: symbol;
  readonly onRevoke?: () => void;
}

/**
 * The default in-memory {@link GestureArbiter}. Renderer-free and DOM-free: it
 * knows nothing about pointers, only about who asked first.
 */
export class DefaultGestureArbiter implements GestureArbiter {
  private active: ActiveClaim | null = null;
  private readonly listeners = new Set<(owner: string | null) => void>();

  get owner(): string | null {
    return this.active?.owner ?? null;
  }

  claim(owner: string, opts?: GestureClaimOptions): (() => void) | null {
    const priority = opts?.priority ?? 0;
    const current = this.active;
    const sameOwner = current?.owner === owner;

    // Refuse only a *different* owner that isn't out-prioritised. Letting the
    // current owner re-claim keeps a behaviour that leaked its own release from
    // locking itself out forever (property 2 in the file docblock).
    if (current && !sameOwner && priority <= current.priority) return null;

    const token = Symbol(owner);
    this.active = { owner, priority, token, onRevoke: opts?.onRevoke };

    // Notify the loser *after* `active` is swapped, so an `onRevoke` that calls
    // its own (now stale) release sees the mismatch and no-ops.
    if (current && !sameOwner) current.onRevoke?.();
    if (!sameOwner) this.emit();

    return () => this.release(token);
  }

  onOwnerChange(listener: (owner: string | null) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Drop the claim identified by `token`. A stale token — from a released or
   * pre-empted claim — is ignored, which is what makes double-release safe.
   */
  private release(token: symbol): void {
    if (this.active?.token !== token) return;
    this.active = null;
    this.emit();
  }

  /** Snapshot before iterating: a listener may unsubscribe from inside itself. */
  private emit(): void {
    const owner = this.owner;
    for (const listener of [...this.listeners]) listener(owner);
  }
}
