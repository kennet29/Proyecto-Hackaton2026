import type { ComponentType } from 'react';
import { Platform } from 'react-native';

export type AltchaWidgetProps = {
  onPayload: (payload: string) => void;
  resetKey?: number;
};

export const AltchaWidget = (
  Platform.OS === 'web'
    ? require('./AltchaWidget.web').AltchaWidget
    : require('./AltchaWidget.native').AltchaWidget
) as ComponentType<AltchaWidgetProps>;
