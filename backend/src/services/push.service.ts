import prisma from "../config/db";
import webpush, { pushEnabled } from "../config/webPush";

export type PushSubscriptionInput = {
  endpoint: string;
  keys: { p256dh: string; auth: string };
};

export type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

export async function saveSubscription(
  userId: string,
  sub: PushSubscriptionInput,
) {
  return prisma.pushSubscription.upsert({
    where: { endpoint: sub.endpoint },
    update: { userId, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
    create: {
      userId,
      endpoint: sub.endpoint,
      p256dh: sub.keys.p256dh,
      auth: sub.keys.auth,
    },
  });
}

export async function deleteSubscription(endpoint: string) {
  await prisma.pushSubscription.deleteMany({ where: { endpoint } });
}

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<number> {
  if (!pushEnabled) return 0;

  const subs = await prisma.pushSubscription.findMany({ where: { userId } });
  let sent = 0;

  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        );
        sent += 1;
      } catch (err) {
        const statusCode = (err as { statusCode?: number }).statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await prisma.pushSubscription
            .delete({ where: { id: s.id } })
            .catch(() => {});
        } else {
          console.error("Push send failed:", statusCode ?? err);
        }
      }
    }),
  );

  return sent;
}
