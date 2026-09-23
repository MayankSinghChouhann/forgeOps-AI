# ==========================================
# STAGE 1: Build Stage (Node.js 20 Alpine)
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

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

# Prepare runtime paths before dropping root privileges. The packaged Nginx
# configuration writes its PID under /run, which is not writable by nginx.
RUN sed -i 's|pid        /run/nginx.pid;|pid        /tmp/nginx.pid;|' /etc/nginx/nginx.conf \
  && chown -R nginx:nginx /var/cache/nginx /usr/share/nginx/html /etc/nginx/conf.d

USER nginx

# Expose the unprivileged HTTP port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/ || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
