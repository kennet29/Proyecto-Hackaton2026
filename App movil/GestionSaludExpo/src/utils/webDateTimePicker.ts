/**
 * @file App movil/GestionSaludExpo/src/utils/webDateTimePicker.ts
 * @description TypeScript module implementation.
 */

import { Platform } from 'react-native';

type DateTimeInputType = 'date' | 'time';

export const openWebDateTimePicker = (
  type: DateTimeInputType,
  value: string,
  onChange: (value: string) => void,
): boolean => {
  if (Platform.OS !== 'web' || typeof document === 'undefined') {
    return false;
  }

  const input = document.createElement('input');
  input.type = type;
  input.value = value;
  input.style.position = 'fixed';
  input.style.left = '50%';
  input.style.top = '50%';
  input.style.transform = 'translate(-50%, -50%)';
  input.style.width = '180px';
  input.style.height = '44px';
  input.style.opacity = '0.01';
  input.style.zIndex = '2147483647';

  const removeInput = () => {
    window.setTimeout(() => {
      input.remove();
    }, 120);
  };

  input.addEventListener('change', () => {
    if (input.value) {
      onChange(input.value);
    }
    removeInput();
  });
  input.addEventListener('blur', removeInput);

  document.body.appendChild(input);
  input.focus();

  window.requestAnimationFrame(() => {
    try {
      if (typeof input.showPicker === 'function') {
        input.showPicker();
      } else {
        input.click();
      }
    } catch {
      input.click();
    }
  });

  return true;
};
