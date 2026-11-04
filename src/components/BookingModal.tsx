"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookingInquiry,
  ExperienceItem,
  PaymentConfig,
  ServiceFeatureItem,
  SiteSettings,
} from "@/types/traum";
import { useGoogleSession } from "@/lib/google-session";
import GoogleAuthModal, { GoogleLogoSvg } from "@/components/GoogleAuthModal";
import {
  X,
  Send,
  CheckCircle2,
  MessageCircle,
  Landmark,
  Copy,
  ExternalLink,
  ShieldCheck,
  Mail,
} from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SiteSettings;
  paymentConfig: PaymentConfig;
  experiences: ExperienceItem[];
  services: ServiceFeatureItem[];
  prefillData?: {
    date?: string;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
    selectedServiceTitle?: string;
    priceReference?: string;
    paymentLink?: string;
  } | null;
  onBookingCreated?: (inquiry: BookingInquiry) => void;
}

export default function BookingModal({
  isOpen,
  onClose,
  settings,
  paymentConfig,
  experiences,
  services,
  prefillData,
  onBookingCreated,
}: BookingModalProps) {
  const { user: googleUser, signIn } = useGoogleSession();
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [selectedServiceTitle, setSelectedServiceTitle] = useState(
    "Pesca de vadeo — Jornada guiada"
  );
  const [experienceType, setExperienceType] = useState("Pesca de vadeo");
  const [serviceGroupType, setServiceGroupType] = useState(
    "Salida para dos personas"
  );
  const [participantsCount, setParticipantsCount] = useState("2");
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

  // Autocomplete with Google session when available
  useEffect(() => {
    if (googleUser) {
      if (!fullName) setFullName(googleUser.name);
      if (!email) setEmail(googleUser.email);
    }
  }, [googleUser, fullName, email]);

  useEffect(() => {
    if (prefillData) {
      if (prefillData.date) setDesiredDate(prefillData.date);
      if (prefillData.experienceType) {
        setExperienceType(prefillData.experienceType);
      }
      if (prefillData.serviceGroupType) {
        setServiceGroupType(prefillData.serviceGroupType);
      }
      if (prefillData.selectedServiceTitle) {
        setSelectedServiceTitle(prefillData.selectedServiceTitle);
      } else if (prefillData.experienceType) {
        setSelectedServiceTitle(prefillData.experienceType);
      }
      if (prefillData.destination) {
        setComments(`Destino solicitado: ${prefillData.destination}`);
      }
    }
  }, [prefillData]);

  if (!isOpen) return null;

  const catalogOptions = [
    ...experiences.map((e) => ({
      label: `Experiencia: ${e.title} (${e.modality})`,
      value: e.title,
      price: e.priceLabel || "",
      link: e.paymentLink || "",
    })),
    ...services
      .filter((s) => s.enabled)
      .map((s) => ({
        label: `Servicio: ${s.title}`,
        value: s.title,
        price: s.priceLabel || s.note || "",
        link: s.paymentLink || "",
      })),
  ];

  const matchedCatalog = catalogOptions.find(
    (opt) => opt.value === selectedServiceTitle
  );
  const effectivePriceRef =
    prefillData?.priceReference || matchedCatalog?.price || "";
  const effectivePaymentLink =
    prefillData?.paymentLink ||
    matchedCatalog?.link ||
    paymentConfig.mercadoPagoLink ||
    "";

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
        "Debés aceptar los Términos y Condiciones, Política de Seña y Deslinde de Responsabilidad para contratar."
      );
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INQUIRY",
          fullName,
          email,
          googleEmail: googleUser?.email,
          whatsapp,
          desiredDate: desiredDate || "Fecha a coordinar",
          selectedServiceTitle,
          priceReference: effectivePriceRef,
          experienceType,
          serviceGroupType,
          participantsCount: Number(participantsCount) || 1,
          skillLevel,
          comments,
          legalAccepted: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data?.error || "No se pudo procesar la contratación.");
        return;
      }

      const inquiry: BookingInquiry = data.inquiry;
      setCreatedInquiry(inquiry);
      if (onBookingCreated) onBookingCreated(inquiry);

      // Client-side relay to traumflyfishing9@gmail.com as additional delivery guarantee
      const targetAdminEmail =
        settings.notificationEmail ||
        settings.email ||
        "traumflyfishing9@gmail.com";
      fetch(
        `https://formsubmit.co/ajax/${encodeURIComponent(targetAdminEmail)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            _subject: `[TRAUM Pedido ${inquiry.bookingCode}] ${inquiry.selectedServiceTitle} — ${inquiry.fullName}`,
            _template: "table",
            _captcha: "false",
            Codigo_Pedido: inquiry.bookingCode,
            Servicio_Contratado: inquiry.selectedServiceTitle,
            Cliente: inquiry.fullName,
            Email: inquiry.email,
            WhatsApp: inquiry.whatsapp,
            Fecha: inquiry.desiredDate,
            Experiencia: inquiry.experienceType,
            Modalidad_Grupo: inquiry.serviceGroupType,
            Participantes: inquiry.participantsCount,
            Nivel: inquiry.skillLevel,
            Sena_Requerida: `${paymentConfig.depositPercentage}%`,
            Comentarios: inquiry.comments || "-",
          }),
        }
      ).catch(() => {});
    } catch {
      setErrorMsg("Error de red al registrar el pedido. Intentá nuevamente.");
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
    `Hola TRAUM, acabo de contratar el servicio "${selectedServiceTitle}" (Pedido ${
      createdInquiry?.bookingCode || ""
    }) a nombre de ${fullName} para fecha ${
      desiredDate || "a coordinar"
    } (${participantsCount} pers.). Te envío el comprobante del ${
      paymentConfig.depositPercentage
    }% de seña.`
  )}`;

  const mailtoAdminUrl = `mailto:${targetAdminEmail}?subject=${encodeURIComponent(
    `Pedido ${createdInquiry?.bookingCode || "TRAUM"} - ${selectedServiceTitle} (${fullName})`
  )}&body=${encodeURIComponent(
    `Hola TRAUM,\n\nContraté el servicio: ${selectedServiceTitle}\nCódigo de pedido: ${
      createdInquiry?.bookingCode || "-"
    }\nNombre: ${fullName}\nEmail: ${email}\nWhatsApp: ${whatsapp}\nFecha deseada: ${
      desiredDate || "A coordinar"
    }\nModalidad: ${experienceType} (${serviceGroupType}) - ${participantsCount} participante(s)\n\nAdjunto / envío comprobante de seña (${
      paymentConfig.depositPercentage
    }%).`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-[#F2EFE6] text-[#292D29] max-w-2xl w-full border border-[#D8CEB9] shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Banner */}
        <div className="bg-[#263D32] text-[#F2EFE6] px-6 sm:px-8 py-6 flex items-center justify-between border-b border-[#899487]/30">
          <div>
            <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9] block mb-1">
              {createdInquiry
                ? `Paso 2 de 2 · Pago de Seña (${paymentConfig.depositPercentage}%) habilitado`
                : "Paso 1 de 2 · Contratación de Servicio y Reserva"}
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl">
              {createdInquiry
                ? `Pedido ${createdInquiry.bookingCode} Registrado`
                : "Contratá tu salida con Traum"}
            </h3>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreatedInquiry(null);
              onClose();
            }}
            className="w-9 h-9 bg-[#292D29]/60 hover:bg-[#292D29] text-[#F2EFE6] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {createdInquiry ? (
            /* PASO 2: REVELACIÓN DE DATOS DE PAGO (ALIAS Y TITULAR, SIN CBU) */
            <div className="space-y-6">
              <div className="p-5 bg-[#263D32] text-[#F2EFE6] border border-[#65745A] flex items-start gap-4">
                <CheckCircle2 className="w-7 h-7 text-[#D8CEB9] flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.24em] text-[#D8CEB9] block">
                    Solicitud enviada a {targetAdminEmail}
                  </span>
                  <h4 className="font-editorial text-2xl">
                    ¡Gracias, {createdInquiry.fullName}! Tu pedido{" "}
                    <span className="text-[#D8CEB9]">
                      {createdInquiry.bookingCode}
                    </span>{" "}
                    ya está registrado.
                  </h4>
                  <p className="text-xs text-[#F2EFE6]/85 font-light leading-relaxed">
                    Para confirmar y bloquear tu fecha en el calendario para{" "}
                    <strong>{createdInquiry.selectedServiceTitle}</strong>, a
                    continuación tenés habilitados los datos de pago de la seña
                    del <strong>{paymentConfig.depositPercentage}%</strong>.
                  </p>
                </div>
              </div>

              {/* Payment Data Card (Bank Name, Holder, Alias — NO CBU) */}
              <div className="bg-white border border-[#D8CEB9] p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between pb-3 border-b border-[#D8CEB9]">
                  <div className="flex items-center gap-2.5">
                    <Landmark className="w-5 h-5 text-[#263D32]" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[#263D32] font-semibold">
                      Datos Oficiales para Abonar la Seña (
                      {paymentConfig.depositPercentage}%)
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#65745A]" />
                </div>

                <div className="space-y-3 text-xs sm:text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-[#D8CEB9]/60">
                    <span className="text-[#746657]">Servicio contratado:</span>
                    <span className="font-semibold text-[#263D32]">
                      {createdInquiry.selectedServiceTitle}
                    </span>
                  </div>

                  {effectivePriceRef && (
                    <div className="flex items-center justify-between py-2 border-b border-[#D8CEB9]/60">
                      <span className="text-[#746657]">Referencia:</span>
                      <span className="font-medium text-[#292D29]">
                        {effectivePriceRef}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between py-2 border-b border-[#D8CEB9]/60">
                    <span className="text-[#746657]">Porcentaje de seña:</span>
                    <span className="px-2.5 py-0.5 bg-[#263D32] text-[#D8CEB9] text-xs font-semibold">
                      {paymentConfig.depositPercentage}% del total acordado
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#D8CEB9]/60">
                    <span className="text-[#746657]">Entidad / Banco:</span>
                    <span className="font-medium text-[#292D29]">
                      {paymentConfig.bankName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-[#D8CEB9]/60">
                    <span className="text-[#746657]">Titular de cuenta:</span>
                    <span className="font-medium text-[#292D29]">
                      {paymentConfig.bankHolder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2.5 bg-[#F2EFE6] px-4 border border-[#D8CEB9]">
                    <div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-[#746657] block">
                        Alias para transferencia
                      </span>
                      <span className="text-base font-bold tracking-wider text-[#263D32]">
                        {paymentConfig.bankAlias}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyAlias}
                      className="px-3.5 py-2 bg-[#263D32] hover:bg-[#65745A] text-[#F2EFE6] text-[10px] uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedAlias ? "Alias Copiado" : "Copiar Alias"}</span>
                    </button>
                  </div>
                </div>

                {/* Electronic payment links if configured */}
                {(effectivePaymentLink ||
                  paymentConfig.internationalPaymentLink) && (
                  <div className="pt-3 space-y-2.5 border-t border-[#D8CEB9]">
                    {effectivePaymentLink && (
                      <a
                        href={effectivePaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3.5 px-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>Pagar seña online con Mercado Pago</span>
                        <ExternalLink className="w-3.5 h-3.5 text-[#D8CEB9]" />
                      </a>
                    )}

                    {paymentConfig.internationalPaymentLink && (
                      <a
                        href={paymentConfig.internationalPaymentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 border border-[#263D32] text-[#263D32] hover:bg-[#263D32] hover:text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors"
                      >
                        <span>Pago Internacional (PayPal / Tarjeta)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons to Send Receipt */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:flex-1 py-3.5 px-5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.18em] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#D8CEB9]" />
                  <span>Enviar comprobante por WhatsApp</span>
                </a>

                <a
                  href={mailtoAdminUrl}
                  className="w-full sm:w-auto py-3.5 px-5 bg-white border border-[#263D32] text-[#263D32] hover:bg-[#D8CEB9]/40 text-xs uppercase tracking-[0.18em] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Enviar por Mail</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setCreatedInquiry(null);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-5 py-3.5 border border-[#746657]/40 text-xs uppercase tracking-[0.18em] text-[#292D29] hover:bg-[#D8CEB9]/40 transition-colors cursor-pointer"
                >
                  Finalizar
                </button>
              </div>
            </div>
          ) : (
            /* PASO 1: FORMULARIO DE CONTRATACIÓN */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Optional Google Account Fast-Fill Bar */}
              <div className="p-3.5 bg-white border border-[#D8CEB9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs">
                  <GoogleLogoSvg className="w-4 h-4 flex-shrink-0" />
                  {googleUser ? (
                    <span>
                      Conectado con Google como{" "}
                      <strong className="text-[#263D32]">
                        {googleUser.name}
                      </strong>{" "}
                      ({googleUser.email})
                    </span>
                  ) : (
                    <span className="text-[#292D29]/80">
                      ¿Querés autocompletar tus datos con tu cuenta de Google?
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#F2EFE6] hover:bg-[#D8CEB9] text-[#263D32] border border-[#D8CEB9] text-[10px] uppercase tracking-[0.18em] font-semibold cursor-pointer self-start sm:self-center"
                >
                  {googleUser ? "Cambiar cuenta" : "Vincular Google"}
                </button>
              </div>

              {/* Service Selector */}
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                  Servicio o experiencia a contratar *
                </label>
                <select
                  value={selectedServiceTitle}
                  onChange={(e) => setSelectedServiceTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm font-medium text-[#263D32]"
                >
                  {catalogOptions.map((opt, idx) => (
                    <option key={idx} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Nombre y apellido *
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Correo electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@gmail.com"
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Número de WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+54 9 ..."
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Fecha deseada
                  </label>
                  <input
                    type="date"
                    value={desiredDate}
                    onChange={(e) => setDesiredDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Modalidad técnica
                  </label>
                  <select
                    value={experienceType}
                    onChange={(e) => setExperienceType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  >
                    <option value="Pesca de vadeo">Pesca de vadeo</option>
                    <option value="Pesca en balsa">Pesca en balsa</option>
                    <option value="Salida personalizada">
                      Salida personalizada
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Formato de grupo
                  </label>
                  <select
                    value={serviceGroupType}
                    onChange={(e) => setServiceGroupType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  >
                    <option value="Salida individual">Salida individual</option>
                    <option value="Salida para dos personas">
                      Salida para dos personas
                    </option>
                    <option value="Salida grupal">Salida grupal</option>
                    <option value="Salida privada o personalizada">
                      Salida privada o personalizada
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                    Cantidad de participantes
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={16}
                    value={participantsCount}
                    onChange={(e) => setParticipantsCount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
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
                    className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
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
                <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                  Comentarios adicionales
                </label>
                <textarea
                  rows={2}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Preferencias de ríos, equipamiento u objetivos para la jornada..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                />
              </div>

              {/* Mandatory Commercial & Adventure Legal Consent Checkbox */}
              <label className="p-3.5 bg-white border border-[#D8CEB9] flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={legalAccepted}
                  onChange={(e) => setLegalAccepted(e.target.checked)}
                  className="mt-1 w-4 h-4 accent-[#263D32]"
                />
                <span className="text-xs text-[#292D29]/85 leading-relaxed">
                  Declaro ser mayor de 18 años y acepto expresamente los{" "}
                  <Link
                    href="/terminos"
                    target="_blank"
                    className="underline text-[#263D32] font-medium"
                  >
                    Términos y Condiciones Comerciales
                  </Link>
                  , el régimen de reserva con{" "}
                  <strong>{paymentConfig.depositPercentage}% de seña</strong>,
                  el{" "}
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

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-5 py-3 border border-[#746657]/40 text-xs uppercase tracking-[0.2em] text-[#292D29] hover:bg-[#D8CEB9]/40 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-7 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? "Procesando contratación..."
                      : "Confirmar pedido y ver datos de seña"}
                  </span>
                </button>
              </div>
            </form>
          )}
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
        contextLabel="Vinculá tu cuenta de Google para autocompletar tu contratación y recibir el detalle en tu correo"
      />
    </div>
  );
}
