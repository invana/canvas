# Variable: normalPathStyle

> `const` **normalPathStyle**: [`IPathStyle`](../type-aliases/IPathStyle.md)

Defined in: [canvas/src/primitives/connectors/pathStyles/normal.ts:11](https://github.com/invana/canvas/blob/8a2273fc60ebddbecf4b072783e05574468bb05a/packages/canvas/src/primitives/connectors/pathStyles/normal.ts#L11)

Sharp segments. Walks the polyline emitting `M` then `L L L …`.

For a 2-point polyline, this is `[M source, L target]` — equivalent to
the straight-line baseline. For an N-point polyline (router-produced
bends), this draws straight segments between every consecutive pair with
no corner treatment.
