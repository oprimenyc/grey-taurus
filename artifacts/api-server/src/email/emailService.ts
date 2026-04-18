import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { db } from "@workspace/db";
import { sentEmailsTable } from "@workspace/db/schema";
import { checkEmailGuardrails, checkCooldown } from "./emailGuardrails.js";
import { logger } from "../lib/logger.js";

function createIonosTransport(): Transporter {
  return nodemailer.createTransport({
    host: process.env["IONOS_HOST"] || "smtp.ionos.com",
    port: Number(process.env["IONOS_PORT"] || 587),
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env["IONOS_USER"]!,
      pass: process.env["IONOS_PASSWORD"]!,
    },
  });
}

function createGmailTransport(): Transporter {
  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env["GMAIL_USER"]!,
      pass: process.env["GMAIL_APP_PASSWORD"]!,
    },
  });
}

export interface SendEmailParams {
  to: string;
  subject: string;
  text: string;
  html?: string;
  templateType?: string;
  opportunityRef?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string }> {
  const { to, subject, text, html, templateType, opportunityRef } = params;

  const guardrail = await checkEmailGuardrails({
    recipient: to,
    subject,
    body: text,
    opportunityTitle: opportunityRef,
  });

  if (!guardrail.allowed) {
    logger.warn({ to, reasons: guardrail.reasons }, "Email blocked by guardrails");
    return { success: false, error: `Guardrail: ${guardrail.reasons.join("; ")}` };
  }

  const cooldown = await checkCooldown();
  if (!cooldown.allowed) {
    logger.warn({ waitMs: cooldown.waitMs }, "Email blocked by cooldown");
    return { success: false, error: `Cooldown: wait ${Math.ceil(cooldown.waitMs / 1000)}s` };
  }

  const mailOptions = {
    from: `"Grey Taurus LLC" <${process.env["IONOS_USER"]}>`,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };

  let sent = false;

  try {
    const ionos = createIonosTransport();
    await ionos.sendMail(mailOptions);
    sent = true;
    logger.info({ to, subject }, "Email sent via IONOS");
  } catch (ionosErr) {
    logger.warn({ err: ionosErr }, "IONOS send failed — trying Gmail fallback");

    const gmailUser = process.env["GMAIL_USER"];
    const gmailPass = process.env["GMAIL_APP_PASSWORD"];

    if (gmailUser && gmailPass) {
      try {
        const gmail = createGmailTransport();
        await gmail.sendMail({
          ...mailOptions,
          from: `"Grey Taurus LLC" <${gmailUser}>`,
        });
        sent = true;
        logger.info({ to, subject }, "Email sent via Gmail fallback");
      } catch (gmailErr) {
        logger.error({ err: gmailErr }, "Gmail fallback also failed");
      }
    }
  }

  try {
    await db.insert(sentEmailsTable).values({
      recipient: to,
      subject,
      templateType: templateType || "manual",
      opportunityRef,
      status: sent ? "sent" : "failed",
    });
  } catch (dbErr) {
    logger.error({ err: dbErr }, "Failed to log sent email to DB");
  }

  return sent ? { success: true } : { success: false, error: "Both IONOS and Gmail failed" };
}

export async function sendHtmlBrief(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const { to, subject, html } = params;
  try {
    const ionos = createIonosTransport();
    await ionos.sendMail({
      from: `"Grey Taurus Platform" <${process.env["IONOS_USER"]}>`,
      to,
      subject,
      html,
      text: "Grey Taurus Daily Brief — see HTML version",
    });
    logger.info({ to, subject }, "Daily brief email sent");
  } catch (err) {
    logger.error({ err }, "Failed to send daily brief email");
  }
}
