import api from "../api/axios";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY as
  | string
  | undefined;

export const pushSupported = () =>
  typeof navigator !== "undefined" &&
  "serviceWorker" in navigator &&
  "PushManager" in window &&
  "Notification" in window;

const urlBase64ToUint8Array = (base64String: string) => {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) output[i] = raw.charCodeAt(i);
  return output;
};

export const registerServiceWorker = () => {
  if (!("serviceWorker" in navigator)) return null;
  return navigator.serviceWorker.register("/sw.js");
};

export const enablePush = async () => {
  if (!pushSupported()) throw new Error("unsupported");
  if (!VAPID_PUBLIC_KEY) throw new Error("missing-key");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("denied");

  const reg = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await api.post("/auth/push/subscribe", sub.toJSON());
};

export const sendTestPush = () => api.post("/auth/push/test");

export const disablePush = async () => {
  if (!("serviceWorker" in navigator)) return;
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api
    .post("/auth/push/unsubscribe", { endpoint: sub.endpoint })
    .catch(() => {});
  await sub.unsubscribe().catch(() => {});
};
