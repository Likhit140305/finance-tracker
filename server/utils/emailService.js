const nodemailer = require('nodemailer');

// Reuse a single transporter across requests
let transporter = null;

function getTransporter() {
    if (transporter) return transporter;

    // Explicit SMTP config on port 587 (STARTTLS) — required for Render free tier
    // Render blocks outbound port 465 (SSL), but 587 works fine
    transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,          // STARTTLS (upgrades to TLS after connection)
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS   // Gmail App Password (16-char)
        },
        tls: {
            rejectUnauthorized: false   // Helps in cloud envs with strict TLS
        }
    });

    return transporter;
}

/**
 * Send an OTP email to a user.
 * @param {string} toEmail   - Recipient email address
 * @param {string} otp       - The 6-digit OTP code
 * @param {string} purpose   - 'login' | 'register'
 */
async function sendOtpEmail(toEmail, otp, purpose = 'login') {
    const subject = purpose === 'register'
        ? '🎉 Verify your FinanceTracker account'
        : '🔐 Your FinanceTracker login OTP';

    const actionLabel = purpose === 'register'
        ? 'complete your registration'
        : 'sign in to your account';

    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1">
    </head>
    <body style="margin:0;padding:0;background:#0f172a;font-family:'Segoe UI',Arial,sans-serif;">
      <div style="max-width:480px;margin:40px auto;background:#1e293b;border-radius:16px;overflow:hidden;border:1px solid #334155;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#3b82f6,#6366f1);padding:32px 40px;text-align:center;">
          <div style="display:inline-block;background:rgba(255,255,255,0.15);border-radius:12px;padding:12px 16px;margin-bottom:16px;">
            <span style="font-size:28px;">💰</span>
          </div>
          <h1 style="margin:0;color:#fff;font-size:24px;font-weight:700;letter-spacing:-0.5px;">FinanceTracker</h1>
          <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">Personal Finance Management</p>
        </div>

        <!-- Body -->
        <div style="padding:40px;">
          <p style="color:#94a3b8;font-size:15px;margin:0 0 8px;">Hello,</p>
          <p style="color:#e2e8f0;font-size:15px;margin:0 0 32px;line-height:1.6;">
            Use the OTP below to <strong style="color:#fff;">${actionLabel}</strong>. 
            This code is valid for <strong style="color:#f59e0b;">10 minutes</strong> and can only be used once.
          </p>

          <!-- OTP Box -->
          <div style="background:#0f172a;border:2px solid #3b82f6;border-radius:12px;padding:28px;text-align:center;margin-bottom:32px;">
            <p style="color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin:0 0 12px;">Your One-Time Password</p>
            <div style="font-size:42px;font-weight:800;letter-spacing:12px;color:#3b82f6;font-family:monospace;">${otp}</div>
          </div>

          <div style="background:#1e3a5f;border-left:4px solid #3b82f6;border-radius:4px;padding:16px;margin-bottom:24px;">
            <p style="color:#93c5fd;font-size:13px;margin:0;line-height:1.5;">
              ⚠️ <strong>Never share this code with anyone.</strong> FinanceTracker will never ask for your OTP via phone or chat.
            </p>
          </div>

          <p style="color:#475569;font-size:13px;margin:0;line-height:1.6;">
            If you didn't request this, you can safely ignore this email. Your account remains secure.
          </p>
        </div>

        <!-- Footer -->
        <div style="padding:24px 40px;border-top:1px solid #334155;text-align:center;">
          <p style="color:#475569;font-size:12px;margin:0;">
            © ${new Date().getFullYear()} FinanceTracker &nbsp;|&nbsp; This is an automated message
          </p>
        </div>
      </div>
    </body>
    </html>
    `;

    await getTransporter().sendMail({
        from: `"FinanceTracker" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject,
        html
    });
}

module.exports = { sendOtpEmail };
