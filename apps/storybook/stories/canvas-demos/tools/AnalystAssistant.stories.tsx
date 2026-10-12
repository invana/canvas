import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  BackgroundLayer,
  DragPanBehaviour,
  WheelZoomBehaviour,
  type CanvasConfig,
  type PlaybookSpec,
  type StepSpec
} from '@invana/canvas';
import {
  ClickSelectBehaviour,
  DragNodeBehaviour,
  FocusBehaviour,
  GraphCanvas,
  GraphLayer,
  TextResolutionLODBehaviour,
  ThemeBehaviour,
  type GraphEdge
} from '@invana/graph';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { ElkLayout } from '@invana/graph-layout-elkjs';
import { BubbleSetsLayer } from '@invana/graph-layer-bubble-sets';
import { PlaybookPresenterBar } from '@invana/canvas-ui';
import {
  Badge,
  Button,
  ChatSession,
  ChatSessionComposer,
  ChatSessionDisclosure,
  ChatSessionMessage
} from '@invana/ui';
import { ArrowUp, Pause, Play, RotateCcw } from 'lucide-react';

const meta: Meta = {
  title: 'canvas-demos/tools/AnalystAssistant',
  parameters: { layout: 'fullscreen' }
};
export default meta;
type Story = StoryObj;

/**
 * **An assistant walks an analyst through a case — the canvas is the evidence,
 * the chat is the reasoning.** A structuring alert on `ACC-4471` is played as a
 * seven-step playbook: the alert, follow the money, shared devices, the wider
 * network, who owns the business, trace to a person, and the loop closing back
 * on the transfer network. Fictional data.
 *
 * Everything the canvas does is the engine's own, driven by plain JSON steps
 * (`canvas.playbook`):
 *
 * - **Data arrives as deltas** (`data.added` / `data.hidden` / `data.shown`), one
 *   history entry per step, so ◀ takes a step back exactly.
 * - **Two layouts, one layer, no coordinates.** The transfer network is laid out
 *   by `ElkLayout` (layered, left → right), so the money's direction *is* the
 *   layout: payers → ACC-4471 → recipients → collector → off-ramp. Edges point
 *   the way that reading needs (a login runs account → device, a cash-out
 *   customer hangs off the exchange). `elk.layered.considerModelOrder` keeps the
 *   recipients in arrival order as later steps add nodes. A step's
 *   `settings.activeLayout` swaps to `D3HierarchyLayout` (horizontal tidy tree)
 *   for the ownership chain; the "scene switch" is just `data.hidden` /
 *   `data.shown` — recorded, so it undoes.
 * - **Focus + camera** are `view.focus` + `camera: 'focus' | 'all'`, framed by
 *   `FocusBehaviour` after the layout settles (`frameDurationMs` raised to 1.1 s).
 * - **Per-type look** is template data: `nodeStructureTemplates` /
 *   `nodeStylingTemplates` / `nodeTypes`, incl. a `freeform` two-line card for
 *   the ownership tree. The ring hull is a `BubbleSetsLayer`.
 *
 * What the engine does **not** have yet, done here in story code — each is a
 * candidate for an RFC rather than a pattern to copy:
 *
 * - **One-time entrance.** A `new` state (layer `node.state` / `edge.state`
 *   catalogue: `pulse-ring` + `fade-in`, `reveal-connector`) is switched on for
 *   the nodes and edges a step adds and off after 2 s. No decoration or effect
 *   has a built-in lifetime.
 * - **Glide out of the parent.** A new node is placed on its anchor before the
 *   one-shot layout runs, so the layout glides it out instead of snapping.
 * - **Money trace.** A `fly-marker-connector` on a `trace` edge state, staged hop
 *   by hop with timers (`meta.trace`).
 * - **Explainer notes.** Not an engine concept: HTML cards over the canvas,
 *   positioned with `camera.toScreen`, text carried in the step's `meta`
 *   (which the canvas never reads). The chat reply rides in `meta` too.
 * - **Edge look per type.** There is no edge-type template registry, so edge
 *   presentation is the one place this story uses resolvers (`edge.style`).
 *
 * Interaction: pick a suggested question, type your own (any text plays the next
 * step), click a node to ask about it, ◀ / ▶ on the presenter bar, or Auto-play.
 */
export const AnalystAssistantStory: Story = {
  name: 'AnalystAssistant',
  render: function AnalystAssistantRender() {
    // ─── The case: palette and the playbook ─────────────────────
    const story = useMemo(() => {
      // Colours that carry meaning (entity kinds, the flag, "just arrived").
      // Everything else — labels, card chrome, edges — comes from the theme.
      const C = {
        account: 0x4f7fd9,
        device: 0xce8509,
        offramp: 0x8b5cf6,
        person: 0xe0703c,
        company: 0x1da54f,
        flag: 0xe05252,
        halo: 0x22b8d6
      };

      const ring = ['A0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C', 'D1', 'D2'];
      /** Every transfer-network node before the loop closes — hidden while the tree is up. */
      const network = [
        'A0', 'I1', 'I2', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C', 'X', 'D1', 'D2',
        'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15',
        'R0', 'R1', 'R2', 'R3', 'R4', 'R5'
      ];
      const tree = ['R', 'B', 'TL', 'F', 'CV', 'EP', 'P', 'O', 'MH', 'IV'];

      const playbook: PlaybookSpec<CanvasConfig> = {
        version: 1,
        title: 'Who is moving money through ACC-4471?',
        source: 'graph',
        steps: [
          {
            id: 'alert',
            title: 'The alert',
            narration: 'ACC-4471 and everyone it paid or was paid by.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'A0', type: 'flagged', data: { label: 'ACC-4471', holder: 'Halvard Trading Ltd', opened: '2024-03-11', alert: 'TX-STRUCT-07' } },
                  { id: 'I1', type: 'payer', data: { label: 'Lindqvist GmbH', paid: '€61,200', country: 'DE' } },
                  { id: 'I2', type: 'payer', data: { label: 'Arcadia Retail', paid: '€38,900', country: 'NL' } },
                  { id: 'M1', type: 'account', data: { label: 'ACC-2207', holder: 'Private individual', opened: '14 days ago', received: '€9,480' } },
                  { id: 'M2', type: 'account', data: { label: 'ACC-3318', holder: 'Private individual', opened: '21 days ago', received: '€9,950' } },
                  { id: 'M3', type: 'account', data: { label: 'ACC-5530', holder: 'Private individual', opened: '28 days ago', received: '€9,720' } },
                  { id: 'M4', type: 'account', data: { label: 'ACC-6129', holder: 'Private individual', opened: '35 days ago', received: '€9,610' } },
                  { id: 'M5', type: 'account', data: { label: 'ACC-7741', holder: 'Private individual', opened: '42 days ago', received: '€9,890' } },
                  { id: 'M6', type: 'account', data: { label: 'ACC-8053', holder: 'Private individual', opened: '49 days ago', received: '€9,650' } }
                ],
                edges: [
                  { id: 'i:I1', source: 'I1', target: 'A0', type: 'inbound', data: { label: '€61,200' } },
                  { id: 'i:I2', source: 'I2', target: 'A0', type: 'inbound', data: { label: '€38,900' } },
                  { id: 't:M1', source: 'A0', target: 'M1', type: 'transfer', data: { label: '€9,480' } },
                  { id: 't:M2', source: 'A0', target: 'M2', type: 'transfer', data: { label: '€9,950' } },
                  { id: 't:M3', source: 'A0', target: 'M3', type: 'transfer', data: { label: '€9,720' } },
                  { id: 't:M4', source: 'A0', target: 'M4', type: 'transfer', data: { label: '€9,610' } },
                  { id: 't:M5', source: 'A0', target: 'M5', type: 'transfer', data: { label: '€9,890' } },
                  { id: 't:M6', source: 'A0', target: 'M6', type: 'transfer', data: { label: '€9,650' } }
                ]
              }
            },
            // `focus` framing (capped at `frameMaxZoom`), not `all` — `all` zooms a 9-node graph right in.
            view: { focus: { ids: ['A0', 'I1', 'I2', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'], dim: false }, camera: 'focus' },
            meta: {
              user: 'Why was ACC-4471 flagged?',
              reply: [
                'I loaded **ACC-4471** with its direct counterparties: two payers on the left, six recipients on the right. New items pulse for a moment so you can see what just arrived.',
                'The reason for the alert is on the canvas. Six transfers left the account in 36 hours, and every one is just under the €10,000 reporting line. That is **structuring**.'
              ],
              notes: [
                { node: 'A0', text: '**Why it was flagged.** Six transfers out in 36 hours, €9,480 to €9,950 each. All sit just under the €10,000 reporting line.', dx: -46, dy: -60 },
                { node: 'M1', text: 'All six recipients were opened in the last 60 days and had no activity before this month.', dx: 44, dy: -10 }
              ]
            }
          },
          {
            id: 'follow',
            title: 'Follow the money',
            narration: 'One more hop downstream from the six recipients.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'C', type: 'account', data: { label: 'ACC-9012', holder: 'Private individual', opened: '41 days ago', received: '€57,320', sent: '€56,900' } },
                  { id: 'X', type: 'offramp', data: { label: 'Kestrel Exchange', kind: 'Virtual asset provider', jurisdiction: 'Seychelles' } }
                ],
                edges: [
                  { id: 'f:M1', source: 'M1', target: 'C', type: 'forward', data: { label: '€9,310' } },
                  { id: 'f:M2', source: 'M2', target: 'C', type: 'forward', data: { label: '€9,790' } },
                  { id: 'f:M3', source: 'M3', target: 'C', type: 'forward', data: { label: '€9,560' } },
                  { id: 'f:M4', source: 'M4', target: 'C', type: 'forward', data: { label: '€9,450' } },
                  { id: 'f:M5', source: 'M5', target: 'C', type: 'forward', data: { label: '€9,730' } },
                  { id: 'f:M6', source: 'M6', target: 'C', type: 'forward', data: { label: '€9,480' } },
                  { id: 'x:C', source: 'C', target: 'X', type: 'cashout', data: { label: '€56,900' } }
                ]
              }
            },
            view: { focus: { ids: ['A0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C', 'X'] }, camera: 'focus' },
            meta: {
              user: 'Where does the money go after those six accounts?',
              reply: [
                'Following it one more hop. Each recipient forwards almost the whole amount, keeping about €150, to the same account: **ACC-9012**.',
                'From there **€56,900** leaves for Kestrel Exchange on the same day. I traced the flow once on the canvas so you can see the direction.'
              ],
              trace: [
                ['t:M1', 't:M2', 't:M3', 't:M4', 't:M5', 't:M6'],
                ['f:M1', 'f:M2', 'f:M3', 'f:M4', 'f:M5', 'f:M6'],
                ['x:C']
              ],
              notes: [
                { node: 'C', text: '**Fan-in.** All six forward to ACC-9012 within 4 hours: €57,320 in, €56,900 out the same day.', dx: 36, dy: -64 },
                { node: 'X', text: 'Then it leaves through a crypto off-ramp. Fan-out, fan-in, cash-out: a layering pattern.', dx: 30, dy: 48 }
              ]
            }
          },
          {
            id: 'devices',
            title: 'Shared devices',
            narration: 'Login events joined onto the same accounts.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'D1', type: 'device', data: { label: 'Device 8F:2A', model: 'iPhone 14', logins: 212, firstSeen: '58 days ago' } },
                  { id: 'D2', type: 'device', data: { label: 'Device 3C:91', model: 'Pixel 7', logins: 167, firstSeen: '2024-03-11' } }
                ],
                edges: [
                  { id: 'l1:M1', source: 'M1', target: 'D1', type: 'login' },
                  { id: 'l1:M2', source: 'M2', target: 'D1', type: 'login' },
                  { id: 'l1:M3', source: 'M3', target: 'D1', type: 'login' },
                  { id: 'l1:C', source: 'C', target: 'D1', type: 'login' },
                  { id: 'l2:A0', source: 'A0', target: 'D2', type: 'login' },
                  { id: 'l2:M4', source: 'M4', target: 'D2', type: 'login' },
                  { id: 'l2:M5', source: 'M5', target: 'D2', type: 'login' },
                  { id: 'l2:M6', source: 'M6', target: 'D2', type: 'login' }
                ]
              }
            },
            view: { focus: { ids: ['D1', 'D2', 'A0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C'] }, camera: 'focus' },
            meta: {
              user: 'Are these accounts connected in any other way?',
              reply: [
                'Yes. I joined the login events, and two devices account for **every** session on these accounts.',
                'Device 8F:2A reaches the first three recipients and the collector. Device 3C:91 reaches the flagged business account and the other three. The "unrelated" accounts look like one operator with two phones.'
              ],
              notes: [
                { node: 'D1', text: '**One phone, four accounts.** 212 logins to ACC-2207, ACC-3318, ACC-5530 and the collector.', dx: 34, dy: -30 },
                { node: 'D2', text: 'The flagged business account shares this phone with three of its own recipients.', dx: 40, dy: 22 }
              ]
            }
          },
          {
            id: 'context',
            title: 'The wider network',
            narration: 'Two hops of ordinary activity around the ring.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'L0', type: 'context', data: { label: 'ACC-1203', role: 'Ordinary customer', transfers19d: 3, sharedDevices: 0 } },
                  { id: 'L1', type: 'context', data: { label: 'ACC-1580', role: 'Ordinary customer', transfers19d: 10, sharedDevices: 0 } },
                  { id: 'L2', type: 'context', data: { label: 'ACC-1957', role: 'Ordinary customer', transfers19d: 6, sharedDevices: 0 } },
                  { id: 'L3', type: 'context', data: { label: 'ACC-2334', role: 'Ordinary customer', transfers19d: 13, sharedDevices: 0 } },
                  { id: 'L4', type: 'context', data: { label: 'ACC-2711', role: 'Ordinary customer', transfers19d: 9, sharedDevices: 0 } },
                  { id: 'L5', type: 'context', data: { label: 'ACC-3088', role: 'Ordinary customer', transfers19d: 5, sharedDevices: 0 } },
                  { id: 'L6', type: 'context', data: { label: 'ACC-3465', role: 'Ordinary customer', transfers19d: 12, sharedDevices: 0 } },
                  { id: 'L7', type: 'context', data: { label: 'ACC-3842', role: 'Ordinary customer', transfers19d: 8, sharedDevices: 0 } },
                  { id: 'L8', type: 'context', data: { label: 'ACC-4219', role: 'Ordinary customer', transfers19d: 4, sharedDevices: 0 } },
                  { id: 'L9', type: 'context', data: { label: 'ACC-4596', role: 'Ordinary customer', transfers19d: 11, sharedDevices: 0 } },
                  { id: 'L10', type: 'context', data: { label: 'ACC-4973', role: 'Ordinary customer', transfers19d: 7, sharedDevices: 0 } },
                  { id: 'L11', type: 'context', data: { label: 'ACC-5350', role: 'Ordinary customer', transfers19d: 3, sharedDevices: 0 } },
                  { id: 'L12', type: 'context', data: { label: 'ACC-5727', role: 'Ordinary customer', transfers19d: 10, sharedDevices: 0 } },
                  { id: 'L13', type: 'context', data: { label: 'ACC-6104', role: 'Ordinary customer', transfers19d: 6, sharedDevices: 0 } },
                  { id: 'L14', type: 'context', data: { label: 'ACC-6481', role: 'Ordinary customer', transfers19d: 13, sharedDevices: 0 } },
                  { id: 'L15', type: 'context', data: { label: 'ACC-6858', role: 'Ordinary customer', transfers19d: 9, sharedDevices: 0 } },
                  { id: 'R0', type: 'context', data: { label: 'ACC-4410', role: 'Ordinary customer', transfers19d: 3, sharedDevices: 0 } },
                  { id: 'R1', type: 'context', data: { label: 'ACC-4787', role: 'Ordinary customer', transfers19d: 10, sharedDevices: 0 } },
                  { id: 'R2', type: 'context', data: { label: 'ACC-5164', role: 'Ordinary customer', transfers19d: 6, sharedDevices: 0 } },
                  { id: 'R3', type: 'context', data: { label: 'ACC-5541', role: 'Ordinary customer', transfers19d: 13, sharedDevices: 0 } },
                  { id: 'R4', type: 'context', data: { label: 'ACC-5918', role: 'Ordinary customer', transfers19d: 9, sharedDevices: 0 } },
                  { id: 'R5', type: 'context', data: { label: 'ACC-6295', role: 'Ordinary customer', transfers19d: 5, sharedDevices: 0 } }
                ],
                edges: [
                  { id: 'c:L0', source: 'L0', target: 'I1', type: 'context' },
                  { id: 'c:L1', source: 'L1', target: 'I2', type: 'context' },
                  { id: 'c:L2', source: 'L2', target: 'I1', type: 'context' },
                  { id: 'c:L3', source: 'L3', target: 'I2', type: 'context' },
                  { id: 'cc:L3', source: 'L3', target: 'L1', type: 'context' },
                  { id: 'c:L4', source: 'L4', target: 'I1', type: 'context' },
                  { id: 'c:L5', source: 'L5', target: 'I2', type: 'context' },
                  { id: 'c:L6', source: 'L6', target: 'I1', type: 'context' },
                  { id: 'cc:L6', source: 'L6', target: 'L4', type: 'context' },
                  { id: 'c:L7', source: 'L7', target: 'I2', type: 'context' },
                  { id: 'c:L8', source: 'L8', target: 'I1', type: 'context' },
                  { id: 'c:L9', source: 'L9', target: 'I2', type: 'context' },
                  { id: 'cc:L9', source: 'L9', target: 'L7', type: 'context' },
                  { id: 'c:L10', source: 'L10', target: 'I1', type: 'context' },
                  { id: 'c:L11', source: 'L11', target: 'I2', type: 'context' },
                  { id: 'c:L12', source: 'L12', target: 'I1', type: 'context' },
                  { id: 'cc:L12', source: 'L12', target: 'L10', type: 'context' },
                  { id: 'c:L13', source: 'L13', target: 'I2', type: 'context' },
                  { id: 'c:L14', source: 'L14', target: 'I1', type: 'context' },
                  { id: 'c:L15', source: 'L15', target: 'I2', type: 'context' },
                  { id: 'cc:L15', source: 'L15', target: 'L13', type: 'context' },
                  { id: 'c:R0', source: 'X', target: 'R0', type: 'context' },
                  { id: 'c:R1', source: 'X', target: 'R1', type: 'context' },
                  { id: 'c:R2', source: 'X', target: 'R2', type: 'context' },
                  { id: 'c:R3', source: 'X', target: 'R3', type: 'context' },
                  { id: 'cc:R3', source: 'R1', target: 'R3', type: 'context' },
                  { id: 'c:R4', source: 'X', target: 'R4', type: 'context' },
                  { id: 'c:R5', source: 'X', target: 'R5', type: 'context' }
                ]
              }
            },
            view: { focus: null, camera: 'all' },
            meta: {
              user: 'Zoom out. Is this part of something bigger?',
              reply: [
                'I widened the view to two hops around the ring. It is a tight, isolated cluster that touches the wider network only to take money in and cash it out.',
                'Over 19 days it repeated this pattern 7 times: **41 transfers, €412,600**. The ordinary accounts around it have varied amounts and no shared devices.'
              ],
              group: { members: ring, label: 'RING · 8 ACCOUNTS · 2 DEVICES' },
              notes: [
                { node: 'C', text: '**€412,600 in 19 days.** The pattern you just saw ran 7 times, 41 transfers in all.', dx: 30, dy: -86 },
                { node: 'L7', text: 'Ordinary activity: 22 accounts, varied amounts, no shared devices.', dx: -30, dy: -40 }
              ]
            }
          },
          {
            id: 'owners',
            title: 'Who owns Halvard?',
            narration: 'Company registry, two levels up from the account holder.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'R', type: 'company', data: { label: 'Halvard Trading Ltd', sub: 'UK · holds ACC-4471', registry: 'Companies House', directors: '1 nominee' } },
                  { id: 'B', type: 'company', data: { label: 'Brightmoor Ventures LLP', sub: 'UK · 60%', registry: 'Companies House', declaredPsc: 'none' } },
                  { id: 'TL', type: 'owner', data: { label: 'Teodor Lisk', sub: 'Person · 15%', nationality: 'PL' } },
                  { id: 'F', type: 'minority', data: { label: 'Minor holders (11)', sub: 'each under 5% · 25%', largest: '4.1%' } },
                  { id: 'CV', type: 'company', data: { label: 'Corvane Holdings SA', sub: 'Luxembourg · 80%', registry: 'RCS Luxembourg', uboFiling: 'trust-held' } },
                  { id: 'EP', type: 'company', data: { label: 'Esk Partners Ltd', sub: 'Ireland · 20%', registry: 'CRO Ireland' } }
                ],
                edges: [
                  { id: 'o:R-B', source: 'R', target: 'B', type: 'share', data: { label: '60%' } },
                  { id: 'o:R-TL', source: 'R', target: 'TL', type: 'share', data: { label: '15%' } },
                  { id: 'o:R-F', source: 'R', target: 'F', type: 'share', data: { label: '25%' } },
                  { id: 'o:B-CV', source: 'B', target: 'CV', type: 'share', data: { label: '80%' } },
                  { id: 'o:B-EP', source: 'B', target: 'EP', type: 'share', data: { label: '20%' } }
                ]
              },
              hidden: { nodeIds: network }
            },
            settings: { activeLayout: 'tree' },
            view: { focus: null, camera: 'visible' },
            meta: {
              user: 'Who is behind Halvard Trading Ltd?',
              reply: [
                'Switching to the ownership tree from the company registry. **Halvard Trading Ltd** is 60% owned by Brightmoor Ventures LLP, which is itself held by two more companies.',
                'No natural person crosses the 25% disclosure line at this depth. I can keep expanding.'
              ],
              group: null,
              notes: [
                { node: 'B', text: 'The majority holder is another company. The UK register lists no person above 25%.', dx: -20, dy: -48 },
                { node: 'CV', text: 'At the next layer, ownership moves offshore.', dx: 30, dy: -40 }
              ]
            }
          },
          {
            id: 'ubo',
            title: 'Trace to a person',
            narration: 'Expanded until every branch ends at a natural person.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'P', type: 'trust', data: { label: 'Pellucid Trust', sub: 'Cyprus · 100%', kind: 'Discretionary trust', trustee: 'Ardent Fiduciary Ltd' } },
                  { id: 'O', type: 'owner', data: { label: 'Danielle Okafor', sub: 'settlor & beneficiary', effectiveStake: '48%' } },
                  { id: 'MH', type: 'owner', data: { label: 'Marek Hale', sub: 'Person · 50%', effectiveStake: '6%' } },
                  { id: 'IV', type: 'owner', data: { label: 'Ines Varga', sub: 'Person · 50%', effectiveStake: '6%' } }
                ],
                edges: [
                  { id: 'o:CV-P', source: 'CV', target: 'P', type: 'share', data: { label: '100%' } },
                  { id: 'o:P-O', source: 'P', target: 'O', type: 'share', data: { label: 'beneficiary' } },
                  { id: 'o:EP-MH', source: 'EP', target: 'MH', type: 'share', data: { label: '50%' } },
                  { id: 'o:EP-IV', source: 'EP', target: 'IV', type: 'share', data: { label: '50%' } }
                ]
              }
            },
            view: { focus: { ids: ['R', 'B', 'CV', 'P', 'O'] }, camera: 'focus' },
            meta: {
              user: 'Keep going until you reach a person.',
              reply: [
                'Two layers further up, the main branch ends at a person: **Danielle Okafor**, settlor and sole beneficiary of Pellucid Trust.',
                'Her effective stake in Halvard is 60% × 80% × 100% = **48%**. It is split across the UK, Luxembourg and Cyprus, so no single register shows it.'
              ],
              trace: [['o:R-B'], ['o:B-CV'], ['o:CV-P'], ['o:P-O']],
              notes: [
                { node: 'O', text: '**48% effective control** of Halvard: 60% × 80% × 100%, through three jurisdictions.', dx: -30, dy: 46 },
                { node: 'P', text: 'The trust layer keeps her name off the Luxembourg register.', dx: -24, dy: -44 }
              ]
            }
          },
          {
            id: 'loop',
            title: 'The loop closes',
            narration: 'Danielle Okafor placed back onto the transfer network.',
            actor: 'assistant',
            data: {
              added: {
                nodes: [
                  { id: 'PO', type: 'person', data: { label: 'Danielle Okafor', effectiveStake: '48% of Halvard', holds: 'ACC-2207', device: '8F:2A (registered)' } }
                ],
                edges: [
                  // Written business → owner ("owned by") so the network stays acyclic for ELK:
                  // PO → A0 would close a loop with A0 → M1 → PO and reflow the ring.
                  { id: 'own:PO', source: 'A0', target: 'PO', type: 'owns', data: { label: '48% owned by' } },
                  { id: 'held:M1', source: 'M1', target: 'PO', type: 'held', data: { label: 'held by' } },
                  { id: 'reg:D1', source: 'D1', target: 'PO', type: 'registered', data: { label: 'registered to' } }
                ]
              },
              updated: { nodes: [{ id: 'M1', patch: { data: { label: 'ACC-2207', holder: 'Danielle Okafor', opened: '14 days ago', received: '€9,480' } } }] },
              hidden: { nodeIds: tree },
              shown: { nodeIds: network }
            },
            settings: { activeLayout: 'elk' },
            view: { focus: { ids: ['PO', 'A0', 'M1', 'D1', 'C', 'X'] }, camera: 'focus' },
            meta: {
              user: 'Does she appear anywhere in the transfer network?',
              reply: [
                'Yes, twice. **ACC-2207**, one of the six recipients, is held in her own name, and device 8F:2A is registered to her.',
                'So money left the business she controls and came back to her personally. Here is what I would put in the case file:'
              ],
              findings: [
                ['High', 'Structuring: 41 transfers between €9,400 and €9,950 in 19 days.'],
                ['High', 'Layering: fan-out to 6 new accounts, fan-in to ACC-9012, cash-out through Kestrel Exchange.'],
                ['Medium', 'Common control: 2 devices, and one beneficial owner holding 48% through UK, LU and CY entities.']
              ],
              group: { members: ring, label: 'RING · 8 ACCOUNTS · 2 DEVICES' },
              trace: [['t:M1'], ['held:M1']],
              notes: [
                { node: 'PO', text: '**The loop closes.** She controls the flagged business and personally holds ACC-2207, one of its six recipients.', dx: -30, dy: 44 },
                { node: 'D1', text: 'The phone behind four ring accounts is registered to her.', dx: -30, dy: -40 }
              ]
            }
          }
        ]
      };

      /**
       * The whole serialisable config. Node presentation is template data:
       * a structure (the silhouette) + a styling (the colours) per `type`.
       * The `new` / `trace` / `highlighted` overlays are the layer's state
       * catalogue — switched on per node / edge by the step effects below.
       */
      const config = {
        fitOnLoad: false,
        layers: {
          bg: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
          graph: {
            nodeStructureTemplates: {
              businessDot: { name: 'businessDot', kind: 'simple', shape: { kind: 'circle', radius: 13 }, slots: { label: true } },
              accountDot: { name: 'accountDot', kind: 'simple', shape: { kind: 'circle', radius: 9 }, slots: { label: true } },
              payerDot: { name: 'payerDot', kind: 'simple', shape: { kind: 'circle', radius: 8 }, slots: { label: true } },
              contextDot: { name: 'contextDot', kind: 'simple', shape: { kind: 'circle', radius: 5.5 }, slots: { label: false } },
              deviceDiamond: { name: 'deviceDiamond', kind: 'simple', shape: { kind: 'regular-polygon', sides: 4, radius: 12 }, slots: { label: true } },
              offrampHex: { name: 'offrampHex', kind: 'simple', shape: { kind: 'regular-polygon', sides: 6, radius: 14 }, slots: { label: true } },
              personDot: { name: 'personDot', kind: 'simple', shape: { kind: 'circle', radius: 12 }, slots: { label: true } },
              // The ownership tree: name on top, jurisdiction · stake underneath.
              ownerCard: {
                name: 'ownerCard',
                kind: 'freeform',
                width: 214,
                height: 46,
                cornerRadius: 10,
                bgRole: 'cardBg',
                strokeRole: 'stroke',
                strokeWidth: 1,
                elements: [
                  {
                    id: 'kind',
                    type: 'circle',
                    x: 10,
                    y: 17,
                    radius: 6,
                    fillLookup: {
                      bind: 'type',
                      map: { company: C.company, trust: C.offramp, owner: C.person, minority: 0x8c99a8 },
                      fallback: C.company
                    }
                  },
                  { id: 'name', type: 'text', x: 30, y: -6, bind: 'data.label', fontSize: 13, fontWeight: 600, colorRole: 'heading', maxWidth: 176 },
                  { id: 'sub', type: 'text', x: 30, y: 14, bind: 'data.sub', fontSize: 10.5, colorRole: 'muted', maxWidth: 176 }
                ]
              }
            },
            nodeStylingTemplates: {
              flagged: { name: 'flagged', fill: C.account, stroke: C.flag, strokeWidth: 3, label: { fontSize: 12, fontWeight: 700, placement: 'bottom', colorRole: 'foreground' } },
              account: { name: 'account', fill: C.account, strokeRole: 'surface', strokeWidth: 1.5, label: { fontSize: 11, fontWeight: 600, placement: 'bottom', colorRole: 'foreground' } },
              payer: { name: 'payer', fillRole: 'muted', strokeRole: 'surface', strokeWidth: 1.5, label: { fontSize: 11, placement: 'bottom', colorRole: 'muted' } },
              context: { name: 'context', fillRole: 'muted', fillAlpha: 0.55, strokeAlpha: 0 },
              device: { name: 'device', fill: C.device, strokeRole: 'surface', strokeWidth: 1.5, label: { fontSize: 11, fontWeight: 600, placement: 'bottom', colorRole: 'foreground' } },
              offramp: { name: 'offramp', fill: C.offramp, strokeRole: 'surface', strokeWidth: 1.5, label: { fontSize: 12, fontWeight: 600, placement: 'bottom', colorRole: 'foreground' } },
              person: { name: 'person', fill: C.person, strokeRole: 'surface', strokeWidth: 2, label: { fontSize: 12, fontWeight: 700, placement: 'bottom', colorRole: 'foreground' } },
              card: { name: 'card', bgRole: 'cardBg' }
            },
            nodeTypes: {
              flagged: { structure: 'businessDot', styling: 'flagged', bindings: { label: 'data.label' } },
              account: { structure: 'accountDot', styling: 'account', bindings: { label: 'data.label' } },
              payer: { structure: 'payerDot', styling: 'payer', bindings: { label: 'data.label' } },
              context: { structure: 'contextDot', styling: 'context', bindings: {} },
              device: { structure: 'deviceDiamond', styling: 'device', bindings: { label: 'data.label' } },
              offramp: { structure: 'offrampHex', styling: 'offramp', bindings: { label: 'data.label' } },
              person: { structure: 'personDot', styling: 'person', bindings: { label: 'data.label' } },
              company: { structure: 'ownerCard', styling: 'card', bindings: {} },
              trust: { structure: 'ownerCard', styling: 'card', bindings: {} },
              owner: { structure: 'ownerCard', styling: 'card', bindings: {} },
              minority: { structure: 'ownerCard', styling: 'card', bindings: {} }
            },
            node: {
              state: {
                // Focus and selection in the case's own accent, not the default yellow.
                highlighted: { decorations: [{ id: 'canonical-hover-ring', kind: 'ring', color: C.halo, width: 1.5, gap: 4, alpha: 0.8 }] },
                selected: {
                  decorations: [
                    { id: 'canonical-select-ring', kind: 'ring', color: C.halo, width: 2.5, gap: 6, alpha: 1 },
                    { id: 'canonical-select-halo', kind: 'glow', color: C.halo, strokeWidth: 18, innerAlpha: 0.25, layers: 4 }
                  ]
                },
                dimmed: { bgAlpha: 0.2, labelAlpha: 0.25 },
                // One-time arrival: fade in + two sonar rings. Switched off after 2 s.
                new: {
                  decorations: [{ id: 'arrival', kind: 'pulse-ring', color: C.halo, maxRadius: 18, periodMs: 1000, rings: 2, strokeWidth: 2, innerAlpha: 0.8 }],
                  effects: { 'fade-in': { durationMs: 450, fromAlpha: 0 } }
                }
              }
            },
            edge: {
              state: {
                // Draw the edge in once, source → target.
                new: {
                  decorations: [{ id: 'draw', kind: 'reveal-connector', durationMs: 650, delayMs: 200, easing: 'easeOutCubic', hostStroke: 'hide', holdAtFull: true }]
                },
                // One marker runs the hop once, then the state is cleared.
                trace: {
                  decorations: [{ id: 'trace', kind: 'fly-marker-connector', color: C.halo, size: 8, speedPxPerSec: 340, loop: false }]
                }
              }
            }
          }
        },
        behaviours: {
          theme: { enabled: true, mode: 'document' },
          pan: { enabled: true },
          zoom: { enabled: true },
          drag: { enabled: true },
          select: { enabled: true },
          // Padding clears the presenter bar along the bottom of the canvas.
          focus: { enabled: true, frameDurationMs: 1100, framePadding: 130, frameMaxZoom: 1.6 },
          // Re-rasterise label glyphs above screen resolution. Pixi draws text
          // once at the device pixel ratio, so the 1.6× focus zoom stretches it.
          // ~70 labels, so a higher floor than the default (1×) is cheap.
          'label-resolution': {
            enabled: true,
            levels: [
              { minZoom: 0, multiplier: 2 },
              { minZoom: 1.2, multiplier: 3 },
              { minZoom: 2.4, multiplier: 6 }
            ]
          }
        },
        layouts: {
          // No `edgeRouting`: ELK places the nodes and the edge-type styles keep
          // their own curves (routing would rewrite every edge to orthogonal).
          elk: {
            algorithm: 'layered',
            direction: 'RIGHT',
            nodeSpacing: 36,
            layerSpacing: 120,
            defaultNodeSize: { width: 28, height: 28 },
            transition: 900,
            transitionEase: 'easeInOutCubic',
            layoutOptions: { 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES' }
          },
          tree: { mode: 'tree', orientation: 'horizontal', nodeSize: [80, 250], rootId: 'R', transition: 900, transitionEase: 'easeInOutCubic' }
        },
        activeLayout: 'elk'
      };

      return { C, playbook, config };
    }, []);

    // ─── State ──────────────────────────────────────────────────────────────
    type StepMeta = {
      user: string;
      reply: string[];
      notes?: { node: string; text: string; dx: number; dy: number }[];
      trace?: string[][];
      group?: { members: string[]; label: string } | null;
      findings?: [string, string][];
    };
    type Turn = { role: 'user' | 'assistant'; text: string[]; step?: StepSpec<CanvasConfig> };
    const metaOf = useCallback((s: StepSpec<CanvasConfig> | undefined) => s?.meta as StepMeta | undefined, []);

    const hostRef = useRef<HTMLDivElement>(null);
    const noteRefs = useRef(new Map<string, { card: HTMLDivElement | null; line: SVGLineElement | null }>());
    const [canvas, setCanvas] = useState<GraphCanvas | null>(null);
    const [index, setIndex] = useState(-1);
    const [typing, setTyping] = useState<string | null>(null);
    const [words, setWords] = useState(Number.POSITIVE_INFINITY);
    const [asides, setAsides] = useState<Turn[]>([]);
    const [draft, setDraft] = useState('');
    const [auto, setAuto] = useState(false);
    const [asked, setAsked] = useState<{ node: string; text: string } | null>(null);

    // ─── The engine ─────────────────────────────────────────────────────────
    useEffect(() => {
      const container = hostRef.current;
      if (!container) return;
      let cancelled = false;
      const timers = new Set<ReturnType<typeof setTimeout>>();
      const later = (ms: number, fn: () => void) => {
        const t = setTimeout(() => {
          timers.delete(t);
          fn();
        }, ms);
        timers.add(t);
      };

      // Edge presentation per type — the one resolver block (no edge-type
      // registry exists yet). Colours that mean something are literal; plain
      // flow edges take the theme's muted stroke.
      const dash: Record<string, [number, number]> = { login: [3, 4], owns: [6, 5], held: [6, 5], registered: [2, 4] };
      const width: Record<string, number> = { inbound: 1.2, transfer: 1.4, forward: 1.4, cashout: 2, login: 1.1, context: 0.8, owns: 1.6, held: 1.6, registered: 1.2, share: 1.4 };
      const tint: Record<string, number> = { login: story.C.device, owns: story.C.person, held: story.C.person, registered: story.C.person };
      const arrows = new Set(['inbound', 'transfer', 'forward', 'cashout', 'owns', 'held']);
      const labelOf = (e: GraphEdge) => (e.data as { label?: string } | undefined)?.label ?? '';
      const pill = {
        labelFontSize: 10,
        labelColor: 0xe3e9ef,
        labelBackgroundFill: 0x16202a,
        labelBackgroundAlpha: 0.9,
        labelBackgroundPadding: 4,
        labelBackgroundCornerRadius: 5
      };

      const cleanup: (() => void)[] = [];
      const canvas = new GraphCanvas();
      canvas.layers.add(new BackgroundLayer({ id: 'bg', options: {} }));
      canvas.layers.add(
        new GraphLayer({
          id: 'graph',
          options: {
            initData: { nodes: [], edges: [] },
            edge: {
              style: {
                strokeWidth: (e: GraphEdge) => width[e.type ?? ''] ?? 1.2,
                // `[0, 0]` is solid: the connector dashes only when both lengths are > 0.
                strokeDashArray: (e: GraphEdge) => dash[e.type ?? ''] ?? [0, 0],
                // Untinted edges keep the live theme's `muted` — read off the theme the
                // canvas's own ThemeBehaviour published, so a theme switch recolours them.
                strokeColor: (e: GraphEdge) => tint[e.type ?? ''] ?? canvas.context.theme.current()?.palette.muted ?? 0x94a3b8,
                strokeAlpha: (e: GraphEdge) => (e.type === 'context' ? 0.45 : 0.9),
                arrowTargetShape: (e: GraphEdge) => (arrows.has(e.type ?? '') ? 'triangle' : 'none'),
                arrowTargetSize: 7,
                shape: (e: GraphEdge) =>
                  e.type === 'share'
                    ? { pathType: 'bezier', pathStyleOpts: { axis: 'h' } }
                    : { pathType: e.type === 'cashout' || e.type === 'login' || e.type === 'context' ? 'straight' : 'quadratic' },
                // Ownership stakes are always labelled; amounts only when highlighted.
                labelText: (e: GraphEdge) => (e.type === 'share' ? labelOf(e) : ''),
                ...pill
              },
              state: {
                highlighted: {
                  strokeColor: (e: GraphEdge) => tint[e.type ?? ''] ?? story.C.halo,
                  strokeWidth: (e: GraphEdge) => (width[e.type ?? ''] ?? 1.2) + 1,
                  labelText: labelOf
                }
              }
            }
          }
        })
      );
      // The ring hull, under the graph. Its sets follow the step (meta.group).
      const hull = new BubbleSetsLayer({ id: 'ring', zIndex: -1, options: { graphLayerId: 'graph', sets: [] } });
      canvas.layers.add(hull);
      canvas.behaviours.register(new DragPanBehaviour({ id: 'pan' }));
      canvas.behaviours.register(new WheelZoomBehaviour({ id: 'zoom' }));
      canvas.behaviours.register(new ThemeBehaviour({ id: 'theme' }));
      canvas.behaviours.register(new DragNodeBehaviour({ id: 'drag', targetLayerId: 'graph' }));
      canvas.behaviours.register(new ClickSelectBehaviour({ id: 'select', targetLayerId: 'graph' }));
      canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
      canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-resolution', targetLayerId: 'graph' }));
      const layouts = [
        new ElkLayout({ id: 'elk', targetLayerId: 'graph', onData: { preserveCamera: true } }),
        new D3HierarchyLayout({ id: 'tree', targetLayerId: 'graph', onData: { preserveCamera: true } })
      ];
      for (const layout of layouts) canvas.layouts.add(layout);

      /**
       * Runs once each time the playbook moves *forward* one step: the
       * one-time arrival, glide-from-parent and the money trace. Undo and
       * replay land state only — no animation — like the artifact.
       */
      const playArrival = (step: StepSpec<CanvasConfig>) => {
        const layer = canvas.layers.get<GraphLayer>('graph');
        if (!layer) return;
        const store = layer.store;
        const added = step.data?.added as { nodes?: { id: string }[]; edges?: { id: string; source: string; target: string }[] } | undefined;
        const newIds = (added?.nodes ?? []).map((n) => n.id);
        const order = new Map(newIds.map((id, i) => [id, i]));

        // Glide from the parent: anchor each newcomer on a neighbour that was
        // already there (or listed earlier in this step), before the layout runs.
        for (const id of newIds) {
          const neighbours = (added?.edges ?? []).flatMap((e) => (e.source === id ? [e.target] : e.target === id ? [e.source] : []));
          const anchor =
            neighbours.find((n) => !order.has(n) && store.hasPosition(n)) ??
            neighbours.find((n) => (order.get(n) ?? Infinity) < order.get(id)!);
          if (!anchor) continue;
          const at = store.hasPosition(anchor) ? store.getPosition(anchor) : undefined;
          if (at) store.internal.setPosition(id, at);
        }

        // Arrival: on for 2 s, then off for good.
        for (const id of newIds) store.internal.setNodeState(id, 'new', true);
        const newEdges = (added?.edges ?? []).map((e) => e.id);
        for (const id of newEdges) store.internal.setEdgeState(id, 'new', true);
        later(2000, () => {
          for (const id of newIds) store.internal.setNodeState(id, 'new', false);
          for (const id of newEdges) store.internal.setEdgeState(id, 'new', false);
        });

        // Money trace: one marker per hop, stage by stage, after the camera lands.
        const stages = metaOf(step)?.trace ?? [];
        stages.forEach((ids, i) => {
          later(1500 + i * 750, () => ids.forEach((id) => store.internal.setEdgeState(id, 'trace', true)));
          later(1500 + (i + 1) * 750 + 150, () => ids.forEach((id) => store.internal.setEdgeState(id, 'trace', false)));
        });
      };

      /** The hull for the step the canvas is at — the latest `meta.group` up to here. */
      const syncHull = () => {
        const pb = canvas.playbook;
        let group: StepMeta['group'] = null;
        for (let i = 0; i <= pb.index; i++) {
          const g = metaOf(pb.steps[i])?.group;
          if (g !== undefined) group = g;
        }
        hull.setSets(
          group
            ? [{ id: 'ring', members: group.members, style: { fill: story.C.halo, fillOpacity: 0.08, stroke: story.C.halo, strokeOpacity: 0.45, strokeWidth: 1.5 }, label: { text: group.label, fontSize: 10, color: story.C.halo } }]
            : []
        );
      };

      void canvas
        .init({ container, autoResize: true, config: story.config as unknown as CanvasConfig })
        .then(async () => {
          if (cancelled) return canvas.destroy();
          await canvas.playbook.load(story.playbook);
          let last = -1;
          const offPlaybook = canvas.playbook.subscribe(() => {
            const i = canvas.playbook.index;
            if (i === last + 1 && canvas.playbook.current) playArrival(canvas.playbook.current);
            last = i;
            setIndex(i);
            setTyping(null);
            setAsides([]);
            setAsked(null);
            syncHull();
          });
          // A click on a node asks the assistant about it.
          let lastSel = '';
          const offSelect = canvas.store.view.subscribe((state) => {
            const sel = [...state.interaction.selection];
            const id = sel.length === 1 ? sel[0]! : '';
            if (id && id !== lastSel) setAsked({ node: id, text: '' });
            lastSel = id;
          });
          if (cancelled) {
            offPlaybook();
            offSelect();
            return;
          }
          setCanvas(canvas);
          cleanup.push(offPlaybook, offSelect);
        });

      return () => {
        cancelled = true;
        for (const t of timers) clearTimeout(t);
        for (const off of cleanup) off();
        setCanvas(null);
        for (const layout of layouts) layout.stop();
        if (canvas.isInitialised) canvas.destroy();
      };
      // One engine per mount; everything it reads is the memoised story.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Explainer notes: follow the camera and the glides ──────────────────
    const steps = story.playbook.steps;
    const current = index >= 0 ? steps[index] : undefined;
    const notes = useMemo(() => {
      const list = [...(metaOf(current)?.notes ?? [])];
      if (asked?.text) list.push({ node: asked.node, text: asked.text, dx: 34, dy: -40 });
      return list;
    }, [current, asked, metaOf]);

    useEffect(() => {
      if (!canvas) return;
      const layer = canvas.layers.get<GraphLayer>('graph');
      if (!layer) return;
      const place = () => {
        notes.forEach((n, i) => {
          const refs = noteRefs.current.get(`${index}:${i}`);
          const card = refs?.card;
          if (!card || !layer.store.hasNode(n.node) || layer.store.isNodeHidden(n.node)) return;
          const world = layer.store.getPosition(n.node);
          if (!world) return;
          const p = canvas.camera.toScreen(world.x, world.y);
          const w = card.offsetWidth;
          const h = card.offsetHeight;
          const host = hostRef.current;
          const W = host?.clientWidth ?? 0;
          const H = host?.clientHeight ?? 0;
          const left = Math.min(Math.max(n.dx >= 0 ? p.x + n.dx : p.x + n.dx - w, 12), Math.max(12, W - w - 12));
          // Keep clear of the presenter bar along the bottom.
          const top = Math.min(Math.max(n.dy >= 0 ? p.y + n.dy : p.y + n.dy - h, 12), Math.max(12, H - h - 124));
          card.style.transform = `translate(${Math.round(left)}px, ${Math.round(top)}px)`;
          const line = refs?.line;
          if (line) {
            // From the node's edge (not its centre) to the nearest point of the card.
            const qx = Math.min(Math.max(p.x, left), left + w);
            const qy = Math.min(Math.max(p.y, top), top + h);
            const scale = canvas.camera.toScreen(world.x + 1, world.y).x - p.x;
            const isCard = ['company', 'trust', 'owner', 'minority'].includes(layer.store.getNode(n.node)?.type ?? '');
            const r = (isCard ? 25 : 16) * scale;
            const d = Math.hypot(qx - p.x, qy - p.y) || 1;
            line.setAttribute('x1', String(p.x + ((qx - p.x) / d) * Math.min(r, d)));
            line.setAttribute('y1', String(p.y + ((qy - p.y) / d) * Math.min(r, d)));
            line.setAttribute('x2', String(qx));
            line.setAttribute('y2', String(qy));
          }
        });
      };
      place();
      const offs = [
        canvas.events.on('input:camera:pan', place),
        canvas.events.on('input:camera:zoom', place),
        layer.events.on('positions:updated', place),
        layer.events.on('data:changed', place)
      ];
      return () => offs.forEach((off) => off());
    }, [canvas, notes, index]);

    // ─── Chat: the transcript is derived from the playbook position ────────
    useEffect(() => {
      // Stream the newest reply word by word.
      if (index < 0) return;
      setWords(0);
      const total = (metaOf(steps[index])?.reply ?? []).join(' ').split(' ').length;
      const t = setInterval(() => setWords((w) => (w >= total ? w : w + 1)), 28);
      return () => clearInterval(t);
    }, [index, steps, metaOf]);

    const turns = useMemo(() => {
      const out: Turn[] = [];
      for (let i = 0; i <= index; i++) {
        const m = metaOf(steps[i])!;
        out.push({ role: 'user', text: [m.user] });
        out.push({ role: 'assistant', text: m.reply, step: steps[i] });
      }
      return out;
    }, [index, steps, metaOf]);

    const ask = (text: string) => {
      if (!canvas || typing) return;
      const next = canvas.playbook.index + 1;
      if (/pulse|glow|animat/i.test(text)) {
        setAsides((a) => [
          ...a,
          { role: 'user', text: [text] },
          { role: 'assistant', text: ['Anything I add arrives once: it fades in and two rings pulse for **2 seconds**, then stop for good. Edges draw in from source to target. Nothing loops, so the canvas stays calm while you read.'] }
        ]);
        return;
      }
      if (next >= steps.length) {
        setAsides((a) => [
          ...a,
          { role: 'user', text: [text] },
          { role: 'assistant', text: ['That completes this walkthrough. Click any node to ask about it, use ◀ to revisit a step, or start over.'] }
        ]);
        return;
      }
      setTyping(text);
      setTimeout(() => {
        void canvas.playbook.next().finally(() => setTyping(null));
      }, 700);
    };

    // A clicked node becomes a question + an anchored answer.
    useEffect(() => {
      if (!canvas || !asked || asked.text) return;
      const layer = canvas.layers.get<GraphLayer>('graph');
      const node = layer?.store.getNode(asked.node);
      if (!layer || !node) return;
      const data = (node.data ?? {}) as Record<string, unknown>;
      const label = String(data.label ?? node.id);
      const facts = Object.entries(data)
        .filter(([k]) => k !== 'label' && k !== 'sub')
        .slice(0, 3)
        .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').toLowerCase()} ${String(v)}`)
        .join(', ');
      const near = [...layer.store.neighborsOf(node.id)].filter((id) => !layer.store.isNodeHidden(id));
      setAsides((a) => [
        ...a,
        { role: 'user', text: [`Tell me about ${label}`] },
        { role: 'assistant', text: [`**${label}**${facts ? `: ${facts}.` : '.'} It connects to ${near.length} item${near.length === 1 ? '' : 's'} on the canvas, highlighted now.`] }
      ]);
      canvas.store.actions.focus.set([node.id, ...near], true);
      setAsked({ node: node.id, text: `**${label}** — ${near.length} direct connection${near.length === 1 ? '' : 's'} highlighted.` });
    }, [canvas, asked]);

    // Auto-play: type the next question, then send it. The first question is
    // always asked this way, so the story opens on a working analysis.
    useEffect(() => {
      if (!(auto || index === -1) || !canvas || typing) return;
      const next = metaOf(steps[index + 1])?.user;
      if (!next) {
        setAuto(false);
        return;
      }
      let i = 0;
      const timers: ReturnType<typeof setTimeout>[] = [];
      timers.push(
        setTimeout(function type() {
          i++;
          setDraft(next.slice(0, i));
          if (i < next.length) timers.push(setTimeout(type, 30));
          else
            timers.push(
              setTimeout(() => {
                setDraft('');
                ask(next);
              }, 300)
            );
        }, index === -1 ? 600 : 3200)
      );
      return () => timers.forEach(clearTimeout);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [auto, canvas, typing, index]);

    const bold = (s: string) => s.split('**').map((part, i) => (i % 2 ? <strong key={i}>{part}</strong> : <span key={i}>{part}</span>));
    const opsOf = (s: StepSpec<CanvasConfig>) => {
      const a = s.data?.added as { nodes?: unknown[]; edges?: unknown[] } | undefined;
      const out: string[] = [];
      if (a?.nodes?.length) out.push(`+${a.nodes.length} nodes`);
      if (a?.edges?.length) out.push(`+${a.edges.length} edges`);
      if (s.data?.hidden) out.push('hide');
      if (s.data?.shown) out.push('show');
      if (s.settings?.activeLayout) out.push(`layout ${s.settings.activeLayout}`);
      if (s.view?.focus) out.push(`focus ${s.view.focus.ids.length}`);
      if (s.view?.camera) out.push(`camera ${s.view.camera}`);
      return out;
    };
    const suggestion = metaOf(steps[index + 1])?.user;
    let budget = words;

    return (
      <div className="bg-background text-foreground flex h-screen w-full gap-3 overflow-hidden p-3">
        {/* The canvas: evidence, notes, presenter bar. */}
        <div className="border-border bg-card relative min-w-0 flex-1 overflow-hidden rounded-xl border">
          <div ref={hostRef} className="absolute inset-0" />
          <div className="pointer-events-none absolute inset-0 z-10">
            <svg className="absolute inset-0 h-full w-full">
              {notes.map((_, i) => (
                <line
                  key={`${index}:${i}`}
                  ref={(el) => {
                    const r = noteRefs.current.get(`${index}:${i}`) ?? { card: null, line: null };
                    r.line = el;
                    noteRefs.current.set(`${index}:${i}`, r);
                  }}
                  className="stroke-primary animate-in fade-in duration-500"
                  strokeWidth={1.2}
                />
              ))}
            </svg>
            {notes.map((n, i) => (
              <div
                key={`${index}:${i}`}
                ref={(el) => {
                  const r = noteRefs.current.get(`${index}:${i}`) ?? { card: null, line: null };
                  r.card = el;
                  noteRefs.current.set(`${index}:${i}`, r);
                }}
                className="border-border bg-popover text-popover-foreground animate-in fade-in slide-in-from-bottom-1 fill-mode-both absolute top-0 left-0 max-w-56 rounded-lg border px-3 py-2 text-xs leading-relaxed shadow-lg duration-500"
                // The stagger is per-note runtime data, not a static style.
                style={{ animationDelay: `${1100 + i * 900}ms` }}
              >
                <div className="text-primary mb-1 font-mono text-[10px] font-semibold tracking-wider uppercase">
                  {asked?.text && i === notes.length - 1 ? 'You asked' : `Assistant note ${i + 1}`}
                </div>
                <p>{bold(n.text)}</p>
              </div>
            ))}
          </div>
          <PlaybookPresenterBar canvas={canvas} className="absolute inset-x-4 bottom-4 z-20 mx-auto max-w-2xl shadow-lg" />
        </div>

        {/* The assistant. */}
        <aside className="border-border bg-card flex w-[380px] shrink-0 flex-col overflow-hidden rounded-xl border">
          <div className="border-border flex items-center gap-2 border-b px-4 py-3">
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold">Analyst assistant</div>
              <div className="text-muted-foreground truncate text-xs">
                {index < 0 ? 'Case 2026-1184 · structuring alert' : `Step ${index + 1} of ${steps.length} · ${current?.title}`}
              </div>
            </div>
            <Button size="sm" variant={auto ? 'default' : 'outline'} onClick={() => setAuto((v) => !v)}>
              {auto ? <Pause className="size-3.5" /> : <Play className="size-3.5" />}
              Auto-play
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Start over"
              onClick={() => {
                setAuto(false);
                void canvas?.playbook.goTo(steps[0]!.id).then(() => canvas.playbook.previous());
              }}
            >
              <RotateCcw className="size-3.5" />
            </Button>
          </div>

          <div className="min-h-0 flex-1">
            <ChatSession
              autoScrollKey={`${index}:${asides.length}:${typing ?? ''}`}
              footer={
                <div className="flex flex-col gap-2 p-3">
                  <div className="flex flex-wrap gap-1.5">
                    {suggestion && (
                      <Button size="sm" variant="outline" className="h-auto py-1 text-left whitespace-normal" disabled={!!typing} onClick={() => ask(suggestion)}>
                        {suggestion}
                      </Button>
                    )}
                    {index >= 0 && (
                      <Button size="sm" variant="ghost" disabled={!!typing} onClick={() => ask('What do the pulses mean?')}>
                        What do the pulses mean?
                      </Button>
                    )}
                  </div>
                  <ChatSessionComposer
                    value={draft}
                    onChange={setDraft}
                    onSend={() => {
                      const text = draft.trim();
                      if (!text) return;
                      setDraft('');
                      setAuto(false);
                      ask(text);
                    }}
                    isRunning={!!typing}
                    placeholder="Ask about the case, or click a node"
                    sendIcon={<ArrowUp className="size-4" />}
                  />
                </div>
              }
            >
              <ChatSessionMessage role="assistant">
                {bold('Rule **TX-STRUCT-07** fired on **ACC-4471** at 09:14. I can walk you through it on the canvas, one step at a time.')}
              </ChatSessionMessage>
              {turns.map((t, i) => {
                const isLatest = i === turns.length - 1;
                const m = metaOf(t.step);
                return t.role === 'user' ? (
                  <ChatSessionMessage key={i} role="user">
                    {t.text[0]}
                  </ChatSessionMessage>
                ) : (
                  <ChatSessionMessage
                    key={i}
                    role="assistant"
                    footer={
                      t.step && (
                        <div className="flex flex-col gap-2">
                          {m?.findings && (!isLatest || words >= t.text.join(' ').split(' ').length) && (
                            <ul className="flex flex-col gap-1.5">
                              {m.findings.map(([sev, f]) => (
                                <li key={f} className="border-border flex items-start gap-2 rounded-md border p-2 text-xs">
                                  <Badge variant={sev === 'High' ? 'destructive' : 'secondary'}>{sev}</Badge>
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                          <ChatSessionDisclosure
                            label={`playbook.step("${t.step.id}")`}
                            meta={opsOf(t.step).join(' · ')}
                            contentClassName="font-mono text-[11px]"
                          >
                            <pre>{JSON.stringify({ ...t.step, meta: undefined }, null, 2)}</pre>
                          </ChatSessionDisclosure>
                        </div>
                      )
                    }
                  >
                    <div className="flex flex-col gap-2">
                      {t.text.map((p, j) => {
                        if (!isLatest) return <p key={j}>{bold(p)}</p>;
                        const tokens = p.split(' ');
                        const shown = tokens.slice(0, Math.max(0, budget)).join(' ');
                        budget -= tokens.length;
                        return shown ? <p key={j}>{bold(shown)}</p> : null;
                      })}
                    </div>
                  </ChatSessionMessage>
                );
              })}
              {asides.map((t, i) => (
                <ChatSessionMessage key={`aside-${i}`} role={t.role}>
                  {t.role === 'user' ? t.text[0] : <p>{bold(t.text[0]!)}</p>}
                </ChatSessionMessage>
              ))}
              {typing && (
                <>
                  <ChatSessionMessage role="user">{typing}</ChatSessionMessage>
                  <ChatSessionMessage role="assistant" status="running" />
                </>
              )}
            </ChatSession>
          </div>
        </aside>
      </div>
    );
  }
};
