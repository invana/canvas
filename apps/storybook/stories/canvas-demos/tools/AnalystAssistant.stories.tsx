import { useCallback } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CanvasConfig, PlaybookSpec } from '@invana/canvas';
import { FocusBehaviour, TextResolutionLODBehaviour, type GraphCanvas, type GraphData } from '@invana/graph';
import { GraphCanvasApp, PlaybookViewPanel } from '@invana/canvas-ui';
import { D3HierarchyLayout } from '@invana/graph-layout-d3-hierarchy';
import { ElkLayout } from '@invana/graph-layout-elkjs';

const meta: Meta = {
  title: 'canvas-demos/tools/AnalystAssistant',
  parameters: { layout: 'fullscreen' }
};
export default meta;
type Story = StoryObj;

/**
 * **A structuring alert, walked through as a playbook.** `ACC-4471` is played as
 * seven JSON steps: the alert, follow the money, shared devices, the wider
 * network, who owns the business, trace to a person, and the loop closing back
 * on the transfer network. Fictional data.
 *
 * The story is three JSON values handed to `GraphCanvasApp` — no custom UI:
 *
 * - **`config`** — node look as template data (`nodeStructureTemplates` /
 *   `nodeStylingTemplates` / `nodeTypes`, incl. a `freeform` card for the
 *   ownership tree), behaviour and layout options, keyed by the app bundle's ids.
 * - **`data`** — empty; every node arrives through a step.
 * - **`playbook`** — the steps. Data lands as deltas (`data.added` / `hidden` /
 *   `shown`), `settings.activeLayout` swaps `ElkLayout` (layered, left → right)
 *   for `D3HierarchyLayout` (tidy tree) and back, and `view.focus` + `camera`
 *   frame each step through `FocusBehaviour`.
 *
 * `GraphCanvasApp` takes no children. The bundle has no ELK, tree, focus or
 * label-resolution, so `onReady` registers them by id; all their settings come
 * from `config`. Play it from the playbook panel on the right.
 */

/** Colours that carry meaning (entity kinds, the flag, focus). Everything else is the theme. */
const C = {
  account: 0x4f7fd9,
  device: 0xce8509,
  offramp: 0x8b5cf6,
  person: 0xe0703c,
  company: 0x1da54f,
  flag: 0xe05252,
  halo: 0x22b8d6
};

/** Every transfer-network node before the loop closes — hidden while the tree is up. */
const network = [
  'A0', 'I1', 'I2', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C', 'X', 'D1', 'D2',
  'L0', 'L1', 'L2', 'L3', 'L4', 'L5', 'L6', 'L7', 'L8', 'L9', 'L10', 'L11', 'L12', 'L13', 'L14', 'L15',
  'R0', 'R1', 'R2', 'R3', 'R4', 'R5'
];
/** The ownership tree — hidden again when the loop closes. */
const tree = ['R', 'B', 'TL', 'F', 'CV', 'EP', 'P', 'O', 'MH', 'IV'];

/** Nothing on the canvas until the first step. */
const data: GraphData = { nodes: [], edges: [] };

/** The case, as plain JSON steps. */
const playbook: PlaybookSpec<CanvasConfig> = {
  version: 1,
  title: 'Who is moving money through ACC-4471?',
  source: 'graph',
  steps: [
    {
      id: 'alert',
      title: 'The alert',
      narration: 'Six transfers left ACC-4471 in 36 hours, each just under the €10,000 reporting line — structuring. All six recipients were opened in the last 60 days.',
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
      view: { focus: { ids: ['A0', 'I1', 'I2', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6'], dim: false }, camera: 'focus' }
    },
    {
      id: 'follow',
      title: 'Follow the money',
      narration: 'Each recipient forwards almost everything to ACC-9012, which sends €56,900 to Kestrel Exchange the same day: fan-out, fan-in, cash-out.',
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
      view: { focus: { ids: ['A0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C', 'X'] }, camera: 'focus' }
    },
    {
      id: 'devices',
      title: 'Shared devices',
      narration: 'Two phones account for every login on the ring — the “unrelated” accounts look like one operator.',
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
      view: { focus: { ids: ['D1', 'D2', 'A0', 'M1', 'M2', 'M3', 'M4', 'M5', 'M6', 'C'] }, camera: 'focus' }
    },
    {
      id: 'context',
      title: 'The wider network',
      narration: 'Two hops out, the ring is a tight cluster: 7 repeats, 41 transfers, €412,600 in 19 days. The ordinary accounts around it share no devices.',
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
      view: { focus: null, camera: 'all' }
    },
    {
      id: 'owners',
      title: 'Who owns Halvard?',
      narration: 'Halvard Trading Ltd is 60% owned by Brightmoor Ventures LLP, itself held by two more companies. No person crosses 25% at this depth.',
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
      view: { focus: null, camera: 'visible' }
    },
    {
      id: 'ubo',
      title: 'Trace to a person',
      narration: 'The main branch ends at Danielle Okafor, settlor and beneficiary of Pellucid Trust: 60% × 80% × 100% = 48% effective control, across UK, LU and CY.',
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
      view: { focus: { ids: ['R', 'B', 'CV', 'P', 'O'] }, camera: 'focus' }
    },
    {
      id: 'loop',
      title: 'The loop closes',
      narration: 'She also holds ACC-2207, one of the six recipients, and device 8F:2A is registered to her — money left her business and came back to her.',
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
      view: { focus: { ids: ['PO', 'A0', 'M1', 'D1', 'C', 'X'] }, camera: 'focus' }
    }
  ]
};

/** The whole canvas config, deep-merged by `GraphCanvasApp` over its bundle defaults. */
const config = {
  fitOnLoad: false,
  activeLayout: 'elk',
  layers: {
    background: { type: 'pattern', patternType: 'dots', size: 1.5, spacing: 24, alpha: 0.85 },
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
          dimmed: { bgAlpha: 0.2, labelAlpha: 0.25 }
        }
      },
      // One look for every edge: per-type edge styling has no template registry yet.
      edge: {
        style: { shape: { pathType: 'quadratic' }, strokeColor: 0x94a3b8, strokeWidth: 1.2, strokeAlpha: 0.7, arrowTargetShape: 'triangle', arrowTargetSize: 6 },
        state: {
          highlighted: { strokeColor: C.halo, strokeWidth: 2.2, strokeAlpha: 0.95 },
          dimmed: { strokeAlpha: 0.15 }
        }
      }
    }
  },
  behaviours: {
    // Nodes are coloured by their templates; nothing else may recolour them.
    color: { enabled: false },
    // The step's focus owns the highlight.
    hover: { enabled: false },
    focus: { enabled: true, frameDurationMs: 1100, framePadding: 80, frameMaxZoom: 1.6 },
    // Re-rasterise labels above screen resolution so the 1.6× focus zoom stays crisp.
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
    elk: {
      algorithm: 'layered',
      direction: 'RIGHT',
      nodeSpacing: 36,
      layerSpacing: 120,
      defaultNodeSize: { width: 28, height: 28 },
      transition: 900,
      transitionEase: 'easeInOutCubic',
      // Keeps the recipients in arrival order as later steps add nodes.
      layoutOptions: { 'elk.layered.considerModelOrder.strategy': 'NODES_AND_EDGES' }
    },
    tree: { mode: 'tree', orientation: 'horizontal', nodeSize: [80, 250], rootId: 'R', transition: 900, transitionEase: 'easeInOutCubic' }
  }
} as unknown as CanvasConfig;

export const AnalystAssistantStory: Story = {
  name: 'AnalystAssistant',
  render: function AnalystAssistantRender() {
    // The app bundle has no ELK, tree, focus or label-resolution, so register them here
    // by id, then hand them their slices of `config`, which stays the only settings input.
    const onReady = useCallback((canvas: GraphCanvas | null) => {
      if (!canvas) return;
      canvas.layouts.add(new ElkLayout({ id: 'elk', targetLayerId: 'graph', onData: { preserveCamera: true } }));
      canvas.layouts.add(new D3HierarchyLayout({ id: 'tree', targetLayerId: 'graph', onData: { preserveCamera: true } }));
      canvas.behaviours.register(new FocusBehaviour({ id: 'focus', targetLayerId: 'graph' }));
      canvas.behaviours.register(new TextResolutionLODBehaviour({ id: 'label-resolution', targetLayerId: 'graph' }));
      // Config only reaches instances registered when it is applied, so re-apply it for these.
      canvas.update({
        layouts: config.layouts,
        behaviours: { focus: config.behaviours!.focus!, 'label-resolution': config.behaviours!['label-resolution']! },
        activeLayout: config.activeLayout
      });
      void canvas.playbook.load(playbook);
    }, []);

    return (
      <GraphCanvasApp
        data={data}
        config={config}
        onReady={onReady}
        header={{ title: 'Case 2026-1184 · structuring alert on ACC-4471' }}
        right={{ content: (ctx) => <PlaybookViewPanel canvas={ctx.canvas} className="h-full" />, defaultSize: 28 }}
      />
    );
  }
};
