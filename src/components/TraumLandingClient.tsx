"use client";

import React, { useState } from "react";
import { TraumStoreData } from "@/types/traum";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import PhilosophySection from "@/components/PhilosophySection";
import ExperiencesSection from "@/components/ExperiencesSection";
import DestinationsSection from "@/components/DestinationsSection";
import ServicesSection from "@/components/ServicesSection";
import CalendarSection from "@/components/CalendarSection";
import ReviewsSection from "@/components/ReviewsSection";
import ConservationSection from "@/components/ConservationSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import BookingModal from "@/components/BookingModal";
import RevealSection from "@/components/RevealSection";
import CookieConsentModal from "@/components/CookieConsentModal";

interface TraumLandingClientProps {
  initialData: TraumStoreData;
}

export default function TraumLandingClient({
  initialData,
}: TraumLandingClientProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] = useState<{
    date?: string;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
  } | null>(null);

  const handleOpenBookingModal = (prefill?: {
    date?: string;
    experienceType?: string;
    serviceGroupType?: string;
    destination?: string;
  }) => {
    setBookingPrefill(prefill || null);
    setBookingModalOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2EFE6] text-[#292D29]">
      {/* A. NAVBAR (Only TRAUM / Fly Cast Patagonia + 3-line Menu) */}
      <Navbar onOpenBookingModal={handleOpenBookingModal} />

      <main className="flex-1">
        {/* B. HERO SECTION */}
        <HeroSection
          heroBgUrl={initialData.siteImages.heroBg}
          onOpenBookingModal={() => handleOpenBookingModal()}
        />

        {/* C. FILOSOFÍA — EL SIGNIFICADO DE TRAUM */}
        <RevealSection>
          <PhilosophySection siteImages={initialData.siteImages} />
        </RevealSection>

        {/* D. EXPERIENCIAS — EL CORAZÓN DE TRAUM */}
        <RevealSection>
          <ExperiencesSection
            experiences={initialData.experiences}
            onSelectExperienceForBooking={(modality) =>
              handleOpenBookingModal({ experienceType: modality })
            }
          />
        </RevealSection>

        {/* E. DESTINOS + MAPA DE PESCA REFERENCIADO A JUNÍN DE LOS ANDES */}
        <RevealSection>
          <DestinationsSection
            destinations={initialData.destinations}
            onSelectDestinationForBooking={(destinationName) =>
              handleOpenBookingModal({ destination: destinationName })
            }
          />
        </RevealSection>

        {/* G. SERVICIOS + MEDIOS DE PAGO */}
        <RevealSection>
          <ServicesSection
            services={initialData.services}
            paymentConfig={initialData.paymentConfig}
            onOpenBookingModal={() => handleOpenBookingModal()}
          />
        </RevealSection>

        {/* F. CALENDARIO DE SALIDAS Y RESERVAS */}
        <RevealSection>
          <CalendarSection
            departures={initialData.departures}
            onRequestBookingFromCalendar={(prefill) =>
              handleOpenBookingModal(prefill)
            }
          />
        </RevealSection>

        {/* RESEÑAS DE PESCADORES */}
        <RevealSection>
          <ReviewsSection initialReviews={initialData.reviews} />
        </RevealSection>

        {/* H & I. PESCA RESPONSABLE + FRASE EDITORIAL THOREAU */}
        <RevealSection>
          <ConservationSection siteImages={initialData.siteImages} />
        </RevealSection>

        {/* J. CONTACTO Y RESERVAS */}
        <RevealSection>
          <ContactSection
            settings={initialData.settings}
            prefillData={bookingPrefill}
          />
        </RevealSection>
      </main>

      {/* K. FOOTER */}
      <Footer settings={initialData.settings} />

      {/* BOOKING MODAL */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        settings={initialData.settings}
        prefillData={bookingPrefill}
      />

      {/* COOKIE CONSENT POPUP ON ENTRY */}
      <CookieConsentModal />
    </div>
  );
}
