# Build stage - Use Node 20 for Supabase compatibility
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom nginx config that listens on port 8080
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 8080 (as required by NodeOps)
EXPOSE 8080

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
