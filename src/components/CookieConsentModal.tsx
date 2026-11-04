"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { CookieConsentPreferences } from "@/types/traum";
import { getSavedGoogleSession } from "@/lib/google-session";
import { ShieldCheck, Cookie, Sliders } from "lucide-react";

const COOKIE_STORAGE_KEY = "traum_cookie_consent_v1";
const VISITOR_ID_KEY = "traum_visitor_id_v1";
export const OPEN_COOKIE_SETTINGS_EVENT = "traum-open-cookie-settings";

function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(VISITOR_ID_KEY);
    if (!vid) {
      vid = `v-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem(VISITOR_ID_KEY, vid);
    }
    return vid;
  } catch {
    return `v-${Date.now()}`;
  }
}

export default function CookieConsentModal() {
  const [visible, setVisible] = useState(false);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [prefs, setPrefs] = useState<CookieConsentPreferences>({
    essential: true,
    googleAuth: true,
    payments: true,
    analytics: true,
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem(COOKIE_STORAGE_KEY);
      if (!saved) {
        setVisible(true);
      } else {
        const parsed = JSON.parse(saved);
        if (parsed?.preferences) {
          setPrefs(parsed.preferences);
        }
      }
    } catch {
      setVisible(true);
    }

    const handleOpenSettings = () => {
      setVisible(true);
      setCustomizeOpen(true);
    };
    window.addEventListener(OPEN_COOKIE_SETTINGS_EVENT, handleOpenSettings);
    return () => {
      window.removeEventListener(
        OPEN_COOKIE_SETTINGS_EVENT,
        handleOpenSettings
      );
    };
  }, []);

  const persistConsent = async (
    decision: "accepted" | "rejected" | "custom",
    customPrefs?: CookieConsentPreferences
  ) => {
    setSaving(true);
    const finalPrefs: CookieConsentPreferences =
      decision === "accepted"
        ? { essential: true, googleAuth: true, payments: true, analytics: true }
        : decision === "rejected"
        ? {
            essential: true,
            googleAuth: false,
            payments: true,
            analytics: false,
          }
        : customPrefs || prefs;

    const visitorId = getOrCreateVisitorId();
    const googleSession = getSavedGoogleSession();

    const payload = {
      visitorId,
      decision,
      preferences: finalPrefs,
      googleEmail: googleSession?.email,
      savedAt: new Date().toISOString(),
    };

    try {
      localStorage.setItem(COOKIE_STORAGE_KEY, JSON.stringify(payload));
      document.cookie = `traum_cookie_consent=${encodeURIComponent(
        decision
      )}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Ignore browser storage restriction
    }

    try {
      await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "COOKIE_CONSENT",
          visitorId,
          decision,
          preferences: finalPrefs,
          googleEmail: googleSession?.email,
        }),
      });
    } catch {
      // Saved locally if offline
    } finally {
      setSaving(false);
      setVisible(false);
      setCustomizeOpen(false);
    }
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
                Privacidad y Cumplimiento Ley 25.326
              </span>
              <h3 className="font-editorial text-2xl sm:text-3xl text-[#F2EFE6]">
                Consentimiento de Cookies y Datos
              </h3>
            </div>
          </div>
          <ShieldCheck className="w-5 h-5 text-[#899487] flex-shrink-0" />
        </div>

        <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
          En <strong>TRAUM | Fly Cast Patagonia</strong> registramos tu
          preferencia de cookies en nuestro servidor de conformidad con la
          normativa de protección de datos personales. Utilizamos cookies
          esenciales para el calendario de salidas, sesiones verificadas de{" "}
          <strong>Google</strong> para reseñas y seguridad en contrataciones.
        </p>

        {customizeOpen && (
          <div className="p-4 bg-[#292D29]/75 border border-[#899487]/35 space-y-3 text-xs">
            <label className="flex items-center justify-between gap-3 py-1.5 border-b border-[#899487]/20">
              <div>
                <span className="font-semibold text-[#D8CEB9] block">
                  1. Cookies Técnicas y Esenciales (Obligatorias)
                </span>
                <span className="text-[11px] text-[#F2EFE6]/70">
                  Necesarias para seguridad, reservas y guardado de tu elección.
                </span>
              </div>
              <input type="checkbox" checked disabled className="w-4 h-4" />
            </label>

            <label className="flex items-center justify-between gap-3 py-1.5 border-b border-[#899487]/20 cursor-pointer">
              <div>
                <span className="font-semibold text-[#F2EFE6] block">
                  2. Autenticación con Google (Reseñas y Reservas)
                </span>
                <span className="text-[11px] text-[#F2EFE6]/70">
                  Permite recordar tu cuenta de Google al dejar reseñas.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.googleAuth}
                onChange={(e) =>
                  setPrefs({ ...prefs, googleAuth: e.target.checked })
                }
                className="w-4 h-4 accent-[#D8CEB9]"
              />
            </label>

            <label className="flex items-center justify-between gap-3 py-1.5 cursor-pointer">
              <div>
                <span className="font-semibold text-[#F2EFE6] block">
                  3. Analítica y Mejora de Experiencia
                </span>
                <span className="text-[11px] text-[#F2EFE6]/70">
                  Métricas anónimas de rendimiento de mapas y calendario.
                </span>
              </div>
              <input
                type="checkbox"
                checked={prefs.analytics}
                onChange={(e) =>
                  setPrefs({ ...prefs, analytics: e.target.checked })
                }
                className="w-4 h-4 accent-[#D8CEB9]"
              />
            </label>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-[#D8CEB9]/90">
          <div className="flex flex-wrap items-center gap-4 underline">
            <Link href="/cookies" onClick={() => setVisible(false)}>
              Política de Cookies
            </Link>
            <Link href="/privacidad" onClick={() => setVisible(false)}>
              Política de Privacidad
            </Link>
            <Link href="/terminos" onClick={() => setVisible(false)}>
              Términos Comerciales
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setCustomizeOpen((prev) => !prev)}
            className="inline-flex items-center gap-1.5 text-[#D8CEB9] hover:text-[#F2EFE6] cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>{customizeOpen ? "Ocultar opciones" : "Personalizar"}</span>
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => persistConsent("rejected")}
            className="w-full sm:w-auto px-5 py-3 border border-[#D8CEB9]/40 text-[#F2EFE6] hover:bg-[#292D29] text-xs uppercase tracking-[0.2em] font-medium transition-colors cursor-pointer"
          >
            Rechazar no esenciales
          </button>

          {customizeOpen ? (
            <button
              type="button"
              disabled={saving}
              onClick={() => persistConsent("custom", prefs)}
              className="w-full sm:w-auto px-6 py-3 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
            >
              Guardar preferencias
            </button>
          ) : (
            <button
              type="button"
              disabled={saving}
              onClick={() => persistConsent("accepted")}
              className="w-full sm:w-auto px-7 py-3 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
            >
              Aceptar todas las cookies
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
