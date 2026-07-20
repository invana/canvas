import type { ReactNode } from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@invana/ui';

export interface AdvancedSectionProps {
  /** Disclosure header. Default `'Advanced settings'`. */
  title?: string;
  /**
   * Start expanded. Default `false` — the whole point is to keep the full field
   * set out of the way until the user opts in.
   */
  defaultOpen?: boolean;
  /** The advanced content revealed when the section is expanded. */
  children: ReactNode;
}

/**
 * A single, **collapsed-by-default** disclosure that hides the full ("advanced")
 * field set of an editor behind an opt-in header, so the editor can lead with a
 * small Basics tier. Presentational chrome only — it renders an `@invana/ui`
 * `Accordion` and takes no form/engine state; the advanced controls are passed
 * as `children`.
 *
 * Used by the node-style editors ({@link SimpleNodeStyleEditor} /
 * {@link CompositeNodeStyleEditor}) to gate everything beyond colour / shape /
 * size. `type="single"` + `collapsible` so it toggles open/closed on its own.
 */
export function AdvancedSection({
  title = 'Advanced settings',
  defaultOpen = false,
  children,
}: AdvancedSectionProps) {
  return (
    <Accordion type="single" collapsible defaultValue={defaultOpen ? 'advanced' : undefined}>
      <AccordionItem value="advanced" className="border-b-0">
        <AccordionTrigger className="py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground hover:no-underline">
          {title}
        </AccordionTrigger>
        <AccordionContent className="p-0">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
