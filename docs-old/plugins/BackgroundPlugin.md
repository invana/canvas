



```typescript
const canvas = new Canvas({ container });
await canvas.init();

const bgPlugin = new BackgroundPlugin();
canvas.registerPlugin(bgPlugin);

// Set background
bgPlugin.setOptions({
  type: 'pattern',
  patternType: 'dots',
  color: '#cccccc',
  backgroundColor: '#ffffff',
  size: 2,
  spacing: 20
});
 ```