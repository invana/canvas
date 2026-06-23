/**
 * Web Worker entry for the `animate: false` static settle. Receives a
 * {@link ForceSolveRequest}, runs the shared {@link solveForces} to convergence
 * off the main thread, and posts the settled positions back (transferring the
 * buffer — zero-copy). `D3ForceLayout` loads this via
 * `new Worker(new URL('./forceSolver.worker.js', import.meta.url), { type: 'module' })`,
 * which Vite / webpack 5 / Rollup statically detect and bundle as a worker asset.
 *
 * d3-force is pure math (no DOM), so it runs identically here and on the main
 * thread (the no-Worker fallback).
 */

import { solveForces, type ForceSolveRequest, type ForceSolveResponse } from './forceSolver';

// `self` in a dedicated worker is `DedicatedWorkerGlobalScope`; cast to the
// minimal surface we use so this compiles without the WebWorker lib.
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<ForceSolveRequest>) => void) | null;
  postMessage: (message: ForceSolveResponse, transfer: Transferable[]) => void;
};

ctx.onmessage = (event) => {
  const { token, input } = event.data;
  const positions = solveForces(input);
  ctx.postMessage({ token, positions }, [positions.buffer]);
};
