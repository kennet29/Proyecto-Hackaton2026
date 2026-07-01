import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { saveNanoHistoryEntry } from '../utils/nanoHistory';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoConsejero'>;

type FoodGoal = {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

type CapturedPhoto = {
  uri: string;
  mimeType: string;
  fileName: string;
};

type AnalyzeMealResponse = {
  feedback?: string;
  wordCount?: number;
  goalLabel?: string;
  macronutrients?: {
    calories?: number;
    carbohydratesGrams?: number;
    proteinGrams?: number;
    fatGrams?: number;
    fiberGrams?: number;
    sugarGrams?: number;
  };
  macroDistribution?: {
    carbohydratesPercent?: number;
    proteinPercent?: number;
    fatPercent?: number;
  };
  micronutrients?: Array<{
    key?: string;
    label?: string;
    amount?: string;
    dailyValuePercent?: number;
  }>;
};

type CompositionSlice = {
  key: string;
  label: string;
  percentage: number;
  accent: string;
  grams?: number;
  calories?: number;
};

type MacronutrientBreakdown = {
  calories: number;
  carbohydratesGrams: number;
  proteinGrams: number;
  fatGrams: number;
  fiberGrams: number;
  sugarGrams: number;
};

type MacroDistribution = {
  carbohydratesPercent: number;
  proteinPercent: number;
  fatPercent: number;
};

type MicronutrientMetric = {
  key: string;
  label: string;
  amount: string;
  dailyValuePercent: number;
  accent: string;
};

const FOOD_GOALS: FoodGoal[] = [
  {
    id: 'weight-loss',
    label: 'Bajar de peso',
    description: 'Quiero revisar si esta comida me ayuda a perder grasa sin quedarme con hambre.',
    icon: 'trending-down-outline',
    accent: appColors.info,
  },
  {
    id: 'diabetes',
    label: 'Diabetes',
    description: 'Necesito validar si esta opcion es conveniente para control de azucar.',
    icon: 'water-outline',
    accent: appColors.accent,
  },
  {
    id: 'muscle-gain',
    label: 'Subir de peso o musculo',
    description: 'Busco evaluar si la comida me aporta energia y proteina para ganar masa.',
    icon: 'barbell-outline',
    accent: appColors.success,
  },
  {
    id: 'pregnancy',
    label: 'Embarazo',
    description: 'Quiero revisar si esta comida es adecuada durante el embarazo.',
    icon: 'flower-outline',
    accent: '#FDBA74',
  },
];

const DIALOG_TEXT =
  'Toma una foto de tu comida, elige el objetivo y Nano te devolvera una recomendacion con calorias, macronutrientes, micronutrientes y graficas para revisar la distribucion del plato.';

const SCAN_OVERLAY_HEIGHT = 300;

const MACRO_ACCENTS = {
  carbohydrates: '#38BDF8',
  protein: '#FF4D73',
  fat: '#FDBA74',
  fiber: '#38F28E',
  sugar: '#F59E0B',
} as const;

const MICRO_ACCENTS = ['#29B6FF', '#38F28E', '#FDBA74', '#FF4D73', '#A3E635', '#F97316'];

function sanitizeMacronutrients(payload: AnalyzeMealResponse['macronutrients']): MacronutrientBreakdown | null {
  if (!payload) {
    return null;
  }

  const calories = Number(payload.calories);
  const carbohydratesGrams = Number(payload.carbohydratesGrams);
  const proteinGrams = Number(payload.proteinGrams);
  const fatGrams = Number(payload.fatGrams);
  const fiberGrams = Number(payload.fiberGrams ?? 0);
  const sugarGrams = Number(payload.sugarGrams ?? 0);

  if (![calories, carbohydratesGrams, proteinGrams, fatGrams, fiberGrams, sugarGrams].every(Number.isFinite)) {
    return null;
  }

  return {
    calories,
    carbohydratesGrams,
    proteinGrams,
    fatGrams,
    fiberGrams,
    sugarGrams,
  };
}

function sanitizeMicronutrients(
  payload: AnalyzeMealResponse['micronutrients'],
): MicronutrientMetric[] | null {
  if (!payload?.length) {
    return null;
  }

  const items = payload
    .map((item, index) => {
      const label = item.label?.trim();
      const amount = item.amount?.trim();
      const dailyValuePercent = Number(item.dailyValuePercent);

      if (!label || !amount || !Number.isFinite(dailyValuePercent)) {
        return null;
      }

      return {
        key: item.key?.trim() || `micronutrient-${index + 1}`,
        label,
        amount,
        dailyValuePercent,
        accent: MICRO_ACCENTS[index % MICRO_ACCENTS.length],
      };
    })
    .filter((item): item is MicronutrientMetric => item !== null);

  return items.length ? items : null;
}

function sanitizeMacroDistribution(
  payload: AnalyzeMealResponse['macroDistribution'],
): MacroDistribution | null {
  if (!payload) {
    return null;
  }

  const carbohydratesPercent = Number(payload.carbohydratesPercent);
  const proteinPercent = Number(payload.proteinPercent);
  const fatPercent = Number(payload.fatPercent);

  if (![carbohydratesPercent, proteinPercent, fatPercent].every(Number.isFinite)) {
    return null;
  }

  return {
    carbohydratesPercent,
    proteinPercent,
    fatPercent,
  };
}

function buildComposition(
  macronutrients: MacronutrientBreakdown | null,
  distribution: MacroDistribution | null,
): CompositionSlice[] | null {
  if (!macronutrients && !distribution) {
    return null;
  }

  const carbohydrateCalories = Math.max(macronutrients?.carbohydratesGrams ?? 0, 0) * 4;
  const proteinCalories = Math.max(macronutrients?.proteinGrams ?? 0, 0) * 4;
  const fatCalories = Math.max(macronutrients?.fatGrams ?? 0, 0) * 9;
  const total = carbohydrateCalories + proteinCalories + fatCalories;

  const percentages =
    distribution ??
    (total > 0
      ? {
          carbohydratesPercent: Math.round((carbohydrateCalories / total) * 100),
          proteinPercent: Math.round((proteinCalories / total) * 100),
          fatPercent: Math.round((fatCalories / total) * 100),
        }
      : null);

  if (!percentages) {
    return null;
  }

  return [
    {
      key: 'carbohydrates',
      label: 'Carbohidratos',
      percentage: percentages.carbohydratesPercent,
      accent: MACRO_ACCENTS.carbohydrates,
      grams: macronutrients?.carbohydratesGrams ?? 0,
      calories: carbohydrateCalories,
    },
    {
      key: 'protein',
      label: 'Proteina',
      percentage: percentages.proteinPercent,
      accent: MACRO_ACCENTS.protein,
      grams: macronutrients?.proteinGrams ?? 0,
      calories: proteinCalories,
    },
    {
      key: 'fat',
      label: 'Grasas',
      percentage: percentages.fatPercent,
      accent: MACRO_ACCENTS.fat,
      grams: macronutrients?.fatGrams ?? 0,
      calories: fatCalories,
    },
  ];
}

function formatGramValue(value: number) {
  return `${value.toFixed(value % 1 === 0 ? 0 : 1)} g`;
}

function formatCalorieValue(value: number) {
  return `${Math.round(value)} kcal`;
}

export function NanoConsejeroScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [selectedGoalId, setSelectedGoalId] = useState<string>(FOOD_GOALS[0].id);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [analysisText, setAnalysisText] = useState<string | null>(null);
  const [analysisWordCount, setAnalysisWordCount] = useState<number | null>(null);
  const [macronutrients, setMacronutrients] = useState<MacronutrientBreakdown | null>(null);
  const [macroDistribution, setMacroDistribution] = useState<MacroDistribution | null>(null);
  const [micronutrients, setMicronutrients] = useState<MicronutrientMetric[] | null>(null);
  const scanTranslate = useRef(new Animated.Value(0)).current;

  const selectedGoal = useMemo(
    () => FOOD_GOALS.find((goal) => goal.id === selectedGoalId) ?? FOOD_GOALS[0],
    [selectedGoalId],
  );
  const composition = useMemo(
    () => buildComposition(macronutrients, macroDistribution),
    [macronutrients, macroDistribution],
  );
  const macroHighlights = useMemo(
    () =>
      macronutrients
        ? [
            {
              key: 'calories',
              label: 'Calorias',
              value: formatCalorieValue(macronutrients.calories),
              accent: selectedGoal.accent,
            },
            {
              key: 'protein',
              label: 'Proteina',
              value: formatGramValue(macronutrients.proteinGrams),
              accent: MACRO_ACCENTS.protein,
            },
            {
              key: 'carbohydrates',
              label: 'Carbohidratos',
              value: formatGramValue(macronutrients.carbohydratesGrams),
              accent: MACRO_ACCENTS.carbohydrates,
            },
            {
              key: 'fat',
              label: 'Grasas',
              value: formatGramValue(macronutrients.fatGrams),
              accent: MACRO_ACCENTS.fat,
            },
            {
              key: 'fiber',
              label: 'Fibra',
              value: formatGramValue(macronutrients.fiberGrams),
              accent: MACRO_ACCENTS.fiber,
            },
            {
              key: 'sugar',
              label: 'Azucares',
              value: formatGramValue(macronutrients.sugarGrams),
              accent: MACRO_ACCENTS.sugar,
            },
          ]
        : [],
    [macronutrients, selectedGoal.accent],
  );

  useEffect(() => {
    if (!submitting || !photo) {
      scanTranslate.stopAnimation();
      scanTranslate.setValue(0);
      return;
    }

    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanTranslate, {
          toValue: SCAN_OVERLAY_HEIGHT - 16,
          duration: 1450,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scanTranslate, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ]),
    );

    scanLoop.start();

    return () => {
      scanLoop.stop();
      scanTranslate.stopAnimation();
      scanTranslate.setValue(0);
    };
  }, [photo, scanTranslate, submitting]);

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La captura con camara se recomienda desde Android o iOS.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la camara para fotografiar tu comida.');
      return;
    }

    setCapturing(true);
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.6,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `meal-${Date.now()}.jpg`,
      });
      setAnalysisText(null);
      setAnalysisWordCount(null);
      setMacronutrients(null);
      setMacroDistribution(null);
      setMicronutrients(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la camara.');
    } finally {
      setCapturing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!photo) {
      Alert.alert('Falta la foto', 'Primero toma una foto de tu comida.');
      return;
    }

    if (!token) {
      Alert.alert('Sesion requerida', 'Necesitas iniciar sesion para usar Nano.');
      return;
    }

    setSubmitting(true);
    setAnalysisText(null);
    setAnalysisWordCount(null);
    setMacronutrients(null);
    setMacroDistribution(null);
    setMicronutrients(null);

    try {
      const file = new FileSystem.File(photo.uri);
      const imageBase64 = await file.base64();

      const response = await fetch(`${API_URL}/nano/analyze-meal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalKey: selectedGoal.id,
          goalLabel: selectedGoal.label,
          imageBase64,
          imageMimeType: photo.mimeType,
          fileName: photo.fileName,
        }),
      });

      const payload = (await response.json().catch(() => null)) as AnalyzeMealResponse | null;
      if (!response.ok) {
        const message =
          (payload as { message?: string } | null)?.message ?? 'No se pudo analizar la imagen.';
        throw new Error(message);
      }

      if (!payload?.feedback) {
        throw new Error('Nano no devolvio una recomendacion util.');
      }

      const sanitizedMacronutrients = sanitizeMacronutrients(payload.macronutrients);
      const sanitizedDistribution = sanitizeMacroDistribution(payload.macroDistribution);
      const sanitizedMicronutrients = sanitizeMicronutrients(payload.micronutrients);

      setAnalysisText(payload.feedback);
      setAnalysisWordCount(payload.wordCount ?? null);
      setMacronutrients(sanitizedMacronutrients);
      setMacroDistribution(sanitizedDistribution);
      setMicronutrients(sanitizedMicronutrients);

      await saveNanoHistoryEntry({
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        goalLabel: selectedGoal.label,
        photoUri: photo.uri,
        feedback: payload.feedback,
        wordCount: payload.wordCount ?? null,
        macronutrients: sanitizedMacronutrients,
        micronutrients: sanitizedMicronutrients,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo analizar la comida.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Asistente IA</Text>
            <Text style={styles.title}>Nano</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </Pressable>
        </View>

        <View style={styles.speechBubble}>
          <View style={styles.speechHeader}>
            <View style={styles.speechIndicator} />
            <Text style={styles.speechTitle}>Analisis de comida</Text>
          </View>
          <Text style={styles.speechText}>{DIALOG_TEXT}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Para que quieres evaluar la comida</Text>
          <Text style={styles.sectionSubtitle}>
            Selecciona el perfil que Nano debe considerar al revisar tu plato.
          </Text>

          <View style={styles.goalList}>
            {FOOD_GOALS.map((goal) => {
              const isActive = goal.id === selectedGoalId;
              return (
                <TouchableOpacity
                  key={goal.id}
                  style={[
                    styles.goalCard,
                    isActive && {
                      borderColor: goal.accent,
                      backgroundColor: colorAlpha(goal.accent, '18'),
                    },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedGoalId(goal.id)}
                >
                  <View style={[styles.goalIcon, { backgroundColor: colorAlpha(goal.accent, '22') }]}>
                    <Ionicons name={goal.icon} size={20} color={goal.accent} />
                  </View>
                  <View style={styles.goalContent}>
                    <Text style={styles.goalLabel}>{goal.label}</Text>
                    <Text style={styles.goalDescription}>{goal.description}</Text>
                  </View>
                  <Ionicons
                    name={isActive ? 'radio-button-on' : 'radio-button-off'}
                    size={20}
                    color={isActive ? goal.accent : appColors.textMuted}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Toma la foto de tu comida</Text>
          <Text style={styles.sectionSubtitle}>
            Usa la camara del telefono para capturar el plato que quieres evaluar.
          </Text>

          <View style={styles.cameraCard}>
            {photo ? (
              <View style={styles.previewWrap}>
                <Image source={{ uri: photo.uri }} style={styles.foodPreview} resizeMode="cover" />
                {submitting ? (
                  <View style={styles.scanOverlay} pointerEvents="none">
                    <View style={styles.scanFrame} />
                    <Animated.View
                      style={[
                        styles.scanLine,
                        {
                          transform: [{ translateY: scanTranslate }],
                        },
                      ]}
                    />
                    <View style={styles.scanBadge}>
                      <Ionicons name="scan-outline" size={14} color={appColors.text} />
                      <Text style={styles.scanBadgeText}>Escaneando composicion</Text>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.placeholderWrap}>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="camera-outline" size={34} color={appColors.info} />
                </View>
                <Text style={styles.placeholderTitle}>Sin foto todavia</Text>
                <Text style={styles.placeholderText}>
                  Cuando tomes la foto aparecera aqui la vista previa de tu comida.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.floatingCameraButton, capturing && styles.buttonDisabled]}
              activeOpacity={0.9}
              onPress={() => void handleTakePhoto()}
              disabled={capturing}
            >
              <Ionicons
                name={photo ? 'camera-reverse-outline' : 'camera'}
                size={16}
                color={appColors.text}
              />
              <Text style={styles.floatingCameraButtonText}>
                {capturing ? 'Abriendo...' : photo ? 'Otra foto' : 'Tomar foto'}
              </Text>
            </TouchableOpacity>
          </View>

          {photo ? (
            <View style={styles.photoMetaRow}>
              <Text style={styles.photoMetaText}>Foto lista para analizar</Text>
              <TouchableOpacity
                style={styles.removePhotoButton}
                activeOpacity={0.9}
                onPress={() => {
                  setPhoto(null);
                  setAnalysisText(null);
                  setAnalysisWordCount(null);
                  setMacronutrients(null);
                  setMacroDistribution(null);
                  setMicronutrients(null);
                }}
              >
                <Ionicons name="trash-outline" size={16} color={appColors.accent} />
                <Text style={styles.removePhotoButtonText}>Quitar foto</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.historyButton}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NanoHistorial')}
          >
            <View style={styles.historyButtonIcon}>
              <Ionicons name="time-outline" size={18} color={appColors.info} />
            </View>
            <View style={styles.historyButtonCopy}>
              <Text style={styles.historyButtonTitle}>Ver historial</Text>
              <Text style={styles.historyButtonSubtitle}>
                Revisa los ultimos analisis guardados de Nano.
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={appColors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={selectedGoal.accent} />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Objetivo seleccionado</Text>
              <Text style={styles.summaryValue}>{selectedGoal.label}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Ionicons
              name={photo ? 'image-outline' : 'alert-circle-outline'}
              size={20}
              color={photo ? appColors.success : appColors.textMuted}
            />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Estado de la foto</Text>
              <Text style={styles.summaryValue}>
                {photo ? 'Foto lista para analizar' : 'Aun no has tomado la foto'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRow}>
            <Ionicons
              name={analysisText ? 'sparkles-outline' : 'chatbubble-ellipses-outline'}
              size={20}
              color={analysisText ? appColors.info : appColors.textMuted}
            />
            <View style={styles.summaryTextWrap}>
              <Text style={styles.summaryLabel}>Respuesta de Nano</Text>
              <Text style={styles.summaryValue}>
                {analysisText
                  ? `Lista${analysisWordCount ? ` - ${analysisWordCount} palabras` : ''}`
                  : 'Todavia no se ha generado'}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.readyButton, (!photo || submitting) && styles.buttonDisabled]}
          activeOpacity={0.9}
          onPress={() => void handleAnalyze()}
          disabled={!photo || submitting}
        >
          {submitting ? (
            <ActivityIndicator color={appColors.text} />
          ) : (
            <Ionicons name="sparkles-outline" size={18} color={appColors.text} />
          )}
          <Text style={styles.readyButtonText}>
            {submitting ? 'Analizando comida...' : 'Analizar con Nano'}
          </Text>
        </TouchableOpacity>

        {analysisText ? (
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={appColors.info} />
              <Text style={styles.analysisTitle}>Respuesta de Nano</Text>
            </View>
            <Text style={styles.analysisText}>{analysisText}</Text>
            {macroHighlights.length ? (
              <View style={styles.analysisMetricGrid}>
                {macroHighlights.map((item) => (
                  <View
                    key={item.key}
                    style={[
                      styles.analysisMetricChip,
                      {
                        borderColor: colorAlpha(item.accent, '70'),
                        backgroundColor: colorAlpha(item.accent, '18'),
                      },
                    ]}
                  >
                    <Text style={[styles.analysisMetricLabel, { color: item.accent }]}>{item.label}</Text>
                    <Text style={styles.analysisMetricValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ) : null}
            <Text style={styles.analysisCaption}>
              Estimaciones aproximadas calculadas desde la foto del plato.
            </Text>
          </View>
        ) : null}

        {macronutrients || composition ? (
          <View style={styles.compositionCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="analytics-outline" size={20} color={appColors.success} />
              <Text style={styles.analysisTitle}>Macronutrientes estimados</Text>
            </View>
            <Text style={styles.compositionSubtitle}>
              Cantidades aproximadas y distribucion calorica principal del plato.
            </Text>

            {macroHighlights.length ? (
              <View style={styles.macroGrid}>
                {macroHighlights.map((item) => (
                  <View key={item.key} style={styles.macroCard}>
                    <View style={[styles.macroDot, { backgroundColor: item.accent }]} />
                    <Text style={styles.macroCardLabel}>{item.label}</Text>
                    <Text style={styles.macroCardValue}>{item.value}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.pendingMacroCard}>
                <Ionicons name="information-circle-outline" size={18} color={appColors.info} />
                <Text style={styles.pendingMacroText}>
                  Nano no envio gramos detallados, pero si hay distribucion porcentual disponible.
                </Text>
              </View>
            )}

            {composition ? (
              <View style={styles.distributionCard}>
                <Text style={styles.distributionTitle}>Distribucion calorica</Text>
                <View style={styles.distributionBar}>
                  {composition.map((item) => (
                    <View
                      key={item.key}
                      style={[
                        styles.distributionSegment,
                        {
                          width: `${item.percentage}%`,
                          backgroundColor: item.accent,
                        },
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.compositionList}>
                  {composition.map((item) => (
                    <View key={item.key} style={styles.compositionRow}>
                      <View style={styles.compositionHeader}>
                        <View style={styles.compositionLabelWrap}>
                          <View style={[styles.compositionDot, { backgroundColor: item.accent }]} />
                          <Text style={styles.compositionLabel}>{item.label}</Text>
                        </View>
                        <Text style={styles.compositionValue}>{item.percentage}%</Text>
                      </View>
                      <View style={styles.compositionMetaRow}>
                        <Text style={styles.compositionMetaText}>
                          {typeof item.grams === 'number'
                            ? formatGramValue(item.grams)
                            : 'Sin gramos exactos'}
                        </Text>
                        <Text style={styles.compositionMetaText}>
                          {typeof item.calories === 'number'
                            ? `${Math.round(item.calories)} kcal`
                            : 'Sin kcal'}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </View>
        ) : null}

        {micronutrients ? (
          <View style={styles.microCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="leaf-outline" size={20} color={appColors.info} />
              <Text style={styles.analysisTitle}>Vitaminas y minerales</Text>
            </View>
            <Text style={styles.compositionSubtitle}>
              Aporte estimado de micronutrientes presentes en la comida analizada.
            </Text>

            <View style={styles.microList}>
              {micronutrients.map((item) => (
                <View key={item.key} style={styles.microRow}>
                  <View style={styles.microRowHeader}>
                    <View style={styles.microTitleWrap}>
                      <View style={[styles.microDot, { backgroundColor: item.accent }]} />
                      <Text style={styles.microCell}>{item.label}</Text>
                    </View>
                    <Text style={styles.microCellValue}>{item.amount}</Text>
                  </View>
                  <View style={styles.microProgressMeta}>
                    <Text style={styles.microPercentLabel}>Cobertura estimada</Text>
                    <Text style={[styles.microPercentValue, { color: item.accent }]}>
                      {Math.round(item.dailyValuePercent)}%
                    </Text>
                  </View>
                  <View style={styles.microTrack}>
                    <View
                      style={[
                        styles.microFill,
                        {
                          width: `${Math.min(Math.max(item.dailyValuePercent, 0), 100)}%`,
                          backgroundColor: item.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 18,
    paddingBottom: 28,
    backgroundColor: appColors.background,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  eyebrow: {
    color: appColors.info,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
  },
  title: {
    color: appColors.text,
    fontSize: 32,
    fontWeight: '800',
    marginTop: 6,
  },
  closeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: appColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
  },
  speechBubble: {
    marginTop: 24,
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 26,
    paddingHorizontal: 22,
    paddingVertical: 20,
  },
  speechHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  speechIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: appColors.accent,
    marginRight: 10,
  },
  speechTitle: {
    color: appColors.accent,
    fontSize: 18,
    fontWeight: '800',
  },
  speechText: {
    color: appColors.textSoft,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '500',
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: appColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
  },
  goalList: {
    marginTop: 14,
    gap: 12,
  },
  goalCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalIcon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  goalContent: {
    flex: 1,
    paddingRight: 12,
  },
  goalLabel: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  goalDescription: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginTop: 4,
  },
  cameraCard: {
    marginTop: 14,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    overflow: 'hidden',
    minHeight: 260,
    position: 'relative',
  },
  previewWrap: {
    width: '100%',
    height: SCAN_OVERLAY_HEIGHT,
  },
  foodPreview: {
    width: '100%',
    height: SCAN_OVERLAY_HEIGHT,
  },
  scanOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    padding: 14,
  },
  scanFrame: {
    ...StyleSheet.absoluteFillObject,
    margin: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '90'),
  },
  scanLine: {
    position: 'absolute',
    left: 14,
    right: 14,
    top: 14,
    height: 16,
    borderRadius: 10,
    backgroundColor: colorAlpha(appColors.info, '40'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.text, '55'),
    shadowColor: appColors.info,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  scanBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: colorAlpha(appColors.background, 'C8'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '60'),
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scanBadgeText: {
    color: appColors.text,
    fontSize: 12,
    fontWeight: '800',
  },
  placeholderWrap: {
    minHeight: 260,
    paddingHorizontal: 22,
    paddingVertical: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '18'),
    marginBottom: 16,
  },
  placeholderTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  placeholderText: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
    marginTop: 8,
    maxWidth: 280,
  },
  floatingCameraButton: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    minHeight: 40,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colorAlpha(appColors.info, 'E8'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.text, '26'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: appColors.overlay,
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  floatingCameraButtonText: {
    color: appColors.text,
    fontSize: 13,
    fontWeight: '800',
  },
  photoMetaRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  photoMetaText: {
    color: appColors.textMuted,
    fontSize: 13,
    fontWeight: '700',
  },
  removePhotoButton: {
    minHeight: 36,
    borderRadius: 14,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '88'),
    backgroundColor: colorAlpha(appColors.accent, '12'),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  removePhotoButtonText: {
    color: appColors.accent,
    fontSize: 13,
    fontWeight: '800',
  },
  historyButton: {
    marginTop: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '16'),
  },
  historyButtonCopy: {
    flex: 1,
  },
  historyButtonTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  historyButtonSubtitle: {
    marginTop: 4,
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  summaryCard: {
    marginTop: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 18,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  summaryValue: {
    color: appColors.text,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 4,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: appColors.border,
    marginVertical: 16,
  },
  readyButton: {
    marginTop: 18,
    minHeight: 54,
    borderRadius: 20,
    backgroundColor: appColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
  },
  readyButtonText: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  analysisCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '88'),
    backgroundColor: colorAlpha(appColors.info, '14'),
    padding: 18,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  analysisTitle: {
    color: appColors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  analysisText: {
    color: appColors.textSoft,
    fontSize: 15,
    lineHeight: 24,
  },
  analysisMetricGrid: {
    marginTop: 16,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  analysisMetricChip: {
    minWidth: '30%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  analysisMetricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  analysisMetricValue: {
    marginTop: 4,
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  analysisCaption: {
    marginTop: 14,
    color: appColors.textMuted,
    fontSize: 12,
    lineHeight: 18,
  },
  compositionCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '88'),
    backgroundColor: colorAlpha(appColors.success, '12'),
    padding: 18,
  },
  compositionSubtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  macroCard: {
    width: '47%',
    borderRadius: 18,
    backgroundColor: colorAlpha(appColors.background, '52'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'B0'),
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  macroDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  macroCardLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  macroCardValue: {
    marginTop: 6,
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  pendingMacroCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '70'),
    backgroundColor: colorAlpha(appColors.info, '12'),
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pendingMacroText: {
    flex: 1,
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  distributionCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'B8'),
    backgroundColor: colorAlpha(appColors.background, '54'),
    padding: 16,
  },
  distributionTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  distributionBar: {
    flexDirection: 'row',
    height: 18,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colorAlpha(appColors.textMuted, '24'),
  },
  distributionSegment: {
    height: '100%',
  },
  compositionList: {
    marginTop: 16,
    gap: 12,
  },
  compositionRow: {
    gap: 8,
  },
  compositionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  compositionLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  compositionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  compositionLabel: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  compositionValue: {
    color: appColors.textSoft,
    fontSize: 14,
    fontWeight: '800',
  },
  compositionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  compositionMetaText: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  microCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '88'),
    backgroundColor: colorAlpha(appColors.info, '10'),
    padding: 18,
  },
  microList: {
    gap: 12,
  },
  microRow: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: colorAlpha(appColors.backgroundMuted, '70'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'A8'),
  },
  microRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  microTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  microDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  microCell: {
    flex: 1,
    color: appColors.text,
    fontSize: 14,
    fontWeight: '600',
  },
  microCellValue: {
    minWidth: 68,
    color: appColors.textSoft,
    fontSize: 14,
    fontWeight: '800',
    textAlign: 'right',
  },
  microProgressMeta: {
    marginTop: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  microPercentLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  microPercentValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  microTrack: {
    height: 10,
    borderRadius: 999,
    backgroundColor: colorAlpha(appColors.textMuted, '26'),
    overflow: 'hidden',
  },
  microFill: {
    height: '100%',
    borderRadius: 999,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
