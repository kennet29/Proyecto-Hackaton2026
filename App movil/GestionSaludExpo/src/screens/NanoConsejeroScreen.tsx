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
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Svg, { Circle, G } from 'react-native-svg';
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

type PieSlice = {
  key: string;
  label: string;
  grams: number;
  percentage: number;
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
  fiber: '#38E28E',
  sugar: '#F59E0B',
} as const;

const MICRO_ACCENTS = ['#29B6FF', '#38E28E', '#FDBA74', '#FF4D73', '#A3E635', '#F97316'];
const MAX_MEAL_NOTE_LENGTH = 180;

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

function buildPieSlices(macronutrients: MacronutrientBreakdown | null): PieSlice[] {
  if (!macronutrients) {
    return [];
  }

  const candidates = [
    {
      key: 'carbohydrates',
      label: 'Carbohidratos',
      grams: Math.max(macronutrients.carbohydratesGrams, 0),
      accent: MACRO_ACCENTS.carbohydrates,
    },
    {
      key: 'protein',
      label: 'Proteinas',
      grams: Math.max(macronutrients.proteinGrams, 0),
      accent: MACRO_ACCENTS.protein,
    },
    {
      key: 'fat',
      label: 'Grasas',
      grams: Math.max(macronutrients.fatGrams, 0),
      accent: MACRO_ACCENTS.fat,
    },
    {
      key: 'fiber',
      label: 'Fibra',
      grams: Math.max(macronutrients.fiberGrams, 0),
      accent: MACRO_ACCENTS.fiber,
    },
    {
      key: 'sugar',
      label: 'Azucares',
      grams: Math.max(macronutrients.sugarGrams, 0),
      accent: MACRO_ACCENTS.sugar,
    },
  ].filter((item) => item.grams > 0);

  const total = candidates.reduce((sum, item) => sum + item.grams, 0);
  if (total <= 0) {
    return [];
  }

  return candidates.map((item) => ({
    ...item,
    percentage: Math.round((item.grams / total) * 100),
  }));
}

function splitFeedbackIntoPoints(feedback?: string | null) {
  if (!feedback) {
    return [];
  }

  const normalized = feedback
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+|\n+/)
    .map((part) => part.trim())
    .filter(Boolean);

  return normalized.slice(0, 4);
}

function PieChart({
  slices,
  size = 180,
  strokeWidth = 32,
}: {
  slices: PieSlice[];
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  let accumulated = 0;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colorAlpha(appColors.textMuted, '22')}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {slices.map((slice) => {
          const sliceLength = (slice.percentage / 100) * circumference;
          const element = (
            <Circle
              key={slice.key}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={slice.accent}
              strokeWidth={strokeWidth}
              strokeLinecap="butt"
              fill="none"
              strokeDasharray={`${sliceLength} ${circumference - sliceLength}`}
              strokeDashoffset={-accumulated}
            />
          );

          accumulated += sliceLength;
          return element;
        })}
      </G>
    </Svg>
  );
}

export function NanoConsejeroScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [activeView, setActiveView] = useState<'capture' | 'results'>('capture');
  const [selectedGoalId, setSelectedGoalId] = useState<string>(FOOD_GOALS[0].id);
  const [photo, setPhoto] = useState<CapturedPhoto | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [mealNote, setMealNote] = useState('');
  const [analysisText, setAnalysisText] = useState<string | null>(null);
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
  const pieSlices = useMemo(() => buildPieSlices(macronutrients), [macronutrients]);
  const piePercentByKey = useMemo(
    () =>
      Object.fromEntries(pieSlices.map((item) => [item.key, item.percentage])) as Record<string, number>,
    [pieSlices],
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
              value: `${formatGramValue(macronutrients.proteinGrams)}${typeof piePercentByKey.protein === 'number' ? ` - ${piePercentByKey.protein}%` : ''}`,
              accent: MACRO_ACCENTS.protein,
            },
            {
              key: 'carbohydrates',
              label: 'Carbohidratos',
              value: `${formatGramValue(macronutrients.carbohydratesGrams)}${typeof piePercentByKey.carbohydrates === 'number' ? ` - ${piePercentByKey.carbohydrates}%` : ''}`,
              accent: MACRO_ACCENTS.carbohydrates,
            },
            {
              key: 'fat',
              label: 'Grasas',
              value: `${formatGramValue(macronutrients.fatGrams)}${typeof piePercentByKey.fat === 'number' ? ` - ${piePercentByKey.fat}%` : ''}`,
              accent: MACRO_ACCENTS.fat,
            },
            {
              key: 'fiber',
              label: 'Fibra',
              value: `${formatGramValue(macronutrients.fiberGrams)}${typeof piePercentByKey.fiber === 'number' ? ` - ${piePercentByKey.fiber}%` : ''}`,
              accent: MACRO_ACCENTS.fiber,
            },
            {
              key: 'sugar',
              label: 'Azucares',
              value: `${formatGramValue(macronutrients.sugarGrams)}${typeof piePercentByKey.sugar === 'number' ? ` - ${piePercentByKey.sugar}%` : ''}`,
              accent: MACRO_ACCENTS.sugar,
            },
          ]
        : [],
    [macronutrients, piePercentByKey, selectedGoal.accent],
  );
  const primaryHighlights = useMemo(
    () =>
      macroHighlights.filter((item) =>
        ['calories', 'protein', 'carbohydrates', 'fat'].includes(item.key),
      ),
    [macroHighlights],
  );
  const analysisPoints = useMemo(() => splitFeedbackIntoPoints(analysisText), [analysisText]);
  const micronutrientHighlights = useMemo(() => micronutrients?.slice(0, 4) ?? [], [micronutrients]);

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
      setMacronutrients(null);
      setMacroDistribution(null);
      setMicronutrients(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la camara.');
    } finally {
      setCapturing(false);
    }
  };

  const handlePickFromGallery = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la galeria para seleccionar una foto.');
      return;
    }

    setCapturing(true);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      const asset = result.assets[0];
      setPhoto({
        uri: asset.uri,
        mimeType: asset.mimeType ?? 'image/jpeg',
        fileName: asset.fileName ?? `meal-gallery-${Date.now()}.jpg`,
      });
      setAnalysisText(null);
      setMacronutrients(null);
      setMacroDistribution(null);
      setMicronutrients(null);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la galeria.');
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
    setMacronutrients(null);
    setMacroDistribution(null);
    setMicronutrients(null);

    try {
      const file = new FileSystem.File(photo.uri);
      const imageBase64 = await file.base64();
      const trimmedMealNote = mealNote.trim();

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
          userNote: trimmedMealNote || undefined,
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
      setMacronutrients(sanitizedMacronutrients);
      setMacroDistribution(sanitizedDistribution);
      setMicronutrients(sanitizedMicronutrients);
      setActiveView('results');

      await saveNanoHistoryEntry({
        id: `${Date.now()}`,
        createdAt: new Date().toISOString(),
        goalLabel: selectedGoal.label,
        photoUri: photo.uri,
        feedback: payload.feedback,
        userNote: trimmedMealNote || null,
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
            <AppText style={styles.eyebrow}>Asistente IA</AppText>
            <AppText style={styles.title}>Nano</AppText>
          </View>
          <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </Pressable>
        </View>

        <View style={styles.speechBubble}>
          <View style={styles.speechHeader}>
            <View style={styles.speechIndicator} />
            <AppText style={styles.speechTitle}>Analisis de comida</AppText>
          </View>
          <AppText style={styles.speechText}>{DIALOG_TEXT}</AppText>
        </View>

        <View style={styles.viewSwitcher}>
          <TouchableOpacity
            style={[styles.viewTab, activeView === 'capture' && styles.viewTabActive]}
            activeOpacity={0.9}
            onPress={() => setActiveView('capture')}
          >
            <Ionicons
              name="camera-outline"
              size={16}
              color={activeView === 'capture' ? appColors.text : appColors.textMuted}
            />
            <AppText
              style={[
                styles.viewTabText,
                activeView === 'capture' && styles.viewTabTextActive,
              ]}
            >
              Captura
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.viewTab, activeView === 'results' && styles.viewTabActive]}
            activeOpacity={0.9}
            onPress={() => setActiveView('results')}
          >
            <Ionicons
              name="analytics-outline"
              size={16}
              color={activeView === 'results' ? appColors.text : appColors.textMuted}
            />
            <AppText
              style={[
                styles.viewTabText,
                activeView === 'results' && styles.viewTabTextActive,
              ]}
            >
              Resultados
            </AppText>
          </TouchableOpacity>
        </View>

        {activeView === 'capture' ? (
          <>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Para que quieres evaluar la comida</AppText>
          <AppText style={styles.sectionSubtitle}>
            Selecciona el perfil que Nano debe considerar al revisar tu plato.
          </AppText>

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
                    <AppText style={styles.goalLabel}>{goal.label}</AppText>
                    <AppText style={styles.goalDescription}>{goal.description}</AppText>
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
          <AppText style={styles.sectionTitle}>2. Toma la foto de tu comida</AppText>
          <AppText style={styles.sectionSubtitle}>
            Usa la camara del telefono para capturar el plato que quieres evaluar.
          </AppText>

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
                      <AppText style={styles.scanBadgeText}>Escaneando composicion</AppText>
                    </View>
                  </View>
                ) : null}
              </View>
            ) : (
              <View style={styles.placeholderWrap}>
                <View style={styles.placeholderIcon}>
                  <Ionicons name="camera-outline" size={34} color={appColors.info} />
                </View>
                <AppText style={styles.placeholderTitle}>Sin foto todavia</AppText>
                <AppText style={styles.placeholderText}>
                  Cuando tomes la foto aparecera aqui la vista previa de tu comida.
                </AppText>
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
              <AppText style={styles.floatingCameraButtonText}>
                {capturing ? 'Abriendo...' : photo ? 'Otra foto' : 'Tomar foto'}
              </AppText>
            </TouchableOpacity>
          </View>

          {photo ? (
            <View style={styles.photoMetaRow}>
              <AppText style={styles.photoMetaText}>Foto lista para analizar</AppText>
              <TouchableOpacity
                style={styles.removePhotoButton}
                activeOpacity={0.9}
                onPress={() => {
                  setPhoto(null);
                  setAnalysisText(null);
                  setMacronutrients(null);
                  setMacroDistribution(null);
                  setMicronutrients(null);
                }}
              >
                <Ionicons name="trash-outline" size={16} color={appColors.accent} />
                <AppText style={styles.removePhotoButtonText}>Quitar foto</AppText>
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
              <AppText style={styles.historyButtonTitle}>Ver historial</AppText>
              <AppText style={styles.historyButtonSubtitle}>
                Revisa los ultimos analisis guardados de Nano.
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={appColors.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.galleryButton}
            activeOpacity={0.9}
            onPress={() => void handlePickFromGallery()}
            disabled={capturing}
          >
            <View style={styles.galleryButtonIcon}>
              <Ionicons name="images-outline" size={18} color={appColors.accent} />
            </View>
            <View style={styles.historyButtonCopy}>
              <AppText style={styles.galleryButtonTitle}>Escoger de galeria</AppText>
              <AppText style={styles.galleryButtonSubtitle}>
                Selecciona una foto guardada para analizarla con Nano.
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={18} color={appColors.textMuted} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. Nota opcional sobre la comida</AppText>
          <AppText style={styles.sectionSubtitle}>
            Si quieres, agrega una nota corta con contexto como ingredientes, porcion o preparacion.
          </AppText>

          <View style={styles.noteCard}>
            <AppTextInput
              style={styles.noteInput}
              placeholder="Ejemplo: pollo a la plancha con poca sal y sin salsa"
              placeholderTextColor={appColors.textMuted}
              value={mealNote}
              onChangeText={(value) => setMealNote(value.slice(0, MAX_MEAL_NOTE_LENGTH))}
              maxLength={MAX_MEAL_NOTE_LENGTH}
              multiline
              textAlignVertical="top"
            />
            <AppText style={styles.noteCounter}>{mealNote.trim().length}/{MAX_MEAL_NOTE_LENGTH}</AppText>
          </View>
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Ionicons name="checkmark-circle-outline" size={20} color={selectedGoal.accent} />
            <View style={styles.summaryTextWrap}>
              <AppText style={styles.summaryLabel}>Objetivo seleccionado</AppText>
              <AppText style={styles.summaryValue}>{selectedGoal.label}</AppText>
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
              <AppText style={styles.summaryLabel}>Estado de la foto</AppText>
              <AppText style={styles.summaryValue}>
                {photo ? 'Foto lista para analizar' : 'Aun no has tomado la foto'}
              </AppText>
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
              <AppText style={styles.summaryLabel}>Respuesta de Nano</AppText>
              <AppText style={styles.summaryValue}>
                {analysisText ? 'Lista para revisar' : 'Todavia no se ha generado'}
              </AppText>
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
          <AppText style={styles.readyButtonText}>
            {submitting ? 'Analizando comida...' : 'Analizar con Nano'}
          </AppText>
        </TouchableOpacity>
          </>
        ) : null}

        {activeView === 'results' && analysisText ? (
          <View style={styles.analysisCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={appColors.info} />
              <AppText style={styles.analysisTitle}>Respuesta de Nano</AppText>
            </View>
            <AppText style={styles.analysisIntro}>
              Esta recomendacion esta basada en la foto y en el objetivo que elegiste: {selectedGoal.label}.
            </AppText>
            <View style={styles.analysisPointList}>
              {(analysisPoints.length ? analysisPoints : [analysisText]).map((point, index) => (
                <View key={`${point}-${index}`} style={styles.analysisPointRow}>
                  <View style={styles.analysisPointBullet}>
                    <Ionicons name="checkmark" size={12} color={appColors.text} />
                  </View>
                  <AppText style={styles.analysisPointText}>{point}</AppText>
                </View>
              ))}
            </View>
            <AppText style={styles.analysisCaption}>
              Estos valores son estimados y sirven como guia rapida.
            </AppText>
          </View>
        ) : null}

        {activeView === 'results' && primaryHighlights.length ? (
          <View style={styles.quickStatsCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="flash-outline" size={20} color={appColors.success} />
              <AppText style={styles.analysisTitle}>Datos principales</AppText>
            </View>
            <View style={styles.quickStatsGrid}>
              {primaryHighlights.map((item) => (
                <View key={item.key} style={styles.quickStatCard}>
                  <AppText style={[styles.quickStatLabel, { color: item.accent }]}>{item.label}</AppText>
                  <AppText style={styles.quickStatValue}>{item.value}</AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {activeView === 'results' && composition ? (
          <View style={styles.balanceCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="analytics-outline" size={20} color={appColors.accent} />
              <AppText style={styles.analysisTitle}>Balance del plato</AppText>
            </View>
            <AppText style={styles.balanceSubtitle}>
              Asi se reparte la mayor parte de la energia del plato.
            </AppText>
            <View style={styles.balanceList}>
              {composition.map((item) => (
                <View key={item.key} style={styles.balanceRow}>
                  <View style={styles.balanceRowHeader}>
                    <AppText style={styles.balanceLabel}>{item.label}</AppText>
                    <AppText style={styles.balanceValue}>{item.percentage}%</AppText>
                  </View>
                  <View style={styles.balanceTrack}>
                    <View
                      style={[
                        styles.balanceFill,
                        { width: `${item.percentage}%`, backgroundColor: item.accent },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {activeView === 'results' && micronutrientHighlights.length ? (
          <View style={styles.microSimpleCard}>
            <View style={styles.analysisHeader}>
              <Ionicons name="leaf-outline" size={20} color={appColors.info} />
              <AppText style={styles.analysisTitle}>Vitaminas y minerales destacados</AppText>
            </View>
            <View style={styles.microChipGrid}>
              {micronutrientHighlights.map((item) => (
                <View key={item.key} style={styles.microChip}>
                  <AppText style={styles.microChipLabel}>{item.label}</AppText>
                  <AppText style={styles.microChipValue}>{item.amount}</AppText>
                  <AppText style={[styles.microChipPercent, { color: item.accent }]}>
                    {Math.round(item.dailyValuePercent)}% aprox.
                  </AppText>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {activeView === 'results' && !analysisText && !macronutrients && !micronutrients ? (
          <View style={styles.resultsEmptyCard}>
            <Ionicons name="sparkles-outline" size={24} color={appColors.info} />
            <AppText style={styles.resultsEmptyTitle}>Todavia no hay resultados</AppText>
            <AppText style={styles.resultsEmptyText}>
              Usa la vista de captura para tomar o escoger una foto y luego analizarla con Nano.
            </AppText>
            <TouchableOpacity
              style={styles.resultsEmptyButton}
              activeOpacity={0.9}
              onPress={() => setActiveView('capture')}
            >
              <AppText style={styles.resultsEmptyButtonText}>Ir a captura</AppText>
            </TouchableOpacity>
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
  viewSwitcher: {
    marginTop: 18,
    padding: 6,
    borderRadius: 22,
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    flexDirection: 'row',
    gap: 8,
  },
  viewTab: {
    flex: 1,
    minHeight: 46,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  viewTabActive: {
    backgroundColor: colorAlpha(appColors.info, '22'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
  },
  viewTabText: {
    color: appColors.textMuted,
    fontSize: 14,
    fontWeight: '800',
  },
  viewTabTextActive: {
    color: appColors.text,
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
  galleryButton: {
    marginTop: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '70'),
    backgroundColor: colorAlpha(appColors.accent, '10'),
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  galleryButtonIcon: {
    width: 38,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.accent, '16'),
  },
  galleryButtonTitle: {
    color: appColors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  galleryButtonSubtitle: {
    marginTop: 4,
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 18,
  },
  noteCard: {
    marginTop: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surfaceStrong,
    padding: 16,
  },
  noteInput: {
    minHeight: 96,
    color: appColors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '500',
  },
  noteCounter: {
    marginTop: 10,
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
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
  analysisIntro: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
  },
  analysisPointList: {
    marginTop: 14,
    gap: 12,
  },
  analysisPointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  analysisPointBullet: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '48'),
  },
  analysisPointText: {
    flex: 1,
    color: appColors.text,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
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
  quickStatsCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '88'),
    backgroundColor: colorAlpha(appColors.success, '10'),
    padding: 18,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickStatCard: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    backgroundColor: colorAlpha(appColors.background, '52'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'A8'),
  },
  quickStatLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickStatValue: {
    marginTop: 8,
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  balanceCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '88'),
    backgroundColor: colorAlpha(appColors.accent, '10'),
    padding: 18,
  },
  balanceSubtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  balanceList: {
    gap: 12,
  },
  balanceRow: {
    gap: 8,
  },
  balanceRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  balanceValue: {
    color: appColors.textSoft,
    fontSize: 13,
    fontWeight: '800',
  },
  balanceTrack: {
    height: 12,
    borderRadius: 999,
    overflow: 'hidden',
    backgroundColor: colorAlpha(appColors.textMuted, '24'),
  },
  balanceFill: {
    height: '100%',
    borderRadius: 999,
  },
  microSimpleCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '88'),
    backgroundColor: colorAlpha(appColors.info, '10'),
    padding: 18,
  },
  microChipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  microChip: {
    width: '47%',
    borderRadius: 18,
    padding: 14,
    backgroundColor: colorAlpha(appColors.backgroundMuted, '88'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'A8'),
  },
  microChipLabel: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  microChipValue: {
    marginTop: 8,
    color: appColors.textSoft,
    fontSize: 13,
    fontWeight: '700',
  },
  microChipPercent: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: '800',
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
  pieCard: {
    marginTop: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'B8'),
    backgroundColor: colorAlpha(appColors.background, '54'),
    padding: 16,
  },
  pieSubtitle: {
    color: appColors.textSoft,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  pieLayout: {
    gap: 18,
  },
  pieChartWrap: {
    alignSelf: 'center',
    width: 180,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterBadge: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: appColors.surfaceStrong,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.border, 'C0'),
    alignItems: 'center',
    justifyContent: 'center',
  },
  pieCenterValue: {
    color: appColors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  pieCenterLabel: {
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  pieLegend: {
    gap: 10,
  },
  pieLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  pieLegendLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  pieLegendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  pieLegendLabel: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  pieLegendValues: {
    alignItems: 'flex-end',
  },
  pieLegendPercent: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  pieLegendGrams: {
    marginTop: 2,
    color: appColors.textMuted,
    fontSize: 12,
    fontWeight: '700',
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
  resultsEmptyCard: {
    marginTop: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '88'),
    backgroundColor: colorAlpha(appColors.info, '10'),
    padding: 24,
    alignItems: 'center',
  },
  resultsEmptyTitle: {
    marginTop: 14,
    color: appColors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  resultsEmptyText: {
    marginTop: 8,
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  resultsEmptyButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 16,
    paddingHorizontal: 18,
    backgroundColor: appColors.info,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultsEmptyButtonText: {
    color: appColors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
