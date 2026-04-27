/**
 * DrawingPlugin — Circuit Board
 *
 * A PCB schematic built entirely with DrawingPlugin primitives.
 *
 * ── WHAT'S DEMONSTRATED ─────────────────────────────────────────────────────
 * • rect + polygon            IC chip bodies and capacitors (SMD & electrolytic)
 * • orthogonal paths          PCB copper traces — the killer feature: right-angle
 *                             routed wires that almost no other canvas demo shows
 * • roundedOrthogonal paths   Production-grade rounded-corner traces
 * • arrowHead                 Signal direction on EVERY wire — ALL 9 types used:
 *                               triangle · triangleOutline · thinTriangle
 *                               diamond  · diamondOutline
 *                               square   · squareOutline
 *                               circle   · circleOutline
 * • dashedLine                Parallel data bus (bottom of board)
 * • dottedLine                Address bus (right edge) + clock trace
 * • circleGlow + dottedCircle Solder pads, through-hole vias, active nodes
 * • selectionHighlight        Active CPU chip
 * ────────────────────────────────────────────────────────────────────────────
 *
 * ── ARCHITECTURAL NOTE ──────────────────────────────────────────────────────
 * DrawingPlugin renders ALL shapes onto a SINGLE shared PixiJS Graphics object.
 *   • No per-shape identity — clear() wipes the entire canvas in one call
 *   • Suitable for: static diagrams, decorative overlays, schematics
 *   • NOT suitable for: interactive nodes/edges (use graph-canvas for that)
 * ────────────────────────────────────────────────────────────────────────────
 */

import type { Meta, StoryObj } from '@storybook/html-vite';
import { Canvas, DrawingPlugin } from '@invana/canvas';
import { createContainer } from '../../../../../src/div-utils.js';

const meta: Meta = {
  title: '5. Layers & Overlays/Drawing',
};
export default meta;
type Story = StoryObj;

export const CircuitBoard: Story = {
  name: 'Circuit Board',
  render: () => createContainer(),
  play: async () => {
    const container = document.getElementById('canvas-example');
    if (!container) return;

    const W = container.clientWidth  || 820;
    const H = container.clientHeight || 580;

    const canvas = new Canvas({
      container,
      width:  W,
      height: H,
      backgroundColor: '#060d06',
    });
    await canvas.init();

    const draw = new DrawingPlugin({ key: 'circuit-board', zIndex: 10 });
    await canvas.plugins.register(draw);

    // ── PCB substrate ──────────────────────────────────────────────────────
    draw.rect(20, 20, W - 40, H - 40, {
      fill: '#0c1f0e',
      stroke: '#1d5526',
      strokeWidth: 2,
      cornerRadius: 8,
    });

    // ── Faint PCB construction grid ────────────────────────────────────────
    for (let x = 60; x < W - 20; x += 40) {
      draw.line(x, 20, x, H - 20, { stroke: '#122814', strokeWidth: 1, strokeAlpha: 0.55 });
    }
    for (let y = 60; y < H - 20; y += 40) {
      draw.line(20, y, W - 20, y, { stroke: '#122814', strokeWidth: 1, strokeAlpha: 0.55 });
    }

    // ── Chip bounding boxes ────────────────────────────────────────────────
    const CPU = { x: 280, y: 205, w: 150, h: 95 };  // center ≈ (355, 252)
    const RAM = { x: 520, y:  90, w: 120, h: 68 };  // center ≈ (580, 124)
    const IO  = { x:  65, y: 280, w: 110, h: 80 };  // center ≈ (120, 320)
    const PWR = { x: 580, y: 368, w: 100, h: 58 };  // center ≈ (630, 397)
    const GPU = { x: 260, y: 408, w: 120, h: 68 };  // center ≈ (320, 442)

    // ── selectionHighlight: CPU is the active chip ─────────────────────────
    draw.selectionHighlight(
      CPU.x - 8, CPU.y - 8, CPU.w + 16, CPU.h + 16,
      { color: '#4af080', alpha: 0.22 }, 8,
    );

    // ── IC chip helper: body + side/top/bottom pin stubs ──────────────────
    function drawIC(
      x: number, y: number, w: number, h: number,
      label: string, color: string, sidePins = 3,
    ): void {
      draw.rect(x, y, w, h, {
        fill: '#152018', stroke: color, strokeWidth: 1.5, cornerRadius: 3,
      });
      const pinStep = h / (sidePins + 1);
      for (let i = 1; i <= sidePins; i++) {
        const py = y + pinStep * i;
        draw.line(x - 12, py, x, py, { stroke: color, strokeWidth: 1.5, strokeAlpha: 0.55 });
        draw.line(x + w, py, x + w + 12, py, { stroke: color, strokeWidth: 1.5, strokeAlpha: 0.55 });
      }
      const tPins = Math.ceil(sidePins / 2);
      const tStep = w / (tPins + 1);
      for (let i = 1; i <= tPins; i++) {
        const px = x + tStep * i;
        draw.line(px, y - 12, px, y, { stroke: color, strokeWidth: 1.5, strokeAlpha: 0.55 });
        draw.line(px, y + h, px, y + h + 12, { stroke: color, strokeWidth: 1.5, strokeAlpha: 0.55 });
      }
      draw.label(label, x + w / 2, y + h / 2 - 6, { color, fontSize: 12, align: 'center' });
    }

    drawIC(CPU.x, CPU.y, CPU.w, CPU.h, 'CPU', '#4af080', 4);
    drawIC(RAM.x, RAM.y, RAM.w, RAM.h, 'RAM', '#40c8e0', 3);
    drawIC(IO.x,  IO.y,  IO.w,  IO.h,  'I/O', '#e0c040', 3);
    drawIC(PWR.x, PWR.y, PWR.w, PWR.h, 'PWR', '#e05840', 2);
    drawIC(GPU.x, GPU.y, GPU.w, GPU.h, 'GPU', '#9840e0', 3);

    // ── Capacitors: 6-sided = electrolytic barrel, 4-sided = SMD package ──
    draw.polygon(PWR.x - 28, PWR.y + PWR.h / 2, 11, 6,
      { fill: '#1a2818', stroke: '#c0aa30', strokeWidth: 1.5 });
    draw.label('C1', PWR.x - 28, PWR.y + PWR.h / 2 + 15, { color: '#c0aa30', fontSize: 9, align: 'center' });

    draw.polygon(PWR.x - 53, PWR.y + PWR.h / 2, 11, 6,
      { fill: '#1a2818', stroke: '#c0aa30', strokeWidth: 1.5 });
    draw.label('C2', PWR.x - 53, PWR.y + PWR.h / 2 + 15, { color: '#c0aa30', fontSize: 9, align: 'center' });

    draw.polygon(RAM.x + RAM.w + 28, RAM.y + RAM.h / 2, 9, 4,
      { fill: '#1a2818', stroke: '#40c8e0', strokeWidth: 1.5 });
    draw.label('C3', RAM.x + RAM.w + 28, RAM.y + RAM.h / 2 + 14, { color: '#40c8e0', fontSize: 9, align: 'center' });

    draw.polygon(CPU.x + CPU.w + 26, CPU.y + 22, 9, 4,
      { fill: '#1a2818', stroke: '#4af080', strokeWidth: 1.5 });
    draw.label('C4', CPU.x + CPU.w + 26, CPU.y + 35, { color: '#4af080', fontSize: 9, align: 'center' });

    draw.polygon(GPU.x + GPU.w + 24, GPU.y + GPU.h / 2, 10, 6,
      { fill: '#1a2818', stroke: '#9840e0', strokeWidth: 1.5 });
    draw.label('C5', GPU.x + GPU.w + 24, GPU.y + GPU.h / 2 + 14, { color: '#9840e0', fontSize: 9, align: 'center' });

    // ── Through-hole vias at wire bends (circleGlow + dottedCircle) ────────
    function drawVia(x: number, y: number, color: string): void {
      draw.circleGlow({ x, y, radius: 5, glowSize: 9 }, { color, alpha: 0.55 });
      draw.dottedCircle(x, y, 5, { color, strokeWidth: 1.5, dotSpacing: 5 });
    }

    drawVia(485, 240, '#00ffaa');   // CPU→RAM bend
    drawVia(590, 269, '#ffdd00');   // RAM→PWR bend
    drawVia(625, 265, '#ff9920');   // CPU→PWR bend

    // ── Board-edge solder pads ─────────────────────────────────────────────
    // J1 — header connector at top (destination of Wire 8)
    const J1 = { x: 355, y: 55 };
    draw.circleGlow({ x: J1.x, y: J1.y, radius: 10, glowSize: 14 }, { color: '#4af080', alpha: 0.45 });
    draw.dottedCircle(J1.x, J1.y, 10, { color: '#4af080', strokeWidth: 2, dotSpacing: 7 });
    draw.label('J1', J1.x + 16, J1.y - 7, { color: '#4af080', fontSize: 9 });

    // P1 — edge via at left (destination of Wire 9)
    const P1 = { x: 36, y: 318 };
    draw.circleGlow({ x: P1.x, y: P1.y, radius: 8, glowSize: 12 }, { color: '#e0c040', alpha: 0.45 });
    draw.dottedCircle(P1.x, P1.y, 8, { color: '#e0c040', strokeWidth: 2, dotSpacing: 6 });
    draw.label('P1', P1.x + 14, P1.y - 6, { color: '#e0c040', fontSize: 9 });

    // ══════════════════════════════════════════════════════════════════════
    // WIRES — each uses a different arrowHead type (9 total)
    // Convention:  targetDirection tells which SIDE of the target chip the
    // wire enters; the arrowHead angle is the direction of travel at that tip.
    //   left  → angle = 0          (arrives going →)
    //   right → angle = Math.PI    (arrives going ←)
    //   top   → angle = Math.PI/2  (arrives going ↓)
    //   bottom→ angle = -Math.PI/2 (arrives going ↑)
    // ══════════════════════════════════════════════════════════════════════

    // ── Wire 1 · CPU_right → RAM_left ────────────────────────── triangle ─
    // Path: (440,240)→(485,240)→(485,124)→(520,124)
    draw.orthogonal(
      { from: { x: 440, y: 240 }, to: { x: 520, y: 124 },
        sourceDirection: 'right', targetDirection: 'left' },
      { stroke: '#00ffaa', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 520, y: 124, angle: 0, size: 11 }, 'triangle',
      { fill: '#00ffaa', fillAlpha: 1 });
    draw.label('triangle', 462, 228, { color: '#00ffaa', fontSize: 9, align: 'center' });

    // ── Wire 2 · I/O_right → CPU_left ────────────────── triangleOutline ─
    // Path: (175,318)→(228,318)→(228,247)→(280,247)
    draw.roundedOrthogonal(
      { from: { x: 175, y: 318 }, to: { x: 280, y: 247 },
        sourceDirection: 'right', targetDirection: 'left', cornerRadius: 12 },
      { stroke: '#e0c040', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 280, y: 247, angle: 0, size: 11 }, 'triangleOutline',
      { stroke: '#e0c040', strokeWidth: 1.5 });
    draw.label('triangleOutline', 228, 306, { color: '#e0c040', fontSize: 9, align: 'center' });

    // ── Wire 3 · CPU_bottom → GPU_top ─────────────────────── thinTriangle ─
    // Path: (340,300)→(340,356)→(325,356)→(325,408)
    draw.orthogonal(
      { from: { x: 340, y: 300 }, to: { x: 325, y: 408 },
        sourceDirection: 'bottom', targetDirection: 'top' },
      { stroke: '#9840e0', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 325, y: 408, angle: Math.PI / 2, size: 11 }, 'thinTriangle',
      { fill: '#9840e0', fillAlpha: 1 });
    draw.label('thinTriangle', 358, 355, { color: '#9840e0', fontSize: 9, align: 'center' });

    // ── Wire 4 · CPU_right → PWR_top ──────────────────────────── diamond ─
    // isH(right)&&isV(top): waypoint → (625,268) then down
    // Path: (430,268)→(625,268)→(625,368)
    draw.roundedOrthogonal(
      { from: { x: 430, y: 268 }, to: { x: 625, y: 368 },
        sourceDirection: 'right', targetDirection: 'top', cornerRadius: 14 },
      { stroke: '#ff9920', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 625, y: 368, angle: Math.PI / 2, size: 11 }, 'diamond',
      { fill: '#ff9920', fillAlpha: 1 });
    draw.label('diamond', 548, 256, { color: '#ff9920', fontSize: 9, align: 'center' });

    // ── Wire 5 · PWR_left → GPU_right ─────────────────────── diamondOutline
    // Path: (580,397)→(488,397)→(488,442)→(380,442)
    draw.orthogonal(
      { from: { x: 580, y: 397 }, to: { x: 380, y: 442 },
        sourceDirection: 'left', targetDirection: 'right' },
      { stroke: '#ff3366', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 380, y: 442, angle: Math.PI, size: 11 }, 'diamondOutline',
      { stroke: '#ff3366', strokeWidth: 1.5 });
    draw.label('diamondOutline', 488, 385, { color: '#ff3366', fontSize: 9, align: 'center' });

    // ── Wire 6 · RAM_bottom → PWR_top ──────────────────────────── square ─
    // isV(bottom)&&isV(top): midY=269
    // Path: (580,158)→(580,269)→(650,269)→(650,368)
    draw.orthogonal(
      { from: { x: 580, y: 158 }, to: { x: 650, y: 368 },
        sourceDirection: 'bottom', targetDirection: 'top' },
      { stroke: '#ffdd00', strokeWidth: 2.5 },
    );
    draw.arrowHead({ x: 650, y: 368, angle: Math.PI / 2, size: 11 }, 'square',
      { fill: '#ffdd00', fillAlpha: 1 });
    draw.label('square', 557, 268, { color: '#ffdd00', fontSize: 9, align: 'center' });

    // ── Wire 7 · GPU_bottom → I/O_bottom ────────────────────── squareOutline
    // srcDir===tgtDir='bottom': oy = max(476,360)+30 = 506
    // Path: (290,476)→(290,506)→(120,506)→(120,360)
    draw.roundedOrthogonal(
      { from: { x: 290, y: 476 }, to: { x: 120, y: 360 },
        sourceDirection: 'bottom', targetDirection: 'bottom', cornerRadius: 12 },
      { stroke: '#44aaff', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 120, y: 360, angle: -Math.PI / 2, size: 11 }, 'squareOutline',
      { stroke: '#44aaff', strokeWidth: 1.5 });
    draw.label('squareOutline', 200, 510, { color: '#44aaff', fontSize: 9, align: 'center' });

    // ── Wire 8 · CPU_top → header J1 ─────────────────────────────── circle
    // srcDir='top', tgtDir='bottom': degenerate straight line going up
    // Path: (355,205)→(355,65)
    draw.orthogonal(
      { from: { x: 355, y: 205 }, to: { x: 355, y: 65 },
        sourceDirection: 'top', targetDirection: 'bottom' },
      { stroke: '#4af080', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 355, y: 65, angle: -Math.PI / 2, size: 11 }, 'circle',
      { fill: '#4af080', fillAlpha: 0.9, stroke: '#4af080', strokeWidth: 1 });
    draw.label('circle', 372, 128, { color: '#4af080', fontSize: 9 });

    // ── Wire 9 · I/O_left → edge via P1 ──────────────────── circleOutline ─
    // srcDir='left', auto tgtDir='right': degenerate straight line going left
    // Path: (65,318)→(44,318)
    draw.orthogonal(
      { from: { x: 65, y: 318 }, to: { x: 44, y: 318 },
        sourceDirection: 'left' },
      { stroke: '#e0c040', strokeWidth: 2 },
    );
    draw.arrowHead({ x: 44, y: 318, angle: Math.PI, size: 11 }, 'circleOutline',
      { stroke: '#e0c040', strokeWidth: 1.5 });
    draw.label('circleOutline', 54, 305, { color: '#e0c040', fontSize: 9, align: 'center' });

    // ══════════════════════════════════════════════════════════════════════
    // DATA BUSES — dashed & dotted lines for parallel signal buses
    // ══════════════════════════════════════════════════════════════════════

    // Horizontal data bus at bottom of board (dashed)
    const busY = H - 62;
    draw.dashedLine(50, busY, W - 55, busY,
      { color: '#2a5a2a', strokeWidth: 2.5, alpha: 0.75, dashLength: 12, gapLength: 6 });
    draw.label('── DATA BUS ──', W / 2, busY + 5, { color: '#1e4820', fontSize: 10, align: 'center' });

    // Vertical address bus at right edge of board (dotted)
    const busX = W - 58;
    draw.dottedLine(busX, 50, busX, H - 50,
      { color: '#223344', strokeWidth: 3, alpha: 0.7, dotSpacing: 10 });
    draw.label('ADDR', busX - 32, H / 2, { color: '#1a2a38', fontSize: 9 });

    // Clock trace near top (dotted, I/O→CPU)
    draw.dottedLine(55, 175, 260, 175,
      { color: '#332244', strokeWidth: 2, alpha: 0.65, dotSpacing: 8 });
    draw.label('CLK', 157, 163, { color: '#28183a', fontSize: 9, align: 'center' });

    // ── Board markings ─────────────────────────────────────────────────────
    draw.label('INVANA CANVAS  ·  PCB SCHEMATIC  ·  REV 2.1', W / 2, H - 36,
      { color: '#184a20', fontSize: 10, align: 'center' });
  },
};
