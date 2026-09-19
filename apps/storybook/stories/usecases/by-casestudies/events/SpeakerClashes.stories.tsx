/**
 * **Programme scheduling — which sessions clash for a speaker we cannot move**
 *
 * *Rosa Iqbal, programme chair.* The schedule is published on Monday. Rosa must
 * answer, and defend to the track leads: **which sessions collide for a speaker
 * we cannot move?** She reschedules exactly one track, and every other lead
 * will argue it should not be theirs.
 *
 * A calendar shows each track cleanly and hides the thing that matters, because
 * the collision is not *within* a track — it is a person standing in two halls
 * at once. Here the session is an `eventCard` carrying its own time and venue,
 * the speaker is an `idCard`, and an edge means *speaks at*:
 *
 * 1. **Two speakers, two sessions each.** Most double-booked speakers are fine
 *    — their sessions sit in different slots.
 * 2. **One is a genuine clash.** Dr Noor Haddad speaks at 14:00 in Hall A *and*
 *    14:00 in Studio 2. Both cards say `14:00`; the shared speaker card between
 *    them is the collision, and it is only visible because the time is on the
 *    card rather than in a tooltip.
 *
 * Hover the speaker to isolate both sessions, or switch **Clashes only** on to
 * drop everything that is not contested. The keynote has no venue or attendance
 * yet, so its card is shorter — absent fields leave no gap.
 */

import { useCallback, useMemo, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ElkLayout, TextResolutionLODBehaviour } from '@invana/canvas-react';
import {
  CanvasMessageBar,
  CanvasSettingsEditorPanel,
  GraphCanvasApp,
  GraphControlsToolbar,
  GraphStatusBar,
  ToolbarItems,
  useSidePanels
} from '@invana/canvas-ui';
import type { CanvasConfig } from '@invana/canvas';
import {
  IDCard,
  eventCard,
  type CompositeShapeOption,
  type EventCardData,
  type GraphCanvas,
  type GraphData,
  type GraphNode,
  type IDCardData
} from '@invana/graph';
import type { ElkDirection } from '@invana/graph-layout-elkjs';
import { CalendarClock, Moon, Settings, Sun } from 'lucide-react';

const meta: Meta = { title: 'usecases/by-casestudies/events/SpeakerClashes' };
export default meta;
type Story = StoryObj;

export const SpeakerClashesStory: Story = {
  name: 'SpeakerClashes',
  render: function Render() {
    const [clashesOnly, setClashesOnly] = useState(false);
    const [direction, setDirection] = useState<ElkDirection>('DOWN');

    const dock = useSidePanels(
      [
        {
          id: 'settings',
          icon: Settings,
          label: 'Settings',
          render: (canvas) => (
            <CanvasSettingsEditorPanel canvas={canvas} className="border-0 bg-transparent shadow-none" />
          )
        },
      ],
      { section: { defaultSize: '360px', maxSize: '460px' } },
    );

    const data: GraphData = useMemo(() => {
      const sessions: GraphNode[] = [
        // ── The clash: both at 14:00, different halls.
        { type: 'session', id: 'se1', data: { title: 'Graph Rendering Deep Dive', day: '14', month: 'Sep', time: '14:00 – 15:30', venue: 'Hall A', attendees: '210 going', accent: 0xf43f5e } satisfies EventCardData },
        { type: 'session', id: 'se2', data: { title: 'Provenance in Retrieval Systems', day: '14', month: 'Sep', time: '14:00 – 15:00', venue: 'Studio 2', attendees: '96 going', accent: 0xf43f5e } satisfies EventCardData },
        // ── Double-booked, but in different slots — not a clash.
        { type: 'session', id: 'se3', data: { title: 'WebGPU Performance Workshop', day: '14', month: 'Sep', time: '09:30 – 12:30', venue: 'Studio 4', attendees: '48 going', accent: 0x0ea5e9 } satisfies EventCardData },
        { type: 'session', id: 'se4', data: { title: 'Layout Algorithms Roundtable', day: '14', month: 'Sep', time: '16:00 – 17:00', venue: 'Hall B', attendees: '42 going', accent: 0x0ea5e9 } satisfies EventCardData },
        { type: 'session', id: 'se5', data: { title: 'Typed Graph Schemas in Practice', day: '15', month: 'Sep', time: '11:00 – 12:00', venue: 'Hall A', attendees: '134 going', accent: 0x22c55e } satisfies EventCardData },
        // Keynote — no venue or attendance confirmed, so the card is shorter.
        { type: 'session', id: 'se6', data: { title: 'Opening Keynote', day: '14', month: 'Sep', accent: 0xa855f7 } satisfies EventCardData },
      ];

      const speakers: GraphNode[] = [
        { type: 'speaker', id: 'sp1', data: { name: 'Dr Noor Haddad', title: 'Keynote + two tracks', idNumber: 'SPK-0042', org: 'Programme', photo: 'lucide/user-round', validUntil: 'Cannot be moved', status: 'active', accent: 0xf43f5e } satisfies IDCardData },
        { type: 'speaker', id: 'sp2', data: { name: 'Marco Bellini', title: 'Workshop lead', idNumber: 'SPK-0118', org: 'Programme', initials: 'MB', validUntil: 'Flexible', status: 'active', accent: 0x0ea5e9 } satisfies IDCardData },
        { type: 'speaker', id: 'sp3', data: { name: 'Hana Sato', title: 'Track speaker', idNumber: 'SPK-0231', org: 'Programme', initials: 'HS', validUntil: 'Flexible', status: 'active', accent: 0x22c55e } satisfies IDCardData },
      ];

      const speaksAt = [
        { id: 'k1', source: 'sp1', target: 'se6' },
        { id: 'k2', source: 'sp1', target: 'se1' },
        { id: 'k3', source: 'sp1', target: 'se2' },
        { id: 'k4', source: 'sp2', target: 'se3' },
        { id: 'k5', source: 'sp2', target: 'se4' },
        { id: 'k6', source: 'sp3', target: 'se5' },
      ];

      // Focus: the contested pair and the speaker who cannot be in both.
      const clashIds = new Set(['sp1', 'se1', 'se2']);
      const nodes = clashesOnly
        ? [...sessions, ...speakers].filter((n) => clashIds.has(n.id))
        : [...sessions, ...speakers];
      const keptIds = new Set(nodes.map((n) => n.id));
      const edges = speaksAt.filter((e) => keptIds.has(e.source) && keptIds.has(e.target));

      return { nodes, edges: edges.map((e) => ({ type: 'edge', ...e })) };
    }, [clashesOnly]);

    // Squared-off chips: `chipRadius` is an ordinary spec field, so the
    // cards restyle without subclassing. Memoised because a card instance is
    // stateless and reusable — rebuilding it each render would churn `cardOf`,
    // and with it the whole canvas `config`.
    const badge = useMemo(() => new IDCard({ chipRadius: 1 }), []);

    const cardOf = useCallback(
      (n: GraphNode): CompositeShapeOption =>
        n.type === 'speaker' ? badge.build(n.data as IDCardData) : eventCard(n.data as EventCardData),
      [badge],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        activeLayout: 'elk',
        behaviours: {
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              style: { shape: cardOf, bgStrokeWidth: 0 },
              state: {
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.2 }
              }
            },
            edge: {
              style: { shape: { pathType: 'orth' }, strokeColor: 0x94a3b8, strokeWidth: 1.2, strokeAlpha: 0.35, arrowTargetShape: 'none' },
              state: {
                highlighted: { strokeColor: 0xfbbf24, strokeWidth: 2, strokeAlpha: 0.95 },
                dimmed: { strokeAlpha: 0.04 }
              }
            }
          }
        },
        layouts: { elk: { algorithm: 'layered', direction, nodeSpacing: 36, layerSpacing: 100, edgeNodeSpacing: 24 } }
      }),
      [cardOf, direction],
    );

    const onReady = useCallback((c: GraphCanvas | null) => {
      c?.showMessage('Which sessions collide for a speaker we cannot move?');
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Programme scheduling — speaker clashes',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'toggle',
                  key: 'clashes',
                  icon: CalendarClock,
                  label: 'Clashes only: off',
                  activeLabel: 'Clashes only: on',
                  active: clashesOnly,
                  onToggle: () => setClashesOnly((v) => !v)
                },
                {
                  type: 'select',
                  key: 'direction',
                  label: 'Direction',
                  value: direction,
                  options: { DOWN: 'Down', RIGHT: 'Right', UP: 'Up', LEFT: 'Left' },
                  onChange: (v) => setDirection(v as ElkDirection)
                },
                ...dock.items,
                {
                  type: 'toggle',
                  key: 'theme',
                  icon: Sun,
                  activeIcon: Moon,
                  label: 'Switch to dark theme',
                  activeLabel: 'Switch to light theme',
                  active: ctx.themeKind === 'dark',
                  onToggle: ctx.toggleTheme
                },
              ]}
            />
          )
        }}
        footer={{ left: <GraphStatusBar />, right: <CanvasMessageBar /> }}
        right={dock.region}
      >
        <ElkLayout
          id="elk"
          targetLayerId="graph"
          fitPadding={80}
          options={{ nodeSize: (n) => { const c = cardOf(n); return { width: c.width, height: c.height }; } }}
        />

        {/* These cards are dense with small text, so keep it crisp as the
            camera zooms rather than letting it resolve to mush. */}
        <TextResolutionLODBehaviour />
      </GraphCanvasApp>
    );
  }
};
