"use client";

import React from "react";
import { ChevronDown, ArrowRight, Calendar } from "lucide-react";

interface HeroSectionProps {
  heroBgUrl: string;
  onOpenBookingModal: () => void;
}

export default function HeroSection({
  heroBgUrl,
  onOpenBookingModal,
}: HeroSectionProps) {
  return (
    <section
      id="inicio"
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#292D29]"
    >
      {/* Background Panoramic Image */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBgUrl}
          alt="Lago Huechulafquen y Volcán Lanín en Junín de los Andes, Patagonia Argentina"
          className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#292D29]/75 via-[#263D32]/45 to-[#292D29]/90" />
        <div className="absolute inset-0 bg-radial from-transparent via-black/25 to-black/65" />
      </div>

      {/* Main Editorial Content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 pt-24 sm:pt-28 pb-16 text-center flex flex-col items-center w-full">
        {/* Subtle Overline */}
        <div className="inline-flex items-center gap-2 sm:gap-3 px-3.5 sm:px-4 py-1.5 mb-6 sm:mb-8 border border-[#D8CEB9]/35 bg-[#263D32]/50 backdrop-blur-sm max-w-full">
          <span className="w-1.5 h-1.5 rounded-full bg-[#D8CEB9] flex-shrink-0" />
          <span className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] sm:tracking-[0.32em] text-[#D8CEB9] font-medium leading-tight">
            Junín de los Andes · Neuquén · Patagonia Argentina
          </span>
        </div>

        {/* Main Title */}
        <h1 className="font-editorial text-5xl sm:text-7xl md:text-8xl lg:text-9xl text-[#F2EFE6] tracking-[0.16em] sm:tracking-[0.22em] font-normal leading-none mb-5 sm:mb-6 break-words">
          TRAUM
        </h1>

        {/* Brand Concept Phrase */}
        <p className="font-editorial italic text-xl sm:text-3xl md:text-4xl text-[#D8CEB9] tracking-wide mb-5 sm:mb-6 max-w-2xl px-2">
          “Donde la pesca se hace realidad.”
        </p>

        {/* Ornamental divider */}
        <div className="w-16 h-[1px] bg-[#D8CEB9]/50 mb-6 sm:mb-7" />

        {/* Secondary Text */}
        <p className="text-sm sm:text-lg md:text-xl text-[#F2EFE6]/90 max-w-2xl font-light leading-relaxed mb-8 sm:mb-11 px-2">
          Descubrí la Patagonia a través de sus ríos, sus paisajes y la magia de
          la pesca con mosca.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 sm:gap-6 w-full sm:w-auto px-4 sm:px-0">
          <a
            href="#experiencias"
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#263D32] text-[#F2EFE6] border border-[#65745A] hover:bg-[#F2EFE6] hover:text-[#263D32] hover:border-[#F2EFE6] text-xs uppercase tracking-[0.22em] sm:tracking-[0.24em] font-medium transition-all duration-500 flex items-center justify-center gap-3 group"
          >
            <span>Descubrir experiencias</span>
            <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
          </a>

          <button
            type="button"
            onClick={onOpenBookingModal}
            className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 bg-[#F2EFE6]/10 backdrop-blur-md text-[#F2EFE6] border border-[#D8CEB9]/60 hover:bg-[#D8CEB9] hover:text-[#263D32] hover:border-[#D8CEB9] text-xs uppercase tracking-[0.22em] sm:tracking-[0.24em] font-medium transition-all duration-500 flex items-center justify-center gap-3 cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-[#D8CEB9]" />
            <span>Planificar mi salida</span>
          </button>
        </div>
      </div>

      {/* Smooth Bottom Gradient Transition */}
      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-[#292D29] to-transparent pointer-events-none" />

      {/* Animated Scroll Down Indicator */}
      <a
        href="#filosofia"
        aria-label="Desplazarse hacia abajo"
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#D8CEB9]/80 hover:text-[#F2EFE6] transition-colors"
      >
        <span className="text-[10px] uppercase tracking-[0.3em]">Explorar</span>
        <ChevronDown className="w-5 h-5 animate-scroll-hint" />
      </a>
    </section>
  );
}
