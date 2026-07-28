export const forgotPasswordTemplate = (name: any, resetUrl: any) => {
  return `
    <h2>Password Reset Request</h2>

    <p>Hello ${name},</p>

    <p>You requested a password reset.</p>

    <p>
      Click the link below to reset your password:
    </p>

    <a href="${resetUrl}">
      Reset Password
    </a>

    <p>This link expires in 10 minutes.</p>

    <p>If you didn't request this, please ignore this email.</p>
  `;
};

