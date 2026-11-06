"use client";

import React, { useState, useEffect, useCallback } from "react";
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
import BookingModal, { BookingPrefillData } from "@/components/BookingModal";
import RevealSection from "@/components/RevealSection";
import CookieConsentModal from "@/components/CookieConsentModal";

interface TraumLandingClientProps {
  initialData: TraumStoreData;
}

export default function TraumLandingClient({
  initialData,
}: TraumLandingClientProps) {
  const [store, setStore] = useState<TraumStoreData>(initialData);
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [bookingPrefill, setBookingPrefill] =
    useState<BookingPrefillData | null>(null);

  const syncLiveStore = useCallback(async () => {
    try {
      const res = await fetch("/api/traum", { cache: "no-store" });
      if (!res.ok) return;
      const latest: TraumStoreData = await res.json();
      setStore((prev) => {
        if (
          latest.version !== prev.version ||
          latest.updatedAt !== prev.updatedAt ||
          latest.reviews.length !== prev.reviews.length ||
          latest.departures.length !== prev.departures.length
        ) {
          return latest;
        }
        return prev;
      });
    } catch {
      // Keep current store if offline
    }
  }, []);

  // Real-time live synchronization for all visitors
  useEffect(() => {
    syncLiveStore();
    const interval = setInterval(syncLiveStore, 4000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        syncLiveStore();
      }
    };
    window.addEventListener("focus", syncLiveStore);
    document.addEventListener("visibilitychange", handleVisibility);

    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      bc = new BroadcastChannel("traum_live_sync");
      bc.onmessage = () => {
        syncLiveStore();
      };
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", syncLiveStore);
      document.removeEventListener("visibilitychange", handleVisibility);
      if (bc) bc.close();
    };
  }, [syncLiveStore]);

  const handleOpenBookingModal = (prefill?: BookingPrefillData) => {
    setBookingPrefill(prefill || null);
    setBookingModalOpen(true);
  };

  const notifyLiveChange = () => {
    syncLiveStore();
    if (typeof BroadcastChannel !== "undefined") {
      try {
        const bc = new BroadcastChannel("traum_live_sync");
        bc.postMessage({ updatedAt: Date.now() });
        bc.close();
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#F2EFE6] text-[#292D29]">
      {/* A. NAVBAR */}
      <Navbar onOpenBookingModal={handleOpenBookingModal} />

      <main className="flex-1">
        {/* B. HERO SECTION */}
        <HeroSection
          heroBgUrl={store.siteImages.heroBg}
          onOpenBookingModal={() => handleOpenBookingModal()}
        />

        {/* C. FILOSOFÍA — EL SIGNIFICADO DE TRAUM */}
        <RevealSection>
          <PhilosophySection siteImages={store.siteImages} />
        </RevealSection>

        {/* D. EXPERIENCIAS — EL CORAZÓN DE TRAUM */}
        <RevealSection>
          <ExperiencesSection
            experiences={store.experiences}
            onSelectExperienceForBooking={(modality) =>
              handleOpenBookingModal({
                experienceType: modality,
                selectedServiceTitle: modality,
              })
            }
          />
        </RevealSection>

        {/* E. DESTINOS + MAPA DE PESCA REFERENCIADO A JUNÍN DE LOS ANDES */}
        <RevealSection>
          <DestinationsSection
            destinations={store.destinations}
            onSelectDestinationForBooking={(destinationName) =>
              handleOpenBookingModal({
                destination: destinationName,
                selectedServiceTitle: `Salida en ${destinationName}`,
              })
            }
          />
        </RevealSection>

        {/* G. SERVICIOS + MEDIOS DE PAGO (DATOS BANCARIOS OCULTOS HASTA CONTRATAR) */}
        <RevealSection>
          <ServicesSection
            services={store.services}
            paymentConfig={store.paymentConfig}
            onContractService={(srv) =>
              handleOpenBookingModal({
                selectedServiceTitle: srv.title,
                priceReference: srv.priceLabel || srv.note,
                paymentLink: srv.paymentLink,
              })
            }
            onOpenBookingModal={() => handleOpenBookingModal()}
          />
        </RevealSection>

        {/* F. CALENDARIO DE SALIDAS Y RESERVAS */}
        <RevealSection>
          <CalendarSection
            departures={store.departures}
            blockedDays={store.blockedDays}
            destinations={store.destinations}
            onDataChanged={notifyLiveChange}
            onRequestBookingFromCalendar={(prefill) =>
              handleOpenBookingModal({
                ...prefill,
                selectedServiceTitle: prefill.destination
                  ? `Salida ${prefill.date} — ${prefill.destination}`
                  : prefill.experienceType,
              })
            }
          />
        </RevealSection>

        {/* RESEÑAS DE PESCADORES (CON GOOGLE OBLIGATORIO) */}
        <RevealSection>
          <ReviewsSection
            initialReviews={store.reviews}
            googleClientId={store.settings.googleClientId}
            onReviewCreated={notifyLiveChange}
          />
        </RevealSection>

        {/* H & I. PESCA RESPONSABLE + FRASE EDITORIAL THOREAU */}
        <RevealSection>
          <ConservationSection siteImages={store.siteImages} />
        </RevealSection>

        {/* J. CONTACTO Y RESERVAS */}
        <RevealSection>
          <ContactSection
            settings={store.settings}
            paymentConfig={store.paymentConfig}
            experiences={store.experiences}
            services={store.services}
            departures={store.departures}
            prefillData={bookingPrefill}
            onInquirySubmitted={notifyLiveChange}
          />
        </RevealSection>
      </main>

      {/* K. FOOTER */}
      <Footer settings={store.settings} />

      {/* BOOKING MODAL (PASO 1 DATOS + LEGAL -> PASO 2 SEÑA Y ALIAS SIN CBU) */}
      <BookingModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        settings={store.settings}
        paymentConfig={store.paymentConfig}
        experiences={store.experiences}
        services={store.services}
        prefillData={bookingPrefill}
        onBookingCreated={notifyLiveChange}
      />

      {/* COOKIE CONSENT POPUP ON ENTRY (PERSISTED IN SERVER DB) */}
      <CookieConsentModal />
    </div>
  );
}
