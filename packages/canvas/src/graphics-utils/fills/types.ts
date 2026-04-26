import type { Texture } from 'pixi.js';

export interface ColorStop {
  offset: number;
  color: string | number;
}

export interface LinearGradientFill {
  type: 'linear';
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  stops: ColorStop[];
  alpha?: number;
}

export interface RadialGradientFill {
  type: 'radial';
  x: number;
  y: number;
  radius: number;
  stops: ColorStop[];
  alpha?: number;
}

export interface ImageFill {
  type: 'image';
  src: string | Texture;
  fit?: 'fill' | 'contain' | 'cover' | 'none';
  alignX?: number;
  alignY?: number;
  alpha?: number;
  tint?: string | number;
}

export interface FillBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}
