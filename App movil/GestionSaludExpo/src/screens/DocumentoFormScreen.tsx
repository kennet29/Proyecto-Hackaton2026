/**
 * @file App movil/GestionSaludExpo/src/screens/DocumentoFormScreen.tsx
 * @description TypeScript module implementation.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { AppText, AppTextInput } from '../components/AppText';
import { Picker } from '@react-native-picker/picker';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../context/AuthContext';
import { API_URL } from '../config/api';
import { fetchLinkedPatients, type LinkedPatient } from '../utils/linkedPatients';
import { appColors, colorAlpha } from '../theme/colors';

type TipoDocumento = {
  tipodocumentoId: number;
  nombre: string;
};

type DocumentAttachment = {
  uri: string;
  base64Data: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
  size?: number;
};

type OriginRecordOption = {
  id: string;
  label: string;
};

const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

const originOptions = [
  { value: 'general', label: 'General', icon: 'folder-open-outline', endpoint: null, idKeys: [], titleKeys: [], dateKeys: [] },
  { value: 'consultamedica', label: 'Consulta', icon: 'chatbubbles-outline', endpoint: 'consultamedica', idKeys: ['consultaId', 'consultamedicaId', 'consultamedicaid', 'id'], titleKeys: ['motivo', 'motivoconsulta', 'diagnostico'], dateKeys: ['fecha', 'fechaconsulta'] },
  { value: 'medicacion', label: 'Medicación', icon: 'medkit-outline', endpoint: 'medicacion', idKeys: ['medicacionId', 'medicacionid', 'id'], titleKeys: ['nombremedicamento', 'medicamento', 'nombre', 'dosis'], dateKeys: ['fechainicio', 'fecha'] },
  { value: 'condicioncronica', label: 'Condición', icon: 'heart-outline', endpoint: 'condicioncronica', idKeys: ['condicioncronicaId', 'condicioncronicaid', 'id'], titleKeys: ['condicionNombre', 'nombre', 'tratamientoprincipal', 'estado'], dateKeys: ['fechadiagnostico', 'creadoen'] },
  { value: 'examenclinico', label: 'Examen', icon: 'document-text-outline', endpoint: 'examenclinico', idKeys: ['examenclinicoId', 'examenclinicoid', 'examenId', 'id'], titleKeys: ['nombreExamen', 'nombreexamen', 'tipoExamen', 'tipoexamen', 'resultadoTexto', 'resultado'], dateKeys: ['fechaExamen', 'fechaexamen', 'fechaResultado', 'fecharesultado', 'fecha'] },
  { value: 'operacion', label: 'Operación', icon: 'bandage-outline', endpoint: 'operacion', idKeys: ['operacionId', 'operacionid', 'id'], titleKeys: ['tipo', 'hospital', 'resultado'], dateKeys: ['fechaoperacion', 'fecha'] },
  { value: 'alergia', label: 'Alergia', icon: 'warning-outline', endpoint: 'alergia', idKeys: ['alergiaId', 'alergiaid', 'id'], titleKeys: ['tipo', 'desencadenante', 'reaccion'], dateKeys: ['fechadiagnostico', 'fecha'] },
  { value: 'lesion', label: 'Lesión', icon: 'body-outline', endpoint: 'lesion', idKeys: ['lesionId', 'lesionid', 'id'], titleKeys: ['tipo', 'partecuerpo', 'tratamiento'], dateKeys: ['fechalesion', 'fecha'] },
  { value: 'registrodental', label: 'Dental', icon: 'medical-outline', endpoint: 'registrodental', idKeys: ['registrodentalId', 'registrodentalid', 'id'], titleKeys: ['procedimiento', 'diagnostico', 'odontologo'], dateKeys: ['fechaatencion', 'fecha'] },
  { value: 'vacuna', label: 'Vacuna', icon: 'shield-checkmark-outline', endpoint: 'vacuna', idKeys: ['vacunaId', 'vacunaid', 'id'], titleKeys: ['nombre', 'vacuna', 'fabricante'], dateKeys: ['fechaaplicacion', 'fecha'] },
  { value: 'desparasitacion', label: 'Desparasitación', icon: 'calendar-outline', endpoint: 'desparasitacion', idKeys: ['desparasitacionId', 'desparasitacionid', 'id'], titleKeys: ['producto', 'medicamento', 'dosis'], dateKeys: ['fecha', 'proximafecha'] },
] as const;

export function DocumentoFormScreen() {
  const [form, setForm] = useState({
    pacienteId: '',
    entidadOrigen: 'general',
    entidadId: '',
    notas: '',
  });
  const [patientOptions, setPatientOptions] = useState<LinkedPatient[]>([]);
  const [documentTypes, setDocumentTypes] = useState<TipoDocumento[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [loadingOriginRecords, setLoadingOriginRecords] = useState(false);
  const [originRecords, setOriginRecords] = useState<OriginRecordOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [attachment, setAttachment] = useState<DocumentAttachment | null>(null);
  const [webCameraStream, setWebCameraStream] = useState<MediaStream | null>(null);
  const webVideoRef = useRef<HTMLVideoElement | null>(null);
  const originRequestRef = useRef(0);
  const { token, user } = useAuth();

  const authHeaders = useMemo<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const jsonHeaders = useMemo<Record<string, string>>(
    () => ({ 'Content-Type': 'application/json', ...authHeaders }),
    [authHeaders],
  );

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const selectedPatient = useMemo(
    () => patientOptions.find((item) => String(item.pacienteId) === form.pacienteId),
    [patientOptions, form.pacienteId],
  );

  const selectedOrigin = useMemo(
    () => originOptions.find((item) => item.value === form.entidadOrigen) ?? originOptions[0],
    [form.entidadOrigen],
  );

  const automaticDocumentType = useMemo(() => {
    const keywordsByOrigin: Record<string, string[]> = {
      general: attachment?.kind === 'pdf' ? ['documento', 'pdf', 'informe'] : ['imagen', 'documento'],
      consultamedica: ['consulta', 'informe'],
      medicacion: ['receta', 'medicacion', 'medicamento'],
      condicioncronica: ['diagnostico', 'condicion', 'informe'],
      examenclinico: ['examen', 'resultado', 'laboratorio'],
      operacion: ['operacion', 'cirugia', 'informe'],
      alergia: ['alergia', 'diagnostico', 'informe'],
      lesion: ['lesion', 'imagen', 'informe'],
      registrodental: ['dental', 'odontologico', 'imagen'],
      vacuna: ['vacuna', 'certificado', 'documento'],
      desparasitacion: ['desparasitacion', 'receta', 'documento'],
    };
    const normalize = (value: string) =>
      value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    const keywords = keywordsByOrigin[form.entidadOrigen] ?? ['documento'];
    return (
      documentTypes.find((type) => {
        const normalizedName = normalize(type.nombre);
        return keywords.some((keyword) => normalizedName.includes(keyword));
      }) ?? documentTypes[0]
    );
  }, [attachment?.kind, documentTypes, form.entidadOrigen]);

  const fetchPatients = useCallback(async () => {
    if (!token) {
      setPatientOptions([]);
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
      if (!form.pacienteId && normalized.length > 0) {
        setForm((prev) => ({ ...prev, pacienteId: String(normalized[0].pacienteId) }));
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar las personas');
    } finally {
      setLoadingPatients(false);
    }
  }, [authHeaders, form.pacienteId, token, user?.pacienteId, user?.username]);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/tipodocumentoclinico`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? 'No se pudieron cargar los tipos de documento');
      }
      const normalized = (Array.isArray(body) ? body : [])
        .map((item: any) => ({
          tipodocumentoId: Number(item?.tipodocumentoId ?? item?.tipodocumentoid ?? item?.id ?? 0),
          nombre: String(item?.nombre ?? '').trim(),
        }))
        .filter((item: TipoDocumento) => item.tipodocumentoId > 0 && item.nombre.length > 0)
        .sort((a: TipoDocumento, b: TipoDocumento) => a.nombre.localeCompare(b.nombre, 'es'));
      setDocumentTypes(normalized);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar los tipos');
    }
  }, [authHeaders]);

  const fetchOriginRecords = useCallback(async () => {
    const requestId = ++originRequestRef.current;
    const origin = originOptions.find((item) => item.value === form.entidadOrigen);
    if (!origin?.endpoint || !form.pacienteId) {
      setOriginRecords([]);
      setLoadingOriginRecords(false);
      return;
    }

    setLoadingOriginRecords(true);
    try {
      const response = await fetch(`${API_URL}/${origin.endpoint}`, { headers: authHeaders });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? `No se pudieron cargar los registros de ${origin.label}`);
      }
      const patientId = Number(form.pacienteId);
      const records = (Array.isArray(body) ? body : [])
        .filter((item: any) => {
          const itemPatientId = Number(item?.pacienteId ?? item?.pacienteid ?? 0);
          return itemPatientId === patientId;
        })
        .map((item: any): OriginRecordOption | null => {
          const rawId = origin.idKeys.map((key) => item?.[key]).find((value) => value != null);
          const id = String(rawId ?? '').trim();
          if (!id) return null;
          const title = origin.titleKeys
            .map((key) => item?.[key])
            .find((value) => typeof value === 'string' && value.trim());
          const rawDate = origin.dateKeys.map((key) => item?.[key]).find((value) => value);
          const dateMatch = String(rawDate ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/);
          const dateLabel = dateMatch ? `${dateMatch[3]}/${dateMatch[2]}/${dateMatch[1]}` : '';
          return {
            id,
            label: [
              `${origin.label} #${id}`,
              typeof title === 'string' ? title.trim() : '',
              dateLabel,
            ].filter(Boolean).join(' · '),
          };
        })
        .filter((item: OriginRecordOption | null): item is OriginRecordOption => Boolean(item))
        .sort((a: OriginRecordOption, b: OriginRecordOption) =>
          Number(b.id) - Number(a.id),
        );
      if (requestId === originRequestRef.current) {
        setOriginRecords(records);
      }
    } catch (error) {
      if (requestId === originRequestRef.current) {
        setOriginRecords([]);
        Alert.alert('Error', error instanceof Error ? error.message : 'No se pudieron cargar los registros');
      }
    } finally {
      if (requestId === originRequestRef.current) {
        setLoadingOriginRecords(false);
      }
    }
  }, [authHeaders, form.entidadOrigen, form.pacienteId]);

  useEffect(() => {
    fetchPatients();
    fetchDocumentTypes();
  }, [fetchPatients, fetchDocumentTypes]);

  useEffect(() => {
    setForm((prev) => ({ ...prev, entidadId: '' }));
    fetchOriginRecords();
  }, [fetchOriginRecords]);

  const resetForm = () => {
    setForm((prev) => ({
      pacienteId: prev.pacienteId,
      entidadOrigen: 'general',
      entidadId: '',
      notas: '',
    }));
    setAttachment(null);
  };

  useEffect(() => {
    const video = webVideoRef.current;
    if (webCameraStream && video) {
      video.srcObject = webCameraStream;
      void video.play().catch(() => undefined);
    }

    return () => {
      webCameraStream?.getTracks().forEach((track) => track.stop());
    };
  }, [webCameraStream]);

  const validateFileSize = (size?: number | null) => {
    if (size && size > MAX_ATTACHMENT_BYTES) {
      Alert.alert('Archivo muy grande', 'La imagen o PDF no puede superar 3 MB.');
      return false;
    }
    return true;
  };

  const setWebFile = (
    accept: string,
    kind: DocumentAttachment['kind'],
    capture = false,
  ) => {
    if (typeof document === 'undefined') return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    if (capture) {
      input.setAttribute('capture', 'environment');
    }
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file || !validateFileSize(file.size)) return;
      const mimeType =
        file.type || (kind === 'pdf' ? 'application/pdf' : 'image/jpeg');
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = typeof reader.result === 'string' ? reader.result : '';
        if (!base64Data) {
          Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
          return;
        }
        setAttachment({
          uri: kind === 'image' ? base64Data : '',
          base64Data,
          name:
            file.name ||
            `documento-${Date.now()}.${kind === 'pdf' ? 'pdf' : 'jpg'}`,
          mimeType,
          kind,
          size: file.size,
        });
      };
      reader.onerror = () =>
        Alert.alert('Error', 'No se pudo leer el archivo seleccionado.');
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const readNativeFileAsDataUrl = async (uri: string, mimeType: string) => {
    const file = new FileSystem.File(uri);
    const base64 = await file.base64();
    return `data:${mimeType};base64,${base64}`;
  };

  const handleTakePhoto = async () => {
    if (Platform.OS === 'web') {
      if (!navigator.mediaDevices?.getUserMedia) {
        setWebFile('image/*', 'image', true);
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        });
        setWebCameraStream(stream);
      } catch {
        Alert.alert(
          'Cámara no disponible',
          'No se pudo abrir la cámara. Revisa el permiso del navegador o elige una imagen.',
        );
      }
      return;
    }

    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Debes permitir acceso a la cámara.');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!validateFileSize(asset.fileSize)) return;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const base64Data = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : await readNativeFileAsDataUrl(asset.uri, mimeType);
      setAttachment({
        uri: asset.uri,
        base64Data,
        name: asset.fileName ?? `documento-${Date.now()}.jpg`,
        mimeType,
        kind: 'image',
        size: asset.fileSize,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo abrir la cámara');
    }
  };

  const handlePickImage = async () => {
    if (Platform.OS === 'web') {
      setWebFile('image/*', 'image');
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permiso requerido', 'Debes permitir acceso a tus imágenes.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: false,
        quality: 0.5,
        base64: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!validateFileSize(asset.fileSize)) return;
      const mimeType = asset.mimeType ?? 'image/jpeg';
      const base64Data = asset.base64
        ? `data:${mimeType};base64,${asset.base64}`
        : await readNativeFileAsDataUrl(asset.uri, mimeType);
      setAttachment({
        uri: asset.uri,
        base64Data,
        name: asset.fileName ?? `documento-${Date.now()}.jpg`,
        mimeType,
        kind: 'image',
        size: asset.fileSize,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo elegir la imagen');
    }
  };

  const handlePickPdf = async () => {
    if (Platform.OS === 'web') {
      setWebFile('application/pdf,.pdf', 'pdf');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;
      const asset = result.assets[0];
      if (!validateFileSize(asset.size)) return;
      const mimeType = asset.mimeType ?? 'application/pdf';
      setAttachment({
        uri: asset.uri,
        base64Data: await readNativeFileAsDataUrl(asset.uri, mimeType),
        name: asset.name ?? `documento-${Date.now()}.pdf`,
        mimeType,
        kind: 'pdf',
        size: asset.size,
      });
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo elegir el PDF');
    }
  };

  const closeWebCamera = () => {
    webCameraStream?.getTracks().forEach((track) => track.stop());
    setWebCameraStream(null);
  };

  const captureWebPhoto = () => {
    const video = webVideoRef.current;
    if (!video?.videoWidth || !video.videoHeight) {
      Alert.alert('Espera un momento', 'La cámara todavía se está preparando.');
      return;
    }

    const maxWidth = 1280;
    const scale = Math.min(1, maxWidth / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(video.videoWidth * scale);
    canvas.height = Math.round(video.videoHeight * scale);
    const context = canvas.getContext('2d');
    if (!context) {
      Alert.alert('Error', 'No se pudo capturar la fotografía.');
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64Data = canvas.toDataURL('image/jpeg', 0.82);
    const size = Math.ceil((base64Data.length - base64Data.indexOf(',') - 1) * 0.75);
    if (!validateFileSize(size)) return;

    setAttachment({
      uri: base64Data,
      base64Data,
      name: `foto-documento-${Date.now()}.jpg`,
      mimeType: 'image/jpeg',
      kind: 'image',
      size,
    });
    closeWebCamera();
  };

  const handleSubmit = async () => {
    if (!form.pacienteId) {
      Alert.alert('Faltan datos', 'La persona asociada es obligatoria.');
      return;
    }
    if (!automaticDocumentType) {
      Alert.alert('Configuración incompleta', 'No hay tipos de documento disponibles para guardar el archivo.');
      return;
    }
    if (!attachment) {
      Alert.alert(
        'Falta el archivo',
        'Elige una imagen, toma una foto o sube un PDF.',
      );
      return;
    }
    if (form.entidadOrigen !== 'general' && !form.entidadId) {
      Alert.alert(
        'Falta el registro',
        `Selecciona el registro de ${selectedOrigin.label.toLowerCase()} al que pertenece el documento.`,
      );
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/documentoclinico`, {
        method: 'POST',
        headers: jsonHeaders,
        body: JSON.stringify({
          pacienteId: Number(form.pacienteId),
          tipodocumentoId: automaticDocumentType.tipodocumentoId,
          entidadorigen: form.entidadOrigen,
          entidadId: form.entidadId ? Number(form.entidadId) : undefined,
          archivoBase64: attachment?.base64Data,
          nombreArchivo: attachment?.name,
          mimeArchivo: attachment?.mimeType,
          notas: form.notas.trim() || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message ?? 'No se pudo registrar el documento');
      }
      Alert.alert(
        'Documento guardado',
        'El archivo quedó adjunto al expediente clínico.',
      );
      resetForm();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Falló la petición');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        visible={Platform.OS === 'web' && Boolean(webCameraStream)}
        transparent
        animationType="fade"
        onRequestClose={closeWebCamera}
      >
        <View style={styles.cameraBackdrop}>
          <View style={styles.cameraCard}>
            <View style={styles.cameraHeader}>
              <View>
                <AppText style={styles.cameraTitle}>Tomar fotografía</AppText>
                <AppText style={styles.cameraHint}>Coloca el documento dentro del encuadre.</AppText>
              </View>
              <TouchableOpacity style={styles.cameraCloseButton} onPress={closeWebCamera}>
                <Ionicons name="close" size={24} color={appColors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.cameraViewport}>
              {React.createElement('video', {
                ref: webVideoRef,
                autoPlay: true,
                playsInline: true,
                muted: true,
                style: {
                  display: 'block',
                  width: '100%',
                  maxHeight: 520,
                  objectFit: 'cover',
                  backgroundColor: appColors.overlay,
                },
              })}
            </View>
            <TouchableOpacity style={styles.captureButton} onPress={captureWebPhoto}>
              <Ionicons name="camera" size={22} color={appColors.background} />
              <AppText style={styles.captureButtonText}>Capturar foto</AppText>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroTopRow}>
          <View style={styles.heroIcon}>
            <Ionicons name="folder-open-outline" size={30} color={appColors.text} />
          </View>
          <View style={styles.heroPill}>
            <Ionicons name="cloud-upload-outline" size={14} color={appColors.info} />
            <AppText style={styles.heroPillText}>Archivos clínicos</AppText>
          </View>
        </View>
        <AppText style={styles.kicker}>ESPACIOS CLÍNICOS</AppText>
        <AppText style={styles.title}>Documentos clínicos</AppText>
        <AppText style={styles.subtitle}>
          Adjunta imágenes, fotografías o PDF vinculados al expediente del paciente.
        </AppText>
      </View>

      <View style={styles.infoCard}>
        <Ionicons name="information-circle-outline" size={22} color={appColors.info} />
        <View style={styles.infoCopy}>
          <AppText style={styles.infoTitle}>Adjunta el documento</AppText>
          <AppText style={styles.infoText}>
            Puedes elegir una imagen, usar la cámara o subir un PDF de hasta 3 MB.
          </AppText>
        </View>
      </View>

      <View style={styles.formCard}>
        <AppText style={styles.sectionTitle}>Datos principales</AppText>

        <AppText style={styles.label}>Persona asociada</AppText>
        {loadingPatients ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={appColors.info} />
            <AppText style={styles.loadingText}>Cargando personas...</AppText>
          </View>
        ) : (
          <View style={styles.pickerWrapper}>
            <Picker
              style={styles.picker}
              selectedValue={form.pacienteId}
              onValueChange={(value) => handleChange('pacienteId', String(value))}
              dropdownIconColor={appColors.text}
            >
              <Picker.Item label="Selecciona una persona" value="" />
              {patientOptions.map((patient) => (
                <Picker.Item
                  key={patient.pacienteId}
                  label={patient.displayName}
                  value={String(patient.pacienteId)}
                />
              ))}
            </Picker>
          </View>
        )}
        {selectedPatient ? (
          <View style={styles.selectedCard}>
            <Ionicons name="checkmark-circle" size={18} color={appColors.success} />
            <AppText style={styles.selectedText}>{`Expediente de ${selectedPatient.displayName}`}</AppText>
          </View>
        ) : null}

      </View>

      <View style={styles.formCard}>
        <AppText style={styles.sectionTitle}>Origen del documento</AppText>
        <AppText style={styles.fieldHint}>
          Indica a qué módulo pertenece y selecciona el registro de la persona.
        </AppText>
        <View style={styles.originGrid}>
          {originOptions.map((origin) => {
            const active = form.entidadOrigen === origin.value;
            return (
              <TouchableOpacity
                key={origin.value}
                style={[styles.originChip, active && styles.originChipActive]}
                onPress={() => handleChange('entidadOrigen', origin.value)}
              >
                <Ionicons
                  name={origin.icon as any}
                  size={17}
                  color={active ? appColors.background : appColors.info}
                />
                <AppText style={[styles.originChipText, active && styles.originChipTextActive]}>{origin.label}</AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {form.entidadOrigen !== 'general' ? (
          <>
            <AppText style={styles.label}>{`Seleccionar ${selectedOrigin.label.toLowerCase()}`}</AppText>
            {loadingOriginRecords ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={appColors.info} />
                <AppText style={styles.loadingText}>Cargando registros...</AppText>
              </View>
            ) : originRecords.length > 0 ? (
              <View style={styles.pickerWrapper}>
                <Picker
                  style={styles.picker}
                  selectedValue={form.entidadId}
                  onValueChange={(value) => handleChange('entidadId', String(value))}
                  dropdownIconColor={appColors.text}
                >
                  <Picker.Item label={`Selecciona ${selectedOrigin.label.toLowerCase()}`} value="" />
                  {originRecords.map((record) => (
                    <Picker.Item key={record.id} label={record.label} value={record.id} />
                  ))}
                </Picker>
              </View>
            ) : (
              <View style={styles.emptyOriginRecords}>
                <Ionicons name="file-tray-outline" size={20} color={appColors.textMuted} />
                <AppText style={styles.emptyOriginRecordsText}>
                  {`Esta persona no tiene registros de ${selectedOrigin.label.toLowerCase()}.`}
                </AppText>
              </View>
            )}
          </>
        ) : (
          <AppText style={styles.fieldHint}>
            Usa General cuando el archivo no pertenece a un registro específico.
          </AppText>
        )}
      </View>

      <View style={styles.formCard}>
        <AppText style={styles.sectionTitle}>Archivo clínico</AppText>
        <AppText style={styles.label}>Archivo adjunto</AppText>
        <AppText style={styles.fieldHint}>Elige cómo deseas agregar el documento clínico.</AppText>

        <View style={styles.attachmentActions}>
          <TouchableOpacity style={styles.attachmentButton} onPress={handlePickImage}>
            <Ionicons name="image-outline" size={20} color={appColors.info} />
            <AppText style={styles.attachmentButtonText}>Elegir imagen</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentButton} onPress={handleTakePhoto}>
            <Ionicons name="camera-outline" size={20} color={appColors.info} />
            <AppText style={styles.attachmentButtonText}>Tomar foto</AppText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.attachmentButton} onPress={handlePickPdf}>
            <Ionicons name="document-attach-outline" size={20} color={appColors.info} />
            <AppText style={styles.attachmentButtonText}>Subir PDF</AppText>
          </TouchableOpacity>
        </View>

        {attachment ? (
          <View style={styles.attachmentPreview}>
            {attachment.kind === 'image' ? (
              <Image source={{ uri: attachment.uri }} style={styles.attachmentImage} />
            ) : (
              <View style={styles.pdfIcon}>
                <Ionicons name="document-text" size={31} color={appColors.accent} />
              </View>
            )}
            <View style={styles.attachmentInfo}>
              <AppText style={styles.attachmentTitle}>
                {attachment.kind === 'pdf' ? 'PDF seleccionado' : 'Imagen seleccionada'}
              </AppText>
              <AppText style={styles.attachmentName} numberOfLines={1}>{attachment.name}</AppText>
              <AppText style={styles.attachmentMeta}>
                {attachment.size ? `${(attachment.size / 1024 / 1024).toFixed(2)} MB · ` : ''}
                {attachment.mimeType}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.removeAttachmentButton}
              onPress={() => setAttachment(null)}
              accessibilityLabel="Quitar archivo adjunto"
            >
              <Ionicons name="trash-outline" size={20} color={appColors.accent} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.emptyAttachment}>
            <Ionicons name="cloud-upload-outline" size={22} color={appColors.textMuted} />
            <AppText style={styles.emptyAttachmentText}>Aún no has seleccionado un archivo</AppText>
          </View>
        )}

        <AppText style={styles.label}>Notas</AppText>
        <AppTextInput
          style={[styles.input, styles.multiline]}
          placeholder="Describe qué contiene, fecha del estudio o indicaciones relevantes"
          placeholderTextColor={appColors.textMuted}
          value={form.notas}
          multiline
          onChangeText={(value) => handleChange('notas', value)}
        />
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.cancelBtn} onPress={resetForm} disabled={submitting}>
          <AppText style={styles.cancelBtnText}>Limpiar</AppText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.primaryBtn, submitting && styles.disabledBtn]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? <ActivityIndicator color={appColors.text} /> : <Ionicons name="save-outline" size={20} color={appColors.text} />}
          <AppText style={styles.btnText}>{submitting ? 'Guardando...' : 'Guardar documento'}</AppText>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingBottom: 110,
    backgroundColor: 'transparent',
    gap: 16,
  },
  heroCard: {
    backgroundColor: appColors.surfaceStrong,
    borderRadius: 26,
    padding: 22,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  heroIcon: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: colorAlpha(appColors.info, '22'),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
  },
  heroPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '44'),
  },
  heroPillText: {
    color: appColors.textSoft,
    fontSize: 12,
    fontWeight: '800',
  },
  kicker: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    fontSize: 30,
    fontWeight: '900',
    color: appColors.text,
  },
  subtitle: {
    marginTop: 8,
    color: appColors.textSoft,
    lineHeight: 20,
  },
  infoCard: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: colorAlpha(appColors.info, '12'),
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '45'),
  },
  infoCopy: {
    flex: 1,
    gap: 4,
  },
  infoTitle: {
    color: appColors.text,
    fontWeight: '900',
    fontSize: 16,
  },
  infoText: {
    color: appColors.textSoft,
    lineHeight: 19,
  },
  formCard: {
    backgroundColor: appColors.surface,
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: appColors.border,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: appColors.text,
  },
  label: {
    fontSize: 14,
    fontWeight: '800',
    color: appColors.text,
    marginTop: 4,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: appColors.backgroundMuted,
  },
  picker: {
    color: appColors.text,
  },
  selectedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 14,
    padding: 12,
    backgroundColor: colorAlpha(appColors.success, '14'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '45'),
  },
  selectedText: {
    flex: 1,
    color: appColors.textSoft,
    fontWeight: '700',
  },
  fieldHint: {
    color: appColors.textMuted,
    lineHeight: 18,
  },
  emptyOriginRecords: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 13,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: appColors.border,
    borderRadius: 14,
    backgroundColor: appColors.backgroundMuted,
  },
  emptyOriginRecordsText: {
    flex: 1,
    color: appColors.textMuted,
    fontWeight: '700',
  },
  attachmentActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  cameraBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: colorAlpha(appColors.overlay, 'CC'),
  },
  cameraCard: {
    width: '100%',
    maxWidth: 760,
    gap: 16,
    padding: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.surface,
  },
  cameraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  cameraTitle: {
    color: appColors.text,
    fontSize: 20,
    fontWeight: '900',
  },
  cameraHint: {
    color: appColors.textMuted,
    marginTop: 3,
  },
  cameraCloseButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: appColors.backgroundMuted,
  },
  cameraViewport: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.overlay,
  },
  captureButton: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 15,
    backgroundColor: appColors.info,
  },
  captureButtonText: {
    color: appColors.background,
    fontSize: 15,
    fontWeight: '900',
  },
  attachmentButton: {
    flex: 1,
    minWidth: 150,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
    backgroundColor: colorAlpha(appColors.info, '0D'),
  },
  attachmentButtonText: {
    color: appColors.text,
    fontWeight: '800',
  },
  attachmentPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '55'),
    backgroundColor: colorAlpha(appColors.success, '10'),
  },
  attachmentImage: {
    width: 72,
    height: 72,
    borderRadius: 12,
    backgroundColor: appColors.backgroundMuted,
  },
  pdfIcon: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: colorAlpha(appColors.accent, '14'),
  },
  attachmentInfo: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  attachmentTitle: {
    color: appColors.success,
    fontSize: 13,
    fontWeight: '900',
  },
  attachmentName: {
    color: appColors.text,
    fontWeight: '800',
  },
  attachmentMeta: {
    color: appColors.textMuted,
    fontSize: 12,
  },
  removeAttachmentButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colorAlpha(appColors.accent, '45'),
    backgroundColor: colorAlpha(appColors.accent, '10'),
  },
  emptyAttachment: {
    minHeight: 62,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 9,
    padding: 14,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: appColors.border,
    borderRadius: 14,
    backgroundColor: appColors.backgroundMuted,
  },
  emptyAttachmentText: {
    color: appColors.textMuted,
    fontWeight: '700',
  },
  originGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  originChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  originChipActive: {
    backgroundColor: appColors.info,
    borderColor: appColors.info,
  },
  originChipText: {
    color: appColors.textSoft,
    fontWeight: '800',
    fontSize: 12,
  },
  originChipTextActive: {
    color: appColors.background,
  },
  input: {
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 14,
    padding: 14,
    fontSize: 16,
    backgroundColor: appColors.backgroundMuted,
    color: appColors.text,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  loadingText: {
    color: appColors.textSoft,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
    backgroundColor: appColors.backgroundMuted,
  },
  cancelBtnText: {
    color: appColors.textSoft,
    fontWeight: '800',
  },
  primaryBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: appColors.accent,
    paddingVertical: 15,
    borderRadius: 16,
  },
  disabledBtn: {
    opacity: 0.65,
  },
  btnText: {
    color: appColors.text,
    textAlign: 'center',
    fontWeight: '900',
    fontSize: 15,
  },
});
