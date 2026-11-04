"use client";

import React, { useState, useEffect } from "react";
import { ReviewItem } from "@/types/traum";
import { useGoogleSession } from "@/lib/google-session";
import GoogleAuthModal, { GoogleLogoSvg } from "@/components/GoogleAuthModal";
import {
  Star,
  Quote,
  MessageSquarePlus,
  Send,
  CheckCircle2,
  LogOut,
  ShieldCheck,
} from "lucide-react";

interface ReviewsSectionProps {
  initialReviews: ReviewItem[];
  googleClientId?: string;
  onReviewCreated?: (review: ReviewItem) => void;
}

export default function ReviewsSection({
  initialReviews,
  googleClientId,
  onReviewCreated,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [formOpen, setFormOpen] = useState(false);
  const [googleModalOpen, setGoogleModalOpen] = useState(false);

  const { user: googleUser, signIn, signOut } = useGoogleSession();

  const [authorLocation, setAuthorLocation] = useState("");
  const [experienceModality, setExperienceModality] = useState(
    "Pesca de vadeo · Río Malleo"
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Sync live updates from server
  useEffect(() => {
    setReviews(initialReviews);
  }, [initialReviews]);

  const handleOpenReviewForm = () => {
    if (!googleUser) {
      setGoogleModalOpen(true);
      setFormOpen(true);
      return;
    }
    setFormOpen((prev) => !prev);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!googleUser || !googleUser.email) {
      setGoogleModalOpen(true);
      return;
    }

    if (!comment.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REVIEW",
          authorName: googleUser.name,
          authorEmail: googleUser.email,
          authorAvatar: googleUser.picture,
          authorLocation: authorLocation || "Patagonia",
          experienceModality,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error || "No se pudo publicar la reseña.");
        return;
      }
      if (data?.review) {
        setReviews((prev) => [
          data.review,
          ...prev.filter((r) => r.id !== data.review.id),
        ]);
        if (onReviewCreated) onReviewCreated(data.review);
      }
      setSubmittedSuccess(true);
      setAuthorLocation("");
      setComment("");
      setTimeout(() => {
        setSubmittedSuccess(false);
        setFormOpen(false);
      }, 2400);
    } catch {
      setSubmitError("Error de conexión al publicar la reseña.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="resenas"
      className="py-20 sm:py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] border-t border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 lg:mb-20 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[1px] bg-[#263D32]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                Voces del río · Reseñas verificadas con Google
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-tight">
              Historias reales de{" "}
              <span className="italic text-[#746657]">
                sueños cumplidos.
              </span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            {googleUser && (
              <div className="px-3.5 py-2 bg-white border border-[#D8CEB9] flex items-center gap-2.5 text-xs">
                <GoogleLogoSvg className="w-4 h-4" />
                <span className="font-medium text-[#263D32] truncate max-w-[180px]">
                  {googleUser.name}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="text-[#746657] hover:text-red-700 ml-1 cursor-pointer"
                  title="Cerrar sesión de Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleOpenReviewForm}
              className="px-6 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#D8CEB9]" />
              <span>
                {formOpen
                  ? "Cerrar formulario"
                  : googleUser
                  ? "Dejar mi reseña"
                  : "Dejar reseña con Google"}
              </span>
            </button>
          </div>
        </div>

        {/* Collapsible Public Review Submission Form */}
        {formOpen && (
          <div className="mb-14 bg-white border border-[#D8CEB9] shadow-xl p-7 sm:p-10">
            <div className="pb-5 mb-6 border-b border-[#D8CEB9] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#746657] block font-semibold">
                  Compartí tu vivencia con Traum · Reseña Verificada
                </span>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  Contanos cómo fue tu jornada en el río
                </h3>
              </div>
              <Quote className="w-7 h-7 text-[#D8CEB9]" />
            </div>

            {!googleUser ? (
              <div className="py-8 px-4 bg-[#F2EFE6]/60 border border-[#D8CEB9] text-center space-y-5">
                <div className="w-12 h-12 bg-white border border-[#D8CEB9] mx-auto flex items-center justify-center shadow-xs">
                  <GoogleLogoSvg className="w-6 h-6" />
                </div>
                <div className="space-y-2 max-w-md mx-auto">
                  <h4 className="font-editorial text-2xl sm:text-3xl text-[#263D32]">
                    Iniciá sesión con Google para publicar tu reseña
                  </h4>
                  <p className="text-xs sm:text-sm text-[#292D29]/80 font-light leading-relaxed">
                    Para garantizar que todas las opiniones pertenezcan a
                    pescadores reales, las reseñas se publican asociadas a tu
                    cuenta verificada de Google.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setGoogleModalOpen(true)}
                  className="px-7 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold inline-flex items-center gap-3 cursor-pointer"
                >
                  <GoogleLogoSvg className="w-4 h-4" />
                  <span>Continuar con Google</span>
                </button>
              </div>
            ) : submittedSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#263D32] mx-auto" />
                <h4 className="font-editorial text-3xl text-[#263D32]">
                  ¡Gracias por compartir tu historia, {googleUser.name}!
                </h4>
                <p className="text-xs text-[#746657]">
                  Tu reseña verificada con Google ya se encuentra publicada en
                  vivo para todos los visitantes.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                {/* Verified Google Account Banner */}
                <div className="p-4 bg-[#F2EFE6]/70 border border-[#D8CEB9] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {googleUser.picture ? (
                      <img
                        src={googleUser.picture}
                        alt={googleUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-[#263D32]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#263D32] text-[#D8CEB9] flex items-center justify-center font-editorial text-lg">
                        {googleUser.name[0]}
                      </div>
                    )}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#263D32]">
                          {googleUser.name}
                        </span>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#263D32] text-[#D8CEB9] text-[9px] uppercase tracking-wider">
                          <ShieldCheck className="w-3 h-3" />
                          Google Verificado
                        </span>
                      </div>
                      <span className="text-xs text-[#746657]">
                        {googleUser.email}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setGoogleModalOpen(true)}
                    className="text-[11px] uppercase tracking-wider text-[#263D32] underline cursor-pointer self-start sm:self-center"
                  >
                    Cambiar cuenta
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                      Ciudad / País de origen
                    </label>
                    <input
                      type="text"
                      value={authorLocation}
                      onChange={(e) => setAuthorLocation(e.target.value)}
                      placeholder="Ej. Buenos Aires, Argentina"
                      className="w-full px-3.5 py-2.5 bg-[#F2EFE6]/40 border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                      Experiencia / Río
                    </label>
                    <input
                      type="text"
                      value={experienceModality}
                      onChange={(e) => setExperienceModality(e.target.value)}
                      placeholder="Ej. Pesca en balsa · Río Chimehuín"
                      className="w-full px-3.5 py-2.5 bg-[#F2EFE6]/40 border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-2">
                    Valoración de la experiencia
                  </label>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="p-1 cursor-pointer focus:outline-none"
                        aria-label={`${star} estrellas`}
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= rating
                              ? "fill-[#263D32] text-[#263D32]"
                              : "text-[#D8CEB9]"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                    Tu reseña *
                  </label>
                  <textarea
                    rows={3}
                    required
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Describí tu experiencia pescando con Traum en los ríos de la Patagonia..."
                    className="w-full px-3.5 py-2.5 bg-[#F2EFE6]/40 border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                  />
                </div>

                {submitError && (
                  <p className="text-xs text-red-700 bg-red-50 border border-red-200 p-3">
                    {submitError}
                  </p>
                )}

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting ? "Publicando en vivo..." : "Publicar reseña"}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Reviews Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((rev) => (
            <article
              key={rev.id}
              className="bg-[#F2EFE6] border border-[#D8CEB9] p-8 flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-500"
            >
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <Star
                        key={idx}
                        className={`w-4 h-4 ${
                          idx < rev.rating
                            ? "fill-[#263D32] text-[#263D32]"
                            : "text-[#D8CEB9]"
                        }`}
                      />
                    ))}
                  </div>
                  <Quote className="w-6 h-6 text-[#D8CEB9]" />
                </div>

                <p className="font-editorial italic text-xl sm:text-2xl text-[#292D29] leading-relaxed mb-6">
                  “{rev.comment}”
                </p>
              </div>

              <div className="pt-4 border-t border-[#D8CEB9] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {rev.authorAvatar ? (
                    <img
                      src={rev.authorAvatar}
                      alt={rev.authorName}
                      className="w-9 h-9 rounded-full object-cover border border-[#263D32]/40"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-[#263D32] text-[#D8CEB9] flex items-center justify-center font-editorial text-sm">
                      {rev.authorName[0]}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-editorial text-xl text-[#263D32] font-semibold">
                        {rev.authorName}
                      </span>
                      {rev.verifiedGoogle !== false && (
                        <GoogleLogoSvg className="w-3.5 h-3.5" />
                      )}
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.18em] text-[#746657] block mt-0.5">
                      {rev.authorLocation} · {rev.experienceModality}
                    </span>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>

      <GoogleAuthModal
        isOpen={googleModalOpen}
        onClose={() => setGoogleModalOpen(false)}
        onSuccess={(session) => signIn(session)}
        googleClientId={googleClientId}
        contextLabel="Iniciá sesión con tu cuenta de Google para publicar una reseña verificada en TRAUM"
      />
    </section>
  );
}
