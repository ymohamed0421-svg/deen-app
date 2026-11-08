declare module 'magvar' {
  /** Magnetic declination in degrees (positive = magnetic north is east of true north), from WMM2025. */
  export function magvar(latitude: number, longitude: number, altitude?: number, when?: number | Date): number;
}
