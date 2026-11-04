"use client";

import React from "react";
import Link from "next/link";
import { SiteSettings } from "@/types/traum";
import { OPEN_COOKIE_SETTINGS_EVENT } from "@/components/CookieConsentModal";
import {
  Mail,
  MessageCircle,
  MapPin,
  Shield,
  ExternalLink,
  RotateCcw,
  Cookie,
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

interface FooterProps {
  settings: SiteSettings;
}

export default function Footer({ settings }: FooterProps) {
  const handleReopenCookieModal = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(OPEN_COOKIE_SETTINGS_EVENT));
    }
  };

  return (
    <footer className="bg-[#292D29] text-[#F2EFE6] border-t border-[#899487]/20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 pb-16 border-b border-[#899487]/20">
          {/* Brand Identity + Clean Cutout Emblem Seal (4 cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="flex items-center gap-5">
              <div className="w-24 h-24 flex-shrink-0 drop-shadow-[0_8px_18px_rgba(0,0,0,0.5)]">
                <img
                  src="/traum-medallion.png"
                  alt="Emblema Traum Fly Cast Junín de los Andes"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-editorial text-3xl sm:text-4xl tracking-[0.22em] text-[#F2EFE6] block">
                  TRAUM
                </span>
                <span className="text-[10px] uppercase tracking-[0.3em] text-[#D8CEB9] block mt-0.5">
                  Fly Cast · Junín de los Andes
                </span>
              </div>
            </div>

            <p className="font-editorial italic text-2xl text-[#D8CEB9]">
              “{settings.tagline}”
            </p>

            <p className="text-xs sm:text-sm text-[#F2EFE6]/70 font-light leading-relaxed max-w-md">
              Experiencias de pesca con mosca en los ríos y lagos de la
              Patagonia argentina. Naturaleza, técnica, respeto por el agua y
              sueños que se hacen realidad.
            </p>

            {/* Commercial & Fiscal Identification Box */}
            <div className="pt-2 text-[11px] text-[#F2EFE6]/60 space-y-1 border-t border-[#899487]/20">
              <p className="text-[#D8CEB9] font-medium">
                {settings.legalOwnerName || "Donald Traum — TRAUM Fly Cast Patagonia"}
              </p>
              <p>
                {settings.guideLicenseNumber ||
                  "Guía de Pesca Deportiva — Reglamento Continental Patagónico"}
              </p>
              <p>
                {settings.legalAddress ||
                  "Junín de los Andes, Provincia del Neuquén, Argentina"}
              </p>
            </div>
          </div>

          {/* Navigation Links (2 cols) */}
          <div className="lg:col-span-2 space-y-4">
            <span className="text-[11px] uppercase tracking-[0.24em] text-[#D8CEB9] font-semibold block">
              Navegación
            </span>
            <ul className="space-y-2.5 text-sm text-[#F2EFE6]/80 font-light">
              <li>
                <a href="#inicio" className="hover:text-[#D8CEB9] transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#filosofia" className="hover:text-[#D8CEB9] transition-colors">
                  La experiencia
                </a>
              </li>
              <li>
                <a href="#experiencias" className="hover:text-[#D8CEB9] transition-colors">
                  Experiencias
                </a>
              </li>
              <li>
                <a href="#destinos" className="hover:text-[#D8CEB9] transition-colors">
                  Destinos y Mapa
                </a>
              </li>
              <li>
                <a href="#servicios" className="hover:text-[#D8CEB9] transition-colors">
                  Servicios y Pagos
                </a>
              </li>
              <li>
                <a href="#calendario" className="hover:text-[#D8CEB9] transition-colors">
                  Calendario
                </a>
              </li>
              <li>
                <a href="#resenas" className="hover:text-[#D8CEB9] transition-colors">
                  Reseñas
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-[#D8CEB9] transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Legal, Consumer Protection & Privacy Links (3 cols) */}
          <div className="lg:col-span-3 space-y-4">
            <span className="text-[11px] uppercase tracking-[0.24em] text-[#D8CEB9] font-semibold block">
              Marco Legal y Consumidor
            </span>
            <ul className="space-y-2.5 text-sm text-[#F2EFE6]/80 font-light">
              <li>
                <Link
                  href="/terminos"
                  className="hover:text-[#D8CEB9] transition-colors"
                >
                  Términos y Condiciones Comerciales
                </Link>
              </li>
              <li>
                <Link
                  href="/terminos#deslinde"
                  className="hover:text-[#D8CEB9] transition-colors"
                >
                  Deslinde de Responsabilidad
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidad"
                  className="hover:text-[#D8CEB9] transition-colors"
                >
                  Política de Privacidad (Ley 25.326)
                </Link>
              </li>
              <li>
                <Link
                  href="/cookies"
                  className="hover:text-[#D8CEB9] transition-colors"
                >
                  Política de Cookies
                </Link>
              </li>
              <li>
                <button
                  type="button"
                  onClick={handleReopenCookieModal}
                  className="hover:text-[#D8CEB9] transition-colors inline-flex items-center gap-1.5 cursor-pointer text-left"
                >
                  <Cookie className="w-3.5 h-3.5 text-[#D8CEB9]" />
                  <span>Preferencias de Cookies</span>
                </button>
              </li>
            </ul>

            {/* Mandatory Botón de Arrepentimiento (Res. 424/2020) */}
            <div className="pt-2">
              <Link
                href="/arrepentimiento"
                className="w-full py-2.5 px-3.5 bg-[#263D32] hover:bg-[#65745A] border border-[#D8CEB9]/40 text-[#F2EFE6] text-[11px] uppercase tracking-[0.16em] font-semibold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#D8CEB9]" />
                <span>Botón de Arrepentimiento</span>
              </Link>
              <a
                href="https://www.argentina.gob.ar/produccion/defensadelconsumidor"
                target="_blank"
                rel="noopener noreferrer"
                className="block text-[10px] text-[#F2EFE6]/55 hover:text-[#D8CEB9] underline mt-2"
              >
                Defensa de las y los Consumidores · Para reclamos ingrese aquí
              </a>
            </div>
          </div>

          {/* Contact & Responsible Fishing Notice (3 cols) */}
          <div className="lg:col-span-3 space-y-5">
            <span className="text-[11px] uppercase tracking-[0.24em] text-[#D8CEB9] font-semibold block">
              Contacto Directo
            </span>
            <ul className="space-y-3 text-xs sm:text-sm text-[#F2EFE6]/80 font-light">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D8CEB9] flex-shrink-0 mt-0.5" />
                <span>{settings.locationGeneral}</span>
              </li>
              <li className="flex items-center gap-3">
                <MessageCircle className="w-4 h-4 text-[#D8CEB9] flex-shrink-0" />
                <span>{settings.whatsappNumber}</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#D8CEB9] flex-shrink-0" />
                <span className="break-all">{settings.email}</span>
              </li>
              <li className="flex items-center gap-3">
                <InstagramIcon className="w-4 h-4 text-[#D8CEB9] flex-shrink-0" />
                <a
                  href={settings.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-[#D8CEB9] transition-colors"
                >
                  {settings.instagramHandle}
                </a>
              </li>
            </ul>

            <div className="p-4 bg-[#263D32]/50 border border-[#899487]/25 space-y-1.5">
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#D8CEB9] font-medium">
                <Shield className="w-3.5 h-3.5" />
                <span>Pesca Responsable</span>
              </div>
              <p className="text-xs text-[#F2EFE6]/75 font-light leading-relaxed">
                Todas nuestras salidas cumplen estrictamente la modalidad{" "}
                <em>Catch & Release</em> (captura y devolución) y el Reglamento
                de Pesca Continental Patagónico.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Copyright & Powered by Magma Studios */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#F2EFE6]/60">
          <p>
            © 2026 TRAUM · Fly Fishing Patagonia. Todos los derechos
            reservados.
          </p>

          <a
            href="https://magmastudios.vercel.app"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#263D32]/60 border border-[#D8CEB9]/25 text-[#D8CEB9] hover:bg-[#D8CEB9] hover:text-[#263D32] transition-all duration-300 text-[11px] uppercase tracking-[0.22em] font-medium"
          >
            <span>Powered by Magma Studios</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
