# ---- Build Stage ----
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies (including dev deps for building)
COPY package*.json ./
RUN npm ci

# Copy source code and build the Next.js app
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Create a non-root user for better security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]