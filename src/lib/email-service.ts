import nodemailer from "nodemailer";
import {
  BookingInquiry,
  CalendarDeparture,
  CustomTripRequest,
  DepartureEnrollment,
  PaymentConfig,
  RegretRequestItem,
  SiteSettings,
} from "@/types/traum";

async function dispatchHtmlEmail({
  toEmail,
  replyTo,
  subject,
  htmlBody,
  flatFields,
  settings,
}: {
  toEmail: string;
  replyTo?: string;
  subject: string;
  htmlBody: string;
  flatFields: Record<string, string | number>;
  settings: SiteSettings;
}): Promise<{ sent: boolean; channel: string }> {
  const smtpUser =
    settings.smtpUser || process.env.SMTP_USER || "traumflyfishing9@gmail.com";
  const smtpPass =
    settings.smtpAppPassword || process.env.SMTP_APP_PASSWORD || "";
  const resendKey = settings.resendApiKey || process.env.RESEND_API_KEY || "";
  const web3FormsKey =
    settings.web3FormsAccessKey ||
    process.env.WEB3FORMS_ACCESS_KEY ||
    "fa183ece-13f6-4360-8085-ff84ba3ea870";

  // 1. Try Gmail SMTP if App Password is provided
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"TRAUM Fly Cast Patagonia" <${smtpUser}>`,
        to: toEmail,
        replyTo: replyTo || smtpUser,
        subject,
        html: htmlBody,
      });

      if (replyTo && replyTo.includes("@") && replyTo !== toEmail) {
        await transporter
          .sendMail({
            from: `"TRAUM Fly Cast Patagonia" <${smtpUser}>`,
            to: replyTo,
            subject,
            html: htmlBody,
          })
          .catch(() => {});
      }

      return { sent: true, channel: "smtp" };
    } catch (err) {
      console.warn("SMTP send warning:", err);
    }
  }

  // 2. Try Resend API if key is configured
  if (resendKey) {
    try {
      const recipients = [toEmail];
      if (replyTo && replyTo.includes("@") && replyTo !== toEmail) {
        recipients.push(replyTo);
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TRAUM Reservas <onboarding@resend.dev>",
          to: recipients,
          reply_to: replyTo || toEmail,
          subject,
          html: htmlBody,
        }),
      });
      if (res.ok) {
        return { sent: true, channel: "resend" };
      }
    } catch (err) {
      console.warn("Resend send warning:", err);
    }
  }

  // 3. Try Web3Forms API if key is configured
  if (web3FormsKey) {
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Origin: "https://traumflycast.vercel.app",
          Referer: "https://traumflycast.vercel.app/",
        },
        body: JSON.stringify({
          access_key: web3FormsKey,
          subject,
          from_name: "TRAUM Fly Cast Patagonia",
          email: replyTo || toEmail,
          replyto: replyTo || toEmail,
          ...flatFields,
        }),
      });
      if (res.ok) {
        return { sent: true, channel: "web3forms" };
      }
    } catch (err) {
      console.warn("Web3Forms server relay warning:", err);
    }
  }

  return { sent: false, channel: "stored_in_db" };
}

/**
 * Genera el link directo de WhatsApp listo para enviar mensaje.
 */
export function buildWhatsAppLink(phone: string, message: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  const formattedPhone = digits.startsWith("54") ? digits : `549${digits}`;
  return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Notificación al cliente y al guía cuando se registra una anotación (confirmada o en lista de espera)
 */
export async function sendEnrollmentNotificationEmail(
  enrollment: DepartureEnrollment,
  departure: CalendarDeparture,
  settings: SiteSettings
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const isWaitlist = enrollment.status === "lista_espera";
  const statusLabel = isWaitlist
    ? "EN LISTA DE ESPERA"
    : "ANOTACIÓN CONFIRMADA";

  const subject = `[TRAUM ${statusLabel} ${enrollment.bookingCode}] ${enrollment.fullName} — ${departure.destination} (${departure.date})`;

  const scheduleText = departure.endTime
    ? `${departure.startTime} a ${departure.endTime} hs`
    : `${departure.startTime} hs`;

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #D8CEB9; background: #F2EFE6; color: #292D29;">
      <div style="background: #263D32; color: #F2EFE6; padding: 24px 28px; border-bottom: 2px solid #D8CEB9;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #D8CEB9;">TRAUM · FLY CAST PATAGONIA</p>
        <h2 style="margin: 6px 0 0; font-weight: normal; font-size: 24px;">${statusLabel} (${enrollment.bookingCode})</h2>
      </div>
      <div style="padding: 26px 28px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hola <strong>${enrollment.fullName}</strong>, registramos tu anotación para la salida programada:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #ffffff; border: 1px solid #D8CEB9;">
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Código:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${enrollment.bookingCode}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Estado:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${statusLabel}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha y Horario:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${departure.date} (${scheduleText})</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Río / Destino:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${departure.destination}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Tipo de Pesca:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${departure.experienceType}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Personas anotadas:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${enrollment.participantsCount}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Teléfono / WhatsApp:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${enrollment.whatsapp}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${enrollment.email}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: bold;">Comentarios:</td><td style="padding: 10px 14px;">${enrollment.comments || "Sin comentarios"}</td></tr>
        </table>
      </div>
    </div>
  `;

  return dispatchHtmlEmail({
    toEmail: targetEmail,
    replyTo: enrollment.email,
    subject,
    htmlBody,
    flatFields: {
      Tipo_Evento: statusLabel,
      Codigo: enrollment.bookingCode,
      Fecha_Salida: departure.date,
      Horario: scheduleText,
      Rio_Destino: departure.destination,
      Tipo_Pesca: departure.experienceType,
      Cliente: enrollment.fullName,
      Telefono_WhatsApp: enrollment.whatsapp,
      Email: enrollment.email,
      Cantidad_Personas: enrollment.participantsCount,
      Comentarios: enrollment.comments || "Sin comentarios",
    },
    settings,
  });
}

/**
 * Notificación al cliente y al guía cuando se envía una Solicitud de salida a pedido (sin seña ni pago)
 */
export async function sendCustomRequestNotificationEmail(
  customReq: CustomTripRequest,
  settings: SiteSettings
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const subject = `[TRAUM Solicitud a Pedido ${customReq.requestCode}] ${customReq.fullName} — Fecha: ${customReq.desiredDate} (${customReq.preferredSchedule})`;

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #D8CEB9; background: #F2EFE6; color: #292D29;">
      <div style="background: #263D32; color: #F2EFE6; padding: 24px 28px; border-bottom: 2px solid #D8CEB9;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #D8CEB9;">TRAUM · FLY CAST PATAGONIA</p>
        <h2 style="margin: 6px 0 0; font-weight: normal; font-size: 24px;">Solicitud de Salida a Pedido Recibida (${customReq.requestCode})</h2>
      </div>
      <div style="padding: 26px 28px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Hola <strong>${customReq.fullName}</strong>, recibimos tu solicitud de salida personalizada. <strong>El guía te va a contactar para coordinar. No se requiere seña ni pago por este medio.</strong></p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #ffffff; border: 1px solid #D8CEB9;">
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Código de Solicitud:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.requestCode}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha Solicitada:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.desiredDate}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Horario Preferido:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.preferredSchedule}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Río Preferido:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.preferredRiver || "A coordinar con el guía"}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Tipo de Pesca:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.experienceType || "A coordinar con el guía"}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Cantidad de Personas:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.participantsCount}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Teléfono / WhatsApp:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.whatsapp}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${customReq.email}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: bold;">Mensaje:</td><td style="padding: 10px 14px;">${customReq.comments || "Sin mensaje adicional"}</td></tr>
        </table>
      </div>
    </div>
  `;

  return dispatchHtmlEmail({
    toEmail: targetEmail,
    replyTo: customReq.email,
    subject,
    htmlBody,
    flatFields: {
      Tipo_Evento: "SOLICITUD DE SALIDA A PEDIDO (SIN SEÑA)",
      Codigo_Solicitud: customReq.requestCode,
      Fecha_Solicitada: customReq.desiredDate,
      Horario_Preferido: customReq.preferredSchedule,
      Rio_Preferido: customReq.preferredRiver || "Opcional / A definir",
      Tipo_Pesca_Preferido: customReq.experienceType || "Opcional / A definir",
      Cantidad_Personas: customReq.participantsCount,
      Cliente: customReq.fullName,
      Telefono_WhatsApp: customReq.whatsapp,
      Email: customReq.email,
      Mensaje: customReq.comments || "Sin mensaje",
    },
    settings,
  });
}

/**
 * Notificación al cliente cuando el guía responde su solicitud (aceptada, rechazada o reprogramada)
 */
export async function sendGuideResponseToRequestEmail(
  customReq: CustomTripRequest,
  settings: SiteSettings
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const statusText =
    customReq.status === "aceptada"
      ? "ACEPTADA"
      : customReq.status === "reprogramada"
      ? `REPROGRAMADA (Nueva fecha propuesta: ${customReq.alternativeDate || "a coordinar"})`
      : customReq.status === "rechazada"
      ? "NO DISPONIBLE EN ESA FECHA"
      : "ACTUALIZADA";

  const subject = `[TRAUM Respuesta a tu Solicitud ${customReq.requestCode}] Estado: ${statusText}`;

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #D8CEB9; background: #F2EFE6; color: #292D29;">
      <div style="background: #263D32; color: #F2EFE6; padding: 24px 28px; border-bottom: 2px solid #D8CEB9;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #D8CEB9;">TRAUM · FLY CAST PATAGONIA</p>
        <h2 style="margin: 6px 0 0; font-weight: normal; font-size: 24px;">Respuesta del Guía a tu Solicitud (${customReq.requestCode})</h2>
      </div>
      <div style="padding: 26px 28px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <p>Hola <strong>${customReq.fullName}</strong>,</p>
        <p>El guía revisó tu solicitud para el día <strong>${customReq.desiredDate}</strong> (${customReq.preferredSchedule}).</p>
        <p><strong>Estado:</strong> ${statusText}</p>
        ${
          customReq.alternativeDate
            ? `<p><strong>Fecha alternativa propuesta:</strong> ${customReq.alternativeDate}</p>`
            : ""
        }
        ${
          customReq.guideResponse
            ? `<div style="padding: 14px; background: #fff; border-left: 3px solid #263D32; margin: 16px 0;"><strong>Mensaje del guía:</strong><br/>${customReq.guideResponse}</div>`
            : ""
        }
      </div>
    </div>
  `;

  return dispatchHtmlEmail({
    toEmail: targetEmail,
    replyTo: customReq.email,
    subject,
    htmlBody,
    flatFields: {
      Tipo_Evento: "RESPUESTA DEL GUÍA A SOLICITUD",
      Codigo_Solicitud: customReq.requestCode,
      Estado: statusText,
      Cliente: customReq.fullName,
      Email_Cliente: customReq.email,
      Fecha_Solicitada: customReq.desiredDate,
      Fecha_Alternativa: customReq.alternativeDate || "No aplica",
      Respuesta_Guia: customReq.guideResponse || "Sin nota adicional",
    },
    settings,
  });
}

/**
 * Notificación cuando el guía cancela una salida programada a todos los anotados
 */
export async function sendDepartureCancelledNotifications(
  departure: CalendarDeparture,
  enrolledClients: DepartureEnrollment[],
  reason: string,
  settings: SiteSettings
): Promise<{ notifiedCount: number; recipients: string[] }> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const recipients = enrolledClients.map((e) => e.email).filter(Boolean);

  for (const client of enrolledClients) {
    const subject = `[TRAUM Aviso de Cancelación de Salida] ${departure.destination} (${departure.date})`;
    const htmlBody = `
      <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #D8CEB9; background: #F2EFE6; color: #292D29;">
        <div style="background: #B35B2B; color: #F2EFE6; padding: 24px 28px;">
          <p style="margin: 0; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase;">TRAUM · FLY CAST PATAGONIA</p>
          <h2 style="margin: 6px 0 0; font-weight: normal; font-size: 24px;">Aviso de Cancelación de Salida Programada</h2>
        </div>
        <div style="padding: 26px 28px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
          <p>Hola <strong>${client.fullName}</strong> (${client.bookingCode}),</p>
          <p>Te informamos que la salida programada para el día <strong>${departure.date}</strong> en <strong>${departure.destination}</strong> (${departure.experienceType}) fue cancelada por el guía.</p>
          ${reason ? `<p><strong>Motivo / Nota del guía:</strong> ${reason}</p>` : ""}
          <p>Nos pondremos en contacto con vos para reprogramar o coordinar una nueva fecha.</p>
        </div>
      </div>
    `;

    await dispatchHtmlEmail({
      toEmail: targetEmail,
      replyTo: client.email,
      subject,
      htmlBody,
      flatFields: {
        Tipo_Evento: "SALIDA CANCELADA POR EL GUÍA",
        Fecha_Salida: departure.date,
        Rio_Destino: departure.destination,
        Cliente_Notificado: client.fullName,
        Email_Cliente: client.email,
        Telefono_Cliente: client.whatsapp,
        Motivo: reason || "Cancelación operativa / climática",
      },
      settings,
    }).catch(() => {});
  }

  return {
    notifiedCount: enrolledClients.length,
    recipients,
  };
}

export async function sendBookingNotificationEmail(
  inquiry: BookingInquiry,
  settings: SiteSettings,
  paymentConfig: PaymentConfig
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const subject = `[TRAUM Reserva / Solicitud ${inquiry.bookingCode}] ${inquiry.fullName} — ${
    inquiry.selectedServiceTitle || inquiry.experienceType
  } (${inquiry.desiredDate})`;

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #D8CEB9; background: #F2EFE6; color: #292D29;">
      <div style="background: #263D32; color: #F2EFE6; padding: 24px 28px; border-bottom: 2px solid #D8CEB9;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #D8CEB9;">TRAUM · FLY CAST PATAGONIA</p>
        <h2 style="margin: 6px 0 0; font-weight: normal; font-size: 26px;">Nueva Solicitud (${inquiry.bookingCode})</h2>
      </div>
      <div style="padding: 26px 28px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Detalle del registro:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #ffffff; border: 1px solid #D8CEB9;">
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Código:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.bookingCode}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Cliente:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.fullName}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.email}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">WhatsApp:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.whatsapp}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.desiredDate}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Modalidad:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.experienceType} (${inquiry.participantsCount} pers.)</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: bold;">Comentarios:</td><td style="padding: 10px 14px;">${inquiry.comments || "Sin comentarios"}</td></tr>
        </table>
      </div>
    </div>
  `;

  void paymentConfig;
  return dispatchHtmlEmail({
    toEmail: targetEmail,
    replyTo: inquiry.email,
    subject,
    htmlBody,
    flatFields: {
      Codigo_Reserva: inquiry.bookingCode,
      Cliente: inquiry.fullName,
      Email_Cliente: inquiry.email,
      WhatsApp: inquiry.whatsapp,
      Fecha_Solicitada: inquiry.desiredDate,
      Experiencia: inquiry.experienceType,
      Participantes: inquiry.participantsCount,
      Comentarios: inquiry.comments || "Sin comentarios",
    },
    settings,
  });
}

export async function sendRegretNotificationEmail(
  regret: RegretRequestItem,
  settings: SiteSettings
): Promise<void> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  try {
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: "https://traumflycast.vercel.app",
        Referer: "https://traumflycast.vercel.app/arrepentimiento",
      },
      body: JSON.stringify({
        _subject: `[TRAUM Botón de Arrepentimiento ${regret.regretCode}] Solicitud de ${regret.fullName}`,
        _template: "table",
        _captcha: "false",
        Codigo_Gestion: regret.regretCode,
        Cliente: regret.fullName,
        Email: regret.email,
        WhatsApp: regret.whatsapp,
        Codigo_Reserva: regret.bookingCode || "No especificado",
        Servicio: regret.serviceContracted,
        Motivo: regret.reason,
        Fecha: regret.createdAt,
      }),
    });
  } catch {
    // Saved in Neon DB regardless
  }
}
