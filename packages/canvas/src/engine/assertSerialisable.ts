/**
 * Dev-mode walker that asserts an event payload is serialisable.
 *
 * Architecture: see `architecture-proposal.md` §2.5 (Serialisability discipline).
 *
 * Once the canvas advertises `tap()` as telemetry-ready, payloads must be
 * serialisable: only ids, numbers, strings, plain objects, arrays, and
 * `Map`/`Set` containing the same. PixiJS objects, DOM nodes, function refs,
 * and class instances must NOT appear in payloads — they break:
 *
 *   - JSON-based telemetry sinks (Datadog, log shippers)
 *   - structured-clone-based sinks (BroadcastChannel, postMessage to workers)
 *   - devtools time-travel
 *   - test snapshots
 *
 * The walker is **dev-only**. The exported `assertSerialisable` is
 * unconditionally callable, but `assertSerialisableInDev` is the public
 * entry point that the bus uses — it inlines a build-time NODE_ENV check
 * so production bundlers tree-shake the entire walker out.
 *
 * @example violation log
 *   [canvas] payload at 'node.shape' is not serialisable: BaseShape (class instance)
 */

const ALLOWED_CLASS_TAGS = new Set(['Object', 'Array', 'Map', 'Set']);

/**
 * Walk `value`, returning a list of human-readable violation messages.
 * Empty array means "fully serialisable".
 *
 * The walker is iterative-ish: it uses recursion but with explicit cycle
 * detection so a self-referencing payload doesn't blow the stack.
 */
export function findSerialisationViolations(
  value: unknown,
  rootPath = '',
): string[] {
  const violations: string[] = [];
  const seen = new WeakSet<object>();

  function walk(v: unknown, path: string): void {
    if (v === null || v === undefined) return;

    const t = typeof v;
    if (t === 'string' || t === 'number' || t === 'boolean') return;

    if (t === 'function') {
      violations.push(`${path || '<root>'} — function reference`);
      return;
    }

    if (t === 'symbol' || t === 'bigint') {
      violations.push(`${path || '<root>'} — ${t}`);
      return;
    }

    // Object-like from here on.
    const obj = v as object;

    if (seen.has(obj)) return; // cycle — already reported (or ignored)
    seen.add(obj);

    if (Array.isArray(obj)) {
      for (let i = 0; i < obj.length; i++) {
        walk(obj[i], `${path}[${i}]`);
      }
      return;
    }

    if (obj instanceof Map) {
      let i = 0;
      for (const [k, vv] of obj) {
        if (typeof k !== 'string' && typeof k !== 'number') {
          violations.push(`${path}.<map key #${i}> — non-primitive key (${typeof k})`);
        }
        walk(vv, `${path}.<map[${formatMapKey(k)}]>`);
        i++;
      }
      return;
    }

    if (obj instanceof Set) {
      let i = 0;
      for (const item of obj) {
        walk(item, `${path}.<set[${i}]>`);
        i++;
      }
      return;
    }

    // Detect specific non-serialisable kinds first for friendlier messages.
    const ctorName = obj.constructor?.name ?? '<anonymous>';
    if (
      typeof Element !== 'undefined' && obj instanceof Element
    ) {
      violations.push(`${path || '<root>'} — DOM Element (${ctorName})`);
      return;
    }
    if (typeof Node !== 'undefined' && obj instanceof Node) {
      violations.push(`${path || '<root>'} — DOM Node (${ctorName})`);
      return;
    }

    // A plain object (constructor === Object, or Object-tag) is serialisable.
    // Anything else (a class instance) is NOT — but we still walk its enumerable
    // own properties so a partially-bad payload still surfaces the bad branches.
    if (!ALLOWED_CLASS_TAGS.has(ctorName)) {
      violations.push(
        `${path || '<root>'} — class instance (${ctorName})`,
      );
      // fall through and walk own enumerable properties for completeness
    }

    for (const [k, vv] of Object.entries(obj)) {
      walk(vv, path ? `${path}.${k}` : k);
    }
  }

  walk(value, rootPath);
  return violations;
}

function formatMapKey(k: unknown): string {
  if (typeof k === 'string') return JSON.stringify(k);
  if (typeof k === 'number') return String(k);
  return `<${typeof k}>`;
}

/**
 * Convenience: assert a payload is serialisable. In dev, logs warnings via
 * `console.warn` for each violation (with offending path). In production,
 * compiles to a no-op via `process.env.NODE_ENV` substitution.
 *
 * Pass a `context` string so the warning includes which event triggered it,
 * e.g. `assertSerialisableInDev(payload, "emit('node:click')")`.
 */
export function assertSerialisableInDev(value: unknown, context: string): void {
  const proc = (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process;
  if (proc?.env?.NODE_ENV === 'production') return;

  const violations = findSerialisationViolations(value);
  if (violations.length === 0) return;

  for (const v of violations) {
    // eslint-disable-next-line no-console
    console.warn(`[canvas] ${context}.payload.${v}`);
  }
}
