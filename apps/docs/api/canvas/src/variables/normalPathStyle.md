# Variable: normalPathStyle

> `const` **normalPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [packages/canvas/src/primitives/connectors/pathStyles/normal.ts:11](https://github.com/invana/canvas/blob/12871cd6263f61ab8408b5f91b592d2e697cc6ce/packages/canvas/src/primitives/connectors/pathStyles/normal.ts#L11)

Sharp segments. Walks the polyline emitting `M` then `L L L …`.

For a 2-point polyline, this is `[M source, L target]` — equivalent to
the straight-line baseline. For an N-point polyline (router-produced
bends), this draws straight segments between every consecutive pair with
no corner treatment.
