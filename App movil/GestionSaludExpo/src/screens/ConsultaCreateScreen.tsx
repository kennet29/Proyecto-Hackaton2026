/**
 * @file App movil/GestionSaludExpo/src/screens/ConsultaCreateScreen.tsx
 * @description TypeScript module implementation.
 */

import React from 'react';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { ConsultaFormScreen } from './ConsultaFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultaCreate'>;
type ConsultaFormProps = NativeStackScreenProps<RootStackParamList, 'ConsultaForm'>;

export function ConsultaCreateScreen(props: Props) {
  return <ConsultaFormScreen {...(props as unknown as ConsultaFormProps)} />;
}
