import jwt from "jsonwebtoken";

export const generateTestToken = (userId: string, email: string) => {
  return jwt.sign({ userId, email }, process.env.JWT_ACCESS_SECRET!, {
    expiresIn: "15m",
  });
};