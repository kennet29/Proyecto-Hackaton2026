/**
 * @file App movil/GestionSaludExpo/src/screens/NanoChefScreen.tsx
 * @description Recetas de Nano generadas únicamente a partir de texto.
 */

import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoChef'>;

type RecipeGoal = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  accent: string;
};

type RecipeContent = {
  title: string;
  servings: string;
  time: string;
  ingredients: string[];
  steps: string[];
  nanoTip: string;
};

type RecipeResponse = { recipe?: RecipeContent; goalLabel?: string };

const isRecipeContent = (value: unknown): value is RecipeContent => {
  if (!value || typeof value !== 'object') return false;
  const recipe = value as Partial<RecipeContent>;
  return (
    typeof recipe.title === 'string' &&
    typeof recipe.servings === 'string' &&
    typeof recipe.time === 'string' &&
    Array.isArray(recipe.ingredients) &&
    recipe.ingredients.every((item) => typeof item === 'string') &&
    Array.isArray(recipe.steps) &&
    recipe.steps.every((item) => typeof item === 'string') &&
    typeof recipe.nanoTip === 'string'
  );
};

const RECIPE_GOALS: RecipeGoal[] = [
  { id: 'weight-loss', label: 'Ligera y saciante', icon: 'leaf-outline', accent: appColors.success },
  { id: 'diabetes', label: 'Control de azucar', icon: 'water-outline', accent: appColors.accent },
  { id: 'muscle-gain', label: 'Alta en proteina', icon: 'barbell-outline', accent: appColors.info },
  { id: 'pregnancy', label: 'Embarazo', icon: 'flower-outline', accent: '#FDBA74' },
];

const QUICK_INGREDIENTS = ['pollo', 'huevo', 'arroz', 'frijoles', 'avena', 'tomate'];
const MAX_INGREDIENTS_LENGTH = 1_000;
const MAX_PREFERENCES_LENGTH = 500;

export function NanoChefScreen({ navigation }: Props) {
  const { token } = useAuth();
  const { width } = useWindowDimensions();
  const isWebWide = width >= 900;
  const [goalId, setGoalId] = useState(RECIPE_GOALS[0].id);
  const [ingredients, setIngredients] = useState('');
  const [allowNanoRecommendations, setAllowNanoRecommendations] = useState(false);
  const [preferences, setPreferences] = useState('');
  const [recipe, setRecipe] = useState<RecipeContent | null>(null);
  const [recipePage, setRecipePage] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const selectedGoal = useMemo(
    () => RECIPE_GOALS.find((goal) => goal.id === goalId) ?? RECIPE_GOALS[0],
    [goalId],
  );

  const addIngredient = (ingredient: string) => {
    const current = ingredients.trim();
    const values = current ? current.split(',').map((value) => value.trim().toLowerCase()) : [];
    if (values.includes(ingredient)) return;
    setIngredients(current ? `${current}, ${ingredient}` : ingredient);
  };

  const createRecipe = async () => {
    const normalizedIngredients = ingredients.trim();
    if (!allowNanoRecommendations && !normalizedIngredients) {
      Alert.alert('Agrega ingredientes', 'Escribe los ingredientes que tienes disponibles.');
      return;
    }
    if (!token) {
      Alert.alert('Sesion requerida', 'Necesitas iniciar sesion para usar Nano Chef.');
      return;
    }

    setSubmitting(true);
    setRecipe(null);
    setRecipePage(0);
    try {
      const response = await fetch(`${API_URL}/nano/chef`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          goalKey: selectedGoal.id,
          goalLabel: selectedGoal.label,
          ingredients: allowNanoRecommendations ? undefined : normalizedIngredients,
          allowNanoRecommendations,
          preferences: preferences.trim() || undefined,
        }),
      });
      const payload = (await response.json().catch(() => null)) as RecipeResponse | null;
      if (!response.ok || !isRecipeContent(payload?.recipe)) {
        const serverMessage = (payload as { message?: string } | null)?.message;
        throw new Error(
          serverMessage ??
            'Nano Chef necesita la versión actualizada del backend para mostrar esta receta.',
        );
      }
      setRecipe(payload.recipe);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo crear la receta.');
    } finally {
      setSubmitting(false);
    }
  };

  const recipePages = useMemo(() => {
    if (!recipe) return [];
    return [
      { key: 'summary', title: recipe.title, icon: 'restaurant-outline' as const, content: <><View style={styles.recipeMeta}><View style={styles.metaPill}><Ionicons name="people-outline" size={15} color={appColors.info} /><AppText style={styles.metaText}>{recipe.servings}</AppText></View><View style={styles.metaPill}><Ionicons name="time-outline" size={15} color={appColors.info} /><AppText style={styles.metaText}>{recipe.time}</AppText></View></View><AppText style={styles.carouselDescription}>Una receta pensada para tu objetivo: {selectedGoal.label}.</AppText></> },
      { key: 'ingredients', title: 'Ingredientes', icon: 'basket-outline' as const, content: <View style={styles.list}>{recipe.ingredients.map((ingredient, index) => <View key={`${ingredient}-${index}`} style={styles.listRow}><View style={styles.listBullet}><AppText style={styles.listBulletText}>{index + 1}</AppText></View><AppText style={styles.listText}>{ingredient}</AppText></View>)}</View> },
      { key: 'steps', title: 'Preparación', icon: 'list-outline' as const, content: <View style={styles.list}>{recipe.steps.map((step, index) => <View key={`${step}-${index}`} style={styles.listRow}><View style={[styles.listBullet, styles.stepBullet]}><AppText style={styles.listBulletText}>{index + 1}</AppText></View><AppText style={styles.listText}>{step}</AppText></View>)}</View> },
      { key: 'tip', title: 'Consejo de Nano', icon: 'sparkles-outline' as const, content: <View style={styles.tipBox}><Ionicons name="sparkles" size={23} color={appColors.success} /><AppText style={styles.tipText}>{recipe.nanoTip}</AppText></View> },
    ];
  }, [recipe, selectedGoal.label]);
  const activeRecipePage = recipePages[recipePage];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isWebWide && styles.containerWeb]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="restaurant-outline" size={24} color={appColors.background} /></View>
          <View style={styles.headerCopy}>
            <AppText style={styles.eyebrow}>Asistente IA</AppText>
            <AppText style={styles.title}>Nano Chef</AppText>
            <AppText style={styles.subtitle}>Recetas personalizadas sin fotos.</AppText>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityLabel="Cerrar Nano Chef">
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="sparkles-outline" size={20} color={appColors.success} />
          <AppText style={styles.infoText}>Escribe los ingredientes disponibles y Nano Chef te propone una receta. No se envían imágenes.</AppText>
        </View>

        <View style={[styles.contentGrid, isWebWide && styles.contentGridWeb]}>
          <View style={styles.formColumn}>
        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>1. Elige el objetivo</AppText>
          <View style={styles.goalGrid}>
            {RECIPE_GOALS.map((goal) => {
              const selected = goal.id === selectedGoal.id;
              return (
                <TouchableOpacity key={goal.id} style={[styles.goalCard, selected && { borderColor: goal.accent, backgroundColor: colorAlpha(goal.accent, '18') }]} onPress={() => setGoalId(goal.id)}>
                  <Ionicons name={goal.icon} size={20} color={goal.accent} />
                  <AppText style={styles.goalLabel}>{goal.label}</AppText>
                  <Ionicons name={selected ? 'radio-button-on' : 'radio-button-off'} size={18} color={selected ? goal.accent : appColors.textMuted} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>2. Ingredientes disponibles</AppText>
          <View style={[styles.recommendationToggle, allowNanoRecommendations && styles.recommendationToggleActive]}>
            <View style={styles.recommendationCopy}>
              <AppText style={styles.recommendationTitle}>No tengo ingredientes</AppText>
              <AppText style={styles.recommendationHint}>Nano Chef elegirá una receta adecuada a tu objetivo.</AppText>
            </View>
            <Switch value={allowNanoRecommendations} onValueChange={setAllowNanoRecommendations} trackColor={{ false: appColors.border, true: colorAlpha(appColors.success, '88') }} thumbColor={allowNanoRecommendations ? appColors.success : appColors.textMuted} />
          </View>
          {allowNanoRecommendations ? <View style={styles.recommendationNotice}><Ionicons name="bulb-outline" size={19} color={appColors.success} /><AppText style={styles.recommendationNoticeText}>Nano Chef recomendará los ingredientes y mantendrá el objetivo “{selectedGoal.label}”.</AppText></View> : null}
          <AppText style={styles.sectionSubtitle}>Sepáralos por comas. Puedes incluir cantidades si las sabes.</AppText>
          <AppTextInput
            style={[styles.input, allowNanoRecommendations && styles.ingredientsDisabled]}
            value={ingredients}
            onChangeText={(value) => setIngredients(value.slice(0, MAX_INGREDIENTS_LENGTH))}
            placeholder="Ej.: pollo, tomate, arroz, cebolla"
            placeholderTextColor={appColors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_INGREDIENTS_LENGTH}
            editable={!allowNanoRecommendations}
          />
          <View style={styles.chips}>
            {QUICK_INGREDIENTS.map((ingredient) => <TouchableOpacity key={ingredient} style={styles.chip} onPress={() => addIngredient(ingredient)}><AppText style={styles.chipText}>+ {ingredient}</AppText></TouchableOpacity>)}
          </View>
        </View>

        <View style={styles.section}>
          <AppText style={styles.sectionTitle}>3. Preferencias opcionales</AppText>
          <AppTextInput
            style={styles.input}
            value={preferences}
            onChangeText={(value) => setPreferences(value.slice(0, MAX_PREFERENCES_LENGTH))}
            placeholder="Ej.: sin lactosa, para 2 personas, pocos ingredientes"
            placeholderTextColor={appColors.textMuted}
            multiline
            textAlignVertical="top"
            maxLength={MAX_PREFERENCES_LENGTH}
          />
        </View>

        <TouchableOpacity style={[styles.primaryButton, submitting && styles.buttonDisabled]} onPress={() => void createRecipe()} disabled={submitting}>
          {submitting ? <ActivityIndicator color={appColors.background} /> : <Ionicons name="restaurant-outline" size={19} color={appColors.background} />}
          <AppText style={styles.primaryButtonText}>{submitting ? 'Nano Chef está cocinando...' : 'Crear receta'}</AppText>
        </TouchableOpacity>
          </View>

          <View style={[styles.recipeColumn, !recipe && styles.recipeColumnEmpty]}>
            {recipe ? (
              <View style={styles.recipeCard}>
                <View style={styles.recipeHeader}><Ionicons name="book-outline" size={20} color={selectedGoal.accent} /><AppText style={styles.recipeTitle}>Tu receta</AppText></View>
                <View style={styles.carouselProgress}>{recipePages.map((page, index) => <View key={page.key} style={[styles.progressDot, index === recipePage && { backgroundColor: selectedGoal.accent }]} />)}</View>
                {activeRecipePage ? <View style={styles.carouselPage}><View style={styles.carouselTitleRow}><View style={[styles.carouselIcon, { backgroundColor: colorAlpha(selectedGoal.accent, '18') }]}><Ionicons name={activeRecipePage.icon} size={20} color={selectedGoal.accent} /></View><AppText style={styles.carouselTitle}>{activeRecipePage.title}</AppText></View>{activeRecipePage.content}</View> : null}
                <View style={styles.carouselNav}><TouchableOpacity style={[styles.carouselButton, recipePage === 0 && styles.carouselButtonDisabled]} onPress={() => setRecipePage((current) => Math.max(0, current - 1))} disabled={recipePage === 0}><Ionicons name="chevron-back" size={18} color={appColors.info} /><AppText style={styles.carouselButtonText}>Anterior</AppText></TouchableOpacity><AppText style={styles.pageLabel}>{recipePage + 1} / {recipePages.length}</AppText><TouchableOpacity style={[styles.carouselButton, recipePage === recipePages.length - 1 && styles.carouselButtonDisabled]} onPress={() => setRecipePage((current) => Math.min(recipePages.length - 1, current + 1))} disabled={recipePage === recipePages.length - 1}><AppText style={styles.carouselButtonText}>Siguiente</AppText><Ionicons name="chevron-forward" size={18} color={appColors.info} /></TouchableOpacity></View>
                <TouchableOpacity style={styles.newRecipeButton} onPress={() => { setRecipe(null); setRecipePage(0); }}><Ionicons name="refresh-outline" size={17} color={appColors.info} /><AppText style={styles.newRecipeText}>Crear otra receta</AppText></TouchableOpacity>
              </View>
            ) : (
              <View style={styles.recipePlaceholder}>
                <View style={styles.recipePlaceholderIcon}><Ionicons name="restaurant-outline" size={30} color={appColors.success} /></View>
                <AppText style={styles.recipePlaceholderTitle}>Tu receta aparecerá aquí</AppText>
                <AppText style={styles.recipePlaceholderText}>Elige un objetivo, agrega los ingredientes y Nano Chef preparará una propuesta para ti.</AppText>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: appColors.background },
  container: { padding: 20, paddingBottom: 40, gap: 16, width: '100%' },
  containerWeb: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.success },
  headerCopy: { flex: 1 }, eyebrow: { color: appColors.success, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: appColors.text, fontSize: 28, fontWeight: '900' }, subtitle: { color: appColors.textMuted, fontSize: 13 },
  closeButton: { padding: 10, borderRadius: 12, backgroundColor: appColors.surface },
  infoCard: { flexDirection: 'row', gap: 10, borderRadius: 16, padding: 15, backgroundColor: colorAlpha(appColors.success, '12'), borderWidth: 1, borderColor: colorAlpha(appColors.success, '55') },
  infoText: { flex: 1, color: appColors.textSoft, fontSize: 13, lineHeight: 19 },
  contentGrid: { gap: 18 }, contentGridWeb: { flexDirection: 'row', alignItems: 'flex-start' }, formColumn: { flex: 1, gap: 16 }, recipeColumn: { flex: 1 }, recipeColumnEmpty: { minHeight: 260 },
  section: { gap: 9 }, sectionTitle: { color: appColors.text, fontSize: 16, fontWeight: '900' }, sectionSubtitle: { color: appColors.textMuted, fontSize: 13 },
  goalGrid: { gap: 9 }, goalCard: { minHeight: 54, paddingHorizontal: 13, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, flexDirection: 'row', alignItems: 'center', gap: 11 },
  goalLabel: { flex: 1, color: appColors.text, fontSize: 14, fontWeight: '800' },
  input: { minHeight: 88, padding: 13, borderWidth: 1, borderColor: appColors.border, borderRadius: 14, backgroundColor: appColors.surface, color: appColors.text, fontSize: 14 },
  ingredientsDisabled: { opacity: 0.35 },
  recommendationToggle: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 13, borderRadius: 14, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  recommendationToggleActive: { borderColor: colorAlpha(appColors.success, '99'), backgroundColor: colorAlpha(appColors.success, '12') },
  recommendationCopy: { flex: 1 }, recommendationTitle: { color: appColors.text, fontSize: 14, fontWeight: '900' }, recommendationHint: { color: appColors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 2 },
  recommendationNotice: { flexDirection: 'row', gap: 9, borderRadius: 13, padding: 12, backgroundColor: colorAlpha(appColors.success, '12') }, recommendationNoticeText: { flex: 1, color: appColors.textSoft, fontSize: 13, lineHeight: 19 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 }, chip: { borderWidth: 1, borderColor: colorAlpha(appColors.info, '66'), backgroundColor: colorAlpha(appColors.info, '12'), borderRadius: 99, paddingVertical: 7, paddingHorizontal: 10 }, chipText: { color: appColors.info, fontSize: 12, fontWeight: '800' },
  primaryButton: { minHeight: 52, borderRadius: 14, backgroundColor: appColors.success, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9 }, primaryButtonText: { color: appColors.background, fontSize: 15, fontWeight: '900' }, buttonDisabled: { opacity: 0.65 },
  recipeCard: { borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, padding: 16, gap: 12 }, recipeHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 }, recipeTitle: { color: appColors.text, fontSize: 17, fontWeight: '900' },
  carouselProgress: { flexDirection: 'row', gap: 6 }, progressDot: { flex: 1, height: 4, borderRadius: 4, backgroundColor: appColors.border }, carouselPage: { minHeight: 215, gap: 14 }, carouselTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 }, carouselIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }, carouselTitle: { flex: 1, color: appColors.text, fontSize: 18, fontWeight: '900' }, carouselDescription: { color: appColors.textSoft, fontSize: 14, lineHeight: 21 }, recipeMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, metaPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 99, paddingHorizontal: 10, paddingVertical: 7, backgroundColor: colorAlpha(appColors.info, '12') }, metaText: { color: appColors.textSoft, fontSize: 12, fontWeight: '800' }, list: { gap: 10 }, listRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 }, listBullet: { minWidth: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.info, '22') }, stepBullet: { backgroundColor: colorAlpha(appColors.success, '22') }, listBulletText: { color: appColors.text, fontSize: 11, fontWeight: '900' }, listText: { flex: 1, color: appColors.textSoft, fontSize: 14, lineHeight: 21 }, tipBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 14, borderRadius: 14, backgroundColor: colorAlpha(appColors.success, '12'), borderWidth: 1, borderColor: colorAlpha(appColors.success, '55') }, tipText: { flex: 1, color: appColors.textSoft, fontSize: 14, lineHeight: 21 }, carouselNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, carouselButton: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 8 }, carouselButtonDisabled: { opacity: 0.35 }, carouselButtonText: { color: appColors.info, fontSize: 13, fontWeight: '800' }, pageLabel: { color: appColors.textMuted, fontSize: 12, fontWeight: '800' },
  newRecipeButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 8 }, newRecipeText: { color: appColors.info, fontWeight: '800', fontSize: 13 },
  recipePlaceholder: { minHeight: 250, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface, alignItems: 'center', justifyContent: 'center', gap: 10 },
  recipePlaceholderIcon: { width: 62, height: 62, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.success, '18') }, recipePlaceholderTitle: { color: appColors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' }, recipePlaceholderText: { color: appColors.textMuted, fontSize: 13, lineHeight: 20, textAlign: 'center', maxWidth: 310 },
});
