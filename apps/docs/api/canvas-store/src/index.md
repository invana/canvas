# canvas-store/src

## Classes

- [HitIndex](classes/HitIndex.md)
- [LayerData](classes/LayerData.md)
- [PickingIndex](classes/PickingIndex.md)

## Interfaces

- [AnnotationRecord](interfaces/AnnotationRecord.md)
- [CanvasSceneOptions](interfaces/CanvasSceneOptions.md)
- [CanvasStore](interfaces/CanvasStore.md)
- [CanvasTelemetryConfig](interfaces/CanvasTelemetryConfig.md)
- [CollectedSpan](interfaces/CollectedSpan.md)
- [ConnectorHitRecord](interfaces/ConnectorHitRecord.md)
- [Counter](interfaces/Counter.md)
- [CreateCanvasStoreOptions](interfaces/CreateCanvasStoreOptions.md)
- [EdgeRecord](interfaces/EdgeRecord.md)
- [FrameMetricsOptions](interfaces/FrameMetricsOptions.md)
- [FrameStats](interfaces/FrameStats.md)
- [FrameTick](interfaces/FrameTick.md)
- [GraphInput](interfaces/GraphInput.md)
- [GroupRecord](interfaces/GroupRecord.md)
- [Histogram](interfaces/Histogram.md)
- [History](interfaces/History.md)
- [HitEntry](interfaces/HitEntry.md)
- [HitGeometrySource](interfaces/HitGeometrySource.md)
- [HttpMeterOptions](interfaces/HttpMeterOptions.md)
- [HttpMetricRecord](interfaces/HttpMetricRecord.md)
- [IntentLogEntry](interfaces/IntentLogEntry.md)
- [InteractionTracerOptions](interfaces/InteractionTracerOptions.md)
- [Logger](interfaces/Logger.md)
- [LogRecord](interfaces/LogRecord.md)
- [Meter](interfaces/Meter.md)
- [NodeRecord](interfaces/NodeRecord.md)
- [Patch](interfaces/Patch.md)
- [PickingCamera](interfaces/PickingCamera.md)
- [PickingIndexOptions](interfaces/PickingIndexOptions.md)
- [RendererInitOptions](interfaces/RendererInitOptions.md)
- [ShapeHitRecord](interfaces/ShapeHitRecord.md)
- [StateCell](interfaces/StateCell.md)
- [TelemetryEvent](interfaces/TelemetryEvent.md)
- [TelemetrySink](interfaces/TelemetrySink.md)
- [TelemetryTarget](interfaces/TelemetryTarget.md)
- [Tracer](interfaces/Tracer.md)
- [TraceSpan](interfaces/TraceSpan.md)

## Type Aliases

- [CanvasActions](type-aliases/CanvasActions.md)
- [CanvasStoreObserver](type-aliases/CanvasStoreObserver.md)
- [FramePhase](type-aliases/FramePhase.md)
- [FramePhaseTimings](type-aliases/FramePhaseTimings.md)
- [HitPolyline](type-aliases/HitPolyline.md)
- [InteractionKind](type-aliases/InteractionKind.md)
- [LogAttributes](type-aliases/LogAttributes.md)
- [LogLevel](type-aliases/LogLevel.md)
- [MetricAttributes](type-aliases/MetricAttributes.md)
- [PosSchema](type-aliases/PosSchema.md)
- [QueryStatus](type-aliases/QueryStatus.md)
- [RendererBackend](type-aliases/RendererBackend.md)
- [SpanAttributes](type-aliases/SpanAttributes.md)
- [SpanAttrValue](type-aliases/SpanAttrValue.md)

## Variables

- [CANVAS\_SOURCE](variables/CANVAS_SOURCE.md)
- [NODE\_FLAG](variables/NODE_FLAG.md)
- [NoopSink](variables/NoopSink.md)

## Functions

- [applyDeepPartial](functions/applyDeepPartial.md)
- [changedPaths](functions/changedPaths.md)
- [computeChange](functions/computeChange.md)
- [connectorHitBoxes](functions/connectorHitBoxes.md)
- [createActions](functions/createActions.md)
- [createCanvasStore](functions/createCanvasStore.md)
- [createCollectorLogger](functions/createCollectorLogger.md)
- [createCollectorTracer](functions/createCollectorTracer.md)
- [createConsoleLogger](functions/createConsoleLogger.md)
- [createConsoleMeter](functions/createConsoleMeter.md)
- [createConsoleTracer](functions/createConsoleTracer.md)
- [createFrameMetrics](functions/createFrameMetrics.md)
- [createHistory](functions/createHistory.md)
- [createHttpMeter](functions/createHttpMeter.md)
- [createInteractionTracer](functions/createInteractionTracer.md)
- [createLogBridge](functions/createLogBridge.md)
- [createMemoryStore](functions/createMemoryStore.md)
- [createReactiveStore](functions/createReactiveStore.md)
- [createStoreFromCell](functions/createStoreFromCell.md)
- [createTapTracer](functions/createTapTracer.md)
- [createTracingSink](functions/createTracingSink.md)
- [defaultCanvasView](functions/defaultCanvasView.md)
- [onCanvasStoreCreated](functions/onCanvasStoreCreated.md)
- [scheduleFlush](functions/scheduleFlush.md)
- [tapAttributes](functions/tapAttributes.md)
- [traceActions](functions/traceActions.md)
- [wireTelemetry](functions/wireTelemetry.md)
- [withTelemetry](functions/withTelemetry.md)

## References

### CameraTransform

Re-exports [CameraTransform](../../canvas/src/type-aliases/CameraTransform.md)

***

### CanvasEvent

Re-exports [CanvasEvent](../../canvas/src/interfaces/CanvasEvent.md)

***

### CanvasEventBus

Re-exports [CanvasEventBus](../../canvas/src/classes/CanvasEventBus.md)

***

### CanvasGlobalEvents

Re-exports [CanvasGlobalEvents](../../canvas/src/interfaces/CanvasGlobalEvents.md)

***

### CanvasThemeState

Re-exports [CanvasThemeState](../../canvas/src/classes/CanvasThemeState.md)

***

### CanvasView

Re-exports [CanvasView](../../canvas/src/interfaces/CanvasView.md)

***

### ColumnArray

Re-exports [ColumnArray](../../canvas/src/type-aliases/ColumnArray.md)

***

### ColumnSchema

Re-exports [ColumnSchema](../../canvas/src/type-aliases/ColumnSchema.md)

***

### ColumnStore

Re-exports [ColumnStore](../../canvas/src/classes/ColumnStore.md)

***

### ColumnStoreOptions

Re-exports [ColumnStoreOptions](../../canvas/src/interfaces/ColumnStoreOptions.md)

***

### ColumnType

Re-exports [ColumnType](../../canvas/src/type-aliases/ColumnType.md)

***

### ColumnValue

Re-exports [ColumnValue](../../canvas/src/type-aliases/ColumnValue.md)

***

### DataSource

Re-exports [DataSource](../../canvas/src/interfaces/DataSource.md)

***

### DeepPartial

Re-exports [DeepPartial](../../canvas/src/type-aliases/DeepPartial.md)

***

### defaultEqual

Re-exports [defaultEqual](../../canvas/src/functions/defaultEqual.md)

***

### DirtyBatcher

Re-exports [DirtyBatcher](../../canvas/src/classes/DirtyBatcher.md)

***

### DirtySnapshot

Re-exports [DirtySnapshot](../../canvas/src/interfaces/DirtySnapshot.md)

***

### EventEmitter

Re-exports [EventEmitter](../../canvas/src/classes/EventEmitter.md)

***

### EventMap

Re-exports [EventMap](../../canvas/src/type-aliases/EventMap.md)

***

### EventSource

Re-exports [EventSource](../../canvas/src/interfaces/EventSource.md)

***

### EventSourceKind

Re-exports [EventSourceKind](../../canvas/src/type-aliases/EventSourceKind.md)

***

### FlushMode

Re-exports [FlushMode](../../canvas/src/type-aliases/FlushMode.md)

***

### KindDelta

Re-exports [KindDelta](../../canvas/src/interfaces/KindDelta.md)

***

### LayerFlush

Re-exports [LayerFlush](../../canvas/src/interfaces/LayerFlush.md)

***

### Listener

Re-exports [Listener](../../canvas/src/type-aliases/Listener.md)

***

### NodeDelta

Re-exports [NodeDelta](../../canvas/src/interfaces/NodeDelta.md)

***

### ReactiveStore

Re-exports [ReactiveStore](../../canvas/src/interfaces/ReactiveStore.md)

***

### Recipe

Re-exports [Recipe](../../canvas/src/type-aliases/Recipe.md)

***

### ResolvedTheme

Re-exports [ResolvedTheme](../../canvas/src/interfaces/ResolvedTheme.md)

***

### RowOf

Re-exports [RowOf](../../canvas/src/type-aliases/RowOf.md)

***

### select

Re-exports [select](../../canvas/src/functions/select.md)

***

### Selected

Re-exports [Selected](../../canvas/src/interfaces/Selected.md)

***

### shallowEqual

Re-exports [shallowEqual](../../canvas/src/functions/shallowEqual.md)

***

### SourceEmitter

Re-exports [SourceEmitter](../../canvas/src/classes/SourceEmitter.md)

***

### StoreChange

Re-exports [StoreChange](../../canvas/src/interfaces/StoreChange.md)

***

### Tap

Re-exports [Tap](../../canvas/src/type-aliases/Tap.md)

***

### TapOptions

Re-exports [TapOptions](../../canvas/src/interfaces/TapOptions.md)

***

### ThemeKind

Re-exports [ThemeKind](../../canvas/src/type-aliases/ThemeKind.md)

***

### ThemeMode

Re-exports [ThemeMode](../../canvas/src/type-aliases/ThemeMode.md)

***

### ThemeState

Re-exports [ThemeState](../../canvas/src/interfaces/ThemeState.md)

***

### Update

Re-exports [Update](../../canvas/src/type-aliases/Update.md)
