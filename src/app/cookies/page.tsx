import React from "react";
import Link from "next/link";
import { ArrowLeft, Cookie } from "lucide-react";

export const metadata = {
  title: "Política de Cookies | TRAUM — Fly Fishing Patagonia",
};

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-[#F2EFE6] text-[#292D29] flex flex-col">
      <header className="bg-[#263D32] text-[#F2EFE6] py-6 px-6 lg:px-10 border-b border-[#899487]/30">
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
            className="px-4 py-2 border border-[#D8CEB9]/40 text-xs uppercase tracking-[0.18em] text-[#F2EFE6] hover:bg-[#D8CEB9] hover:text-[#263D32] transition-colors inline-flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al inicio</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 lg:px-10 py-16 lg:py-24 space-y-8 flex-1">
        <div className="border-b border-[#D8CEB9] pb-6">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold mb-2">
            <Cookie className="w-4 h-4" />
            <span>Transparencia Digital y Almacenamiento Local</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#263D32]">
            Política de Cookies
          </h1>
          <p className="text-xs text-[#746657] mt-2">
            Última actualización: Noviembre 2026 · TRAUM Fly Fishing Patagonia
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[#292D29]/85 font-light leading-relaxed">
          <h2 className="font-editorial text-2xl text-[#263D32] font-normal">
            1. ¿Qué son las cookies y para qué las utilizamos?
          </h2>
          <p>
            Las cookies y el almacenamiento local del navegador son pequeños
            archivos que permiten recordar tus preferencias de navegación y
            mantener sesiones seguras. En <strong>TRAUM</strong> las utilizamos
            de manera transparente y mínima.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            2. Categorías de Cookies Utilizadas
          </h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Cookies Técnicas y Esenciales:</strong> Necesarias para
              recordar tu decisión sobre el cartel de consentimiento de cookies y
              permitir el funcionamiento del calendario y formularios.
            </li>
            <li>
              <strong>Cookies de Autenticación (Google OAuth):</strong>{" "}
              Empleadas para validar tu sesión de usuario de manera segura cuando
              iniciás sesión con Google para gestionar reservas o reseñas.
            </li>
            <li>
              <strong>Cookies de Pasarelas de Pago:</strong> Utilizadas por
              proveedores externos (como Mercado Pago o PayPal) al momento de
              abrir un enlace de pago seguro para prevenir fraudes.
            </li>
          </ul>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            3. Cómo modificar tu consentimiento
          </h2>
          <p>
            Al ingresar por primera vez al sitio se presenta un cartel interactivo
            donde podés aceptar o rechazar las cookies no esenciales. Además,
            podés borrar las cookies guardadas en cualquier momento desde la
            configuración de privacidad de tu navegador.
          </p>
        </section>
      </main>
    </div>
  );
}
