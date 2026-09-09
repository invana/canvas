# Variable: CANVAS\_STATE\_VERSION

> `const` **CANVAS\_STATE\_VERSION**: `1`

Schema version stamped onto every [CanvasStateSnapshot](../interfaces/CanvasStateSnapshot.md). Bump when the
envelope shape changes so importers can detect (and refuse / migrate)
incompatible files. Layer *data* payloads are versioned by their own layer.
