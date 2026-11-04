"use client";

import React, { useState, useMemo } from "react";
import { CalendarDeparture } from "@/types/traum";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Users,
  Clock,
  MapPin,
  Compass,
} from "lucide-react";

interface CalendarSectionProps {
  departures: CalendarDeparture[];
  onRequestBookingFromCalendar: (prefill: {
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

export default function CalendarSection({
  departures,
  onRequestBookingFromCalendar,
}: CalendarSectionProps) {
  const [currentMonth, setCurrentMonth] = useState<number>(10); // Noviembre
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [selectedDateStr, setSelectedDateStr] = useState<string>("2026-11-12");

  const departuresByDate = useMemo(() => {
    const map: Record<string, CalendarDeparture[]> = {};
    for (const dep of departures) {
      if (!map[dep.date]) {
        map[dep.date] = [];
      }
      map[dep.date].push(dep);
    }
    return map;
  }, [departures]);

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

  const selectedDepartures = selectedDateStr
    ? departuresByDate[selectedDateStr] || []
    : [];

  const formatReadableDate = (isoDate: string) => {
    const parts = isoDate.split("-");
    if (parts.length !== 3) return isoDate;
    const y = Number(parts[0]);
    const m = Number(parts[1]) - 1;
    const d = Number(parts[2]);
    return `${d} de ${MONTH_NAMES[m] || ""} de ${y}`;
  };

  return (
    <section
      id="calendario"
      className="py-20 sm:py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[1px] bg-[#263D32]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                Calendario de salidas y reservas
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-tight">
              El próximo sueño{" "}
              <span className="italic text-[#746657]">tiene fecha.</span>
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#292D29]/80 max-w-md font-light leading-relaxed">
            Consultá las salidas programadas o seleccioná cualquier día del
            calendario para proponernos tu propia fecha en modalidad individual,
            dúo, grupal o privada.
          </p>
        </div>

        {/* Service Modalities Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {[
            {
              title: "Salida individual",
              desc: "Atención 1 a 1 con guía dedicado",
            },
            {
              title: "Salida para dos personas",
              desc: "Formato clásico en balsa o vadeo compartido",
            },
            {
              title: "Salida grupal",
              desc: "Coordinación multi-guía y múltiples balsas",
            },
            {
              title: "Salida privada o personalizada",
              desc: "Itinerario exclusivo diseñado a medida",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="p-3.5 sm:p-4 bg-[#D8CEB9]/35 border border-[#D8CEB9] flex flex-col justify-between"
            >
              <span className="font-editorial text-lg sm:text-xl text-[#263D32] font-medium">
                {item.title}
              </span>
              <span className="text-xs text-[#746657] mt-1 font-light">
                {item.desc}
              </span>
            </div>
          ))}
        </div>

        {/* Interactive Calendar + Selected Date Details Card */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
          {/* Left: Calendar Grid (7 columns) */}
          <div className="lg:col-span-7 bg-[#F2EFE6] border border-[#D8CEB9] shadow-lg p-3.5 sm:p-6 lg:p-8">
            {/* Month Navigator */}
            <div className="flex items-center justify-between pb-4 sm:pb-6 mb-4 sm:mb-6 border-b border-[#D8CEB9]">
              <div>
                <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.22em] text-[#746657] block">
                  Temporada de Pesca
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

                const dayDepartures = departuresByDate[cell.dateStr] || [];
                const hasDepartures = dayDepartures.length > 0;
                const isSelected = selectedDateStr === cell.dateStr;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => setSelectedDateStr(cell.dateStr!)}
                    className={`aspect-square p-1.5 sm:p-2 border transition-all duration-300 flex flex-col items-start justify-between relative cursor-pointer ${
                      isSelected
                        ? "bg-[#263D32] text-[#F2EFE6] border-[#263D32] shadow-md"
                        : hasDepartures
                        ? "bg-[#65745A]/15 text-[#263D32] border-[#65745A] hover:bg-[#65745A]/25"
                        : "bg-[#F2EFE6] text-[#292D29] border-[#D8CEB9] hover:border-[#746657]"
                    }`}
                  >
                    <span className="text-xs sm:text-sm font-medium">
                      {cell.day}
                    </span>

                    {hasDepartures && (
                      <div className="w-full flex items-center justify-between mt-auto">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? "bg-[#D8CEB9]" : "bg-[#263D32]"
                          }`}
                        />
                        <span
                          className={`hidden sm:inline text-[9px] uppercase tracking-wider px-1 ${
                            isSelected
                              ? "text-[#D8CEB9]"
                              : "text-[#263D32] font-semibold"
                          }`}
                        >
                          Salida
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-5 border-t border-[#D8CEB9] flex flex-wrap items-center justify-between gap-4 text-xs text-[#746657]">
              <div className="flex items-center gap-5">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#65745A]/25 border border-[#65745A] inline-block" />
                  <span>Fecha con salida programada</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-[#F2EFE6] border border-[#D8CEB9] inline-block" />
                  <span>Disponible para salida a medida</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Selected Date Information Sheet (5 columns) */}
          <div className="lg:col-span-5 bg-[#263D32] text-[#F2EFE6] p-5 sm:p-7 lg:p-9 border border-[#65745A]/40 shadow-xl">
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-[#899487]/30">
              <div>
                <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9] block mb-1">
                  Ficha de fecha seleccionada
                </span>
                <h4 className="font-editorial text-2xl sm:text-3xl text-[#F2EFE6]">
                  {selectedDateStr
                    ? formatReadableDate(selectedDateStr)
                    : "Seleccioná un día"}
                </h4>
              </div>
              <CalendarIcon className="w-6 h-6 text-[#D8CEB9]" />
            </div>

            {selectedDepartures.length > 0 ? (
              <div className="space-y-6">
                {selectedDepartures.map((dep) => (
                  <div
                    key={dep.id}
                    className="space-y-5 bg-[#292D29]/45 p-5 border border-[#899487]/30"
                  >
                    <div>
                      <span className="text-[11px] uppercase tracking-[0.2em] text-[#899487] block mb-1">
                        Destino previsto
                      </span>
                      <div className="flex items-center gap-2 text-xl font-editorial text-[#F2EFE6]">
                        <MapPin className="w-4 h-4 text-[#D8CEB9] flex-shrink-0" />
                        <span>{dep.destination}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#899487]/20">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#899487] block">
                          Tipo de experiencia
                        </span>
                        <span className="text-sm font-medium text-[#D8CEB9]">
                          {dep.experienceType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#899487] block">
                          Modalidad de servicio
                        </span>
                        <span className="text-sm font-medium text-[#F2EFE6]">
                          {dep.serviceGroupType}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#899487] block">
                          Capacidad máxima
                        </span>
                        <span className="text-sm font-medium text-[#F2EFE6] inline-flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[#D8CEB9]" />
                          {dep.maxParticipants} participantes
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#899487] block">
                          Cupos libres
                        </span>
                        <span
                          className={`text-sm font-semibold ${
                            dep.availableSpots === 0
                              ? "text-[#E59872]"
                              : "text-[#D8CEB9]"
                          }`}
                        >
                          {dep.availableSpots === 0
                            ? "Sin cupos libres (Completo)"
                            : dep.availableSpots !== null
                            ? `${dep.availableSpots} libre(s) de ${dep.maxParticipants}`
                            : "A consultar"}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[#899487]/20 flex items-center justify-between gap-2">
                      <div>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#899487] block mb-1">
                          Duración
                        </span>
                        <span className="text-xs text-[#F2EFE6]/90 inline-flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-[#D8CEB9]" />
                          {dep.duration}
                        </span>
                      </div>
                      <span className="px-2.5 py-1 bg-[#D8CEB9]/15 border border-[#D8CEB9]/35 text-[10px] uppercase tracking-[0.18em] text-[#D8CEB9] font-semibold">
                        Reserva con seña
                      </span>
                    </div>

                    {dep.additionalInfo && (
                      <div className="pt-2 border-t border-[#899487]/20">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#899487] block mb-1">
                          Información de la jornada
                        </span>
                        <p className="text-xs text-[#F2EFE6]/80 font-light leading-relaxed">
                          {dep.additionalInfo}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={dep.availableSpots === 0}
                      onClick={() =>
                        onRequestBookingFromCalendar({
                          date: dep.date,
                          departureId: dep.id,
                          requiresDeposit: true,
                          availableSpots:
                            dep.availableSpots !== null
                              ? dep.availableSpots
                              : dep.maxParticipants,
                          maxParticipants: dep.maxParticipants,
                          experienceType: dep.experienceType,
                          serviceGroupType: dep.serviceGroupType,
                          destination: dep.destination,
                          priceReference: dep.priceLabel,
                          paymentLink: dep.paymentLink,
                        })
                      }
                      className={`w-full py-3.5 px-5 text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 ${
                        dep.availableSpots === 0
                          ? "bg-[#292D29] text-[#899487] border border-[#899487]/30 cursor-not-allowed"
                          : "bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] cursor-pointer"
                      }`}
                    >
                      <Compass className="w-4 h-4" />
                      <span>
                        {dep.availableSpots === 0
                          ? "Salida completa — Sin cupos libres"
                          : "Contratar cupo en esta salida (Con seña)"}
                      </span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-5 bg-[#292D29]/40 border border-[#899487]/25 space-y-3">
                  <span className="inline-block px-2.5 py-1 bg-[#65745A]/40 text-[#D8CEB9] text-[10px] uppercase tracking-[0.2em]">
                    Día libre · Solicitud sin seña previa
                  </span>
                  <p className="text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                    Al pedir reservar un día sin evento precargado{" "}
                    <strong className="font-medium text-[#D8CEB9]">
                      no se abona seña en este momento
                    </strong>
                    , ya que primero verificamos si ese día es posible realizar
                    la salida y te confirmamos por correo.
                  </p>
                </div>

                <div className="space-y-2 text-xs text-[#F2EFE6]/75">
                  <div className="flex items-center justify-between py-2 border-b border-[#899487]/20">
                    <span>Tipo de experiencia:</span>
                    <span className="text-[#D8CEB9]">
                      Vadeo · Balsa · Personalizada
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#899487]/20">
                    <span>Formato admitido:</span>
                    <span className="text-[#D8CEB9]">
                      Individual, 2 personas o Grupal
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#899487]/20">
                    <span>Seña al consultar el día:</span>
                    <span className="text-[#D8CEB9] font-semibold">
                      Sin seña (sujeto a confirmación)
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onRequestBookingFromCalendar({
                      date: selectedDateStr,
                      requiresDeposit: false,
                    })
                  }
                  className="w-full py-4 px-5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Pedir reservar este día (Sin seña)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
