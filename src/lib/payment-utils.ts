import {
  CalendarDeparture,
  ExperienceItem,
  PaymentConfig,
  PriceDisplayMode,
} from "@/types/traum";

export interface DeparturePricingBreakdown {
  departureTotalPrice: number;
  totalDeparturePrice: number;
  maxParticipants: number;
  pricePerSpot: number;
  spotsBooked: number;
  subtotalForSpots: number;
  depositPercentage: number;
  remainingPercentage: number;
  depositAmount: number;
  remainingBalance: number;
  priceDisplayMode: PriceDisplayMode;
}

export function formatArs(amount: number): string {
  const safe = Math.round(Number(amount) || 0);
  return `$${safe.toLocaleString("es-AR")}`;
}

type DeparturePricingTarget = Pick<
  CalendarDeparture,
  | "totalPrice"
  | "maxParticipants"
  | "experienceType"
  | "depositPercentage"
  | "priceDisplayMode"
>;

export interface CalculatePricingParams {
  departure: DeparturePricingTarget;
  experiences?: ExperienceItem[];
  paymentConfig?: Partial<PaymentConfig>;
  participantsCount: number;
}

/**
 * Calcula con precisión el valor por cupo (precio total de la salida / cupos totales),
 * el subtotal según cuántos lugares ocupa el cliente, la resta del saldo restante
 * y el monto exacto de la seña a abonar en la página.
 */
export function calculateDepartureBookingPricing(
  arg1: CalculatePricingParams | DeparturePricingTarget,
  arg2?: number,
  arg3?: ExperienceItem[],
  arg4?: Partial<PaymentConfig>
): DeparturePricingBreakdown {
  const isParamsObj =
    arg1 !== null &&
    typeof arg1 === "object" &&
    "departure" in arg1 &&
    arg1.departure !== undefined;

  const departure: DeparturePricingTarget = isParamsObj
    ? (arg1 as CalculatePricingParams).departure
    : (arg1 as DeparturePricingTarget);
  const participantsCount = isParamsObj
    ? (arg1 as CalculatePricingParams).participantsCount
    : Number(arg2) || 1;
  const experiences = isParamsObj
    ? (arg1 as CalculatePricingParams).experiences || []
    : arg3 || [];
  const paymentConfig = isParamsObj
    ? (arg1 as CalculatePricingParams).paymentConfig
    : arg4;

  const matchingExp = experiences.find(
    (e) => e.modality === departure.experienceType
  );

  const rawTotalPrice =
    Number(departure.totalPrice) > 0
      ? Number(departure.totalPrice)
      : Number(matchingExp?.basePrice) > 0
      ? Number(matchingExp?.basePrice)
      : Number(paymentConfig?.defaultDepartureTotalPrice) > 0
      ? Number(paymentConfig?.defaultDepartureTotalPrice)
      : 120000;

  const maxParticipants = Math.max(
    1,
    Math.floor(Number(departure.maxParticipants) || 2)
  );
  const pricePerSpot = Math.round(rawTotalPrice / maxParticipants);
  const spotsBooked = Math.max(1, Math.floor(Number(participantsCount) || 1));
  const subtotalForSpots = pricePerSpot * spotsBooked;

  const rawDepositPct =
    Number(departure.depositPercentage) > 0
      ? Number(departure.depositPercentage)
      : Number(matchingExp?.defaultDepositPercentage) > 0
      ? Number(matchingExp?.defaultDepositPercentage)
      : Number(paymentConfig?.depositPercentage) > 0
      ? Number(paymentConfig?.depositPercentage)
      : 30;

  const depositPercentage = Math.min(
    100,
    Math.max(1, Math.round(rawDepositPct))
  );
  const remainingPercentage = Math.max(0, 100 - depositPercentage);
  const depositAmount = Math.round((subtotalForSpots * depositPercentage) / 100);
  const remainingBalance = Math.max(0, subtotalForSpots - depositAmount);
  const priceDisplayMode: PriceDisplayMode =
    departure.priceDisplayMode === "total" ? "total" : "per_person";

  return {
    departureTotalPrice: rawTotalPrice,
    totalDeparturePrice: rawTotalPrice,
    maxParticipants,
    pricePerSpot,
    spotsBooked,
    subtotalForSpots,
    depositPercentage,
    remainingPercentage,
    depositAmount,
    remainingBalance,
    priceDisplayMode,
  };
}

export function detectCardBrand(cardNumber: string): string {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (!digits) return "TARJETA";
  if (/^4/.test(digits)) return "VISA";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "MASTERCARD";
  if (/^3[47]/.test(digits)) return "AMEX";
  if (/^(589562|6042|6043)/.test(digits)) return "CABAL";
  if (/^5895/.test(digits)) return "NARANJA";
  return "TARJETA";
}

export function formatCardNumberInput(value: string): string {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

export function formatCardExpiryInput(value: string): string {
  const digits = String(value || "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
  }
  return digits;
}

export function passesLuhnCheck(cardNumber: string): boolean {
  const digits = String(cardNumber || "").replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;
  if (/^(\d)\1+$/.test(digits)) return false;

  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

export interface CardCheckoutInput {
  cardNumber: string;
  cardholderName?: string;
  cardHolder?: string;
  cardExpiry: string; // MM/YY
  cardCvv: string;
  cardholderDni?: string;
  dni?: string;
  billingPostalCode?: string;
  postalCode?: string;
}

export function validateCardCheckoutInput(input: CardCheckoutInput): {
  valid: boolean;
  error?: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
} {
  const digits = String(input.cardNumber || "").replace(/\D/g, "");
  const brand = detectCardBrand(digits);
  const last4 = digits.slice(-4);

  if (digits.length < 15 || digits.length > 16 || !passesLuhnCheck(digits)) {
    return {
      valid: false,
      error: "Revisá el número de tu tarjeta (debe tener 15 o 16 dígitos válidos).",
      brand,
      last4,
      expMonth: 0,
      expYear: 0,
    };
  }

  const holder = String(input.cardholderName || input.cardHolder || "").trim();
  if (holder.length < 3) {
    return {
      valid: false,
      error: "Ingresá el nombre y apellido tal como figura en la tarjeta.",
      brand,
      last4,
      expMonth: 0,
      expYear: 0,
    };
  }

  const expMatch = String(input.cardExpiry || "")
    .trim()
    .match(/^(\d{2})\s*\/\s*(\d{2,4})$/);
  if (!expMatch) {
    return {
      valid: false,
      error: "Ingresá la fecha de vencimiento en formato MM/AA (ej. 08/29).",
      brand,
      last4,
      expMonth: 0,
      expYear: 0,
    };
  }

  const expMonth = parseInt(expMatch[1], 10);
  const rawYear = parseInt(expMatch[2], 10);
  const expYear = rawYear < 100 ? 2000 + rawYear : rawYear;

  if (expMonth < 1 || expMonth > 12) {
    return {
      valid: false,
      error: "El mes de vencimiento de la tarjeta debe estar entre 01 y 12.",
      brand,
      last4,
      expMonth,
      expYear,
    };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  if (
    expYear < currentYear ||
    (expYear === currentYear && expMonth < currentMonth) ||
    expYear > currentYear + 20
  ) {
    return {
      valid: false,
      error: "La tarjeta ingresada se encuentra vencida o la fecha no es válida.",
      brand,
      last4,
      expMonth,
      expYear,
    };
  }

  const cvvDigits = String(input.cardCvv || "").replace(/\D/g, "");
  if (cvvDigits.length < 3 || cvvDigits.length > 4) {
    return {
      valid: false,
      error: "Ingresá el código de seguridad (CVV/CVC de 3 o 4 dígitos al dorso).",
      brand,
      last4,
      expMonth,
      expYear,
    };
  }

  const postalCode = String(
    input.billingPostalCode || input.postalCode || ""
  ).trim();
  if (postalCode.length < 3 || postalCode.length > 12) {
    return {
      valid: false,
      error: "Ingresá el código postal de facturación de tu tarjeta.",
      brand,
      last4,
      expMonth,
      expYear,
    };
  }

  return {
    valid: true,
    brand,
    last4,
    expMonth,
    expYear,
  };
}
