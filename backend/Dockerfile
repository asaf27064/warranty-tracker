# Backend image: build TypeScript + Prisma client, then run a slim runtime.
# Prisma 7 uses the pg driver adapter, so there's no native query engine to ship.

FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# prisma.config.ts reads DATABASE_URL, so the Prisma CLI needs it set even for
# `generate` (which never connects). Use a throwaway value at build time; the
# real DATABASE_URL is injected at runtime for `migrate deploy`.
RUN DATABASE_URL="postgresql://user:pass@localhost:5432/db" npx prisma generate \
  && npm run build

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
# Copy installed deps (includes the prisma CLI for migrate deploy), build output,
# and the schema + migrations needed at startup.
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
# prisma.config.ts is needed at runtime so `migrate deploy` can resolve DATABASE_URL.
COPY --from=build /app/prisma.config.ts ./prisma.config.ts
EXPOSE 5000
# Apply pending migrations, then start the server.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
