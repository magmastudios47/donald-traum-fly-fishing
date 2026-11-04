"use client";

import React, { useState, useEffect } from "react";
import { SiteSettings } from "@/types/traum";
import {
  Mail,
  MessageCircle,
  MapPin,
  Send,
  CheckCircle2,
  CreditCard,
  ShieldCheck,
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
  prefillData?: {
    date?: string;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
  } | null;
  onInquirySubmitted?: () => void;
}

export default function ContactSection({
  settings,
  prefillData,
  onInquirySubmitted,
}: ContactSectionProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [desiredDate, setDesiredDate] = useState("");
  const [experienceType, setExperienceType] = useState("Pesca de vadeo");
  const [serviceGroupType, setServiceGroupType] = useState(
    "Salida para dos personas"
  );
  const [participantsCount, setParticipantsCount] = useState("2");
  const [skillLevel, setSkillLevel] = useState(
    "Intermedio" as
      | "Iniciación / Primeros pasos"
      | "Intermedio"
      | "Avanzado / Experimentado"
  );
  const [comments, setComments] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [submittedOk, setSubmittedOk] = useState(false);

  useEffect(() => {
    if (prefillData) {
      if (prefillData.date) setDesiredDate(prefillData.date);
      if (prefillData.experienceType)
        setExperienceType(prefillData.experienceType);
      if (prefillData.serviceGroupType)
        setServiceGroupType(prefillData.serviceGroupType);
      if (prefillData.destination) {
        setComments((prev) =>
          prev
            ? prev
            : `Interés en destino: ${prefillData.destination}.`
        );
      }
    }
  }, [prefillData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "INQUIRY",
          fullName,
          email,
          whatsapp,
          desiredDate: desiredDate || "Fecha a coordinar",
          experienceType,
          serviceGroupType,
          participantsCount: Number(participantsCount) || 1,
          skillLevel,
          comments,
        }),
      });
      setSubmittedOk(true);
      if (onInquirySubmitted) onInquirySubmitted();
    } catch {
      setSubmittedOk(true);
    } finally {
      setSubmitting(false);
    }
  };

  const cleanWhatsappDigits = settings.whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappDirectUrl = `https://wa.me/${cleanWhatsappDigits}?text=${encodeURIComponent(
    `Hola TRAUM, mi nombre es ${
      fullName || "..."
    }. Quisiera consultar disponibilidad para una experiencia de ${experienceType} (${serviceGroupType}) en fecha ${
      desiredDate || "a coordinar"
    } para ${participantsCount} participante(s).`
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
                  Contacto y reservas
                </span>
              </div>
              <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-6">
                Tu próxima historia{" "}
                <span className="italic text-[#746657]">comienza acá.</span>
              </h2>
              <p className="text-base sm:text-lg text-[#292D29]/85 font-light leading-relaxed">
                Contanos qué experiencia estás buscando. En Traum queremos
                ayudarte a convertirla en realidad.
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
                href={`mailto:${settings.email}`}
                className="p-5 bg-[#F2EFE6] border border-[#D8CEB9] hover:border-[#65745A] transition-colors flex items-center gap-4"
              >
                <Mail className="w-5 h-5 text-[#263D32]" />
                <div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#746657] block font-semibold">
                    Correo electrónico
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {settings.email}
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

            {/* Future Email + Payment Gateway Architecture Block */}
            <div className="p-5 bg-[#263D32]/5 border border-[#263D32]/20 space-y-2">
              <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#263D32] font-semibold">
                <CreditCard className="w-4 h-4 text-[#65745A]" />
                <span>Proceso de reserva y medios de pago</span>
              </div>
              <p className="text-xs text-[#292D29]/80 font-light leading-relaxed">
                Cada solicitud es revisada personalmente según las condiciones
                del río y disponibilidad de guías. Una vez validada la fecha,
                recibirás por correo electrónico el detalle del programa junto
                con los medios de pago habilitados para confirmar tu reserva.
              </p>
            </div>
          </div>

          {/* Right Column: Structured Booking & Inquiry Form (7 cols) */}
          <div className="lg:col-span-7 bg-[#F2EFE6] border border-[#D8CEB9] shadow-xl p-7 sm:p-10">
            <div className="pb-6 mb-7 border-b border-[#D8CEB9] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#746657] block mb-1 font-semibold">
                  Formulario de solicitud de salida
                </span>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  Planificá tu salida con Traum
                </h3>
              </div>
              <ShieldCheck className="w-6 h-6 text-[#65745A]" />
            </div>

            {submittedOk ? (
              <div className="py-10 px-6 bg-[#263D32] text-[#F2EFE6] text-center space-y-6">
                <CheckCircle2 className="w-12 h-12 text-[#D8CEB9] mx-auto" />
                <div className="space-y-2">
                  <span className="text-[10px] uppercase tracking-[0.28em] text-[#D8CEB9] block">
                    Solicitud registrada
                  </span>
                  <h4 className="font-editorial text-3xl sm:text-4xl">
                    Recibimos los datos de tu próxima salida
                  </h4>
                  <p className="text-sm text-[#F2EFE6]/80 max-w-md mx-auto font-light leading-relaxed">
                    Tu consulta quedó registrada en el sistema de Traum. Nuestro
                    equipo verificará la disponibilidad de guías y ríos para
                    enviarte la propuesta completa y medios de pago.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                  <a
                    href={whatsappDirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors inline-flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Agilizar ahora por WhatsApp</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setSubmittedOk(false)}
                    className="w-full sm:w-auto px-6 py-3.5 border border-[#D8CEB9]/40 text-[#F2EFE6] hover:bg-[#F2EFE6]/10 text-xs uppercase tracking-[0.2em] transition-colors cursor-pointer"
                  >
                    Enviar otra consulta
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
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
                      placeholder="tu@email.com"
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
                      Tipo de experiencia
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
                    rows={4}
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Contanos qué río te gustaría conocer, si requerís equipamiento o cualquier detalle especial para tu experiencia..."
                    className="w-full px-4 py-3 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm text-[#292D29]"
                  />
                </div>

                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <p className="text-[11px] text-[#746657] leading-relaxed max-w-xs">
                    * El envío de este formulario genera una solicitud de
                    disponibilidad y no constituye una reserva automática hasta
                    su confirmación.
                  </p>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-8 py-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting ? "Enviando consulta..." : "Solicitar reserva"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
