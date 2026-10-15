/**
 * **Counterparty onboarding — who controls this entity, and who may sign for it**
 *
 * *Priya Raghavan, counterparty onboarding, Meridian Bank.* A trading desk wants
 * to clear through **Halcyon Trading Ltd** by Friday. Priya must answer one
 * question and defend the answer to Financial Crime: **who ultimately controls
 * Halcyon, and is the person authorised to sign for it authorised *today*?** She
 * either clears the counterparty or escalates it to enhanced due diligence.
 *
 * The picture is an ownership chain of `organisationCard` legal entities with
 * the `idCard` signatory attached to each. Two things the ranked onboarding
 * queue cannot show her, and this frame can:
 *
 * 1. **Control is two hops up and offshore.** Halcyon's immediate parent is
 *    Dutch; the *ultimate* parent is a Luxembourg nominee company. A one-hop
 *    "parent" field would have stopped at Amsterdam.
 * 2. **One signatory's badge is expired.** The mandate on the intermediate
 *    entity is held by a signatory whose authorisation lapsed — visible as the
 *    ID card's `expired` status pill, not buried in an attribute table.
 *
 * Together those are the escalation. Toggle **Signatories** off to see the bare
 * ownership chain, and back on to see who signs each link.
 *
 * The cards **auto-size**, and ELK is fed each node's real box through
 * `nodeSize`, so entities with more detail reserve more room instead of
 * overlapping.
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
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
  OrganisationCard,
  TextResolutionLODBehaviour,
  type CompositeShapeOption,
  type GraphCanvas,
  type GraphData,
  type GraphNode,
  type IDCardData,
  type OrganisationCardData
} from '@invana/graph';
import { ElkLayout, type ElkDirection } from '@invana/graph-layout-elkjs';
import { Moon, Settings, Sun, UserCheck } from 'lucide-react';

const meta: Meta = { title: 'canvas-demos/by-casestudies/org-directory/OwnershipChain' };
export default meta;
type Story = StoryObj;

export const OwnershipChainStory: Story = {
  name: 'OwnershipChain',
  render: function Render() {
    const [showSignatories, setShowSignatories] = useState(true);
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

    // ── The chain. `entity` nodes are legal entities, `signatory` nodes are
    //    the people holding the mandate on them.
    const data: GraphData = useMemo(() => {
      const entities: GraphNode[] = [
        { type: 'entity', id: 'lux', data: { name: 'Meridian Nominees SA', kind: 'Nominee company', logo: 'lucide/landmark', location: 'Luxembourg City, LU', headcount: '4 staff', founded: 'est. 2019', accent: 0xf43f5e } satisfies OrganisationCardData },
        { type: 'entity', id: 'bv', data: { name: 'Halcyon Holdings BV', kind: 'Holding company', logo: 'lucide/building-2', location: 'Amsterdam, NL', headcount: '11 staff', founded: 'est. 2016', accent: 0xf59e0b } satisfies OrganisationCardData },
        { type: 'entity', id: 'ltd', data: { name: 'Halcyon Trading Ltd', kind: 'Counterparty', logo: 'lucide/line-chart', location: 'London, UK', headcount: '86 staff', founded: 'est. 2014', accent: 0x0ea5e9 } satisfies OrganisationCardData },
        // A sibling that looks like the same risk and isn't — it is wholly
        // domestic, and its mandate is current.
        { type: 'entity', id: 'sib', data: { name: 'Halcyon Research Ltd', kind: 'Sibling subsidiary', logo: 'lucide/flask-conical', location: 'Leeds, UK', headcount: '23 staff', accent: 0x22c55e } satisfies OrganisationCardData },
      ];

      const signatories: GraphNode[] = [
        { type: 'signatory', id: 's-lux', data: { name: 'Ingrid Voss', title: 'Director, nominee', idNumber: 'MANDATE LU-0041', org: 'Meridian Nominees SA', initials: 'IV', validUntil: 'Valid until 2028-03-31', status: 'active', accent: 0xf43f5e } satisfies IDCardData },
        // ── The finding: the mandate on the intermediate entity has lapsed.
        { type: 'signatory', id: 's-bv', data: { name: 'Pieter de Vries', title: 'Authorised signatory', idNumber: 'MANDATE NL-1180', org: 'Halcyon Holdings BV', initials: 'PV', validUntil: 'Lapsed 2026-04-30', status: 'expired', accent: 0xf59e0b } satisfies IDCardData },
        { type: 'signatory', id: 's-ltd', data: { name: 'Amara Okafor', title: 'Head of Treasury', idNumber: 'MANDATE UK-7734', org: 'Halcyon Trading Ltd', photo: 'lucide/user-round', validUntil: 'Valid until 2027-09-30', status: 'active', accent: 0x0ea5e9 } satisfies IDCardData },
        { type: 'signatory', id: 's-sib', data: { name: 'Tom Whitfield', title: 'Company secretary', idNumber: 'MANDATE UK-7735', org: 'Halcyon Research Ltd', initials: 'TW', validUntil: 'Valid until 2027-11-30', status: 'active', accent: 0x22c55e } satisfies IDCardData },
      ];

      const ownership = [
        { id: 'o1', source: 'lux', target: 'bv' },
        { id: 'o2', source: 'bv', target: 'ltd' },
        { id: 'o3', source: 'bv', target: 'sib' },
      ];
      const mandates = [
        { id: 'm1', source: 'lux', target: 's-lux' },
        { id: 'm2', source: 'bv', target: 's-bv' },
        { id: 'm3', source: 'ltd', target: 's-ltd' },
        { id: 'm4', source: 'sib', target: 's-sib' },
      ];

      return {
        nodes: showSignatories ? [...entities, ...signatories] : entities,
        edges: (showSignatories ? [...ownership, ...mandates] : ownership).map((e) => ({ type: 'edge', ...e })),
      };
    }, [showSignatories]);

    // Squared-off chips: `chipRadius` is an ordinary spec field, so the
    // cards restyle without subclassing. Memoised because a card instance is
    // stateless and reusable — rebuilding it each render would churn `cardOf`,
    // and with it the whole canvas `config`.
    const badge = useMemo(() => new IDCard({ chipRadius: 1 }), []);
    const org = useMemo(() => new OrganisationCard({ chipRadius: 1 }), []);

    // One builder per node type — the card turns the node's data into geometry.
    const cardOf = useCallback(
      (n: GraphNode): CompositeShapeOption =>
        n.type === 'signatory' ? badge.build(n.data as IDCardData) : org.build(n.data as OrganisationCardData),
      [badge, org],
    );

    const config: CanvasConfig = useMemo(
      () => ({
        activeLayout: 'elk',
        behaviours: {
          // Each card paints itself from its own data — nothing else may recolour it.
          color: { enabled: false },
          hover: { enabled: true, state: 'highlighted', degree: 1, direction: 'both' },
          'click-select': { enabled: true, multiple: true, trigger: ['shift'] },
          // These cards are dense with small text, so keep it crisp as the
          // camera zooms rather than letting it resolve to mush.
          'label-lod': { enabled: true }
        },
        layers: {
          background: { type: 'pattern', patternType: 'dots', size: 1.2, spacing: 26, alpha: 0.7 },
          graph: {
            node: {
              // The card is the whole node visual, so `bgFill` / `bgStrokeColor`
              // stay unset — setting them would override the card's own paint.
              style: { shape: cardOf, bgStrokeWidth: 0 },
              state: {
                highlighted: { bgStrokeColor: 0xfbbf24, bgStrokeWidth: 3 },
                selected: { bgStrokeColor: 0xffffff, bgStrokeWidth: 3 },
                dimmed: { bgAlpha: 0.25 }
              }
            },
            edge: {
              style: { shape: { pathType: 'orth' }, strokeColor: 0x94a3b8, strokeWidth: 1.2, strokeAlpha: 0.4, arrowTargetShape: 'triangle', arrowTargetSize: 6, arrowTargetColor: 0x94a3b8 },
              state: {
                highlighted: { strokeColor: 0xfbbf24, strokeWidth: 2, strokeAlpha: 0.95, arrowTargetColor: 0xfbbf24 },
                dimmed: { strokeAlpha: 0.05 }
              }
            }
          }
        },
        layouts: { elk: { algorithm: 'layered', direction, nodeSpacing: 40, layerSpacing: 90, edgeNodeSpacing: 24 } }
      }),
      [cardOf, direction],
    );

    // `onReady` must be stable — a second registration of the same id throws — so
    // it reads the current config and card builder through refs. Later `config`
    // changes (the direction picker) reach the registered instances through the app.
    const configRef = useRef(config);
    configRef.current = config;
    const cardOfRef = useRef(cardOf);
    cardOfRef.current = cardOf;

    // The app bundle has no ELK or label-resolution, so register them here by id;
    // all their settings come from `config`.
    const onReady = useCallback((c: GraphCanvas | null) => {
      if (!c) return;
      c.layouts.add(
        new ElkLayout({
          id: 'elk',
          targetLayerId: 'graph',
          // The cards auto-size from their data, so ELK is told each node's real
          // box. A function, so it can't ride `config` — it stays on the constructor.
          nodeSize: (n) => { const card = cardOfRef.current(n); return { width: card.width, height: card.height }; }
        }),
      );
      c.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-lod', targetLayerId: 'graph' }));
      // Config only reaches instances registered when it is applied — re-apply for these.
      const current = configRef.current;
      c.update({
        layouts: { elk: current.layouts!.elk! },
        behaviours: { 'label-lod': current.behaviours!['label-lod']! },
        activeLayout: current.activeLayout
      });
      c.showMessage('Who controls Halcyon Trading, and is its signatory authorised today?');
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{
          title: 'Counterparty onboarding — Halcyon Trading Ltd',
          center: <GraphControlsToolbar />,
          right: (ctx) => (
            <ToolbarItems
              orientation="horizontal"
              items={[
                {
                  type: 'toggle',
                  key: 'signatories',
                  icon: UserCheck,
                  label: 'Signatories: off',
                  activeLabel: 'Signatories: on',
                  active: showSignatories,
                  onToggle: () => setShowSignatories((v) => !v)
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
      />
    );
  }
};
