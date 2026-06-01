import { Router } from "express";
import nodemailer from "nodemailer";
import { randomInt } from "crypto";

const router = Router();

interface OtpSession {
  otp: string;
  email: string;
  expires: number;
}

const sessions = new Map<string, OtpSession>();

function generateSessionId(): string {
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

async function sendOtpEmail(to: string, otp: string): Promise<boolean> {
  const user = process.env.ADMIN_EMAIL;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    console.log(`\n📧 [DEV MODE - No Gmail configured]\nOTP for ${to}: ${otp}\n`);
    return true;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"Vexon Studios" <${user}>`,
      to,
      subject: "Your Vexon Studios Admin Access Code",
      html: `
        <div style="background:#0a0a0a;color:#fff;padding:48px 40px;font-family:Georgia,serif;max-width:500px;margin:0 auto;">
          <p style="color:#C9A84C;letter-spacing:0.3em;font-size:11px;text-transform:uppercase;margin-bottom:8px;">Vexon Studios</p>
          <h1 style="font-size:28px;font-weight:700;margin:0 0 32px;">Admin Access Code</h1>
          <p style="color:#aaa;margin-bottom:24px;">Use the code below to complete your sign-in. It expires in <strong style="color:#fff;">5 minutes</strong>.</p>
          <div style="background:#1a1a1a;border:1px solid #333;padding:32px;text-align:center;margin:32px 0;">
            <span style="font-family:monospace;font-size:52px;letter-spacing:20px;color:#C9A84C;font-weight:700;">${otp}</span>
          </div>
          <p style="color:#666;font-size:13px;">If you didn't request this, ignore this email. Your account is secure.</p>
          <hr style="border:none;border-top:1px solid #222;margin:32px 0;"/>
          <p style="color:#444;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;">Vexon Studios — Premium Creative Agency</p>
        </div>
      `,
    });
    return true;
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    console.log(`[FALLBACK] OTP for ${to}: ${otp}`);
    return false;
  }
}

router.post("/admin/send-otp", async (req, res) => {
  const { email } = req.body as { email?: string };
  const adminEmail = process.env.ADMIN_EMAIL || "vexonstudiosmain@gmail.com";

  if (!email || email.toLowerCase().trim() !== adminEmail.toLowerCase()) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Clean up expired sessions
  const now = Date.now();
  for (const [id, s] of sessions.entries()) {
    if (s.expires < now) sessions.delete(id);
  }

  const otp = String(randomInt(100000, 999999));
  const sessionId = generateSessionId();
  sessions.set(sessionId, { otp, email, expires: now + 5 * 60 * 1000 });

  await sendOtpEmail(email, otp);

  return res.json({ sessionId, message: "OTP sent to your email" });
});

router.post("/admin/verify-otp", (req, res) => {
  const { sessionId, otp } = req.body as { sessionId?: string; otp?: string };

  if (!sessionId || !otp) {
    return res.status(400).json({ error: "Missing sessionId or otp" });
  }

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  if (Date.now() > session.expires) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: "OTP expired. Please request a new one." });
  }

  if (session.otp !== otp.trim()) {
    return res.status(401).json({ error: "Incorrect code. Please try again." });
  }

  sessions.delete(sessionId);
  return res.json({ success: true, email: session.email });
});

export default router;
