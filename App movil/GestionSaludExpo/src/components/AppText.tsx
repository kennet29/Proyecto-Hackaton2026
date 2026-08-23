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

export const AppText = forwardRef<Text, TextProps>(({ style, ...props }, ref) => {
  const flattenedStyle = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = resolveAppFontFamily(flattenedStyle);

  return (
    <Text
      ref={ref}
      {...props}
      style={[style, { fontFamily, fontWeight: 'normal' }]}
    />
  );
});

AppText.displayName = 'AppText';

export const AppTextInput = forwardRef<TextInput, TextInputProps>(({ style, ...props }, ref) => {
  const flattenedStyle = (StyleSheet.flatten(style) ?? {}) as TextStyle;
  const fontFamily = resolveAppFontFamily(flattenedStyle);

  return (
    <TextInput
      ref={ref}
      {...props}
      style={[style, { fontFamily, fontWeight: 'normal' }]}
    />
  );
});

AppTextInput.displayName = 'AppTextInput';
