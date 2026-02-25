export const PRIMARY_L = 0.82;
export const PRIMARY_C = 0.01;
export const DEFAULT_HUE = 0;
export const SATURATED_C = 0.19;

/** Convert OKLCH to hex string (e.g. "#8BE83B"). */
export function oklchToHex(L: number, C: number, h: number): string {
  // OKLCH → OKLab
  const hRad = (h * Math.PI) / 180;
  const a = C * Math.cos(hRad);
  const b = C * Math.sin(hRad);

  // OKLab → linear sRGB
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.2914855480 * b;

  const l3 = l_ * l_ * l_;
  const m3 = m_ * m_ * m_;
  const s3 = s_ * s_ * s_;

  const r = +4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
  const g = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
  const bv = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

  // Linear sRGB → sRGB (gamma)
  const toSrgb = (x: number) => {
    const clamped = Math.max(0, Math.min(1, x));
    return clamped <= 0.0031308
      ? clamped * 12.92
      : 1.055 * Math.pow(clamped, 1 / 2.4) - 0.055;
  };

  const toHex = (x: number) =>
    Math.round(Math.max(0, Math.min(255, x * 255)))
      .toString(16)
      .padStart(2, "0");

  return `#${toHex(toSrgb(r))}${toHex(toSrgb(g))}${toHex(toSrgb(bv))}`.toUpperCase();
}

/** Get the primary accent hex for a given hue and optional chroma. */
export function primaryHexForHue(hue: number, chroma: number = PRIMARY_C): string {
  return oklchToHex(PRIMARY_L, chroma, hue);
}

/** Parse hex "#RRGGBB" to { r, g, b } (0-255). */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const n = parseInt(hex.replace("#", ""), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}
