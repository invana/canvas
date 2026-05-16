# CLAUDE.md — packages/graph-datasets (`@invana/graph-datasets`)

Example graph datasets used by storybook stories and tests.

**Status:** skeleton. Datasets shipped: Les Misérables, random tree, Flare hierarchy. To port: Scientists org chart.

The Flare hierarchy is the canonical d3-hierarchy fixture (`d3/d3-hierarchy/test/data/flare.json`). Nested form lives in `flare.json`; the convenience flattener `flareAsGraph()` produces `{nodes, edges}` ready for `GraphLayer.setData`, with slash-joined-path ids and parent→child edges.
