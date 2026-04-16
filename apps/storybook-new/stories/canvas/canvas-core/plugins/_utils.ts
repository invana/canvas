// Shared helpers for background plugin stories
import { DrawingPlugin } from '@invana/canvas-core-new';

export const PALETTE = [
  '#4fc3f7', '#81c784', '#ffb74d', '#f06292',
  '#ce93d8', '#4dd0e1', '#aed581', '#ff8a65',
];

export function drawScatter(draw: DrawingPlugin, w: number, h: number): void {
  const shapes = [
    { x: w * 0.2,  y: h * 0.3,  r: 40, type: 'circle'  },
    { x: w * 0.5,  y: h * 0.25, r: 35, type: 'rect'    },
    { x: w * 0.8,  y: h * 0.3,  r: 38, type: 'circle'  },
    { x: w * 0.15, y: h * 0.65, r: 42, type: 'polygon' },
    { x: w * 0.45, y: h * 0.7,  r: 36, type: 'star'    },
    { x: w * 0.75, y: h * 0.68, r: 40, type: 'polygon' },
  ];
  shapes.forEach(({ x, y, r, type }, i) => {
    const fill = PALETTE[i % PALETTE.length]!;
    const stroke = 'rgba(0,0,0,0.4)';
    if (type === 'circle')  draw.circle(x, y, r, { fill, stroke, strokeWidth: 2 });
    if (type === 'rect')    draw.rect(x - r, y - r * 0.7, r * 2, r * 1.4, { fill, stroke, strokeWidth: 2, cornerRadius: 10 });
    if (type === 'polygon') draw.polygon(x, y, r, 6, { fill, stroke, strokeWidth: 2 });
    if (type === 'star')    draw.star(x, y, r, { fill, stroke, strokeWidth: 2 });
  });
}
