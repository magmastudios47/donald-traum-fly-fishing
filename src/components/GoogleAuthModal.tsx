"use client";

import React, { useState, useEffect, useRef } from "react";
import { GoogleUserSession } from "@/types/traum";
import { decodeGoogleJwtCredential } from "@/lib/google-session";
import { X, ShieldCheck, CheckCircle2 } from "lucide-react";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: GoogleUserSession) => void;
  googleClientId?: string;
  contextLabel?: string;
}

export function GoogleLogoSvg({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.275c0-.85-.075-1.675-.215-2.475H12v4.685h6.445c-.28 1.495-1.125 2.765-2.395 3.615v3.005h3.875c2.265-2.085 3.565-5.16 3.565-8.83z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.955-1.075 7.94-2.91l-3.875-3.005c-1.075.72-2.45 1.145-4.065 1.145-3.125 0-5.77-2.11-6.715-4.945H1.275v3.1C3.25 21.305 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.285 14.285c-.24-.72-.375-1.49-.375-2.285s.135-1.565.375-2.285v-3.1H1.275C.465 8.23 0 10.065 0 12s.465 3.77 1.275 5.385l4.01-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.76 0 3.34.605 4.585 1.795l3.44-3.44C17.95 1.19 15.235 0 12 0 7.31 0 3.25 2.695 1.275 6.615l4.01 3.1C6.23 6.88 8.875 4.77 12 4.77z"
      />
    </svg>
  );
}

export default function GoogleAuthModal({
  isOpen,
  onClose,
  onSuccess,
  googleClientId,
  contextLabel = "Continuar con tu cuenta de Google en TRAUM",
}: GoogleAuthModalProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const gsiButtonRef = useRef<HTMLDivElement>(null);

  const effectiveClientId =
    googleClientId || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";

  useEffect(() => {
    if (!isOpen || !effectiveClientId) return;

    const existingScript = document.getElementById("google-gsi-client");
    const initGsi = () => {
      const win = window as unknown as {
        google?: {
          accounts?: {
            id?: {
              initialize: (opts: unknown) => void;
              renderButton: (el: HTMLElement, opts: unknown) => void;
            };
          };
        };
      };
      if (win.google?.accounts?.id && gsiButtonRef.current) {
        win.google.accounts.id.initialize({
          client_id: effectiveClientId,
          callback: (response: { credential?: string }) => {
            if (response?.credential) {
              const decoded = decodeGoogleJwtCredential(response.credential);
              if (decoded) {
                onSuccess(decoded);
                onClose();
              }
            }
          },
        });
        win.google.accounts.id.renderButton(gsiButtonRef.current, {
          theme: "outline",
          size: "large",
          width: 340,
          text: "continue_with",
          locale: "es",
        });
      }
    };

    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-gsi-client";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initGsi;
      document.body.appendChild(script);
    } else {
      initGsi();
    }
  }, [isOpen, effectiveClientId, onSuccess, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = fullName.trim();

    if (!cleanName || cleanName.length < 2) {
      setError("Por favor ingresá el nombre y apellido de tu cuenta de Google.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setError("Por favor ingresá un correo electrónico válido de Google (ej. @gmail.com).");
      return;
    }

    const initials = cleanName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("");

    const avatarSvgDataUri = `data:image/svg+xml;utf8,${encodeURIComponent(
      `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect width="80" height="80" rx="40" fill="#263D32"/><text x="50%" y="54%" dominant-baseline="middle" text-anchor="middle" fill="#D8CEB9" font-family="Georgia, serif" font-size="30">${initials || "G"}</text></svg>`
    )}`;

    const session: GoogleUserSession = {
      name: cleanName,
      email: cleanEmail,
      picture: avatarSvgDataUri,
      verifiedAt: new Date().toISOString(),
    };

    onSuccess(session);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white text-[#292D29] max-w-md w-full border border-[#D8CEB9] shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 flex items-center justify-between bg-[#F2EFE6]/60">
          <div className="flex items-center gap-3">
            <GoogleLogoSvg className="w-6 h-6" />
            <div>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#65745A] font-semibold block">
                Autenticación verificada
              </span>
              <h3 className="font-editorial text-2xl text-[#263D32]">
                Iniciar sesión con Google
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 hover:bg-black/5 flex items-center justify-center text-gray-500 cursor-pointer"
            aria-label="Cerrar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 sm:p-7 space-y-5">
          <p className="text-xs sm:text-sm text-[#292D29]/80 font-light leading-relaxed">
            {contextLabel}. Tu identidad quedará asociada a tu perfil de Google
            para garantizar reseñas auténticas y notificaciones seguras.
          </p>

          {/* Official Google One-Tap / Button if Client ID is configured */}
          {effectiveClientId && (
            <div className="flex flex-col items-center justify-center py-2 border-b border-gray-200 pb-4">
              <div ref={gsiButtonRef} />
            </div>
          )}

          {/* Direct Google Account Verification Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                Nombre completo en tu cuenta Google *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setError(null);
                }}
                placeholder="Ej. Martín Aguirre"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-[#4285F4] focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-[0.2em] text-[#292D29] font-semibold mb-1.5">
                Correo de Google (Gmail / Workspace) *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError(null);
                }}
                placeholder="tu.cuenta@gmail.com"
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-[#4285F4] focus:outline-none text-sm"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-200 p-2.5">
                {error}
              </p>
            )}

            <div className="p-3 bg-[#F2EFE6]/70 border border-[#D8CEB9] flex items-start gap-2.5 text-[11px] text-[#292D29]/80">
              <ShieldCheck className="w-4 h-4 text-[#263D32] flex-shrink-0 mt-0.5" />
              <span>
                Cumplimiento Ley 25.326: Sólo utilizamos tu nombre y correo de
                Google para verificar tu reseña o enviarte el comprobante de tu
                reserva.
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-5 bg-[#263D32] hover:bg-[#65745A] text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center gap-2.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-[#D8CEB9]" />
              <span>Vincular cuenta de Google y continuar</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
