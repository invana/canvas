/**
 * Color utilities
 */

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface RGBA extends RGB {
  a: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface HSLA extends HSL {
  a: number;
}

export const color = {
  /**
   * Parse a hex color string to RGB
   */
  hexToRgb(hex: string): RGB | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
      // Try 3-digit hex
      const shortResult = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
      if (!shortResult) return null;
      return {
        r: parseInt(shortResult[1]! + shortResult[1]!, 16),
        g: parseInt(shortResult[2]! + shortResult[2]!, 16),
        b: parseInt(shortResult[3]! + shortResult[3]!, 16),
      };
    }
    return {
      r: parseInt(result[1]!, 16),
      g: parseInt(result[2]!, 16),
      b: parseInt(result[3]!, 16),
    };
  },

  /**
   * Convert RGB to hex
   */
  rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  },

  /**
   * Convert RGB to HSL
   */
  rgbToHsl(r: number, g: number, b: number): HSL {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  },

  /**
   * Convert HSL to RGB
   */
  hslToRgb(h: number, s: number, l: number): RGB {
    h /= 360;
    s /= 100;
    l /= 100;

    let r: number, g: number, b: number;

    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }

    return {
      r: Math.round(r * 255),
      g: Math.round(g * 255),
      b: Math.round(b * 255),
    };
  },

  /**
   * Lighten a color
   */
  lighten(hex: string, amount: number): string {
    const rgb = color.hexToRgb(hex);
    if (!rgb) return hex;

    const hsl = color.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.min(100, hsl.l + amount);

    const newRgb = color.hslToRgb(hsl.h, hsl.s, hsl.l);
    return color.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  },

  /**
   * Darken a color
   */
  darken(hex: string, amount: number): string {
    const rgb = color.hexToRgb(hex);
    if (!rgb) return hex;

    const hsl = color.rgbToHsl(rgb.r, rgb.g, rgb.b);
    hsl.l = Math.max(0, hsl.l - amount);

    const newRgb = color.hslToRgb(hsl.h, hsl.s, hsl.l);
    return color.rgbToHex(newRgb.r, newRgb.g, newRgb.b);
  },

  /**
   * Mix two colors
   */
  mix(hex1: string, hex2: string, amount = 0.5): string {
    const rgb1 = color.hexToRgb(hex1);
    const rgb2 = color.hexToRgb(hex2);
    if (!rgb1 || !rgb2) return hex1;

    return color.rgbToHex(
      Math.round(rgb1.r + (rgb2.r - rgb1.r) * amount),
      Math.round(rgb1.g + (rgb2.g - rgb1.g) * amount),
      Math.round(rgb1.b + (rgb2.b - rgb1.b) * amount),
    );
  },

  /**
   * Get the luminance of a color (0-1)
   */
  luminance(hex: string): number {
    const rgb = color.hexToRgb(hex);
    if (!rgb) return 0;

    const toLinear = (c: number) => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    };

    return (
      0.2126 * toLinear(rgb.r) +
      0.7152 * toLinear(rgb.g) +
      0.0722 * toLinear(rgb.b)
    );
  },

  /**
   * Check if a color is dark
   */
  isDark(hex: string): boolean {
    return color.luminance(hex) < 0.5;
  },

  /**
   * Check if a color is light
   */
  isLight(hex: string): boolean {
    return !color.isDark(hex);
  },

  /**
   * Get contrasting text color (black or white)
   */
  contrastText(hex: string): string {
    return color.isDark(hex) ? '#ffffff' : '#000000';
  },

  /**
   * Calculate contrast ratio between two colors
   */
  contrastRatio(hex1: string, hex2: string): number {
    const l1 = color.luminance(hex1);
    const l2 = color.luminance(hex2);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Convert color to RGBA string
   */
  toRgba(hex: string, alpha = 1): string {
    const rgb = color.hexToRgb(hex);
    if (!rgb) return `rgba(0, 0, 0, ${alpha})`;
    return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
  },

  /**
   * Generate a color from a string (hash-based)
   */
  fromString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
      hash = hash & hash;
    }

    const h = Math.abs(hash) % 360;
    return color.rgbToHex(...Object.values(color.hslToRgb(h, 70, 50)) as [number, number, number]);
  },

  /**
   * Generate a palette of colors
   */
  palette(baseHex: string, count: number): string[] {
    const rgb = color.hexToRgb(baseHex);
    if (!rgb) return [baseHex];

    const hsl = color.rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors: string[] = [];

    for (let i = 0; i < count; i++) {
      const h = (hsl.h + (360 / count) * i) % 360;
      const newRgb = color.hslToRgb(h, hsl.s, hsl.l);
      colors.push(color.rgbToHex(newRgb.r, newRgb.g, newRgb.b));
    }

    return colors;
  },
};
