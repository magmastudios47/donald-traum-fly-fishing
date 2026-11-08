"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  TraumStoreData,
  CalendarDeparture,
  CustomTripRequest,
  DepartureEnrollment,
  ExperienceModality,
  GalleryImageItem,
} from "@/types/traum";
import {
  Calendar,
  Inbox,
  Image as ImageIcon,
  Settings,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Lock,
  Copy,
  Ban,
  Download,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Check,
  XCircle,
  Edit3,
  MessageCircle,
  Users,
  Clock,
  MapPin,
  Mail,
  Send,
  Upload,
  ArrowUp,
  ArrowDown,
  X,
  RefreshCw,
  Sparkles,
} from "lucide-react";

const ADMIN_MONTH_NAMES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const ADMIN_WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const FISHING_MODALITIES: ExperienceModality[] = [
  "Pesca en balsa",
  "Pesca de vadeo",
  "Salida personalizada",
];

function getTodayArgentina(): string {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Argentina/Buenos_Aires",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    const now = new Date(Date.now() - 3 * 60 * 60 * 1000);
    return now.toISOString().split("T")[0];
  }
}

function formatReadableDate(dateStr: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split("-").map(Number);
  return `${d} de ${ADMIN_MONTH_NAMES[m - 1] || ""} ${y}`;
}

function buildWaUrl(phone: string, text: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "#";
  const formatted = digits.startsWith("54") ? digits : `549${digits}`;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

/**
 * Optimiza y redimensiona una imagen en el navegador usando Canvas
 * para mantener carga rápida y evitar archivos pesados.
 */
function optimizeImageFile(
  file: File,
  maxDimension = 1400,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!validTypes.includes(file.type.toLowerCase())) {
      reject(
        new Error(
          `El archivo "${file.name}" no tiene un formato válido. Usá fotos JPG, PNG o WebP.`
        )
      );
      return;
    }
    const maxBytes = 15 * 1024 * 1024; // 15 MB original
    if (file.size > maxBytes) {
      reject(
        new Error(
          `La imagen "${file.name}" supera los 15 MB. Elegí una imagen más liviana.`
        )
      );
      return;
    }

    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error(`No se pudo leer el archivo "${file.name}".`));
    reader.onload = () => {
      const img = new window.Image();
      img.onerror = () =>
        reject(new Error(`No se pudo procesar la imagen "${file.name}".`));
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w >= h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const out = canvas.toDataURL("image/jpeg", quality);
          resolve(out);
        } else if (typeof reader.result === "string") {
          resolve(reader.result);
        } else {
          reject(new Error("Error comprimiendo imagen."));
        }
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  });
}

interface SmartDepartureDefaults {
  destination: string;
  experienceType: ExperienceModality;
  startTime: string;
  endTime: string;
  maxParticipants: number;
}

const DEFAULT_SMART_VALUES: SmartDepartureDefaults = {
  destination: "Río Chimehuín",
  experienceType: "Pesca en balsa",
  startTime: "08:00",
  endTime: "17:30",
  maxParticipants: 2,
};

export default function AdminDashboardPage() {
  const [store, setStore] = useState<TraumStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Navegación principal (4 secciones claras)
  const [activeTab, setActiveTab] = useState<
    "calendario" | "solicitudes" | "galeria" | "ajustes"
  >("calendario");

  // Notificaciones visibles (éxito / error)
  const [bannerMsg, setBannerMsg] = useState<{
    type: "ok" | "err";
    text: string;
  } | null>(null);
  const [busyAction, setBusyAction] = useState(false);

  // Estado del calendario principal
  const [todayAR, setTodayAR] = useState("2026-11-06");
  const [calYear, setCalYear] = useState(2026);
  const [calMonth, setCalMonth] = useState(10); // 0-indexed (10 = Noviembre)
  const [departureFilter, setDepartureFilter] = useState<
    "proximas" | "todas" | "canceladas"
  >("proximas");

  // Modal de Día / Crear o Editar o Duplicar Salida (2 clics)
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit" | "duplicate">(
    "create"
  );
  const [editingDepartureId, setEditingDepartureId] = useState<string | null>(
    null
  );
  const [modalDate, setModalDate] = useState("2026-11-12");
  const [modalRiver, setModalRiver] = useState("Río Chimehuín");
  const [modalType, setModalType] =
    useState<ExperienceModality>("Pesca en balsa");
  const [modalStart, setModalStart] = useState("08:00");
  const [modalEnd, setModalEnd] = useState("17:30");
  const [modalSpots, setModalSpots] = useState(2);
  const [modalNotes, setModalNotes] = useState("");
  const [modalRepeatMode, setModalRepeatMode] = useState<
    "none" | "daily" | "weekly"
  >("none");
  const [modalRepeatCount, setModalRepeatCount] = useState(2);

  // Salidas con lista de anotados desplegada
  const [expandedDepId, setExpandedDepId] = useState<string | null>(null);

  // Formulario rápido para anotar pescador manualmente
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualCount, setManualCount] = useState(1);

  // Solicitudes: proponer otra fecha inline en la misma tarjeta
  const [proposingDateReqId, setProposingDateReqId] = useState<string | null>(
    null
  );
  const [proposedDateVal, setProposedDateVal] = useState("");
  const [proposedNoteVal, setProposedNoteVal] = useState("");

  // Modal para Limpiar Historial de Solicitudes
  const [clearHistoryModalOpen, setClearHistoryModalOpen] = useState(false);
  const [clearMode, setClearMode] = useState<"resolved" | "all">("resolved");
  const [confirmDeletePending, setConfirmDeletePending] = useState(false);

  // Galería de fotos
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newGalleryCaption, setNewGalleryCaption] = useState("");
  const [editingCaptions, setEditingCaptions] = useState<
    Record<string, string>
  >({});

  // Prueba de correo electrónico
  const [testingEmail, setTestingEmail] = useState(false);
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testEmailResult, setTestEmailResult] = useState<{
    sent: boolean;
    channel: string;
    errorDetails?: string;
  } | null>(null);

  const showToast = (text: string, type: "ok" | "err" = "ok") => {
    setBannerMsg({ text, type });
    setTimeout(() => {
      setBannerMsg((prev) => (prev?.text === text ? null : prev));
    }, 6000);
  };

  const broadcastUpdate = () => {
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel("traum_live_sync");
        bc.postMessage({ updatedAt: Date.now() });
        bc.close();
      } catch {
        // ignore
      }
    }
  };

  // Cargar store y valores inteligentes por defecto
  useEffect(() => {
    const ar = getTodayArgentina();
    setTodayAR(ar);
    const [y, m] = ar.split("-").map(Number);
    if (y && m) {
      setCalYear(y);
      setCalMonth(m - 1);
    }

    fetch("/api/traum", { cache: "no-store" })
      .then((r) => r.json())
      .then((data: TraumStoreData) => {
        setStore(data);
        setTestEmailRecipient(
          data.settings?.notificationEmail ||
            data.settings?.email ||
            "traumflyfishing9@gmail.com"
        );
        const initialCaps: Record<string, string> = {};
        for (const g of data.gallery || []) {
          initialCaps[g.id] = g.caption || "";
        }
        setEditingCaptions(initialCaps);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const getSmartDefaults = (): SmartDepartureDefaults => {
    if (typeof window === "undefined") return DEFAULT_SMART_VALUES;
    try {
      const saved = window.localStorage.getItem(
        "traum_last_departure_defaults"
      );
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          destination: parsed.destination || DEFAULT_SMART_VALUES.destination,
          experienceType:
            parsed.experienceType || DEFAULT_SMART_VALUES.experienceType,
          startTime: parsed.startTime || DEFAULT_SMART_VALUES.startTime,
          endTime: parsed.endTime || DEFAULT_SMART_VALUES.endTime,
          maxParticipants:
            Number(parsed.maxParticipants) ||
            DEFAULT_SMART_VALUES.maxParticipants,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_SMART_VALUES;
  };

  const saveSmartDefaults = (vals: SmartDepartureDefaults) => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        "traum_last_departure_defaults",
        JSON.stringify(vals)
      );
    } catch {
      // ignore
    }
  };

  const runAdminAction = async (
    payload: Record<string, unknown>,
    successMsg?: string
  ) => {
    setBusyAction(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "No se pudo completar la acción.", "err");
        return { ok: false, data };
      }
      if (data.store) {
        setStore(data.store);
      }
      broadcastUpdate();
      if (successMsg) {
        showToast(successMsg, "ok");
      }
      return { ok: true, data };
    } catch {
      showToast("Error de conexión con el servidor.", "err");
      return { ok: false, data: null };
    } finally {
      setBusyAction(false);
    }
  };

  const handleSaveFullStore = async (customSuccess?: string) => {
    if (!store) return;
    setBusyAction(true);
    try {
      const res = await fetch("/api/traum", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(store),
      });
      if (!res.ok) throw new Error("Error guardando");
      const saved: TraumStoreData = await res.json();
      setStore(saved);
      broadcastUpdate();
      showToast(customSuccess || "Cambios guardados correctamente.", "ok");
    } catch {
      showToast("No se pudieron guardar los cambios.", "err");
    } finally {
      setBusyAction(false);
    }
  };

  // Listado de todos los ríos y lagos disponibles (los 12 de Neuquén + personalizados)
  const riverList = useMemo(() => {
    const names = new Set<string>();
    for (const d of store?.destinations || []) {
      if (d.name) names.add(d.name);
    }
    for (const dep of store?.departures || []) {
      if (dep.destination) names.add(dep.destination);
    }
    return Array.from(names);
  }, [store?.destinations, store?.departures]);

  // KPIs para el resumen superior
  const summaryStats = useMemo(() => {
    if (!store) {
      return {
        pendingRequestsCount: 0,
        upcomingDeparturesCount: 0,
        todayEnrolledPeopleCount: 0,
      };
    }
    const pendingRequestsCount = (store.customRequests || []).filter(
      (r) => r.status === "pendiente"
    ).length;

    const upcomingDeparturesCount = (store.departures || []).filter(
      (d) => d.status !== "cancelada" && d.date >= todayAR
    ).length;

    const todayDepartureIds = new Set(
      (store.departures || [])
        .filter((d) => d.status !== "cancelada" && d.date === todayAR)
        .map((d) => d.id)
    );
    const todayEnrolledPeopleCount = (store.enrollments || [])
      .filter(
        (e) =>
          todayDepartureIds.has(e.departureId) && e.status === "confirmada"
      )
      .reduce((acc, e) => acc + (Number(e.participantsCount) || 1), 0);

    return {
      pendingRequestsCount,
      upcomingDeparturesCount,
      todayEnrolledPeopleCount,
    };
  }, [store, todayAR]);

  // Celdas del calendario mensual
  const calendarCells = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1);
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const startOffset = (firstDay.getDay() + 6) % 7; // Lunes = 0
    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calMonth + 1).padStart(2, "0");
      const dStr = String(d).padStart(2, "0");
      cells.push({ day: d, dateStr: `${calYear}-${mStr}-${dStr}` });
    }
    return cells;
  }, [calYear, calMonth]);

  // Salidas filtradas para mostrar debajo del calendario
  const visibleDepartures = useMemo(() => {
    if (!store) return [];
    const list = [...(store.departures || [])].sort((a, b) =>
      a.date.localeCompare(b.date)
    );
    if (departureFilter === "proximas") {
      return list.filter(
        (d) => d.status !== "cancelada" && d.date >= todayAR
      );
    }
    if (departureFilter === "canceladas") {
      return list.filter((d) => d.status === "cancelada");
    }
    return list;
  }, [store, departureFilter, todayAR]);

  // =========================================================================
  // ACCIONES EN 2 CLICS: ABRIR MODAL DE DÍA / CREAR / EDITAR / DUPLICAR
  // =========================================================================
  const openCreateModalForDate = (dateStr: string) => {
    const smart = getSmartDefaults();
    setModalMode("create");
    setEditingDepartureId(null);
    setModalDate(dateStr);
    setModalRiver(smart.destination);
    setModalType(smart.experienceType);
    setModalStart(smart.startTime);
    setModalEnd(smart.endTime);
    setModalSpots(smart.maxParticipants);
    setModalNotes("");
    setModalRepeatMode("none");
    setModalRepeatCount(2);
    setDayModalOpen(true);
  };

  const openEditModalForDeparture = (dep: CalendarDeparture) => {
    setModalMode("edit");
    setEditingDepartureId(dep.id);
    setModalDate(dep.date);
    setModalRiver(dep.destination);
    setModalType(dep.experienceType);
    setModalStart(dep.startTime || "08:00");
    setModalEnd(dep.endTime || "17:30");
    setModalSpots(dep.maxParticipants);
    setModalNotes(dep.additionalInfo || "");
    setModalRepeatMode("none");
    setDayModalOpen(true);
  };

  const openDuplicateModalForDeparture = (dep: CalendarDeparture) => {
    setModalMode("duplicate");
    setEditingDepartureId(dep.id);
    setModalDate(dep.date);
    setModalRiver(dep.destination);
    setModalType(dep.experienceType);
    setModalStart(dep.startTime || "08:00");
    setModalEnd(dep.endTime || "17:30");
    setModalSpots(dep.maxParticipants);
    setModalNotes(dep.additionalInfo || "");
    setModalRepeatMode("none");
    setDayModalOpen(true);
  };

  const handleSaveDepartureFromModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalDate || !modalRiver.trim()) {
      showToast("Elegí una fecha y un río o lago.", "err");
      return;
    }

    // Guardar como valores por defecto inteligentes para la próxima vez
    saveSmartDefaults({
      destination: modalRiver.trim(),
      experienceType: modalType,
      startTime: modalStart,
      endTime: modalEnd,
      maxParticipants: modalSpots,
    });

    if (modalMode === "edit" && editingDepartureId) {
      const res = await runAdminAction(
        {
          type: "MANAGE_DEPARTURE",
          subAction: "UPDATE",
          departureId: editingDepartureId,
          date: modalDate,
          startTime: modalStart,
          endTime: modalEnd,
          destination: modalRiver.trim(),
          experienceType: modalType,
          maxParticipants: modalSpots,
          additionalInfo: modalNotes.trim(),
        },
        "Salida actualizada con éxito."
      );
      if (res.ok) setDayModalOpen(false);
      return;
    }

    const res = await runAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: modalMode === "duplicate" ? "DUPLICATE" : "CREATE",
        date: modalDate,
        startTime: modalStart,
        endTime: modalEnd,
        destination: modalRiver.trim(),
        experienceType: modalType,
        maxParticipants: modalSpots,
        additionalInfo: modalNotes.trim(),
        repeatMode: modalRepeatMode,
        repeatCount: modalRepeatCount,
      },
      modalMode === "duplicate"
        ? `Salida duplicada para el ${formatReadableDate(modalDate)}.`
        : `Salida creada para el ${formatReadableDate(modalDate)}.`
    );
    if (res.ok) {
      setDayModalOpen(false);
    }
  };

  const handleCancelDeparture = async (dep: CalendarDeparture) => {
    const enrolledCount = (store?.enrollments || []).filter(
      (e) => e.departureId === dep.id && e.status !== "cancelada"
    ).length;
    const confirmText =
      enrolledCount > 0
        ? `¿Seguro que querés cancelar la salida del ${formatReadableDate(
            dep.date
          )} en ${
            dep.destination
          }? Se notificará automáticamente a los ${enrolledCount} anotado(s).`
        : `¿Seguro que querés cancelar la salida del ${formatReadableDate(
            dep.date
          )} en ${dep.destination}?`;

    if (!window.confirm(confirmText)) return;

    await runAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "CANCEL",
        departureId: dep.id,
        reason:
          "Cancelación informada por el guía (condiciones climáticas o del río).",
      },
      "Salida cancelada y notificaciones enviadas."
    );
  };

  const handleDeleteDeparturePermanently = async (dep: CalendarDeparture) => {
    if (
      !window.confirm(
        `¿Eliminar definitivamente del registro la salida del ${formatReadableDate(
          dep.date
        )} (${dep.destination})?`
      )
    ) {
      return;
    }
    await runAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "DELETE",
        departureId: dep.id,
      },
      "Salida eliminada del calendario."
    );
  };

  const exportDepartureEnrollmentsCsv = (dep: CalendarDeparture) => {
    if (!store) return;
    const list = (store.enrollments || []).filter(
      (e) => e.departureId === dep.id
    );
    const header = [
      "Codigo",
      "Estado",
      "Nombre",
      "Telefono_WhatsApp",
      "Email",
      "Cantidad_Personas",
      "Comentarios",
      "Fecha_Salida",
      "Rio",
    ];
    const rows = list.map((e) =>
      [
        e.bookingCode,
        e.status,
        `"${(e.fullName || "").replace(/"/g, '""')}"`,
        `"${(e.whatsapp || "").replace(/"/g, '""')}"`,
        `"${(e.email || "").replace(/"/g, '""')}"`,
        e.participantsCount,
        `"${(e.comments || "").replace(/"/g, '""')}"`,
        dep.date,
        `"${dep.destination.replace(/"/g, '""')}"`,
      ].join(",")
    );
    const csvContent = "\uFEFF" + [header.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `anotados-${dep.date}-${dep.destination
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // =========================================================================
  // LIMPIAR HISTORIAL DE SOLICITUDES
  // =========================================================================
  const handleConfirmClearHistory = async () => {
    if (!store) return;
    const pendingCount = (store.customRequests || []).filter(
      (r) => r.status === "pendiente"
    ).length;

    if (clearMode === "all" && pendingCount > 0 && !confirmDeletePending) {
      showToast(
        "Marcá la casilla de confirmación para borrar también las solicitudes pendientes.",
        "err"
      );
      return;
    }

    const res = await runAdminAction({
      type: "CLEAR_REQUESTS_HISTORY",
      mode: clearMode,
      confirmPending: confirmDeletePending,
    });

    if (res.ok && res.data) {
      const count = Number(res.data.deletedCount) || 0;
      setClearHistoryModalOpen(false);
      setConfirmDeletePending(false);
      showToast(
        count === 1
          ? "Se eliminó 1 solicitud del historial."
          : `Se eliminaron ${count} solicitudes del historial.`,
        "ok"
      );
    }
  };

  // =========================================================================
  // GALERÍA: SUBIDA MÚLTIPLE + OPTIMIZACIÓN AUTOMÁTICA
  // =========================================================================
  const handleGalleryFilesSelected = async (
    files: FileList | File[] | null
  ) => {
    if (!files || files.length === 0) return;
    setUploadingGallery(true);
    try {
      const fileArray = Array.from(files);
      const optimizedItems: Array<{ imageUrl: string; caption?: string }> = [];

      for (const file of fileArray) {
        const dataUrl = await optimizeImageFile(file, 1400, 0.82);
        optimizedItems.push({
          imageUrl: dataUrl,
          caption: newGalleryCaption.trim() || undefined,
        });
      }

      const res = await runAdminAction(
        {
          type: "MANAGE_GALLERY",
          subAction: "ADD",
          items: optimizedItems,
        },
        optimizedItems.length === 1
          ? "Se subió y optimizó 1 foto en la galería."
          : `Se subieron y optimizaron ${optimizedItems.length} fotos en la galería.`
      );

      if (res.ok && res.data?.store) {
        setNewGalleryCaption("");
        const nextCaps: Record<string, string> = {};
        for (const g of res.data.store.gallery || []) {
          nextCaps[g.id] = g.caption || "";
        }
        setEditingCaptions(nextCaps);
      }
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : "No se pudieron procesar las imágenes seleccionadas.",
        "err"
      );
    } finally {
      setUploadingGallery(false);
    }
  };

  // =========================================================================
  // GUARDAR Y VERIFICAR CORREO DIRECTO / ENVIAR MAIL DE PRUEBA
  // =========================================================================
  const handleSaveAndVerifyEmailSettings = async () => {
    if (!store) return;
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SAVE_AND_VERIFY_EMAIL_SETTINGS",
          notificationEmail: store.settings.notificationEmail,
          smtpUser: store.settings.smtpUser,
          smtpAppPassword: store.settings.smtpAppPassword,
        }),
      });
      const data = await res.json();
      if (data.store) setStore(data.store);
      setTestEmailResult({
        sent: Boolean(data.verified),
        channel: data.senderEmail || "directo_gmail",
        errorDetails: data.errorDetails ? String(data.errorDetails) : undefined,
      });
      if (data.verified) {
        showToast("Configuración guardada y conexión con Gmail verificada.", "ok");
      } else {
        showToast(
          data.errorDetails ||
            "Se guardó el correo, pero falta verificar la clave de 16 letras del emisor.",
          "err"
        );
      }
    } catch {
      showToast("Error al guardar y verificar el correo.", "err");
    } finally {
      setTestingEmail(false);
    }
  };

  const handleSendTestEmail = async () => {
    if (!store) return;
    setTestingEmail(true);
    setTestEmailResult(null);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SEND_TEST_EMAIL",
          recipientEmail:
            testEmailRecipient.trim() ||
            store.settings.notificationEmail ||
            store.settings.email,
          notificationEmail: store.settings.notificationEmail,
          smtpUser: store.settings.smtpUser,
          smtpAppPassword: store.settings.smtpAppPassword,
        }),
      });
      const data = await res.json();
      if (data.store) setStore(data.store);
      setTestEmailResult({
        sent: Boolean(data.sent),
        channel: String(data.channel || ""),
        errorDetails: data.errorDetails ? String(data.errorDetails) : undefined,
      });
      if (data.sent) {
        showToast(
          "Correo de prueba enviado de forma directa. Revisá la bandeja de entrada.",
          "ok"
        );
      } else {
        showToast(
          data.errorDetails ||
            "No se pudo enviar el correo de prueba. Revisá el emisor y su clave de 16 letras.",
          "err"
        );
      }
    } catch {
      showToast("Error al intentar enviar el correo de prueba.", "err");
    } finally {
      setTestingEmail(false);
    }
  };

  if (loading || !store) {
    return (
      <div className="min-h-screen bg-[#263D32] text-[#F2EFE6] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#D8CEB9] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs uppercase tracking-[0.25em] text-[#D8CEB9]">
            Cargando Panel del Guía...
          </p>
        </div>
      </div>
    );
  }

  // Pantalla de acceso con PIN
  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#263D32] text-[#F2EFE6] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-[#292D29] border border-[#65745A]/40 p-8 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-[#65745A]/20 border border-[#D8CEB9]/30 flex items-center justify-center mb-5">
            <Lock className="w-5 h-5 text-[#D8CEB9]" />
          </div>
          <span className="text-xs uppercase tracking-[0.28em] text-[#D8CEB9] block mb-1">
            TRAUM · Fly Cast Patagonia
          </span>
          <h1 className="font-serif text-3xl text-[#F2EFE6] mb-3">
            Panel del Guía
          </h1>
          <p className="text-sm text-[#D8CEB9]/85 mb-6">
            Ingresá tu clave para administrar salidas, solicitudes y galería.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (pinInput === (store.settings.adminPin || "traum2026")) {
                setUnlocked(true);
                setPinError(false);
              } else {
                setPinError(true);
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs uppercase tracking-wider text-[#D8CEB9] mb-2">
                Clave de acceso
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresá tu clave..."
                className="w-full px-4 py-3.5 bg-[#263D32] border border-[#899487]/40 text-[#F2EFE6] text-base focus:outline-none focus:border-[#D8CEB9]"
              />
              {pinError && (
                <p className="text-xs text-red-300 mt-2">
                  Clave incorrecta. (Por defecto: <strong>traum2026</strong>)
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-bold transition-colors cursor-pointer"
            >
              Entrar al Panel
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-[#899487]/20 flex justify-between items-center text-xs text-[#899487]">
            <Link
              href="/"
              className="hover:text-[#F2EFE6] flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Volver a la web</span>
            </Link>
            <span>PIN: {store.settings.adminPin || "traum2026"}</span>
          </div>
        </div>
      </div>
    );
  }

  const allRequests = store.customRequests || [];
  const pendingRequests = allRequests.filter((r) => r.status === "pendiente");
  const resolvedRequests = allRequests.filter((r) => r.status !== "pendiente");
  const sortedGallery = [...(store.gallery || [])].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );
  const modalDateIsBlocked = (store.blockedDays || []).some(
    (b) => b.date === modalDate
  );
  const modalDateDepartures = (store.departures || []).filter(
    (d) => d.date === modalDate && d.status !== "cancelada"
  );

  return (
    <div className="min-h-screen bg-[#F2EFE6] text-[#292D29] pb-20">
      {/* BARRA SUPERIOR SIMPLE Y MÓVIL-FIRST */}
      <header className="bg-[#263D32] text-[#F2EFE6] sticky top-0 z-40 shadow-md border-b border-[#65745A]/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 bg-[#1D2E26] hover:bg-[#3A4E3C] rounded text-[#D8CEB9] hover:text-white transition-colors"
              title="Ver página web pública"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <span className="font-serif text-lg sm:text-xl tracking-widest uppercase block leading-none">
                TRAUM · Panel del Guía
              </span>
              <span className="text-[11px] text-[#D8CEB9] block mt-0.5">
                Gestión rápida en 2 clics
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                openCreateModalForDate(todayAR);
              }}
              className="px-3.5 py-2 bg-[#D8CEB9] text-[#263D32] hover:bg-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 rounded-sm shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva salida</span>
            </button>
          </div>
        </div>
      </header>

      {/* AVISO FLOTANTE DE ÉXITO O ERROR */}
      {bannerMsg && (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 mt-4">
          <div
            className={`p-4 border flex items-center justify-between gap-3 shadow-sm ${
              bannerMsg.type === "ok"
                ? "bg-[#263D32] text-[#F2EFE6] border-[#65745A]"
                : "bg-red-900 text-white border-red-700"
            }`}
          >
            <div className="flex items-center gap-2.5 text-sm font-medium">
              {bannerMsg.type === "ok" ? (
                <CheckCircle2 className="w-5 h-5 text-[#D8CEB9] flex-shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-red-200 flex-shrink-0" />
              )}
              <span>{bannerMsg.text}</span>
            </div>
            <button
              type="button"
              onClick={() => setBannerMsg(null)}
              className="text-xs uppercase tracking-wider opacity-80 hover:opacity-100"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* 1. RESUMEN ARRIBA (SOLICITUDES PENDIENTES, PRÓXIMAS SALIDAS, ANOTADOS DE HOY) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("solicitudes")}
            className={`p-4 sm:p-5 text-left border transition-all cursor-pointer flex items-center justify-between ${
              summaryStats.pendingRequestsCount > 0
                ? "bg-amber-50 border-amber-400 hover:bg-amber-100/70"
                : "bg-white border-[#D8CEB9] hover:border-[#263D32]"
            }`}
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-[#746657] font-semibold block">
                Solicitudes pendientes
              </span>
              <span className="font-serif text-3xl sm:text-4xl text-[#263D32] font-bold mt-1 block">
                {summaryStats.pendingRequestsCount}
              </span>
              <span className="text-xs text-[#65745A] mt-1 block">
                {summaryStats.pendingRequestsCount > 0
                  ? "Tocar para responder ahora →"
                  : "Todo al día"}
              </span>
            </div>
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${
                summaryStats.pendingRequestsCount > 0
                  ? "bg-amber-500 text-white"
                  : "bg-[#F2EFE6] text-[#263D32]"
              }`}
            >
              <Inbox className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab("calendario");
              setDepartureFilter("proximas");
            }}
            className="p-4 sm:p-5 text-left bg-white border border-[#D8CEB9] hover:border-[#263D32] transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-[#746657] font-semibold block">
                Próximas salidas
              </span>
              <span className="font-serif text-3xl sm:text-4xl text-[#263D32] font-bold mt-1 block">
                {summaryStats.upcomingDeparturesCount}
              </span>
              <span className="text-xs text-[#65745A] mt-1 block">
                Salidas programadas activas
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#F2EFE6] text-[#263D32] flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("calendario")}
            className="p-4 sm:p-5 text-left bg-white border border-[#D8CEB9] hover:border-[#263D32] transition-all cursor-pointer flex items-center justify-between"
          >
            <div>
              <span className="text-xs uppercase tracking-wider text-[#746657] font-semibold block">
                Anotados de hoy ({todayAR.slice(5)})
              </span>
              <span className="font-serif text-3xl sm:text-4xl text-[#263D32] font-bold mt-1 block">
                {summaryStats.todayEnrolledPeopleCount}
              </span>
              <span className="text-xs text-[#65745A] mt-1 block">
                Pescadores confirmados hoy
              </span>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#F2EFE6] text-[#263D32] flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </button>
        </div>

        {/* BARRA DE PESTAÑAS GRANDES Y CLARAS (4 SECCIONES) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#E5DEC9] p-1.5 border border-[#D8CEB9]">
          <button
            type="button"
            onClick={() => setActiveTab("calendario")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === "calendario"
                ? "bg-[#263D32] text-[#F2EFE6] shadow-sm"
                : "bg-transparent text-[#292D29] hover:bg-white/60"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>1. Calendario y Salidas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("solicitudes")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === "solicitudes"
                ? "bg-[#263D32] text-[#F2EFE6] shadow-sm"
                : "bg-transparent text-[#292D29] hover:bg-white/60"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>2. Solicitudes ({allRequests.length})</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.5 text-[11px] bg-amber-500 text-white rounded-full">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("galeria")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === "galeria"
                ? "bg-[#263D32] text-[#F2EFE6] shadow-sm"
                : "bg-transparent text-[#292D29] hover:bg-white/60"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>3. Galería ({sortedGallery.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ajustes")}
            className={`py-3 px-3 text-xs sm:text-sm font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors cursor-pointer ${
              activeTab === "ajustes"
                ? "bg-[#263D32] text-[#F2EFE6] shadow-sm"
                : "bg-transparent text-[#292D29] hover:bg-white/60"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>4. Correo y Ajustes</span>
          </button>
        </div>

        {/* ================================================================= */}
        {/* PESTAÑA 1: CALENDARIO GRANDE + SALIDAS CON ACCIONES VISIBLES      */}
        {/* ================================================================= */}
        {activeTab === "calendario" && (
          <div className="space-y-8">
            {/* CALENDARIO GRANDE: TOCAR UN DÍA ABRE EL MODAL DE CREACIÓN RÁPIDA */}
            <div className="bg-white border border-[#D8CEB9] p-4 sm:p-6 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#D8CEB9]">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#263D32]">
                    Calendario de Salidas
                  </h2>
                  <p className="text-xs sm:text-sm text-[#746657] mt-0.5">
                    <strong>Regla de 2 clics:</strong> Tocá cualquier día del
                    calendario para crear una salida o bloquear la fecha.
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 0) {
                        setCalMonth(11);
                        setCalYear((y) => y - 1);
                      } else {
                        setCalMonth((m) => m - 1);
                      }
                    }}
                    className="p-2.5 border border-[#D8CEB9] hover:bg-[#F2EFE6] cursor-pointer"
                    aria-label="Mes anterior"
                  >
                    <ChevronLeft className="w-5 h-5 text-[#263D32]" />
                  </button>
                  <span className="font-serif text-lg sm:text-xl text-[#263D32] min-w-[165px] text-center font-bold">
                    {ADMIN_MONTH_NAMES[calMonth]} {calYear}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (calMonth === 11) {
                        setCalMonth(0);
                        setCalYear((y) => y + 1);
                      } else {
                        setCalMonth((m) => m + 1);
                      }
                    }}
                    className="p-2.5 border border-[#D8CEB9] hover:bg-[#F2EFE6] cursor-pointer"
                    aria-label="Mes siguiente"
                  >
                    <ChevronRight className="w-5 h-5 text-[#263D32]" />
                  </button>
                </div>
              </div>

              {/* Encabezado de días */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
                {ADMIN_WEEKDAYS.map((wd) => (
                  <div
                    key={wd}
                    className="text-[11px] font-bold uppercase tracking-wider text-[#746657] py-1"
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Grilla de días */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {calendarCells.map((cell, idx) => {
                  if (!cell.day || !cell.dateStr) {
                    return (
                      <div
                        key={`empty-${idx}`}
                        className="min-h-[76px] sm:min-h-[104px] bg-[#F2EFE6]/40 border border-transparent"
                      />
                    );
                  }
                  const dStr = cell.dateStr;
                  const isToday = dStr === todayAR;
                  const isBlocked = (store.blockedDays || []).some(
                    (b) => b.date === dStr
                  );
                  const dayDeps = (store.departures || []).filter(
                    (d) => d.date === dStr && d.status !== "cancelada"
                  );
                  const dayReqs = (store.customRequests || []).filter(
                    (r) =>
                      (r.desiredDate === dStr || r.alternativeDate === dStr) &&
                      r.status === "pendiente"
                  );

                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => openCreateModalForDate(dStr)}
                      className={`min-h-[76px] sm:min-h-[104px] p-1.5 sm:p-2.5 border text-left flex flex-col justify-between transition-all cursor-pointer group ${
                        isBlocked
                          ? "bg-stone-200/80 border-stone-400 text-stone-600"
                          : dayDeps.length > 0
                          ? "bg-[#263D32]/10 border-[#263D32] hover:bg-[#263D32]/15"
                          : dayReqs.length > 0
                          ? "bg-amber-50 border-amber-400 hover:bg-amber-100"
                          : "bg-white border-[#D8CEB9] hover:border-[#263D32] hover:bg-[#F2EFE6]/60"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span
                          className={`text-xs sm:text-sm font-bold ${
                            isToday
                              ? "bg-[#263D32] text-white px-1.5 py-0.5 rounded-sm"
                              : "text-[#292D29]"
                          }`}
                        >
                          {cell.day}
                        </span>
                        <span className="text-[10px] text-[#65745A] opacity-0 group-hover:opacity-100 font-semibold hidden sm:inline">
                          + Crear
                        </span>
                      </div>

                      <div className="space-y-1 w-full mt-1">
                        {isBlocked && (
                          <span className="block text-[10px] bg-stone-600 text-white px-1.5 py-0.5 rounded-sm truncate font-medium">
                            Bloqueado
                          </span>
                        )}
                        {dayDeps.map((dep) => {
                          const enrolledPeople = (store.enrollments || [])
                            .filter(
                              (e) =>
                                e.departureId === dep.id &&
                                e.status === "confirmada"
                            )
                            .reduce(
                              (acc, e) =>
                                acc + (Number(e.participantsCount) || 1),
                              0
                            );
                          return (
                            <div
                              key={dep.id}
                              className="text-[10px] sm:text-[11px] bg-[#263D32] text-[#F2EFE6] px-1.5 py-0.5 rounded-sm truncate font-medium"
                              title={`${dep.destination} (${enrolledPeople}/${dep.maxParticipants} anotados)`}
                            >
                              {dep.destination.replace(/^Río\s+/i, "")} (
                              {enrolledPeople}/{dep.maxParticipants})
                            </div>
                          );
                        })}
                        {dayReqs.length > 0 && (
                          <div className="text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-sm truncate font-semibold">
                            {dayReqs.length} pedido(s)
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* LISTADO DE SALIDAS CON ACCIONES RÁPIDAS VISIBLES */}
            <div className="bg-white border border-[#D8CEB9] p-4 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8CEB9] pb-4">
                <div>
                  <h3 className="font-serif text-2xl text-[#263D32]">
                    Salidas Programadas
                  </h3>
                  <p className="text-xs text-[#746657]">
                    Todas las acciones están visibles en cada tarjeta (Editar,
                    Duplicar, Cancelar, Ver anotados).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(
                    [
                      { id: "proximas", label: "Próximas activas" },
                      { id: "todas", label: "Todas" },
                      { id: "canceladas", label: "Canceladas" },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setDepartureFilter(f.id)}
                      className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider border cursor-pointer ${
                        departureFilter === f.id
                          ? "bg-[#263D32] text-white border-[#263D32]"
                          : "bg-[#F2EFE6] text-[#292D29] border-[#D8CEB9]"
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {visibleDepartures.length === 0 ? (
                <div className="p-8 text-center bg-[#F2EFE6]/60 border border-[#D8CEB9]">
                  <p className="text-sm text-[#746657] mb-3">
                    No hay salidas en esta vista. Tocá cualquier día del
                    calendario arriba para crear una salida en 2 clics.
                  </p>
                  <button
                    type="button"
                    onClick={() => openCreateModalForDate(todayAR)}
                    className="px-4 py-2.5 bg-[#263D32] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                  >
                    + Crear salida ahora
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {visibleDepartures.map((dep) => {
                    const depEnrollments = (store.enrollments || []).filter(
                      (e) => e.departureId === dep.id
                    );
                    const activeEnrollments = depEnrollments.filter(
                      (e) => e.status !== "cancelada"
                    );
                    const confirmedPeople = depEnrollments
                      .filter((e) => e.status === "confirmada")
                      .reduce(
                        (acc, e) => acc + (Number(e.participantsCount) || 1),
                        0
                      );
                    const waitlistCount = depEnrollments.filter(
                      (e) => e.status === "lista_espera"
                    ).length;
                    const isExpanded = expandedDepId === dep.id;
                    const isCancelled = dep.status === "cancelada";

                    return (
                      <div
                        key={dep.id}
                        className={`border p-4 sm:p-5 transition-all ${
                          isCancelled
                            ? "bg-stone-100 border-stone-300 opacity-80"
                            : "bg-[#FAF8F3] border-[#D8CEB9]"
                        }`}
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          {/* Datos principales de la salida */}
                          <div className="space-y-1.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                  isCancelled
                                    ? "bg-red-800 text-white"
                                    : dep.availableSpots === 0
                                    ? "bg-amber-700 text-white"
                                    : "bg-[#263D32] text-[#F2EFE6]"
                                }`}
                              >
                                {isCancelled
                                  ? "Cancelada"
                                  : dep.availableSpots === 0
                                  ? "Cupos completos"
                                  : `${dep.availableSpots} libre(s) de ${dep.maxParticipants}`}
                              </span>
                              <span className="text-xs font-bold uppercase tracking-wider text-[#65745A]">
                                {dep.experienceType}
                              </span>
                              <span className="text-xs text-[#746657] flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {dep.startTime}
                                {dep.endTime ? ` a ${dep.endTime} hs` : " hs"}
                              </span>
                            </div>

                            <h4 className="font-serif text-xl sm:text-2xl text-[#263D32] font-bold">
                              {formatReadableDate(dep.date)} · {dep.destination}
                            </h4>

                            {dep.additionalInfo && (
                              <p className="text-xs sm:text-sm text-[#746657]">
                                {dep.additionalInfo}
                              </p>
                            )}
                          </div>

                          {/* 4 ACCIONES RÁPIDAS SIEMPRE VISIBLES EN CADA SALIDA */}
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                setExpandedDepId(isExpanded ? null : dep.id)
                              }
                              className={`px-3.5 py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border cursor-pointer ${
                                isExpanded
                                  ? "bg-[#263D32] text-white border-[#263D32]"
                                  : "bg-white text-[#263D32] border-[#263D32] hover:bg-[#263D32] hover:text-white"
                              }`}
                            >
                              <Users className="w-4 h-4" />
                              <span>
                                Ver anotados ({confirmedPeople}/
                                {dep.maxParticipants}
                                {waitlistCount > 0
                                  ? ` + ${waitlistCount} espera`
                                  : ""}
                                )
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => openEditModalForDeparture(dep)}
                              className="px-3.5 py-2.5 bg-white hover:bg-[#F2EFE6] text-[#292D29] border border-[#D8CEB9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4 text-[#263D32]" />
                              <span>Editar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                openDuplicateModalForDeparture(dep)
                              }
                              className="px-3.5 py-2.5 bg-white hover:bg-[#F2EFE6] text-[#292D29] border border-[#D8CEB9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Copy className="w-4 h-4 text-[#65745A]" />
                              <span>Duplicar</span>
                            </button>

                            {!isCancelled ? (
                              <button
                                type="button"
                                onClick={() => handleCancelDeparture(dep)}
                                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              >
                                <Ban className="w-4 h-4" />
                                <span>Cancelar</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteDeparturePermanently(dep)
                                }
                                className="px-3.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span>Borrar</span>
                              </button>
                            )}
                          </div>
                        </div>

                        {/* PANEL DESPLEGABLE DE ANOTADOS DE ESTA SALIDA */}
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[#D8CEB9] space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="text-xs font-bold uppercase tracking-wider text-[#263D32]">
                                Pescadores anotados en esta salida (
                                {activeEnrollments.length})
                              </span>
                              {depEnrollments.length > 0 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    exportDepartureEnrollmentsCsv(dep)
                                  }
                                  className="px-3 py-1.5 bg-white border border-[#D8CEB9] hover:border-[#263D32] text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Descargar lista (CSV)</span>
                                </button>
                              )}
                            </div>

                            {activeEnrollments.length === 0 ? (
                              <p className="text-xs text-[#746657] italic">
                                Todavía no hay pescadores anotados en esta
                                salida. Podés anotar uno manualmente acá abajo.
                              </p>
                            ) : (
                              <div className="space-y-2">
                                {activeEnrollments.map((enr) => (
                                  <div
                                    key={enr.id}
                                    className="p-3 bg-white border border-[#D8CEB9] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                  >
                                    <div>
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`px-2 py-0.5 text-[10px] font-bold uppercase ${
                                            enr.status === "confirmada"
                                              ? "bg-[#263D32] text-white"
                                              : "bg-amber-600 text-white"
                                          }`}
                                        >
                                          {enr.status === "confirmada"
                                            ? "Confirmado"
                                            : "Lista de espera"}
                                        </span>
                                        <strong className="text-sm text-[#263D32]">
                                          {enr.fullName}
                                        </strong>
                                        <span className="text-xs text-[#746657]">
                                          ({enr.participantsCount} pers.)
                                        </span>
                                      </div>
                                      <p className="text-xs text-[#746657] mt-1">
                                        Tel: {enr.whatsapp} · Email: {enr.email}{" "}
                                        · Cód: {enr.bookingCode}
                                      </p>
                                      {enr.comments && (
                                        <p className="text-xs text-[#292D29] mt-0.5 italic">
                                          &ldquo;{enr.comments}&rdquo;
                                        </p>
                                      )}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                      <a
                                        href={buildWaUrl(
                                          enr.whatsapp,
                                          `Hola ${enr.fullName}, soy el guía de TRAUM Fly Cast Patagonia. Te escribo por tu salida del ${dep.date} en ${dep.destination}.`
                                        )}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                        <span>WhatsApp</span>
                                      </a>

                                      {enr.status === "lista_espera" && (
                                        <button
                                          type="button"
                                          onClick={() =>
                                            runAdminAction(
                                              {
                                                type: "PROMOTE_WAITLIST",
                                                enrollmentId: enr.id,
                                              },
                                              `${enr.fullName} pasó a anotación confirmada.`
                                            )
                                          }
                                          className="px-3 py-1.5 bg-[#263D32] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                                        >
                                          Confirmar cupo
                                        </button>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (
                                            window.confirm(
                                              `¿Eliminar a ${enr.fullName} de esta salida y liberar su cupo?`
                                            )
                                          ) {
                                            runAdminAction(
                                              {
                                                type: "CANCEL_ENROLLMENT",
                                                enrollmentId: enr.id,
                                                deleteRecord: true,
                                              },
                                              `Se eliminó la anotación de ${enr.fullName} y se liberó su cupo.`
                                            );
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Borrar</span>
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Agregar pescador manualmente en 1 paso */}
                            {!isCancelled && (
                              <div className="p-3 bg-[#F2EFE6] border border-[#D8CEB9]">
                                <span className="text-xs font-bold uppercase tracking-wider text-[#263D32] block mb-2">
                                  + Anotar pescador manualmente (por teléfono o
                                  WhatsApp)
                                </span>
                                <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
                                  <input
                                    type="text"
                                    placeholder="Nombre y apellido"
                                    value={manualName}
                                    onChange={(e) =>
                                      setManualName(e.target.value)
                                    }
                                    className="px-3 py-2 bg-white border border-[#D8CEB9] text-xs"
                                  />
                                  <input
                                    type="text"
                                    placeholder="Teléfono / WhatsApp"
                                    value={manualPhone}
                                    onChange={(e) =>
                                      setManualPhone(e.target.value)
                                    }
                                    className="px-3 py-2 bg-white border border-[#D8CEB9] text-xs"
                                  />
                                  <input
                                    type="email"
                                    placeholder="Email (opcional)"
                                    value={manualEmail}
                                    onChange={(e) =>
                                      setManualEmail(e.target.value)
                                    }
                                    className="px-3 py-2 bg-white border border-[#D8CEB9] text-xs"
                                  />
                                  <select
                                    value={manualCount}
                                    onChange={(e) =>
                                      setManualCount(Number(e.target.value))
                                    }
                                    className="px-3 py-2 bg-white border border-[#D8CEB9] text-xs"
                                  >
                                    {[1, 2, 3, 4, 5, 6].map((n) => (
                                      <option key={n} value={n}>
                                        {n} persona(s)
                                      </option>
                                    ))}
                                  </select>
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const res = await runAdminAction(
                                        {
                                          type: "ADD_MANUAL_ENROLLMENT",
                                          departureId: dep.id,
                                          fullName: manualName,
                                          whatsapp: manualPhone,
                                          email:
                                            manualEmail ||
                                            "cliente@traumflycast.com",
                                          participantsCount: manualCount,
                                        },
                                        "Pescador anotado en la salida."
                                      );
                                      if (res.ok) {
                                        setManualName("");
                                        setManualPhone("");
                                        setManualEmail("");
                                        setManualCount(1);
                                      }
                                    }}
                                    className="px-3 py-2 bg-[#263D32] hover:bg-[#3A4E3C] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 cursor-pointer"
                                  >
                                    <UserPlus className="w-3.5 h-3.5" />
                                    <span>Agregar</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 2: BANDEJA DE SOLICITUDES + BOTÓN LIMPIAR HISTORIAL       */}
        {/* ================================================================= */}
        {activeTab === "solicitudes" && (
          <div className="bg-white border border-[#D8CEB9] p-4 sm:p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D8CEB9] pb-4">
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl text-[#263D32]">
                  Bandeja de Solicitudes a Pedido
                </h2>
                <p className="text-xs sm:text-sm text-[#746657] mt-0.5">
                  Respondé o contactá al pescador desde la misma tarjeta con un
                  clic.
                </p>
              </div>

              {/* BOTÓN LIMPIAR HISTORIAL */}
              {allRequests.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setClearMode(
                      resolvedRequests.length > 0 ? "resolved" : "all"
                    );
                    setConfirmDeletePending(false);
                    setClearHistoryModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-stone-100 hover:bg-red-50 text-[#292D29] hover:text-red-800 border border-[#D8CEB9] hover:border-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer self-start sm:self-auto"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Limpiar historial</span>
                </button>
              )}
            </div>

            {allRequests.length === 0 ? (
              <div className="p-10 text-center bg-[#F2EFE6]/50 border border-[#D8CEB9]">
                <Inbox className="w-8 h-8 text-[#746657] mx-auto mb-2" />
                <p className="text-sm text-[#292D29] font-medium">
                  No hay solicitudes de salidas a pedido en este momento.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allRequests.map((req: CustomTripRequest) => {
                  const isPending = req.status === "pendiente";
                  const isProposing = proposingDateReqId === req.id;

                  return (
                    <div
                      key={req.id}
                      className={`p-4 sm:p-5 border transition-all ${
                        isPending
                          ? "bg-amber-50/60 border-amber-400 shadow-sm"
                          : "bg-[#FAF8F3] border-[#D8CEB9]"
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
                                req.status === "pendiente"
                                  ? "bg-amber-500 text-white"
                                  : req.status === "aceptada"
                                  ? "bg-[#263D32] text-white"
                                  : req.status === "reprogramada"
                                  ? "bg-blue-800 text-white"
                                  : "bg-stone-600 text-white"
                              }`}
                            >
                              {req.status === "pendiente"
                                ? "Pendiente de respuesta"
                                : req.status === "aceptada"
                                ? "Aceptada"
                                : req.status === "reprogramada"
                                ? `Reprogramada (${req.alternativeDate})`
                                : "Rechazada"}
                            </span>
                            <span className="text-xs font-mono text-[#746657]">
                              {req.requestCode}
                            </span>
                          </div>

                          <h3 className="font-serif text-xl sm:text-2xl text-[#263D32] font-bold">
                            {req.fullName} ·{" "}
                            {formatReadableDate(req.desiredDate)} (
                            {req.preferredSchedule})
                          </h3>

                          <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs sm:text-sm text-[#292D29]">
                            <span>
                              <strong>Pescadores:</strong>{" "}
                              {req.participantsCount} persona(s)
                            </span>
                            <span>
                              <strong>Río preferido:</strong>{" "}
                              {req.preferredRiver || "A sugerencia del guía"}
                            </span>
                            <span>
                              <strong>Tipo de pesca:</strong>{" "}
                              {req.experienceType || "A definir"}
                            </span>
                            <span>
                              <strong>WhatsApp:</strong> {req.whatsapp}
                            </span>
                            <span>
                              <strong>Email:</strong> {req.email}
                            </span>
                          </div>

                          {req.comments && (
                            <p className="text-xs sm:text-sm bg-white p-3 border border-[#D8CEB9] text-[#292D29] italic">
                              &ldquo;{req.comments}&rdquo;
                            </p>
                          )}
                        </div>

                        {/* BOTONES GRANDES EN LA MISMA TARJETA */}
                        <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() =>
                              runAdminAction(
                                {
                                  type: "RESPOND_CUSTOM_REQUEST",
                                  requestId: req.id,
                                  status: "aceptada",
                                  guideResponse:
                                    "¡Aceptamos tu solicitud! Coordinamos los detalles por WhatsApp.",
                                },
                                `Solicitud de ${req.fullName} aceptada y correo enviado.`
                              )
                            }
                            className="px-4 py-2.5 bg-[#263D32] hover:bg-[#3A4E3C] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            <span>Aceptar</span>
                          </button>

                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() => {
                              setProposingDateReqId(
                                isProposing ? null : req.id
                              );
                              setProposedDateVal(
                                req.alternativeDate || req.desiredDate
                              );
                              setProposedNoteVal(req.guideResponse || "");
                            }}
                            className="px-4 py-2.5 bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <Calendar className="w-4 h-4" />
                            <span>Proponer otra fecha</span>
                          </button>

                          <a
                            href={buildWaUrl(
                              req.whatsapp,
                              `Hola ${req.fullName}, soy el guía de TRAUM Fly Cast Patagonia. Recibí tu solicitud (${req.requestCode}) para salir a pescar el ${req.desiredDate} (${req.preferredSchedule}). Te escribo para coordinar.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>WhatsApp</span>
                          </a>

                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Rechazar la solicitud de ${req.fullName} para el ${formatReadableDate(
                                    req.desiredDate
                                  )}?`
                                )
                              ) {
                                runAdminAction(
                                  {
                                    type: "RESPOND_CUSTOM_REQUEST",
                                    requestId: req.id,
                                    status: "rechazada",
                                    guideResponse:
                                      "En esta fecha no contamos con disponibilidad operativa.",
                                  },
                                  `Solicitud de ${req.fullName} marcada como rechazada.`
                                );
                              }
                            }}
                            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Rechazar</span>
                          </button>

                          {!req.convertedToDepartureId && (
                            <button
                              type="button"
                              disabled={busyAction}
                              onClick={() =>
                                runAdminAction(
                                  {
                                    type: "CONVERT_REQUEST_TO_DEPARTURE",
                                    requestId: req.id,
                                    mode: "privada",
                                  },
                                  `Se creó la salida programada y se anotó a ${req.fullName}.`
                                )
                              }
                              className="px-3.5 py-2.5 bg-white hover:bg-[#F2EFE6] text-[#263D32] border border-[#263D32] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4" />
                              <span>Pasar al calendario</span>
                            </button>
                          )}

                          <button
                            type="button"
                            disabled={busyAction}
                            onClick={() => {
                              if (
                                window.confirm(
                                  `¿Eliminar definitivamente el pedido de ${req.fullName} (${req.requestCode})?`
                                )
                              ) {
                                runAdminAction(
                                  {
                                    type: "DELETE_CUSTOM_REQUEST",
                                    requestId: req.id,
                                  },
                                  `Se eliminó la solicitud de ${req.fullName}.`
                                );
                              }
                            }}
                            className="px-3.5 py-2.5 bg-stone-100 hover:bg-red-100 text-stone-700 hover:text-red-900 border border-[#D8CEB9] hover:border-red-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                            title="Borrar esta solicitud individualmente"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Borrar</span>
                          </button>
                        </div>
                      </div>

                      {/* CAJA RÁPIDA PARA PROPONER OTRA FECHA DESDE LA MISMA TARJETA */}
                      {isProposing && (
                        <div className="mt-4 pt-4 border-t border-amber-300 bg-white p-4 space-y-3">
                          <span className="text-xs font-bold uppercase tracking-wider text-[#263D32] block">
                            Proponer fecha alternativa a {req.fullName}
                          </span>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-[11px] uppercase text-[#746657] mb-1">
                                Nueva fecha propuesta
                              </label>
                              <input
                                type="date"
                                value={proposedDateVal}
                                onChange={(e) =>
                                  setProposedDateVal(e.target.value)
                                }
                                className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] uppercase text-[#746657] mb-1">
                                Mensaje para el cliente (opcional)
                              </label>
                              <input
                                type="text"
                                value={proposedNoteVal}
                                onChange={(e) =>
                                  setProposedNoteVal(e.target.value)
                                }
                                placeholder="Ej: El río va a estar ideal un día después..."
                                className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                const res = await runAdminAction(
                                  {
                                    type: "RESPOND_CUSTOM_REQUEST",
                                    requestId: req.id,
                                    status: "reprogramada",
                                    alternativeDate: proposedDateVal,
                                    guideResponse:
                                      proposedNoteVal ||
                                      `Te proponemos reprogramar para el ${proposedDateVal}.`,
                                  },
                                  `Propuesta de nueva fecha (${proposedDateVal}) enviada a ${req.fullName}.`
                                );
                                if (res.ok) setProposingDateReqId(null);
                              }}
                              className="px-4 py-2 bg-[#263D32] text-white text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                              Enviar propuesta por mail
                            </button>
                            <button
                              type="button"
                              onClick={() => setProposingDateReqId(null)}
                              className="px-3 py-2 text-xs text-[#746657]"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 3: GALERÍA DE FOTOS (SUBIDA MÚLTIPLE + REORDENAR + BORRAR) */}
        {/* ================================================================= */}
        {activeTab === "galeria" && (
          <div className="bg-white border border-[#D8CEB9] p-4 sm:p-6 shadow-sm space-y-6">
            <div className="border-b border-[#D8CEB9] pb-4">
              <h2 className="font-serif text-2xl sm:text-3xl text-[#263D32]">
                Galería de Fotos de la Página Principal
              </h2>
              <p className="text-xs sm:text-sm text-[#746657] mt-0.5">
                Subí una o varias fotos a la vez. El sistema las redimensiona y
                optimiza automáticamente para que la web cargue rápido.
              </p>
            </div>

            {/* ZONA DE SUBIDA DE 1 O VARIAS IMÁGENES */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleGalleryFilesSelected(e.dataTransfer.files);
                }
              }}
              className="border-2 border-dashed border-[#65745A] bg-[#F2EFE6]/70 p-6 text-center space-y-4"
            >
              <Upload className="w-8 h-8 text-[#263D32] mx-auto" />
              <div>
                <p className="text-sm font-bold text-[#263D32]">
                  Seleccioná una o varias fotos desde tu celular o computadora
                </p>
                <p className="text-xs text-[#746657] mt-1">
                  Formatos aceptados: JPG, PNG, WebP (máx. 15 MB por foto, se
                  optimizan automáticamente).
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <input
                  type="text"
                  value={newGalleryCaption}
                  onChange={(e) => setNewGalleryCaption(e.target.value)}
                  placeholder="Epígrafe corto opcional para las fotos a subir (ej: Trucha marrón en el Malleo)"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-xs sm:text-sm mb-3"
                />

                <label className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#263D32] hover:bg-[#3A4E3C] text-[#F2EFE6] text-xs font-bold uppercase tracking-wider cursor-pointer shadow-sm">
                  <Upload className="w-4 h-4" />
                  <span>
                    {uploadingGallery
                      ? "Optimizando y subiendo..."
                      : "Elegir foto(s) para subir"}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    disabled={uploadingGallery}
                    onChange={(e) => {
                      handleGalleryFilesSelected(e.target.files);
                      e.target.value = "";
                    }}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* GRILLA DE FOTOS ACTUALES EN LA GALERÍA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedGallery.map((item: GalleryImageItem, index: number) => (
                <div
                  key={item.id}
                  className="border border-[#D8CEB9] bg-[#FAF8F3] overflow-hidden flex flex-col justify-between"
                >
                  <div className="relative aspect-[4/3] bg-[#292D29]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.imageUrl}
                      alt={item.caption || `Foto ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute top-2 left-2 px-2.5 py-1 bg-[#263D32]/90 text-white text-[11px] font-bold">
                      #{index + 1}
                    </span>
                  </div>

                  <div className="p-3.5 space-y-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-wider text-[#746657] mb-1">
                        Epígrafe corto (opcional)
                      </label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={editingCaptions[item.id] ?? item.caption ?? ""}
                          onChange={(e) =>
                            setEditingCaptions((prev) => ({
                              ...prev,
                              [item.id]: e.target.value,
                            }))
                          }
                          placeholder="Sin epígrafe..."
                          className="flex-1 px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            runAdminAction(
                              {
                                type: "MANAGE_GALLERY",
                                subAction: "UPDATE_CAPTION",
                                imageId: item.id,
                                caption: editingCaptions[item.id] ?? "",
                              },
                              "Epígrafe guardado."
                            )
                          }
                          className="px-2.5 py-1.5 bg-[#263D32] text-white text-xs font-bold uppercase cursor-pointer"
                          title="Guardar epígrafe"
                        >
                          <Save className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Botones de 1 clic para cambiar orden o eliminar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#D8CEB9]">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={index === 0 || busyAction}
                          onClick={() =>
                            runAdminAction({
                              type: "MANAGE_GALLERY",
                              subAction: "REORDER",
                              imageId: item.id,
                              direction: "LEFT",
                            })
                          }
                          className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] hover:border-[#263D32] disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Mover antes"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                          <span>Subir</span>
                        </button>
                        <button
                          type="button"
                          disabled={
                            index === sortedGallery.length - 1 || busyAction
                          }
                          onClick={() =>
                            runAdminAction({
                              type: "MANAGE_GALLERY",
                              subAction: "REORDER",
                              imageId: item.id,
                              direction: "RIGHT",
                            })
                          }
                          className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] hover:border-[#263D32] disabled:opacity-40 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          title="Mover después"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                          <span>Bajar</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={busyAction}
                        onClick={() => {
                          if (
                            window.confirm(
                              "¿Seguro que querés quitar esta foto de la galería?"
                            )
                          ) {
                            runAdminAction(
                              {
                                type: "MANAGE_GALLERY",
                                subAction: "DELETE",
                                imageId: item.id,
                              },
                              "Foto eliminada de la galería."
                            );
                          }
                        }}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 text-xs font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Quitar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* PESTAÑA 4: CORREOS (CON BOTÓN DE PRUEBA) Y AJUSTES GENERALES      */}
        {/* ================================================================= */}
        {activeTab === "ajustes" && (
          <div className="space-y-6">
            {/* BLOQUE 1: CONFIGURACIÓN DIRECTA DE CORREO ELECTRÓNICO */}
            <div className="bg-white border border-[#D8CEB9] p-4 sm:p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#D8CEB9] pb-4">
                <div>
                  <h2 className="font-serif text-2xl sm:text-3xl text-[#263D32] flex items-center gap-2">
                    <Mail className="w-6 h-6 text-[#65745A]" />
                    <span>Correo de Turnos y Confirmaciones</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-[#746657] mt-0.5">
                    Cuando sacan un turno: a tu mail de abajo te llega{" "}
                    <strong>solo el mail del turno</strong>, y al cliente le
                    llega <strong>solo su confirmación</strong> a la cuenta que
                    puso en el pedido.
                  </p>
                </div>
              </div>

              {/* CASILLA RECEPTORA DEL GUÍA */}
              <div className="p-4 bg-[#FAF8F3] border border-[#D8CEB9]">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                  ¿A qué correo querés que te lleguen los turnos? (Guía)
                </label>
                <input
                  type="email"
                  value={store.settings.notificationEmail || ""}
                  onChange={(e) =>
                    setStore({
                      ...store,
                      settings: {
                        ...store.settings,
                        notificationEmail: e.target.value,
                        email: e.target.value,
                      },
                    })
                  }
                  placeholder="Ej: traumflyfishing9@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                />
                <span className="text-[11px] text-[#746657] block mt-1">
                  Podés cambiar este correo cuando quieras. Acá te llega
                  únicamente la ficha de cada turno nuevo.
                </span>
              </div>

              {/* CUENTA EMISORA DIRECTA */}
              <div className="p-4 bg-[#FAF8F3] border border-[#D8CEB9] space-y-3">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#263D32]">
                    Correo Emisor (desde donde salen los mails al guía y al cliente)
                  </h3>
                  <p className="text-[11px] text-[#746657]">
                    El correo Gmail y las 16 letras deben pertenecer a la{" "}
                    <strong>misma cuenta de Google</strong>. Se configura una
                    sola vez y nunca más se toca.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                      Gmail Emisor
                    </label>
                    <input
                      type="email"
                      value={store.settings.smtpUser || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            smtpUser: e.target.value.trim(),
                          },
                        })
                      }
                      placeholder="Ej: azpilicuetaruben@gmail.com"
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                    />
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32]">
                        Clave de Aplicación de ese mismo Gmail (16 letras)
                      </label>
                      {store.settings.smtpPasswordConfigured && (
                        <span className="px-2 py-0.5 bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider">
                          Activa y guardada
                        </span>
                      )}
                    </div>
                    <input
                      type="password"
                      value={store.settings.smtpAppPassword || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            smtpAppPassword: e.target.value,
                          },
                        })
                      }
                      placeholder={
                        store.settings.smtpPasswordConfigured
                          ? "Clave guardada en el servidor (dejalo vacío para mantenerla)"
                          : "Ej: abcd efgh ijkl mnop"
                      }
                      className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* BOTONES DE VERIFICACIÓN Y PRUEBA */}
              <div className="p-4 bg-[#F2EFE6] border border-[#D8CEB9] flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={testingEmail || busyAction}
                  onClick={handleSaveAndVerifyEmailSettings}
                  className="px-5 py-2.5 bg-[#263D32] hover:bg-[#3A4E3C] text-white text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {testingEmail
                      ? "Verificando..."
                      : "Guardar y Verificar Correo"}
                  </span>
                </button>

                <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-2">
                  <input
                    type="email"
                    value={testEmailRecipient}
                    onChange={(e) => setTestEmailRecipient(e.target.value)}
                    placeholder="Probar envío a un correo (opcional)"
                    className="px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-xs sm:text-sm flex-1"
                  />
                  <button
                    type="button"
                    disabled={testingEmail}
                    onClick={handleSendTestEmail}
                    className="px-4 py-2.5 bg-[#D8CEB9] hover:bg-[#c8bda5] text-[#263D32] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>Enviar mail de prueba</span>
                  </button>
                </div>
              </div>

              {/* Resultado inmediato */}
              {testEmailResult && (
                <div
                  className={`p-4 border text-xs sm:text-sm ${
                    testEmailResult.sent
                      ? "bg-emerald-50 border-emerald-400 text-emerald-950"
                      : "bg-red-50 border-red-400 text-red-950"
                  }`}
                >
                  <p className="font-bold">
                    {testEmailResult.sent
                      ? "✅ Conexión directa verificada y funcionando correctamente."
                      : "❌ No se pudo autenticar el correo emisor."}
                  </p>
                  {testEmailResult.errorDetails && (
                    <p className="mt-1 text-xs">
                      {testEmailResult.errorDetails}
                    </p>
                  )}
                </div>
              )}

              {/* Registro de últimos correos procesados */}
              {(store.emailLogs || []).length > 0 && (
                <div className="pt-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#746657] block mb-2">
                    Últimos envíos registrados ({store.emailLogs?.length})
                  </span>
                  <div className="max-h-48 overflow-y-auto border border-[#D8CEB9] divide-y divide-[#D8CEB9] bg-[#FAF8F3] text-xs">
                    {(store.emailLogs || []).slice(0, 10).map((log) => {
                      const allSucceeded =
                        log.guideSent &&
                        (!log.recipientClient || log.clientSent);
                      return (
                        <div
                          key={log.id}
                          className="p-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                        >
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 text-[10px] font-bold uppercase mr-2 ${
                                allSucceeded
                                  ? "bg-emerald-700 text-white"
                                  : "bg-red-700 text-white"
                              }`}
                            >
                              {allSucceeded ? "Entregado" : "Error de envío"}
                            </span>
                            <strong className="text-[#263D32]">
                              {log.subject}
                            </strong>
                            {log.errorDetails && (
                              <p className="text-[11px] text-red-900 mt-0.5">
                                {log.errorDetails}
                              </p>
                            )}
                          </div>
                          <span className="text-[11px] text-[#746657] whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleString("es-AR")}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* BLOQUE 2: DATOS DE CONTACTO Y WHATSAPP */}
            <div className="bg-white border border-[#D8CEB9] p-4 sm:p-6 shadow-sm space-y-4">
              <h3 className="font-serif text-2xl text-[#263D32] border-b border-[#D8CEB9] pb-3">
                Datos de Contacto y Clave del Panel
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase text-[#746657] mb-1">
                    WhatsApp del Guía
                  </label>
                  <input
                    type="text"
                    value={store.settings.whatsappNumber}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          whatsappNumber: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#FAF8F3] border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#746657] mb-1">
                    Instagram URL
                  </label>
                  <input
                    type="text"
                    value={store.settings.instagramUrl}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          instagramUrl: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#FAF8F3] border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-[#746657] mb-1">
                    Clave de este panel (PIN)
                  </label>
                  <input
                    type="text"
                    value={store.settings.adminPin}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          adminPin: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3 py-2.5 bg-[#FAF8F3] border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  handleSaveFullStore("Datos de contacto actualizados.")
                }
                className="px-5 py-2.5 bg-[#263D32] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar datos de contacto</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================================================================= */}
      {/* MODAL CORTO DE DÍA / CREAR O EDITAR SALIDA (2 CLICS)              */}
      {/* ================================================================= */}
      {dayModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setDayModalOpen(false)}
        >
          <div
            className="bg-[#F2EFE6] border border-[#263D32] max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-5 my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#D8CEB9] pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-[#65745A] block">
                  {modalMode === "edit"
                    ? "Editar salida programada"
                    : modalMode === "duplicate"
                    ? "Duplicar salida en otra fecha"
                    : "Programar salida en 2 clics"}
                </span>
                <h3 className="font-serif text-2xl text-[#263D32] font-bold">
                  {formatReadableDate(modalDate)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDayModalOpen(false)}
                className="p-1.5 text-[#746657] hover:text-[#292D29]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Si estamos en modo crear en ese día, mostrar también opción de bloquear/desbloquear en 1 clic */}
            {modalMode === "create" && (
              <div className="flex items-center justify-between gap-2 p-3 bg-white border border-[#D8CEB9]">
                <span className="text-xs text-[#292D29]">
                  {modalDateIsBlocked
                    ? "Este día está bloqueado para pedidos."
                    : "¿No salís a pescar este día?"}
                </span>
                <button
                  type="button"
                  onClick={async () => {
                    await runAdminAction(
                      {
                        type: "TOGGLE_BLOCKED_DAY",
                        date: modalDate,
                        reason: "Día bloqueado por el guía",
                      },
                      modalDateIsBlocked
                        ? `Día ${formatReadableDate(modalDate)} desbloqueado.`
                        : `Día ${formatReadableDate(modalDate)} bloqueado.`
                    );
                  }}
                  className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider cursor-pointer ${
                    modalDateIsBlocked
                      ? "bg-[#263D32] text-white"
                      : "bg-stone-200 hover:bg-stone-300 text-stone-800"
                  }`}
                >
                  {modalDateIsBlocked ? "Desbloquear día" : "Bloquear día"}
                </button>
              </div>
            )}

            {/* Si ya hay salidas activas en esa fecha, avisar */}
            {modalMode === "create" && modalDateDepartures.length > 0 && (
              <div className="p-3 bg-[#263D32]/10 border border-[#263D32]/30 text-xs text-[#263D32]">
                <strong>Salidas ya cargadas en esta fecha:</strong>{" "}
                {modalDateDepartures.map((d) => d.destination).join(", ")}
              </div>
            )}

            <form onSubmit={handleSaveDepartureFromModal} className="space-y-4">
              {/* Fecha (editable especialmente al duplicar o editar) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                  Fecha de la salida
                </label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm font-medium"
                />
              </div>

              {/* Río o Lago (con los 12 destinos precargados) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                  Río o Lago
                </label>
                <select
                  value={
                    riverList.includes(modalRiver) ? modalRiver : "__custom__"
                  }
                  onChange={(e) => {
                    if (e.target.value !== "__custom__") {
                      setModalRiver(e.target.value);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm font-medium mb-1.5"
                >
                  {riverList.map((rName) => (
                    <option key={rName} value={rName}>
                      {rName}
                    </option>
                  ))}
                  <option value="__custom__">
                    Otro sector / Escribir manualmente...
                  </option>
                </select>
                <input
                  type="text"
                  value={modalRiver}
                  onChange={(e) => setModalRiver(e.target.value)}
                  placeholder="Nombre del río o tramo..."
                  className="w-full px-3.5 py-2 bg-white border border-[#D8CEB9] text-xs text-[#746657]"
                />
              </div>

              {/* Tipo de pesca y Cupos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                    Tipo de pesca
                  </label>
                  <select
                    value={modalType}
                    onChange={(e) =>
                      setModalType(e.target.value as ExperienceModality)
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                  >
                    {FISHING_MODALITIES.map((mod) => (
                      <option key={mod} value={mod}>
                        {mod}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                    Cupos totales (personas)
                  </label>
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setModalSpots(num)}
                        className={`flex-1 py-2 text-xs font-bold border cursor-pointer ${
                          modalSpots === num
                            ? "bg-[#263D32] text-white border-[#263D32]"
                            : "bg-white text-[#292D29] border-[#D8CEB9]"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                    <input
                      type="number"
                      min={1}
                      max={12}
                      value={modalSpots}
                      onChange={(e) =>
                        setModalSpots(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="w-14 px-2 py-2 bg-white border border-[#D8CEB9] text-sm text-center"
                    />
                  </div>
                </div>
              </div>

              {/* Horario con atajos de 1 clic */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#263D32]">
                    Horario
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setModalStart("08:00");
                        setModalEnd("17:30");
                      }}
                      className="px-2 py-0.5 bg-white border border-[#D8CEB9] text-[10px] hover:border-[#263D32] cursor-pointer"
                    >
                      Todo el día
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalStart("07:30");
                        setModalEnd("13:00");
                      }}
                      className="px-2 py-0.5 bg-white border border-[#D8CEB9] text-[10px] hover:border-[#263D32] cursor-pointer"
                    >
                      Mañana
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalStart("13:30");
                        setModalEnd("19:00");
                      }}
                      className="px-2 py-0.5 bg-white border border-[#D8CEB9] text-[10px] hover:border-[#263D32] cursor-pointer"
                    >
                      Tarde
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[11px] text-[#746657] block mb-0.5">
                      Hora inicio
                    </span>
                    <input
                      type="time"
                      value={modalStart}
                      onChange={(e) => setModalStart(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <span className="text-[11px] text-[#746657] block mb-0.5">
                      Hora fin (opcional)
                    </span>
                    <input
                      type="time"
                      value={modalEnd}
                      onChange={(e) => setModalEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Notas opcionales */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#263D32] mb-1">
                  Notas para los pescadores (opcional)
                </label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Ej: Incluye almuerzo en la ribera y equipos..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                />
              </div>

              {/* Botones finales del modal */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D8CEB9]">
                <button
                  type="button"
                  onClick={() => setDayModalOpen(false)}
                  className="px-4 py-3 bg-white border border-[#D8CEB9] text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={busyAction}
                  className="px-6 py-3 bg-[#263D32] hover:bg-[#3A4E3C] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <Save className="w-4 h-4" />
                  <span>
                    {busyAction
                      ? "Guardando..."
                      : modalMode === "edit"
                      ? "Guardar cambios"
                      : "Guardar"}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL DE CONFIRMACIÓN PARA LIMPIAR HISTORIAL DE SOLICITUDES       */}
      {/* ================================================================= */}
      {clearHistoryModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setClearHistoryModalOpen(false)}
        >
          <div
            className="bg-[#F2EFE6] border border-[#263D32] max-w-md w-full p-6 shadow-2xl space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-[#D8CEB9] pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-red-800 block">
                  Limpieza de bandeja
                </span>
                <h3 className="font-serif text-2xl text-[#263D32] font-bold">
                  Limpiar historial de solicitudes
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setClearHistoryModalOpen(false)}
                className="p-1 text-[#746657]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <label
                className={`block p-3.5 border cursor-pointer ${
                  clearMode === "resolved"
                    ? "bg-white border-[#263D32]"
                    : "bg-[#FAF8F3] border-[#D8CEB9]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="clearMode"
                    checked={clearMode === "resolved"}
                    onChange={() => setClearMode("resolved")}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-bold text-[#263D32] block">
                      Borrar solo las ya resueltas ({resolvedRequests.length})
                    </span>
                    <span className="text-xs text-[#746657] block mt-0.5">
                      Elimina las aceptadas, rechazadas y reprogramadas. Mantiene
                      intactas las {pendingRequests.length} pendiente(s).
                    </span>
                  </div>
                </div>
              </label>

              <label
                className={`block p-3.5 border cursor-pointer ${
                  clearMode === "all"
                    ? "bg-red-50 border-red-500"
                    : "bg-[#FAF8F3] border-[#D8CEB9]"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <input
                    type="radio"
                    name="clearMode"
                    checked={clearMode === "all"}
                    onChange={() => setClearMode("all")}
                    className="mt-1"
                  />
                  <div>
                    <span className="text-sm font-bold text-red-900 block">
                      Borrar todas las solicitudes ({allRequests.length})
                    </span>
                    <span className="text-xs text-red-800 block mt-0.5">
                      Vacía por completo la bandeja de solicitudes.
                    </span>
                  </div>
                </div>
              </label>

              {clearMode === "all" && pendingRequests.length > 0 && (
                <div className="p-3.5 bg-red-100 border border-red-400 text-red-950 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase">
                    <AlertTriangle className="w-4 h-4 text-red-800 flex-shrink-0" />
                    <span>
                      ¡Atención! Hay {pendingRequests.length} solicitud(es)
                      pendiente(s) sin responder
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmDeletePending}
                      onChange={(e) =>
                        setConfirmDeletePending(e.target.checked)
                      }
                    />
                    <span>
                      Sí, entiendo y quiero borrar también las solicitudes
                      pendientes.
                    </span>
                  </label>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#D8CEB9]">
              <button
                type="button"
                onClick={() => setClearHistoryModalOpen(false)}
                className="px-4 py-2.5 bg-white border border-[#D8CEB9] text-xs font-bold uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={
                  busyAction ||
                  (clearMode === "resolved" && resolvedRequests.length === 0) ||
                  (clearMode === "all" &&
                    pendingRequests.length > 0 &&
                    !confirmDeletePending)
                }
                onClick={handleConfirmClearHistory}
                className="px-5 py-2.5 bg-red-800 hover:bg-red-900 disabled:opacity-40 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirmar borrado</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
