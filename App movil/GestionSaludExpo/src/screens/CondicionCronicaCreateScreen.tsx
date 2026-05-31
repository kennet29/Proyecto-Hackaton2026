import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { CondicionCronicaFormScreen } from './CondicionCronicaFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CondicionCronicaCreate'>;

export function CondicionCronicaCreateScreen(_props: Props) {
  return <CondicionCronicaFormScreen mode="create" />;
}
