import { Assets, Texture } from 'pixi.js';
import type { Graphics } from 'pixi.js';
import type { FillBounds } from './types.js';

export function calculateImageMatrix(
  texture: Texture,
  bounds: FillBounds,
  fit: 'fill' | 'contain' | 'cover' | 'none' = 'cover',
  alignX = 0.5,
  alignY = 0.5,
): { scaleX: number; scaleY: number; offsetX: number; offsetY: number } {
  if (!texture || !texture.width || !texture.height) {
    return { scaleX: 1, scaleY: 1, offsetX: bounds.x, offsetY: bounds.y };
  }

  const imgW = texture.width;
  const imgH = texture.height;
  const imgRatio = imgW / imgH;
  const bRatio = bounds.width / bounds.height;

  let fw = bounds.width;
  let fh = bounds.height;

  switch (fit) {
    case 'contain':
      if (imgRatio > bRatio) { fw = bounds.width; fh = bounds.width / imgRatio; }
      else { fh = bounds.height; fw = bounds.height * imgRatio; }
      break;
    case 'cover':
      if (imgRatio > bRatio) { fh = bounds.height; fw = bounds.height * imgRatio; }
      else { fw = bounds.width; fh = bounds.width / imgRatio; }
      break;
    case 'none':
      fw = imgW; fh = imgH;
      break;
  }

  return {
    scaleX: fw / imgW,
    scaleY: fh / imgH,
    offsetX: bounds.x + (bounds.width - fw) * alignX,
    offsetY: bounds.y + (bounds.height - fh) * alignY,
  };
}

export async function loadImageTexture(url: string): Promise<Texture | null> {
  try {
    const tex = await Assets.load<Texture>(url);
    return tex?.width && tex?.height ? tex : null;
  } catch {
    return null;
  }
}

export function applyImageFill(
  graphics: Graphics,
  texture: Texture,
  bounds: FillBounds,
  options: { fit?: 'fill' | 'contain' | 'cover' | 'none'; alignX?: number; alignY?: number; alpha?: number; tint?: number } = {},
): void {
  const { fit = 'cover', alignX = 0.5, alignY = 0.5, alpha = 1, tint = 0xffffff } = options;
  const m = calculateImageMatrix(texture, bounds, fit, alignX, alignY);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (graphics as any).fill({
    texture,
    alpha,
    color: tint,
    matrix: { a: m.scaleX, b: 0, c: 0, d: m.scaleY, tx: m.offsetX, ty: m.offsetY },
  });
}
