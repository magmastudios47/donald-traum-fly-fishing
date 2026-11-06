"use client";

import React, { useState, useEffect, useCallback } from "react";
import { GalleryImageItem } from "@/types/traum";
import { ChevronLeft, ChevronRight, X, Maximize2, Camera } from "lucide-react";

interface GallerySectionProps {
  gallery: GalleryImageItem[];
}

export default function GallerySection({ gallery = [] }: GallerySectionProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const sortedGallery = [...gallery].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0)
  );

  const handlePrev = useCallback(() => {
    if (lightboxIndex === null || sortedGallery.length === 0) return;
    setLightboxIndex(
      (lightboxIndex - 1 + sortedGallery.length) % sortedGallery.length
    );
  }, [lightboxIndex, sortedGallery.length]);

  const handleNext = useCallback(() => {
    if (lightboxIndex === null || sortedGallery.length === 0) return;
    setLightboxIndex((lightboxIndex + 1) % sortedGallery.length);
  }, [lightboxIndex, sortedGallery.length]);

  const handleClose = useCallback(() => {
    setLightboxIndex(null);
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowLeft") handlePrev();
      if (e.key === "ArrowRight") handleNext();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxIndex, handleClose, handlePrev, handleNext]);

  if (sortedGallery.length === 0) {
    return null;
  }

  const activePhoto =
    lightboxIndex !== null ? sortedGallery[lightboxIndex] : null;

  return (
    <section
      id="galeria"
      className="py-24 md:py-32 bg-[#ECE7DA] border-t border-[#D8CEB9]/70"
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        {/* Encabezado de sección */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-[1px] bg-[#3A4E3C]" />
            <span className="text-[11px] uppercase tracking-[0.28em] text-[#3A4E3C] font-medium flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              Postales del Agua
            </span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#263D32] leading-[1.12] mb-5">
            Galería de jornadas en la Patagonia.
          </h2>
          <p className="text-[#292D29]/80 text-base md:text-lg font-light leading-relaxed">
            Instantes reales de vadeo y flotada en los ríos y lagos del Neuquén.
            Tocá cualquier imagen para ampliarla a pantalla completa.
          </p>
        </div>

        {/* Grilla responsiva con carga diferida (lazy loading) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedGallery.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setLightboxIndex(idx)}
              className="group relative block w-full text-left bg-[#263D32] border border-[#D8CEB9] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 focus:outline-none focus:ring-2 focus:ring-[#263D32]"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#1D2E26]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.imageUrl}
                  alt={
                    item.caption ||
                    `Fotografía de pesca con mosca en Patagonia ${idx + 1}`
                  }
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#192820]/85 via-transparent to-transparent opacity-80 group-hover:opacity-95 transition-opacity" />

                {/* Ícono de ampliar */}
                <div className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full bg-[#263D32]/80 backdrop-blur-sm border border-[#F2EFE6]/25 flex items-center justify-center text-[#F2EFE6] opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all">
                  <Maximize2 className="w-4 h-4" />
                </div>

                {/* Epígrafe corto opcional */}
                {item.caption && (
                  <div className="absolute bottom-0 inset-x-0 p-4">
                    <p className="text-xs sm:text-sm text-[#F2EFE6] font-light leading-snug drop-shadow-sm line-clamp-2">
                      {item.caption}
                    </p>
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Visor Lightbox a pantalla completa */}
      {activePhoto && lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[90] bg-[#14201A]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-8"
          onClick={handleClose}
          role="dialog"
          aria-modal="true"
          aria-label="Visor de galería a pantalla completa"
        >
          {/* Barra superior */}
          <div
            className="w-full max-w-6xl flex items-center justify-between text-[#F2EFE6] mb-4"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-xs uppercase tracking-[0.22em] text-[#D8CEB9]">
              TRAUM · Galería ({lightboxIndex + 1} / {sortedGallery.length})
            </span>
            <button
              type="button"
              onClick={handleClose}
              className="flex items-center gap-2 px-3.5 py-2 bg-[#263D32] hover:bg-[#3A4E3C] text-[#F2EFE6] text-xs uppercase tracking-widest border border-[#D8CEB9]/30 transition-colors"
              aria-label="Cerrar visor"
            >
              <span>Cerrar</span>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Imagen central + controles anterior/siguiente */}
          <div
            className="relative w-full max-w-5xl flex-1 flex items-center justify-center max-h-[78vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {sortedGallery.length > 1 && (
              <button
                type="button"
                onClick={handlePrev}
                className="absolute left-2 sm:-left-4 z-10 w-11 h-11 rounded-full bg-[#263D32]/90 hover:bg-[#3A4E3C] text-[#F2EFE6] border border-[#D8CEB9]/40 flex items-center justify-center shadow-lg transition-colors"
                aria-label="Foto anterior"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activePhoto.imageUrl}
              alt={activePhoto.caption || "Imagen ampliada TRAUM"}
              className="max-w-full max-h-[75vh] object-contain border border-[#D8CEB9]/30 shadow-2xl"
            />

            {sortedGallery.length > 1 && (
              <button
                type="button"
                onClick={handleNext}
                className="absolute right-2 sm:-right-4 z-10 w-11 h-11 rounded-full bg-[#263D32]/90 hover:bg-[#3A4E3C] text-[#F2EFE6] border border-[#D8CEB9]/40 flex items-center justify-center shadow-lg transition-colors"
                aria-label="Foto siguiente"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>

          {/* Epígrafe al pie del Lightbox */}
          {activePhoto.caption && (
            <div
              className="w-full max-w-3xl mt-4 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-serif text-base sm:text-lg text-[#F2EFE6] leading-relaxed">
                {activePhoto.caption}
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
