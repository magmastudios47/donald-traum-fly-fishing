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
  prefillData?: {
    date?: string;
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
  services,
  prefillData,
  onInquirySubmitted,
}: ContactSectionProps) {
  const { user: googleUser, signIn } = useGoogleSession();
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [selectedServiceTitle, setSelectedServiceTitle] = useState(
    "Pesca de vadeo"
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

  useEffect(() => {
    if (googleUser) {
      if (!fullName) setFullName(googleUser.name);
      if (!email) setEmail(googleUser.email);
    }
  }, [googleUser, fullName, email]);

  useEffect(() => {
    if (prefillData) {
      if (prefillData.date) setDesiredDate(prefillData.date);
      if (prefillData.experienceType)
        setExperienceType(prefillData.experienceType);
      if (prefillData.serviceGroupType)
        setServiceGroupType(prefillData.serviceGroupType);
      if (prefillData.selectedServiceTitle)
        setSelectedServiceTitle(prefillData.selectedServiceTitle);
      if (prefillData.destination) {
        setComments((prev) =>
          prev ? prev : `Interés en destino: ${prefillData.destination}.`
        );
      }
    }
  }, [prefillData]);

  const catalogOptions = [
    ...experiences.map((e) => ({
      label: `Experiencia: ${e.title} (${e.modality})`,
      value: e.title,
    })),
    ...services
      .filter((s) => s.enabled)
      .map((s) => ({
        label: `Servicio: ${s.title}`,
        value: s.title,
      })),
  ];

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
        "Debés aceptar los Términos y Condiciones, Política de Seña y Deslinde de Responsabilidad para continuar."
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
        setErrorMsg(data?.error || "Error al procesar la contratación.");
        return;
      }

      const inquiry: BookingInquiry = data.inquiry;
      setCreatedInquiry(inquiry);
      if (onInquirySubmitted) onInquirySubmitted(inquiry);

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
    `Hola TRAUM, mi nombre es ${fullName || "..."}. Acabo de contratar "${selectedServiceTitle}" (${
      createdInquiry?.bookingCode || "Consulta"
    }) para fecha ${
      desiredDate || "a coordinar"
    } (${participantsCount} pers.).`
  )}`;

  return (
    <section
      id="contacto"
      className="py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] relative border-t border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* Left Column: Editorial Invitation & Direct Channels (5 cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="w-8 h-[1px] bg-[#263D32]" />
                <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                  Contacto y contratación
                </span>
              </div>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-6">
                Tu próxima historia{" "}
                <span className="italic text-[#746657]">comienza acá.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#292D29]/85 font-light leading-relaxed">
                Contratá tu experiencia o servicio directamente desde este
                formulario. El pedido llega al instante a{" "}
                <strong>{targetAdminEmail}</strong> y habilita los datos para
                abonar la seña del{" "}
                <strong>{paymentConfig.depositPercentage}%</strong>.
              </p>
            </div>

            {/* Direct Contact Channels */}
            <div className="space-y-4 pt-2">
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
                <span>
                  Contratación segura · Seña del {paymentConfig.depositPercentage}%
                </span>
              </div>
              <p className="text-xs text-[#292D29]/80 font-light leading-relaxed">
                Los datos bancarios del propietario (Alias y Titular) no se
                publican de forma abierta: se habilitan exclusivamente al
                confirmar la solicitud de contratación de uno de nuestros
                servicios.
              </p>
            </div>
          </div>

          {/* Right Column: Structured Contracting & Booking Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#F2EFE6] border border-[#D8CEB9] shadow-xl p-7 sm:p-10">
            <div className="pb-6 mb-7 border-b border-[#D8CEB9] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#746657] block mb-1 font-semibold">
                  {createdInquiry
                    ? `Paso 2 · Datos de Seña (${paymentConfig.depositPercentage}%)`
                    : "Paso 1 · Formulario de contratación de servicio"}
                </span>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  {createdInquiry
                    ? `Pedido ${createdInquiry.bookingCode} Confirmado`
                    : "Contratá tu salida con Traum"}
                </h3>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#65745A]" />
            </div>

            {createdInquiry ? (
              <div className="space-y-6">
                <div className="p-6 bg-[#263D32] text-[#F2EFE6] space-y-2">
                  <div className="flex items-center gap-2 text-[#D8CEB9] text-xs uppercase tracking-[0.22em]">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pedido enviado a {targetAdminEmail}</span>
                  </div>
                  <h4 className="font-editorial text-3xl">
                    ¡Gracias, {createdInquiry.fullName}!
                  </h4>
                  <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                    A continuación se encuentran habilitados los datos para
                    abonar la seña del{" "}
                    <strong>{paymentConfig.depositPercentage}%</strong> por el
                    servicio <strong>{createdInquiry.selectedServiceTitle}</strong>:
                  </p>
                </div>

                {/* Bank Alias & Holder Card (Without CBU) */}
                <div className="p-6 bg-white border border-[#D8CEB9] space-y-4">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#263D32] font-semibold pb-2 border-b border-[#D8CEB9]">
                    <Landmark className="w-4 h-4" />
                    <span>
                      Datos de Transferencia · Seña ({paymentConfig.depositPercentage}%)
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
                        <span>{copiedAlias ? "Copiado" : "Copiar Alias"}</span>
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
                    Contratar otro servicio
                  </button>
                </div>
              </div>
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
                        Podés vincular tu cuenta de Google para autocompletar tu
                        pedido
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
                    Servicio a contratar *
                  </label>
                  <select
                    value={selectedServiceTitle}
                    onChange={(e) => setSelectedServiceTitle(e.target.value)}
                    className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#263D32] font-medium"
                  >
                    {catalogOptions.map((opt, idx) => (
                      <option key={idx} value={opt.value}>
                        {opt.label}
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
                      Fecha deseada (o aproximada)
                    </label>
                    <input
                      type="date"
                      value={desiredDate}
                      onChange={(e) => setDesiredDate(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
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
                      <option value="Pesca de vadeo">Pesca de vadeo</option>
                      <option value="Pesca en balsa">Pesca en balsa</option>
                      <option value="Salida personalizada">
                        Salida personalizada
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Modalidad de grupo
                    </label>
                    <select
                      value={serviceGroupType}
                      onChange={(e) => setServiceGroupType(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                    >
                      <option value="Salida individual">
                        Salida individual
                      </option>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-2">
                      Cantidad de participantes
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={16}
                      value={participantsCount}
                      onChange={(e) => setParticipantsCount(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
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

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-[#746657] leading-relaxed max-w-xs">
                    * Al confirmar el pedido recibirás en pantalla los datos de
                    Alias y Titular para abonar la seña.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? "Registrando pedido..."
                        : "Contratar y ver datos de seña"}
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
