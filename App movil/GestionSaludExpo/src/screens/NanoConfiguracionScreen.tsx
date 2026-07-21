import React, { useCallback, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  loadNanoAppearanceId,
  NanoAppearancePreview,
  NANO_APPEARANCES,
  saveNanoAppearanceId,
} from '../components/NanoAppearancePreview';
import { appColors, colorAlpha } from '../theme/colors';

export function NanoConfiguracionScreen() {
  const { width } = useWindowDimensions();
  const [selectedId, setSelectedId] = useState('base');
  const [savedMessage, setSavedMessage] = useState('');
  const useThreeColumns = width >= 760;

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadNanoAppearanceId()
        .then((appearanceId) => {
          if (active) setSelectedId(appearanceId);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, []),
  );

  const selectAppearance = async (appearanceId: string, label: string) => {
    setSelectedId(appearanceId);
    setSavedMessage('');
    try {
      await saveNanoAppearanceId(appearanceId);
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
          <Text style={styles.eyebrow}>CONFIGURACIÓN</Text>
          <Text style={styles.title}>Apariencia de Nano</Text>
          <Text style={styles.subtitle}>
            Selecciona el diseño que aparecerá en el acceso rápido del asistente.
          </Text>
        </View>
      </View>

      {savedMessage ? (
        <View style={styles.feedback}>
          <Ionicons name="checkmark-circle-outline" size={18} color={appColors.success} />
          <Text style={styles.feedbackText}>{savedMessage}</Text>
        </View>
      ) : null}

      <View style={styles.grid}>
        {NANO_APPEARANCES.map((appearance) => {
          const selected = appearance.id === selectedId;
          return (
            <TouchableOpacity
              key={appearance.id}
              style={[
                styles.card,
                useThreeColumns ? styles.cardThreeColumns : styles.cardTwoColumns,
                selected && styles.cardSelected,
              ]}
              onPress={() => void selectAppearance(appearance.id, appearance.label)}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Seleccionar ${appearance.label}`}
              activeOpacity={0.85}
            >
              <View style={styles.previewWrap}>
                <NanoAppearancePreview appearance={appearance} size={96} />
                {selected ? (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark" size={16} color={appColors.background} />
                  </View>
                ) : null}
              </View>
              <Text style={styles.cardTitle}>{appearance.label}</Text>
              <Text style={styles.cardDescription}>{appearance.description}</Text>
              <Text style={[styles.cardAction, selected && styles.cardActionSelected]}>
                {selected ? 'Seleccionado' : 'Elegir apariencia'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="phone-portrait-outline" size={20} color={appColors.info} />
        <Text style={styles.infoText}>
          La selección se guarda en este dispositivo y se refleja al volver al menú principal.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: appColors.background },
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
