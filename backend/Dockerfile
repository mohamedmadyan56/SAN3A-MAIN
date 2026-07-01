# ============================================================
# Stage 1: deps — install only production dependencies
# ============================================================
FROM node:20-alpine AS deps

# Set working directory inside the container
WORKDIR /app

# Copy only package manifests first (layer-cache trick:
# npm ci only re-runs when these two files actually change)
COPY package.json package-lock.json ./

# Install ONLY production dependencies (no devDependencies)
# --frozen-lockfile guarantees reproducible installs
RUN npm ci --omit=dev

# ============================================================
# Stage 2: runner — the final, lean production image
# ============================================================
FROM node:20-alpine AS runner

# Install dumb-init: a minimal init process that properly
# forwards signals (SIGTERM, etc.) to Node.js so the container
# shuts down gracefully instead of being force-killed.
RUN apk add --no-cache dumb-init

# Create a non-root user & group for security.
# Running as root inside a container is a security risk.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Set working directory
WORKDIR /app

# Copy the node_modules built in the deps stage.
# --chown sets ownership at copy time — far faster than a separate
# RUN chown -R which would traverse all of node_modules (~729 s previously)
COPY --from=deps --chown=appuser:appgroup /app/node_modules ./node_modules

# Copy the application source code with correct ownership in one shot
COPY --chown=appuser:appgroup app.js server.js seed.js ./
COPY --chown=appuser:appgroup src/ ./src/

# Switch to the non-root user (ownership already set above)
USER appuser

# Tell Docker which port the app listens on (documentation only;
# does NOT actually publish the port — that is done at runtime)
EXPOSE 5000

# NODE_ENV=production disables stack traces in error responses
# and enables Express performance optimisations
ENV NODE_ENV=production

# Use dumb-init as PID 1 so signals are handled correctly,
# then start the server with "node" (NOT nodemon — dev-only tool)
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "server.js"]
