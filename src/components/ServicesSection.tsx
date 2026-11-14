"use client";

import React from "react";
import { PaymentConfig, ServiceFeatureItem } from "@/types/traum";
import {
  Compass,
  Award,
  Map,
  Anchor,
  Sliders,
  Briefcase,
  Check,
  CreditCard,
  CheckCircle2,
  ShieldCheck,
  Lock,
  ArrowUpRight,
} from "lucide-react";

interface ServicesSectionProps {
  services: ServiceFeatureItem[];
  paymentConfig: PaymentConfig;
  onContractService: (service: ServiceFeatureItem) => void;
  onOpenBookingModal: () => void;
}

function getServiceIcon(iconName: string) {
  switch (iconName) {
    case "Compass":
      return <Compass className="w-6 h-6 text-[#D8CEB9]" />;
    case "Award":
      return <Award className="w-6 h-6 text-[#D8CEB9]" />;
    case "Map":
      return <Map className="w-6 h-6 text-[#D8CEB9]" />;
    case "Anchor":
      return <Anchor className="w-6 h-6 text-[#D8CEB9]" />;
    case "Sliders":
      return <Sliders className="w-6 h-6 text-[#D8CEB9]" />;
    case "Briefcase":
      return <Briefcase className="w-6 h-6 text-[#D8CEB9]" />;
    default:
      return <Check className="w-6 h-6 text-[#D8CEB9]" />;
  }
}

export default function ServicesSection({
  services,
  paymentConfig,
  onContractService,
  onOpenBookingModal,
}: ServicesSectionProps) {
  const activeServices = services.filter((s) => s.enabled);

  return (
    <section
      id="servicios"
      className="py-20 sm:py-24 lg:py-36 bg-[#D8CEB9]/35 text-[#292D29] border-y border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl mb-16 lg:mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#263D32]" />
            <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
              Servicios · Prestaciones incluidas en nuestras guiadas
            </span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-6">
            Nosotros nos ocupamos del camino.{" "}
            <span className="italic text-[#746657]">
              Vos, de disfrutar el río.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#292D29]/80 font-light leading-relaxed">
            Cada jornada está planificada al detalle para brindarte seguridad,
            conocimiento técnico de cada ambiente y toda la logística necesaria
            en la Patagonia.
          </p>
        </div>

        {/* Modular Grid of Included Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeServices.map((service) => (
            <div
              key={service.id}
              className="bg-[#F2EFE6] border border-[#D8CEB9] p-8 flex flex-col justify-between transition-all duration-300 hover:border-[#65745A] hover:shadow-lg"
            >
              <div>
                <div className="w-12 h-12 bg-[#263D32] flex items-center justify-center mb-6">
                  {getServiceIcon(service.iconName)}
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl text-[#263D32] mb-3">
                  {service.title}
                </h3>
                <p className="text-sm text-[#292D29]/80 font-light leading-relaxed mb-6">
                  {service.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8CEB9]/80 flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#746657] font-medium">
                  {service.note || "Prestación oficial TRAUM"}
                </span>
                <span className="w-2 h-2 rounded-full bg-[#65745A]" />
              </div>
            </div>
          ))}
        </div>

        {/* MODALIDADES DEL CALENDARIO: SALIDAS PROGRAMADAS Y SALIDAS A PEDIDO */}
        <div className="mt-16 bg-[#263D32] text-[#F2EFE6] border border-[#65745A]/50 shadow-2xl overflow-hidden">
          <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h3 className="font-editorial text-3xl sm:text-4xl text-[#F2EFE6] mb-2">
                  Dos formas de salir al río con TRAUM
                </h3>
                <p className="text-sm text-[#D8CEB9]/90 font-light">
                  Un calendario único pensado para que te sumes a una jornada
                  programada o propongas tu propia fecha a medida.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 bg-[#292D29]/50 border border-[#899487]/25 space-y-2">
                  <div className="flex items-center gap-2 text-[#D8CEB9] font-semibold text-xs uppercase tracking-wider">
                    <CreditCard className="w-4 h-4 flex-shrink-0" />
                    <span>A) Salidas Programadas (Seña Online)</span>
                  </div>
                  <p className="text-xs text-[#F2EFE6]/85 font-light leading-relaxed">
                    El guía publica fecha, horario, río, modalidad, cupos y
                    valor. Reservás tus cupos abonando la seña ({paymentConfig?.depositPercentage || 30}%) con tarjeta directo en la página y recibís tu comprobante oficial en el acto, sin mandar comprobantes por WhatsApp.
                  </p>
                </div>

                <div className="p-4 bg-[#292D29]/50 border border-[#899487]/25 space-y-2">
                  <div className="flex items-center gap-2 text-[#D8CEB9] font-semibold text-xs uppercase tracking-wider">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>B) Salidas a Pedido (Sin pago web)</span>
                  </div>
                  <p className="text-xs text-[#F2EFE6]/85 font-light leading-relaxed">
                    En cualquier fecha libre del calendario podés solicitar una
                    salida personalizada. El guía recibe tu pedido y lo coordinan
                    directamente entre ustedes, sin cobro de seña en la página.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#292D29]/70 border border-[#899487]/35 p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#899487]/25">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-[#D8CEB9]" />
                  <span className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9] font-semibold">
                    Confirmación Instantánea y Segura
                  </span>
                </div>
                <Lock className="w-3.5 h-3.5 text-[#899487]" />
              </div>

              <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                En las salidas programadas, el sistema calcula automáticamente el
                valor de los cupos que elijas, descuenta el saldo a pagar el día
                de la salida y procesa la seña con tarjeta de crédito o débito
                sin guardar los datos de tu tarjeta.
              </p>

              <div className="pt-2">
                <a
                  href="#calendario"
                  className="w-full py-3.5 px-4 bg-[#D8CEB9] hover:bg-[#F2EFE6] text-[#263D32] text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-center cursor-pointer"
                >
                  Ver calendario de salidas y cupos
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
