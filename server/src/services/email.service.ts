import nodemailer from "nodemailer";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailProviderStrategy {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

/**
 * Development & Production Gmail SMTP Provider via Nodemailer
 */
class GmailEmailProvider implements EmailProviderStrategy {
  private transporter: nodemailer.Transporter | null = null;

  private getTransporter() {
    if (!this.transporter) {
      const host = process.env.SMTP_HOST || "smtp.gmail.com";
      const port = parseInt(process.env.SMTP_PORT || "587", 10);
      const user = process.env.SMTP_USER;
      const pass = process.env.SMTP_PASS;

      if (!user || !pass) {
        console.warn("[EmailService] SMTP credentials not set. Falling back to console logging mode.");
        return null;
      }

      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
      });
    }
    return this.transporter;
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const transporter = this.getTransporter();
    const fromUser = process.env.SMTP_USER || "noreply@vyasfinance.com";
    const fromName = "Vyas Finance";

    if (!transporter) {
      console.log(`\n================ EMAIL DISPATCH (DEV SIMULATION) ================`);
      console.log(`To: ${options.to}`);
      console.log(`Subject: ${options.subject}`);
      console.log(`Body (HTML):\n${options.html}`);
      console.log(`=================================================================\n`);
      return true;
    }

    try {
      await transporter.sendMail({
        from: `"${fromName}" <${fromUser}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      });
      return true;
    } catch (error) {
      console.error("[GmailEmailProvider] Failed to send email:", error);
      // Fallback console log in case of SMTP failure during dev
      console.log(`\n[FALLBACK CONSOLE DISPATCH] To: ${options.to} | Subject: ${options.subject}`);
      return false;
    }
  }
}

/**
 * Extensible Provider Factory supporting Brevo, SendGrid, Amazon SES, Outlook
 */
class ModularEmailService {
  private getProvider(): EmailProviderStrategy {
    const provider = (process.env.EMAIL_PROVIDER || "gmail").toLowerCase();
    switch (provider) {
      case "gmail":
      default:
        return new GmailEmailProvider();
      // Future providers (Brevo, SendGrid, SES, Outlook) can be wired here seamlessly
    }
  }

  async sendOTPEmail(email: string, otp: string, customerName: string = "Customer"): Promise<boolean> {
    const subject = "Vyas Finance Account Verification";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #b8860b; margin: 0; font-size: 24px; font-weight: 700;">Vyas Finance</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Gold Loan Management System</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${customerName}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your One-Time Password (OTP) for account verification is:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 18px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This OTP is valid for <strong>10 minutes</strong>. Do not share this OTP with anyone for security reasons.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Regards,<br /><strong style="color: #64748b;">Vyas Finance Team</strong></p>
      </div>
    `;

    return this.getProvider().sendEmail({ to: email, subject, html });
  }

  async sendPasswordResetEmail(email: string, otp: string, customerName: string = "Customer"): Promise<boolean> {
    const subject = "Vyas Finance Password Reset OTP";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #b8860b; margin: 0; font-size: 24px; font-weight: 700;">Vyas Finance</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${customerName}</strong>,</p>
        <p style="color: #334155; font-size: 15px;">Your Password Reset OTP is:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 18px; text-align: center; border-radius: 8px; font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #1e293b; margin: 20px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px;">This OTP is valid for <strong>10 minutes</strong>. If you did not request a password reset, please contact your branch immediately.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Regards,<br /><strong style="color: #64748b;">Vyas Finance Team</strong></p>
      </div>
    `;

    return this.getProvider().sendEmail({ to: email, subject, html });
  }

  async sendWelcomeEmail(email: string, customerName: string): Promise<boolean> {
    const subject = "Welcome to Vyas Finance Customer Portal!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #b8860b;">Vyas Finance</h2>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your Vyas Finance customer portal account has been successfully activated.</p>
        <p>You can now log in using your registered email address or mobile number and view your active loans, payment history, and support options.</p>
        <br />
        <p>Regards,<br /><strong>Vyas Finance Team</strong></p>
      </div>
    `;

    return this.getProvider().sendEmail({ to: email, subject, html });
  }
}

export const EmailService = new ModularEmailService();
