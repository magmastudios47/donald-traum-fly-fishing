"use client";

import React, { useState } from "react";
import { ReviewItem } from "@/types/traum";
import { Star, Quote, MessageSquarePlus, Send, CheckCircle2 } from "lucide-react";

interface ReviewsSectionProps {
  initialReviews: ReviewItem[];
}

export default function ReviewsSection({
  initialReviews,
}: ReviewsSectionProps) {
  const [reviews, setReviews] = useState<ReviewItem[]>(initialReviews);
  const [formOpen, setFormOpen] = useState(false);

  const [authorName, setAuthorName] = useState("");
  const [authorLocation, setAuthorLocation] = useState("");
  const [experienceModality, setExperienceModality] = useState(
    "Pesca de vadeo · Río Malleo"
  );
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authorName.trim() || !comment.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch("/api/traum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "REVIEW",
          authorName,
          authorLocation: authorLocation || "Patagonia",
          experienceModality,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (data?.review) {
        setReviews((prev) => [data.review, ...prev]);
      }
      setSubmittedSuccess(true);
      setAuthorName("");
      setAuthorLocation("");
      setComment("");
      setTimeout(() => {
        setSubmittedSuccess(false);
        setFormOpen(false);
      }, 2200);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      id="resenas"
      className="py-24 lg:py-36 bg-[#F2EFE6] text-[#292D29] border-t border-[#D8CEB9]"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-14 lg:mb-20 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-[1px] bg-[#263D32]" />
              <span className="text-xs uppercase tracking-[0.28em] text-[#65745A] font-semibold">
                Voces del río · Reseñas de pescadores
              </span>
            </div>
            <h2 className="font-editorial text-4xl sm:text-5xl lg:text-6xl text-[#263D32] leading-tight">
              Historias reales de{" "}
              <span className="italic text-[#746657]">
                sueños cumplidos.
              </span>
            </h2>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <button
              type="button"
              onClick={() => setFormOpen((prev) => !prev)}
              className="px-6 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold transition-colors flex items-center gap-2.5 cursor-pointer"
            >
              <MessageSquarePlus className="w-4 h-4 text-[#D8CEB9]" />
              <span>{formOpen ? "Cerrar formulario" : "Dejar mi reseña"}</span>
            </button>
          </div>
        </div>

        {/* Collapsible Public Review Submission Form */}
        {formOpen && (
          <div className="mb-14 bg-white border border-[#D8CEB9] shadow-xl p-7 sm:p-10">
            <div className="pb-5 mb-6 border-b border-[#D8CEB9] flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase tracking-[0.24em] text-[#746657] block font-semibold">
                  Compartí tu vivencia con Traum
                </span>
                <h3 className="font-editorial text-3xl text-[#263D32]">
                  Contanos cómo fue tu jornada en el río
                </h3>
              </div>
              <Quote className="w-7 h-7 text-[#D8CEB9]" />
            </div>

            {submittedSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-[#263D32] mx-auto" />
                <h4 className="font-editorial text-3xl text-[#263D32]">
                  ¡Gracias por compartir tu historia!
                </h4>
                <p className="text-xs text-[#746657]">
                  Tu reseña ya se encuentra publicada en la página.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReview} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                      Tu nombre *
                    </label>
                    <input
                      type="text"
                      required
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      placeholder="Ej. Federico Gómez"
                      className="w-full px-3.5 py-2.5 bg-[#F2EFE6]/40 border border-[#D8CEB9] focus:border-[#263D32] focus:outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase tracking-[0.2em] font-semibold mb-1.5">
                      Ciudad / País
                    </label>
                    <input
                      type="text"
                      value={authorLocation}
                      onChange={(e) => setAuthorLocation(e.target.value)}
                      placeholder="Ej. Córdoba, Argentina"
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

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-3.5 bg-[#263D32] text-[#F2EFE6] hover:bg-[#65745A] text-xs uppercase tracking-[0.22em] font-semibold flex items-center gap-2 cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting ? "Publicando..." : "Publicar reseña"}
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

              <div className="pt-4 border-t border-[#D8CEB9]">
                <span className="font-editorial text-xl text-[#263D32] font-semibold block">
                  {rev.authorName}
                </span>
                <span className="text-[11px] uppercase tracking-[0.18em] text-[#746657] block mt-0.5">
                  {rev.authorLocation} · {rev.experienceModality}
                </span>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
