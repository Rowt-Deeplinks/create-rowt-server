FROM node:20-alpine

WORKDIR /app

# Copy package files and source code
COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies (skip postinstall for now)
RUN npm ci --ignore-scripts

# Copy rest of source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]
