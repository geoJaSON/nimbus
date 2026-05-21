export const colors = {
  phosphor: '#00ff41',
  phosphorDim: '#00b32c',
  phosphorDark: '#003a0f',
  phosphorGlow: '#33ff66',
  terminal: '#000000',
  terminalSurface: '#080808',
  terminalBorder: '#1a4a1a',
  amber: '#ffb000',
  amberDim: '#c87800',
  warnTornado: '#ff0000',
  warnSvr: '#ff8800',
  warnWatch: '#ff6600',
  warnFlood: '#00ff00',
} as const;

export const fonts = {
  mono: '"Share Tech Mono", "Courier New", Courier, monospace',
} as const;

export const alertColors: Record<string, string> = {
  'Tornado Warning': colors.warnTornado,
  'Tornado Watch': colors.warnWatch,
  'Severe Thunderstorm Warning': colors.warnSvr,
  'Severe Thunderstorm Watch': colors.warnWatch,
  'Flash Flood Warning': colors.warnFlood,
  'Flash Flood Watch': '#00cc00',
  default: colors.amber,
};
