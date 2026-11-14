"use client";

import React from "react";
import {
  CardCheckoutInput,
  DeparturePricingBreakdown,
  detectCardBrand,
  formatArs,
  formatCardExpiryInput,
  formatCardNumberInput,
} from "@/lib/payment-utils";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";

interface CardCheckoutBoxProps {
  pricing: DeparturePricingBreakdown;
  cardData?: CardCheckoutInput;
  cardInput?: CardCheckoutInput;
  onChange: (next: CardCheckoutInput) => void;
  variant?: "dark" | "light";
}

export default function CardCheckoutBox({
  pricing,
  cardData: cardDataProp,
  cardInput: cardInputProp,
  onChange,
  variant = "light",
}: CardCheckoutBoxProps) {
  const cardData: CardCheckoutInput = cardDataProp || cardInputProp || {
    cardNumber: "",
    cardholderName: "",
    cardHolder: "",
    cardExpiry: "",
    cardCvv: "",
    billingPostalCode: "",
    postalCode: "",
    cardholderDni: "",
    dni: "",
  };
  const brand = detectCardBrand(cardData.cardNumber);
  const isDark = variant === "dark";

  return (
    <div
      className={`border p-4 sm:p-5 space-y-4 ${
        isDark
          ? "bg-[#1D2E26] border-[#D8CEB9]/40 text-[#F2EFE6]"
          : "bg-[#FAF8F3] border-[#263D32]/30 text-[#292D29]"
      }`}
    >
      {/* 1. DESGLOSE MATEMÁTICO DE CUPOS Y SEÑA */}
      <div
        className={`p-3.5 border space-y-2 ${
          isDark
            ? "bg-[#263D32] border-[#899487]/35"
            : "bg-white border-[#D8CEB9]"
        }`}
      >
        <div className="flex items-center justify-between border-b pb-2 border-current/15">
          <span
            className={`text-[10px] uppercase tracking-[0.2em] font-bold ${
              isDark ? "text-[#D8CEB9]" : "text-[#263D32]"
            }`}
          >
            Liquidación automática de seña
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 font-semibold uppercase tracking-wider ${
              isDark
                ? "bg-[#D8CEB9] text-[#263D32]"
                : "bg-[#263D32] text-[#F2EFE6]"
            }`}
          >
            {pricing.spotsBooked}{" "}
            {pricing.spotsBooked === 1 ? "cupo" : "cupos"} de{" "}
            {pricing.maxParticipants}
          </span>
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center justify-between opacity-80">
            <span>
              Valor total de la salida ({pricing.maxParticipants} cupos ·{" "}
              {formatArs(pricing.pricePerSpot)} c/u):
            </span>
            <span>{formatArs(pricing.departureTotalPrice)}</span>
          </div>

          <div className="flex items-center justify-between font-medium">
            <span>
              Monto correspondiente a tus {pricing.spotsBooked}{" "}
              {pricing.spotsBooked === 1 ? "lugar" : "lugares"}:
            </span>
            <span>{formatArs(pricing.subtotalForSpots)}</span>
          </div>

          <div
            className={`flex items-center justify-between ${
              isDark ? "text-[#D8CEB9]" : "text-[#746657]"
            }`}
          >
            <span>
              Menos saldo restante ({pricing.remainingPercentage}% a abonar el
              día de la salida):
            </span>
            <span>- {formatArs(pricing.remainingBalance)}</span>
          </div>

          <div
            className={`pt-2 border-t flex items-center justify-between text-sm font-bold ${
              isDark
                ? "border-[#899487]/35 text-[#F2EFE6]"
                : "border-[#D8CEB9] text-[#263D32]"
            }`}
          >
            <span>
              Seña a abonar ahora ({pricing.depositPercentage}%):
            </span>
            <span className="text-base sm:text-lg">
              {formatArs(pricing.depositAmount)} ARS
            </span>
          </div>
        </div>
      </div>

      {/* 2. FORMULARIO DE TARJETA ESTILO GOOGLE PLAY / CHECKOUT TRANSPARENTE */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard
              className={`w-4 h-4 ${
                isDark ? "text-[#D8CEB9]" : "text-[#263D32]"
              }`}
            />
            <span className="text-[11px] uppercase tracking-[0.18em] font-bold">
              Pago con tarjeta de débito o crédito
            </span>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-wider border ${
              isDark
                ? "bg-[#292D29] text-[#D8CEB9] border-[#D8CEB9]/40"
                : "bg-[#263D32] text-[#F2EFE6] border-[#263D32]"
            }`}
          >
            {brand}
          </span>
        </div>

        {/* Número de tarjeta */}
        <div>
          <label
            className={`block text-[10px] uppercase tracking-[0.16em] font-semibold mb-1 ${
              isDark ? "text-[#D8CEB9]" : "text-[#292D29]"
            }`}
          >
            Número de la tarjeta *
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              required
              placeholder="0000 0000 0000 0000"
              value={cardData.cardNumber}
              onChange={(e) =>
                onChange({
                  ...cardData,
                  cardNumber: formatCardNumberInput(e.target.value),
                })
              }
              className={`w-full px-3.5 py-2.5 border text-sm font-mono tracking-wider focus:outline-none ${
                isDark
                  ? "bg-[#263D32] border-[#899487]/60 text-[#F2EFE6] focus:border-[#D8CEB9]"
                  : "bg-white border-[#D8CEB9] text-[#292D29] focus:border-[#263D32]"
              }`}
            />
            <Lock
              className={`w-3.5 h-3.5 absolute right-3 top-3 ${
                isDark ? "text-[#D8CEB9]/70" : "text-[#746657]"
              }`}
            />
          </div>
        </div>

        {/* Titular de la tarjeta */}
        <div>
          <label
            className={`block text-[10px] uppercase tracking-[0.16em] font-semibold mb-1 ${
              isDark ? "text-[#D8CEB9]" : "text-[#292D29]"
            }`}
          >
            Nombre del titular (como figura en la tarjeta) *
          </label>
          <input
            type="text"
            autoComplete="cc-name"
            required
            placeholder="EJ. JUAN PEREZ"
            value={cardData.cardholderName || cardData.cardHolder || ""}
            onChange={(e) => {
              const val = e.target.value.toUpperCase();
              onChange({
                ...cardData,
                cardholderName: val,
                cardHolder: val,
              });
            }}
            className={`w-full px-3.5 py-2 border text-xs sm:text-sm uppercase focus:outline-none ${
              isDark
                ? "bg-[#263D32] border-[#899487]/60 text-[#F2EFE6] focus:border-[#D8CEB9]"
                : "bg-white border-[#D8CEB9] text-[#292D29] focus:border-[#263D32]"
            }`}
          />
        </div>

        {/* Vencimiento, CVV y Código Postal */}
        <div className="grid grid-cols-3 gap-2.5">
          <div>
            <label
              className={`block text-[10px] uppercase tracking-[0.14em] font-semibold mb-1 ${
                isDark ? "text-[#D8CEB9]" : "text-[#292D29]"
              }`}
            >
              Vencimiento *
            </label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp"
              required
              placeholder="MM/AA"
              value={cardData.cardExpiry}
              onChange={(e) =>
                onChange({
                  ...cardData,
                  cardExpiry: formatCardExpiryInput(e.target.value),
                })
              }
              className={`w-full px-3 py-2 border text-xs sm:text-sm font-mono text-center focus:outline-none ${
                isDark
                  ? "bg-[#263D32] border-[#899487]/60 text-[#F2EFE6] focus:border-[#D8CEB9]"
                  : "bg-white border-[#D8CEB9] text-[#292D29] focus:border-[#263D32]"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-[10px] uppercase tracking-[0.14em] font-semibold mb-1 ${
                isDark ? "text-[#D8CEB9]" : "text-[#292D29]"
              }`}
            >
              Cód. CVV *
            </label>
            <input
              type="password"
              inputMode="numeric"
              autoComplete="cc-csc"
              required
              maxLength={4}
              placeholder="123"
              value={cardData.cardCvv}
              onChange={(e) =>
                onChange({
                  ...cardData,
                  cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4),
                })
              }
              className={`w-full px-3 py-2 border text-xs sm:text-sm font-mono text-center focus:outline-none ${
                isDark
                  ? "bg-[#263D32] border-[#899487]/60 text-[#F2EFE6] focus:border-[#D8CEB9]"
                  : "bg-white border-[#D8CEB9] text-[#292D29] focus:border-[#263D32]"
              }`}
            />
          </div>

          <div>
            <label
              className={`block text-[10px] uppercase tracking-[0.14em] font-semibold mb-1 ${
                isDark ? "text-[#D8CEB9]" : "text-[#292D29]"
              }`}
            >
              Cód. Postal *
            </label>
            <input
              type="text"
              autoComplete="postal-code"
              required
              maxLength={10}
              placeholder="Ej. 8371"
              value={cardData.billingPostalCode || cardData.postalCode || ""}
              onChange={(e) => {
                const val = e.target.value.slice(0, 10);
                onChange({
                  ...cardData,
                  billingPostalCode: val,
                  postalCode: val,
                });
              }}
              className={`w-full px-3 py-2 border text-xs sm:text-sm text-center focus:outline-none ${
                isDark
                  ? "bg-[#263D32] border-[#899487]/60 text-[#F2EFE6] focus:border-[#D8CEB9]"
                  : "bg-white border-[#D8CEB9] text-[#292D29] focus:border-[#263D32]"
              }`}
            />
          </div>
        </div>

        {/* DNI opcional/facturación */}
        <div>
          <label
            className={`block text-[10px] uppercase tracking-[0.14em] font-semibold mb-1 ${
              isDark ? "text-[#D8CEB9]" : "text-[#292D29]"
            }`}
          >
            DNI / Documento del titular
          </label>
          <input
            type="text"
            inputMode="numeric"
            placeholder="Sin puntos (ej. 35123456)"
            value={cardData.cardholderDni || cardData.dni || ""}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 11);
              onChange({
                ...cardData,
                cardholderDni: val,
                dni: val,
              });
            }}
            className={`w-full px-3.5 py-2 border text-xs sm:text-sm focus:outline-none ${
              isDark
                ? "bg-[#263D32] border-[#899487]/60 text-[#F2EFE6] focus:border-[#D8CEB9]"
                : "bg-white border-[#D8CEB9] text-[#292D29] focus:border-[#263D32]"
            }`}
          />
        </div>

        <div
          className={`flex items-start gap-2 pt-1 text-[11px] leading-relaxed ${
            isDark ? "text-[#D8CEB9]/85" : "text-[#746657]"
          }`}
        >
          <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Sin guardar datos de tarjeta:</strong> La operación se
            procesa en el acto y tu lugar queda confirmado automáticamente sin
            enviar comprobantes por WhatsApp.
          </span>
        </div>
      </div>
    </div>
  );
}
