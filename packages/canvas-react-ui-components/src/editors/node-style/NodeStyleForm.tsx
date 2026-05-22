import { Tabs, TabsContent, TabsList, TabsTrigger } from '@invana/ui';

import { BackgroundSection } from './sections/BackgroundSection';
import { GeometrySection } from './sections/GeometrySection';
import { LabelSection } from './sections/LabelSection';
import { StrokeSection } from './sections/StrokeSection';
import { NODE_STYLE_SECTIONS, type NodeStyleFormValue, type NodeStyleSectionId } from './types';

export interface NodeStyleFormProps {
  value: NodeStyleFormValue;
  onChange: (next: NodeStyleFormValue) => void;
  /** Section to open initially. Default `'geometry'`. */
  defaultSection?: NodeStyleSectionId;
}

/**
 * Controlled, engine-unaware NodeStyle form. Renders the four-tab editor
 * and emits the next value on every field change — host is responsible for
 * deciding when (or whether) to commit those values to the engine.
 *
 * Use this directly when:
 * - the form host lives outside any `<Canvas>` tree,
 * - custom commit logic is needed (undo stack, multi-canvas mirror, etc.),
 * - styles are being previewed without a live engine.
 *
 * For the standard "Apply / Reset against the surrounding canvas" UX, use
 * {@link NodeStyleEditor} instead.
 */
export function NodeStyleForm({ value, onChange, defaultSection = 'geometry' }: NodeStyleFormProps) {
  return (
    <Tabs defaultValue={defaultSection}>
      <TabsList>
        {NODE_STYLE_SECTIONS.map((section) => (
          <TabsTrigger key={section.id} value={section.id}>
            {section.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="geometry">
        <GeometrySection value={value} onChange={onChange} />
      </TabsContent>
      <TabsContent value="background">
        <BackgroundSection value={value} onChange={onChange} />
      </TabsContent>
      <TabsContent value="stroke">
        <StrokeSection value={value} onChange={onChange} />
      </TabsContent>
      <TabsContent value="label">
        <LabelSection value={value} onChange={onChange} />
      </TabsContent>
    </Tabs>
  );
}
