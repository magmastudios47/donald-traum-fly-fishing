"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShieldCheck, Cookie } from "lucide-react";

const COOKIE_STORAGE_KEY = "traum_cookie_consent_v1";

export default function CookieConsentModal() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const handleDecision = (decision: "accepted" | "rejected") => {
    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, decision);
    } catch {
      // Ignore storage error
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-end sm:items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-[#263D32] text-[#F2EFE6] border border-[#D8CEB9]/40 shadow-2xl p-6 sm:p-8 space-y-6">
        <div className="flex items-start justify-between gap-4 border-b border-[#899487]/30 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#292D29] border border-[#D8CEB9]/30 flex items-center justify-center">
              <Cookie className="w-5 h-5 text-[#D8CEB9]" />
            </div>
            <div>
              <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9] block">
                Privacidad y Transparencia
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#F2EFE6]">
                Consentimiento de Cookies y Datos
              </h3>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#899487] flex-shrink-0" />
        </div>

        <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
          En <strong>TRAUM | Fly Cast Patagonia</strong> utilizamos cookies
          esenciales y tecnologías de sesión para el funcionamiento del
          calendario de reservas, la futura autenticación segura con{" "}
          <strong>Google</strong> y la gestión de medios de pago. Podés aceptar
          todas las cookies o rechazar las no esenciales antes de continuar.
        </p>

        <div className="flex flex-wrap items-center gap-4 text-[11px] text-[#D8CEB9]/90 underline">
          <Link href="/cookies" onClick={() => setVisible(false)}>
            Política de Cookies
          </Link>
          <Link href="/privacidad" onClick={() => setVisible(false)}>
            Política de Privacidad
          </Link>
          <Link href="/terminos" onClick={() => setVisible(false)}>
            Términos y Condiciones
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleDecision("rejected")}
            className="w-full sm:w-auto px-5 py-3 border border-[#D8CEB9]/40 text-[#F2EFE6] hover:bg-[#292D29] text-xs uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
          >
            Rechazar no esenciales
          </button>
          <button
            type="button"
            onClick={() => handleDecision("accepted")}
            className="w-full sm:w-auto px-7 py-3 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
          >
            Aceptar cookies
          </button>
        </div>
      </div>
    </div>
  );
}
