const REQUIRED_ENV = [
  "DATABASE_URL",
  "CLIENT_URL",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "R2_REGION",
  "R2_ENDPOINT",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET",
  "PUBLIC_FILES_URL",
  "ANTHROPIC_API_KEY",
  "EMAIL_USER",
  "EMAIL_PASS",
] as const;

export function validateEnv() {
  const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }
}

