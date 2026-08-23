/**
 * @file App movil/GestionSaludExpo/src/theme/colors.ts
 * @description TypeScript module implementation.
 */

export const appColors = {
  background: '#071120',
  backgroundMuted: '#0D1B2A',
  surface: '#132238',
  surfaceStrong: '#182A44',
  border: '#27496D',
  borderStrong: '#1B3355',
  text: '#F4F8FF',
  textMuted: '#9FB3C8',
  textSoft: '#C9D7E8',
  success: '#38E28E',
  info: '#29B6FF',
  accent: '#FF4D73',
  overlay: '#000000',
} as const;

export const colorAlpha = (hex: string, alphaHex: string) => `${hex}${alphaHex}`;
