# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:22-alpine AS deps
WORKDIR /app

RUN apk add --no-cache libc6-compat

COPY package.json package-lock.json ./
COPY prisma ./prisma/

RUN npm ci
RUN npx prisma generate

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json tsconfig.json ./
COPY prisma ./prisma/
COPY src ./src

RUN npm run build
RUN npm prune --production

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

RUN apk add --no-cache curl wget dumb-init

ENV NODE_ENV=production
ENV PORT=5000

# Create dedicated non-root user & group
RUN addgroup --system --gid 1001 auraic && \
    adduser --system --uid 1001 auraic

COPY --from=builder --chown=auraic:auraic /app/node_modules ./node_modules
COPY --from=builder --chown=auraic:auraic /app/dist ./dist
COPY --from=builder --chown=auraic:auraic /app/prisma ./prisma
COPY --from=builder --chown=auraic:auraic /app/src/controllers ./src/controllers
COPY --from=builder --chown=auraic:auraic /app/src/routes ./src/routes
COPY --from=builder --chown=auraic:auraic /app/src/lib ./src/lib
COPY --from=builder --chown=auraic:auraic /app/package.json ./package.json

RUN mkdir -p /app/media && chown -R auraic:auraic /app/media

USER auraic

EXPOSE 5000

HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/healthz || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/src/index.js"]
