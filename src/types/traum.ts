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
}

export interface PaymentConfig {
  enabled: boolean;
  title: string;
  subtitle: string;
  depositPercentage: number;
  acceptedMethods: string[];
  bankName: string;
  bankAlias: string;
  bankCbu: string;
  bankHolder: string;
  mercadoPagoLink: string;
  internationalPaymentLink: string;
  cancellationNotice: string;
}

export interface ReviewItem {
  id: string;
  authorName: string;
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
  paymentLink?: string;
}

export interface BookingInquiry {
  id: string;
  createdAt: string;
  fullName: string;
  email: string;
  whatsapp: string;
  desiredDate: string;
  experienceType: string;
  serviceGroupType: string;
  participantsCount: number;
  skillLevel:
    | "Iniciación / Primeros pasos"
    | "Intermedio"
    | "Avanzado / Experimentado";
  comments: string;
  status: "Pendiente" | "Contactado" | "Confirmado";
}

export interface SiteSettings {
  brandName: string;
  brandSubtitle: string;
  tagline: string;
  secondaryTagline: string;
  locationGeneral: string;
  whatsappNumber: string;
  email: string;
  instagramHandle: string;
  instagramUrl: string;
  showDemoDepartures: boolean;
  showReferenceNoticeOnDestinations: boolean;
  adminPin: string;
}

export interface TraumStoreData {
  settings: SiteSettings;
  siteImages: SiteImagesConfig;
  paymentConfig: PaymentConfig;
  experiences: ExperienceItem[];
  destinations: DestinationItem[];
  services: ServiceFeatureItem[];
  departures: CalendarDeparture[];
  reviews: ReviewItem[];
  inquiries: BookingInquiry[];
}
