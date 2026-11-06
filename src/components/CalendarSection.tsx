"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
  BlockedDay,
  CalendarDeparture,
  CustomTripRequest,
  DepartureEnrollment,
  DestinationItem,
  ExperienceModality,
  PreferredScheduleType,
} from "@/types/traum";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Clock,
  MapPin,
  Compass,
  CheckCircle2,
  AlertCircle,
  Ban,
  Filter,
  RotateCcw,
} from "lucide-react";

interface CalendarSectionProps {
  departures: CalendarDeparture[];
  blockedDays?: BlockedDay[];
  destinations?: DestinationItem[];
  onDataChanged?: () => void;
  onRequestBookingFromCalendar?: (prefill: {
    date: string;
    departureId?: string;
    requiresDeposit?: boolean;
    availableSpots?: number | null;
    maxParticipants?: number;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
    priceReference?: string;
    paymentLink?: string;
  }) => void;
}

const MONTH_NAMES = [
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

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

const FISHING_TYPES: ExperienceModality[] = [
  "Pesca de vadeo",
  "Pesca en balsa",
  "Salida personalizada",
];

const SCHEDULES: PreferredScheduleType[] = ["Mañana", "Tarde", "Todo el día"];

function getClientArgentinaToday(): string {
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

export default function CalendarSection({
  departures,
  blockedDays = [],
  destinations = [],
  onDataChanged,
}: CalendarSectionProps) {
  const [todayAR, setTodayAR] = useState<string>("2026-11-05");

  const [currentMonth, setCurrentMonth] = useState<number>(10); // Noviembre
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-11-12");

  // Filtros de calendario
  const [filterRiver, setFilterRiver] = useState<string>("ALL");
  const [filterType, setFilterType] = useState<string>("ALL");

  // Estado del formulario de Anotación en Salida Programada
  const [activeEnrollmentDepId, setActiveEnrollmentDepId] = useState<
    string | null
  >(null);
  const [enrollName, setEnrollName] = useState("");
  const [enrollPhone, setEnrollPhone] = useState("");
  const [enrollEmail, setEnrollEmail] = useState("");
  const [enrollCount, setEnrollCount] = useState(1);
  const [enrollComments, setEnrollComments] = useState("");
  const [enrollHoneypot, setEnrollHoneypot] = useState("");
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState("");
  const [waitlistPrompt, setWaitlistPrompt] = useState<{
    availableSpots: number;
    requestedSpots: number;
  } | null>(null);
  const [confirmedEnrollment, setConfirmedEnrollment] = useState<{
    enrollment: DepartureEnrollment;
    departure: CalendarDeparture;
  } | null>(null);

  // Estado del formulario de Solicitud de Salida a Pedido
  const [showCustomRequestForm, setShowCustomRequestForm] = useState(false);
  const [reqSchedule, setReqSchedule] =
    useState<PreferredScheduleType>("Todo el día");
  const [reqRiver, setReqRiver] = useState("");
  const [reqType, setReqType] = useState<string>("");
  const [reqCount, setReqCount] = useState(2);
  const [reqName, setReqName] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqMessage, setReqMessage] = useState("");
  const [reqHoneypot, setReqHoneypot] = useState("");
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqError, setReqError] = useState("");
  const [confirmedCustomRequest, setConfirmedCustomRequest] = useState<{
    request: CustomTripRequest;
    message: string;
  } | null>(null);

  useEffect(() => {
    const arToday = getClientArgentinaToday();
    setTodayAR(arToday);
    // Si la fecha actual es posterior a noviembre 2026 o si queremos centrar en la primera salida futura
    const upcoming = departures
      .filter((d) => d.status !== "cancelada" && d.date >= arToday)
      .sort((a, b) => a.date.localeCompare(b.date))[0];
    if (upcoming) {
      const [y, m] = upcoming.date.split("-").map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
      setSelectedDateStr(upcoming.date);
    } else {
      const [y, m] = arToday.split("-").map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
      setSelectedDateStr(arToday);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Lista única de ríos para el filtro y selector
  const riverOptions = useMemo(() => {
    const set = new Set<string>();
    for (const d of departures) {
      if (d.destination) set.add(d.destination);
    }
    for (const dest of destinations) {
      if (dest.name) set.add(dest.name);
    }
    return Array.from(set);
  }, [departures, destinations]);

  // Salidas activas filtradas por río y tipo de pesca
  const filteredActiveDepartures = useMemo(() => {
    return departures.filter((dep) => {
      if (dep.status === "cancelada") return false;
      if (filterRiver !== "ALL") {
        const depLower = dep.destination.toLowerCase();
        const filterLower = filterRiver.toLowerCase();
        if (
          !depLower.includes(filterLower) &&
          !filterLower.includes(depLower)
        ) {
          return false;
        }
      }
      if (filterType !== "ALL" && dep.experienceType !== filterType) {
        return false;
      }
      return true;
    });
  }, [departures, filterRiver, filterType]);

  // Todas las salidas activas por fecha (sin filtro) para validar si el día permite solicitud a pedido
  const allActiveDeparturesByDate = useMemo(() => {
    const map: Record<string, CalendarDeparture[]> = {};
    for (const dep of departures) {
      if (dep.status === "cancelada") continue;
      if (!map[dep.date]) map[dep.date] = [];
      map[dep.date].push(dep);
    }
    return map;
  }, [departures]);

  // Salidas filtradas por fecha para mostrar en grilla
  const departuresByDate = useMemo(() => {
    const map: Record<string, CalendarDeparture[]> = {};
    for (const dep of filteredActiveDepartures) {
      if (!map[dep.date]) {
        map[dep.date] = [];
      }
      map[dep.date].push(dep);
    }
    return map;
  }, [filteredActiveDepartures]);

  const blockedByDate = useMemo(() => {
    const map: Record<string, BlockedDay> = {};
    for (const b of blockedDays) {
      map[b.date] = b;
    }
    return map;
  }, [blockedDays]);

  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;

    const cells: Array<{ day: number | null; dateStr: string | null }> = [];
    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateStr: null });
    }
    for (let d = 1; d <= totalDays; d++) {
      const monthPadded = String(currentMonth + 1).padStart(2, "0");
      const dayPadded = String(d).padStart(2, "0");
      cells.push({
        day: d,
        dateStr: `${currentYear}-${monthPadded}-${dayPadded}`,
      });
    }
    return cells;
  }, [currentMonth, currentYear]);

  const handleSelectDate = (dateStr: string) => {
    setSelectedDateStr(dateStr);
    setActiveEnrollmentDepId(null);
    setWaitlistPrompt(null);
    setEnrollError("");
    setConfirmedEnrollment(null);
    setShowCustomRequestForm(false);
    setReqError("");
    setConfirmedCustomRequest(null);
  };

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    const [y, m] = todayAR.split("-").map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
    handleSelectDate(todayAR);
  };

  const formatReadableDate = (isoDate: string) => {
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    return `${d} de ${MONTH_NAMES[m] || ""} de ${y}`;
  };

  // Estado del día seleccionado
  const selectedIsPast = selectedDateStr < todayAR;
  const selectedBlocked = blockedByDate[selectedDateStr];
  const selectedDepartures = selectedDateStr
    ? departuresByDate[selectedDateStr] || []
    : [];
  const selectedUnfilteredDepartures = selectedDateStr
    ? allActiveDeparturesByDate[selectedDateStr] || []
    : [];

  // Enviar anotación en salida programada
  const submitEnrollment = async (
    departure: CalendarDeparture,
    acceptWaitlistFlag: boolean
  ) => {
    setEnrollError("");
    if (enrollName.trim().length < 2) {
      setEnrollError("Ingresá tu nombre y apellido.");
      return;
    }
    if (enrollPhone.replace(/\D/g, "").length < 6) {
      setEnrollError("Ingresá un teléfono o WhatsApp válido.");
      return;
    }
    if (!enrollEmail.includes("@")) {
      setEnrollError("Ingresá un email válido.");
      return;
    }

    setEnrollSubmitting(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "ENROLL_DEPARTURE",
          departureId: departure.id,
          fullName: enrollName.trim(),
          whatsapp: enrollPhone.trim(),
          email: enrollEmail.trim(),
          participantsCount: enrollCount,
          comments: enrollComments.trim(),
          acceptWaitlist: acceptWaitlistFlag,
          website_hp: enrollHoneypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.canJoinWaitlist) {
          setWaitlistPrompt({
            availableSpots: Number(data.availableSpots) || 0,
            requestedSpots: Number(data.requestedSpots) || enrollCount,
          });
          setEnrollError(data.error || "");
          return;
        }
        setEnrollError(data.error || "No se pudo completar la anotación.");
        return;
      }

      setConfirmedEnrollment({
        enrollment: data.enrollment,
        departure: data.departure || departure,
      });
      setWaitlistPrompt(null);
      setActiveEnrollmentDepId(null);
      if (onDataChanged) onDataChanged();
    } catch {
      setEnrollError("Error de conexión. Intentá nuevamente.");
    } finally {
      setEnrollSubmitting(false);
    }
  };

  // Enviar solicitud de salida a pedido
  const submitCustomRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqError("");

    if (reqName.trim().length < 2) {
      setReqError("Ingresá tu nombre y apellido.");
      return;
    }
    if (reqPhone.replace(/\D/g, "").length < 6) {
      setReqError("Ingresá un teléfono o WhatsApp válido.");
      return;
    }
    if (!reqEmail.includes("@")) {
      setReqError("Ingresá un email válido.");
      return;
    }

    setReqSubmitting(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "CREATE_CUSTOM_REQUEST",
          desiredDate: selectedDateStr,
          preferredSchedule: reqSchedule,
          preferredRiver: reqRiver || undefined,
          experienceType: reqType || undefined,
          participantsCount: reqCount,
          fullName: reqName.trim(),
          whatsapp: reqPhone.trim(),
          email: reqEmail.trim(),
          comments: reqMessage.trim(),
          website_hp: reqHoneypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setReqError(data.error || "No se pudo enviar la solicitud.");
        return;
      }

      setConfirmedCustomRequest({
        request: data.customRequest,
        message:
          data.confirmationMessage ||
          "El guía te va a contactar para coordinar. No se requiere seña ni pago por este medio.",
      });
      setShowCustomRequestForm(false);
      if (onDataChanged) onDataChanged();
    } catch {
      setReqError("Error de conexión. Intentá nuevamente.");
    } finally {
      setReqSubmitting(false);
    }
  };

  return (
    <section
      id="calendario"
      className="py-20 sm:py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-10 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[1px] bg-[#263D32]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                Calendario de salidas y reservas (UTC-3 Argentina)
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-tight">
              El próximo sueño{" "}
              <span className="italic text-[#746657]">tiene fecha.</span>
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#292D29]/80 max-w-md font-light leading-relaxed">
            Anotate directamente en una{" "}
            <strong className="font-medium text-[#263D32]">
              salida programada
            </strong>{" "}
            o elegí cualquier día libre del calendario para solicitar una{" "}
            <strong className="font-medium text-[#263D32]">
              salida a pedido
            </strong>{" "}
            directamente con el guía.
          </p>
        </div>

        {/* Barra de Filtros por Río y Tipo de Pesca */}
        <div className="bg-[#D8CEB9]/35 border border-[#D8CEB9] p-4 sm:p-5 mb-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs uppercase tracking-[0.2em] text-[#263D32] font-semibold">
            <Filter className="w-4 h-4 text-[#65745A]" />
            <span>Filtrar salidas programadas:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1 max-w-2xl">
            <select
              value={filterRiver}
              onChange={(e) => setFilterRiver(e.target.value)}
              className="px-3.5 py-2.5 bg-[#F2EFE6] border border-[#D8CEB9] text-xs text-[#292D29] focus:outline-none focus:border-[#263D32]"
              aria-label="Filtrar por río"
            >
              <option value="ALL">Todos los ríos y ambientes</option>
              {riverOptions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3.5 py-2.5 bg-[#F2EFE6] border border-[#D8CEB9] text-xs text-[#292D29] focus:outline-none focus:border-[#263D32]"
              aria-label="Filtrar por tipo de pesca"
            >
              <option value="ALL">Todos los tipos de pesca</option>
              {FISHING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              {(filterRiver !== "ALL" || filterType !== "ALL") && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterRiver("ALL");
                    setFilterType("ALL");
                  }}
                  className="px-3 py-2.5 bg-white border border-[#D8CEB9] hover:border-[#263D32] text-xs text-[#263D32] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpiar</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleJumpToToday}
                className="w-full px-3.5 py-2.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer"
              >
                Ir a Hoy
              </button>
            </div>
          </div>
        </div>

        {/* Interactive Calendar + Selected Date Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left: Calendar Grid (7 columns) */}
          <div className="lg:col-span-7 bg-[#F2EFE6] border border-[#D8CEB9] shadow-lg p-3.5 sm:p-6 lg:p-8">
            {/* Month Navigator */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-[#D8CEB9]">
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#746657] block">
                  Temporada de Pesca · Patagonia
                </span>
                <h3 className="font-editorial text-2xl sm:text-3xl lg:text-4xl text-[#263D32]">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="w-10 h-10 border border-[#746657]/40 hover:bg-[#263D32] hover:text-[#F2EFE6] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Mes anterior"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="w-10 h-10 border border-[#746657]/40 hover:bg-[#263D32] hover:text-[#F2EFE6] flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Mes siguiente"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Weekday Headers */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 sm:mb-3 text-center">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="text-[10px] sm:text-[11px] uppercase tracking-[0.14em] sm:tracking-[0.18em] text-[#746657] font-semibold py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 sm:gap-2">
              {calendarDays.map((cell, index) => {
                if (!cell.day || !cell.dateStr) {
                  return (
                    <div
                      key={`empty-${index}`}
                      className="aspect-square bg-[#D8CEB9]/15 border border-transparent"
                    />
                  );
                }

                const dateStr = cell.dateStr;
                const isPast = dateStr < todayAR;
                const isToday = dateStr === todayAR;
                const isBlocked = Boolean(blockedByDate[dateStr]);
                const dayDepartures = departuresByDate[dateStr] || [];
                const hasDepartures = dayDepartures.length > 0;
                const isSelected = selectedDateStr === dateStr;

                // Cálculo de cupos totales disponibles en ese día
                const totalAvailableSpots = dayDepartures.reduce(
                  (acc, dep) =>
                    acc + Math.max(0, Number(dep.availableSpots ?? dep.maxParticipants)),
                  0
                );

                // Reglas de colores del calendario mensual:
                // - Tachado: bloqueado o fecha pasada
                // - Verde: salida con cupo (> 2 cupos libres)
                // - Amarillo: <= 2 cupos libres (1 o 2 cupos)
                // - Rojo: completa (0 cupos libres, con lista de espera)
                // - Gris: sin salida (se puede solicitar salida a pedido)
                let colorClasses =
                  "bg-[#E6E2D8]/70 text-[#292D29] border-[#D8CEB9] hover:border-[#746657]"; // Gris: sin salida
                let badgeDotColor = "bg-[#746657]";
                let statusShortLabel = "A pedido";

                if (isBlocked || isPast) {
                  colorClasses =
                    "bg-[#D8CEB9]/25 text-[#746657]/60 border-[#D8CEB9]/60 cursor-pointer";
                  badgeDotColor = "bg-[#746657]/40";
                  statusShortLabel = isBlocked ? "Bloqueado" : "Pasado";
                } else if (hasDepartures) {
                  if (totalAvailableSpots === 0) {
                    // Rojo: completa (con lista de espera)
                    colorClasses =
                      "bg-red-900/15 text-red-900 border-red-700/50 hover:bg-red-900/25";
                    badgeDotColor = "bg-red-700";
                    statusShortLabel = "Completa";
                  } else if (totalAvailableSpots <= 2) {
                    // Amarillo: <= 2 cupos
                    colorClasses =
                      "bg-amber-500/20 text-amber-950 border-amber-600/60 hover:bg-amber-500/30";
                    badgeDotColor = "bg-amber-600";
                    statusShortLabel = `${totalAvailableSpots} cupo${
                      totalAvailableSpots === 1 ? "" : "s"
                    }`;
                  } else {
                    // Verde: salida con cupo (> 2 cupos)
                    colorClasses =
                      "bg-emerald-800/15 text-[#263D32] border-emerald-700/60 hover:bg-emerald-800/25";
                    badgeDotColor = "bg-emerald-700";
                    statusShortLabel = `${totalAvailableSpots} cupos`;
                  }
                }

                if (isSelected) {
                  colorClasses =
                    "bg-[#263D32] text-[#F2EFE6] border-[#263D32] shadow-md ring-2 ring-[#263D32]/30";
                }

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => handleSelectDate(dateStr)}
                    className={`aspect-square p-1.5 sm:p-2 border transition-all duration-200 flex flex-col items-start justify-between relative cursor-pointer ${colorClasses}`}
                  >
                    <div className="w-full flex items-center justify-between">
                      <span
                        className={`text-xs sm:text-sm font-semibold ${
                          isBlocked || isPast ? "line-through opacity-75" : ""
                        }`}
                      >
                        {cell.day}
                      </span>
                      {isToday && (
                        <span
                          className={`text-[8px] sm:text-[9px] uppercase tracking-wider px-1 py-0.5 font-bold ${
                            isSelected
                              ? "bg-[#D8CEB9] text-[#263D32]"
                              : "bg-[#263D32] text-[#F2EFE6]"
                          }`}
                        >
                          Hoy
                        </span>
                      )}
                    </div>

                    <div className="w-full flex items-center justify-between mt-auto">
                      <span
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          isSelected ? "bg-[#D8CEB9]" : badgeDotColor
                        }`}
                      />
                      <span
                        className={`hidden sm:inline text-[9px] uppercase tracking-wider truncate pl-1 ${
                          isSelected
                            ? "text-[#D8CEB9]"
                            : isBlocked || isPast
                            ? "text-[#746657]/70 line-through"
                            : "font-semibold"
                        }`}
                      >
                        {statusShortLabel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Leyenda visible con los 5 estados */}
            <div className="mt-6 pt-5 border-t border-[#D8CEB9] grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-[11px] text-[#292D29]/85">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-emerald-800/20 border border-emerald-700 inline-block flex-shrink-0" />
                <span>Verde: Salida con cupo</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-amber-500/25 border border-amber-600 inline-block flex-shrink-0" />
                <span>Amarillo: Últimos ≤ 2 cupos</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-red-900/20 border border-red-700 inline-block flex-shrink-0" />
                <span>Rojo: Completa (Lista de espera)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 bg-[#E6E2D8] border border-[#D8CEB9] inline-block flex-shrink-0" />
                <span>Gris: Sin salida (A pedido)</span>
              </div>
              <div className="flex items-center gap-2 col-span-2 sm:col-span-2">
                <span className="w-3.5 h-3.5 bg-[#D8CEB9]/30 border border-[#D8CEB9] inline-flex items-center justify-center text-[9px] line-through text-[#746657] flex-shrink-0">
                  15
                </span>
                <span>Tachado: Día bloqueado o fecha pasada</span>
              </div>
            </div>
          </div>

          {/* Right: Selected Date Information Sheet (5 columns) */}
          <div className="lg:col-span-5 bg-[#263D32] text-[#F2EFE6] p-5 sm:p-7 lg:p-9 border border-[#65745A]/40 shadow-xl">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#899487]/30">
              <div>
                <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9] block mb-1">
                  {selectedDateStr === todayAR
                    ? "Hoy en Patagonia (UTC-3)"
                    : "Fecha seleccionada"}
                </span>
                <h4 className="font-editorial text-2xl sm:text-3xl text-[#F2EFE6]">
                  {selectedDateStr
                    ? formatReadableDate(selectedDateStr)
                    : "Seleccioná un día"}
                </h4>
              </div>
              <CalendarIcon className="w-6 h-6 text-[#D8CEB9]" />
            </div>

            {/* Confirmación de Anotación Exitosa */}
            {confirmedEnrollment && (
              <div className="mb-6 p-5 bg-[#292D29]/80 border border-[#D8CEB9] space-y-3">
                <div className="flex items-center gap-2 text-[#D8CEB9]">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold">
                    {confirmedEnrollment.enrollment.status === "lista_espera"
                      ? "¡Quedaste anotado en la lista de espera!"
                      : "¡Tu anotación está confirmada!"}
                  </span>
                </div>
                <p className="text-xs text-[#F2EFE6]/90 leading-relaxed">
                  {confirmedEnrollment.enrollment.status === "lista_espera"
                    ? "Si se libera un lugar en esta salida, el guía te va a contactar de inmediato por WhatsApp o email para confirmar tu ingreso."
                    : "Tus lugares ya fueron descontados del cupo de la salida y enviamos el resumen a tu correo y al guía."}
                </p>
                <div className="p-3.5 bg-[#263D32]/90 border border-[#899487]/30 text-xs space-y-1">
                  <div>
                    <strong>Código:</strong>{" "}
                    {confirmedEnrollment.enrollment.bookingCode}
                  </div>
                  <div>
                    <strong>Salida:</strong>{" "}
                    {confirmedEnrollment.departure.destination} (
                    {confirmedEnrollment.departure.experienceType})
                  </div>
                  <div>
                    <strong>Fecha y horario:</strong>{" "}
                    {confirmedEnrollment.departure.date} ·{" "}
                    {confirmedEnrollment.departure.startTime}
                    {confirmedEnrollment.departure.endTime
                      ? ` a ${confirmedEnrollment.departure.endTime} hs`
                      : " hs"}
                  </div>
                  <div>
                    <strong>Pescadores:</strong>{" "}
                    {confirmedEnrollment.enrollment.participantsCount} (
                    {confirmedEnrollment.enrollment.fullName})
                  </div>
                </div>
              </div>
            )}

            {/* Confirmación de Solicitud a Pedido Exitosa */}
            {confirmedCustomRequest && (
              <div className="mb-6 p-5 bg-[#292D29]/80 border border-[#D8CEB9] space-y-3">
                <div className="flex items-center gap-2 text-[#D8CEB9]">
                  <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold">
                    Solicitud recibida ({confirmedCustomRequest.request.requestCode})
                  </span>
                </div>
                <p className="text-sm text-[#F2EFE6] font-medium leading-relaxed">
                  {confirmedCustomRequest.message}
                </p>
                <div className="p-3.5 bg-[#263D32]/90 border border-[#899487]/30 text-xs space-y-1 text-[#D8CEB9]">
                  <div>
                    <strong>Fecha solicitada:</strong>{" "}
                    {confirmedCustomRequest.request.desiredDate} (
                    {confirmedCustomRequest.request.preferredSchedule})
                  </div>
                  {confirmedCustomRequest.request.preferredRiver && (
                    <div>
                      <strong>Río preferido:</strong>{" "}
                      {confirmedCustomRequest.request.preferredRiver}
                    </div>
                  )}
                  {confirmedCustomRequest.request.experienceType && (
                    <div>
                      <strong>Modalidad preferida:</strong>{" "}
                      {confirmedCustomRequest.request.experienceType}
                    </div>
                  )}
                  <div>
                    <strong>Personas:</strong>{" "}
                    {confirmedCustomRequest.request.participantsCount} ·{" "}
                    <strong>Contacto:</strong>{" "}
                    {confirmedCustomRequest.request.whatsapp}
                  </div>
                </div>
              </div>
            )}

            {/* CASO 1: DÍA BLOQUEADO */}
            {selectedBlocked ? (
              <div className="p-6 bg-[#292D29]/60 border border-[#899487]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#E59872]">
                  <Ban className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold">
                    Día bloqueado / No disponible
                  </span>
                </div>
                <p className="text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                  Esta fecha no está disponible para salidas programadas ni para
                  solicitudes a pedido.
                </p>
                {selectedBlocked.reason && (
                  <p className="text-xs text-[#D8CEB9] italic border-l-2 border-[#D8CEB9]/40 pl-3">
                    Motivo: {selectedBlocked.reason}
                  </p>
                )}
              </div>
            ) : selectedIsPast ? (
              /* CASO 2: FECHA PASADA */
              <div className="p-6 bg-[#292D29]/60 border border-[#899487]/30 space-y-3">
                <div className="flex items-center gap-2 text-[#D8CEB9]">
                  <Clock className="w-5 h-5" />
                  <span className="text-xs uppercase tracking-[0.2em] font-semibold">
                    Fecha pasada
                  </span>
                </div>
                <p className="text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                  Esta fecha ya transcurrió. Seleccioná un día a partir de hoy (
                  {formatReadableDate(todayAR)}) para anotarte en una salida o
                  solicitar una fecha a medida.
                </p>
              </div>
            ) : selectedUnfilteredDepartures.length > 0 ? (
              /* CASO 3: DÍA CON SALIDA(S) PROGRAMADA(S) */
              <div className="space-y-6">
                {(selectedDepartures.length > 0
                  ? selectedDepartures
                  : selectedUnfilteredDepartures
                ).map((dep) => {
                  const isFull = dep.availableSpots <= 0;
                  const isLow = dep.availableSpots > 0 && dep.availableSpots <= 2;
                  const isFormOpen = activeEnrollmentDepId === dep.id;

                  return (
                    <div
                      key={dep.id}
                      className="space-y-4 bg-[#292D29]/50 p-5 border border-[#899487]/35"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D8CEB9] block mb-1">
                            Salida Programada
                          </span>
                          <div className="flex items-center gap-2 text-xl font-editorial text-[#F2EFE6]">
                            <MapPin className="w-4 h-4 text-[#D8CEB9] flex-shrink-0" />
                            <span>{dep.destination}</span>
                          </div>
                        </div>

                        <span
                          className={`px-2.5 py-1 text-[10px] uppercase tracking-wider font-semibold border ${
                            isFull
                              ? "bg-red-950/80 text-red-200 border-red-600/50"
                              : isLow
                              ? "bg-amber-900/60 text-amber-200 border-amber-500/50"
                              : "bg-emerald-950/70 text-emerald-200 border-emerald-500/50"
                          }`}
                        >
                          {isFull
                            ? "Completa · Lista de espera"
                            : `${dep.availableSpots} de ${dep.maxParticipants} cupos libres`}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#899487]/20 text-xs">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#899487] block">
                            Tipo de pesca
                          </span>
                          <span className="text-sm font-medium text-[#D8CEB9]">
                            {dep.experienceType}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#899487] block">
                            Horario
                          </span>
                          <span className="text-sm font-medium text-[#F2EFE6] inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-[#D8CEB9]" />
                            {dep.startTime || "08:00"}
                            {dep.endTime ? ` a ${dep.endTime} hs` : " hs"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#899487] block">
                            Cupos totales
                          </span>
                          <span className="text-sm font-medium text-[#F2EFE6] inline-flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-[#D8CEB9]" />
                            {dep.maxParticipants} personas máx.
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#899487] block">
                            Disponibilidad actual
                          </span>
                          <span
                            className={`text-sm font-semibold ${
                              isFull ? "text-[#E59872]" : "text-[#D8CEB9]"
                            }`}
                          >
                            {isFull
                              ? "0 cupos (Podés sumarte a lista de espera)"
                              : `${dep.availableSpots} lugar(es) disponible(s)`}
                          </span>
                        </div>
                      </div>

                      {dep.additionalInfo && (
                        <div className="pt-2 border-t border-[#899487]/20">
                          <span className="text-[10px] uppercase tracking-[0.18em] text-[#899487] block mb-1">
                            Notas del guía
                          </span>
                          <p className="text-xs text-[#F2EFE6]/85 font-light leading-relaxed">
                            {dep.additionalInfo}
                          </p>
                        </div>
                      )}

                      {!isFormOpen ? (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveEnrollmentDepId(dep.id);
                            setEnrollCount(1);
                            setEnrollError("");
                            setWaitlistPrompt(null);
                            setConfirmedEnrollment(null);
                          }}
                          className="w-full py-3.5 px-5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Compass className="w-4 h-4" />
                          <span>
                            {isFull
                              ? "Anotarme en lista de espera"
                              : "Anotarme"}
                          </span>
                        </button>
                      ) : (
                        <div className="pt-4 border-t border-[#D8CEB9]/40 space-y-3.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9] font-semibold">
                              {isFull
                                ? "Formulario de Lista de Espera"
                                : "Formulario de Anotación"}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveEnrollmentDepId(null);
                                setWaitlistPrompt(null);
                                setEnrollError("");
                              }}
                              className="text-[11px] text-[#D8CEB9] underline cursor-pointer"
                            >
                              Cerrar
                            </button>
                          </div>

                          {/* Honeypot anti-spam oculto */}
                          <input
                            type="text"
                            name="website_hp"
                            value={enrollHoneypot}
                            onChange={(e) => setEnrollHoneypot(e.target.value)}
                            className="hidden"
                            tabIndex={-1}
                            autoComplete="off"
                          />

                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                              Nombre y apellido *
                            </label>
                            <input
                              type="text"
                              required
                              value={enrollName}
                              onChange={(e) => setEnrollName(e.target.value)}
                              placeholder="Ej. Martín Gómez"
                              className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6] focus:outline-none focus:border-[#D8CEB9]"
                            />
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                                Teléfono / WhatsApp *
                              </label>
                              <input
                                type="tel"
                                required
                                value={enrollPhone}
                                onChange={(e) => setEnrollPhone(e.target.value)}
                                placeholder="+54 9 299 ..."
                                className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6] focus:outline-none focus:border-[#D8CEB9]"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                                Email *
                              </label>
                              <input
                                type="email"
                                required
                                value={enrollEmail}
                                onChange={(e) => setEnrollEmail(e.target.value)}
                                placeholder="tu@email.com"
                                className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6] focus:outline-none focus:border-[#D8CEB9]"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                              Cantidad de personas *
                            </label>
                            <select
                              value={enrollCount}
                              onChange={(e) => {
                                setEnrollCount(Number(e.target.value));
                                setWaitlistPrompt(null);
                              }}
                              className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6] focus:outline-none focus:border-[#D8CEB9]"
                            >
                              {[1, 2, 3, 4, 5, 6].map((n) => (
                                <option key={n} value={n}>
                                  {n} {n === 1 ? "persona" : "personas"}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                              Comentarios (Opcional)
                            </label>
                            <textarea
                              rows={2}
                              value={enrollComments}
                              onChange={(e) =>
                                setEnrollComments(e.target.value)
                              }
                              placeholder="Nivel de experiencia, equipo o consultas..."
                              className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6] focus:outline-none focus:border-[#D8CEB9]"
                            />
                          </div>

                          {enrollError && (
                            <div className="p-3 bg-red-950/80 border border-red-500/60 text-xs text-red-100 flex items-start gap-2">
                              <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                              <span>{enrollError}</span>
                            </div>
                          )}

                          {waitlistPrompt ? (
                            <button
                              type="button"
                              disabled={enrollSubmitting}
                              onClick={() => submitEnrollment(dep, true)}
                              className="w-full py-3.5 px-4 bg-amber-500 hover:bg-amber-400 text-[#292D29] text-xs uppercase tracking-[0.18em] font-bold transition-colors cursor-pointer"
                            >
                              {enrollSubmitting
                                ? "Procesando..."
                                : "Confirmar ingreso en Lista de Espera"}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={enrollSubmitting}
                              onClick={() =>
                                submitEnrollment(
                                  dep,
                                  isFull || enrollCount > dep.availableSpots
                                )
                              }
                              className="w-full py-3.5 px-4 bg-[#D8CEB9] hover:bg-[#F2EFE6] text-[#263D32] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                            >
                              {enrollSubmitting
                                ? "Registrando anotación..."
                                : isFull || enrollCount > dep.availableSpots
                                ? "Anotarme en Lista de Espera"
                                : "Confirmar Anotación"}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* CASO 4: DÍA SIN SALIDA PROGRAMADA -> SOLICITUD DE SALIDA A PEDIDO */
              <div className="space-y-5">
                <div className="p-5 bg-[#292D29]/50 border border-[#899487]/30 space-y-3">
                  <span className="inline-block px-2.5 py-1 bg-[#65745A]/40 text-[#D8CEB9] text-[10px] uppercase tracking-[0.2em] font-semibold">
                    Salida a pedido · Coordinación directa
                  </span>
                  <p className="text-base font-editorial text-[#F2EFE6] leading-snug">
                    No hay salida programada ese día. ¿Querés solicitar una
                    salida personalizada?
                  </p>
                  <p className="text-xs text-[#F2EFE6]/80 font-light leading-relaxed">
                    Elegí tu horario preferido, río o modalidad opcional y
                    envianos tu propuesta. El guía la revisa y lo arreglan
                    directo entre ustedes, sin seña ni pagos por la web.
                  </p>
                </div>

                {!showCustomRequestForm ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowCustomRequestForm(true);
                      setConfirmedCustomRequest(null);
                      setReqError("");
                    }}
                    className="w-full py-4 px-5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Compass className="w-4 h-4" />
                    <span>Solicitar salida personalizada</span>
                  </button>
                ) : (
                  <form
                    onSubmit={submitCustomRequest}
                    className="p-5 bg-[#292D29]/65 border border-[#D8CEB9]/40 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-[#899487]/30 pb-2.5">
                      <span className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9] font-semibold">
                        Solicitar Salida a Pedido ({selectedDateStr})
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCustomRequestForm(false)}
                        className="text-[11px] text-[#D8CEB9] underline cursor-pointer"
                      >
                        Cancelar
                      </button>
                    </div>

                    {/* Honeypot anti-spam */}
                    <input
                      type="text"
                      name="website_hp"
                      value={reqHoneypot}
                      onChange={(e) => setReqHoneypot(e.target.value)}
                      className="hidden"
                      tabIndex={-1}
                      autoComplete="off"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                          Horario preferido *
                        </label>
                        <select
                          value={reqSchedule}
                          onChange={(e) =>
                            setReqSchedule(
                              e.target.value as PreferredScheduleType
                            )
                          }
                          className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                        >
                          {SCHEDULES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                          Cantidad de personas *
                        </label>
                        <select
                          value={reqCount}
                          onChange={(e) => setReqCount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                        >
                          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                            <option key={n} value={n}>
                              {n} {n === 1 ? "persona" : "personas"}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                          Río preferido (Opcional)
                        </label>
                        <select
                          value={reqRiver}
                          onChange={(e) => setReqRiver(e.target.value)}
                          className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                        >
                          <option value="">A recomendar por el guía</option>
                          {riverOptions.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                          Tipo de pesca (Opcional)
                        </label>
                        <select
                          value={reqType}
                          onChange={(e) => setReqType(e.target.value)}
                          className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                        >
                          <option value="">A definir con el guía</option>
                          {FISHING_TYPES.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                        Nombre y apellido *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqName}
                        onChange={(e) => setReqName(e.target.value)}
                        placeholder="Tu nombre completo"
                        className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                          Teléfono / WhatsApp *
                        </label>
                        <input
                          type="tel"
                          required
                          value={reqPhone}
                          onChange={(e) => setReqPhone(e.target.value)}
                          placeholder="+54 9 299 ..."
                          className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                          Email *
                        </label>
                        <input
                          type="email"
                          required
                          value={reqEmail}
                          onChange={(e) => setReqEmail(e.target.value)}
                          placeholder="tu@email.com"
                          className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] mb-1">
                        Mensaje para el guía
                      </label>
                      <textarea
                        rows={3}
                        value={reqMessage}
                        onChange={(e) => setReqMessage(e.target.value)}
                        placeholder="Contanos qué tenés en mente, experiencia del grupo o cualquier consulta..."
                        className="w-full px-3 py-2 bg-[#263D32] border border-[#899487]/50 text-xs text-[#F2EFE6]"
                      />
                    </div>

                    {reqError && (
                      <div className="p-3 bg-red-950/80 border border-red-500/60 text-xs text-red-100 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-red-300 flex-shrink-0 mt-0.5" />
                        <span>{reqError}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={reqSubmitting}
                      className="w-full py-3.5 px-5 bg-[#D8CEB9] hover:bg-[#F2EFE6] text-[#263D32] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                    >
                      {reqSubmitting
                        ? "Enviando solicitud..."
                        : "Enviar solicitud personalizada"}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
