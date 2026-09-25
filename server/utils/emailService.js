const nodemailer = require('nodemailer');

/**
 * Checks if the required SMTP settings are present in the environment.
 * @returns {boolean}
 */
const isEmailConfigured = () => {
  return Boolean(
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  );
};

/**
 * Returns a safe diagnostic summary of the email configuration without revealing secrets.
 * @returns {object}
 */
const getEmailDiagnostic = () => {
  const configured = isEmailConfigured();
  const missing = [];
  if (!process.env.SMTP_HOST) missing.push('SMTP_HOST');
  if (!process.env.SMTP_USER) missing.push('SMTP_USER');
  if (!process.env.SMTP_PASSWORD) missing.push('SMTP_PASSWORD');

  return {
    configured,
    host: process.env.SMTP_HOST || null,
    port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587,
    from: process.env.SMTP_FROM || 'Expense Tracker <noreply@expensetracker.com>',
    missingFields: missing
  };
};

/**
 * Prints a startup diagnostic indicating whether SMTP is configured.
 * Does not expose passwords or secrets.
 */
const logEmailStartupDiagnostic = () => {
  const diagnostic = getEmailDiagnostic();
  if (diagnostic.configured) {
    console.log(
      `Email Service: Configured (Host: ${diagnostic.host}, Port: ${diagnostic.port})`
    );
  } else {
    console.log(
      `Email Service: Not configured (missing: ${diagnostic.missingFields.join(', ')}). Reset emails will run in simulated mode.`
    );
  }
};

/**
 * Custom transporter holder (allows mock injection during automated testing).
 */
let customTransporter = null;

const setCustomTransporter = (transporter) => {
  customTransporter = transporter;
};

/**
 * Creates or retrieves the Nodemailer transporter.
 * Includes explicit connection/socket timeouts to prevent the forgot-password
 * flow from hanging indefinitely when the SMTP server is slow or unreachable.
 */
const getTransporter = () => {
  if (customTransporter) {
    return customTransporter;
  }

  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const isSecure = port === 465;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: isSecure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    },
    connectionTimeout: 10000, // 10s to establish TCP connection
    greetTimeout: 10000,      // 10s for SMTP greeting
    socketTimeout: 10000,     // 10s of inactivity before timeout
  });
};

/**
 * Sends a password reset email to the specified user.
 * 
 * @param {object} options
 * @param {string} options.to - Recipient email address
 * @param {string} [options.name] - User name
 * @param {string} options.resetUrl - Full password reset URL containing the raw token
 * @returns {Promise<{success: boolean, simulated?: boolean, messageId?: string}>}
 */
const sendPasswordResetEmail = async ({ to, name, resetUrl }) => {
  if (!to || !resetUrl) {
    throw new Error('Recipient email and reset URL are required');
  }

  const from = process.env.SMTP_FROM || 'Expense Tracker <noreply@expensetracker.com>';
  const greetingName = name ? name.trim() : 'there';

  const textContent = `Hello ${greetingName},

We received a request to reset the password for your Expense Tracker account.

You can reset your password by opening the following link in your browser:
${resetUrl}

This link is valid for 15 minutes.

If you did not request a password reset, please ignore this email. Your password will remain unchanged and your account is secure.

Best regards,
The Expense Tracker Team
`;

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #0f172a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="560" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #1e293b; border-radius: 16px; border: 1px solid #334155; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);">
          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #334155;">
              <h1 style="margin: 0; font-size: 22px; font-weight: 700; color: #38bdf8; letter-spacing: -0.5px;">
                Expense Tracker
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 14px; color: #94a3b8;">
                Password Reset Request
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px 0; font-size: 16px; line-height: 24px; color: #e2e8f0;">
                Hello <strong>${greetingName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 24px; color: #94a3b8;">
                We received a request to reset the password for your account. Click the button below to choose a new password. This link will expire in <strong>15 minutes</strong>.
              </p>
              <!-- Button -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin: 0 auto 28px auto;">
                <tr>
                  <td align="center" style="border-radius: 8px; background: linear-gradient(135deg, #0284c7 0%, #2563eb 100%);">
                    <a href="${resetUrl}" target="_blank" style="display: inline-block; padding: 14px 28px; font-size: 15px; font-weight: 600; color: #ffffff; text-decoration: none; border-radius: 8px;">
                      Reset Password
                    </a>
                  </td>
                </tr>
              </table>
              <p style="margin: 0 0 12px 0; font-size: 13px; line-height: 20px; color: #64748b;">
                If the button above does not work, copy and paste this link into your web browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 13px; line-height: 20px; word-break: break-all; color: #38bdf8;">
                <a href="${resetUrl}" style="color: #38bdf8; text-decoration: underline;">${resetUrl}</a>
              </p>
              <div style="border-top: 1px solid #334155; padding-top: 20px; margin-top: 20px;">
                <p style="margin: 0; font-size: 13px; line-height: 20px; color: #64748b;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged and your account is secure.
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #0f172a; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">
                Expense Tracker & Smart Savings Planner &bull; Secure Authentication
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  // If email is not configured (e.g. local dev without credentials), log non-sensitive message and simulate
  if (!isEmailConfigured() && !customTransporter) {
    console.log('[EmailService] SMTP not configured. Password reset email simulated.');
    return {
      success: true,
      simulated: true
    };
  }

  const transporter = getTransporter();

  const mailOptions = {
    from,
    to,
    subject: 'Reset Your Password - Expense Tracker',
    text: textContent,
    html: htmlContent
  };

  // Defence-in-depth: cap total send time at 15s even if transport timeouts don't fire
  const SEND_TIMEOUT_MS = 15000;
  const sendPromise = transporter.sendMail(mailOptions);
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Email send timed out after 15 seconds')), SEND_TIMEOUT_MS)
  );

  const info = await Promise.race([sendPromise, timeoutPromise]);
  return {
    success: true,
    messageId: info.messageId
  };
};

module.exports = {
  isEmailConfigured,
  getEmailDiagnostic,
  logEmailStartupDiagnostic,
  setCustomTransporter,
  sendPasswordResetEmail
};
