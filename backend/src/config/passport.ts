import passport from "passport";
import prisma from "./db";
import {
  Strategy as GoogleStrategy,
  Profile,
  VerifyCallback,
} from "passport-google-oauth20";

export const initializePassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        // SERVER_URL is the backend's public origin (set it in production).
        // Falls back to localhost for local dev.
        callbackURL: `${process.env.SERVER_URL ?? "http://localhost:3000"}/auth/google/callback`,
      },
      async (
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: VerifyCallback,
      ) => {
        try {
          const user = await prisma.user.upsert({
            where: { googleId: profile.id },
            update: {
              name: profile.displayName,
              avatarUrl: profile.photos?.[0].value,
            },
            create: {
              googleId: profile.id,
              email: profile.emails?.[0].value || "",
              name: profile.displayName,
              avatarUrl: profile.photos?.[0].value,
            },
          });
          return done(null, user);
        } catch (error) {
          return done(error as Error, false);
        }
      },
    ),
  );
};
