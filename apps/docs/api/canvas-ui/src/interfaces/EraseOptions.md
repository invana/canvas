# Interface: EraseOptions

The serialisable subset of `EraseBehaviourOptions` this editor produces. The
`onErase` **callback** and the base `targetLayerId` / `enabled` / `shortcuts`
are out of scope; only the `target` enum round-trips.

## Properties

### target?

> `optional` **target?**: `EraseTargetKind`
