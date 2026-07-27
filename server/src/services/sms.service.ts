/**
 * SMS Service Layer for Vyas Finance Customer Portal
 * 
 * Supports 2 Modes:
 * 1. Development Mode (Default): If no SMS provider API keys are configured, 
 *    prints formatted OTP to backend console logs.
 * 2. Production Mode: Dispatches actual SMS via configured provider 
 *    (Twilio, Fast2SMS, MSG91, Textlocal) using environment variables.
 */

export class SmsService {
  /**
   * Send 6-digit OTP to a registered customer mobile number
   */
  static async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    const provider = (process.env.SMS_PROVIDER || "console").toLowerCase();
    const formattedPhone = phoneNumber.trim();

    // Development Mode / Console Fallback
    if (provider === "console" || !process.env.SMS_API_KEY) {
      console.log(`\n======================================================`);
      console.log(`[SMS SERVICE - DEV MODE]`);
      console.log(`To Mobile: ${formattedPhone}`);
      console.log(`OTP Code : ${otp}`);
      console.log(`Expiry   : 10 minutes`);
      console.log(`Status   : Console Logged (Configure SMS_API_KEY in .env for Prod)`);
      console.log(`======================================================\n`);
      return true;
    }

    try {
      if (provider === "fast2sms") {
        return await SmsService.sendViaFast2SMS(formattedPhone, otp);
      } else if (provider === "twilio") {
        return await SmsService.sendViaTwilio(formattedPhone, otp);
      } else if (provider === "msg91") {
        return await SmsService.sendViaMSG91(formattedPhone, otp);
      } else if (provider === "textlocal") {
        return await SmsService.sendViaTextlocal(formattedPhone, otp);
      } else {
        console.warn(`[SMS SERVICE] Unknown provider "${provider}". Falling back to console log.`);
        console.log(`[OTP FOR ${formattedPhone}]: ${otp}`);
        return true;
      }
    } catch (error) {
      console.error(`[SMS SERVICE ERROR] Failed to send SMS via ${provider}:`, error);
      // Fallback to console print on API error to avoid blocking dev testing
      console.log(`[FALLBACK OTP FOR ${formattedPhone}]: ${otp}`);
      return false;
    }
  }

  // --- Provider Implementations ---

  private static async sendViaFast2SMS(phone: string, otp: string): Promise<boolean> {
    const apiKey = process.env.SMS_API_KEY;
    const response = await fetch("https://www.fast2sms.com/dev/bulkV2", {
      method: "POST",
      headers: {
        "authorization": apiKey || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        variables_values: otp,
        route: "otp",
        numbers: phone,
      }),
    });
    const data = (await response.json()) as any;
    return data && data.return === true;
  }

  private static async sendViaTwilio(phone: string, otp: string): Promise<boolean> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromPhone = process.env.TWILIO_PHONE_NUMBER;

    if (!accountSid || !authToken || !fromPhone) {
      console.error("[SMS SERVICE] Twilio credentials missing in .env");
      return false;
    }

    const authHeader = "Basic " + Buffer.from(`${accountSid}:${authToken}`).toString("base64");
    const formattedTo = phone.startsWith("+") ? phone : `+91${phone}`;

    const body = new URLSearchParams({
      To: formattedTo,
      From: fromPhone,
      Body: `Your Vyas Finance activation OTP code is ${otp}. Valid for 10 minutes.`,
    });

    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
      method: "POST",
      headers: {
        "Authorization": authHeader,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const data = (await response.json()) as any;
    return response.ok && !!data?.sid;
  }

  private static async sendViaMSG91(phone: string, otp: string): Promise<boolean> {
    const authKey = process.env.MSG91_AUTH_KEY || process.env.SMS_API_KEY;
    const flowId = process.env.MSG91_FLOW_ID;

    const response = await fetch(`https://api.msg91.com/api/v5/otp?template_id=${flowId}&mobile=91${phone}&otp=${otp}`, {
      method: "POST",
      headers: {
        "authkey": authKey || "",
        "Content-Type": "application/json",
      },
    });

    const data = (await response.json()) as any;
    return data && data.type === "success";
  }

  private static async sendViaTextlocal(phone: string, otp: string): Promise<boolean> {
    const apiKey = process.env.SMS_API_KEY;
    const message = encodeURIComponent(`Your Vyas Finance OTP code is ${otp}. Do not share with anyone.`);
    
    const response = await fetch(`https://api.textlocal.in/send/?apiKey=${apiKey}&numbers=91${phone}&message=${message}&sender=VYASFN`);
    const data = (await response.json()) as any;
    return data && data.status === "success";
  }
}
