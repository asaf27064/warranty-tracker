import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export type ReminderItem = {
  productName: string;
  productId: string;
  picture?: string | null;
  daysLeft: number;
  warrantyExpiry: Date | string;
  purchaseDate: Date | string;
};

const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-GB");

const statusFor = (daysLeft: number) =>
  daysLeft <= 0
    ? { color: "#dc2626", label: "Warranty expired" }
    : daysLeft === 0
      ? { color: "#d97706", label: "Expires today" }
      : daysLeft <= 7
        ? { color: "#d97706", label: `Expires in ${daysLeft} days` }
        : { color: "#059669", label: `Expires in ${daysLeft} days` };

const elapsedPct = (purchase: Date | string, expiry: Date | string) => {
  const total = new Date(expiry).getTime() - new Date(purchase).getTime();
  const used = Date.now() - new Date(purchase).getTime();
  return total > 0 ? Math.min(100, Math.max(0, Math.round((used / total) * 100))) : 100;
};

const itemRow = (it: ReminderItem, clientUrl: string) => {
  const status = statusFor(it.daysLeft);
  const pct = elapsedPct(it.purchaseDate, it.warrantyExpiry);
  const url = `${clientUrl}/product/${it.productId}`;
  const thumb = it.picture
    ? `<img src="${it.picture}" width="56" height="56" alt="" style="display:block;width:56px;height:56px;border-radius:8px;object-fit:cover;border:1px solid #e5e7eb;" />`
    : `<div style="width:56px;height:56px;border-radius:8px;background:#f3f4f6;border:1px solid #e5e7eb;"></div>`;

  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:10px;margin-bottom:12px;">
    <tr>
      <td width="56" valign="top" style="padding:14px;">${thumb}</td>
      <td valign="top" style="padding:14px 8px 14px 0;">
        <div style="font-size:15px;font-weight:600;color:#111827;">${it.productName}</div>
        <div style="font-size:13px;font-weight:600;color:${status.color};margin-top:3px;">${status.label}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">Warranty ends ${fmtDate(it.warrantyExpiry)}</div>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:9px;border-collapse:collapse;border-radius:3px;overflow:hidden;">
          <tr>
            <td style="height:6px;background:${status.color};width:${pct}%;font-size:0;line-height:0;">&nbsp;</td>
            <td style="height:6px;background:#e5e7eb;width:${100 - pct}%;font-size:0;line-height:0;">&nbsp;</td>
          </tr>
        </table>
      </td>
      <td width="64" valign="middle" align="right" style="padding:14px;">
        <a href="${url}" style="font-size:13px;font-weight:600;color:#059669;text-decoration:none;white-space:nowrap;">View &rsaquo;</a>
      </td>
    </tr>
  </table>`;
};

export const sendReminderDigestEmail = async (
  to: string,
  items: ReminderItem[],
) => {
  if (items.length === 0) return;
  const clientUrl = process.env.CLIENT_URL ?? "";
  const sorted = [...items].sort((a, b) => a.daysLeft - b.daysLeft);
  const multiple = sorted.length > 1;
  const top = sorted[0];

  const subject = multiple
    ? `${sorted.length} warranties need your attention`
    : top.daysLeft <= 0
      ? `Your ${top.productName} warranty has expired`
      : top.daysLeft === 0
        ? `Your ${top.productName} warranty expires today`
        : `Your ${top.productName} warranty expires in ${top.daysLeft} days`;

  const title = multiple
    ? `${sorted.length} warranties need your attention`
    : "Warranty reminder";
  const lead = multiple
    ? "Here are the products with warranties ending soon."
    : "A product in your tracker needs attention.";

  const html = `
  <div style="color-scheme:light;background:#f4f5f7;padding:24px 12px;font-family:-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
      <tr>
        <td style="background:#059669;padding:16px 24px;">
          <span style="color:#ffffff;font-size:17px;font-weight:600;">Warranty Tracker</span>
        </td>
      </tr>
      <tr>
        <td style="padding:24px 24px 4px 24px;">
          <h1 style="margin:0;font-size:19px;line-height:1.3;color:#111827;font-weight:600;">${title}</h1>
          <p style="margin:6px 0 18px 0;font-size:14px;line-height:1.6;color:#6b7280;">${lead}</p>
          ${sorted.map((it) => itemRow(it, clientUrl)).join("")}
          <a href="${clientUrl}/dashboard" style="display:inline-block;margin-top:6px;background:#059669;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 22px;border-radius:8px;">Open dashboard</a>
        </td>
      </tr>
      <tr>
        <td style="padding:28px 24px 24px 24px;">
          <hr style="border:none;border-top:1px solid #f3f4f6;margin:0 0 16px 0;" />
          <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">You're receiving this because you set reminders in Warranty Tracker. Reply to this email to stop these reminders.</p>
        </td>
      </tr>
    </table>
  </div>`;

  const text = [
    title,
    "",
    ...sorted.map((it) => {
      const s =
        it.daysLeft <= 0
          ? "warranty expired"
          : it.daysLeft === 0
            ? "expires today"
            : `expires in ${it.daysLeft} days`;
      return `- ${it.productName}: ${s} (ends ${fmtDate(it.warrantyExpiry)})`;
    }),
    "",
    `Open dashboard: ${clientUrl}/dashboard`,
    "",
    "You're receiving this because you set reminders in Warranty Tracker.",
  ].join("\n");

  await transporter.sendMail({
    from: `"Warranty Tracker" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
    html,
    headers: {
      "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
    },
  });
};
