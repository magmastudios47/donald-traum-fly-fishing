"use client";

import React from "react";
import { SiteImagesConfig } from "@/types/traum";

interface PhilosophySectionProps {
  siteImages: SiteImagesConfig;
}

export default function PhilosophySection({
  siteImages,
}: PhilosophySectionProps) {
  const dreamPillars = [
    {
      number: "I",
      title: "El sueño de la captura",
      subtitle: "La recompensa de saber esperar",
      description:
        "Esa trucha patagónica que imaginaste durante meses. El instante preciso en que la línea se tensa sobre el espejo de agua, fruto de leer la corriente, elegir la mosca justa y respetar los tiempos del río.",
      imageUrl: siteImages.pillarCapture,
    },
    {
      number: "II",
      title: "El sueño de desconectar",
      subtitle: "El silencio de la mañana en la cordillera",
      description:
        "Dejar atrás el ruido cotidiano para escuchar únicamente el correr del agua entre las piedras y el viento entre los sauces y araucarias. Una pausa real donde el tiempo se mide por la luz del sol sobre la montaña.",
      imageUrl: siteImages.pillarDisconnect,
    },
    {
      number: "III",
      title: "El sueño de compartir",
      subtitle: "Historias que permanecen en la memoria",
      description:
        "Una charla junto a la orilla, el mate al amanecer antes de entrar al agua o el abrazo después de devolver un gran pez a su cauce. Momentos genuinos con personas especiales que perduran mucho después de guardar la caña.",
      imageUrl: siteImages.pillarShare,
    },
  ];

  return (
    <section
      id="filosofia"
      className="py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] relative overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Top Asymmetric Editorial Spread */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start mb-24 lg:mb-32">
          {/* Left Editorial Copy + Sello de Origen below blockquote (7 columns) */}
          <div className="lg:col-span-7 space-y-7">
            <div className="flex items-center gap-3">
              <span className="w-8 h-[1px] bg-[#263D32]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                Filosofía · El significado de Traum
              </span>
            </div>

            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-[1.12] font-normal">
              Hay sueños que nacen{" "}
              <span className="italic font-normal text-[#746657]">
                frente al agua.
              </span>
            </h2>

            <div className="space-y-5 text-base sm:text-lg text-[#292D29]/85 leading-relaxed font-light">
              <p>
                <strong className="font-medium text-[#263D32]">
                  Traum significa sueño en alemán.
                </strong>{" "}
                Es ese anhelo que nos lleva a imaginar una jornada perfecta, a
                recorrer kilómetros y a volver una y otra vez al río.
              </p>
              <p>
                En Traum, no solo ofrecemos salidas de pesca ni nos limitamos a
                compartir rutas en los ríos y lagos del Neuquén; celebramos el
                arte de esperar, la conexión profunda con la naturaleza y una
                pasión incondicional por el agua.
              </p>
              <p>
                Para nosotros, la pesca es mucho más que una captura. Es el
                silencio de la mañana, el sonido del agua, la inmensidad de la
                cordillera y esos momentos que permanecen en la memoria mucho
                después de guardar la caña.
              </p>
            </div>

            <blockquote className="pt-4 border-l-2 border-[#65745A] pl-6">
              <p className="font-editorial italic text-2xl sm:text-3xl text-[#263D32]">
                “En Traum creemos que cada salida tiene una historia por contar.”
              </p>
            </blockquote>

            {/* Dedicated Editorial Sello de Origen Card */}
            <div className="pt-4">
              <div className="p-5 sm:p-6 bg-[#D8CEB9]/35 border border-[#D8CEB9] flex flex-col sm:flex-row items-center gap-6">
                <div className="w-24 h-24 flex-shrink-0 drop-shadow-md">
                  <img
                    src="/traum-medallion.png"
                    alt="Emblema Traum Fly Cast Junín de los Andes"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="text-center sm:text-left space-y-1">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-[#746657] block font-semibold">
                    Sello de Origen · Cuna del Fly Fishing
                  </span>
                  <h3 className="font-editorial text-2xl sm:text-3xl text-[#263D32]">
                    Junín de los Andes · Capturando Sueños
                  </h3>
                  <p className="text-xs sm:text-sm text-[#292D29]/80 font-light leading-relaxed">
                    Nacidos frente a los ríos cordilleranos del Neuquén, donde
                    la tradición mosquera se transmite con respeto por el agua.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Editorial Photography (5 columns) */}
          <div className="lg:col-span-5">
            <div className="relative aspect-[4/5] overflow-hidden shadow-2xl border border-[#D8CEB9] group">
              <img
                src={siteImages.philosophyMain}
                alt="Río Chimehuín en Junín de los Andes, Patagonia Argentina"
                className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#263D32]/85 via-[#263D32]/20 to-transparent" />
              <div className="absolute bottom-7 left-7 right-7 text-[#F2EFE6]">
                <span className="text-[10px] uppercase tracking-[0.28em] text-[#D8CEB9] block mb-2">
                  Patagonia Norte · Provincia del Neuquén
                </span>
                <p className="font-editorial italic text-xl sm:text-2xl leading-snug">
                  Llegar a las orillas de la Patagonia es hacer realidad una
                  vivencia esperada durante todo el año.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Three Visual Concepts */}
        <div className="pt-12 border-t border-[#D8CEB9]">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-14 gap-4">
            <div>
              <span className="text-xs uppercase tracking-[0.26em] text-[#746657] block mb-2">
                Tres dimensiones de una misma pasión
              </span>
              <h3 className="font-editorial text-3xl sm:text-4xl text-[#263D32]">
                Los tres sueños que habitan el río
              </h3>
            </div>
            <p className="text-sm text-[#292D29]/75 max-w-md font-light">
              Entendemos la pesca con mosca como un estilo de vida donde técnica,
              contemplación y camaradería se encuentran en equilibrio.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
            {dreamPillars.map((pillar) => (
              <article
                key={pillar.number}
                className="group bg-[#F2EFE6] border border-[#D8CEB9] overflow-hidden flex flex-col transition-all duration-700 ease-out hover:border-[#65745A] hover:shadow-xl"
              >
                <div className="relative aspect-[16/11] overflow-hidden bg-[#292D29]">
                  <img
                    src={pillar.imageUrl}
                    alt={pillar.title}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#292D29]/60 via-transparent to-transparent" />
                  <span className="absolute top-4 left-4 w-9 h-9 bg-[#263D32]/90 backdrop-blur-sm text-[#D8CEB9] font-editorial text-sm flex items-center justify-center border border-[#D8CEB9]/30">
                    {pillar.number}
                  </span>
                </div>

                <div className="p-7 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-[#746657] block mb-2">
                      {pillar.subtitle}
                    </span>
                    <h4 className="font-editorial text-2xl sm:text-3xl text-[#263D32] mb-3">
                      {pillar.title}
                    </h4>
                    <p className="text-sm text-[#292D29]/80 leading-relaxed font-light">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
