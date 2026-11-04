"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookingInquiry,
  CalendarDeparture,
  ExperienceItem,
  PaymentConfig,
  ServiceFeatureItem,
  SiteSettings,
} from "@/types/traum";
import { useGoogleSession } from "@/lib/google-session";
import GoogleAuthModal, { GoogleLogoSvg } from "@/components/GoogleAuthModal";
import {
  Mail,
  MessageCircle,
  MapPin,
  Send,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
  Landmark,
  Copy,
  ExternalLink,
} from "lucide-react";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface ContactSectionProps {
  settings: SiteSettings;
  paymentConfig: PaymentConfig;
  experiences: ExperienceItem[];
  services: ServiceFeatureItem[];
  departures?: CalendarDeparture[];
  prefillData?: {
    date?: string;
    departureId?: string;
    requiresDeposit?: boolean;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
    selectedServiceTitle?: string;
  } | null;
  onInquirySubmitted?: (inquiry: BookingInquiry) => void;
}

export default function ContactSection({
  settings,
  paymentConfig,
  experiences,
  departures = [],
  prefillData,
  onInquirySubmitted,
}: ContactSectionProps) {
  const { user: googleUser, signIn } = useGoogleSession();
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const [bookingMode, setBookingMode] = useState<string>("FREE_DAY"); // "FREE_DAY" or departure.id
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [experienceType, setExperienceType] = useState("Pesca de vadeo");
  const [serviceGroupType, setServiceGroupType] = useState(
    "Salida individual"
  );
  const [participantsCount, setParticipantsCount] = useState("1");
  const [skillLevel, setSkillLevel] = useState<
    | "Iniciación / Primeros pasos"
    | "Intermedio"
    | "Avanzado / Experimentado"
  >("Intermedio");
  const [comments, setComments] = useState("");
  const [legalAccepted, setLegalAccepted] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdInquiry, setCreatedInquiry] = useState<BookingInquiry | null>(
    null
  );
  const [copiedAlias, setCopiedAlias] = useState(false);

  const selectedDeparture = departures.find((d) => d.id === bookingMode) || null;
  const isScheduledDeparture = Boolean(selectedDeparture);
  const maxAllowedSpots = selectedDeparture
    ? Math.max(
        1,
        selectedDeparture.availableSpots !== null
          ? selectedDeparture.availableSpots
          : selectedDeparture.maxParticipants
      )
    : 16;

  useEffect(() => {
    if (googleUser) {
      if (!fullName) setFullName(googleUser.name);
      if (!email) setEmail(googleUser.email);
    }
  }, [googleUser, fullName, email]);

  useEffect(() => {
    if (prefillData) {
      if (prefillData.departureId) {
        setBookingMode(prefillData.departureId);
      } else {
        setBookingMode("FREE_DAY");
      }
      if (prefillData.date) setDesiredDate(prefillData.date);
      if (prefillData.experienceType)
        setExperienceType(prefillData.experienceType);
      if (prefillData.serviceGroupType)
        setServiceGroupType(prefillData.serviceGroupType);
      if (prefillData.destination) {
        setComments((prev) =>
          prev ? prev : `Destino de interés: ${prefillData.destination}.`
        );
      }
    }
  }, [prefillData]);

  const handleModeChange = (nextMode: string) => {
    setBookingMode(nextMode);
    const dep = departures.find((d) => d.id === nextMode);
    if (dep) {
      setDesiredDate(dep.date);
      setExperienceType(dep.experienceType);
      setServiceGroupType("Salida individual");
      setParticipantsCount("1");
    }
  };

  const handleGroupTypeChange = (nextGroup: string) => {
    setServiceGroupType(nextGroup);
    if (nextGroup === "Salida individual") {
      setParticipantsCount("1");
    } else if (nextGroup === "Salida para dos personas") {
      setParticipantsCount(String(Math.min(2, maxAllowedSpots)));
    }
  };

  const handleCopyAlias = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(paymentConfig.bankAlias);
      setCopiedAlias(true);
      setTimeout(() => setCopiedAlias(false), 2200);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!legalAccepted) {
      setErrorMsg(
        "Debés aceptar los Términos y Condiciones y el Deslinde de Responsabilidad para continuar."
      );
      return;
    }

    const spotsNum = Math.max(1, Number(participantsCount) || 1);
    if (isScheduledDeparture && spotsNum > maxAllowedSpots) {
      setErrorMsg(
        `Solo quedan ${maxAllowedSpots} cupo(s) libre(s) en esta salida programada.`
      );
      return;
    }

    setSubmitting(true);

    try {
      const effectiveTitle = selectedDeparture
        ? `Salida Programada: ${selectedDeparture.destination} (${selectedDeparture.date})`
        : experienceType;

      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INQUIRY",
          departureId: selectedDeparture ? selectedDeparture.id : undefined,
          requiresDeposit: isScheduledDeparture,
          fullName,
          email,
          googleEmail: googleUser?.email,
          whatsapp,
          desiredDate: selectedDeparture
            ? selectedDeparture.date
            : desiredDate || "Fecha a coordinar",
          selectedServiceTitle: effectiveTitle,
          experienceType,
          serviceGroupType,
          participantsCount: spotsNum,
          skillLevel,
          comments,
          legalAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "Error al procesar la solicitud.");
        return;
      }

      const inquiry: BookingInquiry = data.inquiry;
      setCreatedInquiry(inquiry);
      if (onInquirySubmitted) onInquirySubmitted(inquiry);

      const web3Key =
        settings.web3FormsAccessKey || "fa183ece-13f6-4360-8085-ff84ba3ea870";
      const emailSubject = isScheduledDeparture
        ? `[TRAUM Salida Programada ${inquiry.bookingCode}] ${inquiry.fullName} contrató ${spotsNum} cupo(s) el ${inquiry.desiredDate}`
        : `[TRAUM Solicitud de Día ${inquiry.bookingCode}] ${inquiry.fullName} pide fecha ${inquiry.desiredDate}`;

      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: web3Key,
          subject: emailSubject,
          from_name: "TRAUM Fly Cast Patagonia",
          email: inquiry.email,
          replyto: inquiry.email,
          Codigo_Pedido: inquiry.bookingCode,
          Tipo_de_Reserva: isScheduledDeparture
            ? `Salida Precargada (Con Seña ${paymentConfig.depositPercentage}% · Descontó ${spotsNum} cupo/s)`
            : "Solicitud de Día Libre (Sin seña previa — Sujeto a confirmar disponibilidad)",
          Fecha_Solicitada: inquiry.desiredDate,
          Servicio_o_Destino: inquiry.selectedServiceTitle,
          Cliente: inquiry.fullName,
          Email_Cliente: inquiry.email,
          Cuenta_Google: inquiry.googleEmail || "No vinculada",
          WhatsApp: inquiry.whatsapp,
          Experiencia: inquiry.experienceType,
          Formato_Grupo: inquiry.serviceGroupType,
          Cantidad_Personas_Cupos: inquiry.participantsCount,
          Nivel_Pesca: inquiry.skillLevel,
          Comentarios: inquiry.comments || "Sin comentarios adicionales",
        }),
      }).catch(() => {});
    } catch {
      setErrorMsg("Error de red al enviar la solicitud.");
    } finally {
      setSubmitting(false);
    }
  };

  const targetAdminEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";
  const cleanWhatsappDigits = settings.whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappDirectUrl = `https://wa.me/${cleanWhatsappDigits}?text=${encodeURIComponent(
    `Hola TRAUM, mi nombre es ${fullName || "..."}. Acabo de registrar la solicitud ${
      createdInquiry?.bookingCode || ""
    } para fecha ${
      desiredDate || "a coordinar"
    } (${experienceType} · ${participantsCount} pers.).`
  )}`;

  const availableDepartures = departures.filter(
    (d) => d.availableSpots === null || d.availableSpots > 0
  );

  return (
    <section
      id="contacto"
      className="py-20 sm:py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] relative border-t border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Left Column: Editorial Invitation & Direct Channels (5 cols) */}
          <div className="lg:col-span-5 space-y-6 sm:space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-[1px] bg-[#263D32]" />
                <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                  Contacto y reservas
                </span>
              </div>
              <h2 className="font-editorial text-3xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-4 sm:mb-6">
                Tu próxima historia{" "}
                <span className="italic text-[#746657]">comienza acá.</span>
              </h2>
              <p className="text-sm sm:text-lg text-[#292D29]/85 font-light leading-relaxed">
                Podés solicitar un <strong>día libre a medida</strong> (sin
                seña previa hasta confirmar disponibilidad) o anotarte en una{" "}
                <strong>salida ya programada del calendario</strong> (con seña
                del <strong>{paymentConfig.depositPercentage}%</strong> y
                descuento inmediato de cupos). Todas las solicitudes llegan a{" "}
                <strong>{targetAdminEmail}</strong>.
              </p>
            </div>

            {/* Direct Contact Channels */}
            <div className="space-y-3 sm:space-y-4 pt-2">
              <div className="p-5 bg-[#D8CEB9]/35 border border-[#D8CEB9] flex items-start gap-4">
                <MapPin className="w-5 h-5 text-[#263D32] mt-0.5 flex-shrink-0" />
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#746657] block font-semibold">
                    Ubicación general de operación
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {settings.locationGeneral}
                  </span>
                </div>
              </div>

              <a
                href={whatsappDirectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-4">
                  <MessageCircle className="w-5 h-5 text-[#D8CEB9]" />
                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#D8CEB9] block">
                      Atención directa por WhatsApp
                    </span>
                    <span className="text-sm font-medium">
                      {settings.whatsappNumber}
                    </span>
                  </div>
                </div>
                <span className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9] group-hover:translate-x-1 transition-transform">
                  Escribir →
                </span>
              </a>

              <a
                href={`mailto:${targetAdminEmail}`}
                className="p-5 bg-[#F2EFE6] border border-[#D8CEB9] hover:border-[#65745A] transition-colors flex items-center gap-4"
              >
                <Mail className="w-5 h-5 text-[#263D32]" />
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#746657] block font-semibold">
                    Correo electrónico oficial
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {targetAdminEmail}
                  </span>
                </div>
              </a>

              <a
                href={settings.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-5 bg-[#F2EFE6] border border-[#D8CEB9] hover:border-[#65745A] transition-colors flex items-center gap-4"
              >
                <InstagramIcon className="w-5 h-5 text-[#263D32]" />
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#746657] block font-semibold">
                    Instagram Oficial
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {settings.instagramHandle}
                  </span>
                </div>
              </a>
            </div>

            <div className="p-5 bg-[#263D32]/5 border border-[#263D32]/20 space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#263D32] font-semibold">
                <CreditCard className="w-4 h-4 text-[#65745A]" />
                <span>Política de Seña y Cupos</span>
              </div>
              <p className="text-xs text-[#292D29]/80 font-light leading-relaxed">
                Al pedir un día libre no se abona seña porque primero
                confirmamos si ese día está disponible. Solo las salidas
                precargadas en el calendario solicitan el{" "}
                <strong>{paymentConfig.depositPercentage}% de seña</strong> al
                reservar tu cupo.
              </p>
            </div>
          </div>

          {/* Right Column: Structured Contracting & Booking Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#F2EFE6] border border-[#D8CEB9] shadow-xl p-4 sm:p-7 lg:p-10">
            <div className="pb-6 mb-7 border-b border-[#D8CEB9] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#746657] block mb-1 font-semibold">
                  {createdInquiry
                    ? createdInquiry.requiresDeposit
                      ? `Paso 2 · Datos de Seña (${paymentConfig.depositPercentage}%)`
                      : "Solicitud de fecha enviada · Sin seña previa"
                    : isScheduledDeparture
                    ? `Salida Programada · Reserva con ${paymentConfig.depositPercentage}% de seña`
                    : "Consulta de Día Libre · Sin seña previa"}
                </span>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  {createdInquiry
                    ? `Solicitud ${createdInquiry.bookingCode} Registrada`
                    : "Solicitá tu fecha o cupo"}
                </h3>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#65745A]" />
            </div>

            {createdInquiry ? (
              createdInquiry.requiresDeposit ? (
                <div className="space-y-6">
                  <div className="p-6 bg-[#263D32] text-[#F2EFE6] space-y-2">
                    <div className="flex items-center gap-2 text-[#D8CEB9] text-xs uppercase tracking-[0.22em]">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>
                        Cupo descontado · Pedido enviado a {targetAdminEmail}
                      </span>
                    </div>
                    <h4 className="font-editorial text-3xl">
                      ¡Gracias, {createdInquiry.fullName}!
                    </h4>
                    <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                      A continuación se encuentran habilitados los datos para
                      abonar la seña del{" "}
                      <strong>{paymentConfig.depositPercentage}%</strong> por{" "}
                      <strong>{createdInquiry.selectedServiceTitle}</strong> (
                      {createdInquiry.participantsCount} cupo/s):
                    </p>
                  </div>

                  {/* Bank Alias & Holder Card (Without CBU) */}
                  <div className="p-6 bg-white border border-[#D8CEB9] space-y-4">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#263D32] font-semibold pb-2 border-b border-[#D8CEB9]">
                      <Landmark className="w-4 h-4" />
                      <span>
                        Datos de Transferencia · Seña (
                        {paymentConfig.depositPercentage}%)
                      </span>
                    </div>

                    <div className="space-y-2.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between py-1.5 border-b border-[#D8CEB9]/50">
                        <span className="text-[#746657]">Entidad:</span>
                        <span className="font-medium text-[#292D29]">
                          {paymentConfig.bankName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1.5 border-b border-[#D8CEB9]/50">
                        <span className="text-[#746657]">Titular:</span>
                        <span className="font-medium text-[#292D29]">
                          {paymentConfig.bankHolder}
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-2.5 px-3.5 bg-[#F2EFE6] border border-[#D8CEB9]">
                        <div>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#746657] block">
                            Alias Bancario
                          </span>
                          <span className="text-base font-bold text-[#263D32] tracking-wider">
                            {paymentConfig.bankAlias}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={handleCopyAlias}
                          className="px-3 py-1.5 bg-[#263D32] text-[#F2EFE6] text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>
                            {copiedAlias ? "Copiado" : "Copiar Alias"}
                          </span>
                        </button>
                      </div>
                    </div>

                    {(paymentConfig.mercadoPagoLink ||
                      paymentConfig.internationalPaymentLink) && (
                      <div className="pt-2 space-y-2">
                        {paymentConfig.mercadoPagoLink && (
                          <a
                            href={paymentConfig.mercadoPagoLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2"
                          >
                            <span>Pagar seña con Mercado Pago</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        {paymentConfig.internationalPaymentLink && (
                          <a
                            href={paymentConfig.internationalPaymentLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-3 px-4 border border-[#263D32] text-[#263D32] hover:bg-[#263D32] hover:text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2"
                          >
                            <span>Pago Internacional (PayPal / Tarjeta)</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 px-6 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 text-[#D8CEB9]" />
                      <span>Enviar comprobante por WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setCreatedInquiry(null)}
                      className="w-full sm:w-auto px-6 py-3.5 border border-[#746657]/40 text-[#292D29] hover:bg-[#D8CEB9]/40 text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer"
                    >
                      Nueva solicitud
                    </button>
                  </div>
                </div>
              ) : (
                /* DÍA LIBRE SOLICITADO -> CONFIRMACIÓN SIN SEÑA */
                <div className="space-y-6">
                  <div className="p-6 bg-[#263D32] text-[#F2EFE6] space-y-3">
                    <div className="flex items-center gap-2 text-[#D8CEB9] text-xs uppercase tracking-[0.22em]">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>
                        Solicitud enviada por correo a {targetAdminEmail}
                      </span>
                    </div>
                    <h4 className="font-editorial text-3xl">
                      ¡Gracias, {createdInquiry.fullName}!
                    </h4>
                    <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                      Tu solicitud (<strong>{createdInquiry.bookingCode}</strong>
                      ) para el día <strong>{createdInquiry.desiredDate}</strong>{" "}
                      fue enviada a nuestro equipo. Como se trata de pedir un
                      día libre,{" "}
                      <strong>no debés abonar ninguna seña ahora</strong> hasta
                      que confirmemos disponibilidad para esa fecha.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                    <a
                      href={whatsappDirectUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full sm:flex-1 px-6 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold transition-colors inline-flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4 text-[#D8CEB9]" />
                      <span>Escribir por WhatsApp</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => setCreatedInquiry(null)}
                      className="w-full sm:w-auto px-6 py-3.5 border border-[#746657]/40 text-[#292D29] hover:bg-[#D8CEB9]/40 text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer"
                    >
                      Enviar otra consulta
                    </button>
                  </div>
                </div>
              )
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Google Fast Fill */}
                <div className="p-3.5 bg-white border border-[#D8CEB9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 text-xs">
                    <GoogleLogoSvg className="w-4 h-4" />
                    {googleUser ? (
                      <span>
                        Conectado como{" "}
                        <strong className="text-[#263D32]">
                          {googleUser.name}
                        </strong>{" "}
                        ({googleUser.email})
                      </span>
                    ) : (
                      <span>
                        Podés vincular tu cuenta de Google para autocompletar
                        tus datos
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleModalOpen(true)}
                    className="px-3.5 py-1.5 bg-[#F2EFE6] hover:bg-[#D8CEB9] text-[#263D32] border border-[#D8CEB9] text-[10px] uppercase tracking-[0.18em] font-semibold cursor-pointer"
                  >
                    {googleUser ? "Cambiar cuenta" : "Vincular Google"}
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                    Tipo de solicitud *
                  </label>
                  <select
                    value={bookingMode}
                    onChange={(e) => handleModeChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#263D32] font-medium"
                  >
                    <option value="FREE_DAY">
                      Pedir reservar un día libre a medida (Sin seña previa)
                    </option>
                    {availableDepartures.map((dep) => (
                      <option key={dep.id} value={dep.id}>
                        Salida Programada {dep.date} — {dep.destination} (
                        {dep.availableSpots} de {dep.maxParticipants} cupos
                        libres · Con seña {paymentConfig.depositPercentage}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Nombre y apellido *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Ej. Martín Aguirre"
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Correo electrónico *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@gmail.com"
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Número de WhatsApp *
                    </label>
                    <input
                      type="tel"
                      required
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="+54 9 11 0000-0000"
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Fecha {isScheduledDeparture ? "programada" : "deseada"} *
                    </label>
                    <input
                      type="date"
                      required
                      readOnly={isScheduledDeparture}
                      value={
                        selectedDeparture ? selectedDeparture.date : desiredDate
                      }
                      onChange={(e) => setDesiredDate(e.target.value)}
                      className={`w-full px-4 py-3 border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29] ${
                        isScheduledDeparture
                          ? "bg-[#F2EFE6] font-semibold text-[#263D32]"
                          : "bg-white"
                      }`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Modalidad de experiencia
                    </label>
                    <select
                      value={experienceType}
                      onChange={(e) => setExperienceType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    >
                      {experiences.map((exp) => (
                        <option key={exp.id} value={exp.title}>
                          {exp.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Formato de grupo
                    </label>
                    <select
                      value={serviceGroupType}
                      onChange={(e) => handleGroupTypeChange(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    >
                      <option value="Salida individual">
                        Salida individual (1 cupo)
                      </option>
                      <option value="Salida para dos personas">
                        Salida para dos personas (2 cupos)
                      </option>
                      <option value="Salida grupal">Salida grupal</option>
                      <option value="Salida privada o personalizada">
                        Salida privada o personalizada
                      </option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      {isScheduledDeparture
                        ? `Cupos a ocupar (Máx. ${maxAllowedSpots} libres)`
                        : "Cantidad de participantes"}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={maxAllowedSpots}
                      value={participantsCount}
                      onChange={(e) => setParticipantsCount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29] font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Nivel en pesca con mosca
                    </label>
                    <select
                      value={skillLevel}
                      onChange={(e) =>
                        setSkillLevel(
                          e.target.value as
                            | "Iniciación / Primeros pasos"
                            | "Intermedio"
                            | "Avanzado / Experimentado"
                        )
                      }
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    >
                      <option value="Iniciación / Primeros pasos">
                        Iniciación / Primeros pasos
                      </option>
                      <option value="Intermedio">Intermedio</option>
                      <option value="Avanzado / Experimentado">
                        Avanzado / Experimentado
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                    Comentarios adicionales
                  </label>
                  <textarea
                    rows={3}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Contanos qué río te gustaría conocer, si requerís equipamiento o cualquier detalle especial..."
                    className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                  />
                </div>

                {/* Mandatory Legal Checkbox */}
                <label className="p-4 bg-white border border-[#D8CEB9] flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    required
                    checked={legalAccepted}
                    onChange={(e) => setLegalAccepted(e.target.checked)}
                    className="mt-1 w-4 h-4 accent-[#263D32]"
                  />
                  <span className="text-xs text-[#292D29]/85 leading-relaxed">
                    Declaro ser mayor de 18 años y acepto los{" "}
                    <Link
                      href="/terminos"
                      target="_blank"
                      className="underline text-[#263D32] font-medium"
                    >
                      Términos y Condiciones Comerciales
                    </Link>
                    {isScheduledDeparture ? (
                      <>
                        , el régimen de reserva con{" "}
                        <strong>
                          {paymentConfig.depositPercentage}% de seña
                        </strong>
                      </>
                    ) : null}
                    , el{" "}
                    <Link
                      href="/terminos#deslinde"
                      target="_blank"
                      className="underline text-[#263D32] font-medium"
                    >
                      Deslinde de Responsabilidad de Pesca y Navegación
                    </Link>{" "}
                    y la{" "}
                    <Link
                      href="/privacidad"
                      target="_blank"
                      className="underline text-[#263D32] font-medium"
                    >
                      Política de Privacidad
                    </Link>
                    .
                  </span>
                </label>

                {errorMsg && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3">
                    {errorMsg}
                  </p>
                )}

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-[#746657] leading-relaxed max-w-xs">
                    {isScheduledDeparture
                      ? `* Al confirmar se descontarán tus cupos y verás los datos para abonar el ${paymentConfig.depositPercentage}% de seña.`
                      : `* Al pedir un día libre no abonás seña ahora; tu consulta se envía por mail a ${targetAdminEmail}.`}
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? "Enviando solicitud..."
                        : isScheduledDeparture
                        ? `Contratar ${participantsCount} cupo(s) (Con seña)`
                        : "Pedir reservar este día (Sin seña)"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSuccess={(session) => {
          signIn(session);
          setFullName(session.name);
          setEmail(session.email);
        }}
        googleClientId={settings.googleClientId}
      />
    </section>
  );
}
