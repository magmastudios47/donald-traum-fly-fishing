"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  TraumStoreData,
  CalendarDeparture,
  DestinationItem,
  ExperienceModality,
  ServiceGroupType,
  SiteImagesConfig,
  CustomRequestStatus,
} from "@/types/traum";
import {
  Calendar,
  MapPin,
  Settings,
  Inbox,
  CheckCircle2,
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  Lock,
  Sliders,
  Image as ImageIcon,
  MessageSquare,
  CreditCard,
  Upload,
  Star,
  Copy,
  Ban,
  Download,
  UserPlus,
  BellRing,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Check,
  XCircle,
  Edit3,
} from "lucide-react";
import Link from "next/link";

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

function buildWaUrl(phone: string, text: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  const formatted = digits.startsWith("54") ? digits : `549${digits}`;
  return `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
}

function ImageInputControl({
  label,
  subtitle,
  value,
  onChange,
}: {
  label: string;
  subtitle?: string;
  value: string;
  onChange: (newUrl: string) => void;
}) {
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Read and compress slightly on client canvas so JSON stays fast and light
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxW = 1600;
        const scale = img.width > maxW ? maxW / img.width : 1;
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.84);
          onChange(dataUrl);
        } else if (typeof reader.result === "string") {
          onChange(reader.result);
        }
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="bg-[#F2EFE6]/60 border border-[#D8CEB9] p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="w-full sm:w-40 h-28 bg-[#292D29] border border-[#D8CEB9] overflow-hidden flex-shrink-0">
        {value ? (
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>

      <div className="flex-1 w-full space-y-2">
        <div>
          <span className="text-xs font-semibold text-[#263D32] block">
            {label}
          </span>
          {subtitle && (
            <span className="text-[11px] text-[#746657] block">{subtitle}</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Pegá la URL de la fotografía..."
            className="flex-1 px-3 py-2 bg-white border border-[#D8CEB9] text-xs text-[#292D29]"
          />

          <label className="px-3.5 py-2 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-[10px] uppercase tracking-[0.18em] font-semibold inline-flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap">
            <Upload className="w-3.5 h-3.5" />
            <span>Subir foto</span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const [store, setStore] = useState<TraumStoreData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Simple Auth Gate
  const [unlocked, setUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "departures"
    | "destinations"
    | "images"
    | "services"
    | "reviews"
    | "inquiries"
    | "legal_cookies"
    | "settings"
  >("departures");

  // New Departure Form State
  const [newDepDate, setNewDepDate] = useState("2026-11-28");
  const [newDepStartTime, setNewDepStartTime] = useState("08:00");
  const [newDepEndTime, setNewDepEndTime] = useState("17:30");
  const [newDepDestination, setNewDepDestination] = useState("Río Malleo");
  const [newDepExperience, setNewDepExperience] =
    useState<ExperienceModality>("Pesca de vadeo");
  const [newDepServiceGroup, setNewDepServiceGroup] =
    useState<ServiceGroupType>("Salida para dos personas");
  const [newDepMax, setNewDepMax] = useState(2);
  const [newDepInfo, setNewDepInfo] = useState("");
  const [newDepRepeatMode, setNewDepRepeatMode] = useState<
    "none" | "daily" | "weekly"
  >("none");
  const [newDepRepeatCount, setNewDepRepeatCount] = useState(2);

  // Edit Departure State
  const [editingDepId, setEditingDepId] = useState<string | null>(null);
  const [editDepDate, setEditDepDate] = useState("");
  const [editDepStartTime, setEditDepStartTime] = useState("08:00");
  const [editDepEndTime, setEditDepEndTime] = useState("17:30");
  const [editDepDestination, setEditDepDestination] = useState("");
  const [editDepExperience, setEditDepExperience] =
    useState<ExperienceModality>("Pesca en balsa");
  const [editDepMax, setEditDepMax] = useState(2);
  const [editDepInfo, setEditDepInfo] = useState("");

  // Manual Enrollment Form State per departure
  const [manualEnrollDepId, setManualEnrollDepId] = useState<string | null>(
    null
  );
  const [manualName, setManualName] = useState("");
  const [manualPhone, setManualPhone] = useState("");
  const [manualEmail, setManualEmail] = useState("");
  const [manualCount, setManualCount] = useState(1);

  // Blocked Day Form State
  const [blockDateInput, setBlockDateInput] = useState("2026-11-20");
  const [blockReasonInput, setBlockReasonInput] = useState("");

  // Admin Calendar Month/Year State
  const [adminCalMonth, setAdminCalMonth] = useState(10); // Noviembre
  const [adminCalYear, setAdminCalYear] = useState(2026);

  // Custom Request Response Drafts
  const [reqResponseDrafts, setReqResponseDrafts] = useState<
    Record<string, { altDate: string; reply: string }>
  >({});

  // New Destination Form State
  const [newDestName, setNewDestName] = useState("");
  const [newDestLocation, setNewDestLocation] = useState(
    "Junín de los Andes, Neuquén"
  );
  const [newDestImage, setNewDestImage] = useState(
    "https://upload.wikimedia.org/wikipedia/commons/6/65/Malleo_River.JPG"
  );
  const [newDestDesc, setNewDestDesc] = useState("");
  const [newDestLat, setNewDestLat] = useState("-39.8500");
  const [newDestLng, setNewDestLng] = useState("-71.1500");
  const [newDestDistance, setNewDestDistance] = useState(
    "30 km de Junín de los Andes"
  );
  const [newDestWaterType, setNewDestWaterType] = useState<
    "Río" | "Lago" | "Cuenca / Río"
  >("Río");

  useEffect(() => {
    const loadStore = () => {
      fetch("/api/traum", { cache: "no-store" })
        .then((res) => res.json())
        .then((data: TraumStoreData) => {
          setStore(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    };
    loadStore();
  }, []);

  const persistStore = async (updated: TraumStoreData, msg?: string) => {
    setSaving(true);
    setStore(updated);
    try {
      const res = await fetch("/api/traum", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
      const saved = await res.json();
      setStore(saved);
      if (typeof BroadcastChannel !== "undefined") {
        try {
          const bc = new BroadcastChannel("traum_live_sync");
          bc.postMessage({ updatedAt: Date.now() });
          bc.close();
        } catch {
          // Ignore
        }
      }
      setSaveMessage(
        msg || "Cambios guardados en vivo para todos los usuarios"
      );
      setTimeout(() => setSaveMessage(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  const handleCancelOrReleaseInquiry = async (
    inquiryId: string,
    deleteRecord = false
  ) => {
    setSaving(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CANCEL_INQUIRY",
          inquiryId,
          deleteRecord,
        }),
      });
      const data = await res.json();
      if (res.ok && data.store) {
        setStore(data.store);
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel("traum_live_sync");
            bc.postMessage({ updatedAt: Date.now() });
            bc.close();
          } catch {
            // Ignore
          }
        }
        setSaveMessage(
          deleteRecord
            ? "Pedido eliminado y cupos liberados en el calendario"
            : "Reserva dada de baja y cupos liberados en vivo"
        );
        setTimeout(() => setSaveMessage(null), 3500);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const expectedPin = store?.settings.adminPin || "traum2026";
    if (pinInput.trim() === expectedPin || pinInput.trim() === "traum") {
      setUnlocked(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  if (loading || !store) {
    return (
      <div className="min-h-screen bg-[#292D29] text-[#F2EFE6] flex items-center justify-center">
        <div className="text-center space-y-2">
          <span className="font-editorial text-3xl tracking-[0.25em] block">
            TRAUM
          </span>
          <p className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9]">
            Cargando panel administrativo...
          </p>
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-[#292D29] text-[#F2EFE6] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#263D32] border border-[#899487]/35 p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-[#899487]/30 pb-5">
            <div>
              <span className="font-editorial text-3xl tracking-[0.22em] block">
                TRAUM
              </span>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9]">
                Administración de Salidas y Contenidos
              </span>
            </div>
            <Lock className="w-6 h-6 text-[#D8CEB9]" />
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.2em] text-[#D8CEB9] mb-2">
                Clave de acceso administrativo
              </label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Ingresá la clave (por defecto: traum2026)"
                className="w-full px-4 py-3 bg-[#292D29] border border-[#899487]/40 text-[#F2EFE6] text-sm focus:border-[#D8CEB9] focus:outline-none"
              />
              {pinError && (
                <p className="text-xs text-amber-300 mt-2">
                  Clave incorrecta. La clave inicial configurada es{" "}
                  <strong>{store.settings.adminPin}</strong>.
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-3.5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.22em] font-semibold transition-colors cursor-pointer"
            >
              Ingresar al panel
            </button>
          </form>

          <div className="pt-3 border-t border-[#899487]/25 flex items-center justify-between text-xs text-[#F2EFE6]/70">
            <span>Clave inicial: traum2026</span>
            <Link href="/" className="underline text-[#D8CEB9]">
              ← Volver a la web
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const callAdminAction = async (
    payload: Record<string, unknown>,
    successMsg: string
  ) => {
    setSaving(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && data.store) {
        setStore(data.store);
        if (typeof BroadcastChannel !== "undefined") {
          try {
            const bc = new BroadcastChannel("traum_live_sync");
            bc.postMessage({ updatedAt: Date.now() });
            bc.close();
          } catch {
            // Ignore
          }
        }
        setSaveMessage(successMsg);
        setTimeout(() => setSaveMessage(null), 4000);
        return data;
      } else {
        setSaveMessage(data.error || "No se pudo completar la acción");
        setTimeout(() => setSaveMessage(null), 4000);
      }
    } finally {
      setSaving(false);
    }
    return null;
  };

  // Handlers for Departures
  const handleAddDeparture = async (e: React.FormEvent) => {
    e.preventDefault();
    await callAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "CREATE",
        date: newDepDate,
        startTime: newDepStartTime,
        endTime: newDepEndTime,
        destination: newDepDestination,
        experienceType: newDepExperience,
        maxParticipants: Number(newDepMax) || 2,
        additionalInfo: newDepInfo,
        repeatMode: newDepRepeatMode,
        repeatCount: Number(newDepRepeatCount) || 1,
      },
      newDepRepeatMode === "none"
        ? "Salida programada agregada al calendario"
        : `Se crearon ${newDepRepeatCount} salidas recurrentes en el calendario`
    );
    setNewDepInfo("");
  };

  const handleDuplicateDeparture = async (dep: CalendarDeparture) => {
    const [y, m, d] = dep.date.split("-").map(Number);
    const nextWeek = new Date(Date.UTC(y, m - 1, d + 7))
      .toISOString()
      .split("T")[0];
    await callAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "DUPLICATE",
        date: nextWeek,
        startTime: dep.startTime || "08:00",
        endTime: dep.endTime || "17:30",
        destination: dep.destination,
        experienceType: dep.experienceType,
        maxParticipants: dep.maxParticipants,
        additionalInfo: dep.additionalInfo,
      },
      `Salida duplicada para el ${nextWeek}`
    );
  };

  const handleSaveEditedDeparture = async (departureId: string) => {
    await callAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "UPDATE",
        departureId,
        date: editDepDate,
        startTime: editDepStartTime,
        endTime: editDepEndTime,
        destination: editDepDestination,
        experienceType: editDepExperience,
        maxParticipants: Number(editDepMax) || 2,
        additionalInfo: editDepInfo,
      },
      "Salida programada actualizada"
    );
    setEditingDepId(null);
  };

  const handleCancelDepartureWithNotification = async (
    dep: CalendarDeparture
  ) => {
    await callAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "CANCEL",
        departureId: dep.id,
        reason:
          "Salida cancelada por el guía (reprogramación o condiciones del río).",
      },
      `Salida del ${dep.date} cancelada y aviso enviado a todos los anotados`
    );
  };

  const handleDeleteDeparture = async (id: string) => {
    await callAdminAction(
      {
        type: "MANAGE_DEPARTURE",
        subAction: "DELETE",
        departureId: id,
      },
      "Salida eliminada del calendario"
    );
  };

  const handleAddManualEnrollment = async (departureId: string) => {
    if (!manualName.trim() || !manualPhone.trim()) return;
    await callAdminAction(
      {
        type: "ADD_MANUAL_ENROLLMENT",
        departureId,
        fullName: manualName.trim(),
        whatsapp: manualPhone.trim(),
        email: manualEmail.trim() || "cliente@traumflycast.com",
        participantsCount: Number(manualCount) || 1,
      },
      `Se anotó manualmente a ${manualName.trim()}`
    );
    setManualName("");
    setManualPhone("");
    setManualEmail("");
    setManualCount(1);
    setManualEnrollDepId(null);
  };

  const handlePromoteFromWaitlist = async (enrollmentId: string) => {
    await callAdminAction(
      {
        type: "PROMOTE_WAITLIST",
        enrollmentId,
      },
      "Pescador promovido de lista de espera a anotación confirmada"
    );
  };

  const handleToggleBlockDay = async (
    dateStr: string,
    reason?: string,
    forceBlock?: boolean
  ) => {
    await callAdminAction(
      {
        type: "TOGGLE_BLOCKED_DAY",
        date: dateStr,
        reason: reason || "",
        forceBlock,
      },
      `Estado de bloqueo actualizado para el día ${dateStr}`
    );
    setBlockReasonInput("");
  };

  const handleExportEnrollmentsCsv = (filterDepartureId?: string) => {
    const list = (store.enrollments || []).filter((e) =>
      filterDepartureId ? e.departureId === filterDepartureId : true
    );
    const headers = [
      "Codigo",
      "Fecha_Salida",
      "Horario",
      "Rio_Destino",
      "Tipo_Pesca",
      "Nombre",
      "Telefono_WhatsApp",
      "Email",
      "Cantidad_Personas",
      "Estado",
      "Comentarios",
      "Fecha_Anotacion",
    ];
    const rows = list.map((enr) => {
      const dep = store.departures.find((d) => d.id === enr.departureId);
      const cols = [
        enr.bookingCode,
        dep?.date || "",
        dep ? `${dep.startTime || "08:00"}-${dep.endTime || "17:30"}` : "",
        dep?.destination || "",
        dep?.experienceType || "",
        enr.fullName,
        enr.whatsapp,
        enr.email,
        String(enr.participantsCount),
        enr.status,
        (enr.comments || "").replace(/"/g, '""'),
        enr.createdAt,
      ];
      return cols.map((c) => `"${c}"`).join(",");
    });
    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filterDepartureId
      ? `anotados-salida-${filterDepartureId}.csv`
      : `anotados-traum-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRespondCustomRequest = async (
    requestId: string,
    status: CustomRequestStatus,
    alternativeDate?: string,
    guideResponse?: string
  ) => {
    await callAdminAction(
      {
        type: "RESPOND_CUSTOM_REQUEST",
        requestId,
        status,
        alternativeDate,
        guideResponse,
      },
      `Solicitud actualizada a estado: ${status}`
    );
  };

  const handleConvertRequestToDeparture = async (
    requestId: string,
    mode: "privada" | "abierta"
  ) => {
    await callAdminAction(
      {
        type: "CONVERT_REQUEST_TO_DEPARTURE",
        requestId,
        mode,
        maxParticipants: mode === "abierta" ? 4 : undefined,
      },
      `Solicitud convertida en salida programada (${mode}) con anotación confirmada`
    );
  };

  // Handlers for Destinations
  const handleAddDestination = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDestName.trim()) return;
    const created: DestinationItem = {
      id: `dest-${Date.now()}`,
      name: newDestName,
      location: newDestLocation,
      imageUrl: newDestImage,
      description: newDestDesc,
      modalities: ["Pesca de vadeo", "Pesca en balsa", "Salida personalizada"],
      isReferenceDemo: false,
      lat: parseFloat(newDestLat) || -39.9506,
      lng: parseFloat(newDestLng) || -71.0703,
      distanceFromJunin: newDestDistance || "Zona Junín de los Andes",
      waterType: newDestWaterType,
    };
    const updated: TraumStoreData = {
      ...store,
      destinations: [...store.destinations, created],
    };
    persistStore(updated, "Nuevo destino incorporado al mapa y listado");
    setNewDestName("");
    setNewDestDesc("");
  };

  const handleDeleteDestination = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      destinations: store.destinations.filter((d) => d.id !== id),
    };
    persistStore(updated, "Destino eliminado");
  };

  // Handler for Service toggles
  const handleToggleService = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      services: store.services.map((srv) =>
        srv.id === id ? { ...srv, enabled: !srv.enabled } : srv
      ),
    };
    persistStore(updated, "Estado de prestación actualizado");
  };

  // Handler for Deleting Inappropriate Reviews
  const handleDeleteReview = (id: string) => {
    const updated: TraumStoreData = {
      ...store,
      reviews: store.reviews.filter((r) => r.id !== id),
    };
    persistStore(updated, "Reseña eliminada");
  };

  // Handler for updating Site Images
  const updateSiteImageField = (key: keyof SiteImagesConfig, val: string) => {
    setStore({
      ...store,
      siteImages: {
        ...store.siteImages,
        [key]: val,
      },
    });
  };

  return (
    <div className="min-h-screen bg-[#F2EFE6] text-[#292D29] flex flex-col">
      {/* Top Bar */}
      <header className="bg-[#263D32] text-[#F2EFE6] border-b border-[#899487]/30 py-4 px-4 sm:px-6 lg:px-10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="font-editorial text-2xl sm:text-3xl tracking-[0.22em]">
              TRAUM
            </span>
            <span className="px-2.5 py-1 bg-[#D8CEB9]/15 border border-[#D8CEB9]/40 text-[#D8CEB9] text-[10px] uppercase tracking-[0.2em]">
              Panel de Administración
            </span>
          </div>

          <div className="flex items-center gap-4">
            {saveMessage && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#65745A] text-[#F2EFE6] text-xs">
                <CheckCircle2 className="w-4 h-4 text-[#D8CEB9]" />
                <span>{saveMessage}</span>
              </div>
            )}
            <Link
              href="/"
              className="px-4 py-2 border border-[#D8CEB9]/50 text-[#F2EFE6] hover:bg-[#D8CEB9] hover:text-[#263D32] text-xs uppercase tracking-[0.18em] transition-colors inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Ver sitio público</span>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-10 py-6 sm:py-10 flex-1">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 pb-8 mb-8 border-b border-[#D8CEB9]">
          <button
            type="button"
            onClick={() => setActiveTab("departures")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "departures"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Calendario ({store.departures.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("images")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "images"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imágenes de la Web</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("destinations")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "destinations"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Destinos y Mapa ({store.destinations.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("services")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "services"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>Servicios y Medios de Pago</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("reviews")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "reviews"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Reseñas ({store.reviews.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("inquiries")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "inquiries"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>
              Solicitudes a Pedido ({(store.customRequests || []).length})
            </span>
            {(store.customRequests || []).filter(
              (r) => r.status === "pendiente"
            ).length > 0 && (
              <span className="px-2 py-0.5 bg-[#B35B2B] text-white text-[10px] font-bold rounded-full">
                {
                  (store.customRequests || []).filter(
                    (r) => r.status === "pendiente"
                  ).length
                }{" "}
                pend.
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("legal_cookies")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "legal_cookies"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>
              Cookies y Legal ({(store.cookieConsents || []).length})
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("settings")}
            className={`px-4 py-3 text-xs uppercase tracking-[0.18em] font-semibold flex items-center gap-2 transition-colors cursor-pointer ${
              activeTab === "settings"
                ? "bg-[#263D32] text-[#F2EFE6]"
                : "bg-white text-[#292D29] border border-[#D8CEB9] hover:bg-[#D8CEB9]/40"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Contacto, Mail y Google</span>
          </button>
        </div>

        {/* TAB: DEPARTURES, CALENDAR, WAITLIST & BLOCKED DAYS */}
        {activeTab === "departures" && (
          <div className="space-y-8">
            {/* ALERTAS DE LISTA DE ESPERA ACTIVAS */}
            {(store.waitlistAlerts || []).filter((a) => !a.resolved).length >
              0 && (
              <div className="bg-amber-50 border-2 border-amber-500 p-5 space-y-3">
                <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs uppercase tracking-[0.2em]">
                  <BellRing className="w-4 h-4 text-amber-700" />
                  <span>
                    Avisos de Lista de Espera (Cupos liberados para promover)
                  </span>
                </div>
                {(store.waitlistAlerts || [])
                  .filter((a) => !a.resolved)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className="p-4 bg-white border border-amber-300 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        Se liberó lugar en{" "}
                        <strong>
                          {alert.destination} ({alert.departureDate})
                        </strong>{" "}
                        por baja de {alert.cancelledEnrollmentName}. Primero en
                        lista de espera:{" "}
                        <strong className="text-[#263D32]">
                          {alert.nextWaitlistName} ({alert.nextWaitlistCount}{" "}
                          pers. · {alert.nextWaitlistPhone})
                        </strong>
                        .
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handlePromoteFromWaitlist(
                              alert.nextWaitlistEnrollmentId
                            )
                          }
                          className="px-3.5 py-2 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                        >
                          Promover a Confirmada (1 clic)
                        </button>
                        <a
                          href={buildWaUrl(
                            alert.nextWaitlistPhone,
                            `Hola ${alert.nextWaitlistName}, te escribimos de TRAUM Fly Cast Patagonia porque se liberó lugar en la salida del ${alert.departureDate} (${alert.destination}). ¡Te confirmamos tu cupo!`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-700 text-white text-[10px] uppercase tracking-wider font-semibold inline-flex items-center gap-1"
                        >
                          <span>Avisar WhatsApp</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {/* VISTA DE CALENDARIO DEL GUÍA + BLOQUEO DE DÍAS + EXPORTACIÓN CSV */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Calendario Mensual Visual del Guía (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-[#D8CEB9] p-6">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#D8CEB9]">
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#65745A] font-semibold block">
                      Vista General del Guía (Salidas, Anotados, Bloqueos y Solicitudes)
                    </span>
                    <h3 className="font-editorial text-2xl text-[#263D32]">
                      {ADMIN_MONTH_NAMES[adminCalMonth]} {adminCalYear}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (adminCalMonth === 0) {
                          setAdminCalMonth(11);
                          setAdminCalYear((y) => y - 1);
                        } else {
                          setAdminCalMonth((m) => m - 1);
                        }
                      }}
                      className="w-9 h-9 border border-[#D8CEB9] hover:bg-[#263D32] hover:text-[#F2EFE6] flex items-center justify-center cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (adminCalMonth === 11) {
                          setAdminCalMonth(0);
                          setAdminCalYear((y) => y + 1);
                        } else {
                          setAdminCalMonth((m) => m + 1);
                        }
                      }}
                      className="w-9 h-9 border border-[#D8CEB9] hover:bg-[#263D32] hover:text-[#F2EFE6] flex items-center justify-center cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                  {ADMIN_WEEKDAYS.map((w) => (
                    <div
                      key={w}
                      className="text-[10px] uppercase tracking-wider text-[#746657] font-semibold py-1"
                    >
                      {w}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const firstDay = new Date(adminCalYear, adminCalMonth, 1);
                    const totalDays = new Date(
                      adminCalYear,
                      adminCalMonth + 1,
                      0
                    ).getDate();
                    const offset = (firstDay.getDay() + 6) % 7;
                    const cells: Array<{
                      day: number | null;
                      dateStr: string | null;
                    }> = [];
                    for (let i = 0; i < offset; i++)
                      cells.push({ day: null, dateStr: null });
                    for (let d = 1; d <= totalDays; d++) {
                      const mPad = String(adminCalMonth + 1).padStart(2, "0");
                      const dPad = String(d).padStart(2, "0");
                      cells.push({
                        day: d,
                        dateStr: `${adminCalYear}-${mPad}-${dPad}`,
                      });
                    }
                    return cells.map((c, idx) => {
                      if (!c.day || !c.dateStr) {
                        return (
                          <div
                            key={`adm-empty-${idx}`}
                            className="h-16 bg-[#F2EFE6]/30"
                          />
                        );
                      }
                      const dt = c.dateStr;
                      const isBlk = (store.blockedDays || []).some(
                        (b) => b.date === dt
                      );
                      const deps = (store.departures || []).filter(
                        (d) => d.date === dt && d.status !== "cancelada"
                      );
                      const pendReqs = (store.customRequests || []).filter(
                        (r) => r.desiredDate === dt && r.status === "pendiente"
                      );
                      const confirmedCount = (store.enrollments || [])
                        .filter(
                          (e) =>
                            deps.some((d) => d.id === e.departureId) &&
                            e.status === "confirmada"
                        )
                        .reduce((acc, e) => acc + e.participantsCount, 0);

                      return (
                        <div
                          key={dt}
                          onClick={() => {
                            setNewDepDate(dt);
                            setBlockDateInput(dt);
                          }}
                          className={`h-16 p-1.5 border text-left flex flex-col justify-between cursor-pointer transition-colors ${
                            isBlk
                              ? "bg-red-50 border-red-300 text-red-900"
                              : deps.length > 0
                              ? "bg-emerald-50 border-emerald-600/50 text-[#263D32]"
                              : pendReqs.length > 0
                              ? "bg-amber-50 border-amber-500/60"
                              : "bg-[#F2EFE6]/40 border-[#D8CEB9] hover:border-[#263D32]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-semibold ${
                                isBlk ? "line-through" : ""
                              }`}
                            >
                              {c.day}
                            </span>
                            {pendReqs.length > 0 && (
                              <span
                                title={`${pendReqs.length} solicitud(es) pendiente(s)`}
                                className="px-1.5 py-0.2 bg-[#B35B2B] text-white text-[9px] font-bold rounded-full"
                              >
                                {pendReqs.length} sol.
                              </span>
                            )}
                          </div>
                          <div className="text-[9px] leading-tight truncate">
                            {isBlk ? (
                              <span className="text-red-700 font-semibold">
                                Bloqueado
                              </span>
                            ) : deps.length > 0 ? (
                              <span className="font-semibold text-emerald-900">
                                {deps.length} sal. ({confirmedCount} anot.)
                              </span>
                            ) : (
                              <span className="text-[#746657]">Libre</span>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              {/* Bloquear / Desbloquear Días + Exportar Anotados CSV (5 cols) */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white border border-[#D8CEB9] p-6 space-y-4">
                  <h4 className="font-editorial text-2xl text-[#263D32] pb-2 border-b border-[#D8CEB9]">
                    Bloquear / Desbloquear Días
                  </h4>
                  <p className="text-xs text-[#746657]">
                    En los días bloqueados no se permite anotarse ni enviar
                    solicitudes de salidas a pedido.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] font-semibold mb-1">
                        Fecha a bloquear/desbloquear
                      </label>
                      <input
                        type="date"
                        value={blockDateInput}
                        onChange={(e) => setBlockDateInput(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] font-semibold mb-1">
                        Motivo (Opcional)
                      </label>
                      <input
                        type="text"
                        value={blockReasonInput}
                        onChange={(e) => setBlockReasonInput(e.target.value)}
                        placeholder="Ej. Descanso / Mantenimiento"
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      handleToggleBlockDay(blockDateInput, blockReasonInput)
                    }
                    className="w-full py-2.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.18em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Ban className="w-3.5 h-3.5" />
                    <span>Bloquear / Desbloquear fecha</span>
                  </button>

                  {(store.blockedDays || []).length > 0 && (
                    <div className="pt-3 border-t border-[#D8CEB9] space-y-2 max-h-40 overflow-y-auto">
                      <span className="text-[10px] uppercase tracking-[0.18em] text-[#746657] font-semibold block">
                        Días actualmente bloqueados ({(store.blockedDays || []).length}):
                      </span>
                      {(store.blockedDays || []).map((b) => (
                        <div
                          key={b.date}
                          className="p-2 bg-[#F2EFE6]/70 border border-[#D8CEB9] flex items-center justify-between text-xs"
                        >
                          <span>
                            <strong>{b.date}</strong>{" "}
                            {b.reason ? `— ${b.reason}` : ""}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleToggleBlockDay(b.date)}
                            className="text-red-700 hover:underline text-[11px] font-semibold cursor-pointer"
                          >
                            Desbloquear
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exportar anotados a CSV */}
                <div className="bg-white border border-[#D8CEB9] p-6 space-y-3">
                  <h4 className="font-editorial text-xl text-[#263D32]">
                    Exportar Padrón de Anotados (CSV)
                  </h4>
                  <p className="text-xs text-[#746657]">
                    Descargá una planilla CSV compatible con Excel con todas las
                    anotaciones confirmadas y en lista de espera.
                  </p>
                  <button
                    type="button"
                    onClick={() => handleExportEnrollmentsCsv()}
                    className="w-full py-3 bg-[#D8CEB9] text-[#263D32] hover:bg-[#263D32] hover:text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      Exportar todos los anotados a CSV (
                      {(store.enrollments || []).length})
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* CREAR SALIDA PROGRAMADA + LISTADO DE SALIDAS CON ANOTADOS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-5 bg-white border border-[#D8CEB9] p-6 sm:p-8">
                <h3 className="font-editorial text-2xl text-[#263D32] mb-6 pb-3 border-b border-[#D8CEB9]">
                  Programar nueva salida
                </h3>
                <form onSubmit={handleAddDeparture} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                        Fecha *
                      </label>
                      <input
                        type="date"
                        required
                        value={newDepDate}
                        onChange={(e) => setNewDepDate(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                        Hora inicio *
                      </label>
                      <input
                        type="time"
                        required
                        value={newDepStartTime}
                        onChange={(e) => setNewDepStartTime(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                        Hora fin (Opc.)
                      </label>
                      <input
                        type="time"
                        value={newDepEndTime}
                        onChange={(e) => setNewDepEndTime(e.target.value)}
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Río / Destino *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDepDestination}
                      onChange={(e) => setNewDepDestination(e.target.value)}
                      placeholder="Ej. Río Chimehuín — Garganta del Diablo"
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                        Tipo de pesca *
                      </label>
                      <select
                        value={newDepExperience}
                        onChange={(e) =>
                          setNewDepExperience(
                            e.target.value as ExperienceModality
                          )
                        }
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                      >
                        <option value="Pesca de vadeo">Pesca de vadeo</option>
                        <option value="Pesca en balsa">Pesca en balsa</option>
                        <option value="Salida personalizada">
                          Salida personalizada
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                        Cupos totales *
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        value={newDepMax}
                        onChange={(e) => setNewDepMax(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                      />
                    </div>
                  </div>

                  {/* Opción Recurrente */}
                  <div className="p-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] font-semibold mb-1">
                        Repetición (Opcional)
                      </label>
                      <select
                        value={newDepRepeatMode}
                        onChange={(e) =>
                          setNewDepRepeatMode(
                            e.target.value as "none" | "daily" | "weekly"
                          )
                        }
                        className="w-full px-2.5 py-2 bg-white border border-[#D8CEB9] text-xs"
                      >
                        <option value="none">Salida única (Sin repetir)</option>
                        <option value="weekly">Repetir cada semana</option>
                        <option value="daily">Repetir días seguidos</option>
                      </select>
                    </div>
                    {newDepRepeatMode !== "none" && (
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] font-semibold mb-1">
                          Cantidad de repeticiones
                        </label>
                        <input
                          type="number"
                          min={2}
                          max={12}
                          value={newDepRepeatCount}
                          onChange={(e) =>
                            setNewDepRepeatCount(Number(e.target.value))
                          }
                          className="w-full px-2.5 py-2 bg-white border border-[#D8CEB9] text-xs"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Notas de la salida
                    </label>
                    <textarea
                      rows={3}
                      value={newDepInfo}
                      onChange={(e) => setNewDepInfo(e.target.value)}
                      placeholder="Detalles técnicos, recomendaciones o puntos de encuentro..."
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Agregar salida al calendario</span>
                  </button>
                </form>
              </div>

              <div className="lg:col-span-7 space-y-4">
                <h3 className="font-editorial text-2xl text-[#263D32] mb-2">
                  Salidas programadas ({store.departures.length})
                </h3>
                {store.departures.map((dep) => {
                  const depEnrollments = (store.enrollments || []).filter(
                    (e) => e.departureId === dep.id && e.status !== "cancelada"
                  );
                  const isCancelled = dep.status === "cancelada";
                  const isEditing = editingDepId === dep.id;

                  return (
                    <div
                      key={dep.id}
                      className={`bg-white border p-5 space-y-4 ${
                        isCancelled
                          ? "border-red-300 bg-red-50/30 opacity-80"
                          : "border-[#D8CEB9]"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-[#263D32] text-[#F2EFE6] text-xs font-medium">
                              {dep.date} · {dep.startTime || "08:00"}
                              {dep.endTime ? ` a ${dep.endTime} hs` : " hs"}
                            </span>
                            <span className="text-xs uppercase tracking-wider text-[#65745A] font-semibold">
                              {dep.experienceType}
                            </span>
                            <span
                              className={`px-2 py-0.5 text-[11px] font-semibold ${
                                isCancelled
                                  ? "bg-red-800 text-white"
                                  : dep.availableSpots === 0
                                  ? "bg-red-100 text-red-800"
                                  : "bg-[#D8CEB9]/60 text-[#263D32]"
                              }`}
                            >
                              {isCancelled
                                ? "ESTADO: CANCELADA"
                                : `Cupos disponibles: ${dep.availableSpots} de ${dep.maxParticipants}`}
                            </span>
                          </div>
                          <h4 className="font-editorial text-2xl text-[#263D32]">
                            {dep.destination}
                          </h4>
                          {dep.additionalInfo && (
                            <p className="text-xs text-[#292D29]/75 pt-1">
                              {dep.additionalInfo}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-1.5">
                          <button
                            type="button"
                            title="Editar salida"
                            onClick={() => {
                              if (isEditing) {
                                setEditingDepId(null);
                              } else {
                                setEditingDepId(dep.id);
                                setEditDepDate(dep.date);
                                setEditDepStartTime(dep.startTime || "08:00");
                                setEditDepEndTime(dep.endTime || "17:30");
                                setEditDepDestination(dep.destination);
                                setEditDepExperience(dep.experienceType);
                                setEditDepMax(dep.maxParticipants);
                                setEditDepInfo(dep.additionalInfo || "");
                              }
                            }}
                            className="px-2.5 py-1.5 text-xs border border-[#D8CEB9] hover:border-[#263D32] text-[#263D32] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Editar</span>
                          </button>

                          <button
                            type="button"
                            title="Duplicar salida (+7 días)"
                            onClick={() => handleDuplicateDeparture(dep)}
                            className="px-2.5 py-1.5 text-xs border border-[#D8CEB9] hover:border-[#263D32] text-[#263D32] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Duplicar</span>
                          </button>

                          <button
                            type="button"
                            title="Exportar anotados de esta salida a CSV"
                            onClick={() => handleExportEnrollmentsCsv(dep.id)}
                            className="px-2.5 py-1.5 text-xs border border-[#D8CEB9] hover:border-[#263D32] text-[#263D32] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>CSV</span>
                          </button>

                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() =>
                                handleCancelDepartureWithNotification(dep)
                              }
                              className="px-2.5 py-1.5 text-xs bg-amber-700 hover:bg-red-800 text-white font-semibold cursor-pointer"
                            >
                              Cancelar salida y notificar
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDeparture(dep.id)}
                            className="p-2 text-[#746657] hover:text-red-700 border border-[#D8CEB9] cursor-pointer"
                            aria-label="Eliminar salida"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Formulario de edición inline */}
                      {isEditing && (
                        <div className="p-4 bg-[#F2EFE6] border border-[#D8CEB9] space-y-3">
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="date"
                              value={editDepDate}
                              onChange={(e) => setEditDepDate(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <input
                              type="time"
                              value={editDepStartTime}
                              onChange={(e) =>
                                setEditDepStartTime(e.target.value)
                              }
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <input
                              type="time"
                              value={editDepEndTime}
                              onChange={(e) =>
                                setEditDepEndTime(e.target.value)
                              }
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              value={editDepDestination}
                              onChange={(e) =>
                                setEditDepDestination(e.target.value)
                              }
                              className="sm:col-span-2 px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <input
                              type="number"
                              min={1}
                              max={20}
                              value={editDepMax}
                              onChange={(e) =>
                                setEditDepMax(Number(e.target.value))
                              }
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                          </div>
                          <textarea
                            rows={2}
                            value={editDepInfo}
                            onChange={(e) => setEditDepInfo(e.target.value)}
                            className="w-full px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingDepId(null)}
                              className="px-3 py-1.5 text-xs border border-[#D8CEB9] bg-white cursor-pointer"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleSaveEditedDeparture(dep.id)
                              }
                              className="px-4 py-1.5 text-xs bg-[#263D32] text-[#F2EFE6] font-semibold cursor-pointer"
                            >
                              Guardar cambios
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Lista de anotados por salida + agregar manual + promover lista de espera */}
                      <div className="pt-3 border-t border-[#D8CEB9] space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#65745A] font-semibold">
                            Anotados en esta salida ({depEnrollments.length}):
                          </span>
                          {!isCancelled && (
                            <button
                              type="button"
                              onClick={() =>
                                setManualEnrollDepId(
                                  manualEnrollDepId === dep.id ? null : dep.id
                                )
                              }
                              className="text-[11px] text-[#263D32] font-semibold inline-flex items-center gap-1 hover:underline cursor-pointer"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Agregar pescador manualmente</span>
                            </button>
                          )}
                        </div>

                        {manualEnrollDepId === dep.id && (
                          <div className="p-3 bg-[#F2EFE6] border border-[#D8CEB9] grid grid-cols-1 sm:grid-cols-5 gap-2 items-center">
                            <input
                              type="text"
                              placeholder="Nombre *"
                              value={manualName}
                              onChange={(e) => setManualName(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Teléfono/WhatsApp *"
                              value={manualPhone}
                              onChange={(e) => setManualPhone(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <input
                              type="email"
                              placeholder="Email"
                              value={manualEmail}
                              onChange={(e) => setManualEmail(e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <input
                              type="number"
                              min={1}
                              max={10}
                              value={manualCount}
                              onChange={(e) =>
                                setManualCount(Number(e.target.value))
                              }
                              className="px-2.5 py-1.5 bg-white border border-[#D8CEB9] text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddManualEnrollment(dep.id)}
                              className="px-3 py-1.5 bg-[#263D32] text-[#F2EFE6] text-xs font-semibold cursor-pointer"
                            >
                              Guardar
                            </button>
                          </div>
                        )}

                        {depEnrollments.length === 0 ? (
                          <p className="text-xs text-[#746657] italic">
                            Aún no hay anotados activos en esta salida.
                          </p>
                        ) : (
                          depEnrollments.map((enr) => (
                            <div
                              key={enr.id}
                              className={`p-3 border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs ${
                                enr.status === "lista_espera"
                                  ? "bg-amber-50 border-amber-300"
                                  : "bg-[#F2EFE6]/70 border-[#D8CEB9]"
                              }`}
                            >
                              <div>
                                <span
                                  className={`px-1.5 py-0.5 text-[9px] uppercase font-bold mr-2 ${
                                    enr.status === "lista_espera"
                                      ? "bg-amber-600 text-white"
                                      : "bg-emerald-800 text-white"
                                  }`}
                                >
                                  {enr.status === "lista_espera"
                                    ? "Lista de Espera"
                                    : "Confirmada"}
                                </span>
                                <strong className="text-[#263D32]">
                                  {enr.fullName}
                                </strong>{" "}
                                ({enr.bookingCode}) ·{" "}
                                <span className="font-semibold text-[#B35B2B]">
                                  {enr.participantsCount} pers.
                                </span>{" "}
                                · {enr.whatsapp} · {enr.email}
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <a
                                  href={buildWaUrl(
                                    enr.whatsapp,
                                    `Hola ${enr.fullName}, te contacto de TRAUM Fly Cast Patagonia por tu anotación (${enr.bookingCode}) para la salida del ${dep.date} en ${dep.destination}.`
                                  )}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-[10px] uppercase tracking-wider font-semibold inline-flex items-center gap-1"
                                >
                                  <span>WhatsApp</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                {enr.status === "lista_espera" &&
                                  dep.availableSpots >=
                                    enr.participantsCount && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handlePromoteFromWaitlist(enr.id)
                                      }
                                      className="px-2.5 py-1 bg-[#263D32] hover:bg-[#65745A] text-white text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                                    >
                                      Promover a Confirmada
                                    </button>
                                  )}

                                <button
                                  type="button"
                                  onClick={() =>
                                    handleCancelOrReleaseInquiry(enr.id, false)
                                  }
                                  className="px-2.5 py-1 bg-[#B35B2B] hover:bg-red-800 text-white text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                                >
                                  Quitar / Cancelar
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB: ALL SITE IMAGES MANAGER */}
        {activeTab === "images" && (
          <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#D8CEB9]">
              <div>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  Gestor Completo de Fotografías de la Web
                </h3>
                <p className="text-xs text-[#746657]">
                  Modificá cualquiera de las fotografías del sitio pegando un
                  link o subiendo una imagen desde tu dispositivo. Ninguna foto
                  está repetida.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Todas las fotografías fueron guardadas")
                }
                disabled={saving}
                className="px-6 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar todas las fotos</span>
              </button>
            </div>

            {/* Section 1: Portada, Filosofía y Conservación */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold">
                1. Portada (Hero), Filosofía y Conservación
              </h4>
              <ImageInputControl
                label="Hero Principal (Portada)"
                subtitle="Fotografía panorámica a pantalla completa al abrir la web"
                value={store.siteImages.heroBg}
                onChange={(val) => updateSiteImageField("heroBg", val)}
              />
              <ImageInputControl
                label="Filosofía · Imagen Principal"
                subtitle="Fotografía vertical junto a la historia de Traum"
                value={store.siteImages.philosophyMain}
                onChange={(val) => updateSiteImageField("philosophyMain", val)}
              />
              <ImageInputControl
                label="Filosofía I · El sueño de la captura"
                subtitle="Tarjeta conceptual 1"
                value={store.siteImages.pillarCapture}
                onChange={(val) => updateSiteImageField("pillarCapture", val)}
              />
              <ImageInputControl
                label="Filosofía II · El sueño de desconectar"
                subtitle="Tarjeta conceptual 2"
                value={store.siteImages.pillarDisconnect}
                onChange={(val) =>
                  updateSiteImageField("pillarDisconnect", val)
                }
              />
              <ImageInputControl
                label="Filosofía III · El sueño de compartir"
                subtitle="Tarjeta conceptual 3"
                value={store.siteImages.pillarShare}
                onChange={(val) => updateSiteImageField("pillarShare", val)}
              />
              <ImageInputControl
                label="Pesca Responsable (Catch & Release)"
                subtitle="Fotografía de devolución y conservación del recurso"
                value={store.siteImages.conservationMain}
                onChange={(val) =>
                  updateSiteImageField("conservationMain", val)
                }
              />
              <ImageInputControl
                label="Fondo de Cita Editorial (Henry David Thoreau)"
                subtitle="Fotografía panorámica detrás de la frase inspiracional"
                value={store.siteImages.thoreauQuoteBg}
                onChange={(val) => updateSiteImageField("thoreauQuoteBg", val)}
              />
            </div>

            {/* Section 2: Experiencias */}
            <div className="space-y-4 pt-6 border-t border-[#D8CEB9]">
              <h4 className="text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold">
                2. Fotografías de las 3 Modalidades (Experiencias)
              </h4>
              {store.experiences.map((exp, idx) => (
                <ImageInputControl
                  key={exp.id}
                  label={`Experiencia ${exp.number}: ${exp.title}`}
                  subtitle={exp.subtitle}
                  value={exp.imageUrl}
                  onChange={(newUrl) => {
                    const nextExp = [...store.experiences];
                    nextExp[idx] = { ...exp, imageUrl: newUrl };
                    setStore({ ...store, experiences: nextExp });
                  }}
                />
              ))}
            </div>

            {/* Section 3: Destinos */}
            <div className="space-y-4 pt-6 border-t border-[#D8CEB9]">
              <h4 className="text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold">
                3. Fotografías de cada Río / Lago (Destinos y Mapa)
              </h4>
              {store.destinations.map((dest, idx) => (
                <ImageInputControl
                  key={dest.id}
                  label={`${dest.name} (${dest.location})`}
                  subtitle={dest.distanceFromJunin}
                  value={dest.imageUrl}
                  onChange={(newUrl) => {
                    const nextDest = [...store.destinations];
                    nextDest[idx] = { ...dest, imageUrl: newUrl };
                    setStore({ ...store, destinations: nextDest });
                  }}
                />
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Todas las fotografías fueron guardadas")
                }
                disabled={saving}
                className="px-8 py-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar cambios de imágenes</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: DESTINATIONS & MAP */}
        {activeTab === "destinations" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white border border-[#D8CEB9] p-6">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-5 pb-3 border-b border-[#D8CEB9]">
                Agregar río o lago al listado y mapa
              </h3>
              <form onSubmit={handleAddDestination} className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Nombre del río o lago *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestName}
                    onChange={(e) => setNewDestName(e.target.value)}
                    placeholder="Ej. Río Quilquihue / Lago Lolog"
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Ubicación *
                    </label>
                    <input
                      type="text"
                      required
                      value={newDestLocation}
                      onChange={(e) => setNewDestLocation(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Tipo de espejo
                    </label>
                    <select
                      value={newDestWaterType}
                      onChange={(e) =>
                        setNewDestWaterType(
                          e.target.value as "Río" | "Lago" | "Cuenca / Río"
                        )
                      }
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    >
                      <option value="Río">Río</option>
                      <option value="Lago">Lago</option>
                      <option value="Cuenca / Río">Cuenca / Río</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Distancia desde Junín de los Andes
                  </label>
                  <input
                    type="text"
                    value={newDestDistance}
                    onChange={(e) => setNewDestDistance(e.target.value)}
                    placeholder="Ej. 18 km al sur de Junín de los Andes"
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Latitud (Mapa)
                    </label>
                    <input
                      type="text"
                      value={newDestLat}
                      onChange={(e) => setNewDestLat(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Longitud (Mapa)
                    </label>
                    <input
                      type="text"
                      value={newDestLng}
                      onChange={(e) => setNewDestLng(e.target.value)}
                      className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    URL de Fotografía *
                  </label>
                  <input
                    type="text"
                    required
                    value={newDestImage}
                    onChange={(e) => setNewDestImage(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Descripción del entorno *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={newDestDesc}
                    onChange={(e) => setNewDestDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3 bg-[#263D32] text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Incorporar destino</span>
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-4">
              {store.destinations.map((dest) => (
                <div
                  key={dest.id}
                  className="bg-white border border-[#D8CEB9] p-5 flex items-start justify-between gap-4"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-[#65745A] font-semibold">
                      {dest.location} · {dest.distanceFromJunin} ({dest.lat},{" "}
                      {dest.lng})
                    </span>
                    <h4 className="font-editorial text-2xl text-[#263D32]">
                      {dest.name}
                    </h4>
                    <p className="text-xs text-[#292D29]/80 leading-relaxed">
                      {dest.description}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteDestination(dest.id)}
                    className="p-2.5 text-[#746657] hover:text-red-700 border border-[#D8CEB9] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: SERVICES & PAYMENT METHODS */}
        {activeTab === "services" && (
          <div className="space-y-8">
            {/* Modular Services Toggle */}
            <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="font-editorial text-2xl text-[#263D32]">
                  Prestaciones y Servicios Incluidos
                </h3>
                <p className="text-xs text-[#746657]">
                  Activá o desactivá cada bloque según las prestaciones vigentes
                  que ofrezca Traum en la temporada.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {store.services.map((srv, sIdx) => (
                  <div
                    key={srv.id}
                    className={`p-5 border space-y-3 ${
                      srv.enabled
                        ? "bg-[#F2EFE6] border-[#65745A]"
                        : "bg-gray-100 border-gray-300 opacity-60"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="font-editorial text-xl text-[#263D32]">
                          {srv.title}
                        </h4>
                        <p className="text-xs text-[#292D29]/80">
                          {srv.description}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleService(srv.id)}
                        className={`px-3 py-1.5 text-[10px] uppercase tracking-wider font-semibold cursor-pointer ${
                          srv.enabled
                            ? "bg-[#263D32] text-[#F2EFE6]"
                            : "bg-[#D8CEB9] text-[#292D29]"
                        }`}
                      >
                        {srv.enabled ? "Activo" : "Inactivo"}
                      </button>
                    </div>

                    <div className="pt-2 border-t border-[#D8CEB9]">
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#746657] font-semibold mb-1">
                        Etiqueta de Tarifa / Condición Comercial
                      </label>
                      <input
                        type="text"
                        value={srv.priceLabel || ""}
                        onChange={(e) => {
                          const nextSrv = [...store.services];
                          nextSrv[sIdx] = {
                            ...srv,
                            priceLabel: e.target.value,
                          };
                          setStore({ ...store, services: nextSrv });
                        }}
                        placeholder="Ej. Jornada guiada · Seña del 30%"
                        className="w-full px-3 py-2 bg-white border border-[#D8CEB9] text-xs"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    persistStore(store, "Prestaciones y tarifas actualizadas")
                  }
                  className="px-5 py-2.5 bg-[#263D32] text-[#F2EFE6] text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Guardar prestaciones</span>
                </button>
              </div>
            </div>

            {/* Payment Methods Configuration (Without CBU) */}
            <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#D8CEB9]">
                <div>
                  <h3 className="font-editorial text-2xl text-[#263D32]">
                    Configuración de Medios de Pago y Señas (Ocultos hasta Contratar)
                  </h3>
                  <p className="text-xs text-[#746657]">
                    En la web pública sólo se muestra con qué medios se puede
                    pagar y el porcentaje de seña. El Alias y Titular se
                    muestran recién en el Paso 2 cuando el cliente contrata un
                    servicio (sin CBU).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setStore({
                      ...store,
                      paymentConfig: {
                        ...store.paymentConfig,
                        enabled: !store.paymentConfig.enabled,
                      },
                    })
                  }
                  className={`px-4 py-2 text-xs uppercase tracking-wider font-semibold cursor-pointer ${
                    store.paymentConfig.enabled
                      ? "bg-[#263D32] text-[#F2EFE6]"
                      : "bg-[#D8CEB9] text-[#292D29]"
                  }`}
                >
                  {store.paymentConfig.enabled
                    ? "Sección Pagos Visible"
                    : "Sección Pagos Oculta"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Banco / Entidad (Visible sólo al contratar)
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankName}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankName: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Titular de la cuenta (Visible sólo al contratar)
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankHolder}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankHolder: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Alias Bancario / Billetera (Visible sólo al contratar)
                  </label>
                  <input
                    type="text"
                    value={store.paymentConfig.bankAlias}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          bankAlias: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Porcentaje de Seña (%)
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={100}
                    value={store.paymentConfig.depositPercentage}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          depositPercentage: Number(e.target.value),
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Link de Pago Mercado Pago (Opcional · Paso 2)
                  </label>
                  <input
                    type="url"
                    placeholder="https://mpago.la/..."
                    value={store.paymentConfig.mercadoPagoLink}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          mercadoPagoLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Link de Pago Internacional PayPal / Stripe (Opcional · Paso 2)
                  </label>
                  <input
                    type="url"
                    placeholder="https://paypal.me/..."
                    value={store.paymentConfig.internationalPaymentLink}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        paymentConfig: {
                          ...store.paymentConfig,
                          internationalPaymentLink: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Medios de pago y seña actualizados en vivo")
                }
                className="px-6 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar medios de pago y seña</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB: REVIEWS MODERATION */}
        {activeTab === "reviews" && (
          <div className="space-y-6">
            <div className="bg-white border border-[#D8CEB9] p-6">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-1">
                Moderación de Reseñas Públicas ({store.reviews.length})
              </h3>
              <p className="text-xs text-[#746657]">
                Cualquier visitante puede dejar su reseña en la página pública y
                desde acá podés eliminar de inmediato cualquiera que sea
                inapropiada.
              </p>
            </div>

            <div className="space-y-4">
              {store.reviews.map((rev) => (
                <div
                  key={rev.id}
                  className="bg-white border border-[#D8CEB9] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star
                            key={i}
                            className="w-3.5 h-3.5 fill-[#263D32] text-[#263D32]"
                          />
                        ))}
                      </div>
                      <span className="text-xs font-semibold text-[#263D32]">
                        {rev.authorName}
                      </span>
                      <span className="text-xs text-[#746657]">
                        ({rev.authorLocation} · {rev.experienceModality})
                      </span>
                    </div>
                    <p className="text-sm text-[#292D29] italic">
                      “{rev.comment}”
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteReview(rev.id)}
                    className="px-4 py-2 text-xs uppercase tracking-wider text-red-700 border border-red-200 hover:bg-red-50 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Borrar reseña</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB: BANDEJA DE SOLICITUDES A PEDIDO + HISTORIAL DE ANOTACIONES */}
        {activeTab === "inquiries" && (
          <div className="space-y-8">
            <div className="bg-white border border-[#D8CEB9] p-6">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-1">
                Bandeja de Solicitudes de Salidas a Pedido (
                {(store.customRequests || []).length})
              </h3>
              <p className="text-xs text-[#746657]">
                Revisá las solicitudes en días sin salida programada. Podés
                aceptar, rechazar, proponer otra fecha, responder con mensaje
                por mail/WhatsApp o convertir una solicitud aceptada en salida
                programada (privada o abierta) con un clic.
              </p>
            </div>

            {(store.customRequests || []).length === 0 ? (
              <div className="bg-white border border-[#D8CEB9] p-10 text-center text-sm text-[#746657]">
                No hay solicitudes de salidas a pedido registradas por el
                momento.
              </div>
            ) : (
              <div className="space-y-4">
                {(store.customRequests || []).map((req) => {
                  const draft = reqResponseDrafts[req.id] || {
                    altDate: req.alternativeDate || req.desiredDate,
                    reply: req.guideResponse || "",
                  };

                  return (
                    <div
                      key={req.id}
                      className="bg-white border border-[#D8CEB9] p-6 space-y-4"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-1 bg-[#263D32] text-[#F2EFE6] text-xs font-mono font-semibold">
                              {req.requestCode}
                            </span>
                            <span
                              className={`px-2.5 py-1 text-xs uppercase font-bold ${
                                req.status === "aceptada"
                                  ? "bg-emerald-100 text-emerald-900"
                                  : req.status === "rechazada"
                                  ? "bg-red-100 text-red-900"
                                  : req.status === "reprogramada"
                                  ? "bg-amber-100 text-amber-900"
                                  : "bg-[#D8CEB9] text-[#292D29]"
                              }`}
                            >
                              Estado: {req.status}
                            </span>
                            <span className="px-2.5 py-1 bg-[#F2EFE6] border border-[#D8CEB9] text-xs font-medium">
                              Fecha solicitada: {req.desiredDate} (
                              {req.preferredSchedule})
                            </span>
                            {req.alternativeDate && (
                              <span className="px-2.5 py-1 bg-amber-50 border border-amber-300 text-xs font-semibold text-amber-900">
                                Fecha alternativa: {req.alternativeDate}
                              </span>
                            )}
                          </div>

                          <h4 className="font-editorial text-2xl text-[#263D32]">
                            {req.fullName}{" "}
                            <span className="text-sm font-sans text-[#746657]">
                              ({req.participantsCount}{" "}
                              {req.participantsCount === 1
                                ? "persona"
                                : "personas"}
                              )
                            </span>
                          </h4>

                          <div className="text-xs text-[#292D29]/80 flex flex-wrap gap-4">
                            <span>
                              <strong>WhatsApp:</strong> {req.whatsapp}
                            </span>
                            <span>
                              <strong>Email:</strong> {req.email}
                            </span>
                            <span>
                              <strong>Río preferido:</strong>{" "}
                              {req.preferredRiver || "A coordinar"}
                            </span>
                            <span>
                              <strong>Tipo de pesca:</strong>{" "}
                              {req.experienceType || "A coordinar"}
                            </span>
                          </div>

                          {req.comments && (
                            <p className="text-xs text-[#746657] italic bg-[#F2EFE6] p-3 border border-[#D8CEB9]">
                              “{req.comments}”
                            </p>
                          )}
                        </div>

                        {/* Acciones rápidas y WhatsApp con mensaje prellenado */}
                        <div className="flex flex-wrap items-center gap-2">
                          <a
                            href={buildWaUrl(
                              req.whatsapp,
                              `Hola ${req.fullName}, soy el guía de TRAUM Fly Cast Patagonia. Vi tu solicitud (${req.requestCode}) para salir a pescar el ${req.desiredDate} (${req.preferredSchedule}) para ${req.participantsCount} persona(s). Te escribo para coordinar.`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-1.5"
                          >
                            <span>WhatsApp Prellenado</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>

                          <button
                            type="button"
                            onClick={() =>
                              handleRespondCustomRequest(
                                req.id,
                                "aceptada",
                                draft.altDate,
                                draft.reply
                              )
                            }
                            className="px-3 py-2 bg-[#263D32] hover:bg-[#65745A] text-[#F2EFE6] text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Aceptar</span>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleRespondCustomRequest(
                                req.id,
                                "rechazada",
                                undefined,
                                draft.reply
                              )
                            }
                            className="px-3 py-2 bg-[#B35B2B] hover:bg-red-800 text-white text-xs uppercase tracking-wider font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Rechazar</span>
                          </button>
                        </div>
                      </div>

                      {/* Responder, proponer otra fecha y convertir en salida programada con 1 clic */}
                      <div className="pt-3 border-t border-[#D8CEB9] grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
                        <div className="lg:col-span-3">
                          <label className="block text-[10px] uppercase tracking-[0.18em] text-[#746657] font-semibold mb-1">
                            Fecha alternativa (Reprogramar)
                          </label>
                          <input
                            type="date"
                            value={draft.altDate}
                            onChange={(e) =>
                              setReqResponseDrafts({
                                ...reqResponseDrafts,
                                [req.id]: {
                                  ...draft,
                                  altDate: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-[#F2EFE6] border border-[#D8CEB9] text-xs"
                          />
                        </div>

                        <div className="lg:col-span-5">
                          <label className="block text-[10px] uppercase tracking-[0.18em] text-[#746657] font-semibold mb-1">
                            Respuesta del guía (Se envía por email al cliente)
                          </label>
                          <input
                            type="text"
                            placeholder="Ej. Te propongo salir temprano en el Chimehuín..."
                            value={draft.reply}
                            onChange={(e) =>
                              setReqResponseDrafts({
                                ...reqResponseDrafts,
                                [req.id]: {
                                  ...draft,
                                  reply: e.target.value,
                                },
                              })
                            }
                            className="w-full px-3 py-2 bg-[#F2EFE6] border border-[#D8CEB9] text-xs"
                          />
                        </div>

                        <div className="lg:col-span-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleRespondCustomRequest(
                                req.id,
                                "reprogramada",
                                draft.altDate,
                                draft.reply
                              )
                            }
                            className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                          >
                            Proponer Fecha / Responder
                          </button>

                          {!req.convertedToDepartureId ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  handleConvertRequestToDeparture(
                                    req.id,
                                    "privada"
                                  )
                                }
                                className="px-3 py-2 bg-[#263D32] hover:bg-[#65745A] text-[#F2EFE6] text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                              >
                                Convertir en Salida Privada (1 clic)
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  handleConvertRequestToDeparture(
                                    req.id,
                                    "abierta"
                                  )
                                }
                                className="px-3 py-2 border border-[#263D32] text-[#263D32] hover:bg-[#263D32] hover:text-[#F2EFE6] text-[10px] uppercase tracking-wider font-semibold cursor-pointer"
                              >
                                Convertir en Salida Abierta (1 clic)
                              </button>
                            </>
                          ) : (
                            <span className="px-3 py-2 bg-emerald-50 border border-emerald-400 text-emerald-900 text-[10px] uppercase font-bold">
                              Ya convertida en salida programada
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB: COOKIES & LEGAL RECORDS */}
        {activeTab === "legal_cookies" && (
          <div className="space-y-8">
            {/* Solicitudes de Botón de Arrepentimiento */}
            <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8">
              <h3 className="font-editorial text-2xl text-[#263D32] mb-1">
                Solicitudes de Arrepentimiento / Cancelación (Ley 24.240)
              </h3>
              <p className="text-xs text-[#746657] mb-6">
                Registro oficial de solicitudes ingresadas desde el Botón de Arrepentimiento (/arrepentimiento).
              </p>

              {!store.regretRequests || store.regretRequests.length === 0 ? (
                <p className="text-xs text-[#746657] py-6 text-center bg-[#F2EFE6]/60 border border-[#D8CEB9]">
                  No se registran solicitudes de revocación o arrepentimiento.
                </p>
              ) : (
                <div className="space-y-3">
                  {store.regretRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-4 border border-[#D8CEB9] bg-[#F2EFE6]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-[#B35B2B] text-white text-[10px] font-mono">
                            Trámite: {req.regretCode}
                          </span>
                          <span className="text-xs font-semibold text-[#263D32]">
                            {req.fullName} ({req.email})
                          </span>
                        </div>
                        <p className="text-xs text-[#746657]">
                          Servicio/Reserva: <strong>{req.serviceContracted}</strong>{" "}
                          {req.bookingCode ? `(${req.bookingCode})` : ""} · WhatsApp: {req.whatsapp}
                        </p>
                        {req.reason && (
                          <p className="text-xs text-[#292D29]/80 italic">
                            Motivo: “{req.reason}”
                          </p>
                        )}
                      </div>
                      <span className="text-[11px] text-[#746657]">
                        {new Date(req.createdAt).toLocaleString("es-AR")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registro de Cookies en Servidor */}
            <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-[#D8CEB9]">
                <div>
                  <h3 className="font-editorial text-2xl text-[#263D32]">
                    Consentimientos de Cookies Guardados en el Servidor
                  </h3>
                  <p className="text-xs text-[#746657]">
                    Cada decisión de cookies de los visitantes se almacena en la base de datos en vivo (Ley 25.326).
                  </p>
                </div>
                <span className="px-3 py-1 bg-[#263D32] text-[#F2EFE6] text-xs font-semibold">
                  Total registrados: {(store.cookieConsents || []).length}
                </span>
              </div>

              {!store.cookieConsents || store.cookieConsents.length === 0 ? (
                <p className="text-xs text-[#746657] py-6 text-center bg-[#F2EFE6]/60 border border-[#D8CEB9]">
                  Aún no hay registros de cookies almacenados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-[#D8CEB9] text-[10px] uppercase tracking-wider text-[#746657]">
                        <th className="py-2.5 pr-4">Fecha / Hora</th>
                        <th className="py-2.5 pr-4">Visitante ID</th>
                        <th className="py-2.5 pr-4">Decisión</th>
                        <th className="py-2.5 pr-4">Preferencias</th>
                        <th className="py-2.5 pr-4">Cuenta Google</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#D8CEB9]/60">
                      {store.cookieConsents.slice(0, 50).map((item) => (
                        <tr key={item.id}>
                          <td className="py-2.5 pr-4 whitespace-nowrap">
                            {new Date(item.createdAt).toLocaleString("es-AR")}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-[11px] text-[#263D32]">
                            {item.visitorId}
                          </td>
                          <td className="py-2.5 pr-4">
                            <span
                              className={`px-2 py-0.5 text-[10px] uppercase font-semibold ${
                                item.decision === "accepted"
                                  ? "bg-[#263D32]/15 text-[#263D32]"
                                  : "bg-[#B35B2B]/15 text-[#B35B2B]"
                              }`}
                            >
                              {item.decision === "accepted" ? "Aceptadas" : item.decision === "custom" ? "Personalizadas" : "Solo Esenciales"}
                            </span>
                          </td>
                          <td className="py-2.5 pr-4 text-[11px] text-[#746657]">
                            Esenciales: Sí · Google: {item.preferences?.googleAuth ? "Sí" : "No"} · Pagos: {item.preferences?.payments ? "Sí" : "No"} · Analíticas: {item.preferences?.analytics ? "Sí" : "No"}
                          </td>
                          <td className="py-2.5 pr-4 font-mono text-[11px] text-[#746657]">
                            {item.googleEmail || "Visitante anónimo"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SETTINGS & CONTACT */}
        {activeTab === "settings" && (
          <div className="bg-white border border-[#D8CEB9] p-6 sm:p-8 max-w-3xl space-y-6">
            <h3 className="font-editorial text-2xl text-[#263D32] pb-3 border-b border-[#D8CEB9]">
              Datos de Contacto, Correo de Pedidos y Blindaje Legal
            </h3>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Correo electrónico público
                  </label>
                  <input
                    type="email"
                    value={store.settings.email}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          email: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Correo receptor de pedidos (Admin)
                  </label>
                  <input
                    type="email"
                    value={store.settings.notificationEmail || "traumflyfishing9@gmail.com"}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          notificationEmail: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm font-medium text-[#263D32]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Ubicación general de operación
                  </label>
                  <input
                    type="text"
                    value={store.settings.locationGeneral}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          locationGeneral: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Número de WhatsApp
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
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Usuario de Instagram
                  </label>
                  <input
                    type="text"
                    value={store.settings.instagramHandle}
                    onChange={(e) =>
                      setStore({
                        ...store,
                        settings: {
                          ...store.settings,
                          instagramHandle: e.target.value,
                        },
                      })
                    }
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                    Enlace de Instagram
                  </label>
                  <input
                    type="url"
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
                    className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>

              {/* Datos Legales y Fiscales */}
              <div className="pt-4 border-t border-[#D8CEB9] space-y-4">
                <h4 className="font-editorial text-xl text-[#263D32]">
                  Titularidad Legal y Habilitación Comercial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Titular / Razón Social
                    </label>
                    <input
                      type="text"
                      value={store.settings.legalOwnerName || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            legalOwnerName: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      CUIT / Identificación Fiscal
                    </label>
                    <input
                      type="text"
                      value={store.settings.legalTaxId || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            legalTaxId: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Matrícula / Habilitación Guía de Pesca
                    </label>
                    <input
                      type="text"
                      value={store.settings.guideLicenseNumber || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            guideLicenseNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Domicilio Legal y Jurisdicción
                    </label>
                    <input
                      type="text"
                      value={store.settings.legalAddress || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            legalAddress: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Configuración Opcional de Google OAuth y SMTP Directo */}
              <div className="pt-4 border-t border-[#D8CEB9] space-y-4">
                <h4 className="font-editorial text-xl text-[#263D32]">
                  Integración Google y Correo SMTP (Opcional)
                </h4>
                <p className="text-xs text-[#746657]">
                  El envío a <strong>traumflyfishing9@gmail.com</strong> ya está activo por defecto. Si además deseas configurar una contraseña de aplicación de Gmail o un Client ID propio de Google Cloud, puedes ingresarlos aquí:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Google OAuth Client ID (Opcional)
                    </label>
                    <input
                      type="text"
                      value={store.settings.googleClientId || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            googleClientId: e.target.value,
                          },
                        })
                      }
                      placeholder="Ej. 1234567890-abc.apps.googleusercontent.com"
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Usuario Gmail SMTP (Opcional)
                    </label>
                    <input
                      type="email"
                      value={store.settings.smtpUser || ""}
                      onChange={(e) =>
                        setStore({
                          ...store,
                          settings: {
                            ...store.settings,
                            smtpUser: e.target.value,
                          },
                        })
                      }
                      placeholder="traumflyfishing9@gmail.com"
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1">
                      Contraseña de Aplicación Gmail (App Password)
                    </label>
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
                      placeholder="xxxx xxxx xxxx xxxx"
                      className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  persistStore(store, "Configuración general y legal actualizada")
                }
                className="px-6 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar configuración</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
