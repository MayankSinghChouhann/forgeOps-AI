# ==========================================
# STAGE 1: Build Stage (Node.js 20 Alpine)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Step 1: Copy package files for dependency caching
COPY package.json package-lock.json ./
RUN npm ci

# Step 2: Copy source code and build React/Vite app
COPY . .
RUN npm run build

# ==========================================
# STAGE 2: Production Runtime (Nginx Alpine)
# ==========================================
FROM nginx:1.27-alpine AS runner

# Remove default Nginx configuration
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom Nginx configuration with reverse proxy and SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy production static assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:80/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
