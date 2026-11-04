"use client";

import React, { useState } from "react";
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
  Landmark,
  Copy,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";

interface ServicesSectionProps {
  services: ServiceFeatureItem[];
  paymentConfig: PaymentConfig;
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
  onOpenBookingModal,
}: ServicesSectionProps) {
  const activeServices = services.filter((s) => s.enabled);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (value: string, label: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 2200);
    }
  };

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
              Servicios · Todo lo que necesitás para vivir la experiencia
            </span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] mb-6">
            Nosotros nos ocupamos del camino.{" "}
            <span className="italic text-[#746657]">
              Vos, de disfrutar el río.
            </span>
          </h2>
          <p className="text-base sm:text-lg text-[#292D29]/80 font-light leading-relaxed">
            Cada jornada se planifica de manera modular según la modalidad
            elegida y las necesidades de cada pescador. Consultanos para armar
            tu salida con las prestaciones exactas que buscás.
          </p>
        </div>

        {/* Modular Grid */}
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

              {service.note && (
                <div className="pt-4 border-t border-[#D8CEB9]/80 flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.18em] text-[#746657] font-medium">
                    {service.note}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-[#65745A]" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* MEDIOS DE PAGO Y CONFIRMACIÓN DE RESERVA */}
        {paymentConfig?.enabled && (
          <div className="mt-16 bg-[#263D32] text-[#F2EFE6] border border-[#65745A]/50 shadow-2xl overflow-hidden">
            <div className="p-8 sm:p-10 lg:p-12 grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
              {/* Left Column: Payment Methods & Deposit Rule (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#D8CEB9]/15 border border-[#D8CEB9]/35 text-[#D8CEB9] text-[10px] uppercase tracking-[0.24em]">
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>
                    Reserva con {paymentConfig.depositPercentage}% de seña
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

                <p className="text-xs text-[#F2EFE6]/70 font-light leading-relaxed border-l-2 border-[#D8CEB9]/50 pl-4">
                  {paymentConfig.cancellationNotice}
                </p>
              </div>

              {/* Right Column: Bank Transfer Details & Direct Payment Links (5 cols) */}
              <div className="lg:col-span-5 bg-[#292D29]/65 border border-[#899487]/30 p-6 sm:p-7 space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-[#899487]/25">
                  <div className="flex items-center gap-2.5">
                    <Landmark className="w-5 h-5 text-[#D8CEB9]" />
                    <span className="text-xs uppercase tracking-[0.2em] text-[#D8CEB9] font-semibold">
                      Datos de Transferencia / Seña
                    </span>
                  </div>
                  <ShieldCheck className="w-4 h-4 text-[#899487]" />
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#899487]/15">
                    <span className="text-[#899487]">Entidad:</span>
                    <span className="text-[#F2EFE6] font-medium">
                      {paymentConfig.bankName}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#899487]/15">
                    <span className="text-[#899487]">Titular:</span>
                    <span className="text-[#F2EFE6] font-medium">
                      {paymentConfig.bankHolder}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#899487]/15">
                    <div>
                      <span className="text-[#899487] block">Alias:</span>
                      <span className="text-sm text-[#D8CEB9] font-semibold tracking-wider">
                        {paymentConfig.bankAlias}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(paymentConfig.bankAlias, "alias")
                      }
                      className="px-2.5 py-1.5 bg-[#263D32] hover:bg-[#65745A] text-[#F2EFE6] border border-[#899487]/30 text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>
                        {copiedField === "alias" ? "Copiado" : "Copiar"}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <div>
                      <span className="text-[#899487] block">CBU / CVU:</span>
                      <span className="text-xs text-[#F2EFE6] font-mono">
                        {paymentConfig.bankCbu}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(paymentConfig.bankCbu, "cbu")}
                      className="px-2.5 py-1.5 bg-[#263D32] hover:bg-[#65745A] text-[#F2EFE6] border border-[#899487]/30 text-[10px] uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      <span>
                        {copiedField === "cbu" ? "Copiado" : "Copiar"}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Direct Payment Links if configured in /admin */}
                <div className="space-y-2.5 pt-2">
                  {paymentConfig.mercadoPagoLink && (
                    <a
                      href={paymentConfig.mercadoPagoLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Abonar con Mercado Pago</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  {paymentConfig.internationalPaymentLink && (
                    <a
                      href={paymentConfig.internationalPaymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 border border-[#D8CEB9]/50 text-[#F2EFE6] hover:bg-[#F2EFE6]/10 text-xs uppercase tracking-[0.2em] font-semibold flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Pago Internacional (PayPal / Tarjeta)</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={onOpenBookingModal}
                    className="w-full py-3.5 px-4 bg-[#65745A] hover:bg-[#D8CEB9] hover:text-[#263D32] text-[#F2EFE6] text-xs uppercase tracking-[0.2em] font-semibold transition-colors cursor-pointer"
                  >
                    Validar fecha antes de señar
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
