import React from "react";
import Link from "next/link";
import { ArrowLeft, FileText, ShieldCheck } from "lucide-react";

export const metadata = {
  title:
    "Términos, Condiciones y Deslinde de Responsabilidad | TRAUM — Fly Fishing Patagonia",
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
            <span>Contrato de Adhesión Comercial · Ley 24.240 y CCCN</span>
          </div>
          <h1 className="font-editorial text-4xl sm:text-5xl text-[#263D32]">
            Términos y Condiciones Comerciales y Deslinde de Responsabilidad
          </h1>
          <p className="text-xs text-[#746657] mt-2">
            Versión v2026.11-AR · Junín de los Andes, Provincia del Neuquén,
            República Argentina
          </p>
        </div>

        <section className="space-y-5 text-sm sm:text-base text-[#292D29]/85 font-light leading-relaxed">
          <h2 className="font-editorial text-2xl text-[#263D32] font-normal">
            1. Objeto y Perfeccionamiento de la Contratación
          </h2>
          <p>
            El presente instrumento regula las condiciones jurídicas y
            comerciales bajo las cuales <strong>TRAUM | Fly Cast Patagonia</strong>{" "}
            brinda servicios de guiada de pesca deportiva con mosca (vadeo,
            flotada en balsa y salidas personalizadas) en la cuenca de la
            Provincia del Neuquén. La selección y envío de un pedido en el sitio
            web constituye una solicitud firme de contratación sujeta a: (a)
            confirmación de disponibilidad de guías y embarcaciones, y (b)
            acreditación efectiva del porcentaje de seña informado en el Paso 2
            del proceso de contratación.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            2. Régimen de Seña, Pagos, Cancelaciones y No-Show
          </h2>
          <p>
            Para bloquear formalmente una fecha en el calendario operativo se
            requiere la integración del porcentaje de seña vigente al momento de
            contratar. Los datos bancarios (Alias y Titular) y enlaces de pago se
            habilitan de manera exclusiva al titular de la reserva tras aceptar
            estas condiciones. El saldo restante deberá cancelarse antes del
            inicio de la actividad.
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              <strong>Cancelaciones por parte del cliente:</strong> Las
              cancelaciones notificadas con más de quince (15) días de
              anticipación a la fecha reservada podrán reprogramarse dentro de
              la misma temporada de pesca sujeto a disponibilidad. Las
              cancelaciones con menos de quince (15) días de antelación o la no
              presentación en el horario y punto de encuentro acordados (
              <em>No-Show</em>) implican la pérdida del monto integrado en
              concepto de seña por bloqueo operativo de guías y logística.
            </li>
            <li>
              <strong>Condiciones Hidrometeorológicas y Fuerza Mayor:</strong>{" "}
              Por tratarse de una actividad al aire libre en ríos y lagos de
              cordillera, <strong>TRAUM</strong> se reserva la facultad exclusiva
              de modificar el río, tramo o modalidad previstos, o reprogramar la
              jornada cuando existan vientos extremos, crecidas extraordinarias,
              tormentas eléctricas o disposiciones de Prefectura Naval Argentina
              / Parques Nacionales / Fauna de Neuquén que comprometan la
              seguridad, sin que ello genere derecho a indemnización por daños,
              lucro cesante ni reembolso de gastos de transporte o alojamiento.
            </li>
          </ul>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            3. Permiso de Pesca Oficial y Devolución Obligatoria (Catch & Release)
          </h2>
          <p>
            Es obligación personal e intransferible de cada pescador contar con
            su <strong>Permiso de Pesca Continental Patagónico</strong> vigente
            durante toda la salida (el cual no se encuentra incluido en la tarifa
            salvo indicación escrita en contrario). Todas las jornadas se rigen
            de forma estricta por el Reglamento General de Pesca Continental
            Patagónico: uso exclusivo de equipo mosquero con anzuelo simple sin
            rebaba y sacrificio cero (devolución inmediata e intacta de todas las
            piezas capturadas). El guía podrá dar por finalizada la salida sin
            derecho a reintegro si el participante infringiere deliberadamente la
            normativa ambiental o ictícola.
          </p>

          <div
            id="deslinde"
            className="p-6 bg-white border border-[#D8CEB9] space-y-3 my-6"
          >
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[#263D32] font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#65745A]" />
              <span>Cláusula Especial de Turismo Activo</span>
            </div>
            <h2 className="font-editorial text-2xl text-[#263D32] font-normal">
              4. Asunción de Riesgos y Deslinde de Responsabilidad en Ríos y
              Navegación
            </h2>
            <p className="text-sm text-[#292D29]/85 leading-relaxed">
              Al contratar un servicio de <strong>TRAUM</strong>, el cliente
              declara ser mayor de 18 años (o concurrir como padre, madre o tutor
              legal responsable de los menores a su cargo), encontrarse en
              condiciones psicofísicas aptas para caminar sobre terrenos
              irregulares de ribera, vadear corrientes y embarcarse en balsas de
              deriva, e informar previamente cualquier condición médica, alergia
              severa o limitación motriz relevante.
            </p>
            <p className="text-sm text-[#292D29]/85 leading-relaxed">
              El participante comprende y asume los riesgos propios de la pesca
              con mosca en ambientes naturales (resbalones en piedras de río,
              exposición solar/climática, manipulación de anzuelos y navegación
              en aguas rápidas) y se obliga a utilizar en todo momento el
              chaleco salvavidas / dispositivo de flotación personal (PFD)
              provisto en las flotadas, así como gafas de protección polarizadas
              y acatar sin excepción las indicaciones de seguridad del guía a
              cargo.
            </p>
          </div>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            5. Cuidado del Equipamiento y Objetos Personales
          </h2>
          <p>
            Cuando <strong>TRAUM</strong> facilite cañas, reels, líneas o
            waders, el participante se compromete a un uso diligente conforme a
            las instrucciones técnicas del guía. La empresa no se responsabiliza
            por pérdida, caída al agua o deterioro de cámaras fotográficas,
            teléfonos móviles u objetos de valor personales durante el vadeo o
            la navegación.
          </p>

          <h2 className="font-editorial text-2xl text-[#263D32] font-normal pt-4">
            6. Jurisdicción, Ley Aplicable y Defensa del Consumidor
          </h2>
          <p>
            Estas condiciones se rigen por las leyes de la República Argentina
            (Código Civil y Comercial de la Nación y Ley 24.240 de Defensa del
            Consumidor). Ante cualquier controversia derivada de la
            interpretación o ejecución de los servicios, las partes se someten a
            la jurisdicción de los Tribunales Ordinarios con competencia en
            Junín de los Andes / San Martín de los Andes, Provincia del Neuquén,
            sin perjuicio de los derechos que asisten al consumidor en virtud de
            la legislación vigente.
          </p>
        </section>
      </main>
    </div>
  );
}
