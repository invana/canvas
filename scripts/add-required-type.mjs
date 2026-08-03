/**
 * Codemod — insert a `type` on every object literal that TypeScript reports as
 * missing one after `GraphNode.type` / `GraphEdge.type` became required.
 *
 * **Diagnostic-driven, not regex-driven.** It reads `TS2741: Property 'type' is
 * missing …` (and the `TS2345` argument form) straight out of `tsc --noEmit`, so
 * the worklist is exactly the set of literals the compiler cares about — no
 * guessing which `{ id: … }` happens to be a graph record, and no risk of
 * rewriting an unrelated object that merely has an `id`.
 *
 * The inserted value is chosen per *file*, not per record: a story fixture is
 * almost always one homogeneous graph. Pass a map to override.
 *
 *   node scripts/add-required-type.mjs <pkgDir> [--node=<T>] [--edge=<T>] [--dry]
 */
import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const [pkgDir, ...flags] = process.argv.slice(2);
const arg = (n, d) => flags.find((f) => f.startsWith(`--${n}=`))?.split('=')[1] ?? d;
const NODE_TYPE = arg('node', 'node');
const EDGE_TYPE = arg('edge', 'edge');
const DRY = flags.includes('--dry');

/** Run tsc and return the diagnostics that mean "this literal needs a type". */
function diagnostics() {
  let out = '';
  try {
    execSync('npx tsc --noEmit --pretty false', { cwd: pkgDir, encoding: 'utf8', stdio: 'pipe' });
  } catch (e) {
    out = `${e.stdout ?? ''}${e.stderr ?? ''}`;
  }
  const hits = [];
  for (const line of out.split('\n')) {
    // `path(line,col): error TSxxxx: … 'type' … GraphNode|GraphEdge …`
    // 2741 = property missing · 2345 = bad argument · 2322 = bad assignment
    const m = line.match(/^(.+?)\((\d+),(\d+)\): error TS(2741|2345|2322):(.*)$/);
    if (!m) continue;
    const [, file, ln, col, code, msg] = m;
    if (!/'type'/.test(msg) && code === '2741') continue;
    if (!/Graph(Node|Edge)/.test(msg)) continue;
    // TS2322 is the assignment form (a literal into an annotated array). Only
    // take it when the *source* type shown in the message has no `type:` of its
    // own — otherwise it's an unrelated mismatch and none of our business.
    if (code === '2322' && /Type '\{[^']*\btype:/.test(msg)) continue;
    hits.push({
      file: resolve(pkgDir, file),
      line: +ln,
      col: +col,
      kind: /GraphEdge/.test(msg) ? 'edge' : 'node',
    });
  }
  return hits;
}

/**
 * Insert `type: '<T>'` into the literal starting at (line, col).
 *
 * Anchored on the literal's own opening brace from the diagnostic position, so
 * nested objects and multi-line literals land correctly. Inserted immediately
 * after `{` to keep `id` first in the source, matching the house style.
 */
function insert(text, line, col, value) {
  const lines = text.split('\n');
  let idx = line - 1;
  let src = lines[idx];
  if (!src) return null;
  let at = col - 1;

  // Fallback for the array-assignment shape:
  //   const nodes: GraphNode[] = xs.map((n) => ({ id: … }))
  //   const nodes: GraphNode[] = xs.map((n) => { … return { id: … } })
  // The diagnostic points at the *variable*, not the literal, so walk forward to
  // the first object literal that opens a record — `=> ({` or `return {`.
  if (src[at] !== '{') {
    let found = false;
    for (let i = idx; i < Math.min(idx + 8, lines.length); i++) {
      const l = lines[i];
      // `=> ({` and `return {` open an *object literal*. A bare `=> {` opens a
      // function *body* — matching it inserts a property into a statement list
      // and produces `=> { type: 'node', const x = …`, which is not valid TS.
      const m = l.match(/=>\s*\(\{|return\s*\{/);
      if (!m) continue;
      const brace = l.indexOf('{', m.index);
      if (brace === -1) continue;
      idx = i; src = l; at = brace; found = true;
      break;
    }
    if (!found) return null;
  }
  if (/^\{\s*[^}]*\btype\s*:/.test(src.slice(at))) return null; // already has one
  lines[idx] = `${src.slice(0, at + 1)} type: ${value},${src.slice(at + 1)}`;
  return lines.join('\n');
}

const hits = diagnostics();
const byFile = new Map();
for (const h of hits) (byFile.get(h.file) ?? byFile.set(h.file, []).get(h.file)).push(h);

let changed = 0, skipped = 0;
for (const [file, list] of byFile) {
  let text = readFileSync(file, 'utf8');
  // Bottom-up so earlier insertions don't shift later positions.
  for (const h of list.sort((a, b) => b.line - a.line || b.col - a.col)) {
    const value = `'${h.kind === 'edge' ? EDGE_TYPE : NODE_TYPE}'`;
    const next = insert(text, h.line, h.col, value);
    if (next === null) { skipped++; continue; }
    text = next; changed++;
  }
  if (!DRY) writeFileSync(file, text);
}
console.log(`${DRY ? '[dry] ' : ''}inserted ${changed}, skipped ${skipped}, across ${byFile.size} files`);
