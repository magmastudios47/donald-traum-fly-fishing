import nodemailer from "nodemailer";
import {
  BookingInquiry,
  CalendarDeparture,
  CustomTripRequest,
  DepartureEnrollment,
  EmailLogItem,
  RegretRequestItem,
  SiteSettings,
} from "@/types/traum";

export interface EmailDeliveryResult {
  sent: boolean;
  guideSent: boolean;
  clientSent: boolean;
  channel: string;
  errorDetails?: string;
  logEntry: EmailLogItem;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

interface TraumTemplateRow {
  label: string;
  value: string;
  highlight?: boolean;
}

interface TraumEmailTemplateOptions {
  preheader: string;
  badgeText: string;
  badgeBg?: string;
  badgeColor?: string;
  title: string;
  subtitle?: string;
  greeting: string;
  introParagraphs: string[];
  rowsTitle: string;
  rows: TraumTemplateRow[];
  highlightBox?: {
    title: string;
    body: string;
    bgColor?: string;
    borderColor?: string;
    textColor?: string;
  };
  ctaButton?: {
    label: string;
    url: string;
    bgColor?: string;
  };
  secondaryNote?: string;
  settings: SiteSettings;
}

/**
 * Construye tanto la versión HTML responsiva (compatible con Gmail, Outlook y celulares,
 * basada en tablas con estilos inline y estética editorial TRAUM) como la versión de texto plano.
 */
export function buildTraumBrandedEmail(opts: TraumEmailTemplateOptions): {
  html: string;
  text: string;
} {
  const logoUrl = "https://traumflycast.vercel.app/logo-traum.png";
  const siteUrl = "https://traumflycast.vercel.app";
  const brandName = opts.settings.brandName || "TRAUM";
  const brandSubtitle = opts.settings.brandSubtitle || "Fly Cast Patagonia";
  const tagline =
    opts.settings.tagline || "Donde la pesca se hace realidad";
  const location =
    opts.settings.locationGeneral ||
    "Junín de los Andes · Provincia del Neuquén · Patagonia Argentina";
  const guideWhatsapp = opts.settings.whatsappNumber || "+54 9 2944 306651";
  const guideEmail =
    opts.settings.email ||
    opts.settings.notificationEmail ||
    "traumflyfishing9@gmail.com";
  const instagramHandle =
    opts.settings.instagramHandle || "@traum.fly.fishing";
  const instagramUrl =
    opts.settings.instagramUrl ||
    "https://www.instagram.com/traum.fly.fishing/";

  const badgeBg = opts.badgeBg || "#3A4E3C";
  const badgeColor = opts.badgeColor || "#F2EFE6";

  const rowsHtml = opts.rows
    .filter((r) => r.value && String(r.value).trim().length > 0)
    .map(
      (r, idx) => `
      <tr>
        <td style="padding: 11px 14px; border-bottom: 1px solid #E4DEC9; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #746657; text-transform: uppercase; letter-spacing: 0.08em; width: 38%; vertical-align: top; background-color: ${
          idx % 2 === 0 ? "#FAF8F3" : "#F2EFE6"
        };">
          ${escapeHtml(r.label)}
        </td>
        <td style="padding: 11px 14px; border-bottom: 1px solid #E4DEC9; font-family: ${
          r.highlight
            ? "Georgia, 'Times New Roman', serif"
            : "Arial, Helvetica, sans-serif"
        }; font-size: ${r.highlight ? "15px" : "14px"}; color: #263D32; font-weight: ${
        r.highlight ? "bold" : "normal"
      }; vertical-align: top; background-color: ${
        idx % 2 === 0 ? "#FAF8F3" : "#F2EFE6"
      };">
          ${escapeHtml(r.value)}
        </td>
      </tr>`
    )
    .join("");

  const paragraphsHtml = opts.introParagraphs
    .map(
      (p) =>
        `<p style="margin: 0 0 14px 0; font-family: Arial, Helvetica, sans-serif; font-size: 15px; line-height: 1.65; color: #292D29;">${escapeHtml(
          p
        )}</p>`
    )
    .join("");

  const highlightHtml = opts.highlightBox
    ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 22px 0;">
        <tr>
          <td style="padding: 18px 20px; background-color: ${
            opts.highlightBox.bgColor || "#ECE6D8"
          }; border-left: 4px solid ${
            opts.highlightBox.borderColor || "#263D32"
          };">
            <p style="margin: 0 0 6px 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.14em; color: ${
              opts.highlightBox.textColor || "#263D32"
            };">
              ${escapeHtml(opts.highlightBox.title)}
            </p>
            <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 15px; line-height: 1.6; color: ${
              opts.highlightBox.textColor || "#292D29"
            };">
              ${escapeHtml(opts.highlightBox.body)}
            </p>
          </td>
        </tr>
      </table>`
    : "";

  const ctaHtml =
    opts.ctaButton && opts.ctaButton.url
      ? `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 28px 0 18px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td align="center" bgcolor="${
                  opts.ctaButton.bgColor || "#263D32"
                }" style="background-color: ${
          opts.ctaButton.bgColor || "#263D32"
        }; border-radius: 2px;">
                  <a href="${
                    opts.ctaButton.url
                  }" target="_blank" style="display: inline-block; padding: 15px 30px; font-family: Arial, Helvetica, sans-serif; font-size: 12px; font-weight: bold; color: #F2EFE6; text-decoration: none; text-transform: uppercase; letter-spacing: 0.18em;">
                    ${escapeHtml(opts.ctaButton.label)}
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`
      : "";

  const secondaryNoteHtml = opts.secondaryNote
    ? `<p style="margin: 18px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; line-height: 1.6; color: #746657; text-align: center;">${escapeHtml(
        opts.secondaryNote
      )}</p>`
    : "";

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(opts.title)} — ${escapeHtml(brandName)}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #E7E1D3; font-family: Arial, Helvetica, sans-serif; -webkit-font-smoothing: antialiased;">
  <!-- Preheader oculto -->
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
    ${escapeHtml(opts.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #E7E1D3; padding: 24px 10px;">
    <tr>
      <td align="center">
        <!-- Contenedor principal max 600px -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #F2EFE6; border: 1px solid #D8CEB9;">
          
          <!-- Encabezado Editorial TRAUM -->
          <tr>
            <td align="center" style="background-color: #263D32; padding: 30px 24px 26px 24px; border-bottom: 3px solid #746657;">
              <img src="${logoUrl}" alt="${escapeHtml(
    brandName
  )}" width="68" height="68" style="display: block; width: 68px; height: 68px; border-radius: 50%; border: 2px solid #D8CEB9; margin: 0 auto 12px auto; object-fit: cover;" />
              <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; letter-spacing: 0.22em; color: #F2EFE6; text-transform: uppercase;">
                ${escapeHtml(brandName)}
              </p>
              <p style="margin: 4px 0 0 0; font-family: Arial, Helvetica, sans-serif; font-size: 10px; letter-spacing: 0.28em; color: #D8CEB9; text-transform: uppercase;">
                ${escapeHtml(brandSubtitle)}
              </p>
              <p style="margin: 10px 0 0 0; font-family: Georgia, 'Times New Roman', serif; font-style: italic; font-size: 13px; color: #E4DEC9;">
                &ldquo;${escapeHtml(tagline)}&rdquo;
              </p>
            </td>
          </tr>

          <!-- Cuerpo del mensaje -->
          <tr>
            <td style="padding: 32px 26px 28px 26px; background-color: #F2EFE6;">
              <!-- Etiqueta superior -->
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="background-color: ${badgeBg}; color: ${badgeColor}; font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.16em; padding: 5px 12px;">
                    ${escapeHtml(opts.badgeText)}
                  </td>
                </tr>
              </table>

              <!-- Título principal en serif -->
              <h1 style="margin: 0 0 8px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 24px; font-weight: normal; line-height: 1.3; color: #263D32;">
                ${escapeHtml(opts.title)}
              </h1>
              ${
                opts.subtitle
                  ? `<p style="margin: 0 0 20px 0; font-family: Arial, Helvetica, sans-serif; font-size: 13px; color: #746657;">${escapeHtml(
                      opts.subtitle
                    )}</p>`
                  : `<div style="height: 14px;"></div>`
              }

              <!-- Saludo e introducción -->
              <p style="margin: 0 0 12px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #263D32;">
                ${escapeHtml(opts.greeting)}
              </p>
              ${paragraphsHtml}

              ${highlightHtml}

              <!-- Tabla ordenada de datos -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 22px 0; border: 1px solid #D8CEB9; background-color: #FAF8F3;">
                <tr>
                  <td colspan="2" style="background-color: #263D32; color: #F2EFE6; padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em;">
                    ${escapeHtml(opts.rowsTitle)}
                  </td>
                </tr>
                ${rowsHtml}
              </table>

              <!-- Botón principal de acción -->
              ${ctaHtml}

              ${secondaryNoteHtml}
            </td>
          </tr>

          <!-- Pie con datos de contacto y ubicación -->
          <tr>
            <td style="background-color: #263D32; padding: 24px 24px; text-align: center; color: #D8CEB9;">
              <p style="margin: 0 0 6px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; color: #F2EFE6; letter-spacing: 0.1em; text-transform: uppercase;">
                ${escapeHtml(brandName)} · ${escapeHtml(brandSubtitle)}
              </p>
              <p style="margin: 0 0 12px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #D8CEB9;">
                ${escapeHtml(location)}
              </p>
              <p style="margin: 0 0 8px 0; font-family: Arial, Helvetica, sans-serif; font-size: 12px; color: #E4DEC9;">
                WhatsApp: <a href="https://wa.me/${guideWhatsapp.replace(
                  /\D/g,
                  ""
                )}" style="color: #F2EFE6; text-decoration: underline;">${escapeHtml(
    guideWhatsapp
  )}</a>
                &nbsp;|&nbsp;
                Email: <a href="mailto:${escapeHtml(
                  guideEmail
                )}" style="color: #F2EFE6; text-decoration: underline;">${escapeHtml(
    guideEmail
  )}</a>
              </p>
              <p style="margin: 0; font-family: Arial, Helvetica, sans-serif; font-size: 11px; color: #B8AE99;">
                Instagram: <a href="${instagramUrl}" style="color: #D8CEB9; text-decoration: underline;">${escapeHtml(
    instagramHandle
  )}</a>
                &nbsp;·&nbsp;
                <a href="${siteUrl}" style="color: #D8CEB9; text-decoration: underline;">traumflycast.vercel.app</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  // Versión de texto plano (fallback obligatorio)
  const textLines: string[] = [
    `${brandName} | ${brandSubtitle.toUpperCase()}`,
    `"${tagline}"`,
    "============================================================",
    "",
    `[${opts.badgeText.toUpperCase()}]`,
    opts.title,
    opts.subtitle ? opts.subtitle : "",
    "",
    opts.greeting,
    "",
    ...opts.introParagraphs,
    "",
  ];

  if (opts.highlightBox) {
    textLines.push(
      `--- ${opts.highlightBox.title.toUpperCase()} ---`,
      opts.highlightBox.body,
      ""
    );
  }

  textLines.push(`--- ${opts.rowsTitle.toUpperCase()} ---`);
  for (const r of opts.rows) {
    if (r.value && String(r.value).trim().length > 0) {
      textLines.push(`• ${r.label}: ${r.value}`);
    }
  }
  textLines.push("");

  if (opts.ctaButton && opts.ctaButton.url) {
    textLines.push(`${opts.ctaButton.label}: ${opts.ctaButton.url}`, "");
  }

  if (opts.secondaryNote) {
    textLines.push(opts.secondaryNote, "");
  }

  textLines.push(
    "------------------------------------------------------------",
    `${brandName} · ${brandSubtitle}`,
    location,
    `WhatsApp: ${guideWhatsapp}`,
    `Email: ${guideEmail}`,
    `Instagram: ${instagramHandle}`,
    `Web: ${siteUrl}`
  );

  return {
    html,
    text: textLines.filter((line, i, arr) => !(line === "" && arr[i - 1] === "")).join("\n"),
  };
}

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface SingleSendResult {
  sent: boolean;
  channel: string;
  error?: string;
}

/**
 * Envía un correo individual probando en orden:
 * 1. Gmail SMTP (nodemailer) si hay contraseña de aplicación configurada en settings o variables de entorno.
 * 2. Resend API si hay API Key en settings o variables de entorno.
 * 3. FormSubmit / Web3Forms como relay si el destinatario es el correo del guía.
 */
async function dispatchSingleEmail(params: {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  plainSummary: Record<string, string>;
  settings: SiteSettings;
  isGuideCopy?: boolean;
}): Promise<SingleSendResult> {
  const {
    to,
    replyTo,
    subject,
    html,
    text,
    plainSummary,
    settings,
    isGuideCopy,
  } = params;

  const errors: string[] = [];

  const smtpUser =
    settings.smtpUser?.trim() ||
    process.env.SMTP_USER?.trim() ||
    settings.notificationEmail?.trim() ||
    "traumflyfishing9@gmail.com";

  const smtpPass = (
    settings.smtpAppPassword ||
    process.env.SMTP_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  )
    .replace(/\s+/g, "")
    .trim();

  const resendKey = (
    settings.resendApiKey ||
    process.env.RESEND_API_KEY ||
    ""
  ).trim();

  // 1. GMAIL SMTP (soporta enviar tanto al guía como al cliente con HTML + Texto Plano)
  if (smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"TRAUM Fly Cast Patagonia" <${smtpUser}>`,
        to,
        replyTo: replyTo || smtpUser,
        subject,
        text,
        html,
      });

      return { sent: true, channel: "gmail_smtp" };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn("Error en Gmail SMTP:", msg);
      errors.push(`Gmail SMTP: ${msg}`);
    }
  }

  // 2. RESEND API
  if (resendKey) {
    try {
      const fromAddress =
        process.env.RESEND_FROM_EMAIL ||
        "TRAUM Fly Cast Patagonia <onboarding@resend.dev>";
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [to],
          reply_to: replyTo || settings.email || "traumflyfishing9@gmail.com",
          subject,
          html,
          text,
        }),
      });
      if (res.ok) {
        return { sent: true, channel: "resend" };
      } else {
        const bodyText = await res.text().catch(() => "");
        // Si la cuenta Resend usa onboarding@resend.dev sin dominio propio verificado,
        // Resend devuelve 403 indicando el correo verificado de la cuenta (ej. azpilicuetaruben@gmail.com).
        // Redirigimos automáticamente la copia a ese correo verificado para que siempre llegue el aviso.
        const matchOwner = bodyText.match(/\(([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})\)/);
        const fallbackOwnerEmail = matchOwner ? matchOwner[1] : "azpilicuetaruben@gmail.com";
        if (
          res.status === 403 &&
          fallbackOwnerEmail &&
          to.toLowerCase() !== fallbackOwnerEmail.toLowerCase()
        ) {
          const retryRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: fromAddress,
              to: [fallbackOwnerEmail],
              reply_to: replyTo || to,
              subject: `${subject} [Destinatario: ${to}]`,
              html,
              text,
            }),
          });
          if (retryRes.ok) {
            return {
              sent: true,
              channel: "resend",
              error: `Entregado vía Resend en ${fallbackOwnerEmail} (para enviar directo a correos de terceros sin dominio propio, cargá la Contraseña de Aplicación de Gmail en Ajustes > Correo).`,
            };
          }
        }
        errors.push(`Resend (${res.status}): ${bodyText.slice(0, 140)}`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Resend: ${msg}`);
    }
  }

  // 3. RELAY PARA EL CORREO DEL GUÍA (Web3Forms / FormSubmit) si aún no se configuró SMTP
  if (isGuideCopy) {
    const accessKey =
      settings.web3FormsAccessKey ||
      process.env.WEB3FORMS_ACCESS_KEY ||
      "fa183ece-13f6-4360-8085-ff84ba3ea870";

    if (accessKey) {
      try {
        const res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Origin: "https://traumflycast.vercel.app",
            Referer: "https://traumflycast.vercel.app/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          },
          body: JSON.stringify({
            access_key: accessKey,
            subject,
            from_name: "TRAUM Fly Cast Patagonia",
            replyto: replyTo || to,
            ...plainSummary,
          }),
        });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          if (data.success) {
            return { sent: true, channel: "web3forms" };
          }
          errors.push(
            `Web3Forms: ${data.message || "Rechazado por el servidor"}`
          );
        } else {
          errors.push(
            `Web3Forms bloqueó la petición desde el servidor (HTTP ${res.status})`
          );
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Web3Forms: ${msg}`);
      }
    }
  }

  return {
    sent: false,
    channel: "pendiente_credenciales_smtp",
    error: errors.join(" | "),
  };
}

/**
 * 1. NOTIFICACIÓN DE SALIDA A PEDIDO (Guía + Confirmación al Cliente)
 */
export async function sendCustomRequestNotificationEmail(
  customReq: CustomTripRequest,
  settings: SiteSettings
): Promise<EmailDeliveryResult> {
  const guideEmail =
    settings.notificationEmail || settings.email || "traumflyfishing9@gmail.com";
  const clientEmail = (customReq.email || "").trim();

  const waToClient = buildWhatsAppLink(
    customReq.whatsapp,
    `Hola ${customReq.fullName}, soy el guía de TRAUM Fly Cast Patagonia. Recibí tu solicitud de salida a pedido (${customReq.requestCode}) para el ${customReq.desiredDate} (${customReq.preferredSchedule}). Te escribo para que coordinemos la salida.`
  );

  const waToGuide = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    `Hola TRAUM! Envié la solicitud de salida a pedido ${customReq.requestCode} para el día ${customReq.desiredDate} (${customReq.preferredSchedule}) a nombre de ${customReq.fullName}.`
  );

  const commonRows: TraumTemplateRow[] = [
    { label: "Código de solicitud", value: customReq.requestCode, highlight: true },
    { label: "Fecha solicitada", value: customReq.desiredDate, highlight: true },
    { label: "Horario preferido", value: customReq.preferredSchedule },
    {
      label: "Río / Lago preferido",
      value: customReq.preferredRiver || "A sugerencia del guía",
    },
    {
      label: "Modalidad preferida",
      value: customReq.experienceType || "A definir con el guía",
    },
    {
      label: "Cantidad de pescadores",
      value: `${customReq.participantsCount} persona(s)`,
    },
    { label: "Nombre del pescador", value: customReq.fullName },
    { label: "Teléfono / WhatsApp", value: customReq.whatsapp },
    { label: "Correo electrónico", value: clientEmail },
    {
      label: "Mensaje / Notas",
      value: customReq.comments || "Sin comentarios adicionales",
    },
  ];

  // A) Correo para el Guía
  const guideSubject = `Nueva Solicitud de Salida a Pedido ${customReq.requestCode} — ${customReq.fullName} (${customReq.desiredDate})`;
  const guideBuilt = buildTraumBrandedEmail({
    preheader: `Nueva solicitud de salida a pedido de ${customReq.fullName} para el ${customReq.desiredDate}.`,
    badgeText: "Solicitud de Salida a Pedido",
    badgeBg: "#8B5E2B",
    title: `Nueva solicitud para el ${customReq.desiredDate}`,
    subtitle: `Recibida desde el calendario web · Código ${customReq.requestCode}`,
    greeting: "Hola equipo de TRAUM,",
    introParagraphs: [
      `${customReq.fullName} solicitó armar una salida personalizada en una fecha libre del calendario.`,
      "Podés aceptar la solicitud, proponer otra fecha o convertirla en una salida programada con un clic desde el Panel del Guía, o responderle directamente por WhatsApp.",
    ],
    rowsTitle: "Datos de la solicitud",
    rows: commonRows,
    ctaButton: waToClient
      ? {
          label: "Responder al cliente por WhatsApp",
          url: waToClient,
          bgColor: "#263D32",
        }
      : undefined,
    secondaryNote:
      "Recordá que las salidas a pedido se coordinan directamente con el pescador, sin cobro de seña en la web.",
    settings,
  });

  const guideRes = await dispatchSingleEmail({
    to: guideEmail,
    replyTo: clientEmail || guideEmail,
    subject: guideSubject,
    html: guideBuilt.html,
    text: guideBuilt.text,
    plainSummary: {
      Tipo: "Solicitud de Salida a Pedido",
      Codigo: customReq.requestCode,
      Fecha_Solicitada: customReq.desiredDate,
      Horario_Preferido: customReq.preferredSchedule,
      Rio_Preferido: customReq.preferredRiver || "A sugerencia del guía",
      Tipo_Pesca: customReq.experienceType || "A definir",
      Pescadores: `${customReq.participantsCount} persona(s)`,
      Cliente: customReq.fullName,
      WhatsApp: customReq.whatsapp,
      Email: clientEmail,
      Mensaje: customReq.comments || "-",
    },
    settings,
    isGuideCopy: true,
  });

  // B) Correo de confirmación para el Cliente
  let clientRes: SingleSendResult = { sent: false, channel: "skipped" };
  if (clientEmail && clientEmail.includes("@")) {
    const clientSubject = `Recibimos tu solicitud de salida (${customReq.requestCode}) — TRAUM Fly Cast Patagonia`;
    const clientBuilt = buildTraumBrandedEmail({
      preheader: `Recibimos tu solicitud para el ${customReq.desiredDate}. El guía te va a contactar a la brevedad.`,
      badgeText: "Solicitud Recibida",
      badgeBg: "#263D32",
      title: "Recibimos tu solicitud de pesca",
      subtitle: `Código de seguimiento: ${customReq.requestCode}`,
      greeting: `Hola ${customReq.fullName},`,
      introParagraphs: [
        `Gracias por escribirnos. Registramos tu pedido para salir a pescar el día ${customReq.desiredDate} (${customReq.preferredSchedule}).`,
        "Nuestro guía va a revisar la disponibilidad del río y las condiciones del agua para esa fecha y se va a comunicar con vos por WhatsApp o correo para coordinar todos los detalles.",
      ],
      highlightBox: {
        title: "Trato directo con el guía",
        body: "Esta solicitud no requiere pago ni seña por adelantado en la web. Coordinamos el itinerario y los detalles directamente con vos.",
        bgColor: "#ECE6D8",
        borderColor: "#263D32",
        textColor: "#263D32",
      },
      rowsTitle: "Resumen de tu solicitud",
      rows: commonRows,
      ctaButton: waToGuide
        ? {
            label: "Hablar con el guía por WhatsApp",
            url: waToGuide,
            bgColor: "#263D32",
          }
        : undefined,
      secondaryNote:
        "Si necesitás modificar la fecha o agregar algún comentario, podés responder directamente a este correo o escribirnos por WhatsApp.",
      settings,
    });

    clientRes = await dispatchSingleEmail({
      to: clientEmail,
      replyTo: guideEmail,
      subject: clientSubject,
      html: clientBuilt.html,
      text: clientBuilt.text,
      plainSummary: {
        Codigo: customReq.requestCode,
        Fecha: customReq.desiredDate,
        Cliente: customReq.fullName,
      },
      settings,
      isGuideCopy: false,
    });
  }

  const combinedErrors = [guideRes.error, clientRes.error]
    .filter(Boolean)
    .join(" || ");

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "solicitud_recibida",
    subject: guideSubject,
    recipientGuide: guideEmail,
    recipientClient: clientEmail,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: guideRes.sent
      ? guideRes.channel
      : clientRes.sent
      ? clientRes.channel
      : guideRes.channel,
    errorDetails:
      !guideRes.sent || !clientRes.sent ? combinedErrors || undefined : undefined,
  };

  return {
    sent: guideRes.sent || clientRes.sent,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: logEntry.channel,
    errorDetails: logEntry.errorDetails,
    logEntry,
  };
}

/**
 * 2. NOTIFICACIÓN DE ANOTACIÓN EN SALIDA PROGRAMADA (Guía + Confirmación al Cliente)
 */
export async function sendEnrollmentNotificationEmail(
  enrollment: DepartureEnrollment,
  departure: CalendarDeparture,
  settings: SiteSettings
): Promise<EmailDeliveryResult> {
  const guideEmail =
    settings.notificationEmail || settings.email || "traumflyfishing9@gmail.com";
  const clientEmail = (enrollment.email || "").trim();

  const isWaitlist = enrollment.status === "lista_espera";
  const statusLabel = isWaitlist
    ? "EN LISTA DE ESPERA"
    : "ANOTACIÓN CONFIRMADA";

  const waToClient = buildWhatsAppLink(
    enrollment.whatsapp,
    `Hola ${enrollment.fullName}, te escribimos de TRAUM Fly Cast Patagonia por tu anotación (${enrollment.bookingCode}) para la salida del ${departure.date} en ${departure.destination}.`
  );

  const waToGuide = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    `Hola TRAUM! Me anoté en la salida del ${departure.date} en ${departure.destination} (Código ${enrollment.bookingCode}, ${enrollment.participantsCount} persona/s).`
  );

  const scheduleStr = departure.endTime
    ? `${departure.startTime} a ${departure.endTime} hs`
    : `${departure.startTime} hs`;

  const commonRows: TraumTemplateRow[] = [
    { label: "Código de anotación", value: enrollment.bookingCode, highlight: true },
    { label: "Estado", value: statusLabel, highlight: true },
    { label: "Fecha de salida", value: departure.date, highlight: true },
    { label: "Horario", value: scheduleStr },
    { label: "Río / Destino", value: departure.destination },
    { label: "Tipo de pesca", value: departure.experienceType },
    {
      label: "Pescadores anotados",
      value: `${enrollment.participantsCount} persona(s)`,
    },
    { label: "Nombre y apellido", value: enrollment.fullName },
    { label: "Teléfono / WhatsApp", value: enrollment.whatsapp },
    { label: "Correo electrónico", value: clientEmail },
    {
      label: "Comentarios del pescador",
      value: enrollment.comments || "Sin comentarios adicionales",
    },
    {
      label: "Notas de la salida",
      value: departure.additionalInfo || "-",
    },
  ];

  // A) Correo para el Guía
  const guideSubject = `[${statusLabel}] ${enrollment.bookingCode} — ${enrollment.fullName} (${departure.date} · ${departure.destination})`;
  const guideBuilt = buildTraumBrandedEmail({
    preheader: `${enrollment.fullName} se anotó (${statusLabel}) en la salida del ${departure.date} en ${departure.destination}.`,
    badgeText: statusLabel,
    badgeBg: isWaitlist ? "#8B5E2B" : "#263D32",
    title: `Nueva anotación en ${departure.destination}`,
    subtitle: `Fecha: ${departure.date} · Código ${enrollment.bookingCode}`,
    greeting: "Hola equipo de TRAUM,",
    introParagraphs: [
      `${enrollment.fullName} (${enrollment.participantsCount} persona/s) registró su inscripción en la salida programada del ${departure.date}.`,
      isWaitlist
        ? "Como los cupos estaban completos, quedó registrado en la Lista de Espera."
        : "Los cupos de la salida se actualizaron automáticamente en el calendario.",
    ],
    rowsTitle: "Detalle de la anotación",
    rows: commonRows,
    ctaButton: waToClient
      ? {
          label: "Contactar al pescador por WhatsApp",
          url: waToClient,
          bgColor: "#263D32",
        }
      : undefined,
    settings,
  });

  const guideRes = await dispatchSingleEmail({
    to: guideEmail,
    replyTo: clientEmail || guideEmail,
    subject: guideSubject,
    html: guideBuilt.html,
    text: guideBuilt.text,
    plainSummary: {
      Tipo: statusLabel,
      Codigo: enrollment.bookingCode,
      Fecha_Salida: departure.date,
      Horario: scheduleStr,
      Rio: departure.destination,
      Tipo_Pesca: departure.experienceType,
      Personas: `${enrollment.participantsCount}`,
      Cliente: enrollment.fullName,
      WhatsApp: enrollment.whatsapp,
      Email: clientEmail,
      Comentarios: enrollment.comments || "-",
    },
    settings,
    isGuideCopy: true,
  });

  // B) Correo de confirmación para el Cliente
  let clientRes: SingleSendResult = { sent: false, channel: "skipped" };
  if (
    clientEmail &&
    clientEmail.includes("@") &&
    clientEmail !== "cliente@traumflycast.com"
  ) {
    const clientSubject = isWaitlist
      ? `Quedaste en lista de espera (${enrollment.bookingCode}) — TRAUM Fly Cast Patagonia`
      : `Confirmación de tu salida de pesca (${enrollment.bookingCode}) — TRAUM Fly Cast Patagonia`;

    const clientBuilt = buildTraumBrandedEmail({
      preheader: isWaitlist
        ? `Te anotamos en la lista de espera para el ${departure.date} en ${departure.destination}.`
        : `Tu lugar para la salida del ${departure.date} en ${departure.destination} está registrado.`,
      badgeText: statusLabel,
      badgeBg: isWaitlist ? "#8B5E2B" : "#263D32",
      title: isWaitlist
        ? "Te sumamos a la lista de espera"
        : "¡Tu lugar en la salida está reservado!",
      subtitle: `${departure.destination} · ${departure.date}`,
      greeting: `Hola ${enrollment.fullName},`,
      introParagraphs: isWaitlist
        ? [
            `Registramos tu solicitud en la lista de espera para la salida del ${departure.date} en ${departure.destination}.`,
            "Si se libera un lugar para esa jornada, el guía te va a avisar de inmediato por WhatsApp o correo para confirmar tu ingreso.",
          ]
        : [
            `Qué alegría contar con vos. Tu anotación para la salida programada del ${departure.date} en ${departure.destination} quedó confirmada con el código ${enrollment.bookingCode}.`,
            "El guía se va a comunicar con vos antes de la salida para ultimar el punto de encuentro, horario exacto y equipos recomendados.",
          ],
      rowsTitle: "Resumen de tu salida",
      rows: commonRows,
      ctaButton: waToGuide
        ? {
            label: "Hablar con el guía por WhatsApp",
            url: waToGuide,
            bgColor: "#263D32",
          }
        : undefined,
      secondaryNote:
        "Conservá tu código de anotación. Si tenés cualquier consulta previa, escribinos por WhatsApp cuando gustes.",
      settings,
    });

    clientRes = await dispatchSingleEmail({
      to: clientEmail,
      replyTo: guideEmail,
      subject: clientSubject,
      html: clientBuilt.html,
      text: clientBuilt.text,
      plainSummary: {
        Codigo: enrollment.bookingCode,
        Estado: statusLabel,
        Fecha: departure.date,
        Rio: departure.destination,
      },
      settings,
      isGuideCopy: false,
    });
  }

  const combinedErrors = [guideRes.error, clientRes.error]
    .filter(Boolean)
    .join(" || ");

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "anotacion_confirmada",
    subject: guideSubject,
    recipientGuide: guideEmail,
    recipientClient: clientEmail,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: guideRes.sent
      ? guideRes.channel
      : clientRes.sent
      ? clientRes.channel
      : guideRes.channel,
    errorDetails:
      !guideRes.sent || !clientRes.sent ? combinedErrors || undefined : undefined,
  };

  return {
    sent: guideRes.sent || clientRes.sent,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: logEntry.channel,
    errorDetails: logEntry.errorDetails,
    logEntry,
  };
}

/**
 * 3. RESPUESTA DEL GUÍA A UNA SOLICITUD A PEDIDO (Aceptada / Reprogramada / Rechazada)
 */
export async function sendGuideResponseToRequestEmail(
  customReq: CustomTripRequest,
  settings: SiteSettings
): Promise<EmailDeliveryResult> {
  const guideEmail =
    settings.notificationEmail || settings.email || "traumflyfishing9@gmail.com";
  const clientEmail = (customReq.email || "").trim();

  const statusText =
    customReq.status === "aceptada"
      ? "SOLICITUD ACEPTADA"
      : customReq.status === "reprogramada"
      ? "PROPUESTA DE NUEVA FECHA"
      : customReq.status === "rechazada"
      ? "SOLICITUD NO DISPONIBLE"
      : "ACTUALIZACIÓN DE SOLICITUD";

  const badgeBg =
    customReq.status === "aceptada"
      ? "#263D32"
      : customReq.status === "reprogramada"
      ? "#8B5E2B"
      : "#7A2E2E";

  const waToGuide = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    `Hola TRAUM! Vi la respuesta sobre mi solicitud ${customReq.requestCode} (${statusText}). Te escribo para coordinar.`
  );

  const rows: TraumTemplateRow[] = [
    { label: "Código de solicitud", value: customReq.requestCode, highlight: true },
    { label: "Estado actual", value: statusText, highlight: true },
    { label: "Fecha solicitada originalmente", value: customReq.desiredDate },
    ...(customReq.alternativeDate
      ? [
          {
            label: "Nueva fecha propuesta por el guía",
            value: customReq.alternativeDate,
            highlight: true,
          },
        ]
      : []),
    { label: "Horario preferido", value: customReq.preferredSchedule },
    {
      label: "Río / Destino",
      value: customReq.preferredRiver || "A coordinar con el guía",
    },
    {
      label: "Pescadores",
      value: `${customReq.participantsCount} persona(s)`,
    },
  ];

  const subject = `${statusText} (${customReq.requestCode}) — TRAUM Fly Cast Patagonia`;

  const built = buildTraumBrandedEmail({
    preheader: `El guía respondió a tu solicitud ${customReq.requestCode}: ${statusText}.`,
    badgeText: statusText,
    badgeBg,
    title:
      customReq.status === "aceptada"
        ? "¡Tu salida a pedido fue aceptada!"
        : customReq.status === "reprogramada"
        ? "Te proponemos una fecha alternativa"
        : "Respuesta a tu solicitud de salida",
    subtitle: `Solicitud ${customReq.requestCode} · ${customReq.fullName}`,
    greeting: `Hola ${customReq.fullName},`,
    introParagraphs:
      customReq.status === "aceptada"
        ? [
            `¡Excelentes noticias! El guía confirmó la disponibilidad para tu salida de pesca del ${customReq.desiredDate}.`,
            "Tocá el botón de WhatsApp acá abajo para ultimar el horario de encuentro y los detalles de la flotada o vadeo.",
          ]
        : customReq.status === "reprogramada"
        ? [
            `Revisamos el calendario para el ${customReq.desiredDate} y te proponemos reprogramar la jornada para el día ${
              customReq.alternativeDate || "a coordinar"
            }.`,
            "Confirmá con el guía por WhatsApp si te queda cómoda esta nueva fecha.",
          ]
        : [
            `Gracias por tu interés en salir a pescar con TRAUM. Lamentablemente no contamos con disponibilidad operativa para el ${customReq.desiredDate}.`,
            "Si estás en la zona otros días, escribinos por WhatsApp para buscar una alternativa.",
          ],
    highlightBox: customReq.guideResponse
      ? {
          title: "Mensaje del guía",
          body: customReq.guideResponse,
          bgColor: "#ECE6D8",
          borderColor: badgeBg,
          textColor: "#292D29",
        }
      : undefined,
    rowsTitle: "Detalle de la solicitud",
    rows,
    ctaButton: waToGuide
      ? {
          label: "Coordinar ahora por WhatsApp",
          url: waToGuide,
          bgColor: "#263D32",
        }
      : undefined,
    settings,
  });

  let clientRes: SingleSendResult = { sent: false, channel: "skipped" };
  if (clientEmail && clientEmail.includes("@")) {
    clientRes = await dispatchSingleEmail({
      to: clientEmail,
      replyTo: guideEmail,
      subject,
      html: built.html,
      text: built.text,
      plainSummary: {
        Accion: statusText,
        Codigo: customReq.requestCode,
        Cliente: customReq.fullName,
        Fecha_Original: customReq.desiredDate,
        Fecha_Alternativa: customReq.alternativeDate || "-",
        Respuesta_Guia: customReq.guideResponse || "-",
      },
      settings,
      isGuideCopy: false,
    });
  }

  const guideRes = await dispatchSingleEmail({
    to: guideEmail,
    replyTo: clientEmail || guideEmail,
    subject: `[Copia Guía] ${subject}`,
    html: built.html,
    text: built.text,
    plainSummary: {
      Accion: statusText,
      Codigo: customReq.requestCode,
      Cliente: customReq.fullName,
      Email_Cliente: clientEmail,
    },
    settings,
    isGuideCopy: true,
  });

  const combinedErrors = [clientRes.error, guideRes.error]
    .filter(Boolean)
    .join(" || ");

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "respuesta_solicitud",
    subject,
    recipientGuide: guideEmail,
    recipientClient: clientEmail,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: clientRes.sent ? clientRes.channel : guideRes.channel,
    errorDetails: !clientRes.sent ? combinedErrors || undefined : undefined,
  };

  return {
    sent: clientRes.sent || guideRes.sent,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: logEntry.channel,
    errorDetails: logEntry.errorDetails,
    logEntry,
  };
}

/**
 * 4. AVISO DE CANCELACIÓN DE SALIDA PROGRAMADA A TODOS LOS ANOTADOS
 */
export async function sendDepartureCancelledNotifications(
  departure: CalendarDeparture,
  enrolledClients: DepartureEnrollment[],
  cancelReason: string,
  settings: SiteSettings
): Promise<{
  notifiedCount: number;
  recipients: string[];
  logEntry: EmailLogItem;
}> {
  const guideEmail =
    settings.notificationEmail || settings.email || "traumflyfishing9@gmail.com";
  const activeClients = enrolledClients.filter((e) => e.status !== "cancelada");
  const recipients = activeClients.map(
    (c) => `${c.fullName} (${c.whatsapp} / ${c.email})`
  );

  const waToGuide = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    `Hola TRAUM! Recibí el aviso de cancelación de la salida del ${departure.date} en ${departure.destination}. Te escribo para reprogramar.`
  );

  let anyClientSent = false;
  const errors: string[] = [];

  for (const client of activeClients) {
    if (
      client.email &&
      client.email.includes("@") &&
      client.email !== "cliente@traumflycast.com"
    ) {
      const clientSubject = `Aviso importante: Salida del ${departure.date} en ${departure.destination} cancelada — TRAUM`;
      const clientBuilt = buildTraumBrandedEmail({
        preheader: `La salida del ${departure.date} en ${departure.destination} fue cancelada. Escribinos para reprogramar.`,
        badgeText: "Aviso de Cancelación",
        badgeBg: "#7A2E2E",
        title: `Salida del ${departure.date} cancelada`,
        subtitle: `${departure.destination} · Código ${client.bookingCode}`,
        greeting: `Hola ${client.fullName},`,
        introParagraphs: [
          `Te escribimos para informarte que la salida programada del día ${departure.date} en ${departure.destination} tuvo que ser cancelada.`,
          "Para nosotros tu seguridad y la calidad de la pesca son prioridad. Comunicate con el guía por WhatsApp para buscar otra fecha disponible.",
        ],
        highlightBox: {
          title: "Motivo informado por el guía",
          body:
            cancelReason ||
            "Condiciones climáticas o del río no aptas para la navegación segura.",
          bgColor: "#F9EBEB",
          borderColor: "#7A2E2E",
          textColor: "#5C1F1F",
        },
        rowsTitle: "Datos de la salida cancelada",
        rows: [
          { label: "Código de anotación", value: client.bookingCode, highlight: true },
          { label: "Fecha", value: departure.date },
          { label: "Río / Destino", value: departure.destination },
          { label: "Modalidad", value: departure.experienceType },
          { label: "Horario", value: `${departure.startTime} hs` },
        ],
        ctaButton: waToGuide
          ? {
              label: "Reprogramar por WhatsApp con el guía",
              url: waToGuide,
              bgColor: "#263D32",
            }
          : undefined,
        settings,
      });

      const res = await dispatchSingleEmail({
        to: client.email,
        replyTo: guideEmail,
        subject: clientSubject,
        html: clientBuilt.html,
        text: clientBuilt.text,
        plainSummary: {
          Accion: "Salida Cancelada",
          Fecha: departure.date,
          Rio: departure.destination,
          Cliente: client.fullName,
          Motivo: cancelReason,
        },
        settings,
        isGuideCopy: false,
      });
      if (res.sent) anyClientSent = true;
      if (res.error) errors.push(res.error);
    }
  }

  // Resumen para el guía
  const guideSubject = `Salida Cancelada (${departure.date} — ${departure.destination}) · ${activeClients.length} anotado(s)`;
  const guideBuilt = buildTraumBrandedEmail({
    preheader: `Resumen de cancelación de salida del ${departure.date}.`,
    badgeText: "Salida Cancelada",
    badgeBg: "#7A2E2E",
    title: `Cancelaste la salida del ${departure.date}`,
    subtitle: `${departure.destination} · ${activeClients.length} pescador(es) afectado(s)`,
    greeting: "Hola equipo de TRAUM,",
    introParagraphs: [
      `La salida del ${departure.date} en ${departure.destination} quedó marcada como cancelada en el calendario.`,
      activeClients.length > 0
        ? "A continuación encontrás el listado de pescadores que estaban anotados para que también puedas contactarlos por WhatsApp si lo deseás."
        : "No había pescadores anotados en esta salida.",
    ],
    rowsTitle: "Resumen de la cancelación",
    rows: [
      { label: "Fecha", value: departure.date, highlight: true },
      { label: "Río / Destino", value: departure.destination },
      { label: "Motivo", value: cancelReason || "Cancelada por el guía" },
      {
        label: "Anotados afectados",
        value:
          recipients.length > 0
            ? recipients.join(" | ")
            : "Ningún anotado activo",
      },
    ],
    settings,
  });

  const guideRes = await dispatchSingleEmail({
    to: guideEmail,
    subject: guideSubject,
    html: guideBuilt.html,
    text: guideBuilt.text,
    plainSummary: {
      Accion: "Salida Cancelada",
      Fecha: departure.date,
      Rio: departure.destination,
      Anotados: recipients.join("; ") || "Ninguno",
    },
    settings,
    isGuideCopy: true,
  });

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "cancelacion_salida",
    subject: guideSubject,
    recipientGuide: guideEmail,
    recipientClient: activeClients.map((c) => c.email).join(", "),
    guideSent: guideRes.sent,
    clientSent: anyClientSent,
    channel: guideRes.channel,
    errorDetails: errors.length > 0 ? errors[0] : guideRes.error,
  };

  return {
    notifiedCount: activeClients.length,
    recipients,
    logEntry,
  };
}

/**
 * 5. ENVIAR MAIL DE PRUEBA DESDE EL PANEL ADMIN
 */
export async function sendTestDiagnosticEmail(
  settings: SiteSettings,
  customRecipient?: string
): Promise<EmailDeliveryResult> {
  const targetEmail =
    (customRecipient || "").trim() ||
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com";

  const waUrl = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    "Hola TRAUM! Prueba de botón de WhatsApp desde el correo con estética Traum."
  );

  const subject = `Correo de prueba — TRAUM Fly Cast Patagonia (${new Date().toLocaleTimeString(
    "es-AR",
    { hour: "2-digit", minute: "2-digit" }
  )})`;

  const built = buildTraumBrandedEmail({
    preheader:
      "Verificación de envío y diseño de correos de TRAUM Fly Cast Patagonia.",
    badgeText: "Verificación de Sistema",
    badgeBg: "#263D32",
    title: "El correo de TRAUM funciona correctamente",
    subtitle: "Prueba de envío y plantilla con estética de marca",
    greeting: "Hola equipo de TRAUM,",
    introParagraphs: [
      "Este es un correo de prueba enviado desde el Panel del Guía para verificar la entrega de notificaciones y el diseño visual de la marca.",
      "Cuando un pescador solicita una salida a pedido o se anota en una salida programada, tanto vos como el cliente reciben un correo con este formato editorial (y su versión en texto plano).",
    ],
    highlightBox: {
      title: "Identidad visual aplicada",
      body: "Paleta bosque profundo (#263D32), marfil cálido (#F2EFE6) y piedra (#746657), tipografía editorial Georgia Serif y diseño responsivo compatible con Gmail, Outlook y celulares.",
      bgColor: "#ECE6D8",
      borderColor: "#263D32",
      textColor: "#263D32",
    },
    rowsTitle: "Datos de configuración probados",
    rows: [
      { label: "Destinatario de prueba", value: targetEmail, highlight: true },
      {
        label: "Correo oficial del guía",
        value: settings.notificationEmail || settings.email,
      },
      {
        label: "WhatsApp vinculado",
        value: settings.whatsappNumber || "+54 9 2944 306651",
      },
      {
        label: "Fecha y hora de prueba",
        value: new Date().toLocaleString("es-AR", {
          timeZone: "America/Argentina/Buenos_Aires",
        }),
      },
    ],
    ctaButton: waUrl
      ? {
          label: "Probar botón de WhatsApp",
          url: waUrl,
          bgColor: "#263D32",
        }
      : undefined,
    settings,
  });

  const res = await dispatchSingleEmail({
    to: targetEmail,
    replyTo: targetEmail,
    subject,
    html: built.html,
    text: built.text,
    plainSummary: {
      Tipo: "Mail de Prueba TRAUM",
      Destinatario: targetEmail,
      Estado: "Verificación desde Panel Admin",
    },
    settings,
    isGuideCopy: true,
  });

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "mail_prueba",
    subject,
    recipientGuide: targetEmail,
    guideSent: res.sent,
    clientSent: res.sent,
    channel: res.channel,
    errorDetails: res.error,
  };

  return {
    sent: res.sent,
    guideSent: res.sent,
    clientSent: res.sent,
    channel: res.channel,
    errorDetails: res.error,
    logEntry,
  };
}

export async function sendBookingNotificationEmail(
  inquiry: BookingInquiry,
  settings: SiteSettings
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail || settings.email || "traumflyfishing9@gmail.com";
  const subject = `Nueva Reserva ${inquiry.bookingCode} — ${inquiry.fullName}`;
  const built = buildTraumBrandedEmail({
    preheader: `Nueva consulta/reserva ${inquiry.bookingCode} de ${inquiry.fullName}`,
    badgeText: "Consulta / Reserva",
    title: `Reserva ${inquiry.bookingCode} — ${inquiry.fullName}`,
    greeting: "Hola equipo de TRAUM,",
    introParagraphs: [
      `Se registró una nueva consulta de ${inquiry.fullName} para ${inquiry.desiredDate}.`,
    ],
    rowsTitle: "Datos recibidos",
    rows: [
      { label: "Código", value: inquiry.bookingCode, highlight: true },
      { label: "Cliente", value: inquiry.fullName },
      { label: "WhatsApp", value: inquiry.whatsapp },
      { label: "Email", value: inquiry.email },
      { label: "Fecha", value: inquiry.desiredDate },
      { label: "Modalidad", value: inquiry.experienceType },
      { label: "Pescadores", value: `${inquiry.participantsCount}` },
      { label: "Comentarios", value: inquiry.comments || "-" },
    ],
    settings,
  });

  const res = await dispatchSingleEmail({
    to: targetEmail,
    replyTo: inquiry.email,
    subject,
    html: built.html,
    text: built.text,
    plainSummary: {
      Codigo: inquiry.bookingCode,
      Cliente: inquiry.fullName,
      WhatsApp: inquiry.whatsapp,
      Email: inquiry.email,
    },
    settings,
    isGuideCopy: true,
  });
  return { sent: res.sent, channel: res.channel };
}

export async function sendRegretNotificationEmail(
  regret: RegretRequestItem,
  settings: SiteSettings
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail =
    settings.notificationEmail || settings.email || "traumflyfishing9@gmail.com";
  const subject = `Solicitud de Arrepentimiento ${regret.regretCode} — ${regret.fullName}`;
  const built = buildTraumBrandedEmail({
    preheader: `Solicitud de baja ${regret.regretCode} (Ley 24.240)`,
    badgeText: "Botón de Arrepentimiento",
    badgeBg: "#7A2E2E",
    title: `Solicitud ${regret.regretCode}`,
    greeting: "Hola equipo de TRAUM,",
    introParagraphs: [
      `Se recibió una solicitud de baja/arrepentimiento (Ley 24.240) de ${regret.fullName}.`,
    ],
    rowsTitle: "Detalle",
    rows: [
      { label: "Código", value: regret.regretCode, highlight: true },
      { label: "Nombre", value: regret.fullName },
      { label: "Email", value: regret.email },
      { label: "WhatsApp", value: regret.whatsapp },
      { label: "Reserva asociada", value: regret.bookingCode || "-" },
      { label: "Motivo", value: regret.reason || "-" },
    ],
    settings,
  });

  const res = await dispatchSingleEmail({
    to: targetEmail,
    replyTo: regret.email,
    subject,
    html: built.html,
    text: built.text,
    plainSummary: {
      Codigo: regret.regretCode,
      Nombre: regret.fullName,
      Email: regret.email,
    },
    settings,
    isGuideCopy: true,
  });
  return { sent: res.sent, channel: res.channel };
}
