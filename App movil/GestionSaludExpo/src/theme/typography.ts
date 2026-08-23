/**
 * @file App movil/GestionSaludExpo/src/theme/typography.ts
 * @description TypeScript module implementation.
 */

import { TextStyle } from 'react-native';

export const appFontFamilies = {
  headingRegular: 'Nunito_400Regular',
  headingSemiBold: 'Nunito_600SemiBold',
  headingBold: 'Nunito_700Bold',
  headingExtraBold: 'Nunito_800ExtraBold',
  headingBlack: 'Nunito_900Black',
  bodyRegular: 'SpaceGrotesk_400Regular',
  bodyMedium: 'SpaceGrotesk_500Medium',
  bodySemiBold: 'SpaceGrotesk_600SemiBold',
  bodyBold: 'SpaceGrotesk_700Bold',
} as const;

const numericWeight = (weight: TextStyle['fontWeight']) => {
  if (weight === 'bold') {
    return 700;
  }
  if (!weight || weight === 'normal') {
    return 400;
  }

  const parsed = Number.parseInt(String(weight), 10);
  return Number.isFinite(parsed) ? parsed : 400;
};

export const resolveAppFontFamily = (style: TextStyle = {}) => {
  const weight = numericWeight(style.fontWeight);
  const isHeading = weight >= 700 || (style.fontSize ?? 0) >= 20;

  if (isHeading) {
    if (weight >= 900) return appFontFamilies.headingBlack;
    if (weight >= 800) return appFontFamilies.headingExtraBold;
    if (weight >= 700) return appFontFamilies.headingBold;
    if (weight >= 600) return appFontFamilies.headingSemiBold;
    return appFontFamilies.headingRegular;
  }

  if (weight >= 700) return appFontFamilies.bodyBold;
  if (weight >= 600) return appFontFamilies.bodySemiBold;
  if (weight >= 500) return appFontFamilies.bodyMedium;
  return appFontFamilies.bodyRegular;
};
