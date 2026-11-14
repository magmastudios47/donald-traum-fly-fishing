"use client";

import React, { useState, useEffect } from "react";
import {
  CalendarDeparture,
  EnrollmentPaymentReceipt,
  ExperienceItem,
  ExperienceModality,
  PaymentConfig,
  PreferredScheduleType,
  ServiceFeatureItem,
  SiteSettings,
} from "@/types/traum";
import { BookingPrefillData } from "@/components/BookingModal";
import CardCheckoutBox from "@/components/CardCheckoutBox";
import {
  CardCheckoutInput,
  calculateDepartureBookingPricing,
  formatArs,
  validateCardCheckoutInput,
} from "@/lib/payment-utils";
import {
  Mail,
  MapPin,
  Phone,
  CheckCircle2,
  Send,
  AlertCircle,
} from "lucide-react";

interface ContactSectionProps {
  settings: SiteSettings;
  paymentConfig: PaymentConfig;
  experiences: ExperienceItem[];
  services: ServiceFeatureItem[];
  departures: CalendarDeparture[];
  prefillData?: BookingPrefillData | null;
  onInquirySubmitted?: () => void;
}

export default function ContactSection({
  settings,
  paymentConfig,
  experiences,
  departures,
  prefillData,
  onInquirySubmitted,
}: ContactSectionProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bookingMode, setBookingMode] = useState<"scheduled" | "custom">(
    "custom"
  );
  const [selectedDepartureId, setSelectedDepartureId] = useState<string>("");
  const [desiredDate, setDesiredDate] = useState("2026-11-15");
  const [preferredSchedule, setPreferredSchedule] =
    useState<PreferredScheduleType>("Todo el día");
  const [preferredRiver, setPreferredRiver] = useState("");
  const [experienceType, setExperienceType] = useState("Pesca en balsa");
  const [participantsCount, setParticipantsCount] = useState(2);
  const [comments, setComments] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [cardInput, setCardInput] = useState<CardCheckoutInput>({
    cardNumber: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",
    postalCode: "",
    dni: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [resultCode, setResultCode] = useState("");
  const [resultMessage, setResultMessage] = useState("");
  const [resultReceipt, setResultReceipt] =
    useState<EnrollmentPaymentReceipt | null>(null);
  const [waitlistOffered, setWaitlistOffered] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const activeDepartures = departures.filter((d) => d.status !== "cancelada");
  const selectedDep =
    bookingMode === "scheduled" && selectedDepartureId
      ? activeDepartures.find((d) => d.id === selectedDepartureId)
      : undefined;
  const scheduledNeedsWaitlist =
    bookingMode === "scheduled" &&
    (waitlistOffered ||
      (selectedDep ? selectedDep.availableSpots < participantsCount : false));
  const scheduledPricing =
    bookingMode === "scheduled" && selectedDep
      ? calculateDepartureBookingPricing(
          selectedDep,
          participantsCount,
          experiences,
          paymentConfig
        )
      : null;

  useEffect(() => {
    if (prefillData) {
      if (prefillData.departureId) {
        setBookingMode("scheduled");
        setSelectedDepartureId(prefillData.departureId);
      } else {
        setBookingMode("custom");
      }
      if (prefillData.date) setDesiredDate(prefillData.date);
      if (prefillData.experienceType)
        setExperienceType(prefillData.experienceType);
      if (prefillData.destination) setPreferredRiver(prefillData.destination);
    }
  }, [prefillData]);

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
      setErrorMsg("Ingresá un email válido.");
      return;
    }

    const isSched = Boolean(
      bookingMode === "scheduled" && selectedDepartureId
    );
    const requiresCardPayment =
      isSched && !acceptWaitlistFlag && !scheduledNeedsWaitlist;

    if (requiresCardPayment) {
      const cardValidation = validateCardCheckoutInput(cardInput);
      if (!cardValidation.valid) {
        setErrorMsg(
          cardValidation.error ||
            "Verificá los datos de la tarjeta para abonar la seña."
        );
        return;
      }
    }

    setSubmitting(true);
    try {
      const bodyPayload = isSched
        ? {
            type: "ENROLL_DEPARTURE",
            departureId: selectedDepartureId,
            fullName: fullName.trim(),
            whatsapp: whatsapp.trim(),
            email: email.trim(),
            participantsCount,
            comments: comments.trim(),
            acceptWaitlist: acceptWaitlistFlag || scheduledNeedsWaitlist,
            cardCheckout: requiresCardPayment ? cardInput : undefined,
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
        setErrorMsg(data.error || "No se pudo enviar tu solicitud.");
        return;
      }

      if (isSched && data.enrollment) {
        setResultCode(data.enrollment.bookingCode);
        setResultReceipt(data.enrollment.paymentReceipt || null);
        setResultMessage(
          data.enrollment.status === "lista_espera"
            ? "Quedaste anotado en la lista de espera de esta salida programada."
            : "¡Seña abonada y turno confirmado! Enviamos el Comprobante Oficial de Reserva y Pago a tu correo electrónico."
        );
      } else if (data.customRequest) {
        setResultCode(data.customRequest.requestCode);
        setResultReceipt(null);
        setResultMessage(
          data.confirmationMessage ||
            "El guía te va a contactar para coordinar. No se requiere seña ni pago por este medio."
        );
      }

      setSubmitted(true);
      setWaitlistOffered(false);
      if (onInquirySubmitted) onInquirySubmitted();
    } catch {
      setErrorMsg("Error de conexión. Intentá nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="contacto"
      className="py-20 sm:py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] border-t border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Brand Contact Details (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-[1px] bg-[#263D32]" />
                <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                  Contacto directo con el guía
                </span>
              </div>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-6">
                Empezá a planificar{" "}
                <span className="italic text-[#746657]">tu salida al río.</span>
              </h2>
              <p className="text-base text-[#292D29]/80 font-light leading-relaxed">
                Anotate en una salida programada o solicitanos una salida a
                pedido para cualquier día libre del calendario. Coordinamos
                directamente con vos por WhatsApp o correo electrónico.
              </p>
            </div>

            <div className="space-y-4 pt-4 border-t border-[#D8CEB9]">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#263D32] text-[#D8CEB9] flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#746657] block">
                    Base de operación
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {settings.locationGeneral}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#263D32] text-[#D8CEB9] flex items-center justify-center flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#746657] block">
                    Correo electrónico
                  </span>
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-sm font-medium text-[#263D32] hover:underline"
                  >
                    {settings.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-[#263D32] text-[#D8CEB9] flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#746657] block">
                    WhatsApp Directo
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {settings.whatsappNumber}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Unified Form (7 cols) */}
          <div className="lg:col-span-7 bg-white border border-[#D8CEB9] p-6 sm:p-10 shadow-xl">
            {submitted ? (
              <div className="space-y-6">
                <div className="p-6 bg-[#263D32] text-[#F2EFE6] border border-[#65745A] flex items-start gap-4">
                  <CheckCircle2 className="w-7 h-7 text-[#D8CEB9] flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 flex-1">
                    <span className="text-[10px] uppercase tracking-[0.24em] text-[#D8CEB9] block">
                      Código: {resultCode}
                    </span>
                    <h3 className="font-editorial text-2xl sm:text-3xl">
                      {resultReceipt
                        ? "¡Seña Abonada y Turno Confirmado!"
                        : "¡Registro completado!"}
                    </h3>
                    <p className="text-xs sm:text-sm text-[#F2EFE6]/90 leading-relaxed">
                      {resultMessage}
                    </p>
                    {resultReceipt && (
                      <div className="p-4 mt-3 bg-[#292D29]/85 border border-[#D8CEB9]/40 text-xs space-y-1.5 text-[#F2EFE6]">
                        <div className="text-[10px] uppercase tracking-[0.18em] text-emerald-300 font-semibold">
                          Comprobante Oficial · Op. #{resultReceipt.paymentId}
                        </div>
                        <div className="flex justify-between">
                          <span>Total de tus cupos:</span>
                          <span>{formatArs(resultReceipt.subtotalForSpots)}</span>
                        </div>
                        <div className="flex justify-between text-[#D8CEB9]">
                          <span>
                            Saldo restante el día de la salida (-
                            {100 - resultReceipt.depositPercentage}%):
                          </span>
                          <span>
                            - {formatArs(resultReceipt.remainingBalance)}
                          </span>
                        </div>
                        <div className="flex justify-between font-bold text-emerald-300 pt-1.5 border-t border-[#899487]/35">
                          <span>
                            Seña abonada hoy ({resultReceipt.cardBrand} ****{" "}
                            {resultReceipt.cardLast4}):
                          </span>
                          <span>{formatArs(resultReceipt.depositPaid)}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setErrorMsg("");
                  }}
                  className="px-6 py-3 border border-[#263D32] text-[#263D32] hover:bg-[#263D32] hover:text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                >
                  Realizar otra consulta o anotación
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => handleSubmit(e, false)}
                className="space-y-5"
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

                <div className="grid grid-cols-2 gap-3 pb-2 border-b border-[#D8CEB9]">
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode("custom");
                      setWaitlistOffered(false);
                      setErrorMsg("");
                    }}
                    className={`py-3 px-4 text-xs uppercase tracking-[0.18em] font-semibold border transition-colors cursor-pointer ${
                      bookingMode === "custom"
                        ? "bg-[#263D32] text-[#F2EFE6] border-[#263D32]"
                        : "bg-[#F2EFE6] text-[#292D29] border-[#D8CEB9]"
                    }`}
                  >
                    Solicitar Salida a Pedido
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setBookingMode("scheduled");
                      if (!selectedDepartureId && activeDepartures[0]) {
                        setSelectedDepartureId(activeDepartures[0].id);
                      }
                      setWaitlistOffered(false);
                      setErrorMsg("");
                    }}
                    className={`py-3 px-4 text-xs uppercase tracking-[0.18em] font-semibold border transition-colors cursor-pointer ${
                      bookingMode === "scheduled"
                        ? "bg-[#263D32] text-[#F2EFE6] border-[#263D32]"
                        : "bg-[#F2EFE6] text-[#292D29] border-[#D8CEB9]"
                    }`}
                  >
                    Anotarme en Salida Programada
                  </button>
                </div>

                {bookingMode === "scheduled" ? (
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                      Elegí la salida programada *
                    </label>
                    <select
                      required
                      value={selectedDepartureId}
                      onChange={(e) => setSelectedDepartureId(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                    >
                      <option value="">Seleccioná una salida...</option>
                      {activeDepartures.map((dep) => (
                        <option key={dep.id} value={dep.id}>
                          {dep.date} ({dep.startTime} hs) — {dep.destination} ·{" "}
                          {dep.experienceType} (
                          {dep.availableSpots <= 0
                            ? "Completa - Lista de espera"
                            : `${dep.availableSpots} cupos libres`}
                          )
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                        Fecha solicitada *
                      </label>
                      <input
                        type="date"
                        required
                        value={desiredDate}
                        onChange={(e) => setDesiredDate(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                        Horario preferido *
                      </label>
                      <select
                        value={preferredSchedule}
                        onChange={(e) =>
                          setPreferredSchedule(
                            e.target.value as PreferredScheduleType
                          )
                        }
                        className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                      >
                        <option value="Mañana">Mañana</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Todo el día">Todo el día</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                      Nombre y Apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Tu nombre completo"
                      className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                      Teléfono / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+54 9 299 ..."
                      className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                      Cantidad de personas *
                    </label>
                    <select
                      value={participantsCount}
                      onChange={(e) =>
                        setParticipantsCount(Number(e.target.value))
                      }
                      className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                    >
                      {[1, 2, 3, 4, 5, 6].map((n) => (
                        <option key={n} value={n}>
                          {n} {n === 1 ? "persona" : "personas"}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {bookingMode === "custom" && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                        Río preferido (Opcional)
                      </label>
                      <input
                        type="text"
                        value={preferredRiver}
                        onChange={(e) => setPreferredRiver(e.target.value)}
                        placeholder="Ej. Río Malleo / Chimehuín / Collón Curá"
                        className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                        Tipo de pesca preferido (Opcional)
                      </label>
                      <select
                        value={experienceType}
                        onChange={(e) => setExperienceType(e.target.value)}
                        className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                      >
                        <option value="Pesca en balsa">Pesca en balsa</option>
                        <option value="Pesca de vadeo">Pesca de vadeo</option>
                        <option value="Salida personalizada">
                          Salida personalizada
                        </option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Mensaje / Comentarios
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Contanos qué tenés en mente..."
                    className="w-full px-4 py-3 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-sm"
                  />
                </div>

                {bookingMode === "scheduled" &&
                  !scheduledNeedsWaitlist &&
                  scheduledPricing && (
                    <CardCheckoutBox
                      pricing={scheduledPricing}
                      cardInput={cardInput}
                      onChange={setCardInput}
                      variant="light"
                    />
                  )}

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
                    className="w-full py-4 bg-amber-600 text-white hover:bg-amber-700 text-xs uppercase tracking-[0.22em] font-semibold transition-colors cursor-pointer"
                  >
                    {submitting
                      ? "Procesando..."
                      : "Confirmar ingreso en Lista de Espera (Sin cargo)"}
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
                        : bookingMode === "scheduled"
                        ? scheduledNeedsWaitlist
                          ? "Anotarme en Lista de Espera (Sin cargo)"
                          : scheduledPricing
                          ? `Pagar Seña (${formatArs(
                              scheduledPricing.depositAmount
                            )}) y Confirmar Reserva`
                          : "Confirmar Anotación"
                        : "Enviar Solicitud Personalizada"}
                    </span>
                  </button>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
