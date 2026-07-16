import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { appColors, colorAlpha } from '../theme/colors';

type WebTimeInputProps = {
  value: string;
  onChange: (value: string) => void;
  ariaLabel?: string;
  includeQuickTimes?: boolean;
};

type Period = 'AM' | 'PM';

const HOURS = Array.from({ length: 12 }, (_, index) => index + 1);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);
const QUICK_TIMES = ['08:00', '12:00', '18:00', '21:00'];

const parseTime = (value: string) => {
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  const hour = match ? Math.min(23, Math.max(0, Number(match[1]))) : 8;
  const minute = match ? Math.min(59, Math.max(0, Number(match[2]))) : 0;
  return { hour, minute };
};

const formatValue = (hour: number, minute: number) =>
  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;

const formatLabel = (value: string) => {
  const { hour, minute } = parseTime(value);
  const displayHour = hour % 12 || 12;
  return `${String(displayHour).padStart(2, '0')}:${String(minute).padStart(2, '0')} ${hour >= 12 ? 'p. m.' : 'a. m.'}`;
};

const roundCurrentTime = () => {
  const now = new Date();
  now.setMinutes(Math.round(now.getMinutes() / 5) * 5, 0, 0);
  return formatValue(now.getHours(), now.getMinutes());
};

export const WebTimeInput = ({
  value,
  onChange,
  ariaLabel = 'Seleccionar hora',
  includeQuickTimes = true,
}: WebTimeInputProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const parsed = useMemo(() => parseTime(value), [value]);
  const displayHour = parsed.hour % 12 || 12;
  const period: Period = parsed.hour >= 12 ? 'PM' : 'AM';
  const minuteOptions = useMemo(
    () => (MINUTES.includes(parsed.minute) ? MINUTES : [...MINUTES, parsed.minute].sort((a, b) => a - b)),
    [parsed.minute],
  );

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [isOpen]);

  const updateHour = (nextDisplayHour: number, nextPeriod: Period = period) => {
    const hour24 = (nextDisplayHour % 12) + (nextPeriod === 'PM' ? 12 : 0);
    onChange(formatValue(hour24, parsed.minute));
  };

  const updatePeriod = (nextPeriod: Period) => updateHour(displayHour, nextPeriod);

  return (
    <View style={[styles.container, isOpen && styles.containerOpen]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={ariaLabel}
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen((current) => !current)}
        style={({ pressed }) => [styles.trigger, isOpen && styles.triggerOpen, pressed && styles.pressed]}
      >
        <View style={styles.triggerValue}>
          <Ionicons name="time-outline" size={19} color={appColors.info} />
          <Text style={styles.triggerText}>{formatLabel(value)}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={19} color={appColors.textMuted} />
      </Pressable>

      {isOpen ? (
        <View style={styles.panel} accessibilityRole="menu">
          <View style={styles.panelHeader}>
            <View>
              <Text style={styles.panelEyebrow}>HORA SELECCIONADA</Text>
              <Text style={styles.panelTime}>{formatLabel(value)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar selector de hora"
              onPress={() => setIsOpen(false)}
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Ionicons name="close" size={20} color={appColors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.sectionLabel}>Hora</Text>
          <View style={styles.optionsGrid}>
            {HOURS.map((hour) => {
              const selected = displayHour === hour;
              return (
                <Pressable
                  key={hour}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => updateHour(hour)}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {String(hour).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Minutos</Text>
          <View style={styles.optionsGrid}>
            {minuteOptions.map((minute) => {
              const selected = parsed.minute === minute;
              return (
                <Pressable
                  key={minute}
                  accessibilityRole="menuitem"
                  accessibilityState={{ selected }}
                  onPress={() => onChange(formatValue(parsed.hour, minute))}
                  style={({ pressed }) => [
                    styles.option,
                    selected && styles.optionSelected,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                    {String(minute).padStart(2, '0')}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.panelFooter}>
            <View style={styles.periodGroup}>
              {(['AM', 'PM'] as Period[]).map((item) => {
                const selected = period === item;
                return (
                  <Pressable
                    key={item}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => updatePeriod(item)}
                    style={({ pressed }) => [
                      styles.periodButton,
                      selected && styles.periodButtonSelected,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Text style={[styles.periodText, selected && styles.periodTextSelected]}>
                      {item === 'AM' ? 'a. m.' : 'p. m.'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setIsOpen(false)}
              style={({ pressed }) => [styles.doneButton, pressed && styles.pressed]}
            >
              <Ionicons name="checkmark" size={18} color={appColors.background} />
              <Text style={styles.doneText}>Listo</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {includeQuickTimes ? (
        <View style={styles.quickTimes}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Usar la hora actual"
            onPress={() => onChange(roundCurrentTime())}
            style={({ pressed }) => [styles.quickButton, pressed && styles.pressed]}
          >
            <Text style={styles.quickText}>Ahora</Text>
          </Pressable>
          {QUICK_TIMES.map((time) => {
            const selected = value === time;
            return (
              <Pressable
                key={time}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(time)}
                style={({ pressed }) => [
                  styles.quickButton,
                  selected && styles.quickButtonSelected,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.quickText, selected && styles.quickTextSelected]}>{time}</Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: 210,
    gap: 8,
    position: 'relative',
  },
  containerOpen: {
    zIndex: 1000,
  },
  trigger: {
    minHeight: 52,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.backgroundMuted,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  triggerOpen: {
    borderColor: appColors.info,
    backgroundColor: colorAlpha(appColors.info, '0D'),
  },
  triggerValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  triggerText: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  panel: {
    position: 'absolute',
    top: 60,
    right: 0,
    width: 420,
    maxWidth: '100%',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '66'),
    backgroundColor: '#10243A',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.38,
    shadowRadius: 28,
    elevation: 24,
    gap: 10,
  },
  panelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: appColors.border,
  },
  panelEyebrow: {
    color: appColors.textMuted,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.9,
  },
  panelTime: {
    marginTop: 2,
    color: appColors.info,
    fontSize: 24,
    fontWeight: '900',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.text, '0D'),
  },
  sectionLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '800',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  option: {
    width: '15%',
    minWidth: 48,
    minHeight: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: colorAlpha(appColors.background, '55'),
  },
  optionSelected: {
    borderColor: appColors.info,
    backgroundColor: appColors.info,
  },
  optionText: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  optionTextSelected: {
    color: appColors.background,
  },
  panelFooter: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: appColors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  periodGroup: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    backgroundColor: colorAlpha(appColors.background, '77'),
  },
  periodButton: {
    minHeight: 36,
    minWidth: 62,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  periodButtonSelected: {
    backgroundColor: colorAlpha(appColors.info, '2E'),
  },
  periodText: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: '800',
  },
  periodTextSelected: {
    color: appColors.info,
  },
  doneButton: {
    minHeight: 40,
    paddingHorizontal: 16,
    borderRadius: 11,
    backgroundColor: appColors.info,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  doneText: {
    color: appColors.background,
    fontSize: 14,
    fontWeight: '900',
  },
  quickTimes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  quickButton: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: colorAlpha(appColors.info, '0D'),
  },
  quickButtonSelected: {
    borderColor: appColors.info,
    backgroundColor: colorAlpha(appColors.info, '24'),
  },
  quickText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  quickTextSelected: {
    color: appColors.info,
  },
  pressed: {
    opacity: 0.72,
  },
});
