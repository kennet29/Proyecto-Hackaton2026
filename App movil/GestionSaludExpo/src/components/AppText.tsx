/**
 * @file App movil/GestionSaludExpo/src/components/AppText.tsx
 * @description TypeScript module implementation.
 */

import React, { forwardRef } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  TextStyle,
} from 'react-native';
import { resolveAppFontFamily } from '../theme/typography';
import { useFontSize } from '../context/FontSizeContext';

export const AppText = forwardRef<Text, TextProps>(({ style, ...props }, ref) => {
  const { fontScale } = useFontSize();
  const flattenedStyle = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = resolveAppFontFamily(flattenedStyle);
  const fontSize = (flattenedStyle.fontSize ?? 14) * fontScale;
  const lineHeight = flattenedStyle.lineHeight ? flattenedStyle.lineHeight * fontScale : undefined;

  return (
    <Text
      ref={ref}
      {...props}
      style={[style, { fontFamily, fontWeight: 'normal', fontSize, lineHeight }]}
    />
  );
});

AppText.displayName = 'AppText';

export const AppTextInput = forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => {
  const { fontScale } = useFontSize();
  const flattenedStyle = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = resolveAppFontFamily(flattenedStyle);
  const fontSize = (flattenedStyle.fontSize ?? 14) * fontScale;
  const lineHeight = flattenedStyle.lineHeight ? flattenedStyle.lineHeight * fontScale : undefined;

  return (
    <TextInput
      ref={ref}
      {...props}
      style={[style, { fontFamily, fontWeight: 'normal', fontSize, lineHeight }]}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';
