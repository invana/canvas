/**
 * Math utilities
 */

export const math = {
  /**
   * Clamp a value between min and max
   */
  clamp(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Linear interpolation
   */
  lerp(a: number, b: number, t: number): number {
    return a + (b - a) * t;
  },

  /**
   * Inverse linear interpolation
   */
  inverseLerp(a: number, b: number, value: number): number {
    return (value - a) / (b - a);
  },

  /**
   * Remap a value from one range to another
   */
  remap(
    value: number,
    inMin: number,
    inMax: number,
    outMin: number,
    outMax: number,
  ): number {
    const t = math.inverseLerp(inMin, inMax, value);
    return math.lerp(outMin, outMax, t);
  },

  /**
   * Convert degrees to radians
   */
  degToRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  },

  /**
   * Convert radians to degrees
   */
  radToDeg(radians: number): number {
    return radians * (180 / Math.PI);
  },

  /**
   * Check if a number is approximately equal to another
   */
  approximately(a: number, b: number, epsilon = 0.0001): boolean {
    return Math.abs(a - b) < epsilon;
  },

  /**
   * Round to a specific number of decimal places
   */
  round(value: number, decimals = 0): number {
    const factor = Math.pow(10, decimals);
    return Math.round(value * factor) / factor;
  },

  /**
   * Smooth step interpolation
   */
  smoothStep(edge0: number, edge1: number, x: number): number {
    const t = math.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  },

  /**
   * Smoother step interpolation
   */
  smootherStep(edge0: number, edge1: number, x: number): number {
    const t = math.clamp((x - edge0) / (edge1 - edge0), 0, 1);
    return t * t * t * (t * (t * 6 - 15) + 10);
  },

  /**
   * Wrap a value around a range
   */
  wrap(value: number, min: number, max: number): number {
    const range = max - min;
    return min + ((((value - min) % range) + range) % range);
  },

  /**
   * Generate a random number in a range
   */
  random(min = 0, max = 1): number {
    return min + Math.random() * (max - min);
  },

  /**
   * Generate a random integer in a range (inclusive)
   */
  randomInt(min: number, max: number): number {
    return Math.floor(math.random(min, max + 1));
  },

  /**
   * Sign of a number
   */
  sign(value: number): -1 | 0 | 1 {
    if (value > 0) return 1;
    if (value < 0) return -1;
    return 0;
  },
};
