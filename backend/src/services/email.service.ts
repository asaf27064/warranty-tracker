import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendReminderEmail = async (
  to: string,
  productName: string,
  daysLeft: number,
) => {
  const subject =
    daysLeft > 0
      ? `⚠️ ${productName} warranty expires in ${daysLeft} days`
      : `🔴 ${productName} warranty has expired`;

  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h2>${subject}</h2>
      <p>This is a reminder about your product <strong>${productName}</strong>.</p>
      ${daysLeft > 0
        ? `<p>Your warranty expires in <strong>${daysLeft} days</strong>. Make sure to check your coverage.</p>`
        : `<p>Your warranty has expired. Consider renewing or checking your options.</p>`
      }
      <p style="color: #888; font-size: 12px; margin-top: 20px;">
        — Warranty Tracker
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Warranty Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
};