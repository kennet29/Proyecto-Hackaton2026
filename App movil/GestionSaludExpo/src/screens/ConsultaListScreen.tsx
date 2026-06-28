import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Calendar, DateData } from 'react-native-calendars';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';

type Consulta = {
  consultaId: number;
  pacienteId: number;
  fechaconsulta: string;
  motivo: string;
  diagnostico?: string;
  tratamiento?: string;
};

type CalendarMarks = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    marked?: boolean;
    dotColor?: string;
  };
};

type Props = NativeStackScreenProps<RootStackParamList, 'ConsultaList'>;

const toDateOnlyString = (value?: string | null) => {
  if (!value) {
    return '';
  }

  const trimmed = String(value).trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, '0'),
    String(parsed.getDate()).padStart(2, '0'),
  ].join('-');
};

const formatDateLabel = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleDateString('es-NI', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const formatDateTime = (value?: string | null) => {
  if (!value) {
    return 'N/A';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return parsed.toLocaleString('es-NI', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export function ConsultaListScreen({ navigation }: Props) {
  const [data, setData] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterPacienteId, setFilterPacienteId] = useState('');
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientLoadError, setPatientLoadError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState('');
  const [showDayConsultas, setShowDayConsultas] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const { token } = useAuth();

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      setLoadingPatients(false);
      setPatientLoadError(null);
      return;
    }

    setLoadingPatients(true);
    setPatientLoadError(null);

    try {
      const items = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      setPatientOptions(items);
    } catch (error) {
      setPatientLoadError(error instanceof Error ? error.message : 'Fallo al cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const fetchData = useCallback(
    async (pacienteId?: string) => {
      try {
        setLoading(true);
        const query = pacienteId ? `?pacienteId=${pacienteId}` : '';
        const response = await fetch(`${API_URL}/consultamedica${query}`, { headers: authHeaders });
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error((body as { message?: string } | null)?.message ?? 'No se pudieron obtener las consultas');
        }

        const validData = Array.isArray(body)
          ? body.filter(
              (item): item is Consulta =>
                Boolean(item) &&
                typeof item === 'object' &&
                Number.isFinite(Number(item.consultaId)) &&
                Number.isFinite(Number(item.pacienteId)),
            )
          : [];

        const sortedData = [...validData].sort((a, b) => {
          const aDate = a.fechaconsulta ? new Date(a.fechaconsulta).getTime() : 0;
          const bDate = b.fechaconsulta ? new Date(b.fechaconsulta).getTime() : 0;
          return bDate - aDate;
        });

        setData(sortedData);
      } catch (error) {
        Alert.alert('Error', error instanceof Error ? error.message : 'Fallo la consulta');
      } finally {
        setLoading(false);
      }
    },
    [authHeaders],
  );

  const applyFilter = () => {
    fetchData(filterPacienteId || undefined);
  };

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!selectedDate && data.length > 0) {
      const firstAvailableDate = toDateOnlyString(data[0]?.fechaconsulta);
      if (firstAvailableDate) {
        setSelectedDate(firstAvailableDate);
      }
    }
  }, [data, selectedDate]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const markedDates = useMemo<CalendarMarks>(() => {
    const marks: CalendarMarks = {};

    data.forEach((item) => {
      const date = toDateOnlyString(item.fechaconsulta);
      if (!date) {
        return;
      }

      marks[date] = {
        ...(marks[date] ?? {}),
        marked: true,
        dotColor: '#29B6FF',
      };
    });

    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: '#29B6FF',
        selectedTextColor: '#F4F8FF',
        dotColor: marks[selectedDate]?.dotColor ?? '#29B6FF',
        marked: marks[selectedDate]?.marked ?? false,
      };
    }

    return marks;
  }, [data, selectedDate]);

  const consultasForSelectedDay = useMemo(() => {
    if (!selectedDate) {
      return data;
    }

    return data.filter((item) => toDateOnlyString(item.fechaconsulta) === selectedDate);
  }, [data, selectedDate]);

  const hasDayConsultas = consultasForSelectedDay.length > 0;
  const hasHistory = data.length > 0;

  useEffect(() => {
    if (!hasDayConsultas && showDayConsultas) {
      setShowDayConsultas(false);
    }
  }, [hasDayConsultas, showDayConsultas]);

  useEffect(() => {
    if (!hasHistory && showHistory) {
      setShowHistory(false);
    }
  }, [hasHistory, showHistory]);

  const selectedPatientLabel = useMemo(() => {
    if (!filterPacienteId) {
      return 'Todos los pacientes';
    }

    const selectedPatient = patientOptions.find(
      (patient) => String(patient.pacienteId) === filterPacienteId,
    );

    return selectedPatient?.displayName ?? `Paciente #${filterPacienteId}`;
  }, [filterPacienteId, patientOptions]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const renderConsultaCard = (item: Consulta, variant: 'default' | 'history' = 'default') => (
    <TouchableOpacity
      key={`${variant}-${item.consultaId}`}
      style={[styles.card, variant === 'history' && styles.historyCard]}
      onPress={() => navigation.navigate('ConsultaForm', { consulta: item })}
    >
      <View style={styles.cardTopRow}>
        <Text style={styles.title}>Consulta #{item.consultaId}</Text>
        <Text style={styles.dateBadge}>{formatDateTime(item.fechaconsulta)}</Text>
      </View>
      <Text style={styles.text}>
        Paciente: {patientNameById[item.pacienteId] ?? `Paciente #${item.pacienteId}`}
      </Text>
      <Text style={styles.text}>Motivo: {item.motivo || 'N/A'}</Text>
      {item.diagnostico ? (
        <Text style={styles.text}>Diagnostico: {item.diagnostico}</Text>
      ) : null}
      {item.tratamiento ? (
        <Text style={styles.text}>Tratamiento: {item.tratamiento}</Text>
      ) : null}
    </TouchableOpacity>
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => fetchData(filterPacienteId || undefined)}
            tintColor="#F4F8FF"
          />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>CONSULTAS MEDICAS</Text>
          <Text style={styles.header}>Agenda clinica</Text>
          <Text style={styles.subheader}>
            Revisa el calendario de consultas y abre cada registro desde las tarjetas del dia.
          </Text>
        </View>

        <View style={styles.filterCard}>
          <Text style={styles.sectionTitle}>Filtrar por paciente</Text>
          <View style={styles.filterRow}>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={filterPacienteId}
                onValueChange={(value) => setFilterPacienteId(String(value))}
                style={styles.picker}
                dropdownIconColor="#F4F8FF"
              >
                <Picker.Item label="Todos los pacientes" value="" />
                {patientOptions.map((patient) => (
                  <Picker.Item
                    key={patient.pacienteId}
                    label={patient.displayName}
                    value={String(patient.pacienteId)}
                  />
                ))}
              </Picker>
            </View>
            <TouchableOpacity style={styles.filterBtn} onPress={applyFilter} disabled={loadingPatients}>
              <Text style={styles.btnText}>{loadingPatients ? 'Cargando...' : 'Filtrar'}</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.filterSummary}>Vista actual: {selectedPatientLabel}</Text>
          {patientLoadError ? <Text style={styles.errorText}>{patientLoadError}</Text> : null}
        </View>

        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <Text style={styles.sectionTitle}>Calendario de consultas</Text>
            <Text style={styles.calendarCaption}>
              {selectedDate ? formatDateLabel(selectedDate) : 'Selecciona un dia'}
            </Text>
          </View>

          {loading && data.length === 0 ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator color="#29B6FF" />
              <Text style={styles.loadingText}>Cargando agenda...</Text>
            </View>
          ) : (
            <Calendar
              markedDates={markedDates}
              onDayPress={handleDayPress}
              initialDate={selectedDate || undefined}
              enableSwipeMonths
              firstDay={1}
              theme={{
                calendarBackground: '#F4F8FF',
                todayTextColor: '#29B6FF',
                arrowColor: '#29B6FF',
                selectedDayBackgroundColor: '#29B6FF',
                selectedDayTextColor: '#F4F8FF',
                monthTextColor: '#071120',
                textSectionTitleColor: '#9FB3C8',
              }}
              style={styles.calendar}
            />
          )}
        </View>

        <View style={styles.dailySection}>
          <TouchableOpacity
            style={[styles.historyToggle, !hasDayConsultas && styles.historyToggleDisabled]}
            onPress={() => {
              if (hasDayConsultas) {
                setShowDayConsultas((prev) => !prev);
              }
            }}
            activeOpacity={0.85}
            disabled={!hasDayConsultas}
          >
            <View style={styles.historyToggleCopy}>
              <Text style={styles.sectionTitle}>Consultas del dia</Text>
              <Text style={styles.historyHelper}>
                {!hasDayConsultas
                  ? 'No hay consultas para desplegar en esta fecha'
                  : showDayConsultas
                    ? 'Ocultar consultas de la fecha seleccionada'
                    : 'Desplegar consultas de la fecha seleccionada'}
              </Text>
            </View>
            <View style={styles.historyToggleActions}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{consultasForSelectedDay.length}</Text>
              </View>
              <Text style={[styles.historyToggleIcon, !hasDayConsultas && styles.historyToggleIconDisabled]}>
                {hasDayConsultas ? (showDayConsultas ? '-' : '+') : ''}
              </Text>
            </View>
          </TouchableOpacity>

          {showDayConsultas && hasDayConsultas ? (
            consultasForSelectedDay.map((item) => renderConsultaCard(item))
          ) : null}
        </View>

        <View style={styles.historySection}>
          <TouchableOpacity
            style={[styles.historyToggle, !hasHistory && styles.historyToggleDisabled]}
            onPress={() => {
              if (hasHistory) {
                setShowHistory((prev) => !prev);
              }
            }}
            activeOpacity={0.85}
            disabled={!hasHistory}
          >
            <View style={styles.historyToggleCopy}>
              <Text style={styles.sectionTitle}>Historial completo</Text>
              <Text style={styles.historyHelper}>
                {!hasHistory
                  ? 'No hay consultas registradas para mostrar'
                  : showHistory
                    ? 'Ocultar consultas anteriores'
                    : 'Desplegar consultas anteriores'}
              </Text>
            </View>
            <View style={styles.historyToggleActions}>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{data.length}</Text>
              </View>
              <Text style={[styles.historyToggleIcon, !hasHistory && styles.historyToggleIconDisabled]}>
                {hasHistory ? (showHistory ? '-' : '+') : ''}
              </Text>
            </View>
          </TouchableOpacity>

          {showHistory && hasHistory ? (
            data.map((item) => renderConsultaCard(item, 'history'))
          ) : null}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('ConsultaCreate')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  content: {
    padding: 20,
    paddingBottom: 120,
    gap: 16,
  },
  heroCard: {
    backgroundColor: '#182A44',
    borderRadius: 28,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1B3355',
  },
  kicker: {
    color: '#29B6FF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#F4F8FF',
  },
  subheader: {
    color: '#C9D7E8',
    marginTop: 8,
    lineHeight: 20,
  },
  filterCard: {
    backgroundColor: '#132238',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  sectionTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '800',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  pickerWrapper: {
    flex: 1,
    backgroundColor: '#071120',
    borderRadius: 16,
    marginRight: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#27496D',
  },
  picker: {
    color: '#F4F8FF',
  },
  filterBtn: {
    backgroundColor: '#29B6FF',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  btnText: {
    color: '#F4F8FF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  filterSummary: {
    color: '#29B6FF',
    marginTop: 12,
    fontSize: 13,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF4D73',
    marginTop: 12,
  },
  calendarCard: {
    backgroundColor: '#F4F8FF',
    borderRadius: 24,
    padding: 16,
  },
  calendarHeader: {
    marginBottom: 12,
  },
  calendarCaption: {
    color: '#9FB3C8',
    marginTop: 6,
    fontSize: 13,
    textTransform: 'capitalize',
  },
  calendar: {
    borderRadius: 18,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
  },
  loadingText: {
    color: '#9FB3C8',
    marginTop: 8,
  },
  dailySection: {
    backgroundColor: '#132238',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
    marginBottom: 16,
  },
  historySection: {
    backgroundColor: '#132238',
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: '#27496D',
  },
  historyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  historyToggleDisabled: {
    opacity: 0.62,
  },
  historyToggleCopy: {
    flex: 1,
  },
  historyHelper: {
    color: '#29B6FF',
    marginTop: 6,
    fontSize: 13,
  },
  historyToggleActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  historyToggleIcon: {
    color: '#F4F8FF',
    fontSize: 24,
    fontWeight: '700',
    width: 20,
    textAlign: 'center',
  },
  historyToggleIconDisabled: {
    color: '#9FB3C8',
  },
  dailyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  countBadge: {
    minWidth: 34,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#071120',
    alignItems: 'center',
  },
  countBadgeText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  card: {
    backgroundColor: '#071120',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1B3355',
  },
  historyCard: {
    backgroundColor: '#182A44',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 10,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#F4F8FF',
  },
  dateBadge: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '700',
  },
  text: {
    fontSize: 14,
    color: '#C9D7E8',
    marginBottom: 6,
    lineHeight: 19,
  },
  empty: {
    fontSize: 15,
    color: '#9FB3C8',
    textAlign: 'center',
    paddingVertical: 24,
  },
  fab: {
    position: 'absolute',
    right: 24,
    bottom: 24,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#29B6FF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 7,
  },
  fabText: {
    color: '#F4F8FF',
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700',
  },
});
