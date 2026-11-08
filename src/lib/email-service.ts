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

function escapeHtml(str: string): string {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  const tagline = opts.settings.tagline || "Donde la pesca se hace realidad";
  const location =
    opts.settings.locationGeneral ||
    "Junín de los Andes · Provincia del Neuquén · Patagonia Argentina";
  const guideWhatsapp = opts.settings.whatsappNumber || "+54 9 2944 306651";
  const guideEmail =
    opts.settings.notificationEmail ||
    opts.settings.email ||
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
  <div style="display: none; max-height: 0; overflow: hidden; opacity: 0; color: transparent; mso-hide: all;">
    ${escapeHtml(opts.preheader)}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #E7E1D3; padding: 24px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%; background-color: #F2EFE6; border: 1px solid #D8CEB9;">
          
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

          <tr>
            <td style="padding: 32px 26px 28px 26px; background-color: #F2EFE6;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
                <tr>
                  <td style="background-color: ${badgeBg}; color: ${badgeColor}; font-family: Arial, Helvetica, sans-serif; font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.16em; padding: 5px 12px;">
                    ${escapeHtml(opts.badgeText)}
                  </td>
                </tr>
              </table>

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

              <p style="margin: 0 0 12px 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #263D32;">
                ${escapeHtml(opts.greeting)}
              </p>
              ${paragraphsHtml}

              ${highlightHtml}

              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin: 22px 0; border: 1px solid #D8CEB9; background-color: #FAF8F3;">
                <tr>
                  <td colspan="2" style="background-color: #263D32; color: #F2EFE6; padding: 10px 14px; font-family: Arial, Helvetica, sans-serif; font-size: 11px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.15em;">
                    ${escapeHtml(opts.rowsTitle)}
                  </td>
                </tr>
                ${rowsHtml}
              </table>

              ${ctaHtml}

              ${secondaryNoteHtml}
            </td>
          </tr>

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
    text: textLines
      .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
      .join("\n"),
  };
}

interface SingleSendResult {
  sent: boolean;
  channel: string;
  error?: string;
}

function getDirectSmtpCredentials(settings: SiteSettings): {
  senderEmail: string;
  senderPass: string;
} {
  const senderEmail = (
    settings.smtpUser ||
    process.env.SMTP_USER ||
    ""
  ).trim();

  const senderPass = (
    settings.smtpAppPassword ||
    process.env.SMTP_APP_PASSWORD ||
    process.env.GMAIL_APP_PASSWORD ||
    ""
  )
    .replace(/\s+/g, "")
    .trim();

  return { senderEmail, senderPass };
}

/**
 * Verifica en vivo la conexión con el servidor SMTP del correo emisor configurado.
 */
export async function verifyDirectSmtpConnection(
  settings: SiteSettings
): Promise<{ ok: boolean; senderEmail: string; error?: string }> {
  const { senderEmail, senderPass } = getDirectSmtpCredentials(settings);

  if (!senderEmail || !senderEmail.includes("@")) {
    return {
      ok: false,
      senderEmail,
      error: "Falta ingresar la cuenta de Gmail emisora.",
    };
  }

  if (!senderPass || senderPass.length < 16) {
    return {
      ok: false,
      senderEmail,
      error:
        "Falta ingresar la Contraseña de Aplicación de 16 letras de esa cuenta emisora.",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: senderEmail,
        pass: senderPass,
      },
    });

    await transporter.verify();
    return { ok: true, senderEmail };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const isAuthErr = raw.includes("535") || raw.toLowerCase().includes("invalid login") || raw.toLowerCase().includes("username and password not accepted");
    return {
      ok: false,
      senderEmail,
      error: isAuthErr
        ? `Gmail rechazó la clave: asegurate de que las 16 letras se hayan generado dentro de la cuenta "${senderEmail}" (y no en otro Gmail abierto en tu navegador).`
        : `No se pudo conectar con Gmail (${raw})`,
    };
  }
}

/**
 * Envío 100% directo desde el correo emisor configurado hacia el destinatario exacto.
 * Sin servicios intermedios raros, sin Resend y sin redirecciones cruzadas:
 * cada destinatario recibe pura y exclusivamente el correo que le corresponde.
 */
async function dispatchDirectEmail(params: {
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
  settings: SiteSettings;
}): Promise<SingleSendResult> {
  const { to, replyTo, subject, html, text, settings } = params;
  const recipient = (to || "").trim();

  if (!recipient || !recipient.includes("@")) {
    return {
      sent: false,
      channel: "destinatario_invalido",
      error: "El correo destinatario no es válido.",
    };
  }

  const { senderEmail, senderPass } = getDirectSmtpCredentials(settings);

  if (!senderEmail || !senderPass) {
    return {
      sent: false,
      channel: "falta_configurar_emisor",
      error:
        "Falta configurar el correo Gmail emisor y su clave de aplicación de 16 letras en el Panel Admin (pestaña Correo y Ajustes).",
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: senderEmail,
        pass: senderPass,
      },
    });

    const brandTitle = settings.brandName
      ? `${settings.brandName} · ${settings.brandSubtitle || "Fly Cast Patagonia"}`
      : "TRAUM Fly Cast Patagonia";

    await transporter.sendMail({
      from: `"${brandTitle}" <${senderEmail}>`,
      to: recipient,
      replyTo: replyTo || senderEmail,
      subject,
      text,
      html,
    });

    return { sent: true, channel: "directo_gmail" };
  } catch (err) {
    const raw = err instanceof Error ? err.message : String(err);
    const isAuthErr =
      raw.includes("535") ||
      raw.toLowerCase().includes("username and password not accepted");

    return {
      sent: false,
      channel: "error_smtp",
      error: isAuthErr
        ? `La clave de 16 letras no corresponde al correo emisor "${senderEmail}". Generá las 16 letras entrando con esa misma cuenta en Google.`
        : `Error enviando correo directo: ${raw}`,
    };
  }
}

/**
 * 1. CUANDO UN CLIENTE PIDE UNA SALIDA A MEDIDA:
 * - Al correo configurado en el Panel Admin (Guía) le llega SOLO el correo del turno/pedido.
 * - Al correo que puso el cliente le llega SOLO el correo de "Recibimos tu solicitud...".
 */
export async function sendCustomRequestNotificationEmail(
  customReq: CustomTripRequest,
  settings: SiteSettings
): Promise<EmailDeliveryResult> {
  const guideEmail = (
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();
  const clientEmail = (customReq.email || "").trim();

  const waToClient = buildWhatsAppLink(
    customReq.whatsapp,
    `Hola ${customReq.fullName}, soy el guía de TRAUM Fly Cast Patagonia. Recibí tu solicitud de salida (${customReq.requestCode}) para el ${customReq.desiredDate} (${customReq.preferredSchedule}). Te escribo para coordinar.`
  );

  const waToGuide = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    `Hola TRAUM! Envié la solicitud de salida ${customReq.requestCode} para el día ${customReq.desiredDate} (${customReq.preferredSchedule}) a nombre de ${customReq.fullName}.`
  );

  const commonRows: TraumTemplateRow[] = [
    { label: "Código de turno", value: customReq.requestCode, highlight: true },
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
    { label: "Nombre del cliente", value: customReq.fullName },
    { label: "Teléfono / WhatsApp", value: customReq.whatsapp },
    { label: "Correo del cliente", value: clientEmail },
    {
      label: "Comentarios",
      value: customReq.comments || "Sin comentarios adicionales",
    },
  ];

  // 1) Correo ÚNICAMENTE para el Guía (al mail puesto en el Panel Admin)
  const guideSubject = `Nuevo Pedido de Salida ${customReq.requestCode} — ${customReq.fullName} (${customReq.desiredDate})`;
  const guideBuilt = buildTraumBrandedEmail({
    preheader: `Nuevo pedido de salida de ${customReq.fullName} para el ${customReq.desiredDate}.`,
    badgeText: "Nuevo Pedido de Turno",
    badgeBg: "#8B5E2B",
    title: `Pedido de salida para el ${customReq.desiredDate}`,
    subtitle: `Código ${customReq.requestCode} · Cliente: ${customReq.fullName}`,
    greeting: "Hola,",
    introParagraphs: [
      `${customReq.fullName} solicitó una salida personalizada desde la web para el día ${customReq.desiredDate}.`,
      "Acá tenés todos los datos del turno para responderle desde el Panel Admin o contactarlo directo por WhatsApp.",
    ],
    rowsTitle: "Datos del turno solicitado",
    rows: commonRows,
    ctaButton: waToClient
      ? {
          label: "Escribir al cliente por WhatsApp",
          url: waToClient,
          bgColor: "#263D32",
        }
      : undefined,
    settings,
  });

  const guideRes = await dispatchDirectEmail({
    to: guideEmail,
    replyTo: clientEmail || guideEmail,
    subject: guideSubject,
    html: guideBuilt.html,
    text: guideBuilt.text,
    settings,
  });

  // 2) Correo ÚNICAMENTE para el Cliente (a la cuenta que puso en el pedido)
  let clientRes: SingleSendResult = { sent: false, channel: "omitido" };
  if (clientEmail && clientEmail.includes("@")) {
    const clientSubject = `Recibimos tu solicitud de salida (${customReq.requestCode}) — TRAUM Fly Cast Patagonia`;
    const clientBuilt = buildTraumBrandedEmail({
      preheader: `Recibimos tu solicitud para el ${customReq.desiredDate}. Nos pondremos en contacto a la brevedad.`,
      badgeText: "Solicitud Recibida",
      badgeBg: "#263D32",
      title: "Recibimos tu solicitud de salida",
      subtitle: `Código de referencia: ${customReq.requestCode}`,
      greeting: `Hola ${customReq.fullName},`,
      introParagraphs: [
        `Recibimos correctamente tu solicitud para salir a pescar el día ${customReq.desiredDate} (${customReq.preferredSchedule}).`,
        "Nuestro guía va a revisar la disponibilidad para esa fecha y se va a comunicar con vos a la brevedad por WhatsApp o correo electrónico para coordinar todos los detalles.",
      ],
      rowsTitle: "Resumen de tu solicitud",
      rows: [
        { label: "Código", value: customReq.requestCode, highlight: true },
        { label: "Fecha solicitada", value: customReq.desiredDate, highlight: true },
        { label: "Horario", value: customReq.preferredSchedule },
        {
          label: "Río / Destino",
          value: customReq.preferredRiver || "A sugerencia del guía",
        },
        {
          label: "Pescadores",
          value: `${customReq.participantsCount} persona(s)`,
        },
      ],
      ctaButton: waToGuide
        ? {
            label: "Hablar con el guía por WhatsApp",
            url: waToGuide,
            bgColor: "#263D32",
          }
        : undefined,
      secondaryNote:
        "Si necesitás hacer alguna consulta adicional, podés responder directamente a este correo o escribirnos por WhatsApp.",
      settings,
    });

    clientRes = await dispatchDirectEmail({
      to: clientEmail,
      replyTo: guideEmail,
      subject: clientSubject,
      html: clientBuilt.html,
      text: clientBuilt.text,
      settings,
    });
  }

  const combinedErrors = Array.from(
    new Set([guideRes.error, clientRes.error].filter(Boolean))
  ).join(" | ");

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "solicitud_recibida",
    subject: guideSubject,
    recipientGuide: guideEmail,
    recipientClient: clientEmail,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: guideRes.sent ? guideRes.channel : clientRes.channel,
    errorDetails:
      !guideRes.sent || !clientRes.sent ? combinedErrors || undefined : undefined,
  };

  return {
    sent: guideRes.sent && clientRes.sent,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: logEntry.channel,
    errorDetails: logEntry.errorDetails,
    logEntry,
  };
}

/**
 * 2. CUANDO UN CLIENTE SACA UN TURNO EN UNA SALIDA PROGRAMADA:
 * - Al correo configurado en el Panel Admin (Guía) le llega SOLO el correo del turno.
 * - Al correo que puso el cliente le llega SOLO la constancia de su turno recibido.
 */
export async function sendEnrollmentNotificationEmail(
  enrollment: DepartureEnrollment,
  departure: CalendarDeparture,
  settings: SiteSettings,
  options?: { skipGuideCopy?: boolean }
): Promise<EmailDeliveryResult> {
  const guideEmail = (
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();
  const clientEmail = (enrollment.email || "").trim();

  const isWaitlist = enrollment.status === "lista_espera";
  const statusLabel = isWaitlist ? "LISTA DE ESPERA" : "TURNO RESERVADO";

  const waToClient = buildWhatsAppLink(
    enrollment.whatsapp,
    `Hola ${enrollment.fullName}, te escribimos de TRAUM Fly Cast Patagonia por tu turno (${enrollment.bookingCode}) para la salida del ${departure.date} en ${departure.destination}.`
  );

  const waToGuide = buildWhatsAppLink(
    settings.whatsappNumber || "+5492944306651",
    `Hola TRAUM! Reservé lugar en la salida del ${departure.date} en ${departure.destination} (Código ${enrollment.bookingCode}, ${enrollment.participantsCount} persona/s).`
  );

  const scheduleStr = departure.endTime
    ? `${departure.startTime} a ${departure.endTime} hs`
    : `${departure.startTime} hs`;

  // 1) Correo ÚNICAMENTE para el Guía (al mail puesto en el Panel Admin)
  const guideSubject = `Nuevo Turno [${statusLabel}] ${enrollment.bookingCode} — ${enrollment.fullName} (${departure.date})`;
  const guideBuilt = buildTraumBrandedEmail({
    preheader: `${enrollment.fullName} sacó turno para el ${departure.date} en ${departure.destination}.`,
    badgeText: statusLabel,
    badgeBg: isWaitlist ? "#8B5E2B" : "#263D32",
    title: `Nuevo turno en ${departure.destination}`,
    subtitle: `Fecha: ${departure.date} · Código ${enrollment.bookingCode}`,
    greeting: "Hola,",
    introParagraphs: [
      `${enrollment.fullName} (${enrollment.participantsCount} persona/s) se anotó en la salida programada del ${departure.date}.`,
    ],
    rowsTitle: "Datos del turno",
    rows: [
      { label: "Código", value: enrollment.bookingCode, highlight: true },
      { label: "Estado", value: statusLabel, highlight: true },
      { label: "Fecha", value: departure.date, highlight: true },
      { label: "Horario", value: scheduleStr },
      { label: "Río / Destino", value: departure.destination },
      { label: "Modalidad", value: departure.experienceType },
      {
        label: "Cantidad de personas",
        value: `${enrollment.participantsCount} persona(s)`,
      },
      { label: "Nombre del cliente", value: enrollment.fullName },
      { label: "Teléfono / WhatsApp", value: enrollment.whatsapp },
      { label: "Correo del cliente", value: clientEmail },
      {
        label: "Comentarios",
        value: enrollment.comments || "Sin comentarios adicionales",
      },
    ],
    ctaButton: waToClient
      ? {
          label: "Escribir al cliente por WhatsApp",
          url: waToClient,
          bgColor: "#263D32",
        }
      : undefined,
    settings,
  });

  const guideRes: SingleSendResult = options?.skipGuideCopy
    ? { sent: true, channel: "omitido_por_guia" }
    : await dispatchDirectEmail({
        to: guideEmail,
        replyTo: clientEmail || guideEmail,
        subject: guideSubject,
        html: guideBuilt.html,
        text: guideBuilt.text,
        settings,
      });

  // 2) Correo ÚNICAMENTE para el Cliente (a la cuenta que puso en el pedido)
  let clientRes: SingleSendResult = { sent: false, channel: "omitido" };
  if (
    clientEmail &&
    clientEmail.includes("@") &&
    clientEmail !== "cliente@traumflycast.com"
  ) {
    const clientSubject = isWaitlist
      ? `Recibimos tu solicitud en lista de espera (${enrollment.bookingCode}) — TRAUM Fly Cast Patagonia`
      : `Recibimos tu reserva de salida (${enrollment.bookingCode}) — TRAUM Fly Cast Patagonia`;

    const clientBuilt = buildTraumBrandedEmail({
      preheader: isWaitlist
        ? `Quedaste registrado en la lista de espera para el ${departure.date} en ${departure.destination}.`
        : `Recibimos tu inscripción para la salida del ${departure.date} en ${departure.destination}.`,
      badgeText: isWaitlist ? "Lista de Espera" : "Turno Confirmado",
      badgeBg: isWaitlist ? "#8B5E2B" : "#263D32",
      title: isWaitlist
        ? "Recibimos tu anotación en lista de espera"
        : "Recibimos tu reserva de salida",
      subtitle: `${departure.destination} · ${departure.date}`,
      greeting: `Hola ${enrollment.fullName},`,
      introParagraphs: isWaitlist
        ? [
            `Registramos tu solicitud en la lista de espera para la salida del ${departure.date} en ${departure.destination}.`,
            "Si se libera un cupo para esa fecha, nuestro guía se comunicará con vos de inmediato.",
          ]
        : [
            `Recibimos correctamente tu anotación para la salida del ${departure.date} en ${departure.destination} (Código ${enrollment.bookingCode}).`,
            "Nuestro guía se va a comunicar con vos para coordinar el punto de encuentro y todos los detalles de la jornada.",
          ],
      rowsTitle: "Detalle de tu salida",
      rows: [
        { label: "Código", value: enrollment.bookingCode, highlight: true },
        { label: "Fecha", value: departure.date, highlight: true },
        { label: "Horario", value: scheduleStr },
        { label: "Río / Destino", value: departure.destination },
        { label: "Modalidad", value: departure.experienceType },
        {
          label: "Pescadores",
          value: `${enrollment.participantsCount} persona(s)`,
        },
      ],
      ctaButton: waToGuide
        ? {
            label: "Hablar con el guía por WhatsApp",
            url: waToGuide,
            bgColor: "#263D32",
          }
        : undefined,
      secondaryNote:
        "Podés responder directamente a este correo o escribirnos por WhatsApp ante cualquier consulta.",
      settings,
    });

    clientRes = await dispatchDirectEmail({
      to: clientEmail,
      replyTo: guideEmail,
      subject: clientSubject,
      html: clientBuilt.html,
      text: clientBuilt.text,
      settings,
    });
  }

  const combinedErrors = Array.from(
    new Set([guideRes.error, clientRes.error].filter(Boolean))
  ).join(" | ");

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "anotacion_confirmada",
    subject: guideSubject,
    recipientGuide: guideEmail,
    recipientClient: clientEmail,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: guideRes.sent ? guideRes.channel : clientRes.channel,
    errorDetails:
      !guideRes.sent || !clientRes.sent ? combinedErrors || undefined : undefined,
  };

  return {
    sent: guideRes.sent && clientRes.sent,
    guideSent: guideRes.sent,
    clientSent: clientRes.sent,
    channel: logEntry.channel,
    errorDetails: logEntry.errorDetails,
    logEntry,
  };
}

/**
 * 3. RESPUESTA DEL GUÍA A UNA SOLICITUD (se envía SOLO al cliente).
 */
export async function sendGuideResponseToRequestEmail(
  customReq: CustomTripRequest,
  settings: SiteSettings
): Promise<EmailDeliveryResult> {
  const guideEmail = (
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();
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

  const subject = `${statusText} (${customReq.requestCode}) — TRAUM Fly Cast Patagonia`;

  const built = buildTraumBrandedEmail({
    preheader: `Respuesta a tu solicitud ${customReq.requestCode}: ${statusText}.`,
    badgeText: statusText,
    badgeBg,
    title:
      customReq.status === "aceptada"
        ? "¡Tu salida de pesca fue confirmada!"
        : customReq.status === "reprogramada"
        ? "Te proponemos una nueva fecha"
        : "Respuesta a tu solicitud de salida",
    subtitle: `Solicitud ${customReq.requestCode}`,
    greeting: `Hola ${customReq.fullName},`,
    introParagraphs:
      customReq.status === "aceptada"
        ? [
            `El guía confirmó la disponibilidad para tu salida del día ${customReq.desiredDate}.`,
            "Podés escribirnos por WhatsApp con el botón de abajo para coordinar el horario y el punto de encuentro.",
          ]
        : customReq.status === "reprogramada"
        ? [
            `Revisamos el calendario para el ${customReq.desiredDate} y te proponemos salir el día ${
              customReq.alternativeDate || "a coordinar"
            }.`,
            "Confirmá con el guía por WhatsApp si te queda bien esta fecha.",
          ]
        : [
            `Gracias por escribirnos. Lamentablemente no tenemos disponibilidad para el día ${customReq.desiredDate}.`,
            "Si querés consultar por otra fecha, escribinos por WhatsApp.",
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
    rowsTitle: "Detalle de tu solicitud",
    rows: [
      { label: "Código", value: customReq.requestCode, highlight: true },
      { label: "Estado", value: statusText, highlight: true },
      { label: "Fecha solicitada", value: customReq.desiredDate },
      ...(customReq.alternativeDate
        ? [
            {
              label: "Nueva fecha propuesta",
              value: customReq.alternativeDate,
              highlight: true,
            },
          ]
        : []),
      { label: "Horario", value: customReq.preferredSchedule },
      {
        label: "Río / Destino",
        value: customReq.preferredRiver || "A coordinar con el guía",
      },
    ],
    ctaButton: waToGuide
      ? {
          label: "Coordinar por WhatsApp",
          url: waToGuide,
          bgColor: "#263D32",
        }
      : undefined,
    settings,
  });

  let clientRes: SingleSendResult = { sent: false, channel: "omitido" };
  if (clientEmail && clientEmail.includes("@")) {
    clientRes = await dispatchDirectEmail({
      to: clientEmail,
      replyTo: guideEmail,
      subject,
      html: built.html,
      text: built.text,
      settings,
    });
  }

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "respuesta_solicitud",
    subject,
    recipientGuide: guideEmail,
    recipientClient: clientEmail,
    guideSent: true,
    clientSent: clientRes.sent,
    channel: clientRes.channel,
    errorDetails: clientRes.error,
  };

  return {
    sent: clientRes.sent,
    guideSent: true,
    clientSent: clientRes.sent,
    channel: clientRes.channel,
    errorDetails: clientRes.error,
    logEntry,
  };
}

/**
 * 4. AVISO DE CANCELACIÓN DE SALIDA PROGRAMADA (se envía SOLO a los clientes anotados).
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
  const guideEmail = (
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();
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
      const clientSubject = `Aviso: Salida del ${departure.date} en ${departure.destination} cancelada — TRAUM`;
      const clientBuilt = buildTraumBrandedEmail({
        preheader: `La salida del ${departure.date} en ${departure.destination} fue cancelada.`,
        badgeText: "Aviso de Cancelación",
        badgeBg: "#7A2E2E",
        title: `Salida del ${departure.date} cancelada`,
        subtitle: `${departure.destination} · Código ${client.bookingCode}`,
        greeting: `Hola ${client.fullName},`,
        introParagraphs: [
          `Te informamos que la salida programada del día ${departure.date} en ${departure.destination} fue cancelada.`,
          "Comunicate con el guía por WhatsApp para reprogramar tu salida en otra fecha disponible.",
        ],
        highlightBox: {
          title: "Motivo",
          body:
            cancelReason ||
            "Condiciones climáticas o del río no aptas para navegar con seguridad.",
          bgColor: "#F9EBEB",
          borderColor: "#7A2E2E",
          textColor: "#5C1F1F",
        },
        rowsTitle: "Salida cancelada",
        rows: [
          { label: "Código", value: client.bookingCode, highlight: true },
          { label: "Fecha", value: departure.date },
          { label: "Río / Destino", value: departure.destination },
        ],
        ctaButton: waToGuide
          ? {
              label: "Reprogramar por WhatsApp",
              url: waToGuide,
              bgColor: "#263D32",
            }
          : undefined,
        settings,
      });

      const res = await dispatchDirectEmail({
        to: client.email,
        replyTo: guideEmail,
        subject: clientSubject,
        html: clientBuilt.html,
        text: clientBuilt.text,
        settings,
      });
      if (res.sent) anyClientSent = true;
      if (res.error) errors.push(res.error);
    }
  }

  const logEntry: EmailLogItem = {
    id: `em-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    createdAt: new Date().toISOString(),
    eventType: "cancelacion_salida",
    subject: `Cancelación salida ${departure.date} (${departure.destination})`,
    recipientGuide: guideEmail,
    recipientClient: activeClients.map((c) => c.email).join(", "),
    guideSent: true,
    clientSent: activeClients.length === 0 ? true : anyClientSent,
    channel: "directo_gmail",
    errorDetails: errors.length > 0 ? errors[0] : undefined,
  };

  return {
    notifiedCount: activeClients.length,
    recipients,
    logEntry,
  };
}

/**
 * 5. ENVIAR MAIL DE PRUEBA DIRECTO DESDE EL PANEL ADMIN
 */
export async function sendTestDiagnosticEmail(
  settings: SiteSettings,
  customRecipient?: string
): Promise<EmailDeliveryResult> {
  const targetEmail = (
    (customRecipient || "").trim() ||
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();

  const { senderEmail } = getDirectSmtpCredentials(settings);

  const subject = `Prueba de correo directo — TRAUM Fly Cast Patagonia`;

  const built = buildTraumBrandedEmail({
    preheader: "Prueba de funcionamiento de envío directo de correos de TRAUM.",
    badgeText: "Prueba Exitosa",
    badgeBg: "#263D32",
    title: "El correo de TRAUM está funcionando",
    subtitle: "Envío directo verificado",
    greeting: "Hola,",
    introParagraphs: [
      "Este correo confirma que el sistema de mails de TRAUM está conectado y enviando correos de forma directa.",
      "Cuando un cliente reserve un turno, vos recibirás únicamente el correo del turno en tu casilla del Panel Admin, y el cliente recibirá únicamente su confirmación en el correo que haya ingresado.",
    ],
    rowsTitle: "Configuración activa",
    rows: [
      {
        label: "Correo que envía (Emisor)",
        value: senderEmail || "Sin configurar",
        highlight: true,
      },
      {
        label: "Correo que recibe turnos (Guía)",
        value: settings.notificationEmail || settings.email,
        highlight: true,
      },
      { label: "Destinatario de esta prueba", value: targetEmail },
    ],
    settings,
  });

  const res = await dispatchDirectEmail({
    to: targetEmail,
    replyTo: settings.notificationEmail || senderEmail,
    subject,
    html: built.html,
    text: built.text,
    settings,
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
  const targetEmail = (
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();
  const subject = `Nueva Reserva ${inquiry.bookingCode} — ${inquiry.fullName}`;
  const built = buildTraumBrandedEmail({
    preheader: `Nueva reserva ${inquiry.bookingCode} de ${inquiry.fullName}`,
    badgeText: "Nuevo Turno",
    title: `Reserva ${inquiry.bookingCode} — ${inquiry.fullName}`,
    greeting: "Hola,",
    introParagraphs: [
      `Se registró una nueva reserva de ${inquiry.fullName} para ${inquiry.desiredDate}.`,
    ],
    rowsTitle: "Datos del turno",
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

  const res = await dispatchDirectEmail({
    to: targetEmail,
    replyTo: inquiry.email,
    subject,
    html: built.html,
    text: built.text,
    settings,
  });
  return { sent: res.sent, channel: res.channel };
}

export async function sendRegretNotificationEmail(
  regret: RegretRequestItem,
  settings: SiteSettings
): Promise<{ sent: boolean; channel: string }> {
  const targetEmail = (
    settings.notificationEmail ||
    settings.email ||
    "traumflyfishing9@gmail.com"
  ).trim();
  const subject = `Solicitud de Baja ${regret.regretCode} — ${regret.fullName}`;
  const built = buildTraumBrandedEmail({
    preheader: `Solicitud de baja ${regret.regretCode} (Ley 24.240)`,
    badgeText: "Botón de Arrepentimiento",
    badgeBg: "#7A2E2E",
    title: `Solicitud ${regret.regretCode}`,
    greeting: "Hola,",
    introParagraphs: [
      `Se recibió una solicitud de baja (Ley 24.240) de ${regret.fullName}.`,
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

  const res = await dispatchDirectEmail({
    to: targetEmail,
    replyTo: regret.email,
    subject,
    html: built.html,
    text: built.text,
    settings,
  });
  return { sent: res.sent, channel: res.channel };
}
