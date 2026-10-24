# ==============================================================================
# Enterprise Distroless Multi-Stage Dockerfile (Node.js Alpine LTS + pnpm LTS)
# Optimized for minimal attack surface, zero CVEs, non-root user, and PCI-DSS
# ==============================================================================

# Stage 1: Builder (Node.js Alpine LTS)
FROM node:lts-alpine AS builder

WORKDIR /app

# Enable Corepack and pnpm LTS
RUN corepack enable && corepack prepare pnpm@9.15.4 --activate

# Copy dependency manifests first for maximum Docker layer caching
COPY package.json pnpm-lock.yaml ./

# Install all dependencies with frozen lockfile
RUN pnpm install --frozen-lockfile

# Copy source code and build
COPY . .
RUN pnpm run build

# Prune devDependencies to keep production runtime lean
RUN pnpm prune --prod

# ==============================================================================
# Stage 2: Distroless Production Runtime
# Contains ONLY Node.js binary and minimal glibc.
# NO package managers (apk/apt), NO shell (bash/sh), NO curl/wget.
# ==============================================================================
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner

WORKDIR /app

# Set production environment
ENV NODE_ENV=production
ENV PORT=3000

# Copy node_modules and compiled output from builder
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules
COPY --from=builder --chown=nonroot:nonroot /app/package.json ./package.json
COPY --from=builder --chown=nonroot:nonroot /app/dist ./dist

# Non-root user (nonroot user UID 65532 is built into distroless)
USER nonroot

EXPOSE 3000

# Entrypoint directly executes the compiled Node app
CMD ["dist/index.js"]
