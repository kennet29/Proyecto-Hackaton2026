import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { openWebDateTimePicker } from '../utils/webDateTimePicker';
import { parseCalendarDate, toLocalDateOnlyString } from '../utils/localDate';

type ConsultationOption = {
  consultaId: number;
  pacienteId: number;
  motivo: string;
  fechaconsulta?: string | null;
  medico?: string | null;
};

type ExamPhoto = {
  id: string;
  uri: string;
  fileName: string;
};

type StoredExam = {
  examenclinicoId: number;
  nombreExamen: string;
  tipoExamen?: string | null;
  fechaExamen: string;
  laboratorio?: string | null;
  tieneArchivoPdf?: boolean;
  consultaId?: number | null;
};

type PdfState = {
  base64: string;
  fileName: string;
  pageCount: number;
};

type DatePickerField = 'exam-date' | 'result-date';

const todayString = () => toLocalDateOnlyString();

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return '';
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) return '';
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, '0'),
      String(input.getDate()).padStart(2, '0'),
    ].join('-');
  }
  const match = String(input).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) return `${match[1]}-${match[2]}-${match[3]}`;
  const parsed = new Date(input);
  return Number.isNaN(parsed.getTime()) ? '' : toDateOnlyString(parsed);
};

const parseDateForPicker = (value?: string | null) => {
  const normalized = toDateOnlyString(value);
  const parts = normalized.split('-').map(Number);
  if (parts.length === 3 && parts.every((part) => !Number.isNaN(part))) {
    return new Date(parts[0], parts[1] - 1, parts[2]);
  }
  return new Date();
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return 'Selecciona fecha';
  return parseDateForPicker(value).toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatRecordDate = (value?: string | null) => {
  if (!value) return 'Sin fecha';
  const parsed = parseCalendarDate(value);
  if (!parsed) return String(value);
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

const normalizeText = (value: unknown) => {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text ? text : null;
};

const escapeHtmlAttribute = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const buildPdfFileName = (name: string, examDate: string) => {
  const safeName = (name || 'examen')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  const safeDate = (examDate || todayString()).replace(/[^0-9-]/g, '');
  return `${safeName || 'examen'}-${safeDate || 'sin-fecha'}.pdf`;
};

const buildPdfHtml = (photos: ExamPhoto[], examName: string) => {
  const pages = photos
    .map(
      (photo, index) => `
        <section class="page">
          <header>
            <h1>${examName || 'Examen clinico'}</h1>
            <p>Hoja ${index + 1} de ${photos.length}</p>
          </header>
          <img src="${escapeHtmlAttribute(photo.uri)}" alt="Hoja del examen ${index + 1}" />
        </section>
      `,
    )
    .join('');

  return `
    <html>
      <head>
        <meta charset="utf-8" />
        <style>
          body {
            margin: 0;
            font-family: Arial, sans-serif;
            color: #071120;
            background: #F4F8FF;
          }
          .page {
            page-break-after: always;
            padding: 18px;
          }
          .page:last-child {
            page-break-after: auto;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            border-bottom: 2px solid #C9D7E8;
            padding-bottom: 8px;
          }
          h1 {
            margin: 0;
            font-size: 18px;
          }
          p {
            margin: 0;
            font-size: 12px;
            color: #9FB3C8;
          }
          img {
            width: 100%;
            max-height: 980px;
            object-fit: contain;
            border-radius: 8px;
          }
        </style>
      </head>
      <body>${pages}</body>
    </html>
  `;
};

export function ExamenClinicoScreen() {
  const { token, user } = useAuth();
  const pickerItemColor = Platform.OS === 'android' ? '#071120' : '#F4F8FF';
  const defaultPacienteId = useMemo(
    () => (user?.pacienteId ? String(user.pacienteId) : ''),
    [user?.pacienteId],
  );
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [form, setForm] = useState({
    pacienteId: defaultPacienteId,
    consultaId: '',
    nombreExamen: '',
    tipoExamen: 'Laboratorio',
    laboratorio: '',
    fechaExamen: todayString(),
    fechaResultado: todayString(),
    resultadoTexto: '',
    observaciones: '',
  });
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [consultations, setConsultations] = useState<ConsultationOption[]>([]);
  const [recentExams, setRecentExams] = useState<StoredExam[]>([]);
  const [photos, setPhotos] = useState<ExamPhoto[]>([]);
  const [pdfState, setPdfState] = useState<PdfState | null>(null);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingConsultations, setLoadingConsultations] = useState(false);
  const [loadingExams, setLoadingExams] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [activeIOSDatePicker, setActiveIOSDatePicker] = useState<DatePickerField | null>(null);
  const [screenError, setScreenError] = useState<string | null>(null);

  const selectedPatientId = Number(form.pacienteId);
  const hasValidPatient = Number.isFinite(selectedPatientId) && selectedPatientId > 0;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPdf = useCallback(() => setPdfState(null), []);

  const resetDraft = useCallback(() => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      consultaId: '',
      nombreExamen: '',
      tipoExamen: 'Laboratorio',
      laboratorio: '',
      fechaExamen: todayString(),
      fechaResultado: todayString(),
      resultadoTexto: '',
      observaciones: '',
    }));
    setPhotos([]);
    setPdfState(null);
    setActiveIOSDatePicker(null);
  }, []);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      setLoadingPatients(false);
      return;
    }

    setLoadingPatients(true);
    try {
      let normalized = await fetchLinkedPatients(authHeaders, { forceRefresh: true });
      if (normalized.length === 0 && user?.pacienteId) {
        normalized = [
          {
            pacienteId: Number(user.pacienteId),
            displayName: user?.username?.split('@')[0] || `Paciente #${user.pacienteId}`,
          },
        ];
      }

      setPatientOptions(normalized);
      setForm((prev) => {
        if (prev.pacienteId || normalized.length === 0) return prev;
        return { ...prev, pacienteId: String(normalized[0].pacienteId) };
      });
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token, user?.pacienteId, user?.username]);

  const fetchConsultations = useCallback(async () => {
    if (!token || !hasValidPatient) {
      setConsultations([]);
      setLoadingConsultations(false);
      return;
    }

    setLoadingConsultations(true);
    try {
      const response = await fetch(`${API_URL}/consultamedica`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudieron cargar las consultas');
      }

      const mapped = Array.isArray(payload)
        ? payload
            .map((item: any) => ({
              consultaId: Number(item?.consultaId ?? item?.consultaid),
              pacienteId: Number(item?.pacienteId ?? item?.pacienteid),
              motivo: String(item?.motivo ?? 'Consulta sin motivo'),
              fechaconsulta: item?.fechaconsulta ?? null,
              medico: item?.medico ?? null,
            }))
            .filter(
              (item) =>
                Number.isFinite(item.consultaId) &&
                Number.isFinite(item.pacienteId) &&
                item.pacienteId === selectedPatientId,
            )
            .sort((a, b) => {
              const left = new Date(b.fechaconsulta ?? '').getTime();
              const right = new Date(a.fechaconsulta ?? '').getTime();
              return left - right;
            })
        : [];

      setConsultations(mapped);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar las consultas');
      setConsultations([]);
    } finally {
      setLoadingConsultations(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId, token]);

  const fetchExams = useCallback(async () => {
    if (!token || !hasValidPatient) {
      setRecentExams([]);
      setLoadingExams(false);
      return;
    }

    setLoadingExams(true);
    try {
      const response = await fetch(`${API_URL}/examenclinico?pacienteId=${selectedPatientId}`, {
        headers: authHeaders,
      });
      const payload = await response.json().catch(() => []);
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudieron cargar los examenes');
      }

      const mapped = Array.isArray(payload)
        ? payload
            .map((item: any) => ({
              examenclinicoId: Number(item?.examenclinicoId ?? item?.examenclinicoid),
              nombreExamen: String(item?.nombreExamen ?? item?.nombreexamen ?? 'Examen'),
              tipoExamen: item?.tipoExamen ?? item?.tipoexamen ?? null,
              fechaExamen: String(item?.fechaExamen ?? item?.fechaexamen ?? ''),
              laboratorio: item?.laboratorio ?? null,
              tieneArchivoPdf: Boolean(item?.tieneArchivoPdf ?? item?.mimeArchivoPdf),
              consultaId: item?.consultaId ?? item?.consultaid ?? null,
            }))
            .filter((item) => Number.isFinite(item.examenclinicoId))
            .sort(
              (a, b) => new Date(b.fechaExamen).getTime() - new Date(a.fechaExamen).getTime(),
            )
        : [];

      setRecentExams(mapped);
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar los examenes');
      setRecentExams([]);
    } finally {
      setLoadingExams(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId, token]);

  useEffect(() => {
    void fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    void fetchConsultations();
    void fetchExams();
  }, [fetchConsultations, fetchExams]);

  const refreshData = useCallback(async () => {
    setRefreshing(true);
    setScreenError(null);
    try {
      await fetchPatients();
      if (hasValidPatient) {
        await Promise.all([fetchConsultations(), fetchExams()]);
      }
    } finally {
      setRefreshing(false);
    }
  }, [fetchConsultations, fetchExams, fetchPatients, hasValidPatient]);

  const patientNameById = useMemo(() => {
    const map: Record<number, string> = {};
    patientOptions.forEach((patient) => {
      map[patient.pacienteId] = patient.displayName;
    });
    return map;
  }, [patientOptions]);

  const selectedPatientName = useMemo(() => {
    if (!hasValidPatient) return 'sin paciente seleccionado';
    return patientNameById[selectedPatientId] ?? `Paciente #${selectedPatientId}`;
  }, [hasValidPatient, patientNameById, selectedPatientId]);

  const setDateFieldValue = useCallback((field: DatePickerField, value: string) => {
    if (field === 'exam-date') {
      handleChange('fechaExamen', value);
      return;
    }
    handleChange('fechaResultado', value);
  }, []);

  const getDateFieldValue = (field: DatePickerField) =>
    field === 'exam-date' ? form.fechaExamen : form.fechaResultado;

  const showDatePicker = (field: DatePickerField) => {
    if (openWebDateTimePicker('date', getDateFieldValue(field), (value) => setDateFieldValue(field, value))) {
      return;
    }
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: parseDateForPicker(getDateFieldValue(field)),
        mode: 'date',
        is24Hour: true,
        onChange: (event, selected) => {
          if (event.type === 'set' && selected) {
            setDateFieldValue(field, toDateOnlyString(selected));
          }
        },
      });
      return;
    }

    setActiveIOSDatePicker(field);
  };

  const renderIOSDatePicker = () => {
    if (Platform.OS !== 'ios' || !activeIOSDatePicker) {
      return null;
    }

    return (
      <View style={styles.iosPickerCard}>
        <DateTimePicker
          value={parseDateForPicker(getDateFieldValue(activeIOSDatePicker))}
          mode="date"
          display="spinner"
          locale="es-NI"
          onChange={(_, selected) => {
            if (selected) {
              setDateFieldValue(activeIOSDatePicker, toDateOnlyString(selected));
            }
          }}
        />
        <TouchableOpacity
          style={styles.iosDoneButton}
          onPress={() => setActiveIOSDatePicker(null)}
        >
          <Text style={styles.iosDoneButtonText}>Listo</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const appendPhoto = (asset: ImagePicker.ImagePickerAsset) => {
    setPhotos((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        uri: asset.uri,
        fileName: asset.fileName ?? `hoja-examen-${prev.length + 1}.jpg`,
      },
    ]);
    resetPdf();
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('No disponible', 'La captura desde camara se recomienda desde Android o iOS.');
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la camara para fotografiar el examen.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.45,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      appendPhoto(result.assets[0]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la camara');
    }
  };

  const handlePickFromLibrary = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a fotos para adjuntar hojas del examen.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.45,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      appendPhoto(result.assets[0]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la galeria');
    }
  };

  const removePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((item) => item.id !== photoId));
    resetPdf();
  };

  const generatePdf = async (): Promise<PdfState> => {
    if (!photos.length) {
      throw new Error('Primero agrega al menos una foto de la hoja del examen.');
    }

    setGeneratingPdf(true);
    try {
      // Evita duplicar imagenes grandes en memoria al construir el HTML del PDF.
      const result = await Print.printToFileAsync({
        html: buildPdfHtml(photos, form.nombreExamen || 'Examen clinico'),
        base64: true,
      });

      if (!result?.base64) {
        throw new Error('No se pudo convertir las fotos a PDF.');
      }

      const nextPdf = {
        base64: result.base64,
        pageCount: result.numberOfPages,
        fileName: buildPdfFileName(form.nombreExamen, form.fechaExamen),
      };
      setPdfState(nextPdf);
      return nextPdf;
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleSubmit = async () => {
    if (!hasValidPatient || !form.nombreExamen.trim() || !form.fechaExamen.trim()) {
      Alert.alert('Faltan datos', 'Paciente, nombre del examen y fecha son obligatorios.');
      return;
    }

    setSubmitting(true);
    setScreenError(null);
    try {
      let currentPdf = pdfState;
      if (!currentPdf && photos.length) {
        currentPdf = await generatePdf();
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...authHeaders,
      };

      const response = await fetch(`${API_URL}/examenclinico`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          pacienteId: selectedPatientId,
          consultaId: form.consultaId ? Number(form.consultaId) : undefined,
          nombreExamen: form.nombreExamen.trim(),
          tipoExamen: form.tipoExamen.trim() || undefined,
          laboratorio: form.laboratorio.trim() || undefined,
          fechaExamen: form.fechaExamen.trim(),
          fechaResultado: form.fechaResultado.trim() || undefined,
          resultadoTexto: form.resultadoTexto.trim() || undefined,
          observaciones: form.observaciones.trim() || undefined,
          archivoPdfBase64: currentPdf ? `data:application/pdf;base64,${currentPdf.base64}` : undefined,
          nombreArchivoPdf: currentPdf?.fileName,
          creadoPor: user?.username ?? undefined,
        }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload?.message ?? 'No se pudo guardar el examen');
      }

      Alert.alert(
        'Examen guardado',
        currentPdf
          ? 'El resultado y el PDF generado desde las fotos quedaron registrados.'
          : 'El resultado del examen quedo registrado.',
      );

      resetDraft();
      await fetchExams();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el examen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => void refreshData()} tintColor="#38F28E" />
        }
      >
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>EXPEDIENTE CLINICO</Text>
          <Text style={styles.title}>Examenes clinicos</Text>
          <Text style={styles.subtitle}>
            Registra resultados, genera PDF desde fotos y revisa el historial por paciente con la
            misma estructura que el resto del expediente.
          </Text>
          <Text style={styles.heroHint}>
            {hasValidPatient
              ? `Paciente activo: ${selectedPatientName}`
              : 'Selecciona un paciente para cargar consultas e historial.'}
          </Text>
        </View>

        {screenError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>No se pudo completar la carga</Text>
            <Text style={styles.errorText}>{screenError}</Text>
          </View>
        ) : null}

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Registrar examen</Text>
          <Text style={styles.formIntro}>
            Completa el resultado, vincula la consulta si aplica y adjunta la hoja escaneada o
            fotografiada.
          </Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Paciente</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={form.pacienteId}
                onValueChange={(value) => {
                  handleChange('pacienteId', String(value));
                  handleChange('consultaId', '');
                }}
                enabled={!loadingPatients}
                dropdownIconColor="#F4F8FF"
              >
                <Picker.Item
                  label={loadingPatients ? 'Cargando pacientes...' : 'Selecciona un paciente'}
                  value=""
                  color={pickerItemColor}
                />
                {patientOptions.map((patient) => (
                  <Picker.Item
                    key={patient.pacienteId}
                    label={patient.displayName}
                    value={String(patient.pacienteId)}
                    color={pickerItemColor}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.fieldHint}>{`Trabajando con ${selectedPatientName}`}</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Consulta medica relacionada</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                style={styles.picker}
                selectedValue={form.consultaId}
                onValueChange={(value) => handleChange('consultaId', String(value))}
                enabled={hasValidPatient && !loadingConsultations}
                dropdownIconColor="#F4F8FF"
              >
                <Picker.Item
                  label={
                    !hasValidPatient
                      ? 'Selecciona primero un paciente'
                      : loadingConsultations
                        ? 'Cargando consultas...'
                        : 'Sin consulta especifica'
                  }
                  value=""
                  color={pickerItemColor}
                />
                {consultations.map((consulta) => (
                  <Picker.Item
                    key={consulta.consultaId}
                    label={`#${consulta.consultaId} | ${formatRecordDate(consulta.fechaconsulta)} | ${consulta.motivo}`}
                    value={String(consulta.consultaId)}
                    color={pickerItemColor}
                  />
                ))}
              </Picker>
            </View>
            <Text style={styles.fieldHint}>Opcional. Vinculalo si este examen pertenece a una consulta concreta.</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Nombre del examen o estudio</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej. Hemograma completo, Rayos X de torax"
              placeholderTextColor="#9FB3C8"
              value={form.nombreExamen}
              onChangeText={(value) => handleChange('nombreExamen', value)}
            />
          </View>

          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Tipo de examen</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej. Laboratorio, imagen, cardiologia"
                placeholderTextColor="#9FB3C8"
                value={form.tipoExamen}
                onChangeText={(value) => handleChange('tipoExamen', value)}
              />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>Laboratorio o centro</Text>
              <TextInput
                style={styles.input}
                placeholder="Nombre del laboratorio o clinica"
                placeholderTextColor="#9FB3C8"
                value={form.laboratorio}
                onChangeText={(value) => handleChange('laboratorio', value)}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.fieldColumn}>
              <Text style={styles.label}>Fecha de toma del examen</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('exam-date')}>
                <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechaExamen)}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.fieldColumn}>
              <Text style={styles.label}>Fecha de entrega del resultado</Text>
              <TouchableOpacity style={styles.dateButton} onPress={() => showDatePicker('result-date')}>
                <Text style={styles.dateButtonText}>{formatDisplayDate(form.fechaResultado)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {renderIOSDatePicker()}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Resumen del resultado</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Escribe los hallazgos principales o el resultado mas importante"
              placeholderTextColor="#9FB3C8"
              value={form.resultadoTexto}
              multiline
              onChangeText={(value) => handleChange('resultadoTexto', value)}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Observaciones clinicas</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Notas adicionales, contexto medico o indicaciones"
              placeholderTextColor="#9FB3C8"
              value={form.observaciones}
              multiline
              onChangeText={(value) => handleChange('observaciones', value)}
            />
          </View>

          <View style={styles.uploadCard}>
            <Text style={styles.sectionTitle}>Documento o foto del examen</Text>
            <Text style={styles.helperText}>
              Toma una o varias fotos. El sistema las unira en un PDF antes de guardarlas con el
              registro.
            </Text>

            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleTakePhoto}>
                <Text style={styles.actionButtonText}>Tomar foto</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handlePickFromLibrary}>
                <Text style={styles.actionButtonText}>Galeria</Text>
              </TouchableOpacity>
            </View>

            {photos.length ? (
              <View style={styles.photoGrid}>
                {photos.map((photo, index) => (
                  <View key={photo.id} style={styles.photoCard}>
                    <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
                    <Text style={styles.photoLabel}>{`Hoja ${index + 1}`}</Text>
                    <TouchableOpacity
                      style={styles.removePhotoButton}
                      onPress={() => removePhoto(photo.id)}
                    >
                      <Text style={styles.removePhotoButtonText}>Quitar</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyTitle}>No hay hojas adjuntas</Text>
                <Text style={styles.emptyText}>
                  Agrega fotos del examen para convertirlas en PDF y dejar evidencia en el
                  expediente.
                </Text>
              </View>
            )}

            {pdfState ? (
              <View style={styles.pdfCard}>
                <Text style={styles.pdfTitle}>PDF listo</Text>
                <Text style={styles.pdfMeta}>{pdfState.fileName}</Text>
                <Text style={styles.pdfMeta}>{`${pdfState.pageCount} pagina(s) generadas`}</Text>
              </View>
            ) : null}

            <View style={styles.formActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={resetDraft}>
                <Text style={styles.cancelButtonText}>Limpiar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryButton, !photos.length && styles.disabledButton]}
                onPress={() =>
                  generatePdf().catch((error) =>
                    Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo generar el PDF'),
                  )
                }
                disabled={!photos.length || generatingPdf}
              >
                <Text style={styles.secondaryButtonText}>
                  {generatingPdf ? 'Generando...' : 'Generar PDF'}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, submitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.primaryButtonText}>
                {submitting ? 'Guardando...' : 'Guardar examen'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Historial de examenes</Text>
          <Text style={styles.sectionSubtitle}>
            {hasValidPatient
              ? `${recentExams.length} registros de ${selectedPatientName}`
              : 'Selecciona un paciente para ver historial.'}
          </Text>
        </View>

        {loadingExams ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#38F28E" />
            <Text style={styles.loadingText}>Cargando historial...</Text>
          </View>
        ) : recentExams.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No hay examenes para este paciente</Text>
            <Text style={styles.emptyText}>
              {hasValidPatient
                ? 'Todavia no se han registrado examenes clinicos en este expediente.'
                : 'Selecciona un paciente para cargar consultas y examenes.'}
            </Text>
          </View>
        ) : (
          recentExams.map((exam) => (
            <View key={exam.examenclinicoId} style={styles.recordCard}>
              <View style={styles.recordTopRow}>
                <View style={styles.datePill}>
                  <Text style={styles.datePillText}>{formatRecordDate(exam.fechaExamen)}</Text>
                </View>
                <View
                  style={[
                    styles.statusPill,
                    exam.tieneArchivoPdf ? styles.statusPillSuccess : styles.statusPillPending,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusPillText,
                      exam.tieneArchivoPdf ? styles.statusTextSuccess : styles.statusTextPending,
                    ]}
                  >
                    {exam.tieneArchivoPdf ? 'PDF adjunto' : 'Solo texto'}
                  </Text>
                </View>
              </View>

              <Text style={styles.recordTitle}>{exam.nombreExamen}</Text>
              <Text style={styles.recordPatient}>{selectedPatientName}</Text>
              <Text style={styles.recordText}>
                Tipo: {normalizeText(exam.tipoExamen) ?? 'Sin especificar'}
              </Text>
              <Text style={styles.recordText}>
                Laboratorio: {normalizeText(exam.laboratorio) ?? 'Sin dato'}
              </Text>
              <Text style={styles.recordText}>
                {exam.consultaId ? `Consulta vinculada: #${exam.consultaId}` : 'Sin consulta vinculada'}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#071120',
  },
  container: {
    padding: 24,
    paddingBottom: 48,
    backgroundColor: '#071120',
  },
  heroCard: {
    borderRadius: 28,
    padding: 22,
    marginBottom: 18,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  eyebrow: {
    color: '#29B6FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#F4F8FF',
  },
  subtitle: {
    marginTop: 10,
    color: '#C9D7E8',
    fontSize: 15,
    lineHeight: 22,
  },
  heroHint: {
    marginTop: 12,
    color: '#9FB3C8',
    fontSize: 13,
  },
  errorCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
    backgroundColor: '#FF4D7318',
    borderWidth: 1,
    borderColor: '#FF4D73',
  },
  errorTitle: {
    color: '#FF4D73',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  errorText: {
    color: '#FF4D73',
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: '#071120',
    borderRadius: 24,
    padding: 18,
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 18,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  formIntro: {
    color: '#C9D7E8',
    lineHeight: 20,
    marginBottom: 14,
  },
  fieldGroup: {
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: '#F4F8FF',
    marginBottom: 8,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
    marginBottom: 10,
  },
  picker: {
    color: '#F4F8FF',
  },
  fieldHint: {
    color: '#9FB3C8',
    fontSize: 13,
    marginBottom: 12,
    lineHeight: 18,
  },
  input: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
    backgroundColor: '#071120',
    color: '#F4F8FF',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  fieldColumn: {
    flex: 1,
  },
  dateButton: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 14,
    marginBottom: 12,
    backgroundColor: '#071120',
  },
  dateButtonText: {
    color: '#F4F8FF',
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
  },
  iosPickerCard: {
    borderWidth: 1,
    borderColor: '#27496D',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#071120',
    marginBottom: 12,
  },
  iosDoneButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iosDoneButtonText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  uploadCard: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginTop: 4,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F4F8FF',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: '#9FB3C8',
  },
  helperText: {
    color: '#C9D7E8',
    marginBottom: 14,
    lineHeight: 20,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  actionButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#29B6FF18',
    backgroundColor: '#29B6FF18',
  },
  actionButtonText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 14,
  },
  photoCard: {
    width: '47%',
    backgroundColor: '#071120',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#132238',
  },
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#000000',
    marginBottom: 8,
  },
  photoLabel: {
    color: '#F4F8FF',
    fontWeight: '700',
    marginBottom: 8,
  },
  removePhotoButton: {
    borderRadius: 10,
    paddingVertical: 8,
    backgroundColor: '#FF4D7318',
    borderWidth: 1,
    borderColor: '#FF4D73',
  },
  removePhotoButtonText: {
    color: '#FF4D73',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 12,
  },
  pdfCard: {
    backgroundColor: '#38F28E18',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#38F28E',
    marginBottom: 14,
  },
  pdfTitle: {
    color: '#38F28E',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  pdfMeta: {
    color: '#38F28E',
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#9FB3C8',
    backgroundColor: '#071120',
  },
  cancelButtonText: {
    color: '#C9D7E8',
    fontWeight: '800',
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#29B6FF18',
    backgroundColor: '#29B6FF18',
  },
  secondaryButtonText: {
    color: '#29B6FF',
    fontWeight: '800',
  },
  primaryButton: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    backgroundColor: '#38F28E',
  },
  primaryButtonText: {
    color: '#F4F8FF',
    fontWeight: '900',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingCard: {
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    alignItems: 'center',
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 10,
    color: '#C9D7E8',
  },
  emptyCard: {
    borderRadius: 22,
    padding: 20,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#F4F8FF',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  emptyText: {
    color: '#9FB3C8',
    lineHeight: 20,
  },
  recordCard: {
    borderRadius: 22,
    padding: 18,
    marginBottom: 12,
    backgroundColor: '#071120',
    borderWidth: 1,
    borderColor: '#132238',
  },
  recordTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  datePill: {
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    backgroundColor: '#29B6FF18',
  },
  datePillText: {
    color: '#29B6FF',
    fontWeight: '800',
    fontSize: 12,
  },
  statusPill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  statusPillSuccess: {
    backgroundColor: '#38F28E18',
    borderColor: '#38F28E',
  },
  statusPillPending: {
    backgroundColor: '#182A44',
    borderColor: '#29B6FF',
  },
  statusPillText: {
    fontWeight: '800',
    fontSize: 12,
  },
  statusTextSuccess: {
    color: '#38F28E',
  },
  statusTextPending: {
    color: '#29B6FF',
  },
  recordTitle: {
    color: '#F4F8FF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 6,
  },
  recordPatient: {
    color: '#29B6FF',
    fontWeight: '700',
    marginBottom: 10,
  },
  recordText: {
    color: '#C9D7E8',
    marginBottom: 5,
    lineHeight: 20,
  },
});
