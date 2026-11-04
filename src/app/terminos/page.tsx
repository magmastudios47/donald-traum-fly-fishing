import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export const metadata = {
  title: "Términos y Condiciones | TRAUM — Fly Fishing Patagonia",
};

export default function TerminosPage() {
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
            <FileText className="w-4 h-4" />
            <span>Condiciones de Contratación y Operación</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#263D32]">
            Términos y Condiciones del Servicio
          </h1>
          <p className="text-xs text-[#746657] mt-2">
            Última actualización: Noviembre 2026 · Junín de los Andes, Neuquén, Argentina
          </p>
        </div>

        <section className="space-y-4 text-sm sm:text-base text-[#292D29]/85 font-light leading-relaxed">
          <h2 className="font-editorial text-2xl text-[#263D32] font-normal">
            1. Solicitudes de Disponibilidad y Confirmación de Reservas
          </h2>
          <p>
            Las consultas realizadas a través del calendario interactivo o de los
            formularios de contacto constituyen solicitudes de disponibilidad y
            no implican confirmación automática. Una fecha queda formalmente
            bloqueada y reservada únicamente una vez validada la disponibilidad
            operativa por parte de <strong>TRAUM</strong> y acreditado el pago
            de la seña acordada.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            2. Medios de Pago, Señas y Reprogramaciones
          </h2>
          <p>
            Para confirmar una salida (ya sea de vadeo, flotada en balsa o
            programa personalizado) se requiere la integración del porcentaje de
            seña indicado en la sección de Servicios y Medios de Pago. En caso de
            condiciones hidrometeorológicas extremas que comprometan la
            seguridad en el río, se priorizará la reprogramación de fecha o el
            cambio de ambiente dentro de la cuenca del Neuquén en común acuerdo
            con el pescador.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            3. Reglamento de Pesca y Compromiso Catch & Release
          </h2>
          <p>
            Todas las salidas operadas por <strong>TRAUM</strong> se rigen
            estrictamente por el Reglamento General de Pesca Continental
            Patagónico vigente. Es obligatorio el uso de anzuelos simples sin
            rebaba y la devolución inmediata e intacta de todas las capturas (
            <em>Catch & Release</em>). Cada participante debe contar con su
            permiso de pesca oficial vigente o solicitar asesoramiento previo
            para su gestión.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            4. Seguridad en el Agua y Navegación
          </h2>
          <p>
            Durante las flotadas en balsa y jornadas de vadeo, las indicaciones
            técnicas y de seguridad del guía a cargo son de cumplimiento
            obligatorio para preservar la integridad de los participantes y el
            cuidado del entorno natural.
          </p>
        </section>
      </main>
    </div>
  );
}
