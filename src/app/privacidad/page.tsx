import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";

export const metadata = {
  title: "Política de Privacidad | TRAUM — Fly Fishing Patagonia",
};

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-[#F2EFE6] text-[#292D29] flex flex-col">
      <header className="bg-[#263D32] text-[#F2EFE6] py-4 sm:py-6 px-4 sm:px-6 lg:px-10 border-b border-[#899487]/30">
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
            className="px-3.5 sm:px-4 py-2 border border-[#D8CEB9]/40 text-[10px] sm:text-xs uppercase tracking-[0.18em] text-[#F2EFE6] hover:bg-[#D8CEB9] hover:text-[#263D32] transition-colors inline-flex items-center gap-1.5 sm:gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Volver al inicio</span>
            <span className="sm:hidden">Inicio</span>
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-10 py-10 sm:py-16 lg:py-24 space-y-8 flex-1">
        <div className="border-b border-[#D8CEB9] pb-6">
          <div className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.24em] text-[#65745A] font-semibold mb-2">
            <ShieldCheck className="w-4 h-4" />
            <span>Documentación Legal · Cumplimiento Ley 25.326 y Google OAuth</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#263D32]">
            Política de Privacidad y Protección de Datos
          </h1>
          <p className="text-xs text-[#746657] mt-2">
            Última actualización: Noviembre 2026 · Junín de los Andes, Neuquén, Argentina
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[#292D29]/85 font-light leading-relaxed">
          <h2 className="font-editorial text-2xl text-[#263D32] font-normal">
            1. Responsable del Tratamiento de los Datos
          </h2>
          <p>
            <strong>TRAUM | Fly Cast Patagonia</strong>, con base de operaciones
            en Junín de los Andes, Provincia del Neuquén, República Argentina, es
            responsable del tratamiento de los datos personales recopilados a
            través de este sitio web, de conformidad con la Ley Nacional N°
            25.326 de Protección de los Datos Personales y normativas
            internacionales aplicables.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            2. Datos Recopilados y Autenticación con Google (Google OAuth)
          </h2>
          <p>
            Recopilamos únicamente la información estrictamente necesaria para
            gestionar consultas de salidas de pesca, reservas en el calendario,
            publicación de reseñas y coordinación de pagos:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Formularios de Reserva y Contacto:</strong> Nombre y
              apellido, dirección de correo electrónico, número de WhatsApp/teléfono,
              preferencias de fechas, modalidad de pesca y nivel técnico.
            </li>
            <li>
              <strong>Inicio de Sesión con Google (Google Sign-In / OAuth):</strong>{" "}
              Cuando el usuario opta por autenticarse mediante su cuenta de
              Google, accedemos únicamente a su perfil básico público (nombre,
              dirección de correo electrónico verificada e imagen de avatar) con
              el único fin de identificar su reserva o reseña y enviarle las
              confirmaciones correspondientes. No accedemos a datos privados ni
              compartimos información de Google con terceros.
            </li>
          </ul>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            3. Procesamiento de Medios de Pago
          </h2>
          <p>
            Las transacciones electrónicas o señas se cursan a través de
            transferencias bancarias directas o plataformas externas seguras
            (tales como Mercado Pago, PayPal o procesadores equivalentes).{" "}
            <strong>TRAUM</strong> no almacena números completos de tarjetas de
            crédito, códigos de seguridad (CVV) ni credenciales bancarias en sus
            servidores.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            4. Finalidad y Conservación de la Información
          </h2>
          <p>
            Los datos proporcionados se utilizan exclusivamente para: (a)
            responder solicitudes de disponibilidad de guías y embarcaciones,
            (b) enviar confirmaciones por correo electrónico o WhatsApp tanto al
            cliente como a la administración de Traum, y (c) gestionar la
            operativa logística y permisos de pesca necesarios en la Provincia
            del Neuquén.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            5. Derechos del Titular de los Datos (Acceso, Rectificación y Supresión)
          </h2>
          <p>
            El titular de los datos personales tiene la facultad de ejercer el
            derecho de acceso, actualización, rectificación o supresión de sus
            datos en cualquier momento enviando un correo electrónico a los
            canales oficiales de contacto publicados en el pie de página de este
            sitio.
          </p>
        </section>
      </main>
    </div>
  );
}
