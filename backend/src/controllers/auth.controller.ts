import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import prisma from "../config/db";

type RefreshTokenPayload = {
  userId: string;
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
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });

  return res.redirect(`${process.env.CLIENT_URL}/dashboard`);
};

export const getMe = async (req: Request, res: Response) => {
  return res.status(200).json({ user: req.user });
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
    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });
    return res.status(403).json({ message: "Invalid refresh token" });
  }

  if (storedToken.expiresAt < new Date()) {
    await prisma.refreshToken.delete({
      where: { token: refreshToken },
    });

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

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

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

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

    res.clearCookie("jwt", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
    });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
};
