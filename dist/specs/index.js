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
  const n = vertices.length;
  if (n < 3) return false;
  let inside = false;
  for (let i = 0, j = n - 1; i < n; j = i++) {
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
  const n = vertices.length;
  if (n === 0) return Infinity;
  if (n === 1) {
    const v = vertices[0];
    return (x - v.x) * (x - v.x) + (y - v.y) * (y - v.y);
  }
  const edges = closed ? n : n - 1;
  let best = Infinity;
  for (let i = 0; i < edges; i++) {
    const a = vertices[i];
    const b = vertices[(i + 1) % n];
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
  const n = vertices.length;
  if (n < 3 || distance === 0) return vertices.map((v) => ({ x: v.x, y: v.y }));
  const ccw = signedArea(vertices) > 0;
  const out = new Array(n);
  for (let i = 0; i < n; i++) {
    const prev = vertices[(i + n - 1) % n];
    const curr = vertices[i];
    const next = vertices[(i + 1) % n];
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
  const n = Math.max(3, Math.floor(sides));
  const out = new Array(n);
  const base = -Math.PI / 2 + rotationRad;
  const step = Math.PI * 2 / n;
  for (let i = 0; i < n; i++) {
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
  const n = vertices.length;
  if (n < 2) return null;
  const dx = localFromCenter.x;
  const dy = localFromCenter.y;
  if (dx === 0 && dy === 0) return null;
  let bestT = -Infinity;
  let hit = null;
  for (let i = 0, j = n - 1; i < n; j = i++) {
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
  const n = corners.length;
  if (n < 3) return corners.map((c) => ({ x: c.x, y: c.y }));
  const out = [];
  for (let i = 0; i < n; i++) {
    const p = corners[i];
    const prev = corners[(i + n - 1) % n];
    const next = corners[(i + 1) % n];
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
  const n = vertices.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const a = vertices[j];
    const b = vertices[i];
    sum += (b.x - a.x) * (b.y + a.y);
  }
  return -sum * 0.5;
}
function unitNormal(a, b, ccw) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  return ccw ? { x: -dy / len, y: dx / len } : { x: dy / len, y: -dx / len };
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
    let n = Math.ceil((a0 - cardinal) / TAU);
    if (cardinal + n * TAU < a0) n++;
    const angle = cardinal + n * TAU;
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
  let n = Math.ceil((a0 - theta) / TAU2);
  if (theta + n * TAU2 < a0) n++;
  const t = theta + n * TAU2;
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

export { SpecStore, boundsOfArc, boundsOfCircle, boundsOfComposite, boundsOfCompositeRoot, boundsOfEllipse, boundsOfPath, boundsOfPolygon, boundsOfRect, boundsOfRegularPolygon, boundsOfSpec, boundsOfStar, collapsedSpec, collapsedTabbedRect, compositeRootOffset, connectorGeometryKey, containsArc, containsCircle, containsComposite, containsEllipse, containsPath, containsPolygon, containsRect, containsRegularPolygon, containsSpec, containsStar, containsTabbedRect, distanceToOutlineSq, distanceToSegmentSq, fitSpecToContent, fitTabbedRectToContent, hasSilhouetteFill, offsetPolygon, pointInPolygon, polygonBounds, polygonContainsInflated, rayPolygonIntersection, regularPolygonVertices, resolveCompositeRoot, roundedPolygonOutline, scaleArc, scaleCircle, scaleEllipse, scalePath, scalePolygon, scaleRect, scaleRegularPolygon, scaleSpec, scaleStar, scaleTabbedRect, starVertices, strokeBandOf, tabbedRectBounds, tabbedRectFoldLine, tabbedRectGeometry, tabbedRectOutline, tabbedRectTabBox, tabbedRectTabWidth, verticesOfRegularPolygon, verticesOfStar };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map