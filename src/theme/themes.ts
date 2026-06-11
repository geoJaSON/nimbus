// Runtime UI themes — swap the phosphor CSS variables that global.css and
// tailwind.config.js reference. Warn/amber accent colors are intentionally
// not themed.

export type ThemeKey = 'GREEN' | 'AMBER' | 'CYAN' | 'GRAY';

interface ThemeVars {
  phosphor: string;
  dim: string;
  dark: string;
  glow: string;
  border: string;
  borderDim: string;
  rgb: string; // "r, g, b" triplet for rgba() shadows
}

export const THEMES: Record<ThemeKey, ThemeVars> = {
  GREEN: {
    phosphor: '#00ff41',
    dim: '#00b32c',
    dark: '#003a0f',
    glow: '#33ff66',
    border: '#1a4a1a',
    borderDim: '#0d2a0d',
    rgb: '0, 255, 65',
  },
  AMBER: {
    phosphor: '#ffb000',
    dim: '#c87800',
    dark: '#3a2a00',
    glow: '#ffc933',
    border: '#4a3a1a',
    borderDim: '#2a200d',
    rgb: '255, 176, 0',
  },
  CYAN: {
    phosphor: '#00e5ff',
    dim: '#0099b3',
    dark: '#00333a',
    glow: '#33eeff',
    border: '#1a444a',
    borderDim: '#0d262a',
    rgb: '0, 229, 255',
  },
  GRAY: {
    phosphor: '#e0e0e0',
    dim: '#909090',
    dark: '#2a2a2a',
    glow: '#ffffff',
    border: '#3a3a3a',
    borderDim: '#222222',
    rgb: '224, 224, 224',
  },
};

export function applyTheme(key: ThemeKey): void {
  const t = THEMES[key] ?? THEMES.GREEN;
  const root = document.documentElement.style;
  root.setProperty('--phosphor', t.phosphor);
  root.setProperty('--phosphor-dim', t.dim);
  root.setProperty('--phosphor-dark', t.dark);
  root.setProperty('--phosphor-glow', t.glow);
  root.setProperty('--terminal-border', t.border);
  root.setProperty('--terminal-border-dim', t.borderDim);
  root.setProperty('--phosphor-rgb', t.rgb);
}

export type FontSizeKey = 'S' | 'M' | 'L' | 'XL';

export const FONT_SIZES: Record<FontSizeKey, string> = {
  S: '12px',
  M: '13px',
  L: '15px',
  XL: '17px',
};

export function applyFontSize(key: FontSizeKey): void {
  document.documentElement.style.setProperty('--base-font', FONT_SIZES[key] ?? FONT_SIZES.M);
}
