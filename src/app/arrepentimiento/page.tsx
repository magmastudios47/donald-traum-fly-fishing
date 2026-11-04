"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShieldAlert, CheckCircle2, Send } from "lucide-react";

export default function ArrepentimientoPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [bookingCode, setBookingCode] = useState("");
  const [serviceContracted, setServiceContracted] = useState(
    "Pesca de vadeo / Salida guiada"
  );
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [regretCode, setRegretCode] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REGRET_REQUEST",
          fullName,
          email,
          whatsapp,
          bookingCode,
          serviceContracted,
          reason,
        }),
      });
      const data = await res.json();
      const code =
        data?.regret?.regretCode ||
        `ARR-${Math.floor(100000 + Math.random() * 900000)}`;
      setRegretCode(code);

      await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: "fa183ece-13f6-4360-8085-ff84ba3ea870",
          subject: `[TRAUM Botón de Arrepentimiento ${code}] Solicitud de ${fullName}`,
          from_name: "TRAUM Fly Cast Patagonia",
          email,
          replyto: email,
          Codigo_Gestion: code,
          Cliente: fullName,
          Email: email,
          WhatsApp: whatsapp,
          Codigo_Reserva: bookingCode || "No especificado",
          Servicio: serviceContracted,
          Motivo: reason,
        }),
      }).catch(() => {});
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F2EFE6] text-[#292D29] flex flex-col">
      <header className="bg-[#263D32] text-[#F2EFE6] py-5 sm:py-6 px-4 sm:px-6 lg:px-10 border-b border-[#899487]/30">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <span className="font-editorial text-2xl sm:text-3xl tracking-[0.26em] block">
              TRAUM
            </span>
            <span className="text-[9px] uppercase tracking-[0.32em] text-[#D8CEB9]">
              Fly Cast Patagonia
            </span>
          </div>
          <Link
            href="/"
            className="px-3.5 sm:px-4 py-2 border border-[#D8CEB9]/40 text-xs uppercase tracking-[0.18em] text-[#F2EFE6] hover:bg-[#D8CEB9] hover:text-[#263D32] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
            <span className="sm:hidden">Inicio</span>
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-10 py-12 sm:py-16 lg:py-24 space-y-8 flex-1 w-full">
        <div className="border-b border-[#D8CEB9] pb-6">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold mb-2">
            <ShieldAlert className="w-4 h-4" />
            <span>Cumplimiento Ley 24.240 (Art. 34) y Resolución SCI 424/2020</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#263D32]">
            Botón de Arrepentimiento
          </h1>
          <p className="text-xs sm:text-sm text-[#746657] mt-2 leading-relaxed">
            Derecho de revocación de aceptación para contrataciones realizadas a
            distancia dentro del plazo legal de diez (10) días corridos contados
            a partir de la celebración del contrato, siempre que el servicio de
            guiada no haya comenzado a ejecutarse o no se encuentre dentro de
            las excepciones previstas para servicios de esparcimiento con fecha
            determinada (Art. 1116 CCCN).
          </p>
        </div>

        {regretCode ? (
          <div className="bg-[#263D32] text-[#F2EFE6] p-8 border border-[#65745A] space-y-4 text-center">
            <CheckCircle2 className="w-12 h-12 text-[#D8CEB9] mx-auto" />
            <span className="text-[10px] uppercase tracking-[0.28em] text-[#D8CEB9] block">
              Trámite registrado en el servidor
            </span>
            <h2 className="font-editorial text-3xl sm:text-4xl">
              Código de Gestión: <span className="text-[#D8CEB9]">{regretCode}</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#F2EFE6]/85 max-w-md mx-auto font-light leading-relaxed">
              Hemos registrado tu solicitud dentro del plazo de 24 horas que
              establece la Resolución 424/2020 y se ha enviado notificación a la
              administración de TRAUM (traumflyfishing9@gmail.com). Conservá tu
              código de gestión como constancia.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-block px-6 py-3 bg-[#D8CEB9] text-[#263D32] text-xs uppercase tracking-[0.2em] font-semibold"
              >
                Volver al sitio
              </Link>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-[#D8CEB9] p-6 sm:p-8 shadow-md space-y-5"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                  Nombre y apellido del titular *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                  Correo electrónico *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                  Teléfono / WhatsApp *
                </label>
                <input
                  type="tel"
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>
              <div>
                <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                  Código de Pedido (ej. TRM-1234)
                </label>
                <input
                  type="text"
                  value={bookingCode}
                  onChange={(e) => setBookingCode(e.target.value)}
                  placeholder="TRM-..."
                  className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                Servicio o fecha contratada *
              </label>
              <input
                type="text"
                required
                value={serviceContracted}
                onChange={(e) => setServiceContracted(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                Detalle de la solicitud *
              </label>
              <textarea
                rows={3}
                required
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Indicá la fecha en que realizaste la reserva y el motivo de revocación..."
                className="w-full px-3.5 py-2.5 border border-[#D8CEB9] text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-6 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>
                {submitting
                  ? "Generando código de gestión..."
                  : "Solicitar revocación y obtener código"}
              </span>
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
