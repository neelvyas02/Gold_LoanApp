import { Resend } from "resend";

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class ResendEmailService {
  private resendClient: Resend | null = null;

  private getClient(): Resend {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey || !apiKey.trim()) {
      throw new Error("[EmailService] Missing RESEND_API_KEY environment variable. Email dispatch requires a valid Resend API key.");
    }
    if (!this.resendClient) {
      this.resendClient = new Resend(apiKey.trim());
    }
    return this.resendClient;
  }

  private getFromAddress(): string {
    return process.env.EMAIL_FROM || "Vyas Finance <vyas.finance06@gmail.com>";
  }

  /**
   * Core email sending handler using Resend SDK
   */
  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const resend = this.getClient();
      const from = this.getFromAddress();

      console.log(`[Resend] Dispatching email to: ${options.to} | Subject: ${options.subject} | From: ${from}`);

      const { data, error } = await resend.emails.send({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>?/gm, ""),
      });

      if (error) {
        console.error(`[Resend Error] API returned error:`, error);
        return { success: false, error: error.message };
      }

      console.log(`[Resend Success] Email delivered. Resend Message ID: ${data?.id}`);
      return { success: true, messageId: data?.id };
    } catch (err: any) {
      console.error("[Resend Exception] Failed to dispatch email:", err.message || err);
      throw err;
    }
  }

  /**
   * Account Activation OTP Email
   */
  async sendOTPEmail(email: string, otp: string, customerName: string = "Customer"): Promise<{ success: boolean; messageId?: string }> {
    const subject = "Vyas Finance Account Verification";
    const textBody = `Hello ${customerName},\n\nYour One-Time Password (OTP) for Vyas Finance is:\n\n${otp}\n\nThis OTP is valid for 10 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nVyas Finance`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #b8860b; margin: 0; font-size: 26px; font-weight: 700;">Vyas Finance</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Account Verification</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${customerName}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your One-Time Password (OTP) for Vyas Finance is:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Do not share this OTP with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Regards,<br /><strong style="color: #64748b;">Vyas Finance</strong></p>
      </div>
    `;

    const result = await this.sendEmail({ to: email, subject, html, text: textBody });
    if (!result.success) {
      throw new Error(`Failed to deliver OTP email: ${result.error || "Unknown Resend error"}`);
    }
    return { success: true, messageId: result.messageId };
  }

  /**
   * Password Reset OTP Email
   */
  async sendPasswordResetEmail(email: string, otp: string, customerName: string = "Customer"): Promise<{ success: boolean; messageId?: string }> {
    const subject = "Vyas Finance Password Reset OTP";
    const textBody = `Hello ${customerName},\n\nYour Password Reset One-Time Password (OTP) for Vyas Finance is:\n\n${otp}\n\nThis OTP is valid for 10 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nVyas Finance`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #b8860b; margin: 0; font-size: 26px; font-weight: 700;">Vyas Finance</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Password Reset Request</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello <strong>${customerName}</strong>,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your Password Reset One-Time Password (OTP) for Vyas Finance is:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Do not share this OTP with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Regards,<br /><strong style="color: #64748b;">Vyas Finance</strong></p>
      </div>
    `;

    const result = await this.sendEmail({ to: email, subject, html, text: textBody });
    if (!result.success) {
      throw new Error(`Failed to deliver password reset OTP email: ${result.error || "Unknown Resend error"}`);
    }
    return { success: true, messageId: result.messageId };
  /**
   * Admin / Employee Password Reset OTP Email
   */
  async sendAdminPasswordResetEmail(email: string, otp: string): Promise<{ success: boolean; messageId?: string }> {
    const subject = "Vyas Finance Admin Password Reset OTP";
    const textBody = `Hello,\n\nYour One-Time Password (OTP) to reset your Vyas Finance account password is:\n\n${otp}\n\nThis OTP is valid for 10 minutes.\n\nDo not share this OTP with anyone.\n\nRegards,\nVyas Finance`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h2 style="color: #b8860b; margin: 0; font-size: 26px; font-weight: 700;">Vyas Finance</h2>
          <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Admin & Employee Account Recovery</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="color: #334155; font-size: 15px; margin-bottom: 12px;">Hello,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.5;">Your One-Time Password (OTP) to reset your Vyas Finance account password is:</p>
        <div style="background-color: #f8fafc; border: 2px dashed #cbd5e1; padding: 20px; text-align: center; border-radius: 10px; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1e293b; margin: 24px 0;">
          ${otp}
        </div>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">This OTP is valid for <strong>10 minutes</strong>.</p>
        <p style="color: #64748b; font-size: 13px; line-height: 1.5;">Do not share this OTP with anyone.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;" />
        <p style="color: #94a3b8; font-size: 12px; margin: 0; text-align: center;">Regards,<br /><strong style="color: #64748b;">Vyas Finance</strong></p>
      </div>
    `;

    const result = await this.sendEmail({ to: email, subject, html, text: textBody });
    if (!result.success) {
      throw new Error(`Failed to deliver admin password reset OTP email: ${result.error || "Unknown Resend error"}`);
    }
    return { success: true, messageId: result.messageId };
  }

  /**
   * Welcome Email after successful account activation
   */
  async sendWelcomeEmail(email: string, customerName: string): Promise<boolean> {
    const subject = "Welcome to Vyas Finance Customer Portal!";
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
        <h2 style="color: #b8860b;">Vyas Finance</h2>
        <p>Dear <strong>${customerName}</strong>,</p>
        <p>Your Vyas Finance customer portal account has been successfully activated.</p>
        <p>You can now log in using your registered email address or mobile number to view active loans, payment receipts, and customer support services.</p>
        <br />
        <p>Regards,<br /><strong>Vyas Finance Team</strong></p>
      </div>
    `;

    try {
      const res = await this.sendEmail({ to: email, subject, html });
      return res.success;
    } catch {
      return false;
    }
  }
}

export const EmailService = new ResendEmailService();
