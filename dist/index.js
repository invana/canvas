import { SubgraphPositionLayout } from '@invana/graph';

// src/GeometricLayout.ts
var DEFAULT_MODE = "grid";
var DEFAULT_GAP = 60;
var DEFAULT_CIRCULAR_SPACING = 50;
var SIZE_GAP = 24;
var GeometricLayout = class extends SubgraphPositionLayout {
  kind = "geometric-layout";
  computeSubgraphLayout(sub) {
    const ids = [...sub.ids];
    let maxW = 0;
    let maxH = 0;
    for (const id of ids) {
      const size = sub.sizeOf(id);
      if (size.width > maxW) maxW = size.width;
      if (size.height > maxH) maxH = size.height;
    }
    const n = ids.length;
    if (n === 0) return null;
    const cx = this.opts.center?.x ?? 0;
    const cy = this.opts.center?.y ?? 0;
    const positions = new Float32Array(n * 2);
    const mode = this.opts.mode ?? DEFAULT_MODE;
    if (mode === "circular") {
      const startAngle = this.opts.startAngle ?? -Math.PI / 2;
      const dir = this.opts.clockwise === false ? -1 : 1;
      const spacing = Math.max(this.opts.nodeSpacing ?? DEFAULT_CIRCULAR_SPACING, Math.max(maxW, maxH) + SIZE_GAP);
      const radius = this.opts.radius ?? Math.max(spacing, n * spacing / (2 * Math.PI));
      for (let i = 0; i < n; i++) {
        const angle = startAngle + dir * (2 * Math.PI * i) / n;
        positions[i * 2] = cx + radius * Math.cos(angle);
        positions[i * 2 + 1] = cy + radius * Math.sin(angle);
      }
      return { ids, positions };
    }
    const columns = Math.max(1, Math.floor(this.opts.columns ?? Math.ceil(Math.sqrt(n))));
    const rows = Math.ceil(n / columns);
    const gx = Math.max(this.opts.columnGap ?? DEFAULT_GAP, maxW + SIZE_GAP);
    const gy = Math.max(this.opts.rowGap ?? DEFAULT_GAP, maxH + SIZE_GAP);
    const offsetX = (columns - 1) * gx / 2;
    const offsetY = (rows - 1) * gy / 2;
    const snake = mode === "snake";
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / columns);
      const col = snake && row % 2 === 1 ? columns - 1 - i % columns : i % columns;
      positions[i * 2] = cx + col * gx - offsetX;
      positions[i * 2 + 1] = cy + row * gy - offsetY;
    }
    return { ids, positions };
  }
};

export { GeometricLayout };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map