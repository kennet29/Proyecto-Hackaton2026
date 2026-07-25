import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { AppText } from '../components/AppText';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { getNanoHistory, NanoHistoryEntry } from '../utils/nanoHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoHistorial'>;

function formatCreatedAt(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Fecha no disponible';
  }

  return new Intl.DateTimeFormat('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export function NanoHistorialScreen({}: Props) {
  const [history, setHistory] = useState<NanoHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = useCallback(async () => {
    const items = await getNanoHistory();
    setHistory(items);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let mounted = true;

      const run = async () => {
        setLoading(true);
        const items = await getNanoHistory();
        if (mounted) {
          setHistory(items);
          setLoading(false);
        }
      };

      void run();

      return () => {
        mounted = false;
      };
    }, []),
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, [loadHistory]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={appColors.info} />
          <AppText style={styles.loadingText}>Cargando historial...</AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => void handleRefresh()}
              tintColor={appColors.info}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.heroCard}>
            <AppText style={styles.heroTitle}>Historial de Nano</AppText>
            <AppText style={styles.heroSubtitle}>
              Aqui se guardan localmente tus ultimos analisis de comida para revisarlos despues.
            </AppText>
          </View>

          {!history.length ? (
            <View style={styles.emptyCard}>
              <Ionicons name="time-outline" size={26} color={appColors.info} />
              <AppText style={styles.emptyTitle}>Todavia no hay historial</AppText>
              <AppText style={styles.emptyText}>
                Analiza una comida con Nano y aqui aparecera guardada con su resumen nutricional.
              </AppText>
            </View>
          ) : (
            history.map((item) => (
              <View key={item.id} style={styles.entryCard}>
                <View style={styles.entryHeader}>
                  <View style={styles.entryHeaderCopy}>
                    <AppText style={styles.entryGoal}>{item.goalLabel}</AppText>
                    <AppText style={styles.entryDate}>{formatCreatedAt(item.createdAt)}</AppText>
                  </View>
                  {item.macronutrients ? (
                    <View style={styles.kcalBadge}>
                      <AppText style={styles.kcalBadgeText}>{Math.round(item.macronutrients.calories)} kcal</AppText>
                    </View>
                  ) : null}
                </View>

                {item.photoUri ? (
                  <Image source={{ uri: item.photoUri }} style={styles.entryImage} resizeMode="cover" />
                ) : null}

                <AppText style={styles.feedbackText}>{item.feedback}</AppText>
                {item.userNote ? <AppText style={styles.noteText}>Nota: {item.userNote}</AppText> : null}

                {item.macronutrients ? (
                  <View style={styles.macroRow}>
                    <View style={styles.metricPill}>
                      <AppText style={styles.metricLabel}>Proteina</AppText>
                      <AppText style={styles.metricValue}>{item.macronutrients.proteinGrams} g</AppText>
                    </View>
                    <View style={styles.metricPill}>
                      <AppText style={styles.metricLabel}>Carbohidratos</AppText>
                      <AppText style={styles.metricValue}>{item.macronutrients.carbohydratesGrams} g</AppText>
                    </View>
                    <View style={styles.metricPill}>
                      <AppText style={styles.metricLabel}>Grasas</AppText>
                      <AppText style={styles.metricValue}>{item.macronutrients.fatGrams} g</AppText>
                    </View>
                  </View>
                ) : null}

                {item.micronutrients?.length ? (
                  <View style={styles.microWrap}>
                    {item.micronutrients.slice(0, 4).map((micro) => (
                      <View key={`${item.id}-${micro.key}`} style={styles.microPill}>
                        <AppText style={styles.microPillText}>
                          {micro.label}: {Math.round(micro.dailyValuePercent)}%
                        </AppText>
                      </View>
                    ))}
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: appColors.textSoft,
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  heroCard: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 18,
  },
  heroTitle: {
    color: appColors.text,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    marginTop: 8,
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  emptyCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '88'),
    backgroundColor: colorAlpha(appColors.info, '12'),
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    marginTop: 14,
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  emptyText: {
    marginTop: 8,
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  entryCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 16,
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  entryHeaderCopy: {
    flex: 1,
  },
  entryGoal: {
    color: appColors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  entryDate: {
    marginTop: 6,
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  kcalBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colorAlpha(appColors.success, '16'),
  },
  kcalBadgeText: {
    color: appColors.success,
    fontSize: 12,
    fontWeight: '800',
  },
  entryImage: {
    width: '100%',
    height: 180,
    borderRadius: 18,
    marginTop: 14,
  },
  feedbackText: {
    marginTop: 14,
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 22,
  },
  noteText: {
    marginTop: 10,
    color: appColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  macroRow: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricPill: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colorAlpha(appColors.background, '66'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'A8'),
  },
  metricLabel: {
    color: appColors.textMuted,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metricValue: {
    marginTop: 4,
    color: appColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  microWrap: {
    marginTop: 14,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  microPill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: colorAlpha(appColors.info, '16'),
  },
  microPillText: {
    color: appColors.info,
    fontSize: 12,
    fontWeight: '700',
  },
});
