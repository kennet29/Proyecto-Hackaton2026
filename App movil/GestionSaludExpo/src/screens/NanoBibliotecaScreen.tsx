import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'NanoBiblioteca'>;

type Guide = {
  id: string;
  title: string;
  category: string;
  size: string;
  icon: keyof typeof Ionicons.glyphMap;
  source: number;
};

const GUIDES: Guide[] = [
  { id: 'alimentacion-infantil', title: 'Alimentación infantil saludable', category: 'Nutrición', size: '3.8 MB', icon: 'nutrition-outline', source: require('../Guias/Cartilla Alimentación Infantil Saludable (1).pdf') },
  { id: 'enfermedades-cronicas', title: 'Atendiendo enfermedades crónicas', category: 'Salud preventiva', size: '9.4 MB', icon: 'heart-outline', source: require('../Guias/Cartilla Atendiendo Enfermedades Crónicas (2).pdf') },
  { id: 'alergias', title: 'Cuido y prevención de alergias', category: 'Prevención', size: '5.8 MB', icon: 'shield-checkmark-outline', source: require('../Guias/Cartilla Cuido y Prevención de Alergias.pdf') },
  { id: 'lesiones-deportivas', title: 'Cuido y prevención de lesiones deportivas', category: 'Actividad física', size: '3.0 MB', icon: 'fitness-outline', source: require('../Guias/Cartilla Cuido y Prevención de Lesiones Deportivas_2.pdf') },
  { id: 'sueno', title: 'Cuido y prevención de trastornos del sueño', category: 'Bienestar', size: '10.5 MB', icon: 'moon-outline', source: require('../Guias/Cartilla Cuido y prevención de trastornos del sueño.pdf') },
  { id: 'servicios-preventivos', title: 'Servicios preventivos para población clave', category: 'Servicios de salud', size: '716 KB', icon: 'medkit-outline', source: require('../Guias/Cartilla de Servicios Preventivos para población clave_0.pdf') },
  { id: 'embarazo', title: 'Embarazo y partos saludables', category: 'Maternidad', size: '6.4 MB', icon: 'flower-outline', source: require('../Guias/Cartilla Embarazo y Partos Saludables.pdf') },
  { id: 'higiene', title: 'Higiene para todas y todos', category: 'Hábitos saludables', size: '4.6 MB', icon: 'water-outline', source: require('../Guias/Cartilla Higiene para Todas y Todos (1).pdf') },
  { id: 'migranas', title: 'Manejo y prevención de migrañas', category: 'Bienestar', size: '4.4 MB', icon: 'pulse-outline', source: require('../Guias/Cartilla Manejo y Prevención de Migrañas.pdf') },
  { id: 'salud-visual', title: 'Prevención de enfermedades visuales', category: 'Salud visual', size: '10.2 MB', icon: 'eye-outline', source: require('../Guias/Cartilla Prevención de Enfermedades Visuales.pdf') },
  { id: 'salud-mental', title: 'Previniendo depresiones y suicidios', category: 'Salud mental', size: '40.7 MB', icon: 'happy-outline', source: require('../Guias/Cartilla Previniendo Depresiones y Suicidios.pdf') },
  { id: 'primeros-auxilios', title: 'Primeros auxilios', category: 'Emergencias', size: '10.9 MB', icon: 'medical-outline', source: require('../Guias/Cartilla Primeros Auxilios.pdf') },
  { id: 'adultos-mayores', title: 'Retos y desafíos de las personas adultas mayores', category: 'Adultos mayores', size: '3.2 MB', icon: 'people-outline', source: require('../Guias/Cartilla Retos y Desafíos de l@s Adult@s Mayores.pdf') },
];

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export function NanoBibliotecaScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isWebWide = Platform.OS === 'web' && width >= 900;
  const [query, setQuery] = useState('');
  const [openingId, setOpeningId] = useState<string | null>(null);

  const guides = useMemo(() => {
    const term = normalize(query.trim());
    if (!term) return GUIDES;
    return GUIDES.filter((guide) => normalize(`${guide.title} ${guide.category}`).includes(term));
  }, [query]);

  const openGuide = async (guide: Guide) => {
    setOpeningId(guide.id);
    try {
      const asset = Asset.fromModule(guide.source);
      await asset.downloadAsync();
      let uri = asset.localUri ?? asset.uri;

      if (!uri) throw new Error('La guía no está disponible en este momento.');
      if (Platform.OS === 'android' && uri.startsWith('file://')) {
        uri = await FileSystem.getContentUriAsync(uri);
      }

      await Linking.openURL(uri);
    } catch (error) {
      Alert.alert('No se pudo abrir la guía', error instanceof Error ? error.message : 'Intenta nuevamente.');
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.container, isWebWide && styles.containerWeb]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerIcon}><Ionicons name="library-outline" size={25} color={appColors.background} /></View>
          <View style={styles.headerCopy}>
            <AppText style={styles.eyebrow}>Guías para cuidarte</AppText>
            <AppText style={styles.title}>Nano Biblioteca</AppText>
            <AppText style={styles.subtitle}>Información confiable para conocer, prevenir y actuar.</AppText>
          </View>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()} accessibilityLabel="Cerrar Nano Biblioteca">
            <Ionicons name="close" size={20} color={appColors.textSoft} />
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="book-outline" size={22} color={appColors.info} />
          <AppText style={styles.infoText}>Explora las guías disponibles y abre cualquier documento para leerlo en tu dispositivo.</AppText>
        </View>

        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color={appColors.textMuted} />
          <AppTextInput
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar por tema o categoría"
            placeholderTextColor={appColors.textMuted}
            returnKeyType="search"
          />
          {query ? (
            <TouchableOpacity onPress={() => setQuery('')} accessibilityLabel="Limpiar búsqueda">
              <Ionicons name="close-circle" size={20} color={appColors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.resultsHeader}>
          <AppText style={styles.resultsTitle}>Guías disponibles</AppText>
          <View style={styles.countPill}><AppText style={styles.countText}>{guides.length}</AppText></View>
        </View>

        {guides.length ? (
          <View style={styles.grid}>
            {guides.map((guide) => {
              const opening = openingId === guide.id;
              return (
                <View key={guide.id} style={[styles.guideCard, isWebWide && styles.guideCardWeb]}>
                  <View style={styles.guideIcon}><Ionicons name={guide.icon} size={23} color={appColors.info} /></View>
                  <View style={styles.guideCopy}>
                    <AppText style={styles.category}>{guide.category}</AppText>
                    <AppText style={styles.guideTitle}>{guide.title}</AppText>
                    <View style={styles.metaRow}>
                      <Ionicons name="document-text-outline" size={15} color={appColors.textMuted} />
                      <AppText style={styles.metaText}>PDF · {guide.size}</AppText>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.openButton, opening && styles.openButtonDisabled]}
                    onPress={() => void openGuide(guide)}
                    disabled={opening}
                    accessibilityLabel={`Ver guía ${guide.title}`}>
                    {opening ? <ActivityIndicator size="small" color={appColors.background} /> : <Ionicons name="open-outline" size={18} color={appColors.background} />}
                    <AppText style={styles.openButtonText}>{opening ? 'Abriendo...' : 'Ver PDF'}</AppText>
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={34} color={appColors.textMuted} />
            <AppText style={styles.emptyTitle}>No encontramos esa guía</AppText>
            <AppText style={styles.emptyText}>Prueba con otra palabra o categoría.</AppText>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: appColors.background },
  container: { width: '100%', padding: 20, paddingBottom: 44, gap: 18 },
  containerWeb: { maxWidth: 1180, alignSelf: 'center', paddingHorizontal: 32, paddingTop: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIcon: { width: 52, height: 52, borderRadius: 17, alignItems: 'center', justifyContent: 'center', backgroundColor: appColors.info },
  headerCopy: { flex: 1 },
  eyebrow: { color: appColors.info, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  title: { color: appColors.text, fontSize: 28, fontWeight: '900' },
  subtitle: { color: appColors.textMuted, fontSize: 13, lineHeight: 18 },
  closeButton: { padding: 10, borderRadius: 12, backgroundColor: appColors.surface },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 15, borderRadius: 16, backgroundColor: colorAlpha(appColors.info, '12'), borderWidth: 1, borderColor: colorAlpha(appColors.info, '55') },
  infoText: { flex: 1, color: appColors.textSoft, fontSize: 13, lineHeight: 19 },
  searchBox: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, borderWidth: 1, borderColor: appColors.border, borderRadius: 15, backgroundColor: appColors.surface },
  searchInput: { flex: 1, minHeight: 50, color: appColors.text, fontSize: 14 },
  resultsHeader: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  resultsTitle: { color: appColors.text, fontSize: 18, fontWeight: '900' },
  countPill: { minWidth: 28, height: 28, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colorAlpha(appColors.success, '22') },
  countText: { color: appColors.success, fontSize: 12, fontWeight: '900' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 13 },
  guideCard: { width: '100%', padding: 15, gap: 12, borderRadius: 17, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  guideCardWeb: { width: '49%' },
  guideIcon: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: colorAlpha(appColors.info, '18') },
  guideCopy: { flex: 1, minHeight: 88 },
  category: { color: appColors.success, fontSize: 11, fontWeight: '900', textTransform: 'uppercase' },
  guideTitle: { marginTop: 5, color: appColors.text, fontSize: 16, fontWeight: '900', lineHeight: 21 },
  metaRow: { marginTop: 9, flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: appColors.textMuted, fontSize: 12 },
  openButton: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderRadius: 13, backgroundColor: appColors.success },
  openButtonDisabled: { opacity: 0.6 },
  openButtonText: { color: appColors.background, fontSize: 13, fontWeight: '900' },
  emptyState: { minHeight: 230, alignItems: 'center', justifyContent: 'center', gap: 9, padding: 24, borderRadius: 18, borderWidth: 1, borderColor: appColors.border, backgroundColor: appColors.surface },
  emptyTitle: { color: appColors.text, fontSize: 17, fontWeight: '900', textAlign: 'center' },
  emptyText: { color: appColors.textMuted, fontSize: 13, textAlign: 'center' },
});
