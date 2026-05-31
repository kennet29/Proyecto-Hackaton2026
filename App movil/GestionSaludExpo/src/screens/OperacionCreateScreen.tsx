import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { OperacionFormScreen } from './OperacionFormScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'OperacionCreate'>;

export function OperacionCreateScreen(_props: Props) {
  return <OperacionFormScreen mode="create" />;
}
