# CLAUDE.md — packages/graph-layout-elkjs (`@invana/graph-layout-elkjs`)

ELK.js `Layout` for `@invana/graph`. Replaces the old `@invana/plugin-layouts-elkjs` (now `*-deprecated`).

**Status:** skeleton.

```ts
const layout = new ElkLayout({ algorithm: 'layered' });
await layout.apply(graphLayer);
```

ELK is one-shot — no tick simulation. Single `apply()` call.
