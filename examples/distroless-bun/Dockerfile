# ==============================================================================
# Enterprise Hardened Dockerfile (Bun Alpine LTS Runtime)
# Optimized for high-throughput, minimal attack surface, non-root user
# ==============================================================================

# Stage 1: Builder (Bun Alpine LTS)
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy dependency manifests
COPY package.json bun.lock* ./

# Install dependencies with frozen lockfile
RUN bun install --frozen-lockfile

# Copy application source
COPY . .

# Build application bundle
RUN bun build ./src/index.ts --outdir ./dist --target node

# Stage 2: Production Distroless / Alpine Runner
FROM oven/bun:alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Use non-root bun user
USER bun

# Copy built artifacts and runtime dependencies
COPY --from=builder --chown=bun:bun /app/dist ./dist
COPY --from=builder --chown=bun:bun /app/node_modules ./node_modules
COPY --from=builder --chown=bun:bun /app/package.json ./package.json

EXPOSE 3000

# Start server directly
CMD ["bun", "run", "./dist/index.js"]
