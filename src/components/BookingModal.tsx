"use client";

import React, { useState, useEffect } from "react";
import {
  ExperienceItem,
  ExperienceModality,
  PaymentConfig,
  PreferredScheduleType,
  ServiceFeatureItem,
  SiteSettings,
} from "@/types/traum";
import {
  X,
  CheckCircle2,
  Calendar,
  Send,
  AlertCircle,
} from "lucide-react";

export interface BookingPrefillData {
  date?: string;
  departureId?: string;
  requiresDeposit?: boolean;
  availableSpots?: number | null;
  maxParticipants?: number;
  experienceType?: string;
  serviceGroupType?: string;
  destination?: string;
  selectedServiceTitle?: string;
  priceReference?: string;
  paymentLink?: string;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SiteSettings;
  paymentConfig: PaymentConfig;
  experiences: ExperienceItem[];
  services: ServiceFeatureItem[];
  prefillData?: BookingPrefillData | null;
  onBookingCreated?: () => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  prefillData,
  onBookingCreated,
}: BookingModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [desiredDate, setDesiredDate] = useState("2026-11-15");
  const [departureId, setDepartureId] = useState<string | undefined>(undefined);
  const [preferredSchedule, setPreferredSchedule] =
    useState<PreferredScheduleType>("Todo el día");
  const [preferredRiver, setPreferredRiver] = useState("");
  const [experienceType, setExperienceType] = useState("Pesca en balsa");
  const [participantsCount, setParticipantsCount] = useState(2);
  const [comments, setComments] = useState("");
  const [honeypot, setHoneypot] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultCode, setResultCode] = useState("");
  const [resultStatus, setResultStatus] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [waitlistOffered, setWaitlistOffered] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (prefillData) {
      if (prefillData.date) setDesiredDate(prefillData.date);
      setDepartureId(prefillData.departureId || undefined);
      if (prefillData.experienceType) {
        setExperienceType(prefillData.experienceType);
      }
      if (prefillData.destination) {
        setPreferredRiver(prefillData.destination);
      }
    } else {
      setDepartureId(undefined);
    }
    setSubmitted(false);
    setWaitlistOffered(false);
    setErrorMsg("");
  }, [prefillData, isOpen]);

  if (!isOpen) return null;

  const isScheduled = Boolean(departureId);

  const handleSubmit = async (
    e: React.FormEvent,
    acceptWaitlistFlag = false
  ) => {
    e.preventDefault();
    setErrorMsg("");

    if (fullName.trim().length < 2) {
      setErrorMsg("Ingresá tu nombre y apellido.");
      return;
    }
    if (whatsapp.replace(/\D/g, "").length < 6) {
      setErrorMsg("Ingresá un teléfono o WhatsApp válido.");
      return;
    }
    if (!email.includes("@")) {
      setErrorMsg("Ingresá un correo electrónico válido.");
      return;
    }

    setSubmitting(true);
    try {
      const bodyPayload = isScheduled
        ? {
            type: "ENROLL_DEPARTURE",
            departureId,
            fullName: fullName.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim(),
            participantsCount,
            comments: comments.trim(),
            acceptWaitlist: acceptWaitlistFlag,
            website_hp: honeypot,
          }
        : {
            type: "CREATE_CUSTOM_REQUEST",
            desiredDate,
            preferredSchedule,
            preferredRiver: preferredRiver || undefined,
            experienceType: (experienceType as ExperienceModality) || undefined,
            participantsCount,
            fullName: fullName.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim(),
            comments: comments.trim(),
            website_hp: honeypot,
          };

      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.canJoinWaitlist) {
          setWaitlistOffered(true);
          setErrorMsg(data.error || "");
          return;
        }
        setErrorMsg(data.error || "No se pudo procesar la solicitud.");
        return;
      }

      if (isScheduled && data.enrollment) {
        setResultCode(data.enrollment.bookingCode);
        setResultStatus(data.enrollment.status);
        setResultMessage(
          data.enrollment.status === "lista_espera"
            ? "Quedaste anotado en la lista de espera. Si se libera un cupo, el guía te va a avisar de inmediato."
            : "¡Tu anotación en la salida programada quedó confirmada!"
        );
      } else if (data.customRequest) {
        setResultCode(data.customRequest.requestCode);
        setResultStatus("pendiente");
        setResultMessage(
          data.confirmationMessage ||
            "El guía te va a contactar para coordinar. No se requiere seña ni pago por este medio."
        );
      }

      setSubmitted(true);
      if (onBookingCreated) onBookingCreated();
    } catch {
      setErrorMsg("Error de conexión. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#292D29]/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-[#F2EFE6] border border-[#D8CEB9] max-w-xl w-full shadow-2xl overflow-hidden my-auto max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#263D32] text-[#F2EFE6] px-6 sm:px-8 py-5 flex items-center justify-between border-b border-[#65745A]/40 sticky top-0 z-10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#D8CEB9] block mb-1">
              {isScheduled
                ? "Anotación en Salida Programada"
                : "Solicitud de Salida a Pedido"}
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl">
              {submitted
                ? "Confirmación de registro"
                : isScheduled
                ? "Anotarme en la salida"
                : "Solicitar salida personalizada"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 border border-[#D8CEB9]/30 hover:bg-[#65745A] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {submitted ? (
            <div className="space-y-6">
              <div className="p-5 bg-[#263D32] text-[#F2EFE6] border border-[#65745A] flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-[#D8CEB9] flex-shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#D8CEB9] block">
                    Código: {resultCode}
                  </span>
                  <h4 className="font-editorial text-2xl">
                    {isScheduled
                      ? resultStatus === "lista_espera"
                        ? "Anotado en Lista de Espera"
                        : "Anotación Confirmada"
                      : "Solicitud Recibida"}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#F2EFE6]/90 leading-relaxed">
                    {resultMessage}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border border-[#D8CEB9] text-xs space-y-1.5 text-[#292D29]">
                <div>
                  <strong>Nombre:</strong> {fullName}
                </div>
                <div>
                  <strong>Teléfono / WhatsApp:</strong> {whatsapp}
                </div>
                <div>
                  <strong>Email:</strong> {email}
                </div>
                <div>
                  <strong>Fecha:</strong> {desiredDate}
                </div>
                <div>
                  <strong>Personas:</strong> {participantsCount}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
              >
                Cerrar ventana
              </button>
            </div>
          ) : (
            <form
              onSubmit={(e) => handleSubmit(e, false)}
              className="space-y-4"
            >
              {/* Honeypot anti-spam */}
              <input
                type="text"
                name="website_hp"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                className="hidden"
                tabIndex={-1}
                autoComplete="off"
              />

              {!isScheduled && (
                <div className="p-3.5 bg-[#D8CEB9]/35 border border-[#D8CEB9] text-xs text-[#292D29]">
                  Solicitá cualquier fecha libre para armar una salida a medida.{" "}
                  <strong>
                    El guía te va a contactar para coordinar. No se requiere
                    seña ni pago por este medio.
                  </strong>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                    Nombre y Apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+54 9 299 ..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                    Cantidad de personas *
                  </label>
                  <select
                    value={participantsCount}
                    onChange={(e) =>
                      setParticipantsCount(Number(e.target.value))
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                  >
                    {[1, 2, 3, 4, 5, 6].map((n) => (
                      <option key={n} value={n}>
                        {n} {n === 1 ? "persona" : "personas"}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {!isScheduled && (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                        Fecha solicitada *
                      </label>
                      <div className="relative">
                        <input
                          type="date"
                          required
                          value={desiredDate}
                          onChange={(e) => setDesiredDate(e.target.value)}
                          className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                        />
                        <Calendar className="w-4 h-4 text-[#746657] absolute right-3 top-3 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                        Horario preferido *
                      </label>
                      <select
                        value={preferredSchedule}
                        onChange={(e) =>
                          setPreferredSchedule(
                            e.target.value as PreferredScheduleType
                          )
                        }
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                      >
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Todo el día">Todo el día</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                        Río preferido (Opcional)
                      </label>
                      <input
                        type="text"
                        value={preferredRiver}
                        onChange={(e) => setPreferredRiver(e.target.value)}
                        placeholder="Ej. Río Malleo / Chimehuín"
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                        Tipo de pesca (Opcional)
                      </label>
                      <select
                        value={experienceType}
                        onChange={(e) => setExperienceType(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                      >
                        <option value="Pesca en balsa">Pesca en balsa</option>
                        <option value="Pesca de vadeo">Pesca de vadeo</option>
                        <option value="Salida personalizada">
                          Salida personalizada
                        </option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-[11px] uppercase tracking-[0.18em] text-[#292D29] font-semibold mb-1.5">
                  Mensaje / Comentarios
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Consultas o detalles para el guía..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] text-sm"
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-[#B35B2B]/10 border border-[#B35B2B] text-xs text-[#B35B2B] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {waitlistOffered ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={(e) => handleSubmit(e, true)}
                  className="w-full py-4 bg-amber-600 text-white hover:bg-amber-700 text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                >
                  {submitting
                    ? "Procesando..."
                    : "Confirmar ingreso en Lista de Espera"}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? "Procesando..."
                      : isScheduled
                      ? "Confirmar Anotación"
                      : "Enviar Solicitud Personalizada"}
                  </span>
                </button>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
