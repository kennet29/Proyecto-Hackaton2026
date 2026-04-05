import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { useAuth } from "../context/AuthContext";
import { API_URL } from "../config/api";

type Appointment = {
  citaId: number;
  pacienteId: number;
  estado?: string | null;
  especialidad?: string | null;
  motivo?: string | null;
  date: string;
  timeLabel: string;
};

const toDateOnlyString = (input?: Date | string | null): string => {
  if (!input) return "";
  if (input instanceof Date) {
    if (Number.isNaN(input.getTime())) {
      return "";
    }
    return [
      input.getFullYear(),
      String(input.getMonth() + 1).padStart(2, "0"),
      String(input.getDate()).padStart(2, "0"),
    ].join("-");
  }
  const trimmed = input.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, year, month, day] = match;
    return `${year}-${month}-${day}`;
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    return toDateOnlyString(parsed);
  }
  return "";
};

const formatHumanDate = (date?: string) => {
  if (!date) {
    return "Selecciona una fecha";
  }
  const segments = date.split("-").map((segment) => Number(segment));
  if (segments.length !== 3 || segments.some((item) => Number.isNaN(item))) {
    return date;
  }
  const parsed = new Date(segments[0], segments[1] - 1, segments[2]);
  return parsed.toLocaleDateString("es-NI", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
};

const formatHourLabel = (value?: string | null) => {
  if (!value) return "Sin hora";
  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleTimeString("es-NI", { hour: "2-digit", minute: "2-digit" });
  }
  const match = value.match(/T(\d{2}:\d{2})/);
  if (match) {
    return match[1];
  }
  return value;
};

const todayString = () => toDateOnlyString(new Date());

type CalendarMarks = {
  [date: string]: {
    selected?: boolean;
    selectedColor?: string;
    selectedTextColor?: string;
    marked?: boolean;
    dotColor?: string;
  };
};

export function CitaFormScreen() {
  const [form, setForm] = useState({
    pacienteId: "",
    fecha: "",
    especialidad: "",
    motivo: "",
  });
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState(todayString());
  const [loadingAppointments, setLoadingAppointments] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { token, user } = useAuth();

  const headers = useMemo(() => {
    const base: Record<string, string> = { "Content-Type": "application/json" };
    if (token) {
      base.Authorization = `Bearer ${token}`;
    }
    return base;
  }, [token]);

  const handleChange = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const mapAppointments = (payload: any[]): Appointment[] => {
    return payload
      .map((item) => {
        const rawDate = item?.fechacita ?? item?.fecha ?? "";
        const date = toDateOnlyString(rawDate);
        if (!date) {
          return null;
        }
        return {
          citaId: item?.citaId ?? item?.citaid ?? item?.id ?? Math.random(),
          pacienteId: item?.pacienteId ?? item?.pacienteid ?? 0,
          estado: item?.estado ?? null,
          especialidad: item?.especialidad ?? null,
          motivo: item?.motivo ?? null,
          date,
          timeLabel: formatHourLabel(rawDate),
        } as Appointment;
      })
      .filter((item): item is Appointment => Boolean(item));
  };

  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    setFetchError(null);
    try {
      const response = await fetch(`${API_URL}/citamedica`, { headers });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? "No se pudieron obtener las citas");
      }
      const data = Array.isArray(body) ? body : [];
      setAppointments(mapAppointments(data));
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : "No se pudieron cargar las citas");
      setAppointments([]);
    } finally {
      setLoadingAppointments(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const markedDates: CalendarMarks = useMemo(() => {
    const marks: CalendarMarks = {};
    appointments.forEach((appointment) => {
      const existing = marks[appointment.date] ?? {};
      marks[appointment.date] = {
        ...existing,
        marked: true,
        dotColor: "#f97316",
      };
    });
    if (selectedDate) {
      marks[selectedDate] = {
        ...(marks[selectedDate] ?? {}),
        selected: true,
        selectedColor: "#2563eb",
        selectedTextColor: "#fff",
        dotColor: marks[selectedDate]?.dotColor ?? "#22d3ee",
        marked: marks[selectedDate]?.marked ?? undefined,
      };
    }
    return marks;
  }, [appointments, selectedDate]);

  const appointmentsForSelectedDay = useMemo(
    () => appointments.filter((appointment) => appointment.date === selectedDate),
    [appointments, selectedDate],
  );

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setForm((prev) => {
      if (prev.fecha) {
        return prev;
      }
      return { ...prev, fecha: `${day.dateString}T09:00` };
    });
  };

  const handleSubmit = async () => {
    if (!form.pacienteId || !form.fecha) {
      Alert.alert("Campos requeridos", "Paciente y fecha son obligatorios");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/citamedica`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          pacienteid: Number(form.pacienteId),
          fechacita: form.fecha,
          especialidad: form.especialidad || undefined,
          motivo: form.motivo || undefined,
          creadopor: user?.username ?? undefined,
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(body?.message ?? "No se pudo agendar la cita");
      }
      Alert.alert("Cita creada", "La cita quedó registrada");
      setForm({ pacienteId: "", fecha: "", especialidad: "", motivo: "" });
      const newDate = toDateOnlyString(form.fecha);
      if (newDate) {
        setSelectedDate(newDate);
      }
      fetchAppointments();
      setShowForm(false);
    } catch (error) {
      Alert.alert("Error", error instanceof Error ? error.message : "Falló la petición");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Citas Programadas</Text>
      <View style={styles.calendarCard}>
        {loadingAppointments ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color="#2563eb" />
            <Text style={styles.loadingText}>Cargando agenda...</Text>
          </View>
        ) : (
          <Calendar
            markedDates={markedDates}
            onDayPress={handleDayPress}
            initialDate={selectedDate}
            enableSwipeMonths
            firstDay={1}
            theme={{
              todayTextColor: "#2563eb",
              arrowColor: "#2563eb",
              selectedDayBackgroundColor: "#2563eb",
              selectedDayTextColor: "#fff",
              textDayFontFamily: "System",
              textMonthFontFamily: "System",
              textDayHeaderFontFamily: "System",
            }}
            style={styles.calendar}
          />
        )}
        {fetchError ? <Text style={styles.errorText}>{fetchError}</Text> : null}
      </View>

      <View style={styles.dailySection}>
        <Text style={styles.sectionTitle}>{formatHumanDate(selectedDate)}</Text>
        {appointmentsForSelectedDay.length === 0 ? (
          <Text style={styles.emptyText}>No hay citas para este día.</Text>
        ) : (
          appointmentsForSelectedDay.map((appointment) => (
            <View key={appointment.citaId} style={styles.appointmentCard}>
              <View style={styles.appointmentHeader}>
                <Text style={styles.appointmentHour}>{appointment.timeLabel}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{appointment.estado ?? "Programada"}</Text>
                </View>
              </View>
              <Text style={styles.appointmentTitle}>Paciente #{appointment.pacienteId}</Text>
              {appointment.especialidad ? (
                <Text style={styles.appointmentDetail}>Especialidad: {appointment.especialidad}</Text>
              ) : null}
              {appointment.motivo ? (
                <Text style={styles.appointmentDetail}>Motivo: {appointment.motivo}</Text>
              ) : null}
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.toggleBtn} onPress={() => setShowForm((prev) => !prev)}>
        <Text style={styles.toggleBtnText}>
          {showForm ? "Cerrar formulario" : "Crear nueva cita"}
        </Text>
      </TouchableOpacity>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Registrar cita</Text>
          <TextInput
            style={styles.input}
            placeholder="Paciente ID"
            keyboardType="numeric"
            value={form.pacienteId}
            onChangeText={(value) => handleChange("pacienteId", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Fecha (YYYY-MM-DDTHH:MM)"
            value={form.fecha}
            onChangeText={(value) => handleChange("fecha", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Especialidad"
            value={form.especialidad}
            onChangeText={(value) => handleChange("especialidad", value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Motivo"
            value={form.motivo}
            onChangeText={(value) => handleChange("motivo", value)}
          />
          <TouchableOpacity
            style={[styles.primaryBtn, isSubmitting && styles.disabledBtn]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Guardar Cita</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#f8fafc",
    gap: 16,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  calendarCard: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  calendar: {
    borderRadius: 12,
  },
  loadingBox: {
    alignItems: "center",
    paddingVertical: 24,
  },
  loadingText: {
    marginTop: 8,
    color: "#475569",
  },
  errorText: {
    color: "#b91c1c",
    marginTop: 8,
    textAlign: "center",
  },
  dailySection: {
    borderRadius: 20,
    backgroundColor: "#fff",
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textTransform: "capitalize",
  },
  emptyText: {
    color: "#475569",
  },
  appointmentCard: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 14,
    padding: 12,
    gap: 4,
  },
  appointmentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  appointmentHour: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2563eb",
  },
  statusBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusBadgeText: {
    color: "#1d4ed8",
    fontWeight: "700",
    fontSize: 12,
  },
  appointmentTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#0f172a",
  },
  appointmentDetail: {
    color: "#475569",
  },
  toggleBtn: {
    backgroundColor: "#0ea5e9",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  toggleBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  formCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 18,
    gap: 12,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d4d4d8",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  primaryBtn: {
    backgroundColor: "#22c55e",
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 4,
    alignItems: "center",
  },
  disabledBtn: {
    opacity: 0.7,
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
