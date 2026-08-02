import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useFocusEffect } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { AppText, AppTextInput } from '../components/AppText';
import { useAuth } from '../context/AuthContext';
import { RootStackParamList } from '../navigation/types';
import { appColors, colorAlpha } from '../theme/colors';
import { apiFetch, buildJsonHeaders, parseJsonResponse } from '../utils/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'MedicoRegistro'>;
type Feedback = { type: 'success' | 'error'; message: string } | null;
type SelectedImage = { uri: string; base64: string; name: string };
type SelectedDocument = {
  uri: string;
  base64: string;
  name: string;
  mimeType: string;
  kind: 'image' | 'pdf';
};
type MedicoRegistro = {
  medicoregistroId: number;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  hospitaltrabajo: string;
  titulo: string;
  numerolicencia: string;
  codigominsa?: string | null;
  observaciones?: string | null;
};
type ApiError = {
  message?: string | string[];
  error?: string;
  detalles?: Array<{ message?: string }>;
};

const getErrorMessage = (body: ApiError | null, fallback: string) => {
  if (Array.isArray(body?.message)) return body.message.join('\n');
  if (typeof body?.message === 'string') return body.message;
  if (body?.detalles?.length) {
    return body.detalles.map((detail) => detail.message).filter(Boolean).join('\n') || fallback;
  }
  return body?.error || fallback;
};

export function MedicoRegistroScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === 'web' && width >= 1050;
  const isTablet = width >= 700;
  const { login, token, user } = useAuth();
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState<'pet' | 'school' | 'city'>('pet');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [hospitalTrabajo, setHospitalTrabajo] = useState('');
  const [titulo, setTitulo] = useState('');
  const [codigoMinsa, setCodigoMinsa] = useState('');
  const [numeroLicencia, setNumeroLicencia] = useState('');
  const [entidadCertificadora, setEntidadCertificadora] = useState('');
  const [especialidadPrincipal, setEspecialidadPrincipal] = useState('');
  const [fotoCodigoMinsa, setFotoCodigoMinsa] = useState<SelectedImage | null>(null);
  const [fotoTitulo, setFotoTitulo] = useState<SelectedImage | null>(null);
  const [documentoCedula, setDocumentoCedula] = useState<SelectedDocument | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<MedicoRegistro | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      const loadRequest = async () => {
        if (!token || !user?.id) {
          setChecking(false);
          return;
        }
        setChecking(true);
        try {
          const response = await apiFetch(`/medicoregistro/usuario/${user.id}`, {
            headers: buildJsonHeaders(token),
          });
          if (response.status === 404) {
            if (active) setExisting(null);
            return;
          }
          const body = await parseJsonResponse<MedicoRegistro & ApiError>(response);
          if (!response.ok) throw new Error(getErrorMessage(body, 'No se pudo consultar tu solicitud.'));
          if (active) setExisting(body);
        } catch (error) {
          if (active) {
            setFeedback({
              type: 'error',
              message: error instanceof Error ? error.message : 'No se pudo consultar tu solicitud.',
            });
          }
        } finally {
          if (active) setChecking(false);
        }
      };
      void loadRequest();
      return () => {
        active = false;
      };
    }, [token, user?.id]),
  );

  const chooseImage = async (setter: (image: SelectedImage) => void, label: string) => {
    setFeedback(null);
    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setFeedback({ type: 'error', message: 'Necesitamos permiso para elegir la fotografía.' });
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.65,
      base64: true,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    if (!asset.base64) {
      setFeedback({ type: 'error', message: `No se pudo leer la fotografía de ${label}.` });
      return;
    }
    setter({
      uri: asset.uri,
      base64: asset.base64,
      name: asset.fileName || `${label}.jpg`,
    });
  };

  const chooseCedulaDocument = async () => {
    setFeedback(null);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.length) return;

      const asset = result.assets[0];
      if (asset.size && asset.size > 3 * 1024 * 1024) {
        setFeedback({
          type: 'error',
          message: 'La imagen o PDF de la cédula no puede superar 3 MB.',
        });
        return;
      }

      const isPdf =
        asset.mimeType === 'application/pdf' || asset.name.toLowerCase().endsWith('.pdf');
      const mimeType = isPdf ? 'application/pdf' : asset.mimeType || 'image/jpeg';
      if (!isPdf && !mimeType.startsWith('image/')) {
        setFeedback({
          type: 'error',
          message: 'Selecciona una imagen o un archivo PDF para la cédula.',
        });
        return;
      }

      let base64: string;
      const webFile = asset.file;
      if (Platform.OS === 'web' && webFile) {
        base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('No se pudo leer el archivo.'));
          reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
          reader.readAsDataURL(webFile);
        });
      } else {
        const file = new FileSystem.File(asset.uri);
        base64 = `data:${mimeType};base64,${await file.base64()}`;
      }

      setDocumentoCedula({
        uri: asset.uri,
        base64,
        name: asset.name || `cedula.${isPdf ? 'pdf' : 'jpg'}`,
        mimeType,
        kind: isPdf ? 'pdf' : 'image',
      });
    } catch (error) {
      setFeedback({
        type: 'error',
        message:
          error instanceof Error
            ? error.message
            : 'No se pudo seleccionar el documento de cédula.',
      });
    }
  };

  const submit = async () => {
    setFeedback(null);
    if (!hospitalTrabajo.trim() || !titulo.trim() || !numeroLicencia.trim()) {
      setFeedback({
        type: 'error',
        message: 'Completa el hospital, el título profesional y el número de licencia.',
      });
      return;
    }
    if (!token || !user?.id) {
      if (
        !email.trim() ||
        !city.trim() ||
        !country.trim() ||
        !username.trim() ||
        !password ||
        !securityAnswer.trim()
      ) {
        setFeedback({
          type: 'error',
          message: 'Completa todos los datos de la cuenta y los datos profesionales obligatorios.',
        });
        return;
      }
      if (password.length < 6) {
        setFeedback({ type: 'error', message: 'La contraseña debe tener al menos 6 caracteres.' });
        return;
      }
      if (password !== confirmPassword) {
        setFeedback({ type: 'error', message: 'Las contraseñas no coinciden.' });
        return;
      }
    }
    setSaving(true);
    let activeToken = token;
    let activeUser = user;
    let createdSession:
      | {
          accessToken: string;
          user: NonNullable<typeof user>;
        }
      | undefined;
    try {
      if (!activeToken || !activeUser?.id) {
        const accountResponse = await apiFetch('/users/register', {
          method: 'POST',
          headers: buildJsonHeaders(),
          body: JSON.stringify({
            username: username.trim(),
            email: email.trim().toLowerCase(),
            password,
            city: city.trim(),
            country: country.trim(),
            securityQuestion,
            securityAnswer: securityAnswer.trim(),
          }),
        });
        const accountBody = await parseJsonResponse<ApiError>(accountResponse);
        if (!accountResponse.ok) {
          throw new Error(getErrorMessage(accountBody, 'No se pudo crear la cuenta.'));
        }

        const loginResponse = await apiFetch('/auth/login', {
          method: 'POST',
          headers: buildJsonHeaders(),
          body: JSON.stringify({ username: username.trim(), password }),
        });
        const loginBody = await parseJsonResponse<{
          accessToken?: string;
          user?: NonNullable<typeof user>;
          message?: string;
        }>(loginResponse);
        if (!loginResponse.ok || !loginBody?.accessToken || !loginBody.user) {
          throw new Error(loginBody?.message || 'La cuenta fue creada, pero no se pudo iniciar sesión.');
        }
        activeToken = loginBody.accessToken;
        activeUser = loginBody.user;
        createdSession = {
          accessToken: loginBody.accessToken,
          user: loginBody.user,
        };
      }

      const response = await apiFetch('/medicoregistro', {
        method: 'POST',
        headers: buildJsonHeaders(activeToken),
        body: JSON.stringify({
          usuarioId: activeUser.id,
          hospitaltrabajo: hospitalTrabajo.trim(),
          titulo: titulo.trim(),
          numerolicencia: numeroLicencia.trim(),
          codigominsa: codigoMinsa.trim() || null,
          entidadcertificadora: entidadCertificadora.trim() || null,
          especialidadprincipal: especialidadPrincipal.trim() || null,
          fotocodigominsaBase64: fotoCodigoMinsa?.base64 || null,
          fototituloBase64: fotoTitulo?.base64 || null,
          documentocedulaBase64: documentoCedula?.base64 || null,
          documentocedulaNombre: documentoCedula?.name || null,
          documentocedulaMimeType: documentoCedula?.mimeType || null,
          creadopor: activeUser.username,
        }),
      });
      const body = await parseJsonResponse<MedicoRegistro & ApiError>(response);
      if (!response.ok) throw new Error(getErrorMessage(body, 'No se pudo enviar la solicitud.'));
      setExisting(body);
      setFeedback({
        type: 'success',
        message: 'Tu solicitud fue enviada y quedó pendiente de revisión.',
      });
      if (createdSession) {
        login({
          token: createdSession.accessToken,
          user: createdSession.user,
          initialPrivateRoute: 'MedicoRegistro',
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error instanceof Error ? error.message : 'No se pudo enviar la solicitud.',
      });
      if (createdSession) {
        login({
          token: createdSession.accessToken,
          user: createdSession.user,
          initialPrivateRoute: 'MedicoRegistro',
        });
      }
    } finally {
      setSaving(false);
    }
  };

  if (checking) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={appColors.info} size="large" />
        <AppText style={styles.loadingText}>Consultando tu solicitud...</AppText>
      </View>
    );
  }

  if (existing) {
    const statusColor =
      existing.estado === 'aprobado'
        ? appColors.success
        : existing.estado === 'rechazado'
          ? appColors.accent
          : appColors.info;
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.heroIcon}>
          <Ionicons name="medkit-outline" size={36} color={statusColor} />
        </View>
        <AppText style={styles.title}>Solicitud médica</AppText>
        <AppText style={styles.subtitle}>Ya tienes una solicitud registrada en el sistema.</AppText>
        {feedback ? <FeedbackBanner feedback={feedback} /> : null}
        <View style={[styles.statusCard, { borderColor: colorAlpha(statusColor, '88') }]}>
          <View style={styles.statusRow}>
            <Ionicons name="shield-checkmark-outline" size={22} color={statusColor} />
            <AppText style={[styles.statusText, { color: statusColor }]}>
              {existing.estado.toUpperCase()}
            </AppText>
          </View>
          <InfoRow label="Hospital" value={existing.hospitaltrabajo} />
          <InfoRow label="Título" value={existing.titulo} />
          <InfoRow label="Licencia" value={existing.numerolicencia} />
          {existing.codigominsa ? <InfoRow label="Código MINSA" value={existing.codigominsa} /> : null}
          {existing.observaciones ? <InfoRow label="Observaciones" value={existing.observaciones} /> : null}
        </View>
        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.goBack()}>
          <AppText style={styles.secondaryButtonText}>Volver</AppText>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  const submitButton = (
    <TouchableOpacity
      style={[styles.primaryButton, saving && styles.disabledButton]}
      disabled={saving}
      onPress={() => void submit()}
    >
      {saving ? (
        <ActivityIndicator color={appColors.background} />
      ) : (
        <>
          <Ionicons name="send-outline" size={19} color={appColors.background} />
          <AppText style={styles.primaryButtonText}>Crear cuenta médica</AppText>
        </>
      )}
    </TouchableOpacity>
  );

  return (
    <ScrollView
      contentContainerStyle={[styles.container, isDesktop && styles.containerDesktop]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.shell}>
        <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
          <View style={[styles.heroIcon, isDesktop && styles.heroIconDesktop]}>
            <Ionicons name="medkit-outline" size={32} color={appColors.info} />
          </View>
          <View style={styles.heroCopy}>
            <AppText style={styles.eyebrow}>SOLICITUD PROFESIONAL</AppText>
            <AppText style={[styles.title, isDesktop && styles.titleDesktop]}>
              Crea tu cuenta médica
            </AppText>
            <AppText style={styles.subtitle}>
              Completa tus datos de acceso y credenciales profesionales. Revisaremos la solicitud
              antes de habilitar tu perfil médico.
            </AppText>
          </View>
          {isDesktop ? (
            <View style={styles.heroTrust}>
              <Ionicons name="shield-checkmark" size={20} color={appColors.success} />
              <View>
                <AppText style={styles.heroTrustTitle}>Proceso seguro</AppText>
                <AppText style={styles.heroTrustText}>Información protegida</AppText>
              </View>
            </View>
          ) : null}
        </View>

        {feedback ? <FeedbackBanner feedback={feedback} /> : null}

        <View style={[styles.contentRow, isDesktop && styles.contentRowDesktop]}>
          <View style={styles.formColumn}>
            {!token || !user?.id ? (
              <View style={styles.card}>
                <SectionHeader
                  step="01"
                  icon="person-outline"
                  title="Datos de acceso"
                  description="Crea las credenciales con las que ingresarás a Gestión Salud."
                />
                <View style={isTablet ? styles.fieldGrid : undefined}>
                  <Field wide={isTablet} label="Correo electrónico *" value={email} onChangeText={setEmail} placeholder="tu@email.com" />
                  <Field wide={isTablet} label="Usuario *" value={username} onChangeText={setUsername} placeholder="usuario.medico" />
                  <Field wide={isTablet} label="Ciudad *" value={city} onChangeText={setCity} placeholder="Ej. Managua" />
                  <Field wide={isTablet} label="País *" value={country} onChangeText={setCountry} placeholder="Ej. Nicaragua" />
                  <Field wide={isTablet} label="Contraseña *" value={password} onChangeText={setPassword} placeholder="Mínimo 6 caracteres" secureTextEntry />
                  <Field wide={isTablet} label="Confirmar contraseña *" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite la contraseña" secureTextEntry />
                </View>
                <View style={styles.securityBlock}>
                  <AppText style={styles.label}>Pregunta de seguridad *</AppText>
                  <View style={isTablet ? styles.questionGrid : undefined}>
                    {[
                      { id: 'pet' as const, label: 'Primera mascota' },
                      { id: 'school' as const, label: 'Primera escuela' },
                      { id: 'city' as const, label: 'Ciudad de nacimiento' },
                    ].map((question) => (
                      <TouchableOpacity
                        key={question.id}
                        style={[
                          styles.questionOption,
                          isTablet && styles.questionOptionWide,
                          securityQuestion === question.id && styles.questionOptionActive,
                        ]}
                        onPress={() => setSecurityQuestion(question.id)}
                      >
                        <View style={[
                          styles.radioDot,
                          securityQuestion === question.id && styles.radioDotActive,
                        ]} />
                        <AppText style={styles.questionOptionText}>{question.label}</AppText>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <Field label="Respuesta de seguridad *" value={securityAnswer} onChangeText={setSecurityAnswer} placeholder="Escribe tu respuesta" />
                </View>
              </View>
            ) : null}

            <View style={styles.card}>
              <SectionHeader
                step={!token || !user?.id ? '02' : '01'}
                icon="school-outline"
                title="Información profesional"
                description="Datos que utilizaremos para validar tu ejercicio médico."
              />
              <View style={isTablet ? styles.fieldGrid : undefined}>
                <Field wide={isTablet} label="Hospital o centro de trabajo *" value={hospitalTrabajo} onChangeText={setHospitalTrabajo} placeholder="Ej. Hospital Manolo Morales" />
                <Field wide={isTablet} label="Título profesional *" value={titulo} onChangeText={setTitulo} placeholder="Ej. Doctor en Medicina" />
                <Field wide={isTablet} label="Número de licencia *" value={numeroLicencia} onChangeText={setNumeroLicencia} placeholder="Licencia profesional" />
                <Field wide={isTablet} label="Código MINSA" value={codigoMinsa} onChangeText={setCodigoMinsa} placeholder="Código asignado" />
                <Field wide={isTablet} label="Entidad certificadora" value={entidadCertificadora} onChangeText={setEntidadCertificadora} placeholder="Universidad o entidad" />
                <Field wide={isTablet} label="Especialidad principal" value={especialidadPrincipal} onChangeText={setEspecialidadPrincipal} placeholder="Ej. Medicina interna" />
              </View>
            </View>

            <View style={styles.card}>
              <SectionHeader
                step={!token || !user?.id ? '03' : '02'}
                icon="documents-outline"
                title="Documentos de respaldo"
                description="Adjunta tus documentos en imagen; la cédula también puede enviarse en PDF."
              />
              <View style={isTablet ? styles.uploadGrid : undefined}>
                <ImageSelector label="Fotografía del título" image={fotoTitulo} onPress={() => void chooseImage(setFotoTitulo, 'título')} onRemove={() => setFotoTitulo(null)} wide={isTablet} />
                <ImageSelector label="Fotografía del código MINSA" image={fotoCodigoMinsa} onPress={() => void chooseImage(setFotoCodigoMinsa, 'código MINSA')} onRemove={() => setFotoCodigoMinsa(null)} wide={isTablet} />
                <DocumentSelector
                  label="Cédula de identidad (imagen o PDF)"
                  document={documentoCedula}
                  onPress={() => void chooseCedulaDocument()}
                  onRemove={() => setDocumentoCedula(null)}
                  wide={isTablet}
                />
              </View>
            </View>

            {!isDesktop ? (
              <View style={styles.mobileSubmit}>
                {submitButton}
                <AppText style={styles.legalText}>
                  Al enviar confirmas que la información proporcionada es correcta.
                </AppText>
              </View>
            ) : null}
          </View>

          {isDesktop ? (
            <View style={styles.aside}>
              <View style={styles.asideCard}>
                <AppText style={styles.asideEyebrow}>TU SOLICITUD</AppText>
                <AppText style={styles.asideTitle}>Tres pasos para verificar tu perfil</AppText>
                <StepItem number="1" title="Crea tu acceso" text="Define tus credenciales personales." active />
                <StepItem number="2" title="Acredita tu profesión" text="Agrega licencia y lugar de trabajo." />
                <StepItem number="3" title="Espera la revisión" text="El equipo verificará los documentos." />
                <View style={styles.asideDivider} />
                {submitButton}
                <AppText style={styles.legalText}>
                  Al enviar confirmas que la información proporcionada es correcta.
                </AppText>
              </View>
              <View style={styles.privacyCard}>
                <Ionicons name="lock-closed-outline" size={20} color={appColors.success} />
                <View style={styles.privacyCopy}>
                  <AppText style={styles.privacyTitle}>Tus datos están protegidos</AppText>
                  <AppText style={styles.privacyText}>
                    Solo se usarán para validar tu identidad profesional.
                  </AppText>
                </View>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </ScrollView>
  );
}

function FeedbackBanner({ feedback }: { feedback: Exclude<Feedback, null> }) {
  return (
    <View style={[styles.feedback, feedback.type === 'success' ? styles.success : styles.error]}>
      <Ionicons
        name={feedback.type === 'success' ? 'checkmark-circle-outline' : 'alert-circle-outline'}
        size={20}
        color={feedback.type === 'success' ? appColors.success : appColors.accent}
      />
      <AppText style={styles.feedbackText}>{feedback.message}</AppText>
    </View>
  );
}

function SectionHeader(props: {
  step: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.stepBadge}>
        <AppText style={styles.stepBadgeText}>{props.step}</AppText>
      </View>
      <View style={styles.sectionIcon}>
        <Ionicons name={props.icon} size={20} color={appColors.info} />
      </View>
      <View style={styles.sectionCopy}>
        <AppText style={styles.sectionTitle}>{props.title}</AppText>
        <AppText style={styles.helper}>{props.description}</AppText>
      </View>
    </View>
  );
}

function StepItem(props: { number: string; title: string; text: string; active?: boolean }) {
  return (
    <View style={styles.stepItem}>
      <View style={[styles.stepNumber, props.active && styles.stepNumberActive]}>
        <AppText style={[styles.stepNumberText, props.active && styles.stepNumberTextActive]}>
          {props.number}
        </AppText>
      </View>
      <View style={styles.stepCopy}>
        <AppText style={styles.stepTitle}>{props.title}</AppText>
        <AppText style={styles.stepText}>{props.text}</AppText>
      </View>
    </View>
  );
}

function Field(props: {
  label: string;
  value: string;
  placeholder: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  wide?: boolean;
}) {
  return (
    <View style={[styles.field, props.wide && styles.fieldWide]}>
      <AppText style={styles.label}>{props.label}</AppText>
      <AppTextInput
        style={styles.input}
        value={props.value}
        placeholder={props.placeholder}
        placeholderTextColor={appColors.textMuted}
        onChangeText={props.onChangeText}
        secureTextEntry={props.secureTextEntry}
        autoCapitalize={props.label.includes('Usuario') || props.label.includes('Correo') ? 'none' : undefined}
      />
    </View>
  );
}

function ImageSelector(props: {
  label: string;
  image: SelectedImage | null;
  onPress: () => void;
  onRemove: () => void;
  wide?: boolean;
}) {
  return (
    <View style={[styles.imageBlock, props.wide && styles.imageBlockWide]}>
      <AppText style={styles.label}>{props.label}</AppText>
      {props.image ? (
        <View style={styles.previewRow}>
          <Image source={{ uri: props.image.uri }} style={styles.preview} />
          <View style={styles.previewInfo}>
            <AppText style={styles.fileName} numberOfLines={2}>{props.image.name}</AppText>
            <TouchableOpacity onPress={props.onRemove}>
              <AppText style={styles.removeText}>Quitar fotografía</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={props.onPress}>
          <Ionicons name="image-outline" size={20} color={appColors.info} />
          <AppText style={styles.uploadText}>Seleccionar fotografía</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

function DocumentSelector(props: {
  label: string;
  document: SelectedDocument | null;
  onPress: () => void;
  onRemove: () => void;
  wide?: boolean;
}) {
  return (
    <View style={[styles.imageBlock, props.wide && styles.imageBlockWide]}>
      <AppText style={styles.label}>{props.label}</AppText>
      {props.document ? (
        <View style={styles.previewRow}>
          {props.document.kind === 'image' ? (
            <Image source={{ uri: props.document.base64 }} style={styles.preview} />
          ) : (
            <View style={styles.pdfPreview}>
              <Ionicons name="document-text-outline" size={30} color={appColors.accent} />
              <AppText style={styles.pdfPreviewText}>PDF</AppText>
            </View>
          )}
          <View style={styles.previewInfo}>
            <AppText style={styles.fileName} numberOfLines={2}>{props.document.name}</AppText>
            <TouchableOpacity onPress={props.onRemove}>
              <AppText style={styles.removeText}>Quitar documento</AppText>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.uploadButton} onPress={props.onPress}>
          <Ionicons name="document-attach-outline" size={22} color={appColors.info} />
          <AppText style={styles.uploadText}>Seleccionar imagen o PDF</AppText>
          <AppText style={styles.uploadHint}>Máximo 3 MB</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <AppText style={styles.infoLabel}>{label}</AppText>
      <AppText style={styles.infoValue}>{value}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    padding: 24,
  },
  loadingText: { color: appColors.textMuted, marginTop: 12 },
  container: {
    flexGrow: 1,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 44,
  },
  containerDesktop: {
    paddingHorizontal: 32,
    paddingTop: 28,
    paddingBottom: 64,
  },
  shell: {
    width: '100%',
    maxWidth: 1280,
    alignSelf: 'center',
  },
  hero: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 22,
    padding: 18,
    marginBottom: 18,
  },
  heroDesktop: {
    minHeight: 156,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 24,
  },
  heroIcon: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorAlpha(appColors.info, '18'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.info, '55'),
    marginBottom: 14,
  },
  heroIconDesktop: { marginBottom: 0, marginRight: 18 },
  heroCopy: { flex: 1 },
  eyebrow: {
    color: appColors.info,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
    marginBottom: 6,
  },
  title: { color: appColors.text, fontSize: 27, fontWeight: '900', lineHeight: 34 },
  titleDesktop: { fontSize: 34, lineHeight: 41 },
  subtitle: {
    color: appColors.textSoft,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 7,
    maxWidth: 700,
  },
  heroTrust: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colorAlpha(appColors.success, '10'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '44'),
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginLeft: 24,
  },
  heroTrustTitle: { color: appColors.text, fontSize: 12, fontWeight: '800' },
  heroTrustText: { color: appColors.textMuted, fontSize: 10, marginTop: 2 },
  feedback: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
    borderRadius: 14,
    padding: 13,
    marginBottom: 16,
  },
  success: {
    backgroundColor: colorAlpha(appColors.success, '12'),
    borderColor: colorAlpha(appColors.success, '66'),
  },
  error: {
    backgroundColor: colorAlpha(appColors.accent, '12'),
    borderColor: colorAlpha(appColors.accent, '66'),
  },
  feedbackText: { color: appColors.textSoft, lineHeight: 19, marginLeft: 9, flex: 1 },
  contentRow: { width: '100%' },
  contentRowDesktop: { flexDirection: 'row', alignItems: 'flex-start', gap: 22 },
  formColumn: { flex: 1, minWidth: 0 },
  card: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: appColors.borderStrong,
    paddingBottom: 15,
    marginBottom: 16,
  },
  stepBadge: {
    minWidth: 34,
    height: 26,
    borderRadius: 8,
    backgroundColor: colorAlpha(appColors.info, '18'),
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },
  stepBadgeText: { color: appColors.info, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.backgroundMuted,
    marginRight: 11,
  },
  sectionCopy: { flex: 1 },
  sectionTitle: { color: appColors.text, fontSize: 17, fontWeight: '800' },
  helper: { color: appColors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  fieldGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  field: { marginBottom: 14 },
  fieldWide: { width: '50%', paddingHorizontal: 6 },
  label: { color: appColors.textSoft, fontSize: 12, fontWeight: '700', marginBottom: 7 },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 12,
    backgroundColor: appColors.backgroundMuted,
    color: appColors.text,
    paddingHorizontal: 13,
    fontSize: 14,
  },
  securityBlock: {
    backgroundColor: colorAlpha(appColors.backgroundMuted, 'AA'),
    borderRadius: 14,
    padding: 13,
    marginTop: 2,
  },
  questionGrid: {
    flexDirection: 'row',
    marginHorizontal: -4,
    marginBottom: 5,
  },
  questionOption: {
    minHeight: 43,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 10,
    paddingHorizontal: 11,
    marginBottom: 8,
    backgroundColor: appColors.backgroundMuted,
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionOptionWide: { flex: 1, marginHorizontal: 4 },
  questionOptionActive: {
    borderColor: appColors.info,
    backgroundColor: colorAlpha(appColors.info, '18'),
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: appColors.textMuted,
    marginRight: 8,
  },
  radioDotActive: {
    borderColor: appColors.info,
    backgroundColor: appColors.info,
  },
  questionOptionText: { color: appColors.textSoft, fontSize: 11, flexShrink: 1 },
  uploadGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  imageBlock: { marginBottom: 8 },
  imageBlockWide: { width: '50%', paddingHorizontal: 6 },
  uploadButton: {
    minHeight: 104,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: appColors.info,
    borderRadius: 13,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colorAlpha(appColors.info, '0C'),
  },
  uploadText: { color: appColors.info, fontWeight: '700', fontSize: 12 },
  uploadHint: { color: appColors.textMuted, fontSize: 9 },
  previewRow: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 13,
    padding: 9,
  },
  preview: { width: 72, height: 72, borderRadius: 10, backgroundColor: appColors.backgroundMuted },
  pdfPreview: { width: 72, height: 72, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colorAlpha(appColors.accent, '12') },
  pdfPreviewText: { color: appColors.accent, fontSize: 9, fontWeight: '900', marginTop: 2 },
  previewInfo: { flex: 1, marginLeft: 12 },
  fileName: { color: appColors.textSoft, fontSize: 12 },
  removeText: { color: appColors.accent, fontSize: 11, fontWeight: '700', marginTop: 7 },
  primaryButton: {
    minHeight: 52,
    width: '100%',
    borderRadius: 13,
    backgroundColor: appColors.success,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 18,
  },
  primaryButtonText: { color: appColors.background, fontWeight: '900', fontSize: 14 },
  disabledButton: { opacity: 0.65 },
  mobileSubmit: { marginTop: 2 },
  legalText: {
    color: appColors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: 'center',
    marginTop: 9,
  },
  aside: { width: 330 },
  asideCard: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 20,
    padding: 20,
  },
  asideEyebrow: {
    color: appColors.success,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
    marginBottom: 7,
  },
  asideTitle: { color: appColors.text, fontSize: 18, lineHeight: 24, fontWeight: '800', marginBottom: 20 },
  stepItem: { flexDirection: 'row', marginBottom: 17 },
  stepNumber: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: appColors.backgroundMuted,
    borderWidth: 1,
    borderColor: appColors.border,
  },
  stepNumberActive: { backgroundColor: appColors.info, borderColor: appColors.info },
  stepNumberText: { color: appColors.textMuted, fontSize: 11, fontWeight: '900' },
  stepNumberTextActive: { color: appColors.background },
  stepCopy: { flex: 1, marginLeft: 11 },
  stepTitle: { color: appColors.text, fontSize: 12, fontWeight: '800' },
  stepText: { color: appColors.textMuted, fontSize: 10, lineHeight: 15, marginTop: 2 },
  asideDivider: { height: 1, backgroundColor: appColors.borderStrong, marginBottom: 17 },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colorAlpha(appColors.success, '0E'),
    borderWidth: 1,
    borderColor: colorAlpha(appColors.success, '38'),
    borderRadius: 16,
    padding: 14,
    marginTop: 14,
  },
  privacyCopy: { flex: 1, marginLeft: 10 },
  privacyTitle: { color: appColors.text, fontSize: 11, fontWeight: '800' },
  privacyText: { color: appColors.textMuted, fontSize: 9, lineHeight: 14, marginTop: 3 },
  statusCard: {
    backgroundColor: appColors.surface,
    borderWidth: 1,
    borderRadius: 18,
    padding: 17,
    maxWidth: 680,
  },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginBottom: 12 },
  statusText: { fontWeight: '900', letterSpacing: 0.8 },
  infoRow: { borderTopWidth: 1, borderTopColor: appColors.borderStrong, paddingVertical: 11 },
  infoLabel: { color: appColors.textMuted, fontSize: 12, marginBottom: 3 },
  infoValue: { color: appColors.text, fontSize: 15, fontWeight: '600' },
  secondaryButton: {
    minHeight: 48,
    maxWidth: 680,
    borderWidth: 1,
    borderColor: appColors.border,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  secondaryButtonText: { color: appColors.textSoft, fontWeight: '700' },
});
