/**
 * Vector2 - 2D vector utilities
 */

export interface Vector2 {
  x: number;
  y: number;
}

export const vec2 = {
  create(x = 0, y = 0): Vector2 {
    return { x, y };
  },

  clone(v: Vector2): Vector2 {
    return { x: v.x, y: v.y };
  },

  add(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x + b.x, y: a.y + b.y };
  },

  subtract(a: Vector2, b: Vector2): Vector2 {
    return { x: a.x - b.x, y: a.y - b.y };
  },

  multiply(v: Vector2, scalar: number): Vector2 {
    return { x: v.x * scalar, y: v.y * scalar };
  },

  divide(v: Vector2, scalar: number): Vector2 {
    return { x: v.x / scalar, y: v.y / scalar };
  },

  dot(a: Vector2, b: Vector2): number {
    return a.x * b.x + a.y * b.y;
  },

  cross(a: Vector2, b: Vector2): number {
    return a.x * b.y - a.y * b.x;
  },

  length(v: Vector2): number {
    return Math.sqrt(v.x * v.x + v.y * v.y);
  },

  lengthSquared(v: Vector2): number {
    return v.x * v.x + v.y * v.y;
  },

  normalize(v: Vector2): Vector2 {
    const len = vec2.length(v);
    if (len === 0) return { x: 0, y: 0 };
    return { x: v.x / len, y: v.y / len };
  },

  distance(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return Math.sqrt(dx * dx + dy * dy);
  },

  distanceSquared(a: Vector2, b: Vector2): number {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    return dx * dx + dy * dy;
  },

  angle(v: Vector2): number {
    return Math.atan2(v.y, v.x);
  },

  angleBetween(a: Vector2, b: Vector2): number {
    return Math.atan2(b.y - a.y, b.x - a.x);
  },

  rotate(v: Vector2, angle: number): Vector2 {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    return {
      x: v.x * cos - v.y * sin,
      y: v.x * sin + v.y * cos,
    };
  },

  rotateAround(v: Vector2, center: Vector2, angle: number): Vector2 {
    const translated = vec2.subtract(v, center);
    const rotated = vec2.rotate(translated, angle);
    return vec2.add(rotated, center);
  },

  lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
    };
  },

  midpoint(a: Vector2, b: Vector2): Vector2 {
    return vec2.lerp(a, b, 0.5);
  },

  perpendicular(v: Vector2): Vector2 {
    return { x: -v.y, y: v.x };
  },

  reflect(v: Vector2, normal: Vector2): Vector2 {
    const d = 2 * vec2.dot(v, normal);
    return {
      x: v.x - d * normal.x,
      y: v.y - d * normal.y,
    };
  },

  equals(a: Vector2, b: Vector2, epsilon = 0.0001): boolean {
    return Math.abs(a.x - b.x) < epsilon && Math.abs(a.y - b.y) < epsilon;
  },

  zero(): Vector2 {
    return { x: 0, y: 0 };
  },

  one(): Vector2 {
    return { x: 1, y: 1 };
  },

  up(): Vector2 {
    return { x: 0, y: -1 };
  },

  down(): Vector2 {
    return { x: 0, y: 1 };
  },

  left(): Vector2 {
    return { x: -1, y: 0 };
  },

  right(): Vector2 {
    return { x: 1, y: 0 };
  },
};
