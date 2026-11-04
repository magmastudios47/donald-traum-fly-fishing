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
      className="py-24 lg:py-36 bg-[#D8CEB9]/35 text-[#292D29] border-y border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="max-w-3xl mb-16 lg:mb-20">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#263D32]" />
            <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
              Servicios · Contratación de prestaciones y guiadas
            </span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-6">
            Nosotros nos ocupamos del camino.{" "}
            <span className="italic text-[#746657]">
              Vos, de disfrutar el río.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#292D29]/80 font-light leading-relaxed">
            Seleccioná el servicio que querés contratar para iniciar tu pedido.
            Una vez registrado tu servicio, se habilitarán las instrucciones de
            pago de seña ({paymentConfig.depositPercentage}%) y los canales de
            transferencia o pago electrónico.
          </p>
        </div>

        {/* Modular Grid with Direct "Contratar Servicio" Action */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {activeServices.map((service) => (
            <div
              key={service.id}
              className="bg-[#F2EFE6] border border-[#D8CEB9] p-8 flex flex-col justify-between transition-all duration-300 hover:border-[#65745A] hover:shadow-lg"
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 bg-[#263D32] flex items-center justify-center">
                    {getServiceIcon(service.iconName)}
                  </div>
                  <span className="px-2.5 py-1 bg-[#D8CEB9]/55 text-[#263D32] text-[10px] uppercase tracking-[0.18em] font-semibold">
                    Seña {paymentConfig.depositPercentage}%
                  </span>
                </div>

                <h3 className="font-editorial text-2xl sm:text-3xl text-[#263D32] mb-3">
                  {service.title}
                </h3>
                <p className="text-sm text-[#292D29]/80 font-light leading-relaxed mb-6">
                  {service.description}
                </p>
              </div>

              <div className="space-y-4 pt-4 border-t border-[#D8CEB9]/80">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#746657] font-medium">
                    {service.priceLabel || service.note || "Servicio oficial TRAUM"}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#65745A]" />
                </div>

                <button
                  type="button"
                  onClick={() => onContractService(service)}
                  className="w-full py-3 px-4 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-semibold transition-colors flex items-center justify-between cursor-pointer"
                >
                  <span>Contratar servicio</span>
                  <ArrowUpRight className="w-4 h-4 text-[#D8CEB9]" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* MEDIOS DE PAGO Y POLÍTICA DE SEÑA (SIN EXPONER DATOS BANCARIOS PÚBLICAMENTE) */}
        {paymentConfig?.enabled && (
          <div className="mt-16 bg-[#263D32] text-[#F2EFE6] border border-[#65745A]/50 shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              {/* Left Column: Accepted Payment Methods & Deposit Rule (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#D8CEB9]/15 border border-[#D8CEB9]/35 text-[#D8CEB9] text-[10px] uppercase tracking-[0.24em] font-semibold">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    Confirmación mediante {paymentConfig.depositPercentage}% de seña
                  </span>
                </div>

                <div>
                  <h3 className="font-editorial text-3xl sm:text-4xl text-[#F2EFE6] mb-2">
                    {paymentConfig.title}
                  </h3>
                  <p className="text-sm text-[#D8CEB9]/90 font-light">
                    {paymentConfig.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                  {paymentConfig.acceptedMethods.map((method, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-[#292D29]/50 border border-[#899487]/25 flex items-center gap-3 text-xs sm:text-sm text-[#F2EFE6]/90"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#D8CEB9] flex-shrink-0" />
                      <span>{method}</span>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-[#F2EFE6]/75 font-light leading-relaxed border-l-2 border-[#D8CEB9]/50 pl-4">
                  {paymentConfig.cancellationNotice}
                </p>
              </div>

              {/* Right Column: Protected Payment Protocol Notice (5 cols) */}
              <div className="lg:col-span-5 bg-[#292D29]/70 border border-[#899487]/35 p-6 sm:p-8 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#899487]/25">
                  <div className="flex items-center gap-2.5">
                    <Lock className="w-4 h-4 text-[#D8CEB9]" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9] font-semibold">
                      Protocolo de Pago Protegido
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#899487]" />
                </div>

                <p className="text-xs sm:text-sm text-[#F2EFE6]/85 font-light leading-relaxed">
                  Por seguridad comercial y operativa, los datos de cuenta del
                  titular y enlaces de cobro no se exhiben de forma pública. Se
                  habilitan únicamente al contratar un servicio o salida:
                </p>

                <ol className="space-y-2.5 text-xs text-[#D8CEB9]/90">
                  <li className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-[#263D32] border border-[#D8CEB9]/30 text-[10px] font-semibold">
                      01
                    </span>
                    <span>
                      Elegí cualquiera de las experiencias, fechas del
                      calendario o servicios cargados en la web.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-[#263D32] border border-[#D8CEB9]/30 text-[10px] font-semibold">
                      02
                    </span>
                    <span>
                      Completá tus datos de reserva y aceptá las condiciones
                      legales del servicio.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="px-2 py-0.5 bg-[#263D32] border border-[#D8CEB9]/30 text-[10px] font-semibold">
                      03
                    </span>
                    <span>
                      Accedé al instante a los datos para abonar el{" "}
                      <strong>{paymentConfig.depositPercentage}% de seña</strong>{" "}
                      y tu pedido llega en directo al administrador.
                    </span>
                  </li>
                </ol>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={onOpenBookingModal}
                    className="w-full py-3.5 px-4 bg-[#D8CEB9] hover:bg-[#F2EFE6] text-[#263D32] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                  >
                    Contratar un servicio ahora
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
