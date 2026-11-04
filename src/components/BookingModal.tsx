"use client";

import React, { useState, useEffect } from "react";
import { SiteSettings } from "@/types/traum";
import { X, Send, CheckCircle2, MessageCircle } from "lucide-react";

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SiteSettings;
  prefillData?: {
    date?: string;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
  } | null;
}

export default function BookingModal({
  isOpen,
  onClose,
  settings,
  prefillData,
}: BookingModalProps) {
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
        setComments(`Consulta para destino: ${prefillData.destination}`);
      }
    }
  }, [prefillData]);

  if (!isOpen) return null;

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
    } catch {
      setSubmittedOk(true);
    } finally {
      setSubmitting(false);
    }
  };

  const cleanWhatsappDigits = settings.whatsappNumber.replace(/[^0-9]/g, "");
  const whatsappDirectUrl = `https://wa.me/${cleanWhatsappDigits}?text=${encodeURIComponent(
    `Hola TRAUM, soy ${
      fullName || "..."
    }. Quisiera consultar disponibilidad para ${experienceType} (${serviceGroupType}) en fecha ${
      desiredDate || "a coordinar"
    } para ${participantsCount} participante(s).`
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
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
              TRAUM · Solicitud de disponibilidad
            </span>
            <h3 className="font-editorial text-2xl sm:text-3xl">
              Planificá tu próxima salida
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 bg-[#292D29]/60 hover:bg-[#292D29] text-[#F2EFE6] flex items-center justify-center transition-colors cursor-pointer"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-8">
          {submittedOk ? (
            <div className="py-8 px-4 text-center space-y-6">
              <CheckCircle2 className="w-12 h-12 text-[#263D32] mx-auto" />
              <div className="space-y-2">
                <h4 className="font-editorial text-3xl text-[#263D32]">
                  ¡Gracias por tu consulta, {fullName}!
                </h4>
                <p className="text-sm text-[#292D29]/80 max-w-md mx-auto font-light leading-relaxed">
                  Registramos tu solicitud en nuestro sistema. Revisaremos la
                  disponibilidad para tu fecha y nos pondremos en contacto con
                  los detalles del programa y medios de pago.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <a
                  href={whatsappDirectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Continuar por WhatsApp</span>
                </a>
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedOk(false);
                    onClose();
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 border border-[#746657]/40 text-xs uppercase tracking-[0.2em] text-[#292D29] hover:bg-[#D8CEB9]/40 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
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
                    placeholder="tu@email.com"
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
                    Tipo de experiencia
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
                    Modalidad de servicio
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
                  rows={3}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="Preferencias de ríos, equipamiento u objetivos para la jornada..."
                  className="w-full px-3.5 py-2.5 bg-white border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                />
              </div>

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
                  className="w-full sm:w-auto px-7 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting ? "Registrando..." : "Consultar disponibilidad"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
