import { useBackgroundMode } from '../context/BackgroundModeContext';
import { appColors } from './colors';

export type AppColors = { [Key in keyof typeof appColors]: string } & {
  onAccent: string;
  mode: 'light' | 'dark';
};

const darkColors: AppColors = { ...appColors, onAccent: appColors.background, mode: 'dark' };
const lightColors: AppColors = {
  mode: 'light',
  background: '#F4F8FC',
  backgroundMuted: '#EEF3F8',
  surface: '#FFFFFF',
  surfaceStrong: '#E7EFF8',
  border: '#CBD5E1',
  borderStrong: '#94A3B8',
  text: '#172B4D',
  textMuted: '#52657A',
  textSoft: '#334155',
  success: '#166534',
  info: '#0369A1',
  accent: '#BE123C',
  overlay: '#000000',
  onAccent: '#FFFFFF',
};

export function useAppColors(): AppColors {
  const { mode } = useBackgroundMode();
  return mode === 'light' ? lightColors : darkColors;
}
