export interface ColorStep {
  value: number;
  color: string;
}

export interface ColorTable {
  name: string;
  steps: ColorStep[];
}

export const NWS_REF: ColorTable = {
  name: 'NWS Standard',
  steps: [
    { value: 5,  color: '#646464' },
    { value: 10, color: '#04e9e7' },
    { value: 15, color: '#019ff4' },
    { value: 20, color: '#0300f4' },
    { value: 25, color: '#02fd02' },
    { value: 30, color: '#01c501' },
    { value: 35, color: '#008e00' },
    { value: 40, color: '#fdf802' },
    { value: 45, color: '#e5bc00' },
    { value: 50, color: '#fd9500' },
    { value: 55, color: '#fd0000' },
    { value: 60, color: '#d40000' },
    { value: 65, color: '#bc0000' },
    { value: 70, color: '#f800fd' },
    { value: 75, color: '#9854c6' },
    { value: 80, color: '#ffffff' },
  ],
};

export const NWS_REF_HI: ColorTable = {
  name: 'NWSRef (High Contrast)',
  steps: [
    { value: 5,  color: '#404040' },
    { value: 10, color: '#00e0e0' },
    { value: 15, color: '#0080ff' },
    { value: 20, color: '#0000e0' },
    { value: 25, color: '#00ff00' },
    { value: 30, color: '#00c800' },
    { value: 35, color: '#009600' },
    { value: 40, color: '#ffff00' },
    { value: 45, color: '#e0c000' },
    { value: 50, color: '#ff9600' },
    { value: 55, color: '#ff0000' },
    { value: 60, color: '#c80000' },
    { value: 65, color: '#960000' },
    { value: 70, color: '#ff00ff' },
    { value: 75, color: '#c000c0' },
    { value: 80, color: '#ffffff' },
  ],
};

export const PHOSPHOR_GREEN: ColorTable = {
  name: 'Phosphor Green',
  steps: [
    { value: 5,  color: '#001a00' },
    { value: 20, color: '#004d00' },
    { value: 30, color: '#008000' },
    { value: 40, color: '#00b300' },
    { value: 50, color: '#00e600' },
    { value: 60, color: '#33ff33' },
    { value: 70, color: '#99ff99' },
    { value: 80, color: '#ffffff' },
  ],
};

export const VELOCITY: ColorTable = {
  name: 'NWS Velocity',
  steps: [
    { value: -64, color: '#008000' },
    { value: -50, color: '#00c800' },
    { value: -36, color: '#00ff00' },
    { value: -20, color: '#aaffaa' },
    { value: -10, color: '#e0ffe0' },
    { value: 0,   color: '#808080' },
    { value: 10,  color: '#ffe0e0' },
    { value: 20,  color: '#ffaaaa' },
    { value: 36,  color: '#ff0000' },
    { value: 50,  color: '#c80000' },
    { value: 64,  color: '#800000' },
  ],
};

export const colorTables: Record<string, ColorTable> = {
  NWS_REF,
  NWS_REF_HI,
  PHOSPHOR_GREEN,
  VELOCITY,
};

export function dbzToColor(dbz: number, table: ColorTable): string {
  const steps = table.steps;
  if (dbz <= steps[0].value) return steps[0].color;
  if (dbz >= steps[steps.length - 1].value) return steps[steps.length - 1].color;
  for (let i = 1; i < steps.length; i++) {
    if (dbz <= steps[i].value) return steps[i - 1].color;
  }
  return steps[steps.length - 1].color;
}
