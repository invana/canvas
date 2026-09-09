# Interface: CreateNodeOptions

The serialisable subset of `CreateNodeBehaviourOptions` this editor produces.

`CreateNodeBehaviour` exposes no user-tunable scalars: its only options are
the `createNode` / `onNodeCreate` **callbacks** (out of scope — not
serialisable) plus the base `targetLayerId` / `enabled` / `shortcuts` (owned
by the host). So this patch is empty. The editor exists for parity (root
`CLAUDE.md` rule 12 — every behaviour ships an editor) and as the seam where a
future scalar option (e.g. a default node `type`) would land.
