# Stage 1: Build application
FROM node:20-slim AS builder

WORKDIR /app

# Copy package manifests and install dependencies
COPY package*.json ./
RUN npm ci

# Copy configuration and source files
COPY tsconfig*.json ./
COPY src/ ./src/

# Compile TypeScript
RUN npm run build

# Stage 2: Production runner
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install curl for container healthcheck
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Copy package manifests and install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

# Create non-root user permissions
RUN chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/api/v1/health || exit 1

CMD ["node", "dist/main.js"]
