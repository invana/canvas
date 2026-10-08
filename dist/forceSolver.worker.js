import { forceSimulation, forceLink, forceManyBody, forceCenter, forceCollide, forceX, forceY, forceRadial } from 'd3-force';

// src/forceSolver.ts
var DEFAULT_SEPARATION_STRENGTH = 0.8;
var DEFAULT_SEPARATION_PADDING = 24;
function makeGroupSeparationForce(input, strength, padding) {
  const { boxCount, boxOf, halfSize, counts, insets, isGroup } = input;
  const minX = new Float64Array(boxCount);
  const minY = new Float64Array(boxCount);
  const maxX = new Float64Array(boxCount);
  const maxY = new Float64Array(boxCount);
  const pushX = new Float64Array(boxCount);
  const pushY = new Float64Array(boxCount);
  let nodes = [];
  const force = () => {
    minX.fill(Infinity);
    minY.fill(Infinity);
    maxX.fill(-Infinity);
    maxY.fill(-Infinity);
    pushX.fill(0);
    pushY.fill(0);
    for (let i = 0; i < nodes.length; i++) {
      if (counts[i] !== 1) continue;
      const n = nodes[i];
      const b = boxOf[i];
      const x = n.x ?? 0;
      const y = n.y ?? 0;
      const hw = halfSize[i * 2];
      const hh = halfSize[i * 2 + 1];
      if (x - hw < minX[b]) minX[b] = x - hw;
      if (y - hh < minY[b]) minY[b] = y - hh;
      if (x + hw > maxX[b]) maxX[b] = x + hw;
      if (y + hh > maxY[b]) maxY[b] = y + hh;
    }
    for (let b = 0; b < boxCount; b++) {
      if (minX[b] === Infinity) continue;
      minY[b] = minY[b] - insets[b * 4];
      maxX[b] = maxX[b] + insets[b * 4 + 1];
      maxY[b] = maxY[b] + insets[b * 4 + 2];
      minX[b] = minX[b] - insets[b * 4 + 3];
    }
    const k = strength;
    let any = false;
    for (let a = 0; a < boxCount; a++) {
      if (minX[a] === Infinity) continue;
      for (let b = a + 1; b < boxCount; b++) {
        if (minX[b] === Infinity) continue;
        if (isGroup[a] !== 1 && isGroup[b] !== 1) continue;
        const ox = Math.min(maxX[a], maxX[b]) - Math.max(minX[a], minX[b]) + padding;
        const oy = Math.min(maxY[a], maxY[b]) - Math.max(minY[a], minY[b]) + padding;
        if (ox <= 0 || oy <= 0) continue;
        any = true;
        if (ox < oy) {
          const dir = minX[a] + maxX[a] <= minX[b] + maxX[b] ? -1 : 1;
          pushX[a] = pushX[a] + dir * ox * k / 2;
          pushX[b] = pushX[b] - dir * ox * k / 2;
        } else {
          const dir = minY[a] + maxY[a] <= minY[b] + maxY[b] ? -1 : 1;
          pushY[a] = pushY[a] + dir * oy * k / 2;
          pushY[b] = pushY[b] - dir * oy * k / 2;
        }
      }
    }
    if (!any) return;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i];
      if (n.fx != null) continue;
      const b = boxOf[i];
      n.vx = (n.vx ?? 0) + pushX[b];
      n.vy = (n.vy ?? 0) + pushY[b];
    }
  };
  force.initialize = (n) => {
    nodes = n;
  };
  return force;
}
var DEFAULT_CLUSTER_STRENGTH = 0.2;
function makeClusterForce(clusterOf, strength) {
  let nodes = [];
  const force = (alpha) => {
    const centroids = /* @__PURE__ */ new Map();
    for (const node of nodes) {
      const c = clusterOf(node);
      if (c < 0) continue;
      let acc = centroids.get(c);
      if (!acc) {
        acc = { x: 0, y: 0, n: 0 };
        centroids.set(c, acc);
      }
      acc.x += node.x ?? 0;
      acc.y += node.y ?? 0;
      acc.n += 1;
    }
    if (centroids.size === 0) return;
    for (const acc of centroids.values()) {
      acc.x /= acc.n;
      acc.y /= acc.n;
    }
    const k = strength * alpha;
    for (const node of nodes) {
      const c = clusterOf(node);
      if (c < 0) continue;
      const acc = centroids.get(c);
      node.vx = (node.vx ?? 0) + (acc.x - (node.x ?? 0)) * k;
      node.vy = (node.vy ?? 0) + (acc.y - (node.y ?? 0)) * k;
    }
  };
  force.initialize = (n) => {
    nodes = n;
  };
  return force;
}
function solveForces(input) {
  const { count, positions, seeded, fixed, links, radii, clusters, separation, params } = input;
  const nodes = new Array(count);
  for (let i = 0; i < count; i++) {
    const n = { index: i };
    if (seeded[i]) {
      const x = positions[i * 2];
      const y = positions[i * 2 + 1];
      n.x = x;
      n.y = y;
      if (fixed[i]) {
        n.fx = x;
        n.fy = y;
      }
    }
    nodes[i] = n;
  }
  const linkObjs = [];
  for (let i = 0; i < links.length; i += 2) {
    linkObjs.push({ source: links[i], target: links[i + 1] });
  }
  const sim = forceSimulation(nodes).stop();
  configureForces(sim, linkObjs, radii, clusters, separation, params);
  configureSimulation(sim, params);
  const decay = 1 - sim.alphaDecay();
  const ticks = decay > 0 && decay < 1 ? Math.min(1e3, Math.max(1, Math.ceil(Math.log(sim.alphaMin() / sim.alpha()) / Math.log(decay)))) : 300;
  for (let i = 0; i < ticks; i++) sim.tick();
  const out = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    out[i * 2] = nodes[i].x ?? 0;
    out[i * 2 + 1] = nodes[i].y ?? 0;
  }
  return out;
}
function configureForces(sim, links, radii, clusters, separation, params) {
  const { link, charge, center, collide, x, y, radial, cluster, separateGroups } = params;
  if (link !== void 0) {
    const force = forceLink(links);
    if (link.distance !== void 0) force.distance(link.distance);
    if (link.strength !== void 0) force.strength(link.strength);
    if (link.iterations !== void 0) force.iterations(link.iterations);
    sim.force("link", force);
  }
  if (charge !== void 0) {
    const force = forceManyBody();
    if (charge.strength !== void 0) force.strength(charge.strength);
    if (charge.theta !== void 0) force.theta(charge.theta);
    if (charge.distanceMin !== void 0) force.distanceMin(charge.distanceMin);
    if (charge.distanceMax !== void 0) force.distanceMax(charge.distanceMax);
    sim.force("charge", force);
  }
  if (center !== void 0) {
    const force = forceCenter(center.x ?? 0, center.y ?? 0);
    if (center.strength !== void 0) force.strength(center.strength);
    sim.force("center", force);
  } else if (x === void 0 && y === void 0 && radial === void 0) {
    sim.force("center", forceCenter(0, 0));
  }
  if (radii) {
    const force = forceCollide().radius((d) => radii[d.index] ?? 0);
    if (collide?.strength !== void 0) force.strength(collide.strength);
    if (collide?.iterations !== void 0) force.iterations(collide.iterations);
    sim.force("collide", force);
  }
  if (x !== void 0) {
    const force = forceX();
    if (x.x !== void 0) force.x(x.x);
    if (x.strength !== void 0) force.strength(x.strength);
    sim.force("x", force);
  }
  if (y !== void 0) {
    const force = forceY();
    if (y.y !== void 0) force.y(y.y);
    if (y.strength !== void 0) force.strength(y.strength);
    sim.force("y", force);
  }
  if (radial !== void 0) {
    const force = forceRadial(radial.radius, radial.x ?? 0, radial.y ?? 0);
    if (radial.strength !== void 0) force.strength(radial.strength);
    sim.force("radial", force);
  }
  if (clusters && cluster !== void 0) {
    sim.force(
      "cluster",
      makeClusterForce(
        (n) => clusters[n.index] ?? -1,
        cluster.strength ?? DEFAULT_CLUSTER_STRENGTH
      )
    );
  }
  if (separation && separateGroups !== void 0) {
    sim.force(
      "separateGroups",
      makeGroupSeparationForce(
        separation,
        separateGroups.strength ?? DEFAULT_SEPARATION_STRENGTH,
        separateGroups.padding ?? DEFAULT_SEPARATION_PADDING
      )
    );
  }
}
function configureSimulation(sim, params) {
  const { alpha, alphaMin, alphaDecay, alphaTarget, velocityDecay } = params;
  if (alpha !== void 0) sim.alpha(alpha);
  if (alphaMin !== void 0) sim.alphaMin(alphaMin);
  if (alphaDecay !== void 0) sim.alphaDecay(alphaDecay);
  if (alphaTarget !== void 0) sim.alphaTarget(alphaTarget);
  if (velocityDecay !== void 0) sim.velocityDecay(velocityDecay);
}

// src/forceSolver.worker.ts
var ctx = self;
ctx.onmessage = (event) => {
  const { token, input } = event.data;
  const positions = solveForces(input);
  ctx.postMessage({ token, positions }, [positions.buffer]);
};
//# sourceMappingURL=forceSolver.worker.js.map
//# sourceMappingURL=forceSolver.worker.js.map