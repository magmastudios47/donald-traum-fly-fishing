import nodemailer from "nodemailer";
import { BookingInquiry, PaymentConfig, RegretRequestItem, SiteSettings } from "@/types/traum";

export async function sendBookingNotificationEmail(
  inquiry: BookingInquiry,
  settings: SiteSettings,
  paymentConfig: PaymentConfig
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const smtpUser =
    settings.smtpUser || process.env.SMTP_USER || "traumflyfishing9@gmail.com";
  const smtpPass =
    settings.smtpAppPassword || process.env.SMTP_APP_PASSWORD || "";
  const resendKey = settings.resendApiKey || process.env.RESEND_API_KEY || "";
  const web3FormsKey =
    settings.web3FormsAccessKey ||
    process.env.WEB3FORMS_ACCESS_KEY ||
    "fa183ece-13f6-4360-8085-ff84ba3ea870";

  const isScheduledWithDeposit = Boolean(inquiry.requiresDeposit && inquiry.departureId);
  const subjectPrefix = isScheduledWithDeposit
    ? `[TRAUM Salida Programada ${inquiry.bookingCode}]`
    : `[TRAUM Solicitud de Fecha ${inquiry.bookingCode}]`;

  const subject = `${subjectPrefix} ${inquiry.fullName} — ${
    inquiry.selectedServiceTitle || inquiry.experienceType
  } (${inquiry.desiredDate})`;

  const depositInfoHtml = isScheduledWithDeposit
    ? `${paymentConfig.depositPercentage}% (Salida precargada · Alias informado: ${paymentConfig.bankAlias})`
    : `Sin seña previa (Solicitud de fecha libre sujeta a confirmación de disponibilidad)`;

  const htmlBody = `
    <div style="font-family: Georgia, serif; max-width: 640px; margin: 0 auto; border: 1px solid #D8CEB9; background: #F2EFE6; color: #292D29;">
      <div style="background: #263D32; color: #F2EFE6; padding: 24px 28px; border-bottom: 2px solid #D8CEB9;">
        <p style="margin: 0; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color: #D8CEB9;">TRAUM · FLY CAST PATAGONIA</p>
        <h2 style="margin: 6px 0 0; font-weight: normal; font-size: 26px;">Nuevo Pedido / Contratación de Servicio (${inquiry.bookingCode})</h2>
      </div>
      <div style="padding: 26px 28px; font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6;">
        <p style="margin-top: 0;">Se ha registrado una nueva contratación desde la página web oficial:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; background: #ffffff; border: 1px solid #D8CEB9;">
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold; width: 40%;">Código de Pedido:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.bookingCode}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Servicio Contratado:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.selectedServiceTitle || inquiry.experienceType}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Cliente:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.fullName}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Correo Electrónico:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.email} ${inquiry.googleEmail ? `(Verificado Google: ${inquiry.googleEmail})` : ""}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">WhatsApp:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.whatsapp}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Fecha Solicitada:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.desiredDate}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Modalidad y Grupo:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.experienceType} · ${inquiry.serviceGroupType} (${inquiry.participantsCount} pers.)</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Nivel de Pesca:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${inquiry.skillLevel}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Régimen de Seña:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">${depositInfoHtml}</td></tr>
          <tr><td style="padding: 10px 14px; border-bottom: 1px solid #eee; font-weight: bold;">Aceptación Legal:</td><td style="padding: 10px 14px; border-bottom: 1px solid #eee;">Aceptado (${inquiry.legalVersion}) el ${inquiry.legalAcceptedAt}</td></tr>
          <tr><td style="padding: 10px 14px; font-weight: bold;">Comentarios:</td><td style="padding: 10px 14px;">${inquiry.comments || "Sin comentarios adicionales"}</td></tr>
        </table>
      </div>
    </div>
  `;

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
        to: targetEmail,
        replyTo: inquiry.email,
        subject,
        html: htmlBody,
      });

      // Also send copy to client
      if (inquiry.email && inquiry.email.includes("@")) {
        await transporter
          .sendMail({
            from: `"TRAUM Fly Cast Patagonia" <${smtpUser}>`,
            to: inquiry.email,
            subject: `Confirmación de solicitud ${inquiry.bookingCode} — TRAUM Fly Cast Patagonia`,
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
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "TRAUM Reservas <onboarding@resend.dev>",
          to: [targetEmail],
          reply_to: inquiry.email,
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
          email: inquiry.email,
          replyto: inquiry.email,
          Codigo_Reserva: inquiry.bookingCode,
          Tipo_Solicitud: isScheduledWithDeposit
            ? "Contratación de Salida Programada (Con Seña)"
            : "Solicitud de Día Libre / Fecha a Medida (Sin Seña)",
          Servicio_o_Salida:
            inquiry.selectedServiceTitle || inquiry.experienceType,
          Cliente: inquiry.fullName,
          Email_Cliente: inquiry.email,
          Cuenta_Google: inquiry.googleEmail || "No vinculada",
          WhatsApp: inquiry.whatsapp,
          Fecha_Solicitada: inquiry.desiredDate,
          Experiencia: inquiry.experienceType,
          Modalidad_Grupo: inquiry.serviceGroupType,
          Participantes_Cupos: inquiry.participantsCount,
          Nivel_Pesca: inquiry.skillLevel,
          Condicion_Sena: isScheduledWithDeposit
            ? `Seña del ${paymentConfig.depositPercentage}% habilitada al cliente`
            : "Sin seña (sujeto a confirmar disponibilidad de fecha)",
          Aceptacion_Legal: `SI (${inquiry.legalVersion} - ${inquiry.legalAcceptedAt})`,
          Comentarios: inquiry.comments || "Sin comentarios adicionales",
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
