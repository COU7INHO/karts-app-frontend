// Track layout drawings live in /public/circuits, keyed by circuit id.
// Circuits without an entry simply show no drawing.
const LAYOUTS: Record<number, string> = {
  2: '/circuits/kartcenter-matosinhos.webp',
  3: '/circuits/cabo-do-mundo.webp',
};

export const getCircuitLayout = (id: number): string | undefined => LAYOUTS[id];
