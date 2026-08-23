/**
 * @file App movil/GestionSaludExpo/src/screens/RegistroDentalCreateScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { RegistroDentalFormScreen } from './RegistroDentalFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'RegistroDentalCreate'>;

export function RegistroDentalCreateScreen(_props: Props) {
  return <RegistroDentalFormScreen mode="create" />;
}
