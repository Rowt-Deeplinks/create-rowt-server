FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy everything
COPY . .

# Install dependencies and build
RUN npm ci && npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Set timezone to UTC for consistent timestamp handling
ENV TZ=UTC

# Install runtime dependencies
RUN apk add --no-cache dumb-init tzdata

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev && npm cache clean --force

# Copy built app from builder
COPY --from=builder /app/dist ./dist

# Copy static assets needed at runtime
COPY --from=builder /app/src/pages ./src/pages
COPY --from=builder /app/public ./public

# Use non-root user
USER node

# Expose port
EXPOSE 8080

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main"]
