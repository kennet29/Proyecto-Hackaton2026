/**
 * @file App movil/GestionSaludExpo/src/screens/NanoConfiguracionScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { AppText } from '../components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadNanoAppearanceState,
  NanoAppearancePreview,
  NANO_APPEARANCES,
  saveNanoAppearanceId,
} from '../components/NanoAppearancePreview';
import { useAuth } from '../context/AuthContext';
import { appColors, colorAlpha } from '../theme/colors';
import { getNanoAppearanceUnlockRule } from '../utils/nanoAppearanceUnlocks';

export function NanoConfiguracionScreen() {
  const { token, user } = useAuth();
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState('base');
  const [unlockedIds, setUnlockedIds] = useState<Set<string>>(new Set(['base']));
  const [savedMessage, setSavedMessage] = useState('');
  const useThreeColumns = width >= 760;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNanoAppearanceState(user?.id, token)
        .then(({ selectedId: appearanceId, unlockedIds: unlockedAppearanceIds }) => {
          if (active) {
            setSelectedId(appearanceId);
            setUnlockedIds(unlockedAppearanceIds);
          }
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [token, user?.id]),
  );

  const selectAppearance = async (appearanceId: string, label: string) => {
    setSelectedId(appearanceId);
    setSavedMessage('');
    try {
      const serverState = await saveNanoAppearanceId(
        appearanceId,
        user?.id,
        token,
      );
      setSelectedId(serverState.selectedId);
      setUnlockedIds(serverState.unlockedIds);
      setSavedMessage(`${label} se aplicó correctamente.`);
    } catch {
      setSavedMessage('No se pudo guardar la selección en este dispositivo.');
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="color-palette-outline" size={27} color={appColors.accent} />
        </View>
        <View style={styles.heroCopy}>
          <AppText style={styles.eyebrow}>CONFIGURACIÓN</AppText>
          <AppText style={styles.title}>Apariencia de Nano</AppText>
          <AppText style={styles.subtitle}>
            Selecciona el diseño que aparecerá en el acceso rápido del asistente.
          </AppText>
        </View>
      </View>

      {savedMessage ? (
        <View style={styles.feedback}>
          <Ionicons name="checkmark-circle-outline" size={18} color={appColors.success} />
          <AppText style={styles.feedbackText}>{savedMessage}</AppText>
        </View>
      ) : null}

      <View style={styles.grid}>
        {NANO_APPEARANCES.map((appearance) => {
          const selected = appearance.id === selectedId;
          const unlocked = unlockedIds.has(appearance.id);
          const unlockRule = getNanoAppearanceUnlockRule(appearance.id);
          return (
            <TouchableOpacity
              key={appearance.id}
              style={[
                styles.card,
                useThreeColumns ? styles.cardThreeColumns : styles.cardTwoColumns,
                selected && styles.cardSelected,
                !unlocked && styles.cardLocked,
              ]}
              onPress={() => void selectAppearance(appearance.id, appearance.label)}
              disabled={!unlocked}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: !unlocked }}
              accessibilityLabel={
                unlocked
                  ? `Seleccionar ${appearance.label}`
                  : `${appearance.label}, bloqueado hasta iniciar sesión el ${unlockRule?.dateLabel}`
              }
              activeOpacity={0.85}
            >
              <View style={styles.previewWrap}>
                <NanoAppearancePreview appearance={appearance} size={96} />
                {selected ? (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={16} color={appColors.background} />
                  </View>
                ) : null}
                {!unlocked ? (
                  <View style={styles.lockedBadge}>
                    <Ionicons name="lock-closed" size={15} color={appColors.background} />
                  </View>
                ) : null}
              </View>
              <AppText style={styles.cardTitle}>{appearance.label}</AppText>
              <AppText style={styles.cardDescription}>{appearance.description}</AppText>
              <AppText style={[styles.cardAction, selected && styles.cardActionSelected]}>
                {!unlocked
                  ? `Inicia sesión el ${unlockRule?.dateLabel}`
                  : selected
                    ? 'Seleccionado'
                    : 'Elegir apariencia'}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="phone-portrait-outline" size={20} color={appColors.info} />
        <AppText style={styles.infoText}>
          La selección se guarda en este dispositivo y se refleja al volver al menú principal.
        </AppText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: 'transparent' },
  content: { width: '100%', maxWidth: 980, alignSelf: 'center', padding: 18, paddingBottom: 42 },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: 18,
    marginBottom: 16,
  },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 17,
    backgroundColor: colorAlpha(appColors.accent, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 13,
  },
  heroCopy: { flex: 1 },
  eyebrow: { color: appColors.accent, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: appColors.text, fontSize: 23, fontWeight: '900', marginTop: 2 },
  subtitle: { color: appColors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 4 },
  feedback: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colorAlpha(appColors.success, '12'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '55'),
    borderRadius: 13,
    padding: 11,
    marginBottom: 16,
  },
  feedbackText: { color: appColors.textSoft, fontSize: 12, marginLeft: 8, flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 12 },
  card: {
    minHeight: 210,
    backgroundColor: appColors.surface,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: appColors.border,
    padding: 16,
    alignItems: 'center',
  },
  cardTwoColumns: { width: '48%' },
  cardThreeColumns: { width: '31.5%' },
  cardSelected: {
    borderColor: appColors.accent,
    backgroundColor: colorAlpha(appColors.accent, '0F'),
  },
  cardLocked: { opacity: 0.58 },
  previewWrap: { position: 'relative', marginBottom: 12 },
  selectedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appColors.success,
    borderWidth: 2,
    borderColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBadge: {
    position: 'absolute',
    right: -4,
    bottom: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: appColors.textMuted,
    borderWidth: 2,
    borderColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: { color: appColors.text, fontSize: 15, fontWeight: '900', textAlign: 'center' },
  cardDescription: { color: appColors.textMuted, fontSize: 11, textAlign: 'center', marginTop: 4 },
  cardAction: { color: appColors.info, fontSize: 10, fontWeight: '900', marginTop: 13 },
  cardActionSelected: { color: appColors.success },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colorAlpha(appColors.info, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '40'),
    borderRadius: 15,
    padding: 13,
    marginTop: 18,
  },
  infoText: { color: appColors.textSoft, fontSize: 11, lineHeight: 16, marginLeft: 9, flex: 1 },
});
