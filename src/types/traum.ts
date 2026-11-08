export type ExperienceModality =
  | "Pesca de vadeo"
  | "Pesca en balsa"
  | "Salida personalizada";

export type ServiceGroupType =
  | "Salida individual"
  | "Salida para dos personas"
  | "Salida grupal"
  | "Salida privada o personalizada";

export type PreferredScheduleType = "Mañana" | "Tarde" | "Todo el día";

export type DepartureStatus = "activa" | "cancelada";

export type EnrollmentStatus = "confirmada" | "lista_espera" | "cancelada";

export type CustomRequestStatus =
  | "pendiente"
  | "aceptada"
  | "rechazada"
  | "reprogramada";

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

export interface GalleryImageItem {
  id: string;
  imageUrl: string;
  caption?: string;
  order: number;
  createdAt: string;
}

export interface EmailLogItem {
  id: string;
  createdAt: string;
  eventType:
    | "solicitud_recibida"
    | "anotacion_confirmada"
    | "respuesta_solicitud"
    | "cancelacion_salida"
    | "arrepentimiento"
    | "mail_prueba";
  subject: string;
  recipientGuide: string;
  recipientClient?: string;
  guideSent: boolean;
  clientSent: boolean;
  channel: string;
  errorDetails?: string;
}

/**
 * SALIDA PROGRAMADA (Salida)
 * Datos: fecha, hora_inicio, hora_fin (opcional), río (destination),
 * tipo_pesca (experienceType), cupos_totales (maxParticipants), notas (additionalInfo),
 * estado ("activa" | "cancelada").
 */
export interface CalendarDeparture {
  id: string;
  date: string; // YYYY-MM-DD (fecha)
  startTime: string; // HH:mm (hora_inicio)
  endTime?: string; // HH:mm (hora_fin, opcional)
  destination: string; // río
  experienceType: ExperienceModality; // tipo_pesca
  serviceGroupType: ServiceGroupType;
  maxParticipants: number; // cupos_totales
  availableSpots: number; // calculado: cupos_totales - sum(confirmadas)
  duration: string;
  additionalInfo: string; // notas
  status: DepartureStatus; // "activa" | "cancelada"
  isPrivate?: boolean;
  convertedFromRequestId?: string;
  isDemo?: boolean;
  priceLabel?: string;
  paymentLink?: string;
}

/**
 * ANOTACIÓN EN SALIDA PROGRAMADA (Anotación)
 * Datos: salida (departureId), nombre (fullName), teléfono (whatsapp),
 * email, cantidad_personas (participantsCount), comentarios (comments),
 * estado ("confirmada" | "lista_espera" | "cancelada").
 */
export interface DepartureEnrollment {
  id: string;
  bookingCode: string;
  departureId: string; // salida
  fullName: string; // nombre
  whatsapp: string; // teléfono / WhatsApp
  normalizedPhone: string; // solo dígitos para evitar doble anotación
  email: string;
  participantsCount: number; // cantidad_personas
  comments: string; // comentarios
  status: EnrollmentStatus; // "confirmada" | "lista_espera" | "cancelada"
  createdAt: string;
  updatedAt?: string;
  cancelledAt?: string;
}

/**
 * SOLICITUD DE SALIDA A PEDIDO (Solicitud)
 * Datos: fecha_solicitada (desiredDate), horario_preferido (preferredSchedule: Mañana/Tarde/Todo el día),
 * río (preferredRiver, opcional), tipo_pesca (experienceType, opcional),
 * cantidad_personas (participantsCount), datos de contacto (fullName, whatsapp, email),
 * mensaje (comments), estado ("pendiente" | "aceptada" | "rechazada" | "reprogramada"),
 * fecha_alternativa (alternativeDate), respuesta_del_guía (guideResponse).
 */
export interface CustomTripRequest {
  id: string;
  requestCode: string;
  desiredDate: string; // fecha_solicitada (YYYY-MM-DD)
  preferredSchedule: PreferredScheduleType; // horario_preferido (Mañana | Tarde | Todo el día)
  preferredRiver?: string; // río preferido (opcional)
  experienceType?: ExperienceModality | ""; // tipo_pesca preferido (opcional)
  participantsCount: number; // cantidad_personas
  fullName: string;
  whatsapp: string;
  normalizedPhone: string;
  email: string;
  comments: string; // mensaje
  status: CustomRequestStatus; // "pendiente" | "aceptada" | "rechazada" | "reprogramada"
  alternativeDate?: string; // fecha_alternativa (YYYY-MM-DD)
  guideResponse?: string; // respuesta_del_guía
  convertedToDepartureId?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * DÍA BLOQUEADO (DíaBloqueado)
 * Datos: fecha (date YYYY-MM-DD), motivo (reason opcional).
 */
export interface BlockedDay {
  date: string; // YYYY-MM-DD
  reason?: string; // motivo (opcional)
  createdAt: string;
}

/**
 * Alerta para el guía cuando se cancela una anotación confirmada y hay lista de espera
 */
export interface WaitlistPromotionAlert {
  id: string;
  departureId: string;
  departureDate: string;
  destination: string;
  cancelledEnrollmentName: string;
  freedSpots: number;
  nextWaitlistEnrollmentId: string;
  nextWaitlistName: string;
  nextWaitlistPhone: string;
  nextWaitlistCount: number;
  createdAt: string;
  resolved?: boolean;
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
  // Campos sincronizados con el nuevo modelo unificado
  preferredSchedule?: PreferredScheduleType;
  preferredRiver?: string;
  enrollmentStatus?: EnrollmentStatus;
  customRequestStatus?: CustomRequestStatus;
  alternativeDate?: string;
  guideResponse?: string;
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
  smtpPasswordConfigured?: boolean;
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
  enrollments: DepartureEnrollment[];
  customRequests: CustomTripRequest[];
  blockedDays: BlockedDay[];
  waitlistAlerts: WaitlistPromotionAlert[];
  reviews: ReviewItem[];
  gallery: GalleryImageItem[];
  emailLogs?: EmailLogItem[];
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
