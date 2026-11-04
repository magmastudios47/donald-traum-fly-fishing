export type ExperienceModality =
  | "Pesca de vadeo"
  | "Pesca en balsa"
  | "Salida personalizada";

export type ServiceGroupType =
  | "Salida individual"
  | "Salida para dos personas"
  | "Salida grupal"
  | "Salida privada o personalizada";

export interface ExperienceItem {
  id: string;
  number: string;
  title: string;
  subtitle: string;
  description: string;
  extendedDescription: string;
  modality: ExperienceModality;
  imageUrl: string;
  highlights: string[];
  durationPlaceholder: string;
  capacityPlaceholder: string;
  priceLabel?: string;
  paymentLink?: string;
}

export interface DestinationItem {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  description: string;
  modalities: ExperienceModality[];
  isReferenceDemo?: boolean;
  lat: number;
  lng: number;
  distanceFromJunin: string;
  waterType: "Río" | "Lago" | "Cuenca / Río";
}

export interface ServiceFeatureItem {
  id: string;
  title: string;
  description: string;
  iconName: string;
  enabled: boolean;
  note?: string;
  priceLabel?: string;
  paymentLink?: string;
}

export interface PaymentConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  depositPercentage: number;
  acceptedMethods: string[];
  bankName: string;
  bankAlias: string;
  bankCbu?: string;
  bankHolder: string;
  mercadoPagoLink: string;
  internationalPaymentLink: string;
  cancellationNotice: string;
}

export interface ReviewItem {
  id: string;
  authorName: string;
  authorEmail?: string;
  authorAvatar?: string;
  verifiedGoogle?: boolean;
  authorLocation: string;
  experienceModality: string;
  rating: number; // 1 to 5
  comment: string;
  createdAt: string;
}

export interface SiteImagesConfig {
  heroBg: string;
  philosophyMain: string;
  pillarCapture: string;
  pillarDisconnect: string;
  pillarShare: string;
  conservationMain: string;
  thoreauQuoteBg: string;
}

export interface CalendarDeparture {
  id: string;
  date: string; // YYYY-MM-DD
  destination: string;
  experienceType: ExperienceModality;
  serviceGroupType: ServiceGroupType;
  maxParticipants: number;
  availableSpots: number | null;
  duration: string;
  additionalInfo: string;
  isDemo?: boolean;
  priceLabel?: string;
  paymentLink?: string;
}

export interface BookingInquiry {
  id: string;
  bookingCode: string;
  createdAt: string;
  fullName: string;
  email: string;
  googleEmail?: string;
  whatsapp: string;
  desiredDate: string;
  departureId?: string;
  requiresDeposit?: boolean;
  spotsReleased?: boolean;
  selectedServiceTitle?: string;
  priceReference?: string;
  depositPercentage?: number;
  experienceType: string;
  serviceGroupType: string;
  participantsCount: number;
  skillLevel:
    | "Iniciación / Primeros pasos"
    | "Intermedio"
    | "Avanzado / Experimentado";
  comments: string;
  legalAccepted: boolean;
  legalAcceptedAt: string;
  legalVersion: string;
  emailNotificationSent?: boolean;
  status: "Pendiente" | "Contactado" | "Confirmado" | "Cancelado";
}

export interface CookieConsentPreferences {
  essential: boolean;
  googleAuth: boolean;
  payments: boolean;
  analytics: boolean;
}

export interface CookieConsentRecord {
  id: string;
  visitorId: string;
  decision: "accepted" | "rejected" | "custom";
  preferences: CookieConsentPreferences;
  googleEmail?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegretRequestItem {
  id: string;
  regretCode: string;
  createdAt: string;
  fullName: string;
  email: string;
  whatsapp: string;
  bookingCode?: string;
  serviceContracted: string;
  reason: string;
  status: "Recibido" | "En gestión" | "Resuelto";
}

export interface SiteSettings {
  brandName: string;
  brandSubtitle: string;
  tagline: string;
  secondaryTagline: string;
  locationGeneral: string;
  whatsappNumber: string;
  email: string;
  notificationEmail: string;
  instagramHandle: string;
  instagramUrl: string;
  showDemoDepartures: boolean;
  showReferenceNoticeOnDestinations: boolean;
  adminPin: string;
  // Datos legales y comerciales editables
  legalOwnerName: string;
  legalTaxId: string;
  legalAddress: string;
  guideLicenseNumber: string;
  // Integraciones opcionales Google OAuth & SMTP/API de correo
  googleClientId?: string;
  web3FormsAccessKey?: string;
  smtpUser?: string;
  smtpAppPassword?: string;
  resendApiKey?: string;
}

export interface TraumStoreData {
  version?: number;
  updatedAt?: string;
  settings: SiteSettings;
  siteImages: SiteImagesConfig;
  paymentConfig: PaymentConfig;
  experiences: ExperienceItem[];
  destinations: DestinationItem[];
  services: ServiceFeatureItem[];
  departures: CalendarDeparture[];
  reviews: ReviewItem[];
  inquiries: BookingInquiry[];
  cookieConsents?: CookieConsentRecord[];
  regretRequests?: RegretRequestItem[];
}

export interface GoogleUserSession {
  name: string;
  email: string;
  picture?: string;
  sub?: string;
  verifiedAt: string;
}
