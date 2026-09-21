# Multi-stage build for the Next.js frontend.
# Requires next.config.ts to have `output: "standalone"` (see the updated
# next.config.ts delivered alongside this file) — without it, `next build`
# won't produce the .next/standalone folder this Dockerfile copies out, and
# the final image would need the full node_modules tree instead of the
# pruned standalone bundle.

# ---- deps: install once, cached unless package*.json changes ----
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# ---- builder: compile the production build ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# NEXT_PUBLIC_* values are baked in at build time (they run in the browser),
# so these build-args let docker-compose/CI pass real values per environment
# instead of relying on the .env.local checked into the repo.
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL}
ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID
ENV NEXT_PUBLIC_GOOGLE_CLIENT_ID=${NEXT_PUBLIC_GOOGLE_CLIENT_ID}
# ปลายทางของ API proxy ใน next.config.ts — ต้องเป็น build arg ไม่ใช่ runtime env
# เพราะ output:"standalone" จะ serialize ค่า rewrites ไว้ตั้งแต่ตอน build
ARG BACKEND_INTERNAL_URL=http://backend:8080
ENV BACKEND_INTERNAL_URL=${BACKEND_INTERNAL_URL}
RUN npm run build

# ---- runner: minimal final image, no build tools/source/node_modules ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
# .next/standalone contains a pruned node_modules + server.js — this is
# what makes the runner stage small; only reachable with output:"standalone"
# set in next.config.ts.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
