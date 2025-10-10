# ---- Build Stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies (including dev deps for building)
COPY package*.json ./
RUN npm ci

# Copy source code and build the Next.js app
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only the built assets and production dependencies
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

EXPOSE 3000
CMD ["node", "server.js"]