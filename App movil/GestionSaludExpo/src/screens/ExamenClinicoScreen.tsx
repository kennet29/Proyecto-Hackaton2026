import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Print from 'expo-print';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';

type LinkedPatient = {
  pacienteId: number;
  displayName: string;
};

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
  base64: string;
  mimeType: string;
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

const todayString = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string | null) => {
  if (!value) {
    return 'Sin fecha';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString('es-NI', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

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
          <img src="data:${photo.mimeType};base64,${photo.base64}" alt="Hoja del examen ${index + 1}" />
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
            color: #0f172a;
            background: #ffffff;
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
            border-bottom: 2px solid #dbeafe;
            padding-bottom: 8px;
          }
          h1 {
            margin: 0;
            font-size: 18px;
          }
          p {
            margin: 0;
            font-size: 12px;
            color: #475569;
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
  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const [form, setForm] = useState({
    pacienteId: '',
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
  const [submitting, setSubmitting] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [screenError, setScreenError] = useState<string | null>(null);

  const selectedPatientId = Number(form.pacienteId);
  const hasValidPatient = Number.isFinite(selectedPatientId) && selectedPatientId > 0;

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetPdf = () => setPdfState(null);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
      return;
    }

    setLoadingPatients(true);
    setScreenError(null);
    try {
      const response = await fetch(`${API_URL}/usuario-paciente/mis-pacientes`, {
        headers: authHeaders,
      });
      const relations = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(relations?.message ?? 'No se pudieron cargar las personas');
      }

      const items: (LinkedPatient | null)[] = Array.isArray(relations)
        ? await Promise.all(
            relations.map(async (relation: any) => {
              const rawId =
                relation?.pacienteId ??
                relation?.pacienteid ??
                relation?.id ??
                relation?.paciente?.pacienteId;
              const pacienteId = Number(rawId);
              if (!Number.isFinite(pacienteId)) {
                return null;
              }

              let displayName =
                relation?.displayName ??
                relation?.nombrePaciente ??
                relation?.paciente?.displayName ??
                `Paciente #${pacienteId}`;

              try {
                const patientResponse = await fetch(`${API_URL}/paciente/${pacienteId}`, {
                  headers: authHeaders,
                });
                const patient = await patientResponse.json().catch(() => null);
                if (patientResponse.ok && patient) {
                  const nombres = patient?.nombres ?? '';
                  const apellidos = patient?.apellidos ?? '';
                  const combined = `${nombres} ${apellidos}`.trim();
                  if (combined) {
                    displayName = combined;
                  }
                }
              } catch {
                // Ignorar errores individuales para no bloquear el picker.
              }

              return { pacienteId, displayName };
            }),
          )
        : [];

      setPatientOptions(items.filter((item): item is LinkedPatient => Boolean(item)));
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar las personas');
      setPatientOptions([]);
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, token]);

  const fetchConsultations = useCallback(async () => {
    if (!hasValidPatient) {
      setConsultations([]);
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
  }, [authHeaders, hasValidPatient, selectedPatientId]);

  const fetchExams = useCallback(async () => {
    if (!hasValidPatient) {
      setRecentExams([]);
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
        ? payload.map((item: any) => ({
            examenclinicoId: Number(item?.examenclinicoId ?? item?.examenclinicoid),
            nombreExamen: String(item?.nombreExamen ?? item?.nombreexamen ?? 'Examen'),
            tipoExamen: item?.tipoExamen ?? item?.tipoexamen ?? null,
            fechaExamen: String(item?.fechaExamen ?? item?.fechaexamen ?? ''),
            laboratorio: item?.laboratorio ?? null,
            tieneArchivoPdf: Boolean(item?.tieneArchivoPdf ?? item?.mimeArchivoPdf),
            consultaId: item?.consultaId ?? item?.consultaid ?? null,
          }))
        : [];

      setRecentExams(mapped.slice(0, 8));
    } catch (error) {
      setScreenError(error instanceof Error ? error.message : 'No se pudieron cargar los examenes');
      setRecentExams([]);
    } finally {
      setLoadingExams(false);
    }
  }, [authHeaders, hasValidPatient, selectedPatientId]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  useEffect(() => {
    fetchConsultations();
    fetchExams();
  }, [fetchConsultations, fetchExams]);

  const appendPhoto = (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      throw new Error('No se pudo leer la foto tomada. Intenta de nuevo.');
    }

    setPhotos((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${prev.length}`,
        uri: asset.uri,
        base64: asset.base64!,
        mimeType: asset.mimeType ?? 'image/jpeg',
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
        quality: 0.7,
        base64: true,
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
        quality: 0.7,
        base64: true,
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

      setForm({
        pacienteId: form.pacienteId,
        consultaId: '',
        nombreExamen: '',
        tipoExamen: 'Laboratorio',
        laboratorio: '',
        fechaExamen: todayString(),
        fechaResultado: todayString(),
        resultadoTexto: '',
        observaciones: '',
      });
      setPhotos([]);
      setPdfState(null);
      fetchExams();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo guardar el examen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Examenes Clinicos</Text>
      <Text style={styles.subtitle}>
        Registra resultados, vincula el examen a una consulta y genera un PDF desde fotos de la hoja.
      </Text>

      <Text style={styles.sectionTitle}>Datos del examen</Text>
      <Text style={styles.label}>Paciente</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.pacienteId}
          onValueChange={(value) => {
            handleChange('pacienteId', String(value));
            handleChange('consultaId', '');
          }}
          enabled={!loadingPatients}
        >
          <Picker.Item
            label={loadingPatients ? 'Cargando personas...' : 'Selecciona una persona'}
            value=""
          />
          {patientOptions.map((patient) => (
            <Picker.Item
              key={patient.pacienteId}
              label={patient.displayName}
              value={String(patient.pacienteId)}
            />
          ))}
        </Picker>
      </View>

      <Text style={styles.label}>Consulta medica vinculada</Text>
      <View style={styles.pickerWrapper}>
        <Picker
          selectedValue={form.consultaId}
          onValueChange={(value) => handleChange('consultaId', String(value))}
          enabled={hasValidPatient && !loadingConsultations}
        >
          <Picker.Item
            label={
              !hasValidPatient
                ? 'Selecciona primero una persona'
                : loadingConsultations
                  ? 'Cargando consultas...'
                  : 'Sin consulta especifica'
            }
            value=""
          />
          {consultations.map((consulta) => (
            <Picker.Item
              key={consulta.consultaId}
              label={`#${consulta.consultaId} · ${formatDate(consulta.fechaconsulta)} · ${consulta.motivo}`}
              value={String(consulta.consultaId)}
            />
          ))}
        </Picker>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Nombre del examen"
        placeholderTextColor="#94a3b8"
        value={form.nombreExamen}
        onChangeText={(value) => handleChange('nombreExamen', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Tipo de examen"
        placeholderTextColor="#94a3b8"
        value={form.tipoExamen}
        onChangeText={(value) => handleChange('tipoExamen', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Laboratorio o centro"
        placeholderTextColor="#94a3b8"
        value={form.laboratorio}
        onChangeText={(value) => handleChange('laboratorio', value)}
      />
      <View style={styles.row}>
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Fecha examen YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          value={form.fechaExamen}
          onChangeText={(value) => handleChange('fechaExamen', value)}
        />
        <TextInput
          style={[styles.input, styles.halfInput]}
          placeholder="Fecha resultado YYYY-MM-DD"
          placeholderTextColor="#94a3b8"
          value={form.fechaResultado}
          onChangeText={(value) => handleChange('fechaResultado', value)}
        />
      </View>
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Resultado en texto"
        placeholderTextColor="#94a3b8"
        value={form.resultadoTexto}
        multiline
        onChangeText={(value) => handleChange('resultadoTexto', value)}
      />
      <TextInput
        style={[styles.input, styles.multiline]}
        placeholder="Observaciones"
        placeholderTextColor="#94a3b8"
        value={form.observaciones}
        multiline
        onChangeText={(value) => handleChange('observaciones', value)}
      />

      <Text style={styles.sectionTitle}>Hoja del examen</Text>
      <Text style={styles.helperText}>
        Toma una o varias fotos. Luego el sistema las une en un PDF para adjuntarlo al examen.
      </Text>
      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleTakePhoto}>
          <Text style={styles.secondaryBtnText}>Tomar foto</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handlePickFromLibrary}>
          <Text style={styles.secondaryBtnText}>Galeria</Text>
        </TouchableOpacity>
      </View>

      {photos.length ? (
        <View style={styles.photoGrid}>
          {photos.map((photo, index) => (
            <View key={photo.id} style={styles.photoCard}>
              <Image source={{ uri: photo.uri }} style={styles.photoPreview} />
              <Text style={styles.photoLabel}>Hoja {index + 1}</Text>
              <TouchableOpacity style={styles.removePhotoBtn} onPress={() => removePhoto(photo.id)}>
                <Text style={styles.removePhotoBtnText}>Quitar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aun no has agregado fotos del examen.</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.primaryBtn, !photos.length && styles.primaryBtnDisabled]}
        onPress={() =>
          generatePdf().catch((error) =>
            Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo generar el PDF'),
          )
        }
        disabled={!photos.length || generatingPdf}
      >
        <Text style={styles.primaryBtnText}>
          {generatingPdf ? 'Generando PDF...' : 'Convertir fotos a PDF'}
        </Text>
      </TouchableOpacity>

      {pdfState ? (
        <View style={styles.pdfCard}>
          <Text style={styles.pdfTitle}>PDF listo</Text>
          <Text style={styles.pdfMeta}>{pdfState.fileName}</Text>
          <Text style={styles.pdfMeta}>{pdfState.pageCount} pagina(s) generadas</Text>
        </View>
      ) : null}

      <TouchableOpacity
        style={[styles.saveBtn, submitting && styles.primaryBtnDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.saveBtnText}>{submitting ? 'Guardando...' : 'Guardar examen'}</Text>
      </TouchableOpacity>

      <Text style={styles.sectionTitle}>Examenes recientes</Text>
      {screenError ? <Text style={styles.errorText}>{screenError}</Text> : null}
      {loadingExams ? (
        <ActivityIndicator color="#38bdf8" style={styles.loader} />
      ) : recentExams.length ? (
        recentExams.map((exam) => (
          <View key={exam.examenclinicoId} style={styles.examCard}>
            <Text style={styles.examTitle}>{exam.nombreExamen}</Text>
            <Text style={styles.examMeta}>
              {formatDate(exam.fechaExamen)}
              {exam.laboratorio ? ` · ${exam.laboratorio}` : ''}
            </Text>
            <Text style={styles.examMeta}>
              {exam.consultaId ? `Consulta #${exam.consultaId}` : 'Sin consulta vinculada'}
              {exam.tieneArchivoPdf ? ' · PDF adjunto' : ' · Solo texto'}
            </Text>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>
            {hasValidPatient
              ? 'No hay examenes registrados para esta persona.'
              : 'Selecciona una persona para ver sus examenes.'}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#0f172a',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#f8fafc',
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 18,
    color: '#cbd5e1',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginTop: 6,
    marginBottom: 10,
  },
  label: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 8,
  },
  helperText: {
    color: '#cbd5e1',
    marginBottom: 12,
    lineHeight: 19,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    marginBottom: 12,
    overflow: 'hidden',
    backgroundColor: '#0b1220',
  },
  input: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    fontSize: 16,
    backgroundColor: '#0b1220',
    color: '#f8fafc',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  secondaryBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#38bdf8',
    borderRadius: 14,
    paddingVertical: 14,
    backgroundColor: '#082f49',
  },
  secondaryBtnText: {
    color: '#bae6fd',
    textAlign: 'center',
    fontWeight: '700',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 12,
  },
  photoCard: {
    width: '47%',
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  photoPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#020617',
    marginBottom: 8,
  },
  photoLabel: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 8,
  },
  removePhotoBtn: {
    backgroundColor: '#7f1d1d',
    borderRadius: 10,
    paddingVertical: 8,
  },
  removePhotoBtnText: {
    color: '#fecaca',
    textAlign: 'center',
    fontWeight: '700',
    fontSize: 12,
  },
  emptyState: {
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#0b1220',
    marginBottom: 12,
  },
  emptyStateText: {
    color: '#94a3b8',
    lineHeight: 19,
  },
  primaryBtn: {
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 12,
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 15,
  },
  pdfCard: {
    backgroundColor: '#052e16',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#166534',
    marginBottom: 12,
  },
  pdfTitle: {
    color: '#dcfce7',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 6,
  },
  pdfMeta: {
    color: '#bbf7d0',
  },
  saveBtn: {
    backgroundColor: '#ea580c',
    paddingVertical: 16,
    borderRadius: 14,
    marginBottom: 18,
  },
  saveBtnText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '800',
    fontSize: 16,
  },
  examCard: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginBottom: 12,
  },
  examTitle: {
    color: '#f8fafc',
    fontWeight: '800',
    fontSize: 16,
    marginBottom: 4,
  },
  examMeta: {
    color: '#cbd5e1',
    lineHeight: 19,
  },
  errorText: {
    color: '#fca5a5',
    marginBottom: 12,
  },
  loader: {
    marginVertical: 12,
  },
});
