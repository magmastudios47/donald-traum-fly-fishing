"use client";

import React, { useState } from "react";
import { ExperienceItem } from "@/types/traum";
import { ArrowUpRight, CheckCircle2, X, Compass } from "lucide-react";

interface ExperiencesSectionProps {
  experiences: ExperienceItem[];
  onSelectExperienceForBooking: (modality: string) => void;
}

export default function ExperiencesSection({
  experiences,
  onSelectExperienceForBooking,
}: ExperiencesSectionProps) {
  const [activeExperience, setActiveExperience] = useState<ExperienceItem | null>(
    null
  );

  return (
    <section
      id="experiencias"
      className="py-24 lg:py-36 bg-[#263D32] text-[#F2EFE6] relative"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 lg:mb-20 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[1px] bg-[#D8CEB9]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#D8CEB9] font-medium">
                Experiencias · El corazón de Traum
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#F2EFE6] leading-tight">
              Encontrá tu próxima{" "}
              <span className="italic text-[#D8CEB9]">experiencia.</span>
            </h2>
          </div>

          <p className="text-sm sm:text-base text-[#F2EFE6]/80 max-w-md font-light leading-relaxed">
            Nuestra misión es brindarte la experiencia, el conocimiento técnico
            y el marco perfecto para que cada salida se transforme en el Traum
            que siempre quisiste vivir.
          </p>
        </div>

        {/* Large Visual Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10">
          {experiences.map((exp) => (
            <article
              key={exp.id}
              className="group bg-[#292D29]/60 border border-[#899487]/30 flex flex-col justify-between overflow-hidden transition-all duration-500 hover:border-[#D8CEB9]/70 hover:shadow-2xl"
            >
              <div>
                {/* Card Photography */}
                <div className="relative aspect-[4/3] overflow-hidden bg-[#292D29]">
                  <img
                    src={exp.imageUrl}
                    alt={exp.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#292D29] via-transparent to-black/30" />

                  {/* Number Badge */}
                  <div className="absolute top-4 left-4 px-3 py-1 bg-[#263D32]/90 backdrop-blur-sm border border-[#D8CEB9]/30 text-xs tracking-[0.22em] text-[#D8CEB9] uppercase">
                    Experiencia {exp.number}
                  </div>

                  {/* Modality Pill */}
                  <div className="absolute bottom-4 left-4 px-3 py-1 bg-[#F2EFE6]/95 text-[#263D32] text-[10px] uppercase tracking-[0.2em] font-semibold">
                    Modalidad: {exp.modality}
                  </div>
                </div>

                {/* Card Copy */}
                <div className="p-7 sm:p-8">
                  <span className="text-xs uppercase tracking-[0.2em] text-[#899487] block mb-2">
                    {exp.subtitle}
                  </span>
                  <h3 className="font-editorial text-3xl sm:text-4xl text-[#F2EFE6] mb-4">
                    {exp.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#F2EFE6]/80 font-light leading-relaxed mb-5">
                    {exp.description}
                  </p>
                  <p className="text-xs sm:text-sm text-[#D8CEB9]/85 font-light leading-relaxed border-l border-[#65745A] pl-4">
                    {exp.extendedDescription}
                  </p>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="px-7 sm:px-8 pb-8 pt-2 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => setActiveExperience(exp)}
                  className="w-full py-3.5 px-5 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.22em] font-semibold transition-all duration-300 flex items-center justify-between cursor-pointer"
                >
                  <span>Conocer experiencia</span>
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* Detailed Experience Modal */}
      {activeExperience && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
          onClick={() => setActiveExperience(null)}
        >
          <div
            className="bg-[#F2EFE6] text-[#292D29] max-w-2xl w-full border border-[#D8CEB9] shadow-2xl overflow-hidden my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-64 sm:h-72 overflow-hidden">
              <img
                src={activeExperience.imageUrl}
                alt={activeExperience.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#263D32] via-[#263D32]/30 to-transparent" />
              <button
                type="button"
                onClick={() => setActiveExperience(null)}
                className="absolute top-4 right-4 w-10 h-10 bg-[#292D29]/80 text-[#F2EFE6] hover:bg-[#263D32] flex items-center justify-center transition-colors cursor-pointer"
                aria-label="Cerrar detalle"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-6 left-6 right-6 text-[#F2EFE6]">
                <span className="text-[11px] uppercase tracking-[0.26em] text-[#D8CEB9] block mb-1">
                  Experiencia {activeExperience.number} · {activeExperience.modality}
                </span>
                <h3 className="font-editorial text-3xl sm:text-4xl">
                  {activeExperience.title}
                </h3>
              </div>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <p className="text-base text-[#292D29]/90 leading-relaxed font-light">
                {activeExperience.description} {activeExperience.extendedDescription}
              </p>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-[0.22em] text-[#746657] font-semibold">
                  Aspectos destacados de la modalidad
                </h4>
                <ul className="space-y-2.5">
                  {activeExperience.highlights.map((item, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-sm text-[#292D29]/85"
                    >
                      <CheckCircle2 className="w-4 h-4 text-[#263D32] flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#D8CEB9]/35 border border-[#D8CEB9]">
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#746657] block">
                    Duración operativa
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {activeExperience.durationPlaceholder}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-[#746657] block">
                    Formato y cupos
                  </span>
                  <span className="text-sm font-medium text-[#263D32]">
                    {activeExperience.capacityPlaceholder}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveExperience(null)}
                  className="w-full sm:w-auto px-6 py-3 border border-[#746657]/40 text-xs uppercase tracking-[0.2em] text-[#292D29] hover:bg-[#D8CEB9]/40 transition-colors cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const mod = activeExperience.modality;
                    setActiveExperience(null);
                    onSelectExperienceForBooking(mod);
                  }}
                  className="w-full sm:w-auto px-7 py-3 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.2em] font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  <span>Consultar por esta experiencia</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
