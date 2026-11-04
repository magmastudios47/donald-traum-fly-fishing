"use client";

import React from "react";
import { SiteImagesConfig } from "@/types/traum";
import { Droplets, ShieldCheck, Trees, HeartHandshake } from "lucide-react";

interface ConservationSectionProps {
  siteImages: SiteImagesConfig;
}

const commitments = [
  {
    icon: Droplets,
    title: "Práctica Catch & Release",
    description:
      "Promovemos la pesca y devolución obligatoria con anzuelos sin rebaba, manipulación mínima dentro del agua y respeto absoluto por los tiempos de recuperación de cada trucha.",
  },
  {
    icon: Trees,
    title: "Respeto por la fauna y flora autóctona",
    description:
      "Transitamos las riberas, bosques nativos y ambientes cordilleranos sin alterar las zonas de nidificación ni la vegetación que sostiene la vida del río.",
  },
  {
    icon: ShieldCheck,
    title: "Cuidado de los ríos y lagos",
    description:
      "Cumplimiento riguroso del reglamento general de pesca continental patagónico, prevención de bioinvasiones y huella cero en cada campamento o parada.",
  },
  {
    icon: HeartHandshake,
    title: "Conservación del entorno natural",
    description:
      "La naturaleza no es solamente el escenario de la experiencia: es aquello que debemos proteger hoy para que el sueño del río siga existiendo mañana.",
  },
];

export default function ConservationSection({
  siteImages,
}: ConservationSectionProps) {
  return (
    <>
      {/* H. PESCA RESPONSABLE — COMPROMISO CON LA NATURALEZA */}
      <section className="py-24 lg:py-36 bg-[#292D29] text-[#F2EFE6] relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            {/* Left Image Column (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative aspect-[4/5] overflow-hidden border border-[#899487]/35 shadow-2xl group">
                <img
                  src={siteImages.conservationMain}
                  alt="Devolución responsable de trucha arcoíris al agua"
                  className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#292D29] via-transparent to-black/25" />

                <div className="absolute bottom-6 left-6 right-6 p-5 bg-[#263D32]/90 backdrop-blur-sm border border-[#D8CEB9]/30">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#D8CEB9] block mb-1">
                    Catch & Release · Huella Cero
                  </span>
                  <p className="font-editorial italic text-lg sm:text-xl text-[#F2EFE6]">
                    “Devolver un pez al río es asegurar que la historia continúe.”
                  </p>
                </div>
              </div>
            </div>

            {/* Right Editorial & Commitments Column (7 cols) */}
            <div className="lg:col-span-7 space-y-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="w-8 h-[1px] bg-[#D8CEB9]" />
                  <span className="text-xs uppercase tracking-[0.28em] text-[#D8CEB9] font-medium">
                    Pesca responsable · Compromiso con la naturaleza
                  </span>
                </div>

                <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#F2EFE6] leading-[1.12] mb-6">
                  El mejor recuerdo es aquel que{" "}
                  <span className="italic text-[#D8CEB9]">
                    dejamos intacto.
                  </span>
                </h2>

                <p className="text-base sm:text-lg text-[#F2EFE6]/80 font-light leading-relaxed">
                  En Traum, entendemos la pesca con mosca como un estilo de vida
                  basado en la ética deportiva. La naturaleza no es solamente el
                  escenario de nuestra experiencia: es el patrimonio vivo que
                  debemos proteger en cada deriva y en cada vadeo.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {commitments.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.title}
                      className="p-6 bg-[#263D32]/45 border border-[#899487]/25 space-y-3 transition-colors duration-500 hover:border-[#D8CEB9]/50"
                    >
                      <Icon className="w-6 h-6 text-[#D8CEB9]" />
                      <h3 className="font-editorial text-2xl text-[#F2EFE6]">
                        {item.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[#F2EFE6]/75 font-light leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* I. FRASE EDITORIAL / INSPIRACIÓN (Henry David Thoreau) */}
      <section className="relative py-32 lg:py-44 w-full overflow-hidden flex items-center justify-center bg-[#263D32]">
        <div className="absolute inset-0 z-0">
          <img
            src={siteImages.thoreauQuoteBg}
            alt="Lago Tromen y Volcán Lanín en la cordillera del Neuquén"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[#263D32]/80 mix-blend-multiply" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#292D29]/85 via-transparent to-[#292D29]/85" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto px-6 lg:px-10 text-center">
          <div className="w-12 h-[1px] bg-[#D8CEB9]/60 mx-auto mb-8" />
          <blockquote className="font-editorial italic text-3xl sm:text-4xl md:text-5xl lg:text-6xl text-[#F2EFE6] leading-[1.22] mb-8">
            “Muchos hombres pescan toda su vida sin saber que no es a los peces
            a los que buscan.”
          </blockquote>
          <cite className="not-italic text-xs sm:text-sm uppercase tracking-[0.32em] text-[#D8CEB9] font-medium">
            — Henry David Thoreau
          </cite>
          <div className="w-12 h-[1px] bg-[#D8CEB9]/60 mx-auto mt-8" />
        </div>
      </section>
    </>
  );
}
