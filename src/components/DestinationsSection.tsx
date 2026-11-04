"use client";

import React from "react";
import { DestinationItem } from "@/types/traum";
import { MapPin, Compass } from "lucide-react";
import FishingMapWidget from "@/components/FishingMapWidget";

interface DestinationsSectionProps {
  destinations: DestinationItem[];
  onSelectDestinationForBooking: (destinationName: string) => void;
}

export default function DestinationsSection({
  destinations,
  onSelectDestinationForBooking,
}: DestinationsSectionProps) {
  return (
    <section
      id="destinos"
      className="py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] relative"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 lg:mb-20 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[1px] bg-[#263D32]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                Destinos · La Patagonia como protagonista
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-tight">
              Ríos que parecen{" "}
              <span className="italic text-[#746657]">sacados de un sueño.</span>
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#292D29]/80 max-w-md font-light leading-relaxed">
            Aguas cristalinas nacidas en la cordillera de los Andes, valles de
            estepa y bosques de araucarias y cipreses en la provincia del
            Neuquén.
          </p>
        </div>

        {/* Large Photographic Destination Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {destinations.map((dest) => (
            <article
              key={dest.id}
              className="group bg-[#F2EFE6] border border-[#D8CEB9] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-700 ease-out flex flex-col justify-between"
            >
              <div>
                {/* Panoramic Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-[#292D29]">
                  <img
                    src={dest.imageUrl}
                    alt={dest.name}
                    className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#292D29]/85 via-transparent to-black/25" />

                  {/* Location Tag */}
                  <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#263D32]/90 backdrop-blur-sm text-[#F2EFE6] text-[11px] uppercase tracking-[0.18em]">
                    <MapPin className="w-3.5 h-3.5 text-[#D8CEB9]" />
                    <span>{dest.location}</span>
                  </div>

                  {/* Destination Title Overlay */}
                  <div className="absolute bottom-5 left-6 right-6">
                    <h3 className="font-editorial text-3xl sm:text-4xl text-[#F2EFE6]">
                      {dest.name}
                    </h3>
                  </div>
                </div>

                {/* Description & Modalities */}
                <div className="p-7 sm:p-8">
                  <p className="text-sm sm:text-base text-[#292D29]/85 leading-relaxed font-light mb-6">
                    {dest.description}
                  </p>

                  <div>
                    <span className="text-[10px] uppercase tracking-[0.22em] text-[#746657] font-semibold block mb-2.5">
                      Modalidades disponibles en este ambiente
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {dest.modalities.map((mod) => (
                        <span
                          key={mod}
                          className="px-3 py-1 bg-[#D8CEB9]/55 text-[#263D32] text-xs tracking-wide font-medium border border-[#746657]/20"
                        >
                          {mod}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Bottom Action */}
              <div className="px-7 sm:px-8 pb-7 pt-2 border-t border-[#D8CEB9]/60 flex items-center justify-between">
                <span className="text-xs text-[#746657] italic font-editorial">
                  {dest.distanceFromJunin || "Cuenca de Junín de los Andes"}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectDestinationForBooking(dest.name)}
                  className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#263D32] hover:text-[#65745A] font-semibold transition-colors cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Consultar salida</span>
                </button>
              </div>
            </article>
          ))}
        </div>

        {/* Interactive Map of Neuquén Rivers & Lakes referenced to Junín de los Andes */}
        <FishingMapWidget
          destinations={destinations}
          onSelectDestinationForBooking={onSelectDestinationForBooking}
        />
      </div>
    </section>
  );
}
