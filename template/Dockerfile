FROM node:20-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Copy everything
COPY . .

# Install dependencies and build
RUN npm ci && npm run build

# Expose port
EXPOSE 8080

# Start
CMD ["node", "dist/main"]
