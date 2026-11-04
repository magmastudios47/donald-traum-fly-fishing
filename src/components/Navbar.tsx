"use client";

import React, { useState, useEffect } from "react";
import { Menu, X, Compass } from "lucide-react";

interface NavbarProps {
  onOpenBookingModal: (prefill?: {
    date?: string;
    experienceType?: string;
    destination?: string;
  }) => void;
}

const navLinks = [
  { label: "Inicio", href: "#inicio", subtitle: "Portada principal" },
  { label: "La experiencia", href: "#filosofia", subtitle: "El significado de Traum" },
  { label: "Experiencias", href: "#experiencias", subtitle: "Vadeo, balsa y personalizadas" },
  { label: "Destinos y Mapa", href: "#destinos", subtitle: "Ríos y lagos del Neuquén" },
  { label: "Servicios y Pagos", href: "#servicios", subtitle: "Qué incluye cada jornada" },
  { label: "Calendario", href: "#calendario", subtitle: "Fechas y disponibilidad" },
  { label: "Reseñas", href: "#resenas", subtitle: "Voces de pescadores" },
  { label: "Contacto", href: "#contacto", subtitle: "Consultas y reservas" },
];

export default function Navbar({ onOpenBookingModal }: NavbarProps) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 48);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-out ${
          scrolled
            ? "bg-[#263D32]/95 backdrop-blur-md shadow-lg py-4 border-b border-[#899487]/20"
            : "bg-gradient-to-b from-black/65 via-black/25 to-transparent py-6"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 flex items-center justify-between">
          {/* Left spacer on desktop so title feels balanced, or left-aligned clean */}
          <a
            href="#inicio"
            className="group flex flex-col focus:outline-none"
            aria-label="TRAUM Inicio"
          >
            <span className="font-editorial text-2xl sm:text-3xl tracking-[0.28em] text-[#F2EFE6] font-semibold transition-opacity duration-300 group-hover:opacity-85">
              TRAUM
            </span>
            <span className="text-[9px] uppercase tracking-[0.34em] text-[#D8CEB9]/90 -mt-1 font-medium">
              Fly Cast Patagonia
            </span>
          </a>

          {/* ONLY the 3-lines Hamburger Button on both Desktop and Mobile */}
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="text-[#F2EFE6] hover:text-[#D8CEB9] p-2.5 transition-colors duration-300 focus:outline-none cursor-pointer"
            aria-label="Abrir menú de secciones"
          >
            {menuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
          </button>
        </div>
      </header>

      {/* Backdrop Overlay when Menu is Open */}
      <div
        onClick={() => setMenuOpen(false)}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity duration-500 ${
          menuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-over Navigation Drawer */}
      <aside
        className={`fixed top-0 right-0 bottom-0 z-50 w-full max-w-md bg-[#263D32] text-[#F2EFE6] border-l border-[#899487]/25 shadow-2xl transition-transform duration-500 ease-out flex flex-col justify-between ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer Header */}
        <div className="px-8 py-6 border-b border-[#899487]/20 flex items-center justify-between">
          <div>
            <span className="font-editorial text-2xl tracking-[0.26em] text-[#F2EFE6] block">
              TRAUM
            </span>
            <span className="text-[9px] uppercase tracking-[0.32em] text-[#D8CEB9]/80 block">
              Fly Cast Patagonia
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen(false)}
            className="p-2 text-[#D8CEB9] hover:text-[#F2EFE6] transition-colors cursor-pointer"
            aria-label="Cerrar menú"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Drawer Direct Links */}
        <nav className="px-8 py-8 flex-1 overflow-y-auto flex flex-col justify-center gap-5">
          {navLinks.map((link, index) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="group py-2.5 border-b border-[#899487]/15 flex items-baseline justify-between transition-all duration-300 hover:pl-2"
            >
              <div>
                <span className="font-editorial text-2xl sm:text-3xl text-[#F2EFE6] group-hover:text-[#D8CEB9] transition-colors block">
                  {link.label}
                </span>
                <span className="text-[11px] text-[#899487] font-light tracking-wide">
                  {link.subtitle}
                </span>
              </div>
              <span className="text-[10px] font-editorial italic text-[#D8CEB9]/60">
                0{index + 1}
              </span>
            </a>
          ))}
        </nav>

        {/* Drawer Footer CTA */}
        <div className="p-8 border-t border-[#899487]/20 bg-[#292D29]/40">
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              onOpenBookingModal();
            }}
            className="w-full py-4 bg-[#D8CEB9] text-[#263D32] hover:bg-[#F2EFE6] text-xs uppercase tracking-[0.24em] font-semibold flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <Compass className="w-4 h-4" />
            <span>Reservar experiencia</span>
          </button>
        </div>
      </aside>
    </>
  );
}
