import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db";
import { deleteUserData } from "../services/account.service";
import {
  saveSubscription,
  deleteSubscription,
  sendPushToUser,
} from "../services/push.service";

type RefreshTokenPayload = {
  userId: string;
};

const isProd = process.env.NODE_ENV === "production";

// Frontend and backend live on different domains in production, so the refresh
// cookie must be SameSite=None + Secure or the browser won't send it. Locally
// (http) it stays Lax so it works without HTTPS.
const refreshCookieBase = {
  httpOnly: true,
  secure: isProd,
  sameSite: (isProd ? "none" : "lax") as "none" | "lax",
  path: "/",
};

export const googleCallback = async (req: Request, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const user = req.user;

  const refreshToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: "7d" },
  );

  await prisma.refreshToken.create({
    data: {
      token: refreshToken,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  res.cookie("jwt", refreshToken, {
    ...refreshCookieBase,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};

export const getMe = async (req: Request, res: Response) => {
  return res.status(200).json({ user: req.user });
};

export const updatePreferences = async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const body = req.body ?? {};

  const data: {
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    inAppNotifications?: boolean;
    autoArchiveExpired?: boolean;
    theme?: string;
    defaultView?: string;
    onboarded?: boolean;
  } = {};

  const bools = [
    "emailNotifications",
    "pushNotifications",
    "inAppNotifications",
    "autoArchiveExpired",
    "onboarded",
  ] as const;
  for (const key of bools) {
    if (typeof body[key] === "boolean") data[key] = body[key];
  }
  if (body.theme === "dark" || body.theme === "light" || body.theme === "system") {
    data.theme = body.theme;
  }
  if (body.defaultView === "cards" || body.defaultView === "list") {
    data.defaultView = body.defaultView;
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: "No valid preferences provided" });
  }

  const user = await prisma.user.update({ where: { id: userId }, data });
  return res.status(200).json({ user });
};

export const deleteAccount = async (req: Request, res: Response) => {
  try {
    await deleteUserData(req.user!.id);
    res.clearCookie("jwt", refreshCookieBase);
    return res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    console.error("Account deletion failed:", error);
    return res.status(500).json({ message: "Failed to delete account" });
  }
};

export const subscribePush = async (req: Request, res: Response) => {
  const sub = req.body?.subscription ?? req.body;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return res.status(400).json({ message: "Invalid subscription" });
  }
  await saveSubscription(req.user!.id, sub);
  return res.status(201).json({ message: "Subscribed" });
};

export const unsubscribePush = async (req: Request, res: Response) => {
  const endpoint = req.body?.endpoint;
  if (typeof endpoint !== "string") {
    return res.status(400).json({ message: "Missing endpoint" });
  }
  await deleteSubscription(endpoint);
  return res.status(200).json({ message: "Unsubscribed" });
};

export const sendTestPush = async (req: Request, res: Response) => {
  const sent = await sendPushToUser(req.user!.id, {
    title: "Warranty Tracker",
    body: "Push notifications are working.",
    url: "/dashboard",
  });
  return res.status(200).json({ sent });
};

export const handleRefreshToken = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.status(401).json({ message: "No refresh token found" });
  }

  const refreshToken = cookies.jwt;

  const storedToken = await prisma.refreshToken.findUnique({
    where: { token: refreshToken },
  });

  if (!storedToken) {
    res.clearCookie("jwt", refreshCookieBase);
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    res.clearCookie("jwt", refreshCookieBase);

    return res.status(403).json({ message: "Refresh token expired" });
  }

  let decoded: RefreshTokenPayload;

  try {
    decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET!,
    ) as RefreshTokenPayload;
  } catch {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.clearCookie("jwt", refreshCookieBase);

    return res.status(403).json({ message: "Invalid refresh token" });
  }

  if (decoded.userId !== storedToken.userId) {
    return res
      .status(403)
      .json({ message: "Token mismatch - Access Forbidden" });
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email },
    process.env.JWT_ACCESS_SECRET!,
    { expiresIn: "15m" },
  );

  return res.status(200).json({ accessToken });
};

export const handleLogout = async (req: Request, res: Response) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    return res.sendStatus(204);
  }

  const refreshToken = cookies.jwt;
  try {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });

    res.clearCookie("jwt", refreshCookieBase);

    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
