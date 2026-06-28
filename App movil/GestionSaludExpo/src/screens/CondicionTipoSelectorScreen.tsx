import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'CondicionTipoSelector'>;

type TipoCondicion = {
  tipocondicionId: number;
  nombre: string;
};

const normalizeText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

export function CondicionTipoSelectorScreen({ navigation, route }: Props) {
  const { token } = useAuth();
  const [query, setQuery] = useState(route.params?.currentName ?? '');
  const [options, setOptions] = useState<TipoCondicion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const selectedId = route.params?.selectedId;

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const fetchOptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/tipocondicioncronica`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron cargar las condiciones');
      }
      setOptions(
        (Array.isArray(body) ? body : [])
          .map((item: any) => ({
            tipocondicionId: Number(item?.tipocondicionId ?? item?.tipocondicionid ?? item?.id ?? 0),
            nombre: String(item?.nombre ?? '').trim(),
          }))
          .filter((item: TipoCondicion) => item.tipocondicionId > 0 && item.nombre.length > 0)
          .sort((a: TipoCondicion, b: TipoCondicion) => a.nombre.localeCompare(b.nombre, 'es')),
      );
    } catch (requestError) {
      const message = requestError instanceof Error ? requestError.message : 'Fallo al cargar condiciones';
      setError(message);
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  }, [authHeaders]);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const filteredOptions = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    if (!normalizedQuery) {
      return options;
    }
    return options.filter((item) => normalizeText(item.nombre).includes(normalizedQuery));
  }, [options, query]);

  const exactMatch = useMemo(() => {
    const normalizedQuery = normalizeText(query);
    return Boolean(normalizedQuery) && options.some((item) => normalizeText(item.nombre) === normalizedQuery);
  }, [options, query]);

  const selectExisting = (item: TipoCondicion) => {
    navigation.navigate({
      name: 'CondicionCronicaCreate',
      params: {
        selectedTipoCondicion: item,
        typedConditionName: item.nombre,
      },
      merge: true,
    });
  };

  const useTypedCondition = () => {
    const typedName = query.trim();
    if (!typedName) {
      Alert.alert('Escribe una condicion', 'Ingresa el nombre de la condicion para usarla.');
      return;
    }
    navigation.navigate({
      name: 'CondicionCronicaCreate',
      params: {
        typedConditionName: typedName,
        selectedTipoCondicion: undefined,
      },
      merge: true,
    });
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.heroCard}>
          <View style={styles.heroIcon}>
            <Ionicons name="search-outline" size={28} color={appColors.text} />
          </View>
          <Text style={styles.kicker}>CATALOGO CLINICO</Text>
          <Text style={styles.title}>Escoger condicion</Text>
          <Text style={styles.subtitle}>
            Busca una condicion existente o escribe una nueva si no aparece en la lista.
          </Text>
        </View>

        <View style={styles.searchCard}>
          <Text style={styles.label}>Buscar o escribir condicion</Text>
          <View style={styles.searchInputWrapper}>
            <Ionicons name="search-outline" size={20} color={appColors.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Ej. Diabetes, hipertension, asma..."
              placeholderTextColor={appColors.textMuted}
              value={query}
              autoCapitalize="words"
              onChangeText={setQuery}
            />
            {query ? (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color={appColors.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>

          {query.trim() && !exactMatch ? (
            <TouchableOpacity style={styles.customButton} onPress={useTypedCondition}>
              <View style={styles.customIcon}>
                <Ionicons name="add-outline" size={20} color={appColors.background} />
              </View>
              <View style={styles.customCopy}>
                <Text style={styles.customTitle}>Usar "{query.trim()}"</Text>
                <Text style={styles.customText}>Se creara como nuevo tipo al guardar la condicion.</Text>
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.listCard}>
          <View style={styles.listHeader}>
            <Text style={styles.sectionTitle}>Condiciones disponibles</Text>
            <Text style={styles.counterText}>{filteredOptions.length}</Text>
          </View>

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={appColors.info} />
              <Text style={styles.stateText}>Cargando condiciones...</Text>
            </View>
          ) : error ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>No se pudo cargar</Text>
              <Text style={styles.stateText}>{error}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={fetchOptions}>
                <Text style={styles.retryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            </View>
          ) : filteredOptions.length === 0 ? (
            <View style={styles.stateBox}>
              <Text style={styles.stateTitle}>Sin coincidencias</Text>
              <Text style={styles.stateText}>Puedes usar el texto escrito como una nueva condicion.</Text>
            </View>
          ) : (
            filteredOptions.map((item) => {
              const active = selectedId === item.tipocondicionId;
              return (
                <TouchableOpacity
                  key={item.tipocondicionId}
                  style={[styles.optionRow, active && styles.optionRowActive]}
                  onPress={() => selectExisting(item)}
                >
                  <View style={styles.optionIcon}>
                    <Ionicons
                      name={active ? 'checkmark-circle' : 'medical-outline'}
                      size={20}
                      color={active ? appColors.success : appColors.info}
                    />
                  </View>
                  <Text style={styles.optionText}>{item.nombre}</Text>
                  <Ionicons name="chevron-forward" size={18} color={appColors.textMuted} />
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: appColors.background,
  },
  content: {
    padding: 24,
    paddingBottom: 110,
    gap: 16,
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 8,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colorAlpha(appColors.info, '22'),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kicker: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  title: {
    color: appColors.text,
    fontSize: 30,
    fontWeight: '900',
  },
  subtitle: {
    color: appColors.textSoft,
    lineHeight: 20,
  },
  searchCard: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 12,
  },
  label: {
    color: appColors.text,
    fontWeight: '800',
    fontSize: 14,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    backgroundColor: appColors.backgroundMuted,
  },
  searchInput: {
    flex: 1,
    minHeight: 54,
    color: appColors.text,
    fontSize: 16,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: colorAlpha(appColors.success, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '55'),
  },
  customIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: appColors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  customCopy: {
    flex: 1,
    gap: 2,
  },
  customTitle: {
    color: appColors.text,
    fontWeight: '800',
  },
  customText: {
    color: appColors.textMuted,
    lineHeight: 18,
  },
  listCard: {
    backgroundColor: appColors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 12,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: appColors.text,
    fontSize: 18,
    fontWeight: '900',
  },
  counterText: {
    color: appColors.info,
    fontWeight: '900',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  optionRowActive: {
    borderColor: appColors.success,
    backgroundColor: colorAlpha(appColors.success, '12'),
  },
  optionIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: appColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    color: appColors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  stateBox: {
    alignItems: 'center',
    gap: 8,
    borderRadius: 16,
    padding: 18,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.borderStrong,
  },
  stateTitle: {
    color: appColors.text,
    fontWeight: '900',
  },
  stateText: {
    color: appColors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: appColors.info,
  },
  retryButtonText: {
    color: appColors.text,
    fontWeight: '800',
  },
});
